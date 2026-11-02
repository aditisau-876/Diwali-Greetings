
export const SCENE1_TIMELINE = {
  temple: { start: 0, duration: 2.5 },
  bell: { start: 2.0, duration: 1.8 },
  lantern: { start: 3.5, duration: 2.0 },
  diya: { start: 4.5, duration: 2.0 },
  flame: { start: 6.2, duration: 1.8 },
};

export function revealProgress(
  elapsed: number,
  start: number,
  duration: number,
) {
  const value = (elapsed - start) / duration;
  const clamped = Math.max(0, Math.min(1, value));

  // Smooth ease-in-out
  return clamped * clamped * (3 - 2 * clamped);
}
