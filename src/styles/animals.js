// Animals — plush-toy busts: a big head on small shoulders.
// A species is just a combination of parts (cat = cat ears + cat nose + …), see CHARACTERS.
//
// Anchors: eyes at (81, 100) and (119, 100), nose at (100, 111), mouth around y 120.
// Ears are drawn behind the head unless `front` (floppy ears). Fluff has `back` / `front`.
// Marks are clipped to the head unless `free`. Colors left on "auto" follow the fur:
// the tokens "fur" and "shade" mean the fur color and a darker fur color.
import { defineLibrary } from "../core/library.js";
import { P, S, T, C, E, M, both, wave, blushGradient } from "../core/draw.js";
import { mix, shade } from "../core/color.js";

const INK = "#2b2233";
const LINE = "#33263a", LINE_W = 4.2;

const FUR = { "#f2a65a": "茶トラ", "#e9c79a": "柴", "#d9b26a": "こがね", "#a5683a": "茶", "#6e4a34": "こげ茶", "#f3f0e8": "白", "#c9c4bd": "うす灰", "#9a9aa4": "灰", "#3a3438": "黒", "#f5c6a0": "ピーチ", "#f5b5c4": "ピンク", "#8fb3d9": "そら", "#b7a6e0": "ラベンダー", "#9bcf9b": "ミント" };
const SUB = { "#fbf3e6": "クリーム", "#ffffff": "白", "#f6e1c3": "うす茶", "#f5c6a0": "ピーチ", "#f5b5c4": "ピンク", "#e9d3b0": "ベージュ", "#c9c4bd": "うす灰", "#3a3438": "黒" };
const ITEM = { "#e2553f": "朱", "#f2b33d": "山吹", "#5cae7a": "若竹", "#3fa7b7": "浅葱", "#2a4a7a": "藍", "#9b88c9": "藤", "#f5b5c4": "桜", "#ffffff": "白", "#3a3438": "墨", "#a5683a": "茶" };
const EYEC = { "#3a2a24": "こげ茶", "#2b2233": "黒", "#3fa7b7": "青", "#5cae7a": "緑", "#f2b33d": "金", "#9b88c9": "紫" };
const BG = { "#fff4e0": "たまご", "#fde2e4": "さくら", "#e3efe2": "わかば", "#dfe8f3": "そら", "#efe6f7": "ふじ", "#f6efe2": "きなり", "#3a3f5c": "よる" };
const NAMES = { ...FUR, ...SUB, ...ITEM, ...EYEC, ...BG, auto: "おまかせ" };
const PALETTES = { fur: Object.keys(FUR), sub: Object.keys(SUB), item: ["auto", ...Object.keys(ITEM)], eyes: Object.keys(EYEC), bg: Object.keys(BG) };

const EX = [81, 119], EY = 100;
const BODY = "M100 144 C76 144 60 150 50 160 C40 170 36 186 35 200 L165 200 C164 186 160 170 150 160 C140 150 124 144 100 144Z";

const HEADS = [
  { id: "maru",    label: "まる",     top: 48, d: "M100 48 C134 48 154 72 154 102 C154 132 130 150 100 150 C70 150 46 132 46 102 C46 72 66 48 100 48Z" },
  { id: "yoko",    label: "よこ長",   top: 54, d: "M100 54 C142 54 164 78 164 106 C164 134 136 150 100 150 C64 150 36 134 36 106 C36 78 58 54 100 54Z" },
  { id: "tamago",  label: "たまご",   top: 44, d: "M100 44 C130 44 148 72 148 104 C148 134 128 152 100 152 C72 152 52 134 52 104 C52 72 70 44 100 44Z" },
  { id: "mochi",   label: "もちもち", top: 50, d: "M100 50 C132 50 150 72 150 96 C150 110 160 122 158 134 C154 150 126 154 100 154 C74 154 46 150 42 134 C40 122 50 110 50 96 C50 72 68 50 100 50Z" },
  { id: "togari",  label: "ほっぺとがり", top: 50, d: "M100 50 C134 50 152 72 152 98 C152 114 158 124 162 134 C142 140 120 152 100 154 C80 152 58 140 38 134 C42 124 48 114 48 98 C48 72 66 50 100 50Z" },
];

