//! Domain-independent, double-precision time integration.

/// 微分方程式 \(x' = f(x, t)\) を、古典的な4次の Runge–Kutta 法で1ステップ進める。
///
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\)、時間刻みを \(\Delta t\) とします。
/// 四つの傾きは、始点、中点を二度、終点で右辺を評価したものです。
/// \[
/// \begin{align*}
/// k_1 &= f(x_n, t_n), \\
/// k_2 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_1,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// k_3 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_2,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// k_4 &= f(x_n + \Delta t\, k_3,\ t_n + \Delta t).
/// \end{align*}
/// \]
/// 位置は次の式で進みます。
/// \[
/// x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)
/// \]
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、四つの傾きは同じ値です。
/// そのときこの式は \(x_n + \Delta t\, f\) と一致し、区間の積分と同じ厳密な増分です。
/// 打ち切り誤差はありません。数値との差は、倍精度浮動小数点の丸めだけです。
/// 右辺が区間の途中で変わるときは、この1ステップは近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn rk4_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut k1 = vec![0.0; state.len()];
    let mut k2 = k1.clone();
    let mut k3 = k1.clone();
    let mut k4 = k1.clone();
    let mut stage = k1.clone();
    derivative(time, state, &mut k1);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * 0.5 * k1[i];
    }
    derivative(time + dt * 0.5, &stage, &mut k2);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * 0.5 * k2[i];
    }
    derivative(time + dt * 0.5, &stage, &mut k3);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * k3[i];
    }
    derivative(time + dt, &stage, &mut k4);
    for i in 0..state.len() {
        state[i] += dt / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
    }
}

/// 微分方程式 \(x' = f(x, t)\) を、Euler 法で時間刻み \(\Delta t\) の1ステップだけ進める。
///
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\) とします。
/// \(\Delta t\) はこの1ステップの時間刻みです。
/// Euler 法は、右辺を区間 \([t_n, t_n + \Delta t]\) の始点の値で一定とみなし、
/// \[
/// x_{n+1} = x_n + \Delta t \, f(x_n, t_n)
/// \]
/// と進めます。
///
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、この式は、その区間で微分方程式を積分した結果と一致します。
/// その1ステップは厳密です。打ち切り誤差はありません。
/// 数値と厳密な増分との差は、倍精度浮動小数点の丸めだけです。
/// \(x' = v\) で速度 \(v\) が一定のときは \(f(x_n, t_n) = v\) なので、
/// \[
/// x_{n+1} = x_n + v \Delta t
/// \]
/// となり、[`x_prime_eq_v_step`] と同じ更新です。
///
/// 右辺が区間の途中で変わるときは、始点の値だけで区間全体を置き換える近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn euler_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut slope = vec![0.0; state.len()];
    derivative(time, state, &mut slope);
    assert_eq!(slope.len(), state.len());
    for i in 0..state.len() {
        state[i] += dt * slope[i];
    }
}

/// 微分方程式 \(x' = f(x, t)\) を、中点法で時間刻み \(\Delta t\) の1ステップだけ進める。
///
/// 中点法は、2次の Runge–Kutta 法です。
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\) とします。
/// \(\Delta t\) はこの1ステップの時間刻みです。
/// まず始点の傾きを求め、その傾きで区間の中点まで仮に進んだ位置の傾きを使います。
/// \[
/// \begin{align*}
/// k_1 &= f(x_n, t_n), \\
/// k_2 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_1,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// x_{n+1} &= x_n + \Delta t\, k_2.
/// \end{align*}
/// \]
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、\(k_1 = k_2 = f\) です。
/// そのときこの式は \(x_n + \Delta t\, f\) と一致し、[`euler_step`] および区間の積分と同じ厳密な増分です。
/// 打ち切り誤差はありません。数値との差は、倍精度浮動小数点の丸めだけです。
/// 右辺が区間の途中で変わるときは、中点の傾きで区間全体を置き換える近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn midpoint_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut k1 = vec![0.0; state.len()];
    let mut k2 = vec![0.0; state.len()];
    let mut stage = vec![0.0; state.len()];
    derivative(time, state, &mut k1);
    assert_eq!(k1.len(), state.len());
    for i in 0..state.len() {
        stage[i] = state[i] + 0.5 * dt * k1[i];
    }
    derivative(time + 0.5 * dt, &stage, &mut k2);
    assert_eq!(k2.len(), state.len());
    for i in 0..state.len() {
        state[i] += dt * k2[i];
    }
}

