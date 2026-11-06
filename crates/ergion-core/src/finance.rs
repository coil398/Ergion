//! 金融数学の単元の式と計算。複利と連続複利、誤差関数と標準正規分布の累積分布関数、
//! Black–Scholes 公式と Greeks、熱伝導方程式への変数変換と差分法、幾何 Brownian 運動の1ステップ、
//! Monte Carlo 法によるオプション価格の推定。各関数の rustdoc に式を書く。
//!
//! 標準正規分布の累積分布関数 \(N(z)\) は級数と連分数による近似で、誤差は \(10^{-15}\) 以下です。
//! Black–Scholes 公式の値は、この近似を除けば厳密です。擬似乱数から作った値は、どれも近似です。

use std::f64::consts::PI;

use crate::differential::solve_tridiagonal;
use crate::statistics::standard_normal_density;

/// 年 \(m\) 回の複利で、\(t\) 年後の元利合計 \(S(t) = S_0\left(1 + \frac{r}{m}\right)^{mt}\) を返す。
///
/// \(S_0\) は元本、\(r\) は年利率、\(m\) は1年あたりの複利の回数です。1回の期間 \(1/m\) 年ごとに、
/// その時点の元利合計の \(r/m\) 倍が利息として元本に組み入れられます。\(mt\) が整数のとき、
/// 値は有理数の積で決まる厳密な値です。
pub fn discrete_compound(s0: f64, r: f64, m: f64, t: f64) -> f64 {
    s0 * (1.0 + r / m).powf(m * t)
}

/// 年 \(m\) 回の複利で、時刻 \(t\) 年までに組み入れが済んだ元利合計 \(S_0\left(1 + \frac{r}{m}\right)^{\lfloor mt \rfloor}\) を返す。
///
/// 利息は期間の終わりにだけ組み入れるので、元利合計は時刻 \(k/m\)（\(k = 1, 2, \ldots\)）で跳ね上がる階段になります。
/// \(\lfloor mt \rfloor\) は \(mt\) 以下の最大の整数で、\(mt\) が整数に \(10^{-9}\) まで近ければその整数とします。
pub fn credited_balance(s0: f64, r: f64, m: f64, t: f64) -> f64 {
    let periods = (m * t + 1e-9).floor().max(0.0);
    s0 * (1.0 + r / m).powf(periods)
}

/// 連続複利の元利合計 \(S(t) = S_0 e^{rt}\) を返す。
///
/// 年 \(m\) 回の複利の \(m \to \infty\) の極限です。対数をとると
/// \[
/// mt\ln\left(1 + \frac{r}{m}\right) = mt\left(\frac{r}{m} - \frac{r^2}{2m^2} + \frac{r^3}{3m^3} - \cdots\right) = rt - \frac{r^2 t}{2m} + O(m^{-2})
/// \]
/// なので、\(S_0(1 + r/m)^{mt} \to S_0 e^{rt}\) です。\(S(t)\) は微分方程式 \(S' = rS\)、\(S(0) = S_0\) の厳密解です。
pub fn continuous_compound(s0: f64, r: f64, t: f64) -> f64 {
    s0 * (r * t).exp()
}

/// 連続複利と年 \(m\) 回の複利の差の主要項 \(S_0 e^{rt}\,\frac{r^2 t}{2m}\) を返す。
///
/// [`continuous_compound`] の展開から \(S_0(1 + r/m)^{mt} = S_0 e^{rt} e^{-r^2 t/(2m) + O(m^{-2})}\)、
/// \(e^{-a} = 1 - a + O(a^2)\) なので
/// \[
/// S_0 e^{rt} - S_0\left(1 + \frac{r}{m}\right)^{mt} = S_0 e^{rt}\,\frac{r^2 t}{2m} + O(m^{-2})
/// \]
/// です。差は \(m\) に反比例して小さくなります。この値は主要項だけをとった近似です。
pub fn compound_gap_leading(s0: f64, r: f64, m: f64, t: f64) -> f64 {
    continuous_compound(s0, r, t) * r * r * t / (2.0 * m)
}

/// 級数を使う範囲と連分数を使う範囲の境目。
const ERF_SPLIT: f64 = 2.0;

/// \(0 \le x < 2\) で、誤差関数を正の項だけの級数で求める。
fn erf_series(x: f64) -> f64 {
    let x2 = x * x;
    let mut term = x;
    let mut sum = x;
    let mut n = 0.0;
    loop {
        n += 1.0;
        term *= 2.0 * x2 / (2.0 * n + 1.0);
        sum += term;
        let ratio = 2.0 * x2 / (2.0 * n + 3.0);
        if ratio <= 0.5 && term <= 1e-17 * sum {
            break;
        }
    }
    2.0 / PI.sqrt() * (-x2).exp() * sum
}

/// \(x \ge 2\) で、相補誤差関数を連分数で求める。
fn erfc_continued_fraction(x: f64) -> f64 {
    // b_0 = x、a_n = n/2、b_n = x の連分数を、修正 Lentz 法で評価する。
    let tiny = 1e-300;
    let mut f = x;
    let mut c = x;
    let mut d = 0.0;
    for n in 1..500 {
        let a = n as f64 / 2.0;
        d = x + a * d;
        if d.abs() < tiny {
            d = tiny;
        }
        c = x + a / c;
        if c.abs() < tiny {
            c = tiny;
        }
        d = 1.0 / d;
        let delta = c * d;
        f *= delta;
        if (delta - 1.0).abs() < 1e-16 {
            break;
        }
    }
    (-x * x).exp() / (PI.sqrt() * f)
}

