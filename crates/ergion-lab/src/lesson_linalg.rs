//! 線形代数の単元の値。式は `ergion_core::linalg` の各関数の rustdoc にある。

use ergion_core::linalg::{self as core, Matrix, Pivoting};
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, count, grid, num, text};

/// 消去法と LU 分解のページの 3 元の例 \(A\mathbf{x} = \mathbf{b}\)。厳密解は \(\mathbf{x} = (2, 3, -1)^T\)。
fn example3() -> (Matrix, Vec<f64>) {
    (
        Matrix::from_rows(&[&[2.0, 1.0, -1.0], &[-3.0, -1.0, 2.0], &[-2.0, 1.0, 2.0]]),
        vec![8.0, -11.0, -3.0],
    )
}

/// 固有値のページの行列 \(A = \begin{pmatrix} 1 & 1 \\ 4 & 1 \end{pmatrix}\)。
fn eigen_matrix() -> Matrix {
    Matrix::from_rows(&[&[1.0, 1.0], &[4.0, 1.0]])
}

/// 最小二乗法のページの観測点 \((t_i, b_i)\)。
const TIMES: [f64; 5] = [0.0, 1.0, 2.0, 3.0, 4.0];
const OBSERVED: [f64; 5] = [1.0, 2.0, 2.0, 4.0, 5.0];

/// 線形代数の単元の図。
///
/// - `elimination`: 3 元の例の前進消去と解、軸の小さい 2 元の例 \(\begin{pmatrix} \varepsilon & 1 \\ 1 & 1 \end{pmatrix}\mathbf{x} = (1, 2)^T\) の解と残差、
///   2 直線と 3 平面の切り口。`method` は `no-pivot`（ピボット選択なし）か `partial-pivot`（部分ピボット選択）。
/// - `lu`: 3 元の例の \(P\)、\(L\)、\(U\)、\(P\mathbf{b}\)、\(\mathbf{y}\)、\(\mathbf{x}\)。
/// - `eigen`: 単位円とその像の楕円、固有ベクトル、反復の推定値と誤差。`method` は `power`（ベキ乗法）か `qr`（QR 法）。
/// - `least-squares`: 5 点への直線の当てはめ、残差、列空間への射影。`method` は `normal`（正規方程式）か `householder`（Householder 変換の QR 分解）。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "elimination" => elimination(params),
        "lu" => lu(),
        "eigen" => eigen(params),
        "least-squares" => least_squares(params),
        _ => Err(format!("unknown linalg unit {unit}")),
    }
}

/// 線形代数の単元は時間発展を持たない。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown linalg unit {unit}"))
}

fn elimination(params: &Value) -> Result<Figure, String> {
    let pivoting = match text(params, "method", "no-pivot") {
        "no-pivot" => Pivoting::None,
        "partial-pivot" => Pivoting::Partial,
        other => return Err(format!("unknown method {other}")),
    };
    let eps = num(params, "epsilon", 1e-17)?;
    if eps == 0.0 || eps.abs() >= 0.5 {
        return Err("epsilon must be nonzero and |epsilon| < 0.5".into());
    }

    let (a, b) = example3();
    let e3 = core::gauss_eliminate(&a, &b, pivoting)?;
    let x3 = e3.solution.clone();
    let r3 = core::residual_norm(&a, &x3, &b);

    let a2 = Matrix::from_rows(&[&[eps, 1.0], &[1.0, 1.0]]);
    let b2 = [1.0, 2.0];
    let e2 = core::gauss_eliminate(&a2, &b2, pivoting)?;
    let reference = core::cramer_2x2(&a2, &b2).ok_or("singular 2x2 system")?;
    let x2 = e2.solution.clone();
    let error2 = (x2[0] - reference[0]).abs().max((x2[1] - reference[1]).abs());

    let mut fig = Figure::new();
    let (lo, hi) = (-0.5, 2.5);
    for (i, name) in ["eps-line-1", "eps-line-2"].into_iter().enumerate() {
        let [p, q] = core::line_endpoints(a2[(i, 0)], a2[(i, 1)], b2[i], lo, hi).ok_or("degenerate line")?;
        fig = fig.series(name, "reference", vec![p.0, q.0], vec![p.1, q.1]);
    }
    fig = fig
        .point("eps-exact", "exact", reference[0], reference[1])
        .point("eps-computed", "numerical", x2[0], x2[1]);

    let z = x3[2];
    for i in 0..3 {
        let c = b[i] - a[(i, 2)] * z;
        let [p, q] = core::line_endpoints(a[(i, 0)], a[(i, 1)], c, 0.5, 3.5).ok_or("degenerate trace")?;
        fig = fig.series(&format!("trace-{}", i + 1), "reference", vec![p.0, q.0], vec![p.1, q.1]);
    }
    fig = fig.point("solution-exact", "exact", 2.0, 3.0).point("solution", "numerical", x3[0], x3[1]);

    Ok(fig
        .array("x3", x3)
        .array("upper3", e3.upper.data.clone())
        .array("multipliers3", e3.operations.iter().map(|o| o.multiplier).collect())
        .array("swaps3", e3.swaps.iter().map(|&(_, p)| p as f64).collect())
        .value("residual3", r3)
        .value("trace_z", z)
        .array("eps_x", x2)
        .array("eps_exact", reference.to_vec())
        .array("eps_upper", e2.upper.data.clone())
        .value("eps_multiplier", e2.operations[0].multiplier)
        .value("eps_residual", core::residual_norm(&a2, &e2.solution, &b2))
        .value("eps_error", error2)
        .value("epsilon", eps))
}

