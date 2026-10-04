// Game — RPG adventurers in chibi proportions: heroes, knights, mages, ninjas…
//
// Head: top 46, bottom 142, eyes at y 102, mouth at y 125. Small body below.
// Headgear decides what hair stays visible:
//   cover: y     hair only below the rim y (it flows out diagonally at the sides)
//   hood         hair only inside the hood opening; the back hair is hidden
//   hidesHair / hidesMouth / hidesBack
// Weapons and back gear are drawn `back` (behind the body) or `front` (held).
import { defineLibrary } from "../core/library.js";
import { P, S, T, C, E, M, both, blushGradient } from "../core/draw.js";
import { mix, shade, lighten, luminance } from "../core/color.js";

const INK = "#2b2233";
const LINE = "#2f2236", LINE_W = 3.6;

const SKIN = { "#fde4d3": "Porcelain", "#f6d0b4": "Light", "#eab890": "Warm", "#d29a6e": "Tan", "#a8714a": "Brown", "#6e4630": "Deep", "#c9e4d0": "Spirit", "#b9b4dc": "Shade" };
const HAIR = { "#2b2429": "Black", "#5a3a2a": "Brown", "#a8693c": "Chestnut", "#f0cf6a": "Blonde", "#e8e4ee": "Silver", "#d9473a": "Crimson", "#3f6fd1": "Azure", "#4fa36f": "Jade", "#f08fb5": "Sakura", "#8a63d2": "Violet", "#ffffff": "White" };
const EYE = { "#3f6fd1": "Azure", "#4fa36f": "Jade", "#d9473a": "Crimson", "#e8b84a": "Gold", "#8a63d2": "Violet", "#7a4a2e": "Amber", "#2ab3c9": "Cyan" };
const GEAR = { "#b8c0cc": "Steel", "#e8b84a": "Gold", "#d9473a": "Crimson", "#3f6fd1": "Azure", "#2a3f7a": "Navy", "#4fa36f": "Jade", "#8a63d2": "Violet", "#3a3438": "Ink", "#f3f0e8": "Ivory", "#8a5a3a": "Leather", "#5f6f3a": "Moss" };
const BG = { "#eef3fb": "Sky", "#f6efe2": "Parchment", "#e7f3e8": "Meadow", "#f3e8f6": "Twilight", "#fdeee0": "Sunset", "#2e3350": "Dungeon", "#1f2a2e": "Night" };
const NAMES = { ...SKIN, ...HAIR, ...EYE, ...GEAR, ...BG, auto: "おまかせ" };
const PALETTES = { skin: Object.keys(SKIN), hair: Object.keys(HAIR), eyes: Object.keys(EYE), gear: ["auto", ...Object.keys(GEAR)], bg: Object.keys(BG) };

const FACE = "M100 46 C130 46 148 66 148 94 C148 120 130 140 100 142 C70 140 52 120 52 94 C52 66 70 46 100 46Z";
const BODY = "M100 140 C80 140 66 146 58 156 C50 166 47 182 46 200 L154 200 C153 182 150 166 142 156 C134 146 120 140 100 140Z";
const NECK = "M91 128 L91 148 Q100 154 109 148 L109 128Z";
const EX = [81, 119], EY = 102;

const HEAD_BACK = "M52 96 C46 60 68 36 100 36 C132 36 154 60 148 96Z";
const LONG_FRONT = "M50 104 C46 64 68 40 100 40 C132 40 154 64 150 104 C148 94 146 86 142 80 Q137 88 131 92 Q127 82 121 76 Q113 86 105 90 Q101 80 97 74 Q89 86 79 90 Q75 82 71 78 Q63 86 58 92 C54 96 52 100 50 104Z";
const SPIKY_FRONT = "M50 100 C44 70 56 44 78 36 Q74 26 70 18 Q84 22 92 30 Q96 18 104 8 Q108 20 110 30 Q120 22 133 18 Q129 30 124 38 Q136 42 144 52 Q149 64 150 100 C147 92 143 85 139 80 Q135 88 132 96 Q128 84 123 76 Q119 86 115 94 Q111 82 107 72 Q103 84 99 92 Q95 82 91 72 Q87 84 83 92 Q79 84 75 76 Q71 86 67 96 Q65 88 61 82 C56 88 52 94 50 100Z";
const HAIRS = [
  { id: "hero",  label: "ツンツン",     back: HEAD_BACK + " M60 96 L140 96 L140 120 L60 120Z", front: SPIKY_FRONT },
  { id: "neat",  label: "さっぱり",      back: "M52 96 C46 62 68 38 100 38 C132 38 154 62 148 96 L144 112 L56 112Z",
                                     front: "M50 104 C46 66 66 40 100 40 C134 40 154 64 150 104 C148 94 146 86 142 80 C130 76 116 72 106 62 C100 70 86 78 70 80 C62 82 56 86 54 92 C52 96 51 100 50 104Z" },
  { id: "long",  label: "ロング",      back: "M48 96 C44 56 70 36 100 36 C130 36 156 56 152 96 C154 130 158 160 162 186 L38 186 C42 160 46 130 48 96Z", front: LONG_FRONT,
                                     locks: "M50 100 C48 118 50 138 54 158 L64 158 C60 138 58 118 58 98Z M150 100 C152 118 150 138 146 158 L136 158 C140 138 142 118 142 98Z" },
  { id: "bob",   label: "ボブ",       back: "M48 96 C44 58 70 38 100 38 C130 38 156 58 152 96 L154 132 C154 140 144 142 136 140 L64 140 C56 142 46 140 46 132Z",
                                     front: "M50 106 C46 66 68 40 100 40 C132 40 154 66 150 106 C149 98 148 90 146 84 Q138 90 130 84 Q122 90 114 84 Q106 90 100 84 Q94 90 86 84 Q78 90 70 84 Q62 90 54 84 C52 90 51 98 50 106Z" },
  { id: "twin",  label: "ツインテール", back: HEAD_BACK + " M56 66 C30 70 20 118 28 172 C38 150 46 120 58 98Z M144 66 C170 70 180 118 172 172 C162 150 154 120 142 98Z", front: LONG_FRONT, ties: [[56, 68], [144, 68]] },
  { id: "pony",  label: "ポニーテール",  back: HEAD_BACK + " M130 48 C164 44 174 90 166 130 C162 150 154 164 146 172 C150 146 150 118 142 96Z", front: LONG_FRONT, ties: [[134, 50]] },
  { id: "bun",   label: "おだんご",       back: HEAD_BACK + " M100 18 a16 16 0 1 0 0.1 0Z", front: LONG_FRONT, ties: [[100, 36]] },
  { id: "wild",  label: "ワイルド",      back: "M100 28 Q118 20 132 28 Q148 28 154 44 Q166 54 162 72 Q172 90 164 104 Q172 122 160 136 Q162 152 148 158 L52 158 Q38 152 40 136 Q28 122 36 104 Q28 90 38 72 Q34 54 46 44 Q52 28 68 28 Q82 20 100 28Z", front: SPIKY_FRONT },
  { id: "bald",  label: "スキンヘッド",      shine: true },
];

