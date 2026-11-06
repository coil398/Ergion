//! 微分方程式の単元の値。式は `ergion_core::differential` の各関数の rustdoc にある。

use std::collections::VecDeque;

use ergion_core::differential as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, Method, ModelState, count, grid, num, positive, text};

/// 一つの線に返す点の数の上限。
const MAX_POINTS: usize = 400;

/// 微分方程式の単元の図。
///
/// - `sturm-liouville`: \(-x'' = \lambda x\)、\(x(0) = x(L) = 0\) の固有値をシューティング法で探し、
///   正規化した固有関数 \(n = 1, \ldots, 4\)、残差 \(x(L; \lambda)\) の曲線、固有関数どうしの内積の表を返す。
///   `search` は `bisection`（二分法）か `secant`（割線法）。
/// - `chaos`: Lorenz 方程式の固定点 \(C_+\) と、原点の Jacobi 行列の固有値。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "sturm-liouville" => sturm_liouville(params),
        "chaos" => {
            let sigma = positive(params, "sigma", 10.0)?;
            let rho = positive(params, "rho", 28.0)?;
            let beta = positive(params, "beta", 8.0 / 3.0)?;
            if rho <= 1.0 {
                return Err("rho must exceed 1".into());
            }
            let [plus, _] = core::lorenz_fixed_points(rho, beta);
            let mut residual = [0.0; 3];
            core::lorenz_derivative(sigma, rho, beta, &plus, &mut residual);
            let [e1, e2, e3] = core::lorenz_origin_eigenvalues(sigma, rho, beta);
            Ok(Figure::new()
                .value("fixed_x", plus[0])
                .value("fixed_y", plus[1])
                .value("fixed_z", plus[2])
                .value("fixed_square", plus[0] * plus[0])
                .value("fixed_residual", residual.iter().map(|v| v * v).sum::<f64>().sqrt())
                .value("eigen1", e1)
                .value("eigen2", e2)
                .value("eigen3", e3))
        }
        _ => Err(format!("unknown ode unit {unit}")),
    }
}

fn sturm_liouville(params: &Value) -> Result<Figure, String> {
    let length = positive(params, "length", std::f64::consts::PI)?;
    let steps = count(params, "steps", 200, 2000)?;
    if steps % 2 == 1 || steps < 8 {
        return Err("steps must be an even number of at least 8".into());
    }
    let search = match text(params, "search", "bisection") {
        "bisection" => core::RootSearch::Bisection,
        "secant" => core::RootSearch::Secant,
        other => return Err(format!("unknown search {other}")),
    };
    let mut figure = Figure::new().value("steps", steps as f64);
    let mut modes = Vec::new();
    let mut lambdas = Vec::new();
    for n in 1..=4 {
        let (lambda, iterations) = core::shooting_eigenvalue(n, length, steps, search);
        let (t, x) = core::shooting_profile(lambda, length, steps);
        let norm = core::grid_inner_product(&x, &x, length).sqrt();
        let phi: Vec<f64> = x.iter().map(|v| v / norm).collect();
        let exact: Vec<f64> = t.iter().map(|&s| core::dirichlet_eigenfunction(n, length, s)).collect();
        let peaks: Vec<usize> = (1..phi.len() - 1).filter(|&i| phi[i] > 0.0 && phi[i] >= phi[i - 1] && phi[i] > phi[i + 1]).collect();
        let peak = peaks[((n - 1) / 2).min(peaks.len() - 1)];
        let exact_lambda = core::dirichlet_eigenvalue(n, length);
        figure = figure
            .series(&format!("mode{n}"), "numerical", thin(&t), thin(&phi))
            .series(&format!("exact{n}"), "exact", thin(&t), thin(&exact))
            .point(&format!("peak{n}"), "numerical", t[peak], phi[peak])
            .point(&format!("root{n}"), "numerical", lambda, 0.0)
            .point(&format!("exact_root{n}"), "exact", exact_lambda, 0.0)
            .value(&format!("lambda{n}"), lambda)
            .value(&format!("exact_lambda{n}"), exact_lambda)
            .value(&format!("iterations{n}"), iterations as f64)
            .value(&format!("nodes{n}"), core::interior_nodes(&phi) as f64);
        lambdas.push(lambda);
        modes.push(phi);
    }
    let mut gram = Vec::with_capacity(16);
    for a in &modes {
        for b in &modes {
            gram.push(core::grid_inner_product(a, b, length));
        }
    }
    let top = 1.25 * lambdas[3];
    let ls = grid(0.0, top, 241);
    let residual: Vec<f64> = ls.iter().map(|&l| core::shooting_residual(l, length, steps)).collect();
    let (_, x1) = core::shooting_profile(lambdas[0], length, steps);
    let (_, x2) = core::shooting_profile(lambdas[1], length, steps);
    Ok(figure
        .series("residual", "numerical", ls, residual)
        .value("cross12", core::grid_inner_product(&x1, &x2, length))
        .value("norm1", core::grid_inner_product(&x1, &x1, length))
        .array("gram", gram))
}

