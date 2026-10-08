//! 電磁気学の単元の値。式は `ergion_core::electromagnetism` の各関数の rustdoc にある。
//!
//! - `lorentz`: 一様磁場 \(\mathbf{B} = B\hat{\mathbf{z}}\) の中の荷電粒子を Boris 法または古典的RK4で進め、らせんの厳密解と比べる。
//! - `faraday`: 磁束 \(\Phi = B_0 A\cos\omega t\) の起電力を厳密解と中心差分で求め、RL 回路の電流を数値積分する。
//! - `maxwell`: 1次元の FDTD 法（Yee 格子）で Gauss 形のパルスを進め、d'Alembert の解と比べる。

use std::f64::consts::PI;

use ergion_core::electromagnetism as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, Method, ModelState, count, grid, num, positive, text};

/// 一つの線に返す点の数の上限。
const MAX_POINTS: usize = 400;

/// この部分の単元の図。
pub fn figure(unit: &str, _params: &Value) -> Result<Figure, String> {
    Err(format!("unknown unit {unit}"))
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "lorentz" => Ok(Box::new(Lorentz::new(config, dt)?)),
        "faraday" => Ok(Box::new(Faraday::new(config)?)),
        "maxwell" => Ok(Box::new(Maxwell::new(config, dt)?)),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// 等間隔に間引いた添字。最後の添字を必ず含む。
fn thinned(len: usize) -> Vec<usize> {
    if len <= MAX_POINTS {
        return (0..len).collect();
    }
    let stride = len.div_ceil(MAX_POINTS - 1);
    let mut out: Vec<usize> = (0..len).step_by(stride).collect();
    if *out.last().unwrap() != len - 1 {
        out.push(len - 1);
    }
    out
}

#[derive(Clone, Copy, PartialEq)]
enum Pusher {
    Boris,
    Rk4,
}

/// 一様磁場の中の荷電粒子。初期位置は案内中心が原点になるように \((-v_\perp/\omega_c, 0, 0)\)、初速度は \((0, v_\perp, v_\parallel)\)。
struct Lorentz {
    pusher: Pusher,
    charge_over_mass: f64,
    field: f64,
    omega: f64,
    r0: [f64; 3],
    v0: [f64; 3],
    x: [f64; 3],
    v: [f64; 3],
    dt: f64,
    trail: Vec<[f64; 3]>,
}

impl Lorentz {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        let pusher = match text(config, "method", "boris") {
            "boris" => Pusher::Boris,
            "rk4" => Pusher::Rk4,
            other => return Err(format!("unknown method {other}")),
        };
        let charge = num(config, "charge", 1.0)?;
        let mass = positive(config, "mass", 1.0)?;
        let field = num(config, "field", 1.0)?;
        let vperp = positive(config, "vperp", 1.0)?;
        let vpar = num(config, "vpar", 0.2)?;
        let omega = core::cyclotron_frequency(charge, field, mass);
        if omega == 0.0 {
            return Err("qB must not be 0".into());
        }
        let r0 = [-vperp / omega, 0.0, 0.0];
        let v0 = [0.0, vperp, vpar];
        let v = match pusher {
            Pusher::Boris => core::helix_state(r0, v0, omega, -0.5 * dt).1,
            Pusher::Rk4 => v0,
        };
        Ok(Self { pusher, charge_over_mass: charge / mass, field, omega, r0, v0, x: r0, v, dt, trail: vec![r0] })
    }

    fn exact(&self, time: f64) -> ([f64; 3], [f64; 3]) {
        core::helix_state(self.r0, self.v0, self.omega, time)
    }
}