const brow = (pts, br, t = 3) => both(T(pts, br, t));
const animeEye = (e, x, { lid = 0, slant = 0, lash = 3.4 } = {}) => {
  const a = x.a;
  const d = e < 100 ? -1 : 1;   // -1 left eye, 1 right eye (outer side)
  return E(e, EY, 8, 10, "#fff") + E(e, EY + 1, 6.4, 8.2, a) + E(e, EY + 5, 4.6, 3.6, lighten(a, .35)) + E(e, EY + 1, 3, 4.2, INK)
    + C(e + 2.6, EY - 3.4, 2.5, "#fff") + C(e - 2.4, EY + 4.4, 1.2, "#fff")
    + (lid ? P(`M${e - 9} ${EY - 11} L${e + 9} ${EY - 11} L${e + 9} ${EY - 11 + lid} Q${e} ${EY - 13 + lid} ${e - 9} ${EY - 11 + lid}Z`, x.skin) : "")
    + T([e - 10 * d, EY - 6 - slant * d, e, EY - 13 + lid, e + 10 * d, EY - 7 + slant * d], INK, lash)
    + T([e + 7 * d, EY - 9 + slant * d, e + 11 * d, EY - 11 + slant * d, e + 12.5 * d, EY - 13 + slant * d], INK, 1.6)
    + T([e - 5, EY + 10.4, e, EY + 11.4, e + 5, EY + 10.4], INK, .9);
};
const EYES = [
  { id: "bright",  label: "キラッ",     draw: (x) => EX.map(e => animeEye(e, x)).join("") + brow([74, 86, 81, 82, 89, 84], x.br) },
  { id: "brave",   label: "キリッ", draw: (x) => EX.map(e => animeEye(e, x, { slant: -2.4 })).join("") + brow([73, 82, 81, 82, 90, 87], x.br, 3.4) },
  { id: "gentle",  label: "やさしい",     draw: (x) => EX.map(e => animeEye(e, x, { slant: 2.4 })).join("") + brow([73, 86, 81, 81.6, 90, 83.4], x.br, 2.6) },
  { id: "sleepy",  label: "ねむそう",     draw: (x) => EX.map(e => animeEye(e, x, { lid: 7 })).join("") + brow([74, 86, 81, 83.6, 89, 85], x.br, 2.4) },
  { id: "smile",   label: "にっこり",      draw: (x) => EX.map(e => T([e - 9, EY + 2, e, EY - 8, e + 9, EY + 2], INK, 3.8)).join("") + brow([74, 84, 81, 80, 89, 82.6], x.br) },
  { id: "wink",    label: "ウインク",       draw: (x) => animeEye(EX[0], x) + T([EX[1] - 9, EY + 2, EX[1], EY - 8, EX[1] + 9, EY + 2], INK, 3.8) + brow([74, 86, 81, 82, 89, 84], x.br) },
  { id: "glow",    label: "ひかる目",    draw: (x) => EX.map(e => E(e, EY, 8, 9, x.a) + E(e, EY, 4.6, 5.4, lighten(x.a, .7)) + C(e + 2, EY - 3, 1.8, "#fff")).join("") + brow([73, 82, 81, 82, 90, 87], x.br, 3.4) },
  { id: "star",    label: "ほし目",     draw: (x) => EX.map(e => E(e, EY, 8, 10, "#fff") + E(e, EY + 1, 6.4, 8.2, x.a) + `<path transform="translate(${e} ${EY + 1})" d="M0 -5 L1.6 -1.6 L5 0 L1.6 1.6 L0 5 L-1.6 1.6 L-5 0 L-1.6 -1.6Z" fill="#fff"/>` + T([e - 10, EY - 6, e, EY - 13, e + 10, EY - 7], INK, 3.4)).join("") + brow([74, 84, 81, 80, 89, 82.6], x.br) },
];

