import type { GreetingData, GreetingTemplate } from "../../types/greeting";
import "./card.css";

interface Props {
  greeting: GreetingData;
}

const COPY: Record<
  GreetingTemplate,
  { kicker: string; top: string; title: string }
> = {
  royal: { kicker: "The festival of lights", top: "Happy", title: "Diwali" },
  rangoli: { kicker: "Colours of happiness", top: "Shubh", title: "Diwali" },
  midnight: { kicker: "A night full of light", top: "Happy", title: "Diwali" },
  minimal: { kicker: "A wish for you", top: "Wishing you", title: "Light & Joy" },
  festival: { kicker: "The joy of celebration", top: "Happy", title: "Diwali" },
  peacock: { kicker: "Grace, colour and light", top: "Happy", title: "Diwali" },
};

/* ------------------------------------------------------------------
   Ornaments — all drawn as SVG that follows the card's accent colour,
   so nothing depends on emoji or fonts and nothing can stack or turn white.
------------------------------------------------------------------ */

function Mandala({ rich = false }: { rich?: boolean }) {
  return (
    <svg viewBox="0 0 240 240" fill="none" stroke="currentColor">
      {Array.from({ length: 24 }).map((_, i) => (
        <ellipse
          key={i}
          cx="120"
          cy="46"
          rx="10"
          ry="36"
          strokeWidth="1.6"
          opacity={rich ? 0.95 : 0.8}
          transform={`rotate(${i * 15} 120 120)`}
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <circle
          key={i}
          cx="120"
          cy="78"
          r="4.5"
          fill="currentColor"
          stroke="none"
          transform={`rotate(${i * 22.5} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="45" strokeWidth="2" />
      <circle cx="120" cy="120" r="29" strokeWidth="1.5" opacity=".7" />
      <path
        d="M120 96 L126 114 L144 120 L126 126 L120 144 L114 126 L96 120 L114 114Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function Starburst() {
  return (
    <svg viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeLinecap="round">
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`l${i}`}
          x1="120"
          y1="24"
          x2="120"
          y2="74"
          strokeWidth="3"
          transform={`rotate(${i * 30} 120 120)`}
        />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`s${i}`}
          x1="120"
          y1="86"
          x2="120"
          y2="104"
          strokeWidth="2"
          opacity=".7"
          transform={`rotate(${i * 30 + 15} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="9" fill="currentColor" stroke="none" />
      <circle cx="120" cy="120" r="20" strokeWidth="1.5" opacity=".6" />
    </svg>
  );
}

function Feather() {
  return (
    <svg viewBox="0 0 120 160" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M60 158 C57 112 63 74 60 44" strokeWidth="2" />
      {[72, 86, 100, 114, 128].map((y) => (
        <g key={y} opacity=".6" strokeWidth="1.4">
          <line x1="60" y1={y} x2="38" y2={y - 14} />
          <line x1="60" y1={y} x2="82" y2={y - 14} />
        </g>
      ))}
      <ellipse cx="60" cy="46" rx="26" ry="38" strokeWidth="2" />
      <ellipse cx="60" cy="46" rx="17" ry="26" strokeWidth="1.5" />
      <ellipse cx="60" cy="46" rx="8" ry="14" fill="currentColor" stroke="none" opacity=".85" />
    </svg>
  );
}

function Diya({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 100">
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#FFF8B0" />
          <stop offset="55%" stopColor="#FFB12D" />
          <stop offset="100%" stopColor="#F26A16" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="46" rx="26" ry="38" fill="#FFB94E" opacity=".16" />
      <path d="M60 48 C38 28 58 8 62 2 C80 24 81 37 60 48Z" fill={`url(#${id})`} />
      <path d="M60 43 C51 29 62 19 64 15 C73 31 69 39 60 43Z" fill="#FFF6C5" />
      <path
        d="M18 54 Q60 76 102 54 Q95 92 60 94 Q25 92 18 54Z"
        fill="#B86D27"
        stroke="#F3C574"
        strokeWidth="2"
      />
      <path d="M18 54 Q60 73 102 54" fill="none" stroke="#FFE1A0" strokeWidth="2" />
    </svg>
  );
}

function Emblem({ template }: { template: GreetingTemplate }) {
  switch (template) {
    case "midnight":
      return <Starburst />;
    case "peacock":
      return <Feather />;
    case "festival":
      return <Diya id="gcFlameEmblem" />;
    case "rangoli":
      return <Mandala rich />;
    default:
      return <Mandala />;
  }
}

function Divider() {
  return (
    <svg
      className="gc-divider"
      viewBox="0 0 200 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <line x1="0" y1="6" x2="82" y2="6" />
      <line x1="118" y1="6" x2="200" y2="6" />
      <path d="M100 1 L105 6 L100 11 L95 6Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Dots() {
  return (
    <svg className="gc-dots" viewBox="0 0 60 8" fill="currentColor">
      <circle cx="12" cy="4" r="2" opacity=".6" />
      <circle cx="30" cy="4" r="3" />
      <circle cx="48" cy="4" r="2" opacity=".6" />
    </svg>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "br" | "bl" }) {
  return (
    <svg
      className={`gc-corner gc-corner-${pos}`}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 38 V12 Q2 2 12 2 H38" />
      <path d="M8 38 V16 Q8 8 16 8 H38" opacity=".5" />
      <circle cx="14" cy="14" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function GreetingCard({ greeting }: Props) {
  const template = greeting.template;
  const copy = COPY[template];

  const recipient = greeting.recipient.trim();
  const sender = greeting.sender.trim();
  const message =
    greeting.message.trim() || "Your heartfelt wishes will appear here…";

  // Longer wishes get smaller type so the card never overflows.
  const size =
    message.length > 280
      ? "xl"
      : message.length > 200
        ? "l"
        : message.length > 120
          ? "m"
          : "s";

  return (
    <article className={`gcard t-${template} msg-${size}`}>
      <span className="gc-frame" />
      <span className="gc-frame gc-frame-inner" />
      {(["tl", "tr", "br", "bl"] as const).map((pos) => (
        <Corner key={pos} pos={pos} />
      ))}

      <div className="gc-inner">
        <div className="gc-emblem">
          <Emblem template={template} />
        </div>

        <p className="gc-kicker">{copy.kicker}</p>
        <p className="gc-top">{copy.top}</p>
        <p className="gc-title">{copy.title}</p>

        <Divider />

        {recipient && <p className="gc-to">Dear {recipient},</p>}
        <p className="gc-message">{message}</p>

        <div className="gc-sign">
          <span>{sender ? "With love & light," : "With love & light"}</span>
          {sender && <strong>{sender}</strong>}
        </div>

        <div className="gc-foot">
          {template === "festival" ? (
            <div className="gc-diyas">
              <Diya id="gcFlameA" />
              <Diya id="gcFlameB" />
              <Diya id="gcFlameC" />
            </div>
          ) : (
            <Dots />
          )}
        </div>
      </div>
    </article>
  );
}