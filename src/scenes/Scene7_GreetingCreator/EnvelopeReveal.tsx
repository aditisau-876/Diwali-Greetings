import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, Share2, X } from "lucide-react";

import GreetingCard from "./GreetingCard";
import type { GreetingData } from "../../types/greeting";

interface Props {
  greeting: GreetingData;
  busy: "download" | "share" | null;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

type Phase = "closed" | "opening" | "revealed";

const CARD_W = 560;
const CARD_H = 700;

function useFitScale() {
  const calc = useCallback(
    () =>
      Math.min(
        1,
        (window.innerWidth - 40) / CARD_W,
        (window.innerHeight - 250) / CARD_H,
      ),
    [],
  );
  const [k, setK] = useState(calc);
  useEffect(() => {
    const on = () => setK(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [calc]);
  return Math.max(0.35, k);
}

export default function EnvelopeReveal({
  greeting,
  busy,
  onClose,
  onDownload,
  onShare,
}: Props) {
  const [phase, setPhase] = useState<Phase>("closed");
  const timer = useRef<number | null>(null);
  const k = useFitScale();

  // Keep the latest onClose without re-running the effect below. Re-running it
  // (a parent re-render is enough) used to cancel the opening timer, leaving
  // the envelope stuck half-open.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Lock page scroll while the overlay is open; Escape closes it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const open = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    timer.current = window.setTimeout(() => setPhase("revealed"), 900);
  };

  const revealed = phase === "revealed";
  const opened = phase !== "closed";

  return (
    <motion.div
      className="reveal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Your Diwali greeting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
    >
      <button
        className="reveal-close"
        type="button"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div className="reveal-inner" onClick={(e) => e.stopPropagation()}>
        <p className="reveal-title" aria-live="polite">
          {revealed ? "Your greeting is ready." : "A greeting is waiting."}
        </p>

        <div
          className="reveal-stage"
          style={{ height: revealed ? CARD_H * k : 230 }}
        >
          {/* Envelope */}
          <motion.div
            className={`env ${opened ? "is-open" : ""}`}
            animate={
              revealed
                ? { y: 140, opacity: 0, scale: 0.92 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="env-back" />
            <div className="env-front" />
            <motion.div
              className="env-flap"
              initial={{ rotateX: 0, zIndex: 3 }}
              animate={
                opened
                  ? { rotateX: -180, zIndex: 0 }
                  : { rotateX: 0, zIndex: 3 }
              }
              transition={{
                rotateX: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
                zIndex: { delay: 0.35, duration: 0 },
              }}
              style={{ transformPerspective: 900 }}
            />
            <AnimatePresence>
              {!opened && (
                <motion.span
                  className="env-seal"
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={20} fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card */}
          {revealed && (
            <motion.div
              className="reveal-card"
              style={{ width: CARD_W * k, height: CARD_H * k }}
              initial={{ opacity: 0, y: 90, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="reveal-card-scale"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  transform: `scale(${k})`,
                }}
              >
                <GreetingCard greeting={greeting} />
              </div>
            </motion.div>
          )}
        </div>

        <div className="reveal-actions">
          <AnimatePresence mode="wait">
            {!opened && (
              <motion.button
                key="open"
                className="btn btn-primary"
                type="button"
                onClick={open}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                autoFocus
              >
                Open the envelope
              </motion.button>
            )}
            {revealed && (
              <motion.div
                key="actions"
                className="reveal-buttons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={onDownload}
                  disabled={busy !== null}
                >
                  <Download size={17} />
                  {busy === "download" ? "Preparing image…" : "Download image"}
                </button>
                <button
                  className="btn btn-quiet"
                  type="button"
                  onClick={onShare}
                  disabled={busy !== null}
                >
                  <Share2 size={17} />
                  {busy === "share" ? "Preparing…" : "Share"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}