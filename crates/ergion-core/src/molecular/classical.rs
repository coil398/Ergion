//! Lennard–Jones ポテンシャル、周期境界条件と最小イメージ法、NVE アンサンブルと速度 Verlet 法、巨視的物理量。
//!
//! 粒子系の関数はエネルギー、長さ、質量の単位を \(\varepsilon\)、\(\sigma\)、\(m\) にとり、\(\varepsilon = \sigma = m = k_B = 1\) で書く。ただし質量 \(m\) は引数で渡す。
//! 位置と速度は3成分の配列 `[f64; 3]` の列である。

use crate::statistics::Rng;

/// Lennard–Jones 12-6 ポテンシャル \(V(r)\) を返します。
///
/// \[
/// V(r) = 4\varepsilon\left[\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]
/// \]
/// \(r > 0\) は2原子の中心間距離、\(\varepsilon > 0\) は井戸の深さ、\(\sigma > 0\) は \(V(\sigma) = 0\) となる距離です。
/// 第1項は電子雲の重なりによる反発、第2項は分散力による引力を表します。
/// \(r = 2^{1/6}\sigma\) で最小値 \(V = -\varepsilon\) をとります。この値は厳密です。
pub fn lj_potential(r: f64, epsilon: f64, sigma: f64) -> f64 {
    let s6 = (sigma / r).powi(6);
    4.0 * epsilon * (s6 * s6 - s6)
}

/// Lennard–Jones ポテンシャルの力の大きさ \(F(r) = -V'(r)\) を返します。正が反発、負が引力です。
///
/// \(V(r) = 4\varepsilon(\sigma^{12} r^{-12} - \sigma^{6} r^{-6})\) を \(r\) で微分すると
/// \[
/// V'(r) = 4\varepsilon\left(-12\,\sigma^{12} r^{-13} + 6\,\sigma^{6} r^{-7}\right)
/// = -\frac{24\varepsilon}{r}\left[2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]
/// \]
/// なので
/// \[
/// F(r) = \frac{24\varepsilon}{r}\left[2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]
/// \]
/// です。原子 \(j\) が原子 \(i\) に及ぼす力のベクトルは \(\mathbf{F}_{ij} = F(r_{ij})\,\mathbf{r}_{ij}/r_{ij}\)、
/// \(\mathbf{r}_{ij} = \mathbf{r}_i - \mathbf{r}_j\) です。\(F(2^{1/6}\sigma) = 0\) は厳密です。
pub fn lj_force_magnitude(r: f64, epsilon: f64, sigma: f64) -> f64 {
    let s6 = (sigma / r).powi(6);
    24.0 * epsilon * (2.0 * s6 * s6 - s6) / r
}

/// ポテンシャルが最小になる距離 \(r_0 = 2^{1/6}\sigma\) を返します。
///
/// \(F(r_0) = 0\) から \(2(\sigma/r_0)^{12} = (\sigma/r_0)^{6}\)、すなわち \((\sigma/r_0)^6 = 1/2\) です。
/// よって \(r_0 = 2^{1/6}\sigma\)、\(V(r_0) = 4\varepsilon(1/4 - 1/2) = -\varepsilon\) です。
pub fn lj_equilibrium_distance(sigma: f64) -> f64 {
    2f64.powf(1.0 / 6.0) * sigma
}

/// 全エネルギー \(E\)（\(-\varepsilon < E < 0\)）で振動する2原子の折り返し点 \((r_{\min}, r_{\max})\) を返します。範囲外なら `None` です。
///
/// 折り返し点では相対速度が 0 なので \(V(r) = E\) です。\(x = (\sigma/r)^6\) と置くと
/// \(4\varepsilon(x^2 - x) = E\)、すなわち \(x^2 - x - E/(4\varepsilon) = 0\) で、
/// \[
/// x_\pm = \frac{1 \pm \sqrt{1 + E/\varepsilon}}{2}, \qquad r_{\min} = \sigma x_+^{-1/6}, \quad r_{\max} = \sigma x_-^{-1/6}
/// \]
/// です。\(E = -3\varepsilon/4\) なら \(x_\pm = 3/4, 1/4\) で、\(r_{\max} = 2^{1/3}\sigma\) です。
pub fn lj_turning_points(energy: f64, epsilon: f64, sigma: f64) -> Option<(f64, f64)> {
    if !(energy > -epsilon && energy < 0.0) {
        return None;
    }
    let root = (1.0 + energy / epsilon).sqrt();
    let (plus, minus) = (0.5 * (1.0 + root), 0.5 * (1.0 - root));
    Some((sigma * plus.powf(-1.0 / 6.0), sigma * minus.powf(-1.0 / 6.0)))
}

