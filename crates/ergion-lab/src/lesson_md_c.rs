//! 分子動力学の単元の値。式は `ergion_core::molecular` の各関数の rustdoc にある。

use ergion_core::molecular::{
    adiabatic_force, bond_curves, born_oppenheimer_verlet_step, box_energy, box_energy_discrete, external_potential,
    golden_section_minimum, grid_points, ground_potential, kohn_sham_initial_density, kohn_sham_iteration,
    kohn_sham_solve, pair_hellmann_force, parabola_newton_minimum, point_hellmann_force, proton_pair,
    schrodinger_states, second_difference, vibrational_frequency, KohnSham, ScfIteration, PROTON_MASS,
};
use serde_json::Value;

use crate::lesson::{count, grid, positive, text, Figure, LessonModel, ModelState};

const SOFTENING: f64 = 1.0;

/// この部分の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "born-oppenheimer" => born_oppenheimer(params),
        "hellmann-feynman" => hellmann_feynman(),
        "first-principles" => first_principles(),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "kohn-sham" => Ok(Box::new(Scf::new(config)?)),
        _ => Err(format!("unknown unit {unit}")),
    }
}

fn read_grid(params: &Value) -> Result<(f64, usize), String> {
    let length = positive(params, "length", 20.0)?;
    let points = count(params, "points", 199, 2000)?;
    if !(4.0..=200.0).contains(&length) {
        return Err("length must be in [4, 200]".into());
    }
    if points < 9 {
        return Err("points must be at least 9".into());
    }
    Ok((length, points))
}

/// 断熱ポテンシャルの曲線、平衡距離、振動数、固有値の確認。
fn born_oppenheimer(params: &Value) -> Result<Figure, String> {
    let (length, points) = read_grid(params)?;
    let search = text(params, "method", "golden");
    let u0 = |r: f64| ground_potential(length, points, SOFTENING, r);
    let found = match search {
        "golden" => golden_section_minimum(u0, 0.5, 6.0, 1e-7),
        "newton" => parabola_newton_minimum(u0, 1.0, 1e-3, 1e-9),
        other => return Err(format!("unknown method {other}")),
    };
    let r_e = found.point;
    let curvature = second_difference(u0, r_e, 0.01);
    let reduced_mass = PROTON_MASS / 2.0;
    let omega = vibrational_frequency(curvature, reduced_mass);

    let distances = grid(0.4, 8.0, 77);
    let curves = bond_curves(length, points, SOFTENING, &distances);
    let at_minimum = bond_curves(length, points, SOFTENING, &[r_e]);
    let gap = at_minimum.electronic_excited[0] - at_minimum.electronic_ground[0];

    let (x, spacing) = grid_points(length, points);
    let nuclei = proton_pair(r_e);
    let potential = external_potential(&x, &nuclei, SOFTENING);
    let (_, orbitals) = schrodinger_states(&potential, spacing, 2);

    let mut figure = Figure::new()
        .series("ground", "numerical", distances.clone(), curves.ground.clone())
        .series("excited", "reference", distances.clone(), curves.excited.clone())
        .series("repulsion", "muted", distances.clone(), curves.repulsion.clone())
        .series("electronic_ground", "muted", distances, curves.electronic_ground)
        .point("minimum", "numerical", r_e, found.value)
        .series("potential", "muted", x.clone(), potential)
        .series("orbital0", "numerical", x.clone(), orbitals[0].clone())
        .series("orbital1", "reference", x, orbitals[1].clone())
        .point("nucleus1", "text", nuclei[0].position, 0.0)
        .point("nucleus2", "text", nuclei[1].position, 0.0)
        .array("path", found.path.clone())
        .array("path_energy", found.path.iter().map(|&r| u0(r)).collect())
        .value("r_e", r_e)
        .value("u_e", found.value)
        .value("iterations", found.iterations as f64)
        .value("curvature", curvature)
        .value("reduced_mass", reduced_mass)
        .value("omega", omega)
        .value("e0_re", at_minimum.electronic_ground[0])
        .value("e1_re", at_minimum.electronic_excited[0])
        .value("vnn_re", at_minimum.repulsion[0])
        .value("gap", gap)
        .value("electron_period", 2.0 * std::f64::consts::PI / gap)
        .value("nucleus_period", 2.0 * std::f64::consts::PI / omega)
        .value("ratio", gap / omega)
        .value("spacing", spacing)
        .value("u_far", ground_potential(length, points, SOFTENING, 8.0));

    let (_, hand_spacing) = grid_points(4.0, 3);
    let (hand, _) = schrodinger_states(&[0.0; 3], hand_spacing, 3);
    for (n, e) in hand.iter().enumerate() {
        figure = figure.value(&format!("hand{}", n + 1), *e);
    }
    figure = figure.value("hand_exact1", box_energy(1, 4.0));

    let (_, box_spacing) = grid_points(1.0, 19);
    let (boxed, _) = schrodinger_states(&[0.0; 19], box_spacing, 4);
    for (i, e) in boxed.iter().enumerate() {
        let n = i + 1;
        figure = figure
            .value(&format!("box{n}"), *e)
            .value(&format!("box_discrete{n}"), box_energy_discrete(n, 1.0, box_spacing))
            .value(&format!("box_exact{n}"), box_energy(n, 1.0));
    }

    let harmonic: Vec<f64> = grid_points(length, points).0.iter().map(|x| 0.5 * x * x).collect();
    let (levels, _) = schrodinger_states(&harmonic, spacing, 4);
    for (n, e) in levels.iter().enumerate() {
        figure = figure.value(&format!("oscillator{n}"), *e).value(&format!("oscillator_exact{n}"), n as f64 + 0.5);
    }
    Ok(figure)
}

