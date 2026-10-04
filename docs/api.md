# omokage API リファレンス

- [読み込み方](#読み込み方)
- [アバターの値](#アバターの値)
- [関数](#関数) — `render` / `random` / `openPicker` / `mount` / `mountAll` / `presets` / `toDataURI` / `listStyles` / `getStyle` / `registerStyle`
- [HTML 属性](#html-属性)
- [絵柄オブジェクト](#絵柄オブジェクト)
- [config の中身](#config-の中身)
- [絵柄を作る](#絵柄を作る)

## 読み込み方

| 形式 | URL / import | 使い方 |
|---|---|---|
| `<script>` | `https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.min.js` | グローバル `Omokage`。`[data-omokage]` 要素を自動で描画 |
| ES モジュール | `https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.esm.js` | `import { render } from "…"` |
| ソースから | `src/index.js` | バンドラーで使うとき（tree shaking 可） |

`@0` は 0.x の最新版です。本番では `@0.1.0` のようにバージョンを固定することをおすすめします。

## アバターの値

アバターは次の小さな JSON で表します。保存するのはこれだけで、表示のたびに `render()` で SVG にします。

```js
{ style: "yokai", config: { body: "kasa", bodyColor: "#9b88c9", eyes: "hitotsume" } }
```

- `style` … 絵柄の KEY（`officers` / `yokai` / `animals` / `game`、または自作の絵柄）
- `config` … パーツと色の選択。書いていない項目は絵柄の初期値になります。ピッカーが返す `config` は初期値との差分だけなので小さく保てます

## 関数

### `render(avatar, options?) → string`

アバターを SVG 文字列にします。`viewBox` は `0 0 200 200` で、幅・高さは持たないので、置いた場所の大きさに合わせて伸縮します。

| options | 型 | 内容 |
|---|---|---|
| `hue` | number | 会社のテーマ色（0〜359）。人物の `theme` 系の色がこの色相から決まります。初期値 215 |
| `viewBox` | string | 切り出す範囲。例: 顔だけ `"56 58 88 88"` |

```js
el.innerHTML = Omokage.render({ style: "officers", config: { hair: "bob", top: "hoodie" } }, { hue: 30 });
```

### `random(seed, { style }?) → avatar`

seed から決まるアバターを返します。同じ seed と style なら、いつでも同じ結果です。`style` の初期値は `"officers"`。

```js
Omokage.random("user-1234", { style: "animals" });
// → { style: "animals", config: { head: "mochi", ears: "pin", ... } }
```

### `openPicker(options?) → Promise<{ style, config, svg } | null>`

アバターを選ぶダイアログを開きます。決定すると `{ style, config, svg }`、キャンセル（× ボタン・Esc）すると `null` が返ります。

| options | 型 | 内容 |
|---|---|---|
| `value` | avatar | いまのアバター。候補の先頭に「いまのアバター」として出ます |
| `styles` | (string \| 絵柄)[] | 選べる絵柄。初期値はすべて。1 つだけならタブは出ません |
| `seed` | string | 候補を決める文字列（ユーザー ID など）。同じ seed なら同じ候補が並びます |
| `hue` | number | 会社のテーマ色 |
| `title` | string | ダイアログの見出し（初期値「アバターを選ぶ」） |
| `text` | object | 画面の文言の上書き（`lead` / `use` / `done` など。英語化などに） |

```js
const avatar = await Omokage.openPicker({ value: saved, styles: ["officers", "animals"], seed: user.id });
if (avatar) save({ style: avatar.style, config: avatar.config });
```

### `mount(element, avatar, options?) → element`

要素の中にアバターを描きます（SVG は要素いっぱいに広がります）。`options` は `render()` と同じ。

### `mountAll(root?) → number`

`root`（初期値は document）の中の `[data-omokage]` 要素をすべて描き、描いた数を返します。`<script>` 版では読み込み時に自動で呼ばれます。あとから要素を足したときに呼んでください。

### `presets(style) → { label, avatar }[]`

その絵柄に用意されたキャラクター（人物なら「営業」「エンジニア」…）を返します。ギャラリーや初期値の候補に。

### `toDataURI(svg) → string`

SVG 文字列を `data:image/svg+xml,...` にします。`<img src>` や CSS の背景に使えます。

```js
img.src = Omokage.toDataURI(Omokage.render(avatar));
```

### `listStyles()` / `getStyle(key)` / `registerStyle(style)`

登録済みの絵柄の一覧、KEY から絵柄を取得、自作の絵柄の登録。`getStyle` は知らない KEY だとエラーになります。

### `VERSION`

ライブラリのバージョン文字列。

## HTML 属性

`<script>` 版では、次の属性を持つ要素が自動で描かれます。

```html
<span data-omokage="game" data-seed="tanaka" style="display:inline-block;width:64px;height:64px"></span>
<span data-omokage="yokai" data-config='{"body":"kasa","eyes":"hitotsume"}'></span>
<span data-omokage="officers" data-hue="30">sato</span>   <!-- 中の文字が seed になる -->
```

| 属性 | 内容 |
|---|---|
| `data-omokage` | 絵柄の KEY |
| `data-seed` | seed。省略すると要素の中の文字 |
| `data-config` | config の JSON。seed より優先 |
| `data-hue` | テーマ色 |

## 絵柄オブジェクト

`Omokage.Officers` / `Yokai` / `Animals` / `Game`、または `getStyle(key)` で取れるオブジェクトです。パーツの一覧を自前の UI に出したいときなどに使います。

| プロパティ | 内容 |
|---|---|
| `KEY` / `LABEL` | 識別子と表示名 |
| `CATEGORIES` | カテゴリ `{ key, label, colors?, multi?, view? }` の配列。`colors` は色の枠 `{ key, label, palette }`、`multi` は複数選べる、`view` はサムネイルの切り出し範囲 |
| `GROUPS` | ピッカーでのまとめ方 `{ label, cats }` |
| `PARTS` | カテゴリごとのパーツ `{ id, label, ... }` |
| `DEFAULTS` | config の初期値 |
| `PALETTES` | パレット |
| `PRESETS` | 用意されたキャラクター `{ label, ...config }` |
| `render(config, options)` | config から SVG（`Omokage.render` の絵柄固定版） |
| `random(seed)` | seed から config |
| `resolve(color, hue)` | 色の値（`"theme"` や `"auto"` を含む）を `#rrggbb` に |
| `colorName(color)` | 色の表示名（「朱」「藍」など） |

## config の中身

項目は絵柄ごとに違います。パーツの項目はカテゴリの KEY、色の項目はそのカテゴリの色の枠の KEY（多くは `<カテゴリ>Color` と `<カテゴリ>Color2`）です。

```js
Omokage.getStyle("game").CATEGORIES.map((c) => [c.key, c.colors?.map((s) => s.key)]);
// → [["skin", ["skin"]], ["hair", ["hairColor"]], ["eyes", ["eyesColor"]], ..., ["weapon", ["weaponColor", "weaponColor2"]], ...]
```

色の値は `#rrggbb` のほか、次も使えます。

| 値 | 意味 |
|---|---|
| `"auto"` | パーツごとのおすすめ色（河童の皿なら緑、きつね耳ならからだの色…） |
| `"theme"` / `"theme-dark"` / `"theme-light"` / `"theme-bg"` / `"theme-accent"` | 人物のみ。`hue` から決まる会社のテーマ色 |

## 絵柄を作る

`defineLibrary(spec)` で絵柄を定義し、`registerStyle()` で登録すると、`render` / `random` / `openPicker` / `[data-omokage]` でそのまま使えます。

```js
import { defineLibrary, registerStyle, draw, color } from "omokage";
const { P, both } = draw;

const Cats = registerStyle(defineLibrary({
  key: "cats",
  label: "ねこ",
  parts: {
    ears: [
      { id: "pointy", label: "とんがり", draw: (x) => both(P("M52 82 L56 36 L92 58Z", x.a)) },
      { id: "fold",   label: "おりみみ", draw: (x) => both(P("M56 70 Q60 52 84 58 Q72 64 66 76Z", x.a)) },
    ],
  },
  categories: [
    { key: "ears", label: "みみ", colors: [{ key: "earsColor", label: "けの色", palette: ["#f2a65a", "#3a3438", "#f3f0e8"] }] },
    { key: "bg", label: "はいけい", colors: [{ key: "bgColor", label: "はいけい", palette: ["#fff4e0", "#dfe8f3"] }] },
  ],
  groups: [{ label: "かお", cats: ["ears"] }, { label: "はいけい", cats: ["bg"] }],
  defaults: { ears: "pointy", earsColor: "#f2a65a", bgColor: "#fff4e0" },
  presets: [{ label: "みけ", earsColor: "#f2a65a" }],
  outline: { color: "#33263a", width: 4 },
  compose(scene) {
    const fur = scene.color("earsColor");
    scene.add(scene.outlined(scene.part("ears").draw({ a: fur })));
    scene.add(scene.outlined(P("M100 50 C140 50 160 80 160 110 C160 150 130 170 100 170 C70 170 40 150 40 110 C40 80 60 50 100 50Z", fur)));
  },
  random: (r) => ({ ears: r.pick(["pointy", "fold"]), earsColor: r.pick(["#f2a65a", "#3a3438", "#f3f0e8"]) }),
}));
```

### spec

| 項目 | 内容 |
|---|---|
| `key` / `label` | 識別子と表示名 |
| `parts` | `{ カテゴリ: パーツ[] }`（各カテゴリに `parts` を持たせても可） |
| `categories` / `groups` / `defaults` / `presets` / `palettes` | 上の「絵柄オブジェクト」と同じ形 |
| `colorNames` | `{ "#rrggbb": "表示名" }` |
| `outline` | 輪郭線の `{ color, width }`（見える太さは width の半分） |
| `compose(scene)` | 重ね順に描く関数（下記） |
| `random(r)` | seed から config を作る関数。`r()` は 0〜1、`r.pick(list)`、`r.chance(p)` |
| `resolveColor(value, { hue })` | 独自の色トークンを `#rrggbb` に（人物のテーマ色など） |
| `autoColor(token, scene)` | パーツの `auto` に書いたトークン（`"body"` など）を色に |

### scene（compose が受け取るもの）

| メソッド | 内容 |
|---|---|
| `scene.config` / `scene.options` | 初期値を補った config と、render の options |
| `scene.part(cat)` | 選ばれているパーツ |
| `scene.selected(cat)` | 複数選べるカテゴリで選ばれているパーツの配列 |
| `scene.color(key, auto?)` | config の色を `#rrggbb` で。`"auto"` のときは `auto` を使う |
| `scene.slots(cat)` | そのカテゴリの `{ a, b }`（`<cat>Color` と `<cat>Color2`。`auto` はパーツの `auto` から） |
| `scene.add(...svg)` | 描く（後に足したものが上） |
| `scene.outlined(svg)` | 外形だけに輪郭線を付けて返す |
| `scene.silhouette(svg)` | 輪郭線だけ（本体は別に描くとき） |
| `scene.clip(name, paths)` / `scene.clipped(url, svg)` | クリップパスを作る / その中に描く |
| `scene.define(svg)` | `<defs>` に足す（グラデーションなど） |
| `scene.uid(name)` | この 1 枚の中で一意な id |

### draw（描画の道具）

200×200 のキャンバスに、x = 100 を軸に描く前提の短い関数です。

| 関数 | 内容 |
|---|---|
| `P(d, fill, attrs?)` | 塗りのパス |
| `S(d, stroke, width?, attrs?)` | 線のパス（端と角は丸） |
| `T([x0,y0,cx,cy,x1,y1], fill, t, attrs?)` | 入り抜きの線（中央の太さ t、両端がとがる） |
| `C` / `E` | 円 / 楕円 |
| `M(svg)` / `both(svg)` | 左右反転 / 元の形と反転した形の両方 |
| `wave(cx, cy, rx, ry, a0, a1, n, bump, dir?)` | 楕円に沿った波形（巻き毛・たてがみ・もこもこ） |
| `blushGradient(id, color?, alpha?)` | ふわっと消えるほっぺのグラデーション |

`color` には `mix` / `shade`（深い紫に寄せた影）/ `lighten` / `luminance` / `hsl` があります。
