//! 速度が一定の \(x' = v\) を、Euler 法の1ステップで進める。
//!
//! 1ステップの更新そのものは [`ergion_core::euler_step`] が行う。
//! ここでは初期値、時間刻み、ステップ数を受け取り、その関数を繰り返す。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Euler 法で \(x' = v\) を進めるための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `initial_position`: 初期位置 \(x_0\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `velocity`: 右辺として一定とみなす速度 \(v\)。有限値で、絶対値は \(10^{12}\) 以下。
/// - `dt`: 時間刻み \(\Delta t\)。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: ステップ数。\(1\) 以上 \(1{,}000{,}000\) 以下。
/// この画面で切り替える1ステップの方法。
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum EulerMethod {
    #[default]
    Euler,
    Midpoint,
    Rk4,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct EulerConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub velocity: f64,
    pub dt: f64,
    pub steps: u32,
    /// 未指定のときは Euler 法です。
    #[serde(default)]
    pub method: EulerMethod,
}

/// あるステップの位置と速度。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct EulerSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    /// 数値解の位置から厳密解の位置を引いた値。\(x - x_{\mathrm{exact}}\)。
    pub position_error: f64,
    pub finished: bool,
}

/// まとめて進めたときのサンプルと、その時点の状態。
#[derive(Debug, Serialize, Deserialize)]
pub struct EulerBatch {
    pub samples: Vec<EulerSnapshot>,
    pub state: EulerSnapshot,
}

/// 速度を一定にした Euler 法で、位置をステップごとに進める。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct EulerSimulation {
    config: EulerConfig,
    position: f64,
    velocity: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl EulerSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、有限でない値、正でない時間刻み、
    /// 範囲外のステップ数、または終点が有限でなくなる条件は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<EulerSimulation, String> {
        let config: EulerConfig = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
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
    /// 右辺は一定の速度 \(v\) なので、\(f(x, t) = v\) です。
    /// 選んだ方法に応じて [`ergion_core::euler_step`]、[`ergion_core::midpoint_step`]、
    /// [`ergion_core::rk4_step`] のいずれかを1ステップ呼びます。
    /// 速度は変えません。右辺が一定なので、どの方法も厳密な増分 \(v \Delta t\) と一致し、
    /// 位置の誤差は丸めだけです。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            let velocity = self.velocity;
            let time = f64::from(self.step) * self.config.dt;
            let dt = self.config.dt;
            let mut state = [self.position];
            let derivative = |_time: f64, _state: &[f64], slope: &mut [f64]| {
                slope[0] = velocity;
            };
            match self.config.method {
                EulerMethod::Euler => ergion_core::euler_step(&mut state, time, dt, derivative),
                EulerMethod::Midpoint => {
                    ergion_core::midpoint_step(&mut state, time, dt, derivative)
                }
                EulerMethod::Rk4 => ergion_core::rk4_step(&mut state, time, dt, derivative),
            }
            self.position = state[0];
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&EulerBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }
}

impl EulerSimulation {
    fn state(&self) -> EulerSnapshot {
        let time = f64::from(self.step) * self.config.dt;
        let exact_position = self.config.initial_position + self.config.velocity * time;
        EulerSnapshot {
            step: self.step,
            time,
            position: self.position,
            velocity: self.velocity,
            exact_position,
            exact_velocity: self.config.velocity,
            position_error: self.position - exact_position,
            finished: self.step == self.config.steps,
        }
    }
}
