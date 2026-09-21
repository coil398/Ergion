# Ergion

Ergion（エルジオン）は、再利用可能なRust数値コアを持ち、ブラウザとNative CLIから同じ条件で計算できる科学計算環境を目指すプロジェクトです。

最初の完成単位は、検証済みの小さな分子動力学（MD）環境です。微分方程式ソルバの整備だけで終わらせず、条件入力、計算、可視化、保存・再開までをつなぎます。その直後に金融計算を加え、共通コアとしての再利用性を確かめます。

## 現在の状態

最初の実験として、調和振動子をRustのRK4／velocity-Verletで計算するStudioとNative CLIを実装しています。ブラウザではWorker内のWasmで計算し、位置・速度・エネルギーと解析解との差を確認できます。

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
cargo run -p ergion-lab --bin ergion -- examples/oscillator.json
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

- `f64`の計算核、一般ODE用RK4、力学系用velocity-Verlet。
- 3D・周期境界・NVE・force-shifted Lennard–Jonesによる小規模MD。
- 同じ設定を受け取るNative CLIとRust/Wasm。計算状態の保存・再開。
- 粒子の3D表示、温度・全エネルギーの推移、条件変更、停止・再開。
- 力とエネルギー勾配、積分精度、時間刻み依存、再開の一致を検証。

金融、電子状態、近接リスト、CPU並列化、WebGPU計算はv0.1の対象外です。

## ドキュメント

| 文書 | 内容 |
| --- | --- |
| [Studioの使い方](docs/studio.md) | 設定仕様、実行方法、テスト、現在の制限 |
| [設計](docs/architecture.md) | モジュール境界、数値モデル、実行・保存の方針 |
| [開発ロードマップ](docs/roadmap.md) | v0.1の作業順序と後続段階 |
| [検証計画](docs/validation.md) | 数値精度・再現性・画面の受入条件 |
| [開発ガイド](CONTRIBUTING.md) | 文書・実装の進め方と未決事項 |

リポジトリ: [coil398/Ergion](https://github.com/coil398/Ergion)

## ライセンス

未決定です。ライセンス決定時に、この節とLICENSEを更新します。
