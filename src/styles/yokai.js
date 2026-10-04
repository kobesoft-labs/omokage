// Yokai — round, friendly Japanese yokai: oni, kappa, umbrella ghosts, lanterns…
//
// A body shape decides the anchor points every other part uses:
//   top   y of the crown (horns, ears, plates sit here)
//   F     y of the eye line (the mouth is at F + 18)
//   arm   where the left arm attaches [x, y]
//   base  "feet" | "leg" (one leg on a geta) | "float"
// Head items use `back` (behind the body) or `front`; `clip` items are clipped to the body.
// Accessories use `band` (clipped to the body) and/or `over` (drawn on top).
import { defineLibrary } from "../core/library.js";
import { P, S, T, M, both, f2, wave, blushGradient } from "../core/draw.js";
import { shade, lighten, luminance } from "../core/color.js";

const INK = "#2b2233";
const LINE = "#33263a", LINE_W = 4.4;   // thicker than people: a softer, mascot-like line

// Traditional Japanese colors (wa-iro)
const WA = {
  "#e2553f": "朱", "#c93a4e": "紅", "#f5b5c4": "桜", "#f2b33d": "山吹", "#f6e7d0": "生成", "#f3f0e8": "白練",
  "#8c9a4a": "鶯", "#5cae7a": "若竹", "#3fa7b7": "浅葱", "#2a4a7a": "藍", "#9b88c9": "藤", "#6b4a8a": "江戸紫",
  "#a5683a": "柿渋", "#d9c27a": "藁", "#8e8a8e": "鈍", "#3a3438": "墨",
};
const BG = { "#f6efe2": "生成", "#fde2e4": "薄桜", "#e3efe2": "白緑", "#dfe8f3": "白藍", "#efe6f7": "薄藤", "#fff1c9": "卵", "#3a3f5c": "紺鼠", "#2b2233": "墨" };
const EYEC = { "#f2b33d": "山吹", "#e2553f": "朱", "#3fa7b7": "浅葱", "#5cae7a": "若竹", "#9b88c9": "藤", "#2b2233": "墨" };
const NAMES = { ...WA, ...BG, ...EYEC, auto: "おまかせ" };
const PALETTES = { body: Object.keys(WA), item: ["auto", ...Object.keys(WA)], eyes: Object.keys(EYEC), bg: Object.keys(BG) };

const BODIES = [
  { id: "manju",    label: "まんじゅう", top: 52, F: 112, arm: [40, 134], base: "feet", hl: [62, 100, 64, 72, 86, 60],
    d: "M100 52 C140 52 164 84 164 124 C164 160 136 176 100 176 C64 176 36 160 36 124 C36 84 60 52 100 52Z" },
  { id: "daruma",   label: "だるま",     top: 44, F: 104, arm: [44, 128], base: "feet", hl: [62, 92, 64, 64, 84, 52],
    d: "M100 44 C138 44 160 74 160 112 C160 152 136 176 100 176 C64 176 40 152 40 112 C40 74 62 44 100 44Z" },
  { id: "obake",    label: "おばけ",     top: 40, F: 100, arm: [46, 122], base: "float", hl: [58, 96, 60, 62, 82, 48],
    d: "M100 40 C136 40 156 70 156 108 L156 160 Q147 172 138 162 Q128 174 119 162 Q110 174 100 162 Q90 174 81 162 Q72 174 62 162 Q53 172 44 160 L44 108 C44 70 64 40 100 40Z" },
  { id: "hitodama", label: "ひとだま",   top: 72, F: 128, arm: [46, 140], base: "float", hl: [58, 120, 62, 98, 78, 84],
    d: "M100 176 C64 176 44 152 44 126 C44 98 66 84 82 68 C94 56 96 40 90 24 C112 32 126 52 122 68 C140 82 156 100 156 126 C156 152 136 176 100 176Z" },
  { id: "chochin",  label: "ちょうちん", top: 50, F: 110, arm: [50, 126], base: "feet", hl: [60, 104, 60, 80, 70, 62],
    d: "M66 52 C54 78 48 100 48 114 C48 128 54 150 66 172 L134 172 C146 150 152 128 152 114 C152 100 146 78 134 52Z",
    deco: (x) => [66, 80, 148, 160].map(y => S(`M40 ${y} Q100 ${y + 7} 160 ${y}`, shade(x.a, .22), 2.2)).join(""),
    over: (x) => `<rect x="68" y="38" width="64" height="16" rx="5" fill="#3a3438"/><rect x="68" y="168" width="64" height="13" rx="5" fill="#3a3438"/>` + S("M70 46 L130 46 M70 174 L130 174", "#d9b04a", 1.6) + S("M90 38 Q100 26 110 38", "#3a3438", 3) },
  { id: "kasa",     label: "からかさ",   top: 30, F: 96, arm: [50, 120], base: "leg", hl: [70, 96, 76, 70, 94, 40],
    d: "M100 30 C120 50 150 92 166 132 C152 128 142 134 134 140 C124 132 112 132 100 140 C88 132 76 132 66 140 C58 134 48 128 34 132 C50 92 80 50 100 30Z",
    deco: (x) => S("M100 32 Q78 84 66 140 M100 32 L100 140 M100 32 Q122 84 134 140", shade(x.a, .22), 2),
    over: (x) => `<circle cx="100" cy="30" r="4.5" fill="${shade(x.a, .3)}"/>` },
  { id: "nurikabe", label: "ぬりかべ",   top: 46, F: 102, arm: [48, 128], base: "feet", hl: [60, 100, 58, 72, 72, 56],
    d: "M54 60 Q54 46 68 46 L132 46 Q146 46 146 60 L152 164 Q152 176 140 176 L60 176 Q48 176 48 164Z",
    deco: (x) => S("M46 66 L154 66 M46 150 L154 150 M46 164 L154 164 M78 46 L78 66 M122 46 L122 66 M70 150 L70 164 M100 150 L100 164 M130 150 L130 164 M86 164 L86 178 M116 164 L116 178", shade(x.a, .2), 1.8, 'opacity=".7"') },
  { id: "kodama",   label: "こだま",     top: 40, F: 96, arm: [61, 124], base: "feet", hl: [70, 92, 70, 64, 86, 50],
    d: "M100 40 C126 40 138 60 138 90 L140 150 C140 166 124 176 100 176 C76 176 60 166 60 150 L62 90 C62 60 74 40 100 40Z" },
];