/// 列を、最後の値を残して高々 [`MAX_POINTS`] 点に間引く。
fn thin<T: Copy>(values: &[T]) -> Vec<T> {
    if values.len() <= MAX_POINTS {
        return values.to_vec();
    }
    let stride = values.len().div_ceil(MAX_POINTS - 1);
    let mut out: Vec<T> = values.iter().step_by(stride).copied().collect();
    if (values.len() - 1) % stride != 0 {
        out.push(values[values.len() - 1]);
    }
    out
}

/// 微分方程式の単元の時間発展。
///
/// - `chaos`: Lorenz 方程式の2本の軌道。2本目は初期値の \(x\) を \(\delta\) だけずらす。タブは `euler`、`midpoint`、`rk4`。
/// - `heat`: 熱伝導方程式の格子の温度。タブは `ftcs`、`crank-nicolson`。
/// - `wave`: 両端固定の弦の変位。タブは `leapfrog`。
pub fn model(unit: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "chaos" => Ok(Box::new(Lorenz::new(config)?)),
        "heat" => Ok(Box::new(Heat::new(config, dt)?)),
        "wave" => Ok(Box::new(Wave::new(config, dt)?)),
        _ => Err(format!("unknown ode unit {unit}")),
    }
}

/// Lorenz 方程式の2本の軌道。状態は \((x_1, y_1, z_1, x_2, y_2, z_2)\) で、二つは互いに独立に進む。
///
/// 厳密解はない。計器の「厳密解」の欄には、初期値をずらした2本目の軌道を置く。
struct Lorenz {
    method: Method,
    sigma: f64,
    rho: f64,
    beta: f64,
    state: [f64; 6],
    recent: VecDeque<[f64; 4]>,
    separation: Vec<(f64, f64)>,
    /// 2本の軌道の距離がはじめて 1 以上になった時刻。
    reach_one: Option<f64>,
}

impl Lorenz {
    fn new(config: &Value) -> Result<Self, String> {
        let method = Method::read(config, Method::Euler)?;
        let sigma = positive(config, "sigma", 10.0)?;
        let rho = positive(config, "rho", 28.0)?;
        let beta = positive(config, "beta", 8.0 / 3.0)?;
        let x0 = num(config, "initial_x", 1.0)?;
        let y0 = num(config, "initial_y", 1.0)?;
        let z0 = num(config, "initial_z", 1.0)?;
        let delta = num(config, "perturbation", 1e-6)?;
        if delta == 0.0 {
            return Err("perturbation must be nonzero".into());
        }
        let state = [x0, y0, z0, x0 + delta, y0, z0];
        let mut model = Self { method, sigma, rho, beta, state, recent: VecDeque::new(), separation: Vec::new(), reach_one: None };
        model.record(0.0);
        Ok(model)
    }

    fn distance(&self) -> f64 {
        let s = &self.state;
        ((s[0] - s[3]).powi(2) + (s[1] - s[4]).powi(2) + (s[2] - s[5]).powi(2)).sqrt()
    }

    fn record(&mut self, time: f64) {
        let s = self.state;
        self.recent.push_back([s[0], s[2], s[3], s[5]]);
        while self.recent.len() > MAX_POINTS {
            self.recent.pop_front();
        }
        let distance = self.distance();
        if distance >= 1.0 && self.reach_one.is_none() {
            self.reach_one = Some(time);
        }
        self.separation.push((time, distance.max(1e-300).log10()));
        if self.separation.len() > 4 * MAX_POINTS {
            self.separation = self.separation.iter().step_by(2).copied().collect();
        }
    }
}

