use ergion_lab::{
    ConstantAccelerationBatch, ConstantAccelerationSimulation, ConstantAccelerationSnapshot,
};
use serde_json::json;

fn config(x0: f64, v0: f64, acceleration: f64, dt: f64, steps: u32) -> String {
    json!({
        "schema_version": 1,
        "initial_position": x0,
        "initial_velocity": v0,
        "acceleration": acceleration,
        "dt": dt,
        "steps": steps
    })
    .to_string()
}

#[test]
fn constant_acceleration_matches_exact_polynomial() {
    let mut sim = ConstantAccelerationSimulation::new(&config(1.0, 2.0, 0.5, 0.25, 8)).unwrap();
    let initial: ConstantAccelerationSnapshot =
        serde_json::from_str(&sim.snapshot().unwrap()).unwrap();
    assert_eq!(initial.step, 0);
    assert_eq!(initial.position, 1.0);
    assert_eq!(initial.velocity, 2.0);
    assert_eq!(initial.exact_position, 1.0);
    assert_eq!(initial.exact_velocity, 2.0);

    let batch: ConstantAccelerationBatch = serde_json::from_str(&sim.advance(8).unwrap()).unwrap();
    assert!(batch.state.finished);
    assert_eq!(batch.state.step, 8);
    assert!((batch.state.time - 2.0).abs() < 1e-12);
    // v = 2 + 0.5 * 2 = 3
    // x = 1 + 2 * 2 + 0.5 * 0.5 * 4 = 6
    assert!((batch.state.velocity - 3.0).abs() < 1e-12);
    assert!((batch.state.position - 6.0).abs() < 1e-12);
    assert!((batch.state.exact_velocity - 3.0).abs() < 1e-12);
    assert!((batch.state.exact_position - 6.0).abs() < 1e-12);
    assert!((batch.state.position - batch.state.exact_position).abs() < 1e-12);
    assert!((batch.state.velocity - batch.state.exact_velocity).abs() < 1e-12);
}

#[test]
fn zero_acceleration_matches_uniform_motion() {
    let mut sim = ConstantAccelerationSimulation::new(&config(2.0, 3.5, 0.0, 0.05, 200)).unwrap();
    let batch: ConstantAccelerationBatch =
        serde_json::from_str(&sim.advance(200).unwrap()).unwrap();
    assert!((batch.state.time - 10.0).abs() < 1e-12);
    assert!((batch.state.position - 37.0).abs() < 1e-12);
    assert_eq!(batch.state.velocity, 3.5);
    assert!((batch.state.exact_position - 37.0).abs() < 1e-12);
    assert_eq!(batch.state.exact_velocity, 3.5);
}

#[test]
fn constant_acceleration_batches_are_identical() {
    let json = config(0.0, -1.0, 0.25, 0.125, 40);
    let mut whole = ConstantAccelerationSimulation::new(&json).unwrap();
    let mut split = ConstantAccelerationSimulation::new(&json).unwrap();
    whole.advance(40).unwrap();
    for _ in 0..4 {
        split.advance(10).unwrap();
    }
    assert_eq!(whole.snapshot().unwrap(), split.snapshot().unwrap());
}

#[test]
fn rejects_invalid_constant_acceleration_configurations() {
    let base: serde_json::Value = serde_json::from_str(&config(0.0, 1.0, -2.0, 0.01, 100)).unwrap();
    for (key, value) in [
        ("schema_version", json!(2)),
        ("dt", json!(0)),
        ("dt", json!(-0.01)),
        ("steps", json!(0)),
        ("steps", json!(1_000_001)),
        ("initial_position", json!(1e100)),
        ("initial_velocity", json!(1e100)),
        ("acceleration", json!(1e100)),
        ("unexpected", json!(1)),
    ] {
        let mut invalid = base.clone();
        invalid[key] = value;
        assert!(
            ConstantAccelerationSimulation::new(&invalid.to_string()).is_err(),
            "{key}: {invalid}"
        );
    }
    assert!(ConstantAccelerationSimulation::new("{}").is_err());
}
