//! 各ページの方程式を、Euler 法・中点法・古典的な4次の Runge–Kutta 法で1ステップ進め、
//! 同じ時刻の厳密解との差を返す。
//!
//! 1ステップは [`ergion_core::euler_step`]、[`ergion_core::midpoint_step`]、[`ergion_core::rk4_step`]
//! だけを呼ぶ。厳密解は、その方程式を閉じた式で返す関数の値であり、傾きを足して作らない。

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

use crate::EulerMethod;

/// どの方程式を進めるか。
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum StepEquation {
    Uniform,
    Derivative,
    Accelerated,
    Separation,
    Linear,
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

/// 数値解と厳密解を比べるための計算条件。
///
/// # フィールド
/// - `schema_version`: スキーマ版。`1` である必要があります。
/// - `kind`: 進める方程式。
/// - `method`: 1ステップの方法。
/// - `t0`: 初期時刻。有限値で、方程式の定義域に入っている必要があります。
/// - `dt`: 時間刻み。有限な正数で、\(10^{12}\) 以下。
/// - `steps`: ステップ数。\(1\) 以上 \(1{,}000{,}000\) 以下。
/// - 初期値と係数は、方程式がそれを必要とするときだけ使います。
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct StepCompareConfig {
    pub schema_version: u32,
    pub kind: StepEquation,
    pub method: EulerMethod,
    pub t0: f64,
    pub dt: f64,
    pub steps: u32,
    #[serde(default)]
    pub initial_position: f64,
    #[serde(default)]
    pub initial_velocity: f64,
    #[serde(default)]
    pub velocity: f64,
    #[serde(default)]
    pub acceleration: f64,
    #[serde(default)]
    pub k: f64,
    #[serde(default)]
    pub p: f64,
    #[serde(default)]
    pub q: f64,
}

/// あるステップの数値解、厳密解、およびその差。
///
/// `position_error` は数値解の第1成分から厳密解を引いた値です。
/// `velocity_error` は、第2成分がある方程式ではその成分の差、
/// 未知関数が一つの方程式では右辺の差です。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct StepCompareSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub position_error: f64,
    pub velocity_error: f64,
    pub finished: bool,
}

/// まとめて進めたときのサンプルと、その時点の状態。
#[derive(Debug, Serialize, Deserialize)]
pub struct StepCompareBatch {
    pub samples: Vec<StepCompareSnapshot>,
    pub state: StepCompareSnapshot,
}

#[derive(Clone, Copy)]
struct Params {
    initial_position: f64,
    initial_velocity: f64,
    velocity: f64,
    acceleration: f64,
    k: f64,
    p: f64,
    q: f64,
}

fn width(kind: StepEquation) -> usize {
    match kind {
        StepEquation::Accelerated
        | StepEquation::TwoReal
        | StepEquation::Undetermined
        | StepEquation::Variation
        | StepEquation::Laplace
        | StepEquation::Series
        | StepEquation::System => 2,
        _ => 1,
    }
}

fn in_domain(kind: StepEquation, time: f64) -> bool {
    if !time.is_finite() {
        return false;
    }
    match kind {
        StepEquation::Homogeneous => time > 0.0,
        StepEquation::Exact => 4.0 - 3.0 * time * time >= 0.0,
        StepEquation::Variation => time.abs() < std::f64::consts::FRAC_PI_2 - 1.0e-9,
        _ => true,
    }
}

