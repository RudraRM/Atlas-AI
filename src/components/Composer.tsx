"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import { MAX_INPUT_CHARS } from "@/lib/atlas";
import { pressT, quickT } from "@/components/motion";

interface ComposerProps {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Lets the transcript's suggestion list prefill (and focus) this field. */
  registerSeed?: (fn: (text: string) => void) => void;
}

const MAX_ROWS_PX = 200;

export function Composer({
  streaming,
  onSend,
  onStop,
  registerSeed,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the content up to a ceiling, then scroll inside the field.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  useEffect(() => {
    if (!streaming) ref.current?.focus();
  }, [streaming]);

  useEffect(() => {
    registerSeed?.((text: string) => {
      setValue(text);
      ref.current?.focus();
    });
  }, [registerSeed]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (streaming || !value.trim()) return;
    onSend(value);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter is a newline — the convention people expect.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = MAX_INPUT_CHARS - value.length;
  const nearLimit = remaining < 400;
  const canSend = value.trim().length > 0 && !streaming;

  return (
    <div className="border-t border-line bg-base/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-3xl px-4 pb-5 pt-4 sm:px-6">
        <form onSubmit={submit}>
          {/* The field's focus indicator lives on this wrapper: a signal-tinted
              border plus an inset ring, giving a 2px-equivalent indicator. The
              textarea's own outline is suppressed so the two do not stack. */}
          <motion.div
            animate={{
              borderColor: focused
                ? "rgba(224, 177, 132, 0.42)"
                : "var(--atlas-line)",
              boxShadow: focused
                ? "inset 0 0 0 1px rgba(224, 177, 132, 0.16)"
                : "inset 0 0 0 1px rgba(224, 177, 132, 0)",
            }}
            transition={quickT}
            className="relative border bg-raise"
          >
            <label htmlFor="atlas-input" className="sr-only">
              Message ATLAS 2.1
            </label>
            <textarea
              id="atlas-input"
              ref={ref}
              rows={1}
              value={value}
              maxLength={MAX_INPUT_CHARS}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask ATLAS anything…"
              spellCheck
              autoComplete="off"
              className="scroll-thin block max-h-[200px] w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[15px] leading-[1.6] text-ink outline-none focus-visible:outline-none placeholder:text-ink-3"
            />

            <div className="absolute bottom-2.5 right-2.5">
              {streaming ? (
                <motion.button
                  key="stop"
                  type="button"
                  onClick={onStop}
                  whileTap={{ scale: 0.94 }}
                  transition={pressT}
                  aria-label="Stop generating"
                  className="grid size-9 place-items-center border border-line-strong text-ink-2 transition-colors duration-150 hover:text-ink"
                >
                  <Square className="size-3 fill-current" strokeWidth={0} />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  type="submit"
                  disabled={!canSend}
                  whileTap={canSend ? { scale: 0.94 } : undefined}
                  transition={pressT}
                  aria-label="Send message"
                  className={[
                    "grid size-9 place-items-center transition-colors duration-150",
                    canSend
                      ? "bg-ink text-void hover:bg-white"
                      : "border border-line text-ink-3 cursor-not-allowed",
                  ].join(" ")}
                >
                  <ArrowUp className="size-4" strokeWidth={2} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </form>

        <div className="mt-2.5 flex items-center justify-between gap-4">
          <p className="label">
            Enter to send · Shift + Enter for a new line
          </p>
          {nearLimit && (
            <p
              className={`label tnum ${remaining < 0 ? "text-danger" : "text-signal"}`}
            >
              {remaining} left
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
