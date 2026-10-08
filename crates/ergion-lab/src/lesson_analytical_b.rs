//! 解析力学の単元の値。式は `ergion_core::analytical` の各関数の rustdoc にある。
//!
//! - `hamilton`: 単振子の正準方程式をシンプレクティック Euler 法、古典的RK4、速度 Verlet 法で進め、等エネルギー線と比べる。
//! - `liouville`: 単振子の相空間の多数の点を進め、それらが囲む多角形の面積を靴ひもの公式で求める。
//! - `poisson`: Poisson 括弧を中心差分で計算し、厳密な値と比べる。単振動の作用・角変数の図を返す。

use std::f64::consts::PI;

use ergion_core::analytical as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, Method, ModelState, count, grid, num, positive, text};

/// 一つの線に返す点の数の上限。
const MAX_POINTS: usize = 400;

/// この部分の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "poisson" => poisson(params),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "hamilton" => Ok(Box::new(Hamilton::new(config, dt)?)),
        "liouville" => Ok(Box::new(Liouville::new(config, dt)?)),
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

/// 点の列を間引いて、二つの座標の列にする。
fn split(points: &[[f64; 2]]) -> (Vec<f64>, Vec<f64>) {
    let index = thinned(points.len());
    (index.iter().map(|&i| points[i][0]).collect(), index.iter().map(|&i| points[i][1]).collect())
}

/// 単振子の質量 \(m\)、長さ \(l\)、重力加速度 \(g\)。
#[derive(Clone, Copy)]
struct Pendulum {
    mass: f64,
    length: f64,
    gravity: f64,
}

impl Pendulum {
    fn read(config: &Value) -> Result<Self, String> {
        Ok(Self {
            mass: positive(config, "mass", 1.0)?,
            length: positive(config, "length", 1.0)?,
            gravity: positive(config, "gravity", 1.0)?,
        })
    }

    fn inertia(self) -> f64 {
        self.mass * self.length * self.length
    }

    fn energy(self, q: f64, p: f64) -> f64 {
        core::pendulum_hamiltonian(self.mass, self.length, self.gravity, q, p)
    }

    fn flow(self, q: f64, p: f64) -> [f64; 2] {
        core::pendulum_flow(self.mass, self.length, self.gravity, q, p)
    }

    /// 選んだ方法で \((\theta, p)\) を1ステップ進める。
    fn step(self, method: Integrator, q: &mut f64, p: &mut f64, time: f64, dt: f64) {
        let inertia = self.inertia();
        let mgl = self.mass * self.gravity * self.length;
        match method {
            Integrator::Euler => {
                let [dq, dp] = self.flow(*q, *p);
                *q += dt * dq;
                *p += dt * dp;
            }
            Integrator::SymplecticEuler => core::symplectic_euler_step(q, p, dt, |p| p / inertia, |q| -mgl * q.sin()),
            Integrator::Verlet => {
                let mut position = [*q];
                let mut velocity = [*p / inertia];
                let ratio = self.gravity / self.length;
                ergion_core::velocity_verlet_step(&mut position, &mut velocity, dt, |x, a| a[0] = -ratio * x[0].sin());
                *q = position[0];
                *p = inertia * velocity[0];
            }
            Integrator::Rk4 => {
                let mut state = [*q, *p];
                Method::Rk4.step(&mut state, time, dt, |_, y, out| out.copy_from_slice(&self.flow(y[0], y[1])));
                *q = state[0];
                *p = state[1];
            }
        }
    }

    /// 分離線 \(H = 2mgl\) の上下の枝。
    fn separatrix(self, figure: Figure) -> Figure {
        let (q, p) = core::pendulum_level_set(self.mass, self.length, self.gravity, 2.0 * self.mass * self.gravity * self.length, 161);
        let lower = p.iter().map(|v| -v).collect();
        figure.series("separatrix-upper", "muted", q.clone(), p).series("separatrix-lower", "muted", q, lower)
    }
}

#[derive(Clone, Copy, PartialEq)]
enum Integrator {
    Euler,
    SymplecticEuler,
    Verlet,
    Rk4,
}

impl Integrator {
    fn read(config: &Value, default: &str, allowed: &[&str]) -> Result<Self, String> {
        let name = text(config, "method", default);
        if !allowed.contains(&name) {
            return Err(format!("unknown method {name}"));
        }
        Ok(match name {
            "euler" => Integrator::Euler,
            "symplectic-euler" => Integrator::SymplecticEuler,
            "verlet" => Integrator::Verlet,
            _ => Integrator::Rk4,
        })
    }
}

