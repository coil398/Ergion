//! 一粒子の等速直線運動（$x = x_0 + v t$）の計算と理論。
//!
//! 等速直線運動の理論、計算の手順、引数の決まり、テストで確かめている内容は、
//! すべてこのモジュールと [`UniformSimulation`] の rustdoc に書いてあります。
//! 別の文書を作って内容がずれるのを防ぐため、計算の解説はこのコード自身に置きます。
//!
//! # 1. 理論
//!
//! 最も基礎的な質点の運動は、外力を受けない運動です。1次元上の質点の運動を考えます。
//! Newtonの運動方程式は次のように表されます。
//!
//! $$m x'' = F$$
//!
//! ここで外力 $F = 0$ と置くと、加速度は常にゼロとなります。
//!
//! $$a = x'' = 0$$
//!
//! 加速度がゼロであるため、速度 $v = x'$ は時間によらず一定です。
//! 時刻 $t$ における粒子の位置 $x(t)$ は、初期位置 $x_0$ および速度 $v$ を用いて厳密な解析解として次式で与えられます。
//!
//! $$x(t) = x_0 + v t$$
//!
//! 粒子は時刻の経過とともに一定の割合で直線上を進み、位置と時間の関係は傾き $v$ の直線を描きます。
//!
//! ## 数値積分における1ステップの計算
//!
//! 数値計算では、この2階の微分方程式を2つの1階微分方程式の連立系として定式化します。
//!
//! $$x' = v$$
//! $$v' = 0$$
//!
//! 状態ベクトルを $y = (x, v)^T$ と表すとき、時間微分は $f(y) = (v, 0)^T$ という定数値ベクトルになります。
//!
//! ### 古典的Runge–Kutta法（RK4）
//! RK4では、刻み幅 $\Delta t$ の1ステップにおいて4つの段ベクトル $k_1, k_2, k_3, k_4$ を評価します。
//!
//! - $k_1 = f(x_n, v_n) = (v_n, 0)$
//! - $k_2 = f(x_n + \frac{\Delta t}{2} k_{1,x}, v_n + \frac{\Delta t}{2} k_{1,v}) = (v_n, 0)$
//! - $k_3 = f(x_n + \frac{\Delta t}{2} k_{2,x}, v_n + \frac{\Delta t}{2} k_{2,v}) = (v_n, 0)$
//! - $k_4 = f(x_n + \Delta t k_{3,x}, v_n + \Delta t k_{3,v}) = (v_n, 0)$
//!
//! 各段の位置の変化率は常に $v_n$ であり、速度の変化率は $0$ です。
//! したがって、1ステップ更新後の状態は次のようになります。
//!
//! $$x_{n+1} = x_n + \frac{\Delta t}{6} (k_1 + 2k_2 + 2k_3 + k_4)_x = x_n + \frac{\Delta t}{6} (v_n + 2v_n + 2v_n + v_n) = x_n + v_n \Delta t$$
//! $$v_{n+1} = v_n + 0 = v_n$$
//!
//! 高次の項が自然にゼロとなり、局所打ち切り誤差・大域打ち切り誤差ともに数学的に $0$ となります。
//!
//! ### velocity-Verlet法
//! velocity-Verlet法では、加速度を位置から評価して次の手順で状態を更新します。
//!
//! 1. 半刻みの速度更新: $v_{n+1/2} = v_n + \frac{\Delta t}{2} a(x_n)$
//! 2. 位置の更新: $x_{n+1} = x_n + \Delta t v_{n+1/2}$
//! 3. 新しい位置での加速度の再評価: $a_{n+1} = a(x_{n+1})$
//! 4. 後半刻みの速度更新: $v_{n+1} = v_{n+1/2} + \frac{\Delta t}{2} a_{n+1}$
//!
//! 等速直線運動では外力 $F=0$ より $a(x) = 0$ であるため、
//! $v_{n+1/2} = v_n$ となり、位置の更新は $x_{n+1} = x_n + v_n \Delta t$ となります。
//! 続く後半刻みでも速度は変化せず $v_{n+1} = v_n$ となります。
//!
//! RK4法、velocity-Verlet法のいずれを用いても、等速直線運動の1ステップの更新量は厳密な増分 $v \Delta t$ と一致し、
//! 離散化に伴う打ち切り誤差は生じません。数値計算結果と解析解の差異は、IEEE 754倍精度浮動小数点の丸め誤差のみに制限されます。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// 等速直線運動の計算設定。
///
/// # フィールド（引数）
/// - `schema_version`: スキーマバージョン番号。`1` である必要があります。
/// - `initial_position`: 初期位置 $x_0$。有限値、絶対値最大 $10^{12}$。
/// - `velocity`: 速度 $v$。有限値、絶対値最大 $10^{12}$。
/// - `dt`: 固定時間刻み $\Delta t$。有限な正数、最大 $10^{12}$。
/// - `steps`: 実行ステップ数。$1 \le \text{steps} \le 1{,}000{,}000$ の整数。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct UniformConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub velocity: f64,
    pub dt: f64,
    pub steps: u32,
}

