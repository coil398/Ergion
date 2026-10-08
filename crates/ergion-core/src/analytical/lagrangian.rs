//! 拘束条件と一般化座標、仮想仕事の原理、最小作用の原理、Noether の定理。

use std::f64::consts::PI;

/// 半径 \(R\) の球面の上の点の位置 \(\mathbf{r}(\theta, \varphi)\) を返します。
///
/// 一般化座標は天頂角 \(\theta\)（\(z\) 軸からの角）と方位角 \(\varphi\)（\(x\) 軸から測った角）です。
/// 拘束条件 \(x^2 + y^2 + z^2 - R^2 = 0\) を満たす点は
/// \[
/// \mathbf{r}(\theta, \varphi) = R\,(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)
/// \]
/// と書けます。これは厳密な式です。
pub fn sphere_point(radius: f64, theta: f64, phi: f64) -> [f64; 3] {
    [radius * theta.sin() * phi.cos(), radius * theta.sin() * phi.sin(), radius * theta.cos()]
}

/// 球面の点の、一般化座標による偏微分 \(\partial\mathbf{r}/\partial q\)（ヤコビ行列）を返します。
///
/// 一般化座標 \(q = (\theta, \varphi)\) で [`sphere_point`] の各成分を偏微分すると
/// \[
/// \frac{\partial\mathbf{r}}{\partial\theta} = R\,(\cos\theta\cos\varphi,\ \cos\theta\sin\varphi,\ -\sin\theta),\qquad
/// \frac{\partial\mathbf{r}}{\partial\varphi} = R\,(-\sin\theta\sin\varphi,\ \sin\theta\cos\varphi,\ 0)
/// \]
/// です。戻り値の第 \(i\) 行は \(x, y, z\) の第 \(i\) 成分、第 \(j\) 列は \(q_j\) による偏微分で、
/// \(J_{ij} = \partial r_i/\partial q_j\) は厳密な値です。2本の列は球面の接ベクトルです。
pub fn sphere_jacobian(radius: f64, theta: f64, phi: f64) -> [[f64; 2]; 3] {
    let (st, ct) = theta.sin_cos();
    let (sp, cp) = phi.sin_cos();
    [
        [radius * ct * cp, -radius * st * sp],
        [radius * ct * sp, radius * st * cp],
        [-radius * st, 0.0],
    ]
}

/// 写像 \(\mathbf{r}(q)\) のヤコビ行列を中心差分で近似します。
///
/// 第 \(j\) 座標だけを \(\pm h\) ずらした点 \(q \pm h\mathbf{e}_j\) を用いて
/// \[
/// \frac{\partial r_i}{\partial q_j} \approx \frac{r_i(q + h\mathbf{e}_j) - r_i(q - h\mathbf{e}_j)}{2h}
/// \]
/// とします。Taylor 展開で偶数次の項が打ち消し合うので、誤差は \(\frac{h^2}{6}\,\partial^3 r_i/\partial q_j^3\) 程度で、
/// \(h\) を半分にすると約 \(1/4\) になります。戻り値の第 \(i\) 行第 \(j\) 列が近似値です。
pub fn central_jacobian(f: impl Fn(&[f64]) -> Vec<f64>, q: &[f64], h: f64) -> Vec<Vec<f64>> {
    let rows = f(q).len();
    let mut jacobian = vec![vec![0.0; q.len()]; rows];
    let mut shifted = q.to_vec();
    for j in 0..q.len() {
        shifted[j] = q[j] + h;
        let plus = f(&shifted);
        shifted[j] = q[j] - h;
        let minus = f(&shifted);
        shifted[j] = q[j];
        for i in 0..rows {
            jacobian[i][j] = (plus[i] - minus[i]) / (2.0 * h);
        }
    }
    jacobian
}

/// \(N\) 個の質点に \(k\) 個の独立なホロノミック拘束があるときの自由度 \(s = 3N - k\) を返します。
///
/// 3次元空間の \(N\) 個の質点の位置は \(3N\) 個の座標で決まります。独立な拘束条件
/// \(f_\alpha(\mathbf{r}_1, \ldots, \mathbf{r}_N, t) = 0\)（\(\alpha = 1, \ldots, k\)）の一つ一つが座標を一つずつ減らすので、
/// 独立に選べる一般化座標の数は \(s = 3N - k\) です。これは厳密な整数です。\(k > 3N\) のときは誤りを返します。
pub fn degrees_of_freedom(particles: usize, constraints: usize) -> Result<usize, String> {
    (3 * particles).checked_sub(constraints).ok_or_else(|| "constraints must not exceed 3N".into())
}

