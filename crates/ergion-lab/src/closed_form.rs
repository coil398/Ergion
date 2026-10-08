//! 変数分離と定数係数の1階線形方程式の厳密解を、標本の時刻で評価する。
//!
//! 位置そのものは [`ergion_core::separated_exponential`] と [`ergion_core::first_order_linear`] が返す。
//! ここでは初期値と標本の時刻を受け取り、その関数を呼ぶ。時間刻みで傾きを足し上げない。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// 変数分離 \(x' = kx\) を評価するための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `initial_position`: 初期位置 \(x_0\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `k`: 定数係数。有限値で、絶対値は \(10^{12}\) 以下。
/// - `dt`: 標本の時間間隔。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: 標本の個数。\(1\) 以上 \(1{,}000{,}000\) 以下。時刻は \(0, \Delta t, \ldots\) です。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct SeparationConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub k: f64,
    pub dt: f64,
    pub steps: u32,
}

/// 1階線形方程式 \(x' + px = q\) を評価するための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `initial_position`: 初期位置 \(x_0\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `p`: 未知関数の係数。0 でなく、有限値で、絶対値は \(10^{12}\) 以下。
/// - `q`: 右辺の定数。有限値で、絶対値は \(10^{12}\) 以下。
/// - `dt`: 標本の時間間隔。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: 標本の個数。\(1\) 以上 \(1{,}000{,}000\) 以下。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct LinearConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub p: f64,
    pub q: f64,
    pub dt: f64,
    pub steps: u32,
}

/// ある標本時刻の位置。速度は、その位置を方程式の右辺へ入れた値です。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ClosedFormSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub finished: bool,
}

/// まとめて評価した標本と、その時点の状態。
#[derive(Debug, Serialize, Deserialize)]
pub struct ClosedFormBatch {
    pub samples: Vec<ClosedFormSnapshot>,
    pub state: ClosedFormSnapshot,
}

fn bounded(name: &str, value: f64) -> Result<(), String> {
    if !value.is_finite() || value.abs() > 1e12 {
        return Err(format!("{name} must be finite and in [-1e12, 1e12]"));
    }
    Ok(())
}

fn schedule(schema_version: u32, dt: f64, steps: u32) -> Result<(), String> {
    if schema_version != 1 {
        return Err("schema_version must be 1".into());
    }
    if !dt.is_finite() || dt <= 0.0 || dt > 1e12 {
        return Err("dt must be finite and in (0, 1e12]".into());
    }
    if !(1..=1_000_000).contains(&steps) {
        return Err("steps must be in 1..=1000000".into());
    }
    Ok(())
}

fn advance_samples(
    step: &mut u32,
    steps: u32,
    count: u32,
    state: impl Fn(u32) -> ClosedFormSnapshot,
) -> Result<String, String> {
    if !(1..=500).contains(&count) {
        return Err("batch steps must be in 1..=500".into());
    }
    let take = count.min(steps.saturating_sub(*step));
    let mut samples = Vec::with_capacity(take as usize);
    for _ in 0..take {
        *step += 1;
        samples.push(state(*step));
    }
    let state = state(*step);
    serde_json::to_string(&ClosedFormBatch { samples, state }).map_err(|e| e.to_string())
}

