//! 力学の単元の値。式は `ergion_core::mechanics` の各関数の rustdoc にある。

use ergion_core::mechanics as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, Method, ModelState, grid, num, positive};

/// 力学の単元の図。
///
/// - `forced-resonance`: 外力の角振動数 \(\omega\) に対する定常振幅 \(A(\omega)\) と位相の遅れ \(\delta(\omega)\)。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "forced-resonance" => {
            let m = positive(params, "mass", 1.0)?;
            let g = positive(params, "damping", 0.5)?;
            let k = positive(params, "spring_constant", 4.0)?;
            let f = num(params, "force", 1.0)?;
            let w = num(params, "drive_frequency", 2.0)?;
            let top = 3.0 * (k / m).sqrt();
            let omegas = grid(0.0, top, 301);
            let amplitude: Vec<f64> = omegas.iter().map(|&o| core::forced_amplitude(m, g, k, f, o)).collect();
            let phase: Vec<f64> = omegas.iter().map(|&o| core::forced_phase(m, g, k, o)).collect();
            Ok(Figure::new()
                .series("amplitude", "exact", omegas.clone(), amplitude)
                .series("phase", "exact", omegas, phase)
                .point("drive", "numerical", w, core::forced_amplitude(m, g, k, f, w))
                .value("natural_frequency", (k / m).sqrt())
                .value("amplitude", core::forced_amplitude(m, g, k, f, w))
                .value("phase", core::forced_phase(m, g, k, w)))
        }
        _ => Err(format!("unknown mechanics unit {unit}")),
    }
}

/// 力学の単元の時間発展。
pub fn model(unit: &str, config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    let method = Method::read(config, Method::Euler)?;
    let x0 = num(config, "initial_position", 1.0)?;
    let v0 = num(config, "initial_velocity", 0.0)?;
    match unit {
        "constant-force" => {
            let mass = positive(config, "mass", 1.0)?;
            let force = num(config, "force", 1.0)?;
            Ok(Box::new(Line::new(method, Law::ConstantForce { mass, force }, x0, v0)))
        }
        "harmonic" => {
            let mass = positive(config, "mass", 1.0)?;
            let spring = positive(config, "spring_constant", 1.0)?;
            Ok(Box::new(Line::new(method, Law::Damped { mass, damping: 0.0, spring }, x0, v0)))
        }
        "damped" => {
            let mass = positive(config, "mass", 1.0)?;
            let spring = positive(config, "spring_constant", 1.0)?;
            let damping = num(config, "damping", 0.2)?;
            if damping < 0.0 {
                return Err("damping must be nonnegative".into());
            }
            Ok(Box::new(Line::new(method, Law::Damped { mass, damping, spring }, x0, v0)))
        }
        "forced" => {
            let mass = positive(config, "mass", 1.0)?;
            let spring = positive(config, "spring_constant", 4.0)?;
            let damping = num(config, "damping", 0.5)?;
            if damping < 0.0 {
                return Err("damping must be nonnegative".into());
            }
            let force = num(config, "force", 1.0)?;
            let drive = num(config, "drive_frequency", 2.0)?;
            Ok(Box::new(Line::new(method, Law::Forced { mass, damping, spring, force, drive }, x0, v0)))
        }
        "two-body" => Ok(Box::new(TwoBody::new(method, config)?)),
        _ => Err(format!("unknown mechanics unit {unit}")),
    }
}

#[derive(Clone, Copy)]
enum Law {
    ConstantForce { mass: f64, force: f64 },
    Damped { mass: f64, damping: f64, spring: f64 },
    Forced { mass: f64, damping: f64, spring: f64, force: f64, drive: f64 },
}

impl Law {
    /// \(x'' = a(t, x, v)\)。
    fn acceleration(self, t: f64, x: f64, v: f64) -> f64 {
        match self {
            Law::ConstantForce { mass, force } => core::constant_force_acceleration(force, mass),
            Law::Damped { mass, damping, spring } => (-damping * v - spring * x) / mass,
            Law::Forced { mass, damping, spring, force, drive } => {
                (force * (drive * t).cos() - damping * v - spring * x) / mass
            }
        }
    }

    fn exact(self, x0: f64, v0: f64, t: f64) -> (f64, f64) {
        match self {
            Law::ConstantForce { mass, force } => (
                core::constant_force_position(x0, v0, force, mass, t),
                core::constant_force_velocity(v0, force, mass, t),
            ),
            Law::Damped { mass, damping, spring } => core::damped_state(mass, damping, spring, x0, v0, t),
            Law::Forced { mass, damping, spring, force, drive } => {
                core::forced_state(mass, damping, spring, force, drive, x0, v0, t)
            }
        }
    }

    fn energy(self, x: f64, v: f64) -> f64 {
        match self {
            Law::ConstantForce { mass, .. } => 0.5 * mass * v * v,
            Law::Damped { mass, spring, .. } | Law::Forced { mass, spring, .. } => core::spring_energy(mass, spring, x, v),
        }
    }
}

