---
name: ergion-design
description: Design system and visual rules for Ergion. Trigger whenever someone changes Ergion layout, color, type, a page, a canvas figure, a graph, or the figure library in studio/src/figures.
---

# Ergion デザイン規則

Ergion のレイアウト、色、タイポグラフィ、ページ構造、Canvas 図、グラフを変更・追加するときは、必ずこの規則と `DESIGN.md` に従います。

## 1. DESIGN.md と 日本語規則（ergion-japanese）に従う

- 画面の見た目、カラーパレット、余白、コンポーネント構造、Canvas 2D による図やグラフの描画規則は、すべて `/workspace/DESIGN.md` に従います。
- レイアウトを変えるときは、`DESIGN.md` の「ページの構成」に従います。本文は、式、解法の手順、図、数を代入した例、証明の順です。証明はページの最後の領域です。数値解法の切り替えは、同じ節にある一つの横並びのタブです。運動の再生は、同じ文書の実行操作にある再生、一時停止、ループ再生、計算時間を延ばすに従います。コードは、その実行操作の下にある開閉です。ニュートン法では近似の図の下です。名前はコードです。開閉は、ページをまたぐ一つの localStorage のキーに保存します。
- 日本語の文章、説明文、ラベルの書き方は `.cursor/skills/ergion-japanese/SKILL.md` に従います。
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
- ページの数式は TeX を KaTeX で描く。図の中の記号は Georgia。等幅フォントによる計器表示（monospace / tabular-nums）、実線（数値解：`#003153`）と破線（解析解：`#167b87`）の対比を大切に維持します。本文は 16px、数式と解法の手順は 18px。表示する式の地は `#e8dfd0`。新しい色は作らない。
- 文書には、あるべき状態だけを書きます。そこに至る経緯は書きません。

## 4. 図は studio/src/figures/ に置き、チャートパッケージを入れない

- 軸、動く粒子、\(vt\) として伸びる線分、ラベル、時系列グラフは `studio/src/figures/` が描く。公開モジュールは `canvas`、`axes`、`particle`、`segment`、`labels`、`series`、`motion`。
- ページや `studio/src/main.ts` に、図を描く第二の実装を持たない。`CanvasRenderingContext2D` のパスをページに書かない。
- Chart.js、D3、その他の第三者チャートパッケージを依存関係に加えない。描画は TypeScript と Canvas 2D だけ。
- 色は `DESIGN.md` のパレットを使う。新しいパレットを作らない。
- 数値は Rust の `UniformSimulation` が Wasm で返した値を描く。TypeScript で式 \(x = x_0 + v t\) を計算し直さない。
- 等速直線運動の図は、粒子の移動と、伸びる変位 \(vt\) で \(x = x_0 + v t\) を説明する。数値解は青の実線、解析解は青緑の破線。一度に見せるアイデアは一つ。
