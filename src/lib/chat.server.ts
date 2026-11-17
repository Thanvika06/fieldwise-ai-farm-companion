import { createUIMessageStream, createUIMessageStreamResponse, generateId, type UIMessage } from "ai";
import { z } from "zod";
import { streamChatCompletion } from "@lovable.dev/ai-gateway";
import { GEMINI_MODEL, extractDelta, toAiFailure, type GeminiMessages } from "@/lib/ai.server";

const LANG: Record<string, string> = {
  en: "simple English", hi: "Hindi", mr: "Marathi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", pa: "Punjabi", gu: "Gujarati",
};

const body = z.object({
  id: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.object({ type: z.string() }).passthrough()),
      }),
    )
    .min(1)
    .max(60),
});

function systemPrompt(language: string) {
  return `You are AgriBot, the farming assistant inside AgriSmart AI, helping Indian farmers.
- Answer questions about crop care, soil, irrigation, fertilizers, pests and plant diseases in clear, simple words. Use short paragraphs and bullet points.
- Default reply language: ${language}. If the farmer writes in another language (including Hinglish or any Indian language), reply in that language.
- Prefer practical, affordable, locally available practices. Mention KVK, Soil Health Card, or the state agriculture department when expert or lab confirmation is needed.
- You cannot see the farm, sensors, or live weather. Never invent readings, test results, prices or diagnoses; ask for details or suggest how to check.
- For pesticides, give generic guidance, stress label instructions and protective equipment, and recommend local expert confirmation before major treatment.
- Never guarantee yields or income. Politely decline unrelated topics and steer back to farming.`;
}

export async function handleAgriBotChat(request: Request): Promise<Response> {
  let parsed: z.infer<typeof body>;
  try {
    parsed = body.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid chat request" }, { status: 400 });
  }
  const messages = parsed.messages as unknown as UIMessage[];
  const history: GeminiMessages = [{ role: "system", content: systemPrompt(LANG[parsed.language ?? "en"] ?? "simple English") }];
  for (const m of messages) {
    if (m.role === "system") continue;
    const text = m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof (p as { text?: unknown }).text === "string")
      .map((p) => p.text)
      .join("\n")
      .slice(0, 6000);
    if (text.trim()) history.push({ role: m.role, content: text });
  }

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const upstream = await streamChatCompletion({ model: GEMINI_MODEL, messages: history }, { signal: request.signal });
      const id = generateId();
      writer.write({ type: "text-start", id });
      for await (const event of upstream) {
        const delta = extractDelta(event);
        if (delta) writer.write({ type: "text-delta", id, delta });
      }
      writer.write({ type: "text-end", id });
    },
    onError: (err) => toAiFailure(err).message,
  });
  return createUIMessageStreamResponse({ stream });
}
