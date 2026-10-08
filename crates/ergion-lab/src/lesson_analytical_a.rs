//! 解析力学の単元の値。式は `ergion_core::analytical` の各関数の rustdoc にある。

use ergion_core::analytical as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, Method, ModelState, count, grid, num, positive, text};

/// この部分の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "constraints" => constraints(params),
        "virtual-work" => virtual_work(params),
        "euler-lagrange" => euler_lagrange(params),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "virtual-work" => Ok(Box::new(Incline::new(config, dt)?)),
        "euler-lagrange" => Ok(Box::new(Pendulum::new(config)?)),
        "noether" => Ok(Box::new(CentralForce::new(config)?)),
        _ => Err(format!("unknown unit {unit}")),
    }
}

fn angle(params: &Value, name: &str, default: f64, max: f64) -> Result<f64, String> {
    let degrees = num(params, name, default)?;
    if !(degrees > 0.0 && degrees < max) {
        return Err(format!("{name} must be in (0, {max})"));
    }
    Ok(degrees.to_radians())
}

/// 視線の方向 \((\cos\beta\cos\psi, \cos\beta\sin\psi, \sin\beta)\) から見た球面の正射影。戻り値は画面の \((x, y)\) と奥行き。
fn project(p: [f64; 3]) -> (f64, f64, f64) {
    let (psi, beta) = (0.35_f64, 0.35_f64);
    let e1 = [-psi.sin(), psi.cos(), 0.0];
    let e2 = [-beta.sin() * psi.cos(), -beta.sin() * psi.sin(), beta.cos()];
    let d = [beta.cos() * psi.cos(), beta.cos() * psi.sin(), beta.sin()];
    let dot = |a: [f64; 3]| a[0] * p[0] + a[1] * p[1] + a[2] * p[2];
    (dot(e1), dot(e2), dot(d))
}

/// 球面の上の曲線を、手前の部分（`reference`）と裏の部分（`muted`）に分けて加える。
fn sphere_curve(mut figure: Figure, name: &str, points: Vec<[f64; 3]>) -> Figure {
    let mut segment: (Vec<f64>, Vec<f64>) = (Vec::new(), Vec::new());
    let mut front: Option<bool> = None;
    for p in points {
        let (x, y, depth) = project(p);
        let visible = depth >= 0.0;
        if front.is_some_and(|f| f != visible) {
            let role = if front == Some(true) { "reference" } else { "muted" };
            let (lx, ly) = (*segment.0.last().unwrap(), *segment.1.last().unwrap());
            figure = figure.series(name, role, std::mem::take(&mut segment.0), std::mem::take(&mut segment.1));
            segment = (vec![lx], vec![ly]);
        }
        front = Some(visible);
        segment.0.push(x);
        segment.1.push(y);
    }
    let role = if front == Some(true) { "reference" } else { "muted" };
    figure.series(name, role, segment.0, segment.1)
}

