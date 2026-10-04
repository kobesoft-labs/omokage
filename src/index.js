// omokage — part-based SVG avatars.
//
// An avatar is stored as a small JSON value: { style: "yokai", config: { body: "kasa", ... } }.
//
// The package is layered so each part can be used on its own:
//   rendering   render(), random(), presets(), mount()             avatar → SVG
//   model       catalog(), createEditor(), validate(), normalize()  data and state, no DOM
//   picker      openPicker()                                        a ready-made dialog built on the model
//   styles      defineLibrary(), registerStyle()                    add your own style
//
// Building your own customizer UI? Use catalog() for what to offer and createEditor()
// for state and actions; validate() whatever comes back before you store it.
import { Officers } from "./styles/officers/index.js";
import { Yokai } from "./styles/yokai.js";
import { Animals } from "./styles/animals.js";
import { Game } from "./styles/game.js";
import { registerStyle, listStyles, getStyle, resolveStyles } from "./registry.js";
import { openPicker as openPickerWith } from "./picker/index.js";
import { mount as mountInto, mountAll as mountAllIn } from "./mount.js";

export { defineLibrary } from "./core/library.js";
export * as draw from "./core/draw.js";
export * as color from "./core/color.js";
export { Officers, Yokai, Animals, Game };
export { registerStyle, listStyles, getStyle };
export { catalog } from "./model/catalog.js";
export { createEditor } from "./model/editor.js";
export { validate, normalize, complete, compact, schemaOf } from "./model/avatar.js";

export const VERSION = typeof __VERSION__ === "string" ? __VERSION__ : "dev";

[Officers, Yokai, Animals, Game].forEach(registerStyle);

// ---------------------------------------------------------------- rendering

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

/** Renders an avatar into an element (the SVG fills it). */
export const mount = (el, avatar, options = {}) => mountInto(el, avatar, options, { render });

/** Renders every [data-omokage] element under `root` (default: the whole document). */
export const mountAll = (root) => mountAllIn(root, { render, random });

// ---------------------------------------------------------------- picker

/**
 * Opens the picker dialog. Offers every registered style unless `styles` (keys or
 * style objects) is given. Resolves to { style, config, svg }, or null when cancelled.
 */
export function openPicker(options = {}) {
  return openPickerWith({ ...options, styles: resolveStyles(options.styles) });
}
