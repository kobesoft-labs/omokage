// A tiny SVG drawing vocabulary shared by every style.
//
// Part definitions are dense drawing data, so the primitives use short names:
//   P(d, fill)            filled path
//   S(d, stroke, width)   stroked path with round caps and joins
//   T(points, fill, t)    tapered stroke: thick in the middle, sharp at both ends
//   C / E                 circle / ellipse
//   M(svg) / both(svg)    mirror across x = 100 / the shape plus its mirror
// The trailing `extra` argument is raw attribute text, e.g. 'opacity=".5"'.
// All styles draw on a 200 x 200 canvas whose vertical axis is x = 100.

export const f2 = (v) => +v.toFixed(2);

export const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;

export const S = (d, stroke, width = 3, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

export const C = (cx, cy, r, fill, extra = "") => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${r}" fill="${fill}" ${extra}/>`;

export const E = (cx, cy, rx, ry, fill, extra = "") =>
  `<ellipse cx="${f2(cx)}" cy="${f2(cy)}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;

export const M = (svg) => `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
export const both = (svg) => svg + M(svg);

/**
 * Turns the quadratic curve (x0,y0) → (cx,cy) → (x1,y1) into a closed shape that is
 * `t` thick at the middle and comes to a point at both ends — the brush-like line
 * used for brows, closed eyes, mouths and hair strands.
 */
export function taper(x0, y0, cx, cy, x1, y1, t) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * t, ny = (dx / len) * t;
  return `M${f2(x0)} ${f2(y0)} Q${f2(cx + nx)} ${f2(cy + ny)} ${f2(x1)} ${f2(y1)} Q${f2(cx - nx)} ${f2(cy - ny)} ${f2(x0)} ${f2(y0)}Z`;
}
export const T = (points, fill, t, extra = "") => `<path d="${taper(...points, t)}" fill="${fill}" ${extra}/>`;

/** Reads the numbers of a "M x0 y0 Q cx cy x1 y1" string, for use with T(). */
export const quadPoints = (d) => d.match(/-?[\d.]+/g).map(Number);

/**
 * A scalloped line along an ellipse from angle a0 to a1 (degrees), made of `n`
 * bumps of height `bump`. dir = 1 bulges outward, -1 inward. Used for curly hair,
 * manes, wool and fluff. Pass `withMove = false` to continue an existing path.
 */
export function wave(cx, cy, rx, ry, a0, a1, n, bump, dir = 1, withMove = true) {
  const at = (a) => [cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)];
  let d = "";
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(a0 + ((a1 - a0) * i) / n), [x1, y1] = at(a0 + ((a1 - a0) * (i + 1)) / n);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(mx - cx, my - cy) || 1;
    d += (i === 0 && withMove ? `M${f2(x0)} ${f2(y0)} ` : "") +
      `Q${f2(mx + ((mx - cx) / l) * bump * dir)} ${f2(my + ((my - cy) / l) * bump * dir)} ${f2(x1)} ${f2(y1)} `;
  }
  return d;
}

/** Points [x, y, r] spread along an arc — e.g. a string of pearls. */
export function ring(cx, cy, radius, n, r, a0 = 0, a1 = 360) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a), r];
  });
}

/** A soft radial blush that fades out at the edge. */
export const blushGradient = (id, color = "#ff6f73", alpha = 0.5, middle = alpha / 2) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${alpha}"/>` +
  `<stop offset=".6" stop-color="${color}" stop-opacity="${middle}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
