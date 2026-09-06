/** Shared contract between the chat UI and the ATLAS route handler. */

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Epoch ms. Used for ordering and for the timestamp column. */
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

/**
 * The model is text-only. This prompt is the single place that constraint is
 * expressed, and it is injected server-side so the client cannot drop it.
 */
export const ATLAS_SYSTEM_PROMPT =
  "You are ATLAS 2.1, a highly advanced, precise AI assistant. You output text-only responses. Do not attempt to render images, graphs, or multimedia elements. Never emit image links, data URIs, ASCII art, LaTeX diagrams, or markdown constructs whose purpose is visual layout — no tables, no headings, no code fences unless the user explicitly asked for source code. Write in clear prose and, where a list genuinely helps, plain short lines. Be exact, be brief, and say plainly when you do not know something.";

export const MAX_INPUT_CHARS = 8000;
/** Cap on history sent upstream, keeping the newest turns. */
export const MAX_HISTORY_MESSAGES = 24;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Derives a sidebar title from the first thing the user said. */
export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled session";
  return clean.length > 42 ? `${clean.slice(0, 42).trimEnd()}…` : clean;
}
