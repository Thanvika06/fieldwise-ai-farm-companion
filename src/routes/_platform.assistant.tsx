import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useHydrated } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { createThread, deleteThread, ensureThread, useThreads } from "@/lib/chat-threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/assistant")({
  head: () => ({
    meta: [
      { title: "AgriBot – AI Farming Assistant · AgriSmart AI" },
      { name: "description", content: "Ask AgriBot about crop care, soil, irrigation, fertilizers and plant diseases in English or Indian languages." },
      { property: "og:title", content: "AgriBot – AI Farming Assistant · AgriSmart AI" },
      { property: "og:description", content: "Ask AgriBot about crop care, soil, irrigation, fertilizers and plant diseases in English or Indian languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const threads = useThreads();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  const startNew = () => {
    const t = createThread();
    navigate({ to: "/assistant/$threadId", params: { threadId: t.id } });
  };

  const remove = (id: string) => {
    deleteThread(id);
    if (params.threadId === id) {
      const next = ensureThread();
      navigate({ to: "/assistant/$threadId", params: { threadId: next.id }, replace: true });
    }
  };

  return (
    <div className="grid h-[calc(100dvh-7rem)] min-h-[560px] gap-4 md:h-[calc(100dvh-8rem)] lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col rounded-2xl border bg-card p-3 shadow-soft lg:flex">
        <Button onClick={startNew} className="w-full"><MessageSquarePlus /> New conversation</Button>
        <p className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">This session</p>
        <ul className="mt-1 flex-1 space-y-1 overflow-y-auto">
          {hydrated && sorted.length === 0 && <li className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</li>}
          {hydrated && sorted.map((t) => (
            <li key={t.id} className={cn("group flex items-center gap-1 rounded-lg", params.threadId === t.id ? "bg-accent" : "hover:bg-muted")}>
              <Link to="/assistant/$threadId" params={{ threadId: t.id }} className="min-w-0 flex-1 px-2 py-2">
                <span className="block truncate text-sm font-medium">{t.title}</span>
                <span className="block text-[11px] text-muted-foreground">{t.messages.length} messages</span>
              </Link>
              <button type="button" onClick={() => remove(t.id)} className="mr-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-danger group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Delete ${t.title}`}>
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 rounded-lg bg-muted p-2 text-[11px] text-muted-foreground">Conversations are kept only while this browser tab stays open.</p>
      </aside>
      <div className="min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
