//! 統計学の単元の式と計算。擬似乱数、標本平均と不偏分散、ヒストグラム、線形回帰、2変量の共分散と主成分、
//! Monte Carlo 法による円周率の推定。各関数の rustdoc に式を書く。
//!
//! 擬似乱数は種（seed）から決まる決定的な数列であり、同じ種からは同じ標本が出る。
//! 擬似乱数から作った推定値は、どれも真の値の近似である。

use std::f64::consts::PI;

/// SplitMix64 による擬似乱数の生成器。
///
/// 状態は 64 ビットの整数 \(s\) です。1回の呼び出しで状態を定数 \(\gamma = \mathtt{0x9E3779B97F4A7C15}\) だけ進め、
/// その値をビットの混ぜ合わせ \(f\) に通して出力 \(z\) を作ります。演算はすべて \(2^{64}\) を法とします。
/// \[
/// s_{k+1} = s_k + \gamma \pmod{2^{64}}, \qquad z_{k+1} = f(s_{k+1})
/// \]
/// \[
/// f(s):\quad z \leftarrow (s \oplus (s \gg 30)) \cdot \mathtt{0xBF58476D1CE4E5B9},\quad
/// z \leftarrow (z \oplus (z \gg 27)) \cdot \mathtt{0x94D049BB133111EB},\quad
/// z \leftarrow z \oplus (z \gg 31)
/// \]
/// \(\oplus\) は排他的論理和、\(\gg\) は右シフトです。初期状態は種 \(s_0\) そのものです。
/// 同じ種からは常に同じ数列が出るので、画面の標本は再現できます。出力は乱数ではなく、
/// 統計的な検定で乱数と区別しにくい決定的な数列（擬似乱数）です。
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Rng {
    state: u64,
}