/// カットオフ距離 \(r_c\) で切断しただけのポテンシャルを返します。
///
/// \(r < r_c\) で \(V(r)\)、\(r \ge r_c\) で 0 です。\(r = r_c\) でポテンシャルは \(-V(r_c)\) だけ跳び、
/// 力も \(F(r_c)\) から 0 へ跳びます。
pub fn lj_truncated_potential(r: f64, epsilon: f64, sigma: f64, cutoff: f64) -> f64 {
    if r < cutoff { lj_potential(r, epsilon, sigma) } else { 0.0 }
}

/// force-shifted 補正をしたポテンシャル \(V_{\mathrm{sf}}(r)\) を返します。
///
/// \[
/// V_{\mathrm{sf}}(r) = V(r) - V(r_c) - (r - r_c)\,V'(r_c) = V(r) - V(r_c) + (r - r_c)\,F(r_c) \quad (r < r_c)
/// \]
/// で、\(r \ge r_c\) では 0 です。\(r_c\) はカットオフ距離です。
/// \(V_{\mathrm{sf}}(r_c) = 0\) かつ \(V_{\mathrm{sf}}'(r_c) = 0\) なので、ポテンシャルも力も \(r_c\) で連続です。
pub fn lj_force_shifted_potential(r: f64, epsilon: f64, sigma: f64, cutoff: f64) -> f64 {
    if r >= cutoff {
        return 0.0;
    }
    lj_potential(r, epsilon, sigma) - lj_potential(cutoff, epsilon, sigma)
        + (r - cutoff) * lj_force_magnitude(cutoff, epsilon, sigma)
}

/// force-shifted 補正をした力の大きさ \(F_{\mathrm{sf}}(r) = F(r) - F(r_c)\)（\(r < r_c\)）、\(r \ge r_c\) では 0 を返します。
///
/// [`lj_force_shifted_potential`] を微分して符号を変えたものです。
pub fn lj_force_shifted_force(r: f64, epsilon: f64, sigma: f64, cutoff: f64) -> f64 {
    if r >= cutoff {
        return 0.0;
    }
    lj_force_magnitude(r, epsilon, sigma) - lj_force_magnitude(cutoff, epsilon, sigma)
}

/// 座標 \(x\) を一辺 \(L\) の基本セル \([0, L)\) へ折り返した値 \(x - L\lfloor x/L \rfloor\) を返します。
///
/// \(\lfloor\cdot\rfloor\) は床関数です。\(L\) の整数倍だけずらしても周期系の物理は変わらないので、
/// 粒子がセルの面を越えたら反対側の面から同じ速度で入れ直します。
pub fn wrap_position(x: f64, box_length: f64) -> f64 {
    let wrapped = x - box_length * (x / box_length).floor();
    if wrapped >= box_length { wrapped - box_length } else { wrapped }
}

/// 相対座標の1成分 \(d\) の最小イメージ \(d - L\,\mathrm{round}(d/L)\) を返します。
///
/// \(\mathrm{round}\) は最も近い整数です。結果は \([-L/2, L/2]\) に入り、
/// 粒子 \(j\) の鏡像 \(\mathbf{r}_j + L\mathbf{n}\)（\(\mathbf{n}\) は整数ベクトル）のうち
/// 粒子 \(i\) に最も近いものとの差になります。
pub fn minimum_image(d: f64, box_length: f64) -> f64 {
    d - box_length * (d / box_length).round()
}

/// 相対ベクトル \(\mathbf{d}\) の各成分に [`minimum_image`] を施したベクトルを返します。
pub fn minimum_image_vector(d: [f64; 3], box_length: f64) -> [f64; 3] {
    d.map(|c| minimum_image(c, box_length))
}

