import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

import { isMuted, toggleMuted, useMuted } from "../lib/sound";
import "./BackgroundMusic.css";

const TARGET_VOLUME = 0.25;
const DUCK_AMOUNT = 0.6; // how much quieter the music gets during the fireworks
const FADE_IN_MS = 2500;

// Browsers only allow sound after a real user gesture. Scrolling with the
// wheel does not count, so we listen for every gesture that does.
const GESTURES = ["pointerdown", "pointerup", "click", "touchend", "keydown"] as const;

interface Props {
  /** 0 = normal, 1 = fully ducked. Driven by FireworksAudio. Optional. */
  duck?: MotionValue<number>;
}

export default function BackgroundMusic({ duck }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Hooks can't be conditional, so fall back to a value that never changes.
  const fallback = useMotionValue(0);
  const source = duck ?? fallback;

  const muted = useMuted();
  const [playing, setPlaying] = useState(false);
  // true only after the browser has actually refused to start the music
  const [blocked, setBlocked] = useState(false);

  const fade = useRef(0);
  const duckLevel = useRef(0);
  const fadeFrame = useRef(0);
  const resumeAfterHidden = useRef(false);

  const applyVolume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const volume =
      TARGET_VOLUME * fade.current * (1 - DUCK_AMOUNT * duckLevel.current);
    audio.volume = Math.min(1, Math.max(0, volume));
  }, []);

  const fadeIn = useCallback(() => {
    cancelAnimationFrame(fadeFrame.current);
    const startedAt = performance.now();
    const from = fade.current;
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / FADE_IN_MS);
      fade.current = from + (1 - from) * t;
      applyVolume();
      if (t < 1) fadeFrame.current = requestAnimationFrame(step);
    };
    fadeFrame.current = requestAnimationFrame(step);
  }, [applyVolume]);

  /** Try to start the music. Returns true if it is now playing. */
  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isMuted()) return false;
    if (!audio.paused) return true;
    try {
      fade.current = 0;
      applyVolume();
      await audio.play();
      setPlaying(true);
      setBlocked(false);
      fadeIn();
      return true;
    } catch {
      setBlocked(true); // blocked until the visitor interacts
      return false;
    }
  }, [applyVolume, fadeIn]);

  useMotionValueEvent(source, "change", (d) => {
    duckLevel.current = d;
    applyVolume();
  });

  // 1) Try on load  2) keep retrying on every real gesture until it works.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0;

    function removeGestures() {
      GESTURES.forEach((g) => document.removeEventListener(g, unlock));
    }
    async function unlock() {
      await start();
      if (audioRef.current && !audioRef.current.paused) removeGestures();
    }

    GESTURES.forEach((g) =>
      document.addEventListener(g, unlock, { passive: true }),
    );
    void unlock();

    // Don't play to an empty, hidden tab.
    const onVisibility = () => {
      if (document.hidden) {
        if (!audio.paused) {
          audio.pause();
          resumeAfterHidden.current = true;
        }
      } else if (resumeAfterHidden.current) {
        resumeAfterHidden.current = false;
        void audio.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      removeGestures();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(fadeFrame.current);
      audio.pause();
    };
  }, [start]);

  // The sound switch: pause when muted, start again when unmuted.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      cancelAnimationFrame(fadeFrame.current);
      audio.pause();
      setPlaying(false);
    } else {
      void start();
    }
  }, [muted, start]);

  const needsTap = !muted && blocked && !playing;

  const onToggle = () => {
    // While the browser is still blocking sound, this button turns it on.
    if (needsTap) void start();
    else toggleMuted();
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/diwali-music.mp3" loop preload="auto" />
      <button
        type="button"
        className={`sound-toggle${needsTap ? " is-prompting" : ""}`}
        onClick={onToggle}
        aria-label={muted ? "Turn sound on" : needsTap ? "Start the music" : "Turn sound off"}
        aria-pressed={!muted && playing}
      >
        {muted || needsTap ? <VolumeX size={18} /> : <Volume2 size={18} />}
        {needsTap && <span>Tap for sound</span>}
      </button>
    </>
  );
}