use ergion_lab::{ClosedFormBatch, ClosedFormSnapshot, TextbookSimulation};

fn finish(json: &str) -> ClosedFormSnapshot {
    let mut simulation = TextbookSimulation::new(json).unwrap();
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
        let batch: ClosedFormBatch = serde_json::from_str(&simulation.advance(64).unwrap()).unwrap();
        state = batch.state;
    }
    state
}

#[test]
fn textbook_examples_match_the_library_at_the_endpoint() {
    let cases = [
        (
            r#"{"schema_version":1,"kind":"homogeneous","t0":1,"dt":0.015625,"steps":64}"#,
            ergion_core::homogeneous_ratio(0.0, 2.0),
            2.0,
        ),
        (
            r#"{"schema_version":1,"kind":"exact","t0":0,"dt":0.015625,"steps":32}"#,
            ergion_core::exact_quadratic(0.5),
            0.5,
        ),
        (
            r#"{"schema_version":1,"kind":"bernoulli","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::bernoulli_logistic(0.5, 1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"two-real","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::characteristic_two_real(1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"undetermined","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::undetermined_coefficient(1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"variation","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::variation_of_parameters(1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"laplace","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::laplace_ivp(1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"series","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::power_series_cosine(1.0),
            1.0,
        ),
        (
            r#"{"schema_version":1,"kind":"system","t0":0,"dt":0.015625,"steps":64}"#,
            ergion_core::linear_system_x(1.0),
            1.0,
        ),
    ];
    for (json, expected, time) in cases {
        let state = finish(json);
        assert!((state.time - time).abs() < 1e-12, "{json}");
        assert!((state.position - expected).abs() < 1e-12, "{json}");
        assert!((state.exact_position - expected).abs() < 1e-12, "{json}");
        assert!(state.finished, "{json}");
    }
    let system = finish(r#"{"schema_version":1,"kind":"system","t0":0,"dt":0.015625,"steps":64}"#);
    let y = ergion_core::linear_system_y(1.0);
    assert!((system.velocity - y).abs() < 1e-12);
}

#[test]
fn rejects_invalid_textbook_configurations() {
    for json in [
        r#"{"schema_version":1,"kind":"homogeneous","t0":0,"dt":0.015625,"steps":64}"#,
        r#"{"schema_version":1,"kind":"exact","t0":2,"dt":0.015625,"steps":1}"#,
        r#"{"schema_version":1,"kind":"variation","t0":2,"dt":0.015625,"steps":1}"#,
        r#"{"schema_version":1,"kind":"series","t0":0,"dt":0.015625,"steps":0}"#,
        r#"{"schema_version":1,"kind":"series","t0":0,"dt":0.015625,"steps":64,"extra":1}"#,
        "{}",
    ] {
        assert!(TextbookSimulation::new(json).is_err(), "{json}");
    }
}
