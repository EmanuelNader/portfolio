"use client";

import type { Ref } from "react";
import type { Project } from "@/lib/projects";
import styles from "./WorkPreviewCard.module.css";

type Props = {
  project: Project;
  x: number;
  y: number;
  visible: boolean;
  cardRef?: Ref<HTMLDivElement>;
};

export function WorkPreviewCard({
  project,
  x,
  y,
  visible,
  cardRef,
}: Props) {
  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${visible ? styles.visible : ""}`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
      aria-hidden={!visible}
    >
      <div className={styles.thumb} data-slug={project.slug} />
      <p className={styles.fact}>{project.fact}</p>
    </div>
  );
}
