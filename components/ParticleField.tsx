"use client";

import { useEffect, useRef } from "react";
import { getDissolveBurstPositions } from "@/lib/fieldPulseBridge";
import { particleFieldConfig as cfg } from "@/lib/particleField";
import styles from "./ParticleField.module.css";

type Props = {
  /** When true, canvas is fixed and covers the viewport (phase 6). */
  fullPage?: boolean;
  /** External pause signal (visibility / intersection). */
  paused?: boolean;
};

const PULSE_RADIUS = 40;
const PULSE_BOOST = 0.15;
const PULSE_DECAY = 0.94;

export function ParticleField({ fullPage = false, paused = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let points: import("three").Points | null = null;
    let geometry: import("three").BufferGeometry | null = null;
    let material: import("three").PointsMaterial | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      target.x = ((event.clientX / w) * 2 - 1) * cfg.cameraRangeX;
      target.y = (-(event.clientY / h) * 2 + 1) * cfg.cameraRangeY;
    };

    const resize = () => {
      if (!renderer || !camera || !container) return;
      const width = fullPage ? window.innerWidth : container.clientWidth;
      const height = fullPage ? window.innerHeight : container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    void (async () => {
      const THREE = await import("three");
      if (disposed || !containerRef.current) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = 6;

      geometry = new THREE.BufferGeometry();
      // Resting positions live in `targets`; geometry starts clustered at origin.
      const targets = new Float32Array(cfg.count * 3);
      const positions = new Float32Array(cfg.count * 3);
      const baseColors = new Float32Array(cfg.count * 3);
      const colors = new Float32Array(cfg.count * 3);
      const pulse = new Float32Array(cfg.count);
      const accent = new THREE.Color(cfg.accent);
      const neutral = new THREE.Color(cfg.neutral);
      const scratch = new THREE.Vector3();

      for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        targets[i3] = (Math.random() - 0.5) * 10;
        targets[i3 + 1] = (Math.random() - 0.5) * 7;
        targets[i3 + 2] = (Math.random() - 0.5) * 8;
        const color = Math.random() < cfg.accentRatio ? accent : neutral;
        baseColors[i3] = color.r;
        baseColors[i3 + 1] = color.g;
        baseColors[i3 + 2] = color.b;
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      material = new THREE.PointsMaterial({
        size: cfg.size,
        opacity: cfg.opacity,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        sizeAttenuation: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.className = styles.canvas;
      canvas.setAttribute("aria-hidden", "true");
      container.appendChild(canvas);

      resize();
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", resize);

      const startTime = performance.now();
      let introDone = false;

      const tick = () => {
        if (disposed) return;
        raf = requestAnimationFrame(tick);
        if (
          pausedRef.current ||
          !renderer ||
          !scene ||
          !camera ||
          !points ||
          !geometry ||
          !material
        ) {
          return;
        }
        // Parallax + drift run throughout the intro — no handoff seam after assembly.
        pointer.x += (target.x - pointer.x) * cfg.cameraLerp;
        pointer.y += (target.y - pointer.y) * cfg.cameraLerp;
        camera.position.x = pointer.x;
        camera.position.y = pointer.y;
        camera.lookAt(0, 0, 0);
        points.rotation.y += cfg.rotationSpeed;

        if (!introDone) {
          const t = Math.min(
            1,
            (performance.now() - startTime) / cfg.introDurationMs,
          );
          const e = 1 - Math.pow(1 - t, 3);
          for (let i = 0; i < targets.length; i++) {
            positions[i] = targets[i] * e;
          }
          geometry.attributes.position.needsUpdate = true;
          if (t === 1) {
            introDone = true;
          }
        }

        // Field absorption cue: brighten ambient points near dissolve-burst particles.
        const burst = getDissolveBurstPositions();
        let colorsDirty = false;
        if (burst && burst.length > 0) {
          const w = window.innerWidth || 1;
          const h = window.innerHeight || 1;
          points.updateMatrixWorld(true);
          const r2 = PULSE_RADIUS * PULSE_RADIUS;

          for (let i = 0; i < cfg.count; i++) {
            const i3 = i * 3;
            scratch.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            scratch.applyMatrix4(points.matrixWorld);
            scratch.project(camera);

            const sx = (scratch.x * 0.5 + 0.5) * w;
            const sy = (-scratch.y * 0.5 + 0.5) * h;

            for (let b = 0; b < burst.length; b++) {
              const dx = sx - burst[b]!.x;
              const dy = sy - burst[b]!.y;
              if (dx * dx + dy * dy <= r2) {
                pulse[i] = Math.min(1, pulse[i] + PULSE_BOOST);
                break;
              }
            }
          }
        }

        for (let i = 0; i < cfg.count; i++) {
          if (pulse[i] <= 0.001) {
            if (pulse[i] !== 0) {
              pulse[i] = 0;
              const i3 = i * 3;
              colors[i3] = baseColors[i3];
              colors[i3 + 1] = baseColors[i3 + 1];
              colors[i3 + 2] = baseColors[i3 + 2];
              colorsDirty = true;
            }
            continue;
          }
          pulse[i] *= PULSE_DECAY;
          const i3 = i * 3;
          const p = pulse[i];
          colors[i3] = baseColors[i3] + (1 - baseColors[i3]) * p * 0.55;
          colors[i3 + 1] = baseColors[i3 + 1] + (1 - baseColors[i3 + 1]) * p * 0.55;
          colors[i3 + 2] = baseColors[i3 + 2] + (1 - baseColors[i3 + 2]) * p * 0.55;
          colorsDirty = true;
        }

        if (colorsDirty) {
          geometry.attributes.color.needsUpdate = true;
        }

        // Slight opacity lift while any pulse is hot.
        let maxPulse = 0;
        for (let i = 0; i < cfg.count; i++) {
          if (pulse[i] > maxPulse) maxPulse = pulse[i];
        }
        material.opacity = cfg.opacity + maxPulse * 0.15;

        renderer.render(scene, camera);
      };
      tick();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      geometry?.dispose();
      material?.dispose();
    };
  }, [fullPage]);

  return (
    <div
      ref={containerRef}
      className={fullPage ? styles.fullPage : styles.heroScoped}
      aria-hidden="true"
    />
  );
}
