import * as cdk from 'aws-cdk-lib'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import { Construct } from 'constructs'
import * as path from 'path'

interface WorkflowStackProps extends cdk.StackProps {
  deploymentTier: 'testing' | 'optimized' | 'premium'
}

const MODEL_MAP = {
  testing:   'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  optimized: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  premium:   'us.anthropic.claude-opus-4-5-20251101-v1:0',
}

const REVIEW_CATEGORIES = [
  'security', 'scalability', 'cost_optimization', 'reliability',
  'performance', 'maintainability', 'developer_experience',
  'compliance', 'observability', 'disaster_recovery',
]

export class WorkflowStack extends cdk.Stack {
  public readonly stateMachineArn: string
  public readonly plansTable: dynamodb.Table

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props)

    const { deploymentTier } = props
    const modelId = MODEL_MAP[deploymentTier]

    // ── DynamoDB ──────────────────────────────────────────────────────────────
    this.plansTable = new dynamodb.Table(this, 'PlansTable', {
      tableName: 'project-planner-plans',
      partitionKey: { name: 'planId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:${this.region}::foundation-model/*`],
    })

    const commonEnv = {
      DEPLOYMENT_TIER: deploymentTier,
      BEDROCK_MODEL_ID: modelId,
      PLANNER_PLANS_TABLE: this.plansTable.tableName,
    }

    const fnProps = (name: string): lambda.FunctionProps => ({
      functionName: `project-planner-${name}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'functions', name)),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: commonEnv,
      tracing: lambda.Tracing.ACTIVE,
    })

    const generatePlanFn  = new lambda.Function(this, 'GeneratePlanFn',  fnProps('generate_plan'))
    const reviewStepFn    = new lambda.Function(this, 'ReviewStepFn',    fnProps('review_step'))
    const finalizePlanFn  = new lambda.Function(this, 'FinalizePlanFn',  fnProps('finalize_plan'))

    for (const fn of [generatePlanFn, reviewStepFn, finalizePlanFn]) {
      fn.addToRolePolicy(bedrockPolicy)
    }
    this.plansTable.grantWriteData(finalizePlanFn)

    // ── Step Functions tasks ──────────────────────────────────────────────────

    const generatePlan = new tasks.LambdaInvoke(this, 'GeneratePlan', {
      lambdaFunction: generatePlanFn,
      outputPath: '$.Payload',
    })

    // Fan-out: run all 10 review categories in parallel via Map state
    // Each item: {category, iteration, questionnaire, recommended, review_findings}
    const reviewMap = new sfn.Map(this, 'ReviewCategories', {
      // Build items array from static list — injected via Parameters
      itemsPath: sfn.JsonPath.stringAt('$.reviewItems'),
      maxConcurrency: 3,  // Bedrock rate limit friendly
      resultPath: '$.reviewResults',
    })

    const reviewStep = new tasks.LambdaInvoke(this, 'ReviewStep', {
      lambdaFunction: reviewStepFn,
      outputPath: '$.Payload',
    })
    reviewMap.itemProcessor(reviewStep)

    const finalizePlan = new tasks.LambdaInvoke(this, 'FinalizePlan', {
      lambdaFunction: finalizePlanFn,
      outputPath: '$.Payload',
    })

    // Inject reviewItems before the Map state
    const prepareReviews = new sfn.Pass(this, 'PrepareReviews', {
      parameters: {
        'plan_id.$':        '$.plan_id',
        'questionnaire.$':  '$.questionnaire',
        'recommended.$':    '$.recommended',
        'alternatives.$':   '$.alternatives',
        'review_findings.$': '$.review_findings',
        reviewItems: REVIEW_CATEGORIES.map((cat, i) => ({
          category: cat,
          iteration: i + 1,
          'questionnaire.$': '$.questionnaire',
          'recommended.$':   '$.recommended',
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
    new cdk.CfnOutput(this, 'WorkflowArn', { value: stateMachine.stateMachineArn })
    new cdk.CfnOutput(this, 'PlansTableName', { value: this.plansTable.tableName })

    // ── CloudWatch Alarms ──────────────────────────────────────────────────
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: 'ProjectPlanner-Alarms',
    })

    const allFns = [generatePlanFn, reviewStepFn, finalizePlanFn]
    for (const fn of allFns) {
      fn.metricErrors({ period: cdk.Duration.minutes(5) })
        .createAlarm(this, `${fn.node.id}ErrorAlarm`, {
          alarmName: `ProjectPlanner-${fn.node.id}-Errors`,
          threshold: 1,
          evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        })
        .addAlarmAction(new cwActions.SnsAction(alarmTopic))

      fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(5) })
        .createAlarm(this, `${fn.node.id}DurationAlarm`, {
          alarmName: `ProjectPlanner-${fn.node.id}-P99Duration`,
          threshold: 240_000,
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        })
        .addAlarmAction(new cwActions.SnsAction(alarmTopic))
    }

    // DynamoDB throttle alarm
    this.plansTable.metric('SystemErrors', { period: cdk.Duration.minutes(1) })
      .createAlarm(this, 'PlansTableThrottleAlarm', {
        alarmName: 'ProjectPlanner-DynamoDB-Plans-Throttles',
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      .addAlarmAction(new cwActions.SnsAction(alarmTopic))

    // SFN execution failure alarm
    stateMachine.metricFailed({ period: cdk.Duration.minutes(5) })
      .createAlarm(this, 'WorkflowFailedAlarm', {
        alarmName: 'ProjectPlanner-Workflow-ExecutionFailed',
        threshold: 0,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      .addAlarmAction(new cwActions.SnsAction(alarmTopic))

    // ── Cost Budget ($25/mo) ───────────────────────────────────────────────
    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: 'project-planner-ai-monthly',
        budgetLimit: { amount: 25, unit: 'USD' },
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        costFilters: { TagKeyValue: ['user:Project$project-planner-ai'] },
      },
      notificationsWithSubscribers: [{
        notification: {
          comparisonOperator: 'GREATER_THAN',
          notificationType: 'ACTUAL',
          threshold: 80,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: [{ address: alarmTopic.topicArn, subscriptionType: 'SNS' }],
      }],
    })
  }
}
