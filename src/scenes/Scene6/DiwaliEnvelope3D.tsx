
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";

interface DiwaliEnvelope3DProps {
    recipient?: string;
    sender?: string;
    message?: string;
    onComplete?: () => void;
}

/* -------------------------------------------------------
   GREETING CARD TEXTURE
------------------------------------------------------- */

function createGreetingTexture(
    recipient: string,
    sender: string,
    message: string
) {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1000;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not create greeting card texture.");
    }

    const background = ctx.createLinearGradient(0, 0, 1400, 1000);
    background.addColorStop(0, "#fffaf0");
    background.addColorStop(0.5, "#f7ecd7");
    background.addColorStop(1, "#ead3a8");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1400, 1000);

    // Double gold border
    ctx.strokeStyle = "#a77b35";
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, 1340, 940);

    ctx.strokeStyle = "#d9b66f";
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, 1284, 884);

    // Corner ornaments
    ctx.fillStyle = "#bd914b";
    ctx.font = "58px Georgia";
    ctx.textAlign = "center";

    ctx.fillText("✦", 115, 135);
    ctx.fillText("✦", 1285, 135);
    ctx.fillText("✦", 115, 895);
    ctx.fillText("✦", 1285, 895);

    // Top ornament
    ctx.fillStyle = "#b68a45";
    ctx.font = "46px Georgia";
    ctx.fillText("✧  ✦  ✧", 700, 155);

    // Eyebrow
    ctx.fillStyle = "#98713c";
    ctx.font = "bold 39px Georgia";
    ctx.fillText("A FESTIVAL OF LIGHT", 700, 245);

    // Main greeting
    ctx.fillStyle = "#762a38";
    ctx.font = "italic 132px Georgia";
    ctx.fillText("Happy Diwali", 700, 415);

    // Divider
    ctx.fillStyle = "#b68a45";
    ctx.font = "58px Georgia";
    ctx.fillText("✧  ✦  ✧", 700, 505);

    // Recipient
    ctx.fillStyle = "#783e3b";
    ctx.font = "bold 52px Georgia";
    ctx.fillText(
        `Dear ${recipient || "Someone Special"},`,
        700,
        600
    );

    // Message with automatic wrapping
    ctx.fillStyle = "#61483b";
    ctx.font = "42px Georgia";

    const messageText =
        message ||
        "May this Diwali bring happiness, prosperity and endless light into your life.";

    const words = messageText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
        const testLine = currentLine
            ? `${currentLine} ${word}`
            : word;

        if (
            ctx.measureText(testLine).width > 1120 &&
            currentLine
        ) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    const visibleLines = lines.slice(0, 4);
    const lineHeight = 56;
    const messageStartY =
        710 - ((visibleLines.length - 1) * lineHeight) / 2;

    visibleLines.forEach((line, index) => {
        ctx.fillText(
            line,
            700,
            messageStartY + index * lineHeight
        );
    });

    // Signature
    ctx.fillStyle = "#9b7138";
    ctx.font = "italic 38px Georgia";
    ctx.fillText("With love & light,", 700, 875);

    ctx.fillStyle = "#782d38";
    ctx.font = "bold 48px Georgia";
    ctx.fillText(sender || "Your Name", 700, 930);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    return texture;
}

/* -------------------------------------------------------
   ENVELOPE TRIANGLE FOLDS
------------------------------------------------------- */

function EnvelopeTriangle({
    points,
    color,
    position,
}: {
    points: [number, number][];
    color: string;
    position: [number, number, number];
}) {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        shape.moveTo(points[0][0], points[0][1]);

        points.slice(1).forEach(([x, y]) => {
            shape.lineTo(x, y);
        });

        shape.closePath();

        return new THREE.ShapeGeometry(shape);
    }, [points]);

    return (
        <mesh
            geometry={geometry}
            position={position}
            renderOrder={2}
        >
            <meshStandardMaterial
                color={color}
                side={THREE.DoubleSide}
                roughness={0.58}
            />
        </mesh>
    );
}

/* -------------------------------------------------------
   GOLD WAX SEAL
------------------------------------------------------- */

function WaxSeal() {
    return (
        <group position={[0, 0, 0.25]}>
            <mesh>
                <cylinderGeometry args={[0.28, 0.28, 0.09, 64]} />
                <meshStandardMaterial
                    color="#b9873e"
                    metalness={0.7}
                    roughness={0.3}
                />
            </mesh>

            <mesh position={[0, 0, 0.055]}>
                <circleGeometry args={[0.22, 6]} />
                <meshStandardMaterial color="#f1d49a" />
            </mesh>

            <mesh position={[0, 0, 0.065]}>
                <circleGeometry args={[0.105, 6]} />
                <meshStandardMaterial color="#792b38" />
            </mesh>
        </group>
    );
}

/* -------------------------------------------------------
   GREETING CARD
------------------------------------------------------- */

