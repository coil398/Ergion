//! Legendre 変換と Hamilton の正準方程式、Liouville の定理、正準変換と Poisson 括弧。

use std::f64::consts::PI;

/// 単振動の Lagrange 関数 \(L(q, \dot q) = \frac{1}{2} m\dot q^2 - \frac{1}{2} k q^2\) を返します。
///
/// \(q\) は変位、\(\dot q\) は速度、\(m\) は質量、\(k\) はばね定数です。
pub fn oscillator_lagrangian(mass: f64, stiffness: f64, q: f64, qdot: f64) -> f64 {
    0.5 * mass * qdot * qdot - 0.5 * stiffness * q * q
}

/// 単振動の Hamilton 関数 \(H(q, p) = \frac{p^2}{2m} + \frac{1}{2} k q^2\) を返します。
///
/// [`oscillator_lagrangian`] の正準運動量は \(p = \partial L/\partial\dot q = m\dot q\) で、\(\dot q = p/m\) です。
/// Legendre 変換 \(H = p\dot q - L\) に代入すると
/// \[
/// H = p\cdot\frac{p}{m} - \frac{1}{2} m\left(\frac{p}{m}\right)^2 + \frac{1}{2} k q^2 = \frac{p^2}{2m} + \frac{1}{2} k q^2
/// \]
/// です。
pub fn oscillator_hamiltonian(mass: f64, stiffness: f64, q: f64, p: f64) -> f64 {
    p * p / (2.0 * mass) + 0.5 * stiffness * q * q
}

/// Legendre 変換 \(H = p\dot q - L\) の値を返します。
///
/// \(p\) は正準運動量、\(\dot q\) は一般化速度、\(L\) はその点の Lagrange 関数の値です。
pub fn legendre_transform(momentum: f64, velocity: f64, lagrangian: f64) -> f64 {
    momentum * velocity - lagrangian
}

/// 単振子の正準運動量 \(p = \partial L/\partial\dot\theta = m l^2\dot\theta\) を返します。
///
/// \(L = \frac{1}{2} m l^2\dot\theta^2 - mgl(1 - \cos\theta)\) の \(\dot\theta\) による偏微分です。
/// \(m\) は質量、\(l\) は糸の長さ、\(\dot\theta\) は角速度です。
pub fn pendulum_momentum(mass: f64, length: f64, omega: f64) -> f64 {
    mass * length * length * omega
}

/// 単振子の Hamilton 関数 \(H(\theta, p) = \frac{p^2}{2ml^2} + mgl(1 - \cos\theta)\) を返します。
///
/// \(\dot\theta = p/(ml^2)\) を Legendre 変換 \(H = p\dot\theta - L\) に代入すると
/// \[
/// H = \frac{p^2}{ml^2} - \frac{1}{2} m l^2\left(\frac{p}{ml^2}\right)^2 + mgl(1 - \cos\theta) = \frac{p^2}{2ml^2} + mgl(1 - \cos\theta)
/// \]
/// です。\(g\) は重力加速度、\(\theta\) は鉛直下向きから測った振れ角です。
pub fn pendulum_hamiltonian(mass: f64, length: f64, gravity: f64, theta: f64, momentum: f64) -> f64 {
    momentum * momentum / (2.0 * mass * length * length) + mass * gravity * length * (1.0 - theta.cos())
}

/// 単振子の正準方程式の右辺 \((\dot\theta, \dot p) = (\partial H/\partial p,\ -\partial H/\partial\theta)\) を返します。
///
/// [`pendulum_hamiltonian`] を偏微分すると
/// \[
/// \dot\theta = \frac{\partial H}{\partial p} = \frac{p}{ml^2},\qquad \dot p = -\frac{\partial H}{\partial\theta} = -mgl\sin\theta
/// \]
/// です。
pub fn pendulum_flow(mass: f64, length: f64, gravity: f64, theta: f64, momentum: f64) -> [f64; 2] {
    [momentum / (mass * length * length), -mass * gravity * length * theta.sin()]
}

