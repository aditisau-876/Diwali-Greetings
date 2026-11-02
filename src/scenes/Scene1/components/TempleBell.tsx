
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
  position = [0, 0, 0],
  scale = 1,
  delay = 0,
  phase = 0,
  swingAmplitude = 0.12,
}: Props) {
  const pivot = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);

  const { scene } = useGLTF("/models/bell/temple_bell.glb");

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    // Normalize model height to 2 units.
    const factor = 2 / size.y;

    cloned.scale.multiplyScalar(factor);

    // Center the model horizontally and vertically.
    cloned.position.set(
      -center.x * factor,
      -center.y * factor,
      -center.z * factor
    );

    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.visible = true;
      }
    });

    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!pivot.current) return;

    if (!started) {
      pivot.current.visible = false;
      startTime.current = null;
      return;
    }

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;

    if (elapsed < delay) {
      pivot.current.visible = false;
      return;
    }

    pivot.current.visible = true;

    const swingTime = elapsed - delay;

    // Gentle continuous hanging motion.
    const primarySwing =
      Math.sin(swingTime * 1.8 + phase) * swingAmplitude;

    const secondarySwing =
      Math.sin(swingTime * 1.15 + phase) * swingAmplitude * 0.12;

    pivot.current.rotation.z = primarySwing;
    pivot.current.rotation.x = secondarySwing;
  });

  return (
    <group ref={pivot} position={position} scale={scale} visible={false}>
      <primitive object={model} position={[0, -1, 0]} />
    </group>
  );
}

useGLTF.preload("/models/bell/temple_bell.glb");
