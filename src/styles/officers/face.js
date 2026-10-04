// Facial features. Each part's draw(look) receives the shared "look" of the avatar
// (skin, skinShade, skinDeep, hair, brow, id) plus a / b for its own color slots.
import { P, S, T, both } from "../../core/draw.js";
import { shade } from "../../core/color.js";
import { INK, EYE_X as EX } from "./geometry.js";

export const EYES = [
  { id: "normal",    label: "ふつう",   draw: x => EX.map(e => `<ellipse cx="${e}" cy="99" rx="3.8" ry="4.9" fill="${INK}"/><circle cx="${e+1.4}" cy="97.1" r="1.5" fill="#fff"/><circle cx="${e-1.3}" cy="101.5" r=".7" fill="#fff" fill-opacity=".8"/>`).join("") },
  { id: "small",     label: "小さめ",   draw: x => EX.map(e => `<circle cx="${e}" cy="99" r="2.8" fill="${INK}"/>`).join("") },
  { id: "big",       label: "ぱっちり", draw: x => EX.map(e => `<ellipse cx="${e}" cy="99" rx="6" ry="6.6" fill="#fff"/><circle cx="${e}" cy="99.6" r="4.4" fill="${x.a}"/><circle cx="${e}" cy="99.6" r="2.2" fill="${INK}"/><circle cx="${e+1.6}" cy="97.6" r="1.4" fill="#fff"/>${S(`M${e-6.6} 97.5 Q${e} 90.5 ${e+6.6} 97.5`, INK, 2.4)}`).join("") },
  { id: "sparkle",   label: "キラキラ", draw: x => EX.map(e => `<ellipse cx="${e}" cy="99" rx="5.4" ry="6.6" fill="${x.a}"/><ellipse cx="${e}" cy="100" rx="3" ry="4" fill="${INK}"/><circle cx="${e+1.8}" cy="96.6" r="1.8" fill="#fff"/><circle cx="${e-1.8}" cy="102.4" r="0.9" fill="#fff"/>${S(`M${e-6} 97 Q${e} 90 ${e+6} 97`, INK, 2.4)}`).join("") },
  { id: "happy",     label: "にっこり", draw: x => both(T([81.6, 101.4, 87, 93.6, 92.4, 101.4], INK, 3.6)) },
  { id: "lash",      label: "まつげ",   draw: x => EX.map(e => { const d = e < 100 ? -1 : 1; return `<ellipse cx="${e}" cy="99" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="${e+1.3}" cy="97.3" r="1.3" fill="#fff"/>${S(`M${e+d*3.4} 96 L${e+d*6.8} 93.4 M${e+d*1.6} 94.8 L${e+d*3.6} 91.8`, INK, 2)}`; }).join("") },
  { id: "calm",      label: "おだやか", draw: x => both(T([81.6, 98.6, 87, 104, 92.4, 98.6], INK, 3.4)) },
  { id: "wink",      label: "ウインク", draw: x => `<ellipse cx="87" cy="99" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="88.3" cy="97.3" r="1.3" fill="#fff"/>` + T([107.6, 100.6, 113, 93.6, 118.4, 100.6], INK, 3.6) },
  { id: "sleepy",    label: "眠そう",   draw: x => EX.map(e => `<ellipse cx="${e}" cy="100.5" rx="3.6" ry="3" fill="${INK}"/>${S(`M${e-5} 99 Q${e} 97.6 ${e+5} 99`, INK, 2.6)}`).join("") },
  { id: "surprised", label: "びっくり", draw: x => EX.map(e => `<circle cx="${e}" cy="99" r="5.6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${e}" cy="99" r="2.3" fill="${INK}"/>`).join("") },
  { id: "closed",    label: "閉じ目",   draw: x => both(T([81.4, 99.6, 87, 101.8, 92.6, 99.6], INK, 3)) },
  { id: "almond",    label: "切れ長",   draw: x => EX.map(e => { const d = e < 100 ? -1 : 1; return P(`M${e-6*d} 100.5 Q${e} 95 ${e+6*d} 98 Q${e} 103.5 ${e-6*d} 100.5Z`, INK) + `<circle cx="${e+1}" cy="98.6" r="1.1" fill="#fff"/>`; }).join("") },
  { id: "glare",     label: "ジト目",   draw: x => EX.map(e => `<ellipse cx="${e}" cy="100" rx="3.6" ry="3.6" fill="${INK}"/>${S(`M${e-5.5} 97 L${e+5.5} 97`, INK, 2.6)}`).join("") },
  { id: "tired",     label: "おつかれ", draw: x => EX.map(e => `<ellipse cx="${e}" cy="99" rx="3.4" ry="4.2" fill="${INK}"/><circle cx="${e+1.2}" cy="97.6" r="1.1" fill="#fff"/>${S(`M${e-5} 106 Q${e} 108.5 ${e+5} 106`, x.skinDeep, 1.8, 'opacity=".6"')}`).join("") },
];

