
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  started: boolean;
}

export default function TempleEnvironment({ started }: Props) {
  const ambientLight = useRef<THREE.AmbientLight>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!started) {
      if (ambientLight.current) {
        ambientLight.current.intensity = 0;
      }
      return;
    }

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;

    const progress = THREE.MathUtils.clamp(
      elapsed / 2.5,
      0,
      1
    );

    const reveal = progress * progress * (3 - 2 * progress);

    if (ambientLight.current) {
      ambientLight.current.intensity = 0.08 + reveal * 0.12;
    }
  });

  return (
    <>
      {/* Subtle warm environmental illumination */}
      <ambientLight
        ref={ambientLight}
        color="#ffc18b"
        intensity={0}
      />

      <hemisphereLight
        args={["#50301e", "#100805", 0.06]}
      />
    </>
  );
}
