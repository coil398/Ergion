//! 統計学の単元の値。式は `ergion_core::statistics` の各関数の rustdoc にある。
//!
//! 擬似乱数を使う単元は、計算条件の `seed`（既定 1）から [`core::Rng`] を作る。同じ種からは同じ標本が出る。

use std::f64::consts::PI;

use ergion_core::statistics::{self as core, Rng, Welford};
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, ModelState, count, grid, num, positive, text};

/// 標本・平均・分散のページの標本 \(x_1, \ldots, x_8\)。\(\bar{x} = 5\)、\(s^2 = 32/7\)。
const SAMPLE: [f64; 8] = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];

/// 線形回帰のページの標本 \((x_i, y_i)\)。\(\hat{\beta}_1 = 0.6\)、\(\hat{\beta}_0 = 2.2\)、\(R^2 = 0.6\)。
const REG_X: [f64; 5] = [1.0, 2.0, 3.0, 4.0, 5.0];
const REG_Y: [f64; 5] = [2.0, 4.0, 5.0, 4.0, 5.0];

/// 主成分分析のページの標本 \((x_i, y_i)\)。共分散行列は \(a = 10\)、\(b = 6\)、\(c = 5\)、固有値は 14 と 1。
const PCA_X: [f64; 5] = [1.0, 3.0, 5.0, 7.0, 9.0];
const PCA_Y: [f64; 5] = [3.0, 5.0, 6.0, 9.0, 7.0];

/// 統計学の単元の図。
///
/// - `sample-stats`: 8 個の標本の点、標本平均、\(\bar{x} \pm s\) の帯。`method` は `two-pass`（二パスの公式）か `welford`（Welford の逐次更新）。
/// - `limit-theorems`: 率 1 の指数分布の擬似乱数の標本平均の推移と、標準化した標本平均のヒストグラム。
/// - `regression`: 5 点の散布図、回帰直線、残差の線分。
/// - `pca`: 5 点の散布図、主成分の軸、第1主成分の軸への射影、主成分得点。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "sample-stats" => sample_stats(params),
        "limit-theorems" => limit_theorems(params),
        "regression" => Ok(regression()),
        "pca" => Ok(pca()),
        _ => Err(format!("unknown statistics unit {unit}")),
    }
}

/// 統計学の単元の時間発展。`monte-carlo` は1ステップごとに単位正方形へ点を加え、円周率を推定する。
pub fn model(unit: &str, config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "monte-carlo" => Ok(Box::new(MonteCarlo::new(config)?)),
        _ => Err(format!("unknown statistics unit {unit}")),
    }
}

/// 種を読む。0 以上 \(2^{53}\) 以下の整数。
fn seed(params: &Value) -> Result<u64, String> {
    let value = num(params, "seed", 1.0)?;
    if !(value >= 0.0 && value.fract() == 0.0 && value <= 9_007_199_254_740_992.0) {
        return Err("seed must be an integer in [0, 2^53]".into());
    }
    Ok(value as u64)
}

