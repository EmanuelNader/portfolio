"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { StaticParticleFallback } from "./StaticParticleFallback";

const ParticleField = dynamic(
  () => import("./ParticleField").then((mod) => mod.ParticleField),
  { ssr: false },
);

type Mode = "pending" | "live" | "static";

type Props = {
  fullPage?: boolean;
};

/**
 * Live WebGL on fine-pointer + motion-OK clients only.
 * Coarse pointer / reduced-motion get the build-time PNG and never import three.
 */
export function ParticleFieldHost({ fullPage = true }: Props) {
  const [mode, setMode] = useState<Mode>("pending");
  const [paused, setPaused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef(false);
  const offscreenRef = useRef(false);

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) {
      setMode("static");
      return;
    }

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setMode("live");
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

  useEffect(() => {
    if (mode !== "live") return;

    const syncPaused = () => {
      setPaused(hiddenRef.current || offscreenRef.current);
    };

    const onVisibility = () => {
      hiddenRef.current = document.visibilityState === "hidden";
      syncPaused();
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | null = null;
    if (sentinel) {
      observer = new IntersectionObserver(
        ([entry]) => {
          offscreenRef.current = !entry?.isIntersecting;
          syncPaused();
        },
        { root: null, rootMargin: "200px 0px", threshold: 0 },
      );
      observer.observe(sentinel);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [mode]);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      {/* PNG for coarse / reduced-motion, and as a brief paint before live WebGL */}
      {mode !== "live" ? <StaticParticleFallback /> : null}
      {mode === "live" ? (
        <ParticleField fullPage={fullPage} paused={paused} />
      ) : null}
    </>
  );
}