impl LessonModel for Lorenz {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let (sigma, rho, beta) = (self.sigma, self.rho, self.beta);
        self.method.step(&mut self.state, time, dt, |_, y, dy| {
            core::lorenz_derivative(sigma, rho, beta, &y[0..3], &mut dy[0..3]);
            core::lorenz_derivative(sigma, rho, beta, &y[3..6], &mut dy[3..6]);
        });
        if !self.state.iter().all(|v| v.is_finite() && v.abs() < 1e12) {
            return Err("数値解が有限の範囲を超えました。時間刻みを小さくしてください。".into());
        }
        self.record(time + dt);
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let s = self.state;
        ModelState { position: s[0], velocity: s[2], exact_position: s[3], exact_velocity: s[5] }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let recent: Vec<[f64; 4]> = self.recent.iter().copied().collect();
        let recent = thin(&recent);
        let [plus, minus] = core::lorenz_fixed_points(self.rho, self.beta);
        let separation = thin(&self.separation);
        let s = self.state;
        let distance = self.distance();
        let mut figure = Figure::new()
            .series("trail1", "numerical", recent.iter().map(|p| p[0]).collect(), recent.iter().map(|p| p[1]).collect())
            .series("trail2", "exact", recent.iter().map(|p| p[2]).collect(), recent.iter().map(|p| p[3]).collect())
            .series("separation", "numerical", separation.iter().map(|p| p.0).collect(), separation.iter().map(|p| p.1).collect())
            .point("now1", "numerical", s[0], s[2])
            .point("now2", "exact", s[3], s[5])
            .value("separation", distance)
            .value("log_separation", distance.max(1e-300).log10())
            .value("y1", s[1])
            .value("y2", s[4]);
        if plus[0].is_finite() {
            figure = figure.point("fixed_plus", "reference", plus[0], plus[2]).point("fixed_minus", "reference", minus[0], minus[2]);
        }
        if let Some(t) = self.reach_one {
            figure = figure.value("time_to_one", t);
        }
        Some(figure)
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum HeatMethod {
    Ftcs,
    CrankNicolson,
}

/// 熱伝導方程式 \(u_t = \kappa u_{xx}\) の格子の温度。両端は 0 で、初期値はモード \(n = 1, 3, 5\) の和。
struct Heat {
    method: HeatMethod,
    kappa: f64,
    length: f64,
    modes: Vec<(usize, f64)>,
    ratio: f64,
    u: Vec<f64>,
}

impl Heat {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        let method = match text(config, "method", "ftcs") {
            "ftcs" => HeatMethod::Ftcs,
            "crank-nicolson" => HeatMethod::CrankNicolson,
            other => return Err(format!("unknown method {other}")),
        };
        let kappa = positive(config, "kappa", 0.01)?;
        let length = positive(config, "length", 1.0)?;
        let cells = count(config, "cells", 40, 200)?;
        if cells % 2 == 1 || cells < 4 {
            return Err("cells must be an even number of at least 4".into());
        }
        let modes = vec![(1, num(config, "a1", 1.0)?), (3, num(config, "a3", 0.5)?), (5, num(config, "a5", 0.25)?)];
        let dx = length / cells as f64;
        let u = (0..=cells).map(|j| core::heat_fourier_solution(&modes, kappa, length, j as f64 * dx, 0.0)).collect();
        Ok(Self { method, kappa, length, modes, ratio: core::heat_ratio(kappa, dt, dx), u })
    }

    fn exact(&self, x: f64, time: f64) -> f64 {
        core::heat_fourier_solution(&self.modes, self.kappa, self.length, x, time)
    }

    fn dx(&self) -> f64 {
        self.length / (self.u.len() - 1) as f64
    }
}

impl LessonModel for Heat {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        match self.method {
            HeatMethod::Ftcs => core::ftcs_step(&mut self.u, self.ratio),
            HeatMethod::CrankNicolson => core::crank_nicolson_step(&mut self.u, self.ratio),
        }
        if self.u.iter().all(|v| v.is_finite() && v.abs() < 1e200) {
            Ok(())
        } else {
            Err("数値解が有限の範囲を超えました。FTCS 法は r ≤ 1/2 で安定です。".into())
        }
    }

    fn state(&self, time: f64) -> ModelState {
        let mid = self.u.len() / 2;
        ModelState {
            position: self.u[mid],
            velocity: self.ratio,
            exact_position: self.exact(0.5 * self.length, time),
            exact_velocity: self.ratio,
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let dx = self.dx();
        let xs: Vec<f64> = (0..self.u.len()).map(|j| j as f64 * dx).collect();
        let fine = grid(0.0, self.length, 201);
        let max_error = xs.iter().zip(&self.u).map(|(&x, &u)| (u - self.exact(x, time)).abs()).fold(0.0, f64::max);
        Some(
            Figure::new()
                .series("initial", "muted", fine.clone(), fine.iter().map(|&x| self.exact(x, 0.0)).collect())
                .series("exact", "exact", fine.clone(), fine.iter().map(|&x| self.exact(x, time)).collect())
                .series("numerical", "numerical", xs, self.u.clone())
                .value("ratio", self.ratio)
                .value("ftcs_stable", if self.ratio <= 0.5 + 1e-12 { 1.0 } else { 0.0 })
                .value("max_error", max_error)
                .value("dx", dx),
        )
    }
}

