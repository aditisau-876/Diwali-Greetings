// A small, dependency-free fireworks engine for a 2D canvas.
// Rockets climb with a spark tail, then burst into one of several shell types.

type ShellKind = "peony" | "ring" | "willow" | "chrysanthemum" | "crackle";

interface Rocket {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  age: number;
  life: number;
  hue: number;
  kind: ShellKind;
  scale: number;
  px: number;
  py: number;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  hue: number;
  sat: number;
  light: number;
  drag: number;
  gravity: number;
  twinkle: boolean;
  crackle: boolean;
}

interface Flash {
  x: number;
  y: number;
  r: number;
  age: number;
  life: number;
  hue: number;
}

const HUES = [42, 330, 190, 24, 280, 355, 150, 52];
const MAX_PARTICLES = 2200;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4);

export class FireworkEngine {
  private rockets: Rocket[] = [];
  private particles: Particle[] = [];
  private flashes: Flash[] = [];
  private w = 0;
  private h = 0;
  private ctx: CanvasRenderingContext2D;
  /** Fewer, gentler shells for people who prefer reduced motion. */
  reduced = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, w, h);
  }

  get busy() {
    return (
      this.rockets.length > 0 ||
      this.particles.length > 0 ||
      this.flashes.length > 0
    );
  }

  clear() {
    this.rockets.length = 0;
    this.particles.length = 0;
    this.flashes.length = 0;
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  /** Send one rocket up. All arguments are optional. */
  launch(options: { x?: number; kind?: ShellKind; hue?: number; big?: boolean } = {}) {
    const { w, h } = this;
    if (!w || !h) return;
    const kind =
      options.kind ??
      pick<ShellKind>([
        "peony",
        "peony",
        "chrysanthemum",
        "ring",
        "willow",
        "crackle",
      ]);
    const x = options.x ?? w * rand(0.12, 0.88);
    this.rockets.push({
      x0: x + rand(-w * 0.03, w * 0.03),
      y0: h * 0.84,
      x1: x,
      y1: h * rand(0.12, 0.4),
      age: 0,
      life: rand(0.8, 1.25),
      hue: options.hue ?? pick(HUES),
      kind,
      scale: options.big ? 1.35 : rand(0.8, 1.1),
      px: x,
      py: h * 0.84,
    });
  }

  private explode(r: Rocket) {
    const { w, h } = this;
    const base = Math.min(h * 0.38, w * 0.46) * r.scale;
    const count = Math.round(
      (r.kind === "willow" ? 90 : r.kind === "ring" ? 70 : 120) *
        (this.reduced ? 0.5 : 1),
    );
    const second = (r.hue + pick([0, 0, 40, 160, 200])) % 360;
    const room = MAX_PARTICLES - this.particles.length;

    for (let i = 0; i < Math.min(count, room); i++) {
      let vx: number;
      let vy: number;

      if (r.kind === "ring") {
        const a = (i / count) * Math.PI * 2;
        const squash = 0.55 + 0.4 * Math.sin(r.x1);
        vx = Math.cos(a) * base * 0.95;
        vy = Math.sin(a) * base * 0.95 * squash;
      } else {
        // a shell is a sphere; seen from the side its sparks look like a disc
        const z = Math.random() * 2 - 1;
        const a = Math.random() * Math.PI * 2;
        const flat = Math.sqrt(1 - z * z);
        const speed = base * (r.kind === "willow" ? 0.7 : 1) * rand(0.82, 1);
        vx = Math.cos(a) * flat * speed;
        vy = Math.sin(a) * flat * speed;
      }

      const willow = r.kind === "willow";
      this.particles.push({
        x: r.x1,
        y: r.y1,
        px: r.x1,
        py: r.y1,
        vx,
        vy,
        age: 0,
        life: willow ? rand(2.4, 3.2) : rand(1.3, 2.1),
        size: willow ? 1.4 : rand(1.4, 2.4),
        hue: i % 3 === 0 ? second : r.hue,
        sat: willow ? 85 : 100,
        light: willow ? 66 : 62,
        drag: willow ? 1.5 : r.kind === "chrysanthemum" ? 1.9 : 2.2,
        gravity: h * (willow ? 0.2 : 0.11),
        twinkle: r.kind === "chrysanthemum" || r.kind === "crackle",
        crackle: r.kind === "crackle" && i % 4 === 0,
      });
    }

    this.flashes.push({
      x: r.x1,
      y: r.y1,
      r: base * 0.75,
      age: 0,
      life: 0.45,
      hue: r.hue,
    });
  }

  update(dt: number) {
    // rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.life);
      const e = easeOut(t);
      r.px = r.x0 + (r.x1 - r.x0) * e;
      r.py = r.y0 + (r.y1 - r.y0) * e;

      if (this.particles.length < MAX_PARTICLES) {
        this.particles.push({
          x: r.px,
          y: r.py,
          px: r.px,
          py: r.py,
          vx: rand(-14, 14),
          vy: rand(20, 70),
          age: 0,
          life: rand(0.35, 0.6),
          size: 1.2,
          hue: 40,
          sat: 90,
          light: 70,
          drag: 3,
          gravity: 30,
          twinkle: false,
          crackle: false,
        });
      }

      if (t >= 1) {
        this.explode(r);
        this.rockets.splice(i, 1);
      }
    }

    // sparks
    const next: Particle[] = [];
    for (const p of this.particles) {
      p.age += dt;
      if (p.age >= p.life) {
        if (p.crackle) {
          for (let k = 0; k < 4; k++) {
            next.push({
              x: p.x,
              y: p.y,
              px: p.x,
              py: p.y,
              vx: rand(-90, 90),
              vy: rand(-90, 90),
              age: 0,
              life: rand(0.25, 0.5),
              size: 1.2,
              hue: 48,
              sat: 40,
              light: 92,
              drag: 3,
              gravity: 0,
              twinkle: true,
              crackle: false,
            });
          }
        }
        continue;
      }
      const damp = Math.exp(-p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp + p.gravity * dt;
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      next.push(p);
    }
    this.particles = next.slice(0, MAX_PARTICLES);

    // flashes
    this.flashes = this.flashes.filter((f) => (f.age += dt) < f.life);
  }

  draw(dt: number) {
    const { ctx, w, h } = this;

    // fade what is already there instead of clearing, which leaves soft trails
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt * 11)})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";

    for (const f of this.flashes) {
      const k = 1 - f.age / f.life;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `hsla(${f.hue},100%,80%,${0.3 * k})`);
      g.addColorStop(1, `hsla(${f.hue},100%,60%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineCap = "round";
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      let alpha = Math.pow(k, 1.4);
      if (p.twinkle && Math.random() < 0.3) alpha *= 0.35;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `hsl(${p.hue},${p.sat}%,${p.light}%)`;
      ctx.lineWidth = p.size * (0.6 + 0.4 * k);
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // rocket heads
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffe9b8";
    for (const r of this.rockets) {
      ctx.beginPath();
      ctx.arc(r.px, r.py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}