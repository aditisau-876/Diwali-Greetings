// Shared geometry + timing for the Scene 1 → Scene 2 pinned journey.
// Everything is expressed as fractions so it survives any screen size.

export const RANGOLI_IMAGE = { w: 1672, h: 941 };

// Where the centre of the rangoli sits inside courtyard-rangoli.png (0–1).
export const RANGOLI_CENTER = { x: 0.5357, y: 0.535 };

// Where the diya rests in the temple (fraction of the stage).
export const TEMPLE_SPOT = { x: 0.5, y: 0.8 };

// Scroll phases, as fractions of the pinned journey.
export const PHASE = {
  titleOut: [0.02, 0.14] as const,
  travel: [0.1, 0.6] as const,
  crossfade: [0.2, 0.5] as const,
  zoom: [0.1, 0.65] as const,
  caption: [0.7, 0.82] as const,
  exit: [0.88, 1] as const,
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
