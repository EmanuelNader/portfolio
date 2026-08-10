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

const PX_PER_PARTICLE = 70;
const MIN_COUNT = 8;
const MAX_COUNT = 48;
const LIFE_DECAY = 0.014;
const DAMPING = 0.985;
const SPEED_MIN = 1.8;
const SPEED_MAX = 5.2;

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

export type DissolveBurstHandle = {
  stop: () => void;
};

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
    window.addEventListener("resize", resize);

    const finish = () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      setDissolveBurstPositions(null);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
