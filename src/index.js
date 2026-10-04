// omokage — part-based SVG avatars with a ready-made picker.
//
// An avatar is stored as a small JSON value: { style: "yokai", config: { body: "kasa", ... } }.
// Render it whenever you need pixels:
//
//   import { render, random, openPicker } from "omokage";
//   const avatar = random("tanaka", { style: "animals" });
//   element.innerHTML = render(avatar);
//   const picked = await openPicker({ value: avatar });   // { style, config, svg } | null
import { Officers } from "./styles/officers/index.js";
import { Yokai } from "./styles/yokai.js";
import { Animals } from "./styles/animals.js";
import { Game } from "./styles/game.js";
import { openPicker as openPickerWith } from "./picker/index.js";
import { mount as mountInto, mountAll as mountAllIn } from "./mount.js";

export { defineLibrary } from "./core/library.js";
export * as draw from "./core/draw.js";
export * as color from "./core/color.js";
export { Officers, Yokai, Animals, Game };

export const VERSION = typeof __VERSION__ === "string" ? __VERSION__ : "dev";

const registry = new Map();

/** Makes a style available to render(), random() and openPicker() by its KEY. */
export function registerStyle(style) {
  if (!style || !style.KEY || typeof style.render !== "function") throw new Error("omokage: registerStyle() expects a library made with defineLibrary()");
  registry.set(style.KEY, style);
  return style;
}
[Officers, Yokai, Animals, Game].forEach(registerStyle);

/** All registered styles, in registration order. */
export const listStyles = () => [...registry.values()];

/** The style with this KEY. Throws for unknown keys. */
export function getStyle(key) {
  const style = registry.get(key);
  if (!style) throw new Error(`omokage: unknown style "${key}" (available: ${[...registry.keys()].join(", ")})`);
  return style;
}

/**
 * Renders an avatar to an SVG string.
 * @param {{style: string, config?: object}} avatar
 * @param {{hue?: number, viewBox?: string}} [options]  hue: company theme color (0–359)
 */
export function render(avatar, options = {}) {
  return getStyle(avatar.style).render(avatar.config || {}, options);
}

/** A seeded avatar: the same seed always gives the same result. */
export function random(seed, { style = "officers" } = {}) {
  return { style, config: getStyle(style).random(seed) };
}

/** The style's ready-made characters as avatars, e.g. for a gallery. */
export function presets(style) {
  return getStyle(style).PRESETS.map(({ label, ...config }) => ({ label, avatar: { style, config } }));
}

/** An SVG string as a data URI, for <img src> or CSS backgrounds. */
export const toDataURI = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Opens the picker dialog. Offers every registered style unless `styles` (keys or
 * libraries) is given. Resolves to { style, config, svg }, or null when cancelled.
 */
export function openPicker(options = {}) {
  const styles = (options.styles || listStyles()).map((s) => (typeof s === "string" ? getStyle(s) : s));
  return openPickerWith({ ...options, styles });
}

/** Renders an avatar into an element (the SVG fills it). */
export const mount = (el, avatar, options = {}) => mountInto(el, avatar, options, { render });

/** Renders every [data-omokage] element under `root` (default: the whole document). */
export const mountAll = (root) => mountAllIn(root, { render, random });
