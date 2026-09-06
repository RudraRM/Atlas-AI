"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type ChatMessage,
  type Conversation,
  MAX_INPUT_CHARS,
  newId,
  titleFrom,
} from "@/lib/atlas";

const STORE_KEY = "atlas.sessions.v1";

function blankConversation(): Conversation {
  return { id: newId(), title: "New session", messages: [], updatedAt: Date.now() };
}

/** Reads persisted sessions. Returns [] on the server so SSR stays inert. */
function loadSessions(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Conversation[];
      }
    }
  } catch {
    // Corrupt or unavailable storage is not worth surfacing; start fresh.
  }
  return [blankConversation()];
}

const noopSubscribe = () => () => {};

/**
 * Owns every piece of chat state: the session list, the in-flight stream, and
 * persistence. Kept in one hook so the view components stay presentational.
 */
export function useAtlasChat() {
  // False during SSR and through the hydration render, true immediately after.
  // Gating the returned list on this keeps server and client markup identical
  // without restoring state from inside an effect.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [stored, setConversations] = useState<Conversation[]>(loadSessions);
  const [selectedId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const conversations = hydrated ? stored : [];
  const activeId = selectedId ?? stored[0]?.id ?? null;

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(stored));
    } catch {
      // Quota or private mode — the session still works in memory.
    }
  }, [stored, hydrated]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const patchActive = useCallback(
    (fn: (c: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? fn(c) : c)),
      );
    },
    [activeId],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const newSession = useCallback(() => {
    stop();
    const fresh = blankConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setError(null);
  }, [stop]);

  const selectSession = useCallback(
    (id: string) => {
      if (id === activeId) return;
      stop();
      setActiveId(id);
      setError(null);
    },
    [activeId, stop],
  );

  const deleteSession = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const list = next.length > 0 ? next : [blankConversation()];
        if (id === activeId) {
          stop();
          setActiveId(list[0].id);
        }
        return list;
      });
    },
    [activeId, stop],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT_CHARS);
      if (!text || streaming || !activeId) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const replyId = newId();

      // Snapshot the history that goes upstream before React batches the
      // optimistic update in.
      const history = [
        ...(stored.find((c) => c.id === activeId)?.messages ?? []),
        userMsg,
      ].map(({ role, content }) => ({ role, content }));

      patchActive((c) => ({
        ...c,
        title: c.messages.length === 0 ? titleFrom(text) : c.title,
        updatedAt: Date.now(),
        messages: [
          ...c.messages,
          userMsg,
          { id: replyId, role: "assistant", content: "", createdAt: Date.now() },
        ],
      }));

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res
            .json()
            .then((d: { error?: string }) => d.error)
            .catch(() => null);
          throw new Error(detail ?? `ATLAS returned ${res.status}.`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          patchActive((c) => ({
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === replyId ? { ...m, content: m.content + chunk } : m,
            ),
          }));
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          // User pressed stop — keep whatever streamed so far.
        } else {
          const detail =
            err instanceof Error ? err.message : "The request failed.";
          setError(detail);
          // Drop the empty placeholder so the transcript has no blank turn.
          patchActive((c) => ({
            ...c,
            messages: c.messages.filter(
              (m) => !(m.id === replyId && m.content === ""),
            ),
          }));
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [activeId, patchActive, stored, streaming],
  );

  // Never leave a stream running behind an unmounted view.
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    conversations,
    active,
    activeId,
    hydrated,
    streaming,
    error,
    send,
    stop,
    newSession,
    selectSession,
    deleteSession,
    dismissError: () => setError(null),
  };
}
