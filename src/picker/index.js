// The avatar picker: a modal dialog to choose an avatar and then customize it.
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
const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
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
 * @param {object[]} options.styles avatar styles to offer (at least one)
 * @param {{style: string, config: object}} [options.value] the current avatar, shown first
 * @param {number}   [options.hue]  company theme hue (used by styles with theme colors)
 * @param {string}   [options.seed] seed for the candidates, e.g. the user name
 * @param {object}   [options.text] overrides for the UI strings (see TEXT)
 * @returns {Promise<{style: string, config: object, svg: string} | null>}
 */
export function openPicker(options = {}) {
  const libs = [].concat(options.styles || []).filter(Boolean);
  if (!libs.length) throw new Error("omokage: openPicker() needs at least one style in `styles`");
  const text = { ...TEXT, ...options.text };
  const { hue } = options;
  const seed = options.seed || Math.random().toString(36).slice(2, 8);
  const current = options.value && options.value.config ? options.value : null;
  const startLib = libs.find((l) => l.KEY === current?.style) || libs[0];

  // ---------------------------------------------------------------- state
  let lib = startLib;
  let step = "pick";                  // "pick" | "edit"
  let page = 0, candidates = [], selected = 0;
  let config = null, original = null, dirty = false, confirming = false;
  let group = 0, cat = null;

  const groups = () => lib.GROUPS || [{ label: "パーツ", cats: lib.CATEGORIES.map((c) => c.key) }];
  const category = (key) => lib.CATEGORIES.find((c) => c.key === key);
  const render = (c, extra) => lib.render(c, { hue, ...extra });
  const complete = (c) => ({ ...lib.DEFAULTS, ...c });
  /** Only what differs from the defaults is returned, to keep stored configs small. */
  const compact = (c) => Object.fromEntries(Object.entries(c).filter(([k, v]) => !same(v, lib.DEFAULTS[k])));

  function makeCandidates() {
    const list = [];
    if (current && page === 0 && lib.KEY === current.style) list.push({ config: complete(current.config), tag: text.current });
    const seen = new Set(list.map((c) => JSON.stringify(c.config)));
    for (let i = 0; list.length < CANDIDATES && i < CANDIDATES * 4; i++) {
      const c = complete(lib.random(`${seed}:${lib.KEY}:${page}:${i}`)), key = JSON.stringify(c);
      if (!seen.has(key)) { seen.add(key); list.push({ config: c }); }
    }
    candidates = list;
    selected = 0;
  }
  makeCandidates();

  // ---------------------------------------------------------------- shell
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
    const decide = () => finish({ style: lib.KEY, config: compact(config), svg: render(config) });
    const requestClose = () => {
      if (step === "edit" && dirty) { confirming = true; drawFooter(); $(".ft [data-a=keep]").focus(); }
      else finish(null);
    };

    // -------------------------------------------------------------- drawing
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
        <div class="cands" role="listbox" aria-label="${esc(text.candidate)}">${candidates.map((c, i) =>
          `<button class="cand ${i === selected ? "on" : ""}" role="option" data-i="${i}" aria-selected="${i === selected}" aria-label="${esc(text.candidate)} ${i + 1}${c.tag ? `（${esc(c.tag)}）` : ""}" tabindex="${i === selected ? 0 : -1}">${render(c.config)}${c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ""}</button>`).join("")}</div></div>`;
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
        <div class="ctl"><div class="groups" role="tablist">${groups().map((g, i) => `<button role="tab" data-g="${i}">${esc(g.label)}</button>`).join("")}</div>
          <div class="cats"></div><div class="sc edsc"><div class="colors"></div><div class="optwrap"></div></div></div></div>`;
    }

    function drawEditor({ resetScroll = false } = {}) {
      if (!$(".edit")) buildEditor();
      const C = category(cat), parts = lib.PARTS[cat], cats = groups()[group].cats;
      $(".pv").innerHTML = render(config);
      $$(".groups button").forEach((b, i) => { b.classList.toggle("on", i === group); b.setAttribute("aria-selected", i === group); });
      $(".cats").innerHTML = cats.length > 1
        ? cats.map((k) => `<button class="${k === cat ? "on" : ""}" data-c="${k}" aria-pressed="${k === cat}">${esc(category(k).label)}</button>`).join("")
        : "";
      $(".colors").innerHTML = (C.colors || []).map((slot) =>
        `<div class="crow" role="group" aria-label="${esc(slot.label)}"><span class="lbl">${esc(slot.label)}</span>${slot.palette.map((v) => swatch(slot.key, v)).join("")}` +
        `<label class="custom" title="${esc(text.customColor)}"><input type="color" aria-label="${esc(slot.label)}：${esc(text.customColor)}" data-ck="${slot.key}" value="${toHex(lib.resolve(config[slot.key] ?? lib.DEFAULTS[slot.key], hue))}"></label></div>`).join("");
      $(".colors").style.display = C.colors ? "" : "none";

      const scroller = $(".edsc"), top = resetScroll ? 0 : scroller.scrollTop;
      $(".optwrap").innerHTML = (C.multi ? `<p class="note">${esc(text.multi)}</p>` : "") + (parts
        ? `<div class="opts" role="listbox" aria-label="${esc(C.label)}">${parts.map((p) => option(C, p)).join("")}</div>`
        : "");
      scroller.scrollTop = top;
    }

    /** A tile showing the current avatar with this part applied. */
    function option(C, p) {
      let on, next;
      if (C.multi) {
        const set = new Set(config[C.key] || []);
        on = set.has(p.id);
        on ? set.delete(p.id) : set.add(p.id);
        next = [...set];
      } else {
        on = config[C.key] === p.id;
        next = p.id;
      }
      return `<button class="opt ${on ? "on" : ""}" role="option" data-pid="${p.id}" aria-selected="${on}"><div class="th">${render({ ...config, [C.key]: next }, { viewBox: C.view })}</div><span class="nm">${esc(p.label)}</span></button>`;
    }

    function swatch(key, v) {
      const on = (config[key] ?? lib.DEFAULTS[key]) === v, theme = v.startsWith("theme"), auto = v === "auto";
      const name = auto ? text.auto : theme ? text.theme : lib.colorName(v);
      return `<button class="sw ${on ? "on" : ""} ${theme ? "t" : ""} ${auto ? "auto" : ""}" style="background:${lib.resolve(v, hue)}" data-ck="${key}" data-cv="${v}" title="${esc(name)}" aria-label="${esc(name)}" aria-pressed="${on}"></button>`;
    }

    // -------------------------------------------------------------- actions
    const showCategory = (key, g = group) => { group = g; cat = key; drawEditor({ resetScroll: true }); };
    const edit = (fn) => { fn(); dirty = true; drawEditor(); };
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
      if (!cat || !category(cat)) { group = 0; cat = groups()[0].cats[0]; }
      draw();
    }
    function switchLibrary(key) {
      lib = libs.find((l) => l.KEY === key);
      page = 0; cat = null; group = 0;
      makeCandidates();
      draw();
    }

    root.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || t.disabled) return;
      const { a, lib: libKey, i, g, c, ck, cv, pid } = t.dataset;
      if (a === "close") return requestClose();
      if (a === "keep") { confirming = false; return drawFooter(); }
      if (a === "discard") return finish(null);
      if (libKey && libKey !== lib.KEY) return switchLibrary(libKey);
      if (i !== undefined) return selectCandidate(+i);
      if (a === "more") { page++; makeCandidates(); drawCandidates(); return $(".cand").focus({ preventScroll: true }); }
      if (a === "custom") return startEditing();
      if (a === "use") { if (step === "pick") config = clone(candidates[selected].config); return decide(); }
      if (a === "back") { step = "pick"; confirming = false; return draw(); }
      if (a === "shuffle") return edit(() => { config = complete(lib.random(Math.random().toString(36).slice(2))); });
      if (a === "revert") { config = clone(original); dirty = false; return drawEditor(); }
      if (g !== undefined) return showCategory(groups()[+g].cats[0], +g);
      if (c) return showCategory(c);
      if (ck) return edit(() => { config[ck] = cv; });
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
    // Live preview while dragging in the native color picker; full redraw when it closes.
    root.addEventListener("input", (e) => {
      if (e.target.type !== "color") return;
      config[e.target.dataset.ck] = e.target.value;
      dirty = true;
      $(".pv").innerHTML = render(config);
    });
    root.addEventListener("change", (e) => { if (e.target.type === "color") drawEditor(); });

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
