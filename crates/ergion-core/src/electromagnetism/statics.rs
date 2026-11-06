//! Coulomb の法則、静電ポテンシャル、Gauss の法則、定常電流と静磁場。
//!
//! 静電場の関数は \(\frac{1}{4\pi\varepsilon_0} = 1\)（したがって \(\varepsilon_0 = \frac{1}{4\pi}\)）の単位で書きます。
//! 静磁場の関数は \(\frac{\mu_0}{4\pi} = 1\)（したがって \(\mu_0 = 4\pi\)）の単位で書きます。

use std::f64::consts::PI;

use crate::calculus::{central_partial_x, central_partial_y, simpson_rule};

/// 平面 \(z = 0\) の点 \((x, y)\) に置いた点電荷 \(q\)。
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PointCharge {
    pub q: f64,
    pub x: f64,
    pub y: f64,
}

/// 点電荷の組が平面上の点 \(\mathbf{r} = (x, y)\) に作る電場 \(\mathbf{E} = (E_x, E_y)\) を返します。
///
/// \(\frac{1}{4\pi\varepsilon_0} = 1\) の単位で、電荷 \(q_i\) の位置を \(\mathbf{r}_i\) とすると、重ね合わせの原理により
/// \[
/// \mathbf{E}(\mathbf{r}) = \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|^3}\,(\mathbf{r} - \mathbf{r}_i)
/// \]
/// です。各項は点電荷1個の Coulomb 場で、この値は厳密です。電荷の位置では値を定めません（無限大になります）。
pub fn coulomb_field(charges: &[PointCharge], x: f64, y: f64) -> (f64, f64) {
    charges.iter().fold((0.0, 0.0), |(ex, ey), c| {
        let (dx, dy) = (x - c.x, y - c.y);
        let r3 = (dx * dx + dy * dy).powf(1.5);
        (ex + c.q * dx / r3, ey + c.q * dy / r3)
    })
}

/// 点電荷の組が点 \((x, y)\) に作る静電ポテンシャル \(\phi\) を返します。
///
/// \(\frac{1}{4\pi\varepsilon_0} = 1\) の単位で
/// \[
/// \phi(\mathbf{r}) = \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|}
/// \]
/// です。無限遠で \(\phi = 0\) となるように基準をとっています。この値は厳密で、\(\mathbf{E} = -\nabla\phi\) が [`coulomb_field`] に一致します。
pub fn coulomb_potential(charges: &[PointCharge], x: f64, y: f64) -> f64 {
    charges.iter().map(|c| c.q / ((x - c.x).powi(2) + (y - c.y).powi(2)).sqrt()).sum()
}

/// 電荷がすべて \(x\) 軸上にあるとき、電気力線に沿って一定な量 \(\Psi\) を返します。
///
/// 電荷 \(q_i\) が \((x_i, 0)\) にあるとき
/// \[
/// \Psi(x, y) = \sum_i q_i\,\frac{x - x_i}{|\mathbf{r} - \mathbf{r}_i|}
/// \]
/// です。場は \(x\) 軸のまわりに回転対称なので、\(x\) 軸を軸とする半径 \(|y|\) の円を貫く電束は \(2\pi\sum_i q_i (1 - \cos\theta_i)\)
/// （\(\cos\theta_i = \frac{x - x_i}{|\mathbf{r} - \mathbf{r}_i|}\)）です。電気力線は電束の面を横切らないので、力線に沿って \(\Psi\) は変わりません。
/// たどった力線の上で \(\Psi\) がどれだけ動いたかが、力線を数値でたどったときの差になります。
pub fn axial_flux_function(charges: &[PointCharge], x: f64, y: f64) -> f64 {
    charges.iter().map(|c| c.q * (x - c.x) / ((x - c.x).powi(2) + (y - c.y).powi(2)).sqrt()).sum()
}

fn unit(v: (f64, f64)) -> Option<(f64, f64)> {
    let n = v.0.hypot(v.1);
    (n > 0.0 && n.is_finite()).then(|| (v.0 / n, v.1 / n))
}