/// 球面の一般化座標の計量 \((g_{\theta\theta}, g_{\varphi\varphi})\) を返します。
///
/// 計量は接ベクトルの内積 \(g_{jk} = \frac{\partial\mathbf{r}}{\partial q_j}\cdot\frac{\partial\mathbf{r}}{\partial q_k}\) です。
/// [`sphere_jacobian`] の列から
/// \[
/// g_{\theta\theta} = R^2,\qquad g_{\varphi\varphi} = R^2\sin^2\theta,\qquad g_{\theta\varphi} = 0
/// \]
/// で、運動エネルギーは \(T = \frac{1}{2} m\,(g_{\theta\theta}\dot\theta^2 + g_{\varphi\varphi}\dot\varphi^2)\) です。
pub fn sphere_metric(radius: f64, theta: f64) -> [f64; 2] {
    [radius * radius, (radius * theta.sin()).powi(2)]
}

/// 力と仮想変位の組から仮想仕事 \(\delta W = \sum_i \mathbf{F}_i\cdot\delta\mathbf{r}_i\) を返します。
///
/// `forces` と `displacements` は、各質点の力 \(\mathbf{F}_i\) と仮想変位 \(\delta\mathbf{r}_i\) の成分を同じ順に並べた配列です。
/// 仮想変位は、時刻を止めたまま拘束を破らない微小な変位です。理想的な拘束では拘束力 \(\mathbf{R}_i\) について
/// \(\sum_i \mathbf{R}_i\cdot\delta\mathbf{r}_i = 0\) です。
pub fn virtual_work(forces: &[f64], displacements: &[f64]) -> f64 {
    assert_eq!(forces.len(), displacements.len());
    forces.iter().zip(displacements).map(|(f, d)| f * d).sum()
}

/// 傾き \(\alpha\) のなめらかな斜面の上で、水平な力で質点を静止させるのに要る力の大きさ \(F = mg\tan\alpha\) を返します。
///
/// 斜面を下る向きの単位ベクトルを \(\mathbf{t} = (\cos\alpha, -\sin\alpha)\)、仮想変位を \(\delta\mathbf{r} = \delta s\,\mathbf{t}\) とします。
/// 重力 \((0, -mg)\) と、斜面を上る側へ押す水平な力 \((-F, 0)\) の仮想仕事は
/// \[
/// \delta W = (mg\sin\alpha - F\cos\alpha)\,\delta s
/// \]
/// です。任意の \(\delta s\) で \(\delta W = 0\) となる条件から \(F = mg\tan\alpha\) が厳密に決まります。
/// 垂直抗力は \(\mathbf{t}\) に垂直なので式に入りません。
pub fn incline_holding_force(mass: f64, gravity: f64, angle: f64) -> f64 {
    mass * gravity * angle.tan()
}

/// なめらかな斜面を滑る質点の、斜面に沿った加速度 \(s'' = g\sin\alpha\) を返します。
///
/// d'Alembert の原理 \((\mathbf{F} - m\mathbf{r}'')\cdot\delta\mathbf{r} = 0\) に、斜面に沿った距離 \(s\) による
/// \(\mathbf{r}'' = s''\,\mathbf{t}\)、\(\delta\mathbf{r} = \delta s\,\mathbf{t}\)、\(\mathbf{F} = (0, -mg) + \mathbf{N}\) を代入します。
/// \(\mathbf{N}\cdot\mathbf{t} = 0\)、\(\mathbf{t}\cdot\mathbf{t} = 1\) より
/// \[
/// (mg\sin\alpha - m s'')\,\delta s = 0,\qquad s'' = g\sin\alpha
/// \]
/// です。これは厳密な一定の加速度です。
pub fn incline_acceleration(gravity: f64, angle: f64) -> f64 {
    gravity * angle.sin()
}

/// なめらかな斜面を滑る質点が受ける垂直抗力のベクトル \(\mathbf{N} = mg\cos\alpha\,(\sin\alpha, \cos\alpha)\) を返します。
///
/// 斜面の法線の単位ベクトルは \(\mathbf{n} = (\sin\alpha, \cos\alpha)\) です。法線方向には動かないので、
/// 運動方程式の法線成分 \(N - mg\cos\alpha = 0\) から大きさは \(N = mg\cos\alpha\) です。
pub fn incline_normal_force(mass: f64, gravity: f64, angle: f64) -> [f64; 2] {
    let n = mass * gravity * angle.cos();
    [n * angle.sin(), n * angle.cos()]
}

