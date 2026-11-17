// Server-only helpers for Lovable AI Gateway (Gemini). Never import from client code.
import {
  GatewayError,
  PaymentRequiredError,
  RateLimitError,
  RequestRejectedError,
  PermissionDeniedError,
  ConfigurationError,
  AuthenticationError,
  streamChatCompletion,
} from "@lovable.dev/ai-gateway";

export const GEMINI_MODEL = "google/gemini-3.8-flash" as const;

type ChatPayload = Parameters<typeof streamChatCompletion<typeof GEMINI_MODEL>>[0];
export type GeminiMessages = ChatPayload["messages"];

export type AiFailure = { ok: false; code: "credits" | "rate_limit" | "unavailable" | "rejected" | "invalid_output" | "error"; message: string };

/** Streams a Gemini completion server-side and returns the full text (keeps the gateway leg streaming for long outputs). */
export async function collectGeminiText(messages: GeminiMessages, opts: { json?: boolean; signal?: AbortSignal } = {}): Promise<string> {
  const stream = await streamChatCompletion(
    {
      model: GEMINI_MODEL,
      messages,
      ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
    },
    { signal: opts.signal },
  );
  let text = "";
  for await (const event of stream) {
    const delta = extractDelta(event);
    if (delta) text += delta;
  }
  return text;
}

export function extractDelta(event: unknown): string {
  if (!event || typeof event !== "object" || !("choices" in event)) return "";
  const choices = (event as { choices?: { delta?: { content?: unknown } }[] }).choices;
  const content = choices?.[0]?.delta?.content;
  return typeof content === "string" ? content : "";
}

export function toAiFailure(err: unknown): AiFailure {
  if (err instanceof PaymentRequiredError)
    return { ok: false, code: "credits", message: "AI credits for this workspace are used up. Add credits in workspace billing to continue." };
  if (err instanceof RateLimitError)
    return { ok: false, code: "rate_limit", message: "The AI service is busy right now. Please wait a minute and try again." };
  if (err instanceof ConfigurationError || err instanceof AuthenticationError || err instanceof PermissionDeniedError)
    return { ok: false, code: "unavailable", message: "The AI service is not configured or not available for this project." };
  if (err instanceof RequestRejectedError)
    return { ok: false, code: "rejected", message: "The AI service could not process this request. Try a different image or shorter input." };
  if (err instanceof GatewayError) {
    console.error("AI gateway error", err.toJSON());
    return { ok: false, code: "error", message: "The AI service had a problem. Please try again." };
  }
  console.error("AI call failed", err);
  return { ok: false, code: "error", message: "Something went wrong while contacting the AI service." };
}

/** Extracts and parses the first JSON object in model output. */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(text.slice(start, end + 1));
}
