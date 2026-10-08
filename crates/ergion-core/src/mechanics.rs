//! 力学の単元の厳密解。一定の力、単振動、減衰振動、強制振動、2体問題。

use crate::newton_step;

/// 一定の力 \(F\) を受ける質量 \(m\) の質点の加速度 \(a = F/m\) を返します。
///
/// Newton の運動方程式 \(m x'' = F\) の両辺を \(m > 0\) で割ると \(x'' = F/m\) です。
/// \(F\) は時刻にも位置にもよらない定数なので、加速度も定数です。この値は厳密です。
pub fn constant_force_acceleration(force: f64, mass: f64) -> f64 {
    force / mass
}

/// 一定の力 \(F\) を受ける質点の位置 \(x(t)\) を返します。
///
/// \(m x'' = F\)、\(x(0) = x_0\)、\(x'(0) = v_0\) とします。\(a = F/m\) を二度積分して
/// \[
/// v(t) = v_0 + \frac{F}{m} t, \qquad x(t) = x_0 + v_0 t + \frac{1}{2}\frac{F}{m} t^2
/// \]
/// を得ます。\(x\) は位置、\(v\) は速度、\(t\) は時刻、\(m\) は質量、\(F\) は力です。
/// この値は打ち切りのない厳密解です。
pub fn constant_force_position(x0: f64, v0: f64, force: f64, mass: f64, t: f64) -> f64 {
    x0 + v0 * t + 0.5 * constant_force_acceleration(force, mass) * t * t
}

/// [`constant_force_position`] の速度 \(v(t) = v_0 + (F/m) t\) を返します。これも厳密です。
pub fn constant_force_velocity(v0: f64, force: f64, mass: f64, t: f64) -> f64 {
    v0 + constant_force_acceleration(force, mass) * t
}

/// 単振動 \(m x'' = -k x\) の位置 \(x(t)\) を返します。
///
/// \(m > 0\) は質量、\(k > 0\) はばね定数、\(\omega = \sqrt{k/m}\) は固有角振動数です。
/// 特性方程式 \(m r^2 + k = 0\) の根は \(r = \pm i\omega\) で、一般解は \(A\cos\omega t + B\sin\omega t\) です。
/// \(x(0) = x_0\) から \(A = x_0\)、\(x'(0) = v_0\) から \(B\omega = v_0\) となり、
/// \[
/// x(t) = x_0 \cos\omega t + \frac{v_0}{\omega}\sin\omega t
/// \]
/// です。この値は打ち切りのない厳密解です。
pub fn harmonic_position(x0: f64, v0: f64, omega: f64, t: f64) -> f64 {
    let (sin, cos) = (omega * t).sin_cos();
    x0 * cos + v0 / omega * sin
}

/// [`harmonic_position`] の速度 \(v(t) = -x_0\omega\sin\omega t + v_0\cos\omega t\) を返します。これも厳密です。
pub fn harmonic_velocity(x0: f64, v0: f64, omega: f64, t: f64) -> f64 {
    let (sin, cos) = (omega * t).sin_cos();
    -x0 * omega * sin + v0 * cos
}

/// ばねにつながれた質点の力学的エネルギー \(E = \frac{1}{2} m v^2 + \frac{1}{2} k x^2\) を返します。
///
/// 第1項は運動エネルギー、第2項はばねの位置エネルギーです。
/// 単振動の厳密解では \(dE/dt = v(m x'' + k x) = 0\) なので、\(E\) は時刻によらない定数です。
pub fn spring_energy(mass: f64, spring: f64, x: f64, v: f64) -> f64 {
    0.5 * mass * v * v + 0.5 * spring * x * x
}