/// 相対ベクトル \(\mathbf{d}\) のまわりの 27 個の鏡像 \(\mathbf{d} + L\mathbf{n}\)、\(\mathbf{n} \in \{-1, 0, 1\}^3\) の
/// 長さの最小値を返します。
///
/// \(\mathbf{d}\) の各成分が \([-L, L]\) にあれば、これは最も近い鏡像までの距離の定義どおりの値で、
/// [`minimum_image_vector`] の長さと一致します。
pub fn nearest_image_distance(d: [f64; 3], box_length: f64) -> f64 {
    let mut best = f64::INFINITY;
    for nx in -1..=1 {
        for ny in -1..=1 {
            for nz in -1..=1 {
                let shift = [nx, ny, nz].map(|n| f64::from(n) * box_length);
                let r2: f64 = (0..3).map(|k| (d[k] + shift[k]).powi(2)).sum();
                best = best.min(r2);
            }
        }
    }
    best.sqrt()
}

/// 面心立方格子の位置と、セルの一辺 \(L\) を返します。
///
/// 一辺に \(n_c\) 個の単位胞を並べると粒子数は \(N = 4n_c^3\)、数密度 \(\rho = N/L^3\) から
/// \(L = (N/\rho)^{1/3}\)、格子定数は \(a = L/n_c\) です。単位胞の4個の基底は
/// \((0, 0, 0)\)、\((a/2, a/2, 0)\)、\((a/2, 0, a/2)\)、\((0, a/2, a/2)\) で、全体を \(a/4\) だけずらして面の上に粒子を置きません。
pub fn fcc_lattice(cells: usize, density: f64) -> (Vec<[f64; 3]>, f64) {
    let n = 4 * cells * cells * cells;
    let box_length = (n as f64 / density).cbrt();
    let a = box_length / cells as f64;
    let basis = [[0.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.5, 0.0, 0.5], [0.0, 0.5, 0.5]];
    let mut positions = Vec::with_capacity(n);
    for i in 0..cells {
        for j in 0..cells {
            for k in 0..cells {
                for b in basis {
                    let cell = [i, j, k].map(|c| c as f64);
                    positions.push([0, 1, 2].map(|d| (cell[d] + b[d] + 0.25) * a));
                }
            }
        }
    }
    (positions, box_length)
}

