import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MotionValue } from "framer-motion";

import Diya from "./components/Diya";

interface Props {
  progress: MotionValue<number>;
  active: boolean;
}

// The canvas fills the pinned stage, so its pixels line up 1:1 with the
// temple and rangoli layers underneath it.
export default function TravelingDiyaCanvas({ progress, active }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.1, 8], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.12} color="#d6a77a" />
        <directionalLight position={[-3, 5, 4]} intensity={0.1} color="#ffc78c" />
        <Diya started={true} travelProgress={progress} />
      </Suspense>
    </Canvas>
  );
}
