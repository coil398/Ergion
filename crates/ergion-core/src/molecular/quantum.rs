//! Born–Oppenheimer 近似、密度汎関数理論と Kohn–Sham 方程式、Hellmann–Feynman の定理、第一原理分子動力学。
//!
//! すべて原子単位 \(\hbar = m_e = e = 1\) の1次元のモデルである。電子は区間 \([-L/2, L/2]\) の内部の格子点
//! \(x_j = -L/2 + j h\)（\(j = 1, \ldots, N\)、\(h = L/(N+1)\)）の上の値 \(\psi_j\) で表し、両端で \(\psi = 0\) とする。
//! 電子と原子核、原子核どうしは、柔らかくした Coulomb 相互作用 \(1/\sqrt{r^2 + a^2}\) で引き合い、反発する。
//! 3次元の化学ではなく、同じ手順を1次元で確かめるためのモデルである。

/// 陽子の質量（電子の質量を単位とする）。\(M_p = 1836.15\)。
pub const PROTON_MASS: f64 = 1836.15;

/// 1次元のモデルの原子核。電荷 \(Z\) と位置 \(X\)。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Nucleus {
    pub charge: f64,
    pub position: f64,
}

/// 柔らかくした Coulomb 相互作用の距離の関数
/// \[
/// s(r) = \frac{1}{\sqrt{r^2 + a^2}}
/// \]
/// を返します。\(r\) は2点の距離、\(a > 0\) は柔らかさの長さです。\(r = 0\) でも有限の値 \(1/a\) をとります。
pub fn soft_coulomb(distance: f64, softening: f64) -> f64 {
    1.0 / (distance * distance + softening * softening).sqrt()
}

/// 区間 \([-L/2, L/2]\) の内部の格子点 \(x_j = -L/2 + j h\)（\(j = 1, \ldots, N\)）と間隔 \(h = L/(N+1)\) を返します。
/// 両端 \(x_0 = -L/2\)、\(x_{N+1} = L/2\) は波動関数が 0 の点なので含めません。
pub fn grid_points(length: f64, points: usize) -> (Vec<f64>, f64) {
    let spacing = length / (points + 1) as f64;
    let x = (1..=points).map(|j| -length / 2.0 + j as f64 * spacing).collect();
    (x, spacing)
}

/// 対角 \(d_0, \ldots, d_{N-1}\) と副対角 \(e_0, \ldots, e_{N-2}\)（\(e_i\) は \((i, i+1)\) 成分）の対称三重対角行列 \(T\) について、
/// \(x\) より小さい固有値の個数を Sturm 列で数えます。
///
/// \(T - xI\) の LDLᵀ 分解の対角
/// \[
/// q_0 = d_0 - x,\qquad q_i = d_i - x - \frac{e_{i-1}^2}{q_{i-1}}\quad (i = 1, \ldots, N-1)
/// \]
/// は、\(T - xI\) と合同な対角行列の成分です。Sylvester の慣性法則により、負の \(q_i\) の個数は
/// \(T - xI\) の負の固有値の個数、すなわち \(x\) より小さい \(T\) の固有値の個数です。
/// \(q_i = 0\) のときは、その値を非常に小さい負の数に置き換えます。
pub fn sturm_count(diag: &[f64], off: &[f64], x: f64) -> usize {
    let mut count = 0;
    let mut q = 1.0;
    for (i, &d) in diag.iter().enumerate() {
        let coupling = if i == 0 { 0.0 } else { off[i - 1] * off[i - 1] };
        q = d - x - if i == 0 { 0.0 } else { coupling / q };
        if q == 0.0 {
            q = -f64::EPSILON * (d.abs() + coupling.sqrt() + 1.0);
        }
        if q < 0.0 {
            count += 1;
        }
    }
    count
}

/// 対称三重対角行列の固有値を、小さいほうから `count` 個、二分法で求めます。
///
/// Gershgorin の円板定理により、すべての固有値は
/// \[
/// \Big[\min_i (d_i - |e_{i-1}| - |e_i|),\ \max_i (d_i + |e_{i-1}| + |e_i|)\Big]
/// \]
/// にあります。\(k\) 番目（0 から数える）の固有値 \(\lambda_k\) は、[`sturm_count`] の個数 \(\nu(x)\) が
/// \(\nu(x) \le k\) となる最大の \(x\) です。区間 \([\alpha, \beta]\) を \(\nu(\alpha) \le k < \nu(\beta)\) に保ったまま中点で半分にし、
/// 幅が浮動小数点の分解能に達するまで続けます。各回の手間は \(N\) に比例します。
pub fn tridiagonal_eigenvalues(diag: &[f64], off: &[f64], count: usize) -> Vec<f64> {
    let n = diag.len();
    let radius = |i: usize| {
        let left = if i > 0 { off[i - 1].abs() } else { 0.0 };
        let right = if i + 1 < n { off[i].abs() } else { 0.0 };
        left + right
    };
    let lower = (0..n).map(|i| diag[i] - radius(i)).fold(f64::INFINITY, f64::min);
    let upper = (0..n).map(|i| diag[i] + radius(i)).fold(f64::NEG_INFINITY, f64::max);
    let pad = 1e-12 * (lower.abs() + upper.abs() + 1.0);
    (0..count.min(n))
        .map(|k| {
            let (mut a, mut b) = (lower - pad, upper + pad);
            for _ in 0..200 {
                let middle = 0.5 * (a + b);
                if middle <= a || middle >= b {
                    break;
                }
                if sturm_count(diag, off, middle) > k {
                    b = middle;
                } else {
                    a = middle;
                }
            }
            0.5 * (a + b)
        })
        .collect()
}