/// 長さ \(l\) の単振子の Lagrange 関数 \(L = \frac{1}{2} m l^2\dot\theta^2 - m g l (1 - \cos\theta)\) を返します。
///
/// \(\theta\) は鉛直下向きから測った振れ角、\(\dot\theta\) は角速度、\(m\) は質量、\(g\) は重力加速度です。
/// 運動エネルギーは \(T = \frac{1}{2} m (l\dot\theta)^2\)、最下点を基準にした位置エネルギーは \(V = mgl(1 - \cos\theta)\) です。
pub fn pendulum_lagrangian(mass: f64, length: f64, gravity: f64, theta: f64, omega: f64) -> f64 {
    0.5 * mass * length * length * omega * omega - mass * gravity * length * (1.0 - theta.cos())
}

/// 単振子の Euler–Lagrange 方程式から得る角加速度 \(\ddot\theta = -\frac{g}{l}\sin\theta\) を返します。
///
/// [`pendulum_lagrangian`] から \(\partial L/\partial\dot\theta = m l^2\dot\theta\)、\(\partial L/\partial\theta = -mgl\sin\theta\) です。
/// Euler–Lagrange 方程式 \(\frac{d}{dt}\frac{\partial L}{\partial\dot\theta} - \frac{\partial L}{\partial\theta} = 0\) は
/// \(m l^2\ddot\theta + mgl\sin\theta = 0\) で、\(ml^2\) で割ると \(\ddot\theta + \frac{g}{l}\sin\theta = 0\) です。
pub fn pendulum_acceleration(gravity: f64, length: f64, theta: f64) -> f64 {
    -gravity / length * theta.sin()
}

/// 算術幾何平均 \(\mathrm{AGM}(a, b)\) を返します（\(a, b > 0\)）。
///
/// \(a_0 = a\)、\(b_0 = b\) から
/// \[
/// a_{n+1} = \frac{a_n + b_n}{2},\qquad b_{n+1} = \sqrt{a_n b_n}
/// \]
/// を繰り返します。相加相乗平均の不等式により \(b_n \le b_{n+1} \le a_{n+1} \le a_n\) で、差は
/// \(a_{n+1} - b_{n+1} = \frac{(\sqrt{a_n} - \sqrt{b_n})^2}{2}\) と2乗で縮むので、数回で共通の極限に収束します。
/// \(|a_n - b_n| \le 10^{-15} a_n\) で止めた値は近似です。
pub fn arithmetic_geometric_mean(a: f64, b: f64) -> f64 {
    let (mut a, mut b) = (a, b);
    for _ in 0..64 {
        if (a - b).abs() <= 1e-15 * a {
            break;
        }
        let next = 0.5 * (a + b);
        b = (a * b).sqrt();
        a = next;
    }
    0.5 * (a + b)
}

/// 第1種完全楕円積分 \(K(k) = \int_0^{\pi/2} \frac{d\phi}{\sqrt{1 - k^2\sin^2\phi}}\) を返します（\(0 \le k < 1\)）。
///
/// Gauss の公式
/// \[
/// K(k) = \frac{\pi}{2\,\mathrm{AGM}\!\left(1, \sqrt{1 - k^2}\right)}
/// \]
/// を [`arithmetic_geometric_mean`] で計算します。\(K(0) = \pi/2\) です。
pub fn elliptic_k(k: f64) -> f64 {
    PI / (2.0 * arithmetic_geometric_mean(1.0, (1.0 - k * k).sqrt()))
}

