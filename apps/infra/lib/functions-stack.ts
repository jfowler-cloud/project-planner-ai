/**
 * FunctionsStack — Lambda functions with PythonLayerVersion, CloudWatch alarms.
 */
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha'
import { Construct } from 'constructs'
import * as path from 'path'

interface FunctionsStackProps extends cdk.StackProps {
  deploymentTier: string
  modelId: string
  plansTable: dynamodb.Table
  alarmTopic: sns.Topic
}

export class FunctionsStack extends cdk.Stack {
  readonly generatePlanFn: lambda.Function
  readonly reviewStepFn: lambda.Function
  readonly finalizePlanFn: lambda.Function
  readonly getExecutionFn: lambda.Function

  constructor(scope: Construct, id: string, props: FunctionsStackProps) {
    super(scope, id, props)

    const { deploymentTier, modelId, plansTable, alarmTopic } = props

    // ── Layers ───────────────────────────────────────────────────────────────
    const sharedLayer = new PythonLayerVersion(this, 'SharedLayer', {
      entry: path.join(__dirname, '..', 'layers', 'shared'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      description: 'Project Planner shared utilities — pydantic-settings, powertools, xray',
    })

    const agentsLayer = new PythonLayerVersion(this, 'AgentsLayer', {
      entry: path.join(__dirname, '..', 'layers', 'agents'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      description: 'Project Planner strands-agents core',
    })

    // ── IAM ──────────────────────────────────────────────────────────────────
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/*',
        `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
      ],
    })

    const sfnPolicy = new iam.PolicyStatement({
      actions: ['states:DescribeExecution'],
      resources: ['*'],
    })

    const commonEnv = {
      DEPLOYMENT_TIER: deploymentTier,
      BEDROCK_MODEL_ID: modelId,
      PLANNER_PLANS_TABLE: plansTable.tableName,
    }

    // ── Lambda Functions ─────────────────────────────────────────────────────
    const fnProps = (name: string, layers: lambda.ILayerVersion[]): lambda.FunctionProps => ({
      functionName: `project-planner-${name}`,
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.ARM_64,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'functions', name)),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: commonEnv,
      tracing: lambda.Tracing.ACTIVE,
      layers,
    })

    const allAgentLayers = [sharedLayer, agentsLayer]

    this.generatePlanFn = new lambda.Function(this, 'GeneratePlanFn', fnProps('generate_plan', allAgentLayers))
    this.reviewStepFn = new lambda.Function(this, 'ReviewStepFn', fnProps('review_step', allAgentLayers))
    this.finalizePlanFn = new lambda.Function(this, 'FinalizePlanFn', fnProps('finalize_plan', allAgentLayers))

    this.getExecutionFn = new lambda.Function(this, 'GetExecutionFn', {
      ...fnProps('get_execution', [sharedLayer]),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    })
    this.getExecutionFn.addToRolePolicy(sfnPolicy)

    for (const fn of [this.generatePlanFn, this.reviewStepFn, this.finalizePlanFn]) {
      fn.addToRolePolicy(bedrockPolicy)
    }
    plansTable.grantWriteData(this.finalizePlanFn)

    // ── CloudWatch Alarms ────────────────────────────────────────────────────
    for (const fn of [this.generatePlanFn, this.reviewStepFn, this.finalizePlanFn, this.getExecutionFn]) {
      fn.metricErrors({ period: cdk.Duration.minutes(5) })
        .createAlarm(this, `${fn.node.id}ErrorAlarm`, {
          alarmName: `ProjectPlanner-${fn.node.id}-Errors`,
          threshold: 1, evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        })
        .addAlarmAction(new cwActions.SnsAction(alarmTopic))

      fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(5) })
        .createAlarm(this, `${fn.node.id}DurationAlarm`, {
          alarmName: `ProjectPlanner-${fn.node.id}-P99Duration`,
          threshold: fn.timeout!.toMilliseconds() * 0.8,
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        })
        .addAlarmAction(new cwActions.SnsAction(alarmTopic))
    }
  }
}