function GreetingCard({
    opened,
    recipient,
    sender,
    message,
}: {
    opened: boolean;
    recipient: string;
    sender: string;
    message: string;
}) {
    const cardRef = useRef<Group>(null);
    const openingStartedAt = useRef<number | null>(null);
    const progress = useRef(0);

    const texture = useMemo(
        () => createGreetingTexture(recipient, sender, message),
        [recipient, sender, message]
    );

    useFrame((state, delta) => {
        if (!cardRef.current) return;

        if (!opened) {
            openingStartedAt.current = null;
        } else if (openingStartedAt.current === null) {
            openingStartedAt.current = state.clock.elapsedTime;
        }

        const elapsed =
            openingStartedAt.current === null
                ? 0
                : state.clock.elapsedTime - openingStartedAt.current;

        const targetProgress =
            opened && elapsed > 0.65 ? 1 : 0;

        progress.current = THREE.MathUtils.damp(
            progress.current,
            targetProgress,
            2.1,
            delta
        );

        const raw = progress.current;
        const p = raw * raw * (3 - 2 * raw);

        const slideY = THREE.MathUtils.lerp(0, 0.42, p);

        const hover =
            p > 0.96
                ? Math.sin(state.clock.elapsedTime * 1.15) * 0.025
                : 0;

        cardRef.current.position.x = 0;
        cardRef.current.position.y = slideY + hover;

        cardRef.current.position.z = THREE.MathUtils.lerp(
            -0.38,
            0.62,
            p
        );

        cardRef.current.rotation.set(0, 0, 0);

        // Preserve the enlarged, straight card size.
        const scale = THREE.MathUtils.lerp(0.82, 0.94, p);
        cardRef.current.scale.setScalar(scale);
    });

    return (
        <group
            ref={cardRef}
            position={[0, 0, -0.38]}
            scale={0.82}
        >
            {/* Gold card backing */}
            <mesh>
                <boxGeometry args={[3.65, 2.60, 0.065]} />
                <meshStandardMaterial
                    color="#d5aa59"
                    metalness={0.62}
                    roughness={0.27}
                    emissive="#9c641e"
                    emissiveIntensity={0.16}
                />
            </mesh>

            {/* Printed ivory card */}
            <mesh position={[0, 0, 0.04]}>
                <planeGeometry args={[3.57, 2.52]} />
                <meshStandardMaterial
                    map={texture}
                    roughness={0.62}
                    side={THREE.DoubleSide}
                    emissive="#fff0cf"
                    emissiveIntensity={0.08}
                />
            </mesh>

            {/* Gold accent */}
            <mesh position={[0, 1.08, 0.05]}>
                <boxGeometry args={[0.5, 0.012, 0.008]} />
                <meshStandardMaterial
                    color="#b78b42"
                    metalness={0.7}
                    roughness={0.25}
                />
            </mesh>
        </group>
    );
}

/* -------------------------------------------------------
   FLOATING GOLDEN PARTICLES
------------------------------------------------------- */