/// 振幅 \(\theta_0\) で静止から放した単振子の正準方程式。
struct Hamilton {
    method: Integrator,
    pendulum: Pendulum,
    amplitude: f64,
    energy0: f64,
    q: f64,
    p: f64,
    trail: Vec<[f64; 2]>,
    drift: Vec<[f64; 2]>,
}

impl Hamilton {
    fn new(config: &Value, _dt: f64) -> Result<Self, String> {
        let method = Integrator::read(config, "symplectic-euler", &["symplectic-euler", "rk4", "verlet"])?;
        let pendulum = Pendulum::read(config)?;
        let amplitude = num(config, "amplitude", 1.0)?;
        if !(amplitude > 0.0 && amplitude < PI) {
            return Err("amplitude must be in (0, π)".into());
        }
        let energy0 = pendulum.energy(amplitude, 0.0);
        Ok(Self { method, pendulum, amplitude, energy0, q: amplitude, p: 0.0, trail: vec![[amplitude, 0.0]], drift: vec![[0.0, 0.0]] })
    }

    fn exact(&self, time: f64) -> (f64, f64) {
        let pd = self.pendulum;
        let (theta, omega) = core::pendulum_angle(pd.length, pd.gravity, self.amplitude, time);
        (theta, core::pendulum_momentum(pd.mass, pd.length, omega))
    }
}

impl LessonModel for Hamilton {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        self.pendulum.step(self.method, &mut self.q, &mut self.p, time, dt);
        self.trail.push([self.q, self.p]);
        self.drift.push([time + dt, self.pendulum.energy(self.q, self.p) - self.energy0]);
        Ok(())
    }

    fn state(&self, time: f64) -> ModelState {
        let (q, p) = self.exact(time);
        ModelState { position: self.q, velocity: self.p, exact_position: q, exact_velocity: p }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let pd = self.pendulum;
        let (eq, ep) = self.exact(time);
        let (lq, lp) = core::pendulum_level_set(pd.mass, pd.length, pd.gravity, self.energy0, 241);
        let (tq, tp) = split(&self.trail);
        let (dt, de) = split(&self.drift);
        let max_error = self.drift.iter().map(|d| d[1].abs()).fold(0.0, f64::max);
        let l = pd.length;
        let energy = pd.energy(self.q, self.p);
        Some(
            Figure::new()
                .series("phase-exact", "exact", lq, lp)
                .series("phase-trail", "numerical", tq, tp)
                .series("energy-error", "numerical", dt, de)
                .series("rod", "reference", vec![0.0, l * self.q.sin()], vec![0.0, -l * self.q.cos()])
                .point("phase", "numerical", self.q, self.p)
                .point("energy-now", "numerical", time, energy - self.energy0)
                .point("phase-exact", "exact", eq, ep)
                .point("pivot", "muted", 0.0, 0.0)
                .point("bob", "numerical", l * self.q.sin(), -l * self.q.cos())
                .point("bob-exact", "exact", l * eq.sin(), -l * eq.cos())
                .value("length", l)
                .value("momentum_max", ep.abs().max(lp_max(pd, self.energy0)))
                .value("energy", energy)
                .value("exact_energy", self.energy0)
                .value("energy_error", energy - self.energy0)
                .value("max_energy_error", max_error),
        )
    }
}

/// 等エネルギー線の上の運動量の最大値 \(\sqrt{2ml^2E}\)。
fn lp_max(pd: Pendulum, energy: f64) -> f64 {
    (2.0 * pd.inertia() * energy).sqrt()
}

/// 単振子の相空間で、円に内接する正多角形の頂点を同時に進める。
struct Liouville {
    method: Integrator,
    pendulum: Pendulum,
    q: Vec<f64>,
    p: Vec<f64>,
    q0: Vec<f64>,
    p0: Vec<f64>,
    center: [f64; 2],
    area0: f64,
    dt: f64,
    history: Vec<[f64; 2]>,
}

impl Liouville {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        let method = Integrator::read(config, "euler", &["euler", "symplectic-euler", "rk4"])?;
        let pendulum = Pendulum::read(config)?;
        let cq = num(config, "center_q", 1.0)?;
        let cp = num(config, "center_p", 0.0)?;
        let radius = positive(config, "radius", 0.5)?;
        let n = count(config, "points", 400, 4000)?;
        if n < 3 {
            return Err("points must be at least 3".into());
        }
        let (q, p) = core::circle_polygon(cq, cp, radius, n);
        let area0 = core::shoelace_area(&q, &p);
        Ok(Self { method, pendulum, q0: q.clone(), p0: p.clone(), q, p, center: [cq, cp], area0, dt, history: vec![[0.0, 1.0]] })
    }

    fn area(&self) -> f64 {
        core::shoelace_area(&self.q, &self.p)
    }
}

fn closed(v: &[f64]) -> Vec<f64> {
    let mut out = v.to_vec();
    out.push(v[0]);
    out
}

