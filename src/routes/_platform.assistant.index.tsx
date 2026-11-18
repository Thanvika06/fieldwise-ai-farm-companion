import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ensureThread } from "@/lib/chat-threads";

export const Route = createFileRoute("/_platform/assistant/")({
  component: AssistantIndex,
});

function AssistantIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = ensureThread();
    navigate({ to: "/assistant/$threadId", params: { threadId: t.id }, replace: true });
  }, [navigate]);
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border bg-card text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Opening AgriBot…
    </div>
  );
}