/// \((T - \sigma I) y = r\) を部分ピボット選択付きの Gauss 消去で解く。ピボットが 0 のときは小さい数に置き換える。
fn solve_shifted(diag: &[f64], off: &[f64], shift: f64, rhs: &[f64]) -> Vec<f64> {
    let n = diag.len();
    let scale = diag.iter().map(|d| d.abs()).chain(off.iter().map(|e| e.abs())).fold(1.0, f64::max);
    let tiny = f64::EPSILON * scale;
    // 行 i の上三角部分 (u0, u1, u2) は列 i, i+1, i+2 の係数。
    let mut u = vec![[0.0; 3]; n];
    let mut y = rhs.to_vec();
    let mut row = [diag[0] - shift, if n > 1 { off[0] } else { 0.0 }, 0.0];
    for i in 0..n {
        if i + 1 < n {
            let next = [off[i], diag[i + 1] - shift, if i + 2 < n { off[i + 1] } else { 0.0 }];
            let (pivot_row, other, swap) = if row[0].abs() >= next[0].abs() {
                (row, next, false)
            } else {
                ([next[0], next[1], next[2]], [row[0], row[1], row[2]], true)
            };
            if swap {
                y.swap(i, i + 1);
            }
            let pivot = if pivot_row[0].abs() < tiny { tiny } else { pivot_row[0] };
            u[i] = [pivot, pivot_row[1], pivot_row[2]];
            let factor = other[0] / pivot;
            y[i + 1] -= factor * y[i];
            row = [other[1] - factor * pivot_row[1], other[2] - factor * pivot_row[2], 0.0];
        } else {
            let pivot = if row[0].abs() < tiny { tiny } else { row[0] };
            u[i] = [pivot, 0.0, 0.0];
        }
    }
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        let mut s = y[i];
        if i + 1 < n {
            s -= u[i][1] * x[i + 1];
        }
        if i + 2 < n {
            s -= u[i][2] * x[i + 2];
        }
        x[i] = s / u[i][0];
    }
    x
}

fn normalize(v: &mut [f64]) {
    let norm = v.iter().map(|a| a * a).sum::<f64>().sqrt();
    if norm > 0.0 {
        v.iter_mut().for_each(|a| *a /= norm);
    }
}

/// 固有値 \(\lambda\) に対する対称三重対角行列の固有ベクトルを、逆反復法で求めます。
///
/// \(\sigma\) を \(\lambda\) にごく近い数とし、
/// \[
/// (T - \sigma I)\, y^{(k+1)} = v^{(k)},\qquad v^{(k+1)} = \frac{y^{(k+1)}}{\lVert y^{(k+1)} \rVert}
/// \]
/// を繰り返します。\(v^{(0)}\) を固有ベクトルで \(\sum_m c_m u_m\) と展開すると、1回ごとに成分 \(u_m\) は
/// \(1/(\lambda_m - \sigma)\) 倍されるので、\(\lambda\) の成分だけが大きく残ります。返すベクトルは
/// \(\sum_j v_j^2 = 1\) に正規化し、和 \(\sum_j v_j\) が負にならない向きにそろえます。
pub fn tridiagonal_eigenvector(diag: &[f64], off: &[f64], eigenvalue: f64) -> Vec<f64> {
    inverse_iteration(diag, off, eigenvalue, &[])
}

fn inverse_iteration(diag: &[f64], off: &[f64], eigenvalue: f64, previous: &[Vec<f64>]) -> Vec<f64> {
    let n = diag.len();
    let shift = eigenvalue + 1e-10 * (eigenvalue.abs() + 1.0);
    let mut v: Vec<f64> = (0..n).map(|j| 1.0 + 0.1 * ((j as f64) * 0.618_033_988_7).fract()).collect();
    normalize(&mut v);
    for _ in 0..4 {
        v = solve_shifted(diag, off, shift, &v);
        for p in previous {
            let overlap: f64 = v.iter().zip(p).map(|(a, b)| a * b).sum();
            v.iter_mut().zip(p).for_each(|(a, b)| *a -= overlap * b);
        }
        normalize(&mut v);
    }
    let first = v.iter().copied().find(|a| a.abs() > 1e-8).unwrap_or(1.0);
    if v.iter().sum::<f64>() < -1e-12 || (v.iter().sum::<f64>().abs() <= 1e-12 && first < 0.0) {
        v.iter_mut().for_each(|a| *a = -*a);
    }
    v
}

/// 1次元の Schrödinger 方程式 \(-\tfrac{1}{2}\psi'' + v(x)\psi = E\psi\) を3点の差分で離散化した行列 \(H\) の
/// 対角と副対角を返します。
///
/// \(\psi''(x_j) \approx (\psi_{j+1} - 2\psi_j + \psi_{j-1})/h^2\)、\(\psi_0 = \psi_{N+1} = 0\) より
/// \[
/// (H\psi)_j = -\frac{1}{2}\,\frac{\psi_{j+1} - 2\psi_j + \psi_{j-1}}{h^2} + v_j \psi_j
/// \]
/// なので、対角は \(H_{jj} = 1/h^2 + v_j\)、副対角は \(H_{j,j+1} = -1/(2h^2)\) です。`potential` は格子点の \(v_j\) です。
pub fn schrodinger_hamiltonian(potential: &[f64], spacing: f64) -> (Vec<f64>, Vec<f64>) {
    let n = potential.len();
    let kinetic = 1.0 / (spacing * spacing);
    let diag = potential.iter().map(|v| kinetic + v).collect();
    let off = vec![-0.5 * kinetic; n.saturating_sub(1)];
    (diag, off)
}

