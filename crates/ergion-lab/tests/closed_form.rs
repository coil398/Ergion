use ergion_lab::{ClosedFormBatch, ClosedFormSnapshot, LinearSimulation, SeparationSimulation};

fn run_to_end(mut advance: impl FnMut(u32) -> String) -> ClosedFormSnapshot {
    let mut state = ClosedFormSnapshot {
        step: 0,
        time: 0.0,
        position: 0.0,
        velocity: 0.0,
        exact_position: 0.0,
        exact_velocity: 0.0,
        finished: false,
    };
    while !state.finished {
        let batch: ClosedFormBatch = serde_json::from_str(&advance(64)).unwrap();
        state = batch.state;
    }
    state
}

#[test]
fn separation_example_matches_the_library_at_time_one() {
    let mut simulation = SeparationSimulation::new(
        r#"{"schema_version":1,"initial_position":3,"k":2,"dt":0.015625,"steps":64}"#,
    )
    .unwrap();
    let initial: ClosedFormSnapshot = serde_json::from_str(&simulation.snapshot().unwrap()).unwrap();
    assert!((initial.time).abs() < 1e-12);
    assert!((initial.position - 3.0).abs() < 1e-12);
    let state = run_to_end(|steps| simulation.advance(steps).unwrap());
    let expected = ergion_core::separated_exponential(3.0, 2.0, 1.0);
    assert!((state.time - 1.0).abs() < 1e-12);
    assert!((state.position - expected).abs() < 1e-12);
    assert!((state.exact_position - expected).abs() < 1e-12);
    assert!((state.velocity - 2.0 * expected).abs() < 1e-12);
    assert!(state.finished);
}

#[test]
fn linear_example_matches_the_library_at_time_one() {
    let mut simulation = LinearSimulation::new(
        r#"{"schema_version":1,"initial_position":1,"p":2,"q":6,"dt":0.015625,"steps":64}"#,
    )
    .unwrap();
    let initial: ClosedFormSnapshot = serde_json::from_str(&simulation.snapshot().unwrap()).unwrap();
    assert!((initial.position - 1.0).abs() < 1e-12);
    let state = run_to_end(|steps| simulation.advance(steps).unwrap());
    let expected = ergion_core::first_order_linear(1.0, 2.0, 6.0, 1.0);
    assert!((state.time - 1.0).abs() < 1e-12);
    assert!((state.position - expected).abs() < 1e-12);
    assert!((state.exact_position - expected).abs() < 1e-12);
    assert!((state.velocity - (6.0 - 2.0 * expected)).abs() < 1e-12);
    assert!(state.finished);
}

#[test]
fn rejects_invalid_closed_form_configurations() {
    for json in [
        r#"{"schema_version":1,"initial_position":3,"k":2,"dt":0.015625,"steps":0}"#,
        r#"{"schema_version":1,"initial_position":3,"k":2,"dt":0.015625,"steps":64,"extra":1}"#,
        r#"{"schema_version":1,"initial_position":1,"k":1e12,"dt":1e12,"steps":1}"#,
        "{}",
    ] {
        assert!(SeparationSimulation::new(json).is_err(), "{json}");
    }
    for json in [
        r#"{"schema_version":1,"initial_position":1,"p":0,"q":6,"dt":0.015625,"steps":64}"#,
        r#"{"schema_version":1,"initial_position":1,"p":2,"q":6,"dt":0.015625,"steps":0}"#,
        r#"{"schema_version":1,"initial_position":1,"p":2,"q":6,"dt":0.015625,"steps":64,"extra":1}"#,
        "{}",
    ] {
        assert!(LinearSimulation::new(json).is_err(), "{json}");
    }
}
