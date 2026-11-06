//! 微分積分の単元（Taylor 展開、偏微分、重積分、数値微分、数値積分）の値。
//! 式は `ergion_core::calculus` の各関数の rustdoc にある。

use std::f64::consts::PI;

use ergion_core::calculus as core;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, count, grid, num, positive, text};

/// 微分積分の単元の図。
///
/// - `taylor`: \(e^x\) と Taylor 多項式 \(P_1, \ldots, P_4\)、選んだ次数 `degree` の \(P_n\)、点 `x` での差と剰余項の上界。
/// - `partial`: \(f(x, y) = x^2 + 3xy\) の等高線、勾配の矢印、点 \((a, b)\) での中心差分の偏導関数。
/// - `multiple-integral`: \([0, 1]^2\) 上の \(xy\) の中点の格子和、単位円板の面積の格子和と極座標の和。
/// - `numerical-differentiation`: \(\sin\) の \(x = 1\) での前進差分または中心差分（`method`）と、刻み \(h\) に対する誤差。
/// - `numerical-integration`: \(\int_0^\pi \sin x\,dx\) の台形則または Simpson 則（`method`）と、分割数に対する誤差。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "taylor" => taylor(params),
        "partial" => partial(params),
        "multiple-integral" => multiple_integral(params),
        "numerical-differentiation" => numerical_differentiation(params),
        "numerical-integration" => numerical_integration(params),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// 微分積分の単元の時間発展。この5単元は時間発展を持たない。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown unit {unit}"))
}

fn log10_abs(values: &[f64]) -> Vec<f64> {
    values.iter().map(|v| v.abs().log10()).collect()
}

fn taylor(params: &Value) -> Result<Figure, String> {
    let n = count(params, "degree", 3, 10)?;
    let x = num(params, "x", 1.0)?;
    if x.abs() > 3.0 {
        return Err("x must be in [-3, 3]".into());
    }
    let xs = grid(-3.0, 3.0, 241);
    let curve = |k: usize| xs.iter().map(|&t| core::exp_taylor_polynomial(t, k)).collect::<Vec<_>>();
    let mut figure = Figure::new().series("exp", "exact", xs.clone(), xs.iter().map(|t| t.exp()).collect());
    for k in 1..=4 {
        if k != n {
            figure = figure.series(&format!("p{k}"), "muted", xs.clone(), curve(k));
        }
    }
    let polynomial = core::exp_taylor_polynomial(x, n);
    let degrees: Vec<usize> = (0..=10).collect();
    let table_polynomial: Vec<f64> = degrees.iter().map(|&k| core::exp_taylor_polynomial(x, k)).collect();
    let table_difference: Vec<f64> = table_polynomial.iter().map(|p| x.exp() - p).collect();
    let table_bound: Vec<f64> = degrees.iter().map(|&k| core::exp_taylor_remainder_bound(x, k)).collect();
    let nonzero: Vec<usize> = (0..degrees.len()).filter(|&i| table_difference[i] != 0.0 && table_bound[i] > 0.0).collect();
    let pick = |values: &[f64]| nonzero.iter().map(|&i| values[i]).collect::<Vec<_>>();
    let degree_axis: Vec<f64> = nonzero.iter().map(|&i| degrees[i] as f64).collect();
    Ok(figure
        .series("selected", "numerical", xs.clone(), curve(n))
        .series("log_difference", "numerical", degree_axis.clone(), log10_abs(&pick(&table_difference)))
        .series("log_bound", "muted", degree_axis, log10_abs(&pick(&table_bound)))
        .point("approx", "numerical", x, polynomial)
        .point("exact", "exact", x, x.exp())
        .value("degree", n as f64)
        .value("x", x)
        .value("polynomial", polynomial)
        .value("exact", x.exp())
        .value("difference", x.exp() - polynomial)
        .value("bound", core::exp_taylor_remainder_bound(x, n))
        .array("degrees", degrees.iter().map(|&k| k as f64).collect())
        .array("table_polynomial", table_polynomial)
        .array("table_difference", table_difference)
        .array("table_bound", table_bound))
}