impl LessonModel for Lorentz {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let b = [0.0, 0.0, self.field];
        match self.pusher {
            Pusher::Boris => core::boris_step(&mut self.x, &mut self.v, self.charge_over_mass, [0.0; 3], b, dt),
            Pusher::Rk4 => {
                let mut state = [self.x[0], self.x[1], self.x[2], self.v[0], self.v[1], self.v[2]];
                let k = self.charge_over_mass;
                Method::Rk4.step(&mut state, time, dt, |_, y, out| {
                    let a = core::lorentz_acceleration(k, [y[3], y[4], y[5]], [0.0; 3], b);
                    out[..3].copy_from_slice(&y[3..]);
                    out[3..].copy_from_slice(&a);
                });
                self.x = [state[0], state[1], state[2]];
                self.v = [state[3], state[4], state[5]];
            }
        }
        self.trail.push(self.x);
        Ok(())
    }

    fn state(&self, time: f64) -> ModelState {
        ModelState {
            position: self.x[0],
            velocity: core::particle_speed(self.v),
            exact_position: self.exact(time).0[0],
            exact_velocity: core::particle_speed(self.v0),
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let (exact, _) = self.exact(time);
        let radius = core::larmor_radius(self.v0[1], self.omega);
        let circle = grid(0.0, 2.0 * PI, 121);
        let index = thinned(self.trail.len());
        let pick = |k: usize| index.iter().map(|&i| self.trail[i][k]).collect::<Vec<f64>>();
        let times = grid(0.0, time, 241);
        let exact_path: Vec<[f64; 3]> = times.iter().map(|&t| self.exact(t).0).collect();
        let speed = core::particle_speed(self.v);
        let force = core::lorentz_acceleration(self.charge_over_mass, self.v, [0.0; 3], [0.0, 0.0, self.field]);
        let scale = 0.5 * radius / self.v0[1];
        let fscale = 0.5 * radius / (self.v0[1] * self.omega.abs());
        let p = (self.x[0], self.x[1]);
        Some(
            Figure::new()
                .series("xy-exact", "exact", circle.iter().map(|a| radius * a.cos()).collect(), circle.iter().map(|a| radius * a.sin()).collect())
                .series("xy-trail", "numerical", pick(0), pick(1))
                .series("xz-exact", "exact", exact_path.iter().map(|r| r[2]).collect(), exact_path.iter().map(|r| r[0]).collect())
                .series("xz-trail", "numerical", pick(2), pick(0))
                .point("center", "muted", 0.0, 0.0)
                .point("exact-xy", "exact", exact[0], exact[1])
                .point("particle-xy", "numerical", p.0, p.1)
                .point("exact-xz", "exact", exact[2], exact[0])
                .point("particle-xz", "numerical", self.x[2], self.x[0])
                .arrow("velocity", "vector", p, (p.0 + scale * self.v[0], p.1 + scale * self.v[1]))
                .arrow("force", "difference", p, (p.0 + fscale * force[0], p.1 + fscale * force[1]))
                .value("omega", self.omega)
                .value("radius", radius)
                .value("period", 2.0 * PI / self.omega.abs())
                .value("pitch", 2.0 * PI * self.v0[2] / self.omega.abs())
                .value("speed_change", speed - core::particle_speed(self.v0))
                .value("z", self.x[2])
                .value("exact_z", exact[2])
                .value("position_error", ((0..3).map(|i| (self.x[i] - exact[i]).powi(2)).sum::<f64>()).sqrt())
                .value("boris_angle", core::boris_rotation_angle(self.omega, self.dt)),
        )
    }
}

/// 磁束 \(\Phi = B_0 A\cos\omega t\) の起電力で駆動される RL 回路 \(L I' + R I = \mathcal{E}(t)\)、\(I(0) = 0\)。
struct Faraday {
    method: Method,
    peak_field: f64,
    area: f64,
    omega: f64,
    inductance: f64,
    resistance: f64,
    diff_step: f64,
    current: f64,
}

impl Faraday {
    fn new(config: &Value) -> Result<Self, String> {
        Ok(Self {
            method: Method::read(config, Method::Euler)?,
            peak_field: num(config, "field", 1.0)?,
            area: positive(config, "area", 1.0)?,
            omega: positive(config, "omega", 1.0)?,
            inductance: positive(config, "inductance", 1.0)?,
            resistance: positive(config, "resistance", 1.0)?,
            diff_step: positive(config, "diff_step", 0.1)?,
            current: 0.0,
        })
    }

    fn flux(&self, t: f64) -> f64 {
        core::cosine_flux(self.peak_field, self.area, self.omega, t)
    }

    fn emf(&self, t: f64) -> f64 {
        core::faraday_emf(self.peak_field, self.area, self.omega, t)
    }

    fn emf_difference(&self, t: f64) -> f64 {
        core::central_difference_emf(|s| self.flux(s), t, self.diff_step)
    }

    fn amplitude(&self) -> f64 {
        self.peak_field * self.area * self.omega
    }

    fn exact(&self, t: f64) -> f64 {
        core::rl_current(self.inductance, self.resistance, self.amplitude(), self.omega, t)
    }
}

