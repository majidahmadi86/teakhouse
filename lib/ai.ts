/**
 * Multi-provider chat adapter · Anthropic / OpenAI / Groq.
 * Selected by AI_PROVIDER + matching API key. No SDK deps · fetch only.
 *
 * v15 · streaming (SSE parsed here, text deltas handed to `onDelta`) and tool
 * use (the model may call a tool; the caller runs it and calls again with
 * `toolResults`). Both providers' wire formats are hidden behind one shape.
 */

export type AiProvider = "anthropic" | "openai" | "groq";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type ToolCall = { id: string; name: string; input: Record<string, unknown> };

export type CompleteChatInput = {
  system: string;
  messages: ChatMessage[];
  /** Abort after this many ms. Default 6000. */
  timeoutMs?: number;
  maxTokens?: number;
  tools?: ToolDef[];
  /** A previous turn's tool calls with their results · appended before the model answers again. */
  toolRound?: { assistantText: string; calls: ToolCall[]; results: { id: string; content: string }[] };
  /** Called with each text fragment as it streams. */
  onDelta?: (text: string) => void;
};

export type CompleteChatResult =
  | { ok: true; text: string; toolCalls: ToolCall[]; provider: AiProvider }
  | { ok: false; error: string; timedOut?: boolean };

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
};

function normalizeProvider(raw: string | undefined): AiProvider | null {
  const v = raw?.trim().toLowerCase();
  if (v === "anthropic" || v === "openai" || v === "groq") return v;
  return null;
}

function apiKeyFor(provider: AiProvider): string | undefined {
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY?.trim();
  if (provider === "openai") return process.env.OPENAI_API_KEY?.trim();
  return process.env.GROQ_API_KEY?.trim();
}

/** True when AI_PROVIDER is set and the matching key is present. */
export function isAiConfigured(): boolean {
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  if (!provider) return false;
  return Boolean(apiKeyFor(provider));
}

export function getAiProvider(): AiProvider | null {
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  if (!provider || !apiKeyFor(provider)) return null;
  return provider;
}

function modelFor(provider: AiProvider): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Yields the `data:` payload of every SSE event in a response body. */
async function* sseEvents(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = chunk
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("\n");
      if (data) yield data;
    }
  }
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

/* ── Anthropic ──────────────────────────────────────────────────────────── */

type AnthropicContent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

function anthropicMessages(input: CompleteChatInput): { role: string; content: string | AnthropicContent[] }[] {
  const out: { role: string; content: string | AnthropicContent[] }[] = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  if (input.toolRound) {
    const assistant: AnthropicContent[] = [];
    if (input.toolRound.assistantText) assistant.push({ type: "text", text: input.toolRound.assistantText });
    for (const c of input.toolRound.calls) assistant.push({ type: "tool_use", id: c.id, name: c.name, input: c.input });
    out.push({ role: "assistant", content: assistant });
    out.push({
      role: "user",
      content: input.toolRound.results.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.content })),
    });
  }
  return out;
}

