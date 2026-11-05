import * as THREE from "three";

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available.");
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function grain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  alpha: number,
) {
  for (let i = 0; i < count; i++) {
    const light = Math.random() < 0.5;
    ctx.fillStyle = light
      ? `rgba(255,240,215,${alpha})`
      : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  }
}

/** Soft round sprite for particles. */
export function createDotTexture() {
  const { canvas, ctx } = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(canvas);
}

/** Warm halo that sits behind the envelope and card. */
export function createGlowTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,200,110,0.95)");
  g.addColorStop(0.35, "rgba(235,140,60,0.4)");
  g.addColorStop(0.7, "rgba(160,60,40,0.12)");
  g.addColorStop(1, "rgba(120,30,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas);
}

/** Narrow diagonal highlight; its offset is animated to sweep across the card. */
export function createShineTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.transform(1, 0, -0.3, 1, 0.3 * 128, 0);
  const g = ctx.createLinearGradient(216, 0, 296, 0);
  g.addColorStop(0, "rgba(255,244,214,0)");
  g.addColorStop(0.5, "rgba(255,244,214,0.85)");
  g.addColorStop(1, "rgba(255,244,214,0)");
  ctx.fillStyle = g;
  ctx.fillRect(216, -20, 80, 300);
  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(0.5, 1);
  texture.offset.x = 0.75; // parked: nothing visible
  return texture;
}

/** Gold wax seal with a lotus emblem. */
export function createSealTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(100, 90, 10, 128, 128, 128);
  g.addColorStop(0, "#f6dc9c");
  g.addColorStop(0.6, "#d4a85a");
  g.addColorStop(1, "#8f6428");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(90,50,15,0.55)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(128, 128);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -48, 17, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120,70,20,0.28)";
    ctx.fill();
    ctx.strokeStyle = "rgba(90,50,15,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(128, 128, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#7a1f2c";
  ctx.fill();
  return toTexture(canvas);
}

/** Inside of the envelope: deep burgundy with a faint gold lattice. */
export function createLinerTexture() {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#2f0d18");
  g.addColorStop(1, "#1c0710");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(212,173,98,0.16)";
  ctx.lineWidth = 1.5;
  const step = 64;
  for (let i = -size; i < size * 2; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(212,173,98,0.28)";
  for (let x = 0; x < size; x += step) {
    for (let y = 0; y < size; y += step) {
      ctx.beginPath();
      ctx.arc(x + step / 2, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  grain(ctx, size, size, 2500, 0.05);
  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export type Point = [number, number];

/** Flat triangle whose UVs span its bounding box; faces +Z. */
export function createTriangle(points: Point[]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const uv: Point[] = points.map(([x, y]) => [(x - minX) / w, (y - minY) / h]);

  const area =
    (points[1][0] - points[0][0]) * (points[2][1] - points[0][1]) -
    (points[2][0] - points[0][0]) * (points[1][1] - points[0][1]);
  const order = area >= 0 ? [0, 1, 2] : [0, 2, 1];

  const positions: number[] = [];
  const uvs: number[] = [];
  order.forEach((i) => {
    positions.push(points[i][0], points[i][1], 0);
    uvs.push(uv[i][0], uv[i][1]);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), 2),
  );
  geometry.computeVertexNormals();
  return { geometry, uv };
}

/** Paper texture for one envelope fold, with a gold inset border. */
export function createFoldTexture(
  uv: Point[],
  from: string,
  to: string,
) {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  grain(ctx, size, size, 4000, 0.045);

  const px = uv.map(([u, v]) => [u * size, (1 - v) * size] as Point);
  const cx = (px[0][0] + px[1][0] + px[2][0]) / 3;
  const cy = (px[0][1] + px[1][1] + px[2][1]) / 3;

  const trace = (k: number) => {
    ctx.beginPath();
    px.forEach(([x, y], i) => {
      const X = cx + (x - cx) * k;
      const Y = cy + (y - cy) * k;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.closePath();
  };

  ctx.lineJoin = "round";
  trace(0.93);
  ctx.strokeStyle = "rgba(226,186,110,0.8)";
  ctx.lineWidth = 5;
  ctx.stroke();
  trace(0.87);
  ctx.strokeStyle = "rgba(226,186,110,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTexture(canvas);
}