const MOUTH_IN = "#6b2230", TONGUE = "#f08a9b";
const MOUTHS = [
  { id: "smile",  label: "にっこり",  draw: () => T([94, 124, 100, 128.5, 106, 124], INK, 2.6) },
  { id: "grin",   label: "わはは",   draw: () => P("M91 122 Q100 138 109 122Z", MOUTH_IN, `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"`) + P("M93 123 L107 123 Q106 126 100 126 Q94 126 93 123Z", "#fff") + P("M95 131 Q100 127.5 105 131 Q100 134 95 131Z", TONGUE) },
  { id: "cat",    label: "ω",    draw: () => S("M92 124 Q96 129 100 124 Q104 129 108 124", INK, 2.2) },
  { id: "fang",   label: "きば",   draw: () => T([92, 123, 100, 129, 108, 123], INK, 2.6) + P("M102 125.4 L106.6 124.6 L104.6 129.6Z", "#fff", `stroke="${LINE}" stroke-width="1.1" stroke-linejoin="round"`) },
  { id: "flat",   label: "まじめ", draw: () => T([94, 126, 100, 126.8, 106, 126], INK, 2.2) },
  { id: "smirk",  label: "ニヤリ",  draw: () => T([94, 126, 102, 128.4, 107, 122.4], INK, 2.4) },
  { id: "shout",  label: "さけぶ",  draw: () => P("M89 120 Q100 142 111 120 Q100 116 89 120Z", MOUTH_IN, `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"`) + P("M94 132 Q100 127 106 132 Q100 136 94 132Z", TONGUE) },
  { id: "o",      label: "おっ",     draw: () => E(100, 126, 3.6, 4.4, MOUTH_IN, `stroke="${LINE}" stroke-width="1.6"`) },
];

const MARKS = [
  { id: "blush",    label: "ほっぺ",     draw: (x) => E(71, 118, 10, 6.4, `url(#${x.id}bl)`) + E(129, 118, 10, 6.4, `url(#${x.id}bl)`) },
  { id: "scar",     label: "きず",      draw: () => T([124, 108, 130, 114, 136, 122], shade("#d98c7a", .2), 1.8) + T([126, 116, 130, 115, 135, 113], shade("#d98c7a", .2), 1.4) },
  { id: "bandage",  label: "ばんそうこう",   draw: () => `<g transform="rotate(-18 128 116)"><rect x="118" y="112" width="20" height="8" rx="4" fill="#f2d2a8" stroke="${LINE}" stroke-width="1.2"/><rect x="125" y="112" width="6" height="8" fill="#e6bd8a"/></g>` },
  { id: "warpaint", label: "ペイント", draw: () => both(T([62, 110, 70, 112, 78, 111], "#d9473a", 2.4) + T([64, 116, 71, 117.6, 78, 117], "#d9473a", 2.2)) },
  { id: "gem",      label: "ひたいの宝石", draw: () => P("M100 70 L105 76 L100 82 L95 76Z", "#2ab3c9", `stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"`) + C(98.6, 74.6, 1.2, "#fff") },
  { id: "freckles", label: "そばかす",  draw: (x) => both([[68, 112], [72, 115], [76, 112]].map(([a, b]) => C(a, b, 1.1, shade(x.skin, .35))).join("")) },
  { id: "tear",     label: "なみだ",      draw: () => P("M88 112 Q85 118 88 120 Q91 118 88 112Z", "#8cc8f0", `stroke="${LINE}" stroke-width="1"`) },
];

const EAR_HUMAN = "M54 98 C44 94 42 112 50 118 C53 120 56 119 57 116Z";
const EARS = [
  { id: "human", label: "ふつう" },
  { id: "elf",   label: "エルフ",   path: "M55 96 C40 92 28 82 20 74 C26 92 36 112 52 118 C55 119 57 117 57 114Z" },
  { id: "beast", label: "けもみみ", top: true, draw: (x) => both(P("M58 70 L60 30 L90 52Z", x.hair) + P("M64 60 L65 40 L82 52Z", mix(x.hair, "#f5a0b0", .45))) },
  { id: "none",  label: "かくす", path: null },
];

