"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";
import type { Conversation } from "@/lib/atlas";
import { EASE_OUT, exitT, quickT } from "@/components/motion";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function SessionList({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: Pick<SidebarProps, "conversations" | "activeId" | "onSelect" | "onDelete">) {
  return (
    <nav aria-label="Sessions" className="scroll-thin flex-1 overflow-y-auto px-2 py-2">
      <ul>
        <AnimatePresence initial={false}>
          {conversations.map((c) => {
            const current = c.id === activeId;
            return (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: quickT }}
                exit={{ opacity: 0, height: 0, transition: exitT }}
                className="group relative"
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={current ? "page" : undefined}
                  className={[
                    "flex w-full min-h-11 items-center gap-2.5 px-3 py-2.5 pr-10 text-left text-[13px] leading-snug transition-colors duration-150",
                    current
                      ? "bg-panel text-ink"
                      : "text-ink-2 hover:bg-raise hover:text-ink",
                  ].join(" ")}
                >
                  {/* Active marker: a bar, not a colour swap — readable without colour. */}
                  <span
                    aria-hidden
                    className={[
                      "h-3.5 w-px shrink-0 transition-colors duration-150",
                      current ? "bg-signal" : "bg-transparent",
                    ].join(" ")}
                  />
                  <span className="truncate">{c.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  aria-label={`Delete session: ${c.title}`}
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-ink-3 opacity-0 transition-[opacity,color] duration-150 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </nav>
  );
}

function Panel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  showClose,
}: Omit<SidebarProps, "open"> & { showClose: boolean }) {
  return (
    <div className="flex h-full flex-col bg-base">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          <ChevronLeft
            className="size-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
            strokeWidth={1.5}
          />
          ATLAS
        </Link>

        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sessions panel"
            className="grid size-9 place-items-center text-ink-3 hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        ) : (
          <span className="label tnum">{conversations.length} sessions</span>
        )}
      </div>

      <div className="border-b border-line p-2">
        <button
          type="button"
          onClick={onNew}
          className="flex min-h-11 w-full items-center gap-2.5 border border-line px-3 py-2.5 text-left text-[13px] text-ink-2 transition-colors duration-150 hover:border-line-strong hover:bg-raise hover:text-ink"
        >
          <Plus className="size-3.5" strokeWidth={1.5} />
          New session
        </button>
      </div>

      <SessionList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />

      <div className="shrink-0 border-t border-line px-4 py-3.5">
        <p className="label">Nemotron 3.5 Lightning</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
          Text-only. Sessions are stored in this browser.
        </p>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { open, onClose } = props;

  return (
    <>
      {/* Desktop: persistent rail. Adaptive navigation — sidebar >= 1024px. */}
      <aside className="hidden w-[264px] shrink-0 border-r border-line lg:block">
        <Panel {...props} showClose={false} />
      </aside>

      {/* Mobile: overlay drawer with a scrim strong enough to isolate it. */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: exitT }}
              transition={quickT}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sessions"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: exitT }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="absolute inset-y-0 left-0 w-[84vw] max-w-[300px] border-r border-line"
            >
              <Panel {...props} showClose />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
