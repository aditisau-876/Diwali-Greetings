import { useCallback, useState } from "react";

import DiwaliEnvelope3D from "./DiwaliEnvelope3D";
import { DEFAULT_MESSAGE } from "./scene6Config";
import "./Scene6.css";

interface Scene6Props {
  /** Optional custom wish. Defaults to the classic Diwali blessing. */
  message?: string;
  /** Kept for compatibility. Scene 6 never scrolls or advances on its own. */
  onComplete?: () => void;
}

export default function Scene6({ message = DEFAULT_MESSAGE }: Scene6Props) {
  const [opened, setOpened] = useState(false);

  const open = useCallback(() => setOpened(true), []);
  const replay = useCallback(() => setOpened(false), []);

  return (
    <section
      className="scene6"
      data-opened={opened}
      aria-labelledby="scene6-title"
    >
      <div className="scene6-ambient" aria-hidden="true" />

      <div className="scene6-stage">
        <DiwaliEnvelope3D opened={opened} onOpen={open} message={message} />
      </div>

      <header className="scene6-heading">
        <h2 id="scene6-title">A little surprise awaits</h2>
        <p>Open the envelope to read a wish made with love.</p>
      </header>

      <div className="scene6-controls">
        {opened ? (
          <>
            <p className="scene6-blessing" role="status">
              Wishing you light, today and always.
            </p>
            <button type="button" className="scene6-replay" onClick={replay}>
              Seal it again
            </button>
          </>
        ) : (
          <button type="button" className="scene6-open" onClick={open}>
            Open your greeting
          </button>
        )}
      </div>
    </section>
  );
}