/// 球面の座標網、一点の接ベクトル、中心差分のヤコビ行列の誤差。
fn constraints(params: &Value) -> Result<Figure, String> {
    let radius = positive(params, "radius", 2.0)?;
    let theta = num(params, "theta", std::f64::consts::PI / 3.0)?;
    let phi = num(params, "phi", std::f64::consts::PI / 6.0)?;
    let h = positive(params, "h", 1e-3)?;
    let exact = core::sphere_jacobian(radius, theta, phi);
    let map = |q: &[f64]| core::sphere_point(radius, q[0], q[1]).to_vec();
    let max_error = |step: f64| {
        let numeric = core::central_jacobian(map, &[theta, phi], step);
        (0..3).flat_map(|i| (0..2).map(move |j| (i, j))).map(|(i, j)| (numeric[i][j] - exact[i][j]).abs()).fold(0.0, f64::max)
    };
    let central = core::central_jacobian(map, &[theta, phi], h);

    let mut figure = Figure::new();
    let around = grid(0.0, 2.0 * std::f64::consts::PI, 121);
    for k in 1..6 {
        let t = std::f64::consts::PI * k as f64 / 6.0;
        figure = sphere_curve(figure, "grid", around.iter().map(|&p| core::sphere_point(radius, t, p)).collect());
    }
    let half = grid(0.0, std::f64::consts::PI, 61);
    for k in 0..12 {
        let p = std::f64::consts::PI * k as f64 / 6.0;
        figure = sphere_curve(figure, "grid", half.iter().map(|&t| core::sphere_point(radius, t, p)).collect());
    }
    figure = sphere_curve(figure, "theta_line", half.iter().map(|&t| core::sphere_point(radius, t, phi)).collect());
    figure = sphere_curve(figure, "phi_line", around.iter().map(|&p| core::sphere_point(radius, theta, p)).collect());
    for series in figure.series.iter_mut().filter(|s| s.name.ends_with("_line") && s.role == "reference") {
        series.role = "exact".into();
    }
    let outline: (Vec<f64>, Vec<f64>) = around.iter().map(|a| (radius * a.cos(), radius * a.sin())).unzip();
    figure = figure.series("outline", "reference", outline.0, outline.1);

    let point = core::sphere_point(radius, theta, phi);
    let (px, py, _) = project(point);
    let tip = |column: usize| {
        let end = [0, 1, 2].map(|i| point[i] + 0.5 * exact[i][column]);
        let (x, y, _) = project(end);
        (x, y)
    };
    figure = figure
        .point("point", "numerical", px, py)
        .arrow("d_theta", "vector", (px, py), tip(0))
        .arrow("d_phi", "vector", (px, py), tip(1));

    let steps: Vec<f64> = grid(-1.0, -4.0, 31).iter().map(|e| 10f64.powf(*e)).collect();
    let errors: Vec<f64> = steps.iter().map(|&s| max_error(s)).collect();
    let scale = errors[0] / (steps[0] * steps[0]);
    figure = figure
        .series("error", "numerical", steps.iter().map(|s| s.log10()).collect(), errors.clone())
        .series("square", "exact", steps.iter().map(|s| s.log10()).collect(), steps.iter().map(|s| scale * s * s).collect())
        .point("chosen", "numerical", h.log10(), max_error(h));

    let tangent_dot: f64 = (0..3).map(|i| exact[i][0] * exact[i][1]).sum();
    let metric = core::sphere_metric(radius, theta);
    Ok(figure
        .value("x", point[0])
        .value("y", point[1])
        .value("z", point[2])
        .value("dof", core::degrees_of_freedom(1, 1)? as f64)
        .value("dof_double", core::degrees_of_freedom(2, 4)? as f64)
        .value("max_error", max_error(h))
        .value("error_ratio", max_error(2.0 * h) / max_error(h))
        .value("tangent_dot", tangent_dot)
        .value("g_theta", metric[0])
        .value("g_phi", metric[1])
        .array("jacobian", exact.iter().flatten().copied().collect())
        .array("central", central.iter().flatten().copied().collect()))
}

/// 斜面の上の質点を水平な力 \(F\) で支えるときの仮想仕事 \(\delta W(F)\) と、釣り合いの力 \(F = mg\tan\alpha\)。
fn virtual_work(params: &Value) -> Result<Figure, String> {
    let mass = positive(params, "mass", 2.0)?;
    let gravity = positive(params, "gravity", 9.8)?;
    let alpha = angle(params, "angle", 30.0, 90.0)?;
    let hold = core::incline_holding_force(mass, gravity, alpha);
    let normal = core::incline_normal_force(mass, gravity, alpha);
    let dr = [alpha.cos(), -alpha.sin()];
    let work = |f: f64| core::virtual_work(&[normal[0] - f, normal[1] - mass * gravity], &dr);
    let forces = grid(0.0, 2.0 * hold, 81);
    Ok(Figure::new()
        .series("work", "exact", forces.clone(), forces.iter().map(|&f| work(f)).collect())
        .point("balance", "numerical", hold, work(hold))
        .value("holding_force", hold)
        .value("normal_force", normal[0].hypot(normal[1]))
        .value("acceleration", core::incline_acceleration(gravity, alpha))
        .value("constraint_work", core::virtual_work(&normal, &dr))
        .value("balance_work", work(hold))
        .value("gravity_work", core::virtual_work(&[0.0, -mass * gravity], &dr)))
}

