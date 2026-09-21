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

/// Advances a separable system with position-dependent acceleration.
/// Panics if the position and velocity dimensions differ.
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
        position[i] += dt * velocity[i];
    }
    acceleration(position, &mut a);
    for i in 0..position.len() {
        velocity[i] += 0.5 * dt * a[i];
    }
}
