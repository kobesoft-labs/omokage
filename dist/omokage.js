/*! omokage v0.2.0 | BSD-3-Clause | https://github.com/kobesoft-labs/omokage */
var Omokage = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser.js
  var browser_exports = {};
  __export(browser_exports, {
    Animals: () => Animals,
    Game: () => Game,
    Officers: () => Officers,
    VERSION: () => VERSION,
    Yokai: () => Yokai,
    color: () => color_exports,
    defineLibrary: () => defineLibrary,
    draw: () => draw_exports,
    getStyle: () => getStyle,
    listStyles: () => listStyles,
    mount: () => mount2,
    mountAll: () => mountAll2,
    openPicker: () => openPicker2,
    presets: () => presets,
    random: () => random,
    registerStyle: () => registerStyle,
    render: () => render,
    toDataURI: () => toDataURI
  });

  // src/core/random.js
  var hash = (s) => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return h >>> 0;
  };
  function seeded(seed) {
    let a = hash(String(seed));
    const r = () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    r.pick = (list) => list[Math.floor(r() * list.length)];
    r.chance = (p) => r() < p;
    return r;
  }

  // src/core/library.js
  var AUTO_SWATCH = "#d8d2dc";
  var VIEWBOX = "0 0 200 200";
  function outlineStyle(cls, color, width) {
    const sel = `.${cls}`;
    return `${sel} *{fill:${color}!important;stroke:${color}!important;stroke-width:${width}px!important;stroke-linejoin:round!important;stroke-linecap:round!important}${sel} [fill="none"],${sel} [opacity],${sel} [fill-opacity],${sel} [stroke-opacity]{display:none!important}`;
  }
  function defineLibrary(spec) {
    const {
      key,
      label,
      categories,
      groups,
      defaults,
      presets: presets2 = [],
      palettes = {},
      colorNames = {},
      outline = { color: "#33263a", width: 3 },
      compose: compose5,
      random: randomize,
      resolveColor = (v) => v,
      // style-specific color tokens (e.g. company theme colors)
      autoColor = (token) => token,
      // style-specific "auto" tokens (e.g. "body" → body color)
      idPrefix = key.slice(0, 2)
    } = spec;
    const parts = spec.parts || Object.fromEntries(categories.filter((c) => c.parts).map((c) => [c.key, c.parts]));
    const outlineClass = `${idPrefix}-ol`;
    const css = outlineStyle(outlineClass, outline.color, outline.width);
    let counter = 0;
    const find = (cat, id) => parts[cat].find((p) => p.id === id) || parts[cat][0];
    const resolve = (value, hue) => value === "auto" ? AUTO_SWATCH : resolveColor(value, { hue });
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
      part(cat) {
        return find(cat, this.config[cat]);
      }
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
      uid(suffix) {
        return this.id + suffix;
      }
      define(svg) {
        this.defs.push(svg);
        return this;
      }
      /** Registers a clip path made of one or more path strings; returns its url(). */
      clip(suffix, paths) {
        const id = this.uid(suffix);
        this.define(`<clipPath id="${id}">${[].concat(paths).map((d) => `<path d="${d}"/>`).join("")}</clipPath>`);
        return `url(#${id})`;
      }
      clipped(url, svg) {
        return svg ? `<g clip-path="${url}">${svg}</g>` : "";
      }
      /** Draws `svg` with the style outline around its outer edge. */
      outlined(svg) {
        return svg ? `<g class="${outlineClass}">${svg}</g>${svg}` : "";
      }
      /** Only the outline of `svg` (for shapes whose body is drawn separately). */
      silhouette(svg) {
        return `<g class="${outlineClass}">${svg}</g>`;
      }
      add(...svgs) {
        for (const s of svgs) if (s) this.layers.push(s);
        return this;
      }
      toSVG() {
        const bg = this.color("bgColor");
        return `<svg viewBox="${this.options.viewBox || VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><defs><style>${css}</style>${this.defs.join("")}</defs><rect width="200" height="200" fill="${bg}"/>
${this.layers.join("\n")}
</svg>`;
      }
    }
    function render2(config = {}, options = {}) {
      const scene = new Scene(config, options);
      compose5(scene, { find, parts });
      return scene.toSVG();
    }
    function random2(seed) {
      return randomize(seeded(seed), { parts, presets: presets2, palettes });
    }
    return Object.freeze({
      KEY: key,
      LABEL: label,
      CATEGORIES: categories,
      GROUPS: groups,
      PARTS: parts,
      DEFAULTS: defaults,
      PALETTES: palettes,
      PRESETS: presets2,
      render: render2,
      random: random2,
      resolve,
      colorName: (v) => v === "auto" ? "\u304A\u307E\u304B\u305B" : colorNames[v] || v,
      ...spec.extras
      // style-specific additions (e.g. Officers.REGIONS)
    });
  }

  // src/core/draw.js
  var draw_exports = {};
  __export(draw_exports, {
    C: () => C,
    E: () => E,
    M: () => M,
    P: () => P,
    S: () => S,
    T: () => T,
    blushGradient: () => blushGradient,
    both: () => both,
    f2: () => f2,
    quadPoints: () => quadPoints,
    ring: () => ring,
    taper: () => taper,
    wave: () => wave
  });
  var f2 = (v) => +v.toFixed(2);
  var P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
  var S = (d, stroke, width = 3, extra = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  var C = (cx, cy, r, fill, extra = "") => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${r}" fill="${fill}" ${extra}/>`;
  var E = (cx, cy, rx, ry, fill, extra = "") => `<ellipse cx="${f2(cx)}" cy="${f2(cy)}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  var M = (svg) => `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
  var both = (svg) => svg + M(svg);
  function taper(x0, y0, cx, cy, x1, y1, t) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * t, ny = dx / len * t;
    return `M${f2(x0)} ${f2(y0)} Q${f2(cx + nx)} ${f2(cy + ny)} ${f2(x1)} ${f2(y1)} Q${f2(cx - nx)} ${f2(cy - ny)} ${f2(x0)} ${f2(y0)}Z`;
  }
  var T = (points, fill, t, extra = "") => `<path d="${taper(...points, t)}" fill="${fill}" ${extra}/>`;
  var quadPoints = (d) => d.match(/-?[\d.]+/g).map(Number);
  function wave(cx, cy, rx, ry, a0, a1, n, bump, dir = 1, withMove = true) {
    const at = (a) => [cx + rx * Math.cos(a * Math.PI / 180), cy + ry * Math.sin(a * Math.PI / 180)];
    let d = "";
    for (let i = 0; i < n; i++) {
      const [x0, y0] = at(a0 + (a1 - a0) * i / n), [x1, y1] = at(a0 + (a1 - a0) * (i + 1) / n);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(mx - cx, my - cy) || 1;
      d += (i === 0 && withMove ? `M${f2(x0)} ${f2(y0)} ` : "") + `Q${f2(mx + (mx - cx) / l * bump * dir)} ${f2(my + (my - cy) / l * bump * dir)} ${f2(x1)} ${f2(y1)} `;
    }
    return d;
  }
  function ring(cx, cy, radius, n, r, a0 = 0, a1 = 360) {
    return Array.from({ length: n }, (_, i) => {
      const a = (a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180;
      return [cx + radius * Math.cos(a), cy + radius * Math.sin(a), r];
    });
  }
  var blushGradient = (id, color = "#ff6f73", alpha = 0.5, middle = alpha / 2) => `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${alpha}"/><stop offset=".6" stop-color="${color}" stop-opacity="${middle}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

  // src/core/color.js
  var color_exports = {};
  __export(color_exports, {
    SHADOW: () => SHADOW,
    hsl: () => hsl,
    isHex: () => isHex,
    lighten: () => lighten,
    luminance: () => luminance,
    mix: () => mix,
    shade: () => shade
  });
  var toRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  var toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  var mix = (a, b, t) => {
    const x = toRgb(a), y = toRgb(b);
    return toHex(x.map((v, i) => v * (1 - t) + y[i] * t));
  };
  var SHADOW = "#1a1226";
  var shade = (c, t) => mix(c, SHADOW, t);
  var lighten = (c, t) => mix(c, "#ffffff", t);
  var luminance = (c) => {
    const [r, g, b] = toRgb(c);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  var hsl = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
  };
  var isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

  // src/styles/officers/geometry.js
  var INK = "#2b2233";
  var LINE = "#3a2d3e";
  var LINE_W = 3;
  var FACE = "M100 50 C121 50 134 64 134 88 C134 100 133 110 129 119 C123 131 112 138 100 138 C88 138 77 131 71 119 C67 110 66 100 66 88 C66 64 79 50 100 50Z";
  var EAR = "M68 92 C59 89 56 103 61 110 C63 113 67 113 69 111Z";
  var EAR_IN = "M65 97 C61 99 62 105 66 107";
  var NECK = "M88 116 L88 150 C92 156 108 156 112 150 L112 116Z";
  var NECK_SHADOW = "M88 122 C94 136 106 136 112 122 L112 138 C106 146 94 146 88 138Z";
  var BODY = "M100 148 C80 148 64 150 52 156 C36 163 28 176 26 200 L174 200 C172 176 164 163 148 156 C136 150 120 148 100 148Z";
  var BODY_SIDES = "M26 200 C28 178 36 164 50 157 C46 170 46 186 48 200Z M174 200 C172 178 164 164 150 157 C154 170 154 186 152 200Z";
  var FACE_SHADE = "M134 82 C135 108 124 132 100 138.4 C116 128 127 108 128.6 84Z";
  var EYE_X = [87, 113];
  var OPEN = {
    neck: "M88 130 L88 149 C94 152 106 152 112 149 L112 130Z",
    // closed collar: only the neck shows
    crew: "M86 130 L86 147 C90 159 110 159 114 147 L114 130Z",
    crewLow: "M84 130 L84 148 C90 163 110 163 116 148 L116 130Z",
    v: "M87 130 L87 147 L100 168 L113 147 L113 130Z",
    collar: "M89 130 L89 147 L100 161 L111 147 L111 130Z",
    // open shirt collar
    zip: "M90 130 L90 148 L100 160 L110 148 L110 130Z",
    vest: "M86 130 L86 148 L100 176 L114 148 L114 130Z",
    jacket: "M84 130 L84 147 L100 186 L116 147 L116 130Z",
    // buttoned suit jacket
    front: "M83 130 L83 147 L96 200 L104 200 L117 147 L117 130Z",
    // open front: blazers, cardigans
    kimono: "M85 130 L85 146 L100 174 L115 146 L115 130Z"
  };
  var CLOTH_AREA = [BODY, "M56 168 C56 116 144 116 144 168Z", "M84 116 L116 116 L116 160 L84 160Z"];
  var BEARD_AREA = "M64 92 C64 132 80 156 100 164 C120 156 136 132 136 92Z";
  var GLASSES_AREA = "M54 82 L146 82 L146 116 L54 116Z";
  var EARRING_AREA = "M50 104 L76 104 L76 136 L50 136Z M124 104 L150 104 L150 136 L124 136Z";
  var REGIONS = {
    eyes: [FACE],
    brows: [FACE],
    nose: [FACE],
    mouth: [FACE],
    face: [FACE],
    beard: [FACE, BEARD_AREA],
    glasses: [FACE, GLASSES_AREA],
    earrings: [EARRING_AREA],
    top: CLOTH_AREA,
    neck: CLOTH_AREA,
    chest: CLOTH_AREA
  };

  // src/styles/officers/palette.js
  var PALETTES = {
    skin: ["#fde4d3", "#fbdcc8", "#f3c9a8", "#e9b48e", "#d99e76", "#c48659", "#a26b45", "#83563a", "#62402b", "#4a2f20"],
    hair: ["#2b2429", "#4b3428", "#7c4e30", "#a0663a", "#dcae63", "#f0d9a0", "#b9b5bb", "#e8e6ea", "#a9523b", "#d2724a", "#8c8a96", "#3f5fa8", "#e58fb4", "#4f9a7a", "#7a5bb0"],
    eyes: ["#5a3a2a", "#2b2233", "#3d6fb6", "#3f8a6a", "#8a6a3a", "#7a5bb0"],
    item: ["theme", "theme-dark", "theme-light", "theme-accent", "#2b2233", "#ffffff", "#3a3f4b", "#8c8a96", "#d94a4a", "#e8833a", "#f2c94c", "#4fae6a", "#3a8fd9", "#2f4a8a", "#8e5bd0", "#e58fb4", "#a6714a", "#c9a227"],
    lips: ["#d65a6f", "#c0392b", "#e8899a", "#a8505f", "#b5654a"],
    bg: ["theme-bg", "#ffffff", "#f4efe6", "#fde2e4", "#fff1c9", "#dff3e4", "#dbeafe", "#e9e1fb", "#2b2233", "#3a3f4b"]
  };
  var DEFAULT_HUE = 215;
  function resolveTheme(value, { hue } = {}) {
    if (!value || value[0] === "#") return value;
    const h = ((hue ?? DEFAULT_HUE) % 360 + 360) % 360;
    switch (value) {
      case "theme":
        return hsl(h, 55, 52);
      case "theme-dark":
        return hsl(h, 32, 27);
      case "theme-light":
        return hsl(h, 60, 87);
      case "theme-bg":
        return hsl(h, 50, 91);
      case "theme-accent":
        return hsl((h + 160) % 360, 68, 56);
      default:
        return "#888888";
    }
  }
  var COLOR_NAMES = {
    theme: "\u30C6\u30FC\u30DE\u8272",
    "theme-dark": "\u30C6\u30FC\u30DE\u8272\uFF08\u6FC3\uFF09",
    "theme-light": "\u30C6\u30FC\u30DE\u8272\uFF08\u6DE1\uFF09",
    "theme-bg": "\u30C6\u30FC\u30DE\u8272\uFF08\u80CC\u666F\uFF09",
    "theme-accent": "\u30C6\u30FC\u30DE\u8272\uFF08\u5DEE\u3057\u8272\uFF09"
  };

  // src/styles/officers/hair.js
  var FRONT_PULLED = "M65 94 C62 66 78 46 100 46 C122 46 138 64 135 94 C133 82 129 74 122 68 C112 60 94 58 84 64 C76 70 69 80 65 94Z";
  var FRONT_CURTAIN = "M100 46 C80 46 66 60 65 82 C64 98 65 112 62 130 C70 120 72 104 73 92 C75 74 86 60 100 54 C114 60 125 74 127 92 C128 104 130 120 138 130 C135 112 136 98 135 82 C134 60 120 46 100 46Z";
  var BACK_LONG = "M60 98 C56 62 72 40 100 40 C128 40 144 62 140 98 C141 128 146 160 152 190 L48 190 C54 160 59 128 60 98Z";
  var OVER_LONG = "M62 124 C60 146 56 166 50 186 C56 190 64 190 70 186 C70 164 72 144 74 128Z M138 124 C140 146 144 166 150 186 C144 190 136 190 130 186 C130 164 128 144 126 128Z";
  var SIDES_SHORT = "M66 108 C62 92 64 80 70 74 C72 86 74 96 77 104Z M134 108 C138 92 136 80 130 74 C128 86 126 96 123 104Z";
  var HAIR = [
    { id: "none", label: "\u306A\u3057", shine: true },
    { id: "sides", label: "\u30B5\u30A4\u30C9\u306E\u307F", front: SIDES_SHORT, shine: true, noShadow: true },
    { id: "buzz", label: "\u574A\u4E3B", front: "M66 92 C63 66 76 48 100 48 C124 48 137 66 134 92 C132 80 128 70 120 64 C108 60 92 60 80 64 C72 70 68 80 66 92Z", opacity: 0.8, noShadow: true },
    {
      id: "mohawk",
      label: "\u30E2\u30D2\u30AB\u30F3",
      front: "M66 92 C63 66 76 48 100 48 C124 48 137 66 134 92 C132 80 128 70 120 64 C108 60 92 60 80 64 C72 70 68 80 66 92Z",
      opacity: 0.35,
      noShadow: true,
      extra: "M91 64 C88 44 92 28 100 18 C108 28 112 44 109 64Z"
    },
    { id: "side", label: "\u4E03\u4E09", front: "M65 98 C61 74 64 54 80 45 C94 37 114 38 126 46 C138 54 140 74 135 98 C133 90 132 82 129 76 C124 68 116 66 106 66 C96 66 88 64 82 58 C80 66 76 72 71 76 C68 82 66 90 65 98Z", hl: "M90 47 Q104 42 118 47" },
    { id: "slick", label: "\u30AA\u30FC\u30EB\u30D0\u30C3\u30AF", front: "M65 92 C62 66 76 45 100 44 C124 45 138 64 135 92 C133 80 130 72 124 66 C114 60 86 60 76 66 C70 72 67 80 65 92Z", hl: "M84 52 Q100 46 116 52", lines: ["M82 60 Q100 52 118 60", "M80 52 Q100 44 120 52"] },
    { id: "crop", label: "\u77ED\u9AEA", front: "M65 96 C61 70 66 52 82 44 C98 36 120 38 132 50 C140 60 140 78 135 96 C133 86 131 79 128 73 Q125 64 120 70 Q117 61 111 67 Q106 58 100 66 Q94 58 90 67 Q84 60 80 69 Q75 64 71 71 C68 78 66 87 65 96Z", hl: "M88 46 Q102 41 116 45" },
    { id: "spiky", label: "\u30C4\u30F3\u30C4\u30F3", front: "M65 96 C60 70 62 56 71 46 Q65 39 63 30 Q73 33 81 37 Q80 27 85 19 Q91 27 97 32 Q100 23 106 15 Q109 25 112 32 Q119 25 128 21 Q126 31 124 39 Q131 36 140 36 Q138 45 135 52 C141 64 140 80 135 96 C132 86 128 79 123 74 Q119 70 115 79 Q111 70 107 68 Q104 74 100 79 Q96 72 93 68 Q89 74 86 79 Q83 72 79 70 Q75 75 72 80 C68 85 66 90 65 96Z" },
    { id: "pomp", label: "\u30DD\u30F3\u30D1\u30C9\u30FC\u30EB", front: "M65 94 C61 74 62 56 72 44 C84 30 114 28 128 38 C140 48 140 70 135 94 C133 84 131 76 127 70 C120 62 106 60 94 62 C84 64 76 68 71 74 C68 80 66 86 65 94Z", hl: "M86 38 Q102 31 118 37" },
    { id: "curtain", label: "\u30BB\u30F3\u30BF\u30FC\u5206\u3051", front: "M65 100 C61 70 72 48 100 46 C128 48 139 70 135 100 C133 88 130 80 124 74 C116 68 106 64 100 58 C94 64 84 68 76 74 C70 80 67 90 65 100Z", hl: "M80 56 Q90 50 98 50" },
    { id: "wavy", label: "\u30A6\u30A7\u30FC\u30D6\u77ED", front: "M64 102 C58 72 66 50 86 43 C104 37 126 42 136 58 C142 70 140 88 136 102 C134 94 133 86 128 80 C126 86 120 86 118 78 C112 82 104 80 102 72 C96 78 88 78 86 70 C80 76 72 78 70 74 C67 82 65 92 64 102Z", hl: "M92 46 Q106 42 120 48" },
    { id: "topknot", label: "\u30DE\u30F3\u30D0\u30F3", back: "M100 22 a13 13 0 1 0 0.1 0Z", front: "M65 92 C62 66 76 45 100 44 C124 45 138 64 135 92 C133 80 130 72 124 66 C114 60 86 60 76 66 C70 72 67 80 65 92Z", ties: [[100, 44]] },
    { id: "pixie", label: "\u30B7\u30E7\u30FC\u30C8", front: "M65 96 C60 66 74 44 100 44 C126 44 142 62 136 94 C133 84 128 76 120 72 C108 76 94 78 82 76 C76 80 70 86 65 96Z", hl: "M86 50 Q100 45 116 49" },
    {
      id: "bob",
      label: "\u30DC\u30D6",
      back: "M58 98 C54 64 70 42 100 42 C130 42 146 64 142 98 L144 130 C144 138 136 141 128 139 L72 139 C64 141 56 138 56 130Z",
      front: "M65 100 C61 68 76 46 100 46 C124 46 139 68 135 100 C134 92 133 86 131 80 C118 80 102 76 94 66 C90 74 80 80 69 82 C67 88 66 94 65 100Z",
      hl: "M84 53 Q98 47 114 51"
    },
    {
      id: "bobBang",
      label: "\u3071\u3063\u3064\u3093\u30DC\u30D6",
      back: "M58 98 C54 64 70 42 100 42 C130 42 146 64 142 98 L144 130 C144 138 136 141 128 139 L72 139 C64 141 56 138 56 130Z",
      front: "M65 104 C61 68 76 46 100 46 C124 46 139 68 135 104 C134 96 133 88 132 80 L68 80 C67 88 66 96 65 104Z",
      hl: "M84 53 Q98 47 114 51"
    },
    {
      id: "medium",
      label: "\u30DF\u30C7\u30A3\u30A2\u30E0",
      back: "M58 98 C54 62 72 42 100 42 C128 42 146 62 142 98 C143 120 146 140 150 156 C134 160 120 156 116 150 L84 150 C80 156 66 160 50 156 C54 140 57 120 58 98Z",
      front: FRONT_CURTAIN,
      hl: "M80 58 Q90 50 100 49"
    },
    { id: "long", label: "\u30ED\u30F3\u30B0", back: BACK_LONG, front: FRONT_CURTAIN, over: OVER_LONG, hl: "M80 58 Q90 50 100 49" },
    {
      id: "longSide",
      label: "\u30ED\u30F3\u30B0\u6D41\u3057",
      back: BACK_LONG,
      over: OVER_LONG,
      front: "M65 100 C61 68 76 46 100 46 C124 46 139 68 135 100 C135 112 136 122 138 130 C132 120 130 108 131 80 C118 80 102 76 94 66 C90 74 80 80 69 82 C67 92 66 110 62 130 C64 118 65 108 65 100Z",
      hl: "M84 53 Q98 47 114 51"
    },
    {
      id: "longWavy",
      label: "\u30ED\u30F3\u30B0\u30A6\u30A7\u30FC\u30D6",
      back: "M60 98 C56 62 72 40 100 40 C128 40 144 62 140 98 C142 120 152 136 148 154 C156 166 150 182 156 190 L44 190 C50 182 44 166 52 154 C48 136 58 120 60 98Z",
      front: FRONT_CURTAIN,
      over: "M62 124 C56 140 64 150 56 166 C52 176 58 184 52 190 L70 190 C72 178 66 170 72 160 C78 148 70 140 74 128Z M138 124 C144 140 136 150 144 166 C148 176 142 184 148 190 L130 190 C128 178 134 170 128 160 C122 148 130 140 126 128Z",
      hl: "M80 58 Q90 50 100 49"
    },
    {
      id: "hime",
      label: "\u59EB\u30AB\u30C3\u30C8",
      back: BACK_LONG,
      over: OVER_LONG,
      front: "M65 104 C61 68 76 46 100 46 C124 46 139 68 135 104 C134 96 133 88 132 80 L68 80 C67 88 66 96 65 104Z M65 82 C64 100 64 116 66 134 L75 134 C73 116 72 100 73 82Z M135 82 C136 100 136 116 134 134 L125 134 C127 116 128 100 127 82Z"
    },
    { id: "pony", label: "\u30DD\u30CB\u30FC\u30C6\u30FC\u30EB", back: "M118 54 C146 50 158 80 154 110 C152 130 146 146 138 158 C140 134 138 112 131 92 C127 80 123 70 114 62Z", front: FRONT_PULLED, ties: [[124, 60]], hl: "M82 54 Q98 48 116 52" },
    { id: "bun", label: "\u304A\u56E3\u5B50", back: "M100 21 a17 17 0 1 0 0.1 0Z", front: FRONT_PULLED, ties: [[100, 45]], hl: "M82 54 Q98 48 116 52" },
    { id: "twinBuns", label: "\u30C0\u30D6\u30EB\u304A\u56E3\u5B50", back: "M72 32 a14 14 0 1 0 0.1 0Z M128 32 a14 14 0 1 0 0.1 0Z", front: FRONT_PULLED, hl: "M82 54 Q98 48 116 52" },
    { id: "twintails", label: "\u30C4\u30A4\u30F3\u30C6\u30FC\u30EB", back: "M66 70 C44 74 36 110 42 150 C46 132 54 112 66 98Z M134 70 C156 74 164 110 158 150 C154 132 146 112 134 98Z", front: FRONT_PULLED, ties: [[66, 72], [134, 72]], hl: "M82 54 Q98 48 116 52" },
    {
      id: "braid",
      label: "\u4E09\u3064\u7DE8\u307F",
      front: FRONT_PULLED,
      hl: "M82 54 Q98 48 116 52",
      braid: [[134, 112], [138, 126], [140, 140], [141, 154], [141, 168]]
    },
    {
      id: "curly",
      label: "\u30AB\u30FC\u30EA\u30FC",
      back: wave(100, 82, 43, 44, 160, 380, 12, 6.5) + "Z",
      front: "M66.5 96 C63 62 80 45 100 45 C120 45 137 62 133.5 96 " + wave(100, 97, 33.5, 30, 0, -180, 7, 4.6, -1, false) + "Z",
      hl: "M86 52 Q98 47 112 50"
    },
    {
      id: "afro",
      label: "\u30A2\u30D5\u30ED",
      back: wave(100, 74, 54, 52, 0, 360, 22, 6.5) + "Z",
      front: "M66 94 C62 60 80 43 100 43 C120 43 138 60 134 94 " + wave(100, 95, 34, 28, 0, -180, 8, 4, -1, false) + "Z",
      hl: "M72 46 Q84 32 100 28"
    }
  ];
  var BUN_BACK = ["topknot", "bun", "twinBuns"];
  var HAT_PUFFS = {
    curly: [[61, 92, 11], [57, 105, 10], [61, 117, 8]],
    afro: [[57, 90, 15], [51, 106, 14], [55, 121, 12], [62, 133, 9]]
  };
  var PULLED_STRANDS = [[80, 76, 85, 58, 98, 49], [120, 76, 115, 58, 102, 49]];
  var CURTAIN_STRANDS = [[97, 54, 84, 64, 76, 88], [103, 54, 116, 64, 124, 88]];
  var STRANDS = {
    side: [[97, 46, 88, 54, 80, 64], [112, 45, 104, 56, 98, 66], [124, 50, 129, 62, 130, 76]],
    slick: [[82, 61, 100, 52, 118, 61], [80, 53, 100, 44, 120, 53]],
    crop: [[90, 46, 92, 56, 92, 64], [106, 42, 107, 54, 106, 64], [120, 48, 122, 58, 121, 68]],
    spiky: [[86, 42, 89, 58, 93, 68], [104, 30, 104, 52, 100, 76], [122, 38, 119, 54, 115, 76]],
    pomp: [[82, 44, 96, 35, 116, 40], [78, 56, 96, 48, 114, 57]],
    curtain: [[99, 52, 88, 59, 78, 72], [101, 52, 112, 59, 122, 72]],
    wavy: [[92, 46, 97, 58, 94, 70], [110, 44, 113, 56, 110, 72]],
    topknot: PULLED_STRANDS,
    pixie: [[94, 47, 90, 62, 82, 75], [110, 47, 113, 60, 119, 71]],
    bob: [[100, 49, 90, 59, 82, 74], [112, 50, 121, 62, 127, 78]],
    bobBang: [[87, 52, 87, 66, 85, 79], [100, 49, 100, 64, 100, 79], [113, 52, 113, 66, 115, 79]],
    medium: CURTAIN_STRANDS,
    long: CURTAIN_STRANDS,
    longWavy: CURTAIN_STRANDS,
    longSide: [[100, 49, 90, 59, 82, 74], [112, 50, 121, 62, 127, 78]],
    hime: [[87, 52, 87, 66, 85, 79], [100, 49, 100, 64, 100, 79], [113, 52, 113, 66, 115, 79]],
    pony: PULLED_STRANDS,
    bun: PULLED_STRANDS,
    twinBuns: PULLED_STRANDS,
    twintails: PULLED_STRANDS,
    braid: PULLED_STRANDS
  };
  HAIR.forEach((h) => {
    h.strands = STRANDS[h.id];
    h.bunBack = BUN_BACK.includes(h.id);
    if (HAT_PUFFS[h.id]) h.hatPuffs = [...HAT_PUFFS[h.id], ...HAT_PUFFS[h.id].map(([x, y, r]) => [200 - x, y, r])];
  });

  // src/styles/officers/face.js
  var EYES = [
    { id: "normal", label: "\u3075\u3064\u3046", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="99" rx="3.8" ry="4.9" fill="${INK}"/><circle cx="${e + 1.4}" cy="97.1" r="1.5" fill="#fff"/><circle cx="${e - 1.3}" cy="101.5" r=".7" fill="#fff" fill-opacity=".8"/>`).join("") },
    { id: "small", label: "\u5C0F\u3055\u3081", draw: (x) => EYE_X.map((e) => `<circle cx="${e}" cy="99" r="2.8" fill="${INK}"/>`).join("") },
    { id: "big", label: "\u3071\u3063\u3061\u308A", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="99" rx="6" ry="6.6" fill="#fff"/><circle cx="${e}" cy="99.6" r="4.4" fill="${x.a}"/><circle cx="${e}" cy="99.6" r="2.2" fill="${INK}"/><circle cx="${e + 1.6}" cy="97.6" r="1.4" fill="#fff"/>${S(`M${e - 6.6} 97.5 Q${e} 90.5 ${e + 6.6} 97.5`, INK, 2.4)}`).join("") },
    { id: "sparkle", label: "\u30AD\u30E9\u30AD\u30E9", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="99" rx="5.4" ry="6.6" fill="${x.a}"/><ellipse cx="${e}" cy="100" rx="3" ry="4" fill="${INK}"/><circle cx="${e + 1.8}" cy="96.6" r="1.8" fill="#fff"/><circle cx="${e - 1.8}" cy="102.4" r="0.9" fill="#fff"/>${S(`M${e - 6} 97 Q${e} 90 ${e + 6} 97`, INK, 2.4)}`).join("") },
    { id: "happy", label: "\u306B\u3063\u3053\u308A", draw: (x) => both(T([81.6, 101.4, 87, 93.6, 92.4, 101.4], INK, 3.6)) },
    { id: "lash", label: "\u307E\u3064\u3052", draw: (x) => EYE_X.map((e) => {
      const d = e < 100 ? -1 : 1;
      return `<ellipse cx="${e}" cy="99" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="${e + 1.3}" cy="97.3" r="1.3" fill="#fff"/>${S(`M${e + d * 3.4} 96 L${e + d * 6.8} 93.4 M${e + d * 1.6} 94.8 L${e + d * 3.6} 91.8`, INK, 2)}`;
    }).join("") },
    { id: "calm", label: "\u304A\u3060\u3084\u304B", draw: (x) => both(T([81.6, 98.6, 87, 104, 92.4, 98.6], INK, 3.4)) },
    { id: "wink", label: "\u30A6\u30A4\u30F3\u30AF", draw: (x) => `<ellipse cx="87" cy="99" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="88.3" cy="97.3" r="1.3" fill="#fff"/>` + T([107.6, 100.6, 113, 93.6, 118.4, 100.6], INK, 3.6) },
    { id: "sleepy", label: "\u7720\u305D\u3046", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="100.5" rx="3.6" ry="3" fill="${INK}"/>${S(`M${e - 5} 99 Q${e} 97.6 ${e + 5} 99`, INK, 2.6)}`).join("") },
    { id: "surprised", label: "\u3073\u3063\u304F\u308A", draw: (x) => EYE_X.map((e) => `<circle cx="${e}" cy="99" r="5.6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${e}" cy="99" r="2.3" fill="${INK}"/>`).join("") },
    { id: "closed", label: "\u9589\u3058\u76EE", draw: (x) => both(T([81.4, 99.6, 87, 101.8, 92.6, 99.6], INK, 3)) },
    { id: "almond", label: "\u5207\u308C\u9577", draw: (x) => EYE_X.map((e) => {
      const d = e < 100 ? -1 : 1;
      return P(`M${e - 6 * d} 100.5 Q${e} 95 ${e + 6 * d} 98 Q${e} 103.5 ${e - 6 * d} 100.5Z`, INK) + `<circle cx="${e + 1}" cy="98.6" r="1.1" fill="#fff"/>`;
    }).join("") },
    { id: "glare", label: "\u30B8\u30C8\u76EE", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="100" rx="3.6" ry="3.6" fill="${INK}"/>${S(`M${e - 5.5} 97 L${e + 5.5} 97`, INK, 2.6)}`).join("") },
    { id: "tired", label: "\u304A\u3064\u304B\u308C", draw: (x) => EYE_X.map((e) => `<ellipse cx="${e}" cy="99" rx="3.4" ry="4.2" fill="${INK}"/><circle cx="${e + 1.2}" cy="97.6" r="1.1" fill="#fff"/>${S(`M${e - 5} 106 Q${e} 108.5 ${e + 5} 106`, x.skinDeep, 1.8, 'opacity=".6"')}`).join("") }
  ];
  var BROWS = [
    { id: "normal", label: "\u3075\u3064\u3046", p: [81, 89.5, 87, 84.4, 93.4, 88], t: 3.4 },
    { id: "thick", label: "\u592A\u3044", p: [80.5, 89.6, 87, 83.6, 93.6, 88], t: 5.6 },
    { id: "thin", label: "\u7D30\u3044", p: [81, 89.2, 87, 85, 93.2, 88], t: 2 },
    { id: "flat", label: "\u307E\u3063\u3059\u3050", p: [81, 88.6, 87, 87, 93.4, 87.8], t: 3.2 },
    { id: "raised", label: "\u4E0A\u304C\u308A", p: [81, 86.8, 87, 79.8, 93.4, 84.2], t: 3.4 },
    { id: "arched", label: "\u30A2\u30FC\u30C1", p: [80, 90.4, 83.6, 81, 93.4, 86.6], t: 3.2 },
    { id: "angry", label: "\u30AD\u30EA\u30C3", p: [81, 84.8, 87, 86.6, 93.6, 90.6], t: 3.8 },
    { id: "worried", label: "\u56F0\u308A", p: [81, 90.2, 87.4, 89.4, 93.4, 84.4], t: 3.4 },
    { id: "short", label: "\u307E\u308D", dot: true },
    { id: "none", label: "\u306A\u3057" }
  ].map((b) => ({ ...b, draw: (x) => b.dot ? both(`<ellipse cx="87" cy="87" rx="3.4" ry="2.4" fill="${x.brow}"/>`) : b.p ? both(T(b.p, x.brow, b.t)) : "" }));
  var NOSES = [
    { id: "soft", label: "\u3075\u3064\u3046", draw: (x) => T([99.2, 103.4, 104.6, 108.6, 98.2, 110.8], x.skinDeep, 2.4, 'opacity=".75"') },
    { id: "button", label: "\u307E\u308B", draw: (x) => `<ellipse cx="100" cy="107" rx="3.6" ry="2.8" fill="${x.skinShade}"/>` },
    { id: "nostrils", label: "\u9F3B\u306E\u7A74", draw: (x) => `<circle cx="97.4" cy="108" r="1.3" fill="${x.skinDeep}"/><circle cx="102.6" cy="108" r="1.3" fill="${x.skinDeep}"/>` },
    { id: "line", label: "\u3059\u3058", draw: (x) => S("M100 97 L102.5 107.5 L98.5 108.5", x.skinDeep, 2, 'opacity=".7"') },
    { id: "round", label: "\u3060\u3093\u3054", draw: (x) => `<ellipse cx="100" cy="106" rx="5.4" ry="4.2" fill="${x.skinShade}"/><ellipse cx="98.4" cy="104.6" rx="1.8" ry="1.2" fill="#fff" opacity=".5"/>` },
    { id: "none", label: "\u306A\u3057", draw: (x) => "" }
  ];
  var MOUTHS = [
    { id: "smile", label: "\u306B\u3053", draw: (x) => T([92.4, 117.6, 100, 125, 107.6, 117.6], INK, 3.2) },
    { id: "grin", label: "\u7B11\u9854", draw: (x) => P("M90 116 Q100 131 110 116Z", INK) + P("M92 117 L108 117 Q107 120.5 100 120.5 Q93 120.5 92 117Z", "#fff") + P("M95 125 Q100 121.5 105 125 Q100 127.5 95 125Z", "#f08a9b") },
    { id: "laugh", label: "\u5927\u7B11\u3044", draw: (x) => P("M87 114 Q100 136 113 114Z", INK) + P("M89.5 115 L110.5 115 Q109 119 100 119 Q91 119 89.5 115Z", "#fff") + P("M93 128 Q100 122 107 128 Q100 132 93 128Z", "#f08a9b") },
    { id: "open", label: "\u3071\u304F", draw: (x) => P("M94 117 Q100 127 106 117Z", INK) + P("M96.5 122.5 Q100 120 103.5 122.5 Q100 125 96.5 122.5Z", "#f08a9b") },
    { id: "teeth", label: "\u6B6F\u898B\u305B", draw: (x) => P("M91 116 L109 116 Q108 124.5 100 124.5 Q92 124.5 91 116Z", "#fff", `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`) + S("M92 120 L108 120", INK, 1.2, 'opacity=".4"') },
    { id: "neutral", label: "\u3080\u3063", draw: (x) => T([94.4, 120.2, 100, 121.4, 105.6, 120.2], INK, 2.8) },
    { id: "smirk", label: "\u30CB\u30E4\u30EA", draw: (x) => T([93.6, 120.4, 102.4, 124, 108, 116], INK, 3) },
    { id: "tongue", label: "\u3079\u30FC", draw: (x) => T([91.6, 117.6, 100, 124.4, 108.4, 117.6], INK, 3) + P("M96.5 120.5 Q100 130 103.5 120.5Z", "#f08a9b", `stroke="${INK}" stroke-width="1.6"`) },
    { id: "o", label: "\u304A\u3063", draw: (x) => `<ellipse cx="100" cy="120" rx="3.6" ry="4.6" fill="${INK}"/>` },
    { id: "frown", label: "\u3078", draw: (x) => T([92.6, 122.4, 100, 115.4, 107.4, 122.4], INK, 3) },
    { id: "cat", label: "\u03C9", draw: (x) => S("M92 118 Q96 122.5 100 118 Q104 122.5 108 118", INK, 2.6) },
    { id: "lips", label: "\u53E3\u7D05", draw: (x) => P("M90 118 Q95 114.5 100 116.5 Q105 114.5 110 118 Q100 127 90 118Z", x.a) + S("M91 118 Q100 120 109 118", shade(x.a, 0.35), 1.4) },
    { id: "lipsSmile", label: "\u53E3\u7D05\u306B\u3053", draw: (x) => P("M90 116.5 Q95 115 100 116.5 Q105 115 110 116.5 Q100 128 90 116.5Z", x.a) + P("M92 117.5 L108 117.5 Q100 121 92 117.5Z", "#fff") }
  ];
  var BEARDS = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "stubble", label: "\u7121\u7CBE\u3072\u3052", draw: (x) => P("M68 104 C70 126 84 137 100 137 C116 137 130 126 132 104 C128 117 120 125 100 127 C80 125 72 117 68 104Z", x.hair, 'opacity=".3"') },
    { id: "mustache", label: "\u53E3\u3072\u3052", draw: (x) => P("M88 114 C93 108 99 110 100 112 C101 110 107 108 112 114 C107 116 101 114.5 100 113.5 C99 114.5 93 116 88 114Z", x.hair) },
    { id: "chevron", label: "\u592A\u53E3\u3072\u3052", draw: (x) => P("M86 115 C90 108 110 108 114 115 L112 118 C106 113.5 94 113.5 88 118Z", x.hair) },
    { id: "handlebar", label: "\u30AB\u30A4\u30BC\u30EB", draw: (x) => P("M83 108 C85 116 93 114 100 111 C107 114 115 116 117 108 C117 118 107 117 100 114.5 C93 117 83 118 83 108Z", x.hair) },
    { id: "goatee", label: "\u3042\u3054\u3072\u3052", draw: (x) => P("M94 127 C94 135 106 135 106 127 C103 129 97 129 94 127Z", x.hair) + P("M90 114 C94 110 99 111 100 112.5 C101 111 106 110 110 114 C106 115.5 101 114.5 100 114 C99 114.5 94 115.5 90 114Z", x.hair) },
    { id: "chin", label: "\u3042\u3054\u4E0B", draw: (x) => P("M90 130 C94 138 106 138 110 130 C106 133 94 133 90 130Z", x.hair) },
    { id: "beard", label: "\u30D5\u30EB\u3072\u3052", draw: (x) => P("M66 98 C66 118 74 134 88 140 C94 143 106 143 112 140 C126 134 134 118 134 98 C130 110 126 118 118 121 C112 116 106 114 100 115 C94 114 88 116 82 121 C74 118 70 110 66 98Z", x.hair) + P("M89 115 C94 111 99 112 100 113.5 C101 112 106 111 111 115 C106 116.5 101 115.5 100 115 C99 115.5 94 116.5 89 115Z", x.hair) },
    { id: "longBeard", label: "\u9577\u3072\u3052", draw: (x) => P("M66 98 C66 126 78 150 100 160 C122 150 134 126 134 98 C130 110 126 118 118 121 C112 116 106 114 100 115 C94 114 88 116 82 121 C74 118 70 110 66 98Z", x.hair) + P("M89 115 C94 111 99 112 100 113.5 C101 112 106 111 111 115 C106 116.5 101 115.5 100 115 C99 115.5 94 116.5 89 115Z", x.hair) },
    { id: "sideburns", label: "\u3082\u307F\u3042\u3052", draw: (x) => both(P("M66 90 L66 112 C68 116 71 117 73 116 L72 90Z", x.hair)) },
    { id: "chinstrap", label: "\u3042\u3054\u7DDA", draw: (x) => P("M66 96 C66 120 80 138 100 140 C120 138 134 120 134 96 L131 96 C130 118 118 133 100 134 C82 133 70 118 69 96Z", x.hair) }
  ];
  var FACE_MARKS = [
    { id: "blush", label: "\u307B\u3063\u307A", draw: (x) => `<ellipse cx="78" cy="110.5" rx="9.5" ry="6.5" fill="url(#${x.id}bl)" opacity="1"/><ellipse cx="122" cy="110.5" rx="9.5" ry="6.5" fill="url(#${x.id}bl)" opacity="1"/>` },
    { id: "freckles", label: "\u305D\u3070\u304B\u3059", draw: (x) => both([[76, 108], [80, 111], [84, 108], [79, 105]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.1" fill="${x.skinDeep}" opacity=".55"/>`).join("")) },
    { id: "mole", label: "\u307B\u304F\u308D", draw: (x) => `<circle cx="117" cy="115" r="1.3" fill="${INK}"/>` },
    { id: "smile", label: "\u307B\u3046\u308C\u3044\u7DDA", draw: (x) => both(T([86.4, 109.6, 82, 116, 87.4, 121.6], x.skinDeep, 1.8, 'opacity=".5"')) },
    { id: "forehead", label: "\u304A\u3067\u3053\u306E\u3057\u308F", draw: (x) => T([87.6, 74.4, 100, 70.2, 112.4, 74.4], x.skinDeep, 1.8, 'opacity=".45"') + T([90, 79.4, 100, 75.8, 110, 79.4], x.skinDeep, 1.5, 'opacity=".45"') },
    { id: "crow", label: "\u76EE\u5C3B\u306E\u3057\u308F", draw: (x) => both(S("M76 97 L73 95.5 M76 100 L72.5 100", x.skinDeep, 1.4, 'opacity=".45"')) },
    { id: "eyebags", label: "\u304F\u307E", draw: (x) => both(S("M82 106 Q87 108.5 92 106", "#7b5aa6", 2, 'opacity=".25"')) },
    { id: "bandaid", label: "\u3070\u3093\u305D\u3046\u3053\u3046", draw: (x) => `<g transform="rotate(-20 122 112)"><rect x="113" y="108.5" width="18" height="7" rx="3.5" fill="#f2c9a0"/><rect x="119.5" y="108.5" width="5" height="7" fill="#e3b083"/></g>` },
    { id: "sweat", label: "\u6C57", free: true, draw: (x) => P("M134 72 C130 78 129 82 132 84 C135 86 138 83 136 79 C135 77 134 74 134 72Z", "#8cc8f0") }
  ];

  // src/styles/officers/accessories.js
  var lens = (x, op = 0.18) => `fill="${x.b}" fill-opacity="${op}"`;
  var tint = (x) => ({ ...x, b: luminance(x.b) > 0.8 ? "#2b2233" : x.b });
  var ARMS = (y = 96) => `M77 ${y} L67 ${y - 2} M123 ${y} L133 ${y - 2}`;
  var GLASSES = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "round", label: "\u4E38", draw: (x) => `<g stroke="${x.a}" stroke-width="2.2" fill="none"><circle cx="87" cy="99" r="9.5" ${lens(x)}/><circle cx="113" cy="99" r="9.5" ${lens(x)}/><path d="M96.5 98 Q100 95.5 103.5 98 ${ARMS(97)}"/></g>` },
    { id: "roundBig", label: "\u5927\u304D\u3044\u4E38", draw: (x) => `<g stroke="${x.a}" stroke-width="2.4" fill="none"><circle cx="86" cy="100" r="12" ${lens(x)}/><circle cx="114" cy="100" r="12" ${lens(x)}/><path d="M98 99 Q100 97 102 99 M74 97 L67 95 M126 97 L133 95"/></g>` },
    { id: "square", label: "\u30B9\u30AF\u30A8\u30A2", draw: (x) => `<g stroke="${x.a}" stroke-width="2.2" fill="none"><rect x="76" y="91.5" width="21.5" height="15.5" rx="5" ${lens(x)}/><rect x="102.5" y="91.5" width="21.5" height="15.5" rx="5" ${lens(x)}/><path d="M97.5 97 Q100 95 102.5 97 ${ARMS(96)}"/></g>` },
    { id: "rect", label: "\u7D30\u30D5\u30EC\u30FC\u30E0", draw: (x) => `<g stroke="${x.a}" stroke-width="1.6" fill="none"><rect x="75" y="93" width="23" height="12" rx="3" ${lens(x)}/><rect x="102" y="93" width="23" height="12" rx="3" ${lens(x)}/><path d="M98 97 L102 97 ${ARMS(96)}"/></g>` },
    { id: "bold", label: "\u9ED2\u7E01", draw: (x) => `<g stroke="${x.a}" stroke-width="3.6" fill="none"><rect x="76" y="91" width="21.5" height="16" rx="4" ${lens(x)}/><rect x="102.5" y="91" width="21.5" height="16" rx="4" ${lens(x)}/><path d="M97.5 96 L102.5 96 ${ARMS(95)}"/></g>` },
    { id: "browline", label: "\u30D6\u30ED\u30FC", draw: (x) => `<g fill="none"><rect x="76" y="91.5" width="21.5" height="15" rx="6" stroke="${x.a}" stroke-width="1.2" ${lens(x)}/><rect x="102.5" y="91.5" width="21.5" height="15" rx="6" stroke="${x.a}" stroke-width="1.2" ${lens(x)}/></g>${S("M76 93.5 Q86.5 89 97.5 93.5 M102.5 93.5 Q113.5 89 124 93.5 M97.5 94 L102.5 94 " + ARMS(95), x.a, 3.6)}` },
    { id: "cat", label: "\u30AD\u30E3\u30C3\u30C8", draw: (x) => `<g stroke="${x.a}" stroke-width="2.4" fill="none" stroke-linejoin="round">${both(`<path d="M75 92 Q86 90 97 93 Q97 105 88 106 Q78 106 76 97 Z" ${lens(x)}/><path d="M75 92 L72 89 M75 94 L67 94"/>`)}<path d="M97 95 Q100 93 103 95"/></g>` },
    { id: "oval", label: "\u5C0F\u3055\u3081\u6955\u5186", draw: (x) => `<g stroke="${x.a}" stroke-width="1.8" fill="none"><ellipse cx="87" cy="99" rx="8" ry="6" ${lens(x)}/><ellipse cx="113" cy="99" rx="8" ry="6" ${lens(x)}/><path d="M95 98 Q100 96 105 98 M79 98 L67 95 M121 98 L133 95"/></g>` },
    { id: "sun", label: "\u30B5\u30F3\u30B0\u30E9\u30B9", draw: (x) => (x = tint(x), "") + `<g stroke="${x.a}" stroke-width="2.2"><rect x="75" y="91" width="23" height="15" rx="6" fill="${x.b}" fill-opacity=".92"/><rect x="102" y="91" width="23" height="15" rx="6" fill="${x.b}" fill-opacity=".92"/><path d="M98 96 L102 96 ${ARMS(95)}" fill="none"/></g>${both(S("M79 95 L84 95", "#fff", 1.6, 'opacity=".5"'))}` },
    { id: "aviator", label: "\u30C6\u30A3\u30A2\u30C9\u30ED\u30C3\u30D7", draw: (x) => (x = tint(x), "") + `<g stroke="${x.a}" stroke-width="1.8">${both(`<path d="M75 93 Q87 89 97 93 Q98 104 88 108 Q76 107 75 93Z" fill="${x.b}" fill-opacity=".75"/>`)}<path d="M97 93 Q100 91 103 93 M96 91 L104 91 M75 93 L67 92 M125 93 L133 92" fill="none"/></g>` },
    { id: "monocle", label: "\u7247\u30E1\u30AC\u30CD", free: true, draw: (x) => `<circle cx="113" cy="99" r="9" fill="${x.b}" fill-opacity=".18" stroke="${x.a}" stroke-width="2.2"/>${S("M113 108 C116 124 112 140 118 156", x.a, 1.2)}` }
  ];
  var HATS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "beret", label: "\u30D9\u30EC\u30FC\u5E3D", front: (x) => `<ellipse cx="94" cy="51" rx="42" ry="14" transform="rotate(-10 94 51)" fill="${x.a}"/>${S("M56 60 C72 56 112 50 132 46", "#000", 3, 'stroke-opacity=".15"')}<rect x="90" y="34" width="6" height="8" rx="3" fill="${x.a}"/>` },
    { id: "cap", label: "\u30AD\u30E3\u30C3\u30D7", cover: { y: 82, hw: 41 }, front: (x) => P("M63 81 C61 46 80 30 100 30 C120 30 139 46 137 81 C120 75 80 75 63 81Z", x.a) + S("M100 31 L100 75 M82 36 C80 50 80 64 82 77 M118 36 C120 50 120 64 118 77", shade(x.a, 0.2), 1.6) + P("M58 81 C80 71 120 71 142 81 C145 87 139 91 128 89 C112 85 88 85 72 89 C61 91 55 87 58 81Z", x.b) + `<circle cx="100" cy="31" r="3.4" fill="${x.b}"/>` },
    { id: "capBack", label: "\u5F8C\u308D\u524D\u30AD\u30E3\u30C3\u30D7", cover: { y: 79, hw: 39 }, front: (x) => P("M61 82 C59 46 80 30 100 30 C120 30 141 46 139 82 C120 76 80 76 61 82Z", x.a) + P("M88 80 C88 70 112 70 112 80Z", shade(x.a, 0.35)) + S("M88 72 L112 72", x.b, 3) + P("M84 36 C92 24 108 24 116 36 C110 34 90 34 84 36Z", x.b) },
    { id: "beanie", label: "\u30CB\u30C3\u30C8\u5E3D", cover: { y: 82, hw: 42 }, front: (x) => P("M61 84 C57 46 78 29 100 29 C122 29 143 46 139 84Z", x.a) + P("M57 70 C80 63 120 63 143 70 L143 87 C120 80 80 80 57 87Z", shade(x.a, 0.15)) + S([64, 72, 80, 88, 96, 104, 112, 120, 128, 136].map((v) => `M${v} ${68 - Math.abs(v - 100) * 0.04} L${v} ${83 - Math.abs(v - 100) * 0.04}`).join(" "), shade(x.a, 0.3), 1.4) },
    { id: "pompom", label: "\u30DC\u30F3\u30DC\u30F3", cover: { y: 82, hw: 42 }, front: (x) => P("M61 84 C57 46 78 29 100 29 C122 29 143 46 139 84Z", x.a) + P("M57 70 C80 63 120 63 143 70 L143 87 C120 80 80 80 57 87Z", shade(x.a, 0.15)) + S("M76 46 L82 58 M90 38 L94 52 M106 36 L106 50 M120 42 L116 56", shade(x.a, 0.2), 1.6) + `<circle cx="100" cy="25" r="11" fill="${x.b}"/>` },
    { id: "bucket", label: "\u30D0\u30B1\u30CF", cover: { y: 80, hw: 46 }, front: (x) => P("M68 74 C68 44 84 33 100 33 C116 33 132 44 132 74Z", x.a) + P("M52 83 C60 66 140 66 148 83 C150 89 142 91 134 87 C114 79 86 79 66 87 C58 91 50 89 52 83Z", shade(x.a, 0.12)) + S("M69 66 L131 66", x.b, 4) },
    { id: "fedora", label: "\u4E2D\u6298\u308C\u5E3D", cover: { y: 70, hw: 50 }, front: (x) => P("M70 64 C70 40 84 30 100 36 C116 30 130 40 130 64Z", x.a) + S("M92 36 Q100 46 108 36", shade(x.a, 0.3), 2) + P("M70 55 L130 55 L130 64 L70 64Z", x.b) + P("M46 68 C70 58 130 58 154 68 C152 75 140 75 130 70 C110 66 90 66 70 70 C60 75 48 75 46 68Z", shade(x.a, 0.1)) },
    { id: "hardhat", label: "\u30D8\u30EB\u30E1\u30C3\u30C8", cover: { y: 80, hw: 46 }, front: (x) => P("M61 76 C61 42 80 29 100 29 C120 29 139 42 139 76Z", x.a) + P("M95 29.5 L105 29.5 L105 75 L95 75Z", shade(x.a, 0.12)) + P("M53 74 L147 74 C147 81 143 84 138 84 L62 84 C57 84 53 81 53 74Z", shade(x.a, 0.06)) + `<rect x="86" y="54" width="28" height="12" rx="3" fill="${x.b}"/>` },
    { id: "chef", label: "\u30B3\u30C3\u30AF\u5E3D", cover: { y: 76, hw: 38 }, front: (x) => `<circle cx="78" cy="42" r="17" fill="${x.a}"/><circle cx="100" cy="32" r="20" fill="${x.a}"/><circle cx="122" cy="42" r="17" fill="${x.a}"/>` + P("M62 50 L138 50 L138 80 C114 74 86 74 62 80Z", x.a) + S("M62 52 L138 52", shade(x.a, 0.1), 2) + S("M80 54 L80 75 M100 54 L100 74 M120 54 L120 75", shade(x.a, 0.08), 1.5) },
    { id: "headband", label: "\u30D8\u30A2\u30D0\u30F3\u30C9", front: (x) => P("M65 74 C80 67 120 67 135 74 L135 83 C120 76 80 76 65 83Z", x.a) + S("M65 78.5 C80 71.5 120 71.5 135 78.5", x.b, 2) },
    { id: "alice", label: "\u30AB\u30C1\u30E5\u30FC\u30B7\u30E3", front: (x) => S("M64 88 C58 44 142 44 136 88", x.a, 6) },
    { id: "ribbon", label: "\u30EA\u30DC\u30F3", front: (x) => `<g transform="translate(124 52) rotate(18)">${P("M0 0 L-16 -9 L-16 9Z", x.a)}${P("M0 0 L16 -9 L16 9Z", x.a)}<circle r="4" fill="${shade(x.a, 0.15)}"/></g>` },
    { id: "flower", label: "\u82B1\u306E\u9AEA\u98FE\u308A", front: (x) => `<g transform="translate(126 58)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${7 * Math.cos(a * Math.PI / 180)}" cy="${7 * Math.sin(a * Math.PI / 180)}" r="5.6" fill="${x.a}"/>`).join("")}<circle r="4" fill="${x.b}"/></g>` },
    { id: "newsboy", label: "\u30AD\u30E3\u30B9\u30B1\u30C3\u30C8", cover: { y: 78, hw: 42 }, front: (x) => P("M58 78 C54 46 80 33 104 35 C128 37 146 52 142 78Z", x.a) + S("M100 36 L84 74 M100 36 L120 74", shade(x.a, 0.15), 1.5) + P("M62 76 C84 69 116 69 138 76 C134 85 66 85 62 76Z", shade(x.a, 0.25)) + `<circle cx="100" cy="36" r="3.4" fill="${shade(x.a, 0.25)}"/>` },
    { id: "mortar", label: "\u89D2\u5E3D", cover: { y: 76, hw: 38 }, front: (x) => P("M62 64 C64 52 136 52 138 64 L138 80 C114 74 86 74 62 80Z", x.a) + P("M100 28 L152 44 L100 60 L48 44Z", shade(x.a, 0.1)) + S("M100 44 L140 50 L141 72", x.b, 2) + `<rect x="138" y="70" width="6" height="10" rx="2" fill="${x.b}"/>` },
    { id: "bandana", label: "\u30D0\u30F3\u30C0\u30CA", cover: { y: 78, hw: 40 }, front: (x) => P("M61 81 C57 48 78 33 100 33 C122 33 143 48 139 81 C120 73 80 73 61 81Z", x.a) + both(`<circle cx="80" cy="54" r="2" fill="${x.b}"/><circle cx="90" cy="66" r="2" fill="${x.b}"/>`) + `<circle cx="100" cy="46" r="2" fill="${x.b}"/>` + P("M136 74 L152 80 L146 92 Z M136 74 L156 70 L154 84Z", x.a) },
    {
      id: "hijab",
      label: "\u30D2\u30B8\u30E3\u30D6",
      hidesHair: true,
      back: (x) => P("M56 100 C52 58 74 36 100 36 C126 36 148 58 144 100 C146 128 152 150 162 176 L38 176 C48 150 54 128 56 100Z", shade(x.a, 0.12)),
      front: (x) => P("M56 100 C52 58 74 36 100 36 C126 36 148 58 144 100 C146 128 152 150 162 176 L38 176 C48 150 54 128 56 100Z M100 50 C79 50 68 64 67 86 C66 104 68 118 74 128 C80 138 90 144 100 144 C110 144 120 138 126 128 C132 118 134 104 133 86 C132 64 121 50 100 50Z", x.a, 'fill-rule="evenodd"') + S("M70 64 C80 54 120 54 130 64", shade(x.a, 0.15), 2)
    },
    { id: "crown", label: "\u738B\u51A0", front: (x) => P("M72 60 L70 30 L86 44 L100 24 L114 44 L130 30 L128 60Z", x.a) + `<circle cx="100" cy="50" r="4" fill="${x.b}"/><circle cx="84" cy="53" r="3" fill="${x.b}"/><circle cx="116" cy="53" r="3" fill="${x.b}"/>` }
  ];
  var EARGEAR = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "headphones", label: "\u30D8\u30C3\u30C9\u30DB\u30F3", draw: (x) => S("M63 100 C56 36 144 36 137 100", x.b, 6) + `<rect x="55" y="88" width="15" height="27" rx="7" fill="${x.a}"/><rect x="130" y="88" width="15" height="27" rx="7" fill="${x.a}"/><rect x="55" y="88" width="6" height="27" rx="3" fill="#000" opacity=".18"/><rect x="139" y="88" width="6" height="27" rx="3" fill="#000" opacity=".18"/>` },
    { id: "headset", label: "\u30D8\u30C3\u30C9\u30BB\u30C3\u30C8", draw: (x) => S("M64 100 C57 38 143 38 136 100", x.b, 4.5) + `<rect x="57" y="90" width="12" height="22" rx="6" fill="${x.a}"/><rect x="131" y="90" width="12" height="22" rx="6" fill="${x.a}"/>` + S("M63 110 C64 124 74 128 86 125", x.b, 2.6) + `<rect x="85" y="122" width="7" height="5" rx="2.5" fill="${x.b}"/>` },
    { id: "neckphones", label: "\u9996\u306B\u30D8\u30C3\u30C9\u30DB\u30F3", body: true, draw: (x) => S("M70 160 C76 176 124 176 130 160", x.b, 5) + `<rect x="62" y="148" width="16" height="22" rx="7" transform="rotate(-25 70 159)" fill="${x.a}"/><rect x="122" y="148" width="16" height="22" rx="7" transform="rotate(25 130 159)" fill="${x.a}"/>` },
    { id: "earbuds", label: "\u30A4\u30E4\u30DB\u30F3", draw: (x) => `<circle cx="62" cy="101" r="4" fill="${x.a}"/><circle cx="138" cy="101" r="4" fill="${x.a}"/>` + S("M62 105 L62 118 M138 105 L138 118", x.a, 2) },
    { id: "pencil", label: "\u8033\u306B\u925B\u7B46", draw: (x) => `<g transform="rotate(-38 140 84)"><rect x="124" y="81" width="30" height="6" fill="${x.a}"/><path d="M154 81 L161 84 L154 87Z" fill="#f1d3a8"/><path d="M159 83.2 L161 84 L159 84.8Z" fill="${INK}"/><rect x="120" y="81" width="5" height="6" fill="#f2a0a8"/></g>` }
  ];
  var EARRINGS = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "stud", label: "\u30B9\u30BF\u30C3\u30C9", draw: (x) => [63, 137].map((e) => `<circle cx="${e}" cy="113" r="2.6" fill="${x.a}"/>`).join("") },
    { id: "hoop", label: "\u30D5\u30FC\u30D7", draw: (x) => [63, 137].map((e) => `<circle cx="${e}" cy="118" r="5" fill="none" stroke="${x.a}" stroke-width="1.8"/>`).join("") },
    { id: "drop", label: "\u3057\u305A\u304F", draw: (x) => [63, 137].map((e) => S(`M${e} 113 L${e} 118`, x.a, 1.4) + P(`M${e} 117 C${e - 3} 121 ${e - 3} 124 ${e} 124.5 C${e + 3} 124 ${e + 3} 121 ${e} 117Z`, x.a)).join("") },
    { id: "pearl", label: "\u30D1\u30FC\u30EB", draw: (x) => [63, 137].map((e) => `<circle cx="${e}" cy="114" r="3.2" fill="${x.a}"/><circle cx="${e - 1}" cy="113" r="1" fill="#fff" opacity=".8"/>`).join("") },
    { id: "long", label: "\u30ED\u30F3\u30B0", draw: (x) => [63, 137].map((e) => S(`M${e} 113 L${e} 126`, x.a, 1.4) + `<circle cx="${e}" cy="128" r="2.6" fill="${x.a}"/>`).join("") }
  ];

  // src/styles/officers/wear.js
  var L = (fill, open, deco) => ({ fill, open, deco });
  var lapelsV = (fill) => both(P("M84 147 L100 186 L95 190 L79 164 L85 158 L78 153Z", fill));
  var lapelsOpen = (fill) => both(P("M83 147 L92.6 186 L88 189 L76 164 L82 157 L76 152Z", fill));
  var tie = (c, x) => x && x.noTie ? "" : P("M96 151 L104 151 L103 157 L97 157Z", shade(c, 0.2)) + P("M97 157 L103 157 L106 180 L100 187 L94 180Z", c);
  var collarPoints = (fill, edge) => P("M86 145 L100 161 L91 170 L83 152Z M114 145 L100 161 L109 170 L117 152Z", fill, `stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"`);
  var collarClosed = (fill, edge) => P("M86 145 L100 153 L91 164 L83 152Z M114 145 L100 153 L109 164 L117 152Z", fill, `stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"`);
  var crewRib = (c, w = 4) => S("M86 147 C90 159 110 159 114 147", c, w);
  var hood = (c) => P("M64 158 C68 138 86 136 100 140 C114 136 132 138 136 158 C126 166 114 161 100 162 C86 161 74 166 64 158Z", c);
  var WHITE = "#ffffff";
  var COLLAR_W = "#f4f1f6";
  var shirtUnder = (tieColor) => L(() => WHITE, OPEN.neck, (x) => collarClosed(COLLAR_W, "#dcd6e2") + tie(tieColor(x), x));
  var TOPS = [
    { id: "suit", label: "\u30B9\u30FC\u30C4", layers: [
      shirtUnder((x) => x.b),
      L((x) => x.a, OPEN.jacket, (x) => lapelsV(shade(x.a, 0.22)) + `<circle cx="100" cy="194" r="2.2" fill="${shade(x.a, 0.3)}"/>`)
    ] },
    { id: "threePiece", label: "\u30B9\u30EA\u30FC\u30D4\u30FC\u30B9", layers: [
      shirtUnder((x) => x.b),
      L((x) => shade(x.a, 0.28), OPEN.vest, (x) => `<circle cx="100" cy="183" r="1.8" fill="${lighten(x.a, 0.25)}"/><circle cx="100" cy="193" r="1.8" fill="${lighten(x.a, 0.25)}"/>`),
      L((x) => x.a, OPEN.front, (x) => lapelsOpen(shade(x.a, 0.18)))
    ] },
    { id: "blazer", label: "\u30B8\u30E3\u30B1\u30C3\u30C8", layers: [
      L((x) => x.b, OPEN.crew, (x) => crewRib(shade(x.b, 0.12), 2.5)),
      L((x) => x.a, OPEN.front, (x) => lapelsOpen(shade(x.a, 0.15)))
    ] },
    { id: "blazerShirt", label: "\u30B8\u30E3\u30B1\u30C3\u30C8\uFF0B\u30B7\u30E3\u30C4", layers: [
      L((x) => x.b, OPEN.collar, (x) => collarPoints(lighten(x.b, 0.3), shade(x.b, 0.15))),
      L((x) => x.a, OPEN.front, (x) => lapelsOpen(shade(x.a, 0.15)))
    ] },
    { id: "shirt", label: "\u30B7\u30E3\u30C4", layers: [
      L((x) => x.a, OPEN.collar, (x) => S("M100 161 V200", shade(x.a, 0.2), 1.5) + `<circle cx="103" cy="172" r="1.6" fill="${shade(x.a, 0.2)}"/><circle cx="103" cy="186" r="1.6" fill="${shade(x.a, 0.2)}"/>` + collarPoints(x.a, shade(x.a, 0.2)))
    ] },
    { id: "shirtTie", label: "\u30B7\u30E3\u30C4\uFF0B\u30CD\u30AF\u30BF\u30A4", layers: [
      L((x) => x.a, OPEN.neck, (x) => S("M100 186 V200", shade(x.a, 0.2), 1.5) + tie(x.b, x) + collarClosed(x.a, shade(x.a, 0.2)))
    ] },
    { id: "polo", label: "\u30DD\u30ED\u30B7\u30E3\u30C4", layers: [
      L((x) => x.a, OPEN.collar, (x) => P("M96 158 L104 158 L104 174 L96 174Z", shade(x.a, 0.08)) + `<circle cx="100" cy="164" r="1.6" fill="${x.b}"/><circle cx="100" cy="170" r="1.6" fill="${x.b}"/>` + P("M84 146 L99 158 L90 164 L80 152Z M116 146 L101 158 L110 164 L120 152Z", lighten(x.a, 0.12), `stroke="${shade(x.a, 0.18)}" stroke-width="1.3" stroke-linejoin="round"`))
    ] },
    { id: "hoodie", label: "\u30D1\u30FC\u30AB\u30FC", layers: [
      L((x) => x.a, OPEN.crew, (x) => hood(shade(x.a, 0.15)) + P("M86 148 C92 156 108 156 114 148 C110 160 90 160 86 148Z", "#000", 'opacity=".18"') + S("M92 160 C91 170 90 178 90 186 M108 160 C109 170 110 178 110 186", x.b, 2.5))
    ] },
    { id: "zipHoodie", label: "\u30B8\u30C3\u30D7\u30D1\u30FC\u30AB\u30FC", layers: [
      L((x) => x.b, OPEN.crew, (x) => crewRib(shade(x.b, 0.12), 2.5)),
      L((x) => x.a, OPEN.zip, (x) => hood(shade(x.a, 0.15)) + S("M100 160 L100 200", shade(x.a, 0.35), 2.4) + `<rect x="98" y="162" width="4" height="7" rx="1.5" fill="${lighten(x.a, 0.5)}"/>`)
    ] },
    { id: "tshirt", label: "T\u30B7\u30E3\u30C4", layers: [L((x) => x.a, OPEN.crew, (x) => crewRib(shade(x.a, 0.15)))] },
    { id: "logoTee", label: "\u30ED\u30B4T", layers: [L((x) => x.a, OPEN.crew, (x) => crewRib(shade(x.a, 0.15)) + `<circle cx="100" cy="182" r="9" fill="${x.b}"/>` + S("M96 182 L100 178 L104 182 L100 186Z", x.a, 2))] },
    { id: "vneck", label: "V\u30CD\u30C3\u30AF", layers: [L((x) => x.a, OPEN.v, (x) => S("M87 147 L100 168 L113 147", shade(x.a, 0.15), 3.5))] },
    { id: "stripe", label: "\u30DC\u30FC\u30C0\u30FC", layers: [L((x) => x.a, OPEN.crew, (x) => [162, 174, 186, 198].map((y) => `<rect x="20" y="${y}" width="160" height="5" fill="${x.b}"/>`).join("") + crewRib(shade(x.a, 0.12)))] },
    { id: "turtle", label: "\u30BF\u30FC\u30C8\u30EB", layers: [L((x) => x.a, null, (x) => P("M86 124 C92 121 108 121 114 124 L115 152 C108 157 92 157 85 152Z", x.a) + S("M86 134 C94 137 106 137 114 134 M86 143 C94 146 106 146 114 143", "#000", 2, 'stroke-opacity=".2"'))] },
    { id: "sweater", label: "\u30BB\u30FC\u30BF\u30FC", layers: [
      L((x) => x.b, OPEN.collar, (x) => collarPoints(x.b, shade(x.b, 0.18))),
      L((x) => x.a, OPEN.crewLow, (x) => S("M84 148 C90 163 110 163 116 148", shade(x.a, 0.15), 4.5) + S("M60 196 L60 186 M70 196 L70 184 M130 196 L130 184 M140 196 L140 186", shade(x.a, 0.12), 1.4))
    ] },
    { id: "cardigan", label: "\u30AB\u30FC\u30C7\u30A3\u30AC\u30F3", layers: [
      L((x) => x.b, OPEN.crew, (x) => crewRib(shade(x.b, 0.1), 2.5)),
      L((x) => x.a, OPEN.front, (x) => S("M83 147 L96 200 M117 147 L104 200", shade(x.a, 0.15), 3) + `<circle cx="91" cy="176" r="2" fill="${shade(x.a, 0.2)}"/><circle cx="94.5" cy="190" r="2" fill="${shade(x.a, 0.2)}"/>`)
    ] },
    { id: "blouse", label: "\u30D6\u30E9\u30A6\u30B9", layers: [
      L((x) => x.a, OPEN.neck, (x) => P("M84 147 C83 161 96 163 100 152 C104 163 117 161 116 147 C108 144 92 144 84 147Z", x.b, `stroke="${shade(x.b, 0.15)}" stroke-width="1.5"`))
    ] },
    { id: "bowBlouse", label: "\u30DC\u30A6\u30BF\u30A4", layers: [
      L((x) => x.a, OPEN.neck, (x) => P("M100 155 L84 149 L86 163Z M100 155 L116 149 L114 163Z", x.b) + `<circle cx="100" cy="155" r="3.6" fill="${shade(x.b, 0.15)}"/>` + S("M98 157 L94 176 M102 157 L106 176", x.b, 3.4))
    ] },
    { id: "officeVest", label: "\u4E8B\u52D9\u670D\u30D9\u30B9\u30C8", layers: [
      L(() => WHITE, OPEN.neck, (x) => P("M84 147 C83 158 96 160 100 152 C104 160 117 158 116 147 C108 144 92 144 84 147Z", WHITE, 'stroke="#e0dbe6" stroke-width="1.5"') + P("M100 155 L90 149 L91 161Z M100 155 L110 149 L109 161Z", x.b) + `<circle cx="100" cy="155" r="3" fill="${shade(x.b, 0.15)}"/>`),
      L((x) => x.a, OPEN.front, (x) => `<circle cx="93" cy="180" r="1.8" fill="${shade(x.a, 0.3)}"/><circle cx="95.5" cy="192" r="1.8" fill="${shade(x.a, 0.3)}"/>`)
    ] },
    { id: "workwear", label: "\u4F5C\u696D\u7740", layers: [
      L((x) => x.a, OPEN.collar, (x) => P("M84 146 L100 161 L92 170 L80 152Z M116 146 L100 161 L108 170 L120 152Z", shade(x.a, 0.12)) + S("M100 161 L100 200", shade(x.a, 0.35), 2.4) + `<rect x="112" y="174" width="18" height="14" rx="2" fill="${shade(x.a, 0.1)}"/><rect x="70" y="174" width="18" height="7" rx="1.5" fill="${x.b}"/>`)
    ] },
    { id: "labcoat", label: "\u767D\u8863", layers: [
      L((x) => x.a, OPEN.neck, (x) => collarClosed(lighten(x.a, 0.3), shade(x.a, 0.15)) + tie(x.b, x)),
      L(() => "#f7f7fa", OPEN.front, (x) => lapelsOpen("#e6e3ec") + `<rect x="114" y="178" width="16" height="12" rx="2" fill="none" stroke="#dcd8e3" stroke-width="1.5"/>` + S("M118 176 L118 184", "#3a8fd9", 2))
    ] },
    { id: "apron", label: "\u30A8\u30D7\u30ED\u30F3", layers: [
      L((x) => x.a, OPEN.crew, (x) => crewRib(shade(x.a, 0.15)) + P("M80 172 L120 172 L124 200 L76 200Z", x.b) + S("M80 172 L74 152 M120 172 L126 152", x.b, 3.5) + `<rect x="92" y="180" width="16" height="10" rx="2" fill="${shade(x.b, 0.1)}"/>`)
    ] },
    { id: "denim", label: "\u30C7\u30CB\u30E0", layers: [
      L((x) => x.b, OPEN.crew, (x) => crewRib(shade(x.b, 0.12), 2.5)),
      L((x) => x.a, OPEN.front, (x) => P("M83 146 L91 164 L86 170 L76 154Z M117 146 L109 164 L114 170 L124 154Z", shade(x.a, 0.12)) + `<rect x="64" y="172" width="18" height="12" rx="2" fill="none" stroke="#e8b04a" stroke-width="1.2" stroke-dasharray="2 2"/><rect x="118" y="172" width="18" height="12" rx="2" fill="none" stroke="#e8b04a" stroke-width="1.2" stroke-dasharray="2 2"/>`)
    ] },
    { id: "kimono", label: "\u7740\u7269", layers: [
      L((x) => x.b, OPEN.neck),
      L((x) => x.a, OPEN.kimono, (x) => S("M115 146 L86 200", shade(x.a, 0.2), 2.5) + P("M40 190 L160 190 L160 200 L40 200Z", shade(x.a, 0.3)))
    ] },
    { id: "chefCoat", label: "\u30B3\u30C3\u30AF\u30B3\u30FC\u30C8", layers: [
      L((x) => x.a, OPEN.neck, (x) => P("M86 148 C88 140 112 140 114 148 L114 154 C106 151 94 151 86 154Z", x.a, `stroke="${shade(x.a, 0.1)}" stroke-width="1.5"`) + [[90, 168], [90, 184], [110, 168], [110, 184]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="${x.b}"/>`).join("") + S("M100 154 L120 200", shade(x.a, 0.1), 1.5))
    ] }
  ];
  function drawTop(top, x, uidp) {
    let defs = `<clipPath id="${uidp}body"><path d="${BODY}"/></clipPath>`, body = P(BODY, x.skin);
    top.layers.forEach((ly, i) => {
      let attr = "";
      if (ly.open) {
        const mid = `${uidp}m${i}`;
        defs += `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><path d="${ly.open}" fill="#000"/></mask>`;
        attr = `mask="url(#${mid})"`;
      }
      body += P(BODY, ly.fill(x), attr);
      if (ly.open) body += `<path d="${ly.open}" fill="none" stroke="${LINE}" stroke-width="${LINE_W / 2}" stroke-linejoin="round" clip-path="url(#${uidp}body)"/>`;
      body += ly.deco ? ly.deco(x) : "";
    });
    body += P(BODY_SIDES, "#000", 'opacity=".07"');
    body += both(T([60, 168, 63.5, 180, 61, 194], "#1a1226", 1.8, 'opacity=".16"') + T([66, 162, 70, 167, 74, 168], "#1a1226", 1.2, 'opacity=".12"'));
    return { defs, body };
  }
  var NECKWEAR = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "lanyard", label: "\u793E\u54E1\u8A3C", draw: (x) => S("M89 151 L98 184 M111 151 L102 184", x.a, 2.4) + `<rect x="91" y="183" width="18" height="15" rx="2.5" fill="#fff" stroke="${shade(x.b, 0.2)}" stroke-width="1"/><rect x="94" y="187" width="6" height="7" rx="1" fill="${x.b}"/>` + S("M102 188 L106 188 M102 192 L106 192", "#c9c3d0", 1.2) },
    { id: "bowtie", label: "\u8776\u30CD\u30AF\u30BF\u30A4", replacesTie: true, draw: (x) => P("M100 156 L88 150 L88 162Z M100 156 L112 150 L112 162Z", x.a) + `<rect x="96.5" y="152.5" width="7" height="7" rx="2" fill="${shade(x.a, 0.2)}"/>` },
    { id: "scarf", label: "\u30B9\u30AB\u30FC\u30D5", replacesTie: true, draw: (x) => P("M84 150 C90 160 110 160 116 150 C114 158 106 162 100 162 C94 162 86 158 84 150Z", x.a) + P("M100 160 L94 178 L101 176Z M101 160 L108 176 L102 172Z", x.a) + `<circle cx="100" cy="160" r="3.4" fill="${shade(x.a, 0.2)}"/>` },
    { id: "muffler", label: "\u30DE\u30D5\u30E9\u30FC", draw: (x) => P("M80 148 C80 140 120 140 120 148 L120 158 C108 164 92 164 80 158Z", x.a) + P("M104 156 L116 156 L118 192 L104 192Z", x.a) + S("M104 186 L118 186", x.b, 2) + S("M106 192 L106 196 M110 192 L110 196 M114 192 L114 196", x.a, 1.6) + S("M82 152 C94 157 106 157 118 152", shade(x.a, 0.15), 1.5) },
    { id: "necklace", label: "\u30CD\u30C3\u30AF\u30EC\u30B9", draw: (x) => S("M88 150 C90 166 110 166 112 150", x.a, 1.4) + `<circle cx="100" cy="164.5" r="2.6" fill="${x.b}"/>` },
    { id: "pearls", label: "\u30D1\u30FC\u30EB", draw: (x) => ring(100, 146, 16, 11, 2.3, 30, 150).map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="${x.a}"/>`).join("") },
    { id: "pendant", label: "\u30DA\u30F3\u30C0\u30F3\u30C8", draw: (x) => S("M88 150 L100 172 L112 150", x.a, 1.2) + P("M100 170 L106 176 L100 184 L94 176Z", x.b) },
    { id: "stetho", label: "\u8074\u8A3A\u5668", draw: (x) => S("M84 150 C80 170 84 182 92 184 M116 150 C120 166 118 176 112 182", x.a, 2.4) + `<circle cx="112" cy="185" r="4.6" fill="${x.b}" stroke="${x.a}" stroke-width="1.6"/>` }
  ];
  var CHEST = [
    { id: "none", label: "\u306A\u3057", draw: (x) => "" },
    { id: "pin", label: "\u793E\u7AE0", draw: (x) => `<circle cx="122" cy="166" r="3.4" fill="${x.a}"/><circle cx="122" cy="166" r="1.4" fill="${x.b}"/>` },
    { id: "nameTag", label: "\u540D\u672D", draw: (x) => `<rect x="66" y="170" width="22" height="12" rx="2" fill="#fff" stroke="#d8d2de" stroke-width="1"/><rect x="66" y="170" width="22" height="3.6" rx="1" fill="${x.a}"/>` + S("M70 177.5 L84 177.5", "#b9b2c2", 1.4) },
    { id: "pen", label: "\u80F8\u30DD\u30B1\u306E\u30DA\u30F3", draw: (x) => `<rect x="118" y="164" width="3" height="14" rx="1.5" fill="${x.a}"/><rect x="124" y="166" width="3" height="12" rx="1.5" fill="${x.b}"/>` + S("M114 176 L132 176", "#000", 1.2, 'stroke-opacity=".15"') },
    { id: "pocketSq", label: "\u30DD\u30B1\u30C3\u30C8\u30C1\u30FC\u30D5", draw: (x) => P("M116 172 L120 164 L124 170 L128 163 L131 172Z", x.a) + S("M114 172 L133 172", "#000", 1.2, 'stroke-opacity=".2"') },
    { id: "flower", label: "\u80F8\u306E\u82B1", draw: (x) => `<g transform="translate(122 168)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${4.4 * Math.cos(a * Math.PI / 180)}" cy="${4.4 * Math.sin(a * Math.PI / 180)}" r="3.6" fill="${x.a}"/>`).join("")}<circle r="2.4" fill="${x.b}"/></g>` },
    { id: "badge", label: "\u7F36\u30D0\u30C3\u30B8", draw: (x) => `<circle cx="122" cy="172" r="7" fill="${x.a}" stroke="${shade(x.a, 0.2)}" stroke-width="1"/><circle cx="122" cy="172" r="3.2" fill="${x.b}"/>` }
  ];

  // src/styles/officers/presets.js
  function randomOfficer(r) {
    const { pick, chance } = r;
    const masc = chance(0.5);
    const hair = masc ? pick(["side", "side", "slick", "crop", "crop", "pomp", "curtain", "wavy", "buzz", "spiky", "topknot", "sides", "curly", "afro", "none"]) : pick(["bob", "bobBang", "medium", "long", "longSide", "longWavy", "hime", "pony", "bun", "pixie", "twinBuns", "braid", "curly", "afro", "twintails"]);
    const natural = ["#2b2429", "#2b2429", "#2b2429", "#4b3428", "#4b3428", "#7c4e30", "#a0663a", "#dcae63", "#b9b5bb", "#a9523b", "#8c8a96"];
    const gray = hair === "sides" || hair === "none";
    const formal = chance(0.45);
    const tops = formal ? ["suit", "suit", "threePiece", "blazerShirt", "shirtTie", "officeVest", "bowBlouse"] : ["blazer", "shirt", "polo", "hoodie", "zipHoodie", "tshirt", "logoTee", "vneck", "stripe", "turtle", "sweater", "cardigan", "blouse", "workwear", "denim", "apron", "labcoat"];
    const items = PALETTES.item;
    return {
      skin: pick(PALETTES.skin),
      hair,
      hairColor: gray ? "#b9b5bb" : chance(0.08) ? pick(PALETTES.hair.slice(11)) : pick(natural),
      eyes: pick(["normal", "normal", "normal", "small", "happy", "lash", "calm", "big", "almond", "wink", "sleepy"]),
      eyesColor: pick(PALETTES.eyes),
      brows: pick(["normal", "normal", "thick", "thin", "flat", "raised", "arched", "worried"]),
      nose: pick(["soft", "soft", "button", "nostrils", "line", "round"]),
      mouth: masc ? pick(["smile", "smile", "grin", "open", "teeth", "neutral", "smirk", "laugh"]) : pick(["smile", "smile", "grin", "open", "teeth", "laugh", "lips", "lipsSmile", "cat"]),
      mouthColor: pick(PALETTES.lips),
      beard: masc && chance(0.3) ? pick(["stubble", "mustache", "chevron", "goatee", "beard", "chin", "sideburns"]) : "none",
      face: ["blush", ...chance(0.15) ? ["freckles"] : [], ...chance(0.12) ? ["mole"] : [], ...gray ? ["crow", "smile"] : []],
      glasses: chance(0.3) ? pick(["round", "square", "rect", "bold", "browline", "cat", "oval", "roundBig"]) : "none",
      glassesColor: pick(["#2b2233", "#2b2233", "#8c8a96", "#a6714a", "#c9a227", "#3a8fd9", "#d94a4a"]),
      hat: chance(0.12) ? pick(["beret", "cap", "beanie", "bucket", "fedora", "headband", "alice", "ribbon", "flower", "newsboy"]) : "none",
      hatColor: pick(items),
      hatColor2: pick(items),
      ear: chance(0.08) ? pick(["headphones", "headset", "earbuds", "pencil", "neckphones"]) : "none",
      earColor: pick(items),
      earColor2: "#2b2233",
      earrings: !masc && chance(0.4) ? pick(["stud", "hoop", "drop", "pearl", "long"]) : "none",
      earringsColor: pick(["#c9a227", "#c9a227", "#d8d8de", "#ffffff", "theme-accent"]),
      top: pick(tops),
      topColor: pick(["theme", "theme-dark", "theme-light", "theme", "theme-dark", ...items.slice(4)]),
      topColor2: pick(["#ffffff", "theme-accent", "theme-light", ...items.slice(4)]),
      neck: chance(0.3) ? pick(["lanyard", "lanyard", "necklace", "scarf", "pearls", "pendant"]) : "none",
      neckColor: pick(items),
      neckColor2: pick(items),
      chest: formal && chance(0.4) ? pick(["pin", "pin", "nameTag", "pen", "pocketSq"]) : chance(0.1) ? pick(["badge", "flower", "nameTag"]) : "none",
      chestColor: pick(["#c9a227", ...items]),
      chestColor2: "#ffffff"
    };
  }
  var ROLES = [
    { label: "Web\u30C7\u30B6\u30A4\u30CA\u30FC", skin: "#fbdcc8", hair: "bobBang", hairColor: "#4b3428", top: "turtle", topColor: "theme-dark", eyes: "lash", mouth: "smile", glasses: "round", hat: "beret", hatColor: "theme-accent" },
    { label: "\u55B6\u696D", skin: "#f3c9a8", hair: "side", top: "suit", eyes: "happy", mouth: "grin", chest: "pin" },
    { label: "\u30A8\u30F3\u30B8\u30CB\u30A2", skin: "#e9b48e", hair: "crop", hairColor: "#7c4e30", top: "hoodie", topColor: "theme", topColor2: "#ffffff", eyes: "normal", mouth: "neutral", glasses: "square", ear: "headphones" },
    { label: "\u793E\u9577", skin: "#f3c9a8", hair: "sides", hairColor: "#b9b5bb", top: "threePiece", topColor: "#3a3f4b", topColor2: "#8e2b3a", eyes: "calm", mouth: "smile", glasses: "browline", beard: "mustache", face: ["blush", "crow", "smile"], chest: "pocketSq", chestColor: "#ffffff" },
    { label: "\u4EBA\u4E8B", skin: "#fbdcc8", hair: "long", hairColor: "#7c4e30", top: "cardigan", topColor: "theme-light", topColor2: "#ffffff", eyes: "happy", mouth: "smile", neck: "lanyard" },
    { label: "\u30DE\u30FC\u30B1\u30BF\u30FC", skin: "#e9b48e", hair: "bun", hairColor: "#a9523b", top: "blazer", topColor: "theme", topColor2: "#ffffff", eyes: "lash", mouth: "lipsSmile", earrings: "hoop" },
    { label: "PM", skin: "#c48659", hair: "pomp", hairColor: "#4b3428", top: "shirt", topColor: "theme-light", eyes: "normal", mouth: "smile", beard: "stubble", neck: "lanyard" },
    { label: "\u65B0\u4EBA", skin: "#fbdcc8", hair: "side", top: "suit", topColor: "#2f3a52", eyes: "big", mouth: "open", brows: "raised", face: ["blush", "sweat"] },
    { label: "\u7D4C\u7406", skin: "#f3c9a8", hair: "pony", top: "officeVest", topColor: "theme-dark", topColor2: "theme-accent", eyes: "calm", mouth: "smile", glasses: "rect" },
    { label: "UI\u30C7\u30B6\u30A4\u30CA\u30FC", skin: "#83563a", hair: "curly", top: "logoTee", topColor: "theme-accent", topColor2: "#ffffff", eyes: "happy", mouth: "grin", earrings: "stud" },
    { label: "\u30B5\u30DD\u30FC\u30C8", skin: "#f3c9a8", hair: "longSide", hairColor: "#dcae63", top: "bowBlouse", topColor: "theme-light", topColor2: "theme", eyes: "happy", mouth: "smile", ear: "headset" },
    { label: "CTO", skin: "#62402b", hair: "crop", hairColor: "#4b3428", top: "blazer", topColor: "#3a3f4b", topColor2: "#ffffff", eyes: "calm", mouth: "smile", glasses: "round", beard: "beard" },
    { label: "\u5E83\u5831", skin: "#fde4d3", hair: "pixie", hairColor: "#8c8a96", top: "blouse", topColor: "theme-accent", topColor2: "#ffffff", eyes: "sparkle", mouth: "lips", earrings: "drop", neck: "necklace", neckColor: "#c9a227", neckColor2: "#ffffff" },
    { label: "\u7DCF\u52D9", skin: "#e9b48e", hair: "slick", hairColor: "#b9b5bb", top: "shirtTie", topColor: "#ffffff", topColor2: "theme", eyes: "calm", mouth: "smile", glasses: "oval", face: ["blush", "crow"], chest: "pen" },
    { label: "\u73FE\u5834\u76E3\u7763", skin: "#c48659", hair: "buzz", top: "workwear", topColor: "theme", topColor2: "#ffffff", eyes: "normal", brows: "thick", mouth: "grin", hat: "hardhat", hatColor: "#f2c94c", hatColor2: "theme" },
    { label: "\u30B7\u30A7\u30D5", skin: "#f3c9a8", hair: "side", top: "chefCoat", topColor: "#ffffff", topColor2: "#2b2233", eyes: "happy", mouth: "grin", beard: "handlebar", hat: "chef", hatColor: "#ffffff" },
    { label: "\u7814\u7A76\u54E1", skin: "#fbdcc8", hair: "bob", hairColor: "#2b2429", top: "labcoat", topColor: "theme-light", topColor2: "theme", eyes: "normal", mouth: "neutral", glasses: "roundBig" },
    { label: "\u30AB\u30D5\u30A7\u5E97\u54E1", skin: "#d99e76", hair: "twinBuns", hairColor: "#4b3428", top: "apron", topColor: "#ffffff", topColor2: "theme-dark", eyes: "wink", mouth: "grin", face: ["blush", "freckles"] },
    { label: "\u53D7\u4ED8", skin: "#fbdcc8", hair: "bun", hairColor: "#2b2429", top: "officeVest", topColor: "theme", topColor2: "theme-accent", eyes: "lash", mouth: "lipsSmile", earrings: "pearl", earringsColor: "#ffffff", neck: "none" },
    { label: "\u30A4\u30F3\u30BF\u30FC\u30F3", skin: "#f3c9a8", hair: "wavy", hairColor: "#7c4e30", top: "stripe", topColor: "#ffffff", topColor2: "theme", eyes: "big", mouth: "teeth", ear: "earbuds", earColor: "#ffffff", neck: "lanyard" },
    { label: "\u9867\u554F", skin: "#d99e76", hair: "none", top: "kimono", topColor: "theme-dark", topColor2: "#f4f1f6", eyes: "closed", mouth: "smile", beard: "longBeard", face: ["blush", "crow", "forehead"], glasses: "monocle", glassesColor: "#c9a227" },
    { label: "\u6D77\u5916\u652F\u793E", skin: "#a26b45", hair: "none", hat: "hijab", hatColor: "theme", top: "blazer", topColor: "theme-dark", topColor2: "#ffffff", eyes: "lash", mouth: "smile" },
    { label: "\u60C5\u30B7\u30B9", skin: "#fbdcc8", hair: "curtain", hairColor: "#2b2429", top: "zipHoodie", topColor: "#3a3f4b", topColor2: "#ffffff", eyes: "tired", mouth: "neutral", glasses: "bold", face: ["eyebags"], ear: "pencil", earColor: "#f2c94c" },
    { label: "\u533B\u52D9\u5BA4", skin: "#f3c9a8", hair: "medium", hairColor: "#4b3428", top: "labcoat", topColor: "#dbeafe", topColor2: "#dbeafe", eyes: "happy", mouth: "smile", neck: "stetho", neckColor: "#3a3f4b", neckColor2: "#d8d8de" }
  ];

  // src/styles/officers/index.js
  var FACE_VIEW = "56 58 88 88";
  var HEAD_VIEW = "20 6 160 160";
  var BODY_VIEW = "20 120 160 80";
  var CATEGORIES = [
    { key: "skin", label: "\u808C", colors: [{ key: "skin", label: "\u808C\u306E\u8272", palette: PALETTES.skin }] },
    { key: "hair", label: "\u9AEA\u578B", parts: HAIR, view: HEAD_VIEW, colors: [{ key: "hairColor", label: "\u9AEA\u306E\u8272", palette: PALETTES.hair }] },
    { key: "eyes", label: "\u76EE", parts: EYES, view: FACE_VIEW, colors: [{ key: "eyesColor", label: "\u77B3\uFF08\u3071\u3063\u3061\u308A\u30FB\u30AD\u30E9\u30AD\u30E9\uFF09", palette: PALETTES.eyes }] },
    { key: "brows", label: "\u7709", parts: BROWS, view: FACE_VIEW },
    { key: "nose", label: "\u9F3B", parts: NOSES, view: FACE_VIEW },
    { key: "mouth", label: "\u53E3", parts: MOUTHS, view: FACE_VIEW, colors: [{ key: "mouthColor", label: "\u53E3\u7D05", palette: PALETTES.lips }] },
    { key: "beard", label: "\u3072\u3052", parts: BEARDS, view: FACE_VIEW },
    { key: "face", label: "\u9854\u306E\u3057\u308B\u3057", parts: FACE_MARKS, view: FACE_VIEW, multi: true },
    { key: "glasses", label: "\u30E1\u30AC\u30CD", parts: GLASSES, view: FACE_VIEW, colors: [{ key: "glassesColor", label: "\u30D5\u30EC\u30FC\u30E0", palette: PALETTES.item }, { key: "glassesColor2", label: "\u30EC\u30F3\u30BA", palette: PALETTES.item }] },
    { key: "hat", label: "\u5E3D\u5B50\u30FB\u9AEA\u98FE\u308A", parts: HATS, view: HEAD_VIEW, colors: [{ key: "hatColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES.item }, { key: "hatColor2", label: "\u30B5\u30D6", palette: PALETTES.item }] },
    { key: "ear", label: "\u30D8\u30C3\u30C9\u30DB\u30F3\u7B49", parts: EARGEAR, view: "20 30 160 160", colors: [{ key: "earColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES.item }, { key: "earColor2", label: "\u30B5\u30D6", palette: PALETTES.item }] },
    { key: "earrings", label: "\u30D4\u30A2\u30B9", parts: EARRINGS, view: "40 80 60 60", colors: [{ key: "earringsColor", label: "\u8272", palette: PALETTES.item }] },
    { key: "top", label: "\u670D", parts: TOPS, view: BODY_VIEW, colors: [{ key: "topColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES.item }, { key: "topColor2", label: "\u30B5\u30D6\uFF08\u30CD\u30AF\u30BF\u30A4\u30FB\u30A4\u30F3\u30CA\u30FC\uFF09", palette: PALETTES.item }] },
    { key: "neck", label: "\u9996\u307E\u308F\u308A", parts: NECKWEAR, view: BODY_VIEW, colors: [{ key: "neckColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES.item }, { key: "neckColor2", label: "\u30B5\u30D6", palette: PALETTES.item }] },
    { key: "chest", label: "\u80F8\u5143", parts: CHEST, view: BODY_VIEW, colors: [{ key: "chestColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES.item }, { key: "chestColor2", label: "\u30B5\u30D6", palette: PALETTES.item }] },
    { key: "bg", label: "\u80CC\u666F", colors: [{ key: "bgColor", label: "\u80CC\u666F\u8272", palette: PALETTES.bg }] }
  ];
  var GROUPS = [
    { label: "\u9854", cats: ["skin", "eyes", "brows", "mouth", "nose", "beard", "face"] },
    { label: "\u9AEA", cats: ["hair"] },
    { label: "\u670D", cats: ["top", "neck", "chest"] },
    { label: "\u5C0F\u7269", cats: ["glasses", "hat", "earrings", "ear"] },
    { label: "\u80CC\u666F", cats: ["bg"] }
  ];
  var DEFAULTS = {
    skin: "#f3c9a8",
    hair: "side",
    hairColor: "#2b2429",
    eyes: "normal",
    eyesColor: "#5a3a2a",
    brows: "normal",
    nose: "soft",
    mouth: "smile",
    mouthColor: "#d65a6f",
    beard: "none",
    face: ["blush"],
    glasses: "none",
    glassesColor: "#2b2233",
    glassesColor2: "#ffffff",
    hat: "none",
    hatColor: "theme-accent",
    hatColor2: "#2b2233",
    ear: "none",
    earColor: "theme-accent",
    earColor2: "#2b2233",
    earrings: "none",
    earringsColor: "#c9a227",
    top: "suit",
    topColor: "theme-dark",
    topColor2: "theme-accent",
    neck: "none",
    neckColor: "theme-accent",
    neckColor2: "theme-light",
    chest: "none",
    chestColor: "#c9a227",
    chestColor2: "#ffffff",
    bgColor: "theme-bg"
  };
  var circles = (list, fill, dy = 0) => (list || []).map(([x, y, r]) => `<circle cx="${x}" cy="${y + dy}" r="${r}" fill="${fill}"/>`).join("");
  var hairTies = (ties, fill) => (ties || []).map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5" fill="${fill}"/>`).join("");
  function compose(scene) {
    const { config: cfg, options } = scene;
    const skin = scene.color("skin");
    const hair = scene.color("hairColor");
    const look = {
      id: scene.id,
      skin,
      skinShade: mix(skin, "#8a3f2e", 0.16),
      skinDeep: mix(skin, "#6b2a22", 0.32),
      hair,
      hairShade: shade(hair, 0.25),
      brow: luminance(hair) > 0.55 ? mix(hair, INK, 0.5) : hair
    };
    const paint = (cat) => ({ ...look, id: scene.uid(cat), a: scene.color(`${cat}Color`), b: scene.color(`${cat}Color2`) });
    const lineAttr = `stroke="${LINE}" stroke-width="${LINE_W / 2}" stroke-linejoin="round"`;
    scene.define(blushGradient(scene.uid("bl"), "#ff6f73", 0.42, 0.2));
    const regionUrl = Object.fromEntries(Object.entries(REGIONS).map(([cat, paths]) => [cat, scene.clip(`r${cat}`, paths)]));
    const inRegion = (cat, part, svg) => !svg || scene.omit.has(cat) ? "" : part.free || options.noClip ? svg : scene.clipped(regionUrl[cat], svg);
    const draw = (cat, ctx = paint(cat)) => {
      const p = scene.part(cat);
      return inRegion(cat, p, p.draw(ctx));
    };
    const H = scene.part("hair"), hat = scene.part("hat"), ear = scene.part("ear");
    const hideHair = !!hat.hidesHair;
    const hatPaint = paint("hat"), earPaint = paint("ear");
    const hatColor = scene.color("hatColor");
    const strandColor = luminance(hair) < 0.25 ? lighten(hair, 0.38) : shade(hair, 0.32);
    const cover = !hideHair && hat.cover;
    const puffs = cover && H.hatPuffs;
    let underHat = (s) => s;
    if (cover) {
      const { y, hw } = cover, side = y + (100 - hw) * 1.6;
      const url = scene.clip("hc", `M0 200 L0 ${side} L${100 - hw} ${y} L${100 + hw} ${y} L200 ${side} L200 200Z`);
      underHat = (s) => scene.clipped(url, s);
    }
    if (hat.back) scene.add(scene.outlined(hat.back(hatPaint)));
    if (!hideHair) {
      if (puffs) scene.add(scene.outlined(circles(puffs.map(([x, y, r]) => [x + (x < 100 ? -2 : 2), y + 2, r]), look.hairShade)));
      else scene.add(scene.outlined(underHat((H.back && !(cover && H.bunBack) ? P(H.back, look.hairShade) : "") + circles(H.backCircles, look.hairShade))));
    }
    scene.add(P(NECK, skin, lineAttr), P(NECK_SHADOW, look.skinShade));
    if (!scene.omit.has("top")) scene.add(P(BODY, LINE, `stroke="${LINE}" stroke-width="${LINE_W}" stroke-linejoin="round"`));
    const neckPart = scene.part("neck");
    const top = drawTop(scene.part("top"), { ...paint("top"), noTie: !!neckPart.replacesTie && !scene.omit.has("neck") }, scene.id);
    scene.define(top.defs);
    const clothes = (scene.omit.has("top") ? P(BODY, skin) : top.body) + (scene.omit.has("neck") ? "" : neckPart.draw(paint("neck"))) + (scene.omit.has("chest") ? "" : scene.part("chest").draw(paint("chest"))) + (ear.body && !scene.omit.has("ear") ? ear.draw(earPaint) : "");
    scene.add(options.noClip ? `<g >${scene.outlined(clothes)}</g>` : scene.clipped(regionUrl.top, scene.outlined(clothes)));
    if (!hideHair && H.over) scene.add(scene.outlined(underHat(P(H.over, hair))));
    if (!hideHair && H.braid) {
      scene.add(scene.outlined(underHat(
        H.braid.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="9" fill="${hair}" stroke="${look.hairShade}" stroke-width="1.5"/>`).join("") + `<ellipse cx="141" cy="178" rx="4" ry="3" fill="${hatColor}"/>`
      )));
    }
    const earSvg = P(EAR, skin, lineAttr) + S(EAR_IN, look.skinShade, 2);
    scene.add(earSvg, M(earSvg));
    scene.add(scene.outlined(draw("earrings")));
    const faceUrl = scene.clip("f", FACE);
    scene.add(P(FACE, skin, lineAttr));
    scene.add(`<path d="${FACE_SHADE}" fill="${look.skinShade}" opacity=".55" clip-path="${faceUrl}"/>`);
    if (cover) {
      scene.add(`<path d="M0 ${cover.y - 4} L200 ${cover.y - 4} L200 ${cover.y + 7} C150 ${cover.y + 4} 50 ${cover.y + 4} 0 ${cover.y + 7}Z" fill="${look.skinShade}" clip-path="${faceUrl}"/>`);
    } else if (!hideHair && !H.noShadow) {
      if (H.front) scene.add(`<path d="${H.front}" transform="translate(0 4)" fill="${look.skinShade}" clip-path="${faceUrl}"/>`);
      if (H.frontCircles) scene.add(scene.clipped(faceUrl, circles(H.frontCircles, look.skinShade, 4)));
    }
    for (const mark of scene.selected("face")) scene.add(inRegion("face", mark, mark.draw(look)));
    scene.add(draw("brows", look), draw("eyes"), draw("nose", look), scene.outlined(draw("beard", look)), draw("mouth"));
    if (!hideHair) {
      const strands = H.strands ? H.strands.map((p) => T(p, strandColor, 1.7, 'opacity=".55"')).join("") : "";
      if (puffs) {
        scene.add(scene.outlined(circles(puffs, hair)));
      } else if (cover) {
        scene.add(scene.outlined(underHat(circles(H.frontCircles, hair) + (H.front ? P(H.front, hair, H.opacity ? `opacity="${H.opacity}"` : "") : "") + strands + (H.bunBack ? "" : hairTies(H.ties, hatColor)))));
      } else {
        if (H.shine) scene.add(`<ellipse cx="88" cy="60" rx="11" ry="5" transform="rotate(-25 88 60)" fill="#fff" opacity=".35"/>`);
        scene.add(scene.outlined(circles(H.frontCircles, hair) + (H.front ? P(H.front, hair) : "") + (H.extra ? P(H.extra, hair) : "")));
        if (H.front && H.opacity) scene.add(P(H.front, look.skinShade, `opacity="${1 - H.opacity}"`));
        if (H.lines) scene.add(S(H.lines.join(" "), look.hairShade, 1.6, 'opacity=".6"'));
        scene.add(strands);
        if (H.hl) scene.add(T(quadPoints(H.hl), "#fff", 3.6, 'opacity=".22"'));
        scene.add(hairTies(H.ties, hatColor));
      }
    }
    scene.add(draw("glasses"));
    if (hat.front) scene.add(scene.outlined(hat.front(hatPaint)));
    if (!ear.body) scene.add(scene.outlined(ear.draw(earPaint)));
  }
  var Officers = defineLibrary({
    key: "officers",
    label: "\u4EBA\u7269",
    idPrefix: "of",
    categories: CATEGORIES,
    groups: GROUPS,
    defaults: DEFAULTS,
    presets: ROLES,
    palettes: PALETTES,
    colorNames: COLOR_NAMES,
    outline: { color: LINE, width: LINE_W },
    resolveColor: resolveTheme,
    compose,
    random: (r) => randomOfficer(r),
    extras: { REGIONS }
  });

  // src/styles/yokai.js
  var INK2 = "#2b2233";
  var LINE2 = "#33263a";
  var LINE_W2 = 4.4;
  var WA = {
    "#e2553f": "\u6731",
    "#c93a4e": "\u7D05",
    "#f5b5c4": "\u685C",
    "#f2b33d": "\u5C71\u5439",
    "#f6e7d0": "\u751F\u6210",
    "#f3f0e8": "\u767D\u7DF4",
    "#8c9a4a": "\u9DAF",
    "#5cae7a": "\u82E5\u7AF9",
    "#3fa7b7": "\u6D45\u8471",
    "#2a4a7a": "\u85CD",
    "#9b88c9": "\u85E4",
    "#6b4a8a": "\u6C5F\u6238\u7D2B",
    "#a5683a": "\u67FF\u6E0B",
    "#d9c27a": "\u85C1",
    "#8e8a8e": "\u920D",
    "#3a3438": "\u58A8"
  };
  var BG = { "#f6efe2": "\u751F\u6210", "#fde2e4": "\u8584\u685C", "#e3efe2": "\u767D\u7DD1", "#dfe8f3": "\u767D\u85CD", "#efe6f7": "\u8584\u85E4", "#fff1c9": "\u5375", "#3a3f5c": "\u7D3A\u9F20", "#2b2233": "\u58A8" };
  var EYEC = { "#f2b33d": "\u5C71\u5439", "#e2553f": "\u6731", "#3fa7b7": "\u6D45\u8471", "#5cae7a": "\u82E5\u7AF9", "#9b88c9": "\u85E4", "#2b2233": "\u58A8" };
  var NAMES = { ...WA, ...BG, ...EYEC, auto: "\u304A\u307E\u304B\u305B" };
  var PALETTES2 = { body: Object.keys(WA), item: ["auto", ...Object.keys(WA)], eyes: Object.keys(EYEC), bg: Object.keys(BG) };
  var BODIES = [
    {
      id: "manju",
      label: "\u307E\u3093\u3058\u3085\u3046",
      top: 52,
      F: 112,
      arm: [40, 134],
      base: "feet",
      hl: [62, 100, 64, 72, 86, 60],
      d: "M100 52 C140 52 164 84 164 124 C164 160 136 176 100 176 C64 176 36 160 36 124 C36 84 60 52 100 52Z"
    },
    {
      id: "daruma",
      label: "\u3060\u308B\u307E",
      top: 44,
      F: 104,
      arm: [44, 128],
      base: "feet",
      hl: [62, 92, 64, 64, 84, 52],
      d: "M100 44 C138 44 160 74 160 112 C160 152 136 176 100 176 C64 176 40 152 40 112 C40 74 62 44 100 44Z"
    },
    {
      id: "obake",
      label: "\u304A\u3070\u3051",
      top: 40,
      F: 100,
      arm: [46, 122],
      base: "float",
      hl: [58, 96, 60, 62, 82, 48],
      d: "M100 40 C136 40 156 70 156 108 L156 160 Q147 172 138 162 Q128 174 119 162 Q110 174 100 162 Q90 174 81 162 Q72 174 62 162 Q53 172 44 160 L44 108 C44 70 64 40 100 40Z"
    },
    {
      id: "hitodama",
      label: "\u3072\u3068\u3060\u307E",
      top: 72,
      F: 128,
      arm: [46, 140],
      base: "float",
      hl: [58, 120, 62, 98, 78, 84],
      d: "M100 176 C64 176 44 152 44 126 C44 98 66 84 82 68 C94 56 96 40 90 24 C112 32 126 52 122 68 C140 82 156 100 156 126 C156 152 136 176 100 176Z"
    },
    {
      id: "chochin",
      label: "\u3061\u3087\u3046\u3061\u3093",
      top: 50,
      F: 110,
      arm: [50, 126],
      base: "feet",
      hl: [60, 104, 60, 80, 70, 62],
      d: "M66 52 C54 78 48 100 48 114 C48 128 54 150 66 172 L134 172 C146 150 152 128 152 114 C152 100 146 78 134 52Z",
      deco: (x) => [66, 80, 148, 160].map((y) => S(`M40 ${y} Q100 ${y + 7} 160 ${y}`, shade(x.a, 0.22), 2.2)).join(""),
      over: (x) => `<rect x="68" y="38" width="64" height="16" rx="5" fill="#3a3438"/><rect x="68" y="168" width="64" height="13" rx="5" fill="#3a3438"/>` + S("M70 46 L130 46 M70 174 L130 174", "#d9b04a", 1.6) + S("M90 38 Q100 26 110 38", "#3a3438", 3)
    },
    {
      id: "kasa",
      label: "\u304B\u3089\u304B\u3055",
      top: 30,
      F: 96,
      arm: [50, 120],
      base: "leg",
      hl: [70, 96, 76, 70, 94, 40],
      d: "M100 30 C120 50 150 92 166 132 C152 128 142 134 134 140 C124 132 112 132 100 140 C88 132 76 132 66 140 C58 134 48 128 34 132 C50 92 80 50 100 30Z",
      deco: (x) => S("M100 32 Q78 84 66 140 M100 32 L100 140 M100 32 Q122 84 134 140", shade(x.a, 0.22), 2),
      over: (x) => `<circle cx="100" cy="30" r="4.5" fill="${shade(x.a, 0.3)}"/>`
    },
    {
      id: "nurikabe",
      label: "\u306C\u308A\u304B\u3079",
      top: 46,
      F: 102,
      arm: [48, 128],
      base: "feet",
      hl: [60, 100, 58, 72, 72, 56],
      d: "M54 60 Q54 46 68 46 L132 46 Q146 46 146 60 L152 164 Q152 176 140 176 L60 176 Q48 176 48 164Z",
      deco: (x) => S("M46 66 L154 66 M46 150 L154 150 M46 164 L154 164 M78 46 L78 66 M122 46 L122 66 M70 150 L70 164 M100 150 L100 164 M130 150 L130 164 M86 164 L86 178 M116 164 L116 178", shade(x.a, 0.2), 1.8, 'opacity=".7"')
    },
    {
      id: "kodama",
      label: "\u3053\u3060\u307E",
      top: 40,
      F: 96,
      arm: [61, 124],
      base: "feet",
      hl: [70, 92, 70, 64, 86, 50],
      d: "M100 40 C126 40 138 60 138 90 L140 150 C140 166 124 176 100 176 C76 176 60 166 60 150 L62 90 C62 60 74 40 100 40Z"
    }
  ];
  var PATTERNS = [
    { id: "none", label: "\u306A\u3057", draw: () => "" },
    { id: "onaka", label: "\u304A\u306A\u304B", draw: (x, B) => `<ellipse cx="100" cy="${B.F + 44}" rx="36" ry="30" fill="${x.p}"/>` },
    { id: "mado", label: "\u9854\u307E\u3069", draw: (x, B) => `<ellipse cx="100" cy="${B.F + 4}" rx="33" ry="29" fill="${x.p}"/>` },
    { id: "shima", label: "\u3057\u307E\u3057\u307E", draw: (x, B) => [B.top + 22, B.top + 50, B.F + 32, B.F + 56].map((y) => both(T([22, y + 4, 44, y - 4, 70, y + 2], x.p, 7))).join("") },
    { id: "mizutama", label: "\u307F\u305A\u305F\u307E", draw: (x, B) => [[60, 76], [140, 70], [52, 120], [148, 116], [70, 156], [130, 160], [100, 168], [84, 58], [118, 54]].map(([a, b]) => `<circle cx="${a}" cy="${b + (B.F - 110) * 0.3}" r="6.5" fill="${x.p}"/>`).join("") },
    { id: "uroko", label: "\u3046\u308D\u3053", draw: (x, B) => {
      let s = "";
      const y0 = B.F + 36;
      for (let r = 0; r < 4; r++) for (let i = -1; i < 12; i++) {
        const y = y0 + r * 14, xx = 20 + i * 16 + r % 2 * 8;
        if ((i + r) % 2 === 0) s += P(`M${xx} ${y + 14} L${xx + 8} ${y} L${xx + 16} ${y + 14}Z`, x.p);
      }
      return s;
    } },
    { id: "seigaiha", label: "\u9752\u6D77\u6CE2", draw: (x, B) => {
      let s = "";
      const y0 = B.F + 40;
      for (let r = 0; r < 5; r++) for (let i = -1; i < 10; i++) {
        const cx = 16 + i * 24 + r % 2 * 12, cy = y0 + r * 10;
        s += `<circle cx="${cx}" cy="${cy}" r="12" fill="${x.p}"/>` + S(`M${cx - 8} ${cy} A8 8 0 0 1 ${cx + 8} ${cy} M${cx - 4} ${cy} A4 4 0 0 1 ${cx + 4} ${cy}`, x.a, 1.6);
      }
      return s;
    } },
    { id: "hoshi", label: "\u307B\u3057", draw: (x, B) => [[64, B.top + 30, 1], [136, B.top + 40, 0.8], [56, B.F + 40, 0.9], [144, B.F + 34, 1.1]].map(([a, b, s]) => `<path transform="translate(${a} ${b}) scale(${s})" d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z" fill="${x.p}"/>`).join("") }
  ];
  var ARMS2 = [
    { id: "none", label: "\u306A\u3057", draw: () => "" },
    { id: "nubs", label: "\u3061\u3087\u3053\u3093", draw: (x, B) => both(`<ellipse cx="${B.arm[0] - 3}" cy="${B.arm[1]}" rx="9" ry="12" transform="rotate(28 ${B.arm[0] - 3} ${B.arm[1]})" fill="${x.a}"/>`) },
    { id: "banzai", label: "\u3070\u3093\u3056\u3044", draw: (x, B) => both(`<ellipse cx="${B.arm[0] - 2}" cy="${B.arm[1] - 26}" rx="8" ry="14" transform="rotate(-28 ${B.arm[0] - 2} ${B.arm[1] - 26})" fill="${x.a}"/>`) },
    { id: "wave", label: "\u3084\u3042", draw: (x, B) => `<ellipse cx="${B.arm[0] - 3}" cy="${B.arm[1]}" rx="9" ry="12" transform="rotate(28 ${B.arm[0] - 3} ${B.arm[1]})" fill="${x.a}"/>` + M(`<ellipse cx="${B.arm[0] - 2}" cy="${B.arm[1] - 26}" rx="8" ry="14" transform="rotate(-28 ${B.arm[0] - 2} ${B.arm[1] - 26})" fill="${x.a}"/>`) },
    { id: "urameshi", label: "\u3046\u3089\u3081\u3057\u3084", front: true, draw: (x, B) => {
      const y = B.F + 34;
      return both(P(`M60 ${y - 2} Q72 ${y - 9} 82 ${y - 1} Q83 ${y + 11} 78 ${y + 15} Q75 ${y + 10} 73 ${y + 17} Q69 ${y + 11} 66 ${y + 16} Q62 ${y + 9} 59 ${y + 12} Q55 ${y + 4} 60 ${y - 2}Z`, x.a));
    } }
  ];
  var EX = [84, 116];
  var hiL = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;
  function spiral(cx, cy) {
    let d = "";
    for (let i = 0; i <= 28; i++) {
      const a = i * 0.55, r = 0.3 + i * 0.23;
      d += (i ? " L" : "M") + f2(cx + r * Math.cos(a)) + " " + f2(cy + r * Math.sin(a));
    }
    return d;
  }
  var EYES2 = [
    { id: "maru", label: "\u307E\u3093\u307E\u308B", draw: (x, F) => EX.map((e) => `<ellipse cx="${e}" cy="${F}" rx="6.4" ry="7.2" fill="${INK2}"/>${hiL(e + 2.2, F - 2.6)}<circle cx="${e - 2}" cy="${F + 3}" r="1" fill="#fff" fill-opacity=".85"/>`).join("") },
    { id: "hitotsume", label: "\u4E00\u3064\u76EE", draw: (x, F) => `<ellipse cx="100" cy="${F - 2}" rx="16" ry="15" fill="#fff" stroke="${LINE2}" stroke-width="2.4"/><circle cx="100" cy="${F}" r="9" fill="${x.a}"/><circle cx="100" cy="${F}" r="4.6" fill="${INK2}"/>${hiL(104, F - 4, 2.8)}<circle cx="96" cy="${F + 4}" r="1.3" fill="#fff"/>` + T([82, F - 13, 100, F - 24, 118, F - 13], INK2, 2.6) },
    { id: "mitsume", label: "\u4E09\u3064\u76EE", draw: (x, F) => EX.map((e) => `<ellipse cx="${e}" cy="${F}" rx="5.6" ry="6.4" fill="${INK2}"/>${hiL(e + 1.9, F - 2.2, 1.9)}`).join("") + P(`M100 ${F - 30} Q108 ${F - 21} 100 ${F - 12} Q92 ${F - 21} 100 ${F - 30}Z`, "#fff", `stroke="${LINE2}" stroke-width="2"`) + `<ellipse cx="100" cy="${F - 21}" rx="2.6" ry="5.4" fill="${x.a}"/>` },
    { id: "kirakira", label: "\u30AD\u30E9\u30AD\u30E9", draw: (x, F) => EX.map((e) => `<ellipse cx="${e}" cy="${F}" rx="7.4" ry="8.6" fill="${x.a}"/><ellipse cx="${e}" cy="${F + 1}" rx="4.2" ry="5.2" fill="${INK2}"/>${hiL(e + 2.6, F - 3.4, 2.6)}<circle cx="${e - 2.6}" cy="${F + 3.8}" r="1.3" fill="#fff"/>` + T([e - 8, F - 6, e, F - 12.5, e + 8, F - 6], INK2, 2.4)).join("") },
    { id: "nikkori", label: "\u306B\u3063\u3053\u308A", draw: (x, F) => EX.map((e) => T([e - 8, F + 2, e, F - 9, e + 8, F + 2], INK2, 4)).join("") },
    { id: "jito", label: "\u30B8\u30C8\u76EE", draw: (x, F) => EX.map((e) => P(`M${e - 7} ${F - 1} Q${e} ${F + 11} ${e + 7} ${F - 1}Z`, INK2) + T([e - 9, F - 1.5, e, F - 3, e + 9, F - 1.5], INK2, 2.6) + hiL(e + 2.4, F + 2, 1.4)).join("") },
    { id: "kitsune", label: "\u304D\u3064\u306D\u76EE", draw: (x, F) => both(T([93, F + 1, 86, F - 2, 74, F - 8], INK2, 4) + T([92, F + 6, 84, F + 4, 72, F - 4], "#d6413a", 2.2)) },
    { id: "guruguru", label: "\u3050\u308B\u3050\u308B", draw: (x, F) => EX.map((e) => S(spiral(e, F), INK2, 2.2)).join("") },
    { id: "tenten", label: "\u3066\u3093\u3066\u3093", draw: (x, F) => EX.map((e) => `<circle cx="${e}" cy="${F}" r="3.6" fill="${INK2}"/>`).join("") },
    { id: "batsu", label: "\u3070\u3064", draw: (x, F) => EX.map((e) => T([e - 6, F - 6, e, F, e + 6, F + 6], INK2, 3) + T([e + 6, F - 6, e, F, e - 6, F + 6], INK2, 3)).join("") },
    { id: "uruuru", label: "\u3046\u308B\u3046\u308B", draw: (x, F) => EX.map((e) => `<ellipse cx="${e}" cy="${F}" rx="7.4" ry="8.6" fill="${INK2}"/><ellipse cx="${e}" cy="${F + 4}" rx="5.6" ry="3.6" fill="${x.a}" opacity=".9"/>${hiL(e + 2.6, F - 3.6, 2.8)}${hiL(e - 2.8, F - 1, 1.6)}`).join("") + both(P(`M${EX[0] - 3} ${F + 10} Q${EX[0] - 6} ${F + 17} ${EX[0] - 3} ${F + 19} Q${EX[0]} ${F + 17} ${EX[0] - 3} ${F + 10}Z`, "#8cc8f0")) }
  ];
  var TONGUE = "#f08a9b";
  var MOUTH_IN = "#6b2230";
  var fang = (cx, y) => P(`M${cx - 3.6} ${y} L${cx + 3.6} ${y} L${cx} ${y + 7}Z`, "#fff", `stroke="${LINE2}" stroke-width="1.4" stroke-linejoin="round"`);
  var MOUTHS2 = [
    { id: "nikko", label: "\u306B\u3053", draw: (x, y) => T([90, y - 1, 100, y + 7, 110, y - 1], INK2, 3.4) },
    { id: "kiba", label: "\u304D\u3070", draw: (x, y) => T([88, y - 2, 100, y + 7, 112, y - 2], INK2, 3.4) + fang(106, y + 2) },
    { id: "kiba2", label: "\u30C0\u30D6\u30EB\u304D\u3070", draw: (x, y) => T([86, y - 2, 100, y + 7, 114, y - 2], INK2, 3.4) + fang(93, y + 2) + fang(107, y + 2) },
    { id: "ooguchi", label: "\u304A\u304A\u3050\u3061", draw: (x, y) => P(`M84 ${y - 4} Q100 ${y + 22} 116 ${y - 4}Z`, MOUTH_IN, `stroke="${LINE2}" stroke-width="2.2" stroke-linejoin="round"`) + P(`M92 ${y + 9} Q100 ${y + 3} 108 ${y + 9} Q100 ${y + 14} 92 ${y + 9}Z`, TONGUE) + P(`M86 ${y - 3} L90 ${y + 2} L94 ${y - 2.6} L98 ${y + 3} L102 ${y - 2.6} L106 ${y + 3} L110 ${y - 2.6} L114 ${y - 3}Z`, "#fff") },
    { id: "bero", label: "\u3042\u3063\u304B\u3093\u3079\u30FC", draw: (x, y) => T([88, y - 2, 100, y + 6, 112, y - 2], INK2, 3.2) + P(`M94 ${y + 2} L106 ${y + 2} L107 ${y + 20} Q100 ${y + 29} 93 ${y + 20}Z`, TONGUE, `stroke="${LINE2}" stroke-width="2" stroke-linejoin="round"`) + S(`M100 ${y + 6} L100 ${y + 18}`, shade(TONGUE, 0.25), 1.4) },
    { id: "omega", label: "\u03C9", draw: (x, y) => S(`M89 ${y - 2} Q94.5 ${y + 6} 100 ${y - 1} Q105.5 ${y + 6} 111 ${y - 2}`, INK2, 3) },
    { id: "beak", label: "\u304F\u3061\u3070\u3057", draw: (x, y) => P(`M86 ${y - 6} Q100 ${y - 13} 114 ${y - 6} Q110 ${y + 7} 100 ${y + 9} Q90 ${y + 7} 86 ${y - 6}Z`, "#f2a93b", `stroke="${LINE2}" stroke-width="2.2" stroke-linejoin="round"`) + T([88, y - 4, 100, y, 112, y - 4], shade("#f2a93b", 0.35), 1.6) },
    { id: "giza", label: "\u30AE\u30B6\u6B6F", draw: (x, y) => P(`M82 ${y - 5} Q100 ${y + 18} 118 ${y - 5}Z`, MOUTH_IN, `stroke="${LINE2}" stroke-width="2.2" stroke-linejoin="round"`) + P(`M84 ${y - 4} L88 ${y + 3} L92 ${y - 3} L96 ${y + 5} L100 ${y - 3} L104 ${y + 5} L108 ${y - 3} L112 ${y + 3} L116 ${y - 4}Z`, "#fff") },
    { id: "ochobo", label: "\u304A\u3061\u3087\u307C", draw: (x, y) => `<ellipse cx="100" cy="${y + 1}" rx="3.4" ry="3" fill="${MOUTH_IN}" stroke="${LINE2}" stroke-width="1.6"/>` },
    { id: "nii", label: "\u306B\u30FC\u3063", draw: (x, y) => `<rect x="86" y="${y - 4}" width="28" height="11" rx="5.5" fill="#fff" stroke="${LINE2}" stroke-width="2.2"/>` + S(`M86 ${y + 1.5} L114 ${y + 1.5} M93 ${y - 4} L93 ${y + 7} M100 ${y - 4} L100 ${y + 7} M107 ${y - 4} L107 ${y + 7}`, LINE2, 1.2) },
    { id: "he", label: "\u3078", draw: (x, y) => T([90, y + 4, 100, y - 6, 110, y + 4], INK2, 3.4) },
    { id: "o", label: "\u304A\u3063", draw: (x, y) => `<ellipse cx="100" cy="${y + 2}" rx="5.6" ry="7" fill="${MOUTH_IN}" stroke="${LINE2}" stroke-width="2"/>` }
  ];
  var FACE2 = [
    { id: "blush", label: "\u307B\u3063\u307A", draw: (x, F) => `<ellipse cx="73" cy="${F + 11}" rx="10" ry="7" fill="url(#${x.id}bl)"/><ellipse cx="127" cy="${F + 11}" rx="10" ry="7" fill="url(#${x.id}bl)"/>` },
    { id: "kumadori", label: "\u304F\u307E\u3069\u308A", draw: (x, F) => both(T([90, F - 9, 78, F - 14, 66, F - 26], "#d6413a", 3.2) + T([76, F + 8, 70, F + 4, 62, F - 4], "#d6413a", 2.6)) },
    { id: "uzu", label: "\u3046\u305A\u307E\u304D", draw: (x, F) => both(S(spiral(72, F + 12).replace(/L/g, " L"), "#e2553f", 1.8)) },
    { id: "hitai", label: "\u3072\u305F\u3044\u306E\u5370", draw: (x, F) => P(`M100 ${F - 30} Q104 ${F - 25} 100 ${F - 20} Q96 ${F - 25} 100 ${F - 30}Z`, "#d6413a") },
    { id: "namida", label: "\u306A\u307F\u3060", draw: (x, F) => P(`M80 ${F + 9} Q76 ${F + 17} 80 ${F + 20} Q84 ${F + 17} 80 ${F + 9}Z`, "#8cc8f0", `stroke="${LINE2}" stroke-width="1.2"`) },
    { id: "ase", label: "\u3042\u305B", draw: (x, F) => P(`M134 ${F - 26} Q128 ${F - 16} 133 ${F - 12} Q138 ${F - 16} 134 ${F - 26}Z`, "#8cc8f0", `stroke="${LINE2}" stroke-width="1.2"`) },
    { id: "hige", label: "\u3072\u3052", draw: (x, F) => both(T([78, F + 14, 68, F + 11, 56, F + 10], INK2, 1.6) + T([78, F + 18, 68, F + 18, 56, F + 20], INK2, 1.6)) },
    { id: "sobakasu", label: "\u305D\u3070\u304B\u3059", draw: (x, F) => both([[72, F + 10], [76, F + 13], [80, F + 10]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.3" fill="${shade(x.a, 0.4)}"/>`).join("")) }
  ];
  var horn = (cx, base, h, a, b) => P(`M${cx - 10} ${base} C${cx - 9} ${base - h * 0.5} ${cx - 4} ${base - h * 0.85} ${cx + 2} ${base - h} C${cx + 4} ${base - h * 0.6} ${cx + 10} ${base - h * 0.3} ${cx + 10} ${base}Z`, a) + S(`M${cx - 8.6} ${base - h * 0.3} Q${cx} ${base - h * 0.24} ${cx + 9.4} ${base - h * 0.3} M${cx - 6.4} ${base - h * 0.56} Q${cx} ${base - h * 0.5} ${cx + 7} ${base - h * 0.56}`, b, 2.2);
  var HEADS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "tsuno1", label: "\u4E00\u672C\u89D2", auto: ["#f4ecd6", "#d9b98a"], back: (x, B) => horn(100, B.top + 14, 34, x.a, x.b) },
    { id: "tsuno2", label: "\u4E8C\u672C\u89D2", auto: ["#f4ecd6", "#d9b98a"], back: (x, B) => `<g transform="rotate(-20 76 ${B.top + 16})">${horn(76, B.top + 16, 30, x.a, x.b)}</g><g transform="rotate(20 124 ${B.top + 16})">${horn(124, B.top + 16, 30, x.a, x.b)}</g>` },
    { id: "kitsune", label: "\u304D\u3064\u306D\u8033", auto: ["body", "#f6e7d0"], back: (x, B) => both(P(`M60 ${B.top + 30} Q58 ${B.top - 8} 72 ${B.top - 20} Q86 ${B.top - 2} 90 ${B.top + 18}Z`, x.a) + P(`M66 ${B.top + 22} Q66 ${B.top - 2} 73 ${B.top - 10} Q81 ${B.top + 2} 83 ${B.top + 16}Z`, x.b)) },
    { id: "tanuki", label: "\u305F\u306C\u304D\u8033", auto: ["body", "#3a3438"], back: (x, B) => both(`<circle cx="70" cy="${B.top + 8}" r="13" fill="${x.a}"/><circle cx="70" cy="${B.top + 8}" r="6.5" fill="${x.b}"/>`) },
    { id: "neko", label: "\u306D\u3053\u8033", auto: ["body", "#f5b5c4"], back: (x, B) => both(P(`M62 ${B.top + 28} L66 ${B.top - 10} L94 ${B.top + 12}Z`, x.a, 'stroke-linejoin="round"') + P(`M68 ${B.top + 18} L70 ${B.top - 1} L84 ${B.top + 12}Z`, x.b)) },
    { id: "sara", label: "\u6CB3\u7AE5\u306E\u76BF", auto: ["#e9efe6", "#3f7a4a"], front: (x, B) => P(wave(100, B.top + 9, 36, 13, 180, 360, 9, 3.4, -1) + `L136 ${B.top + 9} Q100 ${B.top - 8} 64 ${B.top + 9}Z`, x.b) + `<ellipse cx="100" cy="${B.top + 4}" rx="24" ry="7.5" fill="${x.a}"/><ellipse cx="100" cy="${B.top + 3}" rx="16" ry="4" fill="#fff" opacity=".7"/>` },
    { id: "tenkan", label: "\u5929\u51A0", auto: ["#ffffff", "#e9e3ee"], front: (x, B) => P(`M86 ${B.F - 24} L100 ${B.F - 46} L114 ${B.F - 24}Z`, x.a, 'stroke-linejoin="round"') + S(`M91 ${B.F - 28} L109 ${B.F - 28}`, x.b, 1.6) },
    { id: "happa", label: "\u8449\u3063\u3071", auto: ["#5cae7a", "#3f7a4a"], front: (x, B) => `<g transform="rotate(24 104 ${B.top})">${P(`M104 ${B.top + 6} Q86 ${B.top - 8} 104 ${B.top - 28} Q122 ${B.top - 8} 104 ${B.top + 6}Z`, x.a)}${S(`M104 ${B.top + 4} L104 ${B.top - 22}`, x.b, 1.6)}</g>` },
    { id: "hono", label: "\u708E", auto: ["#f28a3b", "#f8d36a"], front: (x, B) => P(`M100 ${B.top - 34} C114 ${B.top - 18} 120 ${B.top - 6} 113 ${B.top + 6} C108 ${B.top + 13} 92 ${B.top + 13} 87 ${B.top + 6} C81 ${B.top - 6} 89 ${B.top - 15} 94 ${B.top - 21} C96 ${B.top - 12} 100 ${B.top - 13} 100 ${B.top - 34}Z`, x.a) + P(`M100 ${B.top - 14} C107 ${B.top - 6} 109 ${B.top + 1} 105 ${B.top + 6} C102 ${B.top + 9} 97 ${B.top + 9} 95 ${B.top + 6} C92 ${B.top + 1} 96 ${B.top - 4} 100 ${B.top - 14}Z`, x.b) },
    {
      id: "hachimaki",
      label: "\u306F\u3061\u307E\u304D",
      auto: ["#ffffff", "#e2553f"],
      clip: true,
      front: (x, B) => `<rect x="0" y="${B.F - 34}" width="200" height="10" fill="${x.a}"/><circle cx="100" cy="${B.F - 29}" r="4.2" fill="${x.b}"/>`,
      after: (x, B) => P(`M138 ${B.F - 32} Q150 ${B.F - 40} 158 ${B.F - 34} Q150 ${B.F - 30} 158 ${B.F - 22} Q148 ${B.F - 22} 138 ${B.F - 26}Z`, x.a)
    },
    { id: "ofuda", label: "\u304A\u672D", auto: ["#f6ecc8", "#d6413a"], front: (x, B) => `<g transform="rotate(-6 100 ${B.F - 30})"><rect x="91" y="${B.F - 50}" width="18" height="34" rx="1.5" fill="${x.a}"/>${S(`M95 ${B.F - 44} L105 ${B.F - 44} M100 ${B.F - 41} L100 ${B.F - 24} M96 ${B.F - 34} L104 ${B.F - 32}`, INK2, 1.4)}<circle cx="100" cy="${B.F - 22}" r="3" fill="${x.b}"/></g>` },
    { id: "kanzashi", label: "\u304B\u3093\u3056\u3057", auto: ["#e2553f", "#f2b33d"], front: (x, B) => `<g transform="rotate(-30 124 ${B.top + 16})">${S(`M112 ${B.top + 16} L140 ${B.top + 16}`, x.b, 2.4)}${[0, 72, 144, 216, 288].map((a) => `<circle cx="${112 + 6 * Math.cos(a * Math.PI / 180)}" cy="${B.top + 16 + 6 * Math.sin(a * Math.PI / 180)}" r="4.6" fill="${x.a}"/>`).join("")}<circle cx="112" cy="${B.top + 16}" r="3" fill="${x.b}"/></g>` }
  ];
  var ACCS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "yodare", label: "\u3088\u3060\u308C\u304B\u3051", auto: ["#d6413a", "#f2b33d"], band: (x, B) => P(`M74 ${B.F + 28} Q100 ${B.F + 36} 126 ${B.F + 28} Q128 ${B.F + 56} 100 ${B.F + 64} Q72 ${B.F + 56} 74 ${B.F + 28}Z`, x.a, `stroke="${LINE2}" stroke-width="2.2" stroke-linejoin="round"`) + `<circle cx="100" cy="${B.F + 48}" r="5" fill="none" stroke="${x.b}" stroke-width="2"/>` },
    {
      id: "suzu",
      label: "\u9234",
      auto: ["#d6413a", "#f2b33d"],
      band: (x, B) => `<rect x="0" y="${B.F + 28}" width="200" height="6" fill="${x.a}"/>`,
      over: (x, B) => `<circle cx="100" cy="${B.F + 40}" r="8" fill="${x.b}"/>` + S(`M94 ${B.F + 41} L106 ${B.F + 41} M100 ${B.F + 41} L100 ${B.F + 47}`, shade(x.b, 0.45), 1.8) + `<circle cx="97" cy="${B.F + 37}" r="2" fill="#fff" opacity=".7"/>`
    },
    {
      id: "shimenawa",
      label: "\u3057\u3081\u7E04",
      auto: ["#d9c27a", "#ffffff"],
      band: (x, B) => `<rect x="0" y="${B.F + 26}" width="200" height="11" rx="5.5" fill="${x.a}"/>` + Array.from({ length: 14 }, (_, i) => S(`M${14 + i * 13} ${B.F + 26} Q${20 + i * 13} ${B.F + 31.5} ${16 + i * 13} ${B.F + 37}`, shade(x.a, 0.3), 1.6)).join(""),
      over: (x, B) => [84, 116].map((cx) => P(`M${cx - 5} ${B.F + 37} L${cx + 5} ${B.F + 37} L${cx + 1} ${B.F + 44} L${cx + 6} ${B.F + 44} L${cx + 1} ${B.F + 52} L${cx + 6} ${B.F + 52} L${cx - 2} ${B.F + 62} L${cx - 1} ${B.F + 54} L${cx - 6} ${B.F + 54} L${cx - 1} ${B.F + 46} L${cx - 6} ${B.F + 46}Z`, x.b, `stroke="${LINE2}" stroke-width="1.4" stroke-linejoin="round"`)).join("")
    },
    { id: "haramaki", label: "\u306F\u3089\u307E\u304D", auto: ["#5cae7a", "#3f7a4a"], band: (x, B) => `<rect x="0" y="${B.F + 40}" width="200" height="22" fill="${x.a}"/>` + [B.F + 46, B.F + 56].map((y) => S(`M0 ${y} L200 ${y}`, x.b, 2.4)).join("") },
    {
      id: "mafura",
      label: "\u307E\u3075\u3089",
      auto: ["#2a4a7a", "#f3f0e8"],
      band: (x, B) => `<rect x="0" y="${B.F + 24}" width="200" height="13" fill="${x.a}"/>` + Array.from({ length: 10 }, (_, i) => `<rect x="${i * 20}" y="${B.F + 24}" width="10" height="13" fill="${x.b}" opacity=".9"/>`).join(""),
      over: (x, B) => P(`M118 ${B.F + 32} L132 ${B.F + 32} L134 ${B.F + 60} L120 ${B.F + 60}Z`, x.a) + S(`M122 ${B.F + 60} L122 ${B.F + 64} M127 ${B.F + 60} L127 ${B.F + 64} M132 ${B.F + 60} L132 ${B.F + 64}`, x.a, 1.6)
    },
    { id: "kanabo", label: "\u91D1\u68D2", auto: ["#4a4550", "#f2b33d"], over: (x, B) => `<g transform="rotate(18 152 ${B.F + 30})"><rect x="146" y="${B.F - 10}" width="13" height="66" rx="6" fill="${x.a}"/>${[0, 1, 2, 3].map((i) => `<circle cx="146" cy="${B.F - 2 + i * 13}" r="2.6" fill="${x.b}"/><circle cx="159" cy="${B.F + 4 + i * 13}" r="2.6" fill="${x.b}"/>`).join("")}<rect x="148" y="${B.F + 54}" width="9" height="12" rx="2" fill="#a5683a"/></g>` },
    { id: "chochin", label: "\u3061\u3087\u3046\u3061\u3093", auto: ["#f6e7d0", "#d6413a"], over: (x, B) => `<g transform="translate(150 ${B.F + 12})">${S("M0 -26 L0 -14", INK2, 1.6)}<rect x="-8" y="-16" width="16" height="4" rx="1.5" fill="#3a3438"/><ellipse cx="0" cy="0" rx="12" ry="14" fill="${x.a}"/>${S("M-12 -5 Q0 -2 12 -5 M-12 5 Q0 8 12 5", shade(x.a, 0.25), 1.4)}<rect x="-8" y="12" width="16" height="4" rx="1.5" fill="#3a3438"/><circle cx="0" cy="0" r="3.4" fill="${x.b}"/></g>` },
    { id: "dango", label: "\u304A\u3060\u3093\u3054", auto: ["#f5b5c4", "#5cae7a"], over: (x, B) => `<g transform="rotate(-16 150 ${B.F + 20})">${S(`M150 ${B.F - 12} L150 ${B.F + 50}`, "#c9a46a", 2.6)}<circle cx="150" cy="${B.F - 4}" r="8" fill="${x.a}"/><circle cx="150" cy="${B.F + 11}" r="8" fill="#ffffff"/><circle cx="150" cy="${B.F + 26}" r="8" fill="${x.b}"/></g>` }
  ];
  var PARTS = { body: BODIES, pattern: PATTERNS, arms: ARMS2, eyes: EYES2, mouth: MOUTHS2, face: FACE2, head: HEADS, acc: ACCS };
  var CATEGORIES2 = [
    { key: "body", label: "\u304B\u305F\u3061", colors: [{ key: "bodyColor", label: "\u304B\u3089\u3060\u306E\u8272", palette: PALETTES2.body }] },
    { key: "pattern", label: "\u3082\u3088\u3046", colors: [{ key: "patternColor", label: "\u3082\u3088\u3046\u306E\u8272", palette: PALETTES2.body }] },
    { key: "arms", label: "\u3066" },
    { key: "eyes", label: "\u3081", colors: [{ key: "eyesColor", label: "\u3072\u3068\u307F\uFF08\u4E00\u3064\u76EE\u30FB\u4E09\u3064\u76EE\u30FB\u30AD\u30E9\u30AD\u30E9\u30FB\u3046\u308B\u3046\u308B\uFF09", palette: PALETTES2.eyes }] },
    { key: "mouth", label: "\u304F\u3061" },
    { key: "face", label: "\u3057\u308B\u3057", multi: true },
    { key: "head", label: "\u3042\u305F\u307E", colors: [{ key: "headColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES2.item }, { key: "headColor2", label: "\u30B5\u30D6", palette: PALETTES2.item }] },
    { key: "acc", label: "\u3082\u3061\u3082\u306E", colors: [{ key: "accColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES2.item }, { key: "accColor2", label: "\u30B5\u30D6", palette: PALETTES2.item }] },
    { key: "bg", label: "\u306F\u3044\u3051\u3044", colors: [{ key: "bgColor", label: "\u306F\u3044\u3051\u3044\u306E\u8272", palette: PALETTES2.bg }] }
  ];
  var GROUPS2 = [
    { label: "\u304B\u3089\u3060", cats: ["body", "pattern", "arms"] },
    { label: "\u304B\u304A", cats: ["eyes", "mouth", "face"] },
    { label: "\u3042\u305F\u307E", cats: ["head"] },
    { label: "\u3082\u3061\u3082\u306E", cats: ["acc"] },
    { label: "\u306F\u3044\u3051\u3044", cats: ["bg"] }
  ];
  var DEFAULTS2 = {
    body: "manju",
    bodyColor: "#e2553f",
    pattern: "onaka",
    patternColor: "#f6e7d0",
    arms: "nubs",
    eyes: "maru",
    eyesColor: "#f2b33d",
    mouth: "kiba",
    face: ["blush"],
    head: "tsuno2",
    headColor: "auto",
    headColor2: "auto",
    acc: "none",
    accColor: "auto",
    accColor2: "auto",
    bgColor: "#f6efe2"
  };
  var CHARACTERS = [
    { label: "\u3042\u304B\u304A\u306B", body: "manju", bodyColor: "#e2553f", pattern: "onaka", head: "tsuno2", mouth: "kiba", acc: "kanabo", bgColor: "#fff1c9" },
    { label: "\u3072\u3068\u3064\u3081", body: "obake", bodyColor: "#f3f0e8", pattern: "none", eyes: "hitotsume", eyesColor: "#3fa7b7", mouth: "bero", head: "tenkan", arms: "urameshi", bgColor: "#efe6f7" },
    { label: "\u304B\u3089\u304B\u3055", body: "kasa", bodyColor: "#9b88c9", pattern: "none", eyes: "hitotsume", eyesColor: "#f2b33d", mouth: "bero", head: "none", arms: "none", bgColor: "#e3efe2" },
    { label: "\u304B\u3063\u3071", body: "kodama", bodyColor: "#5cae7a", pattern: "onaka", patternColor: "#f2e3a8", eyes: "maru", mouth: "beak", head: "sara", arms: "wave", bgColor: "#dfe8f3" },
    { label: "\u3061\u3087\u3046\u3061\u3093", body: "chochin", bodyColor: "#f6e7d0", pattern: "none", eyes: "hitotsume", eyesColor: "#e2553f", mouth: "ooguchi", head: "none", arms: "nubs", bgColor: "#3a3f5c" },
    { label: "\u304D\u3064\u306D", body: "daruma", bodyColor: "#f3f0e8", pattern: "none", eyes: "kitsune", mouth: "omega", head: "kitsune", face: ["blush", "hitai"], acc: "suzu", bgColor: "#fde2e4" },
    { label: "\u305F\u306C\u304D", body: "manju", bodyColor: "#a5683a", pattern: "onaka", patternColor: "#f6e7d0", eyes: "maru", mouth: "omega", head: "happa", face: ["blush", "uzu"], acc: "haramaki", bgColor: "#e3efe2" },
    { label: "\u306C\u308A\u304B\u3079", body: "nurikabe", bodyColor: "#8e8a8e", pattern: "none", eyes: "jito", mouth: "he", head: "none", arms: "banzai", bgColor: "#f6efe2" },
    { label: "\u3072\u3068\u3060\u307E", body: "hitodama", bodyColor: "#3fa7b7", pattern: "none", eyes: "kirakira", eyesColor: "#f2b33d", mouth: "o", head: "none", arms: "none", face: ["blush"], bgColor: "#3a3f5c" },
    { label: "\u3060\u308B\u307E", body: "daruma", bodyColor: "#c93a4e", pattern: "mado", patternColor: "#f6e7d0", eyes: "maru", mouth: "nii", head: "hachimaki", arms: "none", face: ["blush", "hige"], bgColor: "#fff1c9" },
    { label: "\u306D\u3053\u307E\u305F", body: "kodama", bodyColor: "#3a3438", pattern: "none", eyes: "kirakira", eyesColor: "#f2b33d", mouth: "omega", head: "neko", face: ["blush", "hige"], acc: "suzu", bgColor: "#efe6f7" },
    { label: "\u3042\u304A\u304A\u306B", body: "manju", bodyColor: "#2a4a7a", pattern: "shima", patternColor: "#3fa7b7", eyes: "mitsume", eyesColor: "#f2b33d", mouth: "kiba2", head: "tsuno1", acc: "shimenawa", bgColor: "#dfe8f3" },
    { label: "\u3053\u3060\u307E", body: "kodama", bodyColor: "#f3f0e8", pattern: "none", eyes: "tenten", mouth: "ochobo", head: "none", arms: "banzai", face: [], bgColor: "#e3efe2" },
    { label: "\u304A\u3044\u306A\u308A", body: "obake", bodyColor: "#f2b33d", pattern: "seigaiha", patternColor: "#f6e7d0", eyes: "nikkori", mouth: "nikko", head: "kanzashi", acc: "dango", arms: "nubs", bgColor: "#fde2e4" },
    { label: "\u30AD\u30E7\u30F3\u30B7\u30FC", body: "nurikabe", bodyColor: "#9b88c9", pattern: "none", eyes: "batsu", mouth: "giza", head: "ofuda", arms: "urameshi", face: ["blush", "kumadori"], bgColor: "#efe6f7" },
    { label: "\u3084\u307E\u3076\u304D", body: "hitodama", bodyColor: "#f28a3b", pattern: "none", eyes: "uruuru", eyesColor: "#e2553f", mouth: "nikko", head: "hono", arms: "nubs", acc: "yodare", bgColor: "#fff1c9" }
  ];
  function randomYokai(r) {
    const { pick, chance } = r;
    const body = pick(BODIES.map((b) => b.id)), bodyColor = pick(PALETTES2.body);
    const light = luminance(bodyColor) > 0.7;
    return {
      body,
      bodyColor,
      pattern: pick(["none", "none", "onaka", "onaka", "mado", "shima", "mizutama", "uroko", "seigaiha", "hoshi"]),
      patternColor: light ? pick(["#e2553f", "#2a4a7a", "#5cae7a", "#9b88c9"]) : pick(["#f6e7d0", "#f3f0e8", "#f2b33d", "#f5b5c4"]),
      arms: pick(["nubs", "nubs", "nubs", "banzai", "wave", "urameshi", "none"]),
      eyes: pick(["maru", "maru", "maru", "hitotsume", "hitotsume", "mitsume", "kirakira", "nikkori", "jito", "kitsune", "guruguru", "tenten", "uruuru"]),
      eyesColor: pick(PALETTES2.eyes),
      mouth: pick(["nikko", "kiba", "kiba", "kiba2", "ooguchi", "bero", "omega", "beak", "giza", "ochobo", "nii", "o"]),
      face: ["blush", ...chance(0.15) ? ["kumadori"] : [], ...chance(0.1) ? ["hige"] : [], ...chance(0.08) ? ["hitai"] : []],
      head: ["hitodama", "kasa"].includes(body) ? pick(["none", "none", "hachimaki", "ofuda", "tenkan"]) : pick(["none", "tsuno1", "tsuno2", "tsuno2", "kitsune", "tanuki", "neko", "sara", "tenkan", "happa", "hono", "hachimaki", "ofuda", "kanzashi"]),
      headColor: "auto",
      headColor2: "auto",
      acc: chance(0.45) ? pick(["yodare", "suzu", "shimenawa", "haramaki", "mafura", "kanabo", "chochin", "dango"]) : "none",
      accColor: "auto",
      accColor2: "auto",
      bgColor: pick(PALETTES2.bg.slice(0, 6))
    };
  }
  function compose2(scene) {
    const { config: cfg } = scene;
    const B = scene.part("body");
    const body = scene.color("bodyColor");
    const slot = (cat) => ({ id: scene.id, p: scene.part(cat), ...scene.slots(cat) });
    const head = slot("head"), acc = slot("acc"), arms = scene.part("arms");
    const bodyUrl = scene.clip("b", B.d);
    scene.define(blushGradient(scene.uid("bl"), "#ff6f73", 0.55, 0.25));
    const bodyPaint = { a: body };
    scene.add(B.base === "float" ? `<ellipse cx="100" cy="188" rx="30" ry="4" fill="#1a1226" opacity=".1"/>` : `<ellipse cx="100" cy="182" rx="50" ry="6" fill="#1a1226" opacity=".12"/>`);
    if (head.p.back) scene.add(scene.outlined(head.p.back(head, B)));
    if (B.base === "feet") scene.add(scene.outlined(both(`<ellipse cx="80" cy="175" rx="13" ry="8" fill="${shade(body, 0.12)}"/>`)));
    if (B.base === "leg") scene.add(scene.outlined(`<rect x="95" y="132" width="10" height="38" rx="5" fill="#f1d7b8"/><rect x="82" y="168" width="36" height="7" rx="2.5" fill="#b07a4a"/><rect x="86" y="175" width="6" height="5" fill="#8a5a34"/><rect x="108" y="175" width="6" height="5" fill="#8a5a34"/>` + S("M100 168 L96 164 M100 168 L104 164", "#d6413a", 1.8)));
    if (!arms.front) scene.add(scene.outlined(arms.draw(bodyPaint, B)));
    scene.add(scene.silhouette(P(B.d, body)));
    scene.add(scene.clipped(bodyUrl, P(B.d, shade(body, 0.2)) + P(B.d, body, 'transform="translate(-6 -7)"') + scene.part("pattern").draw({ p: cfg.patternColor, a: body }, B) + (B.deco ? B.deco(bodyPaint) : "") + (acc.p.band ? acc.p.band(acc, B) : "") + (head.p.clip ? head.p.front(head, B) : "") + T(B.hl, "#fff", 4.4, 'opacity=".38"')));
    if (B.over) scene.add(scene.outlined(B.over(bodyPaint)));
    for (const mark of scene.selected("face")) scene.add(mark.draw({ id: scene.id, a: body }, B.F));
    scene.add(scene.part("eyes").draw({ a: cfg.eyesColor }, B.F));
    scene.add(scene.part("mouth").draw({}, B.F + 18));
    if (head.p.front && !head.p.clip) scene.add(scene.outlined(head.p.front(head, B)));
    if (head.p.after) scene.add(scene.outlined(head.p.after(head, B)));
    if (acc.p.over) scene.add(scene.outlined(acc.p.over(acc, B)));
    if (arms.front) scene.add(scene.outlined(arms.draw(bodyPaint, B)));
  }
  var Yokai = defineLibrary({
    key: "yokai",
    label: "\u5996\u602A",
    idPrefix: "yk",
    parts: PARTS,
    categories: CATEGORIES2,
    groups: GROUPS2,
    defaults: DEFAULTS2,
    presets: CHARACTERS,
    palettes: PALETTES2,
    colorNames: NAMES,
    outline: { color: LINE2, width: LINE_W2 },
    // "auto" colors: a part's recommended color; the token "body" means the body color.
    autoColor: (token, scene) => token === "body" ? scene.color("bodyColor") : token,
    compose: compose2,
    random: randomYokai
  });

  // src/styles/animals.js
  var INK3 = "#2b2233";
  var LINE3 = "#33263a";
  var LINE_W3 = 4.2;
  var FUR = { "#f2a65a": "\u8336\u30C8\u30E9", "#e9c79a": "\u67F4", "#d9b26a": "\u3053\u304C\u306D", "#a5683a": "\u8336", "#6e4a34": "\u3053\u3052\u8336", "#f3f0e8": "\u767D", "#c9c4bd": "\u3046\u3059\u7070", "#9a9aa4": "\u7070", "#3a3438": "\u9ED2", "#f5c6a0": "\u30D4\u30FC\u30C1", "#f5b5c4": "\u30D4\u30F3\u30AF", "#8fb3d9": "\u305D\u3089", "#b7a6e0": "\u30E9\u30D9\u30F3\u30C0\u30FC", "#9bcf9b": "\u30DF\u30F3\u30C8" };
  var SUB = { "#fbf3e6": "\u30AF\u30EA\u30FC\u30E0", "#ffffff": "\u767D", "#f6e1c3": "\u3046\u3059\u8336", "#f5c6a0": "\u30D4\u30FC\u30C1", "#f5b5c4": "\u30D4\u30F3\u30AF", "#e9d3b0": "\u30D9\u30FC\u30B8\u30E5", "#c9c4bd": "\u3046\u3059\u7070", "#3a3438": "\u9ED2" };
  var ITEM = { "#e2553f": "\u6731", "#f2b33d": "\u5C71\u5439", "#5cae7a": "\u82E5\u7AF9", "#3fa7b7": "\u6D45\u8471", "#2a4a7a": "\u85CD", "#9b88c9": "\u85E4", "#f5b5c4": "\u685C", "#ffffff": "\u767D", "#3a3438": "\u58A8", "#a5683a": "\u8336" };
  var EYEC2 = { "#3a2a24": "\u3053\u3052\u8336", "#2b2233": "\u9ED2", "#3fa7b7": "\u9752", "#5cae7a": "\u7DD1", "#f2b33d": "\u91D1", "#9b88c9": "\u7D2B" };
  var BG2 = { "#fff4e0": "\u305F\u307E\u3054", "#fde2e4": "\u3055\u304F\u3089", "#e3efe2": "\u308F\u304B\u3070", "#dfe8f3": "\u305D\u3089", "#efe6f7": "\u3075\u3058", "#f6efe2": "\u304D\u306A\u308A", "#3a3f5c": "\u3088\u308B" };
  var NAMES2 = { ...FUR, ...SUB, ...ITEM, ...EYEC2, ...BG2, auto: "\u304A\u307E\u304B\u305B" };
  var PALETTES3 = { fur: Object.keys(FUR), sub: Object.keys(SUB), item: ["auto", ...Object.keys(ITEM)], eyes: Object.keys(EYEC2), bg: Object.keys(BG2) };
  var EX2 = [81, 119];
  var EY = 100;
  var BODY2 = "M100 144 C76 144 60 150 50 160 C40 170 36 186 35 200 L165 200 C164 186 160 170 150 160 C140 150 124 144 100 144Z";
  var HEADS2 = [
    { id: "maru", label: "\u307E\u308B", top: 48, d: "M100 48 C134 48 154 72 154 102 C154 132 130 150 100 150 C70 150 46 132 46 102 C46 72 66 48 100 48Z" },
    { id: "yoko", label: "\u3088\u3053\u9577", top: 54, d: "M100 54 C142 54 164 78 164 106 C164 134 136 150 100 150 C64 150 36 134 36 106 C36 78 58 54 100 54Z" },
    { id: "tamago", label: "\u305F\u307E\u3054", top: 44, d: "M100 44 C130 44 148 72 148 104 C148 134 128 152 100 152 C72 152 52 134 52 104 C52 72 70 44 100 44Z" },
    { id: "mochi", label: "\u3082\u3061\u3082\u3061", top: 50, d: "M100 50 C132 50 150 72 150 96 C150 110 160 122 158 134 C154 150 126 154 100 154 C74 154 46 150 42 134 C40 122 50 110 50 96 C50 72 68 50 100 50Z" },
    { id: "togari", label: "\u307B\u3063\u307A\u3068\u304C\u308A", top: 50, d: "M100 50 C134 50 152 72 152 98 C152 114 158 124 162 134 C142 140 120 152 100 154 C80 152 58 140 38 134 C42 124 48 114 48 98 C48 72 66 50 100 50Z" }
  ];
  var EARS = [
    { id: "neko", label: "\u306D\u3053", draw: (x) => both(P("M52 82 L56 36 L92 58Z", x.a) + P("M60 70 L62 46 L82 60Z", x.b)) },
    { id: "inu", label: "\u305F\u308C\u8033", front: true, draw: (x) => both(P("M60 58 C40 56 30 86 36 116 C40 128 54 126 60 112 C66 96 70 72 60 58Z", x.a)) },
    { id: "pin", label: "\u7ACB\u3061\u8033", draw: (x) => both(P("M54 80 C50 52 56 34 66 26 C80 34 90 48 92 60Z", x.a) + P("M62 70 C60 54 64 42 68 38 C76 44 82 52 84 60Z", x.b)) },
    { id: "kuma", label: "\u307E\u308B\u8033", draw: (x) => both(C(64, 58, 15, x.a) + C(64, 58, 7.5, x.b)) },
    { id: "usagi", label: "\u3046\u3055\u304E", draw: (x) => both(P("M76 62 C66 30 68 2 80 0 C92 2 94 30 90 60Z", x.a) + P("M79 56 C73 32 74 12 80 9 C86 12 87 32 86 56Z", x.b)) },
    { id: "usagiTare", label: "\u30ED\u30C3\u30D7", front: true, draw: (x) => both(P("M66 58 C46 58 36 82 38 120 C40 136 56 136 60 122 C64 104 70 80 66 58Z", x.a) + P("M60 70 C50 74 46 92 48 118 C50 126 54 126 56 118 C58 100 62 84 60 70Z", x.b)) },
    { id: "kitsune", label: "\u3068\u304C\u308A\u8033", draw: (x) => both(P("M50 84 C48 50 56 28 66 18 C80 30 92 50 94 62Z", x.a) + P("M58 74 C58 50 62 38 66 32 C76 42 84 54 86 62Z", x.b) + P("M66 18 C70 22 72 26 72 30 L62 30 C63 26 64 22 66 18Z", shade(x.a, 0.45))) },
    { id: "nezumi", label: "\u304A\u304A\u307E\u308B\u8033", draw: (x) => both(C(56, 62, 22, x.a) + C(56, 62, 13, x.b)) },
    { id: "koala", label: "\u3075\u308F\u3075\u308F\u8033", draw: (x) => both(P(wave(54, 74, 22, 22, 0, 360, 10, 3) + "Z", x.a) + C(56, 76, 11, x.b)) },
    { id: "hitsuji", label: "\u3088\u3053\u8033", draw: (x) => both(`<ellipse cx="42" cy="96" rx="17" ry="8" transform="rotate(22 42 96)" fill="${x.a}"/><ellipse cx="44" cy="96" rx="10" ry="4" transform="rotate(22 44 96)" fill="${x.b}"/>`) },
    { id: "buta", label: "\u3076\u305F\u8033", draw: (x) => both(P("M58 72 L56 42 L86 56Z", x.a) + P("M62 64 L61 50 L76 58Z", x.b)) },
    { id: "none", label: "\u306A\u3057", draw: () => "" }
  ];
  var NOSE = (x, w = 6.6, h = 4.8, y = 111) => E(100, y, w, h, INK3) + E(98, y - 1.8, 2, 1.1, "#fff", 'opacity=".7"');
  var MUZZLES = [
    { id: "neko", label: "\u306D\u3053", draw: (x) => ({ pad: P("M100 112 C92 107 82 109 82 118 C82 127 94 127 100 122 C106 127 118 127 118 118 C118 109 108 107 100 112Z", x.b), nose: P("M95.5 108.5 L104.5 108.5 L100 114Z", "#f08a9b", `stroke="${LINE3}" stroke-width="1.4" stroke-linejoin="round"`) }) },
    { id: "inu", label: "\u3044\u306C", draw: (x) => ({ pad: E(100, 119, 22, 16, x.b), nose: NOSE(x, 8, 6, 110) }) },
    { id: "kuma", label: "\u304F\u307E", draw: (x) => ({ pad: E(100, 120, 19, 14, x.b), nose: NOSE(x, 6.6, 4.8, 113) }) },
    { id: "kitsune", label: "\u304D\u3064\u306D", draw: (x) => ({ pad: E(100, 121, 15, 12, x.b), nose: NOSE(x, 5.6, 4.2, 113) }) },
    { id: "buta", label: "\u3076\u305F", draw: (x) => ({ pad: E(100, 116, 15, 11, mix(x.a, "#f3a7b5", 0.55)), nose: E(95, 116, 2.4, 3.4, shade(mix(x.a, "#f3a7b5", 0.55), 0.45)) + E(105, 116, 2.4, 3.4, shade(mix(x.a, "#f3a7b5", 0.55), 0.45)) }) },
    { id: "usagi", label: "\u3046\u3055\u304E", draw: (x) => ({ pad: both(E(94, 118, 7, 6, x.b)), nose: P("M96 110 Q100 107 104 110 Q102 114 100 114.5 Q98 114 96 110Z", "#f08a9b") }) },
    { id: "koala", label: "\u30B3\u30A2\u30E9", draw: (x) => ({ pad: "", nose: P("M100 100 C110 100 113 110 112 116 C111 122 106 124 100 124 C94 124 89 122 88 116 C87 110 90 100 100 100Z", "#3a3438", `stroke="${LINE3}" stroke-width="1.6"`) + E(96, 106, 3, 2, "#fff", 'opacity=".5"') }) },
    { id: "nezumi", label: "\u306D\u305A\u307F", draw: (x) => ({ pad: "", nose: C(100, 112, 4.6, "#f08a9b", `stroke="${LINE3}" stroke-width="1.4"`) }) },
    { id: "tori", label: "\u304F\u3061\u3070\u3057", beak: true, draw: (x) => ({ pad: "", nose: P("M88 109 Q100 101 112 109 Q106 122 100 125 Q94 122 88 109Z", "#f2a93b", `stroke="${LINE3}" stroke-width="2" stroke-linejoin="round"`) + T([90, 110.5, 100, 113, 110, 110.5], shade("#f2a93b", 0.3), 1.2) }) },
    { id: "none", label: "\u306A\u3057", draw: () => ({ pad: "", nose: "" }) }
  ];
  var hi = (x, y, r) => C(x, y, r, "#fff");
  var EYES3 = [
    { id: "kuro", label: "\u3064\u3076\u3089", draw: (x) => EX2.map((e) => E(e, EY, 6.6, 7.4, INK3) + hi(e + 2.4, EY - 2.8, 2.4) + C(e - 2.2, EY + 3, 1.1, "#fff", 'fill-opacity=".8"')).join("") },
    { id: "kirakira", label: "\u30AD\u30E9\u30AD\u30E9", draw: (x) => EX2.map((e) => E(e, EY, 7.4, 8.4, x.a) + E(e, EY + 1, 4.2, 5, INK3) + hi(e + 2.6, EY - 3.4, 2.6) + C(e - 2.6, EY + 3.6, 1.3, "#fff") + T([e - 8, EY - 6, e, EY - 12.4, e + 8, EY - 6], INK3, 2.2)).join("") },
    { id: "small", label: "\u3061\u3044\u3055\u3081", draw: () => EX2.map((e) => E(e, EY + 1, 4, 4.6, INK3) + hi(e + 1.4, EY - 0.6, 1.4)).join("") },
    { id: "nikkori", label: "\u306B\u3063\u3053\u308A", draw: () => EX2.map((e) => T([e - 8, EY + 2, e, EY - 8, e + 8, EY + 2], INK3, 3.8)).join("") },
    { id: "tare", label: "\u305F\u308C\u76EE", draw: () => EX2.map((e) => {
      const d = e < 100 ? -1 : 1;
      return E(e, EY + 1, 6, 6.6, INK3) + hi(e + 2, EY - 1.6, 2) + T([e - 8 * d, EY - 5, e - 1 * d, EY - 9, e + 9 * d, EY - 3], INK3, 2.2);
    }).join("") },
    { id: "tsuri", label: "\u3064\u308A\u76EE", draw: () => EX2.map((e) => {
      const d = e < 100 ? -1 : 1;
      return P(`M${e - 7 * d} ${EY + 3} Q${e} ${EY - 7} ${e + 8 * d} ${EY - 5} Q${e + 2 * d} ${EY + 6} ${e - 7 * d} ${EY + 3}Z`, INK3) + hi(e + 1.5 * d, EY - 1.5, 1.6);
    }).join("") },
    { id: "jito", label: "\u30B8\u30C8\u76EE", draw: () => EX2.map((e) => P(`M${e - 7} ${EY - 1} Q${e} ${EY + 10} ${e + 7} ${EY - 1}Z`, INK3) + T([e - 9, EY - 1.4, e, EY - 3, e + 9, EY - 1.4], INK3, 2.4)).join("") },
    { id: "uruuru", label: "\u3046\u308B\u3046\u308B", draw: (x) => EX2.map((e) => E(e, EY, 7.4, 8.4, INK3) + E(e, EY + 4, 5.4, 3.4, x.a, 'opacity=".9"') + hi(e + 2.6, EY - 3.6, 2.8) + hi(e - 2.8, EY - 1, 1.6)).join("") },
    { id: "wink", label: "\u30A6\u30A4\u30F3\u30AF", draw: () => E(EX2[0], EY, 6.6, 7.4, INK3) + hi(EX2[0] + 2.4, EY - 2.8, 2.4) + T([EX2[1] - 8, EY + 2, EX2[1], EY - 8, EX2[1] + 8, EY + 2], INK3, 3.8) },
    { id: "guru", label: "\u3050\u308B\u3050\u308B", draw: () => EX2.map((e) => {
      let d = "";
      for (let i = 0; i <= 26; i++) {
        const a = i * 0.58, r = 0.3 + i * 0.24;
        d += (i ? " L" : "M") + (e + r * Math.cos(a)).toFixed(2) + " " + (EY + r * Math.sin(a)).toFixed(2);
      }
      return S(d, INK3, 2.2);
    }).join("") }
  ];
  var STEM = (y0 = 115) => S(`M100 ${y0} L100 ${y0 + 4.5}`, INK3, 2.2);
  var MOUTHS3 = [
    { id: "omega", label: "\u03C9", draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK3, 2.6) },
    { id: "nikko", label: "\u306B\u3053", draw: () => STEM() + T([90, 119.5, 100, 127.5, 110, 119.5], INK3, 3) },
    { id: "open", label: "\u3071\u304B\u3063", draw: () => STEM() + P("M90 119 Q100 136 110 119Z", "#6b2230", `stroke="${LINE3}" stroke-width="2" stroke-linejoin="round"`) + P("M94 127 Q100 123 106 127 Q100 131 94 127Z", "#f08a9b") },
    { id: "bero", label: "\u307A\u308D\u3063", draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK3, 2.6) + P("M100 122 L106 122 Q108 130 103 132 Q99 131 100 122Z", "#f08a9b", `stroke="${LINE3}" stroke-width="1.6" stroke-linejoin="round"`) },
    { id: "ha", label: "\u307E\u3048\u3070", draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK3, 2.6) + `<rect x="96" y="122" width="8" height="7" rx="1.4" fill="#fff" stroke="${LINE3}" stroke-width="1.6"/>` + S("M100 122 L100 129", LINE3, 1.2) },
    { id: "kiba", label: "\u304D\u3070", draw: () => STEM() + T([89, 119.5, 100, 127.5, 111, 119.5], INK3, 3) + P("M103 123 L109 122 L106.5 128Z", "#fff", `stroke="${LINE3}" stroke-width="1.3" stroke-linejoin="round"`) },
    { id: "mu", label: "\u3080\u3063", draw: () => STEM() + T([92, 121, 100, 122.5, 108, 121], INK3, 2.6) },
    { id: "o", label: "\u304A\u3063", draw: () => STEM(114) + E(100, 124, 4, 5, "#6b2230", `stroke="${LINE3}" stroke-width="1.8"`) }
  ];
  var MARKS = [
    { id: "blush", label: "\u307B\u3063\u307A", free: true, draw: (x) => E(70, 116, 11, 7, `url(#${x.id}bl)`) + E(130, 116, 11, 7, `url(#${x.id}bl)`) },
    { id: "panda", label: "\u30D1\u30F3\u30C0\u76EE", auto: "#3a3438", draw: (x) => both(`<path d="M81 88 C70 87 63 96 65 107 C67 116 78 117 86 110 C92 103 92 89 81 88Z" fill="${x.m}" transform="rotate(-12 80 102)"/>`) },
    { id: "tanuki", label: "\u305F\u306C\u304D\u76EE", auto: "#4a3428", draw: (x) => P("M56 92 C64 82 88 84 96 95 C98 100 102 100 104 95 C112 84 136 82 144 92 C148 105 136 115 122 113 C112 111 106 107 100 109 C94 107 88 111 78 113 C64 115 52 105 56 92Z", x.m) },
    { id: "kitsune", label: "\u767D\u3044\u53E3\u5143", auto: "#ffffff", draw: (x) => P("M40 110 C58 116 78 110 90 117 C96 121 104 121 110 117 C122 110 142 116 160 110 L164 170 L36 170Z", x.m) },
    { id: "kao", label: "\u9854\u307E\u3069", auto: "#ffffff", draw: (x) => P("M100 68 C88 56 60 60 58 88 C56 114 76 140 100 148 C124 140 144 114 142 88 C140 60 112 56 100 68Z", x.m) },
    { id: "tora", label: "\u3057\u307E", auto: "#5a3a26", draw: (x) => T([100, 52, 101, 62, 100, 74], x.m, 4.4) + both(T([86, 54, 88, 62, 90, 70], x.m, 3.4) + T([40, 112, 50, 110, 60, 113], x.m, 3.6) + T([42, 124, 50, 121, 58, 123], x.m, 3)) },
    { id: "bucchi", label: "\u3076\u3061", auto: "#6e4a34", draw: (x) => P(wave(122, 96, 18, 16, 0, 360, 9, 2.4) + "Z", x.m) },
    { id: "hitai", label: "\u304A\u3067\u3053", auto: "#ffffff", draw: (x) => P("M100 56 C108 66 108 78 100 86 C92 78 92 66 100 56Z", x.m) },
    { id: "mayu", label: "\u307E\u308D\u7709", auto: "#ffffff", draw: (x) => both(E(84, 84, 5.6, 3.8, x.m)) },
    { id: "hige", label: "\u3072\u3052", free: true, draw: () => both(T([74, 118, 60, 114, 46, 113], INK3, 1.5) + T([74, 123, 60, 124, 46, 127], INK3, 1.5)) }
  ];
  var FLUFFS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "mane", label: "\u305F\u3066\u304C\u307F", auto: "shade", back: (x) => P(wave(100, 104, 68, 62, 0, 360, 18, 8) + "Z", x.f) + P(wave(100, 104, 58, 54, 10, 370, 16, 5) + "Z", shade(x.f, 0.14)) },
    {
      id: "wool",
      label: "\u3082\u3053\u3082\u3053",
      auto: "#f6f1e7",
      back: (x) => P(wave(100, 100, 62, 58, 0, 360, 16, 7) + "Z", x.f),
      front: (x) => P(wave(100, 70, 44, 24, 180, 360, 8, 6) + wave(100, 70, 44, 12, 0, 180, 7, 4, 1, false) + "Z", x.f)
    },
    { id: "tuft", label: "\u3074\u3087\u3053\u6BDB", auto: "fur", front: (x, H) => P(`M100 ${H.top + 6} Q92 ${H.top - 6} 84 ${H.top - 8} Q92 ${H.top - 2} 96 ${H.top + 6} Z M100 ${H.top + 6} Q100 ${H.top - 10} 106 ${H.top - 16} Q104 ${H.top - 4} 104 ${H.top + 6}Z`, x.f) },
    { id: "cheek", label: "\u307B\u3063\u307A\u306E\u6BDB", auto: "fur", back: (x) => both(P("M54 104 L36 112 L52 118 L38 128 L56 128 L44 140 L64 134Z", x.f)) },
    { id: "crest", label: "\u3068\u3055\u304B", auto: "#e2553f", back: (x, H) => P(`M86 ${H.top + 10} Q82 ${H.top - 12} 92 ${H.top - 18} Q94 ${H.top - 8} 98 ${H.top - 6} Q98 ${H.top - 22} 108 ${H.top - 24} Q106 ${H.top - 10} 110 ${H.top - 6} Q116 ${H.top - 16} 122 ${H.top - 12} Q118 ${H.top} 116 ${H.top + 10}Z`, x.f) },
    { id: "bang", label: "\u307E\u3048\u304C\u307F", auto: "fur", front: (x, H) => P(`M74 ${H.top + 14} Q86 ${H.top - 4} 100 ${H.top - 2} Q116 ${H.top - 4} 126 ${H.top + 14} Q118 ${H.top + 12} 114 ${H.top + 20} Q110 ${H.top + 10} 104 ${H.top + 22} Q100 ${H.top + 10} 94 ${H.top + 22} Q90 ${H.top + 12} 86 ${H.top + 20} Q82 ${H.top + 12} 74 ${H.top + 14}Z`, x.f) }
  ];
  var CLOTHES = [
    { id: "none", label: "\u306A\u3057", draw: () => "" },
    { id: "tee", label: "T\u30B7\u30E3\u30C4", draw: (x) => P(BODY2, x.a) + S("M74 152 Q100 172 126 152", shade(x.a, 0.18), 4) },
    { id: "hoodie", label: "\u30D1\u30FC\u30AB\u30FC", draw: (x) => P(BODY2, x.a) + P("M58 162 C62 144 80 140 100 146 C120 140 138 144 142 162 C130 170 116 164 100 166 C84 164 70 170 58 162Z", shade(x.a, 0.15)) + S("M92 164 L90 188 M108 164 L110 188", x.b, 2.6) },
    { id: "sweater", label: "\u30BB\u30FC\u30BF\u30FC", draw: (x) => P(BODY2, x.a) + `<rect x="0" y="176" width="200" height="8" fill="${x.b}"/>` + S("M72 151 Q100 172 128 151", shade(x.a, 0.15), 6) },
    { id: "overall", label: "\u30AA\u30FC\u30D0\u30FC\u30AA\u30FC\u30EB", draw: (x) => P(BODY2, x.b) + P("M70 168 L130 168 L136 200 L64 200Z", x.a) + S("M74 170 L66 146 M126 170 L134 146", x.a, 5) + C(74, 172, 2.6, "#f2b33d") + C(126, 172, 2.6, "#f2b33d") + `<rect x="90" y="178" width="20" height="12" rx="2" fill="${shade(x.a, 0.12)}"/>` },
    { id: "suit", label: "\u30B9\u30FC\u30C4", draw: (x) => P(BODY2, x.a) + P("M84 148 L100 190 L116 148Z", "#fff") + P("M97 156 L103 156 L105 182 L100 188 L95 182Z", x.b) + both(P("M84 148 L100 190 L94 194 L78 164 L84 158 L76 152Z", shade(x.a, 0.2))) },
    { id: "kimono", label: "\u304D\u3082\u306E", draw: (x) => P(BODY2, x.a) + P("M84 146 L100 176 L116 146 L120 150 L100 186 L80 150Z", x.b) + S("M118 150 L88 200", shade(x.a, 0.2), 2.4) },
    { id: "apron", label: "\u30A8\u30D7\u30ED\u30F3", draw: (x) => P(BODY2, "#ffffff") + P("M72 164 L128 164 L134 200 L66 200Z", x.a) + S("M74 166 L66 146 M126 166 L134 146", x.a, 4) + `<rect x="90" y="176" width="20" height="12" rx="2" fill="${shade(x.a, 0.1)}"/>` },
    { id: "raincoat", label: "\u30EC\u30A4\u30F3\u30B3\u30FC\u30C8", draw: (x) => P(BODY2, x.a) + S("M100 154 L100 200", shade(x.a, 0.3), 2.4) + [164, 178, 192].map((y) => C(106, y, 2.4, x.b)).join("") + both(P("M80 150 L100 160 L90 170Z", shade(x.a, 0.12))) }
  ];
  var NECKS = [
    { id: "none", label: "\u306A\u3057", draw: () => "" },
    { id: "kubiwa", label: "\u304F\u3073\u308F", auto: ["#e2553f", "#f2b33d"], draw: (x) => P("M64 150 Q100 166 136 150 L136 158 Q100 174 64 158Z", x.a) + C(100, 172, 7, x.b) + S("M94 173 L106 173", shade(x.b, 0.45), 1.6) },
    { id: "bandana", label: "\u30D0\u30F3\u30C0\u30CA", auto: ["#e2553f", "#ffffff"], draw: (x) => P("M66 150 Q100 162 134 150 L100 190Z", x.a) + [[90, 160], [110, 160], [100, 174]].map(([a, b]) => C(a, b, 2, x.b)).join("") },
    { id: "scarf", label: "\u30DE\u30D5\u30E9\u30FC", auto: ["#2a4a7a", "#f3f0e8"], draw: (x) => P("M62 148 Q100 168 138 148 L138 160 Q100 180 62 160Z", x.a) + P("M112 160 L126 158 L130 192 L116 192Z", x.a) + S("M64 154 Q100 172 136 154", x.b, 2.4) },
    { id: "bowtie", label: "\u3061\u3087\u3046\u30CD\u30AF\u30BF\u30A4", auto: ["#e2553f", "#3a3438"], draw: (x) => P("M100 158 L86 150 L86 166Z M100 158 L114 150 L114 166Z", x.a) + C(100, 158, 3.6, shade(x.a, 0.2)) },
    { id: "ribbon", label: "\u30EA\u30DC\u30F3", auto: ["#f5b5c4", "#e2553f"], draw: (x) => P("M100 160 L84 150 L84 170Z M100 160 L116 150 L116 170Z", x.a) + S("M98 162 L92 182 M102 162 L108 182", x.a, 3) + C(100, 160, 4, x.b) },
    { id: "suzu", label: "\u3059\u305A", auto: ["#e2553f", "#f2b33d"], draw: (x) => S("M64 152 Q100 168 136 152", x.a, 4) + C(100, 168, 8, x.b) + S("M94 169 L106 169 M100 169 L100 175", shade(x.b, 0.45), 1.6) + C(97, 165, 2, "#fff", 'opacity=".7"') }
  ];
  var HATS2 = [
    { id: "none", label: "\u306A\u3057" },
    { id: "beret", label: "\u30D9\u30EC\u30FC\u5E3D", auto: ["#e2553f", "#3a3438"], draw: (x, H) => `<ellipse cx="96" cy="${H.top + 6}" rx="38" ry="13" transform="rotate(-10 96 ${H.top + 6})" fill="${x.a}"/><rect x="92" y="${H.top - 10}" width="6" height="8" rx="3" fill="${x.a}"/>` },
    { id: "cap", label: "\u30AD\u30E3\u30C3\u30D7", auto: ["#3fa7b7", "#ffffff"], draw: (x, H) => P(`M60 ${H.top + 30} C58 ${H.top - 2} 78 ${H.top - 14} 100 ${H.top - 14} C122 ${H.top - 14} 142 ${H.top - 2} 140 ${H.top + 30} C124 ${H.top + 24} 76 ${H.top + 24} 60 ${H.top + 30}Z`, x.a) + P(`M56 ${H.top + 30} C80 ${H.top + 20} 120 ${H.top + 20} 144 ${H.top + 30} C146 ${H.top + 37} 138 ${H.top + 40} 128 ${H.top + 37} C110 ${H.top + 33} 90 ${H.top + 33} 72 ${H.top + 37} C62 ${H.top + 40} 54 ${H.top + 37} 56 ${H.top + 30}Z`, x.b) + C(100, H.top - 13, 3.4, x.b) },
    { id: "crown", label: "\u304A\u3046\u304B\u3093", auto: ["#f2b33d", "#e2553f"], draw: (x, H) => P(`M76 ${H.top + 12} L72 ${H.top - 20} L88 ${H.top - 6} L100 ${H.top - 26} L112 ${H.top - 6} L128 ${H.top - 20} L124 ${H.top + 12}Z`, x.a) + C(100, H.top + 2, 4, x.b) + C(84, H.top + 4, 3, x.b) + C(116, H.top + 4, 3, x.b) },
    { id: "flower", label: "\u304A\u306F\u306A", auto: ["#f5b5c4", "#f2b33d"], draw: (x, H) => `<g transform="translate(126 ${H.top + 12})">${[0, 72, 144, 216, 288].map((a) => C(8 * Math.cos(a * Math.PI / 180), 8 * Math.sin(a * Math.PI / 180), 6.4, x.a)).join("")}${C(0, 0, 4.4, x.b)}</g>` },
    { id: "leaf", label: "\u306F\u3063\u3071", auto: ["#5cae7a", "#3f7a4a"], draw: (x, H) => `<g transform="rotate(20 104 ${H.top})">${P(`M104 ${H.top + 8} Q86 ${H.top - 6} 104 ${H.top - 26} Q122 ${H.top - 6} 104 ${H.top + 8}Z`, x.a)}${S(`M104 ${H.top + 6} L104 ${H.top - 20}`, x.b, 1.6)}</g>` },
    { id: "party", label: "\u30D1\u30FC\u30C6\u30A3\u30FC", auto: ["#9b88c9", "#f2b33d"], draw: (x, H) => `<g transform="rotate(12 104 ${H.top})">${P(`M88 ${H.top + 10} L104 ${H.top - 34} L120 ${H.top + 10}Z`, x.a)}${S(`M93 ${H.top - 2} L115 ${H.top - 2} M98 ${H.top - 16} L110 ${H.top - 16}`, x.b, 3)}${C(104, H.top - 36, 5, x.b)}</g>` },
    { id: "headphones", label: "\u30D8\u30C3\u30C9\u30DB\u30F3", auto: ["#3a3438", "#e2553f"], draw: (x, H) => S(`M50 108 C44 ${H.top - 8} 156 ${H.top - 8} 150 108`, x.a, 6) + `<rect x="38" y="94" width="16" height="30" rx="8" fill="${x.b}"/><rect x="146" y="94" width="16" height="30" rx="8" fill="${x.b}"/>` },
    { id: "straw", label: "\u3080\u304E\u308F\u3089", auto: ["#e9c97a", "#e2553f"], draw: (x, H) => P(`M70 ${H.top + 16} C70 ${H.top - 8} 84 ${H.top - 16} 100 ${H.top - 16} C116 ${H.top - 16} 130 ${H.top - 8} 130 ${H.top + 16}Z`, x.a) + `<rect x="70" y="${H.top + 6}" width="60" height="8" fill="${x.b}"/>` + E(100, H.top + 16, 52, 9, x.a) + S(`M56 ${H.top + 16} Q100 ${H.top + 24} 144 ${H.top + 16}`, shade(x.a, 0.2), 1.4) }
  ];
  var GLASSES2 = [
    { id: "none", label: "\u306A\u3057", draw: () => "" },
    { id: "round", label: "\u307E\u308B\u3081\u304C\u306D", draw: (x) => `<g fill="none" stroke="${x.a}" stroke-width="2.6">${C(81, 100, 12, "#fff", 'fill-opacity=".18"')}${C(119, 100, 12, "#fff", 'fill-opacity=".18"')}<path d="M93 99 Q100 95 107 99"/></g>` },
    { id: "square", label: "\u3057\u304B\u304F", draw: (x) => `<g fill="none" stroke="${x.a}" stroke-width="2.6"><rect x="67" y="90" width="28" height="20" rx="6" fill="#fff" fill-opacity=".18"/><rect x="105" y="90" width="28" height="20" rx="6" fill="#fff" fill-opacity=".18"/><path d="M95 98 L105 98"/></g>` },
    { id: "sun", label: "\u30B5\u30F3\u30B0\u30E9\u30B9", draw: (x) => `<g stroke="${x.a}" stroke-width="2.4"><rect x="66" y="91" width="29" height="18" rx="8" fill="#2b2233"/><rect x="105" y="91" width="29" height="18" rx="8" fill="#2b2233"/><path d="M95 98 L105 98" fill="none"/></g>` + both(S("M71 95 L78 95", "#fff", 2, 'opacity=".5"')) },
    { id: "heart", label: "\u30CF\u30FC\u30C8", draw: (x) => both(`<path d="M81 112 C70 104 66 98 68 93 C70 88 77 88 81 93 C85 88 92 88 94 93 C96 98 92 104 81 112Z" fill="#e2553f" fill-opacity=".85" stroke="${x.a}" stroke-width="2.2" stroke-linejoin="round"/>`) + S("M94 96 L106 96", x.a, 2.2) }
  ];
  var PARTS2 = { head: HEADS2, ears: EARS, muzzle: MUZZLES, eyes: EYES3, mouth: MOUTHS3, marks: MARKS, fluff: FLUFFS, clothes: CLOTHES, neck: NECKS, hat: HATS2, glasses: GLASSES2 };
  var CATEGORIES3 = [
    { key: "head", label: "\u304B\u304A\u5F62", colors: [{ key: "furColor", label: "\u3051\u306E\u8272", palette: PALETTES3.fur }, { key: "furColor2", label: "\u304A\u306A\u304B\u30FB\u53E3\u5143\u306E\u8272", palette: PALETTES3.sub }] },
    { key: "eyes", label: "\u3081", colors: [{ key: "eyesColor", label: "\u3072\u3068\u307F\uFF08\u30AD\u30E9\u30AD\u30E9\u30FB\u3046\u308B\u3046\u308B\uFF09", palette: PALETTES3.eyes }] },
    { key: "muzzle", label: "\u306F\u306A" },
    { key: "mouth", label: "\u304F\u3061" },
    { key: "marks", label: "\u3082\u3088\u3046", multi: true, colors: [{ key: "markColor", label: "\u3082\u3088\u3046\u306E\u8272", palette: ["auto", ...PALETTES3.fur] }] },
    { key: "ears", label: "\u307F\u307F", colors: [{ key: "earColor", label: "\u307F\u307F\u306E\u5916", palette: ["auto", ...PALETTES3.fur] }, { key: "earColor2", label: "\u307F\u307F\u306E\u5185", palette: ["auto", ...PALETTES3.sub] }] },
    { key: "fluff", label: "\u3051\u304C\u308F", colors: [{ key: "fluffColor", label: "\u3051\u304C\u308F\u306E\u8272", palette: ["auto", ...PALETTES3.fur] }] },
    { key: "clothes", label: "\u3075\u304F", colors: [{ key: "clothesColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES3.item.slice(1) }, { key: "clothesColor2", label: "\u30B5\u30D6", palette: PALETTES3.item.slice(1) }] },
    { key: "neck", label: "\u304F\u3073\u3082\u3068", colors: [{ key: "neckColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES3.item }, { key: "neckColor2", label: "\u30B5\u30D6", palette: PALETTES3.item }] },
    { key: "hat", label: "\u307C\u3046\u3057", colors: [{ key: "hatColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES3.item }, { key: "hatColor2", label: "\u30B5\u30D6", palette: PALETTES3.item }] },
    { key: "glasses", label: "\u3081\u304C\u306D", colors: [{ key: "glassesColor", label: "\u30D5\u30EC\u30FC\u30E0", palette: ["#2b2233", "#a5683a", "#f2b33d", "#e2553f", "#3fa7b7", "#ffffff"] }] },
    { key: "bg", label: "\u306F\u3044\u3051\u3044", colors: [{ key: "bgColor", label: "\u306F\u3044\u3051\u3044\u306E\u8272", palette: PALETTES3.bg }] }
  ];
  var GROUPS3 = [
    { label: "\u304B\u304A", cats: ["head", "eyes", "muzzle", "mouth", "marks"] },
    { label: "\u307F\u307F\u30FB\u3051", cats: ["ears", "fluff"] },
    { label: "\u3075\u304F", cats: ["clothes", "neck"] },
    { label: "\u3053\u3082\u306E", cats: ["hat", "glasses"] },
    { label: "\u306F\u3044\u3051\u3044", cats: ["bg"] }
  ];
  var DEFAULTS3 = {
    head: "maru",
    furColor: "#f2a65a",
    furColor2: "#fbf3e6",
    ears: "neko",
    earColor: "auto",
    earColor2: "auto",
    muzzle: "neko",
    eyes: "kuro",
    eyesColor: "#3a2a24",
    mouth: "omega",
    marks: ["blush"],
    markColor: "auto",
    fluff: "none",
    fluffColor: "auto",
    clothes: "none",
    clothesColor: "#3fa7b7",
    clothesColor2: "#ffffff",
    neck: "none",
    neckColor: "auto",
    neckColor2: "auto",
    hat: "none",
    hatColor: "auto",
    hatColor2: "auto",
    glasses: "none",
    glassesColor: "#2b2233",
    bgColor: "#fff4e0"
  };
  var CHARACTERS2 = [
    { label: "\u306D\u3053", head: "yoko", furColor: "#f2a65a", furColor2: "#fbf3e6", ears: "neko", muzzle: "neko", mouth: "omega", marks: ["blush", "tora", "hige"], markColor: "#c9743a" },
    { label: "\u3057\u3070\u3044\u306C", head: "mochi", furColor: "#e9c79a", furColor2: "#ffffff", ears: "pin", muzzle: "inu", mouth: "nikko", marks: ["blush", "kitsune", "mayu"], neck: "bandana", bgColor: "#e3efe2" },
    { label: "\u304F\u307E", head: "maru", furColor: "#a5683a", furColor2: "#f6e1c3", ears: "kuma", muzzle: "kuma", mouth: "omega", eyes: "kuro", clothes: "overall", clothesColor: "#2a4a7a", clothesColor2: "#e2553f", bgColor: "#fff4e0" },
    { label: "\u3046\u3055\u304E", head: "tamago", furColor: "#f3f0e8", furColor2: "#ffffff", ears: "usagi", muzzle: "usagi", mouth: "ha", eyes: "kirakira", eyesColor: "#e2553f", neck: "ribbon", bgColor: "#fde2e4" },
    { label: "\u30D1\u30F3\u30C0", head: "maru", furColor: "#f3f0e8", furColor2: "#ffffff", ears: "kuma", earColor: "#3a3438", earColor2: "#3a3438", muzzle: "kuma", mouth: "omega", marks: ["blush", "panda"], hat: "leaf", bgColor: "#e3efe2" },
    { label: "\u304D\u3064\u306D", head: "togari", furColor: "#f2a65a", furColor2: "#ffffff", ears: "kitsune", muzzle: "kitsune", mouth: "nikko", eyes: "tsuri", marks: ["blush", "kitsune"], fluff: "cheek", bgColor: "#efe6f7" },
    { label: "\u305F\u306C\u304D", head: "mochi", furColor: "#a5683a", furColor2: "#f6e1c3", ears: "kuma", muzzle: "kuma", mouth: "omega", marks: ["blush", "tanuki"], hat: "leaf", bgColor: "#e3efe2" },
    { label: "\u30CF\u30E0\u30B9\u30BF\u30FC", head: "mochi", furColor: "#f5c6a0", furColor2: "#ffffff", ears: "kuma", muzzle: "nezumi", mouth: "ha", eyes: "kuro", marks: ["blush", "kitsune"], bgColor: "#fff4e0" },
    { label: "\u30E9\u30A4\u30AA\u30F3", head: "maru", furColor: "#e9c79a", furColor2: "#fbf3e6", ears: "kuma", muzzle: "kuma", mouth: "kiba", eyes: "tsuri", fluff: "mane", fluffColor: "#b8642e", hat: "crown", bgColor: "#fff4e0" },
    { label: "\u3072\u3064\u3058", head: "tamago", furColor: "#f5c6a0", furColor2: "#fbf3e6", ears: "hitsuji", muzzle: "none", mouth: "nikko", eyes: "nikkori", fluff: "wool", bgColor: "#dfe8f3" },
    { label: "\u3076\u305F", head: "yoko", furColor: "#f5b5c4", furColor2: "#fbf3e6", ears: "buta", muzzle: "buta", mouth: "nikko", eyes: "small", clothes: "apron", clothesColor: "#3fa7b7", bgColor: "#fde2e4" },
    { label: "\u3068\u3089", head: "yoko", furColor: "#f2b33d", furColor2: "#ffffff", ears: "kuma", muzzle: "neko", mouth: "kiba", eyes: "tsuri", marks: ["blush", "tora", "kitsune", "hige"], bgColor: "#e3efe2" },
    { label: "\u30B3\u30A2\u30E9", head: "yoko", furColor: "#9a9aa4", furColor2: "#f3f0e8", ears: "koala", earColor2: "#f3f0e8", muzzle: "koala", mouth: "mu", eyes: "jito", marks: ["blush"], glasses: "none", bgColor: "#dfe8f3", extra: "koala" },
    { label: "\u30DA\u30F3\u30AE\u30F3", head: "tamago", furColor: "#3a3438", furColor2: "#ffffff", ears: "none", muzzle: "tori", eyes: "kuro", marks: ["blush", "kao"], neck: "scarf", bgColor: "#dfe8f3" },
    { label: "\u306D\u305A\u307F", head: "maru", furColor: "#c9c4bd", furColor2: "#ffffff", ears: "nezumi", muzzle: "nezumi", mouth: "ha", eyes: "kirakira", eyesColor: "#3fa7b7", marks: ["blush", "hige"], bgColor: "#efe6f7" },
    { label: "\u3072\u3088\u3053", head: "tamago", furColor: "#f2d24a", furColor2: "#fff4c2", ears: "none", muzzle: "tori", eyes: "kuro", fluff: "tuft", marks: ["blush"], bgColor: "#e3efe2" },
    { label: "\u3044\u306C", head: "maru", furColor: "#f3f0e8", furColor2: "#ffffff", ears: "inu", earColor: "#a5683a", muzzle: "inu", mouth: "bero", marks: ["blush", "bucchi"], neck: "kubiwa", bgColor: "#fff4e0" },
    { label: "\u30ED\u30C3\u30D7\u3046\u3055\u304E", head: "maru", furColor: "#e9c79a", furColor2: "#fbf3e6", ears: "usagiTare", muzzle: "usagi", mouth: "omega", eyes: "uruuru", eyesColor: "#a5683a", hat: "flower", bgColor: "#fde2e4" }
  ].map(({ extra, ...c }) => c);
  function randomAnimal(r) {
    const { pick, chance } = r;
    const base = { ...r.pick(CHARACTERS2) };
    delete base.label;
    if (r.chance(0.35)) base.furColor = r.pick(PALETTES3.fur);
    base.eyes = r.chance(0.5) ? base.eyes || "kuro" : r.pick(EYES3.map((e) => e.id));
    base.mouth = r.chance(0.5) ? base.mouth || "omega" : r.pick(MOUTHS3.map((m) => m.id));
    base.clothes = r.chance(0.45) ? r.pick(CLOTHES.map((c) => c.id).slice(1)) : base.clothes || "none";
    base.clothesColor = r.pick(Object.keys(ITEM));
    base.clothesColor2 = r.pick(Object.keys(ITEM));
    if (!base.neck && r.chance(0.3)) base.neck = r.pick(NECKS.map((n) => n.id).slice(1));
    if (!base.hat && r.chance(0.25)) base.hat = r.pick(HATS2.map((h) => h.id).slice(1));
    if (r.chance(0.12)) base.glasses = r.pick(GLASSES2.map((g) => g.id).slice(1));
    base.bgColor = r.pick(PALETTES3.bg.slice(0, 6));
    return base;
  }
  function compose3(scene) {
    const { config: cfg } = scene;
    const H = scene.part("head");
    const fur = scene.color("furColor"), fur2 = scene.color("furColor2");
    const slot = (cat) => ({ id: scene.id, p: scene.part(cat), ...scene.slots(cat) });
    const headUrl = scene.clip("h", H.d), bodyUrl = scene.clip("b", BODY2);
    scene.define(blushGradient(scene.uid("bl")));
    const ears = scene.part("ears");
    const earPaint = { a: scene.color("earColor", "fur"), b: scene.color("earColor2", mix(fur2, "#f5a0b0", 0.45)) };
    const fluff = scene.part("fluff"), fluffPaint = { f: scene.color("fluffColor", fluff.auto) };
    const muzzlePart = scene.part("muzzle"), muzzle = muzzlePart.draw({ a: fur, b: fur2 });
    const marks = scene.selected("marks");
    if (fluff.back) scene.add(scene.outlined(fluff.back(fluffPaint, H)));
    if (!ears.front) scene.add(scene.outlined(ears.draw(earPaint)));
    const neck = slot("neck");
    scene.add(scene.silhouette(P(BODY2, fur)));
    scene.add(scene.clipped(bodyUrl, P(BODY2, shade(fur, 0.16)) + P(BODY2, fur, 'transform="translate(-5 -5)"') + E(100, 196, 32, 28, fur2) + scene.part("clothes").draw({ a: cfg.clothesColor, b: cfg.clothesColor2 })));
    if (neck.p.draw) scene.add(scene.outlined(neck.p.draw(neck)));
    scene.add(scene.silhouette(P(H.d, fur)));
    scene.add(scene.clipped(headUrl, P(H.d, shade(fur, 0.16)) + P(H.d, fur, 'transform="translate(-5 -6)"') + marks.filter((m) => !m.free).map((m) => m.draw({ id: scene.id, m: scene.color("markColor", m.auto) })).join("") + T([60, 92, 62, 68, 80, H.top + 10], "#fff", 4, 'opacity=".32"')));
    if (fluff.front) scene.add(scene.outlined(fluff.front(fluffPaint, H)));
    scene.add(scene.outlined(muzzle.pad));
    scene.add(marks.filter((m) => m.free).map((m) => m.draw({ id: scene.id })).join(""));
    scene.add(scene.part("eyes").draw({ a: cfg.eyesColor }));
    if (!muzzlePart.beak) scene.add(scene.part("mouth").draw());
    scene.add(muzzle.nose);
    if (ears.front) scene.add(scene.outlined(ears.draw(earPaint)));
    scene.add(scene.part("glasses").draw({ a: cfg.glassesColor }));
    const hat = slot("hat");
    if (hat.p.draw) scene.add(scene.outlined(hat.p.draw(hat, H)));
  }
  var Animals = defineLibrary({
    key: "animals",
    label: "\u3069\u3046\u3076\u3064",
    idPrefix: "an",
    parts: PARTS2,
    categories: CATEGORIES3,
    groups: GROUPS3,
    defaults: DEFAULTS3,
    presets: CHARACTERS2,
    palettes: PALETTES3,
    colorNames: NAMES2,
    outline: { color: LINE3, width: LINE_W3 },
    autoColor: (token, scene) => {
      const fur = scene.color("furColor");
      return token === "fur" ? fur : token === "shade" ? shade(fur, 0.3) : token;
    },
    compose: compose3,
    random: randomAnimal
  });

  // src/styles/game.js
  var INK4 = "#2b2233";
  var LINE4 = "#2f2236";
  var LINE_W4 = 3.6;
  var SKIN = { "#fde4d3": "Porcelain", "#f6d0b4": "Light", "#eab890": "Warm", "#d29a6e": "Tan", "#a8714a": "Brown", "#6e4630": "Deep", "#c9e4d0": "Spirit", "#b9b4dc": "Shade" };
  var HAIR2 = { "#2b2429": "Black", "#5a3a2a": "Brown", "#a8693c": "Chestnut", "#f0cf6a": "Blonde", "#e8e4ee": "Silver", "#d9473a": "Crimson", "#3f6fd1": "Azure", "#4fa36f": "Jade", "#f08fb5": "Sakura", "#8a63d2": "Violet", "#ffffff": "White" };
  var EYE = { "#3f6fd1": "Azure", "#4fa36f": "Jade", "#d9473a": "Crimson", "#e8b84a": "Gold", "#8a63d2": "Violet", "#7a4a2e": "Amber", "#2ab3c9": "Cyan" };
  var GEAR = { "#b8c0cc": "Steel", "#e8b84a": "Gold", "#d9473a": "Crimson", "#3f6fd1": "Azure", "#2a3f7a": "Navy", "#4fa36f": "Jade", "#8a63d2": "Violet", "#3a3438": "Ink", "#f3f0e8": "Ivory", "#8a5a3a": "Leather", "#5f6f3a": "Moss" };
  var BG3 = { "#eef3fb": "Sky", "#f6efe2": "Parchment", "#e7f3e8": "Meadow", "#f3e8f6": "Twilight", "#fdeee0": "Sunset", "#2e3350": "Dungeon", "#1f2a2e": "Night" };
  var NAMES3 = { ...SKIN, ...HAIR2, ...EYE, ...GEAR, ...BG3, auto: "\u304A\u307E\u304B\u305B" };
  var PALETTES4 = { skin: Object.keys(SKIN), hair: Object.keys(HAIR2), eyes: Object.keys(EYE), gear: ["auto", ...Object.keys(GEAR)], bg: Object.keys(BG3) };
  var FACE3 = "M100 46 C130 46 148 66 148 94 C148 120 130 140 100 142 C70 140 52 120 52 94 C52 66 70 46 100 46Z";
  var TORSO = "M100 142 C86 142 75 146 70 154 C66 162 64 178 64 200 L136 200 C136 178 134 162 130 154 C125 146 114 142 100 142Z";
  var ARM = "M71 152 C60 152 52 158 48 168 C44 178 43 190 43 200 L67 200 C66 188 66 176 68 166 C69 160 70 156 71 152Z";
  var SHOULDER = { L: [62, 162], R: [138, 162] };
  var NECK2 = "M91 128 L91 148 Q100 154 109 148 L109 128Z";
  var EX3 = [81, 119];
  var EY2 = 102;
  var HEAD_BACK = "M52 96 C46 60 68 36 100 36 C132 36 154 60 148 96Z";
  var LONG_FRONT = "M50 104 C46 64 68 40 100 40 C132 40 154 64 150 104 C148 94 146 86 142 80 Q137 88 131 92 Q127 82 121 76 Q113 86 105 90 Q101 80 97 74 Q89 86 79 90 Q75 82 71 78 Q63 86 58 92 C54 96 52 100 50 104Z";
  var SPIKY_FRONT = "M50 100 C44 70 56 44 78 36 Q74 26 70 18 Q84 22 92 30 Q96 18 104 8 Q108 20 110 30 Q120 22 133 18 Q129 30 124 38 Q136 42 144 52 Q149 64 150 100 C147 92 143 85 139 80 Q135 88 132 96 Q128 84 123 76 Q119 86 115 94 Q111 82 107 72 Q103 84 99 92 Q95 82 91 72 Q87 84 83 92 Q79 84 75 76 Q71 86 67 96 Q65 88 61 82 C56 88 52 94 50 100Z";
  var SPIKY_STRANDS = [[78, 46, 82, 62, 80, 80], [100, 26, 102, 50, 99, 82], [122, 44, 120, 62, 120, 80]];
  var LONG_STRANDS = [[86, 48, 80, 64, 74, 84], [100, 44, 101, 62, 100, 80], [114, 48, 120, 64, 126, 84]];
  var HAIRS = [
    { id: "hero", label: "\u30C4\u30F3\u30C4\u30F3", back: HEAD_BACK + " M60 96 L140 96 L140 120 L60 120Z", front: SPIKY_FRONT, strands: SPIKY_STRANDS },
    {
      id: "neat",
      label: "\u3055\u3063\u3071\u308A",
      back: "M52 96 C46 62 68 38 100 38 C132 38 154 62 148 96 L144 112 L56 112Z",
      front: "M50 104 C46 66 66 40 100 40 C134 40 154 64 150 104 C148 94 146 86 142 80 C130 76 116 72 106 62 C100 70 86 78 70 80 C62 82 56 86 54 92 C52 96 51 100 50 104Z"
    },
    {
      id: "long",
      label: "\u30ED\u30F3\u30B0",
      back: "M48 96 C44 56 70 36 100 36 C130 36 156 56 152 96 C154 130 158 160 162 186 L38 186 C42 160 46 130 48 96Z",
      front: LONG_FRONT,
      strands: LONG_STRANDS,
      locks: "M50 100 C48 118 50 138 54 158 L64 158 C60 138 58 118 58 98Z M150 100 C152 118 150 138 146 158 L136 158 C140 138 142 118 142 98Z"
    },
    {
      id: "bob",
      label: "\u30DC\u30D6",
      back: "M48 96 C44 58 70 38 100 38 C130 38 156 58 152 96 L154 132 C154 140 144 142 136 140 L64 140 C56 142 46 140 46 132Z",
      front: "M50 106 C46 66 68 40 100 40 C132 40 154 66 150 106 C149 98 148 90 146 84 Q138 90 130 84 Q122 90 114 84 Q106 90 100 84 Q94 90 86 84 Q78 90 70 84 Q62 90 54 84 C52 90 51 98 50 106Z"
    },
    { id: "twin", label: "\u30C4\u30A4\u30F3\u30C6\u30FC\u30EB", back: HEAD_BACK + " M56 66 C30 70 20 118 28 172 C38 150 46 120 58 98Z M144 66 C170 70 180 118 172 172 C162 150 154 120 142 98Z", front: LONG_FRONT, strands: LONG_STRANDS, ties: [[56, 68], [144, 68]] },
    { id: "pony", label: "\u30DD\u30CB\u30FC\u30C6\u30FC\u30EB", back: HEAD_BACK + " M130 48 C164 44 174 90 166 130 C162 150 154 164 146 172 C150 146 150 118 142 96Z", front: LONG_FRONT, strands: LONG_STRANDS, ties: [[134, 50]] },
    { id: "bun", label: "\u304A\u3060\u3093\u3054", back: HEAD_BACK + " M100 18 a16 16 0 1 0 0.1 0Z", front: LONG_FRONT, strands: LONG_STRANDS, ties: [[100, 36]] },
    { id: "wild", label: "\u30EF\u30A4\u30EB\u30C9", back: "M100 28 Q118 20 132 28 Q148 28 154 44 Q166 54 162 72 Q172 90 164 104 Q172 122 160 136 Q162 152 148 158 L52 158 Q38 152 40 136 Q28 122 36 104 Q28 90 38 72 Q34 54 46 44 Q52 28 68 28 Q82 20 100 28Z", front: SPIKY_FRONT, strands: SPIKY_STRANDS },
    { id: "bald", label: "\u30B9\u30AD\u30F3\u30D8\u30C3\u30C9", shine: true }
  ];
  var brow = (pts, br, t = 3) => both(T(pts, br, t));
  var animeEye = (e, x, { lid = 0, slant = 0, lash = 3.4 } = {}) => {
    const a = x.a;
    const d = e < 100 ? -1 : 1;
    return E(e, EY2, 8, 10, "#fff") + E(e, EY2 + 1, 6.4, 8.2, a) + P(`M${e - 6.4} ${EY2 + 1} A6.4 8.2 0 0 1 ${e + 6.4} ${EY2 + 1} Q${e} ${EY2 - 2} ${e - 6.4} ${EY2 + 1}Z`, shade(a, 0.35)) + E(e, EY2 + 5, 4.6, 3.6, lighten(a, 0.35)) + E(e, EY2 + 1, 3, 4.2, INK4) + C(e + 2.6, EY2 - 3.4, 2.5, "#fff") + C(e - 2.4, EY2 + 4.4, 1.2, "#fff") + (lid ? P(`M${e - 9} ${EY2 - 11} L${e + 9} ${EY2 - 11} L${e + 9} ${EY2 - 11 + lid} Q${e} ${EY2 - 13 + lid} ${e - 9} ${EY2 - 11 + lid}Z`, x.skin) : "") + T([e - 10 * d, EY2 - 6 - slant * d, e, EY2 - 13 + lid, e + 10 * d, EY2 - 7 + slant * d], INK4, lash) + T([e + 7 * d, EY2 - 9 + slant * d, e + 11 * d, EY2 - 11 + slant * d, e + 12.5 * d, EY2 - 13 + slant * d], INK4, 1.6) + T([e - 5, EY2 + 10.4, e, EY2 + 11.4, e + 5, EY2 + 10.4], INK4, 0.9);
  };
  var EYES4 = [
    { id: "bright", label: "\u30AD\u30E9\u30C3", draw: (x) => EX3.map((e) => animeEye(e, x)).join("") + brow([74, 86, 81, 82, 89, 84], x.br) },
    { id: "brave", label: "\u30AD\u30EA\u30C3", draw: (x) => EX3.map((e) => animeEye(e, x, { slant: -2.4 })).join("") + brow([73, 82, 81, 82, 90, 87], x.br, 3.4) },
    { id: "gentle", label: "\u3084\u3055\u3057\u3044", draw: (x) => EX3.map((e) => animeEye(e, x, { slant: 2.4 })).join("") + brow([73, 86, 81, 81.6, 90, 83.4], x.br, 2.6) },
    { id: "sleepy", label: "\u306D\u3080\u305D\u3046", draw: (x) => EX3.map((e) => animeEye(e, x, { lid: 7 })).join("") + brow([74, 86, 81, 83.6, 89, 85], x.br, 2.4) },
    { id: "smile", label: "\u306B\u3063\u3053\u308A", draw: (x) => EX3.map((e) => T([e - 9, EY2 + 2, e, EY2 - 8, e + 9, EY2 + 2], INK4, 3.8)).join("") + brow([74, 84, 81, 80, 89, 82.6], x.br) },
    { id: "wink", label: "\u30A6\u30A4\u30F3\u30AF", draw: (x) => animeEye(EX3[0], x) + T([EX3[1] - 9, EY2 + 2, EX3[1], EY2 - 8, EX3[1] + 9, EY2 + 2], INK4, 3.8) + brow([74, 86, 81, 82, 89, 84], x.br) },
    { id: "glow", label: "\u3072\u304B\u308B\u76EE", draw: (x) => EX3.map((e) => E(e, EY2, 8, 9, x.a) + E(e, EY2, 4.6, 5.4, lighten(x.a, 0.7)) + C(e + 2, EY2 - 3, 1.8, "#fff")).join("") + brow([73, 82, 81, 82, 90, 87], x.br, 3.4) },
    { id: "star", label: "\u307B\u3057\u76EE", draw: (x) => EX3.map((e) => E(e, EY2, 8, 10, "#fff") + E(e, EY2 + 1, 6.4, 8.2, x.a) + `<path transform="translate(${e} ${EY2 + 1})" d="M0 -5 L1.6 -1.6 L5 0 L1.6 1.6 L0 5 L-1.6 1.6 L-5 0 L-1.6 -1.6Z" fill="#fff"/>` + T([e - 10, EY2 - 6, e, EY2 - 13, e + 10, EY2 - 7], INK4, 3.4)).join("") + brow([74, 84, 81, 80, 89, 82.6], x.br) }
  ];
  var MOUTH_IN2 = "#6b2230";
  var TONGUE2 = "#f08a9b";
  var MOUTHS4 = [
    { id: "smile", label: "\u306B\u3063\u3053\u308A", draw: () => T([94, 124, 100, 128.5, 106, 124], INK4, 2.6) },
    { id: "grin", label: "\u308F\u306F\u306F", draw: () => P("M91 122 Q100 138 109 122Z", MOUTH_IN2, `stroke="${LINE4}" stroke-width="1.8" stroke-linejoin="round"`) + P("M93 123 L107 123 Q106 126 100 126 Q94 126 93 123Z", "#fff") + P("M95 131 Q100 127.5 105 131 Q100 134 95 131Z", TONGUE2) },
    { id: "cat", label: "\u03C9", draw: () => S("M92 124 Q96 129 100 124 Q104 129 108 124", INK4, 2.2) },
    { id: "fang", label: "\u304D\u3070", draw: () => T([92, 123, 100, 129, 108, 123], INK4, 2.6) + P("M102 125.4 L106.6 124.6 L104.6 129.6Z", "#fff", `stroke="${LINE4}" stroke-width="1.1" stroke-linejoin="round"`) },
    { id: "flat", label: "\u307E\u3058\u3081", draw: () => T([94, 126, 100, 126.8, 106, 126], INK4, 2.2) },
    { id: "smirk", label: "\u30CB\u30E4\u30EA", draw: () => T([94, 126, 102, 128.4, 107, 122.4], INK4, 2.4) },
    { id: "shout", label: "\u3055\u3051\u3076", draw: () => P("M89 120 Q100 142 111 120 Q100 116 89 120Z", MOUTH_IN2, `stroke="${LINE4}" stroke-width="1.8" stroke-linejoin="round"`) + P("M94 132 Q100 127 106 132 Q100 136 94 132Z", TONGUE2) },
    { id: "o", label: "\u304A\u3063", draw: () => E(100, 126, 3.6, 4.4, MOUTH_IN2, `stroke="${LINE4}" stroke-width="1.6"`) }
  ];
  var MARKS2 = [
    { id: "blush", label: "\u307B\u3063\u307A", draw: (x) => E(71, 118, 10, 6.4, `url(#${x.id}bl)`) + E(129, 118, 10, 6.4, `url(#${x.id}bl)`) },
    { id: "scar", label: "\u304D\u305A", draw: () => T([124, 108, 130, 114, 136, 122], shade("#d98c7a", 0.2), 1.8) + T([126, 116, 130, 115, 135, 113], shade("#d98c7a", 0.2), 1.4) },
    { id: "bandage", label: "\u3070\u3093\u305D\u3046\u3053\u3046", draw: () => `<g transform="rotate(-18 128 116)"><rect x="118" y="112" width="20" height="8" rx="4" fill="#f2d2a8" stroke="${LINE4}" stroke-width="1.2"/><rect x="125" y="112" width="6" height="8" fill="#e6bd8a"/></g>` },
    { id: "warpaint", label: "\u30DA\u30A4\u30F3\u30C8", draw: () => both(T([62, 110, 70, 112, 78, 111], "#d9473a", 2.4) + T([64, 116, 71, 117.6, 78, 117], "#d9473a", 2.2)) },
    { id: "gem", label: "\u3072\u305F\u3044\u306E\u5B9D\u77F3", draw: () => P("M100 70 L105 76 L100 82 L95 76Z", "#2ab3c9", `stroke="${LINE4}" stroke-width="1.4" stroke-linejoin="round"`) + C(98.6, 74.6, 1.2, "#fff") },
    { id: "freckles", label: "\u305D\u3070\u304B\u3059", draw: (x) => both([[68, 112], [72, 115], [76, 112]].map(([a, b]) => C(a, b, 1.1, shade(x.skin, 0.35))).join("")) },
    { id: "tear", label: "\u306A\u307F\u3060", draw: () => P("M88 112 Q85 118 88 120 Q91 118 88 112Z", "#8cc8f0", `stroke="${LINE4}" stroke-width="1"`) }
  ];
  var EAR_HUMAN = "M54 98 C44 94 42 112 50 118 C53 120 56 119 57 116Z";
  var EARS2 = [
    { id: "human", label: "\u3075\u3064\u3046" },
    { id: "elf", label: "\u30A8\u30EB\u30D5", path: "M55 96 C40 92 28 82 20 74 C26 92 36 112 52 118 C55 119 57 117 57 114Z" },
    { id: "beast", label: "\u3051\u3082\u307F\u307F", top: true, draw: (x) => both(P("M58 70 L60 30 L90 52Z", x.hair) + P("M64 60 L65 40 L82 52Z", mix(x.hair, "#f5a0b0", 0.45))) },
    { id: "none", label: "\u304B\u304F\u3059", path: null }
  ];
  var fold = (pts, c, t = 1.4) => T(pts, shade(c, 0.3), t, 'opacity=".45"');
  var rivet = (x, y, c) => C(x, y, 1.7, lighten(c, 0.45));
  var vest = (fill) => both(P("M70 154 C74 146 84 142 90 142 L97 200 L64 200 C64 180 66 164 70 154Z", fill));
  var chainmail = (c) => Array.from({ length: 7 }, (_, r) => Array.from({ length: 5 }, (_2, k) => S(`M${42 + k * 6 + r % 2 * 3} ${160 + r * 6} q3 3 6 0`, shade(c, 0.3), 1)).join("")).join("");
  var OUTFITS = [
    {
      id: "hero",
      label: "\u52C7\u8005",
      auto: ["#3f6fd1", "#e8b84a"],
      draw: (x) => P(TORSO, x.a) + P("M88 142 L100 168 L112 142Z", "#f3f0e8") + S("M86 142 L100 170 L114 142", x.b, 3) + fold([84, 172, 86, 180, 84, 186], x.a) + fold([118, 170, 116, 178, 118, 184], x.a) + `<rect x="60" y="184" width="80" height="9" fill="#7a4a2e"/><rect x="92" y="181" width="16" height="15" rx="3" fill="${x.b}"/><rect x="96" y="185" width="8" height="7" rx="1.5" fill="#7a4a2e"/>`,
      arm: (x) => S("M44 190 L66 190", x.b, 2.4),
      shoulders: (x) => both(E(70, 152, 9, 5, x.b) + E(70, 151, 5, 2, lighten(x.b, 0.4)))
    },
    {
      id: "knight",
      label: "\u9A0E\u58EB",
      auto: ["#b8c0cc", "#3f6fd1"],
      sleeve: () => "#8e96a3",
      draw: (x) => P(TORSO, shade(x.a, 0.3)) + P("M70 150 Q100 140 130 150 L128 194 Q100 204 72 194Z", x.a) + P("M76 154 Q90 148 98 148 L98 190 Q84 192 78 188Z", lighten(x.a, 0.3), 'opacity=".55"') + S("M100 148 L100 198", shade(x.a, 0.3), 1.6) + P("M100 160 L111 164 L111 175 Q111 184 100 189 Q89 184 89 175 L89 164Z", x.b) + P("M100 166 L104 174 L100 182 L96 174Z", lighten(x.b, 0.5)) + [[76, 156], [124, 156], [78, 190], [122, 190]].map(([a, b]) => rivet(a, b, x.a)).join("") + P("M84 140 Q100 150 116 140 L118 151 Q100 161 82 151Z", x.a) + S("M83 146 Q100 156 117 146", shade(x.a, 0.3), 1.2),
      arm: () => chainmail("#8e96a3"),
      shoulders: (x) => both(P("M50 150 C58 138 80 140 84 154 C74 154 62 158 54 166 C49 160 48 155 50 150Z", x.a) + P("M48 162 C56 155 70 156 78 162 C70 164 60 168 54 175 C49 171 47 166 48 162Z", shade(x.a, 0.15)) + rivet(64, 149, x.a) + rivet(58, 154, x.a))
    },
    {
      id: "mage",
      label: "\u9B54\u6CD5\u4F7F\u3044",
      auto: ["#8a63d2", "#e8b84a"],
      draw: (x) => P(TORSO, x.a) + S("M100 154 L100 200", shade(x.a, 0.35), 2) + both(S("M95 152 L93 200", x.b, 2.2)) + `<rect x="60" y="180" width="80" height="9" fill="${shade(x.a, 0.3)}"/>` + S("M60 180 L140 180 M60 189 L140 189", x.b, 1.4) + fold([80, 192, 82, 196, 80, 200], x.a) + fold([120, 192, 118, 196, 120, 200], x.a) + P("M70 148 Q100 132 130 148 L126 164 Q100 152 74 164Z", shade(x.a, 0.22)) + S("M74 164 Q100 152 126 164", x.b, 2) + C(100, 162, 6, x.b) + C(100, 162, 4, "#2ab3c9") + C(98.6, 160.6, 1.3, "#fff"),
      arm: (x) => S("M43 188 L67 186", x.b, 2.4) + fold([56, 164, 58, 174, 56, 182], x.a)
    },
    {
      id: "priest",
      label: "\u50E7\u4FB6",
      auto: ["#f3f0e8", "#3f6fd1"],
      draw: (x) => P(TORSO, x.a) + P("M92 142 L100 154 L108 142Z", x.skin) + both(P("M85 142 L89 200 L98 200 L95 142Z", x.b) + S("M85 142 L89 200 M95 142 L98 200", "#e8b84a", 1.2) + P("M92 172 L94.5 176 L92 180 L89.5 176Z", "#e8b84a")) + C(100, 168, 7.5, "#e8b84a") + C(100, 168, 4, x.a) + fold([74, 176, 76, 186, 74, 196], x.a) + fold([126, 176, 124, 186, 126, 196], x.a),
      arm: (x) => S("M43 192 L67 190", "#e8b84a", 2)
    },
    {
      id: "thief",
      label: "\u76D7\u8CCA",
      auto: ["#5f6f3a", "#8a5a3a"],
      sleeve: () => "#d8cdb8",
      draw: (x) => P(TORSO, "#d8cdb8") + vest(x.a) + both(S("M90 142 L97 200", lighten(x.a, 0.2), 1.6)) + S("M68 158 L132 198", x.b, 7) + [[84, 168], [104, 180]].map(([a, b]) => `<rect x="${a - 5}" y="${b - 5}" width="10" height="9" rx="2" fill="${shade(x.b, 0.15)}" transform="rotate(32 ${a} ${b})"/>`).join("") + P("M80 140 Q100 154 120 140 L122 150 Q100 164 78 150Z", "#c9a46a") + P("M106 154 L114 172 L102 166Z", "#c9a46a"),
      arm: (x) => `<rect x="43" y="184" width="24" height="12" rx="2" fill="${x.b}"/>` + S("M43 190 L67 190", shade(x.b, 0.3), 1)
    },
    {
      id: "ninja",
      label: "\u5FCD\u8005",
      auto: ["#2a3f7a", "#3a3438"],
      draw: (x) => P(TORSO, x.a) + P("M86 140 L106 180 L112 176 L94 140Z", lighten(x.a, 0.25)) + S("M114 140 L98 172", shade(x.a, 0.35), 2) + `<rect x="60" y="184" width="80" height="8" fill="${x.b}"/>` + P("M104 184 L116 196 L110 198 L100 190Z", x.b) + fold([78, 160, 80, 170, 78, 178], x.a),
      arm: () => `<rect x="44" y="176" width="23" height="20" rx="3" fill="#8e96a3"/>` + S("M44 182 L67 182 M44 188 L67 188", "#5f6875", 1.2)
    },
    {
      id: "archer",
      label: "\u5F13\u4F7F\u3044",
      auto: ["#4fa36f", "#8a5a3a"],
      draw: (x) => P(TORSO, x.a) + P("M92 142 L100 158 L108 142Z", x.skin) + S("M94 146 L106 150 M95 151 L105 154", x.b, 1.4) + S("M66 156 L134 198", x.b, 6) + `<rect x="94" y="172" width="12" height="9" rx="2" fill="#e8b84a" transform="rotate(32 100 176)"/>` + fold([118, 160, 120, 170, 118, 178], x.a),
      arm: (x) => `<rect x="44" y="182" width="23" height="14" rx="3" fill="${x.b}"/>` + S("M48 185 L62 193 M62 185 L48 193", lighten(x.b, 0.4), 1),
      shoulders: (x) => P("M52 152 C60 142 78 144 82 156 C72 156 62 160 56 166 C52 162 50 157 52 152Z", x.b)
    },
    {
      id: "bard",
      label: "\u541F\u904A\u8A69\u4EBA",
      auto: ["#d9473a", "#ffffff"],
      draw: (x) => P(TORSO, "#ffffff") + vest(x.a) + both(C(86, 160, 2, "#e8b84a") + C(87.5, 174, 2, "#e8b84a") + C(89, 188, 2, "#e8b84a")) + P("M92 144 Q100 150 108 144 L106 152 Q100 158 94 152 L92 160 Q100 166 108 160 L104 170 Q100 174 96 170Z", x.b, `stroke="${shade(x.b, 0.2)}" stroke-width="1"`),
      arm: (x) => [46, 52, 58, 64].map((v) => `<rect x="${v}" y="158" width="2.6" height="42" fill="${x.b}"/>`).join(""),
      shoulders: (x) => both(E(66, 156, 12, 8, x.a) + S("M58 154 Q66 150 74 154 M60 159 Q66 155 72 159", x.b, 1.4))
    },
    {
      id: "alchemist",
      label: "\u932C\u91D1\u8853\u5E2B",
      auto: ["#8a5a3a", "#2ab3c9"],
      draw: (x) => P(TORSO, "#f3f0e8") + both(P("M70 154 C74 146 84 142 90 142 L99 200 L64 200 C64 180 66 164 70 154Z", x.a) + P("M90 142 L99 200 L93 200 L83 162 L89 154 L81 148Z", shade(x.a, 0.2))) + `<rect x="114" y="174" width="16" height="16" rx="2" fill="${shade(x.a, 0.15)}"/>` + P("M119 166 L125 166 L125 171 L129 180 Q129 184 122 184 Q115 184 115 180 L119 171Z", x.b) + `<rect x="118" y="163" width="8" height="4" rx="1" fill="#a8693c"/>`,
      arm: (x) => `<rect x="43" y="186" width="24" height="10" fill="${lighten(x.a, 0.25)}"/>`
    },
    {
      id: "villager",
      label: "\u6751\u4EBA",
      auto: ["#e8b84a", "#8a5a3a"],
      draw: (x) => P(TORSO, x.a) + P("M92 142 L100 156 L108 142Z", x.skin) + S("M94 146 L106 150 M94 151 L105 154 M95 156 L103 158", x.b, 1.6) + P("M66 170 L134 170 L136 200 L64 200Z", "#f3f0e8") + S("M68 172 L72 148 M132 172 L128 148", "#f3f0e8", 4) + S("M66 170 L134 170", shade("#f3f0e8", 0.15), 1.4) + `<rect x="88" y="180" width="24" height="13" rx="2" fill="${shade("#f3f0e8", 0.08)}"/>`,
      arm: (x) => fold([56, 166, 58, 176, 56, 186], x.a)
    },
    {
      id: "demon",
      label: "\u9B54\u738B",
      auto: ["#3a3438", "#d9473a"],
      draw: (x) => P(TORSO, x.a) + P("M72 150 Q100 142 128 150 L126 194 Q100 202 74 194Z", lighten(x.a, 0.12)) + S("M72 150 Q100 142 128 150", x.b, 2) + P("M86 140 Q100 158 114 140 L100 178Z", x.b) + C(100, 184, 5, "#e8b84a") + C(100, 184, 2.6, x.b),
      arm: (x) => S("M43 186 L67 186", x.b, 2.4),
      shoulders: (x) => both(P("M48 158 L54 136 L62 152 L70 138 L76 156 C68 156 58 160 50 168Z", x.a) + S("M50 166 C58 158 68 156 76 156", x.b, 1.6))
    },
    {
      id: "princess",
      label: "\u59EB",
      auto: ["#f08fb5", "#e8b84a"],
      sleeve: (x) => x.skin,
      draw: (x) => P(TORSO, x.a) + P("M76 152 Q88 144 100 154 Q112 144 124 152 L120 140 L80 140Z", x.skin) + S("M76 152 Q88 144 100 154 Q112 144 124 152", "#ffffff", 2.6) + S("M82 150 Q100 166 118 150", x.b, 1.6) + P("M100 160 L104 165 L100 170 L96 165Z", x.b) + fold([86, 176, 84, 188, 86, 198], x.a) + fold([114, 176, 116, 188, 114, 198], x.a),
      shoulders: (x) => both(E(68, 156, 13, 9, x.a) + S("M58 153 Q68 148 78 153", lighten(x.a, 0.35), 1.6))
    }
  ];
  var BACKS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "cape", label: "\u30DE\u30F3\u30C8", auto: ["#d9473a", "#e8b84a"], back: (x) => P("M56 148 C40 168 32 188 30 200 L170 200 C168 188 160 168 144 148Z", x.a) + both(P("M30 200 C34 190 40 180 48 170 L52 200Z", shade(x.a, 0.2))), front: (x) => both(C(76, 150, 4.6, x.b)) },
    { id: "scarf", label: "\u306A\u3073\u304F\u30DE\u30D5\u30E9\u30FC", auto: ["#d9473a", "#e8b84a"], back: (x) => P("M120 146 C140 150 160 140 176 128 C172 142 162 158 146 164 C160 166 172 162 182 156 C174 170 152 178 128 168Z", x.a), front: (x) => P("M80 140 Q100 152 120 140 L122 152 Q100 164 78 152Z", x.a) },
    { id: "angel", label: "\u5929\u4F7F\u306E\u7FBD", auto: ["#ffffff", "#e8eef8"], back: (x) => both(P("M66 156 C48 130 24 122 12 128 C22 134 26 142 20 150 C30 152 32 160 26 168 C38 170 42 176 40 184 C52 182 62 174 68 164Z", x.a) + S("M60 158 C44 146 32 142 22 144 M58 166 C46 158 36 158 28 162", x.b, 1.6)) },
    { id: "devil", label: "\u60AA\u9B54\u306E\u7FBD", auto: ["#3a3438", "#8a63d2"], back: (x) => both(P("M66 156 C52 132 30 118 14 120 C20 132 20 144 14 154 C26 150 32 156 30 168 C40 160 48 164 50 174 C56 166 62 164 68 164Z", x.a) + S("M64 158 C48 140 30 128 16 122", x.b, 1.4)) },
    { id: "quiver", label: "\u77E2\u7B52", auto: ["#8a5a3a", "#d9473a"], back: (x) => `<g transform="rotate(-24 140 150)"><rect x="132" y="112" width="18" height="60" rx="5" fill="${x.a}"/>${[136, 141, 146].map((a, i) => S(`M${a} 112 L${a} ${96 - i * 3}`, "#8a5a3a", 2) + P(`M${a - 4} ${100 - i * 3} L${a} ${90 - i * 3} L${a + 4} ${100 - i * 3}Z`, x.b)).join("")}</g>` }
  ];
  var hand = (x, y, rot, skin) => `<g transform="translate(${x} ${y}) rotate(${rot})">` + P("M-8 -1 C-8 -7 -3 -9 3 -9 C8 -8 10 -3 9 2 C8 7 3 9 -2 8 C-6 7 -8 3 -8 -1Z", skin) + P("M-6 -5 C-10 -8 -9 -13 -5 -13 C-2 -13 -1 -10 -1 -7Z", skin) + S("M2 -7 L2 6 M5.6 -6 L5.6 5", shade(skin, 0.3), 1, 'opacity=".7"') + `</g>`;
  var sparkle = (x, y, r, fill) => `<path transform="translate(${x} ${y}) scale(${r / 6})" d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z" fill="${fill}"/>`;
  var note = (x, y, fill) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" transform="rotate(-20 ${x} ${y})" fill="${fill}"/><rect x="${x + 2.6}" y="${y - 15}" width="2" height="15" fill="${fill}"/>` + P(`M${x + 4.6} ${y - 15} Q${x + 11} ${y - 11} ${x + 9} ${y - 5} Q${x + 8} ${y - 9} ${x + 4.6} ${y - 10}Z`, fill);
  var WEAPONS = [
    { id: "none", label: "\u306A\u3057" },
    { id: "sword", label: "\u5263", auto: ["#b8c0cc", "#e8b84a"], back: (x) => `<g transform="rotate(32 150 132)"><path d="M145 30 L155 30 L155 120 L150 130 L145 120Z" fill="${x.a}"/>${S("M150 34 L150 118", lighten(x.a, 0.5), 1.6)}<rect x="136" y="120" width="28" height="7" rx="3" fill="${x.b}"/><rect x="146" y="127" width="8" height="20" rx="3" fill="#8a5a3a"/>${C(150, 150, 5, x.b)}</g>` },
    { id: "staff", label: "\u6756", auto: ["#8a5a3a", "#2ab3c9"], grips: [{ side: "L", x: 33.5, y: 150, rot: -8 }], front: (x) => `<rect x="30" y="62" width="7" height="138" rx="3.5" fill="${x.a}"/>` + P("M33.5 66 C22 58 20 42 28 32 C28 46 31 50 33.5 54 C36 50 39 46 39 32 C47 42 45 58 33.5 66Z", shade(x.a, 0.15)) + C(33.5, 46, 10, x.b) + C(30, 42, 3.4, "#fff", 'opacity=".8"') + sparkle(52, 34, 5, x.b) + sparkle(16, 60, 3.6, x.b) },
    { id: "wand", label: "\u30B9\u30C6\u30C3\u30AD", auto: ["#f3f0e8", "#e8b84a"], grips: [{ side: "R", x: 160, y: 156, rot: 10 }], front: (x) => `<g transform="rotate(16 160 156)"><rect x="157" y="106" width="6" height="56" rx="3" fill="${x.a}"/>${sparkle(160, 96, 13, x.b)}</g>` + sparkle(184, 88, 4.6, x.b) + sparkle(142, 80, 3.6, x.b) },
    { id: "shield", label: "\u76FE", auto: ["#3f6fd1", "#e8b84a"], front: (x) => P("M22 142 Q47 132 72 142 L72 164 Q72 188 47 199 Q22 188 22 164Z", x.a) + P("M27 146 Q47 138 67 146 L67 164 Q67 184 47 193 Q27 184 27 164Z", "none", `stroke="${x.b}" stroke-width="2.4"`) + P("M47 150 L56 166 L47 184 L38 166Z", x.b) + [[32, 150], [62, 150], [47, 192]].map(([a, b]) => C(a, b, 1.8, lighten(x.b, 0.3))).join("") },
    { id: "bow", label: "\u5F13", auto: ["#8a5a3a", "#d9473a"], grips: [{ side: "L", x: 18, y: 131, rot: 90 }], front: (x) => S("M38 66 L38 196", "#5a4636", 1.4) + P("M38 62 C46 64 42 72 38 70 C24 92 18 112 18 131 C18 150 24 170 38 192 C42 190 46 198 38 200 C20 178 12 156 12 131 C12 106 20 84 38 62Z", x.a) + `<rect x="10" y="122" width="10" height="18" rx="3" fill="${x.b}"/>` },
    { id: "axe", label: "\u65A7", auto: ["#b8c0cc", "#8a5a3a"], back: (x) => `<g transform="rotate(28 150 130)"><rect x="146" y="44" width="8" height="106" rx="4" fill="${x.b}"/><path d="M154 50 C176 46 184 64 180 82 C170 76 162 76 154 80Z" fill="${x.a}"/><path d="M146 50 C130 52 126 66 130 76 C136 72 141 72 146 74Z" fill="${shade(x.a, 0.15)}"/></g>` },
    { id: "spear", label: "\u69CD", auto: ["#b8c0cc", "#8a5a3a"], back: (x) => `<g transform="rotate(20 150 130)"><rect x="147" y="30" width="6" height="170" rx="3" fill="${x.b}"/><path d="M150 4 L158 30 L150 38 L142 30Z" fill="${x.a}"/><rect x="144" y="36" width="12" height="4" rx="2" fill="#d9473a"/></g>` },
    { id: "book", label: "\u9B54\u5C0E\u66F8", auto: ["#d9473a", "#e8b84a"], grips: [{ side: "L", x: 80, y: 172, rot: -20 }], front: (x) => `<g transform="rotate(-12 58 168)"><rect x="37" y="150" width="46" height="36" rx="3" fill="#f3f0e8"/>` + S("M80 154 L80 184 M77 152 L77 185", "#d9cfbf", 1) + `<rect x="34" y="147" width="45" height="36" rx="3" fill="${x.a}"/><rect x="34" y="147" width="7" height="36" rx="2" fill="${shade(x.a, 0.3)}"/>` + P("M41 147 L49 147 L41 155Z M79 147 L71 147 L79 155Z M41 183 L49 183 L41 175Z M79 183 L71 183 L79 175Z", x.b) + C(60, 165, 7, x.b) + sparkle(60, 165, 5, x.a) + `</g>` + sparkle(90, 140, 4, x.b) },
    { id: "lute", label: "\u30EA\u30E5\u30FC\u30C8", auto: ["#c47f45", "#3a3438"], grips: [{ side: "R", x: 165, y: 124, rot: 0 }], front: (x) => `<g transform="translate(150 148) rotate(32)"><rect x="-3.5" y="-50" width="7" height="46" fill="${shade(x.a, 0.3)}"/>` + P("M-4 -50 L4 -50 L9 -63 L1 -65Z", shade(x.a, 0.4)) + C(-0.5, -55, 1.6, x.b) + C(3.5, -60, 1.6, x.b) + P("M0 -8 C15 -8 24 8 24 24 C24 40 13 48 0 48 C-13 48 -24 40 -24 24 C-24 8 -15 -8 0 -8Z", x.a) + E(-10, 12, 5, 10, "#fff", 'opacity=".22"') + `<circle cx="0" cy="13" r="8.6" fill="none" stroke="${lighten(x.a, 0.45)}" stroke-width="1.6"/>` + C(0, 13, 6, x.b) + `<rect x="-8" y="32" width="16" height="3.6" rx="1.5" fill="${shade(x.a, 0.45)}"/>` + S("M-2 -48 L-2 33 M2 -48 L2 33", "#f3f0e8", 0.7) + `</g>` + note(172, 70, x.b) + note(188, 92, x.b) },
    { id: "dagger", label: "\u77ED\u5263", auto: ["#b8c0cc", "#3a3438"], grips: [{ side: "R", x: 170, y: 164, rot: 12 }], front: (x) => `<g transform="translate(10 8) rotate(12 160 156)">` + P("M160 96 L166 108 L166 144 L154 144 L154 108Z", x.a) + S("M160 104 L160 140", lighten(x.a, 0.5), 1.4) + `<rect x="148" y="142" width="24" height="6" rx="3" fill="${x.b}"/><rect x="156" y="148" width="8" height="16" rx="2" fill="#8a5a3a"/>` + C(160, 167, 4, x.b) + `</g>` }
  ];
  var HOOD_OUT = "M40 112 C34 60 62 26 100 26 C138 26 166 60 160 112 C162 126 160 142 156 152 L44 152 C40 142 38 126 40 112Z";
  var HOOD_HOLE = "M100 52 C126 52 142 70 142 96 C142 120 126 138 100 140 C74 138 58 120 58 96 C58 70 74 52 100 52Z";
  var HELM_DOME = "M50 82 C48 46 72 30 100 30 C128 30 152 46 150 82Z";
  var GEAR_HEAD = [
    { id: "none", label: "\u306A\u3057" },
    { id: "helmet", label: "\u304B\u3076\u3068", cover: 84, auto: ["#b8c0cc", "#d9473a"], front: (x) => P("M100 32 C96 14 108 2 124 4 C114 10 110 20 108 32Z", x.b) + P(HELM_DOME, x.a) + P("M47 76 L153 76 L153 88 C130 84 70 84 47 88Z", shade(x.a, 0.15)) + S("M100 34 L100 74", lighten(x.a, 0.4), 2) },
    { id: "viking", label: "\u89D2\u304B\u3076\u3068", cover: 84, auto: ["#b8c0cc", "#f3f0e8"], front: (x) => both(P("M54 66 C40 62 30 48 32 30 C40 44 50 48 60 50Z", x.b)) + P(HELM_DOME, x.a) + P("M47 76 L153 76 L153 88 C130 84 70 84 47 88Z", shade(x.a, 0.2)) + [64, 82, 100, 118, 136].map((a) => C(a, 82, 2, lighten(x.a, 0.5))).join("") },
    { id: "wizard", label: "\u3068\u3093\u304C\u308A\u5E3D\u5B50", cover: 68, auto: ["#8a63d2", "#e8b84a"], front: (x) => E(100, 66, 66, 13, shade(x.a, 0.1)) + P("M62 64 C70 40 84 14 118 0 C112 20 124 44 138 64Z", x.a) + P("M64 56 Q100 50 136 56 L138 64 Q100 58 62 64Z", x.b) + `<path transform="translate(112 34)" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="${x.b}"/>` },
    { id: "hood", label: "\u30D5\u30FC\u30C9", hood: true, hidesBack: true, auto: ["#5f6f3a", "#3a3438"], back: (x) => P(HOOD_OUT, shade(x.a, 0.25)), front: (x) => P(HOOD_OUT + " " + HOOD_HOLE, x.a, 'fill-rule="evenodd"') + S("M62 70 C76 54 124 54 138 70", shade(x.a, 0.2), 1.6) },
    {
      id: "ninja",
      label: "\u5FCD\u3073\u982D\u5DFE",
      hidesHair: true,
      hidesMouth: true,
      auto: ["#2a3f7a", "#3a3438"],
      back: (x) => P("M138 70 C156 72 170 64 178 54 C176 70 166 82 150 84Z M140 80 C158 88 170 86 182 80 C174 94 160 98 146 92Z", x.a),
      front: (x) => P("M48 100 C44 60 70 38 100 38 C130 38 156 60 152 100 C152 124 134 146 100 148 C66 146 48 124 48 100Z M62 88 C80 82 120 82 138 88 L136 112 C120 108 80 108 64 112Z", x.a, 'fill-rule="evenodd"') + S("M66 112 C84 108 116 108 134 112", shade(x.a, 0.3), 1.6)
    },
    { id: "bandana", label: "\u30D0\u30F3\u30C0\u30CA", cover: 72, auto: ["#d9473a", "#ffffff"], front: (x) => P("M50 82 C48 48 72 34 100 34 C128 34 152 48 150 82 C130 74 70 74 50 82Z", x.a) + both(C(80, 54, 2, x.b) + C(90, 66, 2, x.b)) + C(100, 46, 2, x.b) + P("M146 70 L168 74 L160 90Z M146 70 L170 64 L168 82Z", x.a) },
    { id: "crown", label: "\u738B\u51A0", auto: ["#e8b84a", "#d9473a"], front: (x) => P("M74 52 L70 20 L86 34 L100 14 L114 34 L130 20 L126 52Z", x.a) + C(100, 42, 4, x.b) + C(84, 45, 3, x.b) + C(116, 45, 3, x.b) },
    { id: "tiara", label: "\u30C6\u30A3\u30A2\u30E9", auto: ["#e8b84a", "#2ab3c9"], front: (x) => P("M70 58 Q100 44 130 58 L126 62 Q100 52 74 62Z", x.a) + P("M100 34 L108 50 L100 56 L92 50Z", x.a) + C(100, 48, 3.6, x.b) },
    { id: "circlet", label: "\u30B5\u30FC\u30AF\u30EC\u30C3\u30C8", auto: ["#e8b84a", "#d9473a"], front: (x) => P("M52 76 Q100 62 148 76 L148 82 Q100 68 52 82Z", x.a) + P("M100 66 L106 73 L100 80 L94 73Z", x.b) },
    { id: "headband", label: "\u306F\u3061\u307E\u304D", auto: ["#d9473a", "#ffffff"], front: (x) => P("M51 74 Q100 60 149 74 L149 84 Q100 70 51 84Z", x.a) + P("M146 76 C160 78 170 88 174 100 C164 94 156 92 146 88Z M146 80 C158 88 162 100 160 112 C154 102 150 96 144 92Z", x.a) },
    { id: "goggles", label: "\u30B4\u30FC\u30B0\u30EB", auto: ["#8a5a3a", "#2ab3c9"], front: (x) => S("M50 70 Q100 54 150 70", x.a, 6) + both(C(84, 62, 11, x.a) + C(84, 62, 7, x.b) + C(81, 59, 2, "#fff", 'opacity=".8"')) },
    { id: "horns", label: "\u60AA\u9B54\u306E\u89D2", auto: ["#3a3438", "#d9473a"], front: (x) => both(P("M64 62 C56 50 54 34 62 20 C64 34 72 44 80 50Z", x.a) + S("M62 50 C60 42 60 34 62 26", lighten(x.a, 0.3), 1.4)) },
    { id: "halo", label: "\u5929\u4F7F\u306E\u8F2A", auto: ["#e8b84a", "#fff4c2"], front: (x) => `<ellipse cx="100" cy="24" rx="28" ry="7" fill="none" stroke="${x.a}" stroke-width="5"/><ellipse cx="100" cy="24" rx="28" ry="7" fill="none" stroke="${x.b}" stroke-width="1.6"/>` }
  ];
  var PARTS3 = { hair: HAIRS, eyes: EYES4, mouth: MOUTHS4, marks: MARKS2, ears: EARS2, outfit: OUTFITS, back: BACKS, weapon: WEAPONS, head: GEAR_HEAD };
  var CATEGORIES4 = [
    { key: "skin", label: "\u306F\u3060", colors: [{ key: "skin", label: "\u306F\u3060\u306E\u8272", palette: PALETTES4.skin }] },
    { key: "hair", label: "\u304B\u307F", colors: [{ key: "hairColor", label: "\u304B\u307F\u306E\u8272", palette: PALETTES4.hair }] },
    { key: "eyes", label: "\u3081", colors: [{ key: "eyesColor", label: "\u3072\u3068\u307F\u306E\u8272", palette: PALETTES4.eyes }] },
    { key: "mouth", label: "\u304F\u3061" },
    { key: "marks", label: "\u3057\u308B\u3057", multi: true },
    { key: "ears", label: "\u307F\u307F" },
    { key: "outfit", label: "\u305D\u3046\u3073", colors: [{ key: "outfitColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES4.gear }, { key: "outfitColor2", label: "\u30B5\u30D6", palette: PALETTES4.gear }] },
    { key: "back", label: "\u305B\u306A\u304B", colors: [{ key: "backColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES4.gear }, { key: "backColor2", label: "\u30B5\u30D6", palette: PALETTES4.gear }] },
    { key: "head", label: "\u3042\u305F\u307E", colors: [{ key: "headColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES4.gear }, { key: "headColor2", label: "\u30B5\u30D6", palette: PALETTES4.gear }] },
    { key: "weapon", label: "\u3076\u304D", colors: [{ key: "weaponColor", label: "\u30E1\u30A4\u30F3", palette: PALETTES4.gear }, { key: "weaponColor2", label: "\u30B5\u30D6", palette: PALETTES4.gear }] },
    { key: "bg", label: "\u306F\u3044\u3051\u3044", colors: [{ key: "bgColor", label: "\u306F\u3044\u3051\u3044", palette: PALETTES4.bg }] }
  ];
  var GROUPS4 = [
    { label: "\u304B\u304A", cats: ["skin", "eyes", "mouth", "marks", "ears"] },
    { label: "\u304B\u307F", cats: ["hair"] },
    { label: "\u305D\u3046\u3073", cats: ["outfit", "head", "back"] },
    { label: "\u3076\u304D", cats: ["weapon"] },
    { label: "\u306F\u3044\u3051\u3044", cats: ["bg"] }
  ];
  var DEFAULTS4 = {
    skin: "#f6d0b4",
    hair: "hero",
    hairColor: "#5a3a2a",
    eyes: "bright",
    eyesColor: "#3f6fd1",
    mouth: "smile",
    marks: ["blush"],
    ears: "human",
    outfit: "hero",
    outfitColor: "auto",
    outfitColor2: "auto",
    back: "none",
    backColor: "auto",
    backColor2: "auto",
    head: "none",
    headColor: "auto",
    headColor2: "auto",
    weapon: "none",
    weaponColor: "auto",
    weaponColor2: "auto",
    bgColor: "#eef3fb"
  };
  var CHARACTERS3 = [
    { label: "\u52C7\u8005", hair: "hero", hairColor: "#5a3a2a", eyes: "brave", eyesColor: "#3f6fd1", mouth: "grin", outfit: "hero", back: "cape", weapon: "sword", bgColor: "#eef3fb" },
    { label: "\u9A0E\u58EB", hair: "neat", hairColor: "#f0cf6a", eyes: "bright", eyesColor: "#3f6fd1", mouth: "flat", outfit: "knight", head: "helmet", weapon: "shield", back: "cape", backColor: "#3f6fd1", bgColor: "#e7f3e8" },
    { label: "\u9B54\u6CD5\u4F7F\u3044", hair: "long", hairColor: "#e8e4ee", eyes: "gentle", eyesColor: "#8a63d2", mouth: "smile", outfit: "mage", head: "wizard", weapon: "staff", bgColor: "#f3e8f6" },
    { label: "\u50E7\u4FB6", hair: "bob", hairColor: "#f0cf6a", eyes: "gentle", eyesColor: "#2ab3c9", mouth: "smile", outfit: "priest", head: "circlet", weapon: "book", back: "angel", bgColor: "#eef3fb" },
    { label: "\u76D7\u8CCA", hair: "neat", hairColor: "#a8693c", eyes: "brave", eyesColor: "#4fa36f", mouth: "smirk", outfit: "thief", head: "bandana", weapon: "dagger", marks: ["blush", "scar"], bgColor: "#f6efe2" },
    { label: "\u5FCD\u8005", hair: "hero", hairColor: "#2b2429", eyes: "brave", eyesColor: "#d9473a", outfit: "ninja", head: "ninja", back: "scarf", weapon: "none", bgColor: "#1f2a2e" },
    { label: "\u5F13\u4F7F\u3044", hair: "pony", hairColor: "#4fa36f", eyes: "bright", eyesColor: "#4fa36f", mouth: "smile", ears: "elf", outfit: "archer", back: "quiver", weapon: "bow", bgColor: "#e7f3e8" },
    { label: "\u541F\u904A\u8A69\u4EBA", hair: "wild", hairColor: "#d9473a", eyes: "wink", eyesColor: "#e8b84a", mouth: "grin", outfit: "bard", weapon: "lute", bgColor: "#fdeee0" },
    { label: "\u932C\u91D1\u8853\u5E2B", hair: "bun", hairColor: "#3f6fd1", eyes: "sleepy", eyesColor: "#2ab3c9", mouth: "cat", outfit: "alchemist", head: "goggles", marks: ["blush", "freckles"], bgColor: "#f6efe2" },
    { label: "\u59EB", hair: "long", hairColor: "#f08fb5", eyes: "star", eyesColor: "#8a63d2", mouth: "smile", outfit: "princess", head: "tiara", weapon: "wand", bgColor: "#f3e8f6" },
    { label: "\u9B54\u738B", hair: "wild", hairColor: "#e8e4ee", skin: "#b9b4dc", eyes: "glow", eyesColor: "#d9473a", mouth: "fang", outfit: "demon", head: "horns", back: "devil", weapon: "none", marks: [], bgColor: "#2e3350" },
    { label: "\u30D0\u30A4\u30AD\u30F3\u30B0", hair: "wild", hairColor: "#a8693c", eyes: "brave", eyesColor: "#3f6fd1", mouth: "shout", outfit: "knight", outfitColor: "#8a5a3a", head: "viking", weapon: "axe", marks: ["blush", "warpaint"], bgColor: "#eef3fb" },
    { label: "\u7363\u4EBA", hair: "bob", hairColor: "#a8693c", eyes: "bright", eyesColor: "#e8b84a", mouth: "fang", ears: "beast", outfit: "villager", weapon: "spear", bgColor: "#fdeee0" },
    { label: "\u30EC\u30F3\u30B8\u30E3\u30FC", hair: "neat", hairColor: "#2b2429", eyes: "brave", eyesColor: "#4fa36f", mouth: "flat", outfit: "archer", outfitColor: "#5f6f3a", head: "hood", weapon: "bow", bgColor: "#e7f3e8" },
    { label: "\u5929\u4F7F", hair: "twin", hairColor: "#ffffff", eyes: "star", eyesColor: "#2ab3c9", mouth: "smile", outfit: "priest", head: "halo", back: "angel", marks: ["blush", "gem"], bgColor: "#eef3fb" },
    { label: "\u6751\u4EBA", hair: "twin", hairColor: "#a8693c", eyes: "smile", mouth: "grin", outfit: "villager", marks: ["blush", "freckles"], bgColor: "#fdeee0" }
  ];
  function randomAdventurer(r) {
    const { pick, chance } = r;
    const c = { ...r.pick(CHARACTERS3) };
    delete c.label;
    c.skin = r.chance(0.85) ? r.pick(PALETTES4.skin.slice(0, 6)) : r.pick(PALETTES4.skin);
    if (r.chance(0.6)) c.hair = r.pick(HAIRS.slice(0, 8).map((h) => h.id));
    c.hairColor = r.pick(PALETTES4.hair);
    c.eyesColor = r.pick(PALETTES4.eyes);
    if (r.chance(0.4)) c.eyes = r.pick(EYES4.map((e) => e.id));
    if (r.chance(0.4)) c.mouth = r.pick(MOUTHS4.map((m) => m.id));
    if (r.chance(0.15)) c.ears = r.pick(["elf", "beast"]);
    c.bgColor = r.pick(PALETTES4.bg.slice(0, 5));
    return c;
  }
  function compose4(scene) {
    const { config: cfg } = scene;
    const skin = scene.color("skin"), hair = scene.color("hairColor");
    const slot = (cat) => ({ id: scene.id, p: scene.part(cat), skin, hair, ...scene.slots(cat) });
    const H = scene.part("hair"), gear = slot("head"), back = slot("back"), weapon = slot("weapon"), outfit = slot("outfit");
    const ear = scene.part("ears");
    const G = gear.p;
    const showHair = !G.hidesHair;
    const look = { id: scene.id, skin, hair, a: cfg.eyesColor, br: luminance(hair) > 0.6 ? mix(hair, INK4, 0.5) : shade(hair, 0.1) };
    const torsoUrl = scene.clip("b", TORSO), armUrl = scene.clip("a", ARM), faceUrl = scene.clip("f", FACE3);
    const fringeUrl = H.front ? scene.clip("hf", H.front) : "";
    scene.define(blushGradient(scene.uid("bl")));
    let underGear = (s) => s;
    if (G.cover || G.hood) {
      const url = scene.clip("hc", G.hood ? HOOD_HOLE : `M0 200 L0 ${G.cover + 40} L50 ${G.cover} L150 ${G.cover} L200 ${G.cover + 40} L200 200Z`);
      underGear = (s) => scene.clipped(url, s);
    }
    if (back.p.back) scene.add(scene.outlined(back.p.back(back)));
    if (G.back) scene.add(scene.outlined(G.back(gear)));
    if (weapon.p.back) scene.add(scene.outlined(weapon.p.back(weapon)));
    if (showHair && H.back && !G.hidesBack) scene.add(scene.outlined(underGear(P(H.back, shade(hair, 0.22)))));
    const grips = weapon.p.grips || [];
    const bent = new Set(grips.map((g) => g.side));
    const sleeve = outfit.p.sleeve ? outfit.p.sleeve(outfit) : outfit.a;
    scene.add(P(NECK2, skin, `stroke="${LINE4}" stroke-width="1.6"`), P("M91 128 Q100 140 109 128 L109 138 Q100 148 91 138Z", shade(skin, 0.14)));
    scene.add(scene.silhouette(P(TORSO, outfit.a)));
    scene.add(scene.clipped(torsoUrl, outfit.p.draw(outfit) + P(TORSO, "#1a1226", 'opacity=".1" transform="translate(7 3)"')));
    const hangingArm = scene.outlined(P(ARM, sleeve)) + scene.clipped(armUrl, P(ARM, shade(sleeve, 0.18)) + P(ARM, sleeve, 'transform="translate(-3 -2)"') + (outfit.p.arm ? outfit.p.arm(outfit) : ""));
    if (!bent.has("L")) scene.add(hangingArm);
    if (!bent.has("R")) scene.add(M(hangingArm));
    for (const g of grips) {
      const [sx, sy] = SHOULDER[g.side], out = g.side === "L" ? -1 : 1;
      const ex = (sx + g.x) / 2 + out * 12, ey = Math.min(194, Math.max(sy, g.y) + 22);
      const d = `M${sx} ${sy} Q${ex} ${ey} ${g.x} ${g.y}`;
      scene.add(S(d, LINE4, 15 + LINE_W4), S(d, sleeve, 15), S(d, shade(sleeve, 0.18), 4, 'opacity=".5" transform="translate(2 3)"'));
    }
    if (outfit.p.shoulders) scene.add(scene.outlined(outfit.p.shoulders(outfit)));
    if (back.p.front) scene.add(scene.outlined(back.p.front(back)));
    if (showHair && H.locks && !G.hidesBack) scene.add(scene.outlined(underGear(P(H.locks, hair))));
    if (ear.path !== null && !ear.top && !G.hidesHair) {
      const e = P(ear.path || EAR_HUMAN, skin) + S("M51 103 C48 106 49 111 52 113", shade(skin, 0.2), 1.6);
      scene.add(scene.outlined(e + M(e)));
    }
    scene.add(scene.silhouette(P(FACE3, skin)), P(FACE3, skin));
    scene.add(scene.clipped(faceUrl, P("M148 86 C148 116 132 138 100 142 C124 130 140 112 142 88Z", shade(skin, 0.12), 'opacity=".7"') + (showHair && H.front && !G.cover && !G.hood ? P(H.front, shade(skin, 0.16), 'transform="translate(0 4)"') : "")));
    for (const mark of scene.selected("marks")) scene.add(mark.draw(look));
    scene.add(scene.part("eyes").draw(look));
    if (!G.hidesMouth) scene.add(T([100, 113, 102.6, 116, 99, 118], shade(skin, 0.3), 1.4, 'opacity=".7"'), scene.part("mouth").draw(look));
    if (ear.top && showHair) scene.add(scene.outlined(ear.draw(look)));
    if (showHair && H.front) {
      scene.add(scene.outlined(underGear(P(H.front, hair) + (H.ties || []).map(([x, y]) => E(x, y, 6, 4.4, "#d9473a")).join(""))));
      if (H.strands) scene.add(underGear(H.strands.map((p) => T(p, luminance(hair) < 0.25 ? lighten(hair, 0.3) : shade(hair, 0.28), 1.6, 'opacity=".6"')).join("")));
      scene.add(underGear(scene.clipped(fringeUrl, T([66, 64, 100, 50, 134, 64], "#fff", 4.2, 'opacity=".3"'))));
    }
    if (showHair && H.shine) scene.add(E(86, 62, 12, 6, "#fff", 'opacity=".35" transform="rotate(-24 86 62)"'));
    if (G.front) scene.add(scene.outlined(G.front(gear)));
    if (weapon.p.front) scene.add(scene.outlined(weapon.p.front(weapon)));
    if (grips.length) scene.add(scene.outlined(grips.map((g) => hand(g.x, g.y, g.rot, skin)).join("")));
  }
  var Game = defineLibrary({
    key: "game",
    label: "\u30B2\u30FC\u30E0",
    idPrefix: "gm",
    parts: PARTS3,
    categories: CATEGORIES4,
    groups: GROUPS4,
    defaults: DEFAULTS4,
    presets: CHARACTERS3,
    palettes: PALETTES4,
    colorNames: NAMES3,
    outline: { color: LINE4, width: LINE_W4 },
    compose: compose4,
    random: randomAdventurer
  });

  // src/picker/styles.js
  var PICKER_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.ov { position: fixed; inset: 0; z-index: 2147483000; background: rgba(28, 20, 38, .5); display: grid; place-items: center;
  font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; color: #2b2233; -webkit-font-smoothing: antialiased; animation: fade .16s ease-out; }
@keyframes fade { from { opacity: 0 } }
@keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.985) } }
@keyframes swap { from { opacity: 0 } }
/* fixed size: content changes never resize the dialog */
.dlg { width: min(960px, calc(100vw - 48px)); height: min(680px, calc(100vh - 48px)); background: #fff; border-radius: 20px;
  box-shadow: 0 24px 64px rgba(28, 20, 38, .3); display: flex; flex-direction: column; overflow: hidden; animation: pop .22s cubic-bezier(.2,.8,.2,1); outline: none; }
.hd { flex: none; height: 60px; display: flex; align-items: center; gap: 12px; padding: 0 12px 0 20px; border-bottom: 1px solid #efeaf3; }
.hd h2 { font-size: 16px; margin: 0; font-weight: 700; white-space: nowrap; }
.hd .gap { flex: 1; }
.libs { display: flex; padding: 3px; background: #f4f1f7; border-radius: 10px; }
.libs button { font: inherit; font-size: 13px; padding: 5px 14px; border: none; border-radius: 8px; background: none; cursor: pointer; color: #6b5f78; }
.libs button.on { background: #fff; color: #2b2233; font-weight: 600; box-shadow: 0 1px 3px rgba(28,20,38,.12); }
.steps { display: flex; gap: 4px; font-size: 12px; color: #9a90a6; }
.steps span { padding: 4px 10px; border-radius: 999px; background: #f4f1f7; white-space: nowrap; }
.steps span.on { background: #2b2233; color: #fff; }
.x { flex: none; width: 36px; height: 36px; border-radius: 10px; border: none; background: none; cursor: pointer; display: grid; place-items: center; color: #7a6f85; }
.x:hover { background: #f4f1f7; }
.bd { flex: 1; min-height: 0; display: flex; }
.bd > * { flex: 1; min-width: 0; min-height: 0; animation: swap .14s ease-out; }
.sc { overflow-y: auto; scrollbar-gutter: stable; overscroll-behavior: contain; }
.ft { flex: none; height: 68px; display: flex; align-items: center; gap: 10px; padding: 0 20px; border-top: 1px solid #efeaf3; background: #fcfbfd; }
.ft .gap { flex: 1; }
.ft .msg { font-size: 13px; color: #6b5f78; }
button.btn { font: inherit; font-size: 14px; height: 40px; padding: 0 18px; border-radius: 12px; border: 1px solid #e3dde9; background: #fff; color: #2b2233; cursor: pointer; white-space: nowrap; }
button.btn:hover { border-color: #b9aec6; }
button.btn.pri { background: #2b2233; border-color: #2b2233; color: #fff; min-width: 112px; }
button.btn.pri:hover { background: #3d3247; }
button.btn.ghost { border-color: transparent; background: none; color: #6b5f78; }
button.btn.ghost:hover { background: #f4f1f7; }
button.btn.danger { background: #c0392b; border-color: #c0392b; color: #fff; }
button:focus-visible, .sw:focus-visible, .opt:focus-visible, .cand:focus-visible { outline: 2px solid #6b4fd8; outline-offset: 2px; }

/* step 1: candidates */
.pick { padding: 20px 20px 24px; }
.lead { font-size: 13px; color: #7a6f85; margin: 0 0 14px; }
.cands { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
.cand { position: relative; padding: 0; border: none; background: none; cursor: pointer; border-radius: 22%; aspect-ratio: 1; }
.cand svg { width: 100%; height: 100%; display: block; border-radius: 22%; transition: transform .12s ease; }
.cand:hover svg { transform: translateY(-2px); }
.cand::after { content: ""; position: absolute; inset: -4px; border-radius: 24%; border: 3px solid transparent; pointer-events: none; transition: border-color .1s; }
.cand.on::after { border-color: #2b2233; }
.cand .tag { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); font-size: 11px; background: rgba(255,255,255,.94); padding: 2px 8px; border-radius: 999px; white-space: nowrap; }

/* step 2: customize */
.edit { display: grid; grid-template-columns: 280px 1fr; }
.pvcol { padding: 20px; border-right: 1px solid #efeaf3; display: flex; flex-direction: column; gap: 12px; }
.pv { aspect-ratio: 1; width: 100%; }
.pv svg { width: 100%; height: 100%; display: block; border-radius: 22%; }
.acts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.acts .btn { font-size: 13px; height: 36px; padding: 0 8px; }
.ctl { display: flex; flex-direction: column; min-height: 0; }
.groups { flex: none; display: flex; gap: 4px; padding: 4px; margin: 16px 20px 0; background: #f4f1f7; border-radius: 12px; }
.groups button { flex: 1; min-width: 0; white-space: nowrap; font: inherit; font-size: 13px; height: 32px; padding: 0 4px; border: none; border-radius: 9px; background: none; cursor: pointer; color: #6b5f78; }
.groups button.on { background: #fff; color: #2b2233; font-weight: 600; box-shadow: 0 1px 3px rgba(28,20,38,.12); }
/* the sub-category row keeps its height even when a group has a single category */
.cats { flex: none; height: 46px; display: flex; align-items: center; gap: 6px; padding: 0 20px; overflow-x: auto; scrollbar-width: none; }
.cats button { flex: none; font: inherit; font-size: 12.5px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #e3dde9; background: #fff; cursor: pointer; color: #2b2233; }
.cats button.on { background: #2b2233; border-color: #2b2233; color: #fff; }
.edsc { flex: 1; min-height: 0; padding: 0 20px 20px; }
.colors { position: sticky; top: 0; z-index: 1; background: #fff; padding: 2px 0 12px; display: grid; gap: 8px; }
.crow { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.crow .lbl { font-size: 12px; color: #7a6f85; width: 100%; }
.sw { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #e3dde9; cursor: pointer; padding: 0; position: relative; flex: none; }
.sw.on { box-shadow: 0 0 0 2px #2b2233; }
.sw.t::after, .sw.auto::after { position: absolute; inset: 0; display: grid; place-items: center; font-size: 10px; font-weight: 700; }
.sw.t::after { content: "T"; color: #fff; text-shadow: 0 0 2px rgba(0,0,0,.5); }
.sw.auto { background: repeating-linear-gradient(45deg, #f4f1f7 0 4px, #e6e0ec 4px 8px) !important; }
.sw.auto::after { content: "\u81EA"; color: #6b5f78; }
.custom { position: relative; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; flex: none; box-shadow: 0 0 0 1px #e3dde9;
  background: conic-gradient(#f66, #fc6, #6c6, #6cf, #96f, #f6c, #f66); }
.custom input { position: absolute; inset: -6px; width: 40px; height: 40px; opacity: 0; cursor: pointer; }
.note { font-size: 12px; color: #9a90a6; margin: 0 0 10px; }
.opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
.opt { font: inherit; font-size: 11px; line-height: 1.3; padding: 4px 4px 6px; border-radius: 14px; border: 2px solid transparent; background: #f6f3f9; cursor: pointer; color: #4a4055; }
.opt .th { aspect-ratio: 1; margin-bottom: 4px; }
.opt svg { width: 100%; height: 100%; display: block; border-radius: 10px; }
.opt .nm { display: block; height: 1.3em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.opt:hover { border-color: #d6cde0; }
.opt.on { border-color: #2b2233; background: #fff; }

@media (max-width: 720px) {
  .dlg { width: 100vw; height: 100vh; height: 100dvh; border-radius: 0; }
  .steps { display: none; }
  .hd h2 { font-size: 15px; }
  .cands { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .edit { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .pvcol { flex-direction: row; align-items: center; padding: 12px 16px; border-right: none; border-bottom: 1px solid #efeaf3; }
  .pv { width: 96px; flex: none; }
  .acts { flex: 1; grid-template-columns: 1fr; }
  .groups { margin: 12px 16px 0; }
  .groups button { font-size: 12px; letter-spacing: -.02em; }
  .cats, .edsc { padding-left: 16px; padding-right: 16px; }
  .ft { padding: 0 16px; }
  .ft .btn:not(.pri) { padding: 0 12px; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
  var ICON_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

  // src/picker/index.js
  var CANDIDATES = 12;
  var TEXT = {
    title: "\u30A2\u30D0\u30BF\u30FC\u3092\u9078\u3076",
    styleTabs: "\u7D75\u67C4",
    stepPick: "1 \u9078\u3076",
    stepEdit: "2 \u30AB\u30B9\u30BF\u30DE\u30A4\u30BA",
    close: "\u9589\u3058\u308B",
    lead: "\u6C17\u306B\u5165\u3063\u305F\u3082\u306E\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002\u9078\u3093\u3060\u3042\u3068\u3067\u7D30\u304B\u304F\u5909\u3048\u3089\u308C\u307E\u3059\u3002",
    current: "\u3044\u307E\u306E\u30A2\u30D0\u30BF\u30FC",
    candidate: "\u5019\u88DC",
    more: "\u307B\u304B\u306E\u5019\u88DC",
    customize: "\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA",
    use: "\u3053\u308C\u306B\u3059\u308B",
    back: "\u2190 \u5019\u88DC\u306B\u623B\u308B",
    done: "\u6C7A\u5B9A",
    shuffle: "\u304A\u307E\u304B\u305B",
    revert: "\u5143\u306B\u623B\u3059",
    multi: "\u3044\u304F\u3064\u3067\u3082\u91CD\u306D\u3089\u308C\u307E\u3059\u3002",
    customColor: "\u307B\u304B\u306E\u8272",
    auto: "\u304A\u307E\u304B\u305B",
    theme: "\u30C6\u30FC\u30DE\u8272",
    unsaved: "\u7DE8\u96C6\u3057\u305F\u5185\u5BB9\u306F\u4FDD\u5B58\u3055\u308C\u307E\u305B\u3093\u3002",
    keepEditing: "\u7DE8\u96C6\u306B\u623B\u308B",
    discard: "\u9589\u3058\u308B"
  };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var clone = (v) => JSON.parse(JSON.stringify(v));
  var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  var toHex2 = (c) => /^#[0-9a-f]{6}$/i.test(c) ? c : "#888888";
  var cssEscape = (s) => globalThis.CSS && CSS.escape ? CSS.escape(s) : s;
  function lockPageScroll() {
    const html = document.documentElement, body = document.body;
    const saved = { overflow: html.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${scrollbar}px)`;
    return () => {
      html.style.overflow = saved.overflow;
      body.style.paddingRight = saved.paddingRight;
    };
  }
  function openPicker(options = {}) {
    const libs = [].concat(options.styles || []).filter(Boolean);
    if (!libs.length) throw new Error("omokage: openPicker() needs at least one style in `styles`");
    const text = { ...TEXT, ...options.text };
    const { hue } = options;
    const seed = options.seed || Math.random().toString(36).slice(2, 8);
    const current = options.value && options.value.config ? options.value : null;
    const startLib = libs.find((l) => l.KEY === current?.style) || libs[0];
    let lib = startLib;
    let step = "pick";
    let page = 0, candidates = [], selected = 0;
    let config = null, original = null, dirty = false, confirming = false;
    let group = 0, cat = null;
    const groups = () => lib.GROUPS || [{ label: "\u30D1\u30FC\u30C4", cats: lib.CATEGORIES.map((c) => c.key) }];
    const category = (key) => lib.CATEGORIES.find((c) => c.key === key);
    const render2 = (c, extra) => lib.render(c, { hue, ...extra });
    const complete = (c) => ({ ...lib.DEFAULTS, ...c });
    const compact = (c) => Object.fromEntries(Object.entries(c).filter(([k, v]) => !same(v, lib.DEFAULTS[k])));
    function makeCandidates() {
      const list = [];
      if (current && page === 0 && lib.KEY === current.style) list.push({ config: complete(current.config), tag: text.current });
      const seen = new Set(list.map((c) => JSON.stringify(c.config)));
      for (let i = 0; list.length < CANDIDATES && i < CANDIDATES * 4; i++) {
        const c = complete(lib.random(`${seed}:${lib.KEY}:${page}:${i}`)), key = JSON.stringify(c);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ config: c });
        }
      }
      candidates = list;
      selected = 0;
    }
    makeCandidates();
    const host = document.createElement("div");
    host.setAttribute("data-omokage-picker", "");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PICKER_CSS}</style><div class="ov"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="t" tabindex="-1">
    <div class="hd"><h2 id="t">${esc(options.title || text.title)}</h2><span class="gap"></span>
      ${libs.length > 1 ? `<div class="libs" role="tablist" aria-label="${esc(text.styleTabs)}">${libs.map((l) => `<button role="tab" data-lib="${l.KEY}">${esc(l.LABEL || l.KEY)}</button>`).join("")}</div>` : ""}
      <div class="steps" aria-hidden="true"><span data-s="pick">${esc(text.stepPick)}</span><span data-s="edit">${esc(text.stepEdit)}</span></div>
      <button class="x" aria-label="${esc(text.close)}" data-a="close">${ICON_X}</button></div>
    <div class="bd"></div><div class="ft"></div></div></div>`;
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const unlockScroll = lockPageScroll();
    const previousFocus = document.activeElement;
    document.body.appendChild(host);
    return new Promise((resolve) => {
      function finish(value) {
        document.removeEventListener("keydown", onKeydown, true);
        unlockScroll();
        host.remove();
        previousFocus?.focus?.({ preventScroll: true });
        resolve(value);
      }
      const decide = () => finish({ style: lib.KEY, config: compact(config), svg: render2(config) });
      const requestClose = () => {
        if (step === "edit" && dirty) {
          confirming = true;
          drawFooter();
          $(".ft [data-a=keep]").focus();
        } else finish(null);
      };
      function draw() {
        drawHeader();
        drawFooter();
        step === "pick" ? drawCandidates() : drawEditor({ resetScroll: true });
      }
      function drawHeader() {
        $$(".steps span").forEach((s) => s.classList.toggle("on", s.dataset.s === step));
        $$(".libs button").forEach((b) => {
          const on = b.dataset.lib === lib.KEY;
          b.classList.toggle("on", on);
          b.setAttribute("aria-selected", on);
          b.disabled = step === "edit";
        });
      }
      function drawFooter() {
        $(".ft").innerHTML = confirming ? `<span class="msg">${esc(text.unsaved)}</span><span class="gap"></span><button class="btn" data-a="keep">${esc(text.keepEditing)}</button><button class="btn danger" data-a="discard">${esc(text.discard)}</button>` : step === "pick" ? `<button class="btn ghost" data-a="more">${esc(text.more)}</button><span class="gap"></span><button class="btn" data-a="custom">${esc(text.customize)}</button><button class="btn pri" data-a="use">${esc(text.use)}</button>` : `<button class="btn ghost" data-a="back">${esc(text.back)}</button><span class="gap"></span><button class="btn pri" data-a="use">${esc(text.done)}</button>`;
      }
      function drawCandidates() {
        $(".bd").innerHTML = `<div class="sc pick"><p class="lead">${esc(text.lead)}</p>
        <div class="cands" role="listbox" aria-label="${esc(text.candidate)}">${candidates.map((c, i) => `<button class="cand ${i === selected ? "on" : ""}" role="option" data-i="${i}" aria-selected="${i === selected}" aria-label="${esc(text.candidate)} ${i + 1}${c.tag ? `\uFF08${esc(c.tag)}\uFF09` : ""}" tabindex="${i === selected ? 0 : -1}">${render2(c.config)}${c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ""}</button>`).join("")}</div></div>`;
      }
      function selectCandidate(i) {
        selected = i;
        $$(".cand").forEach((b, j) => {
          const on = j === i;
          b.classList.toggle("on", on);
          b.setAttribute("aria-selected", on);
          b.tabIndex = on ? 0 : -1;
        });
      }
      function buildEditor() {
        $(".bd").innerHTML = `<div class="edit">
        <div class="pvcol"><div class="pv" aria-live="polite"></div><div class="acts"><button class="btn" data-a="shuffle">${esc(text.shuffle)}</button><button class="btn" data-a="revert">${esc(text.revert)}</button></div></div>
        <div class="ctl"><div class="groups" role="tablist">${groups().map((g, i) => `<button role="tab" data-g="${i}">${esc(g.label)}</button>`).join("")}</div>
          <div class="cats"></div><div class="sc edsc"><div class="colors"></div><div class="optwrap"></div></div></div></div>`;
      }
      function drawEditor({ resetScroll = false } = {}) {
        if (!$(".edit")) buildEditor();
        const C2 = category(cat), parts = lib.PARTS[cat], cats = groups()[group].cats;
        $(".pv").innerHTML = render2(config);
        $$(".groups button").forEach((b, i) => {
          b.classList.toggle("on", i === group);
          b.setAttribute("aria-selected", i === group);
        });
        $(".cats").innerHTML = cats.length > 1 ? cats.map((k) => `<button class="${k === cat ? "on" : ""}" data-c="${k}" aria-pressed="${k === cat}">${esc(category(k).label)}</button>`).join("") : "";
        $(".colors").innerHTML = (C2.colors || []).map((slot) => `<div class="crow" role="group" aria-label="${esc(slot.label)}"><span class="lbl">${esc(slot.label)}</span>${slot.palette.map((v) => swatch(slot.key, v)).join("")}<label class="custom" title="${esc(text.customColor)}"><input type="color" aria-label="${esc(slot.label)}\uFF1A${esc(text.customColor)}" data-ck="${slot.key}" value="${toHex2(lib.resolve(config[slot.key] ?? lib.DEFAULTS[slot.key], hue))}"></label></div>`).join("");
        $(".colors").style.display = C2.colors ? "" : "none";
        const scroller = $(".edsc"), top = resetScroll ? 0 : scroller.scrollTop;
        $(".optwrap").innerHTML = (C2.multi ? `<p class="note">${esc(text.multi)}</p>` : "") + (parts ? `<div class="opts" role="listbox" aria-label="${esc(C2.label)}">${parts.map((p) => option(C2, p)).join("")}</div>` : "");
        scroller.scrollTop = top;
      }
      function option(C2, p) {
        let on, next;
        if (C2.multi) {
          const set = new Set(config[C2.key] || []);
          on = set.has(p.id);
          on ? set.delete(p.id) : set.add(p.id);
          next = [...set];
        } else {
          on = config[C2.key] === p.id;
          next = p.id;
        }
        return `<button class="opt ${on ? "on" : ""}" role="option" data-pid="${p.id}" aria-selected="${on}"><div class="th">${render2({ ...config, [C2.key]: next }, { viewBox: C2.view })}</div><span class="nm">${esc(p.label)}</span></button>`;
      }
      function swatch(key, v) {
        const on = (config[key] ?? lib.DEFAULTS[key]) === v, theme = v.startsWith("theme"), auto = v === "auto";
        const name = auto ? text.auto : theme ? text.theme : lib.colorName(v);
        return `<button class="sw ${on ? "on" : ""} ${theme ? "t" : ""} ${auto ? "auto" : ""}" style="background:${lib.resolve(v, hue)}" data-ck="${key}" data-cv="${v}" title="${esc(name)}" aria-label="${esc(name)}" aria-pressed="${on}"></button>`;
      }
      const showCategory = (key, g = group) => {
        group = g;
        cat = key;
        drawEditor({ resetScroll: true });
      };
      const edit = (fn) => {
        fn();
        dirty = true;
        drawEditor();
      };
      const toggleOrSet = (pid) => {
        if (category(cat).multi) {
          const set = new Set(config[cat] || []);
          set.has(pid) ? set.delete(pid) : set.add(pid);
          config[cat] = [...set];
        } else config[cat] = pid;
      };
      function startEditing() {
        config = clone(candidates[selected].config);
        original = clone(config);
        dirty = false;
        step = "edit";
        if (!cat || !category(cat)) {
          group = 0;
          cat = groups()[0].cats[0];
        }
        draw();
      }
      function switchLibrary(key) {
        lib = libs.find((l) => l.KEY === key);
        page = 0;
        cat = null;
        group = 0;
        makeCandidates();
        draw();
      }
      root.addEventListener("click", (e) => {
        const t = e.target.closest("button");
        if (!t || t.disabled) return;
        const { a, lib: libKey, i, g, c, ck, cv, pid } = t.dataset;
        if (a === "close") return requestClose();
        if (a === "keep") {
          confirming = false;
          return drawFooter();
        }
        if (a === "discard") return finish(null);
        if (libKey && libKey !== lib.KEY) return switchLibrary(libKey);
        if (i !== void 0) return selectCandidate(+i);
        if (a === "more") {
          page++;
          makeCandidates();
          drawCandidates();
          return $(".cand").focus({ preventScroll: true });
        }
        if (a === "custom") return startEditing();
        if (a === "use") {
          if (step === "pick") config = clone(candidates[selected].config);
          return decide();
        }
        if (a === "back") {
          step = "pick";
          confirming = false;
          return draw();
        }
        if (a === "shuffle") return edit(() => {
          config = complete(lib.random(Math.random().toString(36).slice(2)));
        });
        if (a === "revert") {
          config = clone(original);
          dirty = false;
          return drawEditor();
        }
        if (g !== void 0) return showCategory(groups()[+g].cats[0], +g);
        if (c) return showCategory(c);
        if (ck) return edit(() => {
          config[ck] = cv;
        });
        if (pid) {
          edit(() => toggleOrSet(pid));
          $(`.opt[data-pid="${cssEscape(pid)}"]`)?.focus({ preventScroll: true });
        }
      });
      root.addEventListener("dblclick", (e) => {
        const tile = e.target.closest(".cand");
        if (!tile) return;
        selectCandidate(+tile.dataset.i);
        config = clone(candidates[selected].config);
        decide();
      });
      root.addEventListener("input", (e) => {
        if (e.target.type !== "color") return;
        config[e.target.dataset.ck] = e.target.value;
        dirty = true;
        $(".pv").innerHTML = render2(config);
      });
      root.addEventListener("change", (e) => {
        if (e.target.type === "color") drawEditor();
      });
      function onKeydown(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          if (confirming) {
            confirming = false;
            drawFooter();
          } else requestClose();
          return;
        }
        if (e.key === "Tab") return trapFocus(e);
        if (e.key.startsWith("Arrow")) moveInGrid(e);
      }
      function trapFocus(e) {
        const focusable = $$("button:not([disabled]), input, [tabindex='0']").filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
        if (!focusable.length) return;
        const i = focusable.indexOf(root.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          focusable.at(-1).focus();
        } else if (!e.shiftKey && (i === -1 || i === focusable.length - 1)) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
      function moveInGrid(e) {
        const current2 = root.activeElement;
        const grid = current2?.closest(".cands, .opts, .crow");
        if (!grid) return;
        const items = [...grid.querySelectorAll(".cand, .opt, .sw")];
        const i = items.indexOf(current2);
        if (i < 0) return;
        let j = i;
        if (e.key === "ArrowLeft") j = Math.max(0, i - 1);
        else if (e.key === "ArrowRight") j = Math.min(items.length - 1, i + 1);
        else {
          const r = current2.getBoundingClientRect(), dir = e.key === "ArrowDown" ? 1 : -1;
          let best = Infinity;
          items.forEach((el, k) => {
            const q = el.getBoundingClientRect();
            if ((q.top - r.top) * dir <= 4) return;
            const d = Math.abs(q.top - r.top) * 4 + Math.abs(q.left - r.left);
            if (d < best) {
              best = d;
              j = k;
            }
          });
        }
        if (j === i) return;
        e.preventDefault();
        if (items[j].classList.contains("cand")) selectCandidate(j);
        items[j].focus();
        items[j].scrollIntoView({ block: "nearest" });
      }
      document.addEventListener("keydown", onKeydown, true);
      draw();
      ($(".cand.on") || $(".dlg")).focus({ preventScroll: true });
    });
  }

  // src/mount.js
  function mount(el, avatar, options = {}, { render: render2 }) {
    el.innerHTML = render2(avatar, options).replace("<svg ", '<svg width="100%" height="100%" role="img" aria-label="avatar" ');
    return el;
  }
  function mountAll(root, api) {
    const nodes = (root || document).querySelectorAll("[data-omokage]");
    for (const el of nodes) {
      const style = el.dataset.omokage || "officers";
      const hue = el.dataset.hue !== void 0 ? Number(el.dataset.hue) : void 0;
      const avatar = el.dataset.config ? { style, config: JSON.parse(el.dataset.config) } : api.random(el.dataset.seed || el.textContent.trim() || "omokage", { style });
      mount(el, avatar, { hue }, api);
    }
    return nodes.length;
  }

  // src/index.js
  var VERSION = true ? "0.2.0" : "dev";
  var registry = /* @__PURE__ */ new Map();
  function registerStyle(style) {
    if (!style || !style.KEY || typeof style.render !== "function") throw new Error("omokage: registerStyle() expects a library made with defineLibrary()");
    registry.set(style.KEY, style);
    return style;
  }
  [Officers, Yokai, Animals, Game].forEach(registerStyle);
  var listStyles = () => [...registry.values()];
  function getStyle(key) {
    const style = registry.get(key);
    if (!style) throw new Error(`omokage: unknown style "${key}" (available: ${[...registry.keys()].join(", ")})`);
    return style;
  }
  function render(avatar, options = {}) {
    return getStyle(avatar.style).render(avatar.config || {}, options);
  }
  function random(seed, { style = "officers" } = {}) {
    return { style, config: getStyle(style).random(seed) };
  }
  function presets(style) {
    return getStyle(style).PRESETS.map(({ label, ...config }) => ({ label, avatar: { style, config } }));
  }
  var toDataURI = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  function openPicker2(options = {}) {
    const styles = (options.styles || listStyles()).map((s) => typeof s === "string" ? getStyle(s) : s);
    return openPicker({ ...options, styles });
  }
  var mount2 = (el, avatar, options = {}) => mount(el, avatar, options, { render });
  var mountAll2 = (root) => mountAll(root, { render, random });

  // src/browser.js
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountAll2());
    else mountAll2();
  }
  return __toCommonJS(browser_exports);
})();
