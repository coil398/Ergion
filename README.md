# Ergion

Ergion（エルジオン）は計算の基盤であり、学習の基盤でもある。再利用可能なRust数値コアを持ち、ブラウザとNative CLIから同じ条件で計算できる。

現在の学習単元は一粒子の等速直線運動（$x = x_0 + v t$）である。単純な場合から始め、より難しいモデルへは飛ばない。式と更新は Studio の画面に、走っている計算と並べて書いてある。ばねや Lennard–Jones、等加速度運動への拡張は今の段階では行わない。既存の調和振動子のコードは保持するが紹介ページにはしない。

後続の完成像は、検証済みの小さな分子動力学環境として、条件入力、計算、可視化、保存・再開までをつなぐことである。金融計算はその後に置く。今の単位ではそこへ進まない。

## 現在の状態

最初の実験として、一粒子の等速直線運動をRustで計算するStudioとNative CLIを実装しています。式、一ステップ、テストが見るものは画面の学習用の文章を正とし、ここでは繰り返さない。ブラウザではWorker内のWasmで計算し、位置・速度と解析解との差を確認できます（既存の調和振動子のコードもライブラリ・CLIとして保持されています）。

設定変更、開始・一時停止・再開、1ステップ実行、リセット、JSON設定の保存・読み込みに対応しています。v0.1全体は開発中です。LJ粒子系、3D MD、温度、チェックポイントによる途中状態の保存・再開は未実装です。

## 起動する

Rust 1.91.1以上、Node.js 24系、npm、wasm-packが必要です。wasm-pack 0.13.1で動作確認しています。最初にWasmターゲットを用意します。

```bash
rustup target add wasm32-unknown-unknown
npm --prefix studio ci
npm --prefix studio run build
npm --prefix studio run dev
```

表示されたローカルURLをブラウザで開きます。Rustを変更したら `npm --prefix studio run wasm` で再生成してください。Wasm生成物は手動編集しません。

CLIは同じJSON設定を読み、最終状態を標準出力へ返します。Studioから保存した設定ファイルも指定できます。

```bash
cargo run -p ergion-lab --bin ergion -- examples/uniform_motion.json
```

[設定の仕様・検証手順](docs/studio.md)を参照してください。

## 製品構成

| モジュール | 責務 | 導入時期 |
| --- | --- | --- |
| Core | 時間積分と、必要に応じて追加する線形代数・乱数・統計・最適化・収束判定 | v0.1から |
| Dynamics | MDと、将来の確率的な粒子運動 | v0.1から |
| Quant | 金融モデルと価格評価 | 最小MD完成の直後 |
| Electronic | 電子状態計算 | 後続段階 |
| Studio | ブラウザ上の設定・実行・可視化 | v0.1から |

## v0.1の目標

一粒子の等速直線運動（$x = x_0 + v t$）は現在の単位である。調和振動子コードは保持されており、3D の Lennard–Jones 以降は後続であり、今は着手しない。

- `f64`の計算核、一般ODE用RK4、力学系用velocity-Verlet。
- 3D・周期境界・NVE・force-shifted Lennard–Jonesによる小規模MD。
- 同じ設定を受け取るNative CLIとRust/Wasm。計算状態の保存・再開。
- 粒子の3D表示、温度・全エネルギーの推移、条件変更、停止・再開。
- 力とエネルギー勾配、積分精度、時間刻み依存、再開の一致を検証。

金融、電子状態、近接リスト、CPU並列化、WebGPU計算はv0.1の対象外です。

## ドキュメント

| 文書 | 内容 |
| --- | --- |
| [Studioの使い方](docs/studio.md) | 設定仕様、実行方法、テスト。式と更新は画面 |
| [設計](docs/architecture.md) | モジュール境界、数値モデル、実行・保存の方針 |
| [開発ロードマップ](docs/roadmap.md) | v0.1の作業順序と後続段階 |
| [検証計画](docs/validation.md) | 数値精度・再現性・画面の受入条件 |
| [開発ガイド](CONTRIBUTING.md) | 文書・実装の進め方と未決事項 |

リポジトリ: [coil398/Ergion](https://github.com/coil398/Ergion)

## ライセンス

未決定です。ライセンス決定時に、この節とLICENSEを更新します。
