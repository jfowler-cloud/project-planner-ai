import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';
import { FunctionsStack } from '../lib/functions-stack';
import { WorkflowStack } from '../lib/workflow-stack';

describe('ProjectPlanner Multi-Stack', () => {
  let databaseStack: DatabaseStack;
  let functionsStack: FunctionsStack;
  let workflowStack: cdk.Stack;
  let dbTemplate: Template;
  let fnsTemplate: Template;
  let wfTemplate: Template;

  beforeAll(() => {
    const app = new cdk.App({ context: { 'aws:cdk:bundling-stacks': [] } });
    databaseStack = new DatabaseStack(app, 'TestDB');
    functionsStack = new FunctionsStack(app, 'TestFns', {
      deploymentTier: 'testing',
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      plansTable: databaseStack.plansTable,
      alarmTopic: databaseStack.alarmTopic,
    });
    new WorkflowStack(app, 'TestWF', { db: databaseStack, fns: functionsStack });

    workflowStack = app.node.findChild('TestWF') as cdk.Stack;
    dbTemplate = Template.fromStack(databaseStack);
    fnsTemplate = Template.fromStack(functionsStack);
    wfTemplate = Template.fromStack(workflowStack);
  });

  // ── DatabaseStack ─────────────────────────────────────────────────────────

  test('creates Cognito user pool', () => {
    dbTemplate.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'ProjectPlanner-Users',
    });
  });

  test('creates identity pool', () => {
    dbTemplate.resourceCountIs('AWS::Cognito::IdentityPool', 1);
  });

  test('creates PlansTable with PAY_PER_REQUEST billing', () => {
    dbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'project-planner-plans',
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });
  });

  test('creates S3 hosting bucket', () => {
    // 1 hosting bucket
    dbTemplate.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('creates CloudFront distribution', () => {
    dbTemplate.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('creates SNS alarm topic', () => {
    dbTemplate.hasResourceProperties('AWS::SNS::Topic', { TopicName: 'ProjectPlanner-Alarms' });
  });

  test('creates DynamoDB throttle alarm', () => {
    dbTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ProjectPlanner-DynamoDB-Plans-Throttles',
    });
  });

  test('creates $25/mo cost budget', () => {
    dbTemplate.hasResourceProperties('AWS::Budgets::Budget', {
      Budget: Match.objectLike({ BudgetName: 'project-planner-ai-monthly', BudgetLimit: { Amount: 25, Unit: 'USD' } }),
    });
  });

  // ── FunctionsStack ────────────────────────────────────────────────────────

  test('creates 4 Lambda functions (3 agents + get_execution)', () => {
    fnsTemplate.resourceCountIs('AWS::Lambda::Function', 4);
  });

  test('Lambda functions use Python 3.12', () => {
    fnsTemplate.hasResourceProperties('AWS::Lambda::Function', { Runtime: 'python3.12' });
  });

  test('Lambda functions have DEPLOYMENT_TIER env var', () => {
    fnsTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Environment: { Variables: Match.objectLike({ DEPLOYMENT_TIER: 'testing' }) },
    });
  });

  test('grants Bedrock InvokeModel', () => {
    fnsTemplate.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([Match.objectLike({
          Action: Match.arrayWith(['bedrock:InvokeModel']),
          Effect: 'Allow',
        })]),
      },
    });
  });

  test('creates error alarms for all functions', () => {
    const alarms = fnsTemplate.findResources('AWS::CloudWatch::Alarm', {
      Properties: { AlarmName: Match.stringLikeRegexp('ProjectPlanner-.*-Errors') },
    });
    expect(Object.keys(alarms).length).toBe(4);
  });

  // ── WorkflowStack ────────────────────────────────────────────────────────

  test('creates state machine', () => {
    wfTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'ProjectPlanner-Workflow',
    });
  });

  test('creates SFN failure alarm', () => {
    wfTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ProjectPlanner-Workflow-ExecutionFailed',
    });
  });

  test('creates Cognito identity pool role attachment', () => {
    wfTemplate.resourceCountIs('AWS::Cognito::IdentityPoolRoleAttachment', 1);
  });

  test('exports WorkflowArn', () => {
    wfTemplate.hasOutput('WorkflowArn', {});
  });

  // ── Snapshot Tests ────────────────────────────────────────────────────────

  test('DatabaseStack matches snapshot', () => {
    const template = Template.fromStack(databaseStack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  test('FunctionsStack matches snapshot', () => {
    const template = Template.fromStack(functionsStack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  test('WorkflowStack matches snapshot', () => {
    const template = Template.fromStack(workflowStack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
