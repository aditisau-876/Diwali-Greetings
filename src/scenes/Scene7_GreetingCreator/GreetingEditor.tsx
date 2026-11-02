
import type { GreetingData } from "../../types/greeting";
import { UserRound, Send, MessageSquare } from "lucide-react";

interface Props {
  greeting: GreetingData;
  onChange: (updated: Partial<GreetingData>) => void;
}

export default function GreetingEditor({ greeting, onChange }: Props) {
  return (
    <section className="editor-panel">
      <div className="panel-heading">
        <span className="eyebrow">MAKE IT PERSONAL</span>
        <h2>Create your greeting</h2>
        <p>A little love makes every celebration special.</p>
      </div>

      <label className="field-label">
        <UserRound size={16} />
        Recipient's name
      </label>
      <input
        className="greeting-input"
        value={greeting.recipient}
        maxLength={40}
        placeholder="Who are you sending this to?"
        onChange={(e) => onChange({ recipient: e.target.value })}
      />

      <label className="field-label">
        <Send size={16} />
        Your name
      </label>
      <input
        className="greeting-input"
        value={greeting.sender}
        maxLength={40}
        placeholder="Your name"
        onChange={(e) => onChange({ sender: e.target.value })}
      />

      <label className="field-label">
        <MessageSquare size={16} />
        Your Diwali wishes
      </label>
      <textarea
        className="greeting-input greeting-message"
        value={greeting.message}
        maxLength={350}
        placeholder="Write your heartfelt wishes..."
        onChange={(e) => onChange({ message: e.target.value })}
      />

      <div className="character-count">
        {greeting.message.length}/350 characters
      </div>
    </section>
  );
}