/// 振幅 \(\theta_0\) の単振子の周期 \(T = 4\sqrt{l/g}\,K\!\left(\sin\frac{\theta_0}{2}\right)\) を返します（\(0 < \theta_0 < \pi\)）。
///
/// エネルギー保存 \(\frac{1}{2} l^2\dot\theta^2 - g l\cos\theta = -g l\cos\theta_0\) から
/// \(\dot\theta^2 = \frac{2g}{l}(\cos\theta - \cos\theta_0) = \frac{4g}{l}\left(k^2 - \sin^2\frac{\theta}{2}\right)\)、\(k = \sin\frac{\theta_0}{2}\) です。
/// 最下点から \(\theta_0\) までの時間は周期の \(1/4\) なので、\(\sin\frac{\theta}{2} = k\sin\phi\) と置換して
/// \[
/// \frac{T}{4} = \int_0^{\theta_0} \frac{d\theta}{\dot\theta} = \sqrt{\frac{l}{g}}\int_0^{\pi/2}\frac{d\phi}{\sqrt{1 - k^2\sin^2\phi}} = \sqrt{\frac{l}{g}}\,K(k)
/// \]
/// です。振幅が小さいと \(K \to \pi/2\) で、\(T \to 2\pi\sqrt{l/g}\) です。
pub fn pendulum_period(length: f64, gravity: f64, amplitude: f64) -> f64 {
    4.0 * (length / gravity).sqrt() * elliptic_k((0.5 * amplitude).sin())
}

/// Jacobi の楕円関数 \(\mathrm{sn}(u, k)\) と \(\mathrm{cn}(u, k)\) を返します（\(0 \le k < 1\)）。
///
/// 算術幾何平均の列 \(a_0 = 1\)、\(b_0 = \sqrt{1 - k^2}\)、\(c_n = (a_{n-1} - b_{n-1})/2\) を \(c_N\) が小さくなるまで作り、
/// \(\phi_N = 2^N a_N u\) から
/// \[
/// \phi_{n-1} = \frac{1}{2}\left(\phi_n + \arcsin\!\left(\frac{c_n}{a_n}\sin\phi_n\right)\right)
/// \]
/// と戻って \(\mathrm{sn} = \sin\phi_0\)、\(\mathrm{cn} = \cos\phi_0\) とします（降下 Landen 変換）。値は近似です。
pub fn jacobi_sn_cn(u: f64, k: f64) -> (f64, f64) {
    let mut a = vec![1.0];
    let mut c = vec![k];
    let mut b = (1.0 - k * k).sqrt();
    while c.last().is_some_and(|v| v.abs() > 1e-16) && a.len() < 40 {
        let an = *a.last().unwrap();
        a.push(0.5 * (an + b));
        c.push(0.5 * (an - b));
        b = (an * b).sqrt();
    }
    let n = a.len() - 1;
    let mut phi = 2f64.powi(n as i32) * a[n] * u;
    for i in (1..=n).rev() {
        phi = 0.5 * (phi + (c[i] / a[i] * phi.sin()).asin());
    }
    phi.sin_cos()
}

/// 振幅 \(\theta_0\) で静止から放した単振子の厳密解 \((\theta(t), \dot\theta(t))\) を返します。
///
/// \(\omega_0 = \sqrt{g/l}\)、\(k = \sin\frac{\theta_0}{2}\)、\(K = K(k)\) とすると
/// \[
/// \theta(t) = 2\arcsin\!\big(k\,\mathrm{sn}(K - \omega_0 t, k)\big),\qquad \dot\theta(t) = -2k\omega_0\,\mathrm{cn}(K - \omega_0 t, k)
/// \]
/// です。\(t = 0\) で \(\mathrm{sn}(K) = 1\) なので \(\theta = \theta_0\)、\(\mathrm{cn}(K) = 0\) なので \(\dot\theta = 0\) です。
/// \(\mathrm{sn}\) の周期 \(4K\) が時間の周期 \(4K/\omega_0\) を与え、[`pendulum_period`] と一致します。
pub fn pendulum_angle(length: f64, gravity: f64, amplitude: f64, time: f64) -> (f64, f64) {
    let omega0 = (gravity / length).sqrt();
    let k = (0.5 * amplitude).sin();
    let (sn, cn) = jacobi_sn_cn(elliptic_k(k) - omega0 * time, k);
    (2.0 * (k * sn).clamp(-1.0, 1.0).asin(), -2.0 * k * omega0 * cn)
}

