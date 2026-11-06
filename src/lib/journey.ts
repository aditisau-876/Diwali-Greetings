// Shared geometry + timing for the Scene 1 → Scene 2 pinned journey.
// Everything is expressed as fractions so it survives any screen size.

export const RANGOLI_IMAGE = { w: 1672, h: 941 };

// Where the centre of the rangoli sits inside courtyard-rangoli.png (0–1).
export const RANGOLI_CENTER = { x: 0.5357, y: 0.535 };

// Where the diya rests in the temple (fraction of the stage).
export const TEMPLE_SPOT = { x: 0.5, y: 0.8 };

// Scroll phases, as fractions of the whole pinned journey (880svh tall, so
// 780vh of scroll). Scenes 1-2 keep their original pace; Scenes 4 and 5 get
// their own generous stretches so nothing changes abruptly on a small scroll.
export const PHASE = {
  // Scene 1 -> Scene 2 (unchanged feel)
  titleOut: [0.006, 0.043] as const,
  travel: [0.031, 0.185] as const,
  crossfade: [0.0615, 0.154] as const,
  zoom: [0.031, 0.2] as const,
  caption: [0.215, 0.252] as const,
  captionOut: [0.285, 0.315] as const,

  // the 3D diya leaves the stage before the palace images arrive
  diyaOut: [0.3, 0.345] as const,

  // Scene 4: each image dissolves in over the previous one
  img1: [0.33, 0.42] as const,
  img2: [0.46, 0.55] as const,
  img3: [0.59, 0.68] as const,
  img4: [0.72, 0.81] as const,

  // Scene 5: fireworks
  fireworks: [0.8, 0.86] as const, // ramps the show up
  finale: 0.925,
  fireworksCaption: [0.865, 0.895, 0.935, 0.95] as const,

  // fade to black, handing over to Scene 6
  exit: [0.955, 1] as const,
};

/** Rectangle of an `object-fit: cover` image, centred inside a w×h box. */
export function coverRect(w: number, h: number) {
  const s = Math.max(w / RANGOLI_IMAGE.w, h / RANGOLI_IMAGE.h);
  const rw = RANGOLI_IMAGE.w * s;
  const rh = RANGOLI_IMAGE.h * s;
  return { x: (w - rw) / 2, y: (h - rh) / 2, w: rw, h: rh };
}

export function smootherstep(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}