impl LessonModel for Liouville {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        for i in 0..self.q.len() {
            self.pendulum.step(self.method, &mut self.q[i], &mut self.p[i], time, dt);
        }
        let [mut cq, mut cp] = self.center;
        self.pendulum.step(self.method, &mut cq, &mut cp, time, dt);
        self.center = [cq, cp];
        self.history.push([time + dt, self.area() / self.area0]);
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let area = self.area();
        ModelState { position: area, velocity: area / self.area0, exact_position: self.area0, exact_velocity: 1.0 }
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        let steps = final_time / self.dt;
        if steps * self.q.len() as f64 > 4.0e7 {
            return Err("points × steps must be at most 4e7".into());
        }
        Ok(())
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let pd = self.pendulum;
        let area = self.area();
        let (ht, hr) = split(&self.history);
        let [cq, cp] = self.center;
        let figure = Figure::new()
            .polygon("region", self.q.clone(), self.p.clone())
            .series("initial", "muted", closed(&self.q0), closed(&self.p0))
            .series("outline", "numerical", closed(&self.q), closed(&self.p))
            .series("area-exact", "exact", vec![0.0, time], vec![1.0, 1.0])
            .series("area-ratio", "numerical", ht, hr)
            .point("center", "numerical", cq, cp)
            .point("area-now", "numerical", time, area / self.area0)
            .value("area", area)
            .value("area0", self.area0)
            .value("ratio", area / self.area0)
            .value("divergence", core::flow_divergence(|q, p| pd.flow(q, p), cq, cp, 1e-4))
            .value("euler_factor", core::pendulum_euler_area_factor(pd.length, pd.gravity, self.dt, self.q0.iter().sum::<f64>() / self.q0.len() as f64))
            .value("separatrix_p", lp_max(pd, 2.0 * pd.mass * pd.gravity * pd.length));
        Some(pd.separatrix(figure))
    }
}

