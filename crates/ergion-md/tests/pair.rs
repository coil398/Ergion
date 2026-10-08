use ergion_md::{ForceShiftedLj, LjError};

const R_MIN: f64 = 1.122_462_048_309_373; // 2^(1/6)

fn reference() -> ForceShiftedLj {
    ForceShiftedLj::new(1.0, 1.0, 2.5).unwrap()
}

fn relative(actual: f64, expected: f64) -> f64 {
    (actual - expected).abs() / expected.abs()
}

#[test]
fn matches_independent_value_at_potential_minimum() {
    let lj = reference();
    let term = lj.pair(R_MIN).unwrap();
    assert!(relative(term.energy, -9.299598485766651e-1) < 1e-12);
    assert!(relative(term.radial_force, 3.899947745279644e-2) < 1e-12);

    let pair = lj.pair_force([R_MIN, 0.0, 0.0]).unwrap();
    assert_eq!(pair.energy, term.energy);
    assert!(relative(pair.force[0], 3.899947745279644e-2) < 1e-12);
    assert_eq!(pair.force[1], 0.0);
    assert_eq!(pair.force[2], 0.0);
}

#[test]
fn radial_force_matches_central_difference_of_energy() {
    let lj = reference();
    let energy = |r: f64| lj.pair(r).unwrap().energy;
    for r in [0.9, R_MIN, 1.5, 2.0, 2.4] {
        let force = lj.pair(r).unwrap().radial_force;
        let mut errors = [0.0; 2];
        for (error, h) in errors.iter_mut().zip([1e-6, 1e-5]) {
            assert!(r + h < lj.cutoff());
            let numeric = -(energy(r + h) - energy(r - h)) / (2.0 * h);
            *error = relative(numeric, force);
        }
        println!(
            "r = {r}: relative error h=1e-6 {:.3e}, h=1e-5 {:.3e}",
            errors[0], errors[1]
        );
        assert!(errors[0] < 1e-8, "r = {r}: {}", errors[0]);
    }
}

#[test]
fn force_points_along_separation_and_reverses_exactly() {
    let lj = reference();
    let direction = [0.48, -0.6, 0.64]; // unit length
    for (r, repulsive) in [(0.9, true), (R_MIN, true), (1.5, false), (2.4, false)] {
        let separation = direction.map(|u| u * r);
        let on_i = lj.pair_force(separation).unwrap();
        let on_j = lj.pair_force(separation.map(|d| -d)).unwrap();
        assert_eq!(on_j.energy, on_i.energy);
        assert_eq!(on_j.force, on_i.force.map(|f| -f));

        let radial = lj.pair(r).unwrap().radial_force;
        let along: f64 = on_i.force.iter().zip(direction).map(|(f, u)| f * u).sum();
        assert_eq!(along > 0.0, repulsive, "r = {r}");
        assert!(relative(along, radial) < 1e-12, "r = {r}");
        for (f, u) in on_i.force.iter().zip(direction) {
            assert!((f - along * u).abs() < 1e-12 * radial.abs(), "r = {r}");
        }
    }
}

#[test]
fn energy_and_force_are_exactly_zero_at_and_beyond_cutoff() {
    let lj = reference();
    for r in [2.5, 2.5 + 1e-12, 3.0, 1e300, f64::INFINITY] {
        let term = lj.pair(r).unwrap();
        assert_eq!(term.energy, 0.0, "r = {r}");
        assert_eq!(term.radial_force, 0.0, "r = {r}");
    }
    for separation in [[2.5, 0.0, 0.0], [0.0, -3.0, 0.0], [1e200, 1e200, 0.0]] {
        let pair = lj.pair_force(separation).unwrap();
        assert_eq!(pair.energy, 0.0);
        assert_eq!(pair.force, [0.0; 3]);
    }

    let inside = lj.pair(2.5 - 1e-8).unwrap();
    assert!(inside.energy.is_finite() && inside.radial_force.is_finite());
    assert!(inside.radial_force.abs() < 1e-6);
    assert!(inside.energy.abs() < 1e-6);
}

#[test]
fn rejects_invalid_parameters() {
    for (epsilon, sigma, cutoff, name) in [
        (0.0, 1.0, 2.5, "epsilon"),
        (-1.0, 1.0, 2.5, "epsilon"),
        (f64::NAN, 1.0, 2.5, "epsilon"),
        (1.0, -1.0, 2.5, "sigma"),
        (1.0, f64::INFINITY, 2.5, "sigma"),
        (1.0, 1.0, 0.0, "cutoff"),
        (1.0, 1.0, f64::NAN, "cutoff"),
        (1.0, 1e300, 1e-300, "cutoff"),
    ] {
        assert_eq!(
            ForceShiftedLj::new(epsilon, sigma, cutoff),
            Err(LjError::InvalidParameter(name))
        );
    }
}

#[test]
fn rejects_overlap_overflow_and_invalid_separation() {
    let lj = reference();
    assert_eq!(lj.pair(0.0), Err(LjError::Overlap));
    assert_eq!(lj.pair_force([0.0; 3]), Err(LjError::Overlap));
    assert_eq!(lj.pair(1e-30), Err(LjError::NonFinite));
    assert_eq!(lj.pair_force([1e-30, 0.0, 0.0]), Err(LjError::NonFinite));
    assert_eq!(lj.pair(-1.0), Err(LjError::InvalidSeparation));
    assert_eq!(lj.pair(f64::NAN), Err(LjError::InvalidSeparation));
    for bad in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert_eq!(
            lj.pair_force([1.0, bad, 0.0]),
            Err(LjError::InvalidSeparation)
        );
    }
}
