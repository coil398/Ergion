//! 極限、微分、平均値の定理、定積分、置換積分と部分積分。

use super::{forward_difference, simpson_rule};
use crate::newton_step;

/// 比 \(\dfrac{\sin x}{x}\) の値を返します。\(x = 0\) では定義されないので NaN を返します。
///
/// \(x\) は弧度法の角です。\(0 < |x| < \pi/2\) では、単位円の三角形と扇形の面積を比べて
/// \(\sin |x| \le |x| \le \tan |x|\) が成り立ち、\(\sin |x| > 0\) で割って逆数をとると
/// \[
/// \cos x \le \frac{\sin x}{x} \le 1
/// \]
/// です。\(x \to 0\) で \(\cos x \to 1\) なので、はさみうちの原理により
/// \(\lim_{x \to 0} \frac{\sin x}{x} = 1\) です。返す値は \(\sin x\) の数値計算による近似値です。
pub fn sine_ratio(x: f64) -> f64 {
    if x == 0.0 { f64::NAN } else { x.sin() / x }
}

/// 極限値 1 と \(\dfrac{\sin x}{x}\) の差の上界 \(\dfrac{x^2}{6}\) を返します。
///
/// \(t \ge 0\) で \(\sin t \le t\) です。これを \(0\) から \(s\) まで積分すると
/// \(1 - \cos s \le \frac{s^2}{2}\)、すなわち \(\cos s \ge 1 - \frac{s^2}{2}\) です。
/// さらに \(0\) から \(x > 0\) まで積分すると \(\sin x \ge x - \frac{x^3}{6}\) です。
/// \(x > 0\) で割り、\(\sin x \le x\) と合わせると
/// \[
/// 0 \le 1 - \frac{\sin x}{x} \le \frac{x^2}{6}
/// \]
/// です。両辺は偶関数なので、すべての \(x \neq 0\) で成り立ちます。この上界は厳密な式です。
pub fn sine_ratio_gap_bound(x: f64) -> f64 {
    x * x / 6.0
}

/// 許す誤差 \(\varepsilon > 0\) に対して、\(\lim_{x \to 0} \frac{\sin x}{x} = 1\) を満たす幅 \(\delta = \sqrt{6\varepsilon}\) を返します。
///
/// [`sine_ratio_gap_bound`] の不等式 \(\left|\frac{\sin x}{x} - 1\right| \le \frac{x^2}{6}\) により、
/// \(0 < |x| < \delta\) ならば
/// \[
/// \left|\frac{\sin x}{x} - 1\right| \le \frac{x^2}{6} < \frac{\delta^2}{6} = \varepsilon
/// \]
/// です。これが極限の \(\varepsilon\)-\(\delta\) 論法の定義で求められる \(\delta\) です。式は厳密です。
pub fn sine_ratio_delta(epsilon: f64) -> f64 {
    (6.0 * epsilon).sqrt()
}

/// 点 \((x_0, y_0)\) を通り傾き \(m\) の直線の、\(x\) における高さ \(y = y_0 + m(x - x_0)\) を返します。
///
/// 割線では \(m\) は2点を結ぶ差分商、接線では \(m\) は導関数の値 \(f'(x_0)\) です。式は厳密です。
pub fn point_slope_line(x0: f64, y0: f64, slope: f64, x: f64) -> f64 {
    y0 + slope * (x - x0)
}

/// \(f(x) = x^2\) の点 \(a\) における差分商を、手で整理した厳密な式 \(2a + h\) で返します。
///
/// \(a\) は微分する点、\(h \neq 0\) は刻みです。展開すると
/// \[
/// \frac{(a + h)^2 - a^2}{h} = \frac{a^2 + 2ah + h^2 - a^2}{h} = \frac{2ah + h^2}{h} = 2a + h
/// \]
/// です。\(h \to 0\) の極限は \(f'(a) = 2a\) で、差分商と導関数の差はちょうど \(h\) です。
/// 差分商を定義どおりに計算した値は [`forward_difference`](crate::calculus::forward_difference) が返します。
pub fn square_difference_quotient(a: f64, h: f64) -> f64 {
    2.0 * a + h
}

