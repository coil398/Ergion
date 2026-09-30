//! Prints `r,energy,radial_force` as CSV for the reference parameters
//! `epsilon = sigma = 1`, `rc = 2.5`, sampled at `r = 0.900, 0.901, ..., 3.000`
//! plus the potential minimum `r = 2^(1/6)`.

use ergion_md::ForceShiftedLj;

const R_MIN: f64 = 1.122_462_048_309_373;

fn main() {
    let lj = ForceShiftedLj::new(1.0, 1.0, 2.5).expect("reference parameters are valid");
    let mut distances: Vec<f64> = (900..=3000).map(|i| f64::from(i) / 1000.0).collect();
    distances.push(R_MIN);
    distances.sort_by(f64::total_cmp);
    println!("r,energy,radial_force");
    for r in distances {
        let term = lj.pair(r).expect("sampled distances are valid");
        println!("{r},{:e},{:e}", term.energy, term.radial_force);
    }
}
