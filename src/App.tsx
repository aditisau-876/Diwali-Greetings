import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import Scene1 from "./scenes/Scene1/Scene1";
import Scene2 from "./scenes/Scene2/Scene2";
import GreetingCreator from "./scenes/Scene7_GreetingCreator/GreetingCreator";
import TravelingDiyaCanvas from "./scenes/Scene1/TravelingDiyaCanvas";

export default function App() {
  const journeyRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end start"],
  });

  // Fade out only when the Scene 1 + Scene 2 journey finishes
  const canvasOpacity = useTransform(
    scrollYProgress,
    [0, 0.98, 1],
    [1, 1, 0]
  );

  return (
    <main className="experience">
      <div ref={journeyRef} className="diya-journey">
        <section className="scene-section scene1-section">
          <Scene1 />
        </section>

        <section className="scene-section scene2-section">
          <Scene2 />
        </section>

        <motion.div
          className="traveling-diya-layer"
          style={{ opacity: canvasOpacity }}
        >
          <TravelingDiyaCanvas progress={scrollYProgress} />
        </motion.div>
      </div>

      {/* Scene 7 is OUTSIDE the diya journey */}
      <section className="scene-section greeting-section">
        <GreetingCreator />
      </section>
    </main>
  );
}