impl LessonModel for Faraday {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let mut state = [self.current];
        let (l, r) = (self.inductance, self.resistance);
        self.method.step(&mut state, time, dt, |t, y, out| out[0] = (self.emf(t) - r * y[0]) / l);
        if !state[0].is_finite() || state[0].abs() > 1e200 {
            return Err("電流の数値解が有限の範囲を超えました。時間刻みを L/R より小さくしてください。".into());
        }
        self.current = state[0];
        Ok(())
    }

    fn state(&self, time: f64) -> ModelState {
        ModelState {
            position: self.current,
            velocity: self.emf_difference(time),
            exact_position: self.exact(time),
            exact_velocity: self.emf(time),
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let times = grid(0.0, time, 241);
        let field_now = self.peak_field * (self.omega * time).cos();
        let radius = (self.area / PI).sqrt();
        let steady = core::rl_steady_amplitude(self.inductance, self.resistance, self.amplitude(), self.omega);
        let ring = grid(0.0, 2.0 * PI, 121);
        let mut figure = Figure::new()
            .series("flux", "reference", times.clone(), times.iter().map(|&t| self.flux(t)).collect())
            .series("emf-exact", "exact", times.clone(), times.iter().map(|&t| self.emf(t)).collect())
            .series("emf-difference", "numerical", times.clone(), times.iter().map(|&t| self.emf_difference(t)).collect())
            .series("loop", "numerical", ring.iter().map(|a| radius * a.cos()).collect(), ring.iter().map(|a| radius * a.sin()).collect());
        let role = if field_now >= 0.0 { "vector" } else { "muted" };
        for (i, gx) in [-0.5, 0.0, 0.5].iter().enumerate() {
            for (j, gy) in [-0.5, 0.0, 0.5].iter().enumerate() {
                figure = figure.point(&format!("field-{i}{j}"), role, gx * radius, gy * radius);
            }
        }
        let length = 0.45 * radius * self.current / steady;
        for k in 0..8 {
            let a = PI * k as f64 / 4.0;
            let (s, c) = a.sin_cos();
            let from = (radius * c, radius * s);
            figure = figure.arrow(&format!("current-{k}"), "numerical", from, (from.0 - length * s, from.1 + length * c));
        }
        Some(
            figure
                .value("field_now", field_now)
                .value("flux_peak", (self.peak_field * self.area).abs())
                .value("emf_peak", self.amplitude().abs())
                .value("flux_now", self.flux(time))
                .value("emf_ratio", self.emf_difference(0.25 * PI / self.omega) / self.emf(0.25 * PI / self.omega))
                .value("steady_amplitude", steady)
                .value("time_constant", self.inductance / self.resistance)
                .value("phase_lag", (self.omega * self.inductance / self.resistance).atan())
                .value("radius", radius),
        )
    }
}

/// 周期 \(L\) の区間の真空中を進む Gauss 形のパルス。光速 \(c = 1\) の単位で、FDTD 法（Yee 格子）で進める。
struct Maxwell {
    length: f64,
    center: f64,
    width: f64,
    courant: f64,
    probe: usize,
    e: Vec<f64>,
    b: Vec<f64>,
}

impl Maxwell {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        match text(config, "method", "yee") {
            "yee" => {}
            other => return Err(format!("unknown method {other}")),
        }
        let length = positive(config, "length", 10.0)?;
        let cells = count(config, "cells", 200, 2000)?;
        if cells < 8 {
            return Err("cells must be at least 8".into());
        }
        let center = num(config, "center", 2.5)?.rem_euclid(length);
        let width = positive(config, "width", 0.5)?;
        let dx = length / cells as f64;
        let pulse = |x: f64, t: f64| core::periodic_pulse(x, t, center, width, length, 1.0);
        let e = (0..cells).map(|j| pulse(j as f64 * dx, 0.0)).collect();
        let b = (0..cells).map(|j| pulse((j as f64 + 0.5) * dx, -0.5 * dt)).collect();
        let probe = ((center / dx).round() as usize) % cells;
        Ok(Self { length, center, width, courant: dt / dx, probe, e, b })
    }

    fn dx(&self) -> f64 {
        self.length / self.e.len() as f64
    }

    fn exact(&self, x: f64, t: f64) -> f64 {
        core::periodic_pulse(x, t, self.center, self.width, self.length, 1.0)
    }
}

