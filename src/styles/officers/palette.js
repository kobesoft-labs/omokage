// Officers palettes. Besides hex colors, a value may be a theme token that follows
// the company color passed as `hue` when rendering:
//   theme, theme-dark, theme-light, theme-bg, theme-accent
import { hsl } from "../../core/color.js";

export const PALETTES = {
  skin:  ["#fde4d3", "#fbdcc8", "#f3c9a8", "#e9b48e", "#d99e76", "#c48659", "#a26b45", "#83563a", "#62402b", "#4a2f20"],
  hair:  ["#2b2429", "#4b3428", "#7c4e30", "#a0663a", "#dcae63", "#f0d9a0", "#b9b5bb", "#e8e6ea", "#a9523b", "#d2724a", "#8c8a96", "#3f5fa8", "#e58fb4", "#4f9a7a", "#7a5bb0"],
  eyes:  ["#5a3a2a", "#2b2233", "#3d6fb6", "#3f8a6a", "#8a6a3a", "#7a5bb0"],
  item:  ["theme", "theme-dark", "theme-light", "theme-accent", "#2b2233", "#ffffff", "#3a3f4b", "#8c8a96", "#d94a4a", "#e8833a", "#f2c94c", "#4fae6a", "#3a8fd9", "#2f4a8a", "#8e5bd0", "#e58fb4", "#a6714a", "#c9a227"],
  lips:  ["#d65a6f", "#c0392b", "#e8899a", "#a8505f", "#b5654a"],
  bg:    ["theme-bg", "#ffffff", "#f4efe6", "#fde2e4", "#fff1c9", "#dff3e4", "#dbeafe", "#e9e1fb", "#2b2233", "#3a3f4b"],
};

export const DEFAULT_HUE = 215;

export function resolveTheme(value, { hue } = {}) {
  if (!value || value[0] === "#") return value;
  const h = (((hue ?? DEFAULT_HUE) % 360) + 360) % 360;
  switch (value) {
    case "theme":        return hsl(h, 55, 52);
    case "theme-dark":   return hsl(h, 32, 27);
    case "theme-light":  return hsl(h, 60, 87);
    case "theme-bg":     return hsl(h, 50, 91);
    case "theme-accent": return hsl((h + 160) % 360, 68, 56);
    default:             return "#888888";
  }
}

export const COLOR_NAMES = {
  theme: "テーマ色", "theme-dark": "テーマ色（濃）", "theme-light": "テーマ色（淡）", "theme-bg": "テーマ色（背景）", "theme-accent": "テーマ色（差し色）",
};