fn rk4_unit(direction: &impl Fn(f64, f64) -> Option<(f64, f64)>, p: (f64, f64), ds: f64) -> Option<(f64, f64)> {
    let k1 = direction(p.0, p.1)?;
    let k2 = direction(p.0 + 0.5 * ds * k1.0, p.1 + 0.5 * ds * k1.1)?;
    let k3 = direction(p.0 + 0.5 * ds * k2.0, p.1 + 0.5 * ds * k2.1)?;
    let k4 = direction(p.0 + ds * k3.0, p.1 + ds * k3.1)?;
    Some((
        p.0 + ds / 6.0 * (k1.0 + 2.0 * k2.0 + 2.0 * k3.0 + k4.0),
        p.1 + ds / 6.0 * (k1.1 + 2.0 * k2.1 + 2.0 * k3.1 + k4.1),
    ))
}

fn inside(p: (f64, f64), bounds: [f64; 4]) -> bool {
    p.0 >= bounds[0] && p.0 <= bounds[1] && p.1 >= bounds[2] && p.1 <= bounds[3]
}

/// 点 \((x_0, y_0)\) から電気力線を古典的 RK4 でたどり、通った点の列を返します。
///
/// 電気力線は各点で電場に接する曲線です。弧長 \(s\) を媒介変数にすると
/// \[
/// \frac{d\mathbf{r}}{ds} = \frac{\mathbf{E}(\mathbf{r})}{|\mathbf{E}(\mathbf{r})|}
/// \]
/// で、これを刻み \(\Delta s\) の古典的 RK4 で解きます。点が範囲 `bounds` \(= [x_{\min}, x_{\max}, y_{\min}, y_{\max}]\) を出るか、
/// どれかの電荷から距離 `stop` 未満に入るか、`max_steps` 歩進んだところで止めます。点の列は近似です。
pub fn field_line(charges: &[PointCharge], x0: f64, y0: f64, ds: f64, max_steps: usize, bounds: [f64; 4], stop: f64) -> Vec<(f64, f64)> {
    let direction = |x: f64, y: f64| unit(coulomb_field(charges, x, y));
    let mut points = vec![(x0, y0)];
    let mut p = (x0, y0);
    for _ in 0..max_steps {
        let Some(next) = rk4_unit(&direction, p, ds) else { break };
        p = next;
        points.push(p);
        let near = charges.iter().any(|c| (p.0 - c.x).hypot(p.1 - c.y) < stop);
        if near || !inside(p, bounds) {
            break;
        }
    }
    points
}

/// 点 \((x_0, y_0)\) を通る等電位線を古典的 RK4 でたどり、通った点の列を返します。
///
/// 等電位線 \(\phi = \phi(x_0, y_0)\) の接線は \(\nabla\phi = -\mathbf{E}\) に垂直なので、弧長 \(s\) について
/// \[
/// \frac{d\mathbf{r}}{ds} = \frac{(-E_y,\ E_x)}{|\mathbf{E}|}
/// \]
/// を刻み \(\Delta s\) の古典的 RK4 で解きます。出発点の近くへ戻れば閉じた曲線として止め、範囲 `bounds` を出たときは逆向きにもたどって
/// 一本の曲線につなぎます。点の列は近似です。
pub fn equipotential_line(charges: &[PointCharge], x0: f64, y0: f64, ds: f64, max_steps: usize, bounds: [f64; 4]) -> Vec<(f64, f64)> {
    let trace = |sign: f64| {
        let direction = |x: f64, y: f64| {
            let (ex, ey) = coulomb_field(charges, x, y);
            unit((-sign * ey, sign * ex))
        };
        let mut points = vec![(x0, y0)];
        let mut p = (x0, y0);
        for step in 0..max_steps {
            let Some(next) = rk4_unit(&direction, p, ds) else { return (points, false) };
            p = next;
            if step > 8 && (p.0 - x0).hypot(p.1 - y0) < ds {
                points.push((x0, y0));
                return (points, true);
            }
            points.push(p);
            if !inside(p, bounds) {
                return (points, false);
            }
        }
        (points, false)
    };
    let (forward, closed) = trace(1.0);
    if closed {
        return forward;
    }
    let (mut backward, _) = trace(-1.0);
    backward.reverse();
    backward.pop();
    backward.extend(forward);
    backward
}

