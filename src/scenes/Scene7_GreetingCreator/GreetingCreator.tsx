
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Download } from "lucide-react";
import { toPng } from "html-to-image";

import EnvelopeReveal from "./EnvelopeReveal";
import GreetingEditor from "./GreetingEditor";
import GreetingPreview from "./GreetingPreview";
import TemplateSelector from "./TemplateSelector";

import { defaultGreeting } from "../../types/greeting";
import type { GreetingData } from "../../types/greeting";

import "./greeting.css";

export default function GreetingCreator() {
    const [greeting, setGreeting] =
        useState<GreetingData>(defaultGreeting);

    const [showEnvelope, setShowEnvelope] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const updateGreeting = (updated: Partial<GreetingData>) => {
        setGreeting(previous => ({
            ...previous,
            ...updated,
        }));
    };

    // DOWNLOAD GREETING AS PNG
    const downloadGreeting = async () => {
        const card = document.querySelector(
            ".greeting-card"
        ) as HTMLElement | null;

        if (!card) {
            alert("Greeting card not found. Please try again.");
            return;
        }

        try {
            setIsDownloading(true);

            // Allow the browser to finish rendering
            await document.fonts.ready;

            const dataUrl = await toPng(card, {
                pixelRatio: 3,
                cacheBust: true,
                backgroundColor:
                    greeting.template === "minimal"
                        ? "#f7efdf"
                        : "#32171f",
            });

            const link = document.createElement("a");

            const recipient = (greeting.recipient || "Someone-Special")
                .trim()
                .replace(/[^a-zA-Z0-9-_]/g, "-")
                .replace(/-+/g, "-");

            link.download = `Diwali-Greeting-${recipient}.png`;
            link.href = dataUrl;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Greeting download failed:", error);
            alert(
                "Sorry! We couldn't download your greeting. Please try again."
            );
        } finally {
            setIsDownloading(false);
        }
    };

    const shareGreeting = async () => {
        const shareData = {
            title: "My Diwali Greeting",
            text: `A personalised Diwali greeting for you! ${greeting.message}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(
                    `${shareData.text}\n${shareData.url}`
                );
                alert("Greeting link copied!");
            }
        } catch (error) {
            if (error instanceof Error && error.name !== "AbortError") {
                console.error("Sharing failed:", error);
                alert("Unable to share right now. Please try again.");
            }
        }
    };

    return (
        <main className="creator-page">

            <nav className="creator-nav">
                <div className="creator-logo">
                    <Sparkles size={20} />
                    <span>
                        DIWALI <strong>DIGITAL DIYA</strong>
                    </span>
                </div>

                <span className="creator-nav-label">
                    YOUR PERSONAL GREETING STUDIO
                </span>

                <button
                    className="back-button"
                    type="button"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
            </nav>

            <motion.header
                className="creator-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                <span className="eyebrow">
                    SPREAD THE LIGHT
                </span>

                <h1>
                    A greeting made <em>by you.</em>
                </h1>

                <p>
                    Every wish carries a little light.
                    Create something beautiful and send it
                    to someone special.
                </p>
            </motion.header>

            {/* STEP 1: CREATE GREETING */}

            <section className="studio-section">
                <div className="studio-section-heading">
                    <span className="eyebrow">01 — PERSONALISE</span>
                    <h2>Create your greeting</h2>
                    <p>
                        Add the names and write your heartfelt wishes.
                    </p>
                </div>

                <div className="studio-editor">
                    <GreetingEditor
                        greeting={greeting}
                        onChange={updateGreeting}
                    />
                </div>
            </section>

            {/* STEP 2: SELECT DESIGN */}

            <section className="studio-section">
                <div className="studio-section-heading">
                    <span className="eyebrow">02 — DESIGN</span>
                    <h2>Choose your card design</h2>
                    <p>
                        Select a design that matches your festive spirit.
                    </p>
                </div>

                <div className="studio-template">
                    <TemplateSelector
                        selected={greeting.template}
                        onSelect={(template) =>
                            updateGreeting({ template })
                        }
                    />
                </div>
            </section>

            {/* STEP 3: LIVE PREVIEW */}

            <section className="studio-section studio-preview-section">
                <div className="studio-section-heading">
                    <span className="eyebrow">03 — YOUR CREATION</span>
                    <h2>Your greeting, beautifully crafted.</h2>
                    <p>
                        Watch your personalised greeting come to life.
                    </p>
                </div>

                <GreetingPreview greeting={greeting} />

                
            </section>

            {/* STEP 4: REVEAL */}

            <section className="finalize-greeting">
                <span className="eyebrow">
                    04 — THE GRAND REVEAL
                </span>

                <h2>Ready to spread the light?</h2>

                <p>
                    Seal your wishes in a little envelope of happiness.
                </p>

                <button
                    className="finalize-button"
                    type="button"
                    onClick={() => setShowEnvelope(true)}
                >
                    <Sparkles size={17} />
                    Reveal my Diwali greeting
                </button>
            </section>

            <AnimatePresence>
                {showEnvelope && (
                    <EnvelopeReveal
                        greeting={greeting}
                        onClose={() => setShowEnvelope(false)}
                        onDownload={downloadGreeting}
                        onShare={shareGreeting}
                    />
                )}
            </AnimatePresence>

            <footer className="creator-footer">
                MADE WITH LIGHT, LOVE & A LITTLE DIWALI MAGIC
            </footer>

        </main>
    );
}
