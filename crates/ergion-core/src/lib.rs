//! Domain-independent, double-precision time integration.

/// Advances a general first-order ODE by one classical RK4 step.
/// `derivative` must fill every component of its output slice.
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
}
