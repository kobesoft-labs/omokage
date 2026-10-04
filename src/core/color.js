// Color helpers. Every color in this package is a "#rrggbb" string.

const toRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb) =>
  "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

/** Linear blend from `a` (t = 0) to `b` (t = 1). */
export const mix = (a, b, t) => {
  const x = toRgb(a), y = toRgb(b);
  return toHex(x.map((v, i) => v * (1 - t) + y[i] * t));
};

/**
 * Shadows lean toward a deep violet instead of black. Using the same shadow hue for
 * skin, hair and cloth is what makes every palette look like it shares one light.
 */
export const SHADOW = "#1a1226";
export const shade = (c, t) => mix(c, SHADOW, t);
export const lighten = (c, t) => mix(c, "#ffffff", t);

/** Perceived brightness in 0..1. */
export const luminance = (c) => {
  const [r, g, b] = toRgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** HSL (h: 0..360, s/l: 0..100) to hex. */
export const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};

export const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
