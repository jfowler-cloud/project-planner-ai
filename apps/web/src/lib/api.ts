/** AWS SDK calls via Cognito identity pool credentials. */
import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { fetchAuthSession } from 'aws-amplify/auth'
import { awsConfig, appConfig, scaffoldConfig } from '@/config/amplify'

async function getClients() {
  const session = await fetchAuthSession()
  const config = { region: awsConfig.region, credentials: session.credentials }
  return {
    sfn: new SFNClient(config),
    lambda: new LambdaClient(config),
  }
}

export interface StartPlanResult {
  executionArn: string
}

export async function startPlanExecution(
  questionnaire: Record<string, unknown>,
  planId: string,
  options?: { generateOnly?: boolean },
): Promise<StartPlanResult> {
  const { sfn } = await getClients()
  const resp = await sfn.send(new StartExecutionCommand({
    stateMachineArn: appConfig.workflowArn,
    input: JSON.stringify({
      questionnaire,
      plan_id: planId,
      ...(options?.generateOnly && { generateOnly: true }),
    }),
  }))
  return { executionArn: resp.executionArn! }
}

export async function startReviewExecution(
  questionnaire: Record<string, unknown>,
  recommended: Record<string, unknown>,
  planId: string,
): Promise<StartPlanResult> {
  const { sfn } = await getClients()
  const resp = await sfn.send(new StartExecutionCommand({
    stateMachineArn: appConfig.workflowArn,
    name: `review-${planId}-${Date.now()}`,
    input: JSON.stringify({
      reviewOnly: true,
      questionnaire,
      recommended,
      plan_id: planId,
    }),
  }))
  return { executionArn: resp.executionArn! }
}

export interface PollResult {
  status: string
  plan_id?: string
  recommended?: Record<string, unknown>
  alternatives?: Record<string, unknown>[]
  review_findings?: Record<string, unknown>[]
  error?: string
}

export async function pollExecution(executionArn: string): Promise<PollResult> {
  const { lambda } = await getClients()
  const resp = await lambda.send(new InvokeCommand({
    FunctionName: 'project-planner-get_execution',
    Payload: new TextEncoder().encode(JSON.stringify({ executionArn })),
  }))
  const payload = JSON.parse(new TextDecoder().decode(resp.Payload))
  const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload
  return body as PollResult
}

export async function describeExecution(executionArn: string) {
  const { sfn } = await getClients()
  return sfn.send(new DescribeExecutionCommand({ executionArn }))
}

export async function exportToScaffold(planData: Record<string, unknown>): Promise<{ sessionId: string }> {
  const resp = await fetch(`${scaffoldConfig.backendUrl}/api/import/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData),
  })
  if (!resp.ok) throw new Error('Scaffold export failed')
  return resp.json()
}