/// Kohn–Sham 方程式の自己無撞着場の反復。1ステップが1回の反復。
///
/// 計器の位置の欄は全エネルギー \(E_k\)、速度の欄は密度の変化 \(\sum_j |n_{\mathrm{out}} - n_k|\,h\)、
/// 厳密解の位置の欄は十分に収束させた全エネルギー \(E_\infty\)、厳密解の速度の欄は 0 である。
struct Scf {
    model: KohnSham,
    mixing: f64,
    current: ScfIteration,
    iteration: usize,
    converged: ScfIteration,
}

impl Scf {
    fn new(config: &Value) -> Result<Self, String> {
        let (length, points) = read_grid(config)?;
        let distance = positive(config, "distance", 1.5)?;
        if distance > 0.8 * length {
            return Err("distance must be at most 0.8 length".into());
        }
        if points > 800 {
            return Err("points must be at most 800".into());
        }
        let mixing = match text(config, "method", "mix-07") {
            "mix-03" => 0.3,
            "mix-07" => 0.7,
            other => return Err(format!("unknown method {other}")),
        };
        let model = KohnSham::new(length, points, &proton_pair(distance), SOFTENING);
        let converged = kohn_sham_solve(&model, 0.5, 1e-11, 2000).last;
        let current = kohn_sham_iteration(&model, &kohn_sham_initial_density(&model), mixing);
        Ok(Self { model, mixing, current, iteration: 0, converged })
    }
}

impl LessonModel for Scf {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        let next = self.current.density_next.clone();
        self.current = kohn_sham_iteration(&self.model, &next, self.mixing);
        self.iteration += 1;
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        ModelState {
            position: self.current.energy.total,
            velocity: self.current.change,
            exact_position: self.converged.energy.total,
            exact_velocity: 0.0,
        }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let c = &self.current;
        let e = c.energy;
        let x = self.model.x.clone();
        let electrons = c.density_in.iter().sum::<f64>() * self.model.spacing;
        let mut figure = Figure::new()
            .series("density", "numerical", x.clone(), c.density_in.clone())
            .series("output", "reference", x.clone(), c.density_out.clone())
            .series("converged", "exact", x, self.converged.density_out.clone())
            .value("iteration", self.iteration as f64)
            .value("mixing", self.mixing)
            .value("kinetic", e.kinetic)
            .value("external", e.external)
            .value("hartree", e.hartree)
            .value("exchange", e.exchange)
            .value("nuclear", e.nuclear)
            .value("total", e.total)
            .value("eigenvalue", c.eigenvalue)
            .value("change", c.change)
            .value("electrons", electrons)
            .value("exact_energy", self.converged.energy.total)
            .value("exact_eigenvalue", self.converged.eigenvalue)
            .value("energy_error", (e.total - self.converged.energy.total).abs());
        for (i, n) in self.model.nuclei.iter().enumerate() {
            figure = figure.point(&format!("nucleus{}", i + 1), "text", n.position, 0.0);
        }
        Some(figure)
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        if final_time > 2000.0 {
            return Err("at most 2000 iterations".into());
        }
        Ok(())
    }
}

