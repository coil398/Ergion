//! NVT アンサンブルと熱浴法、近接リスト法とセル分割法。
//!
//! 単位は [`super::classical`] と同じで、\(\varepsilon = \sigma = m = k_B = 1\) です。

use super::classical::nearest_image_distance;

/// Berendsen の熱浴がすべての速度に掛ける係数
/// \[
/// \lambda = \sqrt{1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)}
/// \]
/// を返します。\(T > 0\) は瞬時温度、\(T_0 > 0\) は目標の温度、\(\Delta t > 0\) は時間刻み、\(\tau > 0\) は熱浴の時定数です。
/// 根号の中が負になるときは 0 を返します。運動エネルギーは \(\lambda^2\) 倍になります。
pub fn berendsen_factor(temperature: f64, target: f64, dt: f64, tau: f64) -> f64 {
    let inside = 1.0 + (dt / tau) * (target / temperature - 1.0);
    inside.max(0.0).sqrt()
}

/// 速度の各成分を \(\lambda\) 倍します。
pub fn scale_velocities(velocities: &mut [[f64; 3]], factor: f64) {
    for velocity in velocities {
        for component in velocity.iter_mut() {
            *component *= factor;
        }
    }
}

/// 座標 \(x\) が入るセルの番号 \(\lfloor x / \ell \rfloor\) を返します。\(\ell > 0\) はセルの一辺です。
pub fn cell_index(x: f64, cell: f64) -> i64 {
    (x / cell).floor() as i64
}

/// 周期境界のもとで、最小イメージの距離が `cutoff` 以下の粒子対 \((i, j)\)（\(i < j\)）を返します。
pub fn neighbor_pairs(positions: &[[f64; 3]], box_length: f64, cutoff: f64) -> Vec<(usize, usize)> {
    let mut pairs = Vec::new();
    for i in 0..positions.len() {
        for j in (i + 1)..positions.len() {
            let difference = [
                positions[j][0] - positions[i][0],
                positions[j][1] - positions[i][1],
                positions[j][2] - positions[i][2],
            ];
            if nearest_image_distance(difference, box_length) <= cutoff {
                pairs.push((i, j));
            }
        }
    }
    pairs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn berendsen_hand_example_halves_a_hot_velocity() {
        let factor = berendsen_factor(4.0, 1.0, 1.0, 1.0);
        assert!((factor - 0.5).abs() < 1e-15);
        let mut velocities = vec![[2.0, 0.0, 0.0]];
        scale_velocities(&mut velocities, factor);
        assert!((velocities[0][0] - 1.0).abs() < 1e-15);
    }

    #[test]
    fn cell_index_of_seven_point_two_is_two() {
        assert_eq!(cell_index(7.2, 2.5), 2);
        assert_eq!(cell_index(0.0, 2.5), 0);
        assert_eq!(cell_index(2.5, 2.5), 1);
    }

    #[test]
    fn neighbor_pairs_use_the_minimum_image() {
        let positions = vec![[0.1, 0.0, 0.0], [9.8, 0.0, 0.0], [5.0, 0.0, 0.0]];
        let pairs = neighbor_pairs(&positions, 10.0, 1.0);
        assert_eq!(pairs, vec![(0, 1)]);
    }
}
