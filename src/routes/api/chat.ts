import { createFileRoute } from "@tanstack/react-router";
import { handleAgriBotChat } from "@/lib/chat.server";

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => handleAgriBotChat(request) } },
});
