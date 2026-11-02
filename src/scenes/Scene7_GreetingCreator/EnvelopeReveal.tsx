
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    Sparkles,
    Heart,
    Download,
    Share2,
} from "lucide-react";
import type { GreetingData } from "../../types/greeting";

interface Props {
    greeting: GreetingData;
    onClose: () => void;
    onDownload: () => Promise<void>;
    onShare: () => Promise<void>;
}

export default function EnvelopeReveal({
    greeting,
    onClose,
    onDownload,
    onShare,
}: Props) {
    const [opened, setOpened] = useState(false);
    const [showCard, setShowCard] = useState(false);

    const timerRef = useRef<number | null>(null);

    // Clean up animation timer when the component closes.
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    // Open envelope and reveal the card after the flap animation.
    const openEnvelope = () => {
        if (opened) return;

        setOpened(true);

        timerRef.current = window.setTimeout(() => {
            setShowCard(true);
        }, 1050);
    };

    // Reset the complete animation.
    const resetEnvelope = () => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setShowCard(false);
        setOpened(false);
    };

    return (
        <motion.div
            className="envelope-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
        >
            {/* Close button */}
            <button
                className="envelope-close"
                onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                }}
                aria-label="Close greeting reveal"
            >
                <X size={21} />
            </button>

            <motion.div
                className="envelope-experience"
                onClick={(event) => event.stopPropagation()}
                initial={{ y: 35, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 25, scale: 0.95 }}
                transition={{ duration: 0.55 }}
            >
                {/* Heading */}
                <div className="envelope-heading">
                    <span className="eyebrow">
                        A LITTLE SURPRISE FOR YOU
                    </span>

                    <h2>
                        {showCard
                            ? "A wish from the heart."
                            : "Your greeting awaits."}
                    </h2>

                    <p>
                        {showCard
                            ? "A little happiness, wrapped with love."
                            : "Open your envelope to reveal your personalised Diwali wishes."}
                    </p>
                </div>

                {/* Main envelope stage */}
                <div
                    className={`envelope-stage ${opened ? "is-open" : ""
                        } ${showCard ? "card-revealed" : ""}`}
                >
                    {/* Floating golden particles */}
                    <div
                        className="envelope-particles"
                        aria-hidden="true"
                    >
                        {Array.from({ length: 18 }).map((_, i) => (
                            <span
                                key={i}
                                style={{
                                    left: `${8 + ((i * 37) % 84)}%`,
                                    top: `${10 + ((i * 23) % 75)}%`,
                                    animationDelay: `${(i % 6) * 0.4}s`,
                                }}
                            >
                                {i % 2 === 0 ? "✦" : "·"}
                            </span>
                        ))}
                    </div>

                    {/* GREETING CARD */}
                    <div className="envelope-insert-position">
                        <motion.div
                            className="envelope-insert"
                            initial={{ y: 0, scale: 0.96 }}
                            animate={{
                                y: showCard ? -125 : 0,
                                scale: showCard ? 1 : 0.96,
                            }}
                            transition={{
                                duration: 1.5,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <div
                                className={`insert-card insert-${greeting.template}`}
                            >
                                <div className="insert-border">
                                    <span className="insert-star">✦</span>

                                    <span className="insert-kicker">
                                        A FESTIVAL OF LIGHT
                                    </span>

                                    <div className="insert-ornament">
                                        ✺
                                    </div>

                                    <h3>Happy</h3>
                                    <h1>Diwali</h1>

                                    <div className="insert-divider">
                                        ✦
                                    </div>

                                    <p className="insert-recipient">
                                        Dear {greeting.recipient || "Someone Special"},
                                    </p>

                                    <p className="insert-message">
                                        {greeting.message}
                                    </p>

                                    <div className="insert-signature">
                                        With love &amp; light,

                                        <strong>
                                            {greeting.sender || "Your Name"}
                                        </strong>
                                    </div>

                                    <div className="insert-bottom">
                                        🪔 ✧ 🪔
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ENVELOPE BODY */}
                    <div className="envelope-body">
                        <div className="envelope-back" />

                        <div className="envelope-left-fold" />
                        <div className="envelope-right-fold" />
                        <div className="envelope-bottom-fold" />

                        {/* Front envelope panel */}
                        <div className="envelope-front">
                            <div className="envelope-front-border" />

                            <div className="envelope-front-text">
                                <Sparkles size={22} />
                                <span>WITH LOVE</span>
                            </div>
                        </div>

                        {/* 3D animated triangular flap */}
                        <div className="envelope-flap-wrapper">
                            <motion.div
                                className="envelope-flap"
                                initial={{ rotateX: 0 }}
                                animate={{
                                    rotateX: opened ? -180 : 0,
                                }}
                                transition={{
                                    duration: 1.1,
                                    ease: [0.65, 0, 0.35, 1],
                                }}
                                style={{
                                    transformPerspective: 1200,
                                    transformOrigin: "top center",
                                    transformStyle: "preserve-3d",
                                    backfaceVisibility: "visible",
                                }}
                            >
                                <div className="flap-ornament">✺</div>
                            </motion.div>
                        </div>

                        {/* Wax seal */}
                        <AnimatePresence>
                            {!opened && (
                                <motion.div
                                    className="wax-seal"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{
                                        scale: 0.3,
                                        opacity: 0,
                                        rotate: 25,
                                    }}
                                    transition={{
                                        duration: 0.35,
                                        type: "spring",
                                        stiffness: 200,
                                    }}
                                >
                                    <Heart
                                        size={24}
                                        fill="currentColor"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="envelope-actions">
                    <AnimatePresence mode="wait">
                        {!opened ? (
                            <motion.button
                                key="open"
                                className="open-envelope-button"
                                onClick={openEnvelope}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Sparkles size={16} />
                                Open your greeting
                            </motion.button>
                        ) : showCard ? (
                            <motion.div
                                key="revealed"
                                className="reveal-actions"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <p>
                                    Made with love, just for you.
                                </p>

                                <div className="reveal-action-buttons">
                                    <button
                                        className="download-greeting-button"
                                        type="button"
                                        onClick={onDownload}
                                    >
                                        <Download size={18} />
                                        Download PNG
                                    </button>

                                    <button
                                        className="share-greeting-button"
                                        type="button"
                                        onClick={onShare}
                                    >
                                        <Share2 size={18} />
                                        Share Greeting
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="opening"
                                className="opening-label"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                Unfolding your wishes...
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