/// 単振子の真の経路と、端を止めてずらした経路 \(q + \varepsilon\eta\) の離散的な作用 \(S(\varepsilon)\)。
fn euler_lagrange(params: &Value) -> Result<Figure, String> {
    let length = positive(params, "length", 1.0)?;
    let gravity = positive(params, "gravity", 1.0)?;
    let amplitude = angle(params, "amplitude", 90.0, 180.0)?;
    let n = count(params, "n", 400, 20_000)?;
    let period = core::pendulum_period(length, gravity, amplitude);
    let quarter = 0.25 * period;
    let dt = quarter / n as f64;
    let times = grid(0.0, quarter, n + 1);
    let path: Vec<f64> = times.iter().map(|&t| core::pendulum_angle(length, gravity, amplitude, t).0).collect();
    let eta: Vec<f64> = (0..=n).map(|i| (std::f64::consts::PI * i as f64 / n as f64).sin()).collect();
    let shifted = |e: f64| -> Vec<f64> { path.iter().zip(&eta).map(|(q, h)| q + e * h).collect() };
    let action = |e: f64| core::discrete_action(&shifted(e), dt, 1.0, length, gravity);
    let eps = grid(-0.5, 0.5, 101);
    let d = 1e-3;
    let slope = (action(d) - action(-d)) / (2.0 * d);
    let curvature = (action(d) - 2.0 * action(0.0) + action(-d)) / (d * d);
    let k = (0.5 * amplitude).sin();
    let mut figure = Figure::new().series("true_path", "exact", times.clone(), path.clone());
    for e in [-0.4, -0.2, 0.2, 0.4] {
        figure = figure.series("shifted", "muted", times.clone(), shifted(e));
    }
    Ok(figure
        .series("action", "numerical", eps.clone(), eps.iter().map(|&e| action(e)).collect())
        .point("stationary", "numerical", 0.0, action(0.0))
        .value("period", period)
        .value("small_period", 2.0 * std::f64::consts::PI * (length / gravity).sqrt())
        .value("modulus", k)
        .value("agm", core::arithmetic_geometric_mean(1.0, (1.0 - k * k).sqrt()))
        .value("elliptic_k", core::elliptic_k(k))
        .value("quarter", quarter)
        .value("action0", action(0.0))
        .value("slope", slope)
        .value("curvature", curvature)
        .value("action_plus", action(0.2))
        .value("action_minus", action(-0.2)))
}

/// なめらかな斜面を静止から滑る質点。斜面に沿った距離 \(s\) を \(s'' = g\sin\alpha\) で進める。
///
/// 厳密解は \(s = \frac{1}{2} g\sin\alpha\,t^2\)（[`ergion_core::analytical::incline_acceleration`]）。計器は \(s\) と \(s'\) である。
struct Incline {
    method: Method,
    mass: f64,
    gravity: f64,
    alpha: f64,
    acceleration: f64,
    length: f64,
    state: [f64; 2],
}

impl Incline {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        let method = Method::read(config, Method::Euler)?;
        let mass = positive(config, "mass", 2.0)?;
        let gravity = positive(config, "gravity", 9.8)?;
        let alpha = angle(config, "angle", 30.0, 90.0)?;
        let steps = num(config, "steps", 200.0)?;
        let acceleration = core::incline_acceleration(gravity, alpha);
        let final_time = steps * dt;
        Ok(Self {
            method,
            mass,
            gravity,
            alpha,
            acceleration,
            length: 1.1 * 0.5 * acceleration * final_time * final_time + 1.0,
            state: [0.0, 0.0],
        })
    }
}

impl LessonModel for Incline {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let a = self.acceleration;
        self.method.step(&mut self.state, time, dt, |_, y, dy| {
            dy[0] = y[1];
            dy[1] = a;
        });
        if self.state.iter().all(|v| v.is_finite()) { Ok(()) } else { Err("step left the finite range".into()) }
    }

    fn state(&self, time: f64) -> ModelState {
        ModelState {
            position: self.state[0],
            velocity: self.state[1],
            exact_position: 0.5 * self.acceleration * time * time,
            exact_velocity: self.acceleration * time,
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let (sa, ca) = self.alpha.sin_cos();
        let l = self.length;
        let top = (0.0, l * sa);
        let along = |s: f64| (top.0 + s * ca, top.1 - s * sa);
        let block = along(self.state[0].min(l));
        let exact = along((0.5 * self.acceleration * time * time).min(l));
        let mg = self.mass * self.gravity;
        let scale = 0.25 * l / mg;
        let normal = core::incline_normal_force(self.mass, self.gravity, self.alpha);
        let dr = [ca, -sa];
        let inertia = [-self.mass * self.acceleration * ca, self.mass * self.acceleration * sa];
        let total = [normal[0] + inertia[0], normal[1] - mg + inertia[1]];
        let to = |v: [f64; 2], k: f64| (block.0 + k * v[0], block.1 + k * v[1]);
        Some(
            Figure::new()
                .series("incline", "reference", vec![0.0, 0.0, l * ca, 0.0], vec![0.0, l * sa, 0.0, 0.0])
                .arrow("gravity", "vector", block, to([0.0, -mg], scale))
                .arrow("normal", "reference", block, to(normal, scale))
                .arrow("inertia", "difference", block, to(inertia, scale))
                .arrow("displacement", "exact", block, to(dr, 0.12 * l))
                .point("exact", "exact", exact.0, exact.1)
                .point("block", "numerical", block.0, block.1)
                .value("constraint_work", core::virtual_work(&normal, &dr))
                .value("dalembert_work", core::virtual_work(&total, &dr))
                .value("acceleration", self.acceleration),
        )
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        if (self.acceleration * final_time * final_time).is_finite() { Ok(()) } else { Err("parameters exceed numeric range".into()) }
    }
}

