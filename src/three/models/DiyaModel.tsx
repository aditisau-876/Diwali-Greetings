
import { useGLTF } from "@react-three/drei";

export default function DiyaModel() {
  const { scene } = useGLTF("/models/diya/diya.glb");

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/models/diya/diya.glb");
