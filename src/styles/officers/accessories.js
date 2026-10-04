// Glasses (a: frame, b: lens), hats (a: main, b: sub), ear gear and earrings.
//
// Hats come in two kinds:
//   cover: { y, hw }  covers the crown. Hair is only shown below the rim (y) and flows out
//                     diagonally beyond its half width (hw). Buns are hidden.
//   (no cover)        sits on the head. Every hat is anchored to the skull, never to the hair.
//   hidesHair         replaces the hair entirely (hijab).
import { P, S, both } from "../../core/draw.js";
import { shade, luminance } from "../../core/color.js";
import { INK } from "./geometry.js";

const lens = (x, op = .18) => `fill="${x.b}" fill-opacity="${op}"`;
const tint = (x) => ({ ...x, b: luminance(x.b) > .8 ? "#2b2233" : x.b });
const ARMS = (y = 96) => `M77 ${y} L67 ${y - 2} M123 ${y} L133 ${y - 2}`;
export const GLASSES = [
  { id: "none",     label: "なし",       draw: x => "" },
  { id: "round",    label: "丸",         draw: x => `<g stroke="${x.a}" stroke-width="2.2" fill="none"><circle cx="87" cy="99" r="9.5" ${lens(x)}/><circle cx="113" cy="99" r="9.5" ${lens(x)}/><path d="M96.5 98 Q100 95.5 103.5 98 ${ARMS(97)}"/></g>` },
  { id: "roundBig", label: "大きい丸",   draw: x => `<g stroke="${x.a}" stroke-width="2.4" fill="none"><circle cx="86" cy="100" r="12" ${lens(x)}/><circle cx="114" cy="100" r="12" ${lens(x)}/><path d="M98 99 Q100 97 102 99 M74 97 L67 95 M126 97 L133 95"/></g>` },
  { id: "square",   label: "スクエア",   draw: x => `<g stroke="${x.a}" stroke-width="2.2" fill="none"><rect x="76" y="91.5" width="21.5" height="15.5" rx="5" ${lens(x)}/><rect x="102.5" y="91.5" width="21.5" height="15.5" rx="5" ${lens(x)}/><path d="M97.5 97 Q100 95 102.5 97 ${ARMS(96)}"/></g>` },
  { id: "rect",     label: "細フレーム", draw: x => `<g stroke="${x.a}" stroke-width="1.6" fill="none"><rect x="75" y="93" width="23" height="12" rx="3" ${lens(x)}/><rect x="102" y="93" width="23" height="12" rx="3" ${lens(x)}/><path d="M98 97 L102 97 ${ARMS(96)}"/></g>` },
  { id: "bold",     label: "黒縁",       draw: x => `<g stroke="${x.a}" stroke-width="3.6" fill="none"><rect x="76" y="91" width="21.5" height="16" rx="4" ${lens(x)}/><rect x="102.5" y="91" width="21.5" height="16" rx="4" ${lens(x)}/><path d="M97.5 96 L102.5 96 ${ARMS(95)}"/></g>` },
  { id: "browline", label: "ブロー",     draw: x => `<g fill="none"><rect x="76" y="91.5" width="21.5" height="15" rx="6" stroke="${x.a}" stroke-width="1.2" ${lens(x)}/><rect x="102.5" y="91.5" width="21.5" height="15" rx="6" stroke="${x.a}" stroke-width="1.2" ${lens(x)}/></g>${S("M76 93.5 Q86.5 89 97.5 93.5 M102.5 93.5 Q113.5 89 124 93.5 M97.5 94 L102.5 94 " + ARMS(95), x.a, 3.6)}` },
  { id: "cat",      label: "キャット",   draw: x => `<g stroke="${x.a}" stroke-width="2.4" fill="none" stroke-linejoin="round">${both(`<path d="M75 92 Q86 90 97 93 Q97 105 88 106 Q78 106 76 97 Z" ${lens(x)}/><path d="M75 92 L72 89 M75 94 L67 94"/>`)}<path d="M97 95 Q100 93 103 95"/></g>` },
  { id: "oval",     label: "小さめ楕円", draw: x => `<g stroke="${x.a}" stroke-width="1.8" fill="none"><ellipse cx="87" cy="99" rx="8" ry="6" ${lens(x)}/><ellipse cx="113" cy="99" rx="8" ry="6" ${lens(x)}/><path d="M95 98 Q100 96 105 98 M79 98 L67 95 M121 98 L133 95"/></g>` },
  { id: "sun",      label: "サングラス", draw: x => (x = tint(x), "") + `<g stroke="${x.a}" stroke-width="2.2"><rect x="75" y="91" width="23" height="15" rx="6" fill="${x.b}" fill-opacity=".92"/><rect x="102" y="91" width="23" height="15" rx="6" fill="${x.b}" fill-opacity=".92"/><path d="M98 96 L102 96 ${ARMS(95)}" fill="none"/></g>${both(S("M79 95 L84 95", "#fff", 1.6, 'opacity=".5"'))}` },
  { id: "aviator",  label: "ティアドロップ", draw: x => (x = tint(x), "") + `<g stroke="${x.a}" stroke-width="1.8">${both(`<path d="M75 93 Q87 89 97 93 Q98 104 88 108 Q76 107 75 93Z" fill="${x.b}" fill-opacity=".75"/>`)}<path d="M97 93 Q100 91 103 93 M96 91 L104 91 M75 93 L67 92 M125 93 L133 92" fill="none"/></g>` },
  { id: "monocle",  label: "片メガネ",   free: true, draw: x => `<circle cx="113" cy="99" r="9" fill="${x.b}" fill-opacity=".18" stroke="${x.a}" stroke-width="2.2"/>${S("M113 108 C116 124 112 140 118 156", x.a, 1.2)}` },
];

