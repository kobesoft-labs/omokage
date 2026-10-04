// The catalog: everything a UI needs to offer a style's choices, as plain JSON.
// No functions, no DOM — render it with any framework, send it over the wire, or
// snapshot it (tools/build.mjs writes dist/catalog.json).
import { getStyle } from "../registry.js";

const HEX = /^#[0-9a-f]{6}$/i;
const kindOf = (v) => (v === "auto" ? "auto" : v.startsWith("theme") ? "theme" : "color");

/**
 * @param {string} style  style KEY
 * @param {{hue?: number}} [options]  theme hue used to compute swatch colors
 * @returns {{
 *   style: {key: string, label: string},
 *   groups: {label: string, categories: string[]}[],
 *   categories: {key: string, label: string, multi: boolean, view: string|null,
 *                parts: {id: string, label: string}[],
 *                colors: {key: string, label: string, swatches: {value: string, hex: string, name: string, kind: "color"|"theme"|"auto"}[]}[]}[],
 *   defaults: object
 * }}
 */
export function catalog(style, { hue } = {}) {
  const S = getStyle(style);
  return {
    style: { key: S.KEY, label: S.LABEL },
    groups: (S.GROUPS || [{ label: S.LABEL, cats: S.CATEGORIES.map((c) => c.key) }]).map((g) => ({ label: g.label, categories: [...g.cats] })),
    categories: S.CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      multi: !!c.multi,
      view: c.view || null,
      parts: (S.PARTS[c.key] || []).map((p) => ({ id: p.id, label: p.label })),
      colors: (c.colors || []).map((slot) => ({
        key: slot.key,
        label: slot.label,
        swatches: slot.palette.map((value) => ({ value, hex: S.resolve(value, hue), name: S.colorName(value), kind: kindOf(value) })),
      })),
    })),
    defaults: JSON.parse(JSON.stringify(S.DEFAULTS)),
  };
}

export const isHexColor = (v) => typeof v === "string" && HEX.test(v);