/// 積の微分 \((uv)' = u'v + uv'\) の値を返します。
///
/// \(u\)、\(v\) は点 \(x\) で微分できる関数で、引数は \(u(x)\)、\(u'(x)\)、\(v(x)\)、\(v'(x)\) の値です。
/// 差分商を
/// \[
/// \frac{u(x + h)v(x + h) - u(x)v(x)}{h} = \frac{u(x + h) - u(x)}{h}\,v(x + h) + u(x)\,\frac{v(x + h) - v(x)}{h}
/// \]
/// と分け、\(h \to 0\) で \(v(x + h) \to v(x)\) を使うと右辺の式になります。式は厳密です。
pub fn product_derivative(u: f64, du: f64, v: f64, dv: f64) -> f64 {
    du * v + u * dv
}

/// 合成関数の微分 \(\dfrac{d}{dx} f(g(x)) = f'(g(x))\,g'(x)\) の値を返します。
///
/// 引数は外側の導関数を内側の値で評価した \(f'(g(x))\) と、内側の導関数 \(g'(x)\) です。式は厳密です。
pub fn chain_derivative(outer_derivative: f64, inner_derivative: f64) -> f64 {
    outer_derivative * inner_derivative
}

/// 例の関数 \(x^2 \sin x\) の値を返します。
pub fn square_sine(x: f64) -> f64 {
    x * x * x.sin()
}

/// \(\dfrac{d}{dx}\left(x^2 \sin x\right) = 2x \sin x + x^2 \cos x\) を返します。
///
/// \(u = x^2\)、\(v = \sin x\) とすると \(u' = 2x\)、\(v' = \cos x\) で、[`product_derivative`] に代入した値です。
/// 第1項 \(2x\sin x\) は \(u'v\)、第2項 \(x^2\cos x\) は \(uv'\) です。式は厳密です。
pub fn square_sine_derivative(x: f64) -> f64 {
    product_derivative(x * x, 2.0 * x, x.sin(), x.cos())
}

/// 例の関数 \(e^{x^2}\) の値を返します。
pub fn exp_square(x: f64) -> f64 {
    (x * x).exp()
}

/// \(\dfrac{d}{dx} e^{x^2} = 2x e^{x^2}\) を返します。
///
/// 外側を \(f(u) = e^u\)、内側を \(g(x) = x^2\) とすると \(f'(u) = e^u\)、\(g'(x) = 2x\) で、
/// [`chain_derivative`] に \(f'(g(x)) = e^{x^2}\) と \(g'(x) = 2x\) を代入した値です。式は厳密です。
pub fn exp_square_derivative(x: f64) -> f64 {
    chain_derivative((x * x).exp(), 2.0 * x)
}

/// 区間 \([a, b]\) の平均の傾き \(\dfrac{f(b) - f(a)}{b - a}\) を返します。
///
/// 端点 \((a, f(a))\) と \((b, f(b))\) を結ぶ割線の傾きです。刻み \(h = b - a\) の差分商と同じ式なので、
/// [`forward_difference`](crate::calculus::forward_difference) で計算します。
pub fn mean_slope(f: impl Fn(f64) -> f64, a: f64, b: f64) -> f64 {
    forward_difference(f, a, b - a)
}

/// 平均値の定理の点 \(c\)、すなわち \(f'(c) = m\) の根を、ニュートン法で近似した列 \(c_0, c_1, \ldots, c_N\) を返します。
///
/// \(m\) は平均の傾き、\(N\) は反復の回数です。\(g(c) = f'(c) - m\) と置くと \(g'(c) = f''(c)\) で、
/// [`newton_step`](crate::newton_step) により
/// \[
/// c_{n+1} = c_n - \frac{f'(c_n) - m}{f''(c_n)}
/// \]
/// と更新します。例として \(f(x) = x^3\)、\([a, b] = [0, 2]\) では \(m = 4\)、\(g(c) = 3c^2 - 4\)、\(g'(c) = 6c\) で、
/// \(c_0 = 1\) から \(c_1 = 7/6\)、\(c_2 = 97/84\) です。列の極限は \(2/\sqrt{3}\) です。各項は近似値です。
pub fn mean_value_newton(
    derivative: impl Fn(f64) -> f64,
    second_derivative: impl Fn(f64) -> f64,
    slope: f64,
    c0: f64,
    steps: usize,
) -> Vec<f64> {
    let mut iterates = Vec::with_capacity(steps + 1);
    let mut c = c0;
    iterates.push(c);
    for _ in 0..steps {
        c = newton_step(c, |x| derivative(x) - slope, &second_derivative);
        iterates.push(c);
    }
    iterates
}

