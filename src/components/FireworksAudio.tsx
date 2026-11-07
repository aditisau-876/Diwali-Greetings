import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { PHASE } from "../lib/journey";

// Put the file in  public/audio/  (change the name here if yours differs).
const SRC = "/audio/fireworks.mp3";
const MAX_VOLUME = 0.7; // 0 – 1
const FADE_OUT = [0.945, 0.99] as const; // fades away while Scene 5 hands over to Scene 6

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

  const apply = useCallback(
    (p: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const level = levelAt(p);
      duck?.set(level);
      audio.volume = clamp01(MAX_VOLUME * level);

      if (level > 0.01) {
        if (audio.paused && !blocked.current && !document.hidden) {
          audio.play().catch(() => {
            // Autoplay was refused; try again after the next tap or key press.
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

    document.addEventListener("click", retry);
    document.addEventListener("touchstart", retry);
    document.addEventListener("keydown", retry);
    document.addEventListener("visibilitychange", onVisibility);

    const audio = audioRef.current;
    return () => {
      document.removeEventListener("click", retry);
      document.removeEventListener("touchstart", retry);
      document.removeEventListener("keydown", retry);
      document.removeEventListener("visibilitychange", onVisibility);
      audio?.pause();
      duck?.set(0);
    };
  }, [apply, progress, duck]);

  return <audio ref={audioRef} src={SRC} loop preload="auto" />;
}