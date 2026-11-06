//! 微分積分の単元の値（極限から置換積分と部分積分まで）。式は `ergion_core::calculus` の各関数の rustdoc にある。
//!
//! - `limits`: \(\frac{\sin h}{h}\) の列と、\(\varepsilon\) に対する幅 \(\delta\)。
//! - `derivative-definition`: \(x^2\) の差分商 \(\frac{(a + h)^2 - a^2}{h}\) の列、割線、接線。
//! - `product-chain`: \(x^2\sin x\) と \(e^{x^2}\) の導関数の公式の値と中心差分。
//! - `mean-value`: \(x^3\) の平均の傾きと、\(f'(c) = m\) のニュートン法の反復。
//! - `fundamental-theorem`: \(\int_0^1 x^2\,dx\) の左端、右端、中点の Riemann 和。
//! - `integration-techniques`: \(\int_0^1 2t e^{t^2}\,dt\) と \(\int_0^1 x e^x\,dx\) の Simpson 則。

use ergion_core::calculus as core;
use ergion_core::calculus::RiemannPoint;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, count, grid, num, positive, text};

/// 微分積分の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "limits" => limits(params),
        "derivative-definition" => derivative_definition(params),
        "product-chain" => product_chain(params),
        "mean-value" => mean_value(params),
        "fundamental-theorem" => fundamental_theorem(params),
        "integration-techniques" => integration_techniques(params),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// 微分積分の単元の時間発展。この部分の単元には時間発展がない。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown unit {unit}"))
}

fn powers_of_ten(from: i32, to: i32) -> Vec<f64> {
    (from..=to).map(|k| 10f64.powi(-k)).collect()
}

fn without_zero(xs: Vec<f64>) -> Vec<f64> {
    xs.into_iter().filter(|x| *x != 0.0).collect()
}

fn limits(params: &Value) -> Result<Figure, String> {
    let epsilon = positive(params, "epsilon", 0.05)?;
    if epsilon > 0.5 {
        return Err("epsilon must be in (0, 0.5]".into());
    }
    let delta = core::sine_ratio_delta(epsilon);
    let ratio = |xs: &[f64]| xs.iter().map(|&x| core::sine_ratio(x)).collect::<Vec<_>>();

    let wide = without_zero(grid(-12.0, 12.0, 801));
    let zoom_edge = 2.0 * delta;
    let zoom = without_zero(grid(-zoom_edge, zoom_edge, 401));
    let inside: Vec<f64> = zoom.iter().copied().filter(|x| x.abs() < delta).collect();
    let zoom_ratio = ratio(&zoom);
    let bottom = zoom_ratio.iter().copied().fold(1.0 - epsilon, f64::min);
    let top = 1.0 + 2.0 * epsilon;

    let hs = powers_of_ten(1, 4);
    let ratios = ratio(&hs);
    let gaps: Vec<f64> = ratios.iter().map(|r| 1.0 - r).collect();
    let bounds: Vec<f64> = hs.iter().map(|&h| core::sine_ratio_gap_bound(h)).collect();
    let shares: Vec<f64> = gaps.iter().zip(&bounds).map(|(g, b)| g / b).collect();

    Ok(Figure::new()
        .series("curve", "numerical", wide.clone(), ratio(&wide))
        .series("zoom", "reference", zoom.clone(), zoom_ratio)
        .series("inside", "numerical", inside.clone(), ratio(&inside))
        .series("upper", "muted", vec![-zoom_edge, zoom_edge], vec![1.0 + epsilon; 2])
        .series("lower", "muted", vec![-zoom_edge, zoom_edge], vec![1.0 - epsilon; 2])
        .series("left-edge", "muted", vec![-delta, -delta], vec![bottom, top])
        .series("right-edge", "muted", vec![delta, delta], vec![bottom, top])
        .series("limit", "exact", vec![-12.0, 12.0], vec![1.0, 1.0])
        .point("hole", "exact", 0.0, 1.0)
        .array("h", hs)
        .array("ratio", ratios.clone())
        .array("gap", gaps.clone())
        .array("bound", bounds.clone())
        .array("share", shares)
        .value("epsilon", epsilon)
        .value("delta", delta)
        .value("ratio", ratios[0])
        .value("gap", gaps[0])
        .value("bound", bounds[0]))
}