impl Rng {
    /// 種 `seed` を初期状態 \(s_0\) とする生成器を作る。
    pub fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    /// 次の 64 ビットの整数 \(z_{k+1} = f(s_{k+1})\) を返す。式は [`Rng`] にある。
    pub fn next_u64(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    /// 区間 \([0, 1)\) の一様な擬似乱数 \(U\) を返す。
    ///
    /// 64 ビットの出力 \(z\) の上位 53 ビットを整数 \(m = \lfloor z / 2^{11} \rfloor\) とし、
    /// \[
    /// U = m \cdot 2^{-53}, \qquad m \in \{0, 1, \ldots, 2^{53} - 1\}
    /// \]
    /// とします。\(U\) は \(2^{-53}\) 刻みの \(2^{53}\) 個の値を等しい頻度でとり、\(1\) にはなりません。
    pub fn uniform(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 * (1.0 / (1u64 << 53) as f64)
    }

    /// Box–Muller 法で、独立な二つの標準正規分布 \(\mathcal{N}(0, 1)\) の擬似乱数 \((Z_0, Z_1)\) を返す。
    ///
    /// 二つの一様な擬似乱数 \(U_1, U_2\) を [`Rng::uniform`] で作り、\(1 - U_1 \in (0, 1]\) を使って
    /// \[
    /// R = \sqrt{-2\ln(1 - U_1)}, \qquad Z_0 = R\cos(2\pi U_2), \qquad Z_1 = R\sin(2\pi U_2)
    /// \]
    /// とします。\(U_1, U_2\) が独立に \([0, 1)\) 上一様なら、極座標の変数変換により \(Z_0, Z_1\) は独立に
    /// 標準正規分布に従います（\(R^2\) は平均 2 の指数分布、偏角 \(2\pi U_2\) は一様です）。
    pub fn standard_normal_pair(&mut self) -> (f64, f64) {
        let u1 = self.uniform();
        let u2 = self.uniform();
        let r = (-2.0 * (1.0 - u1).ln()).sqrt();
        let angle = 2.0 * PI * u2;
        (r * angle.cos(), r * angle.sin())
    }

    /// 標準正規分布 \(\mathcal{N}(0, 1)\) の擬似乱数を一つ返す。
    ///
    /// [`Rng::standard_normal_pair`] の \(Z_0 = \sqrt{-2\ln(1 - U_1)}\cos(2\pi U_2)\) です。
    /// 1回の呼び出しで一様な擬似乱数を二つ使い、\(Z_1\) は捨てます。
    pub fn standard_normal(&mut self) -> f64 {
        self.standard_normal_pair().0
    }

    /// 率 \(\lambda > 0\) の指数分布の擬似乱数 \(X\) を、逆関数法で返す。
    ///
    /// 指数分布の分布関数 \(F(x) = 1 - e^{-\lambda x}\)（\(x \ge 0\)）の逆関数に一様な \(U\) を代入して
    /// \[
    /// X = F^{-1}(U) = -\frac{\ln(1 - U)}{\lambda}
    /// \]
    /// とします。\(P(X \le x) = P(U \le F(x)) = F(x)\) なので、\(X\) の平均は \(1/\lambda\)、分散は \(1/\lambda^2\) です。
    pub fn exponential(&mut self, rate: f64) -> f64 {
        -(1.0 - self.uniform()).ln() / rate
    }
}

/// 標本平均 \(\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i\) を返す。
///
/// \(n\) は標本の大きさ、\(x_1, \ldots, x_n\) は標本値です。空の標本では NaN です。
pub fn mean(xs: &[f64]) -> f64 {
    xs.iter().sum::<f64>() / xs.len() as f64
}

/// 二パスの公式による不偏標本分散 \(s^2\) を返す。
///
/// 1回目に標本平均 \(\bar{x}\) を求め、2回目に偏差 \(x_i - \bar{x}\) の2乗を足して \(n - 1\) で割ります。
/// \[
/// s^2 = \frac{1}{n - 1}\sum_{i=1}^{n} (x_i - \bar{x})^2
/// \]
/// \(n - 1\) で割ると、i.i.d. の標本では \(\mathbb{E}[s^2] = \sigma^2\)（\(\sigma^2\) は母分散）になります。
/// 標本の大きさ \(n\) が 2 未満なら NaN です。
pub fn variance_two_pass(xs: &[f64]) -> f64 {
    if xs.len() < 2 {
        return f64::NAN;
    }
    let m = mean(xs);
    xs.iter().map(|x| (x - m) * (x - m)).sum::<f64>() / (xs.len() - 1) as f64
}

/// Welford の逐次更新による標本平均と偏差平方和。
///
/// \(k\) 個目の標本 \(x_k\) を読むたびに、平均 \(\bar{x}_k\) と偏差平方和 \(M_k = \sum_{i=1}^{k}(x_i - \bar{x}_k)^2\) を
/// \[
/// \delta_k = x_k - \bar{x}_{k-1}, \qquad \bar{x}_k = \bar{x}_{k-1} + \frac{\delta_k}{k}, \qquad
/// M_k = M_{k-1} + \delta_k\,(x_k - \bar{x}_k)
/// \]
/// で更新します（\(\bar{x}_0 = 0\)、\(M_0 = 0\)）。不偏分散は \(s^2 = M_n/(n - 1)\) です。
/// 標本を一度だけ読み、保存しておく必要がありません。
/// 偏差平方和の更新は、\(M_k - M_{k-1} = (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)\) という恒等式から出ます。
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Welford {
    count: u64,
    mean: f64,
    m2: f64,
}

impl Welford {
    /// 標本のない状態 \(k = 0\)、\(\bar{x}_0 = 0\)、\(M_0 = 0\)。
    pub fn new() -> Self {
        Self::default()
    }

    /// 標本 \(x_k\) を一つ読み、\(\delta_k\)、\(\bar{x}_k\)、\(M_k\) に更新する。返す値は \(\delta_k = x_k - \bar{x}_{k-1}\)。
    pub fn push(&mut self, x: f64) -> f64 {
        self.count += 1;
        let delta = x - self.mean;
        self.mean += delta / self.count as f64;
        self.m2 += delta * (x - self.mean);
        delta
    }

    /// 読んだ標本の数 \(k\)。
    pub fn count(&self) -> u64 {
        self.count
    }

    /// 平均 \(\bar{x}_k\)。
    pub fn mean(&self) -> f64 {
        self.mean
    }

    /// 偏差平方和 \(M_k\)。
    pub fn m2(&self) -> f64 {
        self.m2
    }