async function completeAnthropic(key: string, input: CompleteChatInput, timeoutMs: number): Promise<CompleteChatResult> {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelFor("anthropic"),
        max_tokens: input.maxTokens ?? 400,
        system: input.system,
        messages: anthropicMessages(input),
        stream: true,
        ...(input.tools?.length ? { tools: input.tools } : {}),
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Anthropic ${res.status}: ${body.slice(0, 200)}` };
  }

  let text = "";
  const blocks = new Map<number, { type: string; id?: string; name?: string; json: string }>();
  for await (const data of sseEvents(res)) {
    const ev = safeJson(data) as {
      type?: string;
      index?: number;
      content_block?: { type: string; id?: string; name?: string };
      delta?: { type?: string; text?: string; partial_json?: string };
    };
    if (ev.type === "content_block_start" && typeof ev.index === "number" && ev.content_block) {
      blocks.set(ev.index, { type: ev.content_block.type, id: ev.content_block.id, name: ev.content_block.name, json: "" });
    } else if (ev.type === "content_block_delta" && typeof ev.index === "number" && ev.delta) {
      if (ev.delta.type === "text_delta" && ev.delta.text) {
        text += ev.delta.text;
        input.onDelta?.(ev.delta.text);
      } else if (ev.delta.type === "input_json_delta" && ev.delta.partial_json) {
        const b = blocks.get(ev.index);
        if (b) b.json += ev.delta.partial_json;
      }
    }
  }
  const toolCalls: ToolCall[] = [];
  blocks.forEach((b) => {
    if (b.type === "tool_use" && b.id && b.name) toolCalls.push({ id: b.id, name: b.name, input: safeJson(b.json) });
  });
  if (!text.trim() && toolCalls.length === 0) return { ok: false, error: "Anthropic returned empty content" };
  return { ok: true, text: text.trim(), toolCalls, provider: "anthropic" };
}

/* ── OpenAI-compatible ──────────────────────────────────────────────────── */

function openAiMessages(input: CompleteChatInput): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [
    { role: "system", content: input.system },
    ...input.messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  if (input.toolRound) {
    out.push({
      role: "assistant",
      content: input.toolRound.assistantText || null,
      tool_calls: input.toolRound.calls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: JSON.stringify(c.input) },
      })),
    });
    for (const r of input.toolRound.results) out.push({ role: "tool", tool_call_id: r.id, content: r.content });
  }
  return out;
}

async function completeOpenAiCompatible(
  provider: "openai" | "groq",
  key: string,
  input: CompleteChatInput,
  timeoutMs: number
): Promise<CompleteChatResult> {
  const url =
    provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions";

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: modelFor(provider),
        max_tokens: input.maxTokens ?? 400,
        messages: openAiMessages(input),
        stream: true,
        ...(input.tools?.length
          ? {
              tools: input.tools.map((t) => ({
                type: "function",
                function: { name: t.name, description: t.description, parameters: t.input_schema },
              })),
            }
          : {}),
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `${provider} ${res.status}: ${body.slice(0, 200)}` };
  }

  let text = "";
  const calls = new Map<number, { id: string; name: string; args: string }>();
  for await (const data of sseEvents(res)) {
    if (data === "[DONE]") break;
    const ev = safeJson(data) as {
      choices?: {
        delta?: {
          content?: string;
          tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
        };
      }[];
    };
    const delta = ev.choices?.[0]?.delta;
    if (!delta) continue;
    if (delta.content) {
      text += delta.content;
      input.onDelta?.(delta.content);
    }
    for (const tc of delta.tool_calls ?? []) {
      const cur = calls.get(tc.index) ?? { id: "", name: "", args: "" };
      if (tc.id) cur.id = tc.id;
      if (tc.function?.name) cur.name += tc.function.name;
      if (tc.function?.arguments) cur.args += tc.function.arguments;
      calls.set(tc.index, cur);
    }
  }
  const toolCalls: ToolCall[] = [];
  calls.forEach((c) => {
    if (c.id && c.name) toolCalls.push({ id: c.id, name: c.name, input: safeJson(c.args) });
  });
  if (!text.trim() && toolCalls.length === 0) return { ok: false, error: `${provider} returned empty content` };
  return { ok: true, text: text.trim(), toolCalls, provider };
}

/**
 * Run a single chat completion against the configured provider.
 * Does not throw on timeout · returns { ok: false, timedOut: true }.
 */
export async function completeChat(input: CompleteChatInput): Promise<CompleteChatResult> {
  const provider = getAiProvider();
  if (!provider) {
    return { ok: false, error: "AI not configured · set AI_PROVIDER and API key" };
  }

  const key = apiKeyFor(provider)!;
  const timeoutMs = input.timeoutMs ?? 6000;

  try {
    if (provider === "anthropic") {
      return await completeAnthropic(key, input, timeoutMs);
    }
    return await completeOpenAiCompatible(provider, key, input, timeoutMs);
  } catch (e) {
    const timedOut =
      e instanceof Error && (e.name === "AbortError" || /aborted|timeout/i.test(e.message));
    return {
      ok: false,
      timedOut,
      error: timedOut ? "AI request timed out" : e instanceof Error ? e.message : "AI request failed",
    };
  }
}