const EARS = [
  { id: "neko",    label: "ねこ",     draw: (x) => both(P("M52 82 L56 36 L92 58Z", x.a) + P("M60 70 L62 46 L82 60Z", x.b)) },
  { id: "inu",     label: "たれ耳",   front: true, draw: (x) => both(P("M60 58 C40 56 30 86 36 116 C40 128 54 126 60 112 C66 96 70 72 60 58Z", x.a)) },
  { id: "pin",     label: "立ち耳",   draw: (x) => both(P("M54 80 C50 52 56 34 66 26 C80 34 90 48 92 60Z", x.a) + P("M62 70 C60 54 64 42 68 38 C76 44 82 52 84 60Z", x.b)) },
  { id: "kuma",    label: "まる耳",   draw: (x) => both(C(64, 58, 15, x.a) + C(64, 58, 7.5, x.b)) },
  { id: "usagi",   label: "うさぎ",   draw: (x) => both(P("M76 62 C66 30 68 2 80 0 C92 2 94 30 90 60Z", x.a) + P("M79 56 C73 32 74 12 80 9 C86 12 87 32 86 56Z", x.b)) },
  { id: "usagiTare", label: "ロップ", front: true, draw: (x) => both(P("M66 58 C46 58 36 82 38 120 C40 136 56 136 60 122 C64 104 70 80 66 58Z", x.a) + P("M60 70 C50 74 46 92 48 118 C50 126 54 126 56 118 C58 100 62 84 60 70Z", x.b)) },
  { id: "kitsune", label: "とがり耳", draw: (x) => both(P("M50 84 C48 50 56 28 66 18 C80 30 92 50 94 62Z", x.a) + P("M58 74 C58 50 62 38 66 32 C76 42 84 54 86 62Z", x.b) + P("M66 18 C70 22 72 26 72 30 L62 30 C63 26 64 22 66 18Z", shade(x.a, .45))) },
  { id: "nezumi",  label: "おおまる耳", draw: (x) => both(C(56, 62, 22, x.a) + C(56, 62, 13, x.b)) },
  { id: "koala",   label: "ふわふわ耳", draw: (x) => both(P(wave(54, 74, 22, 22, 0, 360, 10, 3) + "Z", x.a) + C(56, 76, 11, x.b)) },
  { id: "hitsuji", label: "よこ耳",   draw: (x) => both(`<ellipse cx="42" cy="96" rx="17" ry="8" transform="rotate(22 42 96)" fill="${x.a}"/><ellipse cx="44" cy="96" rx="10" ry="4" transform="rotate(22 44 96)" fill="${x.b}"/>`) },
  { id: "buta",    label: "ぶた耳",   draw: (x) => both(P("M58 72 L56 42 L86 56Z", x.a) + P("M62 64 L61 50 L76 58Z", x.b)) },
  { id: "none",    label: "なし",     draw: () => "" },
];

const NOSE = (x, w = 6.6, h = 4.8, y = 111) => E(100, y, w, h, INK) + E(98, y - 1.8, 2, 1.1, "#fff", 'opacity=".7"');
const MUZZLES = [
  { id: "neko",    label: "ねこ",     draw: (x) => ({ pad: P("M100 112 C92 107 82 109 82 118 C82 127 94 127 100 122 C106 127 118 127 118 118 C118 109 108 107 100 112Z", x.b), nose: P("M95.5 108.5 L104.5 108.5 L100 114Z", "#f08a9b", `stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"`) }) },
  { id: "inu",     label: "いぬ",     draw: (x) => ({ pad: E(100, 119, 22, 16, x.b), nose: NOSE(x, 8, 6, 110) }) },
  { id: "kuma",    label: "くま",     draw: (x) => ({ pad: E(100, 120, 19, 14, x.b), nose: NOSE(x, 6.6, 4.8, 113) }) },
  { id: "kitsune", label: "きつね",   draw: (x) => ({ pad: E(100, 121, 15, 12, x.b), nose: NOSE(x, 5.6, 4.2, 113) }) },
  { id: "buta",    label: "ぶた",     draw: (x) => ({ pad: E(100, 116, 15, 11, mix(x.a, "#f3a7b5", .55)), nose: E(95, 116, 2.4, 3.4, shade(mix(x.a, "#f3a7b5", .55), .45)) + E(105, 116, 2.4, 3.4, shade(mix(x.a, "#f3a7b5", .55), .45)) }) },
  { id: "usagi",   label: "うさぎ",   draw: (x) => ({ pad: both(E(94, 118, 7, 6, x.b)), nose: P("M96 110 Q100 107 104 110 Q102 114 100 114.5 Q98 114 96 110Z", "#f08a9b") }) },
  { id: "koala",   label: "コアラ",   draw: (x) => ({ pad: "", nose: P("M100 100 C110 100 113 110 112 116 C111 122 106 124 100 124 C94 124 89 122 88 116 C87 110 90 100 100 100Z", "#3a3438", `stroke="${LINE}" stroke-width="1.6"`) + E(96, 106, 3, 2, "#fff", 'opacity=".5"') }) },
  { id: "nezumi",  label: "ねずみ",   draw: (x) => ({ pad: "", nose: C(100, 112, 4.6, "#f08a9b", `stroke="${LINE}" stroke-width="1.4"`) }) },
  { id: "tori",    label: "くちばし", beak: true, draw: (x) => ({ pad: "", nose: P("M88 109 Q100 101 112 109 Q106 122 100 125 Q94 122 88 109Z", "#f2a93b", `stroke="${LINE}" stroke-width="2" stroke-linejoin="round"`) + T([90, 110.5, 100, 113, 110, 110.5], shade("#f2a93b", .3), 1.2) }) },
  { id: "none",    label: "なし",     draw: () => ({ pad: "", nose: "" }) },
];

