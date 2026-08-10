"use client";

import type { Ref } from "react";
import type { Project } from "@/lib/projects";
import { CountUp } from "./CountUp";
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

      {project.repoUrl ? (
        <p className={styles.repo}>
          <a
            href={project.repoUrl}
            className={styles.repoLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      ) : null}

      <dl className={styles.facts}>
        <div>
          <dt>Stack</dt>
          <dd>{project.stack.join(" · ")}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd className={styles.description}>{project.description}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>
            {project.metric ? (
              <p className={styles.metric} data-metric>
                <span className={styles.metricValue}>
                  {project.metric.prefix ?? ""}
                  <CountUp value={project.metric.value} />
                  {project.metric.suffix ?? ""}
                </span>
                <span className={styles.metricLabel}>{project.metric.label}</span>
              </p>
            ) : (
              project.result
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
