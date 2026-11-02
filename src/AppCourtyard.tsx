
import ExperienceCanvas from "./three/ExperienceCanvas";

export default function App() {
  return (
    <main className="experience">

      {/* Palace courtyard and rangoli image */}
      <div className="courtyard-background">
        <img
          src="/images/courtyard-rangoli.png"
          alt="Colourful rangoli in an ancient palace courtyard"
        />
      </div>

      {/* Cinematic darkness */}
      <div className="cinematic-overlay" />

      {/* Future 3D diya layer */}
      <div className="scene-container">
        <ExperienceCanvas />
      </div>

      {/* Opening typography */}
      <header className="brand">
        <h1>A Light Within</h1>
        <p>One flame. A thousand lights.</p>
      </header>

      <div className="scroll-hint">
        SCROLL TO EXPERIENCE THE LIGHT
        <span>↓</span>
      </div>

    </main>
  );
}
