//! \(f(x) = x^2 - 2\) の正の根を、ニュートン法の反復で求める。
//!
//! 1回の更新そのものは [`ergion_core::newton_step`] が行う。
//! ここでは \(f(x) = x^2 - 2\)、\(f'(x) = 2x\)、出発点 \(x_0 = 1\) に固定し、その関数を繰り返す。
//! 比較する値は正の根 \(\sqrt{2}\) です。横軸に使う番号は反復の番号であり、時刻ではありません。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// ニュートン法の反復回数。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `steps`: 反復の回数。\(1\) 以上 \(1{,}000{,}000\) 以下。
///
/// 関数は \(f(x) = x^2 - 2\)、導関数は \(f'(x) = 2x\)、出発点は \(x_0 = 1\) に固定です。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct NewtonConfig {
    pub schema_version: u32,
    pub steps: u32,
}

/// ある反復の近似と、正の根 \(\sqrt{2}\) との差。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct NewtonSnapshot {
    pub step: u32,
    /// 反復の番号 \(n\)。時刻ではありません。
    pub time: f64,
    /// 近似 \(x_n\)。
    pub position: f64,
    /// \(f(x_n) = x_n^2 - 2\)。
    pub velocity: f64,
    /// 正の根 \(\sqrt{2}\)。
    pub exact_position: f64,
    /// \(f(\sqrt{2}) = 0\)。
    pub exact_velocity: f64,
    /// \(x_n - \sqrt{2}\)。
    pub position_error: f64,
    pub finished: bool,
}

/// まとめて進めたときのサンプルと、その時点の近似。
#[derive(Debug, Serialize, Deserialize)]
pub struct NewtonBatch {
    pub samples: Vec<NewtonSnapshot>,
    pub state: NewtonSnapshot,
}

/// \(x_0 = 1\) から \(f(x) = x^2 - 2\) のニュートン法を繰り返す。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct NewtonSimulation {
    steps: u32,
    position: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl NewtonSimulation {
    /// 反復回数の JSON から、出発点 \(x_0 = 1\) を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、または範囲外の反復回数は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<NewtonSimulation, String> {
        let config: NewtonConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        Ok(Self {
            steps: config.steps,
            position: 1.0,
            step: 0,
        })
    }

    /// 現在の近似を JSON で返します。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state()).map_err(|e| e.to_string())
    }

    /// 指定した回数だけ [`ergion_core::newton_step`] を繰り返します。1回の呼び出しは 1 から 500 回までです。
    ///
    /// 関数は \(f(x) = x^2 - 2\)、導関数は \(f'(x) = 2x\) です。
    /// 比較する値は正の根 \(\sqrt{2}\) で、誤差は \(x_n - \sqrt{2}\) です。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            self.position = ergion_core::newton_step(
                self.position,
                |x| x * x - 2.0,
                |x| 2.0 * x,
            );
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&NewtonBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }

    /// 反復の回数を増やす。出発点と、いまの近似は変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        self.steps = crate::additional_steps(self.steps, additional_steps)?;
        self.snapshot()
    }
}

impl NewtonSimulation {
    fn state(&self) -> NewtonSnapshot {
        let root = 2.0_f64.sqrt();
        NewtonSnapshot {
            step: self.step,
            time: f64::from(self.step),
            position: self.position,
            velocity: self.position * self.position - 2.0,
            exact_position: root,
            exact_velocity: 0.0,
            position_error: self.position - root,
            finished: self.step == self.steps,
        }
    }
}
