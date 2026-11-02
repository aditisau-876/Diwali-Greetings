import Scene1 from "./scenes/Scene1/Scene1";
import Scene2 from "./scenes/Scene2/Scene2";
import GreetingCreator from "./scenes/Scene7_GreetingCreator/GreetingCreator";

export default function App() {
  return (
    <main className="experience">
      {/* Scene 1 takes the first screen */}
      <section className="scene-section scene1-section">
        <Scene1 />
      </section>

      {/* Scene 2 sits naturally below Scene 1 */}
      <section className="scene-section scene2-section">
        <Scene2 />
      </section>

      {/* Greeting Creator follows below Scene 2 */}
      <section className="scene-section greeting-section">
        <GreetingCreator />
      </section>
    </main>
  );
}