/// 等高線を、窓 \([-w, w]^2\) に入る点の続く部分ごとの線に分ける。
fn level_runs(c: f64, window: f64) -> Vec<(Vec<f64>, Vec<f64>)> {
    let mut runs = Vec::new();
    for (from, to) in [(-window, -0.01), (0.01, window)] {
        let mut xs = Vec::new();
        let mut ys = Vec::new();
        for x in grid(from, to, 400) {
            let y = core::quadratic_field_level_y(c, x);
            if y.abs() <= window * 1.2 {
                xs.push(x);
                ys.push(y);
            } else if xs.len() > 1 {
                runs.push((std::mem::take(&mut xs), std::mem::take(&mut ys)));
            } else {
                xs.clear();
                ys.clear();
            }
        }
        if xs.len() > 1 {
            runs.push((xs, ys));
        }
    }
    if c == 0.0 {
        runs.push((vec![0.0, 0.0], vec![-window * 1.2, window * 1.2]));
    }
    runs
}

fn unit_arrow(x: f64, y: f64, gx: f64, gy: f64, length: f64) -> Option<((f64, f64), (f64, f64))> {
    let norm = gx.hypot(gy);
    if norm == 0.0 || !norm.is_finite() {
        return None;
    }
    Some(((x, y), (x + length * gx / norm, y + length * gy / norm)))
}

fn partial(params: &Value) -> Result<Figure, String> {
    let a = num(params, "a", 1.0)?;
    let b = num(params, "b", 2.0)?;
    let h = positive(params, "h", 0.1)?;
    let window = 3.0;
    if a.abs() > window || b.abs() > window {
        return Err("a and b must be in [-3, 3]".into());
    }
    let f = core::quadratic_field;
    let level = f(a, b);
    let mut figure = Figure::new();
    for c in [-9.0, -3.0, 0.0, 3.0, 9.0] {
        if c == level {
            continue;
        }
        for (i, (xs, ys)) in level_runs(c, window).into_iter().enumerate() {
            figure = figure.series(&format!("level {c} {i}"), "reference", xs, ys);
        }
    }
    for (i, (xs, ys)) in level_runs(level, window).into_iter().enumerate() {
        figure = figure.series(&format!("through {i}"), "exact", xs, ys);
    }
    let ticks = [-2.0, -1.0, 0.0, 1.0, 2.0];
    for (i, [x, y, gx, gy]) in core::gradient_samples(core::quadratic_field_gradient, &ticks, &ticks).into_iter().enumerate() {
        if let Some((from, to)) = unit_arrow(x, y, gx, gy, 0.4) {
            figure = figure.arrow(&format!("grad {i}"), "vector", from, to);
        }
    }
    let [fx, fy] = core::quadratic_field_gradient(a, b);
    let cx = core::central_partial_x(f, a, b, h);
    let cy = core::central_partial_y(f, a, b, h);
    if let Some((from, to)) = unit_arrow(a, b, cx, cy, 0.9) {
        figure = figure.arrow("central", "numerical", from, to);
    }
    let picture_h = 0.5;
    let ts = grid(a - 2.0, a + 2.0, 161);
    let chord_slope = core::central_partial_x(f, a, b, picture_h);
    let left = a - picture_h;
    figure = figure
        .series("slice", "reference", ts.clone(), ts.iter().map(|&t| f(t, b)).collect())
        .series("slice tangent", "exact", ts.clone(), ts.iter().map(|&t| level + fx * (t - a)).collect())
        .series("slice chord", "numerical", ts.clone(), ts.iter().map(|&t| f(left, b) + chord_slope * (t - left)).collect())
        .point("slice left", "numerical", left, f(left, b))
        .point("slice right", "numerical", a + picture_h, f(a + picture_h, b))
        .point("slice point", "exact", a, level);
    let steps = vec![0.1, 0.01, 0.001];
    let forward_x: Vec<f64> = steps.iter().map(|&s| core::forward_difference(|t| f(t, b), a, s)).collect();
    let central_x: Vec<f64> = steps.iter().map(|&s| core::central_partial_x(f, a, b, s)).collect();
    let central_y: Vec<f64> = steps.iter().map(|&s| core::central_partial_y(f, a, b, s)).collect();
    Ok(figure
        .point("point", "numerical", a, b)
        .value("a", a)
        .value("b", b)
        .value("h", h)
        .value("value", level)
        .value("fx", fx)
        .value("fy", fy)
        .value("central_x", cx)
        .value("central_y", cy)
        .value("difference_x", cx - fx)
        .value("difference_y", cy - fy)
        .value("forward_x", core::forward_difference(|t| f(t, b), a, h))
        .value("forward_difference_x", core::forward_difference(|t| f(t, b), a, h) - fx)
        .array("steps", steps)
        .array("forward_x", forward_x)
        .array("central_x", central_x)
        .array("central_y", central_y))
}