const vneck = (x, d = 160) => P(`M90 140 L100 ${d} L110 140Z`, x.skin);
const OUTFITS = [
  { id: "hero",     label: "勇者",      auto: ["#3f6fd1", "#e8b84a"], draw: (x) => P(BODY, x.a) + vneck(x) + S("M90 140 L100 160 L110 140", x.b, 2.6) + `<rect x="40" y="184" width="120" height="8" fill="#8a5a3a"/><rect x="94" y="182" width="12" height="12" rx="2" fill="${x.b}"/>` },
  { id: "knight",   label: "騎士",    auto: ["#b8c0cc", "#3f6fd1"], draw: (x) => P(BODY, shade(x.a, .15)) + P("M70 152 Q100 144 130 152 L126 192 Q100 200 74 192Z", lighten(x.a, .15)) + P("M100 160 L108 170 L100 184 L92 170Z", x.b) + both(`<ellipse cx="60" cy="160" rx="17" ry="12" transform="rotate(-24 60 160)" fill="${x.a}"/>`) + P("M86 140 Q100 148 114 140 L114 150 Q100 158 86 150Z", x.a) },
  { id: "mage",     label: "魔法使い",      auto: ["#8a63d2", "#e8b84a"], draw: (x) => P(BODY, x.a) + P("M76 148 Q100 134 124 148 L120 162 Q100 154 80 162Z", shade(x.a, .2)) + S("M100 160 L100 200", shade(x.a, .3), 2) + C(100, 162, 4.4, x.b) + both(S("M64 176 Q70 184 66 196", lighten(x.a, .25), 1.6, 'opacity=".6"')) },
  { id: "priest",   label: "僧侶",    auto: ["#f3f0e8", "#3f6fd1"], draw: (x) => P(BODY, x.a) + vneck(x, 154) + both(P("M86 142 L90 200 L98 200 L94 142Z", x.b)) + C(100, 172, 6, "#e8b84a") + C(100, 172, 2.6, x.a) },
  { id: "thief",    label: "盗賊",     auto: ["#5f6f3a", "#8a5a3a"], draw: (x) => P(BODY, x.b) + both(P("M58 156 C66 146 80 142 88 142 L96 200 L46 200 C47 182 51 166 58 156Z", x.a)) + P("M78 142 Q100 158 122 142 L100 170Z", shade(x.a, .25)) },
  { id: "ninja",    label: "忍者",     auto: ["#2a3f7a", "#3a3438"], draw: (x) => P(BODY, x.a) + P("M86 140 L108 182 L114 178 L94 140Z", x.b) + S("M114 140 L96 176", shade(x.a, .3), 2) + `<rect x="40" y="186" width="120" height="7" fill="${x.b}"/>` },
  { id: "archer",   label: "弓使い",    auto: ["#4fa36f", "#8a5a3a"], draw: (x) => P(BODY, x.a) + vneck(x, 154) + S("M58 154 L144 198", x.b, 6) + `<rect x="66" y="176" width="14" height="12" rx="2" fill="${x.b}"/>` },
  { id: "bard",     label: "吟遊詩人",      auto: ["#d9473a", "#ffffff"], draw: (x) => P(BODY, "#ffffff") + both(P("M58 156 C66 146 80 142 88 142 L96 200 L46 200 C47 182 51 166 58 156Z", x.a)) + P("M92 144 Q100 150 108 144 L106 152 Q100 158 94 152 L92 160 Q100 166 108 160 L104 170 Q100 174 96 170Z", x.b, `stroke="${shade(x.b, .2)}" stroke-width="1"`) },
  { id: "alchemist", label: "錬金術師", auto: ["#8a5a3a", "#2ab3c9"], draw: (x) => P(BODY, "#f3f0e8") + both(P("M58 156 C66 146 80 142 88 142 L98 200 L46 200 C47 182 51 166 58 156Z", x.a) + P("M88 142 L98 200 L92 200 L82 160 L88 154 L80 148Z", shade(x.a, .2))) + `<rect x="118" y="170" width="14" height="18" rx="3" fill="${shade(x.a, .15)}"/>` + C(125, 168, 4.4, x.b) },
  { id: "villager", label: "村人",  auto: ["#e8b84a", "#8a5a3a"], draw: (x) => P(BODY, x.a) + vneck(x, 152) + S("M95 146 L105 150 M95 152 L104 155", x.b, 1.6) },
  { id: "demon",    label: "魔王", auto: ["#3a3438", "#d9473a"], draw: (x) => P(BODY, x.a) + both(P("M48 168 L58 140 L66 158 L74 144 L80 162Z", x.b)) + P("M86 142 Q100 156 114 142 L100 176Z", x.b) + C(100, 184, 4, "#e8b84a") },
  { id: "princess", label: "姫",  auto: ["#f08fb5", "#e8b84a"], draw: (x) => P(BODY, x.a) + P("M78 150 Q88 144 100 152 Q112 144 122 150 L118 140 L82 140Z", x.skin) + S("M82 150 Q100 166 118 150", x.b, 1.6) + P("M100 160 L104 165 L100 170 L96 165Z", x.b) + both(S("M70 176 Q76 186 72 198", lighten(x.a, .3), 1.6, 'opacity=".7"')) },
];

const BACKS = [
  { id: "none",   label: "なし" },
  { id: "cape",   label: "マント",        auto: ["#d9473a", "#e8b84a"], back: (x) => P("M56 148 C40 168 32 188 30 200 L170 200 C168 188 160 168 144 148Z", x.a) + both(P("M30 200 C34 190 40 180 48 170 L52 200Z", shade(x.a, .2))), front: (x) => both(C(76, 150, 4.6, x.b)) },
  { id: "scarf",  label: "なびくマフラー",  auto: ["#d9473a", "#e8b84a"], back: (x) => P("M120 146 C140 150 160 140 176 128 C172 142 162 158 146 164 C160 166 172 162 182 156 C174 170 152 178 128 168Z", x.a), front: (x) => P("M80 140 Q100 152 120 140 L122 152 Q100 164 78 152Z", x.a) },
  { id: "angel",  label: "天使の羽", auto: ["#ffffff", "#e8eef8"], back: (x) => both(P("M66 156 C48 130 24 122 12 128 C22 134 26 142 20 150 C30 152 32 160 26 168 C38 170 42 176 40 184 C52 182 62 174 68 164Z", x.a) + S("M60 158 C44 146 32 142 22 144 M58 166 C46 158 36 158 28 162", x.b, 1.6)) },
  { id: "devil",  label: "悪魔の羽",   auto: ["#3a3438", "#8a63d2"], back: (x) => both(P("M66 156 C52 132 30 118 14 120 C20 132 20 144 14 154 C26 150 32 156 30 168 C40 160 48 164 50 174 C56 166 62 164 68 164Z", x.a) + S("M64 158 C48 140 30 128 16 122", x.b, 1.4)) },
  { id: "quiver", label: "矢筒",      auto: ["#8a5a3a", "#d9473a"], back: (x) => `<g transform="rotate(-24 140 150)"><rect x="132" y="112" width="18" height="60" rx="5" fill="${x.a}"/>${[136, 141, 146].map((a, i) => S(`M${a} 112 L${a} ${96 - i * 3}`, "#8a5a3a", 2) + P(`M${a - 4} ${100 - i * 3} L${a} ${90 - i * 3} L${a + 4} ${100 - i * 3}Z`, x.b)).join("")}</g>` },
];

