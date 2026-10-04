// Clothing.
//
// Tops are stacks of layers, inner → outer. Every layer fills the whole body and only
// its neckline (`open`) is cut out, so an inner layer can only ever show through the
// opening of the layer above it — gaps and leaks are impossible by construction.
// Skin is laid underneath automatically. `deco` draws collars, ties and buttons on a
// layer; whatever the outer layers cover is hidden naturally.
import { P, S, T, both, ring } from "../../core/draw.js";
import { shade, lighten } from "../../core/color.js";
import { BODY, BODY_SIDES, OPEN, LINE, LINE_W } from "./geometry.js";

const L = (fill, open, deco) => ({ fill, open, deco });
const lapelsV    = (fill) => both(P("M84 147 L100 186 L95 190 L79 164 L85 158 L78 153Z", fill));
const lapelsOpen = (fill) => both(P("M83 147 L92.6 186 L88 189 L76 164 L82 157 L76 152Z", fill));
const tie = (c, x) => x && x.noTie ? "" : P("M96 151 L104 151 L103 157 L97 157Z", shade(c, .2)) + P("M97 157 L103 157 L106 180 L100 187 L94 180Z", c);
const collarPoints = (fill, edge) => P("M86 145 L100 161 L91 170 L83 152Z M114 145 L100 161 L109 170 L117 152Z", fill, `stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"`);
const collarClosed = (fill, edge) => P("M86 145 L100 153 L91 164 L83 152Z M114 145 L100 153 L109 164 L117 152Z", fill, `stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"`);
const crewRib = (c, w = 4) => S("M86 147 C90 159 110 159 114 147", c, w);
const hood = (c) => P("M64 158 C68 138 86 136 100 140 C114 136 132 138 136 158 C126 166 114 161 100 162 C86 161 74 166 64 158Z", c);
const WHITE = "#ffffff", COLLAR_W = "#f4f1f6";
const shirtUnder = (tieColor) => L(() => WHITE, OPEN.neck, x => collarClosed(COLLAR_W, "#dcd6e2") + tie(tieColor(x), x));