/// \(f(x) = x^3\) の区間 \([a, b]\)（\(0 \le a < b\)）での平均値の定理の点 \(c = \sqrt{\dfrac{a^2 + ab + b^2}{3}}\) を返します。
///
/// 平均の傾きは
/// \[
/// \frac{b^3 - a^3}{b - a} = \frac{(b - a)(a^2 + ab + b^2)}{b - a} = a^2 + ab + b^2
/// \]
/// です。\(f'(c) = 3c^2\) と等しいとおくと \(c^2 = \frac{a^2 + ab + b^2}{3}\) で、\(c > 0\) の根が答えです。
/// \(a^2 < c^2 < b^2\) なので \(c \in (a, b)\) です。\([0, 2]\) では \(c = 2/\sqrt{3}\) です。式は厳密です。
pub fn cube_mean_value_point(a: f64, b: f64) -> f64 {
    ((a * a + a * b + b * b) / 3.0).sqrt()
}

/// Riemann 和で各小区間から選ぶ点。左端、右端、中点のいずれか。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RiemannPoint {
    Left,
    Right,
    Midpoint,
}

/// Riemann 和の標本点 \(x_1^*, \ldots, x_n^*\) を返します。
///
/// 区間 \([a, b]\) を \(n\) 等分し、刻みを \(\Delta x = (b - a)/n\) とします。第 \(i\) 小区間は
/// \([a + (i - 1)\Delta x,\ a + i\Delta x]\) で、標本点は左端 \(x_i^* = a + (i - 1)\Delta x\)、
/// 右端 \(x_i^* = a + i\Delta x\)、中点 \(x_i^* = a + (i - \tfrac{1}{2})\Delta x\) です。
pub fn riemann_points(a: f64, b: f64, n: usize, point: RiemannPoint) -> Vec<f64> {
    let dx = (b - a) / n as f64;
    let offset = match point {
        RiemannPoint::Left => 0.0,
        RiemannPoint::Right => 1.0,
        RiemannPoint::Midpoint => 0.5,
    };
    (0..n).map(|i| a + (i as f64 + offset) * dx).collect()
}

/// Riemann 和 \(S_n = \sum_{i=1}^n f(x_i^*)\,\Delta x\) を返します。
///
/// \(\Delta x = (b - a)/n\)、標本点 \(x_i^*\) は [`riemann_points`] です。\(f\) が \([a, b]\) で連続ならば、
/// どの標本点を選んでも \(n \to \infty\) で \(S_n \to \int_a^b f(x)\,dx\) です。この値は定積分の近似です。
/// \(n = 0\) のときは 0 を返します。
pub fn riemann_sum(f: impl Fn(f64) -> f64, a: f64, b: f64, n: usize, point: RiemannPoint) -> f64 {
    if n == 0 {
        return 0.0;
    }
    let dx = (b - a) / n as f64;
    riemann_points(a, b, n, point).into_iter().map(|x| f(x) * dx).sum()
}

/// \(\int_0^1 x^2\,dx\) の Riemann 和 \(S_n\) を、和の公式で整理した厳密な式で返します。
///
/// \(\Delta x = 1/n\) です。\(\sum_{i=1}^n i^2 = \frac{n(n + 1)(2n + 1)}{6}\) を使うと、
/// 右端 \(x_i^* = i/n\) では
/// \[
/// S_n = \sum_{i=1}^n \frac{i^2}{n^2}\cdot\frac{1}{n} = \frac{1}{n^3}\cdot\frac{n(n + 1)(2n + 1)}{6} = \frac{(n + 1)(2n + 1)}{6n^2} = \frac13 + \frac{1}{2n} + \frac{1}{6n^2},
/// \]
/// 左端 \(x_i^* = (i - 1)/n\) では \(\sum_{i=1}^n (i - 1)^2 = \frac{(n - 1)n(2n - 1)}{6}\) より
/// \[
/// S_n = \frac{(n - 1)(2n - 1)}{6n^2} = \frac13 - \frac{1}{2n} + \frac{1}{6n^2},
/// \]
/// 中点 \(x_i^* = (2i - 1)/(2n)\) では \(\sum_{i=1}^n (2i - 1)^2 = \frac{n(4n^2 - 1)}{3}\) より
/// \[
/// S_n = \frac{1}{4n^3}\cdot\frac{n(4n^2 - 1)}{3} = \frac13 - \frac{1}{12n^2}
/// \]
/// です。どれも \(n \to \infty\) で厳密値 \(\frac13\) に近づきます。式は厳密です。
pub fn square_riemann_sum_exact(n: usize, point: RiemannPoint) -> f64 {
    let n = n as f64;
    match point {
        RiemannPoint::Right => (n + 1.0) * (2.0 * n + 1.0) / (6.0 * n * n),
        RiemannPoint::Left => (n - 1.0) * (2.0 * n - 1.0) / (6.0 * n * n),
        RiemannPoint::Midpoint => 1.0 / 3.0 - 1.0 / (12.0 * n * n),
    }
}