/// 格子の上の Schrödinger 方程式の固有値 \(E_0 \le E_1 \le \cdots\) と固有関数を、小さいほうから `count` 個返します。
///
/// 行列は [`schrodinger_hamiltonian`]、固有値は [`tridiagonal_eigenvalues`]（Sturm 列による二分法）、
/// 固有ベクトルは [`tridiagonal_eigenvector`]（逆反復法）です。近い固有値の固有ベクトルは、先に求めたものと直交させます。
/// 固有関数は格子の上で \(\sum_j \psi_j^2\, h = 1\) に正規化します。
pub fn schrodinger_states(potential: &[f64], spacing: f64, count: usize) -> (Vec<f64>, Vec<Vec<f64>>) {
    let (diag, off) = schrodinger_hamiltonian(potential, spacing);
    let energies = tridiagonal_eigenvalues(&diag, &off, count);
    let mut vectors: Vec<Vec<f64>> = Vec::with_capacity(energies.len());
    for &energy in &energies {
        let v = inverse_iteration(&diag, &off, energy, &vectors);
        vectors.push(v);
    }
    let scale = 1.0 / spacing.sqrt();
    let orbitals = vectors.into_iter().map(|v| v.into_iter().map(|a| a * scale).collect()).collect();
    (energies, orbitals)
}

/// 箱の中の粒子（幅 \(L\)、両端で \(\psi = 0\)）の \(n\) 番目のエネルギーの厳密な値
/// \[
/// E_n = \frac{n^2 \pi^2}{2L^2}\qquad (n = 1, 2, \ldots)
/// \]
/// を返します。固有関数は \(\psi_n(x) = \sqrt{2/L}\,\sin\big(n\pi (x + L/2)/L\big)\) です。
pub fn box_energy(n: usize, length: f64) -> f64 {
    let k = n as f64 * std::f64::consts::PI / length;
    0.5 * k * k
}

/// 箱の中の粒子を3点の差分で離散化した行列の \(n\) 番目の固有値の厳密な値
/// \[
/// E_n^{(h)} = \frac{2}{h^2}\,\sin^2\!\frac{n\pi h}{2L}\qquad (n = 1, \ldots, N)
/// \]
/// を返します。固有ベクトルは \(\psi_j = \sin(n\pi j/(N+1))\) です。\(h \to 0\) で
/// \(E_n^{(h)} = E_n\big(1 - n^2\pi^2 h^2/(12 L^2) + \cdots\big)\) となり、[`box_energy`] に近づきます。
pub fn box_energy_discrete(n: usize, length: f64, spacing: f64) -> f64 {
    let s = (n as f64 * std::f64::consts::PI * spacing / (2.0 * length)).sin();
    2.0 * s * s / (spacing * spacing)
}

/// 原子核が電子に及ぼすポテンシャル
/// \[
/// v_{\mathrm{ext}}(x_j) = -\sum_I \frac{Z_I}{\sqrt{(x_j - X_I)^2 + a^2}}
/// \]
/// を格子点ごとに返します。
pub fn external_potential(x: &[f64], nuclei: &[Nucleus], softening: f64) -> Vec<f64> {
    x.iter()
        .map(|&xj| -nuclei.iter().map(|n| n.charge * soft_coulomb(xj - n.position, softening)).sum::<f64>())
        .collect()
}

/// 原子核どうしの反発のエネルギー
/// \[
/// V_{nn} = \sum_{I < J} \frac{Z_I Z_J}{\sqrt{(X_I - X_J)^2 + a^2}}
/// \]
/// を返します。
pub fn nuclear_repulsion(nuclei: &[Nucleus], softening: f64) -> f64 {
    let mut sum = 0.0;
    for (i, a) in nuclei.iter().enumerate() {
        for b in &nuclei[i + 1..] {
            sum += a.charge * b.charge * soft_coulomb(a.position - b.position, softening);
        }
    }
    sum
}

/// 原子核を止めたときの1電子のエネルギー \(E_0, E_1, \ldots\) を `count` 個返します（Born–Oppenheimer 近似の電子の問題）。
///
/// 原子核の位置 \(X_I\) を定数として、電子のハミルトニアン \(-\tfrac{1}{2}\,d^2/dx^2 + v_{\mathrm{ext}}(x)\) の固有値を
/// 区間 \([-L/2, L/2]\) の \(N\) 点の格子で求めます（[`external_potential`]、[`schrodinger_states`]）。原子核の反発は含みません。
pub fn electronic_levels(length: f64, points: usize, nuclei: &[Nucleus], softening: f64, count: usize) -> Vec<f64> {
    let (x, spacing) = grid_points(length, points);
    let (diag, off) = schrodinger_hamiltonian(&external_potential(&x, nuclei, softening), spacing);
    tridiagonal_eigenvalues(&diag, &off, count)
}

/// 電荷 1 の二つの原子核を \(X = \mp R/2\) に置いた配置（1電子の H₂⁺ に似たモデル）。
pub fn proton_pair(distance: f64) -> [Nucleus; 2] {
    [Nucleus { charge: 1.0, position: -0.5 * distance }, Nucleus { charge: 1.0, position: 0.5 * distance }]
}

/// 核間距離 \(R\) に対する断熱ポテンシャルの曲線。
#[derive(Clone, Debug, Default, PartialEq)]
pub struct BondCurves {
    /// 核間距離 \(R\)。
    pub distance: Vec<f64>,
    /// 電子の基底状態のエネルギー \(E_0(R)\)。
    pub electronic_ground: Vec<f64>,
    /// 電子の第1励起状態のエネルギー \(E_1(R)\)。
    pub electronic_excited: Vec<f64>,
    /// 原子核の反発 \(V_{nn}(R) = 1/\sqrt{R^2 + a^2}\)。
    pub repulsion: Vec<f64>,
    /// 基底状態の断熱ポテンシャル \(U_0(R) = E_0(R) + V_{nn}(R)\)。
    pub ground: Vec<f64>,
    /// 励起状態の断熱ポテンシャル \(U_1(R) = E_1(R) + V_{nn}(R)\)。
    pub excited: Vec<f64>,
}

