import { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useElementSize } from "../../../lib/useElementSize";
import { PHASE, RANGOLI_CENTER, coverRect } from "../../../lib/journey";

interface Props {
  progress: MotionValue<number>;
}

export default function Rangoli({ progress }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref);

  // The image box is sized exactly like `object-fit: cover`, and it zooms from
  // the rangoli's own centre — so that point never moves on screen. That is the
  // spot the diya lands on.
  const rect = coverRect(width || 1, height || 1);
  const scale = useTransform(progress, [...PHASE.zoom], [1.12, 1]);

  return (
    <div ref={ref} className="rangoli-container">
      <motion.img
        src="/images/courtyard-rangoli.png"
        alt="A rangoli glowing with diyas in a palace courtyard"
        className="rangoli-image"
        draggable={false}
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          scale,
          transformOrigin: `${RANGOLI_CENTER.x * 100}% ${RANGOLI_CENTER.y * 100}%`,
        }}
      />
      <div className="rangoli-shade" />
    </div>
  );
}