/// 置換 \(x = g(t)\) をしたあとの積分 \(\int_{g(a)}^{g(b)} f(x)\,dx\) を Simpson 則で近似します。
///
/// 置換積分の公式は
/// \[
/// \int_a^b f(g(t))\,g'(t)\,dt = \int_{g(a)}^{g(b)} f(x)\,dx
/// \]
/// です。左辺の被積分関数 \(f(g(t))g'(t)\) と右辺の \(f(x)\) は別の関数なので、同じ分割数 \(n\) の
/// [`simpson_rule`](crate::calculus::simpson_rule) でも近似値は異なります。厳密値は等しい値です。
pub fn integrate_by_substitution(f: impl Fn(f64) -> f64, g: impl Fn(f64) -> f64, a: f64, b: f64, n: usize) -> f64 {
    simpson_rule(f, g(a), g(b), n)
}

/// 部分積分の境界の項 \([uv]_a^b = u(b)v(b) - u(a)v(a)\) を返します。式は厳密です。
pub fn by_parts_boundary(u: impl Fn(f64) -> f64, v: impl Fn(f64) -> f64, a: f64, b: f64) -> f64 {
    u(b) * v(b) - u(a) * v(a)
}

/// 部分積分の右辺 \([uv]_a^b - \int_a^b u'v\,dx\) を返します。積分は Simpson 則の近似です。
///
/// 積の微分 \((uv)' = u'v + uv'\) を \([a, b]\) で積分し、微分積分学の基本定理を使うと
/// \[
/// \int_a^b u v'\,dx = [uv]_a^b - \int_a^b u' v\,dx
/// \]
/// です。`du` は \(u'\) です。境界の項は [`by_parts_boundary`]、残りの積分は
/// [`simpson_rule`](crate::calculus::simpson_rule) で分割数 \(n\) です。
pub fn integrate_by_parts(
    u: impl Fn(f64) -> f64,
    du: impl Fn(f64) -> f64,
    v: impl Fn(f64) -> f64,
    a: f64,
    b: f64,
    n: usize,
) -> f64 {
    by_parts_boundary(&u, &v, a, b) - simpson_rule(|x| du(x) * v(x), a, b, n)
}

/// 置換積分の例 \(\int_0^1 2t\,e^{t^2}\,dt = e - 1\) の厳密値を返します。
///
/// \(x = g(t) = t^2\) と置くと \(g'(t) = 2t\)、\(g(0) = 0\)、\(g(1) = 1\) なので
/// \[
/// \int_0^1 e^{t^2}\cdot 2t\,dt = \int_0^1 e^x\,dx = \bigl[e^x\bigr]_0^1 = e - 1
/// \]
/// です。
pub fn exp_substitution_exact() -> f64 {
    std::f64::consts::E - 1.0
}