    /// 不偏分散 \(s^2 = M_k/(k - 1)\)。\(k < 2\) なら `None`。
    pub fn variance(&self) -> Option<f64> {
        (self.count >= 2).then(|| self.m2 / (self.count - 1) as f64)
    }
}

/// Welford の逐次更新（[`Welford`]）による不偏標本分散 \(s^2 = M_n/(n - 1)\) を返す。\(n < 2\) なら NaN。
pub fn variance_welford(xs: &[f64]) -> f64 {
    let mut w = Welford::new();
    for &x in xs {
        w.push(x);
    }
    w.variance().unwrap_or(f64::NAN)
}

/// 先頭から \(k\) 個の標本平均 \(\bar{x}_k = \frac{1}{k}\sum_{i=1}^{k} x_i\)（\(k = 1, \ldots, n\)）を並べて返す。
///
/// 大数の法則は、\(k \to \infty\) でこの列が母平均 \(\mu\) に確率収束することを述べます。
/// 更新は \(\bar{x}_k = \bar{x}_{k-1} + (x_k - \bar{x}_{k-1})/k\) です。
pub fn running_means(xs: &[f64]) -> Vec<f64> {
    let mut w = Welford::new();
    xs.iter().map(|&x| {
        w.push(x);
        w.mean()
    }).collect()
}

/// 区間 \([a, b)\) を幅 \(h = (b - a)/m\) の \(m\) 個の区間に分け、各区間に入る標本の数を返す。
///
/// 標本 \(x\) は番号 \(j = \lfloor (x - a)/h \rfloor\) の区間 \([a + jh, a + (j + 1)h)\) に数えます。
/// \(x = b\) は最後の区間に入れ、\([a, b]\) の外の標本は数えません。
/// 区間 \(j\) の度数を \(c_j\)、標本の総数を \(N\) とすると、確率密度の推定は \(c_j/(N h)\) です。
pub fn histogram(xs: &[f64], lo: f64, hi: f64, bins: usize) -> Vec<usize> {
    let mut counts = vec![0; bins];
    let width = (hi - lo) / bins as f64;
    for &x in xs {
        if !(lo..=hi).contains(&x) {
            continue;
        }
        let j = (((x - lo) / width) as usize).min(bins - 1);
        counts[j] += 1;
    }
    counts
}

/// 標準正規分布 \(\mathcal{N}(0, 1)\) の確率密度 \(\varphi(z) = \frac{1}{\sqrt{2\pi}} e^{-z^2/2}\) を返す。
pub fn standard_normal_density(z: f64) -> f64 {
    (-0.5 * z * z).exp() / (2.0 * PI).sqrt()
}

/// 標準正規分布の確率 \(P(a \le Z \le b) = \int_a^b \varphi(z)\,dz\) を、複合 Simpson 則で近似して返す。
///
/// 区間を \(2m\) 等分（\(m = 1000\)、幅 \(h = (b - a)/(2m)\)）し、
/// \[
/// \int_a^b \varphi\,dz \approx \frac{h}{3}\left[\varphi(z_0) + 4\sum_{j\,\text{odd}}\varphi(z_j) + 2\sum_{j\,\text{even}}\varphi(z_j) + \varphi(z_{2m})\right]
/// \]
/// とします。\(|b - a| \le 10\) なら、誤差は \(10^{-12}\) より小さい近似です。
pub fn standard_normal_probability(a: f64, b: f64) -> f64 {
    let m = 1000;
    let h = (b - a) / (2 * m) as f64;
    let mut sum = standard_normal_density(a) + standard_normal_density(b);
    for j in 1..2 * m {
        let weight = if j % 2 == 1 { 4.0 } else { 2.0 };
        sum += weight * standard_normal_density(a + j as f64 * h);
    }
    sum * h / 3.0
}

/// 標本平均についての Chebyshev の不等式の右辺 \(\frac{\sigma^2}{n\varepsilon^2}\) を返す。
///
/// 平均 \(\mu\)、分散 \(\sigma^2\) の i.i.d. 標本の平均 \(\bar{x}_n\) は \(\mathrm{Var}(\bar{x}_n) = \sigma^2/n\) なので、
/// \[
/// P(|\bar{x}_n - \mu| \ge \varepsilon) \le \frac{\mathrm{Var}(\bar{x}_n)}{\varepsilon^2} = \frac{\sigma^2}{n\varepsilon^2}
/// \]
/// です。右辺は \(n \to \infty\) で 0 に近づき、大数の弱法則を与えます。
pub fn chebyshev_bound(variance: f64, n: f64, epsilon: f64) -> f64 {
    variance / (n * epsilon * epsilon)
}

/// 標本平均の標準誤差 \(\mathrm{SE} = s/\sqrt{N}\) を返す。
///
/// \(s\) は標本標準偏差、\(N\) は標本の大きさです。\(\mathrm{Var}(\bar{x}_N) = \sigma^2/N\) の平方根 \(\sigma/\sqrt{N}\) を、
/// \(\sigma\) の代わりに \(s\) で推定した値です。
pub fn standard_error(sd: f64, n: f64) -> f64 {
    sd / n.sqrt()
}

/// 単回帰 \(y = \beta_0 + \beta_1 x\) の最小二乗の係数と、残差平方和、決定係数。
#[derive(Clone, Debug, PartialEq)]
pub struct LinearFit {
    /// 切片 \(\hat{\beta}_0\)。
    pub intercept: f64,
    /// 傾き \(\hat{\beta}_1\)。
    pub slope: f64,
    /// \(\bar{x}\)。
    pub mean_x: f64,
    /// \(\bar{y}\)。
    pub mean_y: f64,
    /// \(S_{xx} = \sum (x_i - \bar{x})^2\)。
    pub sxx: f64,
    /// \(S_{xy} = \sum (x_i - \bar{x})(y_i - \bar{y})\)。
    pub sxy: f64,
    /// 全平方和 \(S_{yy} = \sum (y_i - \bar{y})^2\)。
    pub syy: f64,
    /// 予測値 \(\hat{y}_i = \hat{\beta}_0 + \hat{\beta}_1 x_i\)。
    pub fitted: Vec<f64>,
    /// 残差 \(e_i = y_i - \hat{y}_i\)。
    pub residuals: Vec<f64>,
    /// 残差平方和 \(\sum e_i^2\)。
    pub rss: f64,
    /// 回帰平方和 \(\sum (\hat{y}_i - \bar{y})^2\)。
    pub ess: f64,
    /// 決定係数 \(R^2 = 1 - \sum e_i^2 / S_{yy}\)。
    pub r_squared: f64,
}

/// 2変量の標本 \((x_i, y_i)\)（\(i = 1, \ldots, n\)）に、残差平方和を最小にする直線を当てはめる。
///
/// 残差平方和 \(Q(\beta_0, \beta_1) = \sum_{i=1}^{n} (y_i - \beta_0 - \beta_1 x_i)^2\) を各係数で偏微分して 0 と置くと、
/// \[
/// \hat{\beta}_1 = \frac{S_{xy}}{S_{xx}} = \frac{\sum_{i}(x_i - \bar{x})(y_i - \bar{y})}{\sum_{i}(x_i - \bar{x})^2}, \qquad
/// \hat{\beta}_0 = \bar{y} - \hat{\beta}_1\bar{x}
/// \]
/// です。予測値を \(\hat{y}_i = \hat{\beta}_0 + \hat{\beta}_1 x_i\)、残差を \(e_i = y_i - \hat{y}_i\) とし、
/// \[
/// R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}
/// \]
/// を決定係数と呼びます。\(x_i\) がすべて等しいと \(S_{xx} = 0\) で、傾きは決まりません（NaN）。
pub fn linear_regression(xs: &[f64], ys: &[f64]) -> LinearFit {
    assert_eq!(xs.len(), ys.len(), "x and y must have the same length");
    let mean_x = mean(xs);
    let mean_y = mean(ys);
    let sxx: f64 = xs.iter().map(|x| (x - mean_x) * (x - mean_x)).sum();
    let syy: f64 = ys.iter().map(|y| (y - mean_y) * (y - mean_y)).sum();
    let sxy: f64 = xs.iter().zip(ys).map(|(x, y)| (x - mean_x) * (y - mean_y)).sum();
    let slope = sxy / sxx;
    let intercept = mean_y - slope * mean_x;
    let fitted: Vec<f64> = xs.iter().map(|x| intercept + slope * x).collect();
    let residuals: Vec<f64> = ys.iter().zip(&fitted).map(|(y, f)| y - f).collect();
    let rss = residuals.iter().map(|e| e * e).sum();
    let ess = fitted.iter().map(|f| (f - mean_y) * (f - mean_y)).sum();
    LinearFit {
        intercept,
        slope,
        mean_x,
        mean_y,
        sxx,
        sxy,
        syy,
        r_squared: 1.0 - rss / syy,
        fitted,
        residuals,
        rss,
        ess,
    }
}

/// 2変量の標本の不偏共分散行列 \(\Sigma = \begin{pmatrix} a & b \\ b & c \end{pmatrix}\) の成分 \([a, b, c]\) を返す。
///
/// 各変数の平均を引いた中心化標本行列 \(X\)（第 \(i\) 行は \((x_i - \bar{x},\ y_i - \bar{y})\)）から
/// \[
/// \Sigma = \frac{1}{n - 1} X^T X, \qquad
/// a = \frac{\sum_i (x_i - \bar{x})^2}{n - 1}, \quad
/// b = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{n - 1}, \quad
/// c = \frac{\sum_i (y_i - \bar{y})^2}{n - 1}
/// \]
/// です。\(a\)、\(c\) は各変数の不偏分散、\(b\) は不偏共分散です。
pub fn covariance_2x2(xs: &[f64], ys: &[f64]) -> [f64; 3] {
    assert_eq!(xs.len(), ys.len(), "x and y must have the same length");
    let (mx, my) = (mean(xs), mean(ys));
    let d = (xs.len() - 1) as f64;
    let a = xs.iter().map(|x| (x - mx) * (x - mx)).sum::<f64>() / d;
    let b = xs.iter().zip(ys).map(|(x, y)| (x - mx) * (y - my)).sum::<f64>() / d;
    let c = ys.iter().map(|y| (y - my) * (y - my)).sum::<f64>() / d;
    [a, b, c]
}

/// 2次の実対称行列の固有値と、長さ 1 の固有ベクトル。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SymmetricEigen2 {
    /// \(\lambda_1 \ge \lambda_2\)。
    pub values: [f64; 2],
    /// \(\mathbf{v}_1\)、\(\mathbf{v}_2\)。\(\mathbf{v}_2\) は \(\mathbf{v}_1\) を反時計回りに \(90^\circ\) 回したもの。
    pub vectors: [[f64; 2]; 2],
}