/// 全運動エネルギー \(K = \sum_i \frac{1}{2} m |\mathbf{v}_i|^2\) を返します。\(m\) は全粒子に共通の質量です。
pub fn kinetic_energy(velocities: &[[f64; 3]], mass: f64) -> f64 {
    0.5 * mass * velocities.iter().map(|v| v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sum::<f64>()
}

/// 全運動量 \(\mathbf{P} = \sum_i m\mathbf{v}_i\) を返します。
pub fn total_momentum(velocities: &[[f64; 3]], mass: f64) -> [f64; 3] {
    let mut p = [0.0; 3];
    for v in velocities {
        for k in 0..3 {
            p[k] += mass * v[k];
        }
    }
    p
}

/// 瞬時温度 \(T = 2K/((3N - 3)k_B)\) を返します（\(k_B = 1\)）。
///
/// \(K\) は全運動エネルギー、\(N \ge 2\) は粒子数です。エネルギー等分配則で1自由度あたり \(k_B T/2\) とし、
/// 全運動量 \(\mathbf{P} = \mathbf{0}\) の3つの拘束を自由度 \(3N\) から引きます。
pub fn instantaneous_temperature(kinetic: f64, particles: usize) -> f64 {
    2.0 * kinetic / (3.0 * particles as f64 - 3.0)
}

/// ビリアル圧力 \(P = N k_B T/V + W/(3V)\) を返します（\(k_B = 1\)）。
///
/// \(N\) は粒子数、\(V = L^3\) は体積、\(T\) は温度、\(W = \sum_{i<j} \mathbf{r}_{ij}\cdot\mathbf{F}_{ij}\) は
/// ペアのビリアルです（\(\mathbf{r}_{ij} = \mathbf{r}_i - \mathbf{r}_j\)、\(\mathbf{F}_{ij}\) は \(j\) が \(i\) に及ぼす力）。
/// 第1項は理想気体の圧力、第2項は粒子間力の寄与で、反発なら正、引力なら負です。
pub fn virial_pressure(particles: usize, volume: f64, temperature: f64, virial: f64) -> f64 {
    particles as f64 * temperature / volume + virial / (3.0 * volume)
}

/// [`lj_forces`] の結果。各粒子の力、全ポテンシャルエネルギー、ペアのビリアル。
#[derive(Clone, Debug, PartialEq)]
pub struct LjForces {
    /// 粒子 \(i\) の受ける力 \(\mathbf{F}_i = \sum_{j \ne i} \mathbf{F}_{ij}\)。
    pub forces: Vec<[f64; 3]>,
    /// \(U = \sum_{i<j} V_{\mathrm{sf}}(r_{ij})\)。
    pub potential: f64,
    /// \(W = \sum_{i<j} \mathbf{r}_{ij}\cdot\mathbf{F}_{ij} = \sum_{i<j} r_{ij} F_{\mathrm{sf}}(r_{ij})\)。
    pub virial: f64,
}

/// 周期境界の立方体セルの中の全粒子の力、ポテンシャルエネルギー、ビリアルを返します（\(\varepsilon = \sigma = 1\)）。
///
/// 各ペア \(i < j\) を一度だけ見て、相対ベクトルを最小イメージ \(\mathbf{r}_{ij} = \mathbf{d} - L\,\mathrm{round}(\mathbf{d}/L)\)、
/// \(\mathbf{d} = \mathbf{r}_i - \mathbf{r}_j\) とします。\(r_{ij} < r_c\) のペアだけが寄与し、
/// force-shifted ポテンシャル [`lj_force_shifted_potential`] と力 [`lj_force_shifted_force`] を使います。
/// \(\mathbf{F}_{ij} = F_{\mathrm{sf}}(r_{ij})\,\mathbf{r}_{ij}/r_{ij}\) を \(i\) に足し、作用・反作用の法則により
/// \(-\mathbf{F}_{ij}\) を \(j\) に足すので、力の総和は 0 です。
/// 最小イメージが一つの鏡像だけを数えるために \(r_c < L/2\) が必要です。
pub fn lj_forces(positions: &[[f64; 3]], box_length: f64, cutoff: f64) -> LjForces {
    let n = positions.len();
    let mut forces = vec![[0.0; 3]; n];
    let (mut potential, mut virial) = (0.0, 0.0);
    let rc2 = cutoff * cutoff;
    let v_c = lj_potential(cutoff, 1.0, 1.0);
    let f_c = lj_force_magnitude(cutoff, 1.0, 1.0);
    for i in 0..n {
        for j in i + 1..n {
            let d = minimum_image_vector(
                [0, 1, 2].map(|k| positions[i][k] - positions[j][k]),
                box_length,
            );
            let r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
            if r2 >= rc2 {
                continue;
            }
            let r = r2.sqrt();
            let inv6 = 1.0 / (r2 * r2 * r2);
            let v = 4.0 * (inv6 * inv6 - inv6) - v_c + (r - cutoff) * f_c;
            let f = 24.0 * (2.0 * inv6 * inv6 - inv6) / r - f_c;
            potential += v;
            virial += r * f;
            for k in 0..3 {
                let fk = f * d[k] / r;
                forces[i][k] += fk;
                forces[j][k] -= fk;
            }
        }
    }
    LjForces { forces, potential, virial }
}

/// 速度 Verlet 法で全粒子を1ステップ進め、新しい位置での力を返します。
///
/// `forces` は現在の位置での [`lj_forces`] の値です。\(m\) は質量、\(\Delta t\) は時間刻みです。
/// \[
/// \begin{aligned}
/// \mathbf{v}_i(t + \tfrac{\Delta t}{2}) &= \mathbf{v}_i(t) + \frac{\Delta t}{2m}\mathbf{F}_i(t) \\
/// \mathbf{r}_i(t + \Delta t) &= \mathbf{r}_i(t) + \Delta t\,\mathbf{v}_i(t + \tfrac{\Delta t}{2}) \\
/// \mathbf{v}_i(t + \Delta t) &= \mathbf{v}_i(t + \tfrac{\Delta t}{2}) + \frac{\Delta t}{2m}\mathbf{F}_i(t + \Delta t)
/// \end{aligned}
/// \]
/// 新しい位置は [`wrap_position`] で基本セルへ折り返してから力を計算します。
/// この方法は時間反転について対称で、相空間の体積を保ちます。全エネルギーの誤差は長時間にわたり
/// \(O(\Delta t^2)\) の幅で振動し、一方向に増え続けません。全運動量は力の総和が 0 なので変わりません。
pub fn velocity_verlet(
    positions: &mut [[f64; 3]],
    velocities: &mut [[f64; 3]],
    forces: &LjForces,
    mass: f64,
    dt: f64,
    box_length: f64,
    cutoff: f64,
) -> LjForces {
    let half = 0.5 * dt / mass;
    for (i, (r, v)) in positions.iter_mut().zip(velocities.iter_mut()).enumerate() {
        for k in 0..3 {
            v[k] += half * forces.forces[i][k];
            r[k] = wrap_position(r[k] + dt * v[k], box_length);
        }
    }
    let next = lj_forces(positions, box_length, cutoff);
    for (i, v) in velocities.iter_mut().enumerate() {
        for k in 0..3 {
            v[k] += half * next.forces[i][k];
        }
    }
    next
}

/// 前進 Euler 法で全粒子を1ステップ進め、新しい位置での力を返します。
///
/// \[
/// \mathbf{r}_i(t + \Delta t) = \mathbf{r}_i(t) + \Delta t\,\mathbf{v}_i(t), \qquad
/// \mathbf{v}_i(t + \Delta t) = \mathbf{v}_i(t) + \frac{\Delta t}{m}\mathbf{F}_i(t)
/// \]
/// 1ステップの局所誤差は \(O(\Delta t^2)\) ですが、時間反転について対称でないため、
/// 全エネルギーはステップを重ねるごとに一方向へずれていきます。全運動量は保たれます。
pub fn forward_euler(
    positions: &mut [[f64; 3]],
    velocities: &mut [[f64; 3]],
    forces: &LjForces,
    mass: f64,
    dt: f64,
    box_length: f64,
    cutoff: f64,
) -> LjForces {
    for (i, (r, v)) in positions.iter_mut().zip(velocities.iter_mut()).enumerate() {
        for k in 0..3 {
            r[k] = wrap_position(r[k] + dt * v[k], box_length);
            v[k] += dt / mass * forces.forces[i][k];
        }
    }
    lj_forces(positions, box_length, cutoff)
}

/// 擬似乱数の種 `seed` から、温度がちょうど \(T\) で全運動量が 0 の初期速度を返します。
///
/// 各成分を標準正規分布から引き、平均速度 \(\bar{\mathbf{v}} = \frac{1}{N}\sum_i \mathbf{v}_i\) を引いて
/// \(\mathbf{P} = \mathbf{0}\) にします。最後に全成分を \(\sqrt{T/T_{\mathrm{now}}}\) 倍して、
/// [`instantaneous_temperature`] が \(T\) に一致するようにします。\(T_{\mathrm{now}}\) は倍率を掛ける前の温度です。
pub fn initial_velocities(particles: usize, temperature: f64, mass: f64, seed: u64) -> Vec<[f64; 3]> {
    let mut rng = Rng::new(seed);
    let mut velocities: Vec<[f64; 3]> =
        (0..particles).map(|_| [rng.standard_normal(), rng.standard_normal(), rng.standard_normal()]).collect();
    let p = total_momentum(&velocities, 1.0);
    for v in &mut velocities {
        for k in 0..3 {
            v[k] -= p[k] / particles as f64;
        }
    }
    let now = instantaneous_temperature(kinetic_energy(&velocities, mass), particles);
    let scale = (temperature / now).sqrt();
    for v in &mut velocities {
        for c in v.iter_mut() {
            *c *= scale;
        }
    }
    velocities
}

/// 最小イメージで測ったペア距離 \(r_{ij}\)（\(i < j\)）を、幅 \(\Delta r = r_{\max}/M\) の \(M\) 個のビンに数えて `counts` に足します。
///
/// ビン \(k\) は \([k\Delta r, (k+1)\Delta r)\) です。\(r_{ij} \ge r_{\max}\) のペアは数えません。
pub fn pair_distance_histogram(positions: &[[f64; 3]], box_length: f64, r_max: f64, counts: &mut [f64]) {
    let bins = counts.len();
    let width = r_max / bins as f64;
    for i in 0..positions.len() {
        for j in i + 1..positions.len() {
            let d = minimum_image_vector([0, 1, 2].map(|k| positions[i][k] - positions[j][k]), box_length);
            let r = (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]).sqrt();
            if r < r_max {
                counts[(r / width) as usize] += 1.0;
            }
        }
    }
}