/// 静電ポテンシャルの中心差分から、電場の近似 \(\mathbf{E} \approx -(D_x\phi,\ D_y\phi)\) を返します。
///
/// 刻みを \(h\) として
/// \[
/// D_x\phi = \frac{\phi(x + h, y) - \phi(x - h, y)}{2h},\qquad D_y\phi = \frac{\phi(x, y + h) - \phi(x, y - h)}{2h}
/// \]
/// です。差は \(h\) の2次で、この値は電場の近似です。たとえば電荷 \(+1\) を \((-1, 0)\)、\(-1\) を \((1, 0)\) に置くと、原点では
/// \(\phi(\pm h, 0) = \mp\frac{2h}{1 - h^2}\) なので \(-D_x\phi = \frac{2}{1 - h^2}\) で、厳密な \(E_x = 2\) との差は \(\frac{2h^2}{1 - h^2}\) です。
pub fn potential_gradient_field(charges: &[PointCharge], x: f64, y: f64, h: f64) -> (f64, f64) {
    let phi = |x: f64, y: f64| coulomb_potential(charges, x, y);
    (-central_partial_x(phi, x, y, h), -central_partial_y(phi, x, y, h))
}

/// 曲線 \(\mathbf{r}(t)\)（\(0 \le t \le 1\)）に沿った電場の線積分 \(\int_A^B \mathbf{E}\cdot d\mathbf{r}\) を Simpson 則で近似します。
///
/// `path(t)` は位置 \(\mathbf{r}(t)\) と速度 \(\mathbf{r}'(t)\) を返します。\(A = \mathbf{r}(0)\)、\(B = \mathbf{r}(1)\) として
/// \[
/// \int_A^B \mathbf{E}\cdot d\mathbf{r} = \int_0^1 \mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t)\,dt \approx S_n
/// \]
/// です（\(S_n\) は \(n\) 等分の Simpson 則、\(n\) は正の偶数）。\(\mathbf{E} = -\nabla\phi\) なので厳密な値は経路によらず \(\phi(A) - \phi(B)\) です。
/// この値は近似です。
pub fn field_line_integral(charges: &[PointCharge], path: impl Fn(f64) -> ((f64, f64), (f64, f64)), n: usize) -> f64 {
    simpson_rule(|t| {
        let ((x, y), (dx, dy)) = path(t);
        let (ex, ey) = coulomb_field(charges, x, y);
        ex * dx + ey * dy
    }, 0.0, 1.0, n)
}

/// 点 `source` にある点電荷 \(q\) が空間の点 \(\mathbf{r}\) に作る電場 \(\mathbf{E} = \frac{q}{|\mathbf{r} - \mathbf{r}_q|^3}(\mathbf{r} - \mathbf{r}_q)\) を返します。
///
/// \(\frac{1}{4\pi\varepsilon_0} = 1\) の単位です。この値は厳密です。
pub fn point_charge_field_3d(q: f64, source: [f64; 3], r: [f64; 3]) -> [f64; 3] {
    let d = [r[0] - source[0], r[1] - source[1], r[2] - source[2]];
    let r3 = (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]).powf(1.5);
    [q * d[0] / r3, q * d[1] / r3, q * d[2] / r3]
}

fn dot3(a: [f64; 3], b: [f64; 3]) -> f64 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

