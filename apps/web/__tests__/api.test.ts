import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK clients with class constructors
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-sfn', () => ({
  SFNClient: class { send = mockSend; },
  StartExecutionCommand: class { input: unknown; constructor(input: unknown) { this.input = input; } },
  DescribeExecutionCommand: class { input: unknown; constructor(input: unknown) { this.input = input; } },
}));
vi.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: class { send = mockSend; },
  InvokeCommand: class { input: unknown; constructor(input: unknown) { this.input = input; } },
}));
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({ credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }),
}));
vi.mock('@/config/amplify', () => ({
  awsConfig: { region: 'us-east-1', userPoolId: 'pool', userPoolClientId: 'client', identityPoolId: 'identity' },
  appConfig: { plansTable: 'test-table', workflowArn: 'arn:aws:states:us-east-1:123:stateMachine:test' },
  scaffoldConfig: { url: 'http://localhost:3001', backendUrl: 'http://localhost:8001' },
}));

import { startPlanExecution, startReviewExecution, pollExecution, exportToScaffold } from '../src/lib/api';

describe('startPlanExecution', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts SFN execution and returns ARN', async () => {
    mockSend.mockResolvedValueOnce({ executionArn: 'arn:aws:states:us-east-1:123:execution:test:run-1' });
    const result = await startPlanExecution({ basics: { name: 'Test' } }, 'plan-123');
    expect(result.executionArn).toBe('arn:aws:states:us-east-1:123:execution:test:run-1');
  });

  it('passes generateOnly flag when specified', async () => {
    mockSend.mockResolvedValueOnce({ executionArn: 'arn:exec' });
    await startPlanExecution({ basics: {} }, 'plan-1', { generateOnly: true });
    expect(mockSend).toHaveBeenCalled();
  });
});

describe('startReviewExecution', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts review-only SFN execution and returns ARN', async () => {
    mockSend.mockResolvedValueOnce({ executionArn: 'arn:aws:states:us-east-1:123:execution:test:review-1' });
    const result = await startReviewExecution({ basics: {} }, { name: 'Stack A' }, 'plan-123');
    expect(result.executionArn).toBe('arn:aws:states:us-east-1:123:execution:test:review-1');
  });
});

describe('pollExecution', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns plan data on SUCCEEDED', async () => {
    mockSend.mockResolvedValueOnce({
      Payload: new TextEncoder().encode(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({ status: 'SUCCEEDED', plan_id: 'p1', recommended: { name: 'Stack A' } }),
      })),
    });
    const result = await pollExecution('arn:exec');
    expect(result.status).toBe('SUCCEEDED');
    expect(result.plan_id).toBe('p1');
  });

  it('returns RUNNING status when in progress', async () => {
    mockSend.mockResolvedValueOnce({
      Payload: new TextEncoder().encode(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({ status: 'RUNNING' }),
      })),
    });
    const result = await pollExecution('arn:exec');
    expect(result.status).toBe('RUNNING');
  });

  it('handles payload without body string wrapper', async () => {
    mockSend.mockResolvedValueOnce({
      Payload: new TextEncoder().encode(JSON.stringify({ status: 'RUNNING' })),
    });
    const result = await pollExecution('arn:exec');
    expect(result.status).toBe('RUNNING');
  });

  it('returns error on FAILED', async () => {
    mockSend.mockResolvedValueOnce({
      Payload: new TextEncoder().encode(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({ status: 'FAILED', error: 'Something broke' }),
      })),
    });
    const result = await pollExecution('arn:exec');
    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('Something broke');
  });
});

describe('describeExecution', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls SFN DescribeExecution', async () => {
    const { describeExecution } = await import('../src/lib/api');
    mockSend.mockResolvedValueOnce({ status: 'RUNNING', startDate: new Date() });
    const result = await describeExecution('arn:exec:test');
    expect(result.status).toBe('RUNNING');
  });
});

describe('exportToScaffold', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  it('sends plan data to Scaffold backend', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'sess-1' }) });
    const result = await exportToScaffold({ plan_id: 'p1' });
    expect(result.sessionId).toBe('sess-1');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8001/api/import/plan', expect.objectContaining({ method: 'POST' }));
  });

  it('throws on failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false });
    await expect(exportToScaffold({})).rejects.toThrow('Scaffold export failed');
  });
});
