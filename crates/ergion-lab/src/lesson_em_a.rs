//! 電磁気学の単元（Coulomb の法則、静電ポテンシャル、Gauss の法則、定常電流と静磁場）の値。
//! 式は `ergion_core::electromagnetism` の各関数の rustdoc にある。

use std::f64::consts::PI;

use ergion_core::electromagnetism as core;
use ergion_core::electromagnetism::PointCharge;
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, count, grid, num, positive, text};

/// 電磁気学の単元の図。単位は \(\frac{1}{4\pi\varepsilon_0} = 1\)、\(\frac{\mu_0}{4\pi} = 1\)。
///
/// - `coulomb`: \((-1, 0)\) の電荷 \(+1\) と \((1, 0)\) の電荷 \(-1\) の電場の矢印、RK4 でたどった電気力線、点 \((p_x, p_y)\) の電場。
/// - `potential`: 同じ電荷の等電位線、点 \((0, 0)\) の中心差分の電場、\(A = (-0.5, 0)\) から \(B = (0.5, 0)\) への2経路の線積分。
/// - `gauss`: 原点の電荷 \(+1\) の電場が球面または立方体（`method`）を貫く電束の中点則と、一様な球の電場 \(E(r)\)。
/// - `magnetostatics`: 直線導線と円形電流の Biot–Savart の中点則、磁力線の円、Ampère の法則の周回積分。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "coulomb" => coulomb(params),
        "potential" => potential(params),
        "gauss" => gauss(params),
        "magnetostatics" => magnetostatics(params),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元は時間発展を持たない。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown unit {unit}"))
}

const BOUNDS: [f64; 4] = [-4.0, 4.0, -3.0, 3.0];

fn dipole() -> [PointCharge; 2] {
    [PointCharge { q: 1.0, x: -1.0, y: 0.0 }, PointCharge { q: -1.0, x: 1.0, y: 0.0 }]
}

/// 点 \((x, y)\) を中心に、向き \((u, v)\) で長さ `length` の矢印。
fn centered_arrow(x: f64, y: f64, u: f64, v: f64, length: f64) -> Option<((f64, f64), (f64, f64))> {
    let n = u.hypot(v);
    if n == 0.0 || !n.is_finite() {
        return None;
    }
    let (dx, dy) = (0.5 * length * u / n, 0.5 * length * v / n);
    Some(((x - dx, y - dy), (x + dx, y + dy)))
}

fn split(points: &[(f64, f64)]) -> (Vec<f64>, Vec<f64>) {
    points.iter().copied().unzip()
}

fn direction_grid(mut figure: Figure, prefix: &str, role: &str, step: f64, keep: impl Fn(f64, f64) -> bool, field: impl Fn(f64, f64) -> (f64, f64)) -> Figure {
    let (nx, ny) = ((7.0 / step).round() as usize + 1, (5.0 / step).round() as usize + 1);
    let mut k = 0;
    for x in grid(-3.5, 3.5, nx) {
        for y in grid(-2.5, 2.5, ny) {
            if !keep(x, y) {
                continue;
            }
            let (u, v) = field(x, y);
            if let Some((from, to)) = centered_arrow(x, y, u, v, 0.3) {
                figure = figure.arrow(&format!("{prefix} {k}"), role, from, to);
                k += 1;
            }
        }
    }
    figure
}

fn away_from_charges(x: f64, y: f64) -> bool {
    dipole().iter().all(|c| (x - c.x).hypot(y - c.y) > 0.3)
}