export const BROWS = [
  { id: "normal",  label: "ふつう",   p: [81, 89.5, 87, 84.4, 93.4, 88],   t: 3.4 },
  { id: "thick",   label: "太い",     p: [80.5, 89.6, 87, 83.6, 93.6, 88], t: 5.6 },
  { id: "thin",    label: "細い",     p: [81, 89.2, 87, 85, 93.2, 88],     t: 2 },
  { id: "flat",    label: "まっすぐ", p: [81, 88.6, 87, 87, 93.4, 87.8],   t: 3.2 },
  { id: "raised",  label: "上がり",   p: [81, 86.8, 87, 79.8, 93.4, 84.2], t: 3.4 },
  { id: "arched",  label: "アーチ",   p: [80, 90.4, 83.6, 81, 93.4, 86.6], t: 3.2 },
  { id: "angry",   label: "キリッ",   p: [81, 84.8, 87, 86.6, 93.6, 90.6], t: 3.8 },
  { id: "worried", label: "困り",     p: [81, 90.2, 87.4, 89.4, 93.4, 84.4], t: 3.4 },
  { id: "short",   label: "まろ",     dot: true },
  { id: "none",    label: "なし" },
].map(b => ({ ...b, draw: x => b.dot ? both(`<ellipse cx="87" cy="87" rx="3.4" ry="2.4" fill="${x.brow}"/>`) : b.p ? both(T(b.p, x.brow, b.t)) : "" }));

export const NOSES = [
  { id: "soft",     label: "ふつう",   draw: x => T([99.2, 103.4, 104.6, 108.6, 98.2, 110.8], x.skinDeep, 2.4, 'opacity=".75"') },
  { id: "button",   label: "まる",     draw: x => `<ellipse cx="100" cy="107" rx="3.6" ry="2.8" fill="${x.skinShade}"/>` },
  { id: "nostrils", label: "鼻の穴",   draw: x => `<circle cx="97.4" cy="108" r="1.3" fill="${x.skinDeep}"/><circle cx="102.6" cy="108" r="1.3" fill="${x.skinDeep}"/>` },
  { id: "line",     label: "すじ",     draw: x => S("M100 97 L102.5 107.5 L98.5 108.5", x.skinDeep, 2, 'opacity=".7"') },
  { id: "round",    label: "だんご",   draw: x => `<ellipse cx="100" cy="106" rx="5.4" ry="4.2" fill="${x.skinShade}"/><ellipse cx="98.4" cy="104.6" rx="1.8" ry="1.2" fill="#fff" opacity=".5"/>` },
  { id: "none",     label: "なし",     draw: x => "" },
];

