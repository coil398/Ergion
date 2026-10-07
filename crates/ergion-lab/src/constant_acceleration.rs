//! 一粒子の等加速度直線運動の計算と理論。
//!
//! 加速度 \(a\) が一定のとき、速度と位置の厳密解、velocity-Verlet 法の1ステップ、
//! 引数の決まり、テストで確かめている内容は、このモジュールと
//! [`ConstantAccelerationSimulation`] の rustdoc に書いてあります。
//!
//! # 量と記号
//!
//! - \(t\): 時刻。初期時刻は \(0\)。
//! - \(x(t)\): 時刻 \(t\) の位置。初期位置は \(x_0 = x(0)\)。
//! - \(v(t)\): 時刻 \(t\) の速度。初期速度は \(v_0 = v(0)\)。速度は位置の時間微分 \(v = x'\) です。
//! - \(a\): 加速度。加速度は速度の時間微分 \(a = v' = x''\) であり、この運動では時刻にも位置にもよらず一定です。
//! - \(\Delta t\): 数値計算の固定した時間刻み。
//!
//! # 一定の加速度から厳密解まで
//!
//! 加速度が一定なので \(v' = a\) です。両辺を時刻 \(0\) から \(t\) まで積分します。
//!
//! \[
//! v(t) - v(0) = a t
//! \]
//!
//! 初期速度 \(v(0) = v_0\) を使うと、速度の厳密解は次の一次式です。
//!
//! \[
//! v(t) = v_0 + a t
//! \]
//!
//! 速度は位置の時間微分なので \(x' = v_0 + a t\) です。もう一度、時刻 \(0\) から \(t\) まで積分します。
//!
//! \[
//! x(t) - x(0) = v_0 t + \frac{1}{2} a t^2
//! \]
//!
//! 初期位置 \(x(0) = x_0\) を使うと、位置の厳密解は次の二次式です。
//!
//! \[
//! x(t) = x_0 + v_0 t + \frac{1}{2} a t^2
//! \]
//!
//! # 数値ステップは、この多項式では厳密解と一致する
//!
//! 位置 \(x(t)\) は時刻の二次式、速度 \(v(t)\) は時刻の一次式です。加速度 \(a\) が一定なので、
//! 位置の三階導関数は \(x''' = 0\) であり、それより高い導関数もゼロです。
//!
//! 計算は [`ergion_core::velocity_verlet_step`] を呼び、加速度の値として常に同じ \(a\) を渡します。
//! 時刻 \(t_n\) の状態を \(x_n\)、\(v_n\) と書くと、1ステップの更新は次のとおりです。
//!
//! 1. 半ステップの速度: \(v_{n+1/2} = v_n + \dfrac{\Delta t}{2} a\)
//! 2. 位置: \(x_{n+1} = x_n + \Delta t\, v_{n+1/2} = x_n + v_n \Delta t + \dfrac{1}{2} a (\Delta t)^2\)
//! 3. 加速度は位置によらず \(a\) のままです。
//! 4. 残りの半ステップの速度: \(v_{n+1} = v_{n+1/2} + \dfrac{\Delta t}{2} a = v_n + a \Delta t\)
//!
//! これは、厳密解を \(t_n\) から \(t_n + \Delta t\) まで進めた増分そのものです。
//! したがって、この二次式と一次式に対して、数値ステップに打ち切り誤差はありません。
//! 計算機上の差は、IEEE 754 倍精度浮動小数点の丸めだけです。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// 等加速度直線運動の計算設定。
///
/// # フィールド（引数）
/// - `schema_version`: スキーマバージョン番号。`1` である必要があります。
/// - `initial_position`: 初期位置 \(x_0\)。有限値、絶対値最大 \(10^{12}\)。
/// - `initial_velocity`: 初期速度 \(v_0\)。有限値、絶対値最大 \(10^{12}\)。
/// - `acceleration`: 一定の加速度 \(a\)。有限値、絶対値最大 \(10^{12}\)。
/// - `dt`: 固定時間刻み \(\Delta t\)。有限な正数、最大 \(10^{12}\)。
/// - `steps`: 実行ステップ数。\(1 \le \text{steps} \le 1{,}000{,}000\) の整数。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ConstantAccelerationConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub initial_velocity: f64,
    pub acceleration: f64,
    pub dt: f64,
    pub steps: u32,
}

/// 等加速度直線運動のあるステップにおける観測スナップショット。
///
/// `position` と `velocity` は数値ステップの結果です。
/// `exact_position` と `exact_velocity` は、同じ時刻における厳密解
/// \(x(t) = x_0 + v_0 t + \frac{1}{2} a t^2\) と \(v(t) = v_0 + a t\) です。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ConstantAccelerationSnapshot {
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
pub struct ConstantAccelerationBatch {
    pub samples: Vec<ConstantAccelerationSnapshot>,
    pub state: ConstantAccelerationSnapshot,
}