export const TOPS = [
  { id: "suit",       label: "スーツ", layers: [
      shirtUnder(x => x.b),
      L(x => x.a, OPEN.jacket, x => lapelsV(shade(x.a, .22)) + `<circle cx="100" cy="194" r="2.2" fill="${shade(x.a, .3)}"/>`) ] },
  { id: "threePiece", label: "スリーピース", layers: [
      shirtUnder(x => x.b),
      L(x => shade(x.a, .28), OPEN.vest, x => `<circle cx="100" cy="183" r="1.8" fill="${lighten(x.a, .25)}"/><circle cx="100" cy="193" r="1.8" fill="${lighten(x.a, .25)}"/>`),
      L(x => x.a, OPEN.front, x => lapelsOpen(shade(x.a, .18))) ] },
  { id: "blazer",     label: "ジャケット", layers: [
      L(x => x.b, OPEN.crew, x => crewRib(shade(x.b, .12), 2.5)),
      L(x => x.a, OPEN.front, x => lapelsOpen(shade(x.a, .15))) ] },
  { id: "blazerShirt",label: "ジャケット＋シャツ", layers: [
      L(x => x.b, OPEN.collar, x => collarPoints(lighten(x.b, .3), shade(x.b, .15))),
      L(x => x.a, OPEN.front, x => lapelsOpen(shade(x.a, .15))) ] },
  { id: "shirt",      label: "シャツ", layers: [
      L(x => x.a, OPEN.collar, x => S("M100 161 V200", shade(x.a, .2), 1.5) + `<circle cx="103" cy="172" r="1.6" fill="${shade(x.a, .2)}"/><circle cx="103" cy="186" r="1.6" fill="${shade(x.a, .2)}"/>` + collarPoints(x.a, shade(x.a, .2))) ] },
  { id: "shirtTie",   label: "シャツ＋ネクタイ", layers: [
      L(x => x.a, OPEN.neck, x => S("M100 186 V200", shade(x.a, .2), 1.5) + tie(x.b, x) + collarClosed(x.a, shade(x.a, .2))) ] },
  { id: "polo",       label: "ポロシャツ", layers: [
      L(x => x.a, OPEN.collar, x => P("M96 158 L104 158 L104 174 L96 174Z", shade(x.a, .08)) + `<circle cx="100" cy="164" r="1.6" fill="${x.b}"/><circle cx="100" cy="170" r="1.6" fill="${x.b}"/>` + P("M84 146 L99 158 L90 164 L80 152Z M116 146 L101 158 L110 164 L120 152Z", lighten(x.a, .12), `stroke="${shade(x.a, .18)}" stroke-width="1.3" stroke-linejoin="round"`)) ] },
  { id: "hoodie",     label: "パーカー", layers: [
      L(x => x.a, OPEN.crew, x => hood(shade(x.a, .15)) + P("M86 148 C92 156 108 156 114 148 C110 160 90 160 86 148Z", "#000", 'opacity=".18"') + S("M92 160 C91 170 90 178 90 186 M108 160 C109 170 110 178 110 186", x.b, 2.5)) ] },
  { id: "zipHoodie",  label: "ジップパーカー", layers: [
      L(x => x.b, OPEN.crew, x => crewRib(shade(x.b, .12), 2.5)),
      L(x => x.a, OPEN.zip, x => hood(shade(x.a, .15)) + S("M100 160 L100 200", shade(x.a, .35), 2.4) + `<rect x="98" y="162" width="4" height="7" rx="1.5" fill="${lighten(x.a, .5)}"/>`) ] },
  { id: "tshirt",     label: "Tシャツ", layers: [ L(x => x.a, OPEN.crew, x => crewRib(shade(x.a, .15))) ] },
  { id: "logoTee",    label: "ロゴT", layers: [ L(x => x.a, OPEN.crew, x => crewRib(shade(x.a, .15)) + `<circle cx="100" cy="182" r="9" fill="${x.b}"/>` + S("M96 182 L100 178 L104 182 L100 186Z", x.a, 2)) ] },
  { id: "vneck",      label: "Vネック", layers: [ L(x => x.a, OPEN.v, x => S("M87 147 L100 168 L113 147", shade(x.a, .15), 3.5)) ] },
  { id: "stripe",     label: "ボーダー", layers: [ L(x => x.a, OPEN.crew, x => [162, 174, 186, 198].map(y => `<rect x="20" y="${y}" width="160" height="5" fill="${x.b}"/>`).join("") + crewRib(shade(x.a, .12))) ] },
  { id: "turtle",     label: "タートル", layers: [ L(x => x.a, null, x => P("M86 124 C92 121 108 121 114 124 L115 152 C108 157 92 157 85 152Z", x.a) + S("M86 134 C94 137 106 137 114 134 M86 143 C94 146 106 146 114 143", "#000", 2, 'stroke-opacity=".2"')) ] },
  { id: "sweater",    label: "セーター", layers: [
      L(x => x.b, OPEN.collar, x => collarPoints(x.b, shade(x.b, .18))),
      L(x => x.a, OPEN.crewLow, x => S("M84 148 C90 163 110 163 116 148", shade(x.a, .15), 4.5) + S("M60 196 L60 186 M70 196 L70 184 M130 196 L130 184 M140 196 L140 186", shade(x.a, .12), 1.4)) ] },
  { id: "cardigan",   label: "カーディガン", layers: [
      L(x => x.b, OPEN.crew, x => crewRib(shade(x.b, .1), 2.5)),
      L(x => x.a, OPEN.front, x => S("M83 147 L96 200 M117 147 L104 200", shade(x.a, .15), 3) + `<circle cx="91" cy="176" r="2" fill="${shade(x.a, .2)}"/><circle cx="94.5" cy="190" r="2" fill="${shade(x.a, .2)}"/>`) ] },
  { id: "blouse",     label: "ブラウス", layers: [
      L(x => x.a, OPEN.neck, x => P("M84 147 C83 161 96 163 100 152 C104 163 117 161 116 147 C108 144 92 144 84 147Z", x.b, `stroke="${shade(x.b, .15)}" stroke-width="1.5"`)) ] },
  { id: "bowBlouse",  label: "ボウタイ", layers: [
      L(x => x.a, OPEN.neck, x => P("M100 155 L84 149 L86 163Z M100 155 L116 149 L114 163Z", x.b) + `<circle cx="100" cy="155" r="3.6" fill="${shade(x.b, .15)}"/>` + S("M98 157 L94 176 M102 157 L106 176", x.b, 3.4)) ] },
  { id: "officeVest", label: "事務服ベスト", layers: [
      L(() => WHITE, OPEN.neck, x => P("M84 147 C83 158 96 160 100 152 C104 160 117 158 116 147 C108 144 92 144 84 147Z", WHITE, 'stroke="#e0dbe6" stroke-width="1.5"') + P("M100 155 L90 149 L91 161Z M100 155 L110 149 L109 161Z", x.b) + `<circle cx="100" cy="155" r="3" fill="${shade(x.b, .15)}"/>`),
      L(x => x.a, OPEN.front, x => `<circle cx="93" cy="180" r="1.8" fill="${shade(x.a, .3)}"/><circle cx="95.5" cy="192" r="1.8" fill="${shade(x.a, .3)}"/>`) ] },
  { id: "workwear",   label: "作業着", layers: [
      L(x => x.a, OPEN.collar, x => P("M84 146 L100 161 L92 170 L80 152Z M116 146 L100 161 L108 170 L120 152Z", shade(x.a, .12)) + S("M100 161 L100 200", shade(x.a, .35), 2.4) + `<rect x="112" y="174" width="18" height="14" rx="2" fill="${shade(x.a, .1)}"/><rect x="70" y="174" width="18" height="7" rx="1.5" fill="${x.b}"/>`) ] },
  { id: "labcoat",    label: "白衣", layers: [
      L(x => x.a, OPEN.neck, x => collarClosed(lighten(x.a, .3), shade(x.a, .15)) + tie(x.b, x)),
      L(() => "#f7f7fa", OPEN.front, x => lapelsOpen("#e6e3ec") + `<rect x="114" y="178" width="16" height="12" rx="2" fill="none" stroke="#dcd8e3" stroke-width="1.5"/>` + S("M118 176 L118 184", "#3a8fd9", 2)) ] },
  { id: "apron",      label: "エプロン", layers: [
      L(x => x.a, OPEN.crew, x => crewRib(shade(x.a, .15)) + P("M80 172 L120 172 L124 200 L76 200Z", x.b) + S("M80 172 L74 152 M120 172 L126 152", x.b, 3.5) + `<rect x="92" y="180" width="16" height="10" rx="2" fill="${shade(x.b, .1)}"/>`) ] },
  { id: "denim",      label: "デニム", layers: [
      L(x => x.b, OPEN.crew, x => crewRib(shade(x.b, .12), 2.5)),
      L(x => x.a, OPEN.front, x => P("M83 146 L91 164 L86 170 L76 154Z M117 146 L109 164 L114 170 L124 154Z", shade(x.a, .12)) + `<rect x="64" y="172" width="18" height="12" rx="2" fill="none" stroke="#e8b04a" stroke-width="1.2" stroke-dasharray="2 2"/><rect x="118" y="172" width="18" height="12" rx="2" fill="none" stroke="#e8b04a" stroke-width="1.2" stroke-dasharray="2 2"/>`) ] },
  { id: "kimono",     label: "着物", layers: [
      L(x => x.b, OPEN.neck),
      L(x => x.a, OPEN.kimono, x => S("M115 146 L86 200", shade(x.a, .2), 2.5) + P("M40 190 L160 190 L160 200 L40 200Z", shade(x.a, .3))) ] },
  { id: "chefCoat",   label: "コックコート", layers: [
      L(x => x.a, OPEN.neck, x => P("M86 148 C88 140 112 140 114 148 L114 154 C106 151 94 151 86 154Z", x.a, `stroke="${shade(x.a, .1)}" stroke-width="1.5"`) + [[90, 168], [90, 184], [110, 168], [110, 184]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="${x.b}"/>`).join("") + S("M100 154 L120 200", shade(x.a, .1), 1.5)) ] },
];

export function drawTop(top, x, uidp){
  let defs = `<clipPath id="${uidp}body"><path d="${BODY}"/></clipPath>`, body = P(BODY, x.skin);
  top.layers.forEach((ly, i) => {
    let attr = "";
    if (ly.open){
      const mid = `${uidp}m${i}`;
      defs += `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><path d="${ly.open}" fill="#000"/></mask>`;
      attr = `mask="url(#${mid})"`;
    }
    body += P(BODY, ly.fill(x), attr);
    if (ly.open) body += `<path d="${ly.open}" fill="none" stroke="${LINE}" stroke-width="${LINE_W / 2}" stroke-linejoin="round" clip-path="url(#${uidp}body)"/>`;
    body += ly.deco ? ly.deco(x) : "";
  });
  body += P(BODY_SIDES, "#000", 'opacity=".07"');
  body += both(T([60, 168, 63.5, 180, 61, 194], "#1a1226", 1.8, 'opacity=".16"') + T([66, 162, 70, 167, 74, 168], "#1a1226", 1.2, 'opacity=".12"'));
  return { defs, body };
}

export const NECKWEAR = [
  { id: "none",     label: "なし",           draw: x => "" },
  { id: "lanyard",  label: "社員証",         draw: x => S("M89 151 L98 184 M111 151 L102 184", x.a, 2.4) + `<rect x="91" y="183" width="18" height="15" rx="2.5" fill="#fff" stroke="${shade(x.b, .2)}" stroke-width="1"/><rect x="94" y="187" width="6" height="7" rx="1" fill="${x.b}"/>` + S("M102 188 L106 188 M102 192 L106 192", "#c9c3d0", 1.2) },
  { id: "bowtie",   label: "蝶ネクタイ",     replacesTie: true,     draw: x => P("M100 156 L88 150 L88 162Z M100 156 L112 150 L112 162Z", x.a) + `<rect x="96.5" y="152.5" width="7" height="7" rx="2" fill="${shade(x.a, .2)}"/>` },
  { id: "scarf",    label: "スカーフ",       replacesTie: true,       draw: x => P("M84 150 C90 160 110 160 116 150 C114 158 106 162 100 162 C94 162 86 158 84 150Z", x.a) + P("M100 160 L94 178 L101 176Z M101 160 L108 176 L102 172Z", x.a) + `<circle cx="100" cy="160" r="3.4" fill="${shade(x.a, .2)}"/>` },
  { id: "muffler",  label: "マフラー",       draw: x => P("M80 148 C80 140 120 140 120 148 L120 158 C108 164 92 164 80 158Z", x.a) + P("M104 156 L116 156 L118 192 L104 192Z", x.a) + S("M104 186 L118 186", x.b, 2) + S("M106 192 L106 196 M110 192 L110 196 M114 192 L114 196", x.a, 1.6) + S("M82 152 C94 157 106 157 118 152", shade(x.a, .15), 1.5) },
  { id: "necklace", label: "ネックレス",     draw: x => S("M88 150 C90 166 110 166 112 150", x.a, 1.4) + `<circle cx="100" cy="164.5" r="2.6" fill="${x.b}"/>` },
  { id: "pearls",   label: "パール",         draw: x => ring(100, 146, 16, 11, 2.3, 30, 150).map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="${x.a}"/>`).join("") },
  { id: "pendant",  label: "ペンダント",     draw: x => S("M88 150 L100 172 L112 150", x.a, 1.2) + P("M100 170 L106 176 L100 184 L94 176Z", x.b) },
  { id: "stetho",   label: "聴診器",         draw: x => S("M84 150 C80 170 84 182 92 184 M116 150 C120 166 118 176 112 182", x.a, 2.4) + `<circle cx="112" cy="185" r="4.6" fill="${x.b}" stroke="${x.a}" stroke-width="1.6"/>` },
];

export const CHEST = [
  { id: "none",    label: "なし",       draw: x => "" },
  { id: "pin",     label: "社章",       draw: x => `<circle cx="122" cy="166" r="3.4" fill="${x.a}"/><circle cx="122" cy="166" r="1.4" fill="${x.b}"/>` },
  { id: "nameTag", label: "名札",       draw: x => `<rect x="66" y="170" width="22" height="12" rx="2" fill="#fff" stroke="#d8d2de" stroke-width="1"/><rect x="66" y="170" width="22" height="3.6" rx="1" fill="${x.a}"/>` + S("M70 177.5 L84 177.5", "#b9b2c2", 1.4) },
  { id: "pen",     label: "胸ポケのペン", draw: x => `<rect x="118" y="164" width="3" height="14" rx="1.5" fill="${x.a}"/><rect x="124" y="166" width="3" height="12" rx="1.5" fill="${x.b}"/>` + S("M114 176 L132 176", "#000", 1.2, 'stroke-opacity=".15"') },
  { id: "pocketSq",label: "ポケットチーフ", draw: x => P("M116 172 L120 164 L124 170 L128 163 L131 172Z", x.a) + S("M114 172 L133 172", "#000", 1.2, 'stroke-opacity=".2"') },
  { id: "flower",  label: "胸の花",     draw: x => `<g transform="translate(122 168)">${[0,72,144,216,288].map(a => `<circle cx="${4.4 * Math.cos(a * Math.PI / 180)}" cy="${4.4 * Math.sin(a * Math.PI / 180)}" r="3.6" fill="${x.a}"/>`).join("")}<circle r="2.4" fill="${x.b}"/></g>` },
  { id: "badge",   label: "缶バッジ",   draw: x => `<circle cx="122" cy="172" r="7" fill="${x.a}" stroke="${shade(x.a, .2)}" stroke-width="1"/><circle cx="122" cy="172" r="3.2" fill="${x.b}"/>` },
];