const hi = (x, y, r) => C(x, y, r, "#fff");
const EYES = [
  { id: "kuro",     label: "つぶら",   draw: (x) => EX.map(e => E(e, EY, 6.6, 7.4, INK) + hi(e + 2.4, EY - 2.8, 2.4) + C(e - 2.2, EY + 3, 1.1, "#fff", 'fill-opacity=".8"')).join("") },
  { id: "kirakira", label: "キラキラ", draw: (x) => EX.map(e => E(e, EY, 7.4, 8.4, x.a) + E(e, EY + 1, 4.2, 5, INK) + hi(e + 2.6, EY - 3.4, 2.6) + C(e - 2.6, EY + 3.6, 1.3, "#fff") + T([e - 8, EY - 6, e, EY - 12.4, e + 8, EY - 6], INK, 2.2)).join("") },
  { id: "small",    label: "ちいさめ", draw: () => EX.map(e => E(e, EY + 1, 4, 4.6, INK) + hi(e + 1.4, EY - .6, 1.4)).join("") },
  { id: "nikkori",  label: "にっこり", draw: () => EX.map(e => T([e - 8, EY + 2, e, EY - 8, e + 8, EY + 2], INK, 3.8)).join("") },
  { id: "tare",     label: "たれ目",   draw: () => EX.map(e => { const d = e < 100 ? -1 : 1; return E(e, EY + 1, 6, 6.6, INK) + hi(e + 2, EY - 1.6, 2) + T([e - 8 * d, EY - 5, e - 1 * d, EY - 9, e + 9 * d, EY - 3], INK, 2.2); }).join("") },
  { id: "tsuri",    label: "つり目",   draw: () => EX.map(e => { const d = e < 100 ? -1 : 1; return P(`M${e - 7 * d} ${EY + 3} Q${e} ${EY - 7} ${e + 8 * d} ${EY - 5} Q${e + 2 * d} ${EY + 6} ${e - 7 * d} ${EY + 3}Z`, INK) + hi(e + 1.5 * d, EY - 1.5, 1.6); }).join("") },
  { id: "jito",     label: "ジト目",   draw: () => EX.map(e => P(`M${e - 7} ${EY - 1} Q${e} ${EY + 10} ${e + 7} ${EY - 1}Z`, INK) + T([e - 9, EY - 1.4, e, EY - 3, e + 9, EY - 1.4], INK, 2.4)).join("") },
  { id: "uruuru",   label: "うるうる", draw: (x) => EX.map(e => E(e, EY, 7.4, 8.4, INK) + E(e, EY + 4, 5.4, 3.4, x.a, 'opacity=".9"') + hi(e + 2.6, EY - 3.6, 2.8) + hi(e - 2.8, EY - 1, 1.6)).join("") },
  { id: "wink",     label: "ウインク", draw: () => E(EX[0], EY, 6.6, 7.4, INK) + hi(EX[0] + 2.4, EY - 2.8, 2.4) + T([EX[1] - 8, EY + 2, EX[1], EY - 8, EX[1] + 8, EY + 2], INK, 3.8) },
  { id: "guru",     label: "ぐるぐる", draw: () => EX.map(e => { let d = ""; for (let i = 0; i <= 26; i++){ const a = i * .58, r = .3 + i * .24; d += (i ? " L" : "M") + (e + r * Math.cos(a)).toFixed(2) + " " + (EY + r * Math.sin(a)).toFixed(2); } return S(d, INK, 2.2); }).join("") },
];

const STEM = (y0 = 115) => S(`M100 ${y0} L100 ${y0 + 4.5}`, INK, 2.2);
const MOUTHS = [
  { id: "omega",  label: "ω",       draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK, 2.6) },
  { id: "nikko",  label: "にこ",     draw: () => STEM() + T([90, 119.5, 100, 127.5, 110, 119.5], INK, 3) },
  { id: "open",   label: "ぱかっ",   draw: () => STEM() + P("M90 119 Q100 136 110 119Z", "#6b2230", `stroke="${LINE}" stroke-width="2" stroke-linejoin="round"`) + P("M94 127 Q100 123 106 127 Q100 131 94 127Z", "#f08a9b") },
  { id: "bero",   label: "ぺろっ",   draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK, 2.6) + P("M100 122 L106 122 Q108 130 103 132 Q99 131 100 122Z", "#f08a9b", `stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"`) },
  { id: "ha",     label: "まえば",   draw: () => STEM() + S("M90.5 119.5 Q95.25 126 100 119.5 Q104.75 126 109.5 119.5", INK, 2.6) + `<rect x="96" y="122" width="8" height="7" rx="1.4" fill="#fff" stroke="${LINE}" stroke-width="1.6"/>` + S("M100 122 L100 129", LINE, 1.2) },
  { id: "kiba",   label: "きば",     draw: () => STEM() + T([89, 119.5, 100, 127.5, 111, 119.5], INK, 3) + P("M103 123 L109 122 L106.5 128Z", "#fff", `stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"`) },
  { id: "mu",     label: "むっ",     draw: () => STEM() + T([92, 121, 100, 122.5, 108, 121], INK, 2.6) },
  { id: "o",      label: "おっ",     draw: () => STEM(114) + E(100, 124, 4, 5, "#6b2230", `stroke="${LINE}" stroke-width="1.8"`) },
];

const MARKS = [
  { id: "blush",    label: "ほっぺ",     free: true, draw: (x) => E(70, 116, 11, 7, `url(#${x.id}bl)`) + E(130, 116, 11, 7, `url(#${x.id}bl)`) },
  { id: "panda",    label: "パンダ目",   auto: "#3a3438", draw: (x) => both(`<path d="M81 88 C70 87 63 96 65 107 C67 116 78 117 86 110 C92 103 92 89 81 88Z" fill="${x.m}" transform="rotate(-12 80 102)"/>`) },
  { id: "tanuki",   label: "たぬき目",   auto: "#4a3428", draw: (x) => P("M56 92 C64 82 88 84 96 95 C98 100 102 100 104 95 C112 84 136 82 144 92 C148 105 136 115 122 113 C112 111 106 107 100 109 C94 107 88 111 78 113 C64 115 52 105 56 92Z", x.m) },
  { id: "kitsune",  label: "白い口元",   auto: "#ffffff", draw: (x) => P("M40 110 C58 116 78 110 90 117 C96 121 104 121 110 117 C122 110 142 116 160 110 L164 170 L36 170Z", x.m) },
  { id: "kao",      label: "顔まど",     auto: "#ffffff", draw: (x) => P("M100 68 C88 56 60 60 58 88 C56 114 76 140 100 148 C124 140 144 114 142 88 C140 60 112 56 100 68Z", x.m) },
  { id: "tora",     label: "しま",       auto: "#5a3a26", draw: (x) => T([100, 52, 101, 62, 100, 74], x.m, 4.4) + both(T([86, 54, 88, 62, 90, 70], x.m, 3.4) + T([40, 112, 50, 110, 60, 113], x.m, 3.6) + T([42, 124, 50, 121, 58, 123], x.m, 3)) },
  { id: "bucchi",   label: "ぶち",       auto: "#6e4a34", draw: (x) => P(wave(122, 96, 18, 16, 0, 360, 9, 2.4) + "Z", x.m) },
  { id: "hitai",    label: "おでこ",     auto: "#ffffff", draw: (x) => P("M100 56 C108 66 108 78 100 86 C92 78 92 66 100 56Z", x.m) },
  { id: "mayu",     label: "まろ眉",     auto: "#ffffff", draw: (x) => both(E(84, 84, 5.6, 3.8, x.m)) },
  { id: "hige",     label: "ひげ",       free: true, draw: () => both(T([74, 118, 60, 114, 46, 113], INK, 1.5) + T([74, 123, 60, 124, 46, 127], INK, 1.5)) },
];