fn derivative_definition(params: &Value) -> Result<Figure, String> {
    let a = num(params, "a", 1.0)?;
    if a.abs() > 100.0 {
        return Err("a must be in [-100, 100]".into());
    }
    let square = |x: f64| x * x;
    let slope = core::square_difference_quotient(a, 0.0);
    let xs = grid(a - 1.0, a + 1.5, 201);
    let mut figure = Figure::new()
        .series("curve", "text", xs.clone(), xs.iter().map(|&x| square(x)).collect())
        .series(
            "tangent",
            "exact",
            vec![a - 1.0, a + 1.5],
            vec![core::point_slope_line(a, square(a), slope, a - 1.0), core::point_slope_line(a, square(a), slope, a + 1.5)],
        )
        .point("a", "text", a, square(a));
    for h in [1.0, 0.5, 0.25] {
        let q = core::forward_difference(square, a, h);
        let ends = [a - 0.6, a + h + 0.3];
        figure = figure
            .series(&format!("secant-{h}"), "numerical", ends.to_vec(), ends.iter().map(|&x| core::point_slope_line(a, square(a), q, x)).collect())
            .point(&format!("end-{h}"), "numerical", a + h, square(a + h));
    }

    let hs_plot = grid(0.02, 1.0, 50);
    let quotients: Vec<f64> = hs_plot.iter().map(|&h| core::forward_difference(square, a, h)).collect();
    let hs = powers_of_ten(1, 5);
    let table: Vec<f64> = hs.iter().map(|&h| core::forward_difference(square, a, h)).collect();
    let gaps: Vec<f64> = table.iter().map(|q| q - slope).collect();
    let simplified: Vec<f64> = hs.iter().map(|&h| core::square_difference_quotient(a, h)).collect();
    Ok(figure
        .series("quotient", "numerical", hs_plot.clone(), quotients)
        .series("quotient-exact", "exact", vec![0.0, 1.0], vec![core::square_difference_quotient(a, 0.0), core::square_difference_quotient(a, 1.0)])
        .point("limit", "exact", 0.0, slope)
        .array("h", hs)
        .array("quotient", table.clone())
        .array("simplified", simplified)
        .array("gap", gaps.clone())
        .value("a", a)
        .value("slope", slope)
        .value("quotient", table[0])
        .value("gap", gaps[0]))
}

fn product_chain(params: &Value) -> Result<Figure, String> {
    let step = positive(params, "h", 0.1)?;
    if step > 0.5 {
        return Err("h must be in (0, 0.5]".into());
    }
    let xs = grid(-3.0, 3.0, 241);
    let map = |f: &dyn Fn(f64) -> f64, xs: &[f64]| xs.iter().map(|&x| f(x)).collect::<Vec<_>>();
    let term1 = |x: f64| 2.0 * x * x.sin();
    let term2 = |x: f64| x * x * x.cos();
    let gs = grid(-1.2, 1.2, 161);

    let hs = powers_of_ten(1, 4);
    let product_central: Vec<f64> = hs.iter().map(|&h| core::central_difference(core::square_sine, 1.0, h)).collect();
    let chain_central: Vec<f64> = hs.iter().map(|&h| core::central_difference(core::exp_square, 1.0, h)).collect();
    let product_exact = core::square_sine_derivative(1.0);
    let chain_exact = core::exp_square_derivative(1.0);
    Ok(Figure::new()
        .series("product", "text", xs.clone(), map(&core::square_sine, &xs))
        .series("term1", "reference", xs.clone(), map(&term1, &xs))
        .series("term2", "muted", xs.clone(), map(&term2, &xs))
        .series("product-central", "numerical", xs.clone(), map(&|x| core::central_difference(core::square_sine, x, step), &xs))
        .series("product-exact", "exact", xs.clone(), map(&core::square_sine_derivative, &xs))
        .series("chain", "text", gs.clone(), map(&core::exp_square, &gs))
        .series("chain-central", "numerical", gs.clone(), map(&|x| core::central_difference(core::exp_square, x, step), &gs))
        .series("chain-exact", "exact", gs.clone(), map(&core::exp_square_derivative, &gs))
        .point("product-at-one", "numerical", 1.0, product_exact)
        .point("chain-at-one", "numerical", 1.0, chain_exact)
        .array("h", hs)
        .array("product_central", product_central.clone())
        .array("product_gap", product_central.iter().map(|d| d - product_exact).collect())
        .array("chain_central", chain_central.clone())
        .array("chain_gap", chain_central.iter().map(|d| d - chain_exact).collect())
        .value("h", step)
        .value("term1", term1(1.0))
        .value("term2", term2(1.0))
        .value("product_exact", product_exact)
        .value("chain_exact", chain_exact)
        .value("product_central", product_central[0])
        .value("chain_central", chain_central[0]))
}

