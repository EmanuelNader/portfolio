export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

export const timings = {
  previewMs: 150,
  flipMs: 400,
  /** Panel content fade while dissolve burst takes over. */
  dissolveFadeMs: 160,
  /** Delay before work list starts fading back in. */
  dissolveListDelayMs: 120,
  /** Work list fade-in duration after delay (~400ms total from close). */
  dissolveListFadeMs: 280,
  staggerMs: 60,
  underlineMs: 180,
  scrambleMs: 150,
  magneticMaxPx: 6,
} as const;