/// 微分方程式 \(x' = v\) を、時間刻み \(\Delta t\) で1ステップ進める。
///
/// \(x\) は直線上の位置、\(v\) は速度、\(t\) は時刻です。
/// \(\Delta t\) はこの1ステップの時間刻み、\(x_n\) はステップ \(n\) の位置です。
/// この刻みのあいだ速度 \(v\) が一定ならば、\(x' = v\) を区間 \([t_n, t_n + \Delta t]\) で積分して
/// \[
/// x_{n+1} = x_n + v \Delta t
/// \]
/// を得ます。右辺は、速度が区間内で一定であるときの厳密な増分です。
/// 打ち切り誤差はありません。数値とこの式との差は、倍精度浮動小数点の丸めだけです。
/// この更新は、右辺が一定の速度であるときの [`euler_step`] です。
/// 速度が区間の途中で変わる運動は、この関数では扱いません。
///
/// `position` と `velocity` の成分数は同じでなければなりません。
pub fn x_prime_eq_v_step(position: &mut [f64], velocity: &[f64], dt: f64) {
    assert_eq!(position.len(), velocity.len());
    euler_step(position, 0.0, dt, |_time, _state, slope| {
        slope.copy_from_slice(velocity);
    });
}

/// Advances a separable system with position-dependent acceleration.
/// Panics if the position and velocity dimensions differ.
///
/// The position update is one step of \(x' = v\), taken by [`x_prime_eq_v_step`]
/// at the half-step velocity.
pub fn velocity_verlet_step(
    position: &mut [f64],
    velocity: &mut [f64],
    dt: f64,
    acceleration: impl Fn(&[f64], &mut [f64]),
) {
    assert_eq!(position.len(), velocity.len());
    let mut a = vec![0.0; position.len()];
    acceleration(position, &mut a);
    for i in 0..position.len() {
        velocity[i] += 0.5 * dt * a[i];
    }
    x_prime_eq_v_step(position, velocity, dt);
    acceleration(position, &mut a);
    for i in 0..position.len() {
        velocity[i] += 0.5 * dt * a[i];
    }
}

/// 変数分離で解く \(x' = kx\) の厳密解 \(x(t) = x_0 e^{kt}\) を返します。
///
/// \(k\) は時刻にも位置にもよらない定数です。初期位置を \(x(0) = x_0\) とします。
/// まず \(x \neq 0\) と仮定し、両辺を \(x\) で割って変数を分けます。
/// \[
/// \frac{dx}{x} = k\,dt
/// \]
/// 両辺を積分すると \(\ln|x| = kt + C\) です。\(C\) は積分定数です。
/// 指数関数に戻すと \(|x| = e^{C} e^{kt}\) です。
/// \(e^{C}\) は正なので、符号を含めた 0 でない定数を \(A = \pm e^{C}\) と書くと
/// \(x = A e^{kt}\) です。\(t = 0\) で \(A = x_0\) となり、
/// \[
/// x(t) = x_0 e^{kt}
/// \]
/// を得ます。\(x(t)\) は時刻 \(t\) の位置、\(t\) は時刻、\(x_0\) は時刻 0 の位置、
/// \(k\) は定数係数、\(e\) は自然対数の底です。
///
/// 定数関数 \(x(t) = 0\) も方程式を満たします。変数分離では \(x\) で割るため、
/// この解は積分の外にあります。\(x_0 = 0\) を公式へ入れると 0 になり、この定数解を含みます。
/// \(x_0 = 0\) のときは、指数が無限大でも 0 を返します。
///
/// この値は、級数にも時間刻みにもよらない厳密解です。打ち切り誤差はありません。
/// 数値との差は、倍精度の指数関数の丸めだけです。\(k\) が正でも負でも同じ式です。
pub fn separated_exponential(x0: f64, k: f64, t: f64) -> f64 {
    if x0 == 0.0 {
        return 0.0;
    }
    x0 * (k * t).exp()
}