/// \(x' = kx\) の厳密解を、標本の時刻で評価する。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct SeparationSimulation {
    config: SeparationConfig,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl SeparationSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、有限でない値、正でない時間間隔、
    /// 範囲外の標本数、または終点の厳密解が有限でなくなる条件は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<SeparationSimulation, String> {
        let config: SeparationConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        schedule(config.schema_version, config.dt, config.steps)?;
        bounded("initial_position", config.initial_position)?;
        bounded("k", config.k)?;
        let final_time = config.dt * f64::from(config.steps);
        let final_position =
            ergion_core::separated_exponential(config.initial_position, config.k, final_time);
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        Ok(Self { config, step: 0 })
    }

    /// 現在の状態を JSON で返します。位置は [`ergion_core::separated_exponential`] の値です。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state(self.step)).map_err(|e| e.to_string())
    }

    /// 指定した個数だけ標本を進めます。1回の呼び出しは 1 から 500 個までです。
    ///
    /// 各標本は [`ergion_core::separated_exponential`] だけを呼びます。
    /// 数値の1ステップではありません。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        let config = self.config.clone();
        let step = &mut self.step;
        advance_samples(step, config.steps, steps, |step| Self::at(&config, step))
    }

    /// 終了時刻を延ばす。初期条件と、いまのステップは変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        let steps = crate::additional_steps(self.config.steps, additional_steps)?;
        let final_time = self.config.dt * f64::from(steps);
        let final_position =
            ergion_core::separated_exponential(self.config.initial_position, self.config.k, final_time);
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        self.config.steps = steps;
        self.snapshot()
    }
}

impl SeparationSimulation {
    fn at(config: &SeparationConfig, step: u32) -> ClosedFormSnapshot {
        let time = f64::from(step) * config.dt;
        let position = ergion_core::separated_exponential(config.initial_position, config.k, time);
        let velocity = config.k * position;
        ClosedFormSnapshot {
            step,
            time,
            position,
            velocity,
            exact_position: position,
            exact_velocity: velocity,
            finished: step == config.steps,
        }
    }

    fn state(&self, step: u32) -> ClosedFormSnapshot {
        Self::at(&self.config, step)
    }
}

/// \(x' + px = q\) の厳密解を、標本の時刻で評価する。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct LinearSimulation {
    config: LinearConfig,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl LinearSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、\(p = 0\)、有限でない値、正でない時間間隔、
    /// 範囲外の標本数、または終点の厳密解が有限でなくなる条件は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<LinearSimulation, String> {
        let config: LinearConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        schedule(config.schema_version, config.dt, config.steps)?;
        bounded("initial_position", config.initial_position)?;
        bounded("p", config.p)?;
        bounded("q", config.q)?;
        if config.p == 0.0 {
            return Err("p must be nonzero".into());
        }
        let final_time = config.dt * f64::from(config.steps);
        let final_position = ergion_core::first_order_linear(
            config.initial_position,
            config.p,
            config.q,
            final_time,
        );
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        Ok(Self { config, step: 0 })
    }

    /// 現在の状態を JSON で返します。位置は [`ergion_core::first_order_linear`] の値です。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state(self.step)).map_err(|e| e.to_string())
    }

    /// 指定した個数だけ標本を進めます。1回の呼び出しは 1 から 500 個までです。
    ///
    /// 各標本は [`ergion_core::first_order_linear`] だけを呼びます。
    /// 数値の1ステップではありません。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        let config = self.config.clone();
        let step = &mut self.step;
        advance_samples(step, config.steps, steps, |step| Self::at(&config, step))
    }

    /// 終了時刻を延ばす。初期条件と、いまのステップは変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        let steps = crate::additional_steps(self.config.steps, additional_steps)?;
        let final_time = self.config.dt * f64::from(steps);
        let final_position = ergion_core::first_order_linear(
            self.config.initial_position,
            self.config.p,
            self.config.q,
            final_time,
        );
        if !final_time.is_finite() || !final_position.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        self.config.steps = steps;
        self.snapshot()
    }
}

impl LinearSimulation {
    fn at(config: &LinearConfig, step: u32) -> ClosedFormSnapshot {
        let time = f64::from(step) * config.dt;
        let position =
            ergion_core::first_order_linear(config.initial_position, config.p, config.q, time);
        let velocity = config.q - config.p * position;
        ClosedFormSnapshot {
            step,
            time,
            position,
            velocity,
            exact_position: position,
            exact_velocity: velocity,
            finished: step == config.steps,
        }
    }

    fn state(&self, step: u32) -> ClosedFormSnapshot {
        Self::at(&self.config, step)
    }
}