fn mean_value(params: &Value) -> Result<Figure, String> {
    let a = num(params, "a", 0.0)?;
    let b = num(params, "b", 2.0)?;
    if !(0.0 <= a && a < b && b <= 10.0) {
        return Err("a and b must satisfy 0 <= a < b <= 10".into());
    }
    let c0 = num(params, "c0", 0.5 * (a + b))?;
    if c0 <= 0.0 {
        return Err("c0 must be positive".into());
    }
    let steps = count(params, "steps", 4, 20)?;
    let cube = |x: f64| x * x * x;
    let first = |x: f64| 3.0 * x * x;
    let second = |x: f64| 6.0 * x;
    let slope = core::mean_slope(cube, a, b);
    let exact = core::cube_mean_value_point(a, b);
    let iterates = core::mean_value_newton(first, second, slope, c0, steps);
    let c = *iterates.last().unwrap();

    let span = b - a;
    let (lo, hi) = (a - 0.1 * span, b + 0.1 * span);
    let xs = grid(lo, hi, 201);
    let line = |x0: f64, s: f64| vec![core::point_slope_line(x0, cube(x0), s, lo), core::point_slope_line(x0, cube(x0), s, hi)];
    let mut figure = Figure::new()
        .series("curve", "text", xs.clone(), xs.iter().map(|&x| cube(x)).collect())
        .series("secant", "reference", vec![lo, hi], line(a, slope))
        .series("tangent", "numerical", vec![lo, hi], line(c, slope))
        .series("tangent-exact", "exact", vec![lo, hi], line(exact, slope))
        .point("left", "reference", a, cube(a))
        .point("right", "reference", b, cube(b))
        .point("c", "numerical", c, cube(c))
        .series("g", "text", xs.clone(), xs.iter().map(|&x| first(x) - slope).collect())
        .series("root", "exact", vec![exact, exact], vec![first(lo) - slope, first(hi) - slope]);
    for (n, pair) in iterates.windows(2).enumerate() {
        let (from, to) = (pair[0], pair[1]);
        figure = figure
            .series(&format!("newton-{n}"), "numerical", vec![from, to], vec![first(from) - slope, 0.0])
            .series(&format!("rise-{n}"), "muted", vec![to, to], vec![0.0, first(to) - slope])
            .point(&format!("iterate-{n}"), "numerical", from, first(from) - slope);
    }
    let errors: Vec<f64> = iterates.iter().map(|x| x - exact).collect();
    Ok(figure
        .array("iterates", iterates.clone())
        .array("error", errors)
        .value("a", a)
        .value("b", b)
        .value("slope", slope)
        .value("c_exact", exact)
        .value("c", c)
        .value("c1", iterates[1])
        .value("error", c - exact))
}

fn riemann_point(params: &Value) -> Result<RiemannPoint, String> {
    match text(params, "method", "left") {
        "left" => Ok(RiemannPoint::Left),
        "right" => Ok(RiemannPoint::Right),
        "midpoint" => Ok(RiemannPoint::Midpoint),
        other => Err(format!("unknown method {other}")),
    }
}

