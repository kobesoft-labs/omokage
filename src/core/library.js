// defineLibrary(): turns a declarative style definition into an avatar library.
//
// A style only describes *what* to draw — its categories of parts, its palettes and
// a compose() function that stacks layers. Everything else (config merging, color
// resolution, unique ids, outlines, the SVG envelope, seeded randomness and the
// metadata the picker needs) lives here, so every style behaves the same way.
//
//   const Cats = defineLibrary({
//     key: "cats", label: "ねこ",
//     parts: { ears: [...], ... },                         // or `parts` inline on each category
//     categories: [{ key: "ears", label: "みみ", colors: [...] }, ...],
//     groups: [{ label: "かお", cats: ["ears", ...] }],
//     defaults: { ears: "pointy", ... },
//     presets: [{ label: "みけ", ... }],
//     outline: { color: "#33263a", width: 4 },
//     compose(scene) { scene.add(scene.outlined(...)); },
//     random(r) { return { ears: r.pick([...]) }; },
//   });
//
// Parts are plain objects { id, label, ...whatever compose() needs }.
// A part may declare `auto: [main, sub]`: the colors used when the user leaves a
// color slot on "auto".

import { seeded } from "./random.js";

const AUTO_SWATCH = "#d8d2dc";
const VIEWBOX = "0 0 200 200";

/** Outline technique: draw an inflated silhouette of a group first, then the group itself.
 *  Only the outer edge stays visible, so overlapping parts never get inner lines.
 *  Translucent pieces (shadows, highlights) and stroke-only pieces are left out. */
function outlineStyle(cls, color, width) {
  const sel = `.${cls}`;
  return `${sel} *{fill:${color}!important;stroke:${color}!important;stroke-width:${width}px!important;stroke-linejoin:round!important;stroke-linecap:round!important}` +
    `${sel} [fill="none"],${sel} [opacity],${sel} [fill-opacity],${sel} [stroke-opacity]{display:none!important}`;
}

export function defineLibrary(spec) {
  const {
    key, label, categories, groups, defaults, presets = [], palettes = {}, colorNames = {},
    outline = { color: "#33263a", width: 3 }, compose, random: randomize,
    resolveColor = (v) => v,          // style-specific color tokens (e.g. company theme colors)
    autoColor = (token) => token,     // style-specific "auto" tokens (e.g. "body" → body color)
    idPrefix = key.slice(0, 2),
  } = spec;

  // Parts can be given as a { category: parts[] } map, or inline on each category.
  const parts = spec.parts || Object.fromEntries(categories.filter((c) => c.parts).map((c) => [c.key, c.parts]));
  const outlineClass = `${idPrefix}-ol`;
  const css = outlineStyle(outlineClass, outline.color, outline.width);
  let counter = 0;

  const find = (cat, id) => parts[cat].find((p) => p.id === id) || parts[cat][0];
  const resolve = (value, hue) => (value === "auto" ? AUTO_SWATCH : resolveColor(value, { hue }));

  /** Everything compose() needs to draw one avatar. */
  class Scene {
    constructor(config, options) {
      this.config = { ...defaults, ...config };
      this.options = options;
      this.id = idPrefix + counter++;
      this.defs = [];
      this.layers = [];
      this.omit = new Set([].concat(options.omit || []));
    }
    /** The selected part of a category (multi categories: see `selected`). */
    part(cat) { return find(cat, this.config[cat]); }
    /** All selected parts of a multi-select category, in definition order. */
    selected(cat) {
      const ids = [].concat(this.config[cat] || []);
      return ids.map((id) => parts[cat].find((p) => p.id === id)).filter(Boolean);
    }
    /** A config color, resolved to hex. "auto" falls back to `auto` (a hex or a style token). */
    color(name, auto) {
      const v = this.config[name] ?? defaults[name];
      if (v && v !== "auto") return resolveColor(v, this.options);
      return auto ? autoColor(auto, this) : AUTO_SWATCH;
    }
    /** The two color slots of a category ("<cat>Color", "<cat>Color2") for its selected part. */
    slots(cat) {
      const [a, b] = this.part(cat).auto || [];
      return { a: this.color(`${cat}Color`, a), b: this.color(`${cat}Color2`, b) };
    }
    uid(suffix) { return this.id + suffix; }
    define(svg) { this.defs.push(svg); return this; }
    /** Registers a clip path made of one or more path strings; returns its url(). */
    clip(suffix, paths) {
      const id = this.uid(suffix);
      this.define(`<clipPath id="${id}">${[].concat(paths).map((d) => `<path d="${d}"/>`).join("")}</clipPath>`);
      return `url(#${id})`;
    }
    clipped(url, svg) { return svg ? `<g clip-path="${url}">${svg}</g>` : ""; }
    /** Draws `svg` with the style outline around its outer edge. */
    outlined(svg) { return svg ? `<g class="${outlineClass}">${svg}</g>${svg}` : ""; }
    /** Only the outline of `svg` (for shapes whose body is drawn separately). */
    silhouette(svg) { return `<g class="${outlineClass}">${svg}</g>`; }
    add(...svgs) { for (const s of svgs) if (s) this.layers.push(s); return this; }
    toSVG() {
      const bg = this.color("bgColor");
      return `<svg viewBox="${this.options.viewBox || VIEWBOX}" xmlns="http://www.w3.org/2000/svg">` +
        `<defs><style>${css}</style>${this.defs.join("")}</defs>` +
        `<rect width="200" height="200" fill="${bg}"/>\n${this.layers.join("\n")}\n</svg>`;
    }
  }

  /** Renders a config to an SVG string. options: { viewBox, hue, omit, noClip } */
  function render(config = {}, options = {}) {
    const scene = new Scene(config, options);
    compose(scene, { find, parts });
    return scene.toSVG();
  }

  /** A config derived only from `seed`: the same seed always gives the same avatar. */
  function random(seed) {
    return randomize(seeded(seed), { parts, presets, palettes });
  }

  return Object.freeze({
    KEY: key,
    LABEL: label,
    CATEGORIES: categories,
    GROUPS: groups,
    PARTS: parts,
    DEFAULTS: defaults,
    PALETTES: palettes,
    PRESETS: presets,
    render,
    random,
    resolve,
    colorName: (v) => (v === "auto" ? "おまかせ" : colorNames[v] || v),
    ...spec.extras,                   // style-specific additions (e.g. Officers.REGIONS)
  });
}
