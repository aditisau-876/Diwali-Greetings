
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import CourtyardScene from "./CourtyardScene";

export default function ExperienceCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [0, 0, 6],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
    >
      <Suspense fallback={null}>
        <CourtyardScene />
      </Suspense>
    </Canvas>
  );
}
