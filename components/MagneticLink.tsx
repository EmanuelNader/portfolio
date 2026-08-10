"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { hasFinePointer, prefersReducedMotion, timings } from "@/lib/motion";
import styles from "./MagneticLink.module.css";

type Props = ComponentProps<"a"> & {
  scramble?: boolean;
};

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function MagneticLink({
  children,
  className = "",
  scramble = false,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [label, setLabel] = useState(
    typeof children === "string" ? children : null,
  );
  const original =
    typeof children === "string" ? children : String(children ?? "");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
    };
  }, []);

  const resetTransform = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const runScramble = () => {
    if (!scramble || prefersReducedMotion() || typeof children !== "string") {
      return;
    }
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    const text = original;
    let frame = 0;
    const frames = 4;
    timerRef.current = window.setInterval(() => {
      frame += 1;
      if (frame >= frames) {
        setLabel(text);
        if (timerRef.current != null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }
      setLabel(
        text
          .split("")
          .map((char) =>
            char === " " || char === "·" || char === "é" || char === "É"
              ? char
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ],
          )
          .join(""),
      );
    }, Math.floor(timings.scrambleMs / frames));
  };

  return (
    <a
      {...props}
      ref={ref}
      className={`${styles.link} ${className}`.trim()}
      onMouseEnter={(event) => {
        runScramble();
        onMouseEnter?.(event);
      }}
      onMouseMove={(event) => {
        if (!hasFinePointer() || prefersReducedMotion() || !ref.current) {
          onMouseMove?.(event);
          return;
        }
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const radius = 48;
        if (dist < radius) {
          const strength = 1 - dist / radius;
          const ox = (dx / radius) * timings.magneticMaxPx * strength;
          const oy = (dy / radius) * timings.magneticMaxPx * strength;
          ref.current.style.transform = `translate(${ox}px, ${oy}px)`;
        } else {
          resetTransform();
        }
        onMouseMove?.(event);
      }}
      onMouseLeave={(event) => {
        resetTransform();
        if (scramble && typeof children === "string") setLabel(children);
        onMouseLeave?.(event);
      }}
    >
      {label ?? children}
    </a>
  );
}
