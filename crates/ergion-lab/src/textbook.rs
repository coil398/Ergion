//! 学部の標準的な解法で得た厳密解を、標本の時刻で評価する。
//!
//! 位置そのものは `ergion-core` の閉じた式が返す。時間刻みで傾きを足し上げない。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

use crate::{ClosedFormBatch, ClosedFormSnapshot};

/// どの厳密解を評価するか。
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum TextbookKind {
    Homogeneous,
    Exact,
    Bernoulli,
    TwoReal,
    Undetermined,
    Variation,
    Laplace,
    Series,
    System,
}

/// 厳密解を標本の時刻で評価するための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `kind`: 評価する厳密解。
/// - `t0`: 最初の時刻。有限値です。解法ごとの定義域に入っている必要があります。
/// - `dt`: 標本の時間間隔。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: 標本の個数。\(1\) 以上 \(1{,}000{,}000\) 以下。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct TextbookConfig {
    pub schema_version: u32,
    pub kind: TextbookKind,
    pub t0: f64,
    pub dt: f64,
    pub steps: u32,
}

fn evaluate(kind: TextbookKind, time: f64) -> (f64, f64) {
    match kind {
        TextbookKind::Homogeneous => {
            let position = ergion_core::homogeneous_ratio(0.0, time);
            (position, 1.0 + position / time)
        }
        TextbookKind::Exact => {
            let position = ergion_core::exact_quadratic(time);
            (position, -(position + 2.0 * time) / (2.0 * position + time))
        }
        TextbookKind::Bernoulli => {
            let position = ergion_core::bernoulli_logistic(0.5, time);
            (position, position * (1.0 - position))
        }
        TextbookKind::TwoReal => (
            ergion_core::characteristic_two_real(time),
            ergion_core::characteristic_two_real_prime(time),
        ),
        TextbookKind::Undetermined => (
            ergion_core::undetermined_coefficient(time),
            ergion_core::undetermined_coefficient_prime(time),
        ),
        TextbookKind::Variation => (
            ergion_core::variation_of_parameters(time),
            ergion_core::variation_of_parameters_prime(time),
        ),
        TextbookKind::Laplace => (
            ergion_core::laplace_ivp(time),
            ergion_core::laplace_ivp_prime(time),
        ),
        TextbookKind::Series => (
            ergion_core::power_series_cosine(time),
            ergion_core::power_series_cosine_prime(time),
        ),
        TextbookKind::System => (
            ergion_core::linear_system_x(time),
            ergion_core::linear_system_y(time),
        ),
    }
}

fn in_domain(kind: TextbookKind, time: f64) -> bool {
    if !time.is_finite() {
        return false;
    }
    match kind {
        TextbookKind::Homogeneous => time > 0.0,
        TextbookKind::Exact => 4.0 - 3.0 * time * time >= 0.0,
        TextbookKind::Variation => time.abs() < std::f64::consts::FRAC_PI_2 - 1.0e-9,
        _ => true,
    }
}

/// 学部の標準的な解法の厳密解を、標本の時刻で評価する。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct TextbookSimulation {
    config: TextbookConfig,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl TextbookSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、定義域の外、有限でない値、
    /// 正でない時間間隔、範囲外の標本数は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<TextbookSimulation, String> {
        let config: TextbookConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        if !config.t0.is_finite() || config.t0.abs() > 1e12 {
            return Err("t0 must be finite and in [-1e12, 1e12]".into());
        }
        if !config.dt.is_finite() || config.dt <= 0.0 || config.dt > 1e12 {
            return Err("dt must be finite and in (0, 1e12]".into());
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        let final_time = config.t0 + config.dt * f64::from(config.steps);
        if !in_domain(config.kind, config.t0) || !in_domain(config.kind, final_time) {
            return Err("time interval leaves the domain".into());
        }
        let (position, velocity) = evaluate(config.kind, final_time);
        if !final_time.is_finite() || !position.is_finite() || !velocity.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        Ok(Self { config, step: 0 })
    }

    /// 現在の状態を JSON で返します。位置は対応する厳密解の値です。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.at(self.step)).map_err(|e| e.to_string())
    }

    /// 指定した個数だけ標本を進めます。1回の呼び出しは 1 から 500 個までです。
    ///
    /// 各標本は `ergion-core` の厳密解だけを呼びます。数値の1ステップではありません。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps.saturating_sub(self.step));
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            self.step += 1;
            samples.push(self.at(self.step));
        }
        serde_json::to_string(&ClosedFormBatch {
            samples,
            state: self.at(self.step),
        })
        .map_err(|e| e.to_string())
    }
}

impl TextbookSimulation {
    fn at(&self, step: u32) -> ClosedFormSnapshot {
        let time = self.config.t0 + f64::from(step) * self.config.dt;
        let (position, velocity) = evaluate(self.config.kind, time);
        ClosedFormSnapshot {
            step,
            time,
            position,
            velocity,
            exact_position: position,
            exact_velocity: velocity,
            finished: step == self.config.steps,
        }
    }
}
