# Ergion

Ergion（エルジオン）は計算の基盤であり、学習の基盤でもある。再利用可能なRust数値コアを持ち、ブラウザとNative CLIから同じ条件で計算できる。

画面にいまあるページは、力学、微分方程式、数値計算の三つの節です。力学には位置の時間微分（$x' = v$）、等速直線運動（$x = x_0 + v t$）、等加速度直線運動（$x(t) = x_0 + v_0 t + \frac{1}{2} a t^2$、$v(t) = v_0 + a t$）を置いてあります。微分方程式には、式 $x' = f(x, t)$、右辺が未知関数によらないときの積分、変数分離（$x' = kx$）、定数係数の1階線形方程式（$x' + px = q$）、同次形、完全微分、ベルヌーイ、定数係数の2階同次、未定係数法、定数変化法、Laplace 変換、べき級数、連立1階を置いてあります。数値計算には、Euler 法、中点法、古典的な4次の Runge–Kutta 法、ニュートン法（$f(x) = x^2 - 2$ の正の根）を置いてあります。ニュートン法は微分方程式を進めるタブには入れません。運動のページと、解のある微分方程式のページでは、その方程式を進める数値解法だけをタブで切り替えます。Ergion 全体を力学の教科書とは呼びません。既存の調和振動子のコードは保持しますが、紹介するページにはしません。

式の解説は、等速直線運動では `crates/ergion-lab/src/uniform.rs` の `UniformSimulation`、等加速度直線運動では `crates/ergion-lab/src/constant_acceleration.rs` の `ConstantAccelerationSimulation` の rustdoc に書いてあります。画面は、その手順と動く粒子を示します。GitHub Pages（https://coil398.github.io/Ergion/）で公開され、Cursorローカル環境でも閲覧できます。

## 現在の状態

画面にいまあるページは、力学、微分方程式、数値計算の三つの節です。等速直線運動は `crates/ergion-lab/src/uniform.rs` の `UniformSimulation`、等加速度直線運動は `crates/ergion-lab/src/constant_acceleration.rs` の `ConstantAccelerationSimulation` が計算します。変数分離の厳密解は `ergion-core` の `separated_exponential`、1階線形方程式の厳密解は `first_order_linear` です。同次形は `homogeneous_ratio`、完全微分は `exact_quadratic`、ベルヌーイは `bernoulli_logistic`、2階の三つの例は `characteristic_two_real`、`characteristic_repeated`、`characteristic_complex`、未定係数法は `undetermined_coefficient`、定数変化法は `variation_of_parameters`、Laplace 変換は `laplace_ivp`、べき級数の和は `power_series_cosine`、連立は `linear_system_x` と `linear_system_y` です。数値解法の1ステップは `ergion-core` の `euler_step`、`midpoint_step`、`rk4_step` です。各方程式の数値解は、この三つのいずれかでその方程式を進め、同じ時刻の厳密解との差を返します。ニュートン法の1回の更新は `newton_step` です。ページは $f(x) = x^2 - 2$ を $x_0 = 1$ から繰り返し、正の根 $\sqrt{2}$ との差を返します。式、1ステップの計算、テストが確かめている内容は、それぞれの rustdoc に書いてあります。ブラウザでは Worker 内の Wasm で同じ関数を呼び出し、位置と速度を描きます。GitHub Pages（https://coil398.github.io/Ergion/）に公開されています。

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

- `f64`の計算基盤、一般ODE用RK4、力学系用velocity-Verlet。
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
