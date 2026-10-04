// Officers — people at work: suits, hoodies, lanyards and a company theme color.
import { defineLibrary } from "../../core/library.js";
import { P, S, T, M, quadPoints, blushGradient } from "../../core/draw.js";
import { mix, shade, lighten, luminance } from "../../core/color.js";
import { INK, LINE, LINE_W, FACE, EAR, EAR_IN, NECK, NECK_SHADOW, BODY, FACE_SHADE, REGIONS } from "./geometry.js";
import { PALETTES, COLOR_NAMES, resolveTheme } from "./palette.js";
import { HAIR } from "./hair.js";
import { EYES, BROWS, NOSES, MOUTHS, BEARDS, FACE_MARKS } from "./face.js";
import { GLASSES, HATS, EARGEAR, EARRINGS } from "./accessories.js";
import { TOPS, drawTop, NECKWEAR, CHEST } from "./wear.js";
import { ROLES, randomOfficer } from "./presets.js";

// Thumbnail framing used by the picker.
const FACE_VIEW = "56 58 88 88", HEAD_VIEW = "20 6 160 160", BODY_VIEW = "20 120 160 80";

const CATEGORIES = [
  { key: "skin",     label: "肌",           colors: [{ key: "skin", label: "肌の色", palette: PALETTES.skin }] },
  { key: "hair",     label: "髪型",         parts: HAIR, view: HEAD_VIEW, colors: [{ key: "hairColor", label: "髪の色", palette: PALETTES.hair }] },
  { key: "eyes",     label: "目",           parts: EYES, view: FACE_VIEW, colors: [{ key: "eyesColor", label: "瞳（ぱっちり・キラキラ）", palette: PALETTES.eyes }] },
  { key: "brows",    label: "眉",           parts: BROWS, view: FACE_VIEW },
  { key: "nose",     label: "鼻",           parts: NOSES, view: FACE_VIEW },
  { key: "mouth",    label: "口",           parts: MOUTHS, view: FACE_VIEW, colors: [{ key: "mouthColor", label: "口紅", palette: PALETTES.lips }] },
  { key: "beard",    label: "ひげ",         parts: BEARDS, view: FACE_VIEW },
  { key: "face",     label: "顔のしるし",   parts: FACE_MARKS, view: FACE_VIEW, multi: true },
  { key: "glasses",  label: "メガネ",       parts: GLASSES, view: FACE_VIEW, colors: [{ key: "glassesColor", label: "フレーム", palette: PALETTES.item }, { key: "glassesColor2", label: "レンズ", palette: PALETTES.item }] },
  { key: "hat",      label: "帽子・髪飾り", parts: HATS, view: HEAD_VIEW, colors: [{ key: "hatColor", label: "メイン", palette: PALETTES.item }, { key: "hatColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "ear",      label: "ヘッドホン等", parts: EARGEAR, view: "20 30 160 160", colors: [{ key: "earColor", label: "メイン", palette: PALETTES.item }, { key: "earColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "earrings", label: "ピアス",       parts: EARRINGS, view: "40 80 60 60", colors: [{ key: "earringsColor", label: "色", palette: PALETTES.item }] },
  { key: "top",      label: "服",           parts: TOPS, view: BODY_VIEW, colors: [{ key: "topColor", label: "メイン", palette: PALETTES.item }, { key: "topColor2", label: "サブ（ネクタイ・インナー）", palette: PALETTES.item }] },
  { key: "neck",     label: "首まわり",     parts: NECKWEAR, view: BODY_VIEW, colors: [{ key: "neckColor", label: "メイン", palette: PALETTES.item }, { key: "neckColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "chest",    label: "胸元",         parts: CHEST, view: BODY_VIEW, colors: [{ key: "chestColor", label: "メイン", palette: PALETTES.item }, { key: "chestColor2", label: "サブ", palette: PALETTES.item }] },
  { key: "bg",       label: "背景",         colors: [{ key: "bgColor", label: "背景色", palette: PALETTES.bg }] },
];

const GROUPS = [
  { label: "顔",   cats: ["skin", "eyes", "brows", "mouth", "nose", "beard", "face"] },
  { label: "髪",   cats: ["hair"] },
  { label: "服",   cats: ["top", "neck", "chest"] },
  { label: "小物", cats: ["glasses", "hat", "earrings", "ear"] },
  { label: "背景", cats: ["bg"] },
];

const DEFAULTS = {
  skin: "#f3c9a8",
  hair: "side", hairColor: "#2b2429",
  eyes: "normal", eyesColor: "#5a3a2a",
  brows: "normal", nose: "soft",
  mouth: "smile", mouthColor: "#d65a6f",
  beard: "none", face: ["blush"],
  glasses: "none", glassesColor: "#2b2233", glassesColor2: "#ffffff",
  hat: "none", hatColor: "theme-accent", hatColor2: "#2b2233",
  ear: "none", earColor: "theme-accent", earColor2: "#2b2233",
  earrings: "none", earringsColor: "#c9a227",
  top: "suit", topColor: "theme-dark", topColor2: "theme-accent",
  neck: "none", neckColor: "theme-accent", neckColor2: "theme-light",
  chest: "none", chestColor: "#c9a227", chestColor2: "#ffffff",
  bgColor: "theme-bg",
};

const circles = (list, fill, dy = 0) => (list || []).map(([x, y, r]) => `<circle cx="${x}" cy="${y + dy}" r="${r}" fill="${fill}"/>`).join("");
const hairTies = (ties, fill) => (ties || []).map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5" fill="${fill}"/>`).join("");

function compose(scene) {
  const { config: cfg, options } = scene;
  const skin = scene.color("skin");
  const hair = scene.color("hairColor");

  // The "look" every part draws with; `paint(cat)` adds that category's color slots.
  const look = {
    id: scene.id, skin,
    skinShade: mix(skin, "#8a3f2e", 0.16),
    skinDeep: mix(skin, "#6b2a22", 0.32),
    hair, hairShade: shade(hair, 0.25),
    brow: luminance(hair) > 0.55 ? mix(hair, INK, 0.5) : hair,
  };
  const paint = (cat) => ({ ...look, id: scene.uid(cat), a: scene.color(`${cat}Color`), b: scene.color(`${cat}Color2`) });
  const lineAttr = `stroke="${LINE}" stroke-width="${LINE_W / 2}" stroke-linejoin="round"`;
  scene.define(blushGradient(scene.uid("bl"), "#ff6f73", 0.42, 0.2));

  // Every category with a region is clipped to it (see geometry.js).
  const regionUrl = Object.fromEntries(Object.entries(REGIONS).map(([cat, paths]) => [cat, scene.clip(`r${cat}`, paths)]));
  const inRegion = (cat, part, svg) =>
    !svg || scene.omit.has(cat) ? "" : part.free || options.noClip ? svg : scene.clipped(regionUrl[cat], svg);
  const draw = (cat, ctx = paint(cat)) => { const p = scene.part(cat); return inRegion(cat, p, p.draw(ctx)); };

  const H = scene.part("hair"), hat = scene.part("hat"), ear = scene.part("ear");
  const hideHair = !!hat.hidesHair;
  const hatPaint = paint("hat"), earPaint = paint("ear");
  const hatColor = scene.color("hatColor");
  const strandColor = luminance(hair) < 0.25 ? lighten(hair, 0.38) : shade(hair, 0.32);

  // A hat that covers the crown only lets hair show below its rim; outside the rim
  // the cut slopes down so the hair seems to flow out from under it.
  const cover = !hideHair && hat.cover;
  const puffs = cover && H.hatPuffs;
  let underHat = (s) => s;
  if (cover) {
    const { y, hw } = cover, side = y + (100 - hw) * 1.6;
    const url = scene.clip("hc", `M0 200 L0 ${side} L${100 - hw} ${y} L${100 + hw} ${y} L200 ${side} L200 200Z`);
    underHat = (s) => scene.clipped(url, s);
  }

  // Behind the head
  if (hat.back) scene.add(scene.outlined(hat.back(hatPaint)));
  if (!hideHair) {
    if (puffs) scene.add(scene.outlined(circles(puffs.map(([x, y, r]) => [x + (x < 100 ? -2 : 2), y + 2, r]), look.hairShade)));
    else scene.add(scene.outlined(underHat((H.back && !(cover && H.bunBack) ? P(H.back, look.hairShade) : "") + circles(H.backCircles, look.hairShade))));
  }

  // Neck and body. Clothes, neckwear and chest items never leave the cloth area.
  scene.add(P(NECK, skin, lineAttr), P(NECK_SHADOW, look.skinShade));
  if (!scene.omit.has("top")) scene.add(P(BODY, LINE, `stroke="${LINE}" stroke-width="${LINE_W}" stroke-linejoin="round"`));
  const neckPart = scene.part("neck");
  const top = drawTop(scene.part("top"), { ...paint("top"), noTie: !!neckPart.replacesTie && !scene.omit.has("neck") }, scene.id);
  scene.define(top.defs);
  const clothes = (scene.omit.has("top") ? P(BODY, skin) : top.body)
    + (scene.omit.has("neck") ? "" : neckPart.draw(paint("neck")))
    + (scene.omit.has("chest") ? "" : scene.part("chest").draw(paint("chest")))
    + (ear.body && !scene.omit.has("ear") ? ear.draw(earPaint) : "");
  scene.add(options.noClip ? `<g >${scene.outlined(clothes)}</g>` : scene.clipped(regionUrl.top, scene.outlined(clothes)));
  if (!hideHair && H.over) scene.add(scene.outlined(underHat(P(H.over, hair))));
  if (!hideHair && H.braid) {
    scene.add(scene.outlined(underHat(
      H.braid.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="9" fill="${hair}" stroke="${look.hairShade}" stroke-width="1.5"/>`).join("") +
      `<ellipse cx="141" cy="178" rx="4" ry="3" fill="${hatColor}"/>`)));
  }

  // Ears and face
  const earSvg = P(EAR, skin, lineAttr) + S(EAR_IN, look.skinShade, 2);
  scene.add(earSvg, M(earSvg));
  scene.add(scene.outlined(draw("earrings")));
  const faceUrl = scene.clip("f", FACE);
  scene.add(P(FACE, skin, lineAttr));
  scene.add(`<path d="${FACE_SHADE}" fill="${look.skinShade}" opacity=".55" clip-path="${faceUrl}"/>`);
  if (cover) {
    // the hat brim casts a shadow on the forehead
    scene.add(`<path d="M0 ${cover.y - 4} L200 ${cover.y - 4} L200 ${cover.y + 7} C150 ${cover.y + 4} 50 ${cover.y + 4} 0 ${cover.y + 7}Z" fill="${look.skinShade}" clip-path="${faceUrl}"/>`);
  } else if (!hideHair && !H.noShadow) {
    // the fringe casts a shadow on the forehead
    if (H.front) scene.add(`<path d="${H.front}" transform="translate(0 4)" fill="${look.skinShade}" clip-path="${faceUrl}"/>`);
    if (H.frontCircles) scene.add(scene.clipped(faceUrl, circles(H.frontCircles, look.skinShade, 4)));
  }
  for (const mark of scene.selected("face")) scene.add(inRegion("face", mark, mark.draw(look)));
  scene.add(draw("brows", look), draw("eyes"), draw("nose", look), scene.outlined(draw("beard", look)), draw("mouth"));

  // Fringe
  if (!hideHair) {
    const strands = H.strands ? H.strands.map((p) => T(p, strandColor, 1.7, 'opacity=".55"')).join("") : "";
    if (puffs) {
      scene.add(scene.outlined(circles(puffs, hair)));
    } else if (cover) {
      scene.add(scene.outlined(underHat(circles(H.frontCircles, hair) + (H.front ? P(H.front, hair, H.opacity ? `opacity="${H.opacity}"` : "") : "") + strands + (H.bunBack ? "" : hairTies(H.ties, hatColor)))));
    } else {
      if (H.shine) scene.add(`<ellipse cx="88" cy="60" rx="11" ry="5" transform="rotate(-25 88 60)" fill="#fff" opacity=".35"/>`);
      scene.add(scene.outlined(circles(H.frontCircles, hair) + (H.front ? P(H.front, hair) : "") + (H.extra ? P(H.extra, hair) : "")));
      // thin hair (buzz cut, mohawk sides) lets the skin show through
      if (H.front && H.opacity) scene.add(P(H.front, look.skinShade, `opacity="${1 - H.opacity}"`));
      if (H.lines) scene.add(S(H.lines.join(" "), look.hairShade, 1.6, 'opacity=".6"'));
      scene.add(strands);
      if (H.hl) scene.add(T(quadPoints(H.hl), "#fff", 3.6, 'opacity=".22"'));
      scene.add(hairTies(H.ties, hatColor));
    }
  }

  // Accessories in front
  scene.add(draw("glasses"));
  if (hat.front) scene.add(scene.outlined(hat.front(hatPaint)));
  if (!ear.body) scene.add(scene.outlined(ear.draw(earPaint)));
}

export const Officers = defineLibrary({
  key: "officers",
  label: "人物",
  idPrefix: "of",
  categories: CATEGORIES,
  groups: GROUPS,
  defaults: DEFAULTS,
  presets: ROLES,
  palettes: PALETTES,
  colorNames: COLOR_NAMES,
  outline: { color: LINE, width: LINE_W },
  resolveColor: resolveTheme,
  compose,
  random: (r) => randomOfficer(r),
  extras: { REGIONS },
});
