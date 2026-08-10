/**
 * Build-time bake of the particle field for coarse-pointer / reduced-motion clients.
 * Uses headless Chromium + three.js so mobile never downloads the runtime bundle.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public");
const threeBuildDir = path.join(root, "node_modules/three/build");

const cfg = {
  count: 280,
  opacity: 0.55,
  size: 0.075,
  accentRatio: 0.22,
  accent: 0xb8a6ff,
  neutral: 0x9a9c9f,
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "/", "http://127.0.0.1");

        if (url.pathname.startsWith("/three/")) {
          const fileName = path.basename(url.pathname);
          const filePath = path.join(threeBuildDir, fileName);
          if (!filePath.startsWith(threeBuildDir)) {
            res.writeHead(403);
            res.end("forbidden");
            return;
          }
          const body = await readFile(filePath);
          res.writeHead(200, {
            "Content-Type": "text/javascript; charset=utf-8",
          });
          res.end(body);
          return;
        }

        if (url.pathname === "/render") {
          const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;background:#0D0D0F;overflow:hidden">
    <canvas id="c" style="width:100vw;height:100vh;display:block"></canvas>
    <script type="module">
      import * as THREE from '/three/three.module.js';
      const cfg = ${JSON.stringify(cfg)};
      const width = 1440;
      const height = 900;
      const scale = Number(new URLSearchParams(location.search).get('scale') || '1');
      const canvas = document.getElementById('c');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setClearColor(0x0d0d0f, 1);
      renderer.setPixelRatio(scale);
      renderer.setSize(width, height, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0.35, 0.2, 6);
      camera.lookAt(0, 0, 0);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(cfg.count * 3);
      const colors = new Float32Array(cfg.count * 3);
      const accent = new THREE.Color(cfg.accent);
      const neutral = new THREE.Color(cfg.neutral);
      let seed = 42;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        positions[i3] = (rand() - 0.5) * 10;
        positions[i3 + 1] = (rand() - 0.5) * 7;
        positions[i3 + 2] = (rand() - 0.5) * 8;
        const color = rand() < cfg.accentRatio ? accent : neutral;
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: cfg.size,
        opacity: cfg.opacity,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      points.rotation.y = 0.4;
      scene.add(points);
      renderer.render(scene, camera);
      window.__PARTICLE_READY__ = true;
    </script>
  </body>
</html>`;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
          return;
        }

        res.writeHead(404);
        res.end("not found");
      } catch (error) {
        res.writeHead(500);
        res.end(String(error));
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind export server"));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

async function capture(port, scale) {
  const cssWidth = 1440;
  const cssHeight = 900;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: cssWidth, height: cssHeight },
    deviceScaleFactor: scale,
  });

  page.on("pageerror", (error) => {
    console.error("pageerror", error.message);
  });

  await page.goto(`http://127.0.0.1:${port}/render?scale=${scale}`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__PARTICLE_READY__ === true, null, {
    timeout: 20000,
  });

  const buffer = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: cssWidth, height: cssHeight },
  });
  await browser.close();
  return buffer;
}

const { server, port } = await startServer();
try {
  await mkdir(outDir, { recursive: true });
  const oneX = await capture(port, 1);
  const twoX = await capture(port, 2);
  await writeFile(path.join(outDir, "particle-field.png"), oneX);
  await writeFile(path.join(outDir, "particle-field@2x.png"), twoX);
  console.log("Wrote public/particle-field.png and public/particle-field@2x.png");
} finally {
  server.close();
}
