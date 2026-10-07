use ergion_lab::{EulerMethod, StepCompareBatch, StepCompareSimulation, StepEquation};

fn finish(kind: StepEquation, method: EulerMethod, extra: &str) -> ergion_lab::StepCompareSnapshot {
    let json = format!(
        r#"{{"schema_version":1,"kind":"{kind}","method":"{method}","t0":{t0},"dt":0.015625,"steps":{steps}{extra}}}"#,
        kind = serde_json::to_value(kind).unwrap().as_str().unwrap(),
        method = serde_json::to_value(method).unwrap().as_str().unwrap(),
        t0 = if kind == StepEquation::Homogeneous { 1.0 } else { 0.0 },
        steps = if kind == StepEquation::Exact { 32 } else { 64 },
        extra = extra,
    );
    let mut simulation = StepCompareSimulation::new(&json).unwrap();
    let mut state: ergion_lab::StepCompareSnapshot =
        serde_json::from_str(&simulation.snapshot().unwrap()).unwrap();
    while !state.finished {
        let batch: StepCompareBatch = serde_json::from_str(&simulation.advance(64).unwrap()).unwrap();
        state = batch.state;
    }
    state
}

#[test]
fn separation_euler_error_is_truncation_and_rk4_is_smaller() {
    let extra = r#","initial_position":3,"k":2"#;
    let euler = finish(StepEquation::Separation, EulerMethod::Euler, extra);
    let rk4 = finish(StepEquation::Separation, EulerMethod::Rk4, extra);
    let exact = ergion_core::separated_exponential(3.0, 2.0, 1.0);
    assert!((euler.exact_position - exact).abs() < 1e-12);
    assert!((rk4.exact_position - exact).abs() < 1e-12);
    assert!(euler.position_error.abs() > 1e-2);
    assert!(rk4.position_error.abs() < euler.position_error.abs() / 10.0);
    assert!(rk4.position_error.abs() > 1e-12);
}

#[test]
fn accelerated_euler_misses_the_quadratic_term_and_midpoint_matches() {
    let extra = r#","initial_position":0,"initial_velocity":0,"acceleration":1,"dt":0.5,"steps":1"#;
    let euler = StepCompareSimulation::new(&format!(
        r#"{{"schema_version":1,"kind":"accelerated","method":"euler","t0":0{extra}}}"#
    ))
    .unwrap();
    let euler_batch: StepCompareBatch = serde_json::from_str(&{
        let mut euler = euler;
        euler.advance(1).unwrap()
    })
    .unwrap();
    assert!((euler_batch.state.position - 0.0).abs() < 1e-12);
    assert!((euler_batch.state.velocity - 0.5).abs() < 1e-12);
    assert!((euler_batch.state.exact_position - 0.125).abs() < 1e-12);
    assert!((euler_batch.state.position_error + 0.125).abs() < 1e-12);

    let mut midpoint = StepCompareSimulation::new(&format!(
        r#"{{"schema_version":1,"kind":"accelerated","method":"midpoint","t0":0{extra}}}"#
    ))
    .unwrap();
    let batch: StepCompareBatch = serde_json::from_str(&midpoint.advance(1).unwrap()).unwrap();
    assert!((batch.state.position - 0.125).abs() < 1e-12);
    assert!((batch.state.velocity - 0.5).abs() < 1e-12);
    assert!(batch.state.position_error.abs() < 1e-12);
}

#[test]
fn system_euler_error_is_nonzero_in_both_components() {
    let state = finish(StepEquation::System, EulerMethod::Euler, "");
    assert!((state.exact_position - ergion_core::linear_system_x(1.0)).abs() < 1e-12);
    assert!((state.exact_velocity - ergion_core::linear_system_y(1.0)).abs() < 1e-12);
    assert!(state.position_error.abs() > 1e-2);
    assert!(state.velocity_error.abs() > 1e-2);
}

#[test]
fn constant_velocity_error_is_only_rounding() {
    for method in [EulerMethod::Euler, EulerMethod::Midpoint, EulerMethod::Rk4] {
        let state = finish(
            StepEquation::Uniform,
            method,
            r#","initial_position":0,"velocity":2"#,
        );
        assert!(state.position_error.abs() < 1e-9, "{method:?} {}", state.position_error);
    }
}

#[test]
fn every_textbook_example_finishes_with_euler() {
    for kind in [
        StepEquation::Homogeneous,
        StepEquation::Exact,
        StepEquation::Bernoulli,
        StepEquation::TwoReal,
        StepEquation::Undetermined,
        StepEquation::Variation,
        StepEquation::Laplace,
        StepEquation::Series,
        StepEquation::System,
    ] {
        let state = finish(kind, EulerMethod::Euler, "");
        assert!(state.finished, "{kind:?}");
        assert!(state.position.is_finite() && state.exact_position.is_finite(), "{kind:?}");
        assert!(state.position_error.abs() > 1e-8, "{kind:?} {}", state.position_error);
    }
}

#[test]
fn compare_rejects_a_bad_interval_and_an_unknown_field() {
    assert!(StepCompareSimulation::new(
        r#"{"schema_version":1,"kind":"homogeneous","method":"euler","t0":0,"dt":0.015625,"steps":64}"#
    )
    .is_err());
    assert!(StepCompareSimulation::new(
        r#"{"schema_version":1,"kind":"separation","method":"euler","t0":0,"dt":0.015625,"steps":64,"initial_position":3,"k":2,"extra":1}"#
    )
    .is_err());
}