const FLUFFS = [
  { id: "none",   label: "なし" },
  { id: "mane",   label: "たてがみ", auto: "shade", back: (x) => P(wave(100, 104, 68, 62, 0, 360, 18, 8) + "Z", x.f) + P(wave(100, 104, 58, 54, 10, 370, 16, 5) + "Z", shade(x.f, .14)) },
  { id: "wool",   label: "もこもこ", auto: "#f6f1e7", back: (x) => P(wave(100, 100, 62, 58, 0, 360, 16, 7) + "Z", x.f),
                                     front: (x) => P(wave(100, 70, 44, 24, 180, 360, 8, 6) + wave(100, 70, 44, 12, 0, 180, 7, 4, 1, false) + "Z", x.f) },
  { id: "tuft",   label: "ぴょこ毛", auto: "fur", front: (x, H) => P(`M100 ${H.top + 6} Q92 ${H.top - 6} 84 ${H.top - 8} Q92 ${H.top - 2} 96 ${H.top + 6} Z M100 ${H.top + 6} Q100 ${H.top - 10} 106 ${H.top - 16} Q104 ${H.top - 4} 104 ${H.top + 6}Z`, x.f) },
  { id: "cheek",  label: "ほっぺの毛", auto: "fur", back: (x) => both(P("M54 104 L36 112 L52 118 L38 128 L56 128 L44 140 L64 134Z", x.f)) },
  { id: "crest",  label: "とさか",   auto: "#e2553f", back: (x, H) => P(`M86 ${H.top + 10} Q82 ${H.top - 12} 92 ${H.top - 18} Q94 ${H.top - 8} 98 ${H.top - 6} Q98 ${H.top - 22} 108 ${H.top - 24} Q106 ${H.top - 10} 110 ${H.top - 6} Q116 ${H.top - 16} 122 ${H.top - 12} Q118 ${H.top} 116 ${H.top + 10}Z`, x.f) },
  { id: "bang",   label: "まえがみ", auto: "fur", front: (x, H) => P(`M74 ${H.top + 14} Q86 ${H.top - 4} 100 ${H.top - 2} Q116 ${H.top - 4} 126 ${H.top + 14} Q118 ${H.top + 12} 114 ${H.top + 20} Q110 ${H.top + 10} 104 ${H.top + 22} Q100 ${H.top + 10} 94 ${H.top + 22} Q90 ${H.top + 12} 86 ${H.top + 20} Q82 ${H.top + 12} 74 ${H.top + 14}Z`, x.f) },
];