/// 減衰振動 \(m x'' + \gamma x' + k x = 0\) の位置と速度 \((x(t), v(t))\) を返します。
///
/// \(\gamma \ge 0\) は減衰係数です。\(\beta = \gamma/(2m)\)、\(\omega_0 = \sqrt{k/m}\) と置くと、
/// 特性方程式 \(r^2 + 2\beta r + \omega_0^2 = 0\) の根は \(r = -\beta \pm \sqrt{\beta^2 - \omega_0^2}\) です。
/// 減衰比は \(\zeta = \beta/\omega_0 = \gamma/(2\sqrt{mk})\) です。
///
/// - 不足減衰 \(\zeta < 1\)：\(\omega_d = \sqrt{\omega_0^2 - \beta^2}\) として
///   \[ x(t) = e^{-\beta t}\left[x_0\cos\omega_d t + \frac{v_0 + \beta x_0}{\omega_d}\sin\omega_d t\right]. \]
/// - 臨界減衰 \(\zeta = 1\)：\[ x(t) = e^{-\beta t}\left[x_0 + (v_0 + \beta x_0) t\right]. \]
/// - 過減衰 \(\zeta > 1\)：\(s = \sqrt{\beta^2 - \omega_0^2}\)、\(r_\pm = -\beta \pm s\) として
///   \[ x(t) = \frac{(v_0 - r_- x_0) e^{r_+ t} - (v_0 - r_+ x_0) e^{r_- t}}{2s}. \]
///
/// 係数は \(x(0) = x_0\)、\(x'(0) = v_0\) から決めました。速度はこの式を \(t\) で微分した値です。
/// どの場合も打ち切りのない厳密解です。
pub fn damped_state(mass: f64, damping: f64, spring: f64, x0: f64, v0: f64, t: f64) -> (f64, f64) {
    let beta = damping / (2.0 * mass);
    let omega0_sq = spring / mass;
    let disc = beta * beta - omega0_sq;
    let decay = (-beta * t).exp();
    let tolerance = 1e-12 * omega0_sq.max(beta * beta);
    if disc < -tolerance {
        let wd = (-disc).sqrt();
        let b = (v0 + beta * x0) / wd;
        let (sin, cos) = (wd * t).sin_cos();
        let x = decay * (x0 * cos + b * sin);
        let v = decay * ((-beta * x0 + b * wd) * cos + (-beta * b - x0 * wd) * sin);
        (x, v)
    } else if disc > tolerance {
        let s = disc.sqrt();
        let (rp, rm) = (-beta + s, -beta - s);
        let cp = (v0 - rm * x0) / (2.0 * s);
        let cm = -(v0 - rp * x0) / (2.0 * s);
        let (ep, em) = ((rp * t).exp(), (rm * t).exp());
        (cp * ep + cm * em, cp * rp * ep + cm * rm * em)
    } else {
        let b = v0 + beta * x0;
        let x = decay * (x0 + b * t);
        let v = decay * (b - beta * (x0 + b * t));
        (x, v)
    }
}

/// 減衰振動の振幅の包絡線 \(e^{-\gamma t/(2m)}\) に、振幅 \(\sqrt{x_0^2 + ((v_0 + \beta x_0)/\omega_d)^2}\) を掛けた値を返します。
///
/// 不足減衰の解は \(x(t) = C e^{-\beta t}\cos(\omega_d t - \varphi)\) と書けます（\(C\) は上の振幅、\(\varphi\) は位相）。
/// \(|\cos| \le 1\) なので、解は \(\pm C e^{-\beta t}\) のあいだにあります。不足減衰でないときは \(\omega_d\) がないので 0 を返します。
pub fn damped_envelope(mass: f64, damping: f64, spring: f64, x0: f64, v0: f64, t: f64) -> f64 {
    let beta = damping / (2.0 * mass);
    let disc = spring / mass - beta * beta;
    if disc <= 0.0 {
        return 0.0;
    }
    let wd = disc.sqrt();
    let c = x0.hypot((v0 + beta * x0) / wd);
    c * (-beta * t).exp()
}

