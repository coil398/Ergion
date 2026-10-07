use ergion_lab::{EulerBatch, EulerSimulation, EulerSnapshot};

#[test]
fn one_step_matches_the_exact_increment() {
    let mut simulation = EulerSimulation::new(
        r#"{"schema_version":1,"initial_position":1,"velocity":2,"dt":0.25,"steps":4}"#,
    )
    .unwrap();
    let batch: EulerBatch = serde_json::from_str(&simulation.advance(1).unwrap()).unwrap();
    assert_eq!(batch.state.position, 1.5);
    assert_eq!(batch.state.velocity, 2.0);
    assert_eq!(batch.state.exact_position, 1.5);
    assert_eq!(batch.state.time, 0.25);
}

#[test]
fn repeated_steps_match_the_closed_form() {
    let mut simulation = EulerSimulation::new(
        r#"{"schema_version":1,"initial_position":2,"velocity":3.5,"dt":0.05,"steps":200}"#,
    )
    .unwrap();
    let mut state = EulerSnapshot {
        step: 0,
        time: 0.0,
        position: 0.0,
        velocity: 0.0,
        exact_position: 0.0,
        exact_velocity: 0.0,
        finished: false,
    };
    while !state.finished {
        let batch: EulerBatch = serde_json::from_str(&simulation.advance(500).unwrap()).unwrap();
        state = batch.state;
    }
    assert!((state.position - 37.0).abs() < 1e-12);
    assert_eq!(state.velocity, 3.5);
    assert!((state.exact_position - 37.0).abs() < 1e-12);
    assert!((state.position - state.exact_position).abs() < 1e-12);
}

#[test]
fn rejects_invalid_euler_configurations() {
    for json in [
        r#"{"schema_version":2,"initial_position":0,"velocity":1,"dt":0.1,"steps":1}"#,
        r#"{"schema_version":1,"initial_position":0,"velocity":1,"dt":0,"steps":1}"#,
        r#"{"schema_version":1,"initial_position":0,"velocity":1,"dt":0.1,"steps":0}"#,
        r#"{"schema_version":1,"initial_position":1e100,"velocity":1,"dt":0.1,"steps":1}"#,
        r#"{"schema_version":1,"initial_position":0,"velocity":1,"dt":0.1,"steps":1,"extra":1}"#,
        "{}",
    ] {
        assert!(EulerSimulation::new(json).is_err(), "{json}");
    }
}
