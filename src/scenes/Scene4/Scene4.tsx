import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import "./Scene4.css";

interface Scene4Props {
  progress: MotionValue<number>;
}

export default function Scene4({ progress }: Scene4Props) {
  // Scene 4 container fades in gently starting at 0.82
  const sceneOpacity = useTransform(
    progress,
    [0.82, 0.86, 1],
    [0, 1, 1]
  );

  // Widen the input windows and create long, overlapping crossfades 
  // so the images blend slowly and smoothly over more scroll distance.

  const image1Opacity = useTransform(
    progress,
    [0.82, 0.87, 0.91, 0.94],
    [0, 1, 1, 0]
  );

  const image2Opacity = useTransform(
    progress,
    [0.89, 0.92, 0.95, 0.98],
    [0, 1, 1, 0]
  );

  const image3Opacity = useTransform(
    progress,
    [0.93, 0.96, 0.99, 1.0],
    [0, 1, 1, 0]
  );

  const image4Opacity = useTransform(
    progress,
    [0.97, 0.995, 1.0],
    [0, 1, 1]
  );

  // Ultra-subtle scale effect to prevent jarring motion on small scrolls
  const imageScale = useTransform(
    progress,
    [0.82, 1.0],
    [1.03, 1.0]
  );

  return (
    <motion.div
      className="scene4-container"
      style={{ opacity: sceneOpacity }}
    >
      <motion.img
        src="/images/courtyard-rangoli-farther.png"
        alt="Diwali-lit palace courtyard"
        className="scene4-image"
        style={{ opacity: image1Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/courtyard-rangoli-farther-1.png"
        alt="An expanded view of the illuminated courtyard"
        className="scene4-image"
        style={{ opacity: image2Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/courtyard-rangoli-farther-2.png"
        alt="The camera approaching the palace"
        className="scene4-image"
        style={{ opacity: image3Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/courtyard-rangoli-farther-3.png"
        alt="The grand palace illuminated for Diwali"
        className="scene4-image"
        style={{ opacity: image4Opacity, scale: imageScale }}
        draggable={false}
      />

      <div className="scene4-shade" />
    </motion.div>
  );
}