/// 一粒子の等加速度直線運動を計算する構造体。
///
/// パソコンの端末（CLI）とブラウザ（Web Worker / Wasm）の両方から、
/// 同じ計算コードとして呼び出されます。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct ConstantAccelerationSimulation {
    config: ConstantAccelerationConfig,
    position: f64,
    velocity: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl ConstantAccelerationSimulation {
    /// JSON文字列から等加速度直線運動のシミュレーションを初期化します。
    ///
    /// # 引数
    /// - `config_json`: [`ConstantAccelerationConfig`] に準拠したJSON文字列。
    ///   - `schema_version`: 1
    ///   - `initial_position`: 初期位置 \(x_0\)
    ///   - `initial_velocity`: 初期速度 \(v_0\)
    ///   - `acceleration`: 一定の加速度 \(a\)
    ///   - `dt`: 時間刻み \(\Delta t\)（正の有限数）
    ///   - `steps`: 総ステップ数（1〜1,000,000）
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版不一致、非有限値、非正の刻み幅、ステップ数範囲外、
    /// または終端の時刻・位置・速度が数値範囲を超える場合はエラー文字列を返します。
    ///
    /// # テストが検証すること
    /// 結合テスト `tests/constant_acceleration.rs` では以下を検証しています。
    /// 1. `constant_acceleration_matches_exact_polynomial`:
    ///    \(x_0 = 1\)、\(v_0 = 2\)、\(a = 0.5\)、\(\Delta t = 0.25\)、\(\text{steps} = 8\) のとき、
    ///    終端時刻 \(t = 2\) で速度は \(v(t) = v_0 + a t = 3\)、
    ///    位置は \(x(t) = x_0 + v_0 t + \frac{1}{2} a t^2 = 6\) と、
    ///    \(10^{-12}\) 未満で一致すること。
    /// 2. `zero_acceleration_matches_uniform_motion`:
    ///    \(a = 0\) のとき、位置が \(x_0 + v_0 t\)、速度が \(v_0\) のままであること。
    /// 3. `constant_acceleration_batches_are_identical`:
    ///    同じ条件を一度に進めても、分割して進めても、最終状態が一致すること。
    /// 4. `rejects_invalid_constant_acceleration_configurations`:
    ///    スキーマ版、刻み幅、ステップ数、非有限に大きい値、未知フィールドを拒否すること。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<ConstantAccelerationSimulation, String> {
        let config: ConstantAccelerationConfig =
            serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        for (name, value) in [
            ("initial_position", config.initial_position),
            ("initial_velocity", config.initial_velocity),
            ("acceleration", config.acceleration),
        ] {
            if !value.is_finite() || value.abs() > 1e12 {
                return Err(format!("{name} must be finite and in [-1e12, 1e12]"));
            }
        }
        if !config.dt.is_finite() || config.dt <= 0.0 || config.dt > 1e12 {
            return Err("dt must be finite and in (0, 1e12]".into());
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        let final_time = config.dt * f64::from(config.steps);
        let final_velocity = config.initial_velocity + config.acceleration * final_time;
        let final_position = config.initial_position
            + config.initial_velocity * final_time
            + 0.5 * config.acceleration * final_time * final_time;
        if !final_time.is_finite() || !final_velocity.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        Ok(Self {
            position: config.initial_position,
            velocity: config.initial_velocity,
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
    /// 1ステップごとに加速度 \(a\) を一定として [`ergion_core::velocity_verlet_step`] を呼び出します。
    /// その中の位置の更新は、半ステップの速度に対する [`ergion_core::x_prime_eq_v_step`] です。
    /// 位置が時刻の二次式であるこの運動では、1ステップの更新は厳密解の増分と一致します。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            let acceleration = self.config.acceleration;
            ergion_core::velocity_verlet_step(
                std::slice::from_mut(&mut self.position),
                std::slice::from_mut(&mut self.velocity),
                self.config.dt,
                move |_position, out| {
                    out[0] = acceleration;
                },
            );
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&ConstantAccelerationBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }
}

impl ConstantAccelerationSimulation {
    fn state(&self) -> ConstantAccelerationSnapshot {
        let time = f64::from(self.step) * self.config.dt;
        let exact_velocity = self.config.initial_velocity + self.config.acceleration * time;
        let exact_position = self.config.initial_position
            + self.config.initial_velocity * time
            + 0.5 * self.config.acceleration * time * time;
        ConstantAccelerationSnapshot {
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
