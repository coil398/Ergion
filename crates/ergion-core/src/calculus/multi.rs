//! Taylor 展開、偏微分、重積分、数値微分、数値積分。

/// 前進差分 \(D_+ f(x) = \dfrac{f(x + h) - f(x)}{h}\) を返します。
///
/// \(f\) は実関数、\(x\) は微分する点、\(h > 0\) は刻みです。Taylor 展開
/// \(f(x + h) = f(x) + h f'(x) + \frac{h^2}{2} f''(\xi)\)（\(\xi\) は \(x\) と \(x + h\) のあいだ）を代入すると
/// \[
/// D_+ f(x) = f'(x) + \frac{h}{2} f''(\xi)
/// \]
/// です。差 \(\frac{h}{2} f''(\xi)\) は \(h\) の1次で、この値は導関数の近似です。
pub fn forward_difference(f: impl Fn(f64) -> f64, x: f64, h: f64) -> f64 {
    (f(x + h) - f(x)) / h
}

/// 中心差分 \(D_0 f(x) = \dfrac{f(x + h) - f(x - h)}{2h}\) を返します。
///
/// \(f(x \pm h) = f(x) \pm h f'(x) + \frac{h^2}{2} f''(x) \pm \frac{h^3}{6} f'''(\xi_\pm)\) の差をとると、
/// 偶数次の項が消えて
/// \[
/// D_0 f(x) = f'(x) + \frac{h^2}{12}\bigl(f'''(\xi_+) + f'''(\xi_-)\bigr)
/// \]
/// です。差は \(h\) の2次で、この値は導関数の近似です。
pub fn central_difference(f: impl Fn(f64) -> f64, x: f64, h: f64) -> f64 {
    (f(x + h) - f(x - h)) / (2.0 * h)
}

/// 台形則 \(T_n\) で \(\int_a^b f(x)\,dx\) を近似します。
///
/// 区間を \(n \ge 1\) 等分し、刻み \(h = (b - a)/n\)、節点 \(x_i = a + ih\) とします。各小区間で \(f\) を両端を結ぶ直線に置き換えると
/// \[
/// T_n = h\left[\frac{f(x_0)}{2} + \sum_{i=1}^{n-1} f(x_i) + \frac{f(x_n)}{2}\right]
/// \]
/// です。\(f''\) が連続ならば、誤差は \(-\frac{(b - a) h^2}{12} f''(\xi)\)（\(\xi \in [a, b]\)）で、\(h\) の2次です。
/// この値は積分の近似です。\(n = 0\) のときは 0 を返します。
pub fn trapezoid_rule(f: impl Fn(f64) -> f64, a: f64, b: f64, n: usize) -> f64 {
    if n == 0 {
        return 0.0;
    }
    let h = (b - a) / n as f64;
    let inner: f64 = (1..n).map(|i| f(a + h * i as f64)).sum();
    h * (0.5 * f(a) + inner + 0.5 * f(b))
}

/// Simpson 則 \(S_n\) で \(\int_a^b f(x)\,dx\) を近似します。\(n\) は正の偶数です。
///
/// 刻みを \(h = (b - a)/n\)、節点を \(x_i = a + ih\) とし、隣り合う2区間 \([x_{2j}, x_{2j+2}]\) ごとに
/// \(f\) を3点を通る放物線に置き換えます。放物線の積分は \(\frac{h}{3}(f(x_{2j}) + 4 f(x_{2j+1}) + f(x_{2j+2}))\) なので、和は
/// \[
/// S_n = \frac{h}{3}\left[f(x_0) + 4\sum_{i\ \text{奇数}} f(x_i) + 2\sum_{\substack{i\ \text{偶数} \\ 0 < i < n}} f(x_i) + f(x_n)\right]
/// \]
/// です。\(f^{(4)}\) が連続ならば、誤差は \(-\frac{(b - a) h^4}{180} f^{(4)}(\xi)\) で、\(h\) の4次です。
/// 3次以下の多項式では誤差は 0 です。この値は積分の近似です。\(n\) が 0 か奇数のときは NaN を返します。
pub fn simpson_rule(f: impl Fn(f64) -> f64, a: f64, b: f64, n: usize) -> f64 {
    if n == 0 || n % 2 == 1 {
        return f64::NAN;
    }
    let h = (b - a) / n as f64;
    let mut sum = f(a) + f(b);
    for i in 1..n {
        let weight = if i % 2 == 1 { 4.0 } else { 2.0 };
        sum += weight * f(a + h * i as f64);
    }
    h / 3.0 * sum
}

