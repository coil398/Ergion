//! 発展的な微分方程式の計算。Sturm–Liouville 問題のシューティング法、Lorenz 方程式、
//! 熱伝導方程式の差分法、波動方程式の差分法と厳密解。

use crate::calculus::simpson_rule;
use crate::rk4_step;

/// 固有値問題 \(-x'' = \lambda x\)、\(x(0) = 0\) の解を、初期値 \(x'(0) = 1\) から右端 \(t = L\) まで進めた値 \(x(L; \lambda)\) を返します。
///
/// \(\lambda\) は試す固有値、\(L > 0\) は区間 \([0, L]\) の長さ、\(N\) は刻みの数で、刻み幅は \(h = L/N\) です。
/// 2階の方程式を \(\mathbf{y} = (x, x')\) の1階連立 \(x' = y_2\)、\(y_2' = -\lambda x\) に直し、
/// 古典的な4次の Runge–Kutta 法 [`crate::rk4_step`] で \(N\) 回進めます。
/// 右端の境界条件は \(x(L) = 0\) なので、この値をシューティングの残差と呼びます。
/// 残差が 0 になる \(\lambda\) が固有値です。厳密には
/// \[
/// x(L; \lambda) = \frac{\sin(\sqrt{\lambda}\,L)}{\sqrt{\lambda}} \quad (\lambda > 0)
/// \]
/// で、根は \(\lambda_n = (n\pi/L)^2\) です。返す値は Runge–Kutta 法による近似です。
pub fn shooting_residual(lambda: f64, length: f64, steps: usize) -> f64 {
    let (_, x) = shooting_profile(lambda, length, steps);
    x[x.len() - 1]
}

/// [`shooting_residual`] と同じ初期値問題を解き、格子 \(t_i = i h\)（\(i = 0, \ldots, N\)、\(h = L/N\)）の上の
/// 時刻の列と解 \(x(t_i; \lambda)\) の列を返します。値は Runge–Kutta 法による近似です。
pub fn shooting_profile(lambda: f64, length: f64, steps: usize) -> (Vec<f64>, Vec<f64>) {
    let steps = steps.max(1);
    let h = length / steps as f64;
    let mut state = [0.0, 1.0];
    let mut t = Vec::with_capacity(steps + 1);
    let mut x = Vec::with_capacity(steps + 1);
    t.push(0.0);
    x.push(0.0);
    for i in 0..steps {
        let time = i as f64 * h;
        rk4_step(&mut state, time, h, |_, y, dy| {
            dy[0] = y[1];
            dy[1] = -lambda * y[0];
        });
        t.push((i + 1) as f64 * h);
        x.push(state[0]);
    }
    (t, x)
}

/// 残差 \(x(L; \lambda) = 0\) の根を探す方法。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RootSearch {
    /// 二分法。符号の変わる区間 \([\lambda_a, \lambda_b]\) を毎回半分にする。
    Bisection,
    /// 割線法。直前の二点を通る直線の根へ進む。
    Secant,
}

