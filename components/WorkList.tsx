"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  revealDissolveElement,
  runAssembleBurst,
  runDissolveBurst,
  setDissolveElementsVisible,
  spawnAssembleParticles,
  spawnDissolveParticles,
} from "@/lib/dissolveBurst";
import type { Project } from "@/lib/projects";
import { hasFinePointer, prefersReducedMotion, timings } from "@/lib/motion";
import { StaggerIn } from "./StaggerIn";
import { WorkBreakdown } from "./WorkBreakdown";
import { WorkPreviewCard } from "./WorkPreviewCard";
import styles from "./WorkList.module.css";

type Props = {
  projects: Project[];
  /** Synced from the URL by PortfolioShell (layout-stable). */
  activeSlug?: string | null;
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

export function WorkList({ projects, activeSlug = null }: Props) {
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState<string | null>(activeSlug);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [listRevealing, setListRevealing] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dissolveCanvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const animatingRef = useRef(false);
  /** Block hover preview after close until the cursor moves (overlay unmount would otherwise re-trigger it). */
  const suppressHoverRef = useRef(false);
  const cursorRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const coldOpenRef = useRef(Boolean(activeSlug));
  /** True while waiting for layout so assemble can measure invisible targets. */
  const assemblePendingRef = useRef(false);

  const openProject = projects.find((p) => p.slug === openSlug) ?? null;

  useEffect(() => {
    setFinePointer(hasFinePointer());
    const mq = window.matchMedia("(pointer: fine)");
    const onChange = () => setFinePointer(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // After close, ignore the synthetic mouseenter from overlay unmount until the cursor actually moves.
  useEffect(() => {
    const unlock = () => {
      if (!suppressHoverRef.current) return;
      suppressHoverRef.current = false;
    };
    window.addEventListener("pointermove", unlock, { passive: true });
    return () => window.removeEventListener("pointermove", unlock);
  }, []);

  // Keep overlay in sync with the URL (back/forward). Skip while assemble/dissolve is running
  // so closing does not unmount the panel mid-animation.
  useEffect(() => {
    if (animatingRef.current) return;
    setOpenSlug(activeSlug ?? null);
  }, [activeSlug]);

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
    if (
      !finePointer ||
      openSlug ||
      animatingRef.current ||
      suppressHoverRef.current
    ) {
      return;
    }
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
    if (suppressHoverRef.current) {
      suppressHoverRef.current = false;
    }
    if (!finePointer || !preview?.visible || openSlug || animatingRef.current) {
      return;
    }
    cursorRef.current = { x: event.clientX, y: event.clientY };
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(updatePreviewPosition);
    }
  };

  const onRowLeave = () => {
    if (!finePointer) return;
    hidePreview();
  };

  const playAssembleOpen = useCallback(async (slug: string) => {
    const reduce = prefersReducedMotion();
    setListRevealing(false);
    hidePreview();

    if (reduce) {
      setOpenSlug(slug);
      router.push(`/work/${slug}`, { scroll: false });
      return;
    }

    assemblePendingRef.current = true;
    animatingRef.current = true;
    setOpenSlug(slug);
    router.push(`/work/${slug}`, { scroll: false });

    // Wait for panel mount + layout (targets already opacity:0 via useLayoutEffect).
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    assemblePendingRef.current = false;

    const panel = panelRef.current;
    const canvas = dissolveCanvasRef.current;
    if (!panel || !canvas) {
      animatingRef.current = false;
      return;
    }

    if (overlayRef.current) {
      overlayRef.current.style.transition = `opacity ${timings.assembleListFadeMs}ms ease-out`;
      overlayRef.current.style.opacity = "1";
    }

    const { particles, skippedKeys } = spawnAssembleParticles(panel);
    // Out-of-view targets (e.g. RESULT below the fold) skip particles.
    for (const key of skippedKeys) {
      revealDissolveElement(panel, key);
    }

    await runAssembleBurst(canvas, particles, {
      onElementReady: (key) => {
        revealDissolveElement(panel, key);
      },
    });

    // Ensure every dissolve target is fully visible after assembly.
    setDissolveElementsVisible(panel, true);
    animatingRef.current = false;
  }, [hidePreview, router]);

  const closeBreakdown = useCallback(async () => {
    const reduce = prefersReducedMotion();
    const panel = panelRef.current;

    const finishClose = () => {
      if (panel) {
        panel.style.transition = "";
        panel.style.transform = "";
        panel.style.opacity = "";
        panel.style.filter = "";
        setDissolveElementsVisible(panel, true);
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = "";
        overlayRef.current.style.opacity = "";
      }
      // Clear preview and suppress hover until the next real pointer move —
      // otherwise unmounting the overlay fires mouseenter on the row under the cursor.
      setPreview(null);
      suppressHoverRef.current = true;
      setListRevealing(false);
      setOpenSlug(null);
      animatingRef.current = false;
      router.push("/", { scroll: false });
    };

    if (reduce || !panel) {
      finishClose();
      return;
    }

    animatingRef.current = true;

    const particles = spawnDissolveParticles(panel);
    const canvas = dissolveCanvasRef.current;

    // Content fades while the burst takes over.
    panel.style.transition = `opacity ${timings.dissolveFadeMs}ms ease-out`;
    panel.style.opacity = "0";
    if (overlayRef.current) {
      overlayRef.current.style.transition = `opacity ${timings.dissolveFadeMs}ms ease-out`;
      overlayRef.current.style.opacity = "0";
    }

    // Work list starts arriving while particles are mid-flight.
    window.setTimeout(() => {
      setListRevealing(true);
    }, timings.dissolveListDelayMs);

    if (canvas) {
      await runDissolveBurst(canvas, particles);
    }

    finishClose();
  }, [router]);

  const onRowClick = (project: Project, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (animatingRef.current) return;
    void playAssembleOpen(project.slug);
  };

  useLayoutEffect(() => {
    if (!openSlug) return;

    // Direct load / hard navigation to /work/[slug]: show breakdown with no assembly.
    if (coldOpenRef.current) {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
      const panel = panelRef.current;
      if (panel) setDissolveElementsVisible(panel, true);
      coldOpenRef.current = false;
      return;
    }

    // Animated open: hide dissolve targets before paint so we can measure them.
    if (assemblePendingRef.current) {
      const panel = panelRef.current;
      if (panel) setDissolveElementsVisible(panel, false);
      if (overlayRef.current) overlayRef.current.style.opacity = "0";
    }
  }, [openSlug]);

  const listClassName = [
    styles.list,
    openSlug && !listRevealing ? styles.listHidden : "",
    listRevealing ? styles.listReveal : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <ul ref={listRef} className={listClassName}>
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
          onOpen={() => {
            if (animatingRef.current) return;
            void playAssembleOpen(preview.project.slug);
          }}
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
          <canvas
            ref={dissolveCanvasRef}
            className={styles.dissolveCanvas}
            aria-hidden="true"
          />
        </div>
      ) : null}
    </>
  );
}