/// 指数関数の次数 \(n\) の Taylor 多項式 \(P_n(x) = \displaystyle\sum_{k=0}^{n} \frac{x^k}{k!}\) を返します。
///
/// \(f(x) = e^x\) はすべての次数の導関数が \(f^{(k)}(x) = e^x\) で、展開の中心 \(a = 0\) では \(f^{(k)}(0) = 1\) です。
/// Taylor の定理
/// \[
/// f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k + R_{n+1}(x)
/// \]
/// に代入すると、和の部分が \(P_n(x)\) です。項は \(\frac{x^k}{k!} = \frac{x^{k-1}}{(k-1)!}\cdot\frac{x}{k}\) と前の項から順に作ります。
/// 例として \(P_3(1) = 1 + 1 + \frac{1}{2} + \frac{1}{6} = \frac{8}{3}\) です。この値は \(e^x\) の近似です。
pub fn exp_taylor_polynomial(x: f64, n: usize) -> f64 {
    let mut term = 1.0;
    let mut sum = 1.0;
    for k in 1..=n {
        term *= x / k as f64;
        sum += term;
    }
    sum
}

/// 指数関数の Taylor 多項式の剰余項 \(R_{n+1}(x) = e^x - P_n(x)\) の上界
/// \(\dfrac{e^{\max(x, 0)}\,|x|^{n+1}}{(n+1)!}\) を返します。
///
/// Lagrange 形の剰余項は、\(0\) と \(x\) のあいだのある点 \(\xi\) を用いて
/// \[
/// R_{n+1}(x) = \frac{e^{\xi}}{(n+1)!}\,x^{n+1}
/// \]
/// です。\(e^{\xi}\) は増加関数なので \(e^{\xi} \le e^{\max(x, 0)}\) で、絶対値をとると上界が得られます。
/// 例として \(x = 1\)、\(n = 3\) では \(\frac{e}{24} \approx 0.113262\) です。上界の値は厳密な式の値です。
pub fn exp_taylor_remainder_bound(x: f64, n: usize) -> f64 {
    let mut power_over_factorial = 1.0;
    for k in 1..=n + 1 {
        power_over_factorial *= x.abs() / k as f64;
    }
    x.max(0.0).exp() * power_over_factorial
}

/// 2変数関数 \(f(x, y) = x^2 + 3xy\) の値を返します。偏微分と勾配の例に使う関数です。
pub fn quadratic_field(x: f64, y: f64) -> f64 {
    x * x + 3.0 * x * y
}

/// \(f(x, y) = x^2 + 3xy\) の勾配 \(\nabla f = \left(\dfrac{\partial f}{\partial x}, \dfrac{\partial f}{\partial y}\right) = (2x + 3y,\ 3x)\) を返します。
///
/// \(\frac{\partial f}{\partial x}\) は \(y\) を定数とみなして \(x\) で微分したもので、\(x^2\) から \(2x\)、\(3xy\) から \(3y\) が出ます。
/// \(\frac{\partial f}{\partial y}\) は \(x\) を定数とみなして \(y\) で微分したもので、\(x^2\) は 0、\(3xy\) から \(3x\) が出ます。
/// 例として点 \((1, 2)\) では \(\nabla f = (8, 3)\) です。この値は厳密です。
pub fn quadratic_field_gradient(x: f64, y: f64) -> [f64; 2] {
    [2.0 * x + 3.0 * y, 3.0 * x]
}

/// \(f(x, y) = x^2 + 3xy\) の等高線 \(f(x, y) = c\) の上で、横の座標 \(x \ne 0\) に対応する縦の座標
/// \(y = \dfrac{c - x^2}{3x}\) を返します。
///
/// 等式 \(x^2 + 3xy = c\) から \(x^2\) を移項して \(3xy = c - x^2\)、\(3x \ne 0\) で割って得られます。
/// \(c = 0\) の等高線は、この直線 \(y = -x/3\) と縦の直線 \(x = 0\) の和集合です。\(x = 0\) のときは NaN を返します。
pub fn quadratic_field_level_y(c: f64, x: f64) -> f64 {
    if x == 0.0 {
        return f64::NAN;
    }
    (c - x * x) / (3.0 * x)
}