fn sample_stats(params: &Value) -> Result<Figure, String> {
    let method = text(params, "method", "two-pass");
    let mut fig = Figure::new();
    for (i, &x) in SAMPLE.iter().enumerate() {
        let height = SAMPLE[..i].iter().filter(|&&v| v == x).count() + 1;
        fig = fig.point(&format!("data-{i}"), "numerical", x, height as f64);
    }
    let (mean, variance) = match method {
        "two-pass" => {
            let mean = core::mean(&SAMPLE);
            let deviations: Vec<f64> = SAMPLE.iter().map(|x| x - mean).collect();
            let squares: Vec<f64> = deviations.iter().map(|d| d * d).collect();
            fig = fig.value("square_sum", squares.iter().sum()).array("deviations", deviations).array("squares", squares);
            (mean, core::variance_two_pass(&SAMPLE))
        }
        "welford" => {
            let mut w = Welford::new();
            let (mut deltas, mut means, mut m2) = (vec![], vec![], vec![]);
            for &x in &SAMPLE {
                deltas.push(w.push(x));
                means.push(w.mean());
                m2.push(w.m2());
            }
            fig = fig.value("square_sum", w.m2()).array("deltas", deltas).array("means", means).array("m2", m2);
            (w.mean(), core::variance_welford(&SAMPLE))
        }
        other => return Err(format!("unknown method {other}")),
    };
    let sd = variance.sqrt();
    let top = 4.0;
    Ok(fig
        .polygon("band", vec![mean - sd, mean + sd, mean + sd, mean - sd], vec![0.0, 0.0, top, top])
        .series("mean", "numerical", vec![mean, mean], vec![0.0, top])
        .series("band-lower", "muted", vec![mean - sd, mean - sd], vec![0.0, top])
        .series("band-upper", "muted", vec![mean + sd, mean + sd], vec![0.0, top])
        .array("data", SAMPLE.to_vec())
        .value("n", SAMPLE.len() as f64)
        .value("mean", mean)
        .value("variance", variance)
        .value("sd", sd)
        .value("method_gap", core::variance_two_pass(&SAMPLE) - core::variance_welford(&SAMPLE)))
}

fn limit_theorems(params: &Value) -> Result<Figure, String> {
    let seed = seed(params)?;
    let n_max = count(params, "n_max", 800, 100_000)?;
    let group = count(params, "group_size", 30, 1000)?;
    let groups = count(params, "groups", 2000, 20_000)?;
    let epsilon = positive(params, "epsilon", 0.5)?;
    let (mu, sigma2) = (1.0, 1.0);
    let mut rng = Rng::new(seed);

    let xs: Vec<f64> = (0..n_max).map(|_| rng.exponential(1.0)).collect();
    let running = core::running_means(&xs);
    let ns: Vec<f64> = (1..=n_max).map(|n| n as f64).collect();
    let upper = ns.iter().map(|n| mu + 2.0 * (sigma2 / n).sqrt()).collect();
    let lower = ns.iter().map(|n| mu - 2.0 * (sigma2 / n).sqrt()).collect();

    let scale = (sigma2 / group as f64).sqrt();
    let mut far = 0usize;
    let zs: Vec<f64> = (0..groups)
        .map(|_| {
            let sample: Vec<f64> = (0..group).map(|_| rng.exponential(1.0)).collect();
            let m = core::mean(&sample);
            if (m - mu).abs() >= epsilon {
                far += 1;
            }
            (m - mu) / scale
        })
        .collect();
    let (lo, hi, bins) = (-4.0, 4.0, 32);
    let width = (hi - lo) / bins as f64;
    let counts = core::histogram(&zs, lo, hi, bins);
    let mut edges = Vec::with_capacity(2 * bins);
    for j in 0..bins {
        edges.push(lo + j as f64 * width);
        edges.push(lo + (j + 1) as f64 * width);
    }
    let density = counts.iter().map(|&c| c as f64 / (groups as f64 * width)).collect();
    let zgrid = grid(lo, hi, 201);
    let phi = zgrid.iter().map(|&z| core::standard_normal_density(z)).collect();
    let within = zs.iter().filter(|z| z.abs() <= 1.0).count() as f64 / groups as f64;

    Ok(Figure::new()
        .series("band-upper", "muted", ns.clone(), upper)
        .series("band-lower", "muted", ns.clone(), lower)
        .series("mu", "exact", vec![1.0, n_max as f64], vec![mu, mu])
        .series("running-mean", "numerical", ns, running.clone())
        .bars("z-histogram", "numerical", edges, density)
        .series("normal-density", "exact", zgrid, phi)
        .value("seed", seed as f64)
        .value("mu", mu)
        .value("sigma2", sigma2)
        .value("n_max", n_max as f64)
        .value("final_mean", *running.last().unwrap())
        .value("mean_100", running[running.len().min(100) - 1])
        .value("group_size", group as f64)
        .value("groups", groups as f64)
        .value("epsilon", epsilon)
        .value("chebyshev", core::chebyshev_bound(sigma2, group as f64, epsilon))
        .value("deviation_fraction", far as f64 / groups as f64)
        .value("deviation_count", far as f64)
        .value("normal_far", 1.0 - core::standard_normal_probability(-epsilon / scale, epsilon / scale))
        .value("z_mean", core::mean(&zs))
        .value("z_variance", core::variance_two_pass(&zs))
        .value("within_one", within)
        .value("normal_within_one", core::standard_normal_probability(-1.0, 1.0)))
}