/// 固有値問題 \(-x'' = \lambda x\)、\(x(0) = x(L) = 0\) の \(n\) 番目の固有値 \(\lambda_n\) を、シューティング法で探します。
///
/// 返す値は、固有値の近似と、根を探す反復の回数です。手順は次のとおりです。
///
/// 1. \(\lambda\) を \(\lambda = \delta/2\) から刻み \(\delta = \frac{1}{4}(\pi/L)^2\) で増やしながら残差 [`shooting_residual`] を評価し、
///    符号が \(n\) 回目に変わる区間 \([\lambda_a, \lambda_b]\) を見つけます。
///    隣り合う固有値の間隔は \(\lambda_{n+1} - \lambda_n = (2n+1)(\pi/L)^2 \ge 3(\pi/L)^2\) なので、一つの刻みに根は二つ入りません。
/// 2. 二分法では、中点 \(\lambda_c = (\lambda_a + \lambda_b)/2\) の残差の符号で区間を半分にし、幅が \(10^{-12}\max(1, \lambda_c)\) 以下になるまで続けます。
/// 3. 割線法では、\(\lambda_a, \lambda_b\) から始めて
///    \[
///    \lambda_{k+1} = \lambda_k - r(\lambda_k)\,\frac{\lambda_k - \lambda_{k-1}}{r(\lambda_k) - r(\lambda_{k-1})}
///    \]
///    （\(r(\lambda) = x(L; \lambda)\)）を、更新の大きさが同じ閾値以下になるまで続けます。
///
/// 厳密な固有値は [`dirichlet_eigenvalue`] の \((n\pi/L)^2\) で、返す値はこれの近似です。
/// \(n = 0\) のときは非数を返します。
pub fn shooting_eigenvalue(n: usize, length: f64, steps: usize, search: RootSearch) -> (f64, usize) {
    if n == 0 {
        return (f64::NAN, 0);
    }
    let delta = 0.25 * (std::f64::consts::PI / length).powi(2);
    let mut a = 0.5 * delta;
    let mut ra = shooting_residual(a, length, steps);
    let mut found = 0;
    let mut b = a;
    let mut rb = ra;
    for _ in 0..100_000 {
        b = a + delta;
        rb = shooting_residual(b, length, steps);
        if ra * rb <= 0.0 {
            found += 1;
            if found == n {
                break;
            }
        }
        a = b;
        ra = rb;
    }
    if found < n {
        return (f64::NAN, 0);
    }
    let tolerance = |l: f64| 1e-12 * l.abs().max(1.0);
    let mut iterations = 0;
    match search {
        RootSearch::Bisection => {
            while b - a > tolerance(0.5 * (a + b)) && iterations < 200 {
                let c = 0.5 * (a + b);
                let rc = shooting_residual(c, length, steps);
                iterations += 1;
                if rc == 0.0 {
                    return (c, iterations);
                }
                if ra * rc < 0.0 {
                    b = c;
                } else {
                    a = c;
                    ra = rc;
                }
            }
            (0.5 * (a + b), iterations)
        }
        RootSearch::Secant => {
            let (mut previous, mut rp) = (a, ra);
            let (mut current, mut rc) = (b, rb);
            while iterations < 200 {
                if rc == rp {
                    break;
                }
                let next = current - rc * (current - previous) / (rc - rp);
                iterations += 1;
                previous = current;
                rp = rc;
                current = next;
                rc = shooting_residual(current, length, steps);
                if (current - previous).abs() <= tolerance(current) {
                    break;
                }
            }
            (current, iterations)
        }
    }
}

/// 固有値問題 \(-x'' = \lambda x\)、\(x(0) = x(L) = 0\) の \(n\) 番目の厳密な固有値 \(\lambda_n = (n\pi/L)^2\) を返します。
///
/// 固有関数は \(x_n(t) = \sin(n\pi t/L)\) です。\(\lambda \le 0\) では、\(x(0) = 0\) を満たす解
/// \(x = t\)、\(x = \sinh(\sqrt{-\lambda}\,t)\) が \(t = L\) で 0 にならないので、固有値はすべて正です。
pub fn dirichlet_eigenvalue(n: usize, length: f64) -> f64 {
    (n as f64 * std::f64::consts::PI / length).powi(2)
}

/// 正規化した厳密な固有関数 \(\phi_n(t) = \sqrt{2/L}\,\sin(n\pi t/L)\) を返します。
///
/// \(\int_0^L \sin^2(n\pi t/L)\,dt = L/2\) なので、\(\int_0^L \phi_n^2\,dt = 1\) です。
pub fn dirichlet_eigenfunction(n: usize, length: f64, t: f64) -> f64 {
    (2.0 / length).sqrt() * (n as f64 * std::f64::consts::PI * t / length).sin()
}

/// 等間隔の格子の上の値の列 \(x_0, \ldots, x_N\) の、両端を除いた内部の節（符号が変わる点）の数を返します。
///
/// 両端の値と、絶対値が最大値の \(10^{-9}\) 倍以下の値は 0 とみなして数えません。
pub fn interior_nodes(values: &[f64]) -> usize {
    let scale = values.iter().fold(0.0_f64, |m, v| m.max(v.abs()));
    let inner = if values.len() > 2 { &values[1..values.len() - 1] } else { &[] };
    let mut sign = 0.0;
    let mut count = 0;
    for &v in inner {
        if v.abs() <= 1e-9 * scale {
            continue;
        }
        let s = v.signum();
        if sign != 0.0 && s != sign {
            count += 1;
        }
        sign = s;
    }
    count
}

/// 等間隔の格子 \(t_i = i h\)（\(h = L/N\)、\(N\) は偶数）の上の値 \(f_i, g_i\) から、内積 \(\int_0^L f g\,dt\) を Simpson 則で近似します。
///
/// Simpson 則は [`crate::calculus::simpson_rule`] で、
/// \[
/// \int_0^L f g\,dt \approx \frac{h}{3}\left[f_0 g_0 + 4\sum_{i\ \text{奇数}} f_i g_i + 2\sum_{i\ \text{偶数},\,0<i<N} f_i g_i + f_N g_N\right]
/// \]
/// です。二つの列の長さが違うか、\(N\) が奇数のときは非数を返します。
pub fn grid_inner_product(f: &[f64], g: &[f64], length: f64) -> f64 {
    if f.len() != g.len() || f.len() < 3 {
        return f64::NAN;
    }
    let n = f.len() - 1;
    let h = length / n as f64;
    simpson_rule(|t| {
        let i = ((t / h).round() as usize).min(n);
        f[i] * g[i]
    }, 0.0, length, n)
}

