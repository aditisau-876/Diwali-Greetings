import { useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import Scene1 from "./scenes/Scene1/Scene1";
import Scene2 from "./scenes/Scene2/Scene2";
import TravelingDiyaCanvas from "./scenes/Scene1/TravelingDiyaCanvas";
import GreetingCreator from "./scenes/Scene7_GreetingCreator/GreetingCreator";
import { PHASE } from "./lib/journey";

export default function App() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const inView = useInView(journeyRef, { margin: "200px 0px 200px 0px" });
  const [templeLive, setTempleLive] = useState(true);

  // 0 → 1 while the pinned stage is held on screen.
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  // One spring drives everything, so the diya and both scenes stay in step.
  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.6,
    restDelta: 0.0001,
  });

  useMotionValueEvent(progress, "change", (v) => {
    const live = v < PHASE.crossfade[1] + 0.12;
    setTempleLive((prev) => (prev === live ? prev : live));
  });

  const templeOpacity = useTransform(progress, [...PHASE.crossfade], [1, 0]);
  const templeScale = useTransform(progress, [0, PHASE.crossfade[1]], [1, 1.06]);

  const titleOpacity = useTransform(progress, [...PHASE.titleOut], [1, 0]);
  const titleY = useTransform(progress, [...PHASE.titleOut], [0, -24]);
  const cueOpacity = useTransform(progress, [0, 0.04], [1, 0]);

  const captionOpacity = useTransform(progress, [...PHASE.caption], [0, 1]);
  const captionY = useTransform(progress, [...PHASE.caption], [18, 0]);
  const exitFade = useTransform(progress, [...PHASE.exit], [0, 1]);

  return (
    <main className="experience">
      <div ref={journeyRef} className="journey">
        <div className="journey-stage">
          <motion.div
            className="stage-layer temple-layer"
            style={{ opacity: templeOpacity, scale: templeScale }}
          >
            <Scene1 active={inView && templeLive} />
          </motion.div>

          <div className="stage-layer courtyard-layer">
            <Scene2 progress={progress} />
          </div>

          <motion.header
            className="hero-title"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            <h1>A Light Within</h1>
            <p>One flame. A thousand lights.</p>
          </motion.header>

          <motion.p
            className="courtyard-caption"
            style={{ opacity: captionOpacity, y: captionY }}
          >
            Light one diya, and the whole courtyard begins to glow.
          </motion.p>

          <motion.div
            className="exit-fade"
            style={{ opacity: exitFade }}
            aria-hidden="true"
          />

          <div className="diya-layer">
            <TravelingDiyaCanvas progress={progress} active={inView} />
          </div>

          <motion.div
            className="scroll-cue"
            style={{ opacity: cueOpacity }}
            aria-hidden="true"
          >
            <span>Scroll</span>
            <i />
          </motion.div>
        </div>
      </div>

      <section className="greeting-section" id="greeting">
        <GreetingCreator />
      </section>
    </main>
  );
}
