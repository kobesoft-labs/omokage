// The avatar value { style, config } and the rules for keeping it valid.
//
// A config may be partial: missing keys fall back to the style's defaults. These helpers
// convert between the full form (convenient while editing) and the compact form (what
// you store), and clean values that come from outside — a custom UI, a request body,
// an old database row — before they are rendered or saved.
import { getStyle, hasStyle } from "../registry.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HEX = /^#[0-9a-f]{6}$/i;

/** Every key of a style's config, with what kind of value it holds. */
export function schemaOf(style) {
  const S = typeof style === "string" ? getStyle(style) : style;
  const keys = {};
  for (const c of S.CATEGORIES) {
    if (S.PARTS[c.key]) keys[c.key] = { type: c.multi ? "parts" : "part", ids: S.PARTS[c.key].map((p) => p.id) };
    for (const slot of c.colors || []) keys[slot.key] = { type: "color", tokens: slot.palette.filter((v) => !HEX.test(v)) };
  }
  for (const k of Object.keys(S.DEFAULTS)) if (!keys[k]) keys[k] = { type: "color", tokens: [] };
  return keys;
}

/** The full config: every key present, defaults filled in. */
export const complete = (style, config = {}) => ({ ...getStyle(style).DEFAULTS, ...config });

/** The compact config: only what differs from the defaults. */
export function compact(style, config = {}) {
  const defaults = getStyle(style).DEFAULTS;
  return Object.fromEntries(Object.entries(config).filter(([k, v]) => !same(v, defaults[k])));
}

/**
 * Checks an avatar from an untrusted source. Unknown keys are dropped, unknown part ids
 * and malformed colors fall back to the defaults.
 * @returns {{ ok: boolean, value: {style: string, config: object} | null, errors: string[] }}
 */
export function validate(avatar) {
  const errors = [];
  if (!avatar || typeof avatar !== "object") return { ok: false, value: null, errors: ["avatar must be an object"] };
  if (!hasStyle(avatar.style)) return { ok: false, value: null, errors: [`unknown style "${avatar.style}"`] };
  const schema = schemaOf(avatar.style);
  const input = avatar.config && typeof avatar.config === "object" ? avatar.config : {};
  const config = {};
  for (const [key, value] of Object.entries(input)) {
    const rule = schema[key];
    if (!rule) { errors.push(`unknown key "${key}"`); continue; }
    if (rule.type === "part") {
      if (rule.ids.includes(value)) config[key] = value; else errors.push(`unknown ${key} "${value}"`);
    } else if (rule.type === "parts") {
      const list = Array.isArray(value) ? value : [];
      const kept = [...new Set(list.filter((id) => rule.ids.includes(id)))];
      if (kept.length !== list.length || !Array.isArray(value)) errors.push(`invalid ${key}`);
      config[key] = kept;
    } else if (typeof value === "string" && (HEX.test(value) || rule.tokens.includes(value))) {
      config[key] = value.toLowerCase();
    } else errors.push(`invalid color ${key} "${value}"`);
  }
  return { ok: errors.length === 0, value: { style: avatar.style, config: compact(avatar.style, config) }, errors };
}

/** validate() without the report: always returns a clean avatar (throws only for an unknown style). */
export function normalize(avatar) {
  const { value, errors } = validate(avatar);
  if (!value) throw new Error(`omokage: ${errors[0]}`);
  return value;
}