/// 基底状態の断熱ポテンシャル \(U_0(R) = E_0(R) + V_{nn}(R)\) を返します（[`proton_pair`] の配置）。
///
/// Born–Oppenheimer 近似では、原子核は電子の基底状態のエネルギーに原子核の反発を加えた \(U_0(R)\) をポテンシャルとして動きます。
pub fn ground_potential(length: f64, points: usize, softening: f64, distance: f64) -> f64 {
    let nuclei = proton_pair(distance);
    electronic_levels(length, points, &nuclei, softening, 1)[0] + nuclear_repulsion(&nuclei, softening)
}

/// 核間距離の列 \(R_k\) について、断熱ポテンシャルの曲線 \(E_0(R)\)、\(E_1(R)\)、\(V_{nn}(R)\)、\(U_0(R)\)、\(U_1(R)\) を返します（[`BondCurves`]）。
pub fn bond_curves(length: f64, points: usize, softening: f64, distances: &[f64]) -> BondCurves {
    let mut curves = BondCurves { distance: distances.to_vec(), ..Default::default() };
    for &r in distances {
        let nuclei = proton_pair(r);
        let levels = electronic_levels(length, points, &nuclei, softening, 2);
        let repulsion = nuclear_repulsion(&nuclei, softening);
        curves.electronic_ground.push(levels[0]);
        curves.electronic_excited.push(levels[1]);
        curves.repulsion.push(repulsion);
        curves.ground.push(levels[0] + repulsion);
        curves.excited.push(levels[1] + repulsion);
    }
    curves
}

/// 1変数の関数の極小点を探した結果。
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Minimum {
    /// 極小点の近似。
    pub point: f64,
    /// そこでの関数の値。
    pub value: f64,
    /// 反復の回数。
    pub iterations: usize,
    /// 各反復の点の列。
    pub path: Vec<f64>,
}

/// 区間 \([a, b]\) で単峰な関数 \(f\) の極小点を黄金分割法で探します。
///
/// \(\varphi = (\sqrt5 - 1)/2 \approx 0.618\) として内点
/// \[
/// c = b - \varphi (b - a),\qquad d = a + \varphi (b - a)
/// \]
/// をとり、\(f(c) < f(d)\) なら \([a, d]\)、そうでなければ \([c, b]\) を残します。\(\varphi^2 = 1 - \varphi\) なので
/// 残した区間の内点の一方は前の内点と一致し、1回につき関数の値を1回だけ計算します。区間の幅は1回ごとに \(\varphi\) 倍になり、
/// 幅が `tolerance` 以下になったら止めます。
pub fn golden_section_minimum(f: impl Fn(f64) -> f64, lower: f64, upper: f64, tolerance: f64) -> Minimum {
    let phi = 0.5 * (5f64.sqrt() - 1.0);
    let (mut a, mut b) = (lower, upper);
    let mut c = b - phi * (b - a);
    let mut d = a + phi * (b - a);
    let (mut fc, mut fd) = (f(c), f(d));
    let mut path = Vec::new();
    let mut iterations = 0;
    while b - a > tolerance && iterations < 200 {
        if fc < fd {
            b = d;
            d = c;
            fd = fc;
            c = b - phi * (b - a);
            fc = f(c);
        } else {
            a = c;
            c = d;
            fc = fd;
            d = a + phi * (b - a);
            fd = f(d);
        }
        iterations += 1;
        path.push(0.5 * (a + b));
    }
    let point = 0.5 * (a + b);
    Minimum { point, value: f(point), iterations, path }
}

/// 3点を通る放物線の頂点へ進む Newton 法で、関数 \(f\) の極小点を探します。
///
/// 点 \(R_k\) と \(R_k \pm \delta\) の3点を通る放物線の1階と2階の微分は
/// \[
/// f'(R_k) \approx \frac{f(R_k + \delta) - f(R_k - \delta)}{2\delta},\qquad
/// f''(R_k) \approx \frac{f(R_k + \delta) - 2f(R_k) + f(R_k - \delta)}{\delta^2}
/// \]
/// で、その頂点
/// \[
/// R_{k+1} = R_k - \frac{f'(R_k)}{f''(R_k)}
/// \]
/// へ進みます。これは \(f'(R) = 0\) に対する Newton 法で、極小点の近くでは誤差が1回ごとにほぼ2乗になります。
/// \(f'' \le 0\) のときは、下り坂の向きへ \(\delta\) の10倍だけ進みます。\(|R_{k+1} - R_k|\) が `tolerance` 以下になったら止めます。
pub fn parabola_newton_minimum(f: impl Fn(f64) -> f64, start: f64, delta: f64, tolerance: f64) -> Minimum {
    let mut r = start;
    let mut path = Vec::new();
    let mut iterations = 0;
    while iterations < 100 {
        let (left, middle, right) = (f(r - delta), f(r), f(r + delta));
        let slope = (right - left) / (2.0 * delta);
        let curvature = (right - 2.0 * middle + left) / (delta * delta);
        let next = if curvature > 0.0 { r - slope / curvature } else { r - 10.0 * delta * slope.signum() };
        iterations += 1;
        path.push(next);
        let moved = (next - r).abs();
        r = next;
        if moved <= tolerance {
            break;
        }
    }
    Minimum { point: r, value: f(r), iterations, path }
}

/// 中心差分による2階微分 \(f''(x) \approx \big(f(x + \delta) - 2f(x) + f(x - \delta)\big)/\delta^2\)。誤差は \(O(\delta^2)\) です。
pub fn second_difference(f: impl Fn(f64) -> f64, x: f64, delta: f64) -> f64 {
    (f(x + delta) - 2.0 * f(x) + f(x - delta)) / (delta * delta)
}

