import { useMemo, useRef } from "react";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { revealProgress } from "../hooks/useScene1Animation";
import type { MotionValue } from "framer-motion";
import {
  PHASE,
  RANGOLI_CENTER,
  TEMPLE_SPOT,
  coverRect,
  smootherstep,
} from "../../../lib/journey";

interface Props {
  started: boolean;
  travelProgress?: MotionValue<number>;
}

interface AnimatedMaterial {
  material: THREE.Material;
  originalOpacity: number;
  originalTransparent: boolean;
}

// ---------------------------------------------------------------- tweakables
const DIYA_TILT_X = -0.20;
const MODEL_DIAMETER = 2.2;  // width of the clay bowl in model units
const START_SIZE = 0.27;     // diya width in the temple, as a fraction of stage height
const END_SIZE = 0.1;        // diya width on the rangoli, as a fraction of the image width
const LIGHT_BASE = 2.2;      // flame light brightness
const GLOW_BASE = 0.55;      // glow sprite brightness
// ---------------------------------------------------------------------------

// ---------- procedural clay grain (used as a bump map) ----------
let clayNoiseTexture: THREE.CanvasTexture | null = null;
function getClayNoise(): THREE.CanvasTexture {
  if (clayNoiseTexture) return clayNoiseTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  const layer = (res: number, alpha: number) => {
    const c = document.createElement("canvas");
    c.width = c.height = res;
    const cx = c.getContext("2d")!;
    const img = cx.createImageData(res, res);
    for (let i = 0; i < res * res; i++) {
      const v = Math.random() * 255;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(c, 0, 0, size, size);
  };
  layer(16, 0.35); // large uneven lumps
  layer(64, 0.3);  // medium patches
  layer(256, 0.35); // fine grain
  layer(512, 0.25); // pores

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  clayNoiseTexture = tex;
  return tex;
}

// ---------- soft round glow texture ----------
function makeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,190,110,1)");
  g.addColorStop(0.18, "rgba(255,140,50,0.55)");
  g.addColorStop(0.5, "rgba(255,90,20,0.16)");
  g.addColorStop(1.0, "rgba(255,60,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// ---------- realistic flame shader ----------
const flameVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMinY;
  uniform float uHeight;
  uniform float uSeed;
  varying float vH;
  varying vec3 vN;
  varying vec3 vV;

  void main() {
    float h = clamp((position.y - uMinY) / max(uHeight, 0.0001), 0.0, 1.0);
    vH = h;

    vec3 p = position;
    float sway = h * h;
    p.x += (sin(uTime * 6.3 + h * 3.0 + uSeed) * 0.5 +
            sin(uTime * 11.1 + h * 5.0 + uSeed * 2.0) * 0.3) * 0.05 * uHeight * sway;
    p.z += (cos(uTime * 5.1 + h * 2.5 + uSeed) * 0.5 +
            sin(uTime * 9.7 + h * 4.0) * 0.25) * 0.04 * uHeight * sway;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uLayer;   // 0 = outer, 1 = inner core
  uniform float uSeed;
  varying float vH;
  varying vec3 vN;
  varying vec3 vV;

  void main() {
    float h = vH;

    vec3 blue   = vec3(0.10, 0.22, 0.90);
    vec3 yellow = vec3(1.00, 0.72, 0.22);
    vec3 orange = vec3(1.00, 0.40, 0.04);
    vec3 red    = vec3(0.72, 0.10, 0.015);

    vec3 col = mix(blue, yellow, smoothstep(0.00, 0.18, h));
    col = mix(col, orange, smoothstep(0.18, 0.55, h));
    col = mix(col, red, smoothstep(0.55, 1.00, h));

    // inner core is warmer and brighter near the bottom
    col = mix(col, vec3(1.0, 0.78, 0.30), uLayer * 0.55 * (1.0 - h));

    float facing = abs(dot(normalize(vN), normalize(vV)));
    float edge = pow(facing, 1.5);

    float flick = 0.9 + 0.1 * sin(uTime * 17.0 + uSeed)
                    + 0.05 * sin(uTime * 31.0 + h * 6.0);

    float alpha = edge
                * (1.0 - smoothstep(0.72, 1.0, h))
                * smoothstep(0.0, 0.05, h + 0.04);

    alpha *= mix(0.80, 0.65, uLayer);

    gl_FragColor = vec4(col * 1.05, alpha * uReveal * flick);
  }
`;

function createFlameMaterial(
  mesh: THREE.Mesh,
  layer: number,
  seed: number
): THREE.ShaderMaterial {
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox!;
  const mat = new THREE.ShaderMaterial({
    vertexShader: flameVertex,
    fragmentShader: flameFragment,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uLayer: { value: layer },
      uSeed: { value: seed },
      uMinY: { value: bb.min.y },
      uHeight: { value: bb.max.y - bb.min.y },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: layer > 0 ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  });
  return mat;
}

export default function Diya({ started, travelProgress }: Props) {
  const group = useRef<THREE.Group>(null);
  const flameLight = useRef<THREE.PointLight>(null);
  const glowTight = useRef<THREE.Sprite>(null);
  const glowWide = useRef<THREE.Sprite>(null);
  const startTime = useRef<number | null>(null);
  const gust = useRef({ value: 0, target: 0, next: 0 });
  const landed = useRef(0);

  const { camera, size } = useThree();
  const scratch = useRef({
    point: new THREE.Vector3(),
    dir: new THREE.Vector3(),
  });

  const { scene } = useGLTF("/models/diya/diya.glb");

  const {
    model,
    animatedMaterials,
    flameMeshes,
    flameMaterials,
    flamePos,
    glowTexture,
  } = useMemo(() => {
    const cloned = scene.clone(true);

    const materials: AnimatedMaterial[] = [];
    const flames: THREE.Mesh[] = [];
    const flameMats: THREE.ShaderMaterial[] = [];
    const clayNoise = getClayNoise();

    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const lname = object.name.toLowerCase();
      const isFlame = lname.includes("flame");

      if (isFlame) {
        const isInner = lname.includes("inner") || lname.includes("core");
        const fm = createFlameMaterial(
          object,
          isInner ? 1 : 0,
          flames.length * 1.7
        );
        object.material = fm;
        object.castShadow = false;
        object.receiveShadow = false;
        object.renderOrder = isInner ? 11 : 10;
        flames.push(object);
        flameMats.push(fm);
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;

      const originalMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const clonedMaterials = originalMaterials.map((original) => {
        const material = original.clone();

        if ("color" in material) {
          const stdMat = material as THREE.MeshStandardMaterial;
          stdMat.color.lerp(new THREE.Color("#803217"), 0.7);
          stdMat.color.multiplyScalar(0.65);
          stdMat.roughness = 0.92;
          stdMat.metalness = 0.03;

          stdMat.bumpMap = clayNoise;
          stdMat.bumpScale = 0.9;
          stdMat.envMapIntensity = 0.35;
          stdMat.needsUpdate = true;
        }

        const originalOpacity = material.opacity;
        const originalTransparent = material.transparent;

        material.transparent = true;
        material.opacity = 0;

        materials.push({ material, originalOpacity, originalTransparent });
        return material;
      });

      object.material = Array.isArray(object.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    cloned.updateMatrixWorld(true);
    const pos = new THREE.Vector3(-1.04, 0.8, 0);
    if (flames.length > 0) {
      const box = new THREE.Box3();
      flames.forEach((f) => box.expandByObject(f));
      const c = new THREE.Vector3();
      box.getCenter(c);
      pos.copy(c);
    }

    return {
      model: cloned,
      animatedMaterials: materials,
      flameMeshes: flames,
      flameMaterials: flameMats,
      flamePos: pos,
      glowTexture: makeGlowTexture(),
    };
  }, [scene]);

  useFrame(({ clock }, delta) => {
    if (started && startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed =
      startTime.current !== null ? clock.elapsedTime - startTime.current : 0;

    const diyaReveal = started ? revealProgress(elapsed, 4.5, 2.0) : 0;
    const flameReveal = started ? revealProgress(elapsed, 6.2, 1.8) : 0;
    const fullFlame = diyaReveal * flameReveal;

    animatedMaterials.forEach(
      ({ material, originalOpacity, originalTransparent }) => {
        material.opacity = originalOpacity * diyaReveal;
        material.transparent = diyaReveal < 1 || originalTransparent;
      }
    );
    
if (group.current) {
  group.current.visible = diyaReveal > 0;

  // Travel only happens inside its own scroll window. Before it the diya
  // rests in the temple; after it the diya stays put on the rangoli, so the
  // diya can never wander into the rest of the page.
  const raw = travelProgress?.get() ?? 0;
  const [t0, t1] = PHASE.travel;
  const t = smootherstep((raw - t0) / (t1 - t0));

  const W = size.width;
  const H = size.height;
  const rect = coverRect(W, H);

  const startX = W * TEMPLE_SPOT.x;
  const startY = H * TEMPLE_SPOT.y;
  const endX = rect.x + rect.w * RANGOLI_CENTER.x;
  const endY = rect.y + rect.h * RANGOLI_CENTER.y;

  // A soft rise and sway mid-flight, so it feels carried rather than dragged.
  const lift = Math.sin(Math.PI * t) * H * 0.05;
  const sway = Math.sin(Math.PI * 2 * t) * W * 0.012;

  const px = THREE.MathUtils.lerp(startX, endX, t) + sway;
  const py = THREE.MathUtils.lerp(startY, endY, t) - lift;

  const startPx = Math.min(H * START_SIZE, W * 0.5);
  const endPx = Math.min(rect.w * END_SIZE, W * 0.4);
  const diameterPx = THREE.MathUtils.lerp(startPx, endPx, t);

  // Screen pixel -> point on the z = 0 plane in front of the camera.
  const { point, dir } = scratch.current;
  point.set((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(camera);
  dir.copy(point).sub(camera.position).normalize();
  const dist = -camera.position.z / dir.z;
  group.current.position.copy(camera.position).addScaledVector(dir, dist);

  const fov = (camera as THREE.PerspectiveCamera).fov;
  const worldPerPx =
    (2 * dist * Math.tan(THREE.MathUtils.degToRad(fov / 2))) / H;
  group.current.scale.setScalar((diameterPx * worldPerPx) / MODEL_DIAMETER);

  landed.current = smootherstep((t - 0.8) / 0.2);
}

const g = gust.current;
    if (elapsed > g.next) {
      g.target = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 1.6 : 1.0);
      g.next = elapsed + 0.05 + Math.random() * 0.25;
    }
    g.value += (g.target - g.value) * Math.min(1, delta * 14);

    const slow =
      Math.sin(elapsed * 3.1) * 0.05 + Math.sin(elapsed * 5.3 + 1.3) * 0.04;
    const fast =
      Math.sin(elapsed * 13.7) * 0.05 + Math.sin(elapsed * 23.1 + 0.7) * 0.03;

    const flicker = Math.min(1.4, Math.max(0.6, 1 + g.value * 0.16 + slow + fast));

    flameMaterials.forEach((fm) => {
      fm.uniforms.uTime.value = elapsed;
      fm.uniforms.uReveal.value = fullFlame;
    });

    flameMeshes.forEach((flame) => {
      if (flame.userData.baseScaleY === undefined) {
        flame.userData.baseScaleY = flame.scale.y;
        flame.userData.baseScaleX = flame.scale.x;
        flame.userData.baseRotZ = flame.rotation.z;
      }
      const sy = flame.userData.baseScaleY as number;
      const sx = flame.userData.baseScaleX as number;
      const rz = flame.userData.baseRotZ as number;

      flame.scale.y = sy * (0.9 + flicker * 0.1 + g.value * 0.03);
      flame.scale.x = sx * (1.04 - flicker * 0.04);
      flame.rotation.z =
        rz +
        Math.sin(elapsed * 8.5 + flame.id) * 0.02 +
        Math.sin(elapsed * 13.2 + flame.id) * 0.01 +
        g.value * 0.012;
    });

    if (flameLight.current) {
      flameLight.current.intensity = fullFlame * LIGHT_BASE * flicker;
      flameLight.current.distance = 6 + g.value * 0.2;
      flameLight.current.position.x = flamePos.x + Math.sin(elapsed * 7.5) * 0.02 + g.value * 0.01;
      flameLight.current.position.y = flamePos.y + 0.04;
      flameLight.current.color.setHSL(0.065 + g.value * 0.006, 1, 0.58);
    }

    if (glowTight.current) {
      const s = 0.9 * (0.9 + flicker * 0.12);
      glowTight.current.scale.set(s, s * 1.15, 1);
      (glowTight.current.material as THREE.SpriteMaterial).opacity =
        fullFlame * GLOW_BASE * flicker;
    }
    if (glowWide.current) {
      const s = 2.8 * (0.94 + flicker * 0.06);
      glowWide.current.scale.set(s, s, 1);
      (glowWide.current.material as THREE.SpriteMaterial).opacity =
        fullFlame * GLOW_BASE * (0.35 + landed.current * 0.3) * (0.7 + flicker * 0.3);
    }
  });

  return (
    <group
      ref={group}
      rotation={[DIYA_TILT_X, Math.PI / 2.5, 0]}
    >
      <primitive object={model} />

      <pointLight
        ref={flameLight}
        position={[flamePos.x, flamePos.y + 0.04, flamePos.z]}
        color="#ff9a45"
        intensity={0}
        distance={6}
        decay={2}
      />

      {/* tight glow around the flame */}
      <sprite
        ref={glowTight}
        position={[flamePos.x, flamePos.y + 0.03, flamePos.z]}
        renderOrder={9}
      >
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      {/* wide soft halo */}
      <sprite
        ref={glowWide}
        position={[flamePos.x, flamePos.y + 0.05, flamePos.z]}
        renderOrder={8}
      >
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      {/* Realistic contact shadow anchored right under the diya base to stop the floating look */}
      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={0.8}
        scale={4.0}
        blur={2.5}
        far={1.5}
      />
    </group>
  );
}

useGLTF.preload("/models/diya/diya.glb");