const PATTERNS = [
  { id: "none",     label: "なし",     draw: () => "" },
  { id: "onaka",    label: "おなか",   draw: (x, B) => `<ellipse cx="100" cy="${B.F + 44}" rx="36" ry="30" fill="${x.p}"/>` },
  { id: "mado",     label: "顔まど",   draw: (x, B) => `<ellipse cx="100" cy="${B.F + 4}" rx="33" ry="29" fill="${x.p}"/>` },
  { id: "shima",    label: "しましま", draw: (x, B) => [B.top + 22, B.top + 50, B.F + 32, B.F + 56].map(y => both(T([22, y + 4, 44, y - 4, 70, y + 2], x.p, 7))).join("") },
  { id: "mizutama", label: "みずたま", draw: (x, B) => [[60, 76], [140, 70], [52, 120], [148, 116], [70, 156], [130, 160], [100, 168], [84, 58], [118, 54]].map(([a, b]) => `<circle cx="${a}" cy="${b + (B.F - 110) * .3}" r="6.5" fill="${x.p}"/>`).join("") },
  { id: "uroko",    label: "うろこ",   draw: (x, B) => { let s = ""; const y0 = B.F + 36; for (let r = 0; r < 4; r++) for (let i = -1; i < 12; i++){ const y = y0 + r * 14, xx = 20 + i * 16 + (r % 2) * 8; if ((i + r) % 2 === 0) s += P(`M${xx} ${y + 14} L${xx + 8} ${y} L${xx + 16} ${y + 14}Z`, x.p); } return s; } },
  { id: "seigaiha", label: "青海波",   draw: (x, B) => { let s = ""; const y0 = B.F + 40; for (let r = 0; r < 5; r++) for (let i = -1; i < 10; i++){ const cx = 16 + i * 24 + (r % 2) * 12, cy = y0 + r * 10; s += `<circle cx="${cx}" cy="${cy}" r="12" fill="${x.p}"/>` + S(`M${cx - 8} ${cy} A8 8 0 0 1 ${cx + 8} ${cy} M${cx - 4} ${cy} A4 4 0 0 1 ${cx + 4} ${cy}`, x.a, 1.6); } return s; } },
  { id: "hoshi",    label: "ほし",     draw: (x, B) => [[64, B.top + 30, 1], [136, B.top + 40, .8], [56, B.F + 40, .9], [144, B.F + 34, 1.1]].map(([a, b, s]) => `<path transform="translate(${a} ${b}) scale(${s})" d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z" fill="${x.p}"/>`).join("") },
];

const ARMS = [
  { id: "none",     label: "なし",     draw: () => "" },
  { id: "nubs",     label: "ちょこん", draw: (x, B) => both(`<ellipse cx="${B.arm[0] - 3}" cy="${B.arm[1]}" rx="9" ry="12" transform="rotate(28 ${B.arm[0] - 3} ${B.arm[1]})" fill="${x.a}"/>`) },
  { id: "banzai",   label: "ばんざい", draw: (x, B) => both(`<ellipse cx="${B.arm[0] - 2}" cy="${B.arm[1] - 26}" rx="8" ry="14" transform="rotate(-28 ${B.arm[0] - 2} ${B.arm[1] - 26})" fill="${x.a}"/>`) },
  { id: "wave",     label: "やあ",     draw: (x, B) => `<ellipse cx="${B.arm[0] - 3}" cy="${B.arm[1]}" rx="9" ry="12" transform="rotate(28 ${B.arm[0] - 3} ${B.arm[1]})" fill="${x.a}"/>` + M(`<ellipse cx="${B.arm[0] - 2}" cy="${B.arm[1] - 26}" rx="8" ry="14" transform="rotate(-28 ${B.arm[0] - 2} ${B.arm[1] - 26})" fill="${x.a}"/>`) },
  { id: "urameshi", label: "うらめしや", front: true, draw: (x, B) => { const y = B.F + 34; return both(P(`M60 ${y - 2} Q72 ${y - 9} 82 ${y - 1} Q83 ${y + 11} 78 ${y + 15} Q75 ${y + 10} 73 ${y + 17} Q69 ${y + 11} 66 ${y + 16} Q62 ${y + 9} 59 ${y + 12} Q55 ${y + 4} 60 ${y - 2}Z`, x.a)); } },
];