/// 平衡距離のまわりの調和振動の角振動数
/// \[
/// \omega = \sqrt{\frac{k}{\mu}}
/// \]
/// を返します。\(k = U_0''(R_e)\) は断熱ポテンシャルの曲率、\(\mu\) は換算質量です。二つの陽子では \(\mu = M_p/2\) です。
pub fn vibrational_frequency(curvature: f64, reduced_mass: f64) -> f64 {
    (curvature / reduced_mass).sqrt()
}

/// 自己無撞着場の反復の途中で使う、Hartree ポテンシャル
/// \[
/// V_H(x_i) = \sum_j \frac{n(x_j)\,h}{\sqrt{(x_i - x_j)^2 + a^2}}
/// \]
/// を格子点ごとに返します。電子密度 \(n\) がつくる静電ポテンシャルを、格子の和（長方形則）で積分したものです。
pub fn hartree_potential(x: &[f64], density: &[f64], spacing: f64, softening: f64) -> Vec<f64> {
    x.iter()
        .map(|&xi| x.iter().zip(density).map(|(&xj, &n)| n * spacing * soft_coulomb(xi - xj, softening)).sum())
        .collect()
}

/// 交換ポテンシャルのモデル
/// \[
/// v_x(x) = -\left(\frac{3\,n(x)}{\pi}\right)^{1/3}
/// \]
/// を格子点ごとに返します。3次元の一様な電子ガスの交換（LDA）の式を、1次元の密度 \(n\)（長さあたりの電子数）に
/// そのまま当てはめたモデルで、1次元の柔らかい Coulomb 相互作用の交換を正確に表すものではありません。
/// \(v_x = \delta E_x/\delta n\) で、エネルギーは [`exchange_energy`] です。相関は含みません。
pub fn exchange_potential(density: &[f64]) -> Vec<f64> {
    density.iter().map(|&n| -(3.0 * n.max(0.0) / std::f64::consts::PI).cbrt()).collect()
}

/// 交換エネルギーのモデル
/// \[
/// E_x[n] = -\frac{3}{4}\left(\frac{3}{\pi}\right)^{1/3} \sum_j n(x_j)^{4/3}\, h
/// \]
/// を返します。\(\frac{d}{dn}\big(-\frac{3}{4}(3/\pi)^{1/3} n^{4/3}\big) = -(3n/\pi)^{1/3}\) なので、[`exchange_potential`] はこの汎関数の微分です。
pub fn exchange_energy(density: &[f64], spacing: f64) -> f64 {
    let c = -0.75 * (3.0 / std::f64::consts::PI).cbrt();
    c * density.iter().map(|&n| n.max(0.0).powf(4.0 / 3.0)).sum::<f64>() * spacing
}

/// Kohn–Sham の全エネルギーの各項。
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct KohnShamEnergy {
    /// 非相互作用の運動エネルギー \(T_s\)。
    pub kinetic: f64,
    /// 原子核との引力のエネルギー \(E_{\mathrm{ext}} = \sum_j n_j v_{\mathrm{ext}}(x_j)\,h\)。
    pub external: f64,
    /// Hartree エネルギー \(E_H = \frac{1}{2}\sum_j n_j V_H(x_j)\,h\)。
    pub hartree: f64,
    /// 交換エネルギー \(E_x\)（[`exchange_energy`]）。
    pub exchange: f64,
    /// 原子核の反発 \(V_{nn}\)。
    pub nuclear: f64,
    /// 全エネルギー \(E = T_s + E_{\mathrm{ext}} + E_H + E_x + V_{nn}\)。
    pub total: f64,
}

/// 自己無撞着場の1回の反復の結果。
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ScfIteration {
    /// 入力の密度 \(n_{\mathrm{in}}\)。
    pub density_in: Vec<f64>,
    /// 有効ポテンシャル \(V_{\mathrm{eff}}[n_{\mathrm{in}}]\)。
    pub potential: Vec<f64>,
    /// 最も低い Kohn–Sham 軌道 \(\psi_0\)（\(\sum_j \psi_j^2 h = 1\)）。
    pub orbital: Vec<f64>,
    /// その固有値 \(\varepsilon_0\)。
    pub eigenvalue: f64,
    /// 出力の密度 \(n_{\mathrm{out}} = 2|\psi_0|^2\)。
    pub density_out: Vec<f64>,
    /// 混合した次の密度 \((1 - \alpha) n_{\mathrm{in}} + \alpha\, n_{\mathrm{out}}\)。
    pub density_next: Vec<f64>,
    /// 密度の変化 \(\sum_j |n_{\mathrm{out}} - n_{\mathrm{in}}|\, h\)。
    pub change: f64,
    /// 出力の軌道と密度で計算した全エネルギー。
    pub energy: KohnShamEnergy,
}

/// 自己無撞着場の計算を収束させた結果。
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ScfResult {
    /// 最後の反復。
    pub last: ScfIteration,
    /// 反復の回数。
    pub iterations: usize,
    /// 密度の変化が許容値以下になったか。
    pub converged: bool,
}

/// 2電子（スピンが逆向きの2電子が一つの軌道を占める）の Kohn–Sham 方程式の1次元モデル。
///
/// 格子は [`grid_points`]、原子核のポテンシャルは [`external_potential`] です。
#[derive(Clone, Debug, PartialEq)]
pub struct KohnSham {
    pub x: Vec<f64>,
    pub spacing: f64,
    pub nuclei: Vec<Nucleus>,
    pub softening: f64,
    pub external: Vec<f64>,
}

