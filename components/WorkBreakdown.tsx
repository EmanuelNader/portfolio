"use client";

import type { Ref } from "react";
import type { Project } from "@/lib/projects";
import styles from "./WorkBreakdown.module.css";

type Props = {
  project: Project;
  onClose: () => void;
  panelRef?: Ref<HTMLElement>;
};

export function WorkBreakdown({ project, onClose, panelRef }: Props) {
  return (
    <article
      ref={panelRef}
      className={styles.panel}
      aria-labelledby={`work-${project.slug}-title`}
    >
      <button type="button" className={styles.close} onClick={onClose}>
        Close
      </button>

      <div className={styles.thumb} data-slug={project.slug} aria-hidden="true" />

      <h3 id={`work-${project.slug}-title`} className={styles.title}>
        {project.name}
      </h3>

      <dl className={styles.facts}>
        <div>
          <dt>Role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>Stack</dt>
          <dd>{project.stack.join(" · ")}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>{project.result}</dd>
        </div>
      </dl>

      {project.metric ? (
        <p className={styles.metric} data-metric>
          <span className={styles.metricValue}>
            {project.metric.prefix ?? ""}
            <span data-count-to={project.metric.value}>
              {project.metric.value}
            </span>
            {project.metric.suffix ?? ""}
          </span>
          <span className={styles.metricLabel}>{project.metric.label}</span>
        </p>
      ) : null}

      <p className={styles.writeup}>{project.writeup}</p>
    </article>
  );
}
