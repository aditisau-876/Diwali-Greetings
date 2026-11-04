import Scene1Canvas from "./Scene1Canvas";
import "./scene1.css";

interface Props {
  active: boolean;
}

export default function Scene1({ active }: Props) {
  return (
    <div className="scene1">
      <div className="scene1-background" />
      <div className="scene1-vignette" />
      <div className="scene1-canvas">
        <Scene1Canvas started={true} active={active} />
      </div>
    </div>
  );
}