/// 直線上の一つの質点。状態は \((x, v)\) で、\(x' = v\)、\(v' = a(t, x, v)\) を選んだ方法で進める。
struct Line {
    method: Method,
    law: Law,
    x0: f64,
    v0: f64,
    state: [f64; 2],
}

impl Line {
    fn new(method: Method, law: Law, x0: f64, v0: f64) -> Self {
        Self { method, law, x0, v0, state: [x0, v0] }
    }
}

impl LessonModel for Line {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let law = self.law;
        self.method.step(&mut self.state, time, dt, |t, y, dy| {
            dy[0] = y[1];
            dy[1] = law.acceleration(t, y[0], y[1]);
        });
        if self.state.iter().all(|v| v.is_finite()) { Ok(()) } else { Err("step left the finite range".into()) }
    }

    fn state(&self, time: f64) -> ModelState {
        let (x, v) = self.law.exact(self.x0, self.v0, time);
        ModelState { position: self.state[0], velocity: self.state[1], exact_position: x, exact_velocity: v }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let (x, v) = self.law.exact(self.x0, self.v0, time);
        let mut figure = Figure::new()
            .value("energy", self.law.energy(self.state[0], self.state[1]))
            .value("exact_energy", self.law.energy(x, v))
            .value("acceleration", self.law.acceleration(time, self.state[0], self.state[1]));
        if let Law::Damped { mass, damping, spring } = self.law {
            figure = figure.value("envelope", core::damped_envelope(mass, damping, spring, self.x0, self.v0, time));
        }
        if let Law::Forced { mass, damping, spring, force, drive } = self.law {
            let (xp, _) = core::forced_steady_state(mass, damping, spring, force, drive, time);
            figure = figure.value("steady", xp).value("drive", force * (drive * time).cos());
        }
        Some(figure)
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        let (x, v) = self.law.exact(self.x0, self.v0, final_time);
        if x.is_finite() && v.is_finite() && x.abs() < 1e12 && v.abs() < 1e12 {
            Ok(())
        } else {
            Err("parameters exceed numeric range".into())
        }
    }
}

/// 逆2乗の引力で結ばれた2質点。重心は原点に静止し、相対位置 \(\mathbf{r} = \mathbf{r}_1 - \mathbf{r}_2\) を進める。
///
/// 相対運動は \(\mathbf{r}'' = -GM\,\mathbf{r}/r^3\)（\(GM = G(m_1 + m_2)\)）。各質点は
/// \(\mathbf{r}_1 = \frac{m_2}{M}\mathbf{r}\)、\(\mathbf{r}_2 = -\frac{m_1}{M}\mathbf{r}\) にある。
/// 厳密解は [`ergion_core::mechanics::kepler_state`] で、計器は相対位置の \(x\) 成分と、単位質量あたりの角運動量 \(h = x v_y - y v_x\) である。
struct TwoBody {
    method: Method,
    gm: f64,
    m1: f64,
    m2: f64,
    periapsis: f64,
    eccentricity: f64,
    state: [f64; 4],
    trail: Vec<(f64, f64)>,
}

impl TwoBody {
    fn new(method: Method, config: &Value) -> Result<Self, String> {
        let m1 = positive(config, "mass1", 2.0)?;
        let m2 = positive(config, "mass2", 1.0)?;
        let g = positive(config, "gravity", 1.0)?;
        let periapsis = positive(config, "periapsis", 1.0)?;
        let eccentricity = num(config, "eccentricity", 0.5)?;
        if !(0.0..0.95).contains(&eccentricity) {
            return Err("eccentricity must be in [0, 0.95)".into());
        }
        let gm = g * (m1 + m2);
        let speed = core::kepler_periapsis_speed(gm, periapsis, eccentricity);
        Ok(Self {
            method,
            gm,
            m1,
            m2,
            periapsis,
            eccentricity,
            state: [periapsis, 0.0, 0.0, speed],
            trail: vec![(periapsis, 0.0)],
        })
    }
}

