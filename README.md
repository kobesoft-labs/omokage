# omokage

**面影 ― パーツを組み合わせて作る SVG アバター**

人物・妖怪・どうぶつ・ゲームキャラの 4 つの絵柄から、パーツを組み合わせてアバターを作ります。
名前から毎回同じ顔が決まるので、登録直後のユーザーにもすぐにアバターが付きます。選び直したい人には、候補から選んで細かくカスタマイズできるピッカーをそのまま出せます。

社内ポータルのプロフィール、チャットやコメント欄のアイコン、ゲストの仮アイコンなど、ご自由にどうぞ。

**デモ:** https://kobesoft-labs.github.io/omokage/ ・ [組み込みデモ](https://kobesoft-labs.github.io/omokage/demo/) ・ [API リファレンス](docs/api.md)

> *English:* Part-based SVG avatars for the web in four styles (office people, Japanese yokai, plush animals, chibi RPG adventurers), with a ready-made picker dialog. Seeded generation, theme colors, no dependencies, one `<script>`. BSD-3-Clause.

---

## いちばん簡単な使い方

```html
<span data-omokage="animals" data-seed="tanaka" style="display:inline-block;width:48px;height:48px"></span>
<script src="https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.min.js"></script>
```

これだけで、`tanaka` さんのどうぶつアバターが表示されます。同じ seed なら、いつ・どこで表示しても同じ顔です。

| 属性 | 内容 |
|---|---|
| `data-omokage` | 絵柄。`officers`（人物）・`yokai`（妖怪）・`animals`（どうぶつ）・`game`（ゲーム） |
| `data-seed` | 顔を決める文字列（ユーザー ID など）。省略すると要素の中の文字 |
| `data-config` | 保存したアバターの設定（JSON）。seed より優先 |
| `data-hue` | 会社のテーマ色（0〜359）。人物の服や背景がこの色になります |

## ピッカーで選んでもらう

```html
<script src="https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.min.js"></script>
<script>
  // 保存するのは { style, config } の小さな JSON だけ
  let saved = loadFromServer();          // 例: { style: "yokai", config: { body: "kasa", ... } }

  document.querySelector("#change-avatar").onclick = async () => {
    const avatar = await Omokage.openPicker({ value: saved, seed: user.id, hue: 215 });
    if (!avatar) return;                 // キャンセル
    saved = { style: avatar.style, config: avatar.config };
    saveToServer(saved);
    Omokage.mount(document.querySelector("#avatar"), saved);
  };
</script>
```

ピッカーは「候補から選ぶ → 必要ならカスタマイズ → 決定」の 2 ステップです。

- 開いている間、ダイアログの大きさは変わりません（タブ・ステップ・候補の切り替えで縦横がガタつかない）
- 選んでもスクロール位置は動かず、背景のページもずれません
- キーボードだけで操作できます（Tab・矢印・Enter・Esc）
- 編集中に閉じようとすると、その場で確認します
- Shadow DOM の中に描くので、サイトの CSS と干渉しません。スマホでは全画面になります

## 独自の UI を作る

画面は自前で作りたい場合は、UI を持たない層だけを使えます。組み込みのピッカーも、この層の上に作られています。

| 層 | 関数 | 役割 |
|---|---|---|
| カタログ | `catalog(style)` | 選べるもの（カテゴリ・パーツ・色の候補・まとめ方）を素の JSON で返す |
| エディタ | `createEditor(options)` | 選択・色・おまかせ・元に戻す・undo/redo・候補・プレビューと、その状態。変更は `subscribe()` で通知 |
| 検証 | `validate(avatar)` / `normalize(avatar)` | 外から来た値を検査・修正する。保存前に必ず通す |

```js
import { createEditor, validate } from "https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.esm.js";

const editor = createEditor({ value: saved, styles: ["officers", "animals"], seed: user.id });
editor.subscribe(render);                 // 変更のたびに描き直す

function render() {
  const C = editor.catalog();             // groups / categories / parts / colors（ただの JSON）
  preview.innerHTML = editor.preview();
  // C.categories[i].parts を並べ、タイルには editor.thumbnail(cat, part.id) の SVG を使う
}
partButton.onclick = () => editor.select("hair", "bob");
swatch.onclick = () => editor.setColor("hairColor", "#a9523b");
saveButton.onclick = () => save(editor.value());   // { style, config }（初期値との差分だけ）
```