/// 等間隔の時刻 \(t_i = i\,\Delta t\) の振れ角の列 \(q_0, \ldots, q_n\) に対する、単振子の離散的な作用 \(S[q]\) を返します。
///
/// 区間 \([t_i, t_{i+1}]\) では角速度を差分 \((q_{i+1} - q_i)/\Delta t\) とし、位置エネルギーを両端の平均で置きます。
/// \[
/// S[q] = \sum_{i=0}^{n-1}\left[\frac{1}{2} m l^2\left(\frac{q_{i+1} - q_i}{\Delta t}\right)^2 - \frac{V(q_i) + V(q_{i+1})}{2}\right]\Delta t,\qquad V(q) = mgl(1 - \cos q)
/// \]
/// これは作用積分 \(\int L\,dt\) を台形則で近似した値で、誤差は \(\Delta t^2\) に比例します。
pub fn discrete_action(path: &[f64], dt: f64, mass: f64, length: f64, gravity: f64) -> f64 {
    let potential = |q: f64| mass * gravity * length * (1.0 - q.cos());
    path.windows(2)
        .map(|w| {
            let rate = (w[1] - w[0]) / dt;
            (0.5 * mass * length * length * rate * rate - 0.5 * (potential(w[0]) + potential(w[1]))) * dt
        })
        .sum()
}

/// 時刻 \(t_0, t_1\) で値が \(y_0, y_1\) のとき、その間で \(y = 0\) を横切る時刻を線形補間で返します。
///
/// \(y_0\) と \(y_1\) の符号が異なるとき（または \(y_1 = 0\) のとき）、2点を結ぶ直線の根
/// \[
/// t_\ast = t_0 + (t_1 - t_0)\,\frac{y_0}{y_0 - y_1}
/// \]
/// を返します。横切らないときは `None` です。誤差は刻み幅の2乗に比例する近似です。
pub fn zero_crossing_time(t0: f64, y0: f64, t1: f64, y1: f64) -> Option<f64> {
    if y0 != 0.0 && (y0 < 0.0) != (y1 < 0.0) || y1 == 0.0 && y0 != 0.0 {
        Some(t0 + (t1 - t0) * y0 / (y0 - y1))
    } else {
        None
    }
}

/// 振動の 0 を横切る時刻の列 \(t_1 < t_2 < \cdots < t_n\) から周期を求めます。
///
/// 隣り合う横切りの間隔は半周期なので、最初と最後の横切りの間隔を半周期の個数 \(n - 1\) で割って
/// \[
/// T \approx \frac{2\,(t_n - t_1)}{n - 1}
/// \]
/// とします。横切りが2回未満のときは `None` です。
pub fn period_from_crossings(times: &[f64]) -> Option<f64> {
    if times.len() < 2 {
        return None;
    }
    Some(2.0 * (times[times.len() - 1] - times[0]) / (times.len() - 1) as f64)
}

/// 中心力 \(\mathbf{F} = -k\,\mathbf{r}/r^3\)（引力の強さ \(k > 0\)）を受ける質量 \(m\) の質点の加速度 \(\mathbf{a} = \mathbf{F}/m\) を `acceleration` に書きます。
///
/// 位置エネルギーは \(V(r) = -k/r\) で、\(\mathbf{F} = -\nabla V = -\frac{k}{r^2}\hat{\mathbf{r}}\) です。
/// Lagrange 関数 \(L = \frac{1}{2} m |\dot{\mathbf{r}}|^2 + k/r\) は原点のまわりの回転で変わりません。
pub fn central_force_acceleration(strength: f64, mass: f64, position: &[f64], acceleration: &mut [f64]) {
    let r2: f64 = position.iter().map(|x| x * x).sum();
    let scale = -strength / (mass * r2 * r2.sqrt());
    for (a, x) in acceleration.iter_mut().zip(position) {
        *a = scale * x;
    }
}

/// 中心力場の力学的エネルギー \(E = \frac{1}{2} m |\mathbf{v}|^2 - k/r\) を返します。
///
/// Lagrange 関数 \(L = \frac{1}{2} m |\mathbf{v}|^2 + k/r\) は時刻を陽に含まないので、Noether の定理により
/// \(E = \sum_j \dot q_j \frac{\partial L}{\partial \dot q_j} - L\) は保存します。\(\dot q_j\,\partial L/\partial\dot q_j = m|\mathbf{v}|^2\) なので
/// \(E = m|\mathbf{v}|^2 - L = \frac{1}{2} m |\mathbf{v}|^2 - k/r\) です。
pub fn central_force_energy(mass: f64, strength: f64, position: &[f64], velocity: &[f64]) -> f64 {
    let v2: f64 = velocity.iter().map(|v| v * v).sum();
    let r = position.iter().map(|x| x * x).sum::<f64>().sqrt();
    0.5 * mass * v2 - strength / r
}