fn exact(kind: StepEquation, params: Params, t0: f64, time: f64) -> (f64, f64) {
    let elapsed = time - t0;
    match kind {
        StepEquation::Uniform | StepEquation::Derivative => {
            let position = params.initial_position + params.velocity * elapsed;
            (position, params.velocity)
        }
        StepEquation::Accelerated => {
            let velocity = params.initial_velocity + params.acceleration * elapsed;
            let position = params.initial_position
                + params.initial_velocity * elapsed
                + 0.5 * params.acceleration * elapsed * elapsed;
            (position, velocity)
        }
        StepEquation::Separation => {
            let position =
                ergion_core::separated_exponential(params.initial_position, params.k, elapsed);
            (position, params.k * position)
        }
        StepEquation::Linear => {
            let position = ergion_core::first_order_linear(
                params.initial_position,
                params.p,
                params.q,
                elapsed,
            );
            (position, params.q - params.p * position)
        }
        StepEquation::Homogeneous => {
            let position = ergion_core::homogeneous_ratio(0.0, time);
            (position, 1.0 + position / time)
        }
        StepEquation::Exact => {
            let position = ergion_core::exact_quadratic(time);
            (
                position,
                -(position + 2.0 * time) / (2.0 * position + time),
            )
        }
        StepEquation::Bernoulli => {
            let position = ergion_core::bernoulli_logistic(0.5, time);
            (position, position * (1.0 - position))
        }
        StepEquation::TwoReal => (
            ergion_core::characteristic_two_real(time),
            ergion_core::characteristic_two_real_prime(time),
        ),
        StepEquation::Undetermined => (
            ergion_core::undetermined_coefficient(time),
            ergion_core::undetermined_coefficient_prime(time),
        ),
        StepEquation::Variation => (
            ergion_core::variation_of_parameters(time),
            ergion_core::variation_of_parameters_prime(time),
        ),
        StepEquation::Laplace => (
            ergion_core::laplace_ivp(time),
            ergion_core::laplace_ivp_prime(time),
        ),
        StepEquation::Series => (
            ergion_core::power_series_cosine(time),
            ergion_core::power_series_cosine_prime(time),
        ),
        StepEquation::System => (
            ergion_core::linear_system_x(time),
            ergion_core::linear_system_y(time),
        ),
    }
}

fn fill_slope(kind: StepEquation, params: Params, time: f64, state: &[f64], slope: &mut [f64]) {
    match kind {
        StepEquation::Uniform | StepEquation::Derivative => slope[0] = params.velocity,
        StepEquation::Accelerated => {
            slope[0] = state[1];
            slope[1] = params.acceleration;
        }
        StepEquation::Separation => slope[0] = params.k * state[0],
        StepEquation::Linear => slope[0] = params.q - params.p * state[0],
        StepEquation::Homogeneous => slope[0] = 1.0 + state[0] / time,
        StepEquation::Exact => {
            slope[0] = -(state[0] + 2.0 * time) / (2.0 * state[0] + time);
        }
        StepEquation::Bernoulli => slope[0] = state[0] * (1.0 - state[0]),
        StepEquation::TwoReal => {
            slope[0] = state[1];
            slope[1] = 3.0 * state[1] - 2.0 * state[0];
        }
        StepEquation::Undetermined | StepEquation::Laplace => {
            slope[0] = state[1];
            slope[1] = 3.0 * state[1] - 2.0 * state[0] + (3.0 * time).exp();
        }
        StepEquation::Variation => {
            slope[0] = state[1];
            slope[1] = -state[0] + time.tan();
        }
        StepEquation::Series => {
            slope[0] = state[1];
            slope[1] = -state[0];
        }
        StepEquation::System => {
            slope[0] = state[0] + state[1];
            slope[1] = 4.0 * state[0] + state[1];
        }
    }
}

fn take_step(
    method: EulerMethod,
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]) + Copy,
) {
    match method {
        EulerMethod::Euler => ergion_core::euler_step(state, time, dt, derivative),
        EulerMethod::Midpoint => ergion_core::midpoint_step(state, time, dt, derivative),
        EulerMethod::Rk4 => ergion_core::rk4_step(state, time, dt, derivative),
    }
}

fn bounded(name: &str, value: f64) -> Result<(), String> {
    if !value.is_finite() || value.abs() > 1e12 {
        return Err(format!("{name} must be finite and in [-1e12, 1e12]"));
    }
    Ok(())
}