/// 誤差関数 \(\operatorname{erf}(x) = \frac{2}{\sqrt{\pi}}\int_0^x e^{-s^2}\,ds\) の近似値を返す。
///
/// \(0 \le x < 2\) では、すべての項が正の級数
/// \[
/// \operatorname{erf}(x) = \frac{2}{\sqrt{\pi}}\,e^{-x^2}\sum_{n=0}^{\infty}\frac{2^n x^{2n+1}}{1\cdot 3\cdot 5\cdots(2n+1)}
/// \]
/// を、隣の項の比 \(2x^2/(2n+3)\) が \(1/2\) 以下で、項が和の \(10^{-17}\) 倍以下になったところで打ち切ります。
/// 残りの項の和は等比級数で抑えられ、和の \(2\times10^{-17}\) 倍より小さくなります。
/// \(x \ge 2\) では \(\operatorname{erf}(x) = 1 - \operatorname{erfc}(x)\) とし、\(\operatorname{erfc}\) は [`erfc`] の連分数で求めます。
/// 負の \(x\) には \(\operatorname{erf}(-x) = -\operatorname{erf}(x)\) を使います。
/// 打ち切りによる誤差は丸めより小さく、絶対誤差は \(10^{-15}\) 以下の近似です。
pub fn erf(x: f64) -> f64 {
    if x.is_nan() {
        return f64::NAN;
    }
    let a = x.abs();
    let value = if a < ERF_SPLIT { erf_series(a) } else { 1.0 - erfc_continued_fraction(a) };
    value.copysign(x)
}

/// 相補誤差関数 \(\operatorname{erfc}(x) = 1 - \operatorname{erf}(x) = \frac{2}{\sqrt{\pi}}\int_x^\infty e^{-s^2}\,ds\) の近似値を返す。
///
/// \(x \ge 2\) では、連分数
/// \[
/// \operatorname{erfc}(x) = \frac{e^{-x^2}}{\sqrt{\pi}}\cfrac{1}{x + \cfrac{1/2}{x + \cfrac{1}{x + \cfrac{3/2}{x + \cdots}}}}
/// \]
/// を修正 Lentz 法で、1段あたりの変化が \(10^{-16}\) より小さくなるまで評価します。値が小さくても相対誤差は
/// \(10^{-15}\) 程度に保たれます。\(0 \le x < 2\) では \(1 - \operatorname{erf}(x)\)、負の \(x\) には
/// \(\operatorname{erfc}(-x) = 2 - \operatorname{erfc}(x)\) を使います。
pub fn erfc(x: f64) -> f64 {
    if x.is_nan() {
        return f64::NAN;
    }
    let a = x.abs();
    let value = if a < ERF_SPLIT { 1.0 - erf_series(a) } else { erfc_continued_fraction(a) };
    if x < 0.0 { 2.0 - value } else { value }
}

/// 標準正規分布の累積分布関数 \(N(z) = \int_{-\infty}^{z}\varphi(s)\,ds\) の近似値を返す。
///
/// \(\varphi(s) = \frac{1}{\sqrt{2\pi}}e^{-s^2/2}\) は標準正規分布の密度です。\(s = -\sqrt{2}\,u\) と置換すると
/// \[
/// N(z) = \frac{1}{2}\operatorname{erfc}\left(-\frac{z}{\sqrt{2}}\right)
/// \]
/// です。左の裾で桁が落ちないように、\(z < 0\) では \(\operatorname{erfc}(|z|/\sqrt{2})/2\) を、
/// \(z \ge 0\) では \(1 - \operatorname{erfc}(z/\sqrt{2})/2\) を使います。[`erfc`] の近似により、絶対誤差は \(10^{-15}\) 以下です。
pub fn normal_cdf(z: f64) -> f64 {
    let half = 0.5 * erfc(z.abs() / std::f64::consts::SQRT_2);
    if z < 0.0 { half } else { 1.0 - half }
}

/// 欧州型コールオプションの価格と Greeks。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CallValue {
    /// 価格 \(C\)。
    pub price: f64,
    /// \(\Delta = \partial C/\partial S = N(d_1)\)。
    pub delta: f64,
    /// \(\Gamma = \partial^2 C/\partial S^2 = \varphi(d_1)/(S\sigma\sqrt{\tau})\)。
    pub gamma: f64,
    pub d1: f64,
    pub d2: f64,
}

