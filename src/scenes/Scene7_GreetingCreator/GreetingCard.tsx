
import { Sparkles } from "lucide-react";
import type { GreetingData } from "../../types/greeting";

interface Props {
    greeting: GreetingData;
}

function Mandala({ variant = "gold" }: { variant?: string }) {
    const colours: Record<string, string> = {
        gold: "#D7A54E",
        rangoli: "#F39AA8",
    };

    const colour = colours[variant] || colours.gold;

    return (
        <svg viewBox="0 0 240 240" className={`mandala-art mandala-${variant}`}>
            <defs>
                <radialGradient id={`mandalaGradient-${variant}`}>
                    <stop offset="0%" stopColor="#FFF1B0" />
                    <stop offset="50%" stopColor={colour} />
                    <stop offset="100%" stopColor="#80501F" />
                </radialGradient>
            </defs>

            {Array.from({ length: 24 }).map((_, i) => (
                <ellipse
                    key={`petal-${i}`}
                    cx="120"
                    cy="45"
                    rx="10"
                    ry="38"
                    fill="none"
                    stroke={`url(#mandalaGradient-${variant})`}
                    strokeWidth="1.8"
                    transform={`rotate(${i * 15} 120 120)`}
                />
            ))}

            {Array.from({ length: 16 }).map((_, i) => (
                <circle
                    key={`dot-${i}`}
                    cx="120"
                    cy="76"
                    r="5"
                    fill={variant === "rangoli" ? "#F3C66D" : "#E9BC70"}
                    transform={`rotate(${i * 22.5} 120 120)`}
                />
            ))}

            <circle
                cx="120"
                cy="120"
                r="45"
                fill="none"
                stroke={colour}
                strokeWidth="2"
            />

            <circle
                cx="120"
                cy="120"
                r="29"
                fill="none"
                stroke="#F1CF88"
                strokeWidth="1.5"
            />

            <path
                d="M120 96 L126 114 L144 120 L126 126 L120 144 L114 126 L96 120 L114 114Z"
                fill={`url(#mandalaGradient-${variant})`}
            />
        </svg>
    );
}

function DiyaDecoration() {
    return (
        <svg viewBox="0 0 120 100" className="diya-art">
            <defs>
                <radialGradient id="flameGlow">
                    <stop offset="0%" stopColor="#FFF8B0" />
                    <stop offset="55%" stopColor="#FFB12D" />
                    <stop offset="100%" stopColor="#F26A16" />
                </radialGradient>
            </defs>

            <ellipse
                cx="60"
                cy="48"
                rx="28"
                ry="39"
                fill="none"
                stroke="#FFB94E"
                strokeWidth="1"
                opacity=".22"
            />

            <path
                d="M60 48 C38 28 58 8 62 2 C80 24 81 37 60 48Z"
                fill="url(#flameGlow)"
            />

            <path
                d="M60 43 C51 29 62 19 64 15 C73 31 69 39 60 43Z"
                fill="#FFF6C5"
            />

            <path
                d="M18 54 Q60 76 102 54 Q95 92 60 94 Q25 92 18 54Z"
                fill="#B86D27"
                stroke="#F3C574"
                strokeWidth="2"
            />

            <path
                d="M18 54 Q60 73 102 54"
                fill="none"
                stroke="#FFE1A0"
                strokeWidth="2"
            />

            <path
                d="M37 70 Q60 81 83 70"
                fill="none"
                stroke="#E6B65C"
                strokeWidth="1"
            />
        </svg>
    );
}

function CardDecorations({
    decorations,
}: {
    decorations: string[];
}) {
    return (
        <>
            {decorations.includes("lotus") && (
                <>
                    <span className="floating-lotus lotus-left">🌸</span>
                    <span className="floating-lotus lotus-right">🌸</span>
                </>
            )}

            {decorations.includes("marigold") && (
                <>
                    <span className="floating-marigold marigold-left">✿</span>
                    <span className="floating-marigold marigold-right">✿</span>
                </>
            )}

            {decorations.includes("sparkles") && (
                <>
                    <span className="floating-sparkle sparkle-one">✦</span>
                    <span className="floating-sparkle sparkle-two">✧</span>
                    <span className="floating-sparkle sparkle-three">✦</span>
                    <span className="floating-sparkle sparkle-four">✧</span>
                </>
            )}
        </>
    );
}

function FireworksDecoration() {
    return (
        <div className="midnight-fireworks" aria-hidden="true">
            <span className="firework firework-one">✺</span>
            <span className="firework firework-two">✧</span>
            <span className="firework firework-three">✦</span>
            <span className="firework firework-four">✺</span>
        </div>
    );
}

