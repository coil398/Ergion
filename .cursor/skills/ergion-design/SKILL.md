---
name: ergion-design
description: Design system and visual rules for Ergion. Trigger whenever someone changes Ergion layout, color, type, a page, a canvas figure, or a graph.
---

# Ergion デザイン規則

Ergion のレイアウト、色、タイポグラフィ、ページ構造、Canvas 図、グラフを変更・追加するときは、必ずこの規則と `DESIGN.md` に従います。

## 1. DESIGN.md と 日本語規則（ergion-japanese）に従う

- 画面の見た目、カラーパレット、余白、コンポーネント構造、Canvas 2D による図やグラフの描画規則は、すべて `/workspace/DESIGN.md` に従います。
- 日本語の文章、説明文、ラベルの書き方は `.cursor/skills/ergion-japanese/SKILL.md` に従います。
- 日本語フォントには `Noto Sans JP` を必ず明示して適用します。
- 「正本」「source of truth」「計算核」という表現は使わず、具体的なファイル名や関数名を指します。

## 2. 読んでも意味のない見出しを禁止する

声に出して読んだときに何を表しているか分からない、抽象的・文学的な見出しを付けてはいけません。グラフや図が表す物理量や内容を、そのまま平易な日本語で名付けます。

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
- 数式記号（Georgia / Serif体）、等幅フォントによる計器表示（monospace / tabular-nums）、実線（数値解：`#6552b8`）と破線（解析解：`#167b87`）の対比を大切に維持します。

## 4. チャートライブラリを追加しない

- 外部のグラフライブラリ（Chart.js, D3 等）は導入せず、TypeScript と Canvas 2D コンテキストを使って描画します。
- 軸、グリッド線、目盛り数値、数値解（紫の実線）と手計算の解（青緑の破線）の対比を `DESIGN.md` のトークンと規則に沿って実装します。
