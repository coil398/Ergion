---
name: ergion-japanese
description: Writing rules for every Ergion page, rustdoc, doc, and explanation in Japanese. Trigger whenever writing Japanese for this project.
---

# Ergion 日本語の記述規則

Ergion のすべてのWebページ、rustdoc、ドキュメント、および説明を書くときは、この規則に従います。

## 1. 学生が声に出して読める自然な日本語を使う

難解な言い回しや堅苦しい漢語を避け、学生が声に出してすらすら読める日常的で明瞭な日本語で書きます。

- **不自然な例**: 質点の1次元的等速直線運動の相空間軌道における解析解と数値積分の合致を検証する。
- **書き換え例**: 直線上を一定の速さで進む粒子の運動を計算し、手計算の解とぴったり一致することを確かめます。

## 2. すべてのページで日本語フォントを指定する

ラテン文字専用フォントに日本語の描画を任せてはいけません。Noto Sans JP などの適切な日本語フォントを必ず明示して適用します。

- **不適切な例**: `font-family: Georgia, serif;` や `font-family: sans-serif;` のみで日本語を表示する。
- **適切な例**: Google Fonts などから `Noto Sans JP` を読み込み、`font-family: "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;` を指定する。

## 3. 「正本」「source of truth」「計算核」と書かない

ファイル名や関数名を具体的に指します。

- **書かない言葉**: 正本、source of truth、計算核
- **代わりに書く例**:
  - 「式の解説の正本は〜」 → 「式の解説は `crates/ergion-lab/src/uniform.rs` の `UniformSimulation` の rustdoc に置きます」
  - 「同一の計算核を呼び出す」 → 「同じRustの計算関数 `UniformSimulation` を呼び出す」
  - 「正本の所在」 → 「計算と説明がある場所」

## 4. 「実験台」「乖離」「集約」などの書類言葉を使わない

日常会話で使わない書類言葉を避け、平易な文で書きます。

- **書かない言葉**: 実験台、乖離、集約
- **代わりに書く例**:
  - 「視覚的に確かめるための実験台です」 → 「画面で粒子の動きを見ながら確かめます」
  - 「記述の乖離を防ぐため」 → 「文章を二重に持って内容がずれるのを防ぐため」
  - 「解説はすべて本ドキュメントに集約します」 → 「解説はすべてこのドキュメントにまとめます」

## 5. 数式はそれを計算する関数の rustdoc に置き、二重に文章を持たない

数式や更新の理屈、テストで検証している内容は、実際にその計算を行う関数の rustdoc に、この規則と同じ自然な日本語で書きます。
Webページは粒子の動きを示し、その関数の言葉を使います。内容がずれてしまうような、二重の解説記事を別ファイルに抱え込まないようにします。
