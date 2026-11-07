import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { PHASE } from "../lib/journey";
import { isMuted, useMuted } from "../lib/sound";

// Put the file in  public/audio/  (change the name here if yours differs).
const SRC = "/audio/fireworks.mp3";
const MAX_VOLUME = 0.7; // 0 – 1
const FADE_OUT = [0.945, 0.99] as const; // fades away while Scene 5 hands over to Scene 6
const GESTURES = ["pointerdown", "pointerup", "click", "touchend", "keydown"] as const;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** 0 = silent, 1 = full show. Follows the scroll position. */
function levelAt(p: number) {
  const [from, to] = PHASE.fireworks;
  const rampUp = smooth((p - from) / (to - from));
  const rampDown = 1 - smooth((p - FADE_OUT[0]) / (FADE_OUT[1] - FADE_OUT[0]));
  return rampUp * rampDown;
}

interface Props {
  progress: MotionValue<number>;
  /** Shared with BackgroundMusic: rises with the fireworks so the music dips. */
  duck?: MotionValue<number>;
}

export default function FireworksAudio({ progress, duck }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const blocked = useRef(false);
  const muted = useMuted();

  const apply = useCallback(
    (p: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const level = levelAt(p);
      // The music only ducks if the fireworks are actually audible.
      duck?.set(isMuted() ? 0 : level);
      audio.muted = isMuted();
      audio.volume = clamp01(MAX_VOLUME * level);

      if (level > 0.01) {
        if (audio.paused && !blocked.current && !document.hidden) {
          audio.play().catch(() => {
            // Autoplay was refused; try again after the next real gesture.
            blocked.current = true;
          });
        }
      } else if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0; // the next show starts from the opening burst
      }
    },
    [duck],
  );

  useMotionValueEvent(progress, "change", apply);

  // Re-apply straight away when the sound switch changes.
  useEffect(() => {
    apply(progress.get());
  }, [muted, apply, progress]);

  useEffect(() => {
    apply(progress.get());

    const retry = () => {
      blocked.current = false;
      apply(progress.get());
    };
    const onVisibility = () => {
      if (document.hidden) audioRef.current?.pause();
      else apply(progress.get());
    };

    GESTURES.forEach((g) =>
      document.addEventListener(g, retry, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);

    const audio = audioRef.current;
    return () => {
      GESTURES.forEach((g) => document.removeEventListener(g, retry));
      document.removeEventListener("visibilitychange", onVisibility);
      audio?.pause();
      duck?.set(0);
    };
  }, [apply, progress, duck]);

  return <audio ref={audioRef} src={SRC} loop preload="auto" />;
}