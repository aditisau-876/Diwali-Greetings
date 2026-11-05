
import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import "./Scene4.css";

interface Scene4Props {
  progress: MotionValue<number>;
}

export default function Scene4({ progress }: Scene4Props) {
  // Scene 4 starts after the original diya experience reaches 82%.
  const sceneOpacity = useTransform(
    progress,
    [0.82, 0.84, 1],
    [0, 1, 1]
  );

  const image1Opacity = useTransform(
    progress,
    [0.82, 0.835, 0.855, 0.87],
    [0, 1, 1, 0]
  );

  const image2Opacity = useTransform(
    progress,
    [0.855, 0.87, 0.89, 0.905],
    [0, 1, 1, 0]
  );

  const image3Opacity = useTransform(
    progress,
    [0.89, 0.905, 0.925, 0.94],
    [0, 1, 1, 0]
  );

  const image4Opacity = useTransform(
    progress,
    [0.925, 0.94, 1],
    [0, 1, 1]
  );

  const imageScale = useTransform(
    progress,
    [0.82, 1],
    [1.08, 1]
  );

  return (
    <motion.div
      className="scene4-container"
      style={{ opacity: sceneOpacity }}
    >
      <motion.img
        src="/images/scene4-01-courtyard-wide.jpg"
        alt="Diwali-lit palace courtyard"
        className="scene4-image"
        style={{ opacity: image1Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/scene4-02-courtyard-expand.jpg"
        alt="An expanded view of the illuminated courtyard"
        className="scene4-image"
        style={{ opacity: image2Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/scene4-03-palace-approach.jpg"
        alt="The camera approaching the palace"
        className="scene4-image"
        style={{ opacity: image3Opacity, scale: imageScale }}
        draggable={false}
      />

      <motion.img
        src="/images/scene4-04-palace-reveal.jpg"
        alt="The grand palace illuminated for Diwali"
        className="scene4-image"
        style={{ opacity: image4Opacity, scale: imageScale }}
        draggable={false}
      />

      <div className="scene4-shade" />
    </motion.div>
  );
}