/// 実対称行列 \(\Sigma = \begin{pmatrix} a & b \\ b & c \end{pmatrix}\) の固有値と固有ベクトルを、閉じた式で返す。
///
/// 特性方程式 \(\det(\Sigma - \lambda I) = \lambda^2 - (a + c)\lambda + (ac - b^2) = 0\) を解の公式で解くと
/// \[
/// \lambda_{1,2} = \frac{a + c}{2} \pm \sqrt{\left(\frac{a - c}{2}\right)^2 + b^2}
/// \]
/// です。根号の中は 0 以上なので、固有値は実数です。\(b \ne 0\) のとき、\((\Sigma - \lambda_1 I)\mathbf{v} = \mathbf{0}\) の第1行
/// \((a - \lambda_1)v_x + b v_y = 0\) から \(\mathbf{v}_1 \propto (b,\ \lambda_1 - a)\) で、これを長さ 1 にします。
/// \(b = 0\) なら行列は対角で、固有ベクトルは座標軸の向きです。
/// \(\mathbf{v}_1\) の向きは \(x\) 成分が正（\(x\) 成分が 0 なら \(y\) 成分が正）になるように選び、
/// \(\mathbf{v}_2 = (-v_{1y},\ v_{1x})\) とします。対称行列の異なる固有値の固有ベクトルは直交します。
pub fn symmetric_eigen_2x2(a: f64, b: f64, c: f64) -> SymmetricEigen2 {
    let half = 0.5 * (a + c);
    let radius = (0.25 * (a - c) * (a - c) + b * b).sqrt();
    let (l1, l2) = (half + radius, half - radius);
    let mut v = if b != 0.0 {
        let (x, y) = (b, l1 - a);
        let n = x.hypot(y);
        [x / n, y / n]
    } else if a >= c {
        [1.0, 0.0]
    } else {
        [0.0, 1.0]
    };
    if v[0] < 0.0 || (v[0] == 0.0 && v[1] < 0.0) {
        v = [-v[0], -v[1]];
    }
    SymmetricEigen2 { values: [l1, l2], vectors: [v, [-v[1], v[0]]] }
}

