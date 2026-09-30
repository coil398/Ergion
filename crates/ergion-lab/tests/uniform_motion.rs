use ergion_lab::{UniformBatch, UniformSimulation, UniformSnapshot};
use serde_json::json;

fn uniform_config(x0: f64, v: f64, dt: f64, steps: u32) -> String {
    json!({
        "schema_version": 1,
        "initial_position": x0,
        "velocity": v,
        "dt": dt,
        "steps": steps
    })
    .to_string()
}

#[test]
fn uniform_motion_matches_exact_solution() {
    let mut sim = UniformSimulation::new(&uniform_config(2.0, 3.5, 0.05, 200)).unwrap();
    let initial: UniformSnapshot = serde_json::from_str(&sim.snapshot().unwrap()).unwrap();
    assert_eq!(initial.step, 0);
    assert_eq!(initial.position, 2.0);
    assert_eq!(initial.velocity, 3.5);
    assert_eq!(initial.exact_position, 2.0);

    let batch: UniformBatch = serde_json::from_str(&sim.advance(200).unwrap()).unwrap();
    assert!(batch.state.finished);
    assert_eq!(batch.state.step, 200);
    assert!((batch.state.time - 10.0).abs() < 1e-12);
    // x = 2.0 + 3.5 * 10.0 = 37.0
    assert!((batch.state.position - 37.0).abs() < 1e-12);
    assert_eq!(batch.state.velocity, 3.5);
    assert!((batch.state.exact_position - 37.0).abs() < 1e-12);
}

#[test]
fn uniform_motion_batches_are_identical() {
    let json = uniform_config(0.0, 1.5, 0.02, 100);
    let mut whole = UniformSimulation::new(&json).unwrap();
    let mut split = UniformSimulation::new(&json).unwrap();
    whole.advance(100).unwrap();
    for _ in 0..10 {
        split.advance(10).unwrap();
    }
    assert_eq!(whole.snapshot().unwrap(), split.snapshot().unwrap());
}

#[test]
fn rejects_invalid_uniform_configurations() {
    let base: serde_json::Value =
        serde_json::from_str(&uniform_config(0.0, 1.0, 0.01, 100)).unwrap();
    for (key, value) in [
        ("schema_version", json!(2)),
        ("dt", json!(0)),
        ("dt", json!(-0.01)),
        ("steps", json!(0)),
        ("steps", json!(1_000_001)),
        ("initial_position", json!(1e100)),
        ("velocity", json!(1e100)),
        ("unexpected", json!(1)),
    ] {
        let mut invalid = base.clone();
        invalid[key] = value;
        assert!(
            UniformSimulation::new(&invalid.to_string()).is_err(),
            "{key}: {invalid}"
        );
    }
    assert!(UniformSimulation::new("{}").is_err());
}