/// [`pair_distance_histogram`] を `samples` 個の配置で足し合わせた度数から、動径分布関数 \(g(r)\) の各ビンの値を返します。
///
/// \[
/// g(r) = \frac{V}{N^2\,4\pi r^2\,\Delta r}\left\langle \sum_i \sum_{j \ne i} \delta(r - r_{ij}) \right\rangle
/// \]
/// を幅のあるビンで書くと、\(\sum_{j \ne i}\) は \(i < j\) の2倍なので
/// \[
/// g_k = \frac{2\,h_k}{n_s\,N\,\rho\,\frac{4\pi}{3}\left(r_{k+1}^3 - r_k^3\right)}
/// \]
/// です。\(h_k\) はビン \(k\) の度数の合計、\(n_s\) は配置の数、\(N\) は粒子数、\(\rho = N/V\) は数密度、
/// \(r_k = k\Delta r\) はビンの内側の端です。分母は一様な分布で殻に入るペアの数の期待値なので、
/// 粒子に相関がなければ \(g = 1\) です。
pub fn radial_distribution(counts: &[f64], samples: usize, particles: usize, box_length: f64, r_max: f64) -> Vec<f64> {
    let n = particles as f64;
    let density = n / box_length.powi(3);
    let width = r_max / counts.len() as f64;
    counts
        .iter()
        .enumerate()
        .map(|(k, h)| {
            let (lo, hi) = (k as f64 * width, (k + 1) as f64 * width);
            let shell = 4.0 / 3.0 * std::f64::consts::PI * (hi.powi(3) - lo.powi(3));
            2.0 * h / (samples as f64 * n * density * shell)
        })
        .collect()
}