/// Lorenz 方程式の右辺を `out` に書きます。
///
/// 状態は \((x, y, z)\)、\(\sigma\) は Prandtl 数、\(\rho\) は Rayleigh 数の比、\(\beta\) は幾何の係数です。
/// \[
/// x' = \sigma (y - x), \qquad y' = x(\rho - z) - y, \qquad z' = x y - \beta z
/// \]
pub fn lorenz_derivative(sigma: f64, rho: f64, beta: f64, state: &[f64], out: &mut [f64]) {
    let (x, y, z) = (state[0], state[1], state[2]);
    out[0] = sigma * (y - x);
    out[1] = x * (rho - z) - y;
    out[2] = x * y - beta * z;
}

/// Lorenz 方程式の原点以外の二つの固定点 \(C_\pm\) を返します。\(\rho \le 1\) では非数を返します。
///
/// 固定点では右辺が 0 です。\(x' = 0\) から \(y = x\)、\(z' = 0\) から \(z = x^2/\beta\)、
/// これを \(y' = x(\rho - z) - y = 0\) に入れると \(x(\rho - 1 - x^2/\beta) = 0\) です。
/// \(x \ne 0\) の根は \(x^2 = \beta(\rho - 1)\) なので
/// \[
/// C_\pm = \left(\pm\sqrt{\beta(\rho - 1)},\ \pm\sqrt{\beta(\rho - 1)},\ \rho - 1\right)
/// \]
/// です。\(\sigma = 10\)、\(\rho = 28\)、\(\beta = 8/3\) では \(\beta(\rho - 1) = 72\) で、\(C_\pm = (\pm 6\sqrt 2, \pm 6\sqrt 2, 27)\) です。
pub fn lorenz_fixed_points(rho: f64, beta: f64) -> [[f64; 3]; 2] {
    let s = if rho > 1.0 { (beta * (rho - 1.0)).sqrt() } else { f64::NAN };
    [[s, s, rho - 1.0], [-s, -s, rho - 1.0]]
}

/// Lorenz 方程式の右辺の Jacobi 行列 \(J\) を、点 \((x, y, z)\) で返します。行ごとに並べます。
///
/// \[
/// J = \begin{pmatrix} -\sigma & \sigma & 0 \\ \rho - z & -1 & -x \\ y & x & -\beta \end{pmatrix}
/// \]
pub fn lorenz_jacobian(sigma: f64, rho: f64, beta: f64, state: &[f64]) -> [[f64; 3]; 3] {
    let (x, y, z) = (state[0], state[1], state[2]);
    [[-sigma, sigma, 0.0], [rho - z, -1.0, -x], [y, x, -beta]]
}

/// 原点での Jacobi 行列 [`lorenz_jacobian`] の三つの固有値を、大きい順に返します。
///
/// 原点では \(x = y = z = 0\) なので、\(J\) は \((x, y)\) の \(2\times 2\) の区画と \(z\) の成分 \(-\beta\) に分かれます。
/// 区画 \(\begin{pmatrix} -\sigma & \sigma \\ \rho & -1 \end{pmatrix}\) の特性方程式は
/// \[
/// \mu^2 + (\sigma + 1)\mu + \sigma(1 - \rho) = 0
/// \]
/// で、根は
/// \[
/// \mu_\pm = \frac{-(\sigma + 1) \pm \sqrt{(\sigma + 1)^2 + 4\sigma(\rho - 1)}}{2}
/// \]
/// です。残りの固有値は \(\mu_3 = -\beta\) です。\(\sigma = 10\)、\(\rho = 28\)、\(\beta = 8/3\) では
/// \(\mu_\pm = (-11 \pm \sqrt{1201})/2\) で、\(\mu_+ \approx 11.83\) が正なので原点は不安定です。
/// 判別式が負のときは、実部 \(-(\sigma + 1)/2\) を二つ返します。
pub fn lorenz_origin_eigenvalues(sigma: f64, rho: f64, beta: f64) -> [f64; 3] {
    let b = sigma + 1.0;
    let disc = b * b + 4.0 * sigma * (rho - 1.0);
    let (plus, minus) = if disc >= 0.0 {
        let root = disc.sqrt();
        (0.5 * (-b + root), 0.5 * (-b - root))
    } else {
        (-0.5 * b, -0.5 * b)
    };
    let mut values = [plus, minus, -beta];
    values.sort_by(|a, b| b.total_cmp(a));
    values
}

