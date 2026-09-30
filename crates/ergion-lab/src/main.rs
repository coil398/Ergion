use ergion_lab::{Simulation, Snapshot};

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    let path = args.next().ok_or("usage: ergion <config.json>")?;
    if args.next().is_some() {
        return Err("usage: ergion <config.json>".into());
    }
    let json = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    if let Ok(mut uniform) = ergion_lab::UniformSimulation::new(&json) {
        loop {
            let snapshot = uniform.snapshot()?;
            let state: ergion_lab::UniformSnapshot =
                serde_json::from_str(&snapshot).map_err(|e| e.to_string())?;
            if state.finished {
                println!("{snapshot}");
                return Ok(());
            }
            uniform.advance(500)?;
        }
    }
    let mut simulation = Simulation::new(&json)?;
    loop {
        let snapshot = simulation.snapshot()?;
        let state: Snapshot = serde_json::from_str(&snapshot).map_err(|e| e.to_string())?;
        if state.finished {
            println!("{snapshot}");
            return Ok(());
        }
        simulation.advance(500)?;
    }
}
