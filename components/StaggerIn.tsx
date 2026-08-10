"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./StaggerIn.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  /** When true, animate on mount (hero). Otherwise on first intersection. */
  immediate?: boolean;
  delayMs?: number;
};

export function StaggerIn({
  children,
  className = "",
  immediate = false,
  delayMs = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.classList.add(styles.visible);
      return;
    }

    if (immediate) {
      requestAnimationFrame(() => node.classList.add(styles.visible));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.classList.add(styles.visible);
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={`${styles.item} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