fn lu() -> Result<Figure, String> {
    let (a, b) = example3();
    let lu = core::lu_decompose(&a)?;
    let (pb, y, x) = lu.solve(&b)?;
    let p = lu.permutation();
    let pa = p.mul(&a);
    let prod = lu.l.mul(&lu.u);
    let gap = pa.data.iter().zip(&prod.data).map(|(u, v)| (u - v).abs()).fold(0.0, f64::max);
    let residual = core::residual_norm(&a, &x, &b);
    Ok(Figure::new()
        .array("A", a.data.clone())
        .array("b", b)
        .array("P", p.data)
        .array("perm", lu.perm.iter().map(|&i| i as f64).collect())
        .array("PA", pa.data)
        .array("L", lu.l.data.clone())
        .array("U", lu.u.data.clone())
        .array("Pb", pb)
        .array("y", y)
        .array("x", x)
        .value("factor_gap", gap)
        .value("residual", residual))
}

fn eigen(params: &Value) -> Result<Figure, String> {
    let method = text(params, "method", "power");
    let iterations = count(params, "iterations", 15, 60)?;
    let a = eigen_matrix();
    let [l1, l2] = core::eigenvalues_2x2(&a).ok_or("complex eigenvalues")?;
    let v1 = core::eigenvector_2x2(&a, l1);
    let v2 = core::eigenvector_2x2(&a, l2);
    let unit = |v: [f64; 2]| {
        let n = core::norm2(&v);
        [v[0] / n, v[1] / n]
    };
    let (u1, u2) = (unit(v1), unit(v2));

    let angles = grid(0.0, std::f64::consts::TAU, 181);
    let (cx, cy): (Vec<f64>, Vec<f64>) = angles.iter().map(|t| (t.cos(), t.sin())).unzip();
    let (ex, ey): (Vec<f64>, Vec<f64>) = cx
        .iter()
        .zip(&cy)
        .map(|(&x, &y)| {
            let w = a.mul_vec(&[x, y]);
            (w[0], w[1])
        })
        .unzip();
    let au1 = a.mul_vec(&u1);
    let au2 = a.mul_vec(&u2);

    let mut fig = Figure::new()
        .series("circle", "reference", cx, cy)
        .series("ellipse", "numerical", ex, ey)
        .arrow("v1", "reference", (0.0, 0.0), (u1[0], u1[1]))
        .arrow("Av1", "vector", (0.0, 0.0), (au1[0], au1[1]))
        .arrow("v2", "reference", (0.0, 0.0), (u2[0], u2[1]))
        .arrow("Av2", "vector", (0.0, 0.0), (au2[0], au2[1]))
        .value("lambda1", l1)
        .value("lambda2", l2)
        .array("v1", v1.to_vec())
        .array("v2", v2.to_vec());

    let ks: Vec<f64> = (0..=iterations).map(|k| k as f64).collect();
    let ratio = (l2 / l1).abs();
    let (estimate, second): (Vec<f64>, Option<Vec<f64>>) = match method {
        "power" => {
            let steps = core::power_iteration(&a, &[1.0, 1.0], iterations)?;
            let x1: Vec<f64> = steps.iter().map(|s| s.vector[0]).collect();
            let x2: Vec<f64> = steps.iter().map(|s| s.vector[1]).collect();
            for (k, s) in steps.iter().enumerate() {
                fig = fig.point(&format!("iterate-{k}"), "numerical", s.vector[0], s.vector[1]);
            }
            fig = fig.array("x1", x1).array("x2", x2);
            (steps.iter().map(|s| s.estimate).collect(), None)
        }
        "qr" => {
            let iterates = core::qr_iteration(&a, iterations)?;
            let a21: Vec<f64> = iterates.iter().map(|m| m[(1, 0)]).collect();
            let a12: Vec<f64> = iterates.iter().map(|m| m[(0, 1)]).collect();
            let (kx, ky): (Vec<f64>, Vec<f64>) =
                ks.iter().zip(&a21).filter(|(_, v)| **v != 0.0).map(|(k, v)| (*k, v.abs())).unzip();
            fig = fig.series("subdiagonal", "difference", kx, ky).array("a21", a21).array("a12", a12);
            (iterates.iter().map(|m| m[(0, 0)]).collect(), Some(iterates.iter().map(|m| m[(1, 1)]).collect()))
        }
        other => return Err(format!("unknown method {other}")),
    };
    let error: Vec<f64> = estimate.iter().map(|e| (e - l1).abs()).collect();
    let (kx, ky): (Vec<f64>, Vec<f64>) =
        ks.iter().zip(&error).filter(|(_, v)| **v > 0.0).map(|(k, v)| (*k, *v)).unzip();
    let rate: Vec<f64> = ks.iter().map(|&k| error[0] * ratio.powf(k)).collect();
    fig = fig
        .series("error", "numerical", kx, ky)
        .series("rate", "muted", ks.clone(), rate)
        .value("ratio", ratio)
        .value("estimate", *estimate.last().expect("one estimate"))
        .value("error", *error.last().expect("one error"))
        .array("k", ks)
        .array("estimate", estimate)
        .array("error", error);
    if let Some(second) = second {
        fig = fig
            .value("estimate2", *second.last().expect("one estimate"))
            .array("estimate2", second);
    }
    Ok(fig)
}

