//! Prints `r,energy,radial_force` as CSV for the reference parameters
//! `epsilon = sigma = 1`, `rc = 2.5`, sampled at `r = 0.900, 0.901, ..., 3.000`.

use ergion_md::ForceShiftedLj;

fn main() {
    let lj = ForceShiftedLj::new(1.0, 1.0, 2.5).expect("reference parameters are valid");
    println!("r,energy,radial_force");
    for i in 900..=3000 {
        let r = f64::from(i) / 1000.0;
        let term = lj.pair(r).expect("sampled distances are valid");
        println!("{r},{:e},{:e}", term.energy, term.radial_force);
    }
}