/// 中心差分による偏導関数 \(\dfrac{\partial f}{\partial x}(x, y) \approx \dfrac{f(x + h, y) - f(x - h, y)}{2h}\) を返します。
///
/// \(y\) を固定した1変数関数 \(s \mapsto f(s, y)\) に [`central_difference`] を当てたものです。
/// 差は \(h\) の2次で、\(f\) が \(x\) について2次以下の多項式ならば差は 0 です。この値は偏導関数の近似です。
pub fn central_partial_x(f: impl Fn(f64, f64) -> f64, x: f64, y: f64, h: f64) -> f64 {
    central_difference(|s| f(s, y), x, h)
}

/// 中心差分による偏導関数 \(\dfrac{\partial f}{\partial y}(x, y) \approx \dfrac{f(x, y + h) - f(x, y - h)}{2h}\) を返します。
///
/// \(x\) を固定した1変数関数 \(s \mapsto f(x, s)\) に [`central_difference`] を当てたものです。この値は偏導関数の近似です。
pub fn central_partial_y(f: impl Fn(f64, f64) -> f64, x: f64, y: f64, h: f64) -> f64 {
    central_difference(|s| f(x, s), y, h)
}

/// 格子点 \((x_i, y_j)\) ごとの勾配 \(\nabla f(x_i, y_j)\) を、\([x_i, y_j, g_x, g_y]\) の並びで返します。
///
/// 並びは \(x\) の外側の繰り返し、\(y\) の内側の繰り返しの順です。勾配は等高線に垂直で、\(f\) が最も速く増える向きを指します。
pub fn gradient_samples(gradient: impl Fn(f64, f64) -> [f64; 2], xs: &[f64], ys: &[f64]) -> Vec<[f64; 4]> {
    let mut samples = Vec::with_capacity(xs.len() * ys.len());
    for &x in xs {
        for &y in ys {
            let [gx, gy] = gradient(x, y);
            samples.push([x, y, gx, gy]);
        }
    }
    samples
}

/// 長方形 \([x_0, x_1] \times [y_0, y_1]\) の上の二重積分 \(\iint f(x, y)\,dA\) を、中点の格子和で近似します。
///
/// 横を \(n_x\) 等分、縦を \(n_y\) 等分し、\(\Delta x = (x_1 - x_0)/n_x\)、\(\Delta y = (y_1 - y_0)/n_y\)、
/// 小さな長方形の中点を \(x_i^* = x_0 + (i - \tfrac{1}{2})\Delta x\)、\(y_j^* = y_0 + (j - \tfrac{1}{2})\Delta y\) とします。和は
/// \[
/// M_{n_x, n_y} = \sum_{i=1}^{n_x} \sum_{j=1}^{n_y} f(x_i^*, y_j^*)\,\Delta x\,\Delta y
/// \]
/// です。\(f(x, y) = xy\)、領域 \([0, 1]^2\)、\(n_x = n_y = n\) では、\(\sum_{i=1}^{n}(i - \tfrac{1}{2}) = \tfrac{n^2}{2}\) より
/// 和は \(\left(\tfrac{1}{n}\cdot\tfrac{n}{2}\right)^2 = \tfrac{1}{4}\) で、どの \(n\) でも厳密な値 \(\tfrac{1}{4}\) に等しくなります。
/// 一般の \(f\) では、この値は積分の近似です。\(n_x\) か \(n_y\) が 0 のときは 0 を返します。
pub fn midpoint_double_sum(
    f: impl Fn(f64, f64) -> f64,
    x0: f64,
    x1: f64,
    y0: f64,
    y1: f64,
    nx: usize,
    ny: usize,
) -> f64 {
    if nx == 0 || ny == 0 {
        return 0.0;
    }
    let dx = (x1 - x0) / nx as f64;
    let dy = (y1 - y0) / ny as f64;
    let mut sum = 0.0;
    for i in 0..nx {
        let x = x0 + (i as f64 + 0.5) * dx;
        for j in 0..ny {
            sum += f(x, y0 + (j as f64 + 0.5) * dy);
        }
    }
    sum * dx * dy
}

