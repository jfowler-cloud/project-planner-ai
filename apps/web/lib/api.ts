const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createRepo(
  planId: string,
  repoName: string,
  isPrivate: boolean,
  includeSop: boolean,
  githubToken?: string
): Promise<{ repo_url: string; files_created: string[] }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (githubToken) headers["X-GitHub-Token"] = githubToken;

  const r = await fetch(`${BASE}/api/github/create-repo`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      plan_id: planId,
      repo_name: repoName,
      private: isPrivate,
      include_sop: includeSop,
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Failed to create repo");
  }
  return r.json();
}

export function streamPlan(
  questionnaire: Record<string, unknown>,
  onEvent: (event: { step: number; total: number; message: string; partial: Record<string, unknown> | null; done: boolean; error?: boolean }) => void
): () => void {
  let cancelled = false;

  (async () => {
    const r = await fetch(`${BASE}/api/plans/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionnaire),
    });

    if (!r.ok || !r.body) {
      onEvent({ step: 0, total: 0, message: "Request failed", partial: null, done: true, error: true });
      return;
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!cancelled) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
          } catch {
            // skip malformed
          }
        }
      }
    }
  })();

  return () => { cancelled = true; };
}