/// Black–Scholes 公式による欧州型コールオプションの価格 \(C(S, t)\) と、\(\Delta\)、\(\Gamma\) を返す。
///
/// \(S > 0\) は原資産価格、\(K > 0\) は権利行使価格、\(r\) は無リスク金利、\(\sigma > 0\) はボラティリティ、
/// \(\tau = T - t \ge 0\) は満期までの時間です。
/// \[
/// C = S\,N(d_1) - K e^{-r\tau} N(d_2), \qquad
/// d_1 = \frac{\ln(S/K) + (r + \frac{1}{2}\sigma^2)\tau}{\sigma\sqrt{\tau}}, \qquad d_2 = d_1 - \sigma\sqrt{\tau}
/// \]
/// \[
/// \Delta = \frac{\partial C}{\partial S} = N(d_1), \qquad \Gamma = \frac{\partial^2 C}{\partial S^2} = \frac{\varphi(d_1)}{S\sigma\sqrt{\tau}}
/// \]
/// \(\Delta = N(d_1)\) は、恒等式 \(S\varphi(d_1) = K e^{-r\tau}\varphi(d_2)\) により \(d_1\)、\(d_2\) の微分の項が打ち消し合うことから出ます。
/// \(N\) は [`normal_cdf`] の近似で、それを除けば値は厳密です。\(\tau = 0\) では満期の支払い \(\max(S - K, 0)\)、
/// \(\Delta\) は \(S > K\) で 1、\(S < K\) で 0、\(S = K\) で \(1/2\)、\(\Gamma = 0\) を返します。
pub fn black_scholes_call(s: f64, strike: f64, r: f64, sigma: f64, tau: f64) -> CallValue {
    if tau <= 0.0 {
        let delta = if s > strike { 1.0 } else if s < strike { 0.0 } else { 0.5 };
        let d = if s > strike { f64::INFINITY } else { f64::NEG_INFINITY };
        return CallValue { price: call_payoff(s, strike), delta, gamma: 0.0, d1: d, d2: d };
    }
    let root = sigma * tau.sqrt();
    let d1 = ((s / strike).ln() + (r + 0.5 * sigma * sigma) * tau) / root;
    let d2 = d1 - root;
    let n1 = normal_cdf(d1);
    CallValue {
        price: s * n1 - strike * (-r * tau).exp() * normal_cdf(d2),
        delta: n1,
        gamma: standard_normal_density(d1) / (s * root),
        d1,
        d2,
    }
}

/// 満期のコールの支払い \(\max(S - K, 0)\) を返す。
pub fn call_payoff(s: f64, strike: f64) -> f64 {
    (s - strike).max(0.0)
}

/// Black–Scholes 方程式を熱伝導方程式に変える変数変換の定数 \(k\)、\(\alpha\)、\(\beta\)。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct HeatTransform {
    /// \(k = 2r/\sigma^2\)。
    pub k: f64,
    /// \(\alpha = (k - 1)/2 = r/\sigma^2 - 1/2\)。
    pub alpha: f64,
    /// \(\beta = (k + 1)^2/4 = (r/\sigma^2 + 1/2)^2\)。
    pub beta: f64,
}

/// Black–Scholes 方程式を熱伝導方程式 \(u_\tau = u_{xx}\) に変える定数を返す。
///
/// \(x = \ln(S/K)\)、\(\tau = \frac{1}{2}\sigma^2(T - t)\)、\(V(S, t) = K v(x, \tau)\) と置くと、
/// \(k = 2r/\sigma^2\) として \(v_\tau = v_{xx} + (k - 1)v_x - kv\) になります。さらに
/// \[
/// u(x, \tau) = e^{\alpha x + \beta\tau}\,v(x, \tau), \qquad \alpha = \frac{k - 1}{2}, \qquad \beta = \frac{(k + 1)^2}{4}
/// \]
/// と置くと、\(u_\tau = u_{xx} + \left[(k - 1) - 2\alpha\right]u_x + \left[\beta + \alpha^2 - (k - 1)\alpha - k\right]u\) です。
/// この \(\alpha\) で \(u_x\) の係数は 0、\(u\) の係数は \(\beta - (k + 1)^2/4 = 0\) になり、\(u_\tau = u_{xx}\) が残ります。
pub fn heat_transform(r: f64, sigma: f64) -> HeatTransform {
    let k = 2.0 * r / (sigma * sigma);
    HeatTransform { k, alpha: 0.5 * (k - 1.0), beta: 0.25 * (k + 1.0) * (k + 1.0) }
}

impl HeatTransform {
    /// 満期の支払いを移した初期値 \(u(x, 0) = \max\left(e^{(k+1)x/2} - e^{(k-1)x/2}, 0\right)\) を返す。
    ///
    /// \(v(x, 0) = \max(e^x - 1, 0)\) に \(e^{\alpha x}\) を掛けたものです。
    pub fn initial(&self, x: f64) -> f64 {
        (((self.k + 1.0) * 0.5 * x).exp() - ((self.k - 1.0) * 0.5 * x).exp()).max(0.0)
    }

    /// 遠い右端の境界値 \(u(x, \tau) = e^{\alpha x + \beta\tau}\left(e^x - e^{-k\tau}\right)\) を返す。
    ///
    /// \(S\) が \(K\) より十分大きいとき \(C \approx S - K e^{-r(T - t)}\) で、\(r(T - t) = k\tau\) なので
    /// \(v \approx e^x - e^{-k\tau}\) です。左端（\(S\) が十分小さい）では \(u = 0\) とします。
    pub fn right_boundary(&self, x: f64, tau: f64) -> f64 {
        (self.alpha * x + self.beta * tau).exp() * (x.exp() - (-self.k * tau).exp())
    }