const WEAPONS = [
  { id: "none",   label: "なし" },
  { id: "sword",  label: "剣",  auto: ["#b8c0cc", "#e8b84a"], back: (x) => `<g transform="rotate(32 150 132)"><path d="M145 30 L155 30 L155 120 L150 130 L145 120Z" fill="${x.a}"/>${S("M150 34 L150 118", lighten(x.a, .5), 1.6)}<rect x="136" y="120" width="28" height="7" rx="3" fill="${x.b}"/><rect x="146" y="127" width="8" height="20" rx="3" fill="#8a5a3a"/>${C(150, 150, 5, x.b)}</g>` },
  { id: "staff",  label: "杖",  auto: ["#8a5a3a", "#2ab3c9"], front: (x) => `<rect x="35" y="88" width="7" height="112" rx="3.5" fill="${x.a}"/>` + P("M38.5 90 C28 82 26 66 34 58 C34 70 38 74 38.5 78 C39 74 43 70 43 58 C51 66 49 82 38.5 90Z", shade(x.a, .15)) + C(38.5, 70, 9, x.b) + C(35.5, 67, 3, "#fff", 'opacity=".8"') },
  { id: "wand",   label: "ステッキ",   auto: ["#f3f0e8", "#e8b84a"], front: (x) => `<g transform="rotate(-28 150 170)"><rect x="147" y="136" width="6" height="56" rx="3" fill="${x.a}"/><path transform="translate(150 130)" d="M0 -12 L3.6 -3.6 L12 0 L3.6 3.6 L0 12 L-3.6 3.6 L-12 0 L-3.6 -3.6Z" fill="${x.b}"/></g>` },
  { id: "shield", label: "盾", auto: ["#3f6fd1", "#e8b84a"], front: (x) => P("M34 150 Q50 144 66 150 L66 172 Q66 190 50 198 Q34 190 34 172Z", x.a) + P("M38 154 Q50 149 62 154 L62 172 Q62 186 50 193 Q38 186 38 172Z", "none", `stroke="${x.b}" stroke-width="2"`) + P("M50 160 L56 170 L50 182 L44 170Z", x.b) },
  { id: "bow",    label: "弓",    auto: ["#8a5a3a", "#f3f0e8"], back: (x) => S("M40 70 C14 110 14 150 40 192", x.a, 6) + S("M40 70 L40 192", x.b, 1.2) },
  { id: "axe",    label: "斧",    auto: ["#b8c0cc", "#8a5a3a"], back: (x) => `<g transform="rotate(28 150 130)"><rect x="146" y="44" width="8" height="106" rx="4" fill="${x.b}"/><path d="M154 50 C176 46 184 64 180 82 C170 76 162 76 154 80Z" fill="${x.a}"/><path d="M146 50 C130 52 126 66 130 76 C136 72 141 72 146 74Z" fill="${shade(x.a, .15)}"/></g>` },
  { id: "spear",  label: "槍",  auto: ["#b8c0cc", "#8a5a3a"], back: (x) => `<g transform="rotate(20 150 130)"><rect x="147" y="30" width="6" height="170" rx="3" fill="${x.b}"/><path d="M150 4 L158 30 L150 38 L142 30Z" fill="${x.a}"/><rect x="144" y="36" width="12" height="4" rx="2" fill="#d9473a"/></g>` },
  { id: "book",   label: "魔導書",   auto: ["#d9473a", "#e8b84a"], front: (x) => `<g transform="rotate(-10 62 176)"><rect x="44" y="160" width="36" height="30" rx="3" fill="#f3f0e8"/><rect x="42" y="158" width="36" height="30" rx="3" fill="${x.a}"/>${C(60, 173, 5, x.b)}${S("M46 162 L46 184", shade(x.a, .3), 1.6)}</g>` },
  { id: "lute",   label: "リュート",   auto: ["#a8693c", "#3a3438"], front: (x) => `<g transform="rotate(-52 130 184)"><rect x="126" y="136" width="8" height="40" rx="3" fill="${shade(x.a, .2)}"/>${E(130, 190, 15, 18, x.a)}${C(130, 186, 4.6, x.b)}${S("M128 140 L128 202 M132 140 L132 202", "#f3f0e8", .8)}</g>` },
  { id: "dagger", label: "短剣", auto: ["#b8c0cc", "#3a3438"], front: (x) => `<g transform="rotate(-30 146 176)"><path d="M143 148 L149 148 L149 172 L146 178 L143 172Z" fill="${x.a}"/><rect x="138" y="172" width="16" height="5" rx="2" fill="${x.b}"/><rect x="143" y="177" width="6" height="12" rx="2" fill="#8a5a3a"/></g>` },
];