/// 部分積分の例 \(\int_0^1 x e^x\,dx = 1\) の厳密値を返します。
///
/// \(u = x\)、\(v = e^x\) と置くと \(u' = 1\)、\(v' = e^x\) なので
/// \[
/// \int_0^1 x e^x\,dx = \bigl[x e^x\bigr]_0^1 - \int_0^1 e^x\,dx = (e - 0) - (e - 1) = 1
/// \]
/// です。
pub fn x_exp_by_parts_exact() -> f64 {
    1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sine_ratio_tends_to_one_inside_the_bound() {
        assert!(sine_ratio(0.0).is_nan());
        let r = sine_ratio(0.1);
        assert!((r - 0.998_334_166_468_281_5).abs() < 1e-15);
        for k in 1..=5 {
            let h = 10f64.powi(-k);
            let gap = 1.0 - sine_ratio(h);
            if k <= 3 {
                assert!(gap > 0.0 && gap <= sine_ratio_gap_bound(h));
            }
            assert!((gap / sine_ratio_gap_bound(h) - 1.0).abs() < 0.01);
        }
        let delta = sine_ratio_delta(0.05);
        assert!((delta - 0.3_f64.sqrt()).abs() < 1e-15);
        assert!((sine_ratio(0.999 * delta) - 1.0).abs() < 0.05);
    }

    #[test]
    fn difference_quotient_of_square_is_two_a_plus_h() {
        let f = |x: f64| x * x;
        assert!((forward_difference(f, 1.0, 0.1) - 2.1).abs() < 1e-13);
        assert_eq!(square_difference_quotient(1.0, 0.1), 2.1);
        assert_eq!(point_slope_line(1.0, 1.0, 2.0, 3.0), 5.0);
    }

    #[test]
    fn product_and_chain_examples_at_one() {
        let product = square_sine_derivative(1.0);
        assert!((product - (2.0 * 1f64.sin() + 1f64.cos())).abs() < 1e-15);
        assert!((product - 2.223_244_275_483_729).abs() < 1e-12);
        assert!((exp_square_derivative(1.0) - 2.0 * std::f64::consts::E).abs() < 1e-14);
        let central = super::super::central_difference(square_sine, 1.0, 1e-3);
        assert!((central - product).abs() < 1e-6);
    }

    #[test]
    fn mean_value_point_of_cube_on_zero_two() {
        let m = mean_slope(|x| x * x * x, 0.0, 2.0);
        assert_eq!(m, 4.0);
        let c = mean_value_newton(|x| 3.0 * x * x, |x| 6.0 * x, m, 1.0, 4);
        assert!((c[1] - 7.0 / 6.0).abs() < 1e-15);
        assert!((c[2] - 97.0 / 84.0).abs() < 1e-15);
        assert!((c[3] - 18817.0 / 16296.0).abs() < 1e-15);
        let exact = cube_mean_value_point(0.0, 2.0);
        assert!((exact - 2.0 / 3f64.sqrt()).abs() < 1e-15);
        assert!((c[4] - exact).abs() < 1e-15);
    }

    #[test]
    fn riemann_sums_of_square_match_the_closed_forms() {
        let f = |x: f64| x * x;
        assert!((riemann_sum(f, 0.0, 1.0, 4, RiemannPoint::Right) - 15.0 / 32.0).abs() < 1e-15);
        assert!((riemann_sum(f, 0.0, 1.0, 4, RiemannPoint::Left) - 7.0 / 32.0).abs() < 1e-15);
        assert!((riemann_sum(f, 0.0, 1.0, 4, RiemannPoint::Midpoint) - 21.0 / 64.0).abs() < 1e-15);
        for point in [RiemannPoint::Left, RiemannPoint::Right, RiemannPoint::Midpoint] {
            for n in [1, 3, 10, 100, 1000] {
                let sum = riemann_sum(f, 0.0, 1.0, n, point);
                assert!((sum - square_riemann_sum_exact(n, point)).abs() < 1e-13);
            }
        }
        assert!((square_riemann_sum_exact(1000, RiemannPoint::Right) - 1.0 / 3.0 - 1.0 / 2000.0 - 1.0 / 6e6).abs() < 1e-15);
    }

    #[test]
    fn substitution_and_parts_examples() {
        let e = std::f64::consts::E;
        let left = simpson_rule(|t| 2.0 * t * (t * t).exp(), 0.0, 1.0, 2);
        assert!((left - (4.0 * 0.25f64.exp() + 2.0 * e) / 6.0).abs() < 1e-15);
        let right = integrate_by_substitution(f64::exp, |t| t * t, 0.0, 1.0, 2);
        assert!((right - (1.0 + 4.0 * 0.5f64.exp() + e) / 6.0).abs() < 1e-15);
        assert!((left - exp_substitution_exact()).abs() > (right - exp_substitution_exact()).abs());
        let direct = simpson_rule(|x| x * x.exp(), 0.0, 1.0, 2);
        assert!((direct - (2.0 * 0.5f64.exp() + e) / 6.0).abs() < 1e-15);
        let parts = integrate_by_parts(|x| x, |_| 1.0, f64::exp, 0.0, 1.0, 64);
        assert!((parts - x_exp_by_parts_exact()).abs() < 1e-9);
        assert_eq!(by_parts_boundary(|x| x, f64::exp, 0.0, 1.0), e);
    }
}
