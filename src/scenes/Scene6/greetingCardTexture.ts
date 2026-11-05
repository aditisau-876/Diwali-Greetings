import * as THREE from "three";

const W = 1400;
const H = 1567; // matches the 2.1 x 2.35 card

const MAROON = "#5b1a28";
const GOLD = "#b4893f";
const GOLD_LIGHT = "#dcb96f";
const BROWN = "#5a4033";

const SERIF = `"Cormorant Garamond", Georgia, serif`;
const DEVANAGARI = `"Noto Serif Devanagari", "Kohinoor Devanagari", "Nirmala UI", "Mangal", serif`;

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:!?-]*$/, "") + "…";
    return kept;
  }
  return lines;
}

function corner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sx: number,
  sy: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = GOLD;
  [70, 48, 26].forEach((r, i) => {
    ctx.globalAlpha = 0.85 - i * 0.2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI / 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = GOLD;
  ctx.save();
  ctx.translate(92, 92);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
  ctx.restore();
}

function petals(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  count: number,
  width: number,
  fill: string,
  stroke: string,
  offset = 0,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(offset);
  for (let i = 0; i < count; i++) {
    ctx.rotate((Math.PI * 2) / count);
    ctx.beginPath();
    ctx.ellipse(0, -(inner + outer) / 2, width, (outer - inner) / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // halo
  const halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 300);
  halo.addColorStop(0, "rgba(255,196,110,0.55)");
  halo.addColorStop(1, "rgba(255,196,110,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 300, 0, Math.PI * 2);
  ctx.fill();

  // ring of dots
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 262, cy + Math.sin(a) * 262, i % 2 ? 3 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(180,137,63,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 242, 0, Math.PI * 2);
  ctx.stroke();

  petals(ctx, cx, cy, 150, 236, 24, 24, "rgba(91,26,40,0.10)", "rgba(180,137,63,0.85)");
  petals(ctx, cx, cy, 92, 160, 12, 36, "rgba(220,185,111,0.28)", "rgba(180,137,63,0.9)", Math.PI / 12);

  ctx.fillStyle = "#f8edd6";
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawDiya(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // flame glow
  const glow = ctx.createRadialGradient(cx, cy - 22, 4, cx, cy - 22, 120);
  glow.addColorStop(0, "rgba(255,190,80,0.7)");
  glow.addColorStop(1, "rgba(255,190,80,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy - 22, 120, 0, Math.PI * 2);
  ctx.fill();

  // bowl
  const bowl = ctx.createLinearGradient(cx, cy, cx, cy + 62);
  bowl.addColorStop(0, "#d99a52");
  bowl.addColorStop(1, "#8a5126");
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.moveTo(cx - 66, cy + 14);
  ctx.bezierCurveTo(cx - 62, cy + 70, cx + 62, cy + 70, cx + 66, cy + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#edb877";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 66, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b3b1c";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 50, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // flame
  const flame = ctx.createRadialGradient(cx, cy - 6, 2, cx, cy - 22, 52);
  flame.addColorStop(0, "#fff7d1");
  flame.addColorStop(0.45, "#ffb43a");
  flame.addColorStop(1, "#e2561a");
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 74);
  ctx.bezierCurveTo(cx + 30, cy - 34, cx + 24, cy + 4, cx, cy + 6);
  ctx.bezierCurveTo(cx - 24, cy + 4, cx - 30, cy - 34, cx, cy - 74);
  ctx.closePath();
  ctx.fill();
}

export function createGreetingCardTexture(message: string) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create greeting card texture.");

  // paper
  const paper = ctx.createLinearGradient(0, 0, W, H);
  paper.addColorStop(0, "#fbf3e1");
  paper.addColorStop(0.55, "#f5e8cd");
  paper.addColorStop(1, "#ead7b0");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle =
      Math.random() < 0.5 ? "rgba(120,80,30,0.035)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.8, 1.8);
  }

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
  vignette.addColorStop(0, "rgba(120,70,20,0)");
  vignette.addColorStop(1, "rgba(120,70,20,0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 3;
  ctx.strokeRect(68, 68, W - 136, H - 136);

  corner(ctx, 68, 68, 1, 1);
  corner(ctx, W - 68, 68, -1, 1);
  corner(ctx, 68, H - 68, 1, -1);
  corner(ctx, W - 68, H - 68, -1, -1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // emblem
  const cx = W / 2;
  drawMandala(ctx, cx, 385);
  drawDiya(ctx, cx, 395);

  // title
  ctx.fillStyle = MAROON;
  ctx.font = `italic 500 176px ${SERIF}`;
  ctx.shadowColor = "rgba(180,137,63,0.35)";
  ctx.shadowBlur = 14;
  ctx.fillText("Happy Diwali", cx, 790);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#a77b35";
  ctx.font = `500 64px ${DEVANAGARI}`;
  ctx.fillText("शुभ दीपावली", cx, 890);

  // divider
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(430, 955);
  ctx.lineTo(650, 955);
  ctx.moveTo(750, 955);
  ctx.lineTo(970, 955);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.save();
  ctx.translate(cx, 955);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();

  // message
  ctx.fillStyle = BROWN;
  ctx.font = `italic 500 62px ${SERIF}`;
  const lines = wrap(ctx, message, 940, 5);
  const lineHeight = 84;
  const startY = 1135 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));

  // sign-off
  ctx.fillStyle = "#9b7138";
  ctx.font = `italic 500 56px ${SERIF}`;
  ctx.fillText("With love & light", cx, 1405);

  ctx.fillStyle = GOLD;
  [-28, 0, 28].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(cx + dx, 1450, dx === 0 ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