    /// 熱伝導方程式の値 \(u\) から、オプション価格 \(V = K e^{-\alpha x - \beta\tau} u\) に戻す。
    pub fn to_price(&self, strike: f64, x: f64, tau: f64, u: f64) -> f64 {
        strike * (-self.alpha * x - self.beta * tau).exp() * u
    }

    /// オプション価格 \(V\) を、熱伝導方程式の値 \(u = e^{\alpha x + \beta\tau} V/K\) に移す。
    pub fn from_price(&self, strike: f64, x: f64, tau: f64, price: f64) -> f64 {
        (self.alpha * x + self.beta * tau).exp() * price / strike
    }
}

/// 熱伝導方程式 \(u_\tau = u_{xx}\) の差分法。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HeatScheme {
    /// 陽解法（FTCS）。
    Explicit,
    /// 陰解法（Crank–Nicolson 法）。
    CrankNicolson,
}

/// 陽解法で \(u_\tau = u_{xx}\) を1ステップ進める。両端の値は `left`、`right` に置きかえる。
///
/// \(\rho = \Delta\tau/\Delta x^2\) とすると、内部の点 \(j\) について
/// \[
/// u_j^{n+1} = u_j^n + \rho\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right)
/// \]
/// です。\(\rho \le 1/2\) のときに限り安定です。
pub fn explicit_heat_step(u: &mut [f64], rho: f64, left: f64, right: f64) {
    let m = u.len();
    if m < 3 {
        return;
    }
    let old = u.to_vec();
    for j in 1..m - 1 {
        u[j] = old[j] + rho * (old[j + 1] - 2.0 * old[j] + old[j - 1]);
    }
    u[0] = left;
    u[m - 1] = right;
}

/// Crank–Nicolson 法で \(u_\tau = u_{xx}\) を1ステップ進める。両端の新しい値は `left`、`right`。
///
/// 2階差分を時刻 \(\tau_n\) と \(\tau_{n+1}\) の平均で置くと、内部の点 \(j\) について三重対角の方程式
/// \[
/// -\frac{\rho}{2}u_{j-1}^{n+1} + (1 + \rho)u_j^{n+1} - \frac{\rho}{2}u_{j+1}^{n+1}
/// = \frac{\rho}{2}u_{j-1}^n + (1 - \rho)u_j^n + \frac{\rho}{2}u_{j+1}^n
/// \]
/// を得ます（\(\rho = \Delta\tau/\Delta x^2\)）。端の点に隣る式では、既知の新しい境界値 \(\frac{\rho}{2}u_0^{n+1}\)、
/// \(\frac{\rho}{2}u_M^{n+1}\) を右辺に移します。方程式は [`solve_tridiagonal`]（Thomas 法）で解きます。
/// どの \(\rho > 0\) でも安定で、誤差は \(O(\Delta\tau^2 + \Delta x^2)\) です。
pub fn crank_nicolson_heat_step(u: &mut [f64], rho: f64, left: f64, right: f64) {
    let m = u.len();
    if m < 3 {
        return;
    }
    let inner = m - 2;
    let half = 0.5 * rho;
    let lower = vec![-half; inner];
    let diag = vec![1.0 + rho; inner];
    let upper = vec![-half; inner];
    let mut rhs: Vec<f64> = (1..m - 1).map(|j| half * u[j - 1] + (1.0 - rho) * u[j] + half * u[j + 1]).collect();
    rhs[0] += half * left;
    rhs[inner - 1] += half * right;
    if let Some(x) = solve_tridiagonal(&lower, &diag, &upper, &rhs) {
        u[1..m - 1].copy_from_slice(&x);
    }
    u[0] = left;
    u[m - 1] = right;
}

/// 変数変換した熱伝導方程式の差分解。`levels[i]` は時刻 \(\tau_n\)（\(n = \) `steps_at[i]`）の格子の値 \(u_j^n\)。
#[derive(Clone, Debug, PartialEq)]
pub struct HeatSolution {
    pub transform: HeatTransform,
    /// 格子の点 \(x_j = -L + j\Delta x\)（\(j = 0, \ldots, M\)）。
    pub x: Vec<f64>,
    pub dtau: f64,
    /// \(\rho = \Delta\tau/\Delta x^2\)。
    pub rho: f64,
    pub steps_at: Vec<usize>,
    pub levels: Vec<Vec<f64>>,
}