/// 熱伝導方程式 \(u_t = \kappa u_{xx}\)、\(u(0, t) = u(L, t) = 0\)、\(u(x, 0) = \sum_n A_n \sin(n\pi x/L)\) の厳密解を返します。
///
/// \(\kappa > 0\) は熱拡散率、\(L\) は棒の長さ、`modes` は組 \((n, A_n)\) の列です。
/// 変数分離 \(u = X(x)T(t)\) から \(X'' = -k^2 X\)、\(T' = -\kappa k^2 T\) を得て、
/// 境界条件から \(k = n\pi/L\) です。各モードは独立に減衰し、
/// \[
/// u(x, t) = \sum_n A_n \sin\!\left(\frac{n\pi x}{L}\right) e^{-\kappa (n\pi/L)^2 t}
/// \]
/// です。初期値が有限個のモードの和なので、この和は打ち切りのない厳密解です。
pub fn heat_fourier_solution(modes: &[(usize, f64)], kappa: f64, length: f64, x: f64, t: f64) -> f64 {
    modes
        .iter()
        .map(|&(n, a)| {
            let k = n as f64 * std::f64::consts::PI / length;
            a * (k * x).sin() * (-kappa * k * k * t).exp()
        })
        .sum()
}

/// 熱伝導方程式の差分法の比 \(r = \kappa \Delta t / \Delta x^2\) を返します。
///
/// \(\Delta t\) は時間刻み、\(\Delta x\) は格子の間隔です。FTCS 法は \(r \le 1/2\) のときに限り安定です。
pub fn heat_ratio(kappa: f64, dt: f64, dx: f64) -> f64 {
    kappa * dt / (dx * dx)
}

/// FTCS 法（時間に前進差分、空間に中心差分）で、格子の上の温度 \(u_j\) を1ステップ進めます。
///
/// \(u_j^n\) は時刻 \(t_n\)、位置 \(x_j = j\Delta x\) の値で、両端 \(u_0 = u_M = 0\) は動かしません。
/// \[
/// u_j^{n+1} = u_j^n + r\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right), \qquad r = \frac{\kappa \Delta t}{\Delta x^2}
/// \]
/// モード \(u_j = \sin(j\theta)\) を入れると1ステップで \(G(\theta) = 1 - 4r\sin^2(\theta/2)\) 倍になります（[`ftcs_amplification`]）。
/// 最も細かいモードでは \(G \approx 1 - 4r\) なので、\(r > 1/2\) では \(|G| > 1\) となり、そのモードが毎ステップ増えて解は発散します。
pub fn ftcs_step(u: &mut [f64], r: f64) {
    let m = u.len();
    if m < 3 {
        return;
    }
    let old = u.to_vec();
    for j in 1..m - 1 {
        u[j] = old[j] + r * (old[j + 1] - 2.0 * old[j] + old[j - 1]);
    }
    u[0] = 0.0;
    u[m - 1] = 0.0;
}

/// FTCS 法の増幅率 \(G(\theta) = 1 - 4r\sin^2(\theta/2)\) を返します。
///
/// \(\theta = k\Delta x\) は格子1間隔あたりのモードの位相です。\(u_j^n = G^n \sin(j\theta)\) を [`ftcs_step`] の式に入れると、
/// \(\sin((j+1)\theta) - 2\sin(j\theta) + \sin((j-1)\theta) = (2\cos\theta - 2)\sin(j\theta) = -4\sin^2(\theta/2)\sin(j\theta)\) より、この値が厳密に得られます。
pub fn ftcs_amplification(r: f64, theta: f64) -> f64 {
    let s = (0.5 * theta).sin();
    1.0 - 4.0 * r * s * s
}

/// 三重対角の連立1次方程式を Thomas 法（三重対角の Gauss 消去）で解きます。
///
/// 方程式は、\(i = 0, \ldots, m-1\) について
/// \[
/// a_i x_{i-1} + b_i x_i + c_i x_{i+1} = d_i
/// \]
/// です（\(a_0\) と \(c_{m-1}\) は使いません）。`lower` が \(a\)、`diag` が \(b\)、`upper` が \(c\)、`rhs` が \(d\) です。
/// 前進消去で
/// \[
/// c'_0 = \frac{c_0}{b_0},\quad d'_0 = \frac{d_0}{b_0},\qquad
/// c'_i = \frac{c_i}{b_i - a_i c'_{i-1}},\quad d'_i = \frac{d_i - a_i d'_{i-1}}{b_i - a_i c'_{i-1}}
/// \]
/// を作り、後退代入 \(x_{m-1} = d'_{m-1}\)、\(x_i = d'_i - c'_i x_{i+1}\) で解きます。手間は \(m\) に比例します。
/// 対角優位（\(|b_i| > |a_i| + |c_i|\)）なら分母は 0 になりません。分母が 0 になるか、長さがそろわないときは `None` を返します。
pub fn solve_tridiagonal(lower: &[f64], diag: &[f64], upper: &[f64], rhs: &[f64]) -> Option<Vec<f64>> {
    let m = diag.len();
    if m == 0 || lower.len() != m || upper.len() != m || rhs.len() != m {
        return None;
    }
    let mut c = vec![0.0; m];
    let mut d = vec![0.0; m];
    if diag[0] == 0.0 {
        return None;
    }
    c[0] = upper[0] / diag[0];
    d[0] = rhs[0] / diag[0];
    for i in 1..m {
        let denominator = diag[i] - lower[i] * c[i - 1];
        if denominator == 0.0 {
            return None;
        }
        c[i] = upper[i] / denominator;
        d[i] = (rhs[i] - lower[i] * d[i - 1]) / denominator;
    }
    let mut x = vec![0.0; m];
    x[m - 1] = d[m - 1];
    for i in (0..m - 1).rev() {
        x[i] = d[i] - c[i] * x[i + 1];
    }
    Some(x)
}