/// 両端固定の弦の変位 \(u_{tt} = c^2 u_{xx}\)。初期形は三角形、初速度は 0。中心差分法で進める。
struct Wave {
    length: f64,
    speed: f64,
    pluck: f64,
    height: f64,
    courant: f64,
    previous: Vec<f64>,
    current: Vec<f64>,
    started: bool,
}

impl Wave {
    fn new(config: &Value, dt: f64) -> Result<Self, String> {
        match text(config, "method", "leapfrog") {
            "leapfrog" => {}
            other => return Err(format!("unknown method {other}")),
        }
        let length = positive(config, "length", 1.0)?;
        let speed = positive(config, "speed", 0.25)?;
        let cells = count(config, "cells", 100, 200)?;
        if cells % 2 == 1 || cells < 4 {
            return Err("cells must be an even number of at least 4".into());
        }
        let pluck = num(config, "pluck", 0.5)?;
        if !(pluck > 0.0 && pluck < length) {
            return Err("pluck must lie strictly inside (0, L)".into());
        }
        let height = num(config, "height", 1.0)?;
        let dx = length / cells as f64;
        let current: Vec<f64> = (0..=cells).map(|j| core::plucked_string(j as f64 * dx, length, pluck, height)).collect();
        Ok(Self {
            length,
            speed,
            pluck,
            height,
            courant: core::wave_courant(speed, dt, dx),
            previous: current.clone(),
            current,
            started: false,
        })
    }

    fn shape(&self) -> impl Fn(f64) -> f64 + '_ {
        move |x| core::plucked_string(x, self.length, self.pluck, self.height)
    }

    fn exact(&self, x: f64, time: f64) -> f64 {
        core::wave_dalembert(self.shape(), self.length, self.speed, x, time)
    }
}