/// 等速直線運動のあるステップにおける観測スナップショット。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct UniformSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub finished: bool,
}

/// バッチ実行時のサンプル列と最新状態。
#[derive(Debug, Serialize, Deserialize)]
pub struct UniformBatch {
    pub samples: Vec<UniformSnapshot>,
    pub state: UniformSnapshot,
}

/// 一粒子の等速直線運動を計算する構造体。
///
/// パソコンの端末（CLI）とブラウザ（Web Worker / Wasm）の両方から、
/// まったく同じ計算コードとして呼び出されます。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct UniformSimulation {
    config: UniformConfig,
    position: f64,
    velocity: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl UniformSimulation {
    /// JSON文字列から等速直線運動シミュレーションを初期化します。
    ///
    /// # 引数
    /// - `config_json`: [`UniformConfig`] に準拠したJSON文字列。
    ///   - `schema_version`: 1
    ///   - `initial_position`: 初期位置 $x_0$
    ///   - `velocity`: 速度 $v$
    ///   - `dt`: 時間刻み $\Delta t$（正の有限数）
    ///   - `steps`: 総ステップ数（1〜1,000,000）
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版不一致、非有限値、非正の刻み幅、ステップ数範囲外、
    /// または終点位置・時刻が数値範囲を超える場合はエラー文字列を返します。
    ///
    /// # テストが検証すること（Tests Verification）
    /// 結合テスト `tests/uniform_motion.rs` では以下を検証しています。
    /// 1. `uniform_motion_matches_exact_solution`:
    ///    - $x_0 = 2.0, v = 3.5, \Delta t = 0.05, \text{steps} = 200$ の実行において、
    ///      最終時刻 $t = 10.0$ での位置 $x$ が厳密解 $x(t) = x_0 + v t = 2.0 + 3.5 \times 10.0 = 37.0$ と
    ///      $10^{-12}$ 未満の浮動小数点許容差で一致することを確認。
    /// 2. `uniform_motion_batches_are_identical`:
    ///    - 100ステップを一度に進めた場合と、10ステップずつ10回に分割して進めた場合で、
    ///      最終的なシミュレーション状態（スナップショット）が完全に一致することを確認。
    /// 3. `rejects_invalid_uniform_configurations`:
    ///    - `schema_version` 不正、`dt <= 0`、`steps == 0` または超過、`1e100` などの非許容値、未知フィールドを含む
    ///      無効な設定JSONを計算開始前にすべて拒否することを確認。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<UniformSimulation, String> {
        let config: UniformConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        if !config.initial_position.is_finite() || config.initial_position.abs() > 1e12 {
            return Err("initial_position must be finite and in [-1e12, 1e12]".into());
        }
        if !config.velocity.is_finite() || config.velocity.abs() > 1e12 {
            return Err("velocity must be finite and in [-1e12, 1e12]".into());
        }
        if !config.dt.is_finite() || config.dt <= 0.0 || config.dt > 1e12 {
            return Err("dt must be finite and in (0, 1e12]".into());
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        let final_time = config.dt * f64::from(config.steps);
        let final_position = config.initial_position + config.velocity * final_time;
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        Ok(Self {
            position: config.initial_position,
            velocity: config.velocity,
            config,
            step: 0,
        })
    }

    /// 現在のシミュレーション状態をJSONスナップショットとして返します。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state()).map_err(|e| e.to_string())
    }

    /// 指定したステップ数分シミュレーションを進めます。
    ///
    /// # 引数
    /// - `steps`: 1バッチで進めるステップ数（1〜500）。
    ///
    /// # 計算
    /// 加速度が 0 なので、速度は変わらず、位置の1ステップは [`ergion_core::x_prime_eq_v_step`] です。
    /// この更新は厳密解 \(x = x_0 + v t\) の増分と一致し、打ち切り誤差はありません。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            ergion_core::x_prime_eq_v_step(
                std::slice::from_mut(&mut self.position),
                std::slice::from_ref(&self.velocity),
                self.config.dt,
            );
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&UniformBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }
}

impl UniformSimulation {
    fn state(&self) -> UniformSnapshot {
        let time = f64::from(self.step) * self.config.dt;
        let exact_position = self.config.initial_position + self.config.velocity * time;
        let exact_velocity = self.config.velocity;
        UniformSnapshot {
            step: self.step,
            time,
            position: self.position,
            velocity: self.velocity,
            exact_position,
            exact_velocity,
            finished: self.step == self.config.steps,
        }
    }
}
