import { setDissolveBurstPositions } from "@/lib/fieldPulseBridge";

export type DissolveParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  r: number;
  g: number;
  b: number;
};

export type AssembleParticle = {
  key: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  delayMs: number;
  startMs: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  done: boolean;
};

const PX_PER_PARTICLE = 70;
const MIN_COUNT = 8;
const MAX_COUNT = 48;
const LIFE_DECAY = 0.014;
const DAMPING = 0.985;
const SPEED_MIN = 1.8;
const SPEED_MAX = 5.2;
const ASSEMBLE_DURATION_MS = 500;
const ASSEMBLE_STAGGER_MAX_MS = 120;
const SPAWN_OFFSET_MIN = 60;
const SPAWN_OFFSET_MAX = 140;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseCssColor(color: string): { r: number; g: number; b: number } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { r: 235, g: 234, b: 230 };
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return { r: data[0] ?? 235, g: data[1] ?? 234, b: data[2] ?? 230 };
}

function countForArea(width: number, height: number) {
  return clamp(Math.round((width * height) / PX_PER_PARTICLE), MIN_COUNT, MAX_COUNT);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function setupCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  return resize;
}

/** Spawn dissolve particles from `[data-dissolve]` elements inside the panel. */
export function spawnDissolveParticles(panel: HTMLElement): DissolveParticle[] {
  const nodes = panel.querySelectorAll<HTMLElement>("[data-dissolve]");
  const particles: DissolveParticle[] = [];

  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const count = countForArea(rect.width, rect.height);
    const color = parseCssColor(getComputedStyle(el).color);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;
      const angle = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5) * 0.9;
      const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.8,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.8,
        life: 1,
        radius: 1.4 + Math.random() * 1.8,
        r: color.r,
        g: color.g,
        b: color.b,
      });
    }
  });

  return particles;
}

/** True when a meaningful slice of the element is visible in the panel + viewport. */
function isDissolveTargetInView(el: HTMLElement, panel: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;

  const panelRect = panel.getBoundingClientRect();
  const viewTop = Math.max(0, panelRect.top);
  const viewBottom = Math.min(window.innerHeight, panelRect.bottom);
  const viewLeft = Math.max(0, panelRect.left);
  const viewRight = Math.min(window.innerWidth, panelRect.right);

  const visibleH =
    Math.min(rect.bottom, viewBottom) - Math.max(rect.top, viewTop);
  const visibleW =
    Math.min(rect.right, viewRight) - Math.max(rect.left, viewLeft);

  return visibleH > 8 && visibleW > 8;
}

export type AssembleSpawnResult = {
  particles: AssembleParticle[];
  /** Targets outside the visible panel — skip particles; reveal immediately. */
  skippedKeys: string[];
};

/**
 * Spawn assemble particles that fly in from outside each in-view
 * `[data-dissolve]` element toward a random point inside that element's rect.
 * Out-of-view targets (e.g. RESULT below the panel fold) are skipped.
 */
export function spawnAssembleParticles(panel: HTMLElement): AssembleSpawnResult {
  const nodes = panel.querySelectorAll<HTMLElement>("[data-dissolve]");
  const particles: AssembleParticle[] = [];
  const skippedKeys: string[] = [];
  const now = performance.now();

  nodes.forEach((el) => {
    const key = el.dataset.dissolve || "item";
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    if (!isDissolveTargetInView(el, panel)) {
      skippedKeys.push(key);
      return;
    }

    const count = countForArea(rect.width, rect.height);
    const color = parseCssColor(getComputedStyle(el).color);

    for (let i = 0; i < count; i++) {
      const tx = rect.left + Math.random() * rect.width;
      const ty = rect.top + Math.random() * rect.height;
      const angle = Math.random() * Math.PI * 2;
      const offset =
        SPAWN_OFFSET_MIN +
        Math.random() * (SPAWN_OFFSET_MAX - SPAWN_OFFSET_MIN);
      const sx = tx + Math.cos(angle) * offset;
      const sy = ty + Math.sin(angle) * offset;
      particles.push({
        key,
        x: sx,
        y: sy,
        sx,
        sy,
        tx,
        ty,
        delayMs: Math.random() * ASSEMBLE_STAGGER_MAX_MS,
        startMs: now,
        radius: 1.4 + Math.random() * 1.8,
        r: color.r,
        g: color.g,
        b: color.b,
        done: false,
      });
    }
  });

  return { particles, skippedKeys };
}