const CLOTHES = [
  { id: "none",     label: "なし",       draw: () => "" },
  { id: "tee",      label: "Tシャツ",    draw: (x) => P(BODY, x.a) + S("M74 152 Q100 172 126 152", shade(x.a, .18), 4) },
  { id: "hoodie",   label: "パーカー",   draw: (x) => P(BODY, x.a) + P("M58 162 C62 144 80 140 100 146 C120 140 138 144 142 162 C130 170 116 164 100 166 C84 164 70 170 58 162Z", shade(x.a, .15)) + S("M92 164 L90 188 M108 164 L110 188", x.b, 2.6) },
  { id: "sweater",  label: "セーター",   draw: (x) => P(BODY, x.a) + `<rect x="0" y="176" width="200" height="8" fill="${x.b}"/>` + S("M72 151 Q100 172 128 151", shade(x.a, .15), 6) },
  { id: "overall",  label: "オーバーオール", draw: (x) => P(BODY, x.b) + P("M70 168 L130 168 L136 200 L64 200Z", x.a) + S("M74 170 L66 146 M126 170 L134 146", x.a, 5) + C(74, 172, 2.6, "#f2b33d") + C(126, 172, 2.6, "#f2b33d") + `<rect x="90" y="178" width="20" height="12" rx="2" fill="${shade(x.a, .12)}"/>` },
  { id: "suit",     label: "スーツ",     draw: (x) => P(BODY, x.a) + P("M84 148 L100 190 L116 148Z", "#fff") + P("M97 156 L103 156 L105 182 L100 188 L95 182Z", x.b) + both(P("M84 148 L100 190 L94 194 L78 164 L84 158 L76 152Z", shade(x.a, .2))) },
  { id: "kimono",   label: "きもの",     draw: (x) => P(BODY, x.a) + P("M84 146 L100 176 L116 146 L120 150 L100 186 L80 150Z", x.b) + S("M118 150 L88 200", shade(x.a, .2), 2.4) },
  { id: "apron",    label: "エプロン",   draw: (x) => P(BODY, "#ffffff") + P("M72 164 L128 164 L134 200 L66 200Z", x.a) + S("M74 166 L66 146 M126 166 L134 146", x.a, 4) + `<rect x="90" y="176" width="20" height="12" rx="2" fill="${shade(x.a, .1)}"/>` },
  { id: "raincoat", label: "レインコート", draw: (x) => P(BODY, x.a) + S("M100 154 L100 200", shade(x.a, .3), 2.4) + [164, 178, 192].map(y => C(106, y, 2.4, x.b)).join("") + both(P("M80 150 L100 160 L90 170Z", shade(x.a, .12))) },
];
const NECKS = [
  { id: "none",     label: "なし",         draw: () => "" },
  { id: "kubiwa",   label: "くびわ",       auto: ["#e2553f", "#f2b33d"], draw: (x) => P("M64 150 Q100 166 136 150 L136 158 Q100 174 64 158Z", x.a) + C(100, 172, 7, x.b) + S("M94 173 L106 173", shade(x.b, .45), 1.6) },
  { id: "bandana",  label: "バンダナ",     auto: ["#e2553f", "#ffffff"], draw: (x) => P("M66 150 Q100 162 134 150 L100 190Z", x.a) + [[90, 160], [110, 160], [100, 174]].map(([a, b]) => C(a, b, 2, x.b)).join("") },
  { id: "scarf",    label: "マフラー",     auto: ["#2a4a7a", "#f3f0e8"], draw: (x) => P("M62 148 Q100 168 138 148 L138 160 Q100 180 62 160Z", x.a) + P("M112 160 L126 158 L130 192 L116 192Z", x.a) + S("M64 154 Q100 172 136 154", x.b, 2.4) },
  { id: "bowtie",   label: "ちょうネクタイ", auto: ["#e2553f", "#3a3438"], draw: (x) => P("M100 158 L86 150 L86 166Z M100 158 L114 150 L114 166Z", x.a) + C(100, 158, 3.6, shade(x.a, .2)) },
  { id: "ribbon",   label: "リボン",       auto: ["#f5b5c4", "#e2553f"], draw: (x) => P("M100 160 L84 150 L84 170Z M100 160 L116 150 L116 170Z", x.a) + S("M98 162 L92 182 M102 162 L108 182", x.a, 3) + C(100, 160, 4, x.b) },
  { id: "suzu",     label: "すず",         auto: ["#e2553f", "#f2b33d"], draw: (x) => S("M64 152 Q100 168 136 152", x.a, 4) + C(100, 168, 8, x.b) + S("M94 169 L106 169 M100 169 L100 175", shade(x.b, .45), 1.6) + C(97, 165, 2, "#fff", 'opacity=".7"') },
];
const HATS = [
  { id: "none",     label: "なし" },
  { id: "beret",    label: "ベレー帽",   auto: ["#e2553f", "#3a3438"], draw: (x, H) => `<ellipse cx="96" cy="${H.top + 6}" rx="38" ry="13" transform="rotate(-10 96 ${H.top + 6})" fill="${x.a}"/><rect x="92" y="${H.top - 10}" width="6" height="8" rx="3" fill="${x.a}"/>` },
  { id: "cap",      label: "キャップ",   auto: ["#3fa7b7", "#ffffff"], draw: (x, H) => P(`M60 ${H.top + 30} C58 ${H.top - 2} 78 ${H.top - 14} 100 ${H.top - 14} C122 ${H.top - 14} 142 ${H.top - 2} 140 ${H.top + 30} C124 ${H.top + 24} 76 ${H.top + 24} 60 ${H.top + 30}Z`, x.a) + P(`M56 ${H.top + 30} C80 ${H.top + 20} 120 ${H.top + 20} 144 ${H.top + 30} C146 ${H.top + 37} 138 ${H.top + 40} 128 ${H.top + 37} C110 ${H.top + 33} 90 ${H.top + 33} 72 ${H.top + 37} C62 ${H.top + 40} 54 ${H.top + 37} 56 ${H.top + 30}Z`, x.b) + C(100, H.top - 13, 3.4, x.b) },
  { id: "crown",    label: "おうかん",   auto: ["#f2b33d", "#e2553f"], draw: (x, H) => P(`M76 ${H.top + 12} L72 ${H.top - 20} L88 ${H.top - 6} L100 ${H.top - 26} L112 ${H.top - 6} L128 ${H.top - 20} L124 ${H.top + 12}Z`, x.a) + C(100, H.top + 2, 4, x.b) + C(84, H.top + 4, 3, x.b) + C(116, H.top + 4, 3, x.b) },
  { id: "flower",   label: "おはな",     auto: ["#f5b5c4", "#f2b33d"], draw: (x, H) => `<g transform="translate(126 ${H.top + 12})">${[0, 72, 144, 216, 288].map(a => C(8 * Math.cos(a * Math.PI / 180), 8 * Math.sin(a * Math.PI / 180), 6.4, x.a)).join("")}${C(0, 0, 4.4, x.b)}</g>` },
  { id: "leaf",     label: "はっぱ",     auto: ["#5cae7a", "#3f7a4a"], draw: (x, H) => `<g transform="rotate(20 104 ${H.top})">${P(`M104 ${H.top + 8} Q86 ${H.top - 6} 104 ${H.top - 26} Q122 ${H.top - 6} 104 ${H.top + 8}Z`, x.a)}${S(`M104 ${H.top + 6} L104 ${H.top - 20}`, x.b, 1.6)}</g>` },
  { id: "party",    label: "パーティー", auto: ["#9b88c9", "#f2b33d"], draw: (x, H) => `<g transform="rotate(12 104 ${H.top})">${P(`M88 ${H.top + 10} L104 ${H.top - 34} L120 ${H.top + 10}Z`, x.a)}${S(`M93 ${H.top - 2} L115 ${H.top - 2} M98 ${H.top - 16} L110 ${H.top - 16}`, x.b, 3)}${C(104, H.top - 36, 5, x.b)}</g>` },
  { id: "headphones", label: "ヘッドホン", auto: ["#3a3438", "#e2553f"], draw: (x, H) => S(`M50 108 C44 ${H.top - 8} 156 ${H.top - 8} 150 108`, x.a, 6) + `<rect x="38" y="94" width="16" height="30" rx="8" fill="${x.b}"/><rect x="146" y="94" width="16" height="30" rx="8" fill="${x.b}"/>` },
  { id: "straw",    label: "むぎわら",   auto: ["#e9c97a", "#e2553f"], draw: (x, H) => P(`M70 ${H.top + 16} C70 ${H.top - 8} 84 ${H.top - 16} 100 ${H.top - 16} C116 ${H.top - 16} 130 ${H.top - 8} 130 ${H.top + 16}Z`, x.a) + `<rect x="70" y="${H.top + 6}" width="60" height="8" fill="${x.b}"/>` + E(100, H.top + 16, 52, 9, x.a) + S(`M56 ${H.top + 16} Q100 ${H.top + 24} 144 ${H.top + 16}`, shade(x.a, .2), 1.4) },
];
const GLASSES = [
  { id: "none",   label: "なし",       draw: () => "" },
  { id: "round",  label: "まるめがね", draw: (x) => `<g fill="none" stroke="${x.a}" stroke-width="2.6">${C(81, 100, 12, "#fff", 'fill-opacity=".18"')}${C(119, 100, 12, "#fff", 'fill-opacity=".18"')}<path d="M93 99 Q100 95 107 99"/></g>` },
  { id: "square", label: "しかく",     draw: (x) => `<g fill="none" stroke="${x.a}" stroke-width="2.6"><rect x="67" y="90" width="28" height="20" rx="6" fill="#fff" fill-opacity=".18"/><rect x="105" y="90" width="28" height="20" rx="6" fill="#fff" fill-opacity=".18"/><path d="M95 98 L105 98"/></g>` },
  { id: "sun",    label: "サングラス", draw: (x) => `<g stroke="${x.a}" stroke-width="2.4"><rect x="66" y="91" width="29" height="18" rx="8" fill="#2b2233"/><rect x="105" y="91" width="29" height="18" rx="8" fill="#2b2233"/><path d="M95 98 L105 98" fill="none"/></g>` + both(S("M71 95 L78 95", "#fff", 2, 'opacity=".5"')) },
  { id: "heart",  label: "ハート",     draw: (x) => both(`<path d="M81 112 C70 104 66 98 68 93 C70 88 77 88 81 93 C85 88 92 88 94 93 C96 98 92 104 81 112Z" fill="#e2553f" fill-opacity=".85" stroke="${x.a}" stroke-width="2.2" stroke-linejoin="round"/>`) + S("M94 96 L106 96", x.a, 2.2) },
];

