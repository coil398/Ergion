//! Uniform motion of a single particle: x = x0 + v * t.
use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct UniformConfig {
    pub schema_version: u32,
    pub initial_position: f64,
    pub velocity: f64,
    pub dt: f64,
    pub steps: u32,
}

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

#[derive(Debug, Serialize, Deserialize)]
pub struct UniformBatch {
    pub samples: Vec<UniformSnapshot>,
    pub state: UniformSnapshot,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct UniformSimulation {
    config: UniformConfig,
    position: f64,
    velocity: f64,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl UniformSimulation {
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

    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state()).map_err(|e| e.to_string())
    }

    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.config.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            // 一粒子等速直線運動: 外力 F = 0、加速度 a = 0。
            // 時間積分のCore関数を用いて1ステップ進める。
            ergion_core::velocity_verlet_step(
                std::slice::from_mut(&mut self.position),
                std::slice::from_mut(&mut self.velocity),
                self.config.dt,
                |_q, a| {
                    a[0] = 0.0;
                },
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
