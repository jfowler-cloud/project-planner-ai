#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { DatabaseStack } from '../lib/database-stack'
import { FunctionsStack } from '../lib/functions-stack'
import { WorkflowStack } from '../lib/workflow-stack'

const app = new cdk.App()

const tier = (app.node.tryGetContext('deploymentTier') ?? process.env.DEPLOYMENT_TIER ?? 'testing') as 'testing' | 'optimized' | 'premium'

const MODEL_MAP: Record<string, string> = {
  testing: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  optimized: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  premium: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
}

const tags = {
  Project: 'project-planner-ai',
  Environment: tier,
  ManagedBy: 'cdk',
  CostCenter: 'portfolio',
}

const db = new DatabaseStack(app, 'ProjectPlanner-Database', {
  env, tags,
  description: 'Project Planner AI — Cognito, DynamoDB, S3/CloudFront hosting, monitoring',
})

const fns = new FunctionsStack(app, 'ProjectPlanner-Functions', {
  env, tags,
  deploymentTier: tier,
  modelId: MODEL_MAP[tier],
  plansTable: db.plansTable,
  alarmTopic: db.alarmTopic,
  description: 'Project Planner AI — Lambda functions, layers, IAM',
})
fns.addDependency(db)

const workflow = new WorkflowStack(app, 'ProjectPlanner-Workflow', {
  env, tags,
  db, fns,
  description: 'Project Planner AI — Step Functions workflow, Cognito roles',
})
workflow.addDependency(fns)
