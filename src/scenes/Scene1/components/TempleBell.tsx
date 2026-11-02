
import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  started: boolean;
  position?: [number, number, number];
  scale?: number;
  delay?: number;
  phase?: number;
  swingAmplitude?: number;
}

export default function TempleBell({
  started,
  position = [0, 3, -1],
  scale = 0.008,
  delay = 1,
  phase = 0,
  swingAmplitude = 0.10,
}: Props) {
  const pivot = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);

  const { scene } = useGLTF("/models/bell/temple_bell.glb");

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Log dimensions to help diagnose the model's actual scale.
    cloned.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    console.log("Temple bell dimensions:", size.toArray());
    console.log("Temple bell bounds:", bounds);

    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!pivot.current) return;

    if (started && startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    if (!started || startTime.current === null) {
      pivot.current.visible = false;
      return;
    }

    const elapsed = clock.elapsedTime - startTime.current;

    // Keep the original model visible after its delay.
    pivot.current.visible = elapsed >= delay;

    if (elapsed < delay) return;

    // Gentle continuous swinging.
    const swingTime = elapsed - delay;

    pivot.current.rotation.z =
      Math.sin(swingTime * 2.4 + phase) * swingAmplitude;

    pivot.current.rotation.x =
      Math.sin(swingTime * 1.8 + phase) *
      swingAmplitude *
      0.15;
  });

  return (
    <group
      ref={pivot}
      position={position}
      scale={scale}
      visible={false}
    >
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/bell/temple_bell.glb");
