import { useRef, useState } from "react";
import {
    motion,
    useInView,
    useMotionValueEvent,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion";
import BackgroundMusic from "./components/BackgroundMusic";
import Scene1 from "./scenes/Scene1/Scene1";
import Scene2 from "./scenes/Scene2/Scene2";
import Scene4 from "./scenes/Scene4/Scene4";
import Scene5 from "./scenes/Scene5/Scene5";
import Scene6 from "./scenes/Scene6/Scene6";

import TravelingDiyaCanvas from "./scenes/Scene1/TravelingDiyaCanvas";
import GreetingCreator from "./scenes/Scene7_GreetingCreator/GreetingCreator";

import { PHASE } from "./lib/journey";

export default function App() {
    const journeyRef = useRef<HTMLDivElement>(null);

    const inView = useInView(journeyRef, {
        margin: "200px 0px 200px 0px",
    });

    const [templeLive, setTempleLive] = useState(true);
    const [diyaLive, setDiyaLive] = useState(true);
    const [fireworksLive, setFireworksLive] = useState(false);

    // 0 → 1 while the pinned stage is held on screen.
    const { scrollYProgress } = useScroll({
        target: journeyRef,
        offset: ["start start", "end end"],
    });

    // One spring drives every scene, so they all stay in step.
    const progress = useSpring(scrollYProgress, {
        stiffness: 110,
        damping: 28,
        mass: 0.6,
        restDelta: 0.0001,
    });

    // Switch heavy canvases off while they are hidden.
    useMotionValueEvent(progress, "change", (v) => {
        const temple = v < PHASE.crossfade[1] + 0.12;
        const diya = v < PHASE.diyaOut[1] + 0.05;
        const fireworks = v > PHASE.img4[0] - 0.04;
        setTempleLive((prev) => (prev === temple ? prev : temple));
        setDiyaLive((prev) => (prev === diya ? prev : diya));
        setFireworksLive((prev) => (prev === fireworks ? prev : fireworks));
    });

    const templeOpacity = useTransform(progress, [...PHASE.crossfade], [1, 0]);
    const templeScale = useTransform(
        progress,
        [0, PHASE.crossfade[1]],
        [1, 1.06]
    );

    const titleOpacity = useTransform(progress, [...PHASE.titleOut], [1, 0]);
    const titleY = useTransform(progress, [...PHASE.titleOut], [0, -24]);
    const cueOpacity = useTransform(progress, [0, 0.012], [1, 0]);

    // The caption fades in on the rangoli and out again before Scene 4.
    const captionOpacity = useTransform(
        progress,
        [
            PHASE.caption[0],
            PHASE.caption[1],
            PHASE.captionOut[0],
            PHASE.captionOut[1],
        ],
        [0, 1, 1, 0]
    );
    const captionY = useTransform(progress, [...PHASE.caption], [18, 0]);

    // The 3D diya melts away before the palace images take over.
    const diyaOpacity = useTransform(progress, [...PHASE.diyaOut], [1, 0]);

    const exitFade = useTransform(progress, [...PHASE.exit], [0, 1]);

    return (
        <main className="experience">
            <BackgroundMusic />
            {/* MAIN DIWALI JOURNEY: scenes 1, 2, 4 and 5 share one pinned stage */}
            <div ref={journeyRef} className="journey">
                <div className="journey-stage">
                    <motion.div
                        className="stage-layer temple-layer"
                        style={{
                            opacity: templeOpacity,
                            scale: templeScale,
                        }}
                    >
                        <Scene1 active={inView && templeLive} />
                    </motion.div>

                    <div className="stage-layer courtyard-layer">
                        <Scene2 progress={progress} />
                    </div>

                    {/* SCENE 4 - the courtyard pulls back to the palace */}
                    <Scene4 progress={progress} />

                    {/* SCENE 5 - fireworks, drawn in code */}
                    <Scene5
                        progress={progress}
                        active={inView && fireworksLive}
                    />

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
                        className="diya-layer"
                        style={{ opacity: diyaOpacity }}
                    >
                        <TravelingDiyaCanvas
                            progress={progress}
                            active={inView && diyaLive}
                        />
                    </motion.div>

                    <motion.div
                        className="exit-fade"
                        style={{ opacity: exitFade }}
                        aria-hidden="true"
                    />

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

            {/* SCENE 6 - the envelope */}
            <section className="scene6-section" id="scene6">
                <Scene6 message="May this Diwali bring happiness, prosperity and endless light into your life." />
            </section>

            {/* SCENE 7 - personal greeting creator */}
            <section className="greeting-section" id="greeting">
                <GreetingCreator />
            </section>
        </main>
    );
}