/// 平面の原点のまわりの回転 \(\mathbf{r} \to \mathbf{r} + \varepsilon\,\mathbf{K}(\mathbf{r})\) の生成元 \(\mathbf{K} = (-y, x)\) を返します。
///
/// 角 \(\varepsilon\) の回転 \((x\cos\varepsilon - y\sin\varepsilon,\ x\sin\varepsilon + y\cos\varepsilon)\) を \(\varepsilon\) で微分して
/// \(\varepsilon = 0\) と置くと \((-y, x)\) です。
pub fn rotation_generator(position: &[f64]) -> [f64; 2] {
    [-position[1], position[0]]
}

/// Noether の保存量 \(I = \sum_j \frac{\partial L}{\partial \dot q_j} K_j(q) = \sum_j p_j K_j\) を返します。
///
/// `momentum` は一般化運動量 \(p_j = \partial L/\partial\dot q_j\)、`generator` は変換 \(q_j \to q_j + \varepsilon K_j(q)\) の \(K_j\) です。
/// 平面の質点で \(p = m\mathbf{v}\)、回転の生成元 \(\mathbf{K} = (-y, x)\)（[`rotation_generator`]）なら
/// \(I = m(x v_y - y v_x)\) で、角運動量です。
pub fn noether_charge(momentum: &[f64], generator: &[f64]) -> f64 {
    momentum.iter().zip(generator).map(|(p, k)| p * k).sum()
}

