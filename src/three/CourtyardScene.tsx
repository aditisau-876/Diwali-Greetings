
export default function CourtyardScene() {
  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[-3, 5, 4]}
        intensity={1.5}
        color="#FFE2B8"
        castShadow
      />

      <pointLight
        position={[0, 1, 2]}
        intensity={3}
        distance={8}
        color="#FFB45C"
      />
    </>
  );
}