/// [`block_average`] の結果。
#[derive(Clone, Debug, PartialEq)]
pub struct BlockAverage {
    /// ブロック平均の平均 \(\bar{A}\)。
    pub mean: f64,
    /// 標準誤差 \(s_b/\sqrt{n_b}\)。
    pub standard_error: f64,
    /// 各ブロックの平均 \(\bar{A}_b\)。
    pub block_means: Vec<f64>,
}

/// 時系列 \(A_1, \ldots, A_n\) を長さ \(b\) のブロックに分けた平均と標準誤差を返します。ブロックが2個未満なら `None` です。
///
/// 端数の標本は使いません。ブロック数を \(n_b = \lfloor n/b \rfloor\)、ブロック \(m\) の平均を
/// \(\bar{A}_m = \frac{1}{b}\sum_{t \in m} A_t\) として
/// \[
/// \bar{A} = \frac{1}{n_b}\sum_m \bar{A}_m, \qquad
/// s_b^2 = \frac{1}{n_b - 1}\sum_m \left(\bar{A}_m - \bar{A}\right)^2, \qquad
/// \mathrm{SE} = \frac{s_b}{\sqrt{n_b}}
/// \]
/// です。分子動力学の連続したステップの値は互いに相関するので、各ステップを独立な標本として
/// 標準誤差を求めると小さく見積もりすぎます。ブロックが相関時間より十分長ければ、ブロック平均どうしは
/// ほぼ独立とみなせます。
pub fn block_average(samples: &[f64], block_length: usize) -> Option<BlockAverage> {
    if block_length == 0 {
        return None;
    }
    let blocks = samples.len() / block_length;
    if blocks < 2 {
        return None;
    }
    let block_means: Vec<f64> = samples
        .chunks_exact(block_length)
        .take(blocks)
        .map(|c| c.iter().sum::<f64>() / block_length as f64)
        .collect();
    let mean = block_means.iter().sum::<f64>() / blocks as f64;
    let var = block_means.iter().map(|m| (m - mean).powi(2)).sum::<f64>() / (blocks - 1) as f64;
    Some(BlockAverage { mean, standard_error: (var / blocks as f64).sqrt(), block_means })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() <= tol * b.abs().max(1.0)
    }

    #[test]
    fn lj_hand_values() {
        let r0 = lj_equilibrium_distance(1.0);
        assert!(close(r0, 1.122462048309373, 1e-15));
        assert!(close(lj_potential(r0, 1.0, 1.0), -1.0, 1e-14));
        assert!(lj_force_magnitude(r0, 1.0, 1.0).abs() < 1e-13);
        assert_eq!(lj_potential(1.0, 1.0, 1.0), 0.0);
        assert_eq!(lj_force_magnitude(1.0, 1.0, 1.0), 24.0);
        assert!(close(lj_potential(2.5, 1.0, 1.0), -0.016316891136, 1e-14));
        assert!(close(lj_force_magnitude(2.5, 1.0, 1.0), -0.0389994774528, 1e-14));
        let (lo, hi) = lj_turning_points(-0.75, 1.0, 1.0).unwrap();
        assert!(close(hi, 2f64.cbrt(), 1e-14));
        assert!(close(lo, (4.0f64 / 3.0).powf(1.0 / 6.0), 1e-14));
        assert!(close(lj_potential(lo, 1.0, 1.0), -0.75, 1e-13));
        assert!(lj_turning_points(0.1, 1.0, 1.0).is_none());
        assert!(close(lj_potential(2.0, 2.0, 1.5), 4.0 * 2.0 * ((0.75f64).powi(12) - (0.75f64).powi(6)), 1e-14));
    }

    #[test]
    fn force_is_minus_the_derivative() {
        for r in [0.95, 1.1, 1.5, 2.2] {
            let h = 1e-6;
            let numeric = -(lj_potential(r + h, 1.0, 1.0) - lj_potential(r - h, 1.0, 1.0)) / (2.0 * h);
            assert!(close(lj_force_magnitude(r, 1.0, 1.0), numeric, 1e-7));
            let shifted = -(lj_force_shifted_potential(r + h, 1.0, 1.0, 2.5)
                - lj_force_shifted_potential(r - h, 1.0, 1.0, 2.5))
                / (2.0 * h);
            assert!(close(lj_force_shifted_force(r, 1.0, 1.0, 2.5), shifted, 1e-7));
        }
    }

    #[test]
    fn force_shifted_is_continuous_at_the_cutoff() {
        assert!(lj_force_shifted_potential(2.5 - 1e-9, 1.0, 1.0, 2.5).abs() < 1e-10);
        assert!(lj_force_shifted_force(2.5 - 1e-9, 1.0, 1.0, 2.5).abs() < 1e-8);
        assert_eq!(lj_force_shifted_potential(2.5, 1.0, 1.0, 2.5), 0.0);
        assert_eq!(lj_truncated_potential(2.5, 1.0, 1.0, 2.5), 0.0);
        let r0 = lj_equilibrium_distance(1.0);
        assert!(close(lj_force_shifted_potential(r0, 1.0, 1.0, 2.5), -0.9299598486, 1e-9));
    }

    #[test]
    fn wrapping_and_minimum_image_hand_values() {
        assert!(close(wrap_position(12.3, 10.0), 2.3, 1e-14));
        assert!(close(wrap_position(-0.4, 10.0), 9.6, 1e-14));
        assert_eq!(wrap_position(10.0, 10.0), 0.0);
        let d = minimum_image_vector([8.0, -8.0, 0.0], 10.0);
        assert_eq!(d, [-2.0, 2.0, 0.0]);
        let r = (d.iter().map(|c| c * c).sum::<f64>()).sqrt();
        assert!(close(r, 8f64.sqrt(), 1e-15));
        assert!(close(nearest_image_distance([8.0, -8.0, 0.0], 10.0), r, 1e-15));
        let mut rng = Rng::new(3);
        for _ in 0..200 {
            let d = [0; 3].map(|_| 20.0 * rng.uniform() - 10.0);
            let m = minimum_image_vector(d, 10.0);
            let len = (m.iter().map(|c| c * c).sum::<f64>()).sqrt();
            assert!(close(len, nearest_image_distance(d, 10.0), 1e-12));
        }
    }

    #[test]
    fn fcc_lattice_counts_and_density() {
        let (p, l) = fcc_lattice(3, 0.8);
        assert_eq!(p.len(), 108);
        assert!(close(l, 135f64.cbrt(), 1e-14));
        assert!(p.iter().all(|r| r.iter().all(|&c| c > 0.0 && c < l)));
        let a = l / 3.0;
        let d = minimum_image_vector([0, 1, 2].map(|k| p[0][k] - p[1][k]), l);
        assert!(close(d.iter().map(|c| c * c).sum::<f64>().sqrt(), a / 2f64.sqrt(), 1e-14));
        let f = lj_forces(&p, l, 2.5);
        assert!(f.forces.iter().all(|v| v.iter().all(|c| c.abs() < 1e-10)));
    }

    #[test]
    fn two_atom_temperature_and_pressure() {
        let positions = [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0]];
        let velocities = [[1.0, 0.0, 0.0], [-1.0, 0.0, 0.0]];
        let f = lj_forces(&positions, 10.0, 2.5);
        assert!(close(f.virial, 24.0389994774528, 1e-14));
        assert!(close(f.forces[0][0], -24.0389994774528, 1e-14));
        assert!(close(f.potential, 0.0748161073152, 1e-12));
        let k = kinetic_energy(&velocities, 1.0);
        assert_eq!(k, 1.0);
        let t = instantaneous_temperature(k, 2);
        assert!(close(t, 2.0 / 3.0, 1e-15));
        let p = virial_pressure(2, 1000.0, t, f.virial);
        assert!(close(p, 0.0093463331591509, 1e-12));
    }

    #[test]
    fn forces_sum_to_zero_and_match_energy_gradient() {
        let (mut p, l) = fcc_lattice(2, 0.5);
        let mut rng = Rng::new(7);
        for r in &mut p {
            for c in r.iter_mut() {
                *c = wrap_position(*c + 0.2 * (rng.uniform() - 0.5), l);
            }
        }
        let f = lj_forces(&p, l, 2.5);
        for k in 0..3 {
            assert!(f.forces.iter().map(|v| v[k]).sum::<f64>().abs() < 1e-11);
        }
        let h = 1e-6;
        for (i, k) in [(0, 0), (5, 1), (17, 2)] {
            let mut a = p.clone();
            let mut b = p.clone();
            a[i][k] += h;
            b[i][k] -= h;
            let numeric = -(lj_forces(&a, l, 2.5).potential - lj_forces(&b, l, 2.5).potential) / (2.0 * h);
            assert!(close(f.forces[i][k], numeric, 1e-6));
        }
    }

    #[test]
    fn verlet_conserves_energy_and_momentum_better_than_euler() {
        let (p0, l) = fcc_lattice(3, 0.8);
        let v0 = initial_velocities(p0.len(), 1.0, 1.0, 1);
        assert!(close(instantaneous_temperature(kinetic_energy(&v0, 1.0), p0.len()), 1.0, 1e-13));
        let run = |euler: bool| {
            let (mut p, mut v) = (p0.clone(), v0.clone());
            let mut f = lj_forces(&p, l, 2.5);
            let e0 = f.potential + kinetic_energy(&v, 1.0);
            let mut drift: f64 = 0.0;
            for _ in 0..400 {
                f = if euler {
                    forward_euler(&mut p, &mut v, &f, 1.0, 0.005, l, 2.5)
                } else {
                    velocity_verlet(&mut p, &mut v, &f, 1.0, 0.005, l, 2.5)
                };
                drift = drift.max(((f.potential + kinetic_energy(&v, 1.0) - e0) / e0).abs());
            }
            let momentum = total_momentum(&v, 1.0);
            (drift, momentum)
        };
        let (verlet, momentum) = run(false);
        let (euler, _) = run(true);
        assert!(verlet < 1e-3, "verlet drift {verlet}");
        assert!(euler > 10.0 * verlet, "euler drift {euler}");
        assert!(momentum.iter().all(|c| c.abs() < 1e-11));
    }

    #[test]
    fn uniform_points_have_g_near_one() {
        let mut rng = Rng::new(11);
        let (l, n, bins, r_max) = (10.0, 400, 10, 5.0);
        let mut counts = vec![0.0; bins];
        for _ in 0..20 {
            let p: Vec<[f64; 3]> = (0..n).map(|_| [0; 3].map(|_| l * rng.uniform())).collect();
            pair_distance_histogram(&p, l, r_max, &mut counts);
        }
        let g = radial_distribution(&counts, 20, n, l, r_max);
        for value in &g[2..] {
            assert!((value - 1.0).abs() < 0.08, "{g:?}");
        }
    }

    #[test]
    fn block_average_hand_values() {
        let b = block_average(&[1.0, 3.0, 2.0, 4.0, 6.0, 8.0, 9.0], 2).unwrap();
        assert_eq!(b.block_means, vec![2.0, 3.0, 7.0]);
        assert_eq!(b.mean, 4.0);
        assert!(close(b.standard_error, (7.0f64 / 3.0).sqrt(), 1e-15));
        assert!(block_average(&[1.0, 2.0, 3.0], 2).is_none());
    }
}