fn fundamental_theorem(params: &Value) -> Result<Figure, String> {
    let point = riemann_point(params)?;
    let n = count(params, "n", 8, 1000)?;
    let square = |x: f64| x * x;
    let samples = core::riemann_points(0.0, 1.0, n, point);
    let edges: Vec<f64> = (0..n).flat_map(|i| [i as f64 / n as f64, (i + 1) as f64 / n as f64]).collect();
    let heights: Vec<f64> = samples.iter().map(|&x| square(x)).collect();
    let xs = grid(0.0, 1.0, 201);

    let ns: Vec<usize> = (1..=40).collect();
    let sums: Vec<f64> = ns.iter().map(|&k| core::riemann_sum(square, 0.0, 1.0, k, point)).collect();
    let table_ns: Vec<usize> = (0..=10).map(|k| 1usize << k).collect();
    let table_sums: Vec<f64> = table_ns.iter().map(|&k| core::riemann_sum(square, 0.0, 1.0, k, point)).collect();
    let closed: Vec<f64> = table_ns.iter().map(|&k| core::square_riemann_sum_exact(k, point)).collect();
    let exact = 1.0 / 3.0;
    let sum = core::riemann_sum(square, 0.0, 1.0, n, point);
    let mut figure = Figure::new()
        .bars("rectangles", "numerical", edges, heights.clone())
        .series("curve", "text", xs.clone(), xs.iter().map(|&x| square(x)).collect())
        .series("sums", "numerical", ns.iter().map(|&k| k as f64).collect(), sums)
        .series("exact", "exact", vec![1.0, 40.0], vec![exact, exact]);
    for (i, (&x, &y)) in samples.iter().zip(&heights).enumerate() {
        figure = figure.point(&format!("sample-{i}"), "numerical", x, y);
    }
    Ok(figure
        .array("n", table_ns.iter().map(|&k| k as f64).collect())
        .array("sum", table_sums.clone())
        .array("closed", closed)
        .array("error", table_sums.iter().map(|s| s - exact).collect())
        .value("n", n as f64)
        .value("sum", sum)
        .value("closed", core::square_riemann_sum_exact(n, point))
        .value("exact", exact)
        .value("error", sum - exact))
}