/**
 * Run the dissolve burst on a fixed full-viewport canvas.
 * Resolves when all particles die (or immediately if empty).
 */
export function runDissolveBurst(
  canvas: HTMLCanvasElement,
  particles: DissolveParticle[],
): Promise<void> {
  return new Promise((resolve) => {
    if (particles.length === 0) {
      setDissolveBurstPositions(null);
      resolve();
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDissolveBurstPositions(null);
      resolve();
      return;
    }

    let raf = 0;
    let alive = [...particles];
    let settled = false;
    const resize = setupCanvas(canvas, ctx);
    window.addEventListener("resize", resize);

    const finish = () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      setDissolveBurstPositions(null);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      resolve();
    };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const next: DissolveParticle[] = [];
      const bridge: { x: number; y: number }[] = [];

      for (const p of alive) {
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= LIFE_DECAY;
        if (p.life <= 0) continue;

        next.push(p);
        bridge.push({ x: p.x, y: p.y });

        const alpha = Math.max(0, p.life);
        const radius = p.radius * (0.35 + 0.65 * alpha);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      alive = next;
      setDissolveBurstPositions(bridge.length ? bridge : null);

      if (alive.length === 0) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  });
}

type AssembleOptions = {
  /** Called once when every particle for a given data-dissolve key has landed. */
  onElementReady?: (key: string) => void;
};

/**
 * Assemble particles into their targets, then resolve when all have landed.
 * Fires `onElementReady(key)` as each element's particles finish so the real
 * DOM text can cross-fade in.
 */
export function runAssembleBurst(
  canvas: HTMLCanvasElement,
  particles: AssembleParticle[],
  options: AssembleOptions = {},
): Promise<void> {
  return new Promise((resolve) => {
    if (particles.length === 0) {
      setDissolveBurstPositions(null);
      resolve();
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDissolveBurstPositions(null);
      resolve();
      return;
    }

    let raf = 0;
    let settled = false;
    const active = [...particles];
    const readyKeys = new Set<string>();
    const keys = new Set(active.map((p) => p.key));
    const resize = setupCanvas(canvas, ctx);
    window.addEventListener("resize", resize);

    const finish = () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      setDissolveBurstPositions(null);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      resolve();
    };

    const tick = () => {
      const now = performance.now();
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const bridge: { x: number; y: number }[] = [];
      const remainingByKey = new Map<string, number>();
      for (const key of keys) remainingByKey.set(key, 0);

      for (const p of active) {
        if (p.done) continue;

        const elapsed = now - p.startMs - p.delayMs;
        if (elapsed < 0) {
          remainingByKey.set(p.key, (remainingByKey.get(p.key) ?? 0) + 1);
          continue;
        }

        const t = clamp(elapsed / ASSEMBLE_DURATION_MS, 0, 1);
        const e = easeOutCubic(t);
        p.x = p.sx + (p.tx - p.sx) * e;
        p.y = p.sy + (p.ty - p.sy) * e;

        const alpha = e;
        const radius = p.radius * (0.35 + 0.65 * alpha);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        bridge.push({ x: p.x, y: p.y });

        if (t >= 1) {
          p.done = true;
        } else {
          remainingByKey.set(p.key, (remainingByKey.get(p.key) ?? 0) + 1);
        }
      }

      for (const key of keys) {
        if (readyKeys.has(key)) continue;
        if ((remainingByKey.get(key) ?? 0) === 0) {
          readyKeys.add(key);
          options.onElementReady?.(key);
        }
      }

      setDissolveBurstPositions(bridge.length ? bridge : null);

      if (readyKeys.size === keys.size) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  });
}

/** Hide dissolve targets for measurement/assembly (keeps layout). */
export function setDissolveElementsVisible(
  panel: HTMLElement,
  visible: boolean,
) {
  panel.querySelectorAll<HTMLElement>("[data-dissolve]").forEach((el) => {
    el.style.opacity = visible ? "" : "0";
    el.style.transition = visible ? "opacity 200ms ease-out" : "none";
  });
}

export function revealDissolveElement(panel: HTMLElement, key: string) {
  const el = panel.querySelector<HTMLElement>(`[data-dissolve="${key}"]`);
  if (!el) return;
  el.style.transition = "opacity 200ms ease-out";
  el.style.opacity = "1";
}