fn coulomb(params: &Value) -> Result<Figure, String> {
    let px = num(params, "px", 0.0)?;
    let py = num(params, "py", 1.0)?;
    let lines = count(params, "lines", 16, 48)?;
    let charges = dipole();
    if !away_from_charges(px, py) || !(-3.0..=3.0).contains(&px) || !(-3.0..=3.0).contains(&py) {
        return Err("the point must be in [-3, 3]² and away from the charges".into());
    }
    let mut figure = direction_grid(Figure::new(), "grid", "vector", 0.5, away_from_charges, |x, y| core::coulomb_field(&charges, x, y));
    let mut drift: f64 = 0.0;
    for k in 0..lines {
        let angle = 2.0 * PI * (k as f64 + 0.5) / lines as f64;
        let start = (-1.0 + 0.08 * angle.cos(), 0.08 * angle.sin());
        let points = core::field_line(&charges, start.0, start.1, 0.01, 3000, BOUNDS, 0.05);
        let psi0 = core::axial_flux_function(&charges, start.0, start.1);
        for p in &points {
            drift = drift.max((core::axial_flux_function(&charges, p.0, p.1) - psi0).abs());
        }
        let (xs, ys) = split(&points);
        figure = figure.series(&format!("line {k}"), "numerical", xs, ys);
    }
    let (ex, ey) = core::coulomb_field(&charges, px, py);
    let (e1x, e1y) = core::coulomb_field(&charges[..1], px, py);
    let (e2x, e2y) = core::coulomb_field(&charges[1..], px, py);
    let ys = grid(-3.0, 3.0, 241);
    let bisector: Vec<f64> = ys.iter().map(|&y| core::coulomb_field(&charges, 0.0, y).0).collect();
    figure
        .arrow("part 1", "reference", (px, py), (px + e1x, py + e1y))
        .arrow("part 2", "reference", (px, py), (px + e2x, py + e2y))
        .arrow("field", "exact", (px, py), (px + ex, py + ey))
        .point("plus", "text", -1.0, 0.0)
        .point("minus", "text", 1.0, 0.0)
        .point("hand", "exact", px, py)
        .series("bisector", "exact", ys, bisector)
        .point("bisector point", "exact", py, core::coulomb_field(&charges, 0.0, py).0)
        .value("ex", ex)
        .value("ey", ey)
        .value("magnitude", ex.hypot(ey))
        .value("e1x", e1x)
        .value("e1y", e1y)
        .value("e2x", e2x)
        .value("e2y", e2y)
        .value("flux_drift", drift)
        .value("lines", lines as f64)
        .checked()
}

fn potential(params: &Value) -> Result<Figure, String> {
    let h = positive(params, "h", 0.1)?;
    let n = count(params, "n", 8, 1024)?;
    if n % 2 == 1 || h > 0.5 {
        return Err("n must be even and h at most 0.5".into());
    }
    let charges = dipole();
    let mut figure = Figure::new();
    for (k, x0) in [-0.85, -0.7, -0.5, -0.25, 0.0, 0.25, 0.5, 0.7, 0.85].into_iter().enumerate() {
        let points = core::equipotential_line(&charges, x0, 0.0, 0.01, 6000, BOUNDS);
        let (xs, ys) = split(&points);
        figure = figure.series(&format!("level {k}"), "reference", xs, ys);
    }
    figure = direction_grid(figure, "grid", "vector", 0.5, |x, y| away_from_charges(x, y) && x.hypot(y) > 0.3,
        |x, y| core::coulomb_field(&charges, x, y));
    let straight = |t: f64| ((-0.5 + t, 0.0), (1.0, 0.0));
    let arc = |t: f64| ((-0.5 * (PI * t).cos(), 0.5 * (PI * t).sin()), (0.5 * PI * (PI * t).sin(), 0.5 * PI * (PI * t).cos()));
    let ts = grid(0.0, 1.0, 201);
    let integrand = |path: &dyn Fn(f64) -> ((f64, f64), (f64, f64)), t: f64| {
        let ((x, y), (dx, dy)) = path(t);
        let (ex, ey) = core::coulomb_field(&charges, x, y);
        ex * dx + ey * dy
    };
    let positions = |path: &dyn Fn(f64) -> ((f64, f64), (f64, f64))| -> (Vec<f64>, Vec<f64>) { ts.iter().map(|&t| path(t).0).unzip() };
    let (sx, sy) = positions(&straight);
    let (ax, ay) = positions(&arc);
    let phi_a = core::coulomb_potential(&charges, -0.5, 0.0);
    let phi_b = core::coulomb_potential(&charges, 0.5, 0.0);
    let exact = phi_a - phi_b;
    let (cx, cy) = core::potential_gradient_field(&charges, 0.0, 0.0, h);
    let (fx, fy) = core::coulomb_field(&charges, 0.0, 0.0);
    let steps = vec![0.2, 0.1, 0.05, 0.025];
    let central: Vec<f64> = steps.iter().map(|&s| core::potential_gradient_field(&charges, 0.0, 0.0, s).0).collect();
    let counts = vec![2.0, 4.0, 8.0, 16.0, 32.0];
    let by = |path: &dyn Fn(f64) -> ((f64, f64), (f64, f64))| -> Vec<f64> {
        counts.iter().map(|&m| core::field_line_integral(&charges, path, m as usize)).collect()
    };
    let straight_by_n = by(&straight);
    let arc_by_n = by(&arc);
    figure
        .series("straight path", "numerical", sx, sy)
        .series("arc path", "text", ax, ay)
        .series("straight integrand", "numerical", ts.clone(), ts.iter().map(|&t| integrand(&straight, t)).collect())
        .series("arc integrand", "text", ts.clone(), ts.iter().map(|&t| integrand(&arc, t)).collect())
        .point("A", "text", -0.5, 0.0)
        .point("B", "text", 0.5, 0.0)
        .point("plus", "text", -1.0, 0.0)
        .point("minus", "text", 1.0, 0.0)
        .value("phi_a", phi_a)
        .value("phi_b", phi_b)
        .value("exact_difference", exact)
        .value("simpson_straight", core::field_line_integral(&charges, straight, n))
        .value("simpson_arc", core::field_line_integral(&charges, arc, n))
        .value("central_x", cx)
        .value("central_y", cy)
        .value("exact_x", fx)
        .value("exact_y", fy)
        .value("central_error", cx - fx)
        .array("steps", steps)
        .array("central_by_h", central.clone())
        .array("central_error_by_h", central.iter().map(|c| c - fx).collect())
        .array("counts", counts)
        .array("straight_error", straight_by_n.iter().map(|s| s - exact).collect())
        .array("arc_error", arc_by_n.iter().map(|s| s - exact).collect())
        .array("straight_by_n", straight_by_n)
        .array("arc_by_n", arc_by_n)
        .checked()
}