動く例: [demo/custom.html](https://kobesoft-labs.github.io/omokage/demo/custom.html)（ピッカーとは違う、横並びのレイアウトを 100 行ほどで作っています）

**サーバー側で検証するとき**は、[`dist/catalog.json`](dist/catalog.json) に全絵柄の選択肢と検証用スキーマ（キーごとに「パーツ ID の一覧」か「色: `#rrggbb` か許されたトークン」）が入っているので、JavaScript 以外の言語でも同じ検査ができます。

## ES モジュールで

```js
import { render, random, openPicker } from "https://cdn.jsdelivr.net/gh/kobesoft-labs/omokage@0/dist/omokage.esm.js";

const avatar = random("tanaka", { style: "game" });   // { style: "game", config: {...} }
document.querySelector("#me").innerHTML = render(avatar);
```

SVG 文字列が返るので、`innerHTML` に入れても、`toDataURI()` で `<img src>` にしても、サーバー側（Node.js）で生成して保存しても構いません。

---

## 絵柄

| KEY | 名前 | 内容 | パーツ |
|---|---|---|---|
| `officers` | 人物 | 会社で働く人たち。スーツ・パーカー・社員証。会社のテーマ色で服の色がそろう | 髪型 27・目 14・服 25・帽子 19 ほか 178 |
| `yokai` | 妖怪 | 鬼・河童・からかさ・ちょうちん…。和色と青海波などの和柄 | からだ 8・目 11・頭 13・持ち物 9 ほか 74 |
| `animals` | どうぶつ | ぬいぐるみのような胸像。ねこ・しばいぬ・パンダ・ペンギン… | 耳 12・はな 10・もよう 10・けがわ 7 ほか 92 |
| `game` | ゲーム | RPG の冒険者のちびキャラ。勇者・騎士・魔法使い・忍者・魔王… | そうび 12・ぶき 11・あたま 14 ほか 79 |

どの絵柄も、仕上げの決まりごとは同じです。

- 輪郭線は外形だけに入れ、パーツが重なる内側には線を出さない
- 眉・口・閉じ目などの線は「入り抜き」（中央が太く、両端がとがる）
- 光は左上から。影は黒ではなく深い紫に寄せて、どの配色でもまとまるように
- パーツはそれぞれ描ける範囲が決まっていて、はみ出さない（人物は `tools/audit.html` で全パーツを自動検査）

## 絵柄を増やす

`defineLibrary()` に、パーツの定義と重ね順（`compose`）を渡すだけで、新しい絵柄がピッカーや `random()` でそのまま使えます。詳しくは [API リファレンス](docs/api.md#絵柄を作る)。

```js
import { defineLibrary, registerStyle, draw } from "omokage";

const Cats = registerStyle(defineLibrary({
  key: "cats", label: "ねこ",
  parts: { ears: [{ id: "pointy", label: "とんがり", draw: (x) => draw.P("M60 70 L66 30 L92 56Z", x.a) }] },
  categories: [{ key: "ears", label: "みみ", colors: [{ key: "earsColor", label: "色", palette: ["#f2a65a", "#3a3438"] }] }],
  groups: [{ label: "かお", cats: ["ears"] }],
  defaults: { ears: "pointy", earsColor: "#f2a65a", bgColor: "#fff4e0" },
  compose(scene) { scene.add(scene.outlined(scene.part("ears").draw({ a: scene.color("earsColor") }))); },
  random: (r) => ({ earsColor: r.pick(["#f2a65a", "#3a3438"]) }),
}));
```

## 開発

```sh
npm install
npm run serve     # http://localhost:8480 （キャッシュなしの開発サーバー）
npm run build     # dist/ を作る
npm run check     # 全パーツの描画・random() の再現性・dist の API を検査
```

| パス | 内容 |
|---|---|
| `src/core/` | 色・描画の道具・乱数・`defineLibrary()` |
| `src/registry.js` | 絵柄の登録 |
| `src/styles/` | 4 つの絵柄（人物は `officers/` に分割） |
| `src/model/` | カタログ・エディタ・検証（UI を持たない層） |
| `src/picker/` | ピッカー（model の上に作った UI） |
| `tools/audit.html` | 人物の全パーツが範囲からはみ出さないかの自動検査 |
| `tools/check.html` | 帽子×髪型・服×首まわりなどの組み合わせ表 |

## ライセンス

BSD-3-Clause © 神戸ソフト株式会社 (Kobesoft Co., Ltd.)
