import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { createGreetingCardTexture } from "./greetingCardTexture";
import {
  createDotTexture,
  createFoldTexture,
  createGlowTexture,
  createLinerTexture,
  createSealTexture,
  createShineTexture,
  createTriangle,
} from "./scene6Textures";
import {
  CARD_H,
  CARD_W,
  DEFAULT_MESSAGE,
  ENVELOPE_DURATION,
  ENV_H,
  ENV_W,
} from "./scene6Config";

interface Props {
  opened: boolean;
  onOpen: () => void;
  message?: string;
}

/* ---------------------------------------------------------------
   Easing + timeline helpers. Everything on screen is a pure function
   of one master clock `s` (seconds since opening), so replaying the
   envelope is just running that clock backwards.
--------------------------------------------------------------- */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const win = (s: number, a: number, b: number) => clamp01((s - a) / (b - a));
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) => {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const lerp = THREE.MathUtils.lerp;

/* ---------------------------------------------------------------
   Greeting card texture (waits briefly for the web fonts)
--------------------------------------------------------------- */

function useGreetingTexture(message: string) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;

    const fonts = [
      `italic 500 100px "Cormorant Garamond"`,
      `500 40px "Manrope"`,
    ];
    const ready = Promise.race([
      Promise.all(fonts.map((f) => document.fonts.load(f))).catch(
        () => undefined,
      ),
      new Promise((resolve) => window.setTimeout(resolve, 2000)),
    ]);

    ready.then(() => {
      if (cancelled) return;
      created = createGreetingCardTexture(message);
      setTexture(created);
    });

    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [message]);

  return texture;
}

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}

/* ---------------------------------------------------------------
   Particles
--------------------------------------------------------------- */

interface SparkBurst {
  x: number;
  y: number;
  z: number;
}
interface SparkController {
  queue: SparkBurst[];
}