fn regression() -> Figure {
    let fit = core::linear_regression(&REG_X, &REG_Y);
    let mut fig = Figure::new();
    for (i, ((&x, &y), &f)) in REG_X.iter().zip(&REG_Y).zip(&fit.fitted).enumerate() {
        fig = fig.series(&format!("residual-{i}"), "difference", vec![x, x], vec![y, f]);
    }
    let line_x = vec![0.0, 6.0];
    let line_y = line_x.iter().map(|x| fit.intercept + fit.slope * x).collect();
    fig = fig.series("fit", "numerical", line_x, line_y);
    for (i, (&x, &y)) in REG_X.iter().zip(&REG_Y).enumerate() {
        fig = fig.point(&format!("data-{i}"), "text", x, y);
    }
    fig.point("mean", "reference", fit.mean_x, fit.mean_y)
        .value("intercept", fit.intercept)
        .value("slope", fit.slope)
        .value("mean_x", fit.mean_x)
        .value("mean_y", fit.mean_y)
        .value("sxx", fit.sxx)
        .value("sxy", fit.sxy)
        .value("tss", fit.syy)
        .value("rss", fit.rss)
        .value("ess", fit.ess)
        .value("r2", fit.r_squared)
        .array("x", REG_X.to_vec())
        .array("y", REG_Y.to_vec())
        .array("fitted", fit.fitted)
        .array("residuals", fit.residuals)
}

fn pca() -> Figure {
    let [a, b, c] = core::covariance_2x2(&PCA_X, &PCA_Y);
    let eigen = core::symmetric_eigen_2x2(a, b, c);
    let [l1, l2] = eigen.values;
    let [v1, v2] = eigen.vectors;
    let (mx, my) = (core::mean(&PCA_X), core::mean(&PCA_Y));
    let scores: Vec<(f64, f64)> = PCA_X
        .iter()
        .zip(&PCA_Y)
        .map(|(x, y)| {
            let (dx, dy) = (x - mx, y - my);
            (dx * v1[0] + dy * v1[1], dx * v2[0] + dy * v2[1])
        })
        .collect();
    let reach = 6.0;
    let mut fig = Figure::new()
        .series("axis1", "muted", vec![mx - reach * v1[0], mx + reach * v1[0]], vec![my - reach * v1[1], my + reach * v1[1]])
        .series("axis2", "muted", vec![mx - reach * v2[0], mx + reach * v2[0]], vec![my - reach * v2[1], my + reach * v2[1]]);
    for (i, ((&x, &y), &(z1, _))) in PCA_X.iter().zip(&PCA_Y).zip(&scores).enumerate() {
        let foot = (mx + z1 * v1[0], my + z1 * v1[1]);
        fig = fig.series(&format!("projection-{i}"), "difference", vec![x, foot.0], vec![y, foot.1]);
    }
    for (i, (&x, &y)) in PCA_X.iter().zip(&PCA_Y).enumerate() {
        fig = fig.point(&format!("data-{i}"), "text", x, y);
    }
    for (i, &(z1, z2)) in scores.iter().enumerate() {
        fig = fig.point(&format!("score-{i}"), "numerical", z1, z2);
    }
    let (s1, s2) = (l1.sqrt(), l2.sqrt());
    fig.point("mean", "reference", mx, my)
        .arrow("pc1", "numerical", (mx, my), (mx + s1 * v1[0], my + s1 * v1[1]))
        .arrow("pc2", "vector", (mx, my), (mx + s2 * v2[0], my + s2 * v2[1]))
        .value("a", a)
        .value("b", b)
        .value("c", c)
        .value("mean_x", mx)
        .value("mean_y", my)
        .value("lambda1", l1)
        .value("lambda2", l2)
        .value("ratio1", l1 / (l1 + l2))
        .value("ratio2", l2 / (l1 + l2))
        .value("v1x", v1[0])
        .value("v1y", v1[1])
        .value("v2x", v2[0])
        .value("v2y", v2[1])
        .array("scores1", scores.iter().map(|s| s.0).collect())
        .array("scores2", scores.iter().map(|s| s.1).collect())
}

