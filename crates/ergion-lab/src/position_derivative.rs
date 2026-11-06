//! 位置の時間微分 \(x' = v\) を、速度が一定の1ステップとして計算する。
//!
//! 1ステップの更新そのものは [`ergion_core::x_prime_eq_v_step`] が行う。
//! ここでは初期値、時間刻み、ステップ数を受け取り、その関数を繰り返す。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// 位置の時間微分を進めるための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `initial_position`: 初期位置 \(x_0\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `velocity`: この刻みのあいだ一定とみなす速度 \(v\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `dt`: 時間刻み \(\Delta t\)。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: ステップ数。\(1\) 以上 \(1{,}000{,}000\) 以下。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct PositionDerivativeConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub velocity: f64,
    pub dt: f64,
    pub steps: u32,
}

/// あるステップの位置と速度。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct PositionDerivativeSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub finished: bool,
}

/// まとめて進めたときのサンプルと、その時点の状態。
#[derive(Debug, Serialize, Deserialize)]
pub struct PositionDerivativeBatch {
    pub samples: Vec<PositionDerivativeSnapshot>,
    pub state: PositionDerivativeSnapshot,
}

/// 速度を一定にして、\(x' = v\) をステップごとに進める。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct PositionDerivativeSimulation {
    config: PositionDerivativeConfig,
    position: f64,
    velocity: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl PositionDerivativeSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、有限でない値、正でない時間刻み、
    /// 範囲外のステップ数、または終点が有限でなくなる条件は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<PositionDerivativeSimulation, String> {
        let config: PositionDerivativeConfig =
            serde_json::from_str(config_json).map_err(|e| e.to_string())?;
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

    /// 現在の状態を JSON で返します。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state()).map_err(|e| e.to_string())
    }

    /// 指定したステップ数だけ進めます。1回の呼び出しは 1 から 500 ステップまでです。
    ///
    /// 各ステップは [`ergion_core::x_prime_eq_v_step`] だけを呼びます。
    /// 速度は変えません。速度が一定なので、各ステップは厳密です。
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
        serde_json::to_string(&PositionDerivativeBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }

    /// 終了時刻を延ばす。初期条件と、いまの位置・速度・ステップは変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        let steps = crate::additional_steps(self.config.steps, additional_steps)?;
        let final_time = self.config.dt * f64::from(steps);
        let final_position = self.config.initial_position + self.config.velocity * final_time;
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        self.config.steps = steps;
        self.snapshot()
    }
}

impl PositionDerivativeSimulation {
    fn state(&self) -> PositionDerivativeSnapshot {
        let time = f64::from(self.step) * self.config.dt;
        PositionDerivativeSnapshot {
            step: self.step,
            time,
            position: self.position,
            velocity: self.velocity,
            exact_position: self.config.initial_position + self.config.velocity * time,
            exact_velocity: self.config.velocity,
            finished: self.step == self.config.steps,
        }
    }
}