/// Poisson 括弧と作用・角変数の図。
fn poisson(params: &Value) -> Result<Figure, String> {
    let mass = positive(params, "mass", 1.0)?;
    let omega = positive(params, "omega", 2.0)?;
    let h = positive(params, "h", 1e-4)?;
    let mut figure = Figure::new();

    let one = |f: fn(&[f64], &[f64]) -> f64, g: fn(&[f64], &[f64]) -> f64| core::poisson_bracket(f, g, &[0.7], &[-0.3], h);
    figure = figure
        .value("qp", one(|q, _| q[0], |_, p| p[0]))
        .value("qq", one(|q, _| q[0], |q, _| q[0]))
        .value("pp", one(|_, p| p[0], |_, p| p[0]));

    let samples: [[f64; 6]; 4] = [
        [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        [0.5, -1.0, 2.0, 1.5, 0.0, -2.0],
        [-2.0, 0.3, 1.0, 0.7, -1.2, 0.4],
        [3.0, 1.0, -1.0, -0.5, 2.0, 1.0],
    ];
    let component = |k: usize| move |q: &[f64], p: &[f64]| core::angular_momentum_components([q[0], q[1], q[2]], [p[0], p[1], p[2]])[k];
    let mut lxly = Vec::new();
    let mut lz = Vec::new();
    let mut flat = Vec::new();
    for s in &samples {
        let (r, p) = (&s[..3], &s[3..]);
        lxly.push(core::poisson_bracket(component(0), component(1), r, p, h));
        lz.push(core::angular_momentum_components([s[0], s[1], s[2]], [s[3], s[4], s[5]])[2]);
        flat.extend_from_slice(s);
    }
    let lz_error = lxly.iter().zip(&lz).map(|(a, b)| (a - b).abs()).fold(0.0, f64::max);
    figure = figure.array("samples", flat).array("lxly", lxly).array("lz", lz).value("lz_error", lz_error);

    let (angle, action) = core::action_angle(mass, omega, 1.0, 0.0);
    figure = figure.value("angle", angle).value("action", action).value("radius", (2.0 * action).sqrt());

    let points: [[f64; 2]; 4] = [[1.0, 0.0], [0.6, -0.8], [-0.4, 1.1], [-1.3, -0.5]];
    let mut theta_action = Vec::new();
    for s in &points {
        theta_action.push(core::poisson_bracket(
            |q, p| core::action_angle(mass, omega, q[0], p[0]).0,
            |q, p| core::action_angle(mass, omega, q[0], p[0]).1,
            &s[..1],
            &s[1..],
            h,
        ));
    }
    let mut inverse = Vec::new();
    let angles: [[f64; 2]; 4] = [[PI / 2.0, 1.0], [0.4, 1.5], [2.0, 0.5], [-1.0, 2.0]];
    for s in &angles {
        inverse.push(core::poisson_bracket(
            |a, b| core::action_angle_inverse(mass, omega, a[0], b[0]).0,
            |a, b| core::action_angle_inverse(mass, omega, a[0], b[0]).1,
            &s[..1],
            &s[1..],
            h,
        ));
    }
    let flat_points: Vec<f64> = points.iter().flatten().copied().collect();
    let flat_angles: Vec<f64> = angles.iter().flatten().copied().collect();
    figure = figure
        .array("points", flat_points)
        .array("theta_action", theta_action)
        .array("angles", flat_angles)
        .array("qp_inverse", inverse);

    let thetas = grid(0.0, 2.0 * PI, 161);
    let scale = (mass * omega).sqrt();
    for (k, level) in [0.5, 1.0, 1.5, 2.0].iter().enumerate() {
        let (q, p): (Vec<f64>, Vec<f64>) = thetas.iter().map(|&t| core::action_angle_inverse(mass, omega, t, *level)).unzip();
        let x = q.iter().map(|v| scale * v).collect();
        let y = p.iter().map(|v| v / scale).collect();
        figure = figure.series(&format!("ellipse{}", k + 1), "exact", q, p).series(&format!("circle{}", k + 1), "exact", x, y);
    }
    let period = 2.0 * PI / omega;
    for j in 0..8 {
        let t = period * j as f64 / 8.0;
        let (q, p) = core::action_angle_inverse(mass, omega, angle + omega * t, action);
        figure = figure.point(&format!("q{j}"), "numerical", q, p).point(&format!("c{j}"), "numerical", scale * q, p / scale);
    }
    Ok(figure.value("period", period).value("scale", scale))
}

#[cfg(test)]
mod tests {
    use crate::lesson::{LessonSimulation, lesson_figure};
    use serde_json::Value;

    fn run(config: &str) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(config).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn hamilton_first_step_and_energy_drift() {
        let base = r#""schema_version":1,"kind":"analytical/hamilton","dt":0.1"#;
        let one = run(&format!("{{{base},\"steps\":1,\"method\":\"symplectic-euler\"}}"));
        assert!((one.velocity + 0.1 * 1f64.sin()).abs() < 1e-15);
        assert!((one.position - (1.0 - 0.01 * 1f64.sin())).abs() < 1e-15);
        let mut errors = Vec::new();
        for method in ["symplectic-euler", "rk4", "verlet"] {
            let end = run(&format!("{{{base},\"steps\":300,\"method\":\"{method}\"}}"));
            let v = &end.frame.unwrap().values;
            errors.push((v["max_energy_error"], v["energy_error"]));
        }
        println!("{errors:?}");
        assert!(errors[0].0 < 0.05);
        assert!(errors[1].0 < 1e-4);
        assert!(errors[2].0 < 5e-3);
    }

    #[test]
    fn liouville_area_by_method() {
        let base = r#""schema_version":1,"kind":"analytical/liouville","dt":0.05,"steps":400"#;
        let mut ratios = Vec::new();
        for method in ["euler", "symplectic-euler", "rk4"] {
            let end = run(&format!("{{{base},\"method\":\"{method}\"}}"));
            let v = end.frame.unwrap().values;
            ratios.push((v["ratio"], v["area0"], v["divergence"], v["euler_factor"]));
        }
        println!("{ratios:?}");
        assert!(ratios[0].0 > 1.5);
        assert!((ratios[1].0 - 1.0).abs() < 1e-3);
        assert!((ratios[2].0 - 1.0).abs() < 1e-3);
        assert!(ratios[1].2.abs() < 1e-9);
        let fine = run(&format!("{{{base},\"method\":\"symplectic-euler\",\"points\":1600}}")).frame.unwrap().values["ratio"];
        println!("{fine}");
        assert!((fine - 1.0).abs() < 0.1 * (ratios[1].0 - 1.0).abs());
    }

    #[test]
    fn poisson_brackets_match_exact_values() {
        let json = lesson_figure(r#"{"kind":"analytical/poisson"}"#).unwrap();
        let figure: Value = serde_json::from_str(&json).unwrap();
        let v = &figure["values"];
        println!("{v}");
        assert!((v["qp"].as_f64().unwrap() - 1.0).abs() < 1e-12);
        assert!(v["lz_error"].as_f64().unwrap() < 1e-9);
        assert_eq!(figure["arrays"]["lz"][0].as_f64().unwrap(), -3.0);
        assert_eq!(v["action"].as_f64().unwrap(), 1.0);
        for k in ["theta_action", "qp_inverse"] {
            for b in figure["arrays"][k].as_array().unwrap() {
                assert!((b.as_f64().unwrap() - 1.0).abs() < 1e-7);
            }
        }
    }
}
