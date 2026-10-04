// Entry of the <script> build (global `Omokage`): everything from index.js, plus
// [data-omokage] elements are rendered automatically once the page has loaded.
import { mountAll } from "./index.js";

export * from "./index.js";

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountAll());
  else mountAll();
}