const EX = [84, 116];
const hiL = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;
function spiral(cx, cy){ let d = ""; for (let i = 0; i <= 28; i++){ const a = i * .55, r = .3 + i * .23; d += (i ? " L" : "M") + f2(cx + r * Math.cos(a)) + " " + f2(cy + r * Math.sin(a)); } return d; }
const EYES = [
  { id: "maru",      label: "まんまる", draw: (x, F) => EX.map(e => `<ellipse cx="${e}" cy="${F}" rx="6.4" ry="7.2" fill="${INK}"/>${hiL(e + 2.2, F - 2.6)}<circle cx="${e - 2}" cy="${F + 3}" r="1" fill="#fff" fill-opacity=".85"/>`).join("") },
  { id: "hitotsume", label: "一つ目",   draw: (x, F) => `<ellipse cx="100" cy="${F - 2}" rx="16" ry="15" fill="#fff" stroke="${LINE}" stroke-width="2.4"/><circle cx="100" cy="${F}" r="9" fill="${x.a}"/><circle cx="100" cy="${F}" r="4.6" fill="${INK}"/>${hiL(104, F - 4, 2.8)}<circle cx="96" cy="${F + 4}" r="1.3" fill="#fff"/>` + T([82, F - 13, 100, F - 24, 118, F - 13], INK, 2.6) },
  { id: "mitsume",   label: "三つ目",   draw: (x, F) => EX.map(e => `<ellipse cx="${e}" cy="${F}" rx="5.6" ry="6.4" fill="${INK}"/>${hiL(e + 1.9, F - 2.2, 1.9)}`).join("") + P(`M100 ${F - 30} Q108 ${F - 21} 100 ${F - 12} Q92 ${F - 21} 100 ${F - 30}Z`, "#fff", `stroke="${LINE}" stroke-width="2"`) + `<ellipse cx="100" cy="${F - 21}" rx="2.6" ry="5.4" fill="${x.a}"/>` },
  { id: "kirakira",  label: "キラキラ", draw: (x, F) => EX.map(e => `<ellipse cx="${e}" cy="${F}" rx="7.4" ry="8.6" fill="${x.a}"/><ellipse cx="${e}" cy="${F + 1}" rx="4.2" ry="5.2" fill="${INK}"/>${hiL(e + 2.6, F - 3.4, 2.6)}<circle cx="${e - 2.6}" cy="${F + 3.8}" r="1.3" fill="#fff"/>` + T([e - 8, F - 6, e, F - 12.5, e + 8, F - 6], INK, 2.4)).join("") },
  { id: "nikkori",   label: "にっこり", draw: (x, F) => EX.map(e => T([e - 8, F + 2, e, F - 9, e + 8, F + 2], INK, 4)).join("") },
  { id: "jito",      label: "ジト目",   draw: (x, F) => EX.map(e => P(`M${e - 7} ${F - 1} Q${e} ${F + 11} ${e + 7} ${F - 1}Z`, INK) + T([e - 9, F - 1.5, e, F - 3, e + 9, F - 1.5], INK, 2.6) + hiL(e + 2.4, F + 2, 1.4)).join("") },
  { id: "kitsune",   label: "きつね目", draw: (x, F) => both(T([93, F + 1, 86, F - 2, 74, F - 8], INK, 4) + T([92, F + 6, 84, F + 4, 72, F - 4], "#d6413a", 2.2)) },
  { id: "guruguru",  label: "ぐるぐる", draw: (x, F) => EX.map(e => S(spiral(e, F), INK, 2.2)).join("") },
  { id: "tenten",    label: "てんてん", draw: (x, F) => EX.map(e => `<circle cx="${e}" cy="${F}" r="3.6" fill="${INK}"/>`).join("") },
  { id: "batsu",     label: "ばつ",     draw: (x, F) => EX.map(e => T([e - 6, F - 6, e, F, e + 6, F + 6], INK, 3) + T([e + 6, F - 6, e, F, e - 6, F + 6], INK, 3)).join("") },
  { id: "uruuru",    label: "うるうる", draw: (x, F) => EX.map(e => `<ellipse cx="${e}" cy="${F}" rx="7.4" ry="8.6" fill="${INK}"/><ellipse cx="${e}" cy="${F + 4}" rx="5.6" ry="3.6" fill="${x.a}" opacity=".9"/>${hiL(e + 2.6, F - 3.6, 2.8)}${hiL(e - 2.8, F - 1, 1.6)}`).join("") + both(P(`M${EX[0] - 3} ${F + 10} Q${EX[0] - 6} ${F + 17} ${EX[0] - 3} ${F + 19} Q${EX[0]} ${F + 17} ${EX[0] - 3} ${F + 10}Z`, "#8cc8f0")) },
];