/// Crank–Nicolson 法で、格子の上の温度 \(u_j\) を1ステップ進めます。両端 \(u_0 = u_M = 0\) は動かしません。
///
/// 空間の2階差分を、時刻 \(t_n\) と \(t_{n+1}\) の平均で置きます。
/// \[
/// \frac{u_j^{n+1} - u_j^n}{\Delta t} = \frac{\kappa}{2\Delta x^2}\left[(\delta^2 u^{n+1})_j + (\delta^2 u^n)_j\right],
/// \qquad (\delta^2 u)_j = u_{j+1} - 2u_j + u_{j-1}
/// \]
/// 移項すると、内部の点 \(j = 1, \ldots, M-1\) について三重対角の方程式
/// \[
/// -\frac{r}{2} u_{j-1}^{n+1} + (1 + r) u_j^{n+1} - \frac{r}{2} u_{j+1}^{n+1}
/// = \frac{r}{2} u_{j-1}^n + (1 - r) u_j^n + \frac{r}{2} u_{j+1}^n
/// \]
/// を得ます（\(r = \kappa\Delta t/\Delta x^2\)）。これを [`solve_tridiagonal`] で解きます。
/// 増幅率は \(G = \frac{1 - 2r\sin^2(\theta/2)}{1 + 2r\sin^2(\theta/2)}\) で、どの \(r > 0\) でも \(|G| \le 1\) なので安定です。
pub fn crank_nicolson_step(u: &mut [f64], r: f64) {
    let m = u.len();
    if m < 3 {
        return;
    }
    let inner = m - 2;
    let half = 0.5 * r;
    let lower = vec![-half; inner];
    let diag = vec![1.0 + r; inner];
    let upper = vec![-half; inner];
    let rhs: Vec<f64> = (1..m - 1).map(|j| half * u[j - 1] + (1.0 - r) * u[j] + half * u[j + 1]).collect();
    if let Some(x) = solve_tridiagonal(&lower, &diag, &upper, &rhs) {
        u[1..m - 1].copy_from_slice(&x);
    }
    u[0] = 0.0;
    u[m - 1] = 0.0;
}

/// 弦を位置 \(p\) で高さ \(h\) につまみ上げた三角形の初期形 \(f(x)\) を返します。区間は \([0, L]\) で、\(0 < p < L\) です。
///
/// \[
/// f(x) = \begin{cases} h\,x/p & (0 \le x \le p) \\ h\,(L - x)/(L - p) & (p \le x \le L) \end{cases}
/// \]
/// 区間の外では 0 を返します。
pub fn plucked_string(x: f64, length: f64, pluck: f64, height: f64) -> f64 {
    if !(0.0..=length).contains(&x) {
        0.0
    } else if x <= pluck {
        height * x / pluck
    } else {
        height * (length - x) / (length - pluck)
    }
}

/// 区間 \([0, L]\) の関数 \(f\) の奇周期拡張 \(F(x)\) を返します。
///
/// \(F\) は \(F(-x) = -F(x)\)、\(F(x + 2L) = F(x)\) を満たし、\([0, L]\) では \(f\) に一致します。
/// \(x\) を \([-L, L)\) に戻し、負なら \(-f(-x)\) とします。
pub fn odd_periodic_extension(f: impl Fn(f64) -> f64, x: f64, length: f64) -> f64 {
    let period = 2.0 * length;
    let mut s = (x + length).rem_euclid(period) - length;
    if s >= length {
        s -= period;
    }
    if s >= 0.0 { f(s) } else { -f(-s) }
}