impl KohnSham {
    /// 区間の長さ \(L\)、内部の格子点の数 \(N\)、原子核、柔らかさ \(a\) からモデルを作ります。
    pub fn new(length: f64, points: usize, nuclei: &[Nucleus], softening: f64) -> Self {
        let (x, spacing) = grid_points(length, points);
        let external = external_potential(&x, nuclei, softening);
        Self { x, spacing, nuclei: nuclei.to_vec(), softening, external }
    }
}

/// 最初の密度。電子間の相互作用を無視したハミルトニアン \(-\tfrac{1}{2}\,d^2/dx^2 + v_{\mathrm{ext}}\) の最も低い軌道 \(\phi_0\) から
/// \(n^{(0)} = 2|\phi_0|^2\) とします。
pub fn kohn_sham_initial_density(model: &KohnSham) -> Vec<f64> {
    let (_, orbitals) = schrodinger_states(&model.external, model.spacing, 1);
    orbitals[0].iter().map(|p| 2.0 * p * p).collect()
}

/// 有効ポテンシャル
/// \[
/// V_{\mathrm{eff}}[n](x) = v_{\mathrm{ext}}(x) + V_H[n](x) + v_x[n](x)
/// \]
/// を返します（[`hartree_potential`]、[`exchange_potential`]）。
pub fn effective_potential(model: &KohnSham, density: &[f64]) -> Vec<f64> {
    let hartree = hartree_potential(&model.x, density, model.spacing, model.softening);
    let exchange = exchange_potential(density);
    (0..model.x.len()).map(|j| model.external[j] + hartree[j] + exchange[j]).collect()
}

/// 二重に占有した軌道 \(\psi\) と密度 \(n = 2|\psi|^2\) の全エネルギー
/// \[
/// E = T_s + E_{\mathrm{ext}} + E_H + E_x + V_{nn}
/// \]
/// を項ごとに返します。運動エネルギーは3点の差分で
/// \[
/// T_s = 2\sum_j \psi_j \left(-\frac{1}{2}\,\frac{\psi_{j+1} - 2\psi_j + \psi_{j-1}}{h^2}\right) h
/// \]
/// です（\(\psi_0 = \psi_{N+1} = 0\)）。他の項は格子の和
/// \[
/// E_{\mathrm{ext}} = \sum_j n_j v_{\mathrm{ext}}(x_j)\,h,\qquad E_H = \frac{1}{2}\sum_j n_j V_H(x_j)\,h
/// \]
/// と、[`exchange_energy`]、[`nuclear_repulsion`] です。
pub fn kohn_sham_energy(model: &KohnSham, orbital: &[f64], density: &[f64]) -> KohnShamEnergy {
    let h = model.spacing;
    let n = orbital.len();
    let at = |j: isize| if j < 0 || j as usize >= n { 0.0 } else { orbital[j as usize] };
    let kinetic = 2.0
        * (0..n as isize)
            .map(|j| at(j) * (-0.5) * (at(j + 1) - 2.0 * at(j) + at(j - 1)) / (h * h))
            .sum::<f64>()
        * h;
    let external = density.iter().zip(&model.external).map(|(a, b)| a * b).sum::<f64>() * h;
    let vh = hartree_potential(&model.x, density, h, model.softening);
    let hartree = 0.5 * density.iter().zip(&vh).map(|(a, b)| a * b).sum::<f64>() * h;
    let exchange = exchange_energy(density, h);
    let nuclear = nuclear_repulsion(&model.nuclei, model.softening);
    KohnShamEnergy { kinetic, external, hartree, exchange, nuclear, total: kinetic + external + hartree + exchange + nuclear }
}

/// 自己無撞着場の反復を1回行います。
///
/// 入力の密度 \(n_{\mathrm{in}}\) から \(V_{\mathrm{eff}}[n_{\mathrm{in}}]\) を作り、Kohn–Sham 方程式
/// \[
/// \left[-\frac{1}{2}\frac{d^2}{dx^2} + V_{\mathrm{eff}}[n_{\mathrm{in}}](x)\right]\psi_0 = \varepsilon_0 \psi_0
/// \]
/// の最も低い固有値と固有関数を [`schrodinger_states`] で求め、出力の密度 \(n_{\mathrm{out}} = 2|\psi_0|^2\) を作ります。
/// 次の入力は線形混合
/// \[
/// n_{\mathrm{next}} = (1 - \alpha)\, n_{\mathrm{in}} + \alpha\, n_{\mathrm{out}}\qquad (0 < \alpha \le 1)
/// \]
/// です。密度の変化は \(\sum_j |n_{\mathrm{out}}(x_j) - n_{\mathrm{in}}(x_j)|\,h\)、全エネルギーは出力の軌道と密度で [`kohn_sham_energy`] が計算します。
pub fn kohn_sham_iteration(model: &KohnSham, density_in: &[f64], mixing: f64) -> ScfIteration {
    let potential = effective_potential(model, density_in);
    let (energies, mut orbitals) = schrodinger_states(&potential, model.spacing, 1);
    let orbital = orbitals.remove(0);
    let density_out: Vec<f64> = orbital.iter().map(|p| 2.0 * p * p).collect();
    let density_next = density_in.iter().zip(&density_out).map(|(a, b)| (1.0 - mixing) * a + mixing * b).collect();
    let change = density_in.iter().zip(&density_out).map(|(a, b)| (a - b).abs()).sum::<f64>() * model.spacing;
    let energy = kohn_sham_energy(model, &orbital, &density_out);
    ScfIteration { density_in: density_in.to_vec(), potential, orbital, eigenvalue: energies[0], density_out, density_next, change, energy }
}

