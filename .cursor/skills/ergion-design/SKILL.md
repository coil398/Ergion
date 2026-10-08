---
name: ergion-design
description: Design system and visual rules for Ergion. Trigger whenever someone changes Ergion layout, color, type, a page, a canvas figure, a graph, or the figure library in studio/src/figures.
---

# Ergion デザイン規則

Ergion のレイアウト、色、タイポグラフィ、ページ構造、Canvas 図、グラフを変更・追加するときは、必ずこの規則と `DESIGN.md` に従います。

## 1. DESIGN.md と 日本語規則（ergion-japanese）に従う

- 画面の見た目、カラーパレット、余白、コンポーネント構造、Canvas 2D による図やグラフの描画規則は、すべて `/workspace/DESIGN.md` に従います。
- レイアウトを変えるときは、`DESIGN.md` の「ページの構成」に従います。本文は、式、解法の手順、図、数を代入した例、証明の順です。証明はページの最後の領域です。数値解法の切り替えは、同じ節にある一つの横並びのタブです。運動の再生は、同じ文書の実行操作にある再生、一時停止、ループ再生、+t に従います。コードは、その実行操作の下にある開閉です。実行を押しているあいだ、そのボタンの横にプルシアンブルーの回転を示します。数値解法のタブがある微分方程式のページでは、数値解の図の下です。ニュートン法では近似の図の下です。表示する関数は、選ばれているタブの関数です。名前はコードです。開閉は、ページをまたぐ一つの localStorage のキーに保存します。
- 日本語の文章、説明文、ラベルの書き方は `.cursor/skills/ergion-japanese/SKILL.md` に従います。
- ページを書くときは `.cursor/skills/ergion-implement/SKILL.md`、完成と呼ぶ前の確認は `.cursor/skills/ergion-review/SKILL.md` に従います。関連ページはリンクだけです。
- 日本語フォントには `Noto Sans JP` を必ず明示して適用します。
- 「正本」「source of truth」「計算核」という表現は使わず、具体的なファイル名や関数名を指します。

## 2. 読んでも意味のない見出しを禁止する

声に出して読んだときに何を表しているか分からない、抽象的・文学的な見出しを付けてはいけません。グラフや図が表す物理量や内容を、そのまま教科書らしい明確な日本語で名付けます。

- **禁止される見出しの例**:
  - × 「軌道を読む」
  - × 「粒子の旅路」
  - × 「数値の鼓動」
  - × 「計算の深淵」
- **適切な見出しの例**:
  - ◯ 「位置の時間変化」
  - ◯ 「速度の時間変化」
  - ◯ 「位置と速度の位相図」
  - ◯ 「粒子の直線運動」

## 3. 研究室の実験ノートのような佇まいを守る

- 「少し学術的で、ほんのり野暮ったい道具（academic and slightly dorky）」という風情を崩してはいけません。
- 一般的なSaaSのようなグラデーションや、丸みの強すぎる過剰にモダンなUIに均してはいけません。
- ページの数式は TeX を KaTeX で描く。図の中の記号は Georgia。等幅フォントによる計器表示（monospace / tabular-nums）、実線（数値解：`--color-primary`）と破線（解析解：`--color-analytical`）の対比を大切に維持します。本文は 16px、数式と解法の手順は 18px。表示する式の地は `--color-primary-tint`。新しい色は作らない。
- 配色は明るい配色と暗い配色の二つで、トークンは一組です。明るい配色は地 `#f4efe6`、文字 `#1c1915`、数値解 `#003153`、厳密解 `#167b87`、誤差 `#a86240`、式の地 `#e8dfd0`。暗い配色は温かいインクの地で、地 `#1c1915`、文字 `#f4efe6`、数値解 `#9ec3dd`、厳密解 `#6ec8d2`、誤差 `#e3a88a`、式の地 `#2c2824`。青みの灰色にはしない。ページは `ergion-theme` がないとき `prefers-color-scheme` に従う。ヘッダーの配色のボタンはアイコンだけで、明るいページは月、暗いページは太陽を示し、画面に文字は出さない。押した配色は、どのページも同じ localStorage のキー `ergion-theme` に `light` か `dark` で置く。図、KaTeX、式の地も同じトークンで描き、暗いページに紙色のグラフを残さない。
- 文書には、あるべき状態だけを書きます。そこに至る経緯は書きません。

## 4. 図は studio/src/figures/ に置き、チャートパッケージを入れない

- 軸、動く粒子、\(vt\) として伸びる線分、ラベル、時系列グラフは `studio/src/figures/` が描く。公開モジュールは `canvas`、`axes`、`particle`、`segment`、`labels`、`series`、`motion`。
- ページや `studio/src/main.ts` に、図を描く第二の実装を持たない。`CanvasRenderingContext2D` のパスをページに書かない。
- Chart.js、D3、その他の第三者チャートパッケージを依存関係に加えない。描画は TypeScript と Canvas 2D だけ。
- 色は `DESIGN.md` のパレットを使う。新しいパレットを作らない。図の中に色の値を書かず、`studio/src/figures/canvas.ts` の `figurePalette()` が返すトークンの値で描く。
- 数値は Rust の `UniformSimulation` が Wasm で返した値を描く。TypeScript で式 \(x = x_0 + v t\) を計算し直さない。
- 等速直線運動の図は、粒子の移動と、伸びる変位 \(vt\) で \(x = x_0 + v t\) を説明する。数値解は青の実線、解析解は青緑の破線。一度に見せるアイデアは一つ。