/// 強制振動 \(m x'' + \gamma x' + k x = F_0\cos\omega t\) の定常振幅 \(A(\omega)\) を返します。
///
/// 特殊解を \(x_p = A\cos(\omega t - \delta)\) と置きます。複素数 \(\tilde{x} = \tilde{A} e^{i\omega t}\) で
/// \((k - m\omega^2 + i\gamma\omega)\tilde{A} = F_0\) を解くと、絶対値と偏角から
/// \[
/// A(\omega) = \frac{F_0}{\sqrt{(k - m\omega^2)^2 + (\gamma\omega)^2}}, \qquad
/// \tan\delta = \frac{\gamma\omega}{k - m\omega^2}
/// \]
/// です。\(\omega\) は外力の角振動数、\(F_0\) は外力の振幅です。この値は厳密です。
pub fn forced_amplitude(mass: f64, damping: f64, spring: f64, force: f64, omega: f64) -> f64 {
    let real = spring - mass * omega * omega;
    force / real.hypot(damping * omega)
}

/// [`forced_amplitude`] の位相の遅れ \(\delta \in [0, \pi]\) を返します。
///
/// \(\delta\) は \(\cos\delta \propto k - m\omega^2\)、\(\sin\delta \propto \gamma\omega\) を満たす角で、
/// \(\delta = \operatorname{atan2}(\gamma\omega,\ k - m\omega^2)\) です。共振 \(\omega = \sqrt{k/m}\) で \(\delta = \pi/2\) です。
pub fn forced_phase(mass: f64, damping: f64, spring: f64, omega: f64) -> f64 {
    (damping * omega).atan2(spring - mass * omega * omega)
}

/// 強制振動の初期値問題の位置と速度 \((x(t), v(t))\) を返します。
///
/// 解は定常解 \(x_p(t) = A\cos(\omega t - \delta)\) と、減衰振動の解 \(x_h\) の和です。
/// \(x_h\) の初期値は \(x_h(0) = x_0 - x_p(0)\)、\(x_h'(0) = v_0 - x_p'(0)\) で、[`damped_state`] で求めます。
/// \(x_h\) が \(\gamma > 0\) で減衰したあとに残るのが定常振動 \(x_p\) です。この値は厳密です。
#[allow(clippy::too_many_arguments)]
pub fn forced_state(
    mass: f64,
    damping: f64,
    spring: f64,
    force: f64,
    omega: f64,
    x0: f64,
    v0: f64,
    t: f64,
) -> (f64, f64) {
    let (xp, vp) = forced_steady_state(mass, damping, spring, force, omega, t);
    let (xp0, vp0) = forced_steady_state(mass, damping, spring, force, omega, 0.0);
    let (xh, vh) = damped_state(mass, damping, spring, x0 - xp0, v0 - vp0, t);
    (xh + xp, vh + vp)
}

/// 定常解 \(x_p(t) = A\cos(\omega t - \delta)\) とその速度 \(-A\omega\sin(\omega t - \delta)\) を返します。これも厳密です。
pub fn forced_steady_state(mass: f64, damping: f64, spring: f64, force: f64, omega: f64, t: f64) -> (f64, f64) {
    let a = forced_amplitude(mass, damping, spring, force, omega);
    let delta = forced_phase(mass, damping, spring, omega);
    let (sin, cos) = (omega * t - delta).sin_cos();
    (a * cos, -a * omega * sin)
}

/// 2体問題の換算質量 \(\mu = m_1 m_2/(m_1 + m_2)\) を返します。
///
/// 相対位置 \(\mathbf{r} = \mathbf{r}_1 - \mathbf{r}_2\) は \(\mu\mathbf{r}'' = -G m_1 m_2 \hat{\mathbf{r}}/r^2\) に従います。
pub fn reduced_mass(m1: f64, m2: f64) -> f64 {
    m1 * m2 / (m1 + m2)
}

