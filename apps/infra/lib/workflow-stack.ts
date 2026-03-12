/**
 * WorkflowStack — Step Functions workflow + Cognito identity pool role bindings.
 *
 * Supports three modes via input flags:
 *   { generateOnly: true }  → GeneratePlan only, skip reviews
 *   { reviewOnly: true }    → Reviews only on a supplied architecture
 *   (neither)               → Full flow: generate → reviews → finalize
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

function reviewItemParams() {
  return REVIEW_CATEGORIES.map((cat, i) => ({
    category: cat,
    iteration: i + 1,
    'questionnaire.$': '$.questionnaire',
    'recommended.$': '$.recommended',
    'review_findings.$': '$.review_findings',
  }))
}

interface WorkflowStackProps extends cdk.StackProps {
  db: DatabaseStack
  fns: FunctionsStack
}

export class WorkflowStack extends cdk.Stack {
  readonly stateMachineArn: string

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props)

    const { db, fns } = props

    // ── Generate path ────────────────────────────────────────────────────────
    const generatePlan = new tasks.LambdaInvoke(this, 'GeneratePlan', {
      lambdaFunction: fns.generatePlanFn, outputPath: '$.Payload',
    })

    const formatGenerateOutput = new sfn.Pass(this, 'FormatGenerateOutput', {
      parameters: {
        'plan_id.$': '$.plan_id',
        'questionnaire.$': '$.questionnaire',
        'recommended.$': '$.recommended',
        'alternatives.$': '$.alternatives',
        'review_findings.$': '$.review_findings',
        status: 'COMPLETED',
      },
    })

    // Full-flow review chain (after generate)
    const fullPrepareReviews = new sfn.Pass(this, 'PrepareReviews', {
      parameters: {
        'plan_id.$': '$.plan_id',
        'questionnaire.$': '$.questionnaire',
        'recommended.$': '$.recommended',
        'alternatives.$': '$.alternatives',
        'review_findings.$': '$.review_findings',
        reviewItems: reviewItemParams(),
      },
    })

    const fullReviewMap = new sfn.Map(this, 'ReviewCategories', {
      itemsPath: sfn.JsonPath.stringAt('$.reviewItems'),
      maxConcurrency: 3,
      resultPath: '$.reviewResults',
    })
    fullReviewMap.itemProcessor(
      new tasks.LambdaInvoke(this, 'ReviewStep', { lambdaFunction: fns.reviewStepFn, outputPath: '$.Payload' }),
    )

    const fullFinalize = new tasks.LambdaInvoke(this, 'FinalizePlan', {
      lambdaFunction: fns.finalizePlanFn, outputPath: '$.Payload',
    })

    const fullReviewChain = fullPrepareReviews.next(fullReviewMap).next(fullFinalize)

    const isGenerateOnly = new sfn.Choice(this, 'IsGenerateOnly')
      .when(sfn.Condition.and(
        sfn.Condition.isPresent('$.generateOnly'),
        sfn.Condition.booleanEquals('$.generateOnly', true),
      ), formatGenerateOutput)
      .otherwise(fullReviewChain)

    const generatePath = generatePlan.next(isGenerateOnly)

    // ── Review-only path ─────────────────────────────────────────────────────
    const prepareReviewOnlyInput = new sfn.Pass(this, 'PrepareReviewOnlyInput', {
      parameters: {
        'plan_id.$': '$.plan_id',
        'questionnaire.$': '$.questionnaire',
        'recommended.$': '$.recommended',
        alternatives: [],
        review_findings: [],
      },
    })

    const prepareReviewOnlyItems = new sfn.Pass(this, 'PrepareReviewOnlyItems', {
      parameters: {
        'plan_id.$': '$.plan_id',
        'questionnaire.$': '$.questionnaire',
        'recommended.$': '$.recommended',
        'alternatives.$': '$.alternatives',
        'review_findings.$': '$.review_findings',
        reviewItems: reviewItemParams(),
      },
    })

    const reviewOnlyMap = new sfn.Map(this, 'ReviewOnlyCategories', {
      itemsPath: sfn.JsonPath.stringAt('$.reviewItems'),
      maxConcurrency: 3,
      resultPath: '$.reviewResults',
    })
    reviewOnlyMap.itemProcessor(
      new tasks.LambdaInvoke(this, 'ReviewOnlyStep', { lambdaFunction: fns.reviewStepFn, outputPath: '$.Payload' }),
    )

    const reviewOnlyFinalize = new tasks.LambdaInvoke(this, 'ReviewOnlyFinalize', {
      lambdaFunction: fns.finalizePlanFn, outputPath: '$.Payload',
    })

    const reviewOnlyPath = prepareReviewOnlyInput.next(prepareReviewOnlyItems).next(reviewOnlyMap).next(reviewOnlyFinalize)

    // ── Top-level routing ────────────────────────────────────────────────────
    const router = new sfn.Choice(this, 'RouteMode')
      .when(sfn.Condition.and(
        sfn.Condition.isPresent('$.reviewOnly'),
        sfn.Condition.booleanEquals('$.reviewOnly', true),
      ), reviewOnlyPath)
      .otherwise(generatePath)

    const stateMachine = new sfn.StateMachine(this, 'PlannerWorkflow', {
      stateMachineName: 'ProjectPlanner-Workflow',
      definitionBody: sfn.DefinitionBody.fromChainable(router),
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
    db.handoffTable.grantWriteData(userRole)

    new cognito.CfnIdentityPoolRoleAttachment(this, 'RoleAttachment', {
      identityPoolId: db.identityPool.ref,
      roles: { authenticated: userRole.roleArn },
    })

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'WorkflowArn', { value: stateMachine.stateMachineArn })
  }
}
