import { useEffect, useRef } from "react";
import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { PHASE } from "../../lib/journey";
import { FireworkEngine } from "./fireworks";
import "./Scene5.css";

interface Scene5Props {
  progress: MotionValue<number>;
  /** Pause everything while the scene is off-screen. */
  active: boolean;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export default function Scene5({ progress, active }: Scene5Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A darker sky helps the live fireworks stand out from the painted ones.
  const skyDim = useTransform(
    progress,
    [PHASE.img4[1], PHASE.fireworks[1]],
    [0, 1]
  );
  const layerOpacity = useTransform(
    progress,
    [PHASE.img4[0], PHASE.img4[1]],
    [0, 1]
  );
  const captionOpacity = useTransform(
    progress,
    [...PHASE.fireworksCaption],
    [0, 1, 1, 0]
  );
  const captionY = useTransform(
    progress,
    [PHASE.fireworksCaption[0], PHASE.fireworksCaption[1]],
    [16, 0]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new FireworkEngine(ctx);
    engine.reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      engine.resize(w, h, dpr);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);

    const timers: number[] = [];
    let raf = 0;
    let last = performance.now();
    let nextShell = 0.4;
    let lastP = progress.get();
    let scrollBudget = 0;
    let sinceScrollShell = 1;
    let finaleDone = false;

    const finale = () => {
      for (let i = 0; i < 12; i++) {
        timers.push(
          window.setTimeout(() => {
            engine.launch({
              x: engine.reduced ? undefined : (0.1 + 0.8 * (i / 11)) * canvas.clientWidth,
              big: i % 3 === 0,
            });
          }, i * 190)
        );
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const p = progress.get();
      const [from, to] = PHASE.fireworks;
      const intensity = smooth((p - from) / (to - from));

      // the show: a steady rhythm of shells, busier as you scroll in
      if (intensity > 0.02) {
        nextShell -= dt;
        if (nextShell <= 0) {
          engine.launch();
          const rate = (engine.reduced ? 0.5 : 1.7) * intensity;
          nextShell = (1 / rate) * (0.6 + Math.random() * 0.8);
        }
      }

      // scrolling itself sets off extra shells
      sinceScrollShell += dt;
      scrollBudget += Math.abs(p - lastP);
      lastP = p;
      if (intensity > 0.2 && scrollBudget > 0.0045 && sinceScrollShell > 0.18) {
        engine.launch();
        scrollBudget = 0;
        sinceScrollShell = 0;
      }

      // one grand finale near the end; scrolling back re-arms it
      if (p > PHASE.finale && !finaleDone) {
        finaleDone = true;
        finale();
      } else if (p < PHASE.fireworks[1] && finaleDone) {
        finaleDone = false;
      }

      if (intensity <= 0.02 && !engine.busy) {
        // nothing to show; keep the loop cheap
      } else {
        engine.update(dt);
        engine.draw(dt);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      observer.disconnect();
      engine.clear();
    };
  }, [active, progress]);

  return (
    <motion.div className="scene5" style={{ opacity: layerOpacity }}>
      <motion.div className="scene5-sky" style={{ opacity: skyDim }} />
      <canvas ref={canvasRef} className="scene5-canvas" aria-hidden="true" />
      <motion.p
        className="scene5-caption"
        style={{ opacity: captionOpacity, y: captionY }}
      >
        May every sky light up for you.
      </motion.p>
    </motion.div>
  );
}