/// 半径 \(R\) の円板の面積を、極座標の累次積分 \(\displaystyle\int_0^{2\pi}\!\!\int_0^R r\,dr\,d\theta\) の中点和で求めます。
///
/// 極座標では面積要素は \(dA = r\,dr\,d\theta\) です。動径を \(n_r\) 等分（\(\Delta r = R/n_r\)、中点 \(r_i^* = (i - \tfrac{1}{2})\Delta r\)）、
/// 角を \(n_\theta\) 等分（\(\Delta\theta = 2\pi/n_\theta\)）すると、和は
/// \[
/// \sum_{j=1}^{n_\theta}\sum_{i=1}^{n_r} r_i^*\,\Delta r\,\Delta\theta = 2\pi \cdot \Delta r^2 \sum_{i=1}^{n_r}\left(i - \tfrac{1}{2}\right) = 2\pi \cdot \frac{R^2}{n_r^2}\cdot\frac{n_r^2}{2} = \pi R^2
/// \]
/// です。被積分関数 \(r\) が1次式なので、中点和は分割数によらず厳密な面積 \(\pi R^2\) に等しくなります。
/// \(n_r\) か \(n_\theta\) が 0 のときは 0 を返します。
pub fn polar_disk_area_sum(radius: f64, nr: usize, ntheta: usize) -> f64 {
    if nr == 0 || ntheta == 0 {
        return 0.0;
    }
    let dr = radius / nr as f64;
    let dtheta = 2.0 * std::f64::consts::PI / ntheta as f64;
    let radial: f64 = (0..nr).map(|i| (i as f64 + 0.5) * dr * dr).sum();
    radial * dtheta * ntheta as f64
}

/// 半径 \(R\) の円板の面積を、正方形 \([-R, R]^2\) の \(n \times n\) の中点格子で数えて近似します。
///
/// 円板の特性関数 \(\chi(x, y)\)（\(x^2 + y^2 \le R^2\) のとき 1、そうでないとき 0）に [`midpoint_double_sum`] を当てた値で、
/// 中点が円板に入る小さな正方形の個数に、1個の面積 \((2R/n)^2\) を掛けたものです。
/// 例として \(R = 1\)、\(n = 4\) では、16 個のうち四隅の 4 個の中点 \((\pm\tfrac{3}{4}, \pm\tfrac{3}{4})\) が円の外にあり、
/// 値は \(12 \cdot \tfrac{1}{4} = 3\) です。この値は面積 \(\pi R^2\) の近似で、境界の近くの正方形の数え方の差が残ります。
pub fn disk_area_grid_sum(radius: f64, n: usize) -> f64 {
    let r2 = radius * radius;
    midpoint_double_sum(|x, y| if x * x + y * y <= r2 { 1.0 } else { 0.0 }, -radius, radius, -radius, radius, n, n)
}

/// [`disk_area_grid_sum`] が数える小さな正方形の中点 \((x_i^*, y_j^*)\)、すなわち \(x_i^{*2} + y_j^{*2} \le R^2\) を満たす中点を返します。
///
/// 中点は \(x_i^* = -R + (i - \tfrac{1}{2})\tfrac{2R}{n}\) です。返す個数に \((2R/n)^2\) を掛けると [`disk_area_grid_sum`] の値です。
pub fn disk_grid_midpoints(radius: f64, n: usize) -> Vec<[f64; 2]> {
    if n == 0 {
        return Vec::new();
    }
    let side = 2.0 * radius / n as f64;
    let mut inside = Vec::new();
    for i in 0..n {
        let x = -radius + (i as f64 + 0.5) * side;
        for j in 0..n {
            let y = -radius + (j as f64 + 0.5) * side;
            if x * x + y * y <= radius * radius {
                inside.push([x, y]);
            }
        }
    }
    inside
}

/// 前進差分の誤差の主要項 \(\dfrac{h}{2} f''(x)\) を返します。
///
/// [`forward_difference`] の rustdoc の式 \(D_+ f(x) - f'(x) = \frac{h}{2} f''(\xi)\) で、\(\xi\) を \(x\) に置き換えたものです。
/// \(\log h\) に対する \(\log\left|\frac{h}{2} f''(x)\right|\) は傾き 1 の直線です。
pub fn forward_difference_leading_error(second_derivative: f64, h: f64) -> f64 {
    0.5 * h * second_derivative
}

