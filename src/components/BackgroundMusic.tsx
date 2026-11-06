import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.25;
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