
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

interface AnimatedMaterial {
  material: THREE.Material;
  opacity: number;
  transparent: boolean;
}

function smoothProgress(
  elapsed: number,
  start: number,
  duration: number
) {
  const value = THREE.MathUtils.clamp(
    (elapsed - start) / duration,
    0,
    1
  );

  return value * value * (3 - 2 * value);
}

export default function BrassLantern({
  started,
  position = [0, 2.5, -1],
  scale = 5,
  delay = 3.5,
  phase = 0,
  swingAmplitude = 0.055,
}: Props) {
  const pivot = useRef<THREE.Group>(null);
  const lanternLight = useRef<THREE.PointLight>(null);

  const startTime = useRef<number | null>(null);

  const { scene } = useGLTF(
    "/models/lantern/brass_diya_lantern_4k.glb"
  );

  const {
    model,
    topY,
    lightPosition,
    animatedMaterials,
  } = useMemo(() => {
    const cloned = scene.clone(true);
    const materialRecords: AnimatedMaterial[] = [];

    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;

      const originalMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const clonedMaterials = originalMaterials.map((original) => {
        const material = original.clone();

        materialRecords.push({
          material,
          opacity: material.opacity,
          transparent: material.transparent,
        });

        material.transparent = true;
        material.opacity = 0;

        return material;
      });

      object.material = Array.isArray(object.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    const bounds = new THREE.Box3().setFromObject(cloned);

    const center = new THREE.Vector3();
    const calculatedTopY = bounds.isEmpty()
      ? 0
      : bounds.max.y;

    if (!bounds.isEmpty()) {
      bounds.getCenter(center);
    }

    return {
      model: cloned,
      topY: calculatedTopY,
      lightPosition: center.toArray() as [number, number, number],
      animatedMaterials: materialRecords,
    };
  }, [scene]);

  useFrame(({ clock }) => {
    if (!pivot.current) return;

    if (started && startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed =
      startTime.current !== null
        ? clock.elapsedTime - startTime.current
        : 0;

    const reveal = started
      ? smoothProgress(elapsed, delay, 2)
      : 0;

    pivot.current.visible = reveal > 0;

    animatedMaterials.forEach(
      ({ material, opacity, transparent }) => {
        material.opacity = opacity * reveal;
        material.transparent = reveal < 1 || transparent;
      }
    );

    // Slow, gentle hanging movement.
    const swingTime = Math.max(0, elapsed - delay);

    if (reveal > 0) {
      pivot.current.rotation.z =
        Math.sin(swingTime * 1.8 + phase) *
        swingAmplitude;

      pivot.current.rotation.x =
        Math.sin(swingTime * 1.35 + phase) *
        swingAmplitude *
        0.25;
    }

    // Warm, subtle light flicker.
    const flicker =
      1 +
      Math.sin(elapsed * 7.5 + phase) * 0.045 +
      Math.sin(elapsed * 12.7 + phase) * 0.025;

    if (lanternLight.current) {
      lanternLight.current.intensity =
        reveal * 1.8 * flicker;
    }
  });

  return (
    <group
      ref={pivot}
      position={position}
      scale={scale}
      visible={false}
    >
      <group position={[0, -topY, 0]}>
        <primitive object={model} />

        <pointLight
          ref={lanternLight}
          position={lightPosition}
          color="#ffad50"
          intensity={0}
          distance={4}
          decay={2}
        />
      </group>
    </group>
  );
}

useGLTF.preload(
  "/models/lantern/brass_diya_lantern_4k.glb"
);