export default function GreetingCard({ greeting }: Props) {
    const template = greeting.template;

    const isRangoli = template === "rangoli";
    const isMidnight = template === "midnight";
    const isMinimal = template === "minimal";
    const isFestival = template === "festival";
    const isRoyal = template === "royal";

    return (
        <article
            className={`greeting-card theme-${template} design-${template}`}
        >
                <div className="ornamental-border" />

                <CardDecorations decorations={greeting.decorations} />

                {/* Template-specific background artwork */}

                {isRoyal && (
                    <>
                        <div className="royal-ornament royal-top">✺</div>
                        <div className="royal-side-ornament royal-left">❧</div>
                        <div className="royal-side-ornament royal-right">❧</div>
                        <div className="royal-ornament royal-bottom">✧</div>
                    </>
                )}

                {isRangoli && (
                    <>
                        <div className="rangoli-backdrop">
                            <Mandala variant="rangoli" />
                        </div>
                        <div className="rangoli-side-flower rangoli-flower-left">✿</div>
                        <div className="rangoli-side-flower rangoli-flower-right">✿</div>
                    </>
                )}

                {isMidnight && (
                    <>
                        <div className="midnight-stars">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        left: `${8 + ((i * 37) % 84)}%`,
                                        top: `${5 + ((i * 29) % 85)}%`,
                                        animationDelay: `${(i % 5) * 0.5}s`,
                                    }}
                                >
                                    {i % 2 === 0 ? "✦" : "·"}
                                </span>
                            ))}
                        </div>
                        <FireworksDecoration />
                        <div className="palace-silhouette" aria-hidden="true">
                            ♜　♙　♜
                        </div>
                    </>
                )}

                {isMinimal && (
                    <>
                        <div className="minimal-sun">✦</div>
                        <div className="minimal-side-line minimal-line-left" />
                        <div className="minimal-side-line minimal-line-right" />
                    </>
                )}

                {isFestival && (
                    <>
                        <div className="festival-top-decoration">✿　✧　✿</div>
                        <div className="festival-bottom-decoration">✧　❀　✧</div>
                    </>
                )}

                <div className={`card-content card-content-${template}`}>

                    {/* Top decorative symbol */}

                    <div className="card-decoration">
                        {isRoyal && <>✧ <span>✺</span> ✧</>}
                        {isRangoli && <span className="rangoli-kicker-symbol">❀</span>}
                        {isMidnight && <>✦ <span>✧</span> ✦</>}
                        {isMinimal && <span>✦</span>}
                        {isFestival && <>✿ <span>🪔</span> ✿</>}
                    </div>

                    <Sparkles className="card-sparkle" size={23} />

                    <span className="card-kicker">
                        {isMinimal
                            ? "A WISH FOR YOU"
                            : isRangoli
                                ? "COLOURS OF HAPPINESS"
                                : isMidnight
                                    ? "A NIGHT FULL OF LIGHT"
                                    : isFestival
                                        ? "THE JOY OF CELEBRATION"
                                        : "THE FESTIVAL OF LIGHTS"}
                    </span>

                    {/* Different heading composition */}

                    {isMinimal ? (
                        <>
                            <h2 className="minimal-heading">Wishing You</h2>
                            <h1 className="minimal-title">Light & Joy</h1>
                        </>
                    ) : isRangoli ? (
                        <>
                            <h2>Shubh</h2>
                            <h1>Diwali</h1>
                        </>
                    ) : (
                        <>
                            <h2>Happy</h2>
                            <h1>Diwali</h1>
                        </>
                    )}

                    <div className="card-divider">
                        <span>{isRangoli ? "❀" : isFestival ? "✿" : "✦"}</span>
                    </div>

                    {/* Greeting message */}

                    <p className="card-to">
                        Dear {greeting.recipient || "Someone Special"},
                    </p>

                    <p className="card-message">
                        {greeting.message ||
                            "Your heartfelt wishes will appear here..."}
                    </p>

                    <div className="card-signature">
                        <span>With love & light,</span>
                        <strong>{greeting.sender || "Your Name"}</strong>
                    </div>

                    {/* Template-specific bottom artwork */}

                    {isRangoli && (
                        <div className="rangoli-bottom-ornament">
                            ✿　✧　❀　✧　✿
                        </div>
                    )}

                    {isMidnight && (
                        <div className="midnight-bottom-ornament">
                            ✦ ✧ ✦
                        </div>
                    )}

                    {isMinimal && (
                        <div className="minimal-bottom-ornament">
                            A FESTIVAL OF LIGHT
                        </div>
                    )}

                    {isFestival && (
                        <div className="card-diyas festival-diyas">
                            <DiyaDecoration />
                            <DiyaDecoration />
                            <DiyaDecoration />
                        </div>
                    )}

                    {isRoyal && (
                        <div className="royal-bottom-ornament">
                            ❧　✧　❧
                        </div>
                    )}

                    {/* Optional user-selected decorations */}

                    {greeting.decorations.includes("rangoli") && !isRangoli && (
                        <div className="preview-rangoli">
                            <Mandala />
                        </div>
                    )}

                    {greeting.decorations.includes("diya") && !isFestival && (
                        <div className="card-diyas">
                            <DiyaDecoration />
                            <DiyaDecoration />
                            <DiyaDecoration />
                        </div>
                    )}
                </div>
            </article>
    );
}
