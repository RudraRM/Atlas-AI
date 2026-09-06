"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, PanelLeft, X } from "lucide-react";
import { Composer } from "@/components/Composer";
import { Sidebar } from "@/components/Sidebar";
import { Transcript } from "@/components/Transcript";
import { enterT, exitT, quickT } from "@/components/motion";
import { useAtlasChat } from "@/components/useAtlasChat";

export default function ChatPage() {
  const chat = useAtlasChat();
  const [drawer, setDrawer] = useState(false);
  const seedRef = useRef<((text: string) => void) | null>(null);

  // Close the mobile drawer on Escape — every overlay needs an escape route.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const registerSeed = useCallback((fn: (text: string) => void) => {
    seedRef.current = fn;
  }, []);

  const messages = chat.active?.messages ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={enterT}
      className="flex h-dvh overflow-hidden bg-base"
    >
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeId}
        open={drawer}
        onClose={() => setDrawer(false)}
        onSelect={(id) => {
          chat.selectSession(id);
          setDrawer(false);
        }}
        onNew={() => {
          chat.newSession();
          setDrawer(false);
        }}
        onDelete={chat.deleteSession}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---- Header --------------------------------------------------- */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open sessions panel"
            className="grid size-10 place-items-center text-ink-2 transition-colors duration-150 hover:text-ink lg:hidden"
          >
            <PanelLeft className="size-4" strokeWidth={1.5} />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-[-0.01em]">
            {chat.active?.title ?? "New session"}
          </h1>

          <div className="flex items-center gap-2.5">
            <motion.span
              aria-hidden
              animate={chat.streaming ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
              transition={
                chat.streaming
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : quickT
              }
              className={`size-1.5 rounded-full ${
                chat.streaming ? "bg-signal" : "bg-ink-3"
              }`}
            />
            {/* Status is stated in words too, never by colour alone. */}
            <span className="label">
              {chat.streaming ? "Synthesising" : "Idle"}
            </span>
          </div>
        </header>

        {/* ---- Error banner --------------------------------------------- */}
        <AnimatePresence initial={false}>
          {chat.error && (
            <motion.div
              role="alert"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: enterT }}
              exit={{ height: 0, opacity: 0, transition: exitT }}
              className="shrink-0 overflow-hidden border-b border-line bg-raise"
            >
              <div className="mx-auto flex w-full max-w-3xl items-start gap-3 px-4 py-3 sm:px-6">
                <AlertTriangle
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-danger"
                  strokeWidth={1.5}
                />
                <p className="flex-1 text-[13px] leading-relaxed text-ink-2">
                  <span className="text-danger">Request failed. </span>
                  {chat.error} Verify your ATLAS credentials in{" "}
                  <code className="font-mono text-ink">.env.local</code>, then
                  send the message again.
                </p>
                <button
                  type="button"
                  onClick={chat.dismissError}
                  aria-label="Dismiss error"
                  className="-m-2 grid size-9 shrink-0 place-items-center text-ink-3 transition-colors duration-150 hover:text-ink"
                >
                  <X className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Transcript ------------------------------------------------ */}
        {chat.hydrated ? (
          <Transcript
            key={chat.activeId ?? "none"}
            messages={messages}
            streaming={chat.streaming}
            onPick={(text) => seedRef.current?.(text)}
          />
        ) : (
          // Hold the space while sessions load so nothing shifts on hydrate.
          <div className="min-h-0 flex-1" aria-hidden />
        )}

        <Composer
          streaming={chat.streaming}
          onSend={chat.send}
          onStop={chat.stop}
          registerSeed={registerSeed}
        />
      </div>
    </motion.div>
  );
}
