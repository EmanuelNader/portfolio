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
  onOpen?: () => void;
};

export function WorkPreviewCard({
  project,
  x,
  y,
  visible,
  cardRef,
  onOpen,
}: Props) {
  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${visible ? styles.visible : ""}`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
      aria-hidden={!visible}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen && visible ? 0 : undefined}
      onClick={
        onOpen
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpen();
            }
          : undefined
      }
      onKeyDown={
        onOpen
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
    >
      <div className={styles.thumb} data-slug={project.slug} />
      <p className={styles.fact}>{project.fact}</p>
    </div>
  );
}