export const HATS = [
  { id: "none",      label: "なし" },
  { id: "beret",     label: "ベレー帽",   front: x => `<ellipse cx="94" cy="51" rx="42" ry="14" transform="rotate(-10 94 51)" fill="${x.a}"/>${S("M56 60 C72 56 112 50 132 46", "#000", 3, 'stroke-opacity=".15"')}<rect x="90" y="34" width="6" height="8" rx="3" fill="${x.a}"/>` },
  { id: "cap",       label: "キャップ",   cover: { y: 82, hw: 41 }, front: x => P("M63 81 C61 46 80 30 100 30 C120 30 139 46 137 81 C120 75 80 75 63 81Z", x.a) + S("M100 31 L100 75 M82 36 C80 50 80 64 82 77 M118 36 C120 50 120 64 118 77", shade(x.a, .2), 1.6) + P("M58 81 C80 71 120 71 142 81 C145 87 139 91 128 89 C112 85 88 85 72 89 C61 91 55 87 58 81Z", x.b) + `<circle cx="100" cy="31" r="3.4" fill="${x.b}"/>` },
  { id: "capBack",   label: "後ろ前キャップ", cover: { y: 79, hw: 39 }, front: x => P("M61 82 C59 46 80 30 100 30 C120 30 141 46 139 82 C120 76 80 76 61 82Z", x.a) + P("M88 80 C88 70 112 70 112 80Z", shade(x.a, .35)) + S("M88 72 L112 72", x.b, 3) + P("M84 36 C92 24 108 24 116 36 C110 34 90 34 84 36Z", x.b) },
  { id: "beanie",    label: "ニット帽",   cover: { y: 82, hw: 42 }, front: x => P("M61 84 C57 46 78 29 100 29 C122 29 143 46 139 84Z", x.a) + P("M57 70 C80 63 120 63 143 70 L143 87 C120 80 80 80 57 87Z", shade(x.a, .15)) + S([64,72,80,88,96,104,112,120,128,136].map(v => `M${v} ${68 - Math.abs(v - 100) * .04} L${v} ${83 - Math.abs(v - 100) * .04}`).join(" "), shade(x.a, .3), 1.4) },
  { id: "pompom",    label: "ボンボン",   cover: { y: 82, hw: 42 }, front: x => P("M61 84 C57 46 78 29 100 29 C122 29 143 46 139 84Z", x.a) + P("M57 70 C80 63 120 63 143 70 L143 87 C120 80 80 80 57 87Z", shade(x.a, .15)) + S("M76 46 L82 58 M90 38 L94 52 M106 36 L106 50 M120 42 L116 56", shade(x.a, .2), 1.6) + `<circle cx="100" cy="25" r="11" fill="${x.b}"/>` },
  { id: "bucket",    label: "バケハ",     cover: { y: 80, hw: 46 }, front: x => P("M68 74 C68 44 84 33 100 33 C116 33 132 44 132 74Z", x.a) + P("M52 83 C60 66 140 66 148 83 C150 89 142 91 134 87 C114 79 86 79 66 87 C58 91 50 89 52 83Z", shade(x.a, .12)) + S("M69 66 L131 66", x.b, 4) },
  { id: "fedora",    label: "中折れ帽",   cover: { y: 70, hw: 50 }, front: x => P("M70 64 C70 40 84 30 100 36 C116 30 130 40 130 64Z", x.a) + S("M92 36 Q100 46 108 36", shade(x.a, .3), 2) + P("M70 55 L130 55 L130 64 L70 64Z", x.b) + P("M46 68 C70 58 130 58 154 68 C152 75 140 75 130 70 C110 66 90 66 70 70 C60 75 48 75 46 68Z", shade(x.a, .1)) },
  { id: "hardhat",   label: "ヘルメット", cover: { y: 80, hw: 46 }, front: x => P("M61 76 C61 42 80 29 100 29 C120 29 139 42 139 76Z", x.a) + P("M95 29.5 L105 29.5 L105 75 L95 75Z", shade(x.a, .12)) + P("M53 74 L147 74 C147 81 143 84 138 84 L62 84 C57 84 53 81 53 74Z", shade(x.a, .06)) + `<rect x="86" y="54" width="28" height="12" rx="3" fill="${x.b}"/>` },
  { id: "chef",      label: "コック帽",   cover: { y: 76, hw: 38 }, front: x => `<circle cx="78" cy="42" r="17" fill="${x.a}"/><circle cx="100" cy="32" r="20" fill="${x.a}"/><circle cx="122" cy="42" r="17" fill="${x.a}"/>` + P("M62 50 L138 50 L138 80 C114 74 86 74 62 80Z", x.a) + S("M62 52 L138 52", shade(x.a, .1), 2) + S("M80 54 L80 75 M100 54 L100 74 M120 54 L120 75", shade(x.a, .08), 1.5) },
  { id: "headband",  label: "ヘアバンド", front: x => P("M65 74 C80 67 120 67 135 74 L135 83 C120 76 80 76 65 83Z", x.a) + S("M65 78.5 C80 71.5 120 71.5 135 78.5", x.b, 2) },
  { id: "alice",     label: "カチューシャ", front: x => S("M64 88 C58 44 142 44 136 88", x.a, 6) },
  { id: "ribbon",    label: "リボン",     front: x => `<g transform="translate(124 52) rotate(18)">${P("M0 0 L-16 -9 L-16 9Z", x.a)}${P("M0 0 L16 -9 L16 9Z", x.a)}<circle r="4" fill="${shade(x.a, .15)}"/></g>` },
  { id: "flower",    label: "花の髪飾り", front: x => `<g transform="translate(126 58)">${[0,72,144,216,288].map(a => `<circle cx="${7 * Math.cos(a * Math.PI / 180)}" cy="${7 * Math.sin(a * Math.PI / 180)}" r="5.6" fill="${x.a}"/>`).join("")}<circle r="4" fill="${x.b}"/></g>` },
  { id: "newsboy",   label: "キャスケット", cover: { y: 78, hw: 42 }, front: x => P("M58 78 C54 46 80 33 104 35 C128 37 146 52 142 78Z", x.a) + S("M100 36 L84 74 M100 36 L120 74", shade(x.a, .15), 1.5) + P("M62 76 C84 69 116 69 138 76 C134 85 66 85 62 76Z", shade(x.a, .25)) + `<circle cx="100" cy="36" r="3.4" fill="${shade(x.a, .25)}"/>` },
  { id: "mortar",    label: "角帽",       cover: { y: 76, hw: 38 }, front: x => P("M62 64 C64 52 136 52 138 64 L138 80 C114 74 86 74 62 80Z", x.a) + P("M100 28 L152 44 L100 60 L48 44Z", shade(x.a, .1)) + S("M100 44 L140 50 L141 72", x.b, 2) + `<rect x="138" y="70" width="6" height="10" rx="2" fill="${x.b}"/>` },
  { id: "bandana",   label: "バンダナ",   cover: { y: 78, hw: 40 }, front: x => P("M61 81 C57 48 78 33 100 33 C122 33 143 48 139 81 C120 73 80 73 61 81Z", x.a) + both(`<circle cx="80" cy="54" r="2" fill="${x.b}"/><circle cx="90" cy="66" r="2" fill="${x.b}"/>`) + `<circle cx="100" cy="46" r="2" fill="${x.b}"/>` + P("M136 74 L152 80 L146 92 Z M136 74 L156 70 L154 84Z", x.a) },
  { id: "hijab",     label: "ヒジャブ",   hidesHair: true,
                     back: x => P("M56 100 C52 58 74 36 100 36 C126 36 148 58 144 100 C146 128 152 150 162 176 L38 176 C48 150 54 128 56 100Z", shade(x.a, .12)),
                     front: x => P("M56 100 C52 58 74 36 100 36 C126 36 148 58 144 100 C146 128 152 150 162 176 L38 176 C48 150 54 128 56 100Z M100 50 C79 50 68 64 67 86 C66 104 68 118 74 128 C80 138 90 144 100 144 C110 144 120 138 126 128 C132 118 134 104 133 86 C132 64 121 50 100 50Z", x.a, 'fill-rule="evenodd"') + S("M70 64 C80 54 120 54 130 64", shade(x.a, .15), 2) },
  { id: "crown",     label: "王冠",       front: x => P("M72 60 L70 30 L86 44 L100 24 L114 44 L130 30 L128 60Z", x.a) + `<circle cx="100" cy="50" r="4" fill="${x.b}"/><circle cx="84" cy="53" r="3" fill="${x.b}"/><circle cx="116" cy="53" r="3" fill="${x.b}"/>` },
];