impl LessonModel for Maxwell {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        core::yee_step(&mut self.e, &mut self.b, self.courant, 1.0);
        if self.e.iter().all(|v| v.is_finite() && v.abs() < 1e200) {
            Ok(())
        } else {
            Err("数値解が有限の範囲を超えました。FDTD 法は S ≤ 1 で安定です。".into())
        }
    }

    fn state(&self, time: f64) -> ModelState {
        ModelState {
            position: self.e[self.probe],
            velocity: self.courant,
            exact_position: self.exact(self.probe as f64 * self.dx(), time),
            exact_velocity: self.courant,
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let dx = self.dx();
        let m = self.e.len();
        let mut xs: Vec<f64> = (0..m).map(|j| j as f64 * dx).collect();
        let mut es = self.e.clone();
        xs.push(self.length);
        es.push(self.e[0]);
        let bx: Vec<f64> = (0..m).map(|j| (j as f64 + 0.5) * dx).collect();
        let fine = grid(0.0, self.length, 801);
        let max_error = (0..m).map(|j| (self.e[j] - self.exact(j as f64 * dx, time)).abs()).fold(0.0, f64::max);
        let energy = 0.5 * dx * self.e.iter().chain(&self.b).map(|v| v * v).sum::<f64>();
        Some(
            Figure::new()
                .series("magnetic", "reference", bx, self.b.clone())
                .series("exact", "exact", fine.clone(), fine.iter().map(|&x| self.exact(x, time)).collect())
                .series("numerical", "numerical", xs, es)
                .point("probe", "muted", self.probe as f64 * dx, 0.0)
                .value("courant", self.courant)
                .value("stable", if self.courant <= 1.0 + 1e-12 { 1.0 } else { 0.0 })
                .value("max_error", max_error)
                .value("energy", energy)
                .value("dx", dx),
        )
    }
}

#[cfg(test)]
mod tests {
    use crate::lesson::LessonSimulation;

    fn run(json: &str) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(json).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn boris_keeps_the_speed_and_rk4_drifts() {
        let base = r#""schema_version":1,"kind":"em/lorentz","dt":0.1,"steps":126"#;
        let boris = run(&format!("{{{base},\"method\":\"boris\"}}"));
        assert!((boris.velocity - 1.04_f64.sqrt()).abs() < 1e-13);
        assert!((boris.position - boris.exact_position).abs() < 0.02);
        let rk4 = run(&format!("{{{base},\"method\":\"rk4\"}}"));
        let drift = rk4.velocity - 1.04_f64.sqrt();
        assert!(drift < -1e-8 && drift > -1e-5, "{drift}");
        let frame = boris.frame.unwrap();
        assert_eq!(frame.values["radius"], 1.0);
        assert!((frame.values["boris_angle"] - 0.0999167).abs() < 1e-7);
    }

    #[test]
    fn faraday_rk4_follows_the_exact_current() {
        let end = run(r#"{"schema_version":1,"kind":"em/faraday","dt":0.1,"steps":100,"method":"rk4"}"#);
        assert!((end.exact_position - 0.147548).abs() < 1e-6, "{}", end.exact_position);
        assert!((end.position - end.exact_position).abs() < 1e-6);
        let euler = run(r#"{"schema_version":1,"kind":"em/faraday","dt":0.1,"steps":100,"method":"euler"}"#);
        assert!((euler.position - euler.exact_position).abs() > 1e-3);
        let frame = end.frame.unwrap();
        assert!((frame.values["emf_ratio"] - 0.1_f64.sin() / 0.1).abs() < 1e-12);
        assert!((frame.values["steady_amplitude"] - 0.5_f64.sqrt()).abs() < 1e-15);
    }

    #[test]
    fn maxwell_courant_one_returns_the_pulse_exactly() {
        let one = run(r#"{"schema_version":1,"kind":"em/maxwell","dt":0.05,"steps":200}"#);
        assert!((one.position - 1.0).abs() < 1e-12);
        assert!((one.exact_position - 1.0).abs() < 1e-12);
        assert!(one.frame.unwrap().values["max_error"] < 1e-12);
        let less = run(r#"{"schema_version":1,"kind":"em/maxwell","dt":0.025,"steps":400}"#);
        assert!((less.velocity - 0.5).abs() < 1e-12);
        assert!((less.position - 0.99768).abs() < 1e-5, "{}", less.position);
        assert!(less.frame.unwrap().values["max_error"] > 0.02);
        let unstable = LessonSimulation::new(r#"{"schema_version":1,"kind":"em/maxwell","dt":0.055,"steps":400}"#).unwrap().run_to_end();
        assert!(unstable.map_or(true, |s| s.frame.unwrap().values.get("max_error").is_none_or(|e| *e > 10.0)));
    }
}
