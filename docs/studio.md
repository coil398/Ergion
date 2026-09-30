# 調和振動子のStudio

最初の実行可能な実験。1次元の調和振動子をRustで計算し、CLIとWasmから同じ実装を呼び出す。

## 実装構成

| 場所 | 責務 |
| --- | --- |
| `crates/ergion-core` | 一般ODEのRK4、位置依存加速度に対するvelocity-Verlet |
| `crates/ergion-lab` | 調和振動子、設定検証、解析解、観測値、CLI、Wasm公開境界 |
| `studio/src/worker.ts` | Wasmの初期化、バッチ実行、停止要求、実験IDによる結果の識別 |
| `studio/src/main.ts` | 条件入力、操作、設定入出力、実測値の描画 |
| `studio/wasm` | wasm-pack生成物。Git対象外、直接編集禁止 |

運動方程式、解析解、RK4 と velocity-Verlet の一ステップ、テストが見るものは、Studio の画面（`studio/src/main.ts` の学習用の文章）に、走っている計算と並べて書いてある。この文書には繰り返さない。換算単位で扱い、位置・速度・時間・エネルギーは同じ単位系を前提とする。計算はライブラリに置く。画面とCLIは式を計算せず、ライブラリの戻り値を描く。ここには Lennard–Jones、温度、3D 粒子は含まれない。

## 設定JSON

例は[oscillator.json](../examples/oscillator.json)。未知フィールド、欠損、未対応のスキーマ版は拒否する。

| フィールド | 意味・条件 |
| --- | --- |
| `schema_version` | `1` |
| `mass` | 質量。有限の正数、最大1e12 |
| `spring_constant` | ばね定数。有限の正数、最大1e12 |
| `initial_position` | 初期位置。有限値、絶対値最大1e12 |
| `initial_velocity` | 初期速度。有限値、絶対値最大1e12 |
| `dt` | 固定時間刻み。有限の正数、最大1e12 |
| `steps` | 1〜1,000,000の整数 |
| `integrator` | `rk4`または`verlet` |

さらに角振動数 `omega = sqrt(k/m)` と刻みの積が2未満であること、派生する時間・エネルギー・解析解などが有限で表現可能なことをRust側で検証する。これは比較実験用に両手法へ共通の安定性制約を課すもので、精度を保証する刻みではない。精度は解析解や時間刻みを変えた結果から評価する。

## 画面操作

- 計算を開始し、一時停止後は同じ状態から再開できる。
- 1ステップで固定刻み1回分を進める。
- リセットは最後に適用した条件の初期状態へ戻る。
- フォームの変更は計算へ即時反映しない。「条件を適用してリセット」で新規実行に切り替える。
- 設定保存は最後に適用した設定をJSONへ書き出す。編集中の未適用値や途中状態は保存しない。
- 設定読み込みは新規実行になる。ブラウザでは16KB以下のJSONを受け付ける。

時系列と位相図は約2,500点まで表示を間引く。積分自体はすべてのステップを実行し、軸範囲には間引き前の数値解の振幅も反映する。1バッチ最大100ステップでWorkerがイベントループへ戻り、停止要求を処理する。

## 開発・ビルド

Rust 1.91.1、wasm-pack 0.13.1、Node 25.2.1、npm 11.6.2で動作を確認。再現環境にはNode 24系を推奨する。Node 25はPlaywrightの公式サポート系列外のため、正式な対応環境の確定とは区別する。

```bash
rustup target add wasm32-unknown-unknown
npm --prefix studio ci
npm --prefix studio run build
npm --prefix studio run dev
```

wasm-packは別途導入が必要。[公式導入手順](https://wasm-bindgen.github.io/wasm-pack/installer/)を参照する。本番ビルドは `studio/dist/` に生成される。外部サービスへの配備はまだ行っていない。

## 検証

```bash
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build -p ergion-lab --bin ergion
npm --prefix studio run build
npm --prefix studio exec -- playwright install chromium
npm --prefix studio test
```

ブラウザテストはlocalhostの4187番ポートを専用に使う。別サービスが使っていたら停止せず、テスト設定のポートを調整する。空きポートへの接続確認が長時間待機する環境に対応するため、Playwrightの正式な `webServer.wait.stdout` で起動ログを待つ。`--strictPort` によりポート衝突時は明示的に失敗する。既存のChromiumを使う場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE` に実行ファイルの絶対パスを指定できる。

| 確認 | 内容 |
| --- | --- |
| Rust数値テスト | 画面の学習用の文章に書いた収束、エネルギー、ゼロ状態、不正入力、バッチ分割 |
| ブラウザ操作 | 開始、一時停止、再開、1ステップ、リセット、未適用条件と実行条件の分離 |
| Native/Wasm比較 | 両積分法で同一JSONから300ステップ実行し、状態・エネルギー・解析解を比較 |
| 設定入出力 | ダウンロードと読み込み、不正JSON、不正値、完了後の操作、有効な大きい刻みの再編集 |
| 表示 | デスクトップ1440px、モバイル390px、粗い刻みでの軌道の見切れ回帰 |

ブラウザテストは実際の本番Workerを使用する。画面画像は `studio/test-results/` に生成し、Gitには含めない。Chrome for Testing 148で検証し、他ブラウザの対応は未確認。

## 現在の制限

チェックポイント、MD、3D表示、温度、金融、GPU計算は未実装。実行中の状態はページを閉じると失われる。公開APIは初期段階であり、設定スキーマを変更する際は互換性方針も更新する。CIはまだ追加していない。