/// 中心差分の誤差の主要項 \(\dfrac{h^2}{6} f'''(x)\) を返します。
///
/// [`central_difference`] の rustdoc の式 \(D_0 f(x) - f'(x) = \frac{h^2}{12}\bigl(f'''(\xi_+) + f'''(\xi_-)\bigr)\) で、
/// \(\xi_\pm\) を \(x\) に置き換えると \(\frac{h^2}{12}\cdot 2 f'''(x) = \frac{h^2}{6} f'''(x)\) です。
/// \(\log h\) に対する \(\log\left|\frac{h^2}{6} f'''(x)\right|\) は傾き 2 の直線です。
pub fn central_difference_leading_error(third_derivative: f64, h: f64) -> f64 {
    h * h / 6.0 * third_derivative
}

/// 台形則の誤差の上界 \(\dfrac{(b - a) h^2}{12} M_2\) を返します。\(h = (b - a)/n\)、\(M_2 = \max_{[a, b]} |f''|\) です。
///
/// 台形則の誤差は \(\int_a^b f\,dx - T_n = -\frac{(b - a) h^2}{12} f''(\xi)\)（\(\xi \in [a, b]\)）なので、絶対値は \(\frac{(b - a) h^2}{12} M_2\) 以下です。
/// 例として \(\int_0^\pi \sin x\,dx\)、\(n = 4\) では \(M_2 = 1\)、\(h = \pi/4\) で、上界は \(\frac{\pi^3}{192} \approx 0.161491\) です。
pub fn trapezoid_error_bound(a: f64, b: f64, n: usize, max_second_derivative: f64) -> f64 {
    let h = (b - a) / n as f64;
    (b - a).abs() * h * h / 12.0 * max_second_derivative
}

/// Simpson 則の誤差の上界 \(\dfrac{(b - a) h^4}{180} M_4\) を返します。\(h = (b - a)/n\)、\(M_4 = \max_{[a, b]} |f^{(4)}|\) です。
///
/// [`simpson_rule`] の rustdoc の誤差 \(-\frac{(b - a) h^4}{180} f^{(4)}(\xi)\) の絶対値の上界です。
pub fn simpson_error_bound(a: f64, b: f64, n: usize, max_fourth_derivative: f64) -> f64 {
    let h = (b - a) / n as f64;
    (b - a).abs() * h.powi(4) / 180.0 * max_fourth_derivative
}

/// 3点 \((x_0, f_0)\)、\((x_0 + h, f_1)\)、\((x_0 + 2h, f_2)\) を通る放物線の、点 \(x\) での値を返します。
///
/// \(s = (x - x_0)/h\) と置くと、Lagrange の補間式は
/// \[
/// p(x) = f_0\,\frac{(s - 1)(s - 2)}{2} - f_1\,s(s - 2) + f_2\,\frac{s(s - 1)}{2}
/// \]
/// です。\(s = 0, 1, 2\) を代入すると、それぞれ \(f_0, f_1, f_2\) になります。Simpson 則は、この放物線の積分を足したものです。
pub fn simpson_parabola(x0: f64, h: f64, f0: f64, f1: f64, f2: f64, x: f64) -> f64 {
    let s = (x - x0) / h;
    f0 * (s - 1.0) * (s - 2.0) / 2.0 - f1 * s * (s - 2.0) + f2 * s * (s - 1.0) / 2.0
}