/// 欧州型コールの Black–Scholes 方程式を、熱伝導方程式 \(u_\tau = u_{xx}\) に変えて差分法で解く。
///
/// 区間 \(x \in [-L, L]\) を \(M\) 等分（\(\Delta x = 2L/M\)）し、\(\tau \in [0, \tau_{\mathrm{end}}]\) を \(N\) 等分
/// （\(\Delta\tau = \tau_{\mathrm{end}}/N\)）します。初期値は [`HeatTransform::initial`]、左端は \(u = 0\)、
/// 右端は [`HeatTransform::right_boundary`] です。1ステップは [`explicit_heat_step`] か [`crank_nicolson_heat_step`]。
/// 価格に戻すには [`HeatTransform::to_price`] を使います。値は格子による近似です。
/// 格子の値は、ステップ数が `record_every` の倍数の時刻と最後の時刻で記録します。
#[allow(clippy::too_many_arguments)]
pub fn solve_call_heat(
    r: f64,
    sigma: f64,
    half_width: f64,
    cells: usize,
    tau_end: f64,
    steps: usize,
    scheme: HeatScheme,
    record_every: usize,
) -> HeatSolution {
    let transform = heat_transform(r, sigma);
    let dx = 2.0 * half_width / cells as f64;
    let dtau = tau_end / steps as f64;
    let rho = dtau / (dx * dx);
    let x: Vec<f64> = (0..=cells).map(|j| -half_width + j as f64 * dx).collect();
    let mut u: Vec<f64> = x.iter().map(|&xj| transform.initial(xj)).collect();
    u[0] = 0.0;
    u[cells] = transform.right_boundary(half_width, 0.0);
    let record_every = record_every.max(1);
    let mut levels = vec![u.clone()];
    let mut steps_at = vec![0];
    for n in 1..=steps {
        let right = transform.right_boundary(half_width, n as f64 * dtau);
        match scheme {
            HeatScheme::Explicit => explicit_heat_step(&mut u, rho, 0.0, right),
            HeatScheme::CrankNicolson => crank_nicolson_heat_step(&mut u, rho, 0.0, right),
        }
        if n % record_every == 0 || n == steps {
            levels.push(u.clone());
            steps_at.push(n);
        }
    }
    HeatSolution { transform, x, dtau, rho, steps_at, levels }
}

/// 格子の値 \(f_j\) を、点 \(x\) で線形補間する。\(x\) が格子の外なら端の値を返す。
///
/// \(x_j \le x \le x_{j+1}\) のとき \(f(x) \approx f_j + (f_{j+1} - f_j)(x - x_j)/(x_{j+1} - x_j)\) です。
pub fn interpolate(xs: &[f64], fs: &[f64], x: f64) -> f64 {
    if x <= xs[0] {
        return fs[0];
    }
    let last = xs.len() - 1;
    if x >= xs[last] {
        return fs[last];
    }
    let j = xs.partition_point(|&v| v <= x) - 1;
    let w = (x - xs[j]) / (xs[j + 1] - xs[j]);
    fs[j] + w * (fs[j + 1] - fs[j])
}

/// 幾何 Brownian 運動 \(dS = \mu S\,dt + \sigma S\,dW\) を、Euler–Maruyama 法で1ステップ進める。
///
/// \(\mu\) はドリフト率、\(\sigma\) はボラティリティ、\(\Delta t\) は時間刻み、\(Z\) は標準正規分布の標本で、
/// Brownian 運動の増分は \(\Delta W = \sqrt{\Delta t}\,Z\) です。
/// \[
/// S_{n+1} = S_n + \mu S_n\Delta t + \sigma S_n\sqrt{\Delta t}\,Z_n
/// \]
/// 同じ増分による厳密解 [`gbm_exact_step`] との差が、離散化による誤差です。
pub fn gbm_euler_maruyama_step(s: f64, mu: f64, sigma: f64, dt: f64, z: f64) -> f64 {
    s + mu * s * dt + sigma * s * dt.sqrt() * z
}

/// 幾何 Brownian 運動の厳密解を、同じ増分 \(\Delta W = \sqrt{\Delta t}\,Z\) で1ステップ進める。
///
/// Itô の補題により \(d(\ln S) = (\mu - \frac{1}{2}\sigma^2)\,dt + \sigma\,dW\) で、右辺の係数は定数なので
/// \[
/// S_{n+1} = S_n \exp\left(\left(\mu - \tfrac{1}{2}\sigma^2\right)\Delta t + \sigma\sqrt{\Delta t}\,Z_n\right)
/// \]
/// は離散化の誤差を含みません。対数価格 \(X = \ln S\) の更新 \(X_{n+1} = X_n + (\mu - \frac{1}{2}\sigma^2)\Delta t + \sigma\sqrt{\Delta t}\,Z_n\) と同じです。
pub fn gbm_exact_step(s: f64, mu: f64, sigma: f64, dt: f64, z: f64) -> f64 {
    s * ((mu - 0.5 * sigma * sigma) * dt + sigma * dt.sqrt() * z).exp()
}

/// 幾何 Brownian 運動の厳密解 \(S_t = S_0\exp\left((\mu - \frac{1}{2}\sigma^2)t + \sigma W_t\right)\) を返す。
///
/// \(W_t\) は時刻 \(t\) における Brownian 運動の値です。
pub fn gbm_exact(s0: f64, mu: f64, sigma: f64, t: f64, w: f64) -> f64 {
    s0 * ((mu - 0.5 * sigma * sigma) * t + sigma * w).exp()
}

/// 幾何 Brownian 運動の期待値 \(\mathbb{E}(S_t) = S_0 e^{\mu t}\) を返す。
///
/// \(W_t \sim \mathcal{N}(0, t)\) なので \(\mathbb{E}[e^{\sigma W_t}] = e^{\sigma^2 t/2}\) で、
/// \(\mathbb{E}(S_t) = S_0 e^{(\mu - \sigma^2/2)t} e^{\sigma^2 t/2} = S_0 e^{\mu t}\) です。
pub fn gbm_mean(s0: f64, mu: f64, t: f64) -> f64 {
    s0 * (mu * t).exp()
}