/// 両端固定の弦の波動方程式 \(u_{tt} = c^2 u_{xx}\)、\(u(0, t) = u(L, t) = 0\)、\(u(x, 0) = f(x)\)、\(u_t(x, 0) = 0\) の厳密解を返します。
///
/// \(c > 0\) は波の伝わる速さです。d'Alembert の解 \(u = \frac{1}{2}[F(x - ct) + F(x + ct)]\) で、
/// \(F\) は \(f\) の奇周期拡張 [`odd_periodic_extension`] です。\(F\) が奇関数なので \(u(0, t) = \frac{1}{2}[F(-ct) + F(ct)] = 0\)、
/// 周期 \(2L\) の奇関数なので \(u(L, t) = \frac{1}{2}[F(L - ct) + F(L + ct)] = 0\) となり、両端の条件を満たします。
/// 端に着いた波は符号を変えて反射します。この値は打ち切りのない厳密解です。
pub fn wave_dalembert(f: impl Fn(f64) -> f64, length: f64, c: f64, x: f64, t: f64) -> f64 {
    let (right, left) = wave_dalembert_parts(&f, length, c, x, t);
    right + left
}

/// [`wave_dalembert`] の二つの進行波 \(\frac{1}{2}F(x - ct)\)（右へ進む）と \(\frac{1}{2}F(x + ct)\)（左へ進む）を返します。厳密です。
pub fn wave_dalembert_parts(f: impl Fn(f64) -> f64, length: f64, c: f64, x: f64, t: f64) -> (f64, f64) {
    (
        0.5 * odd_periodic_extension(&f, x - c * t, length),
        0.5 * odd_periodic_extension(&f, x + c * t, length),
    )
}

/// 三角形の初期形 [`plucked_string`] の Fourier 正弦係数 \(B_n = \frac{2}{L}\int_0^L f(x)\sin(n\pi x/L)\,dx\) を返します。
///
/// 部分積分を二度行うと
/// \[
/// B_n = \frac{2 h L^2}{\pi^2 n^2\, p (L - p)} \sin\!\left(\frac{n\pi p}{L}\right)
/// \]
/// です。固有振動の重ね合わせ \(u = \sum_n B_n \sin(n\pi x/L)\cos(n\pi c t/L)\) は d'Alembert の解 [`wave_dalembert`] と等しくなります。
pub fn plucked_mode_coefficient(n: usize, length: f64, pluck: f64, height: f64) -> f64 {
    let n = n as f64;
    let pi = std::f64::consts::PI;
    2.0 * height * length * length / (pi * pi * n * n * pluck * (length - pluck)) * (n * pi * pluck / length).sin()
}

/// 固有振動の重ね合わせを \(n = 1, \ldots, N\) で打ち切った和
/// \(\sum_{n=1}^{N} B_n \sin(n\pi x/L)\cos(n\pi c t/L)\) を返します。\(B_n\) は [`plucked_mode_coefficient`] です。
///
/// 係数は \(1/n^2\) で小さくなるので、打ち切りの誤差は \(N\) とともに 0 に近づきます。返す値は近似です。
pub fn wave_mode_sum(terms: usize, length: f64, c: f64, pluck: f64, height: f64, x: f64, t: f64) -> f64 {
    let pi = std::f64::consts::PI;
    (1..=terms)
        .map(|n| {
            let k = n as f64 * pi / length;
            plucked_mode_coefficient(n, length, pluck, height) * (k * x).sin() * (k * c * t).cos()
        })
        .sum()
}

/// 波動方程式の差分法の Courant 数 \(C = c\,\Delta t/\Delta x\) を返します。中心差分法は \(C \le 1\) で安定です。
pub fn wave_courant(c: f64, dt: f64, dx: f64) -> f64 {
    c * dt / dx
}

/// 中心差分法の最初の1ステップ \(u^1\) を、初期形 \(u^0\) と初速度 0 から作ります。両端は 0 です。
///
/// 時間の中心差分 \(u^{1} - 2u^0 + u^{-1} = C^2 (\delta^2 u^0)\) に、初速度 0 の中心差分 \(u^1 = u^{-1}\) を入れると
/// \[
/// u_j^1 = u_j^0 + \frac{C^2}{2}\left(u_{j+1}^0 - 2u_j^0 + u_{j-1}^0\right)
/// \]
/// です。\(C = 1\) では \(u_j^1 = \frac{1}{2}(u_{j+1}^0 + u_{j-1}^0)\) となり、d'Alembert の解の \(t = \Delta t\) の値と一致します。
pub fn leapfrog_start(u0: &[f64], courant: f64) -> Vec<f64> {
    let m = u0.len();
    let c2 = courant * courant;
    let mut u1 = vec![0.0; m];
    for j in 1..m.saturating_sub(1) {
        u1[j] = u0[j] + 0.5 * c2 * (u0[j + 1] - 2.0 * u0[j] + u0[j - 1]);
    }
    u1
}