/// 静止から放した単振子。\(\theta'' = -\frac{g}{l}\sin\theta\) を選んだ方法で進め、\(\theta = 0\) を横切る時刻から周期を測る。
///
/// 厳密解は [`ergion_core::analytical::pendulum_angle`]、厳密な周期は [`ergion_core::analytical::pendulum_period`] である。
struct Pendulum {
    method: Method,
    length: f64,
    gravity: f64,
    amplitude: f64,
    state: [f64; 2],
    crossings: Vec<f64>,
}

impl Pendulum {
    fn new(config: &Value) -> Result<Self, String> {
        let amplitude = angle(config, "amplitude", 90.0, 180.0)?;
        Ok(Self {
            method: Method::read(config, Method::Euler)?,
            length: positive(config, "length", 1.0)?,
            gravity: positive(config, "gravity", 1.0)?,
            amplitude,
            state: [amplitude, 0.0],
            crossings: Vec::new(),
        })
    }
}

impl LessonModel for Pendulum {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let (g, l) = (self.gravity, self.length);
        let before = self.state[0];
        self.method.step(&mut self.state, time, dt, |_, y, dy| {
            dy[0] = y[1];
            dy[1] = core::pendulum_acceleration(g, l, y[0]);
        });
        if !self.state.iter().all(|v| v.is_finite()) {
            return Err("step left the finite range".into());
        }
        if let Some(t) = core::zero_crossing_time(time, before, time + dt, self.state[0]) {
            self.crossings.push(t);
        }
        Ok(())
    }

    fn state(&self, time: f64) -> ModelState {
        let (theta, omega) = core::pendulum_angle(self.length, self.gravity, self.amplitude, time);
        ModelState { position: self.state[0], velocity: self.state[1], exact_position: theta, exact_velocity: omega }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let l = self.length;
        let (theta, _) = core::pendulum_angle(l, self.gravity, self.amplitude, time);
        let bob = (l * self.state[0].sin(), -l * self.state[0].cos());
        let energy = 0.5 * l * l * self.state[1] * self.state[1] - self.gravity * l * self.state[0].cos();
        let exact_energy = -self.gravity * l * self.amplitude.cos();
        let mut figure = Figure::new()
            .series("rod", "reference", vec![0.0, bob.0], vec![0.0, bob.1])
            .series("vertical", "muted", vec![0.0, 0.0], vec![0.0, -1.15 * l])
            .point("pivot", "reference", 0.0, 0.0)
            .point("exact", "exact", l * theta.sin(), -l * theta.cos())
            .point("bob", "numerical", bob.0, bob.1)
            .value("period", core::pendulum_period(l, self.gravity, self.amplitude))
            .value("crossings", self.crossings.len() as f64)
            .value("energy", energy)
            .value("exact_energy", exact_energy);
        if let Some(period) = core::period_from_crossings(&self.crossings) {
            figure = figure.value("measured_period", period);
        }
        Some(figure)
    }
}

/// 逆2乗の引力 \(\mathbf{F} = -k\mathbf{r}/r^3\) を受ける平面の質点。古典的RK4 または速度 Verlet 法で進める。
///
/// 初期位置は \((r_0, 0)\)、初期速度は \((0, v_0)\)。計器はエネルギー
/// [`ergion_core::analytical::central_force_energy`] と、回転の Noether の保存量
/// [`ergion_core::analytical::noether_charge`]（角運動量）で、比べる値は初期値（厳密に保存する値）である。
struct CentralForce {
    verlet: bool,
    mass: f64,
    strength: f64,
    position: [f64; 2],
    velocity: [f64; 2],
    energy0: f64,
    momentum0: f64,
    semi_latus: f64,
    eccentricity: f64,
    trail: Vec<(f64, f64)>,
    max_energy_error: f64,
    max_momentum_error: f64,
}

