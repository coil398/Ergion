use ergion_lab::{Batch, Simulation, Snapshot};
use serde_json::json;

fn config(integrator: &str, dt: f64, steps: u32) -> String {
    json!({"schema_version":1,"mass":1.0,"spring_constant":1.0,"initial_position":1.0,"initial_velocity":0.0,"dt":dt,"steps":steps,"integrator":integrator}).to_string()
}

fn finish(integrator: &str, dt: f64, steps: u32) -> Snapshot {
    let mut simulation = Simulation::new(&config(integrator, dt, steps)).unwrap();
    loop {
        let batch: Batch = serde_json::from_str(&simulation.advance(500).unwrap()).unwrap();
        if batch.state.finished {
            return batch.state;
        }
    }
}

#[test]
fn integrators_converge_at_expected_orders() {
    for (method, lower, upper) in [("rk4", 14.0, 18.0), ("verlet", 3.8, 4.2)] {
        let coarse = finish(method, 0.1, 100);
        let fine = finish(method, 0.05, 200);
        let error =
            |s: &Snapshot| (s.position - s.exact_position).hypot(s.velocity - s.exact_velocity);
        let ratio = error(&coarse) / error(&fine);
        assert!((lower..upper).contains(&ratio), "{method}: ratio {ratio}");
        assert!(error(&fine) < 0.02);
    }
}

#[test]
fn energy_is_bounded_and_initial_values_match() {
    for method in ["rk4", "verlet"] {
        let mut simulation = Simulation::new(&config(method, 0.02, 10_000)).unwrap();
        let initial: Snapshot = serde_json::from_str(&simulation.snapshot().unwrap()).unwrap();
        assert_eq!(initial.step, 0);
        assert_eq!(initial.total_energy, 0.5);
        assert_eq!(initial.exact_position, initial.position);
        while !serde_json::from_str::<Snapshot>(&simulation.snapshot().unwrap())
            .unwrap()
            .finished
        {
            let batch: Batch = serde_json::from_str(&simulation.advance(500).unwrap()).unwrap();
            assert!(
                batch
                    .samples
                    .iter()
                    .all(|s| s.relative_energy_error.abs() < 0.00011)
            );
        }
    }
}

#[test]
fn batches_are_identical_and_completion_is_clamped() {
    let json = config("verlet", 0.02, 12);
    let mut whole = Simulation::new(&json).unwrap();
    let mut split = Simulation::new(&json).unwrap();
    whole.advance(500).unwrap();
    for _ in 0..4 {
        split.advance(3).unwrap();
    }
    assert_eq!(whole.snapshot().unwrap(), split.snapshot().unwrap());
    let batch: Batch = serde_json::from_str(&whole.advance(1).unwrap()).unwrap();
    assert!(batch.samples.is_empty());
    assert_eq!(batch.state.step, 12);
    assert_eq!(batch.state.time, 0.24);
    assert!(batch.state.finished);
    assert!(whole.advance(0).is_err());
    assert!(whole.advance(501).is_err());
}

#[test]
fn rejects_invalid_configurations() {
    let base: serde_json::Value = serde_json::from_str(&config("verlet", 0.02, 100)).unwrap();
    for (key, value) in [
        ("schema_version", json!(2)),
        ("mass", json!(0)),
        ("mass", json!(-1)),
        ("spring_constant", json!(0)),
        ("dt", json!(0)),
        ("dt", json!(2)),
        ("steps", json!(0)),
        ("steps", json!(1_000_001)),
        ("steps", json!(1.5)),
        ("integrator", json!("euler")),
        ("unexpected", json!(1)),
        ("initial_position", json!(1e100)),
        ("initial_velocity", json!(1e100)),
        ("mass", json!(1e-320)),
    ] {
        let mut invalid = base.clone();
        invalid[key] = value;
        assert!(
            Simulation::new(&invalid.to_string()).is_err(),
            "{key}: {invalid}"
        );
    }
    assert!(Simulation::new("{}").is_err());
    assert!(Simulation::new(&config("rk4", 0.02, 100).replace("0.02", "NaN")).is_err());
}

#[test]
fn zero_energy_stays_finite() {
    let mut value: serde_json::Value = serde_json::from_str(&config("rk4", 0.02, 1)).unwrap();
    value["initial_position"] = json!(0);
    let mut simulation = Simulation::new(&value.to_string()).unwrap();
    let batch: Batch = serde_json::from_str(&simulation.advance(500).unwrap()).unwrap();
    assert_eq!(batch.samples.len(), 1);
    assert_eq!(batch.state.relative_energy_error, 0.0);
    assert_eq!(batch.state.total_energy, 0.0);
}
