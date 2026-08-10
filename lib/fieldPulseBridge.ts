export type BurstPoint = { x: number; y: number };

let burstPositions: BurstPoint[] | null = null;

/** Publish live dissolve-burst screen positions for ambient field proximity pulses. */
export function setDissolveBurstPositions(points: BurstPoint[] | null) {
  burstPositions = points;
}

export function getDissolveBurstPositions(): BurstPoint[] | null {
  return burstPositions;
}