/// 楕円軌道の相対位置 \(\mathbf{r}(t)\) を、Kepler の方程式から返します。
///
/// 相対運動は \(\mathbf{r}'' = -GM\,\hat{\mathbf{r}}/r^2\)（\(M = m_1 + m_2\)）で、近点距離を \(r_p\)、
/// 離心率を \(e\)（\(0 \le e < 1\)）、時刻 0 に近点 \((r_p, 0)\) から反時計回りに出るとします。
/// 長半径は \(a = r_p/(1 - e)\)、短半径は \(b = a\sqrt{1 - e^2}\)、平均運動は \(n = \sqrt{GM/a^3}\) です。
/// 離心近点角 \(E\) は Kepler の方程式
/// \[ E - e\sin E = n t \]
/// の根で、[`crate::newton_step`] を \(f(E) = E - e\sin E - nt\)、\(f'(E) = 1 - e\cos E\) に繰り返して求めます。
/// 平均近点角 \(nt\) は \(2\pi\) の整数倍を除いて \([0, 2\pi)\) で解き、最後にその整数倍を戻します。
/// 位置は \(x = a(\cos E - e)\)、\(y = b\sin E\)、速度は \(\dot{E} = n/(1 - e\cos E)\) として
/// \(\dot{x} = -a\dot{E}\sin E\)、\(\dot{y} = b\dot{E}\cos E\) です。
/// 返す値は \((x, y, \dot{x}, \dot{y})\) です。Newton 法の反復は \(|f(E)| < 10^{-15}\) まで続けるので、
/// 値は Kepler の方程式の根を倍精度で求めた近似です。
pub fn kepler_state(gm: f64, periapsis: f64, eccentricity: f64, t: f64) -> [f64; 4] {
    let e = eccentricity;
    let a = periapsis / (1.0 - e);
    let b = a * (1.0 - e * e).sqrt();
    let n = (gm / (a * a * a)).sqrt();
    let tau = 2.0 * std::f64::consts::PI;
    let turns = (n * t / tau).floor();
    let mean = n * t - turns * tau;
    let mut anomaly = if e < 0.8 { mean } else { std::f64::consts::PI };
    for _ in 0..50 {
        let f = |x: f64| x - e * x.sin() - mean;
        if f(anomaly).abs() < 1e-15 {
            break;
        }
        anomaly = newton_step(anomaly, f, |x| 1.0 - e * x.cos());
    }
    let anomaly = anomaly + turns * tau;
    let (sin, cos) = anomaly.sin_cos();
    let rate = n / (1.0 - e * cos);
    [a * (cos - e), b * sin, -a * rate * sin, b * rate * cos]
}

/// 近点 \(r_p\) で離心率 \(e\) を与える近点の速さ \(v_p = \sqrt{GM(1 + e)/r_p}\) を返します。
///
/// 近点では速度が動径に垂直で、角運動量 \(h = r_p v_p\) と半直弦 \(p = h^2/(GM) = r_p(1 + e)\) が対応します。
pub fn kepler_periapsis_speed(gm: f64, periapsis: f64, eccentricity: f64) -> f64 {
    (gm * (1.0 + eccentricity) / periapsis).sqrt()
}