export const EARGEAR = [
  { id: "none",       label: "なし",         draw: x => "" },
  { id: "headphones", label: "ヘッドホン",   draw: x => S("M63 100 C56 36 144 36 137 100", x.b, 6) + `<rect x="55" y="88" width="15" height="27" rx="7" fill="${x.a}"/><rect x="130" y="88" width="15" height="27" rx="7" fill="${x.a}"/><rect x="55" y="88" width="6" height="27" rx="3" fill="#000" opacity=".18"/><rect x="139" y="88" width="6" height="27" rx="3" fill="#000" opacity=".18"/>` },
  { id: "headset",    label: "ヘッドセット", draw: x => S("M64 100 C57 38 143 38 136 100", x.b, 4.5) + `<rect x="57" y="90" width="12" height="22" rx="6" fill="${x.a}"/><rect x="131" y="90" width="12" height="22" rx="6" fill="${x.a}"/>` + S("M63 110 C64 124 74 128 86 125", x.b, 2.6) + `<rect x="85" y="122" width="7" height="5" rx="2.5" fill="${x.b}"/>` },
  { id: "neckphones", label: "首にヘッドホン", body: true, draw: x => S("M70 160 C76 176 124 176 130 160", x.b, 5) + `<rect x="62" y="148" width="16" height="22" rx="7" transform="rotate(-25 70 159)" fill="${x.a}"/><rect x="122" y="148" width="16" height="22" rx="7" transform="rotate(25 130 159)" fill="${x.a}"/>` },
  { id: "earbuds",    label: "イヤホン",     draw: x => `<circle cx="62" cy="101" r="4" fill="${x.a}"/><circle cx="138" cy="101" r="4" fill="${x.a}"/>` + S("M62 105 L62 118 M138 105 L138 118", x.a, 2) },
  { id: "pencil",     label: "耳に鉛筆",     draw: x => `<g transform="rotate(-38 140 84)"><rect x="124" y="81" width="30" height="6" fill="${x.a}"/><path d="M154 81 L161 84 L154 87Z" fill="#f1d3a8"/><path d="M159 83.2 L161 84 L159 84.8Z" fill="${INK}"/><rect x="120" y="81" width="5" height="6" fill="#f2a0a8"/></g>` },
];