/// 電子が原点、原子核の電荷 \(Z = 1\)、軟化 \(a = 1\) のときの Hellmann–Feynman の力 \(F(X)\)。
fn hellmann_feynman() -> Result<Figure, String> {
    let nucleus = grid(0.25, 4.0, 151);
    let force: Vec<f64> = nucleus.iter().map(|&x| point_hellmann_force(0.0, x, 1.0, SOFTENING)).collect();
    let example = point_hellmann_force(0.0, 1.0, 1.0, SOFTENING);
    Ok(Figure::new()
        .series("force", "numerical", nucleus, force)
        .point("example", "numerical", 1.0, example)
        .value("force", example)
        .value("force_exact", -1.0 / (2.0 * 2.0_f64.sqrt())))
}

/// 加速度が一定のときの速度 Verlet 法の1ステップと、核間距離 \(R = 2\) の力の比較。
fn first_principles() -> Result<Figure, String> {
    let dt = 0.5;
    let (position, velocity) = born_oppenheimer_verlet_step(2.0, 0.0, -1.0, -1.0, dt);
    let half = 0.5 * dt * -1.0;
    let time = vec![0.0, 0.5, 1.0];
    let exact: Vec<f64> = time.iter().map(|t| 2.0 - 0.5 * t * t).collect();
    let mut x = 2.0;
    let mut v = 0.0;
    let mut numerical = vec![x];
    for _ in 0..2 {
        let next = born_oppenheimer_verlet_step(x, v, -1.0, -1.0, dt);
        x = next.0;
        v = next.1;
        numerical.push(x);
    }
    let hellmann = pair_hellmann_force(20.0, 41, SOFTENING, 2.0);
    let adiabatic = adiabatic_force(20.0, 41, SOFTENING, 2.0, 1e-4);
    Ok(Figure::new()
        .series("verlet", "numerical", time.clone(), numerical)
        .series("exact", "exact", time, exact)
        .value("x1", position)
        .value("v1", velocity)
        .value("half", half)
        .value("hellmann", hellmann)
        .value("adiabatic", adiabatic)
        .value("difference", (hellmann - adiabatic).abs()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn born_oppenheimer_values() {
        let golden = figure("born-oppenheimer", &json!({ "method": "golden" })).unwrap();
        let newton = figure("born-oppenheimer", &json!({ "method": "newton" })).unwrap();
        let (g, n) = (&golden.values, &newton.values);
        assert!((g["r_e"] - n["r_e"]).abs() < 1e-5);
        assert!(n["iterations"] < g["iterations"]);
        assert!((g["hand1"] - (1.0 - 0.5f64.sqrt())).abs() < 1e-13);
        assert!((g["box_exact1"] - std::f64::consts::PI.powi(2) / 2.0).abs() < 1e-12);
        assert!((g["box1"] - g["box_discrete1"]).abs() < 1e-10);
        assert!((g["oscillator0"] - 0.5).abs() < 1e-2);
        assert!(g["ratio"] > 10.0);
        assert!(figure("nope", &json!({})).unwrap_err().starts_with("unknown unit"));
    }

    #[test]
    fn scf_model_converges() {
        let mut fast = Scf::new(&json!({ "method": "mix-07" })).unwrap();
        let mut slow = Scf::new(&json!({ "method": "mix-03" })).unwrap();
        for _ in 0..20 {
            fast.step(0.0, 1.0).unwrap();
            slow.step(0.0, 1.0).unwrap();
        }
        assert!(fast.state(0.0).velocity < slow.state(0.0).velocity);
        let s = fast.state(0.0);
        assert!((s.position - s.exact_position).abs() < 1e-10);
        let frame = fast.frame(0.0).unwrap();
        assert!((frame.values["nuclear"] - 1.0 / 3.25f64.sqrt()).abs() < 1e-15);
        assert!((frame.values["electrons"] - 2.0).abs() < 1e-10);
        assert!(model("nope", &json!({}), 1.0).err().unwrap().starts_with("unknown unit"));
    }

    #[test]
    fn hellmann_and_verlet_hand_values() {
        let force = figure("hellmann-feynman", &json!({})).unwrap();
        assert!((force.values["force"] - force.values["force_exact"]).abs() < 1e-14);
        let motion = figure("first-principles", &json!({})).unwrap();
        assert!((motion.values["x1"] - 1.875).abs() < 1e-15);
        assert!((motion.values["v1"] + 0.5).abs() < 1e-15);
        assert!((motion.values["half"] + 0.25).abs() < 1e-15);
        assert!((motion.values["hellmann"] - motion.values["adiabatic"]).abs() < 1e-4);
    }
}