impl CentralForce {
    fn new(config: &Value) -> Result<Self, String> {
        let verlet = match text(config, "method", "rk4") {
            "rk4" => false,
            "verlet" => true,
            other => return Err(format!("unknown method {other}")),
        };
        let mass = positive(config, "mass", 1.0)?;
        let strength = positive(config, "strength", 1.0)?;
        let r0 = positive(config, "radius", 1.0)?;
        let v0 = positive(config, "speed", 1.1)?;
        let position = [r0, 0.0];
        let velocity = [0.0, v0];
        let energy0 = core::central_force_energy(mass, strength, &position, &velocity);
        if energy0 >= 0.0 {
            return Err("speed must give a bound orbit (v0² < 2k/(m r0))".into());
        }
        let momentum0 = core::noether_charge(&velocity.map(|v| mass * v), &core::rotation_generator(&position));
        let semi_latus = momentum0 * momentum0 / (mass * strength);
        Ok(Self {
            verlet,
            mass,
            strength,
            position,
            velocity,
            energy0,
            momentum0,
            semi_latus,
            eccentricity: (semi_latus / r0 - 1.0).abs(),
            trail: vec![(r0, 0.0)],
            max_energy_error: 0.0,
            max_momentum_error: 0.0,
        })
    }

    fn energy(&self) -> f64 {
        core::central_force_energy(self.mass, self.strength, &self.position, &self.velocity)
    }

    fn momentum(&self) -> f64 {
        core::noether_charge(&self.velocity.map(|v| self.mass * v), &core::rotation_generator(&self.position))
    }
}