export const MOUTHS = [
  { id: "smile",   label: "にこ",       draw: x => T([92.4, 117.6, 100, 125, 107.6, 117.6], INK, 3.2) },
  { id: "grin",    label: "笑顔",       draw: x => P("M90 116 Q100 131 110 116Z", INK) + P("M92 117 L108 117 Q107 120.5 100 120.5 Q93 120.5 92 117Z", "#fff") + P("M95 125 Q100 121.5 105 125 Q100 127.5 95 125Z", "#f08a9b") },
  { id: "laugh",   label: "大笑い",     draw: x => P("M87 114 Q100 136 113 114Z", INK) + P("M89.5 115 L110.5 115 Q109 119 100 119 Q91 119 89.5 115Z", "#fff") + P("M93 128 Q100 122 107 128 Q100 132 93 128Z", "#f08a9b") },
  { id: "open",    label: "ぱく",       draw: x => P("M94 117 Q100 127 106 117Z", INK) + P("M96.5 122.5 Q100 120 103.5 122.5 Q100 125 96.5 122.5Z", "#f08a9b") },
  { id: "teeth",   label: "歯見せ",     draw: x => P("M91 116 L109 116 Q108 124.5 100 124.5 Q92 124.5 91 116Z", "#fff", `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`) + S("M92 120 L108 120", INK, 1.2, 'opacity=".4"') },
  { id: "neutral", label: "むっ",       draw: x => T([94.4, 120.2, 100, 121.4, 105.6, 120.2], INK, 2.8) },
  { id: "smirk",   label: "ニヤリ",     draw: x => T([93.6, 120.4, 102.4, 124, 108, 116], INK, 3) },
  { id: "tongue",  label: "べー",       draw: x => T([91.6, 117.6, 100, 124.4, 108.4, 117.6], INK, 3) + P("M96.5 120.5 Q100 130 103.5 120.5Z", "#f08a9b", `stroke="${INK}" stroke-width="1.6"`) },
  { id: "o",       label: "おっ",       draw: x => `<ellipse cx="100" cy="120" rx="3.6" ry="4.6" fill="${INK}"/>` },
  { id: "frown",   label: "へ",         draw: x => T([92.6, 122.4, 100, 115.4, 107.4, 122.4], INK, 3) },
  { id: "cat",     label: "ω",          draw: x => S("M92 118 Q96 122.5 100 118 Q104 122.5 108 118", INK, 2.6) },
  { id: "lips",    label: "口紅",       draw: x => P("M90 118 Q95 114.5 100 116.5 Q105 114.5 110 118 Q100 127 90 118Z", x.a) + S("M91 118 Q100 120 109 118", shade(x.a, .35), 1.4) },
  { id: "lipsSmile", label: "口紅にこ", draw: x => P("M90 116.5 Q95 115 100 116.5 Q105 115 110 116.5 Q100 128 90 116.5Z", x.a) + P("M92 117.5 L108 117.5 Q100 121 92 117.5Z", "#fff") },
];

