import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";

const BASE_VOLUME = 0.25;
const DUCK_AMOUNT = 0.6; // how much quieter the music gets during the fireworks

interface Props {
    /** 0 = normal, 1 = fully ducked. Driven by FireworksAudio. Optional. */
    duck?: MotionValue<number>;
}

export default function BackgroundMusic({ duck }: Props) {
    const audioRef = useRef<HTMLAudioElement>(null);

    // Hooks can't be conditional, so fall back to a value that never changes.
    const fallback = useMotionValue(0);
    const source = duck ?? fallback;

    const volumeFor = (d: number) => BASE_VOLUME * (1 - DUCK_AMOUNT * d);

    useMotionValueEvent(source, "change", (d) => {
        const audio = audioRef.current;
        if (audio) audio.volume = volumeFor(d);
    });

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volumeFor(source.get());
        audio.loop = true;

        const startMusic = async () => {
            try {
                await audio.play();
                document.removeEventListener("click", startMusic);
                document.removeEventListener("touchstart", startMusic);
                document.removeEventListener("keydown", startMusic);
            } catch {
                // Browser blocked autoplay; wait for user interaction.
            }
        };

        // Attempt immediately on page load.
        startMusic();

        // Retry as soon as the visitor interacts.
        document.addEventListener("click", startMusic);
        document.addEventListener("touchstart", startMusic);
        document.addEventListener("keydown", startMusic);

        return () => {
            document.removeEventListener("click", startMusic);
            document.removeEventListener("touchstart", startMusic);
            document.removeEventListener("keydown", startMusic);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <audio
            ref={audioRef}
            src="/audio/diwali-music.mp3"
            autoPlay
            loop
            preload="auto"
        />
    );
}