const PARTS = { head: HEADS, ears: EARS, muzzle: MUZZLES, eyes: EYES, mouth: MOUTHS, marks: MARKS, fluff: FLUFFS, clothes: CLOTHES, neck: NECKS, hat: HATS, glasses: GLASSES };
const CATEGORIES = [
  { key: "head",    label: "かお形",   colors: [{ key: "furColor", label: "けの色", palette: PALETTES.fur }, { key: "furColor2", label: "おなか・口元の色", palette: PALETTES.sub }] },
  { key: "eyes",    label: "め",       colors: [{ key: "eyesColor", label: "ひとみ（キラキラ・うるうる）", palette: PALETTES.eyes }] },
  { key: "muzzle",  label: "はな" },
  { key: "mouth",   label: "くち" },
  { key: "marks",   label: "もよう",   multi: true, colors: [{ key: "markColor", label: "もようの色", palette: ["auto", ...PALETTES.fur] }] },
  { key: "ears",    label: "みみ",     colors: [{ key: "earColor", label: "みみの外", palette: ["auto", ...PALETTES.fur] }, { key: "earColor2", label: "みみの内", palette: ["auto", ...PALETTES.sub] }] },
  { key: "fluff",   label: "けがわ",   colors: [{ key: "fluffColor", label: "けがわの色", palette: ["auto", ...PALETTES.fur] }] },
  { key: "clothes", label: "ふく",     colors: [{ key: "clothesColor", label: "メイン", palette: PALETTES.item.slice(1) }, { key: "clothesColor2", label: "サブ", palette: PALETTES.item.slice(1) }] },
  { key: "neck",    label: "くびもと", colors: [{ key: "neckColor", label: "メイン", palette: PALETTES.item }, { key: "neckColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "hat",     label: "ぼうし",   colors: [{ key: "hatColor", label: "メイン", palette: PALETTES.item }, { key: "hatColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "glasses", label: "めがね",   colors: [{ key: "glassesColor", label: "フレーム", palette: ["#2b2233", "#a5683a", "#f2b33d", "#e2553f", "#3fa7b7", "#ffffff"] }] },
  { key: "bg",      label: "はいけい", colors: [{ key: "bgColor", label: "はいけいの色", palette: PALETTES.bg }] },
];
const GROUPS = [
  { label: "かお",     cats: ["head", "eyes", "muzzle", "mouth", "marks"] },
  { label: "みみ・け", cats: ["ears", "fluff"] },
  { label: "ふく",     cats: ["clothes", "neck"] },
  { label: "こもの",   cats: ["hat", "glasses"] },
  { label: "はいけい", cats: ["bg"] },
];
const DEFAULTS = {
  head: "maru", furColor: "#f2a65a", furColor2: "#fbf3e6",
  ears: "neko", earColor: "auto", earColor2: "auto",
  muzzle: "neko", eyes: "kuro", eyesColor: "#3a2a24", mouth: "omega",
  marks: ["blush"], markColor: "auto",
  fluff: "none", fluffColor: "auto",
  clothes: "none", clothesColor: "#3fa7b7", clothesColor2: "#ffffff",
  neck: "none", neckColor: "auto", neckColor2: "auto",
  hat: "none", hatColor: "auto", hatColor2: "auto",
  glasses: "none", glassesColor: "#2b2233",
  bgColor: "#fff4e0",
};

const CHARACTERS = [
  { label: "ねこ",       head: "yoko",   furColor: "#f2a65a", furColor2: "#fbf3e6", ears: "neko", muzzle: "neko", mouth: "omega", marks: ["blush", "tora", "hige"], markColor: "#c9743a" },
  { label: "しばいぬ",   head: "mochi",  furColor: "#e9c79a", furColor2: "#ffffff", ears: "pin", muzzle: "inu", mouth: "nikko", marks: ["blush", "kitsune", "mayu"], neck: "bandana", bgColor: "#e3efe2" },
  { label: "くま",       head: "maru",   furColor: "#a5683a", furColor2: "#f6e1c3", ears: "kuma", muzzle: "kuma", mouth: "omega", eyes: "kuro", clothes: "overall", clothesColor: "#2a4a7a", clothesColor2: "#e2553f", bgColor: "#fff4e0" },
  { label: "うさぎ",     head: "tamago", furColor: "#f3f0e8", furColor2: "#ffffff", ears: "usagi", muzzle: "usagi", mouth: "ha", eyes: "kirakira", eyesColor: "#e2553f", neck: "ribbon", bgColor: "#fde2e4" },
  { label: "パンダ",     head: "maru",   furColor: "#f3f0e8", furColor2: "#ffffff", ears: "kuma", earColor: "#3a3438", earColor2: "#3a3438", muzzle: "kuma", mouth: "omega", marks: ["blush", "panda"], hat: "leaf", bgColor: "#e3efe2" },
  { label: "きつね",     head: "togari", furColor: "#f2a65a", furColor2: "#ffffff", ears: "kitsune", muzzle: "kitsune", mouth: "nikko", eyes: "tsuri", marks: ["blush", "kitsune"], fluff: "cheek", bgColor: "#efe6f7" },
  { label: "たぬき",     head: "mochi",  furColor: "#a5683a", furColor2: "#f6e1c3", ears: "kuma", muzzle: "kuma", mouth: "omega", marks: ["blush", "tanuki"], hat: "leaf", bgColor: "#e3efe2" },
  { label: "ハムスター", head: "mochi",  furColor: "#f5c6a0", furColor2: "#ffffff", ears: "kuma", muzzle: "nezumi", mouth: "ha", eyes: "kuro", marks: ["blush", "kitsune"], bgColor: "#fff4e0" },
  { label: "ライオン",   head: "maru",   furColor: "#e9c79a", furColor2: "#fbf3e6", ears: "kuma", muzzle: "kuma", mouth: "kiba", eyes: "tsuri", fluff: "mane", fluffColor: "#b8642e", hat: "crown", bgColor: "#fff4e0" },
  { label: "ひつじ",     head: "tamago", furColor: "#f5c6a0", furColor2: "#fbf3e6", ears: "hitsuji", muzzle: "none", mouth: "nikko", eyes: "nikkori", fluff: "wool", bgColor: "#dfe8f3" },
  { label: "ぶた",       head: "yoko",   furColor: "#f5b5c4", furColor2: "#fbf3e6", ears: "buta", muzzle: "buta", mouth: "nikko", eyes: "small", clothes: "apron", clothesColor: "#3fa7b7", bgColor: "#fde2e4" },
  { label: "とら",       head: "yoko",   furColor: "#f2b33d", furColor2: "#ffffff", ears: "kuma", muzzle: "neko", mouth: "kiba", eyes: "tsuri", marks: ["blush", "tora", "kitsune", "hige"], bgColor: "#e3efe2" },
  { label: "コアラ",     head: "yoko",   furColor: "#9a9aa4", furColor2: "#f3f0e8", ears: "koala", earColor2: "#f3f0e8", muzzle: "koala", mouth: "mu", eyes: "jito", marks: ["blush"], glasses: "none", bgColor: "#dfe8f3", extra: "koala" },
  { label: "ペンギン",   head: "tamago", furColor: "#3a3438", furColor2: "#ffffff", ears: "none", muzzle: "tori", eyes: "kuro", marks: ["blush", "kao"], neck: "scarf", bgColor: "#dfe8f3" },
  { label: "ねずみ",     head: "maru",   furColor: "#c9c4bd", furColor2: "#ffffff", ears: "nezumi", muzzle: "nezumi", mouth: "ha", eyes: "kirakira", eyesColor: "#3fa7b7", marks: ["blush", "hige"], bgColor: "#efe6f7" },
  { label: "ひよこ",     head: "tamago", furColor: "#f2d24a", furColor2: "#fff4c2", ears: "none", muzzle: "tori", eyes: "kuro", fluff: "tuft", marks: ["blush"], bgColor: "#e3efe2" },
  { label: "いぬ",       head: "maru",   furColor: "#f3f0e8", furColor2: "#ffffff", ears: "inu", earColor: "#a5683a", muzzle: "inu", mouth: "bero", marks: ["blush", "bucchi"], neck: "kubiwa", bgColor: "#fff4e0" },
  { label: "ロップうさぎ", head: "maru", furColor: "#e9c79a", furColor2: "#fbf3e6", ears: "usagiTare", muzzle: "usagi", mouth: "omega", eyes: "uruuru", eyesColor: "#a5683a", hat: "flower", bgColor: "#fde2e4" },
].map(({ extra, ...c }) => c);

function randomAnimal(r) {
  const { pick, chance } = r;
  const base = { ...r.pick(CHARACTERS) };
  delete base.label;
  if (r.chance(.35)) base.furColor = r.pick(PALETTES.fur);
  base.eyes = r.chance(.5) ? base.eyes || "kuro" : r.pick(EYES.map(e => e.id));
  base.mouth = r.chance(.5) ? base.mouth || "omega" : r.pick(MOUTHS.map(m => m.id));
  base.clothes = r.chance(.45) ? r.pick(CLOTHES.map(c => c.id).slice(1)) : base.clothes || "none";
  base.clothesColor = r.pick(Object.keys(ITEM)); base.clothesColor2 = r.pick(Object.keys(ITEM));
  if (!base.neck && r.chance(.3)) base.neck = r.pick(NECKS.map(n => n.id).slice(1));
  if (!base.hat && r.chance(.25)) base.hat = r.pick(HATS.map(h => h.id).slice(1));
  if (r.chance(.12)) base.glasses = r.pick(GLASSES.map(g => g.id).slice(1));
  base.bgColor = r.pick(PALETTES.bg.slice(0, 6));
  return base;
}

function compose(scene) {
  const { config: cfg } = scene;
  const H = scene.part("head");
  const fur = scene.color("furColor"), fur2 = scene.color("furColor2");
  const slot = (cat) => ({ id: scene.id, p: scene.part(cat), ...scene.slots(cat) });
  const headUrl = scene.clip("h", H.d), bodyUrl = scene.clip("b", BODY);
  scene.define(blushGradient(scene.uid("bl")));

  const ears = scene.part("ears");
  const earPaint = { a: scene.color("earColor", "fur"), b: scene.color("earColor2", mix(fur2, "#f5a0b0", .45)) };
  const fluff = scene.part("fluff"), fluffPaint = { f: scene.color("fluffColor", fluff.auto) };
  const muzzlePart = scene.part("muzzle"), muzzle = muzzlePart.draw({ a: fur, b: fur2 });
  const marks = scene.selected("marks");

  // behind: fluff (manes, wool), then ears
  if (fluff.back) scene.add(scene.outlined(fluff.back(fluffPaint, H)));
  if (!ears.front) scene.add(scene.outlined(ears.draw(earPaint)));
  // body: fur, belly, clothes, neckwear
  const neck = slot("neck");
  scene.add(scene.silhouette(P(BODY, fur)));
  scene.add(scene.clipped(bodyUrl, P(BODY, shade(fur, .16)) + P(BODY, fur, 'transform="translate(-5 -5)"') + E(100, 196, 32, 28, fur2)
    + scene.part("clothes").draw({ a: cfg.clothesColor, b: cfg.clothesColor2 })));
  if (neck.p.draw) scene.add(scene.outlined(neck.p.draw(neck)));
  // head: silhouette, shaded volume, marks, gloss
  scene.add(scene.silhouette(P(H.d, fur)));
  scene.add(scene.clipped(headUrl, P(H.d, shade(fur, .16)) + P(H.d, fur, 'transform="translate(-5 -6)"')
    + marks.filter((m) => !m.free).map((m) => m.draw({ id: scene.id, m: scene.color("markColor", m.auto) })).join("")
    + T([60, 92, 62, 68, 80, H.top + 10], "#fff", 4, 'opacity=".32"')));
  if (fluff.front) scene.add(scene.outlined(fluff.front(fluffPaint, H)));
  // face
  scene.add(scene.outlined(muzzle.pad));
  scene.add(marks.filter((m) => m.free).map((m) => m.draw({ id: scene.id })).join(""));
  scene.add(scene.part("eyes").draw({ a: cfg.eyesColor }));
  if (!muzzlePart.beak) scene.add(scene.part("mouth").draw());
  scene.add(muzzle.nose);
  // front: floppy ears, glasses, hat
  if (ears.front) scene.add(scene.outlined(ears.draw(earPaint)));
  scene.add(scene.part("glasses").draw({ a: cfg.glassesColor }));
  const hat = slot("hat");
  if (hat.p.draw) scene.add(scene.outlined(hat.p.draw(hat, H)));
}

export const Animals = defineLibrary({
  key: "animals",
  label: "どうぶつ",
  idPrefix: "an",
  parts: PARTS,
  categories: CATEGORIES,
  groups: GROUPS,
  defaults: DEFAULTS,
  presets: CHARACTERS,
  palettes: PALETTES,
  colorNames: NAMES,
  outline: { color: LINE, width: LINE_W },
  autoColor: (token, scene) => {
    const fur = scene.color("furColor");
    return token === "fur" ? fur : token === "shade" ? shade(fur, .3) : token;
  },
  compose,
  random: randomAnimal,
});