// cover: hair is only shown below this y (outside the face) / hood: hair clipped to the hood opening
// hidesHair / hidesMouth: hide those layers entirely
const HOOD_OUT = "M40 112 C34 60 62 26 100 26 C138 26 166 60 160 112 C162 126 160 142 156 152 L44 152 C40 142 38 126 40 112Z";
const HOOD_HOLE = "M100 52 C126 52 142 70 142 96 C142 120 126 138 100 140 C74 138 58 120 58 96 C58 70 74 52 100 52Z";
const HELM_DOME = "M50 82 C48 46 72 30 100 30 C128 30 152 46 150 82Z";
const GEAR_HEAD = [
  { id: "none",     label: "なし" },
  { id: "helmet",   label: "かぶと",     cover: 84, auto: ["#b8c0cc", "#d9473a"], front: (x) => P("M100 32 C96 14 108 2 124 4 C114 10 110 20 108 32Z", x.b) + P(HELM_DOME, x.a) + P("M47 76 L153 76 L153 88 C130 84 70 84 47 88Z", shade(x.a, .15)) + S("M100 34 L100 74", lighten(x.a, .4), 2) },
  { id: "viking",   label: "角かぶと", cover: 84, auto: ["#b8c0cc", "#f3f0e8"], front: (x) => both(P("M54 66 C40 62 30 48 32 30 C40 44 50 48 60 50Z", x.b)) + P(HELM_DOME, x.a) + P("M47 76 L153 76 L153 88 C130 84 70 84 47 88Z", shade(x.a, .2)) + [64, 82, 100, 118, 136].map(a => C(a, 82, 2, lighten(x.a, .5))).join("") },
  { id: "wizard",   label: "とんがり帽子", cover: 68, auto: ["#8a63d2", "#e8b84a"], front: (x) => E(100, 66, 66, 13, shade(x.a, .1)) + P("M62 64 C70 40 84 14 118 0 C112 20 124 44 138 64Z", x.a) + P("M64 56 Q100 50 136 56 L138 64 Q100 58 62 64Z", x.b) + `<path transform="translate(112 34)" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="${x.b}"/>` },
  { id: "hood",     label: "フード",       hood: true, hidesBack: true, auto: ["#5f6f3a", "#3a3438"], back: (x) => P(HOOD_OUT, shade(x.a, .25)), front: (x) => P(HOOD_OUT + " " + HOOD_HOLE, x.a, 'fill-rule="evenodd"') + S("M62 70 C76 54 124 54 138 70", shade(x.a, .2), 1.6) },
  { id: "ninja",    label: "忍び頭巾", hidesHair: true, hidesMouth: true, auto: ["#2a3f7a", "#3a3438"], back: (x) => P("M138 70 C156 72 170 64 178 54 C176 70 166 82 150 84Z M140 80 C158 88 170 86 182 80 C174 94 160 98 146 92Z", x.a),
    front: (x) => P("M48 100 C44 60 70 38 100 38 C130 38 156 60 152 100 C152 124 134 146 100 148 C66 146 48 124 48 100Z M62 88 C80 82 120 82 138 88 L136 112 C120 108 80 108 64 112Z", x.a, 'fill-rule="evenodd"') + S("M66 112 C84 108 116 108 134 112", shade(x.a, .3), 1.6) },
  { id: "bandana",  label: "バンダナ",    cover: 72, auto: ["#d9473a", "#ffffff"], front: (x) => P("M50 82 C48 48 72 34 100 34 C128 34 152 48 150 82 C130 74 70 74 50 82Z", x.a) + both(C(80, 54, 2, x.b) + C(90, 66, 2, x.b)) + C(100, 46, 2, x.b) + P("M146 70 L168 74 L160 90Z M146 70 L170 64 L168 82Z", x.a) },
  { id: "crown",    label: "王冠",      auto: ["#e8b84a", "#d9473a"], front: (x) => P("M74 52 L70 20 L86 34 L100 14 L114 34 L130 20 L126 52Z", x.a) + C(100, 42, 4, x.b) + C(84, 45, 3, x.b) + C(116, 45, 3, x.b) },
  { id: "tiara",    label: "ティアラ",      auto: ["#e8b84a", "#2ab3c9"], front: (x) => P("M70 58 Q100 44 130 58 L126 62 Q100 52 74 62Z", x.a) + P("M100 34 L108 50 L100 56 L92 50Z", x.a) + C(100, 48, 3.6, x.b) },
  { id: "circlet",  label: "サークレット",    auto: ["#e8b84a", "#d9473a"], front: (x) => P("M52 76 Q100 62 148 76 L148 82 Q100 68 52 82Z", x.a) + P("M100 66 L106 73 L100 80 L94 73Z", x.b) },
  { id: "headband", label: "はちまき",   auto: ["#d9473a", "#ffffff"], front: (x) => P("M51 74 Q100 60 149 74 L149 84 Q100 70 51 84Z", x.a) + P("M146 76 C160 78 170 88 174 100 C164 94 156 92 146 88Z M146 80 C158 88 162 100 160 112 C154 102 150 96 144 92Z", x.a) },
  { id: "goggles",  label: "ゴーグル",    auto: ["#8a5a3a", "#2ab3c9"], front: (x) => S("M50 70 Q100 54 150 70", x.a, 6) + both(C(84, 62, 11, x.a) + C(84, 62, 7, x.b) + C(81, 59, 2, "#fff", 'opacity=".8"')) },
  { id: "horns",    label: "悪魔の角", auto: ["#3a3438", "#d9473a"], front: (x) => both(P("M64 62 C56 50 54 34 62 20 C64 34 72 44 80 50Z", x.a) + S("M62 50 C60 42 60 34 62 26", lighten(x.a, .3), 1.4)) },
  { id: "halo",     label: "天使の輪",       auto: ["#e8b84a", "#fff4c2"], front: (x) => `<ellipse cx="100" cy="24" rx="28" ry="7" fill="none" stroke="${x.a}" stroke-width="5"/><ellipse cx="100" cy="24" rx="28" ry="7" fill="none" stroke="${x.b}" stroke-width="1.6"/>` },
];

