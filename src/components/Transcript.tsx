"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "@/lib/atlas";
import { AtlasText } from "@/components/AtlasText";
import { enterT, exitT, quickT, riseItem, stagger } from "@/components/motion";

const SUGGESTIONS = [
  "Explain diffusion models without any analogies.",
  "Draft a two-sentence product update for a latency fix.",
  "What breaks first when a system scales 100×?",
  "Summarise the case against premature abstraction.",
] as const;

function timeOf(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6"
    >
      <motion.p variants={riseItem} className="label">
        Session ready
      </motion.p>
      <motion.h2
        variants={riseItem}
        className="mt-4 text-[clamp(1.6rem,4vw,2.2rem)] font-medium leading-[1.15] tracking-[-0.035em]"
      >
        What should ATLAS think about?
      </motion.h2>
      <motion.p
        variants={riseItem}
        className="mt-3 max-w-[52ch] text-[14px] leading-[1.7] text-ink-2"
      >
        Responses are text only. Ask for reasoning, drafting, or analysis — not
        images or charts.
      </motion.p>

      <motion.ul variants={riseItem} className="mt-9 border-t border-line">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="group flex min-h-11 w-full items-center justify-between gap-4 border-b border-line py-3.5 text-left text-[14px] text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              <span>{s}</span>
              <ArrowDown
                aria-hidden
                className="size-3.5 shrink-0 -rotate-90 text-ink-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-signal"
                strokeWidth={1.5}
              />
            </button>
          </li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function Turn({
  message,
  streamingTail,
}: {
  message: ChatMessage;
  streamingTail: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterT}
      className="border-b border-line py-7 last:border-b-0"
      aria-label={isUser ? "Your message" : "ATLAS response"}
    >
      <header className="mb-3 flex items-baseline gap-3">
        <span
          className={`label ${isUser ? "text-ink-3" : "text-signal"}`}
        >
          {isUser ? "You" : "ATLAS 2.1"}
        </span>
        <span className="label tnum">{timeOf(message.createdAt)}</span>
      </header>

      {isUser ? (
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere] border-l border-line-strong pl-4 text-[15px] leading-[1.7] text-ink-2">
          {message.content}
        </p>
      ) : (
        <div>
          <AtlasText text={message.content} />
          {streamingTail && <span aria-hidden className="caret" />}
        </div>
      )}
    </motion.article>
  );
}

export function Transcript({
  messages,
  streaming,
  onPick,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  onPick: (text: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  // Track whether the reader is at the bottom. If they scroll up mid-stream we
  // stop yanking the viewport and offer a button instead.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      setPinned(gap < 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const lastLength = messages.at(-1)?.content.length ?? 0;

  useLayoutEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, lastLength, pinned]);

  const toBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setPinned(true);
  };

  const lastId = messages.at(-1)?.id;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className="scroll-thin absolute inset-0 flex flex-col overflow-y-auto"
      >
        {messages.length === 0 ? (
          <EmptyState onPick={onPick} />
        ) : (
          <div
            aria-live="polite"
            aria-busy={streaming}
            className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6"
          >
            {messages.map((m) => (
              <Turn
                key={m.id}
                message={m}
                streamingTail={
                  streaming && m.id === lastId && m.role === "assistant"
                }
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!pinned && messages.length > 0 && (
          <motion.button
            type="button"
            onClick={toBottom}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: quickT }}
            exit={{ opacity: 0, y: 8, transition: exitT }}
            className="absolute bottom-5 left-1/2 flex h-9 -translate-x-1/2 items-center gap-2 border border-line-strong bg-panel px-3.5 text-[12px] text-ink-2 backdrop-blur transition-colors duration-150 hover:text-ink"
          >
            <ArrowDown className="size-3.5" strokeWidth={1.5} />
            Latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
