import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRepo, streamPlan } from '../src/lib/api';

global.fetch = vi.fn();

describe('createRepo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls correct endpoint and returns data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ repo_url: 'https://github.com/user/repo', files_created: ['README.md'] }),
    });
    const result = await createRepo('plan-1', 'my-repo', false, true);
    expect(result.repo_url).toBe('https://github.com/user/repo');
    expect(result.files_created).toContain('README.md');
    const call = (global.fetch as any).mock.calls[0];
    expect(call[0]).toContain('/api/v1/generate-repo');
    expect(JSON.parse(call[1].body)).toMatchObject({ plan_id: 'plan-1', repo_name: 'my-repo', private: false });
  });

  it('includes github token header when provided', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ repo_url: 'url', files_created: [] }),
    });
    await createRepo('plan-1', 'repo', true, false, 'ghp_token');
    const headers = (global.fetch as any).mock.calls[0][1].headers;
    expect(headers['X-GitHub-Token']).toBe('ghp_token');
  });

  it('throws on non-ok response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Invalid plan' }),
    });
    await expect(createRepo('bad', 'repo', false, false)).rejects.toThrow('Invalid plan');
  });

  it('throws with statusText when json parse fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
      json: async () => { throw new Error('not json'); },
    });
    await expect(createRepo('bad', 'repo', false, false)).rejects.toThrow('Server Error');
  });
});

describe('streamPlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onEvent with error when fetch fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, body: null });
    const onEvent = vi.fn();
    streamPlan({ description: 'test' }, onEvent);
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ error: true, done: true })));
  });

  it('parses SSE data lines and calls onEvent', async () => {
    const encoder = new TextEncoder();
    const events = [
      { step: 1, total: 2, message: 'Step 1', partial: null, done: false },
      { step: 2, total: 2, message: 'Done', partial: null, done: true },
    ];
    const chunks = events.map(e => encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
    let chunkIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (chunkIndex < chunks.length) return { done: false, value: chunks[chunkIndex++] };
        return { done: true, value: undefined };
      }),
    };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, body: { getReader: () => mockReader } });
    const onEvent = vi.fn();
    streamPlan({}, onEvent);
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalledTimes(2));
    expect(onEvent.mock.calls[0][0].message).toBe('Step 1');
    expect(onEvent.mock.calls[1][0].done).toBe(true);
  });

  it('returns cancel function that stops reading', async () => {
    const reads: Array<() => void> = [];
    const mockReader = {
      read: vi.fn().mockImplementation(() => new Promise(r => reads.push(() => r({ done: true, value: undefined })))),
    };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, body: { getReader: () => mockReader } });
    const onEvent = vi.fn();
    const cancel = streamPlan({}, onEvent);
    // Wait for fetch to be called and reader.read to be pending
    await vi.waitFor(() => expect(mockReader.read).toHaveBeenCalled());
    cancel();
    reads.forEach(r => r());
    await new Promise(r => setTimeout(r, 10));
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('skips malformed SSE lines', async () => {
    const encoder = new TextEncoder();
    const chunk = encoder.encode('data: not-json\ndata: {"step":1,"total":1,"message":"ok","partial":null,"done":true}\n\n');
    let called = false;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (!called) { called = true; return { done: false, value: chunk }; }
        return { done: true, value: undefined };
      }),
    };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, body: { getReader: () => mockReader } });
    const onEvent = vi.fn();
    streamPlan({}, onEvent);
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));
    expect(onEvent.mock.calls[0][0].message).toBe('ok');
  });
});
