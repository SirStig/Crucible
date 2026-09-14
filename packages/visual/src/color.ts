export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function rgbaEqual(a: RGBA, b: RGBA): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export function rgbaKey(c: RGBA): string {
  return `${c.r},${c.g},${c.b},${c.a}`;
}

/**
 * "Redmean", a well-known and cheap approximation of perceptual color
 * distance (weights each RGB channel differently depending on the pair's
 * average red value, correcting for human color sensitivity without a full
 * Lab-space conversion). Alpha is ignored: this only ever compares opaque
 * pixel colors. Source: https://www.compuphase.com/cmetric.htm
 */
export function redmeanDistance(a: RGBA, b: RGBA): number {
  const rMean = (a.r + b.r) / 2;
  const dR = a.r - b.r;
  const dG = a.g - b.g;
  const dB = a.b - b.b;
  return Math.sqrt((2 + rMean / 256) * dR * dR + 4 * dG * dG + (2 + (255 - rMean) / 256) * dB * dB);
}

/** Formats opaque RGB as `#rrggbb` for human-readable findings (alpha dropped, since findings only ever cover opaque pixels). */
export function rgbaToHex(c: RGBA): string {
  const channel = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${channel(c.r)}${channel(c.g)}${channel(c.b)}`;
}

const HEX_PATTERN = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

/** Parses a `#rgb`/`#rrggbb` hex color into opaque RGBA (alpha 255). */
export function hexToRgba(hex: string): RGBA {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match) {
    throw new Error(`CanvasLoop: "${hex}" is not a valid #rgb or #rrggbb hex color.`);
  }
  const raw = match[1]!;
  const full = raw.length === 3 ? raw.replace(/(.)/g, "$1$1") : raw;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
    a: 255,
  };
}
