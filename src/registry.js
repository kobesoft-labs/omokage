// The registry of avatar styles, shared by every layer (rendering, model, editor, picker).

const registry = new Map();

/** Makes a style available everywhere by its KEY. */
export function registerStyle(style) {
  if (!style || !style.KEY || typeof style.render !== "function") {
    throw new Error("omokage: registerStyle() expects a library made with defineLibrary()");
  }
  registry.set(style.KEY, style);
  return style;
}

/** All registered styles, in registration order. */
export const listStyles = () => [...registry.values()];

/** The style with this KEY. Throws for unknown keys. */
export function getStyle(key) {
  const style = registry.get(key);
  if (!style) throw new Error(`omokage: unknown style "${key}" (available: ${[...registry.keys()].join(", ")})`);
  return style;
}

export const hasStyle = (key) => registry.has(key);

/** Accepts style keys or style objects (or nothing, meaning all) and returns style objects. */
export const resolveStyles = (list) => (list && list.length ? list : listStyles()).map((s) => (typeof s === "string" ? getStyle(s) : s));
