import { toPng } from "html-to-image";

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** Renders the (untransformed) export card to a PNG data URL. */
export async function renderCardPng(node: HTMLElement): Promise<string> {
  await document.fonts.ready;

  const options = {
    pixelRatio: 3,
    cacheBust: true,
    style: { boxShadow: "none", margin: "0", transform: "none" },
  };

  // Safari often paints blank on the first pass; the second is reliable.
  if (isSafari()) {
    try {
      await toPng(node, { ...options, pixelRatio: 1 });
    } catch {
      /* warm-up only */
    }
  }

  try {
    return await toPng(node, options);
  } catch {
    // Web-font embedding can fail on strict networks; fall back to system fonts.
    return await toPng(node, { ...options, skipFonts: true });
  }
}

export function fileNameFor(recipient: string) {
  const safe = (recipient || "Someone-Special")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");
  return `Diwali-Greeting-${safe}.png`;
}
