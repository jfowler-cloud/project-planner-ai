import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WorkflowStack } from '../lib/workflow-stack';

describe('WorkflowStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App({ context: { 'aws:cdk:bundling-stacks': [] } });
    new WorkflowStack(app, 'TestWorkflow', { deploymentTier: 'testing' });
    template = Template.fromStack(app.node.findChild('TestWorkflow') as cdk.Stack);
  });

  test('snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  // ── DynamoDB ──────────────────────────────────────────────────────────────

  test('creates PlansTable with PAY_PER_REQUEST billing', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'project-planner-plans',
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });
  });

  // ── Lambda Functions ──────────────────────────────────────────────────────

  test('creates 3 Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 3);
  });

  test('all Lambda functions use Python 3.12', () => {
    const fns = template.findResources('AWS::Lambda::Function');
    for (const fn of Object.values(fns)) {
      expect((fn as any).Properties.Runtime).toBe('python3.12');
    }
  });

  test('all Lambda functions have X-Ray tracing', () => {
    const fns = template.findResources('AWS::Lambda::Function');
    for (const fn of Object.values(fns)) {
      expect((fn as any).Properties.TracingConfig).toEqual({ Mode: 'Active' });
    }
  });

  test('Lambda functions have DEPLOYMENT_TIER env var set to testing', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: { Variables: Match.objectLike({ DEPLOYMENT_TIER: 'testing' }) },
    });
  });

  // ── Step Functions ────────────────────────────────────────────────────────

  test('creates state machine with correct name', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'ProjectPlanner-Workflow',
    });
  });

  // ── IAM ───────────────────────────────────────────────────────────────────

  test('grants Bedrock InvokeModel to Lambda roles', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'bedrock:InvokeModel',
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  test('grants DynamoDB write access to finalize_plan function', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['dynamodb:PutItem']),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  // ── Monitoring ────────────────────────────────────────────────────────────

  test('creates SNS alarm topic', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'ProjectPlanner-Alarms',
    });
  });

  test('creates Lambda error alarms for all functions', () => {
    const alarms = template.findResources('AWS::CloudWatch::Alarm', {
      Properties: { AlarmName: Match.stringLikeRegexp('ProjectPlanner-.*-Errors') },
    });
    expect(Object.keys(alarms).length).toBe(3);
  });

  test('creates DynamoDB throttle alarm', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ProjectPlanner-DynamoDB-Plans-Throttles',
    });
  });

  test('creates SFN execution failure alarm', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ProjectPlanner-Workflow-ExecutionFailed',
      Threshold: 0,
      ComparisonOperator: 'GreaterThanThreshold',
    });
  });

  // ── Budget ────────────────────────────────────────────────────────────────

  test('creates $25/mo cost budget', () => {
    template.hasResourceProperties('AWS::Budgets::Budget', {
      Budget: Match.objectLike({
        BudgetName: 'project-planner-ai-monthly',
        BudgetLimit: { Amount: 25, Unit: 'USD' },
        BudgetType: 'COST',
        TimeUnit: 'MONTHLY',
      }),
    });
  });

  // ── Outputs ───────────────────────────────────────────────────────────────

  test('exports WorkflowArn', () => {
    template.hasOutput('WorkflowArn', {});
  });

  test('exports PlansTableName', () => {
    template.hasOutput('PlansTableName', {});
  });
});
