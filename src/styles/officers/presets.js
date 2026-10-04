// Job presets and seeded random generation.
import { PALETTES } from "./palette.js";

export function randomOfficer(r) {
  const { pick, chance } = r;
  const masc = chance(.5);
  const hair = masc ? pick(["side","side","slick","crop","crop","pomp","curtain","wavy","buzz","spiky","topknot","sides","curly","afro","none"])
                    : pick(["bob","bobBang","medium","long","longSide","longWavy","hime","pony","bun","pixie","twinBuns","braid","curly","afro","twintails"]);
  const natural = ["#2b2429","#2b2429","#2b2429","#4b3428","#4b3428","#7c4e30","#a0663a","#dcae63","#b9b5bb","#a9523b","#8c8a96"];
  const gray = hair === "sides" || hair === "none";
  const formal = chance(.45);
  const tops = formal ? ["suit","suit","threePiece","blazerShirt","shirtTie","officeVest","bowBlouse"] : ["blazer","shirt","polo","hoodie","zipHoodie","tshirt","logoTee","vneck","stripe","turtle","sweater","cardigan","blouse","workwear","denim","apron","labcoat"];
  const items = PALETTES.item;
  return {
    skin: pick(PALETTES.skin),
    hair, hairColor: gray ? "#b9b5bb" : chance(.08) ? pick(PALETTES.hair.slice(11)) : pick(natural),
    eyes: pick(["normal","normal","normal","small","happy","lash","calm","big","almond","wink","sleepy"]),
    eyesColor: pick(PALETTES.eyes),
    brows: pick(["normal","normal","thick","thin","flat","raised","arched","worried"]),
    nose: pick(["soft","soft","button","nostrils","line","round"]),
    mouth: masc ? pick(["smile","smile","grin","open","teeth","neutral","smirk","laugh"]) : pick(["smile","smile","grin","open","teeth","laugh","lips","lipsSmile","cat"]),
    mouthColor: pick(PALETTES.lips),
    beard: masc && chance(.3) ? pick(["stubble","mustache","chevron","goatee","beard","chin","sideburns"]) : "none",
    face: ["blush", ...(chance(.15) ? ["freckles"] : []), ...(chance(.12) ? ["mole"] : []), ...(gray ? ["crow", "smile"] : [])],
    glasses: chance(.3) ? pick(["round","square","rect","bold","browline","cat","oval","roundBig"]) : "none",
    glassesColor: pick(["#2b2233","#2b2233","#8c8a96","#a6714a","#c9a227","#3a8fd9","#d94a4a"]),
    hat: chance(.12) ? pick(["beret","cap","beanie","bucket","fedora","headband","alice","ribbon","flower","newsboy"]) : "none",
    hatColor: pick(items), hatColor2: pick(items),
    ear: chance(.08) ? pick(["headphones","headset","earbuds","pencil","neckphones"]) : "none",
    earColor: pick(items), earColor2: "#2b2233",
    earrings: !masc && chance(.4) ? pick(["stud","hoop","drop","pearl","long"]) : "none",
    earringsColor: pick(["#c9a227","#c9a227","#d8d8de","#ffffff","theme-accent"]),
    top: pick(tops),
    topColor: pick(["theme","theme-dark","theme-light","theme","theme-dark", ...items.slice(4)]),
    topColor2: pick(["#ffffff","theme-accent","theme-light", ...items.slice(4)]),
    neck: chance(.3) ? pick(["lanyard","lanyard","necklace","scarf","pearls","pendant"]) : "none",
    neckColor: pick(items), neckColor2: pick(items),
    chest: formal && chance(.4) ? pick(["pin","pin","nameTag","pen","pocketSq"]) : chance(.1) ? pick(["badge","flower","nameTag"]) : "none",
    chestColor: pick(["#c9a227", ...items]), chestColor2: "#ffffff",
  };
}

