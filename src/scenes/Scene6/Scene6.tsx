
import DiwaliEnvelope3D from "./DiwaliEnvelope3D";
import "./Scene6.css";

interface Scene6Props {
    recipient?: string;
    sender?: string;
    message?: string;
    onComplete?: () => void;
}

export default function Scene6({
    recipient = "Someone Special",
    sender = "Your Name",
    message = "May this Diwali bring happiness, prosperity and endless light into your life.",
    onComplete,
}: Scene6Props) {
    return (
        <section className="scene6-container">
            <div className="scene6-heading">
                <span className="scene6-eyebrow">
                    A FESTIVAL OF LIGHT
                </span>

                <h1>A Little Surprise Awaits</h1>

                <p>
                    Open your envelope and discover a wish made with love.
                </p>
            </div>

            <DiwaliEnvelope3D
                recipient={recipient}
                sender={sender}
                message={message}
                onComplete={onComplete}
            />
        </section>
    );
}