/// \(H = T(p) + V(q)\) の形の Hamilton 関数に対する、シンプレクティック Euler 法の1ステップです。
///
/// `velocity` は \(T'(p) = \partial H/\partial p\)、`force` は \(-V'(q) = -\partial H/\partial q\) です。
/// 運動量を先に、位置を新しい運動量で進めます。
/// \[
/// p_{n+1} = p_n - \Delta t\,V'(q_n),\qquad q_{n+1} = q_n + \Delta t\,T'(p_{n+1})
/// \]
/// この写像のヤコビ行列式は
/// \[
/// \frac{\partial q_{n+1}}{\partial q_n}\frac{\partial p_{n+1}}{\partial p_n} - \frac{\partial q_{n+1}}{\partial p_n}\frac{\partial p_{n+1}}{\partial q_n}
/// = \left(1 - \Delta t^2 T'' V''\right)\cdot 1 - \Delta t\,T''\cdot\left(-\Delta t\,V''\right) = 1
/// \]
/// で、相空間の面積を厳密に保ちます。
pub fn symplectic_euler_step(q: &mut f64, p: &mut f64, dt: f64, velocity: impl Fn(f64) -> f64, force: impl Fn(f64) -> f64) {
    *p += dt * force(*q);
    *q += dt * velocity(*p);
}

/// 単振子の Euler 法 \((\theta, p) \mapsto (\theta + \Delta t\,p/(ml^2),\ p - \Delta t\,mgl\sin\theta)\) のヤコビ行列式を返します。
///
/// ヤコビ行列は
/// \[
/// \begin{pmatrix} 1 & \Delta t/(ml^2) \\ -\Delta t\,mgl\cos\theta & 1 \end{pmatrix}
/// \]
/// なので、行列式は \(1 + \Delta t^2 \frac{g}{l}\cos\theta\) です。\(|\theta| < \pi/2\) では 1 より大きく、Euler 法は面積を広げます。
pub fn pendulum_euler_area_factor(length: f64, gravity: f64, dt: f64, theta: f64) -> f64 {
    1.0 + dt * dt * gravity / length * theta.cos()
}

/// 単振子の等エネルギー線 \(H(\theta, p) = E\) を、\(n\) 個の点の閉曲線として返します（\(0 < E < 2mgl\)）。
///
/// 折り返しの角は \(\theta_{\max} = \arccos\!\left(1 - \frac{E}{mgl}\right)\) です。\(\theta = \theta_{\max}\sin\phi\)（\(0 \le \phi \le 2\pi\)）と置き、
/// \[
/// p = \pm\sqrt{2ml^2\left(E - mgl(1 - \cos\theta)\right)}
/// \]
/// の符号を \(\cos\phi\) の符号にそろえます。\(E \ge 2mgl\) では回転する運動なので、\(-\pi \le \theta \le \pi\) の \(p > 0\) の枝を返します。
pub fn pendulum_level_set(mass: f64, length: f64, gravity: f64, energy: f64, n: usize) -> (Vec<f64>, Vec<f64>) {
    let mgl = mass * gravity * length;
    let inertia = mass * length * length;
    let momentum = |theta: f64| (2.0 * inertia * (energy - mgl * (1.0 - theta.cos()))).max(0.0).sqrt();
    let n = n.max(2);
    if energy >= 2.0 * mgl {
        let theta: Vec<f64> = (0..n).map(|i| -PI + 2.0 * PI * i as f64 / (n - 1) as f64).collect();
        let p = theta.iter().map(|&t| momentum(t)).collect();
        return (theta, p);
    }
    let theta_max = (1.0 - energy / mgl).clamp(-1.0, 1.0).acos();
    let mut qs = Vec::with_capacity(n);
    let mut ps = Vec::with_capacity(n);
    for i in 0..n {
        let phi = 2.0 * PI * i as f64 / (n - 1) as f64;
        let theta = theta_max * phi.sin();
        qs.push(theta);
        ps.push(momentum(theta).copysign(phi.cos()));
    }
    (qs, ps)
}

/// 頂点 \((x_i, y_i)\)（\(i = 0, \ldots, n-1\)）を順に結んだ多角形の符号付き面積を、靴ひもの公式で返します。
///
/// \[
/// A = \frac{1}{2}\sum_{i=0}^{n-1}\left(x_i\,y_{i+1} - x_{i+1}\,y_i\right),\qquad (x_n, y_n) = (x_0, y_0)
/// \]
/// 頂点が反時計回りなら正、時計回りなら負です。
pub fn shoelace_area(x: &[f64], y: &[f64]) -> f64 {
    assert_eq!(x.len(), y.len());
    let n = x.len();
    let mut sum = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        sum += x[i] * y[j] - x[j] * y[i];
    }
    0.5 * sum
}

