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
  /** CRT-style close: flatten to a line, then pinch left/right to center. */
  tvOffFlattenMs: 160,
  tvOffPinchMs: 220,
  staggerMs: 60,
  underlineMs: 180,
  scrambleMs: 150,
  magneticMaxPx: 6,
} as const;
