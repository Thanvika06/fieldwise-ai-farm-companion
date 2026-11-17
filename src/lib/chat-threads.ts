// AgriBot conversations live only in this browser tab's session (sessionStorage):
// they survive reloads and page switches, and disappear when the tab is closed.
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const KEY = "agrismart.agribot.threads.v1";
const listeners = new Set<() => void>();
let cache: ChatThread[] | null = null;
const EMPTY: ChatThread[] = [];

function read(): ChatThread[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ChatThread[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: ChatThread[]) {
  cache = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useThreads(): ChatThread[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function getThread(id: string): ChatThread | undefined {
  return read().find((t) => t.id === id);
}

function newId() {
  return `t_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function createThread(): ChatThread {
  const thread: ChatThread = { id: newId(), title: "New conversation", updatedAt: Date.now(), messages: [] };
  write([thread, ...read()]);
  return thread;
}

/** Idempotent: returns the most recent thread, creating one only when none exist. */
export function ensureThread(): ChatThread {
  const existing = read();
  if (existing.length > 0) return [...existing].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return createThread();
}

function titleFrom(messages: UIMessage[]): string | null {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.find((p) => p.type === "text");
  if (!text || text.type !== "text") return null;
  const t = text.text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  const threads = read();
  const current = threads.find((t) => t.id === id);
  if (!current) return;
  if (current.messages === messages) return;
  write(
    threads.map((t) =>
      t.id === id
        ? { ...t, messages, updatedAt: messages.length !== t.messages.length ? Date.now() : t.updatedAt, title: titleFrom(messages) ?? t.title }
        : t,
    ),
  );
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}