/// 中心 \((q_c, p_c)\)、半径 \(r\) の円に内接する正 \(n\) 角形の頂点を、反時計回りに返します。
///
/// 頂点は \(q_i = q_c + r\cos(2\pi i/n)\)、\(p_i = p_c + r\sin(2\pi i/n)\) です。
pub fn circle_polygon(center_q: f64, center_p: f64, radius: f64, n: usize) -> (Vec<f64>, Vec<f64>) {
    let angle = |i: usize| 2.0 * PI * i as f64 / n as f64;
    ((0..n).map(|i| center_q + radius * angle(i).cos()).collect(), (0..n).map(|i| center_p + radius * angle(i).sin()).collect())
}

/// 半径 \(r\) の円に内接する正 \(n\) 角形の面積 \(A_0 = \frac{n}{2} r^2 \sin\frac{2\pi}{n}\) を返します。
///
/// 正 \(n\) 角形は、頂角 \(2\pi/n\)、2辺の長さ \(r\) の二等辺三角形 \(n\) 個からなり、一つの面積は \(\frac{1}{2} r^2\sin\frac{2\pi}{n}\) です。
/// \(n \to \infty\) で \(\pi r^2\) に近づきます。
pub fn regular_polygon_area(radius: f64, n: usize) -> f64 {
    0.5 * n as f64 * radius * radius * (2.0 * PI / n as f64).sin()
}

/// 相空間の流れ \((\dot q, \dot p) = F(q, p)\) の発散 \(\nabla\cdot F = \partial\dot q/\partial q + \partial\dot p/\partial p\) を中心差分で返します。
///
/// \[
/// \nabla\cdot F \approx \frac{F_q(q + h, p) - F_q(q - h, p)}{2h} + \frac{F_p(q, p + h) - F_p(q, p - h)}{2h}
/// \]
/// Hamilton の流れ \(F = (\partial H/\partial p, -\partial H/\partial q)\) では、厳密には
/// \(\frac{\partial^2 H}{\partial q\,\partial p} - \frac{\partial^2 H}{\partial p\,\partial q} = 0\) です。返す値は近似です。
pub fn flow_divergence(flow: impl Fn(f64, f64) -> [f64; 2], q: f64, p: f64, h: f64) -> f64 {
    (flow(q + h, p)[0] - flow(q - h, p)[0]) / (2.0 * h) + (flow(q, p + h)[1] - flow(q, p - h)[1]) / (2.0 * h)
}

/// Poisson 括弧 \(\{f, g\} = \sum_j\left(\frac{\partial f}{\partial q_j}\frac{\partial g}{\partial p_j} - \frac{\partial f}{\partial p_j}\frac{\partial g}{\partial q_j}\right)\) を、点 \((q, p)\) での中心差分で返します。
///
/// 偏微分は刻み \(h\) の中心差分
/// \[
/// \frac{\partial f}{\partial q_j} \approx \frac{f(q + h e_j, p) - f(q - h e_j, p)}{2h}
/// \]
/// で近似します（\(e_j\) は \(j\) 番目の単位ベクトル）。誤差は \(h^2\) に比例し、\(f\) と \(g\) が2次以下の多項式なら差分は厳密な偏微分に等しくなります。
pub fn poisson_bracket(f: impl Fn(&[f64], &[f64]) -> f64, g: impl Fn(&[f64], &[f64]) -> f64, q: &[f64], p: &[f64], h: f64) -> f64 {
    assert_eq!(q.len(), p.len());
    let partial = |func: &dyn Fn(&[f64], &[f64]) -> f64, j: usize, in_q: bool| {
        let (mut qa, mut pa) = (q.to_vec(), p.to_vec());
        let (mut qb, mut pb) = (q.to_vec(), p.to_vec());
        if in_q {
            qa[j] += h;
            qb[j] -= h;
        } else {
            pa[j] += h;
            pb[j] -= h;
        }
        (func(&qa, &pa) - func(&qb, &pb)) / (2.0 * h)
    };
    (0..q.len())
        .map(|j| partial(&f, j, true) * partial(&g, j, false) - partial(&f, j, false) * partial(&g, j, true))
        .sum()
}