/// [`kohn_sham_initial_density`] から [`kohn_sham_iteration`] を繰り返し、密度の変化が `tolerance` 以下になるか
/// `max_iterations` 回に達したら止めます。
pub fn kohn_sham_solve(model: &KohnSham, mixing: f64, tolerance: f64, max_iterations: usize) -> ScfResult {
    let mut density = kohn_sham_initial_density(model);
    let mut last = kohn_sham_iteration(model, &density, mixing);
    let mut iterations = 0;
    while last.change > tolerance && iterations < max_iterations {
        density = last.density_next.clone();
        last = kohn_sham_iteration(model, &density, mixing);
        iterations += 1;
    }
    let converged = last.change <= tolerance;
    ScfResult { last, iterations, converged }
}

/// 柔らかくした Coulomb 相互作用 \(s = (r^2 + a^2)^{-1/2}\) の、原子核の座標 \(X\) についての偏導関数
/// \[
/// \frac{\partial s}{\partial X} = r\,(r^2 + a^2)^{-3/2}, \qquad r = x - X
/// \]
/// を返します。\(x\) は電子の座標です。
pub fn soft_coulomb_d_d_nucleus(electron: f64, nucleus: f64, softening: f64) -> f64 {
    let r = electron - nucleus;
    let s = r * r + softening * softening;
    r / s.powf(1.5)
}

/// 1個の点状の電子が原子核に及ぼす Hellmann–Feynman の力
/// \[
/// F = -\frac{\partial V}{\partial X} = Z\, r\,(r^2 + a^2)^{-3/2}
/// \]
/// を返します。\(V = -Z s\) は電子が原子核に及ぼすポテンシャル、正の \(F\) は原子核の座標 \(X\) を増やす向きです。
pub fn point_hellmann_force(electron: f64, nucleus: f64, charge: f64, softening: f64) -> f64 {
    charge * soft_coulomb_d_d_nucleus(electron, nucleus, softening)
}

/// 二つの単位電荷の反発 \(V_{nn} = (R^2 + a^2)^{-1/2}\) の核間距離についての導関数
/// \[
/// \frac{d V_{nn}}{d R} = -R\,(R^2 + a^2)^{-3/2}
/// \]
/// を返します。
pub fn nuclear_repulsion_slope(distance: f64, softening: f64) -> f64 {
    let s = distance * distance + softening * softening;
    -distance / s.powf(1.5)
}

/// 二つの陽子と1個の電子のモデルで、核間距離 \(R\) を増やす向きの Hellmann–Feynman の力 \(-dU_0/dR\) を返します。
///
/// 陽子は \(X = \mp R/2\) にあります。電子の基底状態について
/// \[
/// \frac{\partial V_{\mathrm{ext}}}{\partial R} = \frac{1}{2}\frac{\partial s}{\partial X_1} - \frac{1}{2}\frac{\partial s}{\partial X_2}
/// \]
/// の期待値と、核反発の導関数を加え、符号を変えます。
pub fn pair_hellmann_force(length: f64, points: usize, softening: f64, distance: f64) -> f64 {
    let (x, spacing) = grid_points(length, points);
    let nuclei = proton_pair(distance);
    let potential = external_potential(&x, &nuclei, softening);
    let (_, orbitals) = schrodinger_states(&potential, spacing, 1);
    let psi = &orbitals[0];
    let mut slope = 0.0;
    for (&xj, &amplitude) in x.iter().zip(psi) {
        let left = soft_coulomb_d_d_nucleus(xj, nuclei[0].position, softening);
        let right = soft_coulomb_d_d_nucleus(xj, nuclei[1].position, softening);
        let derivative = 0.5 * left - 0.5 * right;
        slope += amplitude * amplitude * derivative * spacing;
    }
    -slope - nuclear_repulsion_slope(distance, softening)
}

/// 断熱ポテンシャル \(U_0(R)\) の中心差分から、核間距離を増やす向きの力 \(-dU_0/dR\) を返します。
pub fn adiabatic_force(length: f64, points: usize, softening: f64, distance: f64, delta: f64) -> f64 {
    let ahead = ground_potential(length, points, softening, distance + delta);
    let behind = ground_potential(length, points, softening, distance - delta);
    -(ahead - behind) / (2.0 * delta)
}

