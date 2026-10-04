#!/usr/bin/env node
// Sanity checks for every style: all parts render, presets render, random() is
// deterministic and only uses known parts, and the built bundle exposes the API.
import assert from "node:assert/strict";
import * as omokage from "../src/index.js";

let renders = 0;
for (const style of omokage.listStyles()) {
  const { KEY, PARTS, CATEGORIES, DEFAULTS, PRESETS } = style;
  for (const [cat, parts] of Object.entries(PARTS)) {
    const multi = CATEGORIES.find((c) => c.key === cat)?.multi;
    assert.equal(new Set(parts.map((p) => p.id)).size, parts.length, `${KEY}.${cat}: duplicate part ids`);
    for (const p of parts) {
      assert.ok(p.label, `${KEY}.${cat}.${p.id}: missing label`);
      const svg = style.render({ [cat]: multi ? [p.id] : p.id });
      assert.ok(svg.startsWith("<svg") && !svg.includes("undefined") && !svg.includes("NaN"), `${KEY}.${cat}.${p.id}: bad SVG`);
      renders++;
    }
  }
  for (const preset of PRESETS) { style.render(preset); renders++; }
  for (let i = 0; i < 50; i++) {
    const a = style.random(`check${i}`), b = style.random(`check${i}`);
    assert.deepEqual(a, b, `${KEY}: random() is not deterministic`);
    for (const [k, v] of Object.entries(a)) {
      if (PARTS[k]) for (const id of [].concat(v)) assert.ok(PARTS[k].some((p) => p.id === id), `${KEY}: random() picked unknown ${k} "${id}"`);
      else assert.ok(k in DEFAULTS, `${KEY}: random() set unknown key "${k}"`);
    }
    style.render(a); renders++;
  }
  // every category in a group, every group category defined
  for (const g of style.GROUPS) for (const c of g.cats) assert.ok(CATEGORIES.some((k) => k.key === c), `${KEY}: group "${g.label}" has unknown category ${c}`);
}

const bundle = await import("../dist/omokage.esm.js");
for (const name of ["render", "random", "openPicker", "mount", "mountAll", "listStyles", "getStyle", "registerStyle", "defineLibrary", "presets", "toDataURI"]) {
  assert.equal(typeof bundle[name], "function", `dist is missing ${name}()`);
}
const noIds = (svg) => svg.replace(/\b(of|yk|an|gm)\d+/g, "$1#");   // each render gets a fresh id
assert.equal(noIds(bundle.render(bundle.random("x", { style: "game" }))), noIds(omokage.render(omokage.random("x", { style: "game" }))), "dist renders differently from src");

console.log(`ok — ${renders} renders across ${omokage.listStyles().length} styles, dist v${bundle.VERSION}`);
