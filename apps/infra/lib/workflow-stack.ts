/**
 * WorkflowStack — Step Functions workflow + Cognito identity pool role bindings.
 */
import * as cdk from 'aws-cdk-lib'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import { Construct } from 'constructs'
import { FunctionsStack } from './functions-stack'
import { DatabaseStack } from './database-stack'

const REVIEW_CATEGORIES = [
  'security', 'scalability', 'cost_optimization', 'reliability',
  'performance', 'maintainability', 'developer_experience',
  'compliance', 'observability', 'disaster_recovery',
]

interface WorkflowStackProps extends cdk.StackProps {
  db: DatabaseStack
  fns: FunctionsStack
}

export class WorkflowStack extends cdk.Stack {
  readonly stateMachineArn: string

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props)

    const { db, fns } = props

    // ── Step Functions tasks ─────────────────────────────────────────────────
    const generatePlan = new tasks.LambdaInvoke(this, 'GeneratePlan', { lambdaFunction: fns.generatePlanFn, outputPath: '$.Payload' })

    const reviewMap = new sfn.Map(this, 'ReviewCategories', {
      itemsPath: sfn.JsonPath.stringAt('$.reviewItems'),
      maxConcurrency: 3,
      resultPath: '$.reviewResults',
    })

    const reviewStep = new tasks.LambdaInvoke(this, 'ReviewStep', { lambdaFunction: fns.reviewStepFn, outputPath: '$.Payload' })
    reviewMap.itemProcessor(reviewStep)

    const finalizePlan = new tasks.LambdaInvoke(this, 'FinalizePlan', { lambdaFunction: fns.finalizePlanFn, outputPath: '$.Payload' })

    const prepareReviews = new sfn.Pass(this, 'PrepareReviews', {
      parameters: {
        'plan_id.$': '$.plan_id',
        'questionnaire.$': '$.questionnaire',
        'recommended.$': '$.recommended',
        'alternatives.$': '$.alternatives',
        'review_findings.$': '$.review_findings',
        reviewItems: REVIEW_CATEGORIES.map((cat, i) => ({
          category: cat,
          iteration: i + 1,
          'questionnaire.$': '$.questionnaire',
          'recommended.$': '$.recommended',
          'review_findings.$': '$.review_findings',
        })),
      },
    })

    const definition = generatePlan.next(prepareReviews).next(reviewMap).next(finalizePlan)

    const stateMachine = new sfn.StateMachine(this, 'PlannerWorkflow', {
      stateMachineName: 'ProjectPlanner-Workflow',
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(30),
    })

    this.stateMachineArn = stateMachine.stateMachineArn

    // SFN failure alarm
    stateMachine.metricFailed({ period: cdk.Duration.minutes(5) })
      .createAlarm(this, 'WorkflowFailedAlarm', {
        alarmName: 'ProjectPlanner-Workflow-ExecutionFailed',
        threshold: 0,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      .addAlarmAction(new cwActions.SnsAction(db.alarmTopic))

    // ── Cognito Identity Pool Roles ──────────────────────────────────────────
    const userRole = new iam.Role(this, 'UserRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': { 'cognito-identity.amazonaws.com:aud': db.identityPool.ref },
        'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
      }, 'sts:AssumeRoleWithWebIdentity'),
    })

    fns.getExecutionFn.grantInvoke(userRole)
    stateMachine.grantStartExecution(userRole)

    new cognito.CfnIdentityPoolRoleAttachment(this, 'RoleAttachment', {
      identityPoolId: db.identityPool.ref,
      roles: { authenticated: userRole.roleArn },
    })

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'WorkflowArn', { value: stateMachine.stateMachineArn })
  }
}