/// 分割数を2倍にしたときの誤差の比 \(e_{2n}/e_n\) を、並び \(e_n, e_{2n}, e_{4n}, \ldots\) から返します。
///
/// 誤差が \(e_n \approx C h^p\)（\(h = (b - a)/n\)）ならば、\(h\) が半分になると
/// \[
/// \frac{e_{2n}}{e_n} \approx \frac{C (h/2)^p}{C h^p} = 2^{-p}
/// \]
/// です。台形則（\(p = 2\)）では約 \(\frac{1}{4}\)、Simpson 則（\(p = 4\)）では約 \(\frac{1}{16}\) です。比の値は近似です。
pub fn doubling_ratios(errors: &[f64]) -> Vec<f64> {
    errors.windows(2).map(|pair| pair[1] / pair[0]).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn differences_of_sine_at_one() {
        let exact = 1.0_f64.cos();
        let forward = forward_difference(f64::sin, 1.0, 1e-3);
        let central = central_difference(f64::sin, 1.0, 1e-3);
        assert!((forward - exact).abs() < 1e-3);
        assert!((central - exact).abs() < 1e-6);
        assert!((central - exact).abs() < (forward - exact).abs());
    }

    #[test]
    fn quadrature_of_sine_over_zero_to_pi() {
        let pi = std::f64::consts::PI;
        let t4 = trapezoid_rule(f64::sin, 0.0, pi, 4);
        let t8 = trapezoid_rule(f64::sin, 0.0, pi, 8);
        assert!(((2.0 - t4) / (2.0 - t8) - 4.0).abs() < 0.1);
        let s4 = simpson_rule(f64::sin, 0.0, pi, 4);
        let s8 = simpson_rule(f64::sin, 0.0, pi, 8);
        assert!(((s4 - 2.0) / (s8 - 2.0) - 16.0).abs() < 1.5);
        assert!((simpson_rule(|x| x * x * x, 0.0, 2.0, 2) - 4.0).abs() < 1e-14);
        assert!(simpson_rule(f64::sin, 0.0, pi, 3).is_nan());
    }

    #[test]
    fn taylor_polynomial_of_exp_at_one() {
        assert!((exp_taylor_polynomial(1.0, 3) - 8.0 / 3.0).abs() < 1e-15);
        assert_eq!(exp_taylor_polynomial(2.0, 0), 1.0);
        assert!((exp_taylor_polynomial(-1.0, 2) - 0.5).abs() < 1e-15);
        let e = std::f64::consts::E;
        assert!((exp_taylor_remainder_bound(1.0, 3) - e / 24.0).abs() < 1e-15);
        assert!((exp_taylor_remainder_bound(-2.0, 1) - 2.0).abs() < 1e-15);
        for n in 0..10 {
            for x in [-2.0, -0.5, 0.5, 1.0, 2.0] {
                let remainder = (x as f64).exp() - exp_taylor_polynomial(x, n);
                assert!(remainder.abs() <= exp_taylor_remainder_bound(x, n) * (1.0 + 1e-12), "x={x} n={n}");
            }
        }
    }

    #[test]
    fn partials_of_the_quadratic_field() {
        assert_eq!(quadratic_field(1.0, 2.0), 7.0);
        assert_eq!(quadratic_field_gradient(1.0, 2.0), [8.0, 3.0]);
        assert!((central_partial_x(quadratic_field, 1.0, 2.0, 0.1) - 8.0).abs() < 1e-12);
        assert!((central_partial_y(quadratic_field, 1.0, 2.0, 0.1) - 3.0).abs() < 1e-12);
        assert!((forward_difference(|s| quadratic_field(s, 2.0), 1.0, 0.1) - 8.1).abs() < 1e-12);
        let y = quadratic_field_level_y(7.0, 1.0);
        assert!((y - 2.0).abs() < 1e-15);
        assert!(quadratic_field_level_y(1.0, 0.0).is_nan());
        let samples = gradient_samples(quadratic_field_gradient, &[0.0, 1.0], &[2.0]);
        assert_eq!(samples, vec![[0.0, 2.0, 6.0, 0.0], [1.0, 2.0, 8.0, 3.0]]);
    }

    #[test]
    fn gradient_is_perpendicular_to_the_level_curve() {
        let (x, c) = (1.5, 4.0);
        let dydx = central_difference(|s| quadratic_field_level_y(c, s), x, 1e-5);
        let [gx, gy] = quadratic_field_gradient(x, quadratic_field_level_y(c, x));
        assert!((gx * 1.0 + gy * dydx).abs() < 1e-8);
    }

    #[test]
    fn double_integrals_over_the_square_and_the_disk() {
        for n in [1, 2, 4, 7, 16] {
            assert!((midpoint_double_sum(|x, y| x * y, 0.0, 1.0, 0.0, 1.0, n, n) - 0.25).abs() < 1e-15);
            assert!((polar_disk_area_sum(1.0, n, 4 * n) - std::f64::consts::PI).abs() < 1e-13);
        }
        assert!((midpoint_double_sum(|x, y| x * x * y, 0.0, 1.0, 0.0, 1.0, 2, 2) - 0.15625).abs() < 1e-15);
        assert_eq!(disk_area_grid_sum(1.0, 4), 3.0);
        assert_eq!(disk_grid_midpoints(1.0, 4).len(), 12);
        for n in [3, 8, 33] {
            let cell = (2.0 / n as f64).powi(2);
            assert!((disk_grid_midpoints(1.0, n).len() as f64 * cell - disk_area_grid_sum(1.0, n)).abs() < 1e-12);
        }
        let coarse = (disk_area_grid_sum(1.0, 8) - std::f64::consts::PI).abs();
        let fine = (disk_area_grid_sum(1.0, 256) - std::f64::consts::PI).abs();
        assert!(fine < coarse / 10.0);
    }

    #[test]
    fn difference_errors_follow_their_leading_terms() {
        let h = 1e-3;
        let forward = forward_difference(f64::sin, 1.0, h) - 1.0_f64.cos();
        let central = central_difference(f64::sin, 1.0, h) - 1.0_f64.cos();
        let lead_forward = forward_difference_leading_error(-1.0_f64.sin(), h);
        let lead_central = central_difference_leading_error(-1.0_f64.cos(), h);
        assert!((forward / lead_forward - 1.0).abs() < 1e-3);
        assert!((central / lead_central - 1.0).abs() < 1e-3);
        assert!((forward_difference(f64::sin, 1.0, 0.1) - 0.497364).abs() < 1e-6);
        assert!((central_difference(f64::sin, 1.0, 0.1) - 0.539402).abs() < 1e-6);
    }

    #[test]
    fn quadrature_hand_values_bounds_and_ratios() {
        let pi = std::f64::consts::PI;
        assert!((trapezoid_rule(f64::sin, 0.0, pi, 2) - pi / 2.0).abs() < 1e-15);
        assert!((trapezoid_rule(f64::sin, 0.0, pi, 4) - pi * (1.0 + 2f64.sqrt()) / 4.0).abs() < 1e-14);
        assert!((simpson_rule(f64::sin, 0.0, pi, 2) - 2.0 * pi / 3.0).abs() < 1e-15);
        assert!((simpson_rule(f64::sin, 0.0, pi, 4) - pi * (2.0 + 4.0 * 2f64.sqrt()) / 12.0).abs() < 1e-14);
        for n in [2, 4, 8, 16] {
            assert!((2.0 - trapezoid_rule(f64::sin, 0.0, pi, n)).abs() <= trapezoid_error_bound(0.0, pi, n, 1.0));
            assert!((2.0 - simpson_rule(f64::sin, 0.0, pi, n)).abs() <= simpson_error_bound(0.0, pi, n, 1.0));
        }
        assert!((trapezoid_error_bound(0.0, pi, 4, 1.0) - pi.powi(3) / 192.0).abs() < 1e-15);
        let ns = [32, 64, 128];
        let t: Vec<f64> = ns.iter().map(|&n| trapezoid_rule(f64::sin, 0.0, pi, n) - 2.0).collect();
        let s: Vec<f64> = ns.iter().map(|&n| simpson_rule(f64::sin, 0.0, pi, n) - 2.0).collect();
        for r in doubling_ratios(&t) {
            assert!((r - 0.25).abs() < 1e-3);
        }
        for r in doubling_ratios(&s) {
            assert!((r - 1.0 / 16.0).abs() < 1e-3);
        }
        assert_eq!(doubling_ratios(&[4.0, 1.0, 0.5]), vec![0.25, 0.5]);
    }

    #[test]
    fn parabola_through_three_points() {
        let p = |x| simpson_parabola(1.0, 0.5, 3.0, -1.0, 2.0, x);
        assert!((p(1.0) - 3.0).abs() < 1e-15);
        assert!((p(1.5) + 1.0).abs() < 1e-15);
        assert!((p(2.0) - 2.0).abs() < 1e-15);
        let q = |x: f64| x * x - 3.0 * x + 1.0;
        assert!((simpson_parabola(0.0, 1.0, q(0.0), q(1.0), q(2.0), 0.3) - q(0.3)).abs() < 1e-14);
    }
}