/// 図に描く点の数の上限。推定には、この数を超えた点も使う。
const SHOWN_POINTS: usize = 6000;

/// 単位正方形に点を加えながら円周率を推定する。
///
/// 推移の系列の横軸は、点の数 \(N\) を千個単位で表した値 \(N/1000\) である。
/// 計算の初めに \(k\) 個（`points_per_step`）の点を打ち、1ステップごとに \(k\) 個を加える。
/// 計器の `position` は推定値 \(\hat{\pi}_N\)、`velocity` は標準誤差 \(\mathrm{SE}\)、`exact_position` は \(\pi\)、
/// `exact_velocity` は母標準偏差から求めた \(\sigma_g/\sqrt{N}\) である。式は [`core::pi_estimate`] にある。
struct MonteCarlo {
    rng: Rng,
    seed: u64,
    per_step: usize,
    samples: u64,
    inside: u64,
    shown_in: (Vec<f64>, Vec<f64>),
    shown_out: (Vec<f64>, Vec<f64>),
    history: Vec<(f64, f64, f64)>,
}

impl MonteCarlo {
    fn new(config: &Value) -> Result<Self, String> {
        let seed = seed(config)?;
        let per_step = count(config, "points_per_step", 20, 1000)?;
        if per_step < 2 {
            return Err("points_per_step must be at least 2".into());
        }
        let mut model = Self {
            rng: Rng::new(seed),
            seed,
            per_step,
            samples: 0,
            inside: 0,
            shown_in: (vec![], vec![]),
            shown_out: (vec![], vec![]),
            history: vec![],
        };
        model.add_points();
        Ok(model)
    }

    fn add_points(&mut self) {
        for _ in 0..self.per_step {
            let (x, y) = (self.rng.uniform(), self.rng.uniform());
            let inside = core::inside_quarter_circle(x, y);
            self.samples += 1;
            if inside {
                self.inside += 1;
            }
            if self.shown_in.0.len() + self.shown_out.0.len() < SHOWN_POINTS {
                let target = if inside { &mut self.shown_in } else { &mut self.shown_out };
                target.0.push(x);
                target.1.push(y);
            }
        }
        let e = core::pi_estimate(self.inside, self.samples);
        self.history.push((self.samples as f64, e.estimate, e.standard_error));
        if self.history.len() > 2000 {
            let last = *self.history.last().unwrap();
            let mut thinned: Vec<_> = self.history.iter().step_by(2).copied().collect();
            if thinned.last() != Some(&last) {
                thinned.push(last);
            }
            self.history = thinned;
        }
    }
}

