#!/usr/bin/env node
// Builds the distributable files from src/.
//   dist/omokage.js        <script> build, readable (global `Omokage`)
//   dist/omokage.min.js    <script> build, minified — the one to load from a CDN
//   dist/omokage.esm.js    ES module build, minified — `import { render } from ".../omokage.esm.js"`
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const banner = { js: `/*! omokage v${pkg.version} | BSD-3-Clause | https://github.com/kobesoft-labs/omokage */` };
const common = { bundle: true, target: "es2020", banner, legalComments: "none", logLevel: "warning", define: { __VERSION__: JSON.stringify(pkg.version) } };

await Promise.all([
  build({ ...common, entryPoints: [path.join(root, "src/browser.js")], format: "iife", globalName: "Omokage", outfile: path.join(root, "dist/omokage.js") }),
  build({ ...common, entryPoints: [path.join(root, "src/browser.js")], format: "iife", globalName: "Omokage", minify: true, outfile: path.join(root, "dist/omokage.min.js") }),
  build({ ...common, entryPoints: [path.join(root, "src/index.js")], format: "esm", minify: true, outfile: path.join(root, "dist/omokage.esm.js") }),
]);
for (const f of ["omokage.js", "omokage.min.js", "omokage.esm.js"]) {
  const size = (await fs.stat(path.join(root, "dist", f))).size;
  console.log(`dist/${f}  ${(size / 1024).toFixed(0)}KB`);
}