/// 定数係数の1階線形方程式 \(x' + px = q\) の厳密解を返します。
///
/// \(p\) と \(q\) は定数で、\(p \neq 0\) とします。\(p = 0\) の方程式は \(x' = q\) であり、
/// 右辺が定数の積分です。この関数はその場合を扱いません。
/// 初期位置を \(x(0) = x_0\) とします。積分因子 \(e^{pt}\) を両辺に掛けると
/// \[
/// \frac{d}{dt}\bigl(x e^{pt}\bigr) = q e^{pt}
/// \]
/// です。\(p \neq 0\) として積分し、\(e^{pt} \neq 0\) で割ると
/// \(x = q/p + C e^{-pt}\) です。\(C\) は積分定数です。
/// \(t = 0\) から \(C = x_0 - q/p\) となり、
/// \[
/// x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}
/// \]
/// を得ます。\(x(t)\) は時刻 \(t\) の位置、\(t\) は時刻、\(x_0\) は時刻 0 の位置、
/// \(p\) は未知関数の係数、\(q\) は右辺の定数、\(e\) は自然対数の底です。
///
/// この値は、級数にも時間刻みにもよらない厳密解です。打ち切り誤差はありません。
/// 数値との差は、倍精度の除算と指数関数の丸めだけです。
pub fn first_order_linear(x0: f64, p: f64, q: f64, t: f64) -> f64 {
    let particular = q / p;
    particular + (x0 - particular) * (-p * t).exp()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn euler_step_with_constant_slope_is_exact() {
        let mut state = [1.0];
        euler_step(&mut state, 4.0, 0.4, |time, value, slope| {
            assert_eq!(time, 4.0);
            assert_eq!(value, &[1.0]);
            slope[0] = 2.5;
        });
        assert_eq!(state[0], 1.0 + 0.4 * 2.5);
    }

    #[test]
    fn euler_step_uses_the_slope_at_the_start_of_the_interval() {
        let mut state = [0.0];
        euler_step(&mut state, 1.0, 0.5, |time, _value, slope| {
            slope[0] = time;
        });
        assert_eq!(state[0], 0.5);
    }

    #[test]
    fn midpoint_step_with_constant_slope_matches_euler() {
        let mut midpoint = [1.0];
        midpoint_step(&mut midpoint, 4.0, 0.4, |_time, _value, slope| {
            slope[0] = 2.5;
        });
        let mut euler = [1.0];
        euler_step(&mut euler, 4.0, 0.4, |_, _, slope| slope[0] = 2.5);
        assert_eq!(midpoint, euler);
        assert_eq!(midpoint[0], 1.0 + 0.4 * 2.5);
    }

    #[test]
    fn midpoint_step_uses_the_slope_at_the_middle() {
        let mut state = [0.0];
        midpoint_step(&mut state, 0.0, 1.0, |time, _value, slope| {
            slope[0] = time * time;
        });
        assert_eq!(state[0], 0.25);
    }

    #[test]
    fn rk4_step_with_constant_slope_is_exact_aside_from_rounding() {
        let mut state = [0.0];
        rk4_step(&mut state, 0.0, 0.25, |_, _, slope| slope[0] = 2.0);
        assert_eq!(state[0], 0.5);
    }

    #[test]
    fn x_prime_eq_v_step_is_exact_when_velocity_is_constant() {
        let mut position = [1.0];
        x_prime_eq_v_step(&mut position, &[2.5], 0.4);
        assert_eq!(position[0], 1.0 + 0.4 * 2.5);
        let mut euler = [1.0];
        euler_step(&mut euler, 0.0, 0.4, |_, _, slope| slope[0] = 2.5);
        assert_eq!(position, euler);
    }

    #[test]
    fn zero_acceleration_verlet_matches_x_prime_eq_v_step() {
        let mut verlet_position = [1.25];
        let mut verlet_velocity = [3.0];
        velocity_verlet_step(&mut verlet_position, &mut verlet_velocity, 0.2, |_, a| {
            a[0] = 0.0;
        });
        let mut position = [1.25];
        x_prime_eq_v_step(&mut position, &[3.0], 0.2);
        assert_eq!(verlet_position, position);
        assert_eq!(verlet_velocity, [3.0]);
    }

    #[test]
    fn constant_acceleration_verlet_steps_position_with_half_step_velocity() {
        let mut position = [0.0];
        let mut velocity = [1.0];
        velocity_verlet_step(&mut position, &mut velocity, 0.25, |_, acceleration| {
            acceleration[0] = 4.0;
        });
        assert_eq!(position[0], 0.375);
        assert_eq!(velocity[0], 2.0);
    }

    #[test]
    fn separated_exponential_zero_initial_position_is_the_zero_solution() {
        assert_eq!(separated_exponential(0.0, 2.0, 4.0), 0.0);
        assert_eq!(separated_exponential(0.0, 1e300, 1e300), 0.0);
    }

    #[test]
    fn separated_exponential_with_zero_rate_stays_at_the_initial_position() {
        assert_eq!(separated_exponential(3.0, 0.0, 4.0), 3.0);
    }

    #[test]
    fn separated_exponential_at_zero_time_is_the_initial_position() {
        assert_eq!(separated_exponential(3.0, 2.0, 0.0), 3.0);
    }

    #[test]
    fn separated_exponential_matches_the_closed_form() {
        let value = separated_exponential(3.0, 2.0, 1.0);
        assert!((value - 3.0 * 2.0_f64.exp()).abs() < 1e-12);
    }

    #[test]
    fn first_order_linear_at_zero_time_is_the_initial_position() {
        assert_eq!(first_order_linear(1.0, 2.0, 6.0, 0.0), 1.0);
    }

    #[test]
    fn first_order_linear_matches_the_closed_form() {
        let value = first_order_linear(1.0, 2.0, 6.0, 1.0);
        assert!((value - (3.0 - 2.0 * (-2.0_f64).exp())).abs() < 1e-12);
    }
}