/// 角運動量 \(\mathbf{L} = \mathbf{r}\times\mathbf{p} = (y p_z - z p_y,\ z p_x - x p_z,\ x p_y - y p_x)\) の3成分を返します。
pub fn angular_momentum_components(r: [f64; 3], p: [f64; 3]) -> [f64; 3] {
    [r[1] * p[2] - r[2] * p[1], r[2] * p[0] - r[0] * p[2], r[0] * p[1] - r[1] * p[0]]
}

/// 単振動 \(H = \frac{p^2}{2m} + \frac{1}{2} m\omega^2 q^2\) の作用・角変数 \((\theta, I)\) を返します。
///
/// \[
/// I = \frac{H}{\omega} = \frac{p^2}{2m\omega} + \frac{1}{2} m\omega q^2,\qquad \theta = \operatorname{atan2}(m\omega q,\ p)
/// \]
/// \(I\) は等エネルギーの楕円が囲む面積 \(2\pi I\) を \(2\pi\) で割った値です。\(H = \omega I\) なので
/// 正準方程式は \(\dot\theta = \partial H/\partial I = \omega\)、\(\dot I = -\partial H/\partial\theta = 0\) で、\(\theta\) は一定の速さで増えます。
pub fn action_angle(mass: f64, omega: f64, q: f64, p: f64) -> (f64, f64) {
    let action = p * p / (2.0 * mass * omega) + 0.5 * mass * omega * q * q;
    ((mass * omega * q).atan2(p), action)
}