fn grid_lines(mut figure: Figure, prefix: &str, from: f64, to: f64, n: usize) -> Figure {
    for (i, t) in grid(from, to, n + 1).into_iter().enumerate() {
        figure = figure
            .series(&format!("{prefix} v{i}"), "reference", vec![t, t], vec![from, to])
            .series(&format!("{prefix} h{i}"), "reference", vec![from, to], vec![t, t]);
    }
    figure
}

fn multiple_integral(params: &Value) -> Result<Figure, String> {
    let n = count(params, "n", 4, 64)?;
    let xy = |x: f64, y: f64| x * y;
    let mut figure = grid_lines(Figure::new(), "square", 0.0, 1.0, n);
    let mids = grid(0.5 / n as f64, 1.0 - 0.5 / n as f64, n);
    for (i, &x) in mids.iter().enumerate() {
        for (j, &y) in mids.iter().enumerate() {
            figure = figure.point(&format!("square mid {i} {j}"), "numerical", x, y);
        }
    }
    figure = grid_lines(figure, "disk", -1.0, 1.0, n);
    let side = 2.0 / n as f64;
    let inside = core::disk_grid_midpoints(1.0, n);
    for (k, [x, y]) in inside.iter().enumerate() {
        let (x0, y0) = (x - side / 2.0, y - side / 2.0);
        figure = figure
            .polygon(&format!("cell {k}"), vec![x0, x0 + side, x0 + side, x0], vec![y0, y0, y0 + side, y0 + side])
            .point(&format!("disk mid {k}"), "numerical", *x, *y);
    }
    let angles = grid(0.0, 2.0 * PI, 181);
    figure = figure.series("circle", "exact", angles.iter().map(|t| t.cos()).collect(), angles.iter().map(|t| t.sin()).collect());
    let square_sum = core::midpoint_double_sum(xy, 0.0, 1.0, 0.0, 1.0, n, n);
    let disk_grid = core::disk_area_grid_sum(1.0, n);
    let disk_polar = core::polar_disk_area_sum(1.0, n, 4 * n);
    let table_n: Vec<usize> = (1..=8).map(|k| 1 << k).collect();
    let table_square: Vec<f64> = table_n.iter().map(|&m| core::midpoint_double_sum(xy, 0.0, 1.0, 0.0, 1.0, m, m)).collect();
    let table_grid: Vec<f64> = table_n.iter().map(|&m| core::disk_area_grid_sum(1.0, m)).collect();
    let table_polar: Vec<f64> = table_n.iter().map(|&m| core::polar_disk_area_sum(1.0, m, 4 * m)).collect();
    Ok(figure
        .value("n", n as f64)
        .value("square_sum", square_sum)
        .value("square_exact", 0.25)
        .value("square_difference", square_sum - 0.25)
        .value("cells_inside", inside.len() as f64)
        .value("disk_grid", disk_grid)
        .value("disk_grid_difference", disk_grid - PI)
        .value("disk_polar", disk_polar)
        .value("disk_polar_difference", disk_polar - PI)
        .value("pi", PI)
        .array("table_n", table_n.iter().map(|&m| m as f64).collect())
        .array("table_square_difference", table_square.iter().map(|s| s - 0.25).collect())
        .array("table_grid", table_grid.clone())
        .array("table_grid_difference", table_grid.iter().map(|s| s - PI).collect())
        .array("table_polar_difference", table_polar.iter().map(|s| s - PI).collect()))
}

#[derive(Clone, Copy, PartialEq)]
enum Difference {
    Forward,
    Central,
}

