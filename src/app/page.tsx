"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import {
  EASE_IN,
  EASE_OUT,
  drawRule,
  enterT,
  pressT,
  riseItem,
  stagger,
} from "@/components/motion";

/** Datasheet rows under the hero. Facts, not marketing. */
const SPECS = [
  { k: "Model", v: "Nemotron 3.5 Lightning" },
  { k: "Parameters", v: "30B · A3B active" },
  { k: "Modality", v: "Text in · Text out" },
  { k: "Transport", v: "Token streaming" },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [launching, setLaunching] = useState(false);

  // The CTA plays a wipe before routing, so the landing page hands off to the
  // chat view instead of cutting to it. Reduced motion skips straight through.
  const launch = useCallback(() => {
    if (launching) return;
    if (reduce) {
      router.push("/chat");
      return;
    }
    setLaunching(true);
    router.prefetch("/chat");
    window.setTimeout(() => router.push("/chat"), 380);
  }, [launching, reduce, router]);

  // The hero advertises "press enter anywhere", so make that literally true.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      // Let real controls keep their own Enter behaviour.
      if (el?.closest("a, button, input, textarea, select, [contenteditable]")) {
        return;
      }
      e.preventDefault();
      launch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launch]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Structure layer: fine grid, masked so it fades out at the edges. */}
      <div aria-hidden className="atlas-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(224,177,132,0.06),transparent_70%)]"
      />

      {/* ---- Top bar --------------------------------------------------- */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterT}
        className="relative z-10 border-b border-line"
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-6 place-items-center border border-line-strong text-signal"
            >
              <Terminal className="size-3" strokeWidth={1.5} />
            </span>
            <span className="text-[13px] font-medium tracking-[-0.01em]">
              ATLAS
            </span>
            <span className="label tnum border-l border-line pl-3">v2.1.0</span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer noopener"
              className="label transition-colors duration-150 hover:text-ink-2"
            >
              Nemotron
            </a>
            <Link
              href="/chat"
              className="label transition-colors duration-150 hover:text-ink-2"
            >
              Interface
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ---- Hero ------------------------------------------------------ */}
      <motion.section
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-20 sm:px-8 sm:py-28"
      >
        <motion.p variants={riseItem} className="label flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-signal shadow-[0_0_10px_var(--atlas-signal)]"
          />
          NVIDIA Nemotron 3.5 · Lightning 30B A3B
        </motion.p>

        <motion.h1
          variants={riseItem}
          className="mt-7 text-[clamp(3.2rem,13vw,9.5rem)] font-medium leading-[0.86] tracking-[-0.055em]"
        >
          ATLAS 2.1
        </motion.h1>

        <motion.div
          variants={drawRule}
          className="mt-9 h-px origin-left bg-line-strong"
        />

        <div className="mt-9 grid gap-10 md:grid-cols-12 md:gap-8">
          <motion.h2
            variants={riseItem}
            className="text-[clamp(1.3rem,3vw,1.9rem)] font-normal leading-[1.2] tracking-[-0.03em] text-ink md:col-span-6"
          >
            Intelligent
            <br />
            Text Synthesis.
          </motion.h2>

          <motion.div variants={riseItem} className="md:col-span-6 md:pt-1.5">
            <p className="max-w-[46ch] text-[15px] leading-[1.7] text-ink-2">
              A reasoning surface with nothing between you and the model. ATLAS
              answers in prose — no images, no charts, no interface theatre.
              Every token is streamed the moment it is produced.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <motion.button
                type="button"
                onClick={launch}
                disabled={launching}
                whileHover={reduce ? undefined : { y: -1 }}
                whileTap={reduce ? undefined : { scale: 0.985 }}
                transition={pressT}
                className="group inline-flex h-11 items-center gap-3 bg-ink px-5 text-[13px] font-medium tracking-[-0.01em] text-void transition-colors duration-150 hover:bg-white disabled:opacity-60"
              >
                Launch Interface
                <ArrowRight
                  className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </motion.button>

              <Link
                href="/chat"
                className="label transition-colors duration-150 hover:text-ink-2"
              >
                or press enter anywhere
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ---- Datasheet ------------------------------------------------- */}
      <motion.footer
        variants={stagger(0.34)}
        initial="hidden"
        animate="show"
        className="relative z-10 border-t border-line"
      >
        <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 px-5 sm:px-8 md:grid-cols-4">
          {SPECS.map((spec, i) => (
            <motion.div
              key={spec.k}
              variants={riseItem}
              // Dividers are computed rather than layered, so no two padding
              // utilities compete for the same breakpoint.
              className={[
                "border-line py-6 pr-6",
                i % 2 === 1 ? "border-l pl-6" : "pl-0",
                i === 0 ? "md:border-l-0 md:pl-0" : "md:border-l md:pl-6",
                i < 2 ? "border-b md:border-b-0" : "",
              ].join(" ")}
            >
              <dt className="label">{spec.k}</dt>
              <dd className="tnum mt-2.5 text-[13px] leading-snug text-ink-2">
                {spec.v}
              </dd>
            </motion.div>
          ))}
        </dl>
      </motion.footer>

      {/* ---- Launch wipe ------------------------------------------------
          Covers the viewport bottom-up, so the chat view feels like it rises
          into place rather than replacing the page. */}
      <AnimatePresence>
        {launching && (
          <motion.div
            key="wipe"
            aria-hidden
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%", transition: { duration: 0.24, ease: EASE_IN } }}
            transition={{ duration: 0.42, ease: EASE_OUT }}
            className="fixed inset-0 z-50 bg-base"
          />
        )}
      </AnimatePresence>
    </main>
  );
}