fn cross3(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/// Gauss の法則が与える、閉曲面を外向きに貫く電束の厳密な値 \(\Phi = \frac{Q_{\mathrm{enclosed}}}{\varepsilon_0} = 4\pi Q_{\mathrm{enclosed}}\) を返します。
///
/// \(\frac{1}{4\pi\varepsilon_0} = 1\) の単位なので \(\frac{1}{\varepsilon_0} = 4\pi\) です。
pub fn gauss_flux(enclosed: f64) -> f64 {
    4.0 * PI * enclosed
}

/// 点電荷 \(q\)（位置 `charge`）の電場が、中心 `center`、半径 \(R\) の球面を外向きに貫く電束を中点則で近似します。
///
/// 球面を極角 \(\theta\) と方位角 \(\varphi\) で \(\mathbf{r} = \mathbf{c} + R(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)\) と表すと、
/// 外向きの単位法線は \(\mathbf{n} = (\mathbf{r} - \mathbf{c})/R\)、面積要素は \(dS = R^2\sin\theta\,d\theta\,d\varphi\) です。
/// \(\theta\) を \(n\) 等分、\(\varphi\) を \(2n\) 等分し、各小区画の中点 \((\theta_i, \varphi_j)\) で
/// \[
/// \Phi \approx \sum_{i=0}^{n-1}\sum_{j=0}^{2n-1} \mathbf{E}(\mathbf{r}_{ij})\cdot\mathbf{n}_{ij}\,R^2\sin\theta_i\,\Delta\theta\,\Delta\varphi,
/// \qquad \Delta\theta = \frac{\pi}{n},\ \Delta\varphi = \frac{\pi}{n}
/// \]
/// とします。電荷が球の中心にあれば \(\mathbf{E}\cdot\mathbf{n} = q/R^2\) なので、和は \(2\pi q\,\Delta\theta\sum_i \sin\theta_i\) です（\(n = 1\) では \(2\pi^2 q\)）。
/// この値は近似です。
pub fn sphere_flux_midpoint(q: f64, charge: [f64; 3], center: [f64; 3], radius: f64, n: usize) -> f64 {
    let (dt, dp) = (PI / n as f64, PI / n as f64);
    let mut sum = 0.0;
    for i in 0..n {
        let theta = (i as f64 + 0.5) * dt;
        for j in 0..2 * n {
            let phi = (j as f64 + 0.5) * dp;
            let normal = [theta.sin() * phi.cos(), theta.sin() * phi.sin(), theta.cos()];
            let r = [center[0] + radius * normal[0], center[1] + radius * normal[1], center[2] + radius * normal[2]];
            sum += dot3(point_charge_field_3d(q, charge, r), normal) * radius * radius * theta.sin() * dt * dp;
        }
    }
    sum
}

/// 点電荷 \(q\)（位置 `charge`）の電場が、中心 `center`、一辺 \(2a\) の立方体の表面を外向きに貫く電束を中点則で近似します。
///
/// 6枚の面それぞれを \(n \times n\) の正方形に分け、一辺 \(\Delta = 2a/n\) の正方形の中心 \(\mathbf{r}_k\) で
/// \[
/// \Phi \approx \sum_{\text{面}}\sum_{k} \mathbf{E}(\mathbf{r}_k)\cdot\mathbf{n}\,\Delta^2
/// \]
/// とします（\(\mathbf{n}\) は面の外向き単位法線）。電荷が中心にあり \(n = 1\) のときは、各面の中心で \(\mathbf{E}\cdot\mathbf{n} = q/a^2\)、面積 \(4a^2\) なので
/// 和は \(6 \cdot 4q = 24q\) です。この値は近似です。
pub fn cube_flux_midpoint(q: f64, charge: [f64; 3], center: [f64; 3], half: f64, n: usize) -> f64 {
    let delta = 2.0 * half / n as f64;
    let mut sum = 0.0;
    for axis in 0..3 {
        for sign in [-1.0, 1.0] {
            let (u, v) = ((axis + 1) % 3, (axis + 2) % 3);
            let mut normal = [0.0; 3];
            normal[axis] = sign;
            for i in 0..n {
                for j in 0..n {
                    let mut r = center;
                    r[axis] += sign * half;
                    r[u] += -half + (i as f64 + 0.5) * delta;
                    r[v] += -half + (j as f64 + 0.5) * delta;
                    sum += dot3(point_charge_field_3d(q, charge, r), normal) * delta * delta;
                }
            }
        }
    }
    sum
}

/// 全電荷 \(Q\) が半径 \(a\) の球に一様に分布しているとき、中心から距離 \(r\) の電場の大きさを返します。
///
/// 中心が同じ半径 \(r\) の球面に Gauss の法則を当てます。対称性から \(\mathbf{E}\) は動径方向で大きさ \(E(r)\) は面上で一定なので、
/// \(4\pi r^2 E(r) = 4\pi Q_{\mathrm{enclosed}}\)（\(\frac{1}{\varepsilon_0} = 4\pi\)）です。内側では \(Q_{\mathrm{enclosed}} = Q r^3/a^3\) なので
/// \[
/// E(r) = \begin{cases} \dfrac{Q r}{a^3} & (r \le a) \\ \dfrac{Q}{r^2} & (r > a) \end{cases}
/// \]
/// です。この値は厳密です。
pub fn uniform_ball_field(q: f64, a: f64, r: f64) -> f64 {
    if r <= a { q * r / (a * a * a) } else { q / (r * r) }
}

/// 折れ線の導線を流れる電流 \(I\) が点 \(\mathbf{r}\) に作る磁束密度を、Biot–Savart の法則の中点則で近似します。
///
/// \(\frac{\mu_0}{4\pi} = 1\) の単位です。頂点 \(\mathbf{p}_0, \ldots, \mathbf{p}_N\) を結ぶ線分 \(\Delta\mathbf{l}_k = \mathbf{p}_{k+1} - \mathbf{p}_k\) ごとに、
/// 中点 \(\mathbf{m}_k = \frac{\mathbf{p}_k + \mathbf{p}_{k+1}}{2}\) の値で
/// \[
/// \mathbf{B}(\mathbf{r}) \approx \sum_{k=0}^{N-1} \frac{I\,\Delta\mathbf{l}_k \times (\mathbf{r} - \mathbf{m}_k)}{|\mathbf{r} - \mathbf{m}_k|^3}
/// \]
/// とします。線分を細かくするほど線積分 \(\frac{\mu_0}{4\pi}\int \frac{I\,d\mathbf{l}\times(\mathbf{r} - \mathbf{r}')}{|\mathbf{r} - \mathbf{r}'|^3}\) に近づきます。
/// この値は近似です。
pub fn biot_savart_polyline(current: f64, vertices: &[[f64; 3]], r: [f64; 3]) -> [f64; 3] {
    let mut b = [0.0; 3];
    for pair in vertices.windows(2) {
        let dl = [pair[1][0] - pair[0][0], pair[1][1] - pair[0][1], pair[1][2] - pair[0][2]];
        let m = [(pair[0][0] + pair[1][0]) / 2.0, (pair[0][1] + pair[1][1]) / 2.0, (pair[0][2] + pair[1][2]) / 2.0];
        let d = [r[0] - m[0], r[1] - m[1], r[2] - m[2]];
        let r3 = dot3(d, d).powf(1.5);
        let c = cross3(dl, d);
        for i in 0..3 {
            b[i] += current * c[i] / r3;
        }
    }
    b
}

/// \(z\) 軸上の \(z = -L\) から \(z = L\) までの直線導線を \(N\) 等分した頂点の列を返します。電流は \(+z\) の向きです。
pub fn straight_wire_vertices(half_length: f64, n: usize) -> Vec<[f64; 3]> {
    (0..=n).map(|k| [0.0, 0.0, -half_length + 2.0 * half_length * k as f64 / n as f64]).collect()
}

/// 平面 \(z = 0\) 上の中心が原点、半径 \(R\) の円に内接する正 \(N\) 角形の頂点の列を返します（最初の頂点を最後に繰り返します）。
/// 電流は \(z\) 軸の正の向きから見て反時計回りです。
pub fn circular_loop_vertices(radius: f64, n: usize) -> Vec<[f64; 3]> {
    (0..=n).map(|k| {
        let angle = 2.0 * PI * k as f64 / n as f64;
        [radius * angle.cos(), radius * angle.sin(), 0.0]
    }).collect()
}

/// 長さ \(2L\) の直線導線の垂直二等分面で、導線から距離 \(r\) の点の磁束密度の大きさを返します。
///
/// \(\frac{\mu_0}{4\pi} = 1\) の単位で、導線の位置 \(z'\) の要素は大きさ \(\frac{I r\,dz'}{(r^2 + z'^2)^{3/2}}\) の磁場を同じ向きに作るので
/// \[
/// B = \int_{-L}^{L} \frac{I r}{(r^2 + z'^2)^{3/2}}\,dz' = \left[\frac{I z'}{r\sqrt{r^2 + z'^2}}\right]_{-L}^{L} = \frac{2IL}{r\sqrt{r^2 + L^2}}
/// \]
/// です。\(L \to \infty\) で無限長直線電流の \(\frac{2I}{r} = \frac{\mu_0 I}{2\pi r}\) になります。この値は厳密です。
pub fn finite_wire_field(current: f64, half_length: f64, r: f64) -> f64 {
    2.0 * current * half_length / (r * (r * r + half_length * half_length).sqrt())
}

/// 無限長直線電流 \(I\) が距離 \(r\) の点に作る磁束密度の大きさ \(B = \frac{\mu_0 I}{2\pi r} = \frac{2I}{r}\)（\(\mu_0 = 4\pi\)）を返します。この値は厳密です。
pub fn infinite_wire_field(current: f64, r: f64) -> f64 {
    2.0 * current / r
}

/// 半径 \(R\) の円形電流 \(I\) が中心軸上、中心から距離 \(z\) の点に作る磁束密度の大きさを返します。
///
/// 円周の各要素 \(I\,d\mathbf{l}\) は点から距離 \(\sqrt{R^2 + z^2}\) にあり、\(d\mathbf{l}\) と点への向きは直交します。
/// 軸に垂直な成分は打ち消し合い、軸方向の成分は \(\frac{R}{\sqrt{R^2 + z^2}}\) 倍が残るので、\(\frac{\mu_0}{4\pi} = 1\) の単位で
/// \[
/// B_z = \oint \frac{I\,dl}{R^2 + z^2}\cdot\frac{R}{\sqrt{R^2 + z^2}} = \frac{2\pi I R^2}{(R^2 + z^2)^{3/2}} = \frac{\mu_0 I R^2}{2(R^2 + z^2)^{3/2}}
/// \]
/// です。この値は厳密です。
pub fn loop_axis_field(current: f64, radius: f64, z: f64) -> f64 {
    2.0 * PI * current * radius * radius / (radius * radius + z * z).powf(1.5)
}

/// \(z\) 軸上の無限長直線電流 \(I\) の磁場について、平面 \(z = 0\) の円（中心 \((c_x, c_y)\)、半径 \(\rho\)）に沿った周回積分
/// \(\oint_C \mathbf{B}\cdot d\mathbf{l}\) を Simpson 則で近似します。
///
/// 磁場は \(\mathbf{B} = \frac{2I}{x^2 + y^2}(-y,\ x)\) です。円を \(\mathbf{r}(t) = \mathbf{c} + \rho(\cos t,\ \sin t)\)（\(0 \le t \le 2\pi\)）と表し、
/// \(\int_0^{2\pi} \mathbf{B}(\mathbf{r}(t))\cdot\mathbf{r}'(t)\,dt\) を \(n\) 等分の Simpson 則で求めます。Ampère の法則により、厳密な値は
/// 円が導線を囲めば \(\mu_0 I = 4\pi I\)、囲まなければ 0 です。この値は近似です。
pub fn ampere_circulation(current: f64, center: (f64, f64), radius: f64, n: usize) -> f64 {
    simpson_rule(|t| {
        let (x, y) = (center.0 + radius * t.cos(), center.1 + radius * t.sin());
        let (dx, dy) = (-radius * t.sin(), radius * t.cos());
        let s = 2.0 * current / (x * x + y * y);
        s * (-y * dx + x * dy)
    }, 0.0, 2.0 * PI, n)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dipole() -> [PointCharge; 2] {
        [PointCharge { q: 1.0, x: -1.0, y: 0.0 }, PointCharge { q: -1.0, x: 1.0, y: 0.0 }]
    }

    #[test]
    fn dipole_field_on_bisector() {
        let (ex, ey) = coulomb_field(&dipole(), 0.0, 1.0);
        assert!((ex - 0.5_f64.sqrt()).abs() < 1e-15);
        assert!(ey.abs() < 1e-15);
        assert_eq!(coulomb_field(&dipole(), 0.0, 0.0), (2.0, 0.0));
    }

    #[test]
    fn potential_values_and_gradient() {
        let c = dipole();
        assert!((coulomb_potential(&c, -0.5, 0.0) - 4.0 / 3.0).abs() < 1e-14);
        assert_eq!(coulomb_potential(&c, 0.0, 1.0), 0.0);
        let (ex, ey) = potential_gradient_field(&c, 0.0, 0.0, 0.1);
        assert!((ex - 200.0 / 99.0).abs() < 1e-12);
        assert_eq!(ey, 0.0);
    }

    #[test]
    fn line_integral_is_path_independent() {
        let c = dipole();
        let straight = field_line_integral(&c, |t| ((-0.5 + t, 0.0), (1.0, 0.0)), 64);
        let arc = field_line_integral(&c, |t| ((-0.5 * (PI * t).cos(), 0.5 * (PI * t).sin()), (0.5 * PI * (PI * t).sin(), 0.5 * PI * (PI * t).cos())), 64);
        assert!((straight - 8.0 / 3.0).abs() < 1e-5);
        assert!((arc - 8.0 / 3.0).abs() < 1e-5);
    }

    #[test]
    fn field_line_keeps_flux_function() {
        let c = dipole();
        let start = (-1.0 + 0.08 * 1.0_f64.cos(), 0.08 * 1.0_f64.sin());
        let points = field_line(&c, start.0, start.1, 0.01, 4000, [-4.0, 4.0, -3.0, 3.0], 0.05);
        let psi0 = axial_flux_function(&c, start.0, start.1);
        let end = points.last().unwrap();
        assert!((end.0 - 1.0).hypot(end.1) < 0.06);
        for p in points {
            assert!((axial_flux_function(&c, p.0, p.1) - psi0).abs() < 1e-6);
        }
    }

    #[test]
    fn equipotential_closes_and_keeps_potential() {
        let c = dipole();
        let points = equipotential_line(&c, -0.5, 0.0, 0.01, 5000, [-4.0, 4.0, -3.0, 3.0]);
        assert_eq!(points.first(), points.last());
        for p in &points {
            assert!((coulomb_potential(&c, p.0, p.1) - 4.0 / 3.0).abs() < 1e-6);
        }
        let axis = equipotential_line(&c, 0.0, 0.0, 0.02, 1000, [-4.0, 4.0, -3.0, 3.0]);
        assert!(axis.iter().all(|p| p.0.abs() < 1e-9));
    }

    #[test]
    fn gauss_flux_by_midpoint_rules() {
        let o = [0.0; 3];
        assert!((sphere_flux_midpoint(1.0, o, o, 1.0, 1) - 2.0 * PI * PI).abs() < 1e-12);
        assert!((cube_flux_midpoint(1.0, o, o, 1.0, 1) - 24.0).abs() < 1e-12);
        let exact = gauss_flux(1.0);
        assert!((sphere_flux_midpoint(1.0, o, [0.5, 0.0, 0.0], 1.0, 64) - exact).abs() < 1e-2);
        assert!((cube_flux_midpoint(1.0, o, [0.5, 0.3, 0.0], 1.0, 64) - exact).abs() < 1e-2);
        assert!(sphere_flux_midpoint(1.0, o, [2.5, 0.0, 0.0], 1.0, 32).abs() < 1e-3);
        assert!(cube_flux_midpoint(1.0, o, [2.5, 0.0, 0.0], 1.0, 32).abs() < 1e-3);
    }

    #[test]
    fn uniform_ball() {
        assert_eq!(uniform_ball_field(1.0, 1.0, 0.5), 0.5);
        assert_eq!(uniform_ball_field(1.0, 1.0, 1.0), 1.0);
        assert_eq!(uniform_ball_field(1.0, 1.0, 2.0), 0.25);
    }

    #[test]
    fn biot_savart_straight_wire_and_loop() {
        let one = biot_savart_polyline(1.0, &straight_wire_vertices(1.0, 1), [1.0, 0.0, 0.0]);
        assert!((one[1] - 2.0).abs() < 1e-15 && one[0].abs() < 1e-15);
        let many = biot_savart_polyline(1.0, &straight_wire_vertices(1.0, 256), [1.0, 0.0, 0.0]);
        assert!((many[1] - 2.0_f64.sqrt()).abs() < 1e-5);
        assert!((finite_wire_field(1.0, 1.0, 1.0) - 2.0_f64.sqrt()).abs() < 1e-15);
        assert!((finite_wire_field(1.0, 1e6, 1.0) - infinite_wire_field(1.0, 1.0)).abs() < 1e-9);
        let square = biot_savart_polyline(1.0, &circular_loop_vertices(1.0, 4), [0.0; 3]);
        assert!((square[2] - 8.0 * 2.0_f64.sqrt()).abs() < 1e-12);
        let ring = biot_savart_polyline(1.0, &circular_loop_vertices(1.0, 512), [0.0, 0.0, 1.0]);
        assert!((ring[2] - loop_axis_field(1.0, 1.0, 1.0)).abs() < 1e-4);
        assert!((loop_axis_field(1.0, 1.0, 1.0) - PI / 2.0_f64.sqrt()).abs() < 1e-14);
    }

    #[test]
    fn ampere_law() {
        assert!((ampere_circulation(1.0, (0.0, 0.0), 1.0, 2) - 4.0 * PI).abs() < 1e-12);
        assert!((ampere_circulation(1.0, (0.5, 0.0), 1.0, 64) - 4.0 * PI).abs() < 1e-6);
        assert!(ampere_circulation(1.0, (2.5, 0.0), 1.0, 64).abs() < 1e-6);
    }
}
