import { useEffect } from "react";
import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { PHASE } from "../../lib/journey";
import "./Scene4.css";

interface Scene4Props {
  progress: MotionValue<number>;
}

const FRAMES = [
  {
    src: "/images/courtyard-rangoli-farther.png",
    alt: "The diya glowing at the heart of the rangoli",
    window: PHASE.img1,
    until: PHASE.img2[1],
  },
  {
    src: "/images/courtyard-rangoli-farther-1.png",
    alt: "The courtyard opens up and fireworks begin in the sky",
    window: PHASE.img2,
    until: PHASE.img3[1],
  },
  {
    src: "/images/courtyard-rangoli-farther-2.png",
    alt: "The camera drifts back toward the palace",
    window: PHASE.img3,
    until: PHASE.img4[1],
  },
  {
    src: "/images/courtyard-rangoli-farther-3.png",
    alt: "The grand palace lit up for Diwali",
    window: PHASE.img4,
    until: PHASE.fireworks[1] + 0.1,
  },
] as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

type FrameData = (typeof FRAMES)[number];

function Frame({
  frame,
  progress,
}: {
  frame: FrameData;
  progress: MotionValue<number>;
}) {
  const [a, b] = frame.window;

  // Each frame dissolves in *over* the previous one and then simply stays.
  // Nothing fades out, so two half-transparent images never dim the middle
  // of a transition. Scrolling back just reverses it.
  const opacity = useTransform(progress, (p) => smooth((p - a) / (b - a)));

  // A slow camera pull-back: the new frame starts a little larger (so it
  // lines up with the one it is replacing) and settles to its natural size.
  const scale = useTransform(progress, (p) => {
    const settle = easeOut((p - a) / (frame.until - a));
    return 1 + 0.13 * (1 - settle);
  });
  const y = useTransform(progress, (p) => {
    const settle = easeOut((p - a) / (frame.until - a));
    return `${-3.5 * (1 - settle)}%`;
  });

  return (
    <motion.img
      src={frame.src}
      alt={frame.alt}
      className="scene4-image"
      style={{ opacity, scale, y }}
      draggable={false}
      decoding="async"
    />
  );
}

export default function Scene4({ progress }: Scene4Props) {
  // The vignette only arrives together with the first frame, so Scenes 1 and
  // 2 keep exactly the look they had before.
  const [s0, s1] = PHASE.img1;
  const shadeOpacity = useTransform(progress, (p) =>
    smooth((p - s0) / (s1 - s0))
  );

  // Decode every frame up front so the first dissolve never stutters.
  useEffect(() => {
    FRAMES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => undefined);
    });
  }, []);

  return (
    <div className="scene4-container">
      {FRAMES.map((frame) => (
        <Frame key={frame.src} frame={frame} progress={progress} />
      ))}
      <motion.div className="scene4-shade" style={{ opacity: shadeOpacity }} />
    </div>
  );
}