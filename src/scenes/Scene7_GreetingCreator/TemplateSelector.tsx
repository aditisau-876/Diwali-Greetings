
import type { GreetingTemplate } from "../../types/greeting";

interface Props {
  selected: GreetingTemplate;
  onSelect: (template: GreetingTemplate) => void;
}

const templates = [
  {
    id: "royal",
    name: "Royal Heritage",
    description: "Ornate borders & antique gold",
    label: "TIMELESS",
    symbol: "✺",
    greeting: "Happy",
    title: "Diwali",
  },
  {
    id: "rangoli",
    name: "Rangoli Bloom",
    description: "Colourful floral mandala artistry",
    label: "ARTISTIC",
    symbol: "❀",
    greeting: "Shubh",
    title: "Diwali",
  },
  {
    id: "midnight",
    name: "Midnight Celebration",
    description: "Golden fireworks & night skies",
    label: "CINEMATIC",
    symbol: "✧",
    greeting: "Happy",
    title: "Diwali",
  },
  {
    id: "minimal",
    name: "Minimal Luxe",
    description: "Ivory, champagne & elegant type",
    label: "ELEGANT",
    symbol: "✦",
    greeting: "Wishing You",
    title: "Light",
  },
  {
    id: "festival",
    name: "Festival of Lights",
    description: "Traditional diyas & festive colours",
    label: "FESTIVE",
    symbol: "🪔",
    greeting: "Happy",
    title: "Diwali",
  },
  {
    id: "peacock",
    name: "Peacock Elegance",
    description: "Emerald hues & golden feathers",
    label: "ROYAL",
    symbol: "🪶",
    greeting: "Happy",
    title: "Diwali",
  },
] as const;

export default function TemplateSelector({
  selected,
  onSelect,
}: Props) {
  return (
    <section className="template-section">

      <div className="template-heading">
        <div>
          <h3>Design</h3>
          <p>Pick the look of your card.</p>
        </div>


      </div>

      <div className="template-gallery">

        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className={`template-option template-${template.id} ${
              selected === template.id ? "selected" : ""
            }`}
            onClick={() => onSelect(template.id)}
            aria-pressed={selected === template.id}
          >

            {/* Miniature card artwork */}

            <div className="template-art">

              <div className="template-art-frame">

                <span className="template-art-corner top-left">
                  ✦
                </span>

                <span className="template-art-corner top-right">
                  ✦
                </span>

                <span className="template-art-label">
                  {template.label}
                </span>

                <span className="template-art-symbol">
                  {template.symbol}
                </span>

                <span className="template-art-greeting">
                  {template.greeting}
                </span>

                <span className="template-art-title">
                  {template.title}
                </span>

                <span className="template-art-divider">
                  ✦
                </span>

                <span className="template-art-message">
                  A wish filled with light
                </span>

                <div className="template-art-bottom">
                  <span>✧</span>
                  <span>✺</span>
                  <span>✧</span>
                </div>

                <span className="template-art-corner bottom-left">
                  ✦
                </span>

                <span className="template-art-corner bottom-right">
                  ✦
                </span>

              </div>

              {selected === template.id && (
                <span className="template-selected-indicator">
                  ✓
                </span>
              )}


            </div>

            {/* Template information */}

            <div className="template-info">

              <div>
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </div>

              <span className="template-arrow">
                ↗
              </span>

            </div>

          </button>
        ))}

      </div>


    </section>
  );
}
