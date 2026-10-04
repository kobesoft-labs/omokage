// The avatar picker: a modal dialog to choose an avatar and then customize it.
// It is a thin view over the headless editor (model/editor.js) and the catalog
// (model/catalog.js); a custom UI can use those two directly and behave the same way.
//
//   const avatar = await openPicker({ styles: [Officers, Yokai], value: saved, hue, seed });
//   if (avatar) save(avatar);   // { style, config, svg }, or null when cancelled
//
// UX guarantees
//   - The dialog keeps one size while open; steps, tabs and pages never resize it.
//   - Selecting something never moves the scroll position.
//   - The page behind stops scrolling without shifting sideways.
//   - Keyboard: Tab cycles inside, arrow keys move between tiles, Enter selects, Esc closes.
//   - Closing with unsaved edits asks for confirmation in place.
import { PICKER_CSS, ICON_X } from "./styles.js";
import { createEditor } from "../model/editor.js";

const CANDIDATES = 12;

const TEXT = {
  title: "アバターを選ぶ",
  styleTabs: "絵柄",
  stepPick: "1 選ぶ",
  stepEdit: "2 カスタマイズ",
  close: "閉じる",
  lead: "気に入ったものを選んでください。選んだあとで細かく変えられます。",
  current: "いまのアバター",
  candidate: "候補",
  more: "ほかの候補",
  customize: "カスタマイズ",
  use: "これにする",
  back: "← 候補に戻る",
  done: "決定",
  shuffle: "おまかせ",
  revert: "元に戻す",
  multi: "いくつでも重ねられます。",
  customColor: "ほかの色",
  auto: "おまかせ",
  theme: "テーマ色",
  unsaved: "編集した内容は保存されません。",
  keepEditing: "編集に戻る",
  discard: "閉じる",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const toHex = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : "#888888");
const cssEscape = (s) => (globalThis.CSS && CSS.escape ? CSS.escape(s) : s);