/// 平面の質点の原点のまわりの角運動量 \(L_z = m(x v_y - y v_x)\) を返します。
///
/// [`noether_charge`] に \(p = m\mathbf{v}\) と \(\mathbf{K} = (-y, x)\) を入れた値と同じです。
pub fn angular_momentum(mass: f64, position: &[f64], velocity: &[f64]) -> f64 {
    mass * (position[0] * velocity[1] - position[1] * velocity[0])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() <= tol
    }

    #[test]
    fn sphere_jacobian_matches_hand_example_and_central_differences() {
        let (r, th, ph) = (2.0, PI / 3.0, PI / 6.0);
        let p = sphere_point(r, th, ph);
        assert!(close(p[0], 1.5, 1e-15) && close(p[1], 3f64.sqrt() / 2.0, 1e-15) && close(p[2], 1.0, 1e-15));
        let j = sphere_jacobian(r, th, ph);
        let s3 = 3f64.sqrt();
        let expected = [[s3 / 2.0, -s3 / 2.0], [0.5, 1.5], [-s3, 0.0]];
        for i in 0..3 {
            for k in 0..2 {
                assert!(close(j[i][k], expected[i][k], 1e-15));
            }
        }
        let f = |q: &[f64]| sphere_point(r, q[0], q[1]).to_vec();
        let numeric = central_jacobian(f, &[th, ph], 1e-3);
        for i in 0..3 {
            for k in 0..2 {
                assert!(close(numeric[i][k], expected[i][k], 1e-6));
            }
        }
        let metric = sphere_metric(r, th);
        assert!(close(metric[0], 4.0, 1e-14) && close(metric[1], 3.0, 1e-14));
        let cross: f64 = (0..3).map(|i| j[i][0] * j[i][1]).sum();
        assert!(cross.abs() < 1e-15);
    }

    #[test]
    fn central_difference_error_is_quadratic() {
        let f = |q: &[f64]| sphere_point(1.0, q[0], q[1]).to_vec();
        let exact = sphere_jacobian(1.0, 1.0, 0.5);
        let e1 = (central_jacobian(f, &[1.0, 0.5], 1e-2)[0][0] - exact[0][0]).abs();
        let e2 = (central_jacobian(f, &[1.0, 0.5], 5e-3)[0][0] - exact[0][0]).abs();
        assert!(close(e1 / e2, 4.0, 1e-3));
    }

    #[test]
    fn degrees_of_freedom_counts() {
        assert_eq!(degrees_of_freedom(1, 1), Ok(1 * 3 - 1));
        assert_eq!(degrees_of_freedom(2, 4), Ok(2));
        assert!(degrees_of_freedom(1, 4).is_err());
    }

    #[test]
    fn incline_virtual_work_balances() {
        let (m, g, a) = (2.0, 9.8, PI / 6.0);
        let f = incline_holding_force(m, g, a);
        assert!(close(f, 19.6 / 3f64.sqrt(), 1e-12));
        assert!(close(incline_acceleration(g, a), 4.9, 1e-12));
        let n = incline_normal_force(m, g, a);
        let dr = [a.cos(), -a.sin()];
        assert!(virtual_work(&n, &dr).abs() < 1e-14);
        let total = [n[0] - f, n[1] - m * g];
        assert!(virtual_work(&total, &dr).abs() < 1e-13);
        assert!(close(n[0].hypot(n[1]), 9.8 * 3f64.sqrt(), 1e-12));
    }

    #[test]
    fn agm_and_period_match_hand_values() {
        assert!(close(arithmetic_geometric_mean(1.0, 0.5f64.sqrt()), 0.847_213_084_793_979, 1e-14));
        assert!(close(elliptic_k(0.0), PI / 2.0, 1e-15));
        assert!(close(elliptic_k(0.5f64.sqrt()), 1.854_074_677_301_372, 1e-13));
        assert!(close(pendulum_period(1.0, 1.0, PI / 2.0), 7.416_298_709_205_487, 1e-12));
        assert!(close(pendulum_period(1.0, 1.0, 1e-6), 2.0 * PI, 1e-10));
    }

    #[test]
    fn exact_pendulum_satisfies_energy_and_period() {
        let (l, g, a) = (1.0, 1.0, PI / 2.0);
        let t = pendulum_period(l, g, a);
        let (th0, w0) = pendulum_angle(l, g, a, 0.0);
        assert!(close(th0, a, 1e-12) && w0.abs() < 1e-12);
        let (th, _) = pendulum_angle(l, g, a, t);
        assert!(close(th, a, 1e-9));
        let (th, _) = pendulum_angle(l, g, a, 0.25 * t);
        assert!(th.abs() < 1e-12);
        for i in 0..20 {
            let (th, w) = pendulum_angle(l, g, a, 0.37 * i as f64);
            let energy = 0.5 * w * w - (g / l) * th.cos();
            assert!(close(energy, 0.0, 1e-12));
        }
        assert!(close(pendulum_acceleration(g, l, PI / 2.0), -1.0, 1e-15));
        assert!(close(pendulum_lagrangian(1.0, 1.0, 1.0, PI / 2.0, 1.0), -0.5, 1e-15));
    }

    #[test]
    fn action_is_stationary_on_the_true_path() {
        let (l, g, a) = (1.0, 1.0, PI / 2.0);
        let quarter = 0.25 * pendulum_period(l, g, a);
        let n = 400;
        let dt = quarter / n as f64;
        let path: Vec<f64> = (0..=n).map(|i| pendulum_angle(l, g, a, i as f64 * dt).0).collect();
        let eta: Vec<f64> = (0..=n).map(|i| (PI * i as f64 / n as f64).sin()).collect();
        let s = |e: f64| discrete_action(&path.iter().zip(&eta).map(|(q, h)| q + e * h).collect::<Vec<_>>(), dt, 1.0, l, g);
        let slope = (s(1e-3) - s(-1e-3)) / 2e-3;
        assert!(slope.abs() < 1e-4);
        assert!(s(0.1) > s(0.0) && s(-0.1) > s(0.0));
    }

    #[test]
    fn crossings_give_period() {
        assert_eq!(zero_crossing_time(0.0, 1.0, 1.0, -1.0), Some(0.5));
        assert_eq!(zero_crossing_time(0.0, 1.0, 1.0, 2.0), None);
        assert_eq!(period_from_crossings(&[1.0, 2.0, 3.0]), Some(2.0));
        assert_eq!(period_from_crossings(&[1.0]), None);
    }

    #[test]
    fn noether_charge_is_angular_momentum() {
        let (m, k) = (1.0, 1.0);
        let r = [1.0, 0.0];
        let v = [0.0, 1.2];
        assert!(close(central_force_energy(m, k, &r, &v), -0.28, 1e-15));
        let p = [m * v[0], m * v[1]];
        assert!(close(noether_charge(&p, &rotation_generator(&r)), 1.2, 1e-15));
        assert!(close(angular_momentum(m, &[0.3, -0.7], &[1.1, 0.4]), 0.3 * 0.4 + 0.7 * 1.1, 1e-15));
        let mut acc = [0.0; 2];
        central_force_acceleration(k, m, &[0.0, 2.0], &mut acc);
        assert!(close(acc[0], 0.0, 1e-15) && close(acc[1], -0.25, 1e-15));
    }
}