fn outline(method: &str, center: (f64, f64), size: f64) -> (Vec<f64>, Vec<f64>) {
    if method == "cube" {
        let (x0, x1, y0, y1) = (center.0 - size, center.0 + size, center.1 - size, center.1 + size);
        (vec![x0, x1, x1, x0, x0], vec![y0, y0, y1, y1, y0])
    } else {
        grid(0.0, 2.0 * PI, 181).into_iter().map(|t| (center.0 + size * t.cos(), center.1 + size * t.sin())).unzip()
    }
}

fn gauss(params: &Value) -> Result<Figure, String> {
    let method = text(params, "method", "sphere");
    if method != "sphere" && method != "cube" {
        return Err("method must be sphere or cube".into());
    }
    let n = count(params, "n", 8, 256)?;
    let origin = [0.0; 3];
    let flux = |center: [f64; 3], m: usize| {
        if method == "cube" { core::cube_flux_midpoint(1.0, origin, center, 1.0, m) } else { core::sphere_flux_midpoint(1.0, origin, center, 1.0, m) }
    };
    let (centered, offset, outside) = ([0.0; 3], [0.5, 0.3, 0.0], [2.6, 0.0, 0.0]);
    let exact = core::gauss_flux(1.0);
    let counts = vec![1.0, 2.0, 4.0, 8.0, 16.0, 32.0];
    let by = |center: [f64; 3]| -> Vec<f64> { counts.iter().map(|&m| flux(center, m as usize)).collect() };
    let mut figure = Figure::new();
    for (name, role, c) in [("centered surface", "reference", centered), ("offset surface", "numerical", offset), ("outside surface", "muted", outside)] {
        let (xs, ys) = outline(method, (c[0], c[1]), 1.0);
        figure = figure.series(name, role, xs, ys);
    }
    let (ox, oy) = outline(method, (offset[0], offset[1]), 1.0);
    let marks = ox.len() - 1;
    let every = if method == "cube" { 1 } else { marks / 16 };
    let mut k = 0;
    let mut add = |figure: Figure, x: f64, y: f64| {
        let e = core::point_charge_field_3d(1.0, origin, [x, y, 0.0]);
        k += 1;
        figure.arrow(&format!("flux {k}"), "vector", (x, y), (x + 0.15 * e[0], y + 0.15 * e[1]))
    };
    if method == "cube" {
        for i in 0..4 {
            for s in [0.25, 0.5, 0.75] {
                let (x, y) = (ox[i] + s * (ox[i + 1] - ox[i]), oy[i] + s * (oy[i + 1] - oy[i]));
                figure = add(figure, x, y);
            }
        }
    } else {
        for i in (0..marks).step_by(every.max(1)) {
            figure = add(figure, ox[i], oy[i]);
        }
    }
    let rs = grid(0.0, 3.0, 301);
    let outer = grid(0.5, 3.0, 251);
    let centered_by_n = by(centered);
    let offset_by_n = by(offset);
    let outside_by_n = by(outside);
    figure
        .point("charge", "text", 0.0, 0.0)
        .series("ball", "exact", rs.clone(), rs.iter().map(|&r| core::uniform_ball_field(1.0, 1.0, r)).collect())
        .series("point charge", "reference", outer.clone(), outer.iter().map(|&r| 1.0 / (r * r)).collect())
        .point("ball surface", "exact", 1.0, core::uniform_ball_field(1.0, 1.0, 1.0))
        .point("ball half", "exact", 0.5, core::uniform_ball_field(1.0, 1.0, 0.5))
        .point("ball two", "exact", 2.0, core::uniform_ball_field(1.0, 1.0, 2.0))
        .value("exact", exact)
        .value("flux_centered", flux(centered, n))
        .value("flux_offset", flux(offset, n))
        .value("flux_outside", flux(outside, n))
        .value("flux_one", flux(centered, 1))
        .value("ball_half", core::uniform_ball_field(1.0, 1.0, 0.5))
        .value("ball_two", core::uniform_ball_field(1.0, 1.0, 2.0))
        .array("counts", counts)
        .array("centered_error", centered_by_n.iter().map(|f| f - exact).collect())
        .array("offset_error", offset_by_n.iter().map(|f| f - exact).collect())
        .array("centered_by_n", centered_by_n)
        .array("offset_by_n", offset_by_n)
        .array("outside_by_n", outside_by_n)
        .checked()
}