/** Slow golden motes drifting upward behind everything. */
function Motes({ dot, reduced }: { dot: THREE.Texture; reduced: boolean }) {
  const COUNT = 70;
  const ref = useRef<THREE.Points>(null);

  const seed = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: Math.sin(i * 12.9898) * 0.98,
        y: ((i * 0.6180339) % 1) * 2 - 1,
        z: -1.2 + ((i * 0.37) % 1) * 1.4,
        speed: 0.012 + ((i * 0.173) % 1) * 0.02,
        phase: i * 1.7,
      })),
    [],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3),
    );
    return g;
  }, []);

  useFrame((state) => {
    const points = ref.current;
    if (!points) return;
    const { width, height } = state.viewport;
    points.scale.set(width / 2, height / 2, 1);

    const t = reduced ? 0 : state.clock.elapsedTime;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    seed.forEach((p, i) => {
      const y = ((p.y + 1 + t * p.speed) % 2) - 1;
      attr.setXYZ(i, p.x + Math.sin(t * 0.4 + p.phase) * 0.025, y, p.z);
    });
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={dot}
        color="#ffd9a0"
        size={0.085}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** One-shot gold spark bursts (seal breaking, card emerging). */
function Sparks({
  controller,
  dot,
}: {
  controller: SparkController;
  dot: THREE.Texture;
}) {
  const COUNT = 180;
  const matRef = useRef<THREE.PointsMaterial>(null);
  const state = useRef({
    pos: new Float32Array(COUNT * 3),
    vel: new Float32Array(COUNT * 3),
    age: 99,
    life: 1.9,
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(state.current.pos, 3),
    );
    return g;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const d = state.current;

    while (controller.queue.length) {
      const b = controller.queue.shift();
      if (!b) break;
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 2.6;
        d.pos[i * 3] = b.x + (Math.random() - 0.5) * 0.25;
        d.pos[i * 3 + 1] = b.y + (Math.random() - 0.5) * 0.15;
        d.pos[i * 3 + 2] = b.z;
        d.vel[i * 3] = Math.cos(a) * speed;
        d.vel[i * 3 + 1] = Math.sin(a) * speed * 0.7 + 0.9;
        d.vel[i * 3 + 2] = (Math.random() - 0.3) * 1.2;
      }
      d.age = 0;
    }

    const mat = matRef.current;
    if (d.age >= d.life) {
      if (mat) mat.opacity = 0;
      return;
    }

    d.age += dt;
    const drag = 1 - 1.6 * dt;
    for (let i = 0; i < COUNT; i++) {
      d.vel[i * 3] *= drag;
      d.vel[i * 3 + 1] = d.vel[i * 3 + 1] * drag - 0.9 * dt;
      d.vel[i * 3 + 2] *= drag;
      d.pos[i * 3] += d.vel[i * 3] * dt;
      d.pos[i * 3 + 1] += d.vel[i * 3 + 1] * dt;
      d.pos[i * 3 + 2] += d.vel[i * 3 + 2] * dt;
    }
    geometry.getAttribute("position").needsUpdate = true;
    if (mat) mat.opacity = Math.pow(1 - clamp01(d.age / d.life), 1.5) * 0.95;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        map={dot}
        color="#ffe2a8"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/* ---------------------------------------------------------------
   The stage: envelope, card, light
--------------------------------------------------------------- */

function Stage({
  opened,
  onOpen,
  cardTexture,
  reduced,
}: {
  opened: boolean;
  onOpen: () => void;
  cardTexture: THREE.Texture | null;
  reduced: boolean;
}) {
  const gl = useThree((s) => s.gl);

  const envRef = useRef<THREE.Group>(null);
  const flapRef = useRef<THREE.Group>(null);
  const sealRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const cardRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const clock = useRef(0); // master timeline, 0 → ENVELOPE_DURATION
  const fired = useRef({ seal: false, card: false });
  const shineClock = useRef(0);
  const openedRef = useRef(opened);
  const sparks = useMemo<SparkController>(() => ({ queue: [] }), []);

  useEffect(() => {
    openedRef.current = opened;
    if (opened) gl.domElement.style.cursor = "";
  }, [opened, gl]);

  useEffect(
    () => () => {
      gl.domElement.style.cursor = "";
    },
    [gl],
  );

  /* ---- textures & geometry ---- */
  const assets = useMemo(() => {
    const left = createTriangle([
      [-ENV_W / 2, ENV_H / 2],
      [-ENV_W / 2, -ENV_H / 2],
      [0, 0],
    ]);
    const right = createTriangle([
      [ENV_W / 2, ENV_H / 2],
      [ENV_W / 2, -ENV_H / 2],
      [0, 0],
    ]);
    const bottom = createTriangle([
      [-ENV_W / 2, -ENV_H / 2],
      [ENV_W / 2, -ENV_H / 2],
      [0, 0.2],
    ]);
    const flap = createTriangle([
      [-ENV_W / 2, 0],
      [ENV_W / 2, 0],
      [0, -ENV_H / 2],
    ]);
    return {
      left,
      right,
      bottom,
      flap,
      leftMap: createFoldTexture(left.uv, "#6b1e30", "#531727"),
      rightMap: createFoldTexture(right.uv, "#6b1e30", "#531727"),
      bottomMap: createFoldTexture(bottom.uv, "#7d2638", "#5e1b2c"),
      flapMap: createFoldTexture(flap.uv, "#8a2e42", "#6a2033"),
      liner: createLinerTexture(),
      seal: createSealTexture(),
      dot: createDotTexture(),
      glow: createGlowTexture(),
      shine: createShineTexture(),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(assets).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
        else if ("geometry" in value) value.geometry.dispose();
      });
    },
    [assets],
  );

  /* ---- interaction ---- */
  const setHover = (value: boolean) => {
    if (openedRef.current) return;
    gl.domElement.style.cursor = value ? "pointer" : "";
  };

  /* ---- animation ---- */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const { width: vw, height: vh } = state.viewport;
    const t = state.clock.elapsedTime;

    const speed = (opened ? 1 : -1.6) * (reduced ? 4 : 1);
    clock.current = THREE.MathUtils.clamp(
      clock.current + speed * dt,
      0,
      ENVELOPE_DURATION,
    );
    const s = clock.current;

    if (s < 0.05) {
      fired.current.seal = false;
      fired.current.card = false;
    }

    // layout
    const es = Math.min((vw * 0.7) / ENV_W, (vh * 0.5) / ENV_H);
    const fs = Math.min((vw * 0.8) / CARD_W, (vh * 0.64) / CARD_H);

    // phases
    const idle = 1 - win(s, 0, 0.6);
    const flapP = easeInOut(win(s, 0.3, 1.3));
    const lightP = easeInOut(win(s, 0.9, 2.8));
    const riseP = easeInOut(win(s, 1.2, 2.5));
    const flyP = win(s, 2.5, 4.1);
    const flyE = easeInOut(flyP);
    const dropA = easeInOut(win(s, 1.2, 2.5)) * 0.15;
    const dropB = easeInOut(win(s, 2.4, 4.0)) * 0.95;

    /* envelope */
    const env = envRef.current;
    const envY = -vh * 0.03 - (dropA + dropB) * vh;
    const envScale = es * (1 - 0.15 * dropB);
    if (env) {
      env.position.set(0, envY, 0);
      env.scale.setScalar(envScale);
      env.rotation.set(0, 0, 0);
    }

    if (flapRef.current) {
      flapRef.current.rotation.x = Math.PI * flapP;
      flapRef.current.position.z = 0.11 - 0.16 * flapP;
    }

    // seal pops, then vanishes
    if (sealRef.current) {
      const sc =
        s < 0.12
          ? 1 + (s / 0.12) * 0.25
          : Math.max(0, 1.25 * (1 - win(s, 0.12, 0.4)));
      sealRef.current.scale.setScalar(sc);
      sealRef.current.visible = sc > 0.01;
    }

    // pulsing hint ring around the seal
    if (ringRef.current && ringMat.current) {
      const phase = (t * 0.85) % 1;
      ringRef.current.scale.setScalar(1 + phase * 1.1);
      ringMat.current.opacity = (1 - phase) * 0.5 * idle;
      ringRef.current.visible = idle > 0.01;
    }

    /* bursts of sparks at two beats */
    if (opened && !fired.current.seal && s > 0.18) {
      fired.current.seal = true;
      sparks.queue.push({ x: 0, y: envY, z: 0.6 });
    }
    if (opened && !fired.current.card && s > 1.55) {
      fired.current.card = true;
      sparks.queue.push({ x: 0, y: envY + 1.4 * es, z: 0.7 });
    }

    /* card */
    const card = cardRef.current;
    let cardX = 0;
    let cardY = envY;
    if (card) {
      const riseLocal = lerp(-0.02, 1.95, riseP);
      const insideScale = es * (1 - 0.15 * dropB);
      const insideY = envY + riseLocal * insideScale;
      const insideZ = 0.04 * es;

      const finalY = vh * 0.06;
      const forward = easeOut(win(s, 2.5, 3.2));

      cardX = 0;
      cardY = lerp(insideY, finalY, flyE);
      card.position.set(cardX, cardY, lerp(insideZ, 1.4, forward));
      card.scale.setScalar(lerp(insideScale, fs, easeOutBack(flyP)));
      card.rotation.set(0, 0, lerp(0.05, 0, flyE));
      card.visible = s > 0.6;
    }

    /* shine sweep across the card once it arrives, then occasionally */
    if (s < 4.0) shineClock.current = 0;
    else shineClock.current += dt;
    const sweepPhase = (shineClock.current % 7) / 1.4;
    const sweeping = s >= 4.0 && sweepPhase <= 1;
    assets.shine.offset.x = sweeping
      ? lerp(-0.12, 0.62, easeInOut(sweepPhase))
      : 0.75;

    /* light + halo */
    if (lightRef.current) {
      lightRef.current.position.set(0, envY + 0.5 * es, 1.2);
      lightRef.current.intensity = 14 * lightP * (1 - 0.7 * flyE);
    }
    if (glowRef.current && glowMat.current) {
      glowRef.current.position.set(0, lerp(envY, cardY, flyE), -0.9);
      const size = lerp(es * 6.5, fs * CARD_H * 2.1, flyE);
      glowRef.current.scale.set(size, size, 1);
      glowMat.current.opacity =
        0.2 + Math.sin(t * 0.8) * 0.03 + 0.5 * lightP;
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!openedRef.current) onOpen();
  };

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} color="#ffe9c8" />
      <pointLight
        position={[-4, 1, 3]}
        intensity={30}
        distance={14}
        decay={1.6}
        color="#d99b48"
      />
      <pointLight
        ref={lightRef}
        position={[0, 0, 1.2]}
        intensity={0}
        distance={12}
        decay={1.2}
        color="#ffc66d"
      />

      {/* halo */}
      <mesh ref={glowRef} position={[0, 0, -0.9]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={glowMat}
          map={assets.glow}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <Motes dot={assets.dot} reduced={reduced} />

      {/* envelope */}
      <group
        ref={envRef}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        {/* paper edge */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[ENV_W + 0.03, ENV_H + 0.03, 0.05]} />
          <meshStandardMaterial color="#220a12" roughness={0.8} />
        </mesh>

        {/* inside back */}
        <mesh>
          <planeGeometry args={[ENV_W, ENV_H]} />
          <meshStandardMaterial
            map={assets.liner}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* front folds */}
        <mesh geometry={assets.left.geometry} position={[0, 0, 0.08]}>
          <meshStandardMaterial
            map={assets.leftMap}
            roughness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={assets.right.geometry} position={[0, 0, 0.085]}>
          <meshStandardMaterial
            map={assets.rightMap}
            roughness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={assets.bottom.geometry} position={[0, 0, 0.1]}>
          <meshStandardMaterial
            map={assets.bottomMap}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* flap: maroon outside, patterned lining inside */}
        <group ref={flapRef} position={[0, ENV_H / 2, 0.11]}>
          <mesh geometry={assets.flap.geometry}>
            <meshStandardMaterial
              map={assets.flapMap}
              roughness={0.5}
              side={THREE.FrontSide}
            />
          </mesh>
          <mesh geometry={assets.flap.geometry}>
            <meshStandardMaterial
              map={assets.liner}
              roughness={0.7}
              side={THREE.BackSide}
            />
          </mesh>
        </group>

        {/* gold seal */}
        <group ref={sealRef} position={[0, -0.02, 0.2]}>
          <mesh>
            <circleGeometry args={[0.27, 48]} />
            <meshStandardMaterial
              map={assets.seal}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[0.27, 0.022, 12, 48]} />
            <meshStandardMaterial
              color="#c99a4b"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          <mesh ref={ringRef} position={[0, 0, -0.01]}>
            <ringGeometry args={[0.3, 0.33, 48]} />
            <meshBasicMaterial
              ref={ringMat}
              color="#ffd89a"
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* greeting card (separate from the envelope so it can grow freely) */}
      <group ref={cardRef} visible={false}>
        <mesh>
          <boxGeometry args={[CARD_W + 0.05, CARD_H + 0.05, 0.035]} />
          <meshStandardMaterial
            color="#d5aa59"
            metalness={0.65}
            roughness={0.3}
            emissive="#7a4e16"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh position={[0, 0, 0.0185]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial
            map={cardTexture ?? undefined}
            color={cardTexture ? "#ffffff" : "#f3e6c8"}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial
            map={assets.shine}
            transparent
            opacity={0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Sparks controller={sparks} dot={assets.dot} />
    </>
  );
}

/* ---------------------------------------------------------------
   Public component
--------------------------------------------------------------- */

export default function DiwaliEnvelope3D({
  opened,
  onOpen,
  message = DEFAULT_MESSAGE,
}: Props) {
  const texture = useGreetingTexture(message);
  const reduced = usePrefersReducedMotion();
  const handleOpen = useCallback(() => onOpen(), [onOpen]);

  return (
    <Canvas
      className="diwali-3d-canvas"
      camera={{ position: [0, 0, 7.5], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Stage
        opened={opened}
        onOpen={handleOpen}
        cardTexture={texture}
        reduced={reduced}
      />
    </Canvas>
  );
}