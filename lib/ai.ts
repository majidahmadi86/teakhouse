/**
 * Multi-provider chat adapter · Anthropic / OpenAI / Groq.
 * Selected by AI_PROVIDER + matching API key. No SDK deps · fetch only.
 *
 * v17 · A read-only deployment (a preview, lib/readOnly.ts) makes no outbound
 * AI call: it reports AI as not configured, and completeChat() returns before
 * any fetch. The provider keys are shared with production, so a preview must
 * not spend them or send guest text out.
 */
import { isReadOnlyDeployment } from "@/lib/readOnly";

export type AiProvider = "anthropic" | "openai" | "groq";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CompleteChatInput = {
  system: string;
  messages: ChatMessage[];
  /** Abort after this many ms. Default 6000. */
  timeoutMs?: number;
  maxTokens?: number;
};

export type CompleteChatResult =
  | { ok: true; text: string; provider: AiProvider }
  | { ok: false; error: string; timedOut?: boolean };

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-3-5-haiku-latest",
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

/**
 * True when AI_PROVIDER is set, the matching key is present, and this is not
 * a read-only deployment.
 */
export function isAiConfigured(): boolean {
  return getAiProvider() !== null;
}

export function getAiProvider(): AiProvider | null {
  if (isReadOnlyDeployment()) return null;
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  if (!provider || !apiKeyFor(provider)) return null;
  return provider;
}

function modelFor(provider: AiProvider): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function completeAnthropic(
  key: string,
  input: CompleteChatInput,
  timeoutMs: number
): Promise<CompleteChatResult> {
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
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Anthropic ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    ?.filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n")
    .trim();

  if (!text) return { ok: false, error: "Anthropic returned empty content" };
  return { ok: true, text, provider: "anthropic" };
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
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelFor(provider),
        max_tokens: input.maxTokens ?? 400,
        messages: [
          { role: "system", content: input.system },
          ...input.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `${provider} ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: `${provider} returned empty content` };
  return { ok: true, text, provider };
}

/**
 * Run a single chat completion against the configured provider.
 * Does not throw on timeout · returns { ok: false, timedOut: true }.
 */
export async function completeChat(
  input: CompleteChatInput
): Promise<CompleteChatResult> {
  if (isReadOnlyDeployment()) {
    return { ok: false, error: "Read-only deployment · no outbound AI call" };
  }
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
      e instanceof Error &&
      (e.name === "AbortError" || /aborted|timeout/i.test(e.message));
    return {
      ok: false,
      timedOut,
      error: timedOut
        ? "AI request timed out"
        : e instanceof Error
          ? e.message
          : "AI request failed",
    };
  }
}
