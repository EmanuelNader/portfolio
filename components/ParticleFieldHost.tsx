"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const ParticleField = dynamic(
  () => import("./ParticleField").then((mod) => mod.ParticleField),
  { ssr: false },
);

type Props = {
  fullPage?: boolean;
  paused?: boolean;
};

/**
 * Lazy-loads the WebGL field after first paint, and only on fine-pointer
 * devices without reduced-motion.
 */
export function ParticleFieldHost({ fullPage = false, paused = false }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setEnabled(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const id = window.setTimeout(enable, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  if (!enabled) return null;
  return <ParticleField fullPage={fullPage} paused={paused} />;
}