/// 対数価格 \(\ln S_t\) の確率密度を返す。\(\ln S_t \sim \mathcal{N}(m, v)\)、\(m = \ln S_0 + (\mu - \frac{1}{2}\sigma^2)t\)、\(v = \sigma^2 t\)。
///
/// \[
/// p(y) = \frac{1}{\sqrt{2\pi v}}\exp\left(-\frac{(y - m)^2}{2v}\right)
/// \]
/// \(t > 0\) とします。
pub fn log_price_density(y: f64, s0: f64, mu: f64, sigma: f64, t: f64) -> f64 {
    let m = s0.ln() + (mu - 0.5 * sigma * sigma) * t;
    let sd = sigma * t.sqrt();
    standard_normal_density((y - m) / sd) / sd
}

/// 価格 \(S_t\) の確率密度（対数正規分布）を返す。\(s > 0\)、\(t > 0\) とします。
///
/// \(\ln S_t\) の密度 [`log_price_density`] を変数変換 \(y = \ln s\)、\(dy = ds/s\) で移して
/// \[
/// p_S(s) = \frac{1}{s}\,p_{\ln S}(\ln s)
/// \]
/// です。リスク中立の終端価格では \(\mu\) を \(r\) に置きかえます。
pub fn price_density(s: f64, s0: f64, mu: f64, sigma: f64, t: f64) -> f64 {
    if s <= 0.0 {
        return 0.0;
    }
    log_price_density(s.ln(), s0, mu, sigma, t) / s
}

/// リスク中立測度のもとでの満期の価格 \(S_T = S_0\exp\left((r - \frac{1}{2}\sigma^2)T + \sigma\sqrt{T}\,Z\right)\) を返す。
///
/// \(Z\) は標準正規分布の標本です。期待値は \(\mathbb{E}^{\mathbb{Q}}(S_T) = S_0 e^{rT}\) です。
pub fn risk_neutral_terminal(s0: f64, r: f64, sigma: f64, maturity: f64, z: f64) -> f64 {
    gbm_exact(s0, r, sigma, maturity, maturity.sqrt() * z)
}

/// リスク中立測度のもとでの支払いの2乗の期待値 \(\mathbb{E}^{\mathbb{Q}}[\max(S_T - K, 0)^2]\) を返す。
///
/// \(\mathbb{E}[S_T^2\mathbb{I}] = S_0^2 e^{(2r + \sigma^2)T}N(d_1 + \sigma\sqrt{T})\)、
/// \(\mathbb{E}[S_T\mathbb{I}] = S_0 e^{rT}N(d_1)\)、\(\mathbb{E}[\mathbb{I}] = N(d_2)\)（\(\mathbb{I}\) は \(S_T > K\) の指示関数）から
/// \[
/// \mathbb{E}[(S_T - K)^2\mathbb{I}] = S_0^2 e^{(2r + \sigma^2)T}N(d_1 + \sigma\sqrt{T}) - 2KS_0e^{rT}N(d_1) + K^2N(d_2)
/// \]
/// です。割り引いた支払いの標準偏差 \(e^{-rT}\sqrt{\mathbb{E}[Y^2] - (e^{rT}C)^2}\) を求めるのに使います。
pub fn call_payoff_second_moment(s0: f64, strike: f64, r: f64, sigma: f64, maturity: f64) -> f64 {
    let v = black_scholes_call(s0, strike, r, sigma, maturity);
    let root = sigma * maturity.sqrt();
    s0 * s0 * ((2.0 * r + sigma * sigma) * maturity).exp() * normal_cdf(v.d1 + root)
        - 2.0 * strike * s0 * (r * maturity).exp() * v.delta
        + strike * strike * normal_cdf(v.d2)
}

/// 割り引いた支払い \(e^{-rT}\max(S_T - K, 0)\) の母標準偏差を返す。
///
/// [`call_payoff_second_moment`] と Black–Scholes の価格 \(C\) から
/// \(\sigma_Y = e^{-rT}\sqrt{\mathbb{E}[\max(S_T - K, 0)^2] - (e^{rT}C)^2}\) です。
/// Monte Carlo 推定量の標準偏差は \(\sigma_Y/\sqrt{M}\) です。
pub fn discounted_payoff_sd(s0: f64, strike: f64, r: f64, sigma: f64, maturity: f64) -> f64 {
    let c = black_scholes_call(s0, strike, r, sigma, maturity).price;
    let forward = (r * maturity).exp() * c;
    let var = call_payoff_second_moment(s0, strike, r, sigma, maturity) - forward * forward;
    (-r * maturity).exp() * var.max(0.0).sqrt()
}

/// Monte Carlo 法によるコールの価格の推定値と標準誤差。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PriceEstimate {
    /// \(\hat{C}_M = \frac{1}{M}\sum_i Y_i\)。
    pub estimate: f64,
    /// \(\mathrm{SE} = s_Y/\sqrt{M}\)。
    pub standard_error: f64,
}