/// 選んだ数値解法で方程式を進め、厳密解との差を返す。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct StepCompareSimulation {
    config: StepCompareConfig,
    params: Params,
    values: Vec<f64>,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl StepCompareSimulation {
    /// 計算条件の JSON から初期状態を作ります。
    ///
    /// # エラー
    /// 未知のフィールド、スキーマ版の不一致、定義域の外、有限でない値、
    /// 正でない時間刻み、範囲外のステップ数は受け付けません。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<StepCompareSimulation, String> {
        let config: StepCompareConfig =
            serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        if !config.dt.is_finite() || config.dt <= 0.0 || config.dt > 1e12 {
            return Err("dt must be finite and in (0, 1e12]".into());
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        bounded("t0", config.t0)?;
        let params = Params {
            initial_position: config.initial_position,
            initial_velocity: config.initial_velocity,
            velocity: config.velocity,
            acceleration: config.acceleration,
            k: config.k,
            p: config.p,
            q: config.q,
        };
        match config.kind {
            StepEquation::Uniform | StepEquation::Derivative => {
                bounded("initial_position", params.initial_position)?;
                bounded("velocity", params.velocity)?;
            }
            StepEquation::Accelerated => {
                bounded("initial_position", params.initial_position)?;
                bounded("initial_velocity", params.initial_velocity)?;
                bounded("acceleration", params.acceleration)?;
            }
            StepEquation::Separation => {
                bounded("initial_position", params.initial_position)?;
                bounded("k", params.k)?;
            }
            StepEquation::Linear => {
                bounded("initial_position", params.initial_position)?;
                bounded("p", params.p)?;
                bounded("q", params.q)?;
                if params.p == 0.0 {
                    return Err("p must be nonzero".into());
                }
            }
            _ => {}
        }
        let final_time = config.t0 + config.dt * f64::from(config.steps);
        if !in_domain(config.kind, config.t0) || !in_domain(config.kind, final_time) {
            return Err("time interval leaves the domain".into());
        }
        let (position, velocity) = exact(config.kind, params, config.t0, final_time);
        if !final_time.is_finite() || !position.is_finite() || !velocity.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        let (start, start_velocity) = exact(config.kind, params, config.t0, config.t0);
        if !start.is_finite() || !start_velocity.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        let values = if width(config.kind) == 1 {
            vec![start]
        } else {
            vec![start, start_velocity]
        };
        Ok(Self {
            config,
            params,
            values,
            step: 0,
        })
    }

    /// 現在の状態を JSON で返します。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state()).map_err(|e| e.to_string())
    }

    /// 指定したステップ数だけ進めます。1回の呼び出しは 1 から 500 ステップまでです。
    ///
    /// 各ステップは、選んだ方法に応じて [`ergion_core::euler_step`]、
    /// [`ergion_core::midpoint_step`]、[`ergion_core::rk4_step`] のいずれかを呼びます。
    /// 同じ時刻の厳密解は、閉じた式から別に評価します。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            let time = self.config.t0 + f64::from(self.step) * self.config.dt;
            let dt = self.config.dt;
            let kind = self.config.kind;
            let params = self.params;
            let mut state = self.values.clone();
            take_step(
                self.config.method,
                &mut state,
                time,
                dt,
                move |time, value, slope| fill_slope(kind, params, time, value, slope),
            );
            if state.iter().any(|value| !value.is_finite()) {
                return Err("step left the finite range".into());
            }
            self.values = state;
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&StepCompareBatch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }

    /// 終了時刻を延ばす。初期条件と、いまの状態・ステップは変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        let steps = crate::additional_steps(self.config.steps, additional_steps)?;
        let final_time = self.config.t0 + self.config.dt * f64::from(steps);
        if !in_domain(self.config.kind, self.config.t0) || !in_domain(self.config.kind, final_time) {
            return Err("time interval leaves the domain".into());
        }
        let (position, velocity) = exact(self.config.kind, self.params, self.config.t0, final_time);
        if !final_time.is_finite() || !position.is_finite() || !velocity.is_finite() {
            return Err("parameters exceed numeric range".into());
        }
        self.config.steps = steps;
        self.snapshot()
    }
}

impl StepCompareSimulation {
    fn state(&self) -> StepCompareSnapshot {
        let time = self.config.t0 + f64::from(self.step) * self.config.dt;
        let (exact_position, exact_velocity) = exact(self.config.kind, self.params, self.config.t0, time);
        let position = self.values[0];
        let velocity = if width(self.config.kind) == 2 {
            self.values[1]
        } else {
            let mut slope = [0.0];
            fill_slope(
                self.config.kind,
                self.params,
                time,
                &self.values,
                &mut slope,
            );
            slope[0]
        };
        StepCompareSnapshot {
            step: self.step,
            time,
            position,
            velocity,
            exact_position,
            exact_velocity,
            position_error: position - exact_position,
            velocity_error: velocity - exact_velocity,
            finished: self.step == self.config.steps,
        }
    }
}
