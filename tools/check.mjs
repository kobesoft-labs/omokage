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

// model layer: catalog is plain JSON, editor round-trips, validate() cleans untrusted input
for (const style of omokage.listStyles()) {
  const c = omokage.catalog(style.KEY);
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(c))), JSON.stringify(c), `${style.KEY}: catalog is not plain JSON`);
  for (const g of c.groups) for (const k of g.categories) assert.ok(c.categories.some((x) => x.key === k));
  const e = omokage.createEditor({ styles: [style.KEY], seed: "check" });
  const start = e.value();
  for (const cat of c.categories) {
    if (cat.parts.length) e.select(cat.key, cat.parts.at(-1).id);
    for (const slot of cat.colors) e.setColor(slot.key, slot.swatches.at(-1).value);
  }
  assert.ok(e.getState().dirty, `${style.KEY}: editor not dirty after edits`);
  const edited = e.value();
  assert.deepEqual(omokage.validate(edited), { ok: true, value: edited, errors: [] }, `${style.KEY}: editor produced an invalid avatar`);
  e.revert();
  assert.deepEqual(e.value(), start, `${style.KEY}: revert did not restore`);
  e.undo();
  assert.deepEqual(e.value(), edited, `${style.KEY}: undo of revert did not restore the edits`);
  const bad = omokage.validate({ style: style.KEY, config: { nope: 1, [c.categories.find((x) => x.parts.length).key]: "<script>" } });
  assert.ok(!bad.ok && bad.errors.length === 2 && Object.keys(bad.value.config).length === 0, `${style.KEY}: validate() let bad input through`);
}
assert.ok(!omokage.validate({ style: "nope" }).ok);

const bundle = await import("../dist/omokage.esm.js");
for (const name of ["render", "random", "openPicker", "mount", "mountAll", "listStyles", "getStyle", "registerStyle", "defineLibrary", "presets", "toDataURI",
                    "catalog", "createEditor", "validate", "normalize", "complete", "compact", "schemaOf"]) {
  assert.equal(typeof bundle[name], "function", `dist is missing ${name}()`);
}
const noIds = (svg) => svg.replace(/\b(of|yk|an|gm)\d+/g, "$1#");   // each render gets a fresh id
assert.equal(noIds(bundle.render(bundle.random("x", { style: "game" }))), noIds(omokage.render(omokage.random("x", { style: "game" }))), "dist renders differently from src");

console.log(`ok — ${renders} renders across ${omokage.listStyles().length} styles, dist v${bundle.VERSION}`);