impl Difference {
    fn read(params: &Value) -> Result<Self, String> {
        match text(params, "method", "forward") {
            "forward" => Ok(Self::Forward),
            "central" => Ok(Self::Central),
            other => Err(format!("unknown method {other}")),
        }
    }

    fn other(self) -> Self {
        if self == Self::Forward { Self::Central } else { Self::Forward }
    }

    fn apply(self, x: f64, h: f64) -> f64 {
        match self {
            Self::Forward => core::forward_difference(f64::sin, x, h),
            Self::Central => core::central_difference(f64::sin, x, h),
        }
    }

    fn leading(self, x: f64, h: f64) -> f64 {
        match self {
            Self::Forward => core::forward_difference_leading_error(-x.sin(), h),
            Self::Central => core::central_difference_leading_error(-x.cos(), h),
        }
    }
}

/// 刻み \(h = 10^{-k/4}\)（\(k = 0, 1, \ldots, 60\)）に対する \(\log_{10} h\) と \(\log_{10}|D f(x) - \cos x|\)。差が 0 の刻みは除く。
fn error_curve(method: Difference, x: f64) -> (Vec<f64>, Vec<f64>) {
    (0..=60)
        .map(|k| -(k as f64) / 4.0)
        .filter_map(|log_h| {
            let error = method.apply(x, 10f64.powf(log_h)) - x.cos();
            (error != 0.0).then(|| (log_h, error.abs().log10()))
        })
        .unzip()
}

fn numerical_differentiation(params: &Value) -> Result<Figure, String> {
    let method = Difference::read(params)?;
    let h = positive(params, "h", 0.1)?;
    let x = num(params, "x", 1.0)?;
    if x.abs() > 10.0 || h > 1.0 {
        return Err("x must be in [-10, 10] and h in (0, 1]".into());
    }
    let exact = x.cos();
    let ts = grid(x - 1.0, x + 1.0, 101);
    let picture_h = 0.5;
    let (p, q) = match method {
        Difference::Forward => (x, x + picture_h),
        Difference::Central => (x - picture_h, x + picture_h),
    };
    let slope = method.apply(x, picture_h);
    let (log_h, log_error) = error_curve(method, x);
    let (other_h, other_error) = error_curve(method.other(), x);
    let leading_h: Vec<f64> = (0..=40).map(|k| -(k as f64) / 4.0).collect();
    let leading: Vec<f64> = leading_h.iter().map(|&l| method.leading(x, 10f64.powf(l)).abs().log10()).collect();
    let (valley_index, _) = log_error
        .iter()
        .enumerate()
        .fold((0, f64::INFINITY), |best, (i, &e)| if e < best.1 { (i, e) } else { best });
    let error_at = |hh: f64| (method.apply(x, hh) - exact).abs().log10();
    let table_h: Vec<f64> = (1..=12).map(|k| 10f64.powi(-k)).collect();
    let table_value: Vec<f64> = table_h.iter().map(|&s| method.apply(x, s)).collect();
    Ok(Figure::new()
        .series("sine", "reference", ts.clone(), ts.iter().map(|t| t.sin()).collect())
        .series("tangent", "exact", ts.clone(), ts.iter().map(|t| x.sin() + exact * (t - x)).collect())
        .series("chord", "numerical", ts.clone(), ts.iter().map(|t| p.sin() + slope * (t - p)).collect())
        .point("left", "numerical", p, p.sin())
        .point("right", "numerical", q, q.sin())
        .point("touch", "exact", x, x.sin())
        .series("log_error", "numerical", log_h.clone(), log_error.clone())
        .series("log_other", "reference", other_h, other_error)
        .series("log_leading", "muted", leading_h, leading)
        .point("valley", "numerical", log_h[valley_index], log_error[valley_index])
        .value("x", x)
        .value("h", h)
        .value("picture_h", picture_h)
        .value("value", method.apply(x, h))
        .value("exact", exact)
        .value("difference", method.apply(x, h) - exact)
        .value("leading", method.leading(x, h))
        .value("valley_log_h", log_h[valley_index])
        .value("valley_h", 10f64.powf(log_h[valley_index]))
        .value("valley_log_error", log_error[valley_index])
        .value("slope", (error_at(1e-1) - error_at(1e-3)) / 2.0)
        .array("table_h", table_h.clone())
        .array("table_value", table_value.clone())
        .array("table_difference", table_value.iter().map(|v| v - exact).collect())
        .array("table_leading", table_h.iter().map(|&s| method.leading(x, s)).collect()))
}