impl LessonModel for TwoBody {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let gm = self.gm;
        self.method.step(&mut self.state, time, dt, |_, y, dy| {
            let r2 = y[0] * y[0] + y[1] * y[1];
            let r3 = r2 * r2.sqrt();
            dy[0] = y[2];
            dy[1] = y[3];
            dy[2] = -gm * y[0] / r3;
            dy[3] = -gm * y[1] / r3;
        });
        if !self.state.iter().all(|v| v.is_finite()) {
            return Err("step left the finite range".into());
        }
        self.trail.push((self.state[0], self.state[1]));
        if self.trail.len() > 4000 {
            let thinned: Vec<_> = self.trail.iter().step_by(2).copied().collect();
            self.trail = thinned;
        }
        Ok(())
    }

    fn state(&self, time: f64) -> ModelState {
        let exact = core::kepler_state(self.gm, self.periapsis, self.eccentricity, time);
        let [x, y, vx, vy] = self.state;
        ModelState {
            position: x,
            velocity: x * vy - y * vx,
            exact_position: exact[0],
            exact_velocity: exact[0] * exact[3] - exact[1] * exact[2],
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let total = self.m1 + self.m2;
        let (w1, w2) = (self.m2 / total, -self.m1 / total);
        let exact = core::kepler_state(self.gm, self.periapsis, self.eccentricity, time);
        let one: (Vec<f64>, Vec<f64>) = self.trail.iter().map(|p| (w1 * p.0, w1 * p.1)).unzip();
        let two: (Vec<f64>, Vec<f64>) = self.trail.iter().map(|p| (w2 * p.0, w2 * p.1)).unzip();
        let tail = self.trail.len().saturating_sub(40);
        let mut sector_x = vec![0.0];
        let mut sector_y = vec![0.0];
        for p in &self.trail[tail..] {
            sector_x.push(w1 * p.0);
            sector_y.push(w1 * p.1);
        }
        let a = self.periapsis / (1.0 - self.eccentricity);
        let b = a * (1.0 - self.eccentricity * self.eccentricity).sqrt();
        let angles = grid(0.0, 2.0 * std::f64::consts::PI, 181);
        let (ex, ey): (Vec<f64>, Vec<f64>) =
            angles.iter().map(|t| (w1 * a * (t.cos() - self.eccentricity), w1 * b * t.sin())).unzip();
        let [x, y, vx, vy] = self.state;
        let r = x.hypot(y);
        let mu = core::reduced_mass(self.m1, self.m2);
        let energy = 0.5 * mu * (vx * vx + vy * vy) - mu * self.gm / r;
        Some(
            Figure::new()
                .polygon("swept", sector_x, sector_y)
                .series("orbit1", "exact", ex.clone(), ey.clone())
                .series("orbit2", "exact", ex.iter().map(|v| v * w2 / w1).collect(), ey.iter().map(|v| v * w2 / w1).collect())
                .series("trail1", "numerical", one.0, one.1)
                .series("trail2", "numerical", two.0, two.1)
                .point("body1", "numerical", w1 * x, w1 * y)
                .point("body2", "numerical", w2 * x, w2 * y)
                .point("exact1", "exact", w1 * exact[0], w1 * exact[1])
                .point("center", "reference", 0.0, 0.0)
                .value("energy", energy)
                .value("separation", r),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::LessonSimulation;

    fn run(json: &str) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(json).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn constant_force_midpoint_is_exact_up_to_rounding() {
        let s = run(r#"{"schema_version":1,"kind":"mechanics/constant-force","method":"midpoint","dt":0.01,"steps":200,"mass":0.5,"force":2,"initial_position":1,"initial_velocity":0}"#);
        assert!((s.time - 2.0).abs() < 1e-12);
        assert!((s.exact_position - 9.0).abs() < 1e-12);
        assert!(s.position_error.abs() < 1e-10);
    }

    #[test]
    fn harmonic_rk4_error_is_small_and_euler_gains_energy() {
        let rk4 = run(r#"{"schema_version":1,"kind":"mechanics/harmonic","method":"rk4","dt":0.01,"steps":1000,"mass":1,"spring_constant":4,"initial_position":1,"initial_velocity":0}"#);
        assert!(rk4.position_error.abs() < 1e-7, "{}", rk4.position_error);
        let euler = run(r#"{"schema_version":1,"kind":"mechanics/harmonic","method":"euler","dt":0.01,"steps":1000,"mass":1,"spring_constant":4,"initial_position":1,"initial_velocity":0}"#);
        let frame = euler.frame.unwrap();
        assert!(frame.values["energy"] > frame.values["exact_energy"]);
    }

    #[test]
    fn damped_and_forced_track_their_exact_solutions() {
        let d = run(r#"{"schema_version":1,"kind":"mechanics/damped","method":"rk4","dt":0.01,"steps":1000,"mass":1,"spring_constant":4,"damping":0.4,"initial_position":1,"initial_velocity":0}"#);
        assert!(d.position_error.abs() < 1e-8);
        let f = run(r#"{"schema_version":1,"kind":"mechanics/forced","method":"rk4","dt":0.01,"steps":3000,"mass":1,"spring_constant":4,"damping":0.5,"force":1,"drive_frequency":2,"initial_position":0,"initial_velocity":0}"#);
        assert!(f.position_error.abs() < 1e-7);
    }

    #[test]
    fn two_body_rk4_keeps_the_angular_momentum() {
        let s = run(r#"{"schema_version":1,"kind":"mechanics/two-body","method":"rk4","dt":0.005,"steps":2052}"#);
        assert!((s.velocity - s.exact_velocity).abs() < 1e-6);
        assert!((s.exact_velocity - 4.5_f64.sqrt()).abs() < 1e-12);
    }

    #[test]
    fn resonance_figure_peaks_near_the_natural_frequency() {
        let f = figure("forced-resonance", &serde_json::json!({})).unwrap();
        assert!((f.values["amplitude"] - 1.0).abs() < 1e-12);
        assert!((f.values["natural_frequency"] - 2.0).abs() < 1e-12);
    }
}