/** Stops the page from scrolling and pads the body so nothing shifts when the scrollbar disappears. */
function lockPageScroll() {
  const html = document.documentElement, body = document.body;
  const saved = { overflow: html.style.overflow, paddingRight: body.style.paddingRight };
  const scrollbar = window.innerWidth - html.clientWidth;
  html.style.overflow = "hidden";
  if (scrollbar > 0) body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${scrollbar}px)`;
  return () => { html.style.overflow = saved.overflow; body.style.paddingRight = saved.paddingRight; };
}

/**
 * Opens the picker.
 * @param {object}   options
 * @param {(string|object)[]} [options.styles] styles to offer, as keys or style objects (default: all)
 * @param {{style: string, config: object}} [options.value] the current avatar, shown first
 * @param {number}   [options.hue]  company theme hue (used by styles with theme colors)
 * @param {string}   [options.seed] seed for the candidates, e.g. the user name
 * @param {object}   [options.text] overrides for the UI strings (see TEXT)
 * @returns {Promise<{style: string, config: object, svg: string} | null>}
 */
export function openPicker(options = {}) {
  const text = { ...TEXT, ...options.text };
  const current = options.value && options.value.config ? options.value : null;
  const editor = createEditor({ styles: options.styles, value: current, hue: options.hue, seed: options.seed });
  const styles = editor.styles();

  // ---------------------------------------------------------------- view state
  let step = "pick";                  // "pick" | "edit"
  let pickStyle = editor.getState().style, page = 0, candidates = [], selected = 0;
  let confirming = false, group = 0, cat = null;
  const makeCandidates = () => {
    candidates = editor.candidates({ style: pickStyle, page, count: CANDIDATES, include: current });
    selected = 0;
  };
  makeCandidates();

  // ---------------------------------------------------------------- shell
  const host = document.createElement("div");
  host.setAttribute("data-omokage-picker", "");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${PICKER_CSS}</style><div class="ov"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="t" tabindex="-1">
    <div class="hd"><h2 id="t">${esc(options.title || text.title)}</h2><span class="gap"></span>
      ${styles.length > 1 ? `<div class="libs" role="tablist" aria-label="${esc(text.styleTabs)}">${styles.map((s) => `<button role="tab" data-lib="${s.key}">${esc(s.label)}</button>`).join("")}</div>` : ""}
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
      unsubscribe();
      unlockScroll();
      host.remove();
      previousFocus?.focus?.({ preventScroll: true });
      resolve(value);
    }
    const decide = () => finish({ ...editor.value(), svg: editor.preview() });
    const requestClose = () => {
      if (step === "edit" && editor.getState().dirty) { confirming = true; drawFooter(); $(".ft [data-a=keep]").focus(); }
      else finish(null);
    };
    // Every edit redraws the editor view (the editor notifies us).
    const unsubscribe = editor.subscribe(() => { if (step === "edit") drawEditor(); });

    // -------------------------------------------------------------- drawing
    function draw() {
      drawHeader();
      drawFooter();
      step === "pick" ? drawCandidates() : drawEditor({ resetScroll: true });
    }

    function drawHeader() {
      $$(".steps span").forEach((s) => s.classList.toggle("on", s.dataset.s === step));
      $$(".libs button").forEach((b) => {
        const on = b.dataset.lib === pickStyle;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on);
        b.disabled = step === "edit";
      });
    }

    // Buttons keep their positions across steps.
    function drawFooter() {
      $(".ft").innerHTML = confirming
        ? `<span class="msg">${esc(text.unsaved)}</span><span class="gap"></span><button class="btn" data-a="keep">${esc(text.keepEditing)}</button><button class="btn danger" data-a="discard">${esc(text.discard)}</button>`
        : step === "pick"
          ? `<button class="btn ghost" data-a="more">${esc(text.more)}</button><span class="gap"></span><button class="btn" data-a="custom">${esc(text.customize)}</button><button class="btn pri" data-a="use">${esc(text.use)}</button>`
          : `<button class="btn ghost" data-a="back">${esc(text.back)}</button><span class="gap"></span><button class="btn pri" data-a="use">${esc(text.done)}</button>`;
    }

    function drawCandidates() {
      $(".bd").innerHTML = `<div class="sc pick"><p class="lead">${esc(text.lead)}</p>
        <div class="cands" role="listbox" aria-label="${esc(text.candidate)}">${candidates.map((c, i) => {
          const tag = c.current ? text.current : "";
          return `<button class="cand ${i === selected ? "on" : ""}" role="option" data-i="${i}" aria-selected="${i === selected}" aria-label="${esc(text.candidate)} ${i + 1}${tag ? `（${esc(tag)}）` : ""}" tabindex="${i === selected ? 0 : -1}">${c.svg}${tag ? `<span class="tag">${esc(tag)}</span>` : ""}</button>`;
        }).join("")}</div></div>`;
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

    // The editor skeleton is built once; later updates only swap what changed.
    function buildEditor() {
      $(".bd").innerHTML = `<div class="edit">
        <div class="pvcol"><div class="pv" aria-live="polite"></div><div class="acts"><button class="btn" data-a="shuffle">${esc(text.shuffle)}</button><button class="btn" data-a="revert">${esc(text.revert)}</button></div></div>
        <div class="ctl"><div class="groups" role="tablist">${editor.catalog().groups.map((g, i) => `<button role="tab" data-g="${i}">${esc(g.label)}</button>`).join("")}</div>
          <div class="cats"></div><div class="sc edsc"><div class="colors"></div><div class="optwrap"></div></div></div></div>`;
    }

    function drawEditor({ resetScroll = false } = {}) {
      if (!$(".edit")) buildEditor();
      const C = editor.catalog(), category = C.categories.find((c) => c.key === cat), cats = C.groups[group].categories;
      $(".pv").innerHTML = editor.preview();
      $$(".groups button").forEach((b, i) => { b.classList.toggle("on", i === group); b.setAttribute("aria-selected", i === group); });
      $(".cats").innerHTML = cats.length > 1
        ? cats.map((k) => `<button class="${k === cat ? "on" : ""}" data-c="${k}" aria-pressed="${k === cat}">${esc(C.categories.find((c) => c.key === k).label)}</button>`).join("")
        : "";
      $(".colors").innerHTML = category.colors.map((slot) => {
        const currentColor = editor.color(slot.key);
        return `<div class="crow" role="group" aria-label="${esc(slot.label)}"><span class="lbl">${esc(slot.label)}</span>${slot.swatches.map((sw) => swatch(slot.key, sw, currentColor.value)).join("")}` +
          `<label class="custom" title="${esc(text.customColor)}"><input type="color" aria-label="${esc(slot.label)}：${esc(text.customColor)}" data-ck="${slot.key}" value="${toHex(currentColor.hex)}"></label></div>`;
      }).join("");
      $(".colors").style.display = category.colors.length ? "" : "none";

      const scroller = $(".edsc"), top = resetScroll ? 0 : scroller.scrollTop;
      $(".optwrap").innerHTML = (category.multi ? `<p class="note">${esc(text.multi)}</p>` : "") + (category.parts.length
        ? `<div class="opts" role="listbox" aria-label="${esc(category.label)}">${category.parts.map((p) => {
            const on = editor.isSelected(cat, p.id);
            return `<button class="opt ${on ? "on" : ""}" role="option" data-pid="${p.id}" aria-selected="${on}"><div class="th">${editor.thumbnail(cat, p.id)}</div><span class="nm">${esc(p.label)}</span></button>`;
          }).join("")}</div>`
        : "");
      scroller.scrollTop = top;
    }

    function swatch(key, sw, value) {
      const on = value === sw.value;
      const name = sw.kind === "auto" ? text.auto : sw.kind === "theme" ? text.theme : sw.name;
      return `<button class="sw ${on ? "on" : ""} ${sw.kind === "theme" ? "t" : ""} ${sw.kind === "auto" ? "auto" : ""}" style="background:${sw.hex}" data-ck="${key}" data-cv="${sw.value}" title="${esc(name)}" aria-label="${esc(name)}" aria-pressed="${on}"></button>`;
    }

    // -------------------------------------------------------------- actions
    const showCategory = (key, g = group) => { group = g; cat = key; drawEditor({ resetScroll: true }); };
    function startEditing() {
      editor.load(candidates[selected].avatar);   // the chosen candidate becomes the baseline
      step = "edit";
      const C = editor.catalog();
      if (!cat || !C.categories.some((c) => c.key === cat)) { group = 0; cat = C.groups[0].categories[0]; }
      draw();
    }
    function switchStyle(key) {
      pickStyle = key;
      page = 0; cat = null; group = 0;
      makeCandidates();
      draw();
    }

    root.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || t.disabled) return;
      const { a, lib: styleKey, i, g, c, ck, cv, pid } = t.dataset;
      if (a === "close") return requestClose();
      if (a === "keep") { confirming = false; return drawFooter(); }
      if (a === "discard") return finish(null);
      if (styleKey && styleKey !== pickStyle) return switchStyle(styleKey);
      if (i !== undefined) return selectCandidate(+i);
      if (a === "more") { page++; makeCandidates(); drawCandidates(); return $(".cand").focus({ preventScroll: true }); }
      if (a === "custom") return startEditing();
      if (a === "use") { if (step === "pick") editor.load(candidates[selected].avatar); return decide(); }
      if (a === "back") { step = "pick"; confirming = false; return draw(); }
      if (a === "shuffle") return editor.randomize();
      if (a === "revert") return editor.revert();
      if (g !== undefined) return showCategory(editor.catalog().groups[+g].categories[0], +g);
      if (c) return showCategory(c);
      if (ck) return editor.setColor(ck, cv);
      if (pid) {
        editor.select(cat, pid);
        $(`.opt[data-pid="${cssEscape(pid)}"]`)?.focus({ preventScroll: true });
      }
    });
    root.addEventListener("dblclick", (e) => {
      const tile = e.target.closest(".cand");
      if (!tile) return;
      selectCandidate(+tile.dataset.i);
      editor.load(candidates[selected].avatar);
      decide();
    });
    // Live preview while dragging in the native color picker; the full update when it closes.
    root.addEventListener("input", (e) => {
      if (e.target.type !== "color") return;
      $(".pv").innerHTML = editor.swatchPreview(e.target.dataset.ck, e.target.value);
    });
    root.addEventListener("change", (e) => { if (e.target.type === "color") editor.setColor(e.target.dataset.ck, e.target.value); });
    // -------------------------------------------------------------- keyboard
    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        if (confirming) { confirming = false; drawFooter(); } else requestClose();
        return;
      }
      if (e.key === "Tab") return trapFocus(e);
      if (e.key.startsWith("Arrow")) moveInGrid(e);
    }

    function trapFocus(e) {
      const focusable = $$("button:not([disabled]), input, [tabindex='0']").filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
      if (!focusable.length) return;
      const i = focusable.indexOf(root.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); focusable.at(-1).focus(); }
      else if (!e.shiftKey && (i === -1 || i === focusable.length - 1)) { e.preventDefault(); focusable[0].focus(); }
    }

    function moveInGrid(e) {
      const current = root.activeElement;
      const grid = current?.closest(".cands, .opts, .crow");
      if (!grid) return;
      const items = [...grid.querySelectorAll(".cand, .opt, .sw")];
      const i = items.indexOf(current);
      if (i < 0) return;
      let j = i;
      if (e.key === "ArrowLeft") j = Math.max(0, i - 1);
      else if (e.key === "ArrowRight") j = Math.min(items.length - 1, i + 1);
      else {
        // nearest tile in the row above / below
        const r = current.getBoundingClientRect(), dir = e.key === "ArrowDown" ? 1 : -1;
        let best = Infinity;
        items.forEach((el, k) => {
          const q = el.getBoundingClientRect();
          if ((q.top - r.top) * dir <= 4) return;
          const d = Math.abs(q.top - r.top) * 4 + Math.abs(q.left - r.left);
          if (d < best) { best = d; j = k; }
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
