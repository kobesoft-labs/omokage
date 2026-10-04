// Styles of the picker dialog. It renders inside a Shadow DOM, so none of this can
// leak into — or be broken by — the host page.
//
// Layout rule: the dialog has a fixed size for as long as it is open. Steps, tabs and
// candidate pages swap content inside it; only the inner panes scroll.
export const PICKER_CSS = `
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
.sw.auto::after { content: "自"; color: #6b5f78; }
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

export const ICON_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