const TONGUE = "#f08a9b", MOUTH_IN = "#6b2230";
const fang = (cx, y) => P(`M${cx - 3.6} ${y} L${cx + 3.6} ${y} L${cx} ${y + 7}Z`, "#fff", `stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"`);
const MOUTHS = [
  { id: "nikko",   label: "にこ",       draw: (x, y) => T([90, y - 1, 100, y + 7, 110, y - 1], INK, 3.4) },
  { id: "kiba",    label: "きば",       draw: (x, y) => T([88, y - 2, 100, y + 7, 112, y - 2], INK, 3.4) + fang(106, y + 2) },
  { id: "kiba2",   label: "ダブルきば", draw: (x, y) => T([86, y - 2, 100, y + 7, 114, y - 2], INK, 3.4) + fang(93, y + 2) + fang(107, y + 2) },
  { id: "ooguchi", label: "おおぐち",   draw: (x, y) => P(`M84 ${y - 4} Q100 ${y + 22} 116 ${y - 4}Z`, MOUTH_IN, `stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"`) + P(`M92 ${y + 9} Q100 ${y + 3} 108 ${y + 9} Q100 ${y + 14} 92 ${y + 9}Z`, TONGUE) + P(`M86 ${y - 3} L90 ${y + 2} L94 ${y - 2.6} L98 ${y + 3} L102 ${y - 2.6} L106 ${y + 3} L110 ${y - 2.6} L114 ${y - 3}Z`, "#fff") },
  { id: "bero",    label: "あっかんべー", draw: (x, y) => T([88, y - 2, 100, y + 6, 112, y - 2], INK, 3.2) + P(`M94 ${y + 2} L106 ${y + 2} L107 ${y + 20} Q100 ${y + 29} 93 ${y + 20}Z`, TONGUE, `stroke="${LINE}" stroke-width="2" stroke-linejoin="round"`) + S(`M100 ${y + 6} L100 ${y + 18}`, shade(TONGUE, .25), 1.4) },
  { id: "omega",   label: "ω",          draw: (x, y) => S(`M89 ${y - 2} Q94.5 ${y + 6} 100 ${y - 1} Q105.5 ${y + 6} 111 ${y - 2}`, INK, 3) },
  { id: "beak",    label: "くちばし",   draw: (x, y) => P(`M86 ${y - 6} Q100 ${y - 13} 114 ${y - 6} Q110 ${y + 7} 100 ${y + 9} Q90 ${y + 7} 86 ${y - 6}Z`, "#f2a93b", `stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"`) + T([88, y - 4, 100, y, 112, y - 4], shade("#f2a93b", .35), 1.6) },
  { id: "giza",    label: "ギザ歯",     draw: (x, y) => P(`M82 ${y - 5} Q100 ${y + 18} 118 ${y - 5}Z`, MOUTH_IN, `stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"`) + P(`M84 ${y - 4} L88 ${y + 3} L92 ${y - 3} L96 ${y + 5} L100 ${y - 3} L104 ${y + 5} L108 ${y - 3} L112 ${y + 3} L116 ${y - 4}Z`, "#fff") },
  { id: "ochobo",  label: "おちょぼ",   draw: (x, y) => `<ellipse cx="100" cy="${y + 1}" rx="3.4" ry="3" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="1.6"/>` },
  { id: "nii",     label: "にーっ",     draw: (x, y) => `<rect x="86" y="${y - 4}" width="28" height="11" rx="5.5" fill="#fff" stroke="${LINE}" stroke-width="2.2"/>` + S(`M86 ${y + 1.5} L114 ${y + 1.5} M93 ${y - 4} L93 ${y + 7} M100 ${y - 4} L100 ${y + 7} M107 ${y - 4} L107 ${y + 7}`, LINE, 1.2) },
  { id: "he",      label: "へ",         draw: (x, y) => T([90, y + 4, 100, y - 6, 110, y + 4], INK, 3.4) },
  { id: "o",       label: "おっ",       draw: (x, y) => `<ellipse cx="100" cy="${y + 2}" rx="5.6" ry="7" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="2"/>` },
];

