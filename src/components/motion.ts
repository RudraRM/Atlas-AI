import type { Transition, Variants } from "framer-motion";

/**
 * One motion rhythm for the whole product. Every animation in ATLAS uses a
 * token from this file so nothing drifts out of step.
 * Durations sit in the 140–320ms band; exits run ~65% of their entrance.
 */
export const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];
export const EASE_IN: Transition["ease"] = [0.55, 0, 1, 0.45];

export const enterT: Transition = { duration: 0.32, ease: EASE_OUT };
export const quickT: Transition = { duration: 0.16, ease: EASE_OUT };
export const exitT: Transition = { duration: 0.2, ease: EASE_IN };

/** Spring used for press feedback — physics reads better than a curve here. */
export const pressT: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.6,
};

/** Parent of a staggered reveal. Children enter 44ms apart. */
export const stagger = (delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: 0.044, delayChildren },
  },
});

/** Rise-and-fade. Transform + opacity only, so it never triggers reflow. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: enterT },
};

/** A hairline that draws itself in — used for section rules. */
export const drawRule: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};