/// 作用・角変数 \((\theta, I)\) から \((q, p)\) へ戻す変換 \(q = \sqrt{2I/(m\omega)}\sin\theta\)、\(p = \sqrt{2Im\omega}\cos\theta\) です。
///
/// [`action_angle`] の逆写像です。\(\frac{p^2}{2m\omega} + \frac{1}{2} m\omega q^2 = I\cos^2\theta + I\sin^2\theta = I\) を満たします。
pub fn action_angle_inverse(mass: f64, omega: f64, theta: f64, action: f64) -> (f64, f64) {
    ((2.0 * action / (mass * omega)).sqrt() * theta.sin(), (2.0 * action * mass * omega).sqrt() * theta.cos())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legendre_transform_of_the_oscillator_gives_its_energy() {
        let (m, k, q, qdot) = (1.0, 4.0, 0.5, 2.0);
        let p = m * qdot;
        let h = legendre_transform(p, qdot, oscillator_lagrangian(m, k, q, qdot));
        assert!((h - oscillator_hamiltonian(m, k, q, p)).abs() < 1e-15);
        assert_eq!(oscillator_hamiltonian(1.0, 4.0, 1.0, 0.0), 2.0);
    }

    #[test]
    fn pendulum_hamiltonian_is_the_legendre_transform() {
        let (m, l, g, theta, omega): (f64, f64, f64, f64, f64) = (2.0, 1.5, 9.8, 0.7, 0.3);
        let p = pendulum_momentum(m, l, omega);
        assert!((p - 2.0 * 2.25 * 0.3).abs() < 1e-15);
        let lagrangian = 0.5 * m * l * l * omega * omega - m * g * l * (1.0 - theta.cos());
        let h = legendre_transform(p, omega, lagrangian);
        assert!((h - pendulum_hamiltonian(m, l, g, theta, p)).abs() < 1e-12);
        assert!((pendulum_hamiltonian(1.0, 1.0, 1.0, 1.0, 0.0) - (1.0 - 1f64.cos())).abs() < 1e-15);
    }

    #[test]
    fn symplectic_euler_first_step_of_the_pendulum() {
        let (mut q, mut p) = (1.0, 0.0);
        symplectic_euler_step(&mut q, &mut p, 0.1, |p| p, |q| -q.sin());
        assert!((p + 0.1 * 1f64.sin()).abs() < 1e-15);
        assert!((p - -0.084_147_098_480_789_65).abs() < 1e-15);
        assert!((q - (1.0 - 0.01 * 1f64.sin())).abs() < 1e-15);
    }

    #[test]
    fn level_set_has_the_given_energy() {
        let energy = 1.0 - 1f64.cos();
        let (q, p) = pendulum_level_set(1.0, 1.0, 1.0, energy, 101);
        assert!((q[25] - 1.0).abs() < 1e-12 && p[25].abs() < 1e-6);
        for i in 0..q.len() {
            assert!((pendulum_hamiltonian(1.0, 1.0, 1.0, q[i], p[i]) - energy).abs() < 1e-12);
        }
    }

    #[test]
    fn shoelace_area_of_unit_square_and_regular_polygon() {
        assert_eq!(shoelace_area(&[0.0, 1.0, 1.0, 0.0], &[0.0, 0.0, 1.0, 1.0]), 1.0);
        let (x, y) = circle_polygon(1.2, 0.0, 0.4, 400);
        let a = shoelace_area(&x, &y);
        assert!((a - regular_polygon_area(0.4, 400)).abs() < 1e-14);
        assert!((regular_polygon_area(0.4, 400) - 200.0 * 0.16 * (PI / 200.0).sin()).abs() < 1e-15);
        assert!((regular_polygon_area(0.4, 400) - PI * 0.16).abs() < 3e-5);
    }

    #[test]
    fn symplectic_euler_keeps_polygon_area_of_linear_flow_and_euler_grows_it() {
        let (mut x, mut y) = circle_polygon(0.0, 0.0, 1.0, 64);
        let a0 = shoelace_area(&x, &y);
        let (mut ex, mut ey) = (x.clone(), y.clone());
        for _ in 0..100 {
            for i in 0..x.len() {
                symplectic_euler_step(&mut x[i], &mut y[i], 0.1, |p| p, |q| -q);
                let (q, p) = (ex[i], ey[i]);
                ex[i] = q + 0.1 * p;
                ey[i] = p - 0.1 * q;
            }
        }
        assert!((shoelace_area(&x, &y) / a0 - 1.0).abs() < 1e-12);
        assert!((shoelace_area(&ex, &ey) / a0 - 1.01f64.powi(100)).abs() < 1e-10);
        assert_eq!(pendulum_euler_area_factor(1.0, 1.0, 0.1, 0.0), 1.01);
    }

    #[test]
    fn hamiltonian_flow_has_zero_divergence() {
        let div = flow_divergence(|q, p| pendulum_flow(1.0, 1.0, 1.0, q, p), 1.2, 0.3, 1e-4);
        assert!(div.abs() < 1e-10);
        let damped = flow_divergence(|q, p| [p, -q - 0.5 * p], 1.2, 0.3, 1e-4);
        assert!((damped + 0.5).abs() < 1e-10);
    }

    #[test]
    fn canonical_brackets_and_angular_momentum() {
        let qp = poisson_bracket(|q, _| q[0], |_, p| p[0], &[0.7], &[-0.3], 1e-4);
        assert!((qp - 1.0).abs() < 1e-12);
        let lx = |q: &[f64], p: &[f64]| angular_momentum_components([q[0], q[1], q[2]], [p[0], p[1], p[2]])[0];
        let ly = |q: &[f64], p: &[f64]| angular_momentum_components([q[0], q[1], q[2]], [p[0], p[1], p[2]])[1];
        let (r, p) = ([1.0, 2.0, 3.0], [4.0, 5.0, 6.0]);
        assert_eq!(angular_momentum_components(r, p), [-3.0, 6.0, -3.0]);
        let b = poisson_bracket(lx, ly, &r, &p, 1e-4);
        assert!((b - -3.0).abs() < 1e-9);
    }

    #[test]
    fn action_angle_of_the_oscillator() {
        let (theta, action) = action_angle(1.0, 2.0, 1.0, 0.0);
        assert!((theta - PI / 2.0).abs() < 1e-15);
        assert_eq!(action, 1.0);
        let (q, p) = action_angle_inverse(1.0, 2.0, theta, action);
        assert!((q - 1.0).abs() < 1e-15 && p.abs() < 1e-15);
        let bracket = poisson_bracket(
            |q, p| action_angle(1.0, 2.0, q[0], p[0]).0,
            |q, p| action_angle(1.0, 2.0, q[0], p[0]).1,
            &[0.6],
            &[-0.8],
            1e-4,
        );
        assert!((bracket - 1.0).abs() < 1e-8);
        let inverse = poisson_bracket(
            |a, b| action_angle_inverse(1.0, 2.0, a[0], b[0]).0,
            |a, b| action_angle_inverse(1.0, 2.0, a[0], b[0]).1,
            &[0.4],
            &[1.5],
            1e-4,
        );
        assert!((inverse - 1.0).abs() < 1e-8);
    }
}