impl LessonModel for CentralForce {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let (k, m) = (self.strength, self.mass);
        if self.verlet {
            ergion_core::velocity_verlet_step(&mut self.position, &mut self.velocity, dt, |x, a| core::central_force_acceleration(k, m, x, a));
        } else {
            let mut y = [self.position[0], self.position[1], self.velocity[0], self.velocity[1]];
            Method::Rk4.step(&mut y, time, dt, |_, y, dy| {
                dy[0] = y[2];
                dy[1] = y[3];
                core::central_force_acceleration(k, m, &y[..2], &mut dy[2..]);
            });
            self.position = [y[0], y[1]];
            self.velocity = [y[2], y[3]];
        }
        if !self.position.iter().chain(&self.velocity).all(|v| v.is_finite()) {
            return Err("step left the finite range".into());
        }
        self.max_energy_error = self.max_energy_error.max((self.energy() - self.energy0).abs());
        self.max_momentum_error = self.max_momentum_error.max((self.momentum() - self.momentum0).abs());
        self.trail.push((self.position[0], self.position[1]));
        if self.trail.len() > 4000 {
            self.trail = self.trail.iter().step_by(2).copied().collect();
        }
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        ModelState { position: self.energy(), velocity: self.momentum(), exact_position: self.energy0, exact_velocity: self.momentum0 }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let angles = grid(0.0, 2.0 * std::f64::consts::PI, 241);
        let ellipse: (Vec<f64>, Vec<f64>) = angles
            .iter()
            .map(|&t| {
                let r = ergion_core::mechanics::conic_radius(self.semi_latus, self.eccentricity, t);
                (r * t.cos(), r * t.sin())
            })
            .unzip();
        let ellipse = if self.semi_latus < self.trail[0].0 {
            (ellipse.0.iter().map(|x| -x).collect(), ellipse.1)
        } else {
            ellipse
        };
        let trail: (Vec<f64>, Vec<f64>) = self.trail.iter().copied().unzip();
        let [x, y] = self.position;
        let r = x.hypot(y);
        let scale = 0.4 * r / self.velocity[0].hypot(self.velocity[1]);
        Some(
            Figure::new()
                .series("orbit", "exact", ellipse.0, ellipse.1)
                .series("trail", "numerical", trail.0, trail.1)
                .series("radius", "muted", vec![0.0, x], vec![0.0, y])
                .arrow("velocity", "vector", (x, y), (x + scale * self.velocity[0], y + scale * self.velocity[1]))
                .point("center", "reference", 0.0, 0.0)
                .point("body", "numerical", x, y)
                .value("energy", self.energy())
                .value("momentum", self.momentum())
                .value("max_energy_error", self.max_energy_error)
                .value("max_momentum_error", self.max_momentum_error),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::{LessonSimulation, lesson_figure};

    fn values(kind: &str, params: &str) -> std::collections::BTreeMap<String, f64> {
        let json = lesson_figure(&format!(r#"{{"kind":"{kind}","params":{params}}}"#)).unwrap();
        serde_json::from_str::<Figure>(&json).unwrap().values
    }

    fn run(json: &str) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(json).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn constraints_example() {
        let v = values("analytical/constraints", "{}");
        assert_eq!(v["dof"], 2.0);
        assert_eq!(v["dof_double"], 2.0);
        assert!((v["x"] - 1.5).abs() < 1e-14 && (v["z"] - 1.0).abs() < 1e-14);
        assert!(v["max_error"] < 1e-6 && v["max_error"] > 1e-9);
        assert!((v["error_ratio"] - 4.0).abs() < 1e-2);
        assert!(v["tangent_dot"].abs() < 1e-15);
        assert!((v["g_phi"] - 3.0).abs() < 1e-14);
    }

    #[test]
    fn virtual_work_example() {
        let v = values("analytical/virtual-work", "{}");
        assert!((v["holding_force"] - 19.6 / 3f64.sqrt()).abs() < 1e-12);
        assert!(v["constraint_work"].abs() < 1e-14 && v["balance_work"].abs() < 1e-13);
        assert!((v["gravity_work"] - 9.8).abs() < 1e-12);
        let mid = run(r#"{"schema_version":1,"kind":"analytical/virtual-work","method":"midpoint","dt":0.01,"steps":200}"#);
        assert!((mid.position - 9.8).abs() < 1e-10 && (mid.exact_position - 9.8).abs() < 1e-12);
        let euler = run(r#"{"schema_version":1,"kind":"analytical/virtual-work","dt":0.01,"steps":200}"#);
        assert!((euler.position - 9.751).abs() < 1e-10);
        let frame = euler.frame.unwrap();
        assert!(frame.values["constraint_work"].abs() < 1e-14 && frame.values["dalembert_work"].abs() < 1e-13);
    }

    #[test]
    fn euler_lagrange_example() {
        let v = values("analytical/euler-lagrange", "{}");
        assert!((v["period"] - 7.416_298_709_205_487).abs() < 1e-12);
        assert!(v["slope"].abs() < 1e-4 && v["curvature"] > 0.0);
        assert!(v["action_plus"] > v["action0"] && v["action_minus"] > v["action0"]);
        let rk4 = run(r#"{"schema_version":1,"kind":"analytical/euler-lagrange","method":"rk4","dt":0.01,"steps":1500}"#);
        assert!((rk4.position - rk4.exact_position).abs() < 1e-6);
        let f = rk4.frame.unwrap();
        assert_eq!(f.values["crossings"], 4.0);
        assert!((f.values["measured_period"] - f.values["period"]).abs() < 1e-4);
        let euler = run(r#"{"schema_version":1,"kind":"analytical/euler-lagrange","dt":0.01,"steps":1500}"#);
        assert!(euler.frame.unwrap().values["measured_period"] > 7.43);
    }

    #[test]
    fn noether_example() {
        let cfg = |m: &str| format!(r#"{{"schema_version":1,"kind":"analytical/noether","method":"{m}","dt":0.3,"steps":3000}}"#);
        let (rk4, verlet) = (run(&cfg("rk4")), run(&cfg("verlet")));
        assert!((rk4.exact_position + 0.395).abs() < 1e-15 && (rk4.exact_velocity - 1.1).abs() < 1e-15);
        assert!((verlet.velocity - 1.1).abs() < 1e-12);
        assert!(rk4.velocity_error < -9e-3);
        let max = verlet.frame.unwrap().values["max_energy_error"];
        assert!(max < 6e-3 && rk4.position_error < -1.8 * max);
    }

    #[test]
    fn other_units_are_unknown() {
        assert!(figure("hamilton", &Value::Null).unwrap_err().starts_with("unknown unit"));
        assert!(model("hamilton", &Value::Null, 0.1).err().unwrap().starts_with("unknown unit"));
    }
}
