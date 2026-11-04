import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import EnvelopeReveal from "./EnvelopeReveal";
import GreetingCard from "./GreetingCard";
import GreetingEditor from "./GreetingEditor";
import GreetingPreview from "./GreetingPreview";
import TemplateSelector from "./TemplateSelector";
import { fileNameFor, renderCardPng } from "./exportCard";

import { defaultGreeting } from "../../types/greeting";
import type { GreetingData } from "../../types/greeting";

import "./cards.css";
import "./studio.css";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

export default function GreetingCreator() {
  const [greeting, setGreeting] = useState<GreetingData>(defaultGreeting);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const cache = useRef<{ key: string; url: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const updateGreeting = (updated: Partial<GreetingData>) =>
    setGreeting((prev) => ({ ...prev, ...updated }));

  const say = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  // The PNG is drawn from a dedicated, untransformed card — not from the
  // animated preview — so the file always matches the chosen design.
  const getPng = async () => {
    const key = JSON.stringify(greeting);
    if (cache.current?.key === key) return cache.current.url;
    const node = exportRef.current?.firstElementChild as HTMLElement | null;
    if (!node) throw new Error("Export card missing");
    const url = await renderCardPng(node);
    cache.current = { key, url };
    return url;
  };

  const download = async () => {
    setBusy("download");
    try {
      const url = await getPng();
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(greeting.recipient);
      document.body.appendChild(a);
      a.click();
      a.remove();
      say("Image saved.");
    } catch (error) {
      console.error("Greeting download failed:", error);
      say("Couldn’t create the image. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    const text = `A Diwali greeting for you: ${greeting.message}`;
    try {
      let file: File | null = null;
      try {
        const blob = await (await fetch(await getPng())).blob();
        file = new File([blob], fileNameFor(greeting.recipient), {
          type: "image/png",
        });
      } catch {
        file = null;
      }

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Happy Diwali", text });
      } else if (navigator.share) {
        await navigator.share({
          title: "Happy Diwali",
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        say("Copied to your clipboard.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Sharing failed:", error);
        say("Sharing isn’t available here. Try downloading instead.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="creator-page">
      <nav className="creator-nav">
        <span className="creator-logo">A Light Within</span>
        <button
          className="back-button"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={15} />
          Back to the story
        </button>
      </nav>

      <motion.header className="creator-header" {...rise}>
        <h1>Send a light of your own.</h1>
        <p>
          Write a few words, choose a design, and we’ll fold it into a greeting
          you can save or share.
        </p>
      </motion.header>

      <div className="studio">
        <div className="studio-controls">
          <motion.section {...rise}>
            <GreetingEditor greeting={greeting} onChange={updateGreeting} />
          </motion.section>
          <motion.section {...rise}>
            <TemplateSelector
              selected={greeting.template}
              onSelect={(template) => updateGreeting({ template })}
            />
          </motion.section>
        </div>

        <motion.aside className="studio-preview" {...rise}>
          <p className="preview-label">Preview</p>
          <GreetingPreview greeting={greeting} />
          <button
            className="btn btn-primary preview-cta"
            type="button"
            onClick={() => setShowEnvelope(true)}
          >
            Seal and open your greeting
          </button>
        </motion.aside>
      </div>

      <AnimatePresence>
        {showEnvelope && (
          <EnvelopeReveal
            greeting={greeting}
            busy={busy}
            onClose={() => setShowEnvelope(false)}
            onDownload={download}
            onShare={share}
          />
        )}
      </AnimatePresence>

      {/* Off-screen, fixed-size copy used only for the PNG export */}
      <div className="export-stage" aria-hidden="true" ref={exportRef}>
        <GreetingCard greeting={greeting} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="creator-footer">Made with light, love and a little Diwali magic.</footer>
    </main>
  );
}