fn least_squares(params: &Value) -> Result<Figure, String> {
    let method = text(params, "method", "normal");
    let shift = num(params, "shift", 1e5)?;
    let solve = |a: &Matrix, b: &[f64]| -> Result<(Vec<f64>, f64, Vec<f64>), String> {
        match method {
            "normal" => {
                let (ata, _) = core::normal_equations(a, b);
                Ok((core::least_squares_normal(a, b)?, core::condition_number(&ata), ata.data))
            }
            "householder" => {
                let qr = core::least_squares_qr(a, b)?;
                let kappa = core::condition_number(&qr.r);
                Ok((qr.solution, kappa, qr.r.data))
            }
            other => Err(format!("unknown method {other}")),
        }
    };

    let a = core::line_design(&TIMES);
    let (ata, atb) = core::normal_equations(&a, &OBSERVED);
    let (x, kappa, solved) = solve(&a, &OBSERVED)?;
    let (e0, e1) = core::line_fit_centered(&TIMES, &OBSERVED).ok_or("all t equal")?;
    let fitted = a.mul_vec(&x);
    let r = core::residual(&a, &x, &OBSERVED);
    let atr = a.transpose().mul_vec(&r);
    let householder = core::householder_qr(&a)?;
    let qtb = householder.q.transpose().mul_vec(&OBSERVED);

    let shifted_t: Vec<f64> = TIMES.iter().map(|t| t + shift).collect();
    let shifted_a = core::line_design(&shifted_t);
    let (sx, _, _) = solve(&shifted_a, &OBSERVED)?;
    let (s0, s1) = core::line_fit_centered(&shifted_t, &OBSERVED).ok_or("all t equal")?;

    let ts = grid(-0.5, 4.5, 2);
    let mut fig = Figure::new()
        .series("fit", "numerical", ts.clone(), ts.iter().map(|t| x[0] + x[1] * t).collect())
        .series("exact-fit", "exact", ts.clone(), ts.iter().map(|t| e0 + e1 * t).collect());
    for i in 0..TIMES.len() {
        fig = fig
            .arrow(&format!("residual-{i}"), "difference", (TIMES[i], fitted[i]), (TIMES[i], OBSERVED[i]))
            .point(&format!("data-{i}"), "text", TIMES[i], OBSERVED[i]);
    }
    let fit_norm = core::norm2(&fitted);
    let r_norm = core::norm2(&r);
    fig = fig
        .arrow("projection-b", "reference", (0.0, 0.0), (fit_norm, r_norm))
        .arrow("projection-Ax", "numerical", (0.0, 0.0), (fit_norm, 0.0))
        .arrow("projection-r", "difference", (fit_norm, 0.0), (fit_norm, r_norm))
        .series("column-space", "muted", vec![0.0, fit_norm * 1.1], vec![0.0, 0.0]);

    Ok(fig
        .array("t", TIMES.to_vec())
        .array("b", OBSERVED.to_vec())
        .array("AtA", ata.data)
        .array("Atb", atb)
        .array("solved", solved)
        .array("x", x.clone())
        .array("exact", vec![e0, e1])
        .array("fitted", fitted)
        .array("r", r.clone())
        .array("Atr", atr.clone())
        .array("Qtb", qtb)
        .array("R", householder.r.data)
        .value("residual2", core::dot(&r, &r))
        .value("atr_norm", core::norm2(&atr))
        .value("b_norm", core::norm2(&OBSERVED))
        .value("fit_norm", fit_norm)
        .value("r_norm", r_norm)
        .value("kappa", kappa)
        .value("coef_error", (x[0] - e0).abs().max((x[1] - e1).abs()))
        .value("shift", shift)
        .value("shifted_c0", sx[0])
        .value("shifted_c1", sx[1])
        .value("shifted_exact_c0", s0)
        .value("shifted_exact_c1", s1)
        .value("shifted_slope_error", (sx[1] - s1).abs())
        .value("shifted_kappa_a", core::condition_number(&shifted_a)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn elimination_tabs_differ_on_the_small_pivot() {
        let plain = figure("elimination", &json!({ "method": "no-pivot" })).unwrap().checked().unwrap();
        assert_eq!(plain.arrays["eps_x"], vec![0.0, 1.0]);
        assert_eq!(plain.values["eps_residual"], 1.0);
        assert_eq!(plain.arrays["x3"], vec![2.0, 3.0, -1.0]);
        assert_eq!(plain.arrays["multipliers3"], vec![-1.5, -1.0, 4.0]);
        let pivoted = figure("elimination", &json!({ "method": "partial-pivot" })).unwrap().checked().unwrap();
        assert_eq!(pivoted.arrays["eps_x"], vec![1.0, 1.0]);
        assert_eq!(pivoted.values["eps_error"], 0.0);
        assert!(pivoted.values["residual3"] < 1e-13);
    }

    #[test]
    fn lu_returns_the_hand_factors() {
        let fig = figure("lu", &json!({})).unwrap().checked().unwrap();
        assert_eq!(fig.arrays["perm"], vec![1.0, 2.0, 0.0]);
        assert_eq!(fig.arrays["Pb"], vec![-11.0, -3.0, 8.0]);
        assert!((fig.arrays["L"][3] - 2.0 / 3.0).abs() < 1e-15);
        assert!((fig.arrays["U"][8] - 0.2).abs() < 1e-15);
        assert!(fig.values["factor_gap"] < 1e-14);
    }

    #[test]
    fn eigen_methods_converge_to_three() {
        let power = figure("eigen", &json!({ "method": "power" })).unwrap().checked().unwrap();
        assert_eq!(power.values["lambda1"], 3.0);
        assert_eq!(power.values["lambda2"], -1.0);
        assert!((power.arrays["estimate"][1] - 79.0 / 29.0).abs() < 1e-14);
        assert!(power.values["error"] < 1e-5);
        let qr = figure("eigen", &json!({ "method": "qr" })).unwrap().checked().unwrap();
        assert!((qr.arrays["estimate"][1] - 37.0 / 17.0).abs() < 1e-14);
        assert!((qr.values["estimate2"] + 1.0).abs() < 1e-5);
    }

    #[test]
    fn least_squares_tabs() {
        let normal = figure("least-squares", &json!({ "method": "normal" })).unwrap().checked().unwrap();
        assert_eq!(normal.arrays["AtA"], vec![5.0, 10.0, 10.0, 30.0]);
        assert_eq!(normal.arrays["Atb"], vec![14.0, 38.0]);
        assert!((normal.values["residual2"] - 0.8).abs() < 1e-13);
        let qr = figure("least-squares", &json!({ "method": "householder" })).unwrap().checked().unwrap();
        assert!((qr.values["kappa"] * qr.values["kappa"] - normal.values["kappa"]).abs() < 1e-9);
        assert!(qr.values["shifted_slope_error"] * 100.0 < normal.values["shifted_slope_error"]);
        assert!((qr.values["b_norm"].powi(2) - qr.values["fit_norm"].powi(2) - qr.values["r_norm"].powi(2)).abs() < 1e-12);
    }
}