impl LessonModel for MonteCarlo {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        self.add_points();
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let e = core::pi_estimate(self.inside, self.samples);
        ModelState {
            position: e.estimate,
            velocity: e.standard_error,
            exact_position: PI,
            exact_velocity: core::standard_error(core::pi_indicator_sd(), self.samples as f64),
        }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let e = core::pi_estimate(self.inside, self.samples);
        let angles = grid(0.0, 0.5 * PI, 91);
        let thousands: Vec<f64> = self.history.iter().map(|h| h.0 / 1000.0).collect();
        let sd = core::pi_indicator_sd();
        Some(
            Figure::new()
                .series("inside", "numerical", self.shown_in.0.clone(), self.shown_in.1.clone())
                .series("outside", "reference", self.shown_out.0.clone(), self.shown_out.1.clone())
                .series("arc", "exact", angles.iter().map(|t| t.cos()).collect(), angles.iter().map(|t| t.sin()).collect())
                .series("band-upper", "muted", thousands.clone(), self.history.iter().map(|h| PI + h.2).collect())
                .series("band-lower", "muted", thousands.clone(), self.history.iter().map(|h| PI - h.2).collect())
                .series("pi", "exact", vec![thousands[0], *thousands.last().unwrap()], vec![PI, PI])
                .series("estimate", "numerical", thousands.clone(), self.history.iter().map(|h| h.1).collect())
                .series("se", "numerical", thousands.clone(), self.history.iter().map(|h| h.2).collect())
                .series("se-exact", "exact", thousands, self.history.iter().map(|h| core::standard_error(sd, h.0)).collect())
                .value("seed", self.seed as f64)
                .value("samples", self.samples as f64)
                .value("inside", self.inside as f64)
                .value("estimate", e.estimate)
                .value("standard_error", e.standard_error)
                .value("shown", (self.shown_in.0.len() + self.shown_out.0.len()) as f64),
        )
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        if final_time.is_finite() { Ok(()) } else { Err("final time must be finite".into()) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::LessonSimulation;

    #[test]
    fn sample_stats_methods_agree_with_the_hand_values() {
        for method in ["two-pass", "welford"] {
            let f = figure("sample-stats", &serde_json::json!({ "method": method })).unwrap();
            assert_eq!(f.values["mean"], 5.0);
            assert!((f.values["variance"] - 32.0 / 7.0).abs() < 1e-14);
            assert!((f.values["square_sum"] - 32.0).abs() < 1e-13);
        }
        let w = figure("sample-stats", &serde_json::json!({ "method": "welford" })).unwrap();
        assert_eq!(w.arrays["means"][..3], [2.0, 3.0, 10.0 / 3.0]);
        assert!(figure("sample-stats", &serde_json::json!({ "method": "naive" })).is_err());
    }

    #[test]
    fn limit_theorems_converge_and_respect_chebyshev() {
        let f = figure("limit-theorems", &serde_json::json!({})).unwrap();
        assert!((f.values["final_mean"] - 1.0).abs() < 0.1);
        assert!((f.values["chebyshev"] - 2.0 / 15.0).abs() < 1e-15);
        assert!(f.values["deviation_fraction"] <= f.values["chebyshev"]);
        assert!(f.values["z_mean"].abs() < 0.1);
        assert!((f.values["z_variance"] - 1.0).abs() < 0.15);
        assert!((f.values["within_one"] - 0.6827).abs() < 0.04);
    }

    #[test]
    fn regression_and_pca_return_the_hand_values() {
        let r = figure("regression", &serde_json::json!({})).unwrap();
        assert!((r.values["slope"] - 0.6).abs() < 1e-15);
        assert!((r.values["intercept"] - 2.2).abs() < 1e-15);
        assert!((r.values["r2"] - 0.6).abs() < 1e-14);
        let p = figure("pca", &serde_json::json!({})).unwrap();
        assert!((p.values["lambda1"] - 14.0).abs() < 1e-14);
        assert!((p.values["lambda2"] - 1.0).abs() < 1e-14);
        assert!((p.values["ratio1"] - 14.0 / 15.0).abs() < 1e-15);
        let scores = &p.arrays["scores1"];
        assert!((scores[4] - 14.0 / 13f64.sqrt()).abs() < 1e-14);
    }

    #[test]
    fn monte_carlo_counts_points_and_is_reproducible() {
        let json = r#"{"schema_version":1,"kind":"statistics/monte-carlo","dt":1,"steps":200,"points_per_step":20,"seed":1}"#;
        let a = LessonSimulation::new(json).unwrap().run_to_end().unwrap();
        let b = LessonSimulation::new(json).unwrap().run_to_end().unwrap();
        assert_eq!(a, b);
        let frame = a.frame.unwrap();
        assert_eq!(frame.values["samples"], 4020.0);
        assert_eq!(a.position, 4.0 * frame.values["inside"] / 4020.0);
        assert!((a.position - PI).abs() < 4.0 * a.velocity);
        assert_eq!(a.exact_position, PI);
    }
}
