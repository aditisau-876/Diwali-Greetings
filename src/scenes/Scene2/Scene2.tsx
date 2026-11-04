import type { MotionValue } from "framer-motion";
import Rangoli from "./components/Rangoli";
import "./scene2.css";

interface Props {
  progress: MotionValue<number>;
}

export default function Scene2({ progress }: Props) {
  return (
    <div className="scene2">
      <Rangoli progress={progress} />
    </div>
  );
}
