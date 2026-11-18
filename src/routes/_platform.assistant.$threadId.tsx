import { useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { DataBadge } from "@/components/agri/data-badge";
import { createThread, getThread, saveThreadMessages, useThreads, type ChatThread } from "@/lib/chat-threads";
import { languageName, useFarm } from "@/lib/farm-store";
import agribot from "@/assets/agribot-avatar.png";

export const Route = createFileRoute("/_platform/assistant/$threadId")({
  component: ThreadPage,
});

const SUGGESTIONS = [
  "My tomato leaves have brown spots with rings. What should I do?",
  "How often should I irrigate cotton during flowering on black soil?",
  "गेहूं की बुवाई के बाद पहली सिंचाई कब करनी चाहिए?",
  "Which organic options can improve soil with low nitrogen?",
  "भाताच्या पिकावर करपा रोग कसा ओळखावा?",
  "What is the right way to use a Soil Health Card report?",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const hydrated = useHydrated();
  const threads = useThreads();
  const navigate = useNavigate();
  const thread = hydrated ? threads.find((t) => t.id === threadId) ?? getThread(threadId) : undefined;

  if (!hydrated) return <div className="h-full rounded-2xl border bg-card" />;
  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 text-center">
        <img src={agribot} alt="" width={64} height={64} className="size-16" />
        <p className="font-semibold">This conversation is no longer available</p>
        <p className="max-w-sm text-sm text-muted-foreground">Conversations are kept only for this browser session. Start a new one to keep chatting.</p>
        <Button onClick={() => { const t = createThread(); navigate({ to: "/assistant/$threadId", params: { threadId: t.id }, replace: true }); }}>
          <MessageSquarePlus /> New conversation
        </Button>
      </div>
    );
  }
  return <ChatWindow key={thread.id} thread={thread} />;
}

function ChatWindow({ thread }: { thread: ChatThread }) {
  const { settings } = useFarm();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(settings.language);
  langRef.current = settings.language;

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => ({ language: langRef.current }) }),
    [],
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onError: (err) => {
      const msg = err.message || "AgriBot could not reply. Please try again.";
      toast.error(msg.length > 160 ? "AgriBot could not reply. Please try again." : msg);
    },
  });

  useEffect(() => {
    saveThreadMessages(thread.id, messages);
  }, [thread.id, messages]);

  const busy = status === "submitted" || status === "streaming";
  const focusInput = () => formRef.current?.querySelector("textarea")?.focus();
  useEffect(() => { if (!busy) focusInput(); }, [busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    clearError();
    void sendMessage({ text: t });
  };

  const onSubmit = (m: PromptInputMessage) => send(m.text);
  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text));

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <img src={agribot} alt="AgriBot" width={40} height={40} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-tight">AgriBot</p>
          <p className="truncate text-xs text-muted-foreground">Replies in {languageName(settings.language)} by default · any Indian language welcome</p>
        </div>
        <DataBadge kind="ai" className="hidden sm:inline-flex" />
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => { const t = createThread(); navigate({ to: "/assistant/$threadId", params: { threadId: t.id } }); }}>
          <MessageSquarePlus /> New
        </Button>
      </header>

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center">
              <img src={agribot} alt="" width={88} height={88} className="size-22" />
              <h2 className="mt-3 text-2xl font-semibold">Namaste! How can I help your farm today?</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Ask about crop care, soil, irrigation, fertilizers or plant diseases. I give general guidance — confirm major treatments with your KVK.</p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border bg-background p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent/50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i} isAnimating={status === "streaming" && m.id === last?.id}>{part.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {waiting && <Shimmer className="text-sm">AgriBot is thinking…</Shimmer>}
          {error && !busy && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error.message && error.message.length < 200 ? error.message : "AgriBot could not reply."} Edit or resend your question to try again.
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div ref={formRef} className="border-t bg-background/60 p-3">
        <div className="mx-auto max-w-3xl">
          <PromptInput onSubmit={onSubmit}>
            <PromptInputTextarea placeholder="Ask AgriBot about your crops… (English, हिन्दी, मराठी, தமிழ் …)" autoFocus />
            <PromptInputFooter className="justify-between">
              <span className="pl-1 text-[11px] text-muted-foreground">Guidance only · <Link to="/disease-detection" className="underline-offset-2 hover:underline">scan a leaf photo</Link></span>
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </section>
  );
}
