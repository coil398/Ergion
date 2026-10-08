//! 磁場中の荷電粒子、Faraday の電磁誘導の法則、Maxwell 方程式と電磁波。

/// ベクトルの外積 \(\mathbf{a} \times \mathbf{b} = (a_y b_z - a_z b_y,\ a_z b_x - a_x b_z,\ a_x b_y - a_y b_x)\) を返します。
fn cross(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/// 粒子の速さ \(|\mathbf{v}| = \sqrt{v_x^2 + v_y^2 + v_z^2}\) を返します。
pub fn particle_speed(v: [f64; 3]) -> f64 {
    (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt()
}

/// 電荷 \(q\)、質量 \(m\) の粒子が受ける Lorentz 力による加速度
/// \[\mathbf{v}' = \frac{q}{m}\left(\mathbf{E} + \mathbf{v} \times \mathbf{B}\right)\]
/// を返します。\(\mathbf{E}\) は電場、\(\mathbf{B}\) は磁束密度です。
pub fn lorentz_acceleration(charge_over_mass: f64, v: [f64; 3], e: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    let f = cross(v, b);
    [0, 1, 2].map(|i| charge_over_mass * (e[i] + f[i]))
}

/// サイクロトロン角振動数 \(\omega_c = qB/m\) を返します。
///
/// \(q\) は電荷、\(B\) は \(z\) 方向の一様な磁束密度、\(m\) は質量です。符号は回転の向きを表し、
/// \(\omega_c > 0\) のとき粒子は \(z\) 軸の正の向きから見て時計回りに回ります。厳密な値です。
pub fn cyclotron_frequency(charge: f64, field: f64, mass: f64) -> f64 {
    charge * field / mass
}

/// Larmor 半径 \(r_L = v_\perp/|\omega_c|\) を返します。\(v_\perp\) は磁場に垂直な速さです。厳密な値です。
pub fn larmor_radius(perpendicular_speed: f64, omega: f64) -> f64 {
    perpendicular_speed / omega.abs()
}

/// 一様な磁場 \(\mathbf{B} = B\hat{\mathbf{z}}\)、\(\mathbf{E} = \mathbf{0}\) の中の位置と速度の厳密解を返します。
///
/// 運動方程式 \(v_x' = \omega v_y\)、\(v_y' = -\omega v_x\)、\(v_z' = 0\)（\(\omega = qB/m\)）の解は
/// \[v_x = v_{x0}\cos\omega t + v_{y0}\sin\omega t,\qquad v_y = -v_{x0}\sin\omega t + v_{y0}\cos\omega t,\qquad v_z = v_{z0}\]
/// \[x = x_0 + \frac{v_{x0}\sin\omega t + v_{y0}(1 - \cos\omega t)}{\omega},\qquad
/// y = y_0 + \frac{v_{x0}(\cos\omega t - 1) + v_{y0}\sin\omega t}{\omega},\qquad z = z_0 + v_{z0} t\]
/// です。\(xy\) 平面への射影は半径 \(r_L\) の円、全体はピッチ \(2\pi v_{z0}/|\omega|\) のらせんです。
/// \(\omega = 0\) のときは等速直線運動を返します。
pub fn helix_state(r0: [f64; 3], v0: [f64; 3], omega: f64, t: f64) -> ([f64; 3], [f64; 3]) {
    if omega == 0.0 {
        return ([0, 1, 2].map(|i| r0[i] + v0[i] * t), v0);
    }
    let (s, c) = (omega * t).sin_cos();
    let v = [v0[0] * c + v0[1] * s, -v0[0] * s + v0[1] * c, v0[2]];
    let r = [
        r0[0] + (v0[0] * s + v0[1] * (1.0 - c)) / omega,
        r0[1] + (v0[0] * (c - 1.0) + v0[1] * s) / omega,
        r0[2] + v0[2] * t,
    ];
    (r, v)
}

/// Boris 法の1ステップで、位置 \(\mathbf{x}_n\) と半整数時刻の速度 \(\mathbf{v}_{n-1/2}\) を
/// \(\mathbf{x}_{n+1}\)、\(\mathbf{v}_{n+1/2}\) に進めます。
///
/// \(\kappa = q/m\) とし、電場で半分加速し、磁場で回転し、電場で残りの半分を加速します。
/// \[\mathbf{v}^- = \mathbf{v}_{n-1/2} + \frac{\kappa\Delta t}{2}\mathbf{E},\qquad
/// \mathbf{t} = \frac{\kappa\Delta t}{2}\mathbf{B},\qquad \mathbf{s} = \frac{2\mathbf{t}}{1 + |\mathbf{t}|^2}\]
/// \[\mathbf{v}' = \mathbf{v}^- + \mathbf{v}^- \times \mathbf{t},\qquad \mathbf{v}^+ = \mathbf{v}^- + \mathbf{v}' \times \mathbf{s}\]
/// \[\mathbf{v}_{n+1/2} = \mathbf{v}^+ + \frac{\kappa\Delta t}{2}\mathbf{E},\qquad \mathbf{x}_{n+1} = \mathbf{x}_n + \Delta t\,\mathbf{v}_{n+1/2}\]
/// \(\mathbf{v}^-\) から \(\mathbf{v}^+\) への写像は \(\mathbf{B}\) のまわりの角 \(\theta = 2\arctan(|\mathbf{t}|)\) の回転なので、
/// \(\mathbf{E} = \mathbf{0}\) では速さ \(|\mathbf{v}|\) を厳密に保ちます。
/// 一様磁場では1ステップの回転角は \(2\arctan(\omega_c\Delta t/2)\) で、厳密解の \(\omega_c\Delta t\) より少し小さい近似です。
pub fn boris_step(x: &mut [f64; 3], v: &mut [f64; 3], charge_over_mass: f64, e: [f64; 3], b: [f64; 3], dt: f64) {
    let half = 0.5 * charge_over_mass * dt;
    let minus = [0, 1, 2].map(|i| v[i] + half * e[i]);
    let t = b.map(|bi| half * bi);
    let t2 = t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
    let s = t.map(|ti| 2.0 * ti / (1.0 + t2));
    let mt = cross(minus, t);
    let prime = [0, 1, 2].map(|i| minus[i] + mt[i]);
    let ps = cross(prime, s);
    let plus = [0, 1, 2].map(|i| minus[i] + ps[i]);
    *v = [0, 1, 2].map(|i| plus[i] + half * e[i]);
    for i in 0..3 {
        x[i] += dt * v[i];
    }
}

/// Boris 法の一様磁場での1ステップの回転角 \(\theta = 2\arctan(\omega_c\Delta t/2)\) を返します。厳密な値です。
pub fn boris_rotation_angle(omega: f64, dt: f64) -> f64 {
    2.0 * (0.5 * omega * dt).atan()
}

/// 面積 \(A\) のループを垂直に貫く磁束 \(\Phi(t) = B_0 A\cos\omega t\) を返します。
///
/// 磁束密度は \(B(t) = B_0\cos\omega t\) で、ループの法線方向にそろっています。厳密な値です。
pub fn cosine_flux(peak_field: f64, area: f64, omega: f64, t: f64) -> f64 {
    peak_field * area * (omega * t).cos()
}

/// Faraday の電磁誘導の法則による起電力 \(\mathcal{E}(t) = -\frac{d\Phi}{dt} = B_0 A\omega\sin\omega t\) を返します。
///
/// 起電力の正の向きは、法線を親指に向けた右手の指の向きです。
/// 符号の負は Lenz の法則で、磁束が増えるとき起電力は磁束の増加を打ち消す電流の向きを向きます。厳密な値です。
pub fn faraday_emf(peak_field: f64, area: f64, omega: f64, t: f64) -> f64 {
    peak_field * area * omega * (omega * t).sin()
}

/// 磁束の中心差分による起電力の近似 \(\mathcal{E}_h(t) = -\frac{\Phi(t + h) - \Phi(t - h)}{2h}\) を返します。
///
/// \(\Phi = B_0 A\cos\omega t\) では、加法定理
/// \(\cos\omega(t + h) - \cos\omega(t - h) = -2\sin\omega t\,\sin\omega h\) により
/// \[\mathcal{E}_h(t) = B_0 A\,\frac{\sin\omega h}{h}\sin\omega t = \frac{\sin\omega h}{\omega h}\,\mathcal{E}(t)\]
/// です。厳密解との比 \(\sin(\omega h)/(\omega h)\) は時刻によらず、\(1 - (\omega h)^2/6\) 程度の近似です。
pub fn central_difference_emf(flux: impl Fn(f64) -> f64, t: f64, h: f64) -> f64 {
    -(flux(t + h) - flux(t - h)) / (2.0 * h)
}

/// RL 回路 \(L I' + R I = \mathcal{E}_0\sin\omega t\)、\(I(0) = 0\) の電流の厳密解を返します。
///
/// \(L\) は自己インダクタンス、\(R\) は抵抗、\(\mathcal{E}_0\) は起電力の振幅です。\(Z^2 = R^2 + \omega^2 L^2\) として
/// \[I(t) = \frac{\mathcal{E}_0}{Z^2}\left(R\sin\omega t - \omega L\cos\omega t\right) + \frac{\mathcal{E}_0\,\omega L}{Z^2}\,e^{-Rt/L}\]
/// です。第1項は定常解（振幅 \(\mathcal{E}_0/Z\)、位相の遅れ \(\arctan(\omega L/R)\)）、第2項は時定数 \(L/R\) で減る過渡解です。
pub fn rl_current(inductance: f64, resistance: f64, emf_amplitude: f64, omega: f64, t: f64) -> f64 {
    let z2 = resistance * resistance + omega * omega * inductance * inductance;
    let (s, c) = (omega * t).sin_cos();
    emf_amplitude / z2 * (resistance * s - omega * inductance * c)
        + emf_amplitude * omega * inductance / z2 * (-resistance * t / inductance).exp()
}

/// RL 回路の定常電流の振幅 \(\mathcal{E}_0/\sqrt{R^2 + \omega^2 L^2}\) を返します。厳密な値です。
pub fn rl_steady_amplitude(inductance: f64, resistance: f64, emf_amplitude: f64, omega: f64) -> f64 {
    emf_amplitude / (resistance * resistance + omega * omega * inductance * inductance).sqrt()
}

/// 真空中の平面電磁波 \(E_y = E_0\cos(kx - \omega t)\)、\(B_z = E_y/c\) を返します。
///
/// \(\omega = ck\) のとき、両方の成分が波動方程式と Maxwell の回転の方程式を満たします。厳密な値です。
pub fn plane_wave(amplitude: f64, k: f64, omega: f64, light_speed: f64, x: f64, t: f64) -> (f64, f64) {
    let e = amplitude * (k * x - omega * t).cos();
    (e, e / light_speed)
}

/// 1次元の FDTD 法（Yee 格子）の1ステップを、周期境界で進めます。
///
/// 真空中で \(E_y(x, t)\) と \(B_z(x, t)\) は
/// \(\partial_t B_z = -\partial_x E_y\)、\(\partial_t E_y = -c^2\partial_x B_z\) に従います。
/// \(E_j^n = E_y(j\Delta x, n\Delta t)\)、\(B_{j+1/2}^{n+1/2} = B_z((j + \tfrac12)\Delta x, (n + \tfrac12)\Delta t)\) と半格子ずらして置き、
/// どちらの微分も中心差分にします。Courant 数を \(S = c\Delta t/\Delta x\) として
/// \[B_{j+1/2}^{n+1/2} = B_{j+1/2}^{n-1/2} - \frac{S}{c}\left(E_{j+1}^n - E_j^n\right)\]
/// \[E_j^{n+1} = E_j^n - cS\left(B_{j+1/2}^{n+1/2} - B_{j-1/2}^{n+1/2}\right)\]
/// です。`b[j]` が \(B_{j+1/2}\) で、添字は格子点の数 \(M\) を法として数えます。
/// 2式から \(B\) を消すと \(E_j^{n+1} - 2E_j^n + E_j^{n-1} = S^2(E_{j+1}^n - 2E_j^n + E_{j-1}^n)\) で、
/// \(S \le 1\) で安定、\(S = 1\) では格子点の上で d'Alembert の解と一致します。\(S < 1\) は近似です。
pub fn yee_step(e: &mut [f64], b: &mut [f64], courant: f64, light_speed: f64) {
    let m = e.len();
    for j in 0..m {
        b[j] -= courant / light_speed * (e[(j + 1) % m] - e[j]);
    }
    for j in 0..m {
        e[j] -= light_speed * courant * (b[j] - b[(j + m - 1) % m]);
    }
}

/// 周期 \(L\) の区間を速さ \(c\) で右へ進む Gauss 形のパルス
/// \(f(x - ct) = \exp\left(-\left((x - ct - x_0)/w\right)^2\right)\) を返します。
///
/// \(x - ct - x_0\) は周期 \(L\) で \([-L/2, L/2)\) に戻し、最も近い一つの像だけを足します。
/// \(w\) が \(L\) より十分小さいとき、残りの像の寄与は \(e^{-(L/2w)^2}\) 以下です。
pub fn periodic_pulse(x: f64, t: f64, center: f64, width: f64, length: f64, light_speed: f64) -> f64 {
    let s = (x - light_speed * t - center).rem_euclid(length);
    let s = if s >= 0.5 * length { s - length } else { s };
    (-(s / width).powi(2)).exp()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    #[test]
    fn helix_has_radius_one_and_returns_after_one_period() {
        let omega = cyclotron_frequency(1.0, 1.0, 1.0);
        assert_eq!(larmor_radius(1.0, omega), 1.0);
        let (r, v) = helix_state([-1.0, 0.0, 0.0], [0.0, 1.0, 0.2], omega, 2.0 * PI);
        assert!((r[0] + 1.0).abs() < 1e-12 && r[1].abs() < 1e-12);
        assert!((r[2] - 0.4 * PI).abs() < 1e-12);
        assert!((v[1] - 1.0).abs() < 1e-12);
        let (quarter, _) = helix_state([-1.0, 0.0, 0.0], [0.0, 1.0, 0.0], omega, 0.5 * PI);
        assert!(quarter[0].abs() < 1e-12 && (quarter[1] - 1.0).abs() < 1e-12);
    }

    #[test]
    fn boris_keeps_the_speed_and_rotates_by_two_arctan() {
        let mut x = [0.0; 3];
        let mut v = [0.0, 1.0, 0.2];
        let speed = particle_speed(v);
        for _ in 0..1000 {
            boris_step(&mut x, &mut v, 1.0, [0.0; 3], [0.0, 0.0, 1.0], 0.1);
        }
        assert!((particle_speed(v) - speed).abs() < 1e-13);
        let mut v1 = [0.0, 1.0, 0.0];
        boris_step(&mut [0.0; 3], &mut v1, 1.0, [0.0; 3], [0.0, 0.0, 1.0], 0.1);
        let angle = v1[0].atan2(v1[1]);
        assert!((angle - boris_rotation_angle(1.0, 0.1)).abs() < 1e-14);
        assert!((boris_rotation_angle(1.0, 0.1) - 0.0999167).abs() < 1e-7);
    }

    #[test]
    fn lorentz_force_is_perpendicular_to_velocity() {
        let a = lorentz_acceleration(1.0, [0.0, 1.0, 0.0], [0.0; 3], [0.0, 0.0, 1.0]);
        assert_eq!(a, [1.0, 0.0, 0.0]);
    }

    #[test]
    fn central_difference_emf_is_sinc_times_exact() {
        let flux = |t: f64| cosine_flux(1.0, 1.0, 1.0, t);
        let t = 0.7;
        let ratio = central_difference_emf(flux, t, 0.1) / faraday_emf(1.0, 1.0, 1.0, t);
        assert!((ratio - 0.1_f64.sin() / 0.1).abs() < 1e-12);
        assert!((ratio - 0.998334).abs() < 1e-6);
    }

    #[test]
    fn rl_current_starts_at_zero_and_matches_the_hand_value() {
        assert!(rl_current(1.0, 1.0, 1.0, 1.0, 0.0).abs() < 1e-15);
        let at_pi = rl_current(1.0, 1.0, 1.0, 1.0, PI);
        assert!((at_pi - (0.5 + 0.5 * (-PI).exp())).abs() < 1e-12);
        assert!((rl_steady_amplitude(1.0, 1.0, 1.0, 1.0) - 0.5_f64.sqrt()).abs() < 1e-15);
        let h = 1e-5;
        let t = 1.3;
        let di = (rl_current(1.0, 1.0, 1.0, 1.0, t + h) - rl_current(1.0, 1.0, 1.0, 1.0, t - h)) / (2.0 * h);
        assert!((di + rl_current(1.0, 1.0, 1.0, 1.0, t) - t.sin()).abs() < 1e-8);
    }

    #[test]
    fn plane_wave_has_b_equal_e_over_c() {
        let (e, b) = plane_wave(2.0, 1.0, 3.0, 3.0, 0.0, 0.0);
        assert_eq!((e, b), (2.0, 2.0 / 3.0));
    }

    #[test]
    fn yee_with_courant_one_translates_the_pulse_exactly() {
        let (m, dx, length) = (200, 0.05, 10.0);
        let mut e: Vec<f64> = (0..m).map(|j| periodic_pulse(j as f64 * dx, 0.0, 2.5, 0.5, length, 1.0)).collect();
        let mut b: Vec<f64> = (0..m).map(|j| periodic_pulse((j as f64 + 0.5) * dx, -0.5 * dx, 2.5, 0.5, length, 1.0)).collect();
        for _ in 0..200 {
            yee_step(&mut e, &mut b, 1.0, 1.0);
        }
        let max = (0..m).map(|j| (e[j] - periodic_pulse(j as f64 * dx, 10.0, 2.5, 0.5, length, 1.0)).abs()).fold(0.0, f64::max);
        assert!(max < 1e-12, "{max}");
        assert!((e[50] - 1.0).abs() < 1e-12);
    }
}