/// 加速度が今のステップと次のステップで分かっているときの速度 Verlet 法の1ステップ
/// \[
/// v_{n+1/2} = v_n + \tfrac{1}{2}\Delta t\, a_n, \qquad
/// x_{n+1} = x_n + \Delta t\, v_{n+1/2}, \qquad
/// v_{n+1} = v_{n+1/2} + \tfrac{1}{2}\Delta t\, a_{n+1}
/// \]
/// を返します。戻り値は \((x_{n+1}, v_{n+1})\) です。
pub fn born_oppenheimer_verlet_step(position: f64, velocity: f64, acceleration: f64, next_acceleration: f64, dt: f64) -> (f64, f64) {
    let half = velocity + 0.5 * dt * acceleration;
    let next = position + dt * half;
    (next, half + 0.5 * dt * next_acceleration)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn three_point_box_matches_the_hand_example() {
        let (x, h) = grid_points(4.0, 3);
        assert_eq!(h, 1.0);
        assert_eq!(x, vec![-1.0, 0.0, 1.0]);
        let (energies, orbitals) = schrodinger_states(&[0.0; 3], h, 3);
        let expected = [1.0 - 0.5f64.sqrt(), 1.0, 1.0 + 0.5f64.sqrt()];
        for n in 0..3 {
            assert!((energies[n] - expected[n]).abs() < 1e-13);
            assert!((energies[n] - box_energy_discrete(n + 1, 4.0, 1.0)).abs() < 1e-13);
        }
        let ground = &orbitals[0];
        assert!((ground[0] - 0.5).abs() < 1e-10 && (ground[1] - 0.5f64.sqrt()).abs() < 1e-10);
        assert!((box_energy(1, 4.0) - std::f64::consts::PI.powi(2) / 32.0).abs() < 1e-15);
    }

    #[test]
    fn box_eigenvalues_converge_to_the_continuum() {
        let (_, h) = grid_points(1.0, 199);
        let (energies, orbitals) = schrodinger_states(&vec![0.0; 199], h, 4);
        for n in 1..=4 {
            assert!((energies[n - 1] - box_energy_discrete(n, 1.0, h)).abs() < 1e-9);
            assert!((energies[n - 1] - box_energy(n, 1.0)).abs() < 1e-3 * box_energy(n, 1.0));
        }
        let overlap: f64 = orbitals[0].iter().zip(&orbitals[1]).map(|(a, b)| a * b).sum::<f64>() * h;
        assert!(overlap.abs() < 1e-10);
    }

    #[test]
    fn harmonic_oscillator_levels_are_n_plus_half() {
        let (x, h) = grid_points(20.0, 399);
        let v: Vec<f64> = x.iter().map(|x| 0.5 * x * x).collect();
        let (energies, _) = schrodinger_states(&v, h, 4);
        for (n, e) in energies.iter().enumerate() {
            assert!((e - (n as f64 + 0.5)).abs() < 2e-3, "{n} {e}");
        }
    }

    #[test]
    fn sturm_count_and_rayleigh_quotient() {
        let diag = [2.0, 2.0, 2.0];
        let off = [-1.0, -1.0];
        assert_eq!(sturm_count(&diag, &off, 0.5), 0);
        assert_eq!(sturm_count(&diag, &off, 1.0), 1);
        assert_eq!(sturm_count(&diag, &off, 3.0), 2);
        assert_eq!(sturm_count(&diag, &off, 4.0), 3);
        let trial = [0.3, 1.0, -0.2];
        let t_trial = [2.0 * 0.3 - 1.0, -0.3 + 2.0 + 0.2, -1.0 - 0.4];
        let quotient = trial.iter().zip(&t_trial).map(|(a, b)| a * b).sum::<f64>()
            / trial.iter().map(|a| a * a).sum::<f64>();
        assert!(quotient >= tridiagonal_eigenvalues(&diag, &off, 1)[0]);
    }

    #[test]
    fn proton_pair_has_a_bound_minimum() {
        let f = |r: f64| ground_potential(20.0, 199, 1.0, r);
        let golden = golden_section_minimum(f, 0.5, 6.0, 1e-7);
        let newton = parabola_newton_minimum(f, 2.0, 1e-3, 1e-9);
        assert!((golden.point - newton.point).abs() < 1e-5, "{} {}", golden.point, newton.point);
        assert!(newton.iterations < golden.iterations);
        let curvature = second_difference(f, golden.point, 0.01);
        assert!(curvature > 0.0);
        let curves = bond_curves(20.0, 199, 1.0, &[golden.point, 20.0]);
        assert!(curves.ground[0] < curves.ground[1]);
        assert!(curves.excited[0] > curves.ground[0]);
        let omega = vibrational_frequency(curvature, PROTON_MASS / 2.0);
        assert!(omega > 0.0 && omega < curves.excited[0] - curves.ground[0]);
    }

    #[test]
    fn kohn_sham_scf_converges_and_energy_terms_add_up() {
        let model = KohnSham::new(20.0, 199, &proton_pair(2.0), 1.0);
        assert!((nuclear_repulsion(&model.nuclei, 1.0) - 1.0 / 5f64.sqrt()).abs() < 1e-15);
        let slow = kohn_sham_solve(&model, 0.3, 1e-10, 500);
        let fast = kohn_sham_solve(&model, 0.7, 1e-10, 500);
        assert!(slow.converged && fast.converged);
        assert!(fast.iterations < slow.iterations);
        assert!((slow.last.energy.total - fast.last.energy.total).abs() < 1e-8);
        let it = &fast.last;
        let electrons: f64 = it.density_out.iter().sum::<f64>() * model.spacing;
        assert!((electrons - 2.0).abs() < 1e-10);
        let vx = exchange_potential(&it.density_out);
        let vx_n: f64 = vx.iter().zip(&it.density_out).map(|(a, b)| a * b).sum::<f64>() * model.spacing;
        let e = it.energy;
        let by_eigenvalue = 2.0 * it.eigenvalue - e.hartree - vx_n + e.exchange + e.nuclear;
        assert!((by_eigenvalue - e.total).abs() < 1e-7, "{by_eigenvalue} {}", e.total);
    }

    #[test]
    fn exchange_potential_hand_values() {
        let n = std::f64::consts::PI / 24.0;
        assert!((exchange_potential(&[n])[0] + 0.5).abs() < 1e-15);
        assert_eq!(exchange_potential(&[0.0])[0], 0.0);
    }

    #[test]
    fn point_hellmann_force_is_minus_sqrt_two_over_four() {
        let force = point_hellmann_force(0.0, 1.0, 1.0, 1.0);
        let exact = -1.0 / (2.0 * 2.0_f64.sqrt());
        assert!((force - exact).abs() < 1e-14, "{force} {exact}");
        assert!((nuclear_repulsion_slope(1.0, 1.0) - exact).abs() < 1e-14);
    }

    #[test]
    fn pair_hellmann_force_matches_the_adiabatic_slope() {
        let hellmann = pair_hellmann_force(20.0, 41, 1.0, 2.0);
        let adiabatic = adiabatic_force(20.0, 41, 1.0, 2.0, 1e-4);
        assert!((hellmann - adiabatic).abs() < 1e-4, "{hellmann} {adiabatic}");
    }

    #[test]
    fn verlet_step_with_constant_acceleration_is_exact() {
        let (position, velocity) = born_oppenheimer_verlet_step(2.0, 0.0, -1.0, -1.0, 0.5);
        assert!((position - 1.875).abs() < 1e-15, "{position}");
        assert!((velocity + 0.5).abs() < 1e-15, "{velocity}");
    }
}