impl LessonModel for Wave {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        let next = if self.started {
            core::leapfrog_step(&self.previous, &self.current, self.courant)
        } else {
            core::leapfrog_start(&self.current, self.courant)
        };
        self.started = true;
        self.previous = std::mem::replace(&mut self.current, next);
        if self.current.iter().all(|v| v.is_finite() && v.abs() < 1e200) {
            Ok(())
        } else {
            Err("数値解が有限の範囲を超えました。中心差分法は C ≤ 1 で安定です。".into())
        }
    }

    fn state(&self, time: f64) -> ModelState {
        let mid = self.current.len() / 2;
        ModelState {
            position: self.current[mid],
            velocity: self.courant,
            exact_position: self.exact(0.5 * self.length, time),
            exact_velocity: self.courant,
        }
    }

    fn frame(&self, time: f64) -> Option<Figure> {
        let dx = self.length / (self.current.len() - 1) as f64;
        let xs: Vec<f64> = (0..self.current.len()).map(|j| j as f64 * dx).collect();
        let fine = grid(0.0, self.length, 301);
        let parts: Vec<(f64, f64)> =
            fine.iter().map(|&x| core::wave_dalembert_parts(self.shape(), self.length, self.speed, x, time)).collect();
        let max_error = xs.iter().zip(&self.current).map(|(&x, &u)| (u - self.exact(x, time)).abs()).fold(0.0, f64::max);
        Some(
            Figure::new()
                .series("right", "muted", fine.clone(), parts.iter().map(|p| p.0).collect())
                .series("left", "reference", fine.clone(), parts.iter().map(|p| p.1).collect())
                .series("exact", "exact", fine, parts.iter().map(|p| p.0 + p.1).collect())
                .series("numerical", "numerical", xs, self.current.clone())
                .value("courant", self.courant)
                .value("stable", if self.courant <= 1.0 + 1e-12 { 1.0 } else { 0.0 })
                .value("max_error", max_error),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::LessonSimulation;
    use serde_json::json;

    fn run(json: &str) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(json).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn sturm_liouville_figure_returns_n_squared_and_an_identity_gram_matrix() {
        let f = figure("sturm-liouville", &json!({})).unwrap();
        for n in 1..=4 {
            let lambda = f.values[&format!("lambda{n}")];
            assert!((lambda - (n * n) as f64).abs() < 1e-5, "{n} {lambda}");
            assert_eq!(f.values[&format!("nodes{n}")], (n - 1) as f64);
        }
        let gram = &f.arrays["gram"];
        for i in 0..4 {
            for j in 0..4 {
                let want = if i == j { 1.0 } else { 0.0 };
                assert!((gram[4 * i + j] - want).abs() < 1e-6, "{i} {j} {}", gram[4 * i + j]);
            }
        }
        assert!(f.values["cross12"].abs() < 1e-6);
        assert!((f.values["norm1"] - std::f64::consts::FRAC_PI_2).abs() < 1e-6);
        let secant = figure("sturm-liouville", &json!({"search": "secant"})).unwrap();
        assert!(secant.values["iterations1"] < f.values["iterations1"]);
        assert!(f.series.iter().all(|s| s.x.len() <= MAX_POINTS));
    }

    #[test]
    fn chaos_figure_has_six_root_two_and_the_origin_eigenvalues() {
        let f = figure("chaos", &json!({})).unwrap();
        assert!((f.values["fixed_x"] - 72.0_f64.sqrt()).abs() < 1e-12);
        assert!((f.values["fixed_z"] - 27.0).abs() < 1e-12);
        assert!(f.values["fixed_residual"] < 1e-12);
        assert!((f.values["eigen1"] - (-11.0 + 1201.0_f64.sqrt()) / 2.0).abs() < 1e-12);
    }

    #[test]
    fn lorenz_trajectories_separate_exponentially() {
        let s = run(r#"{"schema_version":1,"kind":"ode/chaos","method":"rk4","dt":0.01,"steps":3000}"#);
        let frame = s.frame.unwrap();
        assert!(frame.values["separation"] > 1.0, "{}", frame.values["separation"]);
        let t = frame.values["time_to_one"];
        assert!((5.0..30.0).contains(&t), "{t}");
        assert!(frame.series.iter().all(|s| s.x.len() <= MAX_POINTS));
    }

    #[test]
    fn heat_schemes_track_the_fourier_solution_and_ftcs_blows_up_above_one_half() {
        let ftcs = run(r#"{"schema_version":1,"kind":"ode/heat","method":"ftcs","dt":0.025,"steps":200}"#);
        let hand = (-std::f64::consts::PI.powi(2) / 20.0).exp() - 0.5 * (-9.0 * std::f64::consts::PI.powi(2) / 20.0).exp()
            + 0.25 * (-25.0 * std::f64::consts::PI.powi(2) / 20.0).exp();
        assert!((ftcs.exact_position - hand).abs() < 1e-12);
        assert!(ftcs.position_error.abs() < 2e-3);
        assert!((ftcs.velocity - 0.4).abs() < 1e-12);
        let cn = run(r#"{"schema_version":1,"kind":"ode/heat","method":"crank-nicolson","dt":0.025,"steps":200}"#);
        assert!(cn.position_error.abs() < 2e-3);
        let unstable = run(r#"{"schema_version":1,"kind":"ode/heat","method":"ftcs","dt":0.04,"steps":400}"#);
        assert!(unstable.frame.unwrap().values["max_error"] > 1e3);
        let implicit = run(r#"{"schema_version":1,"kind":"ode/heat","method":"crank-nicolson","dt":0.04,"steps":400}"#);
        assert!(implicit.frame.unwrap().values["max_error"] < 1e-2);
    }

    #[test]
    fn wave_with_courant_one_is_exact_and_returns_after_one_period() {
        let exact = run(r#"{"schema_version":1,"kind":"ode/wave","dt":0.04,"steps":200}"#);
        assert!((exact.velocity - 1.0).abs() < 1e-12);
        assert!((exact.exact_position - 1.0).abs() < 1e-12);
        assert!(exact.frame.unwrap().values["max_error"] < 1e-9);
        let half = run(r#"{"schema_version":1,"kind":"ode/wave","dt":0.04,"steps":100}"#);
        assert!((half.exact_position + 1.0).abs() < 1e-12);
        let default = run(r#"{"schema_version":1,"kind":"ode/wave","dt":0.032,"steps":250}"#);
        assert!(default.position_error.abs() < 0.1, "{}", default.position_error);
    }
}
