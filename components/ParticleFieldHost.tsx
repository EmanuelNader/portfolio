"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const ParticleField = dynamic(
  () => import("./ParticleField").then((mod) => mod.ParticleField),
  { ssr: false },
);

type Props = {
  fullPage?: boolean;
};

/**
 * Lazy-loads the WebGL field after first paint, and only on fine-pointer
 * devices without reduced-motion. Pauses on tab hide and when the page
 * sentinel leaves the viewport.
 */
export function ParticleFieldHost({ fullPage = true }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef(false);
  const offscreenRef = useRef(false);

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

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled]);

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
      {enabled ? <ParticleField fullPage={fullPage} paused={paused} /> : null}
    </>
  );
}