export const BEARDS = [
  { id: "none",      label: "なし",       draw: x => "" },
  { id: "stubble",   label: "無精ひげ",   draw: x => P("M68 104 C70 126 84 137 100 137 C116 137 130 126 132 104 C128 117 120 125 100 127 C80 125 72 117 68 104Z", x.hair, 'opacity=".3"') },
  { id: "mustache",  label: "口ひげ",     draw: x => P("M88 114 C93 108 99 110 100 112 C101 110 107 108 112 114 C107 116 101 114.5 100 113.5 C99 114.5 93 116 88 114Z", x.hair) },
  { id: "chevron",   label: "太口ひげ",   draw: x => P("M86 115 C90 108 110 108 114 115 L112 118 C106 113.5 94 113.5 88 118Z", x.hair) },
  { id: "handlebar", label: "カイゼル",   draw: x => P("M83 108 C85 116 93 114 100 111 C107 114 115 116 117 108 C117 118 107 117 100 114.5 C93 117 83 118 83 108Z", x.hair) },
  { id: "goatee",    label: "あごひげ",   draw: x => P("M94 127 C94 135 106 135 106 127 C103 129 97 129 94 127Z", x.hair) + P("M90 114 C94 110 99 111 100 112.5 C101 111 106 110 110 114 C106 115.5 101 114.5 100 114 C99 114.5 94 115.5 90 114Z", x.hair) },
  { id: "chin",      label: "あご下",     draw: x => P("M90 130 C94 138 106 138 110 130 C106 133 94 133 90 130Z", x.hair) },
  { id: "beard",     label: "フルひげ",   draw: x => P("M66 98 C66 118 74 134 88 140 C94 143 106 143 112 140 C126 134 134 118 134 98 C130 110 126 118 118 121 C112 116 106 114 100 115 C94 114 88 116 82 121 C74 118 70 110 66 98Z", x.hair) + P("M89 115 C94 111 99 112 100 113.5 C101 112 106 111 111 115 C106 116.5 101 115.5 100 115 C99 115.5 94 116.5 89 115Z", x.hair) },
  { id: "longBeard", label: "長ひげ",     draw: x => P("M66 98 C66 126 78 150 100 160 C122 150 134 126 134 98 C130 110 126 118 118 121 C112 116 106 114 100 115 C94 114 88 116 82 121 C74 118 70 110 66 98Z", x.hair) + P("M89 115 C94 111 99 112 100 113.5 C101 112 106 111 111 115 C106 116.5 101 115.5 100 115 C99 115.5 94 116.5 89 115Z", x.hair) },
  { id: "sideburns", label: "もみあげ",   draw: x => both(P("M66 90 L66 112 C68 116 71 117 73 116 L72 90Z", x.hair)) },
  { id: "chinstrap", label: "あご線",     draw: x => P("M66 96 C66 120 80 138 100 140 C120 138 134 120 134 96 L131 96 C130 118 118 133 100 134 C82 133 70 118 69 96Z", x.hair) },
];

export const FACE_MARKS = [
  { id: "blush",     label: "ほっぺ",     draw: x => `<ellipse cx="78" cy="110.5" rx="9.5" ry="6.5" fill="url(#${x.id}bl)" opacity="1"/><ellipse cx="122" cy="110.5" rx="9.5" ry="6.5" fill="url(#${x.id}bl)" opacity="1"/>` },
  { id: "freckles",  label: "そばかす",   draw: x => both([[76,108],[80,111],[84,108],[79,105]].map(([a,b]) => `<circle cx="${a}" cy="${b}" r="1.1" fill="${x.skinDeep}" opacity=".55"/>`).join("")) },
  { id: "mole",      label: "ほくろ",     draw: x => `<circle cx="117" cy="115" r="1.3" fill="${INK}"/>` },
  { id: "smile",     label: "ほうれい線", draw: x => both(T([86.4, 109.6, 82, 116, 87.4, 121.6], x.skinDeep, 1.8, 'opacity=".5"')) },
  { id: "forehead",  label: "おでこのしわ", draw: x => T([87.6, 74.4, 100, 70.2, 112.4, 74.4], x.skinDeep, 1.8, 'opacity=".45"') + T([90, 79.4, 100, 75.8, 110, 79.4], x.skinDeep, 1.5, 'opacity=".45"') },
  { id: "crow",      label: "目尻のしわ", draw: x => both(S("M76 97 L73 95.5 M76 100 L72.5 100", x.skinDeep, 1.4, 'opacity=".45"')) },
  { id: "eyebags",   label: "くま",       draw: x => both(S("M82 106 Q87 108.5 92 106", "#7b5aa6", 2, 'opacity=".25"')) },
  { id: "bandaid",   label: "ばんそうこう", draw: x => `<g transform="rotate(-20 122 112)"><rect x="113" y="108.5" width="18" height="7" rx="3.5" fill="#f2c9a0"/><rect x="119.5" y="108.5" width="5" height="7" fill="#e3b083"/></g>` },
  { id: "sweat",     label: "汗",         free: true, draw: x => P("M134 72 C130 78 129 82 132 84 C135 86 138 83 136 79 C135 77 134 74 134 72Z", "#8cc8f0") },
];