const PARTS = { hair: HAIRS, eyes: EYES, mouth: MOUTHS, marks: MARKS, ears: EARS, outfit: OUTFITS, back: BACKS, weapon: WEAPONS, head: GEAR_HEAD };
const CATEGORIES = [
  { key: "skin",   label: "はだ",     colors: [{ key: "skin", label: "はだの色", palette: PALETTES.skin }] },
  { key: "hair",   label: "かみ",     colors: [{ key: "hairColor", label: "かみの色", palette: PALETTES.hair }] },
  { key: "eyes",   label: "め",     colors: [{ key: "eyesColor", label: "ひとみの色", palette: PALETTES.eyes }] },
  { key: "mouth",  label: "くち" },
  { key: "marks",  label: "しるし",    multi: true },
  { key: "ears",   label: "みみ" },
  { key: "outfit", label: "そうび",   colors: [{ key: "outfitColor", label: "メイン", palette: PALETTES.gear }, { key: "outfitColor2", label: "サブ", palette: PALETTES.gear }] },
  { key: "back",   label: "せなか",     colors: [{ key: "backColor", label: "メイン", palette: PALETTES.gear }, { key: "backColor2", label: "サブ", palette: PALETTES.gear }] },
  { key: "head",   label: "あたま", colors: [{ key: "headColor", label: "メイン", palette: PALETTES.gear }, { key: "headColor2", label: "サブ", palette: PALETTES.gear }] },
  { key: "weapon", label: "ぶき",   colors: [{ key: "weaponColor", label: "メイン", palette: PALETTES.gear }, { key: "weaponColor2", label: "サブ", palette: PALETTES.gear }] },
  { key: "bg",     label: "はいけい", colors: [{ key: "bgColor", label: "はいけい", palette: PALETTES.bg }] },
];
const GROUPS = [
  { label: "かお",  cats: ["skin", "eyes", "mouth", "marks", "ears"] },
  { label: "かみ",  cats: ["hair"] },
  { label: "そうび",  cats: ["outfit", "head", "back"] },
  { label: "ぶき", cats: ["weapon"] },
  { label: "はいけい", cats: ["bg"] },
];
const DEFAULTS = {
  skin: "#f6d0b4", hair: "hero", hairColor: "#5a3a2a", eyes: "bright", eyesColor: "#3f6fd1", mouth: "smile", marks: ["blush"], ears: "human",
  outfit: "hero", outfitColor: "auto", outfitColor2: "auto", back: "none", backColor: "auto", backColor2: "auto",
  head: "none", headColor: "auto", headColor2: "auto", weapon: "none", weaponColor: "auto", weaponColor2: "auto", bgColor: "#eef3fb",
};

const CHARACTERS = [
  { label: "勇者",      hair: "hero", hairColor: "#5a3a2a", eyes: "brave", eyesColor: "#3f6fd1", mouth: "grin", outfit: "hero", back: "cape", weapon: "sword", bgColor: "#eef3fb" },
  { label: "騎士",    hair: "neat", hairColor: "#f0cf6a", eyes: "bright", eyesColor: "#3f6fd1", mouth: "flat", outfit: "knight", head: "helmet", weapon: "shield", back: "cape", backColor: "#3f6fd1", bgColor: "#e7f3e8" },
  { label: "魔法使い",    hair: "long", hairColor: "#e8e4ee", eyes: "gentle", eyesColor: "#8a63d2", mouth: "smile", outfit: "mage", head: "wizard", weapon: "staff", bgColor: "#f3e8f6" },
  { label: "僧侶", hair: "bob", hairColor: "#f0cf6a", eyes: "gentle", eyesColor: "#2ab3c9", mouth: "smile", outfit: "priest", head: "circlet", weapon: "book", back: "angel", bgColor: "#eef3fb" },
  { label: "盗賊",     hair: "neat", hairColor: "#a8693c", eyes: "brave", eyesColor: "#4fa36f", mouth: "smirk", outfit: "thief", head: "bandana", weapon: "dagger", marks: ["blush", "scar"], bgColor: "#f6efe2" },
  { label: "忍者",     hair: "hero", hairColor: "#2b2429", eyes: "brave", eyesColor: "#d9473a", outfit: "ninja", head: "ninja", back: "scarf", weapon: "none", bgColor: "#1f2a2e" },
  { label: "弓使い",    hair: "pony", hairColor: "#4fa36f", eyes: "bright", eyesColor: "#4fa36f", mouth: "smile", ears: "elf", outfit: "archer", back: "quiver", weapon: "bow", bgColor: "#e7f3e8" },
  { label: "吟遊詩人",      hair: "wild", hairColor: "#d9473a", eyes: "wink", eyesColor: "#e8b84a", mouth: "grin", outfit: "bard", weapon: "lute", bgColor: "#fdeee0" },
  { label: "錬金術師", hair: "bun", hairColor: "#3f6fd1", eyes: "sleepy", eyesColor: "#2ab3c9", mouth: "cat", outfit: "alchemist", head: "goggles", marks: ["blush", "freckles"], bgColor: "#f6efe2" },
  { label: "姫",  hair: "long", hairColor: "#f08fb5", eyes: "star", eyesColor: "#8a63d2", mouth: "smile", outfit: "princess", head: "tiara", weapon: "wand", bgColor: "#f3e8f6" },
  { label: "魔王", hair: "wild", hairColor: "#e8e4ee", skin: "#b9b4dc", eyes: "glow", eyesColor: "#d9473a", mouth: "fang", outfit: "demon", head: "horns", back: "devil", weapon: "none", marks: [], bgColor: "#2e3350" },
  { label: "バイキング",    hair: "wild", hairColor: "#a8693c", eyes: "brave", eyesColor: "#3f6fd1", mouth: "shout", outfit: "knight", outfitColor: "#8a5a3a", head: "viking", weapon: "axe", marks: ["blush", "warpaint"], bgColor: "#eef3fb" },
  { label: "獣人",  hair: "bob", hairColor: "#a8693c", eyes: "bright", eyesColor: "#e8b84a", mouth: "fang", ears: "beast", outfit: "villager", weapon: "spear", bgColor: "#fdeee0" },
  { label: "レンジャー",    hair: "neat", hairColor: "#2b2429", eyes: "brave", eyesColor: "#4fa36f", mouth: "flat", outfit: "archer", outfitColor: "#5f6f3a", head: "hood", weapon: "bow", bgColor: "#e7f3e8" },
  { label: "天使",     hair: "twin", hairColor: "#ffffff", eyes: "star", eyesColor: "#2ab3c9", mouth: "smile", outfit: "priest", head: "halo", back: "angel", marks: ["blush", "gem"], bgColor: "#eef3fb" },
  { label: "村人",  hair: "twin", hairColor: "#a8693c", eyes: "smile", mouth: "grin", outfit: "villager", marks: ["blush", "freckles"], bgColor: "#fdeee0" },
];

