
import Scene1Canvas from "./Scene1Canvas";
import "./scene1.css";

export default function Scene1() {
  return (
    <main className="scene1">
      <div className="scene1-background" />

      <div className="scene1-vignette" />

      <div className="scene1-canvas">
        <Scene1Canvas started={true} />
      </div>

      <header className="scene1-title">
        <h1>A Light Within</h1>
        <p>One flame. A thousand lights.</p>
      </header>
    </main>
  );
}