fn magnetostatics(params: &Value) -> Result<Figure, String> {
    let segments = count(params, "segments", 8, 4096)?;
    let loop_segments = count(params, "loop_segments", 16, 4096)?;
    let circulation_n = count(params, "circulation_n", 64, 4096)?;
    if loop_segments < 3 || circulation_n % 2 == 1 {
        return Err("loop_segments must be at least 3 and circulation_n even".into());
    }
    let (current, half, radius) = (1.0, 1.0, 1.0);
    let wire = core::straight_wire_vertices(half, segments);
    let ring = core::circular_loop_vertices(radius, loop_segments);
    let mut figure = Figure::new();
    let mut k = 0;
    for x in grid(-2.5, 2.5, 11) {
        for y in grid(-2.5, 2.5, 11) {
            if x.hypot(y) < 0.4 {
                continue;
            }
            let b = core::biot_savart_polyline(current, &wire, [x, y, 0.0]);
            if let Some((from, to)) = centered_arrow(x, y, b[0], b[1], 0.24) {
                figure = figure.arrow(&format!("grid {k}"), "numerical", from, to);
                k += 1;
            }
        }
    }
    for (i, r) in [0.5, 1.0, 1.5, 2.0, 2.5].into_iter().enumerate() {
        let (xs, ys) = outline("sphere", (0.0, 0.0), r);
        figure = figure.series(&format!("field circle {i}"), "exact", xs, ys);
    }
    let (enclosing, enclosing_r) = ((0.5, 0.0), 1.0);
    let (apart, apart_r) = ((2.2, 0.0), 0.7);
    let (lx, ly) = outline("sphere", enclosing, enclosing_r);
    let (fx, fy) = outline("sphere", apart, apart_r);
    let zs = grid(-3.0, 3.0, 241);
    let wire_counts = vec![1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0];
    let loop_counts = vec![4.0, 8.0, 16.0, 32.0, 64.0, 128.0];
    let wire_by_n: Vec<f64> = wire_counts.iter().map(|&m| core::biot_savart_polyline(current, &core::straight_wire_vertices(half, m as usize), [1.0, 0.0, 0.0])[1]).collect();
    let loop_by_n: Vec<f64> = loop_counts.iter().map(|&m| core::biot_savart_polyline(current, &core::circular_loop_vertices(radius, m as usize), [0.0; 3])[2]).collect();
    let wire_exact = core::finite_wire_field(current, half, 1.0);
    let loop_exact = core::loop_axis_field(current, radius, 0.0);
    let loop_at = |z: f64| core::biot_savart_polyline(current, &ring, [0.0, 0.0, z])[2];
    figure
        .series("ampere loop", "text", lx, ly)
        .series("apart loop", "muted", fx, fy)
        .point("wire", "text", 0.0, 0.0)
        .series("axis numerical", "numerical", zs.clone(), zs.iter().map(|&z| loop_at(z)).collect())
        .series("axis exact", "exact", zs.clone(), zs.iter().map(|&z| core::loop_axis_field(current, radius, z)).collect())
        .point("axis center", "numerical", 0.0, loop_at(0.0))
        .point("axis one", "numerical", 1.0, loop_at(1.0))
        .value("wire_numerical", core::biot_savart_polyline(current, &wire, [1.0, 0.0, 0.0])[1])
        .value("wire_exact", wire_exact)
        .value("infinite", core::infinite_wire_field(current, 1.0))
        .value("loop_numerical", loop_at(0.0))
        .value("loop_exact", loop_exact)
        .value("loop_one_numerical", loop_at(1.0))
        .value("loop_one_exact", core::loop_axis_field(current, radius, 1.0))
        .value("ampere_enclosing", core::ampere_circulation(current, enclosing, enclosing_r, circulation_n))
        .value("ampere_apart", core::ampere_circulation(current, apart, apart_r, circulation_n))
        .value("ampere_exact", 4.0 * PI * current)
        .array("wire_counts", wire_counts)
        .array("wire_by_n", wire_by_n.clone())
        .array("wire_error", wire_by_n.iter().map(|b| b - wire_exact).collect())
        .array("loop_counts", loop_counts)
        .array("loop_by_n", loop_by_n.clone())
        .array("loop_error", loop_by_n.iter().map(|b| b - loop_exact).collect())
        .checked()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn coulomb_example_at_zero_one() {
        let f = figure("coulomb", &json!({})).unwrap();
        assert!((f.values["ex"] - 0.5_f64.sqrt()).abs() < 1e-15 && f.values["ey"].abs() < 1e-15);
        assert!((f.values["e1x"] - 0.5_f64.sqrt() / 2.0).abs() < 1e-15);
        assert!(f.values["flux_drift"] < 1e-6);
        assert_eq!(f.series.iter().filter(|s| s.name.starts_with("line")).count(), 16);
    }

    #[test]
    fn potential_example() {
        let f = figure("potential", &json!({})).unwrap();
        assert!((f.values["exact_difference"] - 8.0 / 3.0).abs() < 1e-14);
        assert!((f.values["central_x"] - 200.0 / 99.0).abs() < 1e-12);
        assert!((f.values["simpson_straight"] - 8.0 / 3.0).abs() < 1e-2);
        assert!((f.arrays["arc_by_n"][4] - 8.0 / 3.0).abs() < 1e-4);
    }

    #[test]
    fn gauss_example() {
        let s = figure("gauss", &json!({ "method": "sphere" })).unwrap();
        assert!((s.values["flux_one"] - 2.0 * PI * PI).abs() < 1e-12);
        assert!((s.arrays["offset_by_n"][5] - 4.0 * PI).abs() < 0.05);
        let c = figure("gauss", &json!({ "method": "cube" })).unwrap();
        assert!((c.values["flux_one"] - 24.0).abs() < 1e-12);
        assert!(c.values["flux_outside"].abs() < 0.05);
        assert!(figure("gauss", &json!({ "method": "other" })).is_err());
    }

    #[test]
    fn magnetostatics_example() {
        let f = figure("magnetostatics", &json!({})).unwrap();
        assert!((f.arrays["wire_by_n"][0] - 2.0).abs() < 1e-15);
        assert!((f.values["wire_exact"] - 2.0_f64.sqrt()).abs() < 1e-15);
        assert!((f.values["loop_exact"] - 2.0 * PI).abs() < 1e-14);
        assert!((f.values["ampere_enclosing"] - 4.0 * PI).abs() < 1e-3);
        assert!(f.values["ampere_apart"].abs() < 1e-3);
    }

    #[test]
    fn other_units_fall_through() {
        assert!(figure("lorentz", &json!({})).unwrap_err().starts_with("unknown unit"));
    }
}