/// 円周率の Monte Carlo 推定の結果。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PiEstimate {
    /// 標本点の数 \(N\)。
    pub samples: u64,
    /// 四分円の内側の点の数 \(N_{\mathrm{in}}\)。
    pub inside: u64,
    /// 推定値 \(\hat{\pi}_N = 4N_{\mathrm{in}}/N\)。
    pub estimate: f64,
    /// 標準誤差 \(\mathrm{SE} = s_g/\sqrt{N}\)。
    pub standard_error: f64,
}

/// 点の数から、円周率の推定値 \(\hat{\pi}_N\) と標準誤差 \(\mathrm{SE}\) を返す。
///
/// 単位正方形 \([0, 1)^2\) の一様な点 \((x_i, y_i)\) に \(g_i = 4\,\mathbb{I}(x_i^2 + y_i^2 \le 1)\) を対応させます
/// （\(\mathbb{I}\) は条件が成り立てば 1、成り立たなければ 0）。四分円の面積は \(\pi/4\) なので \(\mathbb{E}[g] = \pi\) で、
/// \[
/// \hat{\pi}_N = \frac{1}{N}\sum_{i=1}^{N} g_i = 4\frac{N_{\mathrm{in}}}{N}
/// \]
/// です。\(\hat{p} = N_{\mathrm{in}}/N\) と置くと、\(g_i\) の不偏分散は
/// \(s_g^2 = \frac{1}{N - 1}\sum_i (g_i - \hat{\pi}_N)^2 = \frac{16 N \hat{p}(1 - \hat{p})}{N - 1}\) なので、
/// \[
/// \mathrm{SE} = \frac{s_g}{\sqrt{N}} = 4\sqrt{\frac{\hat{p}(1 - \hat{p})}{N - 1}}
/// \]
/// です。どちらも擬似乱数の標本から作った近似です。\(N < 2\) では標準誤差は NaN です。
pub fn pi_estimate(inside: u64, samples: u64) -> PiEstimate {
    let n = samples as f64;
    let p = inside as f64 / n;
    let standard_error = if samples >= 2 { 4.0 * (p * (1.0 - p) / (n - 1.0)).sqrt() } else { f64::NAN };
    PiEstimate { samples, inside, estimate: 4.0 * p, standard_error }
}

