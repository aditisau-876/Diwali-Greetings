
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import TempleEnvironment from "./components/TempleEnvironment";
import TempleBell from "./components/TempleBell";
import BrassLantern from "./components/BrassLantern";

interface Props {
  started: boolean;
  active?: boolean;
}

interface SceneProps {
  started: boolean;
}

function SceneObjects({ started }: SceneProps) {
  return (
    <>
      <TempleEnvironment started={started} />

      <ambientLight intensity={0.12} color="#d6a77a" />
      <directionalLight
        position={[-3, 5, 4]}
        intensity={0.10}
        color="#ffc78c"
      />

      {/* Hanging temple bells */}
      
<TempleBell
  started={started}
  position={[-2.4, 1.8, -1.5]}
  scale={1.8}
  delay={1.5}
  phase={0}
  swingAmplitude={0.12}
/>

<TempleBell
  started={started}
  position={[-4.0, 2.0, -2]}
  scale={1.05}
  delay={2.1}
  phase={1.2}
  swingAmplitude={0.10}
/>

<TempleBell
  started={started}
  position={[2.4, 3.1, -1.5]}
  scale={1}
  delay={2.7}
  phase={2.1}
  swingAmplitude={0.12}
/>
<TempleBell
  started={started}
  position={[6.0, 1.5, -1.5]}
  scale={1}
  delay={2.7}
  phase={2.1}
  swingAmplitude={0.12}
/>
<TempleBell
  started={started}
  position={[3.4, 1.0, -1.5]}
  scale={2.5}
  delay={2.7}
  phase={2.1}
  swingAmplitude={0.12}
/>

      {/* Multiple hanging brass lanterns */}
      <BrassLantern
        started={started}
        position={[-4.1, 2.50, -0.50]}
        scale={6.5}
        delay={3.0}
        phase={0}
        swingAmplitude={0.05}
      />

      <BrassLantern
        started={started}
        position={[-1.6, 3.15, -1.4]}
        scale={5}
        delay={3.4}
        phase={1.3}
        swingAmplitude={0.06}
      />

      <BrassLantern
        started={started}
        position={[0, 2.35, -1.8]}
        scale={5}
        delay={3.8}
        phase={2.1}
        swingAmplitude={0.045}
      />

      <BrassLantern
        started={started}
        position={[1.7, 3.15, -1.4]}
        scale={5}
        delay={4.2}
        phase={0.7}
        swingAmplitude={0.06}
      />

      <BrassLantern
        started={started}
        position={[4.4, 2.5, -0.8]}
        scale={5}
        delay={4.6}
        phase={2.7}
        swingAmplitude={0.05}
      />

      {/* Main diya */}
      
    </>
  );
}

export default function Scene1Canvas({ started, active = true }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [0, 2.1, 8],
        fov: 42,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <SceneObjects started={started} />
      </Suspense>
    </Canvas>
  );
}
