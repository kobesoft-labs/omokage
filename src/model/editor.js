// A headless avatar editor: all state and actions of an avatar customizer, without any UI.
// The built-in picker is one client of it; a custom UI (React, Vue, server-rendered…) can be
// another. Pair it with catalog() to know what to offer.
//
//   const editor = createEditor({ value: saved, styles: ["officers", "animals"] });
//   editor.subscribe((state) => redraw(state));
//   editor.select("hair", "bob");
//   editor.setColor("hairColor", "#a9523b");
//   save(editor.value());                       // { style, config } (compact)
import { getStyle, resolveStyles } from "../registry.js";
import { complete, compact, normalize } from "./avatar.js";
import { catalog } from "./catalog.js";

const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HISTORY = 100;

/**
 * @param {object}   [options]
 * @param {(string|object)[]} [options.styles] styles to offer (default: all registered)
 * @param {{style: string, config?: object}} [options.value] the avatar to start from
 * @param {number}   [options.hue]   company theme hue, used for previews and swatches
 * @param {string}   [options.seed]  seed for candidates and the initial avatar
 */
export function createEditor(options = {}) {
  const styles = resolveStyles(options.styles);
  const seed = options.seed || Math.random().toString(36).slice(2, 8);
  const hue = options.hue;
  const listeners = new Set();

  const start = options.value && styles.some((s) => s.KEY === options.value.style)
    ? normalize(options.value)
    : { style: styles[0].KEY, config: styles[0].random(seed) };

  // state.config is always the complete config of state.style
  let state = { style: start.style, config: complete(start.style, start.config) };
  let baseline = clone(state);
  let past = [], future = [];

  const emit = () => { const s = editor.getState(); for (const fn of listeners) fn(s); };
  const commit = (next, { record = true } = {}) => {
    if (same(next, state)) return;
    if (record) { past.push(state); if (past.length > HISTORY) past.shift(); future = []; }
    state = next;
    emit();
  };
  const lib = () => getStyle(state.style);
  const isMulti = (cat) => !!lib().CATEGORIES.find((c) => c.key === cat)?.multi;

  const editor = {
    /** { style, config (complete), dirty, canUndo, canRedo } */
    getState: () => ({ style: state.style, config: clone(state.config), dirty: !same(state, baseline), canUndo: past.length > 0, canRedo: future.length > 0 }),
    /** Calls `fn(state)` after every change. Returns an unsubscribe function. */
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** The styles on offer: [{ key, label }]. */
    styles: () => styles.map((s) => ({ key: s.KEY, label: s.LABEL })),
    /** What the current style offers (see catalog()). */
    catalog: () => catalog(state.style, { hue }),

    // ------------------------------------------------------------ reading
    /** The selected part id (or ids, for multi categories) of a category. */
    selected: (cat) => clone(state.config[cat]),
    isSelected: (cat, id) => [].concat(state.config[cat] ?? []).includes(id),
    /** A color slot: { value, hex }. */
    color: (key) => ({ value: state.config[key], hex: lib().resolve(state.config[key], hue) }),
    /** The avatar to store: { style, config } with only non-default keys. */
    value: () => ({ style: state.style, config: compact(state.style, state.config) }),

    // ------------------------------------------------------------ editing
    /** Selects a part. In multi categories this toggles it. */
    select(cat, id) {
      const value = isMulti(cat)
        ? (editor.isSelected(cat, id) ? state.config[cat].filter((x) => x !== id) : [...(state.config[cat] || []), id])
        : id;
      commit({ ...state, config: { ...state.config, [cat]: value } });
    },
    /** Sets a color slot to a hex color or a palette token ("auto", "theme", …). */
    setColor(key, value) { commit({ ...state, config: { ...state.config, [key]: value } }); },
    /** Sets several config keys at once (one undo step). */
    patch(partial) { commit({ ...state, config: { ...state.config, ...partial } }); },
    /** Switches style. Starts from a seeded avatar of that style unless `config` is given. */
    setStyle(key, config) {
      if (!styles.some((s) => s.KEY === key)) throw new Error(`omokage: style "${key}" is not offered by this editor`);
      commit({ style: key, config: complete(key, config || getStyle(key).random(`${seed}:${key}`)) });
    },
    /** Replaces the whole avatar with a random one of the current style. */
    randomize(by = Math.random().toString(36).slice(2)) { commit({ ...state, config: complete(state.style, lib().random(by)) }); },
    /** Loads an avatar and makes it the new baseline (no longer dirty, history cleared). */
    load(avatar) {
      const v = normalize(avatar);
      state = { style: v.style, config: complete(v.style, v.config) };
      baseline = clone(state); past = []; future = [];
      emit();
    },
    /** Goes back to the baseline (the loaded avatar). Undoable. */
    revert() { commit(clone(baseline)); },
    undo() { if (!past.length) return; future.push(state); state = past.pop(); emit(); },
    redo() { if (!future.length) return; past.push(state); state = future.pop(); emit(); },

    // ------------------------------------------------------------ pictures
    /** The current avatar as SVG. */
    preview: (renderOptions = {}) => lib().render(state.config, { hue, ...renderOptions }),
    /** The current avatar with one part swapped in, framed on that category — for option tiles. */
    thumbnail(cat, id, renderOptions = {}) {
      const C = lib().CATEGORIES.find((c) => c.key === cat);
      const value = C?.multi
        ? (editor.isSelected(cat, id) ? state.config[cat] : [...(state.config[cat] || []), id])
        : id;
      return lib().render({ ...state.config, [cat]: value }, { hue, viewBox: C?.view || undefined, ...renderOptions });
    },
    /** A color swatch preview: the current avatar with this color applied. */
    swatchPreview: (key, value, renderOptions = {}) => lib().render({ ...state.config, [key]: value }, { hue, ...renderOptions }),
    /**
     * Seeded candidates of a style (default: the current one), e.g. for a "pick one" grid.
     * `include` puts an avatar first (marked current: true); duplicates are skipped.
     * @returns {{ avatar: {style, config}, svg: string, current: boolean }[]}
     */
    candidates({ style = state.style, page = 0, count = 12, include = null } = {}) {
      const S = getStyle(style), list = [], seen = new Set();
      const push = (config, current) => {
        const full = complete(style, config), key = JSON.stringify(full);
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ avatar: { style, config: compact(style, full) }, svg: S.render(full, { hue }), current });
      };
      if (include && include.style === style && page === 0) push(normalize(include).config, true);
      for (let i = 0; list.length < count && i < count * 4; i++) push(S.random(`${seed}:${style}:${page}:${i}`), false);
      return list;
    },
  };
  return editor;
}
