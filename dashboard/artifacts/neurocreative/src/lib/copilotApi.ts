import type { CopilotAnalysis, ChatMessage, ComparisonResult } from "../types/copilot";

const API_BASE = "/api";

export async function copilotAnalyze(
  file: File,
  onProgress: (msg: string) => void,
): Promise<CopilotAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/copilot/analyze`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const contentType = res.headers.get("content-type") || "";

  // Handle cached JSON response (backend returns JSONResponse for cache hits)
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (data.executive_summary) return data as CopilotAnalysis;
    throw new Error("Invalid cached analysis response");
  }

  // Handle SSE stream response (fresh analysis)
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let analysis: CopilotAnalysis | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.error) throw new Error(parsed.message || parsed.error);
          if (parsed.message) onProgress(parsed.message);
          if (parsed.executive_summary || parsed.id) analysis = parsed as CopilotAnalysis;
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }

  if (!analysis) throw new Error("No analysis result received");
  return analysis;
}

export async function copilotChat(
  message: string,
  analysisIds: string[],
  history: ChatMessage[],
  callbacks: {
    onToken: (text: string) => void;
    onToolCall: (name: string, label: string) => void;
    onToolResult: (name: string, summary: string) => void;
    onThinking: () => void;
    onDone: (provider: string) => void;
    onError: (err: string) => void;
  },
): Promise<void> {
  const res = await fetch(`${API_BASE}/copilot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, analysis_ids: analysisIds, history }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const raw = trimmed.slice(6);

      try {
        if (trimmed.includes("event: thinking") || raw.includes("round")) {
          callbacks.onThinking();
        }
      } catch {}

      try {
        const parsed = JSON.parse(raw);
        if (parsed.text) callbacks.onToken(parsed.text);
        if (parsed.name && parsed.label) callbacks.onToolCall(parsed.name, parsed.label);
        if (parsed.name && parsed.summary) callbacks.onToolResult(parsed.name, parsed.summary);
        if (parsed.provider) callbacks.onDone(parsed.provider);
        if (parsed.message && raw.includes("error")) {
          console.error("[copilotChat] Error from backend:", parsed.message);
          callbacks.onError(parsed.message);
        }
      } catch (e) {
        if (raw.trim()) console.warn("[copilotChat] Unparseable SSE data:", raw, e);
      }
    }
  }
  callbacks.onDone("unknown");
}

export async function copilotReset(): Promise<{ ok: boolean; cleared_cache: number; cleared_uploads: number }> {
  const res = await fetch(`${API_BASE}/copilot/reset`, { method: "POST" });
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
  return res.json();
}

export async function copilotCompare(analysisIds: string[]): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/copilot/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_ids: analysisIds }),
  });
  if (!res.ok) throw new Error(`Compare failed: ${res.status}`);
  return res.json();
}
