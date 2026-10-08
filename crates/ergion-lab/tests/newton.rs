use ergion_lab::{NewtonBatch, NewtonSimulation, NewtonSnapshot};

#[test]
fn four_iterations_from_one_leave_a_visible_error_against_the_square_root() {
    let mut simulation = NewtonSimulation::new(r#"{"schema_version":1,"steps":4}"#).unwrap();
    let initial: NewtonSnapshot = serde_json::from_str(&simulation.snapshot().unwrap()).unwrap();
    assert_eq!(initial.position, 1.0);
    assert_eq!(initial.time, 0.0);
    assert!(!initial.finished);

    let batch: NewtonBatch = serde_json::from_str(&simulation.advance(4).unwrap()).unwrap();
    assert_eq!(batch.samples[0].position, 1.5);
    assert!((batch.samples[1].position - 17.0 / 12.0).abs() < 1e-12);
    let root = 2.0_f64.sqrt();
    assert!((batch.state.exact_position - root).abs() < 1e-15);
    assert!((batch.state.position_error - (batch.state.position - root)).abs() < 1e-15);
    assert!(batch.state.position_error.abs() > 1e-15);
    assert!(batch.state.position_error.abs() < 1e-11);
    assert!(batch.state.finished);
    assert_eq!(batch.state.time, 4.0);
}

#[test]
fn unknown_fields_are_rejected() {
    assert!(NewtonSimulation::new(r#"{"schema_version":1,"steps":4,"dt":1}"#).is_err());
}