export const EARRINGS = [
  { id: "none",   label: "なし",     draw: x => "" },
  { id: "stud",   label: "スタッド", draw: x => [63,137].map(e => `<circle cx="${e}" cy="113" r="2.6" fill="${x.a}"/>`).join("") },
  { id: "hoop",   label: "フープ",   draw: x => [63,137].map(e => `<circle cx="${e}" cy="118" r="5" fill="none" stroke="${x.a}" stroke-width="1.8"/>`).join("") },
  { id: "drop",   label: "しずく",   draw: x => [63,137].map(e => S(`M${e} 113 L${e} 118`, x.a, 1.4) + P(`M${e} 117 C${e-3} 121 ${e-3} 124 ${e} 124.5 C${e+3} 124 ${e+3} 121 ${e} 117Z`, x.a)).join("") },
  { id: "pearl",  label: "パール",   draw: x => [63,137].map(e => `<circle cx="${e}" cy="114" r="3.2" fill="${x.a}"/><circle cx="${e-1}" cy="113" r="1" fill="#fff" opacity=".8"/>`).join("") },
  { id: "long",   label: "ロング",   draw: x => [63,137].map(e => S(`M${e} 113 L${e} 126`, x.a, 1.4) + `<circle cx="${e}" cy="128" r="2.6" fill="${x.a}"/>`).join("") },
];