function FloatingParticles() {
    const particlesRef = useRef<Group>(null);

    const particles = useMemo(
        () =>
            Array.from({ length: 120 }, (_, index) => {
                const side = index % 2 === 0 ? -1 : 1;
                const row = Math.floor(index / 2);

                return {
                    x: side * (2.8 + (row % 8) * 0.16),
                    y: -2.5 + ((row * 0.43) % 5),
                    z: -0.5 + (row % 4) * 0.15,
                    size: 0.014 + (row % 5) * 0.008,
                    speed: 0.35 + (row % 5) * 0.12,
                };
            }),
        []
    );

    useFrame((state) => {
        if (!particlesRef.current) return;

        particlesRef.current.children.forEach((particle, index) => {
            const data = particles[index];

            particle.position.y =
                data.y +
                Math.sin(
                    state.clock.elapsedTime * data.speed + index
                ) * 0.13;

            particle.position.x =
                data.x +
                Math.sin(
                    state.clock.elapsedTime * 0.4 + index
                ) * 0.04;
        });
    });

    return (
        <group ref={particlesRef}>
            {particles.map((particle, index) => (
                <mesh
                    key={index}
                    position={[
                        particle.x,
                        particle.y,
                        particle.z,
                    ]}
                >
                    <sphereGeometry
                        args={[particle.size, 12, 12]}
                    />

                    <meshStandardMaterial
                        color={
                            index % 3 === 0
                                ? "#fff0c5"
                                : "#e9bd6d"
                        }
                        emissive="#a97930"
                        emissiveIntensity={0.65}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* -------------------------------------------------------
   ENVELOPE DECORATIVE GOLD BORDER
------------------------------------------------------- */

function EnvelopeGoldDetails() {
    const goldMaterial = (
        <meshStandardMaterial
            color="#d6ad62"
            metalness={0.8}
            roughness={0.25}
            emissive="#9b692c"
            emissiveIntensity={0.18}
        />
    );

    return (
        <group position={[0, 0, 0.19]}>
            {/* Top and bottom borders */}
            <mesh position={[0, 1.18, 0]}>
                <boxGeometry args={[3.65, 0.025, 0.018]} />
                {goldMaterial}
            </mesh>

            <mesh position={[0, -1.18, 0]}>
                <boxGeometry args={[3.65, 0.025, 0.018]} />
                {goldMaterial}
            </mesh>

            {/* Side borders */}
            <mesh position={[-1.82, 0, 0]}>
                <boxGeometry args={[0.025, 2.35, 0.018]} />
                {goldMaterial}
            </mesh>

            <mesh position={[1.82, 0, 0]}>
                <boxGeometry args={[0.025, 2.35, 0.018]} />
                {goldMaterial}
            </mesh>

            {/* Four gold corner ornaments */}
            {[
                [-1.65, 1.02, 0],
                [1.65, 1.02, 0],
                [-1.65, -1.02, 0],
                [1.65, -1.02, 0],
            ].map((position, index) => (
                <mesh
                    key={index}
                    position={
                        position as [number, number, number]
                    }
                >
                    <sphereGeometry args={[0.065, 16, 16]} />
                    {goldMaterial}
                </mesh>
            ))}
        </group>
    );
}

/* -------------------------------------------------------
   COMPLETE ENVELOPE MODEL
------------------------------------------------------- */

function EnvelopeModel({
    opened,
    recipient,
    sender,
    message,
}: {
    opened: boolean;
    recipient: string;
    sender: string;
    message: string;
}) {
    const flapRef = useRef<Group>(null);

    useFrame((_, delta) => {
        if (!flapRef.current) return;

        flapRef.current.rotation.x = THREE.MathUtils.damp(
            flapRef.current.rotation.x,
            opened ? Math.PI : 0,
            2.4,
            delta
        );
    });

    return (
        <group>
            <GreetingCard
                opened={opened}
                recipient={recipient}
                sender={sender}
                message={message}
            />

            {/* Main envelope body */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3.8, 2.5, 0.2]} />
                <meshStandardMaterial
                    color="#541b29"
                    roughness={0.48}
                    metalness={0.2}
                />
            </mesh>

            {/* Left fold */}
            <EnvelopeTriangle
                points={[
                    [-1.9, 1.25],
                    [-1.9, -1.25],
                    [0, 0],
                ]}
                color="#702532"
                position={[0, 0, 0.115]}
            />

            {/* Right fold */}
            <EnvelopeTriangle
                points={[
                    [1.9, 1.25],
                    [1.9, -1.25],
                    [0, 0],
                ]}
                color="#702532"
                position={[0, 0, 0.12]}
            />

            {/* Bottom fold */}
            <EnvelopeTriangle
                points={[
                    [-1.9, -1.25],
                    [1.9, -1.25],
                    [0, 0.2],
                ]}
                color="#852c3b"
                position={[0, 0, 0.16]}
            />

            {/* Gold decorative details */}
            <EnvelopeGoldDetails />

            {/* Opening top flap */}
            <group
                ref={flapRef}
                position={[0, 1.25, 0.22]}
            >
                <EnvelopeTriangle
                    points={[
                        [-1.9, 0],
                        [1.9, 0],
                        [0, -1.25],
                    ]}
                    color="#913b46"
                    position={[0, 0, 0]}
                />
            </group>

            {!opened && <WaxSeal />}
        </group>
    );
}

/* -------------------------------------------------------
   MAIN SCENE 3D COMPONENT
------------------------------------------------------- */

export default function DiwaliEnvelope3D({
    recipient = "Someone Special",
    sender = "Your Name",
    message = "May this Diwali bring happiness, prosperity and endless light into your life.",
    onComplete,
}: DiwaliEnvelope3DProps) {
    const [opened, setOpened] = useState(false);

    const handleOpen = () => {
        if (opened) return;

        setOpened(true);

        window.setTimeout(() => {
            onComplete?.();
        }, 3000);
    };

    return (
        <div className="diwali-3d-envelope">
            <Canvas
                camera={{
                    position: [0, 0, 7.5],
                    fov: 42,
                }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                }}
            >
                <ambientLight intensity={1.2} />

                <directionalLight
                    position={[3, 5, 6]}
                    intensity={2.5}
                    color="#fff0d0"
                />

                <pointLight
                    position={[-3, 1, 3]}
                    intensity={1.8}
                    color="#d99b48"
                />

                <pointLight
                    position={[3, -2, 2]}
                    intensity={1}
                    color="#8e3443"
                />

                <pointLight
                    position={[0, 1.5, 3]}
                    intensity={1.4}
                    color="#f5c978"
                />

                <pointLight
                    position={[0, 0, 4]}
                    intensity={2.2}
                    distance={8}
                    color="#e9b65e"
                />

                {/* Sparkles stay outside the enlarged envelope group */}
                <FloatingParticles />

                {/* Enlarged model shifted down to prevent card clipping */}
                <group
                    position={[0, -0.42, 0]}
                    scale={1.75}
                >
                    <EnvelopeModel
                        opened={opened}
                        recipient={recipient}
                        sender={sender}
                        message={message}
                    />
                </group>
            </Canvas>

            <div className="diwali-envelope-controls">
                {!opened ? (
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="diwali-envelope-open-button"
                    >
                        <span>✦</span>
                        Open your Diwali greeting
                        <span>✦</span>
                    </button>
                ) : (
                    <p className="diwali-envelope-opened-text">
                        A little happiness, wrapped with love.
                    </p>
                )}
            </div>
        </div>
    );
}