const FACE = [
  { id: "blush",    label: "ほっぺ",   draw: (x, F) => `<ellipse cx="73" cy="${F + 11}" rx="10" ry="7" fill="url(#${x.id}bl)"/><ellipse cx="127" cy="${F + 11}" rx="10" ry="7" fill="url(#${x.id}bl)"/>` },
  { id: "kumadori", label: "くまどり", draw: (x, F) => both(T([90, F - 9, 78, F - 14, 66, F - 26], "#d6413a", 3.2) + T([76, F + 8, 70, F + 4, 62, F - 4], "#d6413a", 2.6)) },
  { id: "uzu",      label: "うずまき", draw: (x, F) => both(S(spiral(72, F + 12).replace(/L/g, " L"), "#e2553f", 1.8)) },
  { id: "hitai",    label: "ひたいの印", draw: (x, F) => P(`M100 ${F - 30} Q104 ${F - 25} 100 ${F - 20} Q96 ${F - 25} 100 ${F - 30}Z`, "#d6413a") },
  { id: "namida",   label: "なみだ",   draw: (x, F) => P(`M80 ${F + 9} Q76 ${F + 17} 80 ${F + 20} Q84 ${F + 17} 80 ${F + 9}Z`, "#8cc8f0", `stroke="${LINE}" stroke-width="1.2"`) },
  { id: "ase",      label: "あせ",     draw: (x, F) => P(`M134 ${F - 26} Q128 ${F - 16} 133 ${F - 12} Q138 ${F - 16} 134 ${F - 26}Z`, "#8cc8f0", `stroke="${LINE}" stroke-width="1.2"`) },
  { id: "hige",     label: "ひげ",     draw: (x, F) => both(T([78, F + 14, 68, F + 11, 56, F + 10], INK, 1.6) + T([78, F + 18, 68, F + 18, 56, F + 20], INK, 1.6)) },
  { id: "sobakasu", label: "そばかす", draw: (x, F) => both([[72, F + 10], [76, F + 13], [80, F + 10]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.3" fill="${shade(x.a, .4)}"/>`).join("")) },
];

const horn = (cx, base, h, a, b) => P(`M${cx - 10} ${base} C${cx - 9} ${base - h * .5} ${cx - 4} ${base - h * .85} ${cx + 2} ${base - h} C${cx + 4} ${base - h * .6} ${cx + 10} ${base - h * .3} ${cx + 10} ${base}Z`, a)
  + S(`M${cx - 8.6} ${base - h * .3} Q${cx} ${base - h * .24} ${cx + 9.4} ${base - h * .3} M${cx - 6.4} ${base - h * .56} Q${cx} ${base - h * .5} ${cx + 7} ${base - h * .56}`, b, 2.2);
const HEADS = [
  { id: "none",    label: "なし" },
  { id: "tsuno1",  label: "一本角",     auto: ["#f4ecd6", "#d9b98a"], back: (x, B) => horn(100, B.top + 14, 34, x.a, x.b) },
  { id: "tsuno2",  label: "二本角",     auto: ["#f4ecd6", "#d9b98a"], back: (x, B) => `<g transform="rotate(-20 76 ${B.top + 16})">${horn(76, B.top + 16, 30, x.a, x.b)}</g><g transform="rotate(20 124 ${B.top + 16})">${horn(124, B.top + 16, 30, x.a, x.b)}</g>` },
  { id: "kitsune", label: "きつね耳",   auto: ["body", "#f6e7d0"], back: (x, B) => both(P(`M60 ${B.top + 30} Q58 ${B.top - 8} 72 ${B.top - 20} Q86 ${B.top - 2} 90 ${B.top + 18}Z`, x.a) + P(`M66 ${B.top + 22} Q66 ${B.top - 2} 73 ${B.top - 10} Q81 ${B.top + 2} 83 ${B.top + 16}Z`, x.b)) },
  { id: "tanuki",  label: "たぬき耳",   auto: ["body", "#3a3438"], back: (x, B) => both(`<circle cx="70" cy="${B.top + 8}" r="13" fill="${x.a}"/><circle cx="70" cy="${B.top + 8}" r="6.5" fill="${x.b}"/>`) },
  { id: "neko",    label: "ねこ耳",     auto: ["body", "#f5b5c4"], back: (x, B) => both(P(`M62 ${B.top + 28} L66 ${B.top - 10} L94 ${B.top + 12}Z`, x.a, 'stroke-linejoin="round"') + P(`M68 ${B.top + 18} L70 ${B.top - 1} L84 ${B.top + 12}Z`, x.b)) },
  { id: "sara",    label: "河童の皿",   auto: ["#e9efe6", "#3f7a4a"], front: (x, B) => P(wave(100, B.top + 9, 36, 13, 180, 360, 9, 3.4, -1) + `L136 ${B.top + 9} Q100 ${B.top - 8} 64 ${B.top + 9}Z`, x.b) + `<ellipse cx="100" cy="${B.top + 4}" rx="24" ry="7.5" fill="${x.a}"/><ellipse cx="100" cy="${B.top + 3}" rx="16" ry="4" fill="#fff" opacity=".7"/>` },
  { id: "tenkan",  label: "天冠",       auto: ["#ffffff", "#e9e3ee"], front: (x, B) => P(`M86 ${B.F - 24} L100 ${B.F - 46} L114 ${B.F - 24}Z`, x.a, 'stroke-linejoin="round"') + S(`M91 ${B.F - 28} L109 ${B.F - 28}`, x.b, 1.6) },
  { id: "happa",   label: "葉っぱ",     auto: ["#5cae7a", "#3f7a4a"], front: (x, B) => `<g transform="rotate(24 104 ${B.top})">${P(`M104 ${B.top + 6} Q86 ${B.top - 8} 104 ${B.top - 28} Q122 ${B.top - 8} 104 ${B.top + 6}Z`, x.a)}${S(`M104 ${B.top + 4} L104 ${B.top - 22}`, x.b, 1.6)}</g>` },
  { id: "hono",    label: "炎",         auto: ["#f28a3b", "#f8d36a"], front: (x, B) => P(`M100 ${B.top - 34} C114 ${B.top - 18} 120 ${B.top - 6} 113 ${B.top + 6} C108 ${B.top + 13} 92 ${B.top + 13} 87 ${B.top + 6} C81 ${B.top - 6} 89 ${B.top - 15} 94 ${B.top - 21} C96 ${B.top - 12} 100 ${B.top - 13} 100 ${B.top - 34}Z`, x.a) + P(`M100 ${B.top - 14} C107 ${B.top - 6} 109 ${B.top + 1} 105 ${B.top + 6} C102 ${B.top + 9} 97 ${B.top + 9} 95 ${B.top + 6} C92 ${B.top + 1} 96 ${B.top - 4} 100 ${B.top - 14}Z`, x.b) },
  { id: "hachimaki", label: "はちまき", auto: ["#ffffff", "#e2553f"], clip: true, front: (x, B) => `<rect x="0" y="${B.F - 34}" width="200" height="10" fill="${x.a}"/><circle cx="100" cy="${B.F - 29}" r="4.2" fill="${x.b}"/>`,
                                       after: (x, B) => P(`M138 ${B.F - 32} Q150 ${B.F - 40} 158 ${B.F - 34} Q150 ${B.F - 30} 158 ${B.F - 22} Q148 ${B.F - 22} 138 ${B.F - 26}Z`, x.a) },
  { id: "ofuda",   label: "お札",       auto: ["#f6ecc8", "#d6413a"], front: (x, B) => `<g transform="rotate(-6 100 ${B.F - 30})"><rect x="91" y="${B.F - 50}" width="18" height="34" rx="1.5" fill="${x.a}"/>${S(`M95 ${B.F - 44} L105 ${B.F - 44} M100 ${B.F - 41} L100 ${B.F - 24} M96 ${B.F - 34} L104 ${B.F - 32}`, INK, 1.4)}<circle cx="100" cy="${B.F - 22}" r="3" fill="${x.b}"/></g>` },
  { id: "kanzashi", label: "かんざし",  auto: ["#e2553f", "#f2b33d"], front: (x, B) => `<g transform="rotate(-30 124 ${B.top + 16})">${S(`M112 ${B.top + 16} L140 ${B.top + 16}`, x.b, 2.4)}${[0, 72, 144, 216, 288].map(a => `<circle cx="${112 + 6 * Math.cos(a * Math.PI / 180)}" cy="${B.top + 16 + 6 * Math.sin(a * Math.PI / 180)}" r="4.6" fill="${x.a}"/>`).join("")}<circle cx="112" cy="${B.top + 16}" r="3" fill="${x.b}"/></g>` },
];

const ACCS = [
  { id: "none",      label: "なし" },
  { id: "yodare",    label: "よだれかけ", auto: ["#d6413a", "#f2b33d"], band: (x, B) => P(`M74 ${B.F + 28} Q100 ${B.F + 36} 126 ${B.F + 28} Q128 ${B.F + 56} 100 ${B.F + 64} Q72 ${B.F + 56} 74 ${B.F + 28}Z`, x.a, `stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"`) + `<circle cx="100" cy="${B.F + 48}" r="5" fill="none" stroke="${x.b}" stroke-width="2"/>` },
  { id: "suzu",      label: "鈴",         auto: ["#d6413a", "#f2b33d"], band: (x, B) => `<rect x="0" y="${B.F + 28}" width="200" height="6" fill="${x.a}"/>`,
                                           over: (x, B) => `<circle cx="100" cy="${B.F + 40}" r="8" fill="${x.b}"/>` + S(`M94 ${B.F + 41} L106 ${B.F + 41} M100 ${B.F + 41} L100 ${B.F + 47}`, shade(x.b, .45), 1.8) + `<circle cx="97" cy="${B.F + 37}" r="2" fill="#fff" opacity=".7"/>` },
  { id: "shimenawa", label: "しめ縄",     auto: ["#d9c27a", "#ffffff"], band: (x, B) => `<rect x="0" y="${B.F + 26}" width="200" height="11" rx="5.5" fill="${x.a}"/>` + Array.from({ length: 14 }, (_, i) => S(`M${14 + i * 13} ${B.F + 26} Q${20 + i * 13} ${B.F + 31.5} ${16 + i * 13} ${B.F + 37}`, shade(x.a, .3), 1.6)).join(""),
                                           over: (x, B) => [84, 116].map(cx => P(`M${cx - 5} ${B.F + 37} L${cx + 5} ${B.F + 37} L${cx + 1} ${B.F + 44} L${cx + 6} ${B.F + 44} L${cx + 1} ${B.F + 52} L${cx + 6} ${B.F + 52} L${cx - 2} ${B.F + 62} L${cx - 1} ${B.F + 54} L${cx - 6} ${B.F + 54} L${cx - 1} ${B.F + 46} L${cx - 6} ${B.F + 46}Z`, x.b, `stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"`)).join("") },
  { id: "haramaki",  label: "はらまき",   auto: ["#5cae7a", "#3f7a4a"], band: (x, B) => `<rect x="0" y="${B.F + 40}" width="200" height="22" fill="${x.a}"/>` + [B.F + 46, B.F + 56].map(y => S(`M0 ${y} L200 ${y}`, x.b, 2.4)).join("") },
  { id: "mafura",    label: "まふら",     auto: ["#2a4a7a", "#f3f0e8"], band: (x, B) => `<rect x="0" y="${B.F + 24}" width="200" height="13" fill="${x.a}"/>` + Array.from({ length: 10 }, (_, i) => `<rect x="${i * 20}" y="${B.F + 24}" width="10" height="13" fill="${x.b}" opacity=".9"/>`).join(""),
                                           over: (x, B) => P(`M118 ${B.F + 32} L132 ${B.F + 32} L134 ${B.F + 60} L120 ${B.F + 60}Z`, x.a) + S(`M122 ${B.F + 60} L122 ${B.F + 64} M127 ${B.F + 60} L127 ${B.F + 64} M132 ${B.F + 60} L132 ${B.F + 64}`, x.a, 1.6) },
  { id: "kanabo",    label: "金棒",       auto: ["#4a4550", "#f2b33d"], over: (x, B) => `<g transform="rotate(18 152 ${B.F + 30})"><rect x="146" y="${B.F - 10}" width="13" height="66" rx="6" fill="${x.a}"/>${[0, 1, 2, 3].map(i => `<circle cx="146" cy="${B.F - 2 + i * 13}" r="2.6" fill="${x.b}"/><circle cx="159" cy="${B.F + 4 + i * 13}" r="2.6" fill="${x.b}"/>`).join("")}<rect x="148" y="${B.F + 54}" width="9" height="12" rx="2" fill="#a5683a"/></g>` },
  { id: "chochin",   label: "ちょうちん", auto: ["#f6e7d0", "#d6413a"], over: (x, B) => `<g transform="translate(150 ${B.F + 12})">${S("M0 -26 L0 -14", INK, 1.6)}<rect x="-8" y="-16" width="16" height="4" rx="1.5" fill="#3a3438"/><ellipse cx="0" cy="0" rx="12" ry="14" fill="${x.a}"/>${S("M-12 -5 Q0 -2 12 -5 M-12 5 Q0 8 12 5", shade(x.a, .25), 1.4)}<rect x="-8" y="12" width="16" height="4" rx="1.5" fill="#3a3438"/><circle cx="0" cy="0" r="3.4" fill="${x.b}"/></g>` },
  { id: "dango",     label: "おだんご",   auto: ["#f5b5c4", "#5cae7a"], over: (x, B) => `<g transform="rotate(-16 150 ${B.F + 20})">${S(`M150 ${B.F - 12} L150 ${B.F + 50}`, "#c9a46a", 2.6)}<circle cx="150" cy="${B.F - 4}" r="8" fill="${x.a}"/><circle cx="150" cy="${B.F + 11}" r="8" fill="#ffffff"/><circle cx="150" cy="${B.F + 26}" r="8" fill="${x.b}"/></g>` },
];

const PARTS = { body: BODIES, pattern: PATTERNS, arms: ARMS, eyes: EYES, mouth: MOUTHS, face: FACE, head: HEADS, acc: ACCS };
const CATEGORIES = [
  { key: "body",    label: "かたち",   colors: [{ key: "bodyColor", label: "からだの色", palette: PALETTES.body }] },
  { key: "pattern", label: "もよう",   colors: [{ key: "patternColor", label: "もようの色", palette: PALETTES.body }] },
  { key: "arms",    label: "て" },
  { key: "eyes",    label: "め",       colors: [{ key: "eyesColor", label: "ひとみ（一つ目・三つ目・キラキラ・うるうる）", palette: PALETTES.eyes }] },
  { key: "mouth",   label: "くち" },
  { key: "face",    label: "しるし",   multi: true },
  { key: "head",    label: "あたま",   colors: [{ key: "headColor", label: "メイン", palette: PALETTES.item }, { key: "headColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "acc",     label: "もちもの", colors: [{ key: "accColor", label: "メイン", palette: PALETTES.item }, { key: "accColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "bg",      label: "はいけい", colors: [{ key: "bgColor", label: "はいけいの色", palette: PALETTES.bg }] },
];
const GROUPS = [
  { label: "からだ",   cats: ["body", "pattern", "arms"] },
  { label: "かお",     cats: ["eyes", "mouth", "face"] },
  { label: "あたま",   cats: ["head"] },
  { label: "もちもの", cats: ["acc"] },
  { label: "はいけい", cats: ["bg"] },
];
const DEFAULTS = {
  body: "manju", bodyColor: "#e2553f",
  pattern: "onaka", patternColor: "#f6e7d0",
  arms: "nubs",
  eyes: "maru", eyesColor: "#f2b33d",
  mouth: "kiba", face: ["blush"],
  head: "tsuno2", headColor: "auto", headColor2: "auto",
  acc: "none", accColor: "auto", accColor2: "auto",
  bgColor: "#f6efe2",
};

const CHARACTERS = [
  { label: "あかおに",   body: "manju", bodyColor: "#e2553f", pattern: "onaka", head: "tsuno2", mouth: "kiba", acc: "kanabo", bgColor: "#fff1c9" },
  { label: "ひとつめ",   body: "obake", bodyColor: "#f3f0e8", pattern: "none", eyes: "hitotsume", eyesColor: "#3fa7b7", mouth: "bero", head: "tenkan", arms: "urameshi", bgColor: "#efe6f7" },
  { label: "からかさ",   body: "kasa", bodyColor: "#9b88c9", pattern: "none", eyes: "hitotsume", eyesColor: "#f2b33d", mouth: "bero", head: "none", arms: "none", bgColor: "#e3efe2" },
  { label: "かっぱ",     body: "kodama", bodyColor: "#5cae7a", pattern: "onaka", patternColor: "#f2e3a8", eyes: "maru", mouth: "beak", head: "sara", arms: "wave", bgColor: "#dfe8f3" },
  { label: "ちょうちん", body: "chochin", bodyColor: "#f6e7d0", pattern: "none", eyes: "hitotsume", eyesColor: "#e2553f", mouth: "ooguchi", head: "none", arms: "nubs", bgColor: "#3a3f5c" },
  { label: "きつね",     body: "daruma", bodyColor: "#f3f0e8", pattern: "none", eyes: "kitsune", mouth: "omega", head: "kitsune", face: ["blush", "hitai"], acc: "suzu", bgColor: "#fde2e4" },
  { label: "たぬき",     body: "manju", bodyColor: "#a5683a", pattern: "onaka", patternColor: "#f6e7d0", eyes: "maru", mouth: "omega", head: "happa", face: ["blush", "uzu"], acc: "haramaki", bgColor: "#e3efe2" },
  { label: "ぬりかべ",   body: "nurikabe", bodyColor: "#8e8a8e", pattern: "none", eyes: "jito", mouth: "he", head: "none", arms: "banzai", bgColor: "#f6efe2" },
  { label: "ひとだま",   body: "hitodama", bodyColor: "#3fa7b7", pattern: "none", eyes: "kirakira", eyesColor: "#f2b33d", mouth: "o", head: "none", arms: "none", face: ["blush"], bgColor: "#3a3f5c" },
  { label: "だるま",     body: "daruma", bodyColor: "#c93a4e", pattern: "mado", patternColor: "#f6e7d0", eyes: "maru", mouth: "nii", head: "hachimaki", arms: "none", face: ["blush", "hige"], bgColor: "#fff1c9" },
  { label: "ねこまた",   body: "kodama", bodyColor: "#3a3438", pattern: "none", eyes: "kirakira", eyesColor: "#f2b33d", mouth: "omega", head: "neko", face: ["blush", "hige"], acc: "suzu", bgColor: "#efe6f7" },
  { label: "あおおに",   body: "manju", bodyColor: "#2a4a7a", pattern: "shima", patternColor: "#3fa7b7", eyes: "mitsume", eyesColor: "#f2b33d", mouth: "kiba2", head: "tsuno1", acc: "shimenawa", bgColor: "#dfe8f3" },
  { label: "こだま",     body: "kodama", bodyColor: "#f3f0e8", pattern: "none", eyes: "tenten", mouth: "ochobo", head: "none", arms: "banzai", face: [], bgColor: "#e3efe2" },
  { label: "おいなり",   body: "obake", bodyColor: "#f2b33d", pattern: "seigaiha", patternColor: "#f6e7d0", eyes: "nikkori", mouth: "nikko", head: "kanzashi", acc: "dango", arms: "nubs", bgColor: "#fde2e4" },
  { label: "キョンシー", body: "nurikabe", bodyColor: "#9b88c9", pattern: "none", eyes: "batsu", mouth: "giza", head: "ofuda", arms: "urameshi", face: ["blush", "kumadori"], bgColor: "#efe6f7" },
  { label: "やまぶき",   body: "hitodama", bodyColor: "#f28a3b", pattern: "none", eyes: "uruuru", eyesColor: "#e2553f", mouth: "nikko", head: "hono", arms: "nubs", acc: "yodare", bgColor: "#fff1c9" },
];

function randomYokai(r) {
  const { pick, chance } = r;
  const body = pick(BODIES.map(b => b.id)), bodyColor = pick(PALETTES.body);
  const light = luminance(bodyColor) > .7;
  return {
    body, bodyColor,
    pattern: pick(["none", "none", "onaka", "onaka", "mado", "shima", "mizutama", "uroko", "seigaiha", "hoshi"]),
    patternColor: light ? pick(["#e2553f", "#2a4a7a", "#5cae7a", "#9b88c9"]) : pick(["#f6e7d0", "#f3f0e8", "#f2b33d", "#f5b5c4"]),
    arms: pick(["nubs", "nubs", "nubs", "banzai", "wave", "urameshi", "none"]),
    eyes: pick(["maru", "maru", "maru", "hitotsume", "hitotsume", "mitsume", "kirakira", "nikkori", "jito", "kitsune", "guruguru", "tenten", "uruuru"]),
    eyesColor: pick(PALETTES.eyes),
    mouth: pick(["nikko", "kiba", "kiba", "kiba2", "ooguchi", "bero", "omega", "beak", "giza", "ochobo", "nii", "o"]),
    face: ["blush", ...(chance(.15) ? ["kumadori"] : []), ...(chance(.1) ? ["hige"] : []), ...(chance(.08) ? ["hitai"] : [])],
    head: ["hitodama", "kasa"].includes(body) ? pick(["none", "none", "hachimaki", "ofuda", "tenkan"]) : pick(["none", "tsuno1", "tsuno2", "tsuno2", "kitsune", "tanuki", "neko", "sara", "tenkan", "happa", "hono", "hachimaki", "ofuda", "kanzashi"]),
    headColor: "auto", headColor2: "auto",
    acc: chance(.45) ? pick(["yodare", "suzu", "shimenawa", "haramaki", "mafura", "kanabo", "chochin", "dango"]) : "none",
    accColor: "auto", accColor2: "auto",
    bgColor: pick(PALETTES.bg.slice(0, 6)),
  };
}

function compose(scene) {
  const { config: cfg } = scene;
  const B = scene.part("body");
  const body = scene.color("bodyColor");
  const slot = (cat) => ({ id: scene.id, p: scene.part(cat), ...scene.slots(cat) });
  const head = slot("head"), acc = slot("acc"), arms = scene.part("arms");
  const bodyUrl = scene.clip("b", B.d);
  scene.define(blushGradient(scene.uid("bl"), "#ff6f73", 0.55, 0.25));
  const bodyPaint = { a: body };

  // ground shadow
  scene.add(B.base === "float"
    ? `<ellipse cx="100" cy="188" rx="30" ry="4" fill="#1a1226" opacity=".1"/>`
    : `<ellipse cx="100" cy="182" rx="50" ry="6" fill="#1a1226" opacity=".12"/>`);
  // behind the body: horns and ears, then feet
  if (head.p.back) scene.add(scene.outlined(head.p.back(head, B)));
  if (B.base === "feet") scene.add(scene.outlined(both(`<ellipse cx="80" cy="175" rx="13" ry="8" fill="${shade(body, .12)}"/>`)));
  if (B.base === "leg") scene.add(scene.outlined(`<rect x="95" y="132" width="10" height="38" rx="5" fill="#f1d7b8"/><rect x="82" y="168" width="36" height="7" rx="2.5" fill="#b07a4a"/><rect x="86" y="175" width="6" height="5" fill="#8a5a34"/><rect x="108" y="175" width="6" height="5" fill="#8a5a34"/>` + S("M100 168 L96 164 M100 168 L104 164", "#d6413a", 1.8)));
  if (!arms.front) scene.add(scene.outlined(arms.draw(bodyPaint, B)));
  // the body: silhouette, shaded volume (light from the upper left), pattern, decoration, gloss
  scene.add(scene.silhouette(P(B.d, body)));
  scene.add(scene.clipped(bodyUrl, P(B.d, shade(body, .2)) + P(B.d, body, 'transform="translate(-6 -7)"')
    + scene.part("pattern").draw({ p: cfg.patternColor, a: body }, B)
    + (B.deco ? B.deco(bodyPaint) : "")
    + (acc.p.band ? acc.p.band(acc, B) : "")
    + (head.p.clip ? head.p.front(head, B) : "")
    + T(B.hl, "#fff", 4.4, 'opacity=".38"')));
  if (B.over) scene.add(scene.outlined(B.over(bodyPaint)));
  // the face
  for (const mark of scene.selected("face")) scene.add(mark.draw({ id: scene.id, a: body }, B.F));
  scene.add(scene.part("eyes").draw({ a: cfg.eyesColor }, B.F));
  scene.add(scene.part("mouth").draw({}, B.F + 18));
  // in front
  if (head.p.front && !head.p.clip) scene.add(scene.outlined(head.p.front(head, B)));
  if (head.p.after) scene.add(scene.outlined(head.p.after(head, B)));
  if (acc.p.over) scene.add(scene.outlined(acc.p.over(acc, B)));
  if (arms.front) scene.add(scene.outlined(arms.draw(bodyPaint, B)));
}

export const Yokai = defineLibrary({
  key: "yokai",
  label: "妖怪",
  idPrefix: "yk",
  parts: PARTS,
  categories: CATEGORIES,
  groups: GROUPS,
  defaults: DEFAULTS,
  presets: CHARACTERS,
  palettes: PALETTES,
  colorNames: NAMES,
  outline: { color: LINE, width: LINE_W },
  // "auto" colors: a part's recommended color; the token "body" means the body color.
  autoColor: (token, scene) => (token === "body" ? scene.color("bodyColor") : token),
  compose,
  random: randomYokai,
});
