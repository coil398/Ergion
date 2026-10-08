//! 分子動力学の単元の値。式は `ergion_core::molecular` の各関数の rustdoc にある。
//!
//! NVT アンサンブルと熱浴法、近接リスト法とセル分割法。単位は \(\varepsilon = \sigma = m = k_B = 1\)。

use ergion_core::molecular::{
    berendsen_factor, cell_index, nearest_image_distance, neighbor_pairs, scale_velocities,
};
use serde_json::Value;

use crate::lesson::{grid, Figure, LessonModel};

/// この部分の単元の図。
pub fn figure(unit: &str, _params: &Value) -> Result<Figure, String> {
    match unit {
        "nvt" => Ok(nvt_figure()),
        "neighbor-list" => Ok(neighbor_figure()),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown unit {unit}"))
}

/// \(T_0 = 1\)、\(\Delta t = \tau = 1\) の Berendsen 係数 \(\lambda(T)\) と、\(T = 4\) の手の例。
fn nvt_figure() -> Figure {
    let temperature = grid(0.25, 8.0, 121);
    let factor = temperature.iter().map(|&t| berendsen_factor(t, 1.0, 1.0, 1.0)).collect();
    let lambda = berendsen_factor(4.0, 1.0, 1.0, 1.0);
    let mut velocities = vec![[2.0, 0.0, 0.0]];
    scale_velocities(&mut velocities, lambda);
    Figure::new()
        .series("factor", "numerical", temperature, factor)
        .point("example", "numerical", 4.0, lambda)
        .value("factor", lambda)
        .value("lambda_squared", lambda * lambda)
        .value("scaled", velocities[0][0])
        .value("temperature", 4.0)
        .value("target", 1.0)
}

/// セル番号 \(\lfloor x/\ell \rfloor\) と、最小イメージで選んだ近接対。
fn neighbor_figure() -> Figure {
    let cell = 2.5_f64;
    let x = grid(0.0, 10.0, 401);
    let index = x.iter().map(|&x| cell_index(x, cell) as f64).collect();
    let positions = vec![[0.1, 0.0, 0.0], [9.8, 0.0, 0.0], [5.0, 0.0, 0.0]];
    let pairs = neighbor_pairs(&positions, 10.0, 1.0);
    let hand = cell_index(7.2, cell);
    let distance = nearest_image_distance([9.8 - 0.1, 0.0, 0.0], 10.0);
    Figure::new()
        .series("cell", "numerical", x, index)
        .point("hand", "numerical", 7.2, hand as f64)
        .point("p0", "exact", 0.1, 0.0)
        .point("p1", "exact", 9.8, 0.0)
        .point("p2", "reference", 5.0, 0.0)
        .value("cell_index", hand as f64)
        .value("pair_count", pairs.len() as f64)
        .value("distance", distance)
        .value("cell", cell)
        .value("cutoff", 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn hand_examples() {
        let nvt = figure("nvt", &json!({})).unwrap();
        assert!((nvt.values["factor"] - 0.5).abs() < 1e-15);
        assert!((nvt.values["scaled"] - 1.0).abs() < 1e-15);
        let neighbor = figure("neighbor-list", &json!({})).unwrap();
        assert_eq!(neighbor.values["cell_index"], 2.0);
        assert_eq!(neighbor.values["pair_count"], 1.0);
        assert!((neighbor.values["distance"] - 0.3).abs() < 1e-12);
    }
}