/// 単位正方形の点 \((x, y)\) が四分円 \(x^2 + y^2 \le 1\) の内側にあるか。
pub fn inside_quarter_circle(x: f64, y: f64) -> bool {
    x * x + y * y <= 1.0
}

/// `rng` から \(N\) 個の点 \((x_i, y_i) = (U_{2i-1}, U_{2i})\) を作り、[`pi_estimate`] の推定値と標準誤差を返す。
///
/// 各点は [`Rng::uniform`] を2回呼んで作ります。結果は擬似乱数の種で決まる近似です。
pub fn pi_monte_carlo(rng: &mut Rng, samples: u64) -> PiEstimate {
    let mut inside = 0;
    for _ in 0..samples {
        let (x, y) = (rng.uniform(), rng.uniform());
        if inside_quarter_circle(x, y) {
            inside += 1;
        }
    }
    pi_estimate(inside, samples)
}

/// \(g = 4\,\mathbb{I}(x^2 + y^2 \le 1)\) の母標準偏差 \(\sigma_g = \sqrt{\pi(4 - \pi)}\) を返す。
///
/// \(g\) は確率 \(p = \pi/4\) で 4、残りで 0 をとるので、\(\mathrm{Var}(g) = 16\,p(1 - p) = \pi(4 - \pi)\) です。
/// 推定値の標準偏差は \(\sigma_g/\sqrt{N}\) で、\(N\) を4倍にすると半分になります。
pub fn pi_indicator_sd() -> f64 {
    (PI * (4.0 - PI)).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: [f64; 8] = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];

    #[test]
    fn splitmix_is_deterministic_and_matches_the_reference_value() {
        let mut a = Rng::new(1234567);
        let mut b = Rng::new(1234567);
        assert_eq!(a.next_u64(), b.next_u64());
        assert_eq!(Rng::new(1234567).next_u64(), 6457827717110365317);
        let mut r = Rng::new(1);
        for _ in 0..1000 {
            let u = r.uniform();
            assert!((0.0..1.0).contains(&u));
        }
    }

    #[test]
    fn uniform_normal_and_exponential_have_the_right_moments() {
        let mut r = Rng::new(7);
        let us: Vec<f64> = (0..200_000).map(|_| r.uniform()).collect();
        assert!((mean(&us) - 0.5).abs() < 0.005);
        assert!((variance_two_pass(&us) - 1.0 / 12.0).abs() < 0.002);
        let zs: Vec<f64> = (0..200_000).map(|_| r.standard_normal()).collect();
        assert!(mean(&zs).abs() < 0.01);
        assert!((variance_two_pass(&zs) - 1.0).abs() < 0.02);
        let es: Vec<f64> = (0..200_000).map(|_| r.exponential(2.0)).collect();
        assert!((mean(&es) - 0.5).abs() < 0.01);
    }

    #[test]
    fn mean_and_both_variances_match_the_hand_example() {
        assert_eq!(mean(&SAMPLE), 5.0);
        assert!((variance_two_pass(&SAMPLE) - 32.0 / 7.0).abs() < 1e-15);
        assert!((variance_welford(&SAMPLE) - 32.0 / 7.0).abs() < 1e-14);
        let mut w = Welford::new();
        assert_eq!(w.push(2.0), 2.0);
        assert_eq!(w.push(4.0), 2.0);
        assert_eq!((w.mean(), w.m2()), (3.0, 2.0));
        assert!(variance_two_pass(&[1.0]).is_nan());
        assert_eq!(running_means(&[2.0, 4.0, 6.0]), vec![2.0, 3.0, 4.0]);
    }

    #[test]
    fn histogram_counts_each_sample_once() {
        let counts = histogram(&[0.0, 0.1, 0.5, 0.99, 1.0, 1.5, -0.1], 0.0, 1.0, 2);
        assert_eq!(counts, vec![2, 3]);
    }

    #[test]
    fn normal_probability_and_chebyshev_bound() {
        assert!((standard_normal_probability(-1.0, 1.0) - 0.682_689_492_137_085_9).abs() < 1e-12);
        assert!((chebyshev_bound(1.0, 30.0, 0.5) - 2.0 / 15.0).abs() < 1e-15);
        assert_eq!(standard_error(2.0, 4.0), 1.0);
    }

    #[test]
    fn regression_matches_the_hand_example() {
        let fit = linear_regression(&[1.0, 2.0, 3.0, 4.0, 5.0], &[2.0, 4.0, 5.0, 4.0, 5.0]);
        assert_eq!((fit.mean_x, fit.mean_y, fit.sxx, fit.sxy, fit.syy), (3.0, 4.0, 10.0, 6.0, 6.0));
        assert!((fit.slope - 0.6).abs() < 1e-15);
        assert!((fit.intercept - 2.2).abs() < 1e-15);
        assert!((fit.rss - 2.4).abs() < 1e-14);
        assert!((fit.ess - 3.6).abs() < 1e-14);
        assert!((fit.r_squared - 0.6).abs() < 1e-14);
    }

    #[test]
    fn covariance_and_eigen_match_the_hand_example() {
        let [a, b, c] = covariance_2x2(&[1.0, 3.0, 5.0, 7.0, 9.0], &[3.0, 5.0, 6.0, 9.0, 7.0]);
        assert_eq!([a, b, c], [10.0, 6.0, 5.0]);
        let e = symmetric_eigen_2x2(a, b, c);
        assert!((e.values[0] - 14.0).abs() < 1e-14 && (e.values[1] - 1.0).abs() < 1e-14);
        let s = 13f64.sqrt();
        assert!((e.vectors[0][0] - 3.0 / s).abs() < 1e-15 && (e.vectors[0][1] - 2.0 / s).abs() < 1e-15);
        assert!((e.vectors[1][0] + 2.0 / s).abs() < 1e-15 && (e.vectors[1][1] - 3.0 / s).abs() < 1e-15);
        assert_eq!(symmetric_eigen_2x2(1.0, 0.0, 3.0).vectors[0], [0.0, 1.0]);
    }

    #[test]
    fn pi_estimate_from_counts_and_from_points() {
        let e = pi_estimate(80, 100);
        assert!((e.estimate - 3.2).abs() < 1e-15);
        assert!((e.standard_error - 1.6 / 99f64.sqrt()).abs() < 1e-15);
        let mc = pi_monte_carlo(&mut Rng::new(1), 100_000);
        assert!((mc.estimate - PI).abs() < 4.0 * mc.standard_error);
        assert!((pi_indicator_sd() - (PI * (4.0 - PI)).sqrt()).abs() < 1e-15);
    }
}
