//! Harmonic oscillator reference model and shared Native/Wasm execution boundary.
pub mod closed_form;
pub mod compare;
pub mod constant_acceleration;
pub mod euler;
pub mod lesson;
mod lesson_analytical;
mod lesson_analytical_a;
mod lesson_analytical_b;
mod lesson_calculus;
mod lesson_calculus_a;
mod lesson_calculus_b;
mod lesson_em;
mod lesson_em_a;
mod lesson_em_b;
mod lesson_finance;
mod lesson_linalg;
mod lesson_md;
mod lesson_mechanics;
mod lesson_ode;
mod lesson_statistics;
pub mod newton;
pub mod position_derivative;
#[cfg(target_arch = "wasm32")]
mod step_api;
pub mod textbook;
pub mod uniform;
pub use closed_form::*;
pub use compare::*;
pub use constant_acceleration::*;
pub use euler::*;
pub use lesson::{LessonSimulation, LessonSnapshot, lesson_figure};
pub use newton::*;
pub use position_derivative::*;
pub use textbook::*;
pub use uniform::*;

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Integrator {
    Rk4,
    Verlet,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    pub schema_version: u32,
    pub mass: f64,
    pub spring_constant: f64,
    pub initial_position: f64,
    pub initial_velocity: f64,
    pub dt: f64,
    pub steps: u32,
    pub integrator: Integrator,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Snapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub kinetic_energy: f64,
    pub potential_energy: f64,
    pub total_energy: f64,
    pub initial_energy: f64,
    pub relative_energy_error: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub finished: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Batch {
    pub samples: Vec<Snapshot>,
    pub state: Snapshot,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct Simulation {
    config: Config,
    position: f64,
    velocity: f64,
    step: u32,
    omega: f64,
    initial_energy: f64,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl Simulation {
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<Simulation, String> {
        let config: Config = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        if config.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        for (name, value) in [
            ("mass", config.mass),
            ("spring_constant", config.spring_constant),
            ("dt", config.dt),
        ] {
            if !value.is_finite() || value <= 0.0 || value > 1e12 {
                return Err(format!("{name} must be finite and in (0, 1e12]"));
            }
        }
        for (name, value) in [
            ("initial_position", config.initial_position),
            ("initial_velocity", config.initial_velocity),
        ] {
            if !value.is_finite() || value.abs() > 1e12 {
                return Err(format!("{name} must be finite and in [-1e12, 1e12]"));
            }
        }
        if !(1..=1_000_000).contains(&config.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        let omega_squared = config.spring_constant / config.mass;
        let omega = omega_squared.sqrt();
        let phase_step = omega * config.dt;
        let final_time = config.dt * f64::from(config.steps);
        let initial_energy = 0.5 * config.mass * config.initial_velocity.powi(2)
            + 0.5 * config.spring_constant * config.initial_position.powi(2);
        let amplitude = config
            .initial_position
            .hypot(config.initial_velocity / omega);
        let position_bound = match config.integrator {
            Integrator::Rk4 => amplitude,
            Integrator::Verlet => amplitude / (1.0 - 0.25 * phase_step * phase_step).sqrt(),
        };
        let velocity_bound = omega * position_bound;
        // Bound intermediates as well as serialized values before starting a run.
        if !omega_squared.is_finite()
            || omega_squared <= 0.0
            || !phase_step.is_finite()
            || phase_step <= 0.0
            || phase_step >= 2.0
            || !final_time.is_finite()
            || !initial_energy.is_finite()
            || !amplitude.is_finite()
            || !(omega_squared * position_bound * 32.0).is_finite()
            || !(position_bound.powi(2) * config.spring_constant * 32.0).is_finite()
            || !(velocity_bound.powi(2) * config.mass * 32.0).is_finite()
            || (initial_energy == 0.0
                && (config.initial_position != 0.0 || config.initial_velocity != 0.0))
        {
            return Err("parameters exceed numeric range or require omega * dt < 2".into());
        }
        Ok(Self {
            position: config.initial_position,
            velocity: config.initial_velocity,
            config,
            step: 0,
            omega,
            initial_energy,
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
            let omega_squared = self.config.spring_constant / self.config.mass;
            match self.config.integrator {
                Integrator::Rk4 => {
                    let mut state = [self.position, self.velocity];
                    ergion_core::rk4_step(
                        &mut state,
                        f64::from(self.step) * self.config.dt,
                        self.config.dt,
                        |_, y, dy| {
                            dy[0] = y[1];
                            dy[1] = -omega_squared * y[0];
                        },
                    );
                    self.position = state[0];
                    self.velocity = state[1];
                }
                Integrator::Verlet => {
                    ergion_core::velocity_verlet_step(
                        std::slice::from_mut(&mut self.position),
                        std::slice::from_mut(&mut self.velocity),
                        self.config.dt,
                        |q, a| {
                            a[0] = -omega_squared * q[0];
                        },
                    );
                }
            }
            self.step += 1;
            samples.push(self.state());
        }
        serde_json::to_string(&Batch {
            samples,
            state: self.state(),
        })
        .map_err(|e| e.to_string())
    }
}

pub(crate) fn additional_steps(current: u32, additional: u32) -> Result<u32, String> {
    if additional == 0 {
        return Err("additional steps must be at least 1".into());
    }
    let Some(steps) = current.checked_add(additional) else {
        return Err("steps must be in 1..=1000000".into());
    };
    if !(1..=1_000_000).contains(&steps) {
        return Err("steps must be in 1..=1000000".into());
    }
    Ok(steps)
}

impl Simulation {
    fn state(&self) -> Snapshot {
        let time = f64::from(self.step) * self.config.dt;
        let (sin, cos) = (self.omega * time).sin_cos();
        let kinetic_energy = 0.5 * self.config.mass * self.velocity.powi(2);
        let potential_energy = 0.5 * self.config.spring_constant * self.position.powi(2);
        let total_energy = kinetic_energy + potential_energy;
        Snapshot {
            step: self.step,
            time,
            position: self.position,
            velocity: self.velocity,
            kinetic_energy,
            potential_energy,
            total_energy,
            initial_energy: self.initial_energy,
            relative_energy_error: if self.initial_energy == 0.0 {
                0.0
            } else {
                (total_energy - self.initial_energy) / self.initial_energy
            },
            exact_position: self.config.initial_position * cos
                + self.config.initial_velocity / self.omega * sin,
            exact_velocity: -self.config.initial_position * self.omega * sin
                + self.config.initial_velocity * cos,
            finished: self.step == self.config.steps,
        }
    }
}