/// 円錐曲線 \(r(\theta) = p/(1 + e\cos\theta)\) を返します。\(p\) は半直弦、\(e\) は離心率、\(\theta\) は近点からの角です。
///
/// 逆2乗の中心力のもとで、軌道方程式 \(u'' + u = GM/h^2\)（\(u = 1/r\)、微分は \(\theta\) について）の解です。
pub fn conic_radius(semi_latus: f64, eccentricity: f64, theta: f64) -> f64 {
    semi_latus / (1.0 + eccentricity * theta.cos())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constant_force_matches_the_hand_example() {
        assert_eq!(constant_force_acceleration(2.0, 0.5), 4.0);
        assert_eq!(constant_force_position(1.0, 0.0, 2.0, 0.5, 2.0), 9.0);
        assert_eq!(constant_force_velocity(0.0, 2.0, 0.5, 2.0), 8.0);
    }

    #[test]
    fn harmonic_conserves_energy_and_starts_at_the_initial_values() {
        let omega = 2.0;
        assert_eq!(harmonic_position(1.0, 0.0, omega, 0.0), 1.0);
        assert_eq!(harmonic_velocity(1.0, 0.0, omega, 0.0), 0.0);
        for t in [0.3, 1.7, 5.0] {
            let x = harmonic_position(1.0, 0.5, omega, t);
            let v = harmonic_velocity(1.0, 0.5, omega, t);
            let e = spring_energy(1.0, 4.0, x, v);
            assert!((e - spring_energy(1.0, 4.0, 1.0, 0.5)).abs() < 1e-12);
        }
        let quarter = std::f64::consts::FRAC_PI_4;
        assert!(harmonic_position(1.0, 0.0, omega, quarter).abs() < 1e-15);
    }

    #[test]
    fn damped_cases_satisfy_the_equation() {
        for (m, g, k) in [(1.0, 0.4, 4.0), (1.0, 4.0, 4.0), (1.0, 6.0, 4.0)] {
            let (x0, v0) = damped_state(m, g, k, 1.0, 0.0, 0.0);
            assert!((x0 - 1.0).abs() < 1e-12 && v0.abs() < 1e-12);
            let h = 1e-4;
            for t in [0.5, 1.3] {
                let (x, v) = damped_state(m, g, k, 1.0, 0.0, t);
                let (_, vp) = damped_state(m, g, k, 1.0, 0.0, t + h);
                let (_, vm) = damped_state(m, g, k, 1.0, 0.0, t - h);
                let acc = (vp - vm) / (2.0 * h);
                assert!((m * acc + g * v + k * x).abs() < 1e-6, "{m} {g} {k}");
            }
        }
    }

    #[test]
    fn damped_example_at_pi_over_omega_d() {
        let wd = (4.0_f64 - 0.04_f64).sqrt();
        let t = std::f64::consts::PI / wd;
        let (x, _) = damped_state(1.0, 0.4, 4.0, 1.0, 0.0, t);
        assert!((x + (-0.2 * t).exp()).abs() < 1e-12);
    }

    #[test]
    fn forced_resonance_has_quarter_phase_and_the_hand_amplitude() {
        let a = forced_amplitude(1.0, 0.5, 4.0, 1.0, 2.0);
        assert!((a - 1.0).abs() < 1e-12);
        let d = forced_phase(1.0, 0.5, 4.0, 2.0);
        assert!((d - std::f64::consts::FRAC_PI_2).abs() < 1e-12);
        let (x, v) = forced_state(1.0, 0.5, 4.0, 1.0, 2.0, 0.0, 0.0, 0.0);
        assert!(x.abs() < 1e-12 && v.abs() < 1e-12);
    }

    #[test]
    fn two_body_hand_example() {
        assert!((reduced_mass(2.0, 1.0) - 2.0 / 3.0).abs() < 1e-15);
        let vp = kepler_periapsis_speed(3.0, 1.0, 0.5);
        assert!((vp - 4.5_f64.sqrt()).abs() < 1e-15);
        let h = 1.0 * vp;
        assert!((h * h / 3.0 - 1.5).abs() < 1e-14);
        assert!((conic_radius(1.5, 0.5, std::f64::consts::PI) - 3.0).abs() < 1e-15);
    }

    #[test]
    fn kepler_returns_to_periapsis_after_one_period() {
        let gm: f64 = 3.0;
        let (rp, e): (f64, f64) = (1.0, 0.5);
        let a = rp / (1.0 - e);
        let period = 2.0 * std::f64::consts::PI * (a * a * a / gm as f64).sqrt();
        let start = kepler_state(gm, rp, e, 0.0);
        let back = kepler_state(gm, rp, e, period);
        assert!((start[0] - 1.0).abs() < 1e-12 && start[1].abs() < 1e-12);
        assert!((start[3] - kepler_periapsis_speed(gm, rp, e)).abs() < 1e-12);
        assert!((back[0] - 1.0).abs() < 1e-9 && back[1].abs() < 1e-9);
        let state = kepler_state(gm, rp, e, 2.3);
        let r = state[0].hypot(state[1]);
        let theta = state[1].atan2(state[0]);
        assert!((r - conic_radius(1.5, e, theta)).abs() < 1e-12);
    }
}