function randomAdventurer(r) {
  const { pick, chance } = r;
  const c = { ...r.pick(CHARACTERS) };
  delete c.label;
  // Keep the job, vary the person.
  c.skin = r.chance(.85) ? r.pick(PALETTES.skin.slice(0, 6)) : r.pick(PALETTES.skin);
  if (r.chance(.6)) c.hair = r.pick(HAIRS.slice(0, 8).map(h => h.id));
  c.hairColor = r.pick(PALETTES.hair);
  c.eyesColor = r.pick(PALETTES.eyes);
  if (r.chance(.4)) c.eyes = r.pick(EYES.map(e => e.id));
  if (r.chance(.4)) c.mouth = r.pick(MOUTHS.map(m => m.id));
  if (r.chance(.15)) c.ears = r.pick(["elf", "beast"]);
  c.bgColor = r.pick(PALETTES.bg.slice(0, 5));
  return c;
}

function compose(scene) {
  const { config: cfg } = scene;
  const skin = scene.color("skin"), hair = scene.color("hairColor");
  const slot = (cat) => ({ id: scene.id, p: scene.part(cat), skin, hair, ...scene.slots(cat) });
  const H = scene.part("hair"), gear = slot("head"), back = slot("back"), weapon = slot("weapon"), outfit = slot("outfit");
  const ear = scene.part("ears");
  const G = gear.p;
  const showHair = !G.hidesHair;
  const look = { id: scene.id, skin, hair, a: cfg.eyesColor, br: luminance(hair) > .6 ? mix(hair, INK, .5) : shade(hair, .1) };
  const bodyUrl = scene.clip("b", BODY), faceUrl = scene.clip("f", FACE);
  const fringeUrl = H.front ? scene.clip("hf", H.front) : "";
  scene.define(blushGradient(scene.uid("bl")));

  // Hair under headgear
  let underGear = (s) => s;
  if (G.cover || G.hood) {
    const url = scene.clip("hc", G.hood ? HOOD_HOLE : `M0 200 L0 ${G.cover + 40} L50 ${G.cover} L150 ${G.cover} L200 ${G.cover + 40} L200 200Z`);
    underGear = (s) => scene.clipped(url, s);
  }

  // behind everything: back gear, the hood, weapons carried on the back, back hair
  if (back.p.back) scene.add(scene.outlined(back.p.back(back)));
  if (G.back) scene.add(scene.outlined(G.back(gear)));
  if (weapon.p.back) scene.add(scene.outlined(weapon.p.back(weapon)));
  if (showHair && H.back && !G.hidesBack) scene.add(scene.outlined(underGear(P(H.back, shade(hair, .22)))));
  // body
  scene.add(P(NECK, skin, `stroke="${LINE}" stroke-width="1.6"`), P("M91 128 Q100 140 109 128 L109 138 Q100 148 91 138Z", shade(skin, .14)));
  scene.add(scene.silhouette(P(BODY, outfit.a)));
  scene.add(scene.clipped(bodyUrl, outfit.p.draw(outfit) + P(BODY, "#1a1226", 'opacity=".08" transform="translate(6 4)"')));
  if (back.p.front) scene.add(scene.outlined(back.p.front(back)));
  if (showHair && H.locks && !G.hidesBack) scene.add(scene.outlined(underGear(P(H.locks, hair))));
  // head
  if (ear.path !== null && !ear.top && !G.hidesHair) {
    const e = P(ear.path || EAR_HUMAN, skin) + S("M51 103 C48 106 49 111 52 113", shade(skin, .2), 1.6);
    scene.add(scene.outlined(e + M(e)));
  }
  scene.add(scene.silhouette(P(FACE, skin)), P(FACE, skin));
  scene.add(scene.clipped(faceUrl, P("M148 86 C148 116 132 138 100 142 C124 130 140 112 142 88Z", shade(skin, .12), 'opacity=".7"')
    + (showHair && H.front && !G.cover && !G.hood ? P(H.front, shade(skin, .16), 'transform="translate(0 4)"') : "")));
  for (const mark of scene.selected("marks")) scene.add(mark.draw(look));
  scene.add(scene.part("eyes").draw(look));
  if (!G.hidesMouth) scene.add(scene.part("mouth").draw(look));
  if (ear.top && showHair) scene.add(scene.outlined(ear.draw(look)));
  if (showHair && H.front) {
    scene.add(scene.outlined(underGear(P(H.front, hair) + (H.ties || []).map(([x, y]) => E(x, y, 6, 4.4, "#d9473a")).join(""))));
    // the anime "angel ring" highlight
    scene.add(underGear(scene.clipped(fringeUrl, T([66, 64, 100, 50, 134, 64], "#fff", 4.2, 'opacity=".3"'))));
  }
  if (showHair && H.shine) scene.add(E(86, 62, 12, 6, "#fff", 'opacity=".35" transform="rotate(-24 86 62)"'));
  // in front: headgear, weapons held in hand
  if (G.front) scene.add(scene.outlined(G.front(gear)));
  if (weapon.p.front) scene.add(scene.outlined(weapon.p.front(weapon)));
}

export const Game = defineLibrary({
  key: "game",
  label: "ゲーム",
  idPrefix: "gm",
  parts: PARTS,
  categories: CATEGORIES,
  groups: GROUPS,
  defaults: DEFAULTS,
  presets: CHARACTERS,
  palettes: PALETTES,
  colorNames: NAMES,
  outline: { color: LINE, width: LINE_W },
  compose,
  random: randomAdventurer,
});