#[derive(Clone, Copy, PartialEq)]
enum Quadrature {
    Trapezoid,
    Simpson,
}

impl Quadrature {
    fn read(params: &Value) -> Result<Self, String> {
        match text(params, "method", "trapezoid") {
            "trapezoid" => Ok(Self::Trapezoid),
            "simpson" => Ok(Self::Simpson),
            other => Err(format!("unknown method {other}")),
        }
    }

    fn other(self) -> Self {
        if self == Self::Trapezoid { Self::Simpson } else { Self::Trapezoid }
    }

    fn apply(self, n: usize) -> f64 {
        match self {
            Self::Trapezoid => core::trapezoid_rule(f64::sin, 0.0, PI, n),
            Self::Simpson => core::simpson_rule(f64::sin, 0.0, PI, n),
        }
    }

    fn bound(self, n: usize) -> f64 {
        match self {
            Self::Trapezoid => core::trapezoid_error_bound(0.0, PI, n, 1.0),
            Self::Simpson => core::simpson_error_bound(0.0, PI, n, 1.0),
        }
    }
}

fn numerical_integration(params: &Value) -> Result<Figure, String> {
    let method = Quadrature::read(params)?;
    let n = count(params, "n", 4, 512)?;
    if method == Quadrature::Simpson && n % 2 == 1 {
        return Err("n must be even for Simpson's rule".into());
    }
    let h = PI / n as f64;
    let nodes: Vec<f64> = (0..=n).map(|i| i as f64 * h).collect();
    let values: Vec<f64> = nodes.iter().map(|t| t.sin()).collect();
    let ts = grid(0.0, PI, 181);
    let mut figure = Figure::new().series("integrand", "exact", ts.clone(), ts.iter().map(|t| t.sin()).collect());
    let (mut ax, mut ay) = (Vec::new(), Vec::new());
    match method {
        Quadrature::Trapezoid => {
            for i in 0..n {
                figure = figure.polygon(
                    &format!("panel {i}"),
                    vec![nodes[i], nodes[i], nodes[i + 1], nodes[i + 1]],
                    vec![0.0, values[i], values[i + 1], 0.0],
                );
            }
            ax.clone_from(&nodes);
            ay.clone_from(&values);
        }
        Quadrature::Simpson => {
            for j in 0..n / 2 {
                let x0 = nodes[2 * j];
                let arc = grid(x0, x0 + 2.0 * h, 25);
                let arc_y: Vec<f64> = arc
                    .iter()
                    .map(|&t| core::simpson_parabola(x0, h, values[2 * j], values[2 * j + 1], values[2 * j + 2], t))
                    .collect();
                let mut px = vec![x0];
                let mut py = vec![0.0];
                px.extend(&arc);
                py.extend(&arc_y);
                px.push(x0 + 2.0 * h);
                py.push(0.0);
                figure = figure.polygon(&format!("panel {j}"), px, py);
                let skip = usize::from(j > 0);
                ax.extend(&arc[skip..]);
                ay.extend(&arc_y[skip..]);
            }
        }
    }
    figure = figure.series("approximant", "numerical", ax, ay);
    for (i, (&x, &y)) in nodes.iter().zip(&values).enumerate() {
        figure = figure.point(&format!("node {i}"), "numerical", x, y);
    }
    let table_n: Vec<usize> = (1..=9).map(|k| 1 << k).collect();
    let errors = |m: Quadrature| table_n.iter().map(|&k| m.apply(k) - 2.0).collect::<Vec<_>>();
    let table_difference = errors(method);
    let log_n: Vec<f64> = table_n.iter().map(|&k| (k as f64).log10()).collect();
    let approx = method.apply(n);
    let ratio = (method.apply(2 * n) - 2.0) / (approx - 2.0);
    Ok(figure
        .series("log_error", "numerical", log_n.clone(), log10_abs(&table_difference))
        .series("log_other", "reference", log_n.clone(), log10_abs(&errors(method.other())))
        .series("log_bound", "muted", log_n, table_n.iter().map(|&k| method.bound(k).log10()).collect())
        .value("n", n as f64)
        .value("approx", approx)
        .value("exact", 2.0)
        .value("difference", approx - 2.0)
        .value("ratio", ratio)
        .value("bound", method.bound(n))
        .array("table_n", table_n.iter().map(|&k| k as f64).collect())
        .array("table_approx", table_n.iter().map(|&k| method.apply(k)).collect())
        .array("table_difference", table_difference.clone())
        .array("table_ratio", core::doubling_ratios(&table_difference)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn taylor_example_is_eight_thirds() {
        let f = figure("taylor", &json!({ "degree": 3, "x": 1 })).unwrap();
        assert!((f.values["polynomial"] - 8.0 / 3.0).abs() < 1e-15);
        assert!((f.values["difference"] - (std::f64::consts::E - 8.0 / 3.0)).abs() < 1e-15);
        assert!((f.values["bound"] - std::f64::consts::E / 24.0).abs() < 1e-15);
        assert_eq!(f.series.iter().filter(|s| s.role == "muted" && s.name.starts_with('p')).count(), 3);
        let one = figure("taylor", &json!({ "degree": 1 })).unwrap();
        assert!((one.values["polynomial"] - 2.0).abs() < 1e-15);
    }

    #[test]
    fn partial_example_at_one_two() {
        let f = figure("partial", &json!({})).unwrap();
        assert_eq!(f.values["value"], 7.0);
        assert_eq!((f.values["fx"], f.values["fy"]), (8.0, 3.0));
        assert!(f.values["difference_x"].abs() < 1e-12 && f.values["difference_y"].abs() < 1e-12);
        assert!((f.arrays["forward_x"][0] - 8.1).abs() < 1e-12);
        assert!(f.series.iter().any(|s| s.role == "exact"));
        assert!(f.arrows.iter().filter(|a| a.role == "vector").count() == 24);
        assert!(figure("partial", &json!({ "a": 0, "b": 0 })).is_ok());
    }

    #[test]
    fn multiple_integral_example() {
        let f = figure("multiple-integral", &json!({ "n": 4 })).unwrap();
        assert!(f.values["square_difference"].abs() < 1e-15);
        assert_eq!(f.values["disk_grid"], 3.0);
        assert_eq!(f.values["cells_inside"], 12.0);
        assert!(f.values["disk_polar_difference"].abs() < 1e-13);
        let grid_errors = &f.arrays["table_grid_difference"];
        assert!(grid_errors.last().unwrap().abs() < grid_errors[0].abs() / 10.0);
    }

    #[test]
    fn differences_of_sine_have_slopes_one_and_two() {
        let forward = figure("numerical-differentiation", &json!({ "method": "forward" })).unwrap();
        assert!((forward.values["value"] - 0.497364).abs() < 1e-6);
        assert!((forward.values["slope"] - 1.0).abs() < 0.05);
        assert!((forward.values["valley_log_h"] + 8.0).abs() <= 1.0);
        let central = figure("numerical-differentiation", &json!({ "method": "central" })).unwrap();
        assert!((central.values["value"] - 0.539402).abs() < 1e-6);
        assert!((central.values["slope"] - 2.0).abs() < 0.05);
        assert!((central.values["valley_log_h"] + 5.0).abs() <= 1.0);
        assert!(figure("numerical-differentiation", &json!({ "method": "backward" })).is_err());
    }

    #[test]
    fn quadrature_of_sine_ratios() {
        let t = figure("numerical-integration", &json!({ "method": "trapezoid" })).unwrap();
        assert!((t.values["approx"] - 1.896119).abs() < 1e-6);
        assert!(t.arrays["table_ratio"].last().map(|r| (r - 0.25).abs() < 1e-3).unwrap());
        let s = figure("numerical-integration", &json!({ "method": "simpson" })).unwrap();
        assert!((s.values["approx"] - 2.004560).abs() < 1e-6);
        assert!(s.arrays["table_ratio"][4..].iter().all(|r| (r - 1.0 / 16.0).abs() < 2e-3));
        assert!(figure("numerical-integration", &json!({ "method": "simpson", "n": 3 })).is_err());
    }
}