fn integration_techniques(params: &Value) -> Result<Figure, String> {
    let n = count(params, "n", 2, 1000)?;
    if n % 2 == 1 {
        return Err("n must be even".into());
    }
    let substituted = |t: f64| 2.0 * t * (t * t).exp();
    let square = |t: f64| t * t;
    let product = |x: f64| x * x.exp();
    let one = |_: f64| 1.0;
    let identity = |x: f64| x;
    let sub_exact = core::exp_substitution_exact();
    let parts_exact = core::x_exp_by_parts_exact();

    let ts = grid(0.0, 1.0, 101);
    let area = |f: &dyn Fn(f64) -> f64| {
        let mut x = vec![0.0];
        let mut y = vec![0.0];
        for &t in &ts {
            x.push(t);
            y.push(f(t));
        }
        x.push(1.0);
        y.push(0.0);
        (x, y)
    };
    let (tx, ty) = area(&substituted);
    let (xx, xy) = area(&f64::exp);
    let nodes = grid(0.0, 1.0, n + 1);
    let mut upper_u = vec![0.0];
    let mut upper_v = vec![1.0];
    for &u in &ts {
        upper_u.push(u);
        upper_v.push(u.exp());
    }
    upper_u.push(0.0);
    upper_v.push(std::f64::consts::E);

    let mut figure = Figure::new()
        .polygon("area-t", tx, ty)
        .series("integrand-t", "text", ts.clone(), ts.iter().map(|&t| substituted(t)).collect())
        .polygon("area-x", xx, xy)
        .series("integrand-x", "text", ts.clone(), ts.iter().map(|&x| x.exp()).collect())
        .polygon("u-dv", upper_u, upper_v)
        .series("v-of-u", "text", ts.clone(), ts.iter().map(|&u| u.exp()).collect())
        .series("rectangle", "reference", vec![0.0, 1.0, 1.0, 0.0, 0.0], vec![0.0, 0.0, std::f64::consts::E, std::f64::consts::E, 0.0]);
    for (i, &x) in nodes.iter().enumerate() {
        figure = figure
            .point(&format!("node-t-{i}"), "numerical", x, substituted(x))
            .point(&format!("node-x-{i}"), "numerical", x, x.exp())
            .point(&format!("node-uv-{i}"), "numerical", x, x.exp());
    }

    let table_ns: Vec<usize> = (1..=5).map(|k| 1usize << k).collect();
    let before: Vec<f64> = table_ns.iter().map(|&k| core::simpson_rule(substituted, 0.0, 1.0, k)).collect();
    let after: Vec<f64> = table_ns.iter().map(|&k| core::integrate_by_substitution(f64::exp, square, 0.0, 1.0, k)).collect();
    let direct: Vec<f64> = table_ns.iter().map(|&k| core::simpson_rule(product, 0.0, 1.0, k)).collect();
    let parts: Vec<f64> = table_ns.iter().map(|&k| core::integrate_by_parts(identity, one, f64::exp, 0.0, 1.0, k)).collect();
    let gap = |v: &[f64], exact: f64| v.iter().map(|x| x - exact).collect::<Vec<_>>();
    Ok(figure
        .array("n", table_ns.iter().map(|&k| k as f64).collect())
        .array("before", before.clone())
        .array("before_gap", gap(&before, sub_exact))
        .array("after", after.clone())
        .array("after_gap", gap(&after, sub_exact))
        .array("direct", direct.clone())
        .array("direct_gap", gap(&direct, parts_exact))
        .array("parts", parts.clone())
        .array("parts_gap", gap(&parts, parts_exact))
        .value("n", n as f64)
        .value("substitution_exact", sub_exact)
        .value("parts_exact", parts_exact)
        .value("boundary", core::by_parts_boundary(identity, f64::exp, 0.0, 1.0))
        .value("before", core::simpson_rule(substituted, 0.0, 1.0, n))
        .value("after", core::integrate_by_substitution(f64::exp, square, 0.0, 1.0, n))
        .value("direct", core::simpson_rule(product, 0.0, 1.0, n))
        .value("parts", core::integrate_by_parts(identity, one, f64::exp, 0.0, 1.0, n)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn limits_example_at_one_tenth() {
        let f = figure("limits", &json!({})).unwrap();
        assert!((f.values["ratio"] - 0.998_334_166_468_281_5).abs() < 1e-15);
        assert!((f.values["bound"] - 0.01 / 6.0).abs() < 1e-17);
        assert!((f.values["delta"] - 0.3_f64.sqrt()).abs() < 1e-15);
        assert_eq!(f.arrays["h"].len(), 4);
        assert!(f.checked().is_ok());
    }

    #[test]
    fn derivative_definition_gap_is_h() {
        let f = figure("derivative-definition", &json!({ "a": 1 })).unwrap();
        assert_eq!(f.values["slope"], 2.0);
        assert!((f.values["quotient"] - 2.1).abs() < 1e-13);
        for (h, gap) in f.arrays["h"].iter().zip(&f.arrays["gap"]) {
            assert!((gap - h).abs() < 1e-9, "{h} {gap}");
        }
    }

    #[test]
    fn product_chain_values_at_one() {
        let f = figure("product-chain", &json!({})).unwrap();
        assert!((f.values["product_exact"] - 2.223_244_275_483_729).abs() < 1e-12);
        assert!((f.values["chain_exact"] - 2.0 * std::f64::consts::E).abs() < 1e-14);
        assert!(f.arrays["product_gap"][3].abs() < 1e-7);
    }

    #[test]
    fn mean_value_iterates_reach_two_over_root_three() {
        let f = figure("mean-value", &json!({})).unwrap();
        assert_eq!(f.values["slope"], 4.0);
        assert!((f.arrays["iterates"][1] - 7.0 / 6.0).abs() < 1e-15);
        assert!((f.arrays["iterates"][2] - 97.0 / 84.0).abs() < 1e-15);
        assert!(f.values["error"].abs() < 1e-15);
    }

    #[test]
    fn riemann_tabs_change_the_sum() {
        let right = figure("fundamental-theorem", &json!({ "method": "right", "n": 4 })).unwrap();
        assert!((right.values["sum"] - 15.0 / 32.0).abs() < 1e-15);
        let left = figure("fundamental-theorem", &json!({ "method": "left", "n": 4 })).unwrap();
        assert!((left.values["sum"] - 7.0 / 32.0).abs() < 1e-15);
        let mid = figure("fundamental-theorem", &json!({ "method": "midpoint", "n": 4 })).unwrap();
        assert!((mid.values["sum"] - 21.0 / 64.0).abs() < 1e-15);
        assert!(figure("fundamental-theorem", &json!({ "method": "trapezoid" })).is_err());
    }

    #[test]
    fn integration_techniques_with_two_intervals() {
        let f = figure("integration-techniques", &json!({})).unwrap();
        assert!((f.values["before"] - 1.762_110_8).abs() < 1e-6);
        assert!((f.values["after"] - 1.718_861_2).abs() < 1e-6);
        assert!((f.values["direct"] - 1.002_621).abs() < 1e-6);
        assert!((f.values["boundary"] - std::f64::consts::E).abs() < 1e-15);
        assert!(figure("integration-techniques", &json!({ "n": 3 })).is_err());
    }

    #[test]
    fn other_units_fall_through() {
        let err = figure("taylor", &json!({})).unwrap_err();
        assert!(err.starts_with("unknown unit"));
        assert!(model("taylor", &json!({}), 0.1).err().unwrap().starts_with("unknown unit"));
    }
}