/// 中心差分法（leapfrog）で、前の時刻 \(u^{n-1}\) と今の時刻 \(u^n\) から次の時刻 \(u^{n+1}\) を返します。両端は 0 です。
///
/// \(u_{tt}\) と \(u_{xx}\) をどちらも中心差分で置くと
/// \[
/// u_j^{n+1} = 2u_j^n - u_j^{n-1} + C^2\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right), \qquad C = \frac{c\,\Delta t}{\Delta x}
/// \]
/// です。誤差は \(\Delta t^2\) と \(\Delta x^2\) に比例します。\(C = 1\) では \(u_j^{n+1} = u_{j+1}^n + u_{j-1}^n - u_j^{n-1}\) となり、
/// 格子点の上で d'Alembert の解を厳密に満たします。\(C > 1\) では最も細かいモードが毎ステップ増え、解は発散します。
pub fn leapfrog_step(previous: &[f64], current: &[f64], courant: f64) -> Vec<f64> {
    let m = current.len();
    let c2 = courant * courant;
    let mut next = vec![0.0; m];
    for j in 1..m.saturating_sub(1) {
        next[j] = 2.0 * current[j] - previous[j] + c2 * (current[j + 1] - 2.0 * current[j] + current[j - 1]);
    }
    next
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    #[test]
    fn shooting_finds_n_squared_on_zero_to_pi() {
        for n in 1..=4 {
            let exact = dirichlet_eigenvalue(n, PI);
            assert!((exact - (n * n) as f64).abs() < 1e-12);
            let (bisect, ib) = shooting_eigenvalue(n, PI, 200, RootSearch::Bisection);
            let (secant, is) = shooting_eigenvalue(n, PI, 200, RootSearch::Secant);
            assert!((bisect - exact).abs() < 1e-5 * exact, "{n} {bisect}");
            assert!((secant - bisect).abs() < 1e-9 * exact, "{n} {secant} {bisect}");
            assert!(is < ib, "{is} {ib}");
        }
    }

    #[test]
    fn residual_matches_the_closed_form() {
        let r = shooting_residual(2.0, PI, 400);
        let exact = (2.0_f64.sqrt() * PI).sin() / 2.0_f64.sqrt();
        assert!((r - exact).abs() < 1e-9);
    }

    #[test]
    fn eigenfunctions_have_n_minus_one_nodes_and_are_orthogonal() {
        let steps = 200;
        let modes: Vec<Vec<f64>> = (1..=4)
            .map(|n| {
                let (lambda, _) = shooting_eigenvalue(n, PI, steps, RootSearch::Bisection);
                shooting_profile(lambda, PI, steps).1
            })
            .collect();
        for (i, m) in modes.iter().enumerate() {
            assert_eq!(interior_nodes(m), i);
        }
        let norm1 = grid_inner_product(&modes[0], &modes[0], PI);
        assert!((norm1 - PI / 2.0).abs() < 1e-6, "{norm1}");
        let cross = grid_inner_product(&modes[0], &modes[1], PI);
        assert!(cross.abs() < 1e-6, "{cross}");
        let sines: Vec<f64> = (0..=steps).map(|i| (i as f64 * PI / steps as f64).sin()).collect();
        let doubles: Vec<f64> = (0..=steps).map(|i| (2.0 * i as f64 * PI / steps as f64).sin()).collect();
        assert!(grid_inner_product(&sines, &doubles, PI).abs() < 1e-12);
    }

    #[test]
    fn lorenz_fixed_points_are_six_root_two_and_twenty_seven() {
        let [plus, minus] = lorenz_fixed_points(28.0, 8.0 / 3.0);
        assert!((plus[0] - 6.0 * 2.0_f64.sqrt()).abs() < 1e-12);
        assert!((plus[1] - 6.0 * 2.0_f64.sqrt()).abs() < 1e-12);
        assert!((plus[2] - 27.0).abs() < 1e-12);
        assert!((minus[0] + 6.0 * 2.0_f64.sqrt()).abs() < 1e-12);
        let mut out = [0.0; 3];
        lorenz_derivative(10.0, 28.0, 8.0 / 3.0, &plus, &mut out);
        assert!(out.iter().all(|v| v.abs() < 1e-12), "{out:?}");
    }

    #[test]
    fn lorenz_origin_eigenvalues_match_the_quadratic() {
        let [a, b, c] = lorenz_origin_eigenvalues(10.0, 28.0, 8.0 / 3.0);
        assert!((a - (-11.0 + 1201.0_f64.sqrt()) / 2.0).abs() < 1e-12);
        assert!((b + 8.0 / 3.0).abs() < 1e-12);
        assert!((c - (-11.0 - 1201.0_f64.sqrt()) / 2.0).abs() < 1e-12);
        let j = lorenz_jacobian(10.0, 28.0, 8.0 / 3.0, &[0.0, 0.0, 0.0]);
        let trace = j[0][0] + j[1][1] + j[2][2];
        assert!((trace - (a + b + c)).abs() < 1e-12);
    }

    #[test]
    fn thomas_solves_a_small_system() {
        let x = solve_tridiagonal(&[0.0, 1.0, 1.0], &[2.0, 2.0, 2.0], &[1.0, 1.0, 0.0], &[4.0, 8.0, 8.0]).unwrap();
        for (got, want) in x.iter().zip([1.0, 2.0, 3.0]) {
            assert!((got - want).abs() < 1e-12, "{x:?}");
        }
        assert!(solve_tridiagonal(&[0.0], &[0.0], &[0.0], &[1.0]).is_none());
    }

    #[test]
    fn heat_schemes_follow_the_fourier_solution() {
        let (kappa, length, m) = (0.01, 1.0, 40);
        let dx = length / m as f64;
        let dt = 0.025;
        let r = heat_ratio(kappa, dt, dx);
        assert!((r - 0.4).abs() < 1e-12);
        let modes = [(1, 1.0), (3, 0.5), (5, 0.25)];
        let initial: Vec<f64> = (0..=m).map(|j| heat_fourier_solution(&modes, kappa, length, j as f64 * dx, 0.0)).collect();
        let mut ftcs = initial.clone();
        let mut cn = initial.clone();
        for _ in 0..200 {
            ftcs_step(&mut ftcs, r);
            crank_nicolson_step(&mut cn, r);
        }
        let exact = heat_fourier_solution(&modes, kappa, length, 0.5, 5.0);
        let hand = (-PI * PI / 20.0).exp() - 0.5 * (-9.0 * PI * PI / 20.0).exp() + 0.25 * (-25.0 * PI * PI / 20.0).exp();
        assert!((exact - hand).abs() < 1e-15);
        assert!((ftcs[m / 2] - exact).abs() < 2e-3, "{}", ftcs[m / 2]);
        assert!((cn[m / 2] - exact).abs() < 2e-3, "{}", cn[m / 2]);
        assert!((ftcs_amplification(0.6, PI) + 1.4).abs() < 1e-12);
    }

    #[test]
    fn ftcs_blows_up_above_one_half_and_crank_nicolson_does_not() {
        let m = 40;
        let modes = [(1, 1.0)];
        let mut ftcs: Vec<f64> = (0..=m).map(|j| heat_fourier_solution(&modes, 1.0, 1.0, j as f64 / m as f64, 0.0)).collect();
        ftcs[m / 2] += 1e-6;
        let mut cn = ftcs.clone();
        for _ in 0..300 {
            ftcs_step(&mut ftcs, 0.6);
            crank_nicolson_step(&mut cn, 0.6);
        }
        assert!(ftcs.iter().any(|v| v.abs() > 1e6));
        assert!(cn.iter().all(|v| v.abs() <= 1.0));
    }

    #[test]
    fn dalembert_matches_the_mode_sum_and_reflects_with_a_sign_change() {
        let f = |x: f64| plucked_string(x, 1.0, 0.5, 1.0);
        let c = 0.25;
        for &(x, t) in &[(0.3, 0.7), (0.5, 2.0), (0.8, 3.1)] {
            let a = wave_dalembert(f, 1.0, c, x, t);
            let b = wave_mode_sum(4000, 1.0, c, 0.5, 1.0, x, t);
            assert!((a - b).abs() < 1e-4, "{x} {t} {a} {b}");
        }
        assert!((wave_dalembert(f, 1.0, c, 0.5, 4.0) + 1.0).abs() < 1e-12);
        assert!(wave_dalembert(f, 1.0, c, 0.5, 2.0).abs() < 1e-12);
        assert!((wave_dalembert(f, 1.0, c, 0.5, 8.0) - 1.0).abs() < 1e-12);
    }

    #[test]
    fn leapfrog_with_courant_one_is_exact_on_the_grid() {
        let m = 100;
        let dx = 1.0 / m as f64;
        let c = 0.25;
        let dt = dx / c;
        let f = |x: f64| plucked_string(x, 1.0, 0.5, 1.0);
        let u0: Vec<f64> = (0..=m).map(|j| f(j as f64 * dx)).collect();
        let mut prev = u0.clone();
        let mut cur = leapfrog_start(&u0, wave_courant(c, dt, dx));
        for _ in 1..200 {
            let next = leapfrog_step(&prev, &cur, 1.0);
            prev = cur;
            cur = next;
        }
        for j in 0..=m {
            let exact = wave_dalembert(f, 1.0, c, j as f64 * dx, 200.0 * dt);
            assert!((cur[j] - exact).abs() < 1e-9, "{j} {} {exact}", cur[j]);
        }
    }
}