/// 割り引いた支払いの標本 \(Y_i = e^{-rT}\max(S_T^{(i)} - K, 0)\) の平均と標準誤差を返す。
///
/// \(M\) を標本数、\(\bar{Y}\) を標本平均、\(s_Y^2 = \frac{1}{M - 1}\sum_i (Y_i - \bar{Y})^2\) を不偏分散とすると
/// \[
/// \hat{C}_M = \bar{Y} = e^{-rT}\frac{1}{M}\sum_{i=1}^{M}\max(S_T^{(i)} - K, 0), \qquad \mathrm{SE} = \frac{s_Y}{\sqrt{M}}
/// \]
/// です。`count` は \(M\)、`mean` は \(\bar{Y}\)、`m2` は偏差平方和 \(\sum_i (Y_i - \bar{Y})^2\) です。
/// 擬似乱数の標本から作るので、どちらも近似です。
pub fn price_estimate(count: u64, mean: f64, m2: f64) -> PriceEstimate {
    let m = count as f64;
    let standard_error = if count > 1 { (m2 / (m - 1.0)).sqrt() / m.sqrt() } else { 0.0 };
    PriceEstimate { estimate: mean, standard_error }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compounding_matches_the_hand_example() {
        assert!((discrete_compound(100.0, 0.05, 1.0, 1.0) - 105.0).abs() < 1e-12);
        assert!((discrete_compound(100.0, 0.05, 12.0, 1.0) - 105.116_189_788_173_3).abs() < 1e-9);
        assert!((discrete_compound(100.0, 0.05, 365.0, 1.0) - 105.126_749_646_744_7).abs() < 1e-9);
        assert!((continuous_compound(100.0, 0.05, 1.0) - 105.127_109_637_602_4).abs() < 1e-9);
        assert!((credited_balance(100.0, 0.05, 12.0, 0.99) - 100.0 * (1.0 + 0.05 / 12.0f64).powi(11)).abs() < 1e-12);
        assert_eq!(credited_balance(100.0, 0.05, 1.0, 1.0), 105.0);
        let gap = continuous_compound(100.0, 0.05, 10.0) - discrete_compound(100.0, 0.05, 365.0, 10.0);
        let lead = compound_gap_leading(100.0, 0.05, 365.0, 10.0);
        assert!((gap - lead).abs() / gap < 1e-3);
    }

    #[test]
    fn erf_matches_tabulated_values() {
        let cases = [
            (0.5, 0.520_499_877_813_046_5),
            (1.0, 0.842_700_792_949_714_9),
            (1.9, 0.992_790_429_235_257_5),
        ];
        for (x, want) in cases {
            assert!((erf(x) - want).abs() < 1e-15, "erf({x})");
            assert!((erf(-x) + want).abs() < 1e-15);
        }
        assert!((erfc(2.0) / 0.004_677_734_981_047_265_8 - 1.0).abs() < 1e-14);
        assert!((erfc(3.0) / 2.209_049_699_858_544e-5 - 1.0).abs() < 1e-14);
        assert!((erfc(5.0) / 1.537_459_794_428_035e-12 - 1.0).abs() < 1e-14);
        assert!((erf(2.5) - (1.0 - erfc(2.5))).abs() < 1e-16);
        assert!((erfc(-1.0) - 1.842_700_792_949_715).abs() < 1e-15);
        assert_eq!(erf(0.0), 0.0);
    }

    #[test]
    fn normal_cdf_matches_tabulated_values() {
        assert!((normal_cdf(0.0) - 0.5).abs() < 1e-16);
        assert!((normal_cdf(0.35) - 0.636_830_651_175_619_1).abs() < 1e-15);
        assert!((normal_cdf(0.15) - 0.559_617_692_370_242_5).abs() < 1e-15);
        assert!((normal_cdf(1.96) - 0.975_002_104_851_779_5).abs() < 1e-15);
        assert!((normal_cdf(-3.0) / 0.001_349_898_031_630_095_6 - 1.0).abs() < 1e-13);
        let mut last = 0.0;
        for i in -80..=80 {
            let p = normal_cdf(i as f64 * 0.1);
            assert!(p >= last);
            last = p;
        }
    }

    #[test]
    fn black_scholes_matches_the_hand_example() {
        let v = black_scholes_call(100.0, 100.0, 0.05, 0.2, 1.0);
        assert!((v.d1 - 0.35).abs() < 1e-15);
        assert!((v.d2 - 0.15).abs() < 1e-15);
        assert!((v.price - 10.450_583_572_185_565).abs() < 1e-12);
        assert!((v.delta - 0.636_830_651_175_619_1).abs() < 1e-15);
        assert!((v.gamma - 0.018_762_017_345_846_895).abs() < 1e-15);
        let h = 1e-3;
        let up = black_scholes_call(100.0 + h, 100.0, 0.05, 0.2, 1.0).price;
        let down = black_scholes_call(100.0 - h, 100.0, 0.05, 0.2, 1.0).price;
        assert!(((up - down) / (2.0 * h) - v.delta).abs() < 1e-8);
        assert!(((up - 2.0 * v.price + down) / (h * h) - v.gamma).abs() < 1e-5);
        let expired = black_scholes_call(120.0, 100.0, 0.05, 0.2, 0.0);
        assert_eq!(expired.price, 20.0);
        assert_eq!(expired.delta, 1.0);
    }

    #[test]
    fn heat_transform_constants_and_round_trip() {
        let t = heat_transform(0.05, 0.2);
        assert!((t.k - 2.5).abs() < 1e-15);
        assert!((t.alpha - 0.75).abs() < 1e-15);
        assert!((t.beta - 3.0625).abs() < 1e-15);
        let (x, tau) = (0.1f64, 0.01);
        let s = 100.0 * x.exp();
        let price = black_scholes_call(s, 100.0, 0.05, 0.2, 2.0 * tau / 0.04).price;
        let u = t.from_price(100.0, x, tau, price);
        assert!((t.to_price(100.0, x, tau, u) - price).abs() < 1e-12);
        assert!((t.initial(0.5) - t.from_price(100.0, 0.5, 0.0, call_payoff(100.0 * 0.5f64.exp(), 100.0))).abs() < 1e-12);
    }

    #[test]
    fn both_schemes_approach_the_formula() {
        let t = heat_transform(0.05, 0.2);
        for scheme in [HeatScheme::Explicit, HeatScheme::CrankNicolson] {
            let sol = solve_call_heat(0.05, 0.2, 2.0, 400, 0.02, 800, scheme, 200);
            assert!((sol.rho - 0.25).abs() < 1e-12);
            assert_eq!(sol.steps_at, [0, 200, 400, 600, 800]);
            let mid = 200;
            assert!(sol.x[mid].abs() < 1e-12);
            let price = t.to_price(100.0, 0.0, 0.02, sol.levels[4][mid]);
            assert!((price - 10.450_583_572_185_565).abs() < 3e-3, "{scheme:?} {price}");
        }
        let unstable = solve_call_heat(0.05, 0.2, 2.0, 200, 0.02, 40, HeatScheme::Explicit, 40);
        assert!(unstable.rho > 0.5);
        let cn = solve_call_heat(0.05, 0.2, 2.0, 200, 0.02, 40, HeatScheme::CrankNicolson, 40);
        let price = t.to_price(100.0, 0.0, 0.02, cn.levels[1][100]);
        assert!((price - 10.450_583_572_185_565).abs() < 2e-2);
    }

    #[test]
    fn interpolation_is_linear_between_nodes() {
        let xs = [0.0, 1.0, 2.0];
        let fs = [0.0, 10.0, 30.0];
        assert_eq!(interpolate(&xs, &fs, 0.5), 5.0);
        assert_eq!(interpolate(&xs, &fs, 1.5), 20.0);
        assert_eq!(interpolate(&xs, &fs, 3.0), 30.0);
    }

    #[test]
    fn one_gbm_step_matches_the_hand_example() {
        let em = gbm_euler_maruyama_step(100.0, 0.08, 0.3, 0.01, 0.5);
        let exact = gbm_exact_step(100.0, 0.08, 0.3, 0.01, 0.5);
        assert!((em - 101.58).abs() < 1e-12);
        assert!((exact - 101.546_841_637_126_42).abs() < 1e-10);
        assert!((gbm_mean(100.0, 0.08, 1.0) - 108.328_706_767_495_86).abs() < 1e-10);
        assert!((gbm_exact(100.0, 0.08, 0.3, 0.01, 0.05) - exact).abs() < 1e-12);
    }

    #[test]
    fn densities_integrate_to_one() {
        let (s0, mu, sigma, t) = (100.0, 0.05, 0.2, 1.0);
        let n = 20000;
        let (a, b) = (1.0, 400.0);
        let h = (b - a) / n as f64;
        let mut total = 0.0;
        let mut first = 0.0;
        for i in 0..n {
            let s = a + (i as f64 + 0.5) * h;
            let p = price_density(s, s0, mu, sigma, t);
            total += p * h;
            first += s * p * h;
        }
        assert!((total - 1.0).abs() < 1e-6);
        assert!((first - 100.0 * 0.05f64.exp()).abs() < 1e-3);
    }

    #[test]
    fn four_sample_estimate_and_payoff_moments() {
        let zs = [-1.0, 0.0, 0.5, 1.0];
        let payoffs: Vec<f64> = zs.iter().map(|&z| call_payoff(risk_neutral_terminal(100.0, 0.05, 0.2, 1.0, z), 100.0)).collect();
        assert_eq!(payoffs[0], 0.0);
        assert!((payoffs[3] - 25.860_000_992_947_79).abs() < 1e-10);
        let discount = (-0.05f64).exp();
        let ys: Vec<f64> = payoffs.iter().map(|p| discount * p).collect();
        let mean = ys.iter().sum::<f64>() / 4.0;
        let m2: f64 = ys.iter().map(|y| (y - mean) * (y - mean)).sum();
        let e = price_estimate(4, mean, m2);
        assert!((e.estimate - 10.175_370_765_034_55).abs() < 1e-10);
        assert!(e.standard_error > 0.0);
        let sd = discounted_payoff_sd(100.0, 100.0, 0.05, 0.2, 1.0);
        assert!(sd > 10.0 && sd < 20.0, "{sd}");
    }
}
