"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Project } from "@/lib/projects";
import { hasFinePointer, prefersReducedMotion, timings } from "@/lib/motion";
import { StaggerIn } from "./StaggerIn";
import { WorkBreakdown } from "./WorkBreakdown";
import { WorkPreviewCard } from "./WorkPreviewCard";
import styles from "./WorkList.module.css";

type Props = {
  projects: Project[];
  initialSlug?: string | null;
};

type PreviewState = {
  project: Project;
  x: number;
  y: number;
  visible: boolean;
};

function clampPreview(x: number, y: number) {
  const cardW = 220;
  const cardH = 180;
  const pad = 16;
  const maxX = window.innerWidth - cardW - pad;
  const maxY = window.innerHeight - cardH - pad;
  return {
    x: Math.min(Math.max(pad, x + 18), maxX),
    y: Math.min(Math.max(pad, y + 18), maxY),
  };
}

export function WorkList({ projects, initialSlug = null }: Props) {
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState<string | null>(initialSlug);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [finePointer, setFinePointer] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstRectRef = useRef<DOMRect | null>(null);
  const animatingRef = useRef(false);
  const targetRef = useRef<HTMLAnchorElement | null>(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const openProject = projects.find((p) => p.slug === openSlug) ?? null;

  useEffect(() => {
    setFinePointer(hasFinePointer());
    const mq = window.matchMedia("(pointer: fine)");
    const onChange = () => setFinePointer(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setOpenSlug(initialSlug ?? null);
  }, [initialSlug]);

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void closeBreakdown();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSlug]);

  const hidePreview = useCallback(() => {
    setPreview((current) =>
      current ? { ...current, visible: false } : null,
    );
  }, []);

  const updatePreviewPosition = useCallback(() => {
    rafRef.current = null;
    setPreview((current) => {
      if (!current) return current;
      const next = clampPreview(cursorRef.current.x, cursorRef.current.y);
      const lag = 0.22;
      return {
        ...current,
        x: current.x + (next.x - current.x) * lag,
        y: current.y + (next.y - current.y) * lag,
      };
    });
  }, []);

  const onRowEnter = (project: Project, event: React.MouseEvent) => {
    if (!finePointer || openSlug || animatingRef.current) return;
    cursorRef.current = { x: event.clientX, y: event.clientY };
    const pos = clampPreview(event.clientX, event.clientY);
    setPreview({
      project,
      x: pos.x,
      y: pos.y,
      visible: true,
    });
  };

  const onRowMove = (event: React.MouseEvent) => {
    if (!finePointer || !preview?.visible || openSlug) return;
    cursorRef.current = { x: event.clientX, y: event.clientY };
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(updatePreviewPosition);
    }
  };

  const onRowLeave = () => {
    if (!finePointer) return;
    hidePreview();
  };

  const playFlipOpen = useCallback(async (slug: string) => {
    const reduce = prefersReducedMotion();
    setOpenSlug(slug);
    hidePreview();
    router.push(`/work/${slug}`, { scroll: false });

    if (reduce) return;

    animatingRef.current = true;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const first = firstRectRef.current;
    const panel = panelRef.current;
    if (!first || !panel) {
      animatingRef.current = false;
      return;
    }

    const last = panel.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;

    panel.style.transformOrigin = "top left";
    panel.style.transition = "none";
    panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    if (overlayRef.current) {
      overlayRef.current.style.opacity = "0";
    }

    requestAnimationFrame(() => {
      panel.style.transition = `transform ${timings.flipMs}ms ease-out`;
      panel.style.transform = "translate(0, 0) scale(1, 1)";
      if (overlayRef.current) {
        overlayRef.current.style.transition = `opacity ${timings.flipMs}ms ease-out`;
        overlayRef.current.style.opacity = "1";
      }
    });

    window.setTimeout(() => {
      panel.style.transition = "";
      panel.style.transform = "";
      animatingRef.current = false;
    }, timings.flipMs + 20);
  }, [hidePreview, router]);

  const closeBreakdown = useCallback(async () => {
    const reduce = prefersReducedMotion();
    const panel = panelRef.current;
    const target = targetRef.current;

    router.push("/", { scroll: false });

    if (reduce || !panel || !target) {
      setOpenSlug(null);
      return;
    }

    animatingRef.current = true;
    const first = panel.getBoundingClientRect();
    const last = target.getBoundingClientRect();
    const dx = last.left - first.left;
    const dy = last.top - first.top;
    const sx = last.width / first.width;
    const sy = last.height / first.height;

    panel.style.transformOrigin = "top left";
    panel.style.transition = `transform ${timings.flipMs}ms ease-out`;
    panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    if (overlayRef.current) {
      overlayRef.current.style.transition = `opacity ${timings.flipMs}ms ease-out`;
      overlayRef.current.style.opacity = "0";
    }

    window.setTimeout(() => {
      setOpenSlug(null);
      animatingRef.current = false;
    }, timings.flipMs);
  }, [router]);

  const onRowClick = (project: Project, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (animatingRef.current) return;

    const row = event.currentTarget;
    targetRef.current = row;

    if (previewRef.current && preview?.visible) {
      firstRectRef.current = previewRef.current.getBoundingClientRect();
    } else {
      firstRectRef.current = row.getBoundingClientRect();
    }

    void playFlipOpen(project.slug);
  };

  useLayoutEffect(() => {
    if (!openSlug || !initialSlug) return;
    if (overlayRef.current) overlayRef.current.style.opacity = "1";
  }, [initialSlug, openSlug]);

  return (
    <>
      <ul className={styles.list}>
        {projects.map((project, index) => (
          <li key={project.slug} className={styles.row}>
            <StaggerIn delayMs={index * 60}>
              <a
                href={`/work/${project.slug}`}
                className={styles.link}
                onMouseEnter={(event) => onRowEnter(project, event)}
                onMouseMove={onRowMove}
                onMouseLeave={onRowLeave}
                onClick={(event) => onRowClick(project, event)}
              >
                <h3 className={styles.name}>{project.name}</h3>
              </a>
            </StaggerIn>
          </li>
        ))}
      </ul>

      {finePointer && preview ? (
        <WorkPreviewCard
          cardRef={previewRef}
          project={preview.project}
          x={preview.x}
          y={preview.y}
          visible={preview.visible && !openSlug}
        />
      ) : null}

      {openProject ? (
        <div className={styles.overlayRoot} role="dialog" aria-modal="true">
          <div
            ref={overlayRef}
            className={styles.backdrop}
            onClick={() => void closeBreakdown()}
          />
          <div className={styles.stage}>
            <WorkBreakdown
              panelRef={panelRef}
              project={openProject}
              onClose={() => void closeBreakdown()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