export const ROLES = [
  { label: "Webデザイナー", skin: "#fbdcc8", hair: "bobBang", hairColor: "#4b3428", top: "turtle", topColor: "theme-dark", eyes: "lash", mouth: "smile", glasses: "round", hat: "beret", hatColor: "theme-accent" },
  { label: "営業",          skin: "#f3c9a8", hair: "side", top: "suit", eyes: "happy", mouth: "grin", chest: "pin" },
  { label: "エンジニア",    skin: "#e9b48e", hair: "crop", hairColor: "#7c4e30", top: "hoodie", topColor: "theme", topColor2: "#ffffff", eyes: "normal", mouth: "neutral", glasses: "square", ear: "headphones" },
  { label: "社長",          skin: "#f3c9a8", hair: "sides", hairColor: "#b9b5bb", top: "threePiece", topColor: "#3a3f4b", topColor2: "#8e2b3a", eyes: "calm", mouth: "smile", glasses: "browline", beard: "mustache", face: ["blush", "crow", "smile"], chest: "pocketSq", chestColor: "#ffffff" },
  { label: "人事",          skin: "#fbdcc8", hair: "long", hairColor: "#7c4e30", top: "cardigan", topColor: "theme-light", topColor2: "#ffffff", eyes: "happy", mouth: "smile", neck: "lanyard" },
  { label: "マーケター",    skin: "#e9b48e", hair: "bun", hairColor: "#a9523b", top: "blazer", topColor: "theme", topColor2: "#ffffff", eyes: "lash", mouth: "lipsSmile", earrings: "hoop" },
  { label: "PM",            skin: "#c48659", hair: "pomp", hairColor: "#4b3428", top: "shirt", topColor: "theme-light", eyes: "normal", mouth: "smile", beard: "stubble", neck: "lanyard" },
  { label: "新人",          skin: "#fbdcc8", hair: "side", top: "suit", topColor: "#2f3a52", eyes: "big", mouth: "open", brows: "raised", face: ["blush", "sweat"] },
  { label: "経理",          skin: "#f3c9a8", hair: "pony", top: "officeVest", topColor: "theme-dark", topColor2: "theme-accent", eyes: "calm", mouth: "smile", glasses: "rect" },
  { label: "UIデザイナー",  skin: "#83563a", hair: "curly", top: "logoTee", topColor: "theme-accent", topColor2: "#ffffff", eyes: "happy", mouth: "grin", earrings: "stud" },
  { label: "サポート",      skin: "#f3c9a8", hair: "longSide", hairColor: "#dcae63", top: "bowBlouse", topColor: "theme-light", topColor2: "theme", eyes: "happy", mouth: "smile", ear: "headset" },
  { label: "CTO",           skin: "#62402b", hair: "crop", hairColor: "#4b3428", top: "blazer", topColor: "#3a3f4b", topColor2: "#ffffff", eyes: "calm", mouth: "smile", glasses: "round", beard: "beard" },
  { label: "広報",          skin: "#fde4d3", hair: "pixie", hairColor: "#8c8a96", top: "blouse", topColor: "theme-accent", topColor2: "#ffffff", eyes: "sparkle", mouth: "lips", earrings: "drop", neck: "necklace", neckColor: "#c9a227", neckColor2: "#ffffff" },
  { label: "総務",          skin: "#e9b48e", hair: "slick", hairColor: "#b9b5bb", top: "shirtTie", topColor: "#ffffff", topColor2: "theme", eyes: "calm", mouth: "smile", glasses: "oval", face: ["blush", "crow"], chest: "pen" },
  { label: "現場監督",      skin: "#c48659", hair: "buzz", top: "workwear", topColor: "theme", topColor2: "#ffffff", eyes: "normal", brows: "thick", mouth: "grin", hat: "hardhat", hatColor: "#f2c94c", hatColor2: "theme" },
  { label: "シェフ",        skin: "#f3c9a8", hair: "side", top: "chefCoat", topColor: "#ffffff", topColor2: "#2b2233", eyes: "happy", mouth: "grin", beard: "handlebar", hat: "chef", hatColor: "#ffffff" },
  { label: "研究員",        skin: "#fbdcc8", hair: "bob", hairColor: "#2b2429", top: "labcoat", topColor: "theme-light", topColor2: "theme", eyes: "normal", mouth: "neutral", glasses: "roundBig" },
  { label: "カフェ店員",    skin: "#d99e76", hair: "twinBuns", hairColor: "#4b3428", top: "apron", topColor: "#ffffff", topColor2: "theme-dark", eyes: "wink", mouth: "grin", face: ["blush", "freckles"] },
  { label: "受付",          skin: "#fbdcc8", hair: "bun", hairColor: "#2b2429", top: "officeVest", topColor: "theme", topColor2: "theme-accent", eyes: "lash", mouth: "lipsSmile", earrings: "pearl", earringsColor: "#ffffff", neck: "none" },
  { label: "インターン",    skin: "#f3c9a8", hair: "wavy", hairColor: "#7c4e30", top: "stripe", topColor: "#ffffff", topColor2: "theme", eyes: "big", mouth: "teeth", ear: "earbuds", earColor: "#ffffff", neck: "lanyard" },
  { label: "顧問",          skin: "#d99e76", hair: "none", top: "kimono", topColor: "theme-dark", topColor2: "#f4f1f6", eyes: "closed", mouth: "smile", beard: "longBeard", face: ["blush", "crow", "forehead"], glasses: "monocle", glassesColor: "#c9a227" },
  { label: "海外支社",      skin: "#a26b45", hair: "none", hat: "hijab", hatColor: "theme", top: "blazer", topColor: "theme-dark", topColor2: "#ffffff", eyes: "lash", mouth: "smile" },
  { label: "情シス",        skin: "#fbdcc8", hair: "curtain", hairColor: "#2b2429", top: "zipHoodie", topColor: "#3a3f4b", topColor2: "#ffffff", eyes: "tired", mouth: "neutral", glasses: "bold", face: ["eyebags"], ear: "pencil", earColor: "#f2c94c" },
  { label: "医務室",        skin: "#f3c9a8", hair: "medium", hairColor: "#4b3428", top: "labcoat", topColor: "#dbeafe", topColor2: "#dbeafe", eyes: "happy", mouth: "smile", neck: "stetho", neckColor: "#3a3f4b", neckColor2: "#d8d8de" },
];
