//! 分子動力学の単元の値。式は `ergion_core::molecular` の各関数の rustdoc にある。
//!
//! Lennard–Jones ポテンシャル、周期境界条件と最小イメージ法、NVE アンサンブルと速度 Verlet 法、
//! 温度・圧力・動径分布関数。単位は \(\varepsilon = \sigma = m = k_B = 1\)。

use ergion_core::molecular as md;
use ergion_core::statistics::Rng;
use serde_json::Value;

use crate::lesson::{count, grid, num, positive, text, Figure, LessonModel, ModelState};

/// この部分の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "lennard-jones" => lj_figure(params),
        "periodic" => periodic_figure(),
        "observables" => observables_figure(),
        _ => Err(format!("unknown unit {unit}")),
    }
}

/// この部分の単元の時間発展。
pub fn model(unit: &str, config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "lennard-jones" => Ok(Box::new(Dimer::new(config)?)),
        "periodic" => Ok(Box::new(FreeFlight::new(config)?)),
        "nve" => Ok(Box::new(Nve::new(config)?)),
        "observables" => Ok(Box::new(Observables::new(config)?)),
        _ => Err(format!("unknown unit {unit}")),
    }
}

fn lj_figure(params: &Value) -> Result<Figure, String> {
    let cutoff = positive(params, "cutoff", 2.5)?;
    if !(1.2..=5.0).contains(&cutoff) {
        return Err("cutoff must be in [1.2, 5]".into());
    }
    let r = grid(0.9, 3.2, 461);
    let map = |f: &dyn Fn(f64) -> f64| r.iter().map(|&x| f(x)).collect::<Vec<_>>();
    let r0 = md::lj_equilibrium_distance(1.0);
    Ok(Figure::new()
        .series("potential", "exact", r.clone(), map(&|x| md::lj_potential(x, 1.0, 1.0)))
        .series("truncated", "difference", r.clone(), map(&|x| md::lj_truncated_potential(x, 1.0, 1.0, cutoff)))
        .series("shifted", "numerical", r.clone(), map(&|x| md::lj_force_shifted_potential(x, 1.0, 1.0, cutoff)))
        .series("force", "exact", r.clone(), map(&|x| md::lj_force_magnitude(x, 1.0, 1.0)))
        .series("shifted-force", "numerical", r.clone(), map(&|x| md::lj_force_shifted_force(x, 1.0, 1.0, cutoff)))
        .point("minimum", "exact", r0, md::lj_potential(r0, 1.0, 1.0))
        .value("r0", r0)
        .value("v_r0", md::lj_potential(r0, 1.0, 1.0))
        .value("f_r0", md::lj_force_magnitude(r0, 1.0, 1.0))
        .value("v_sigma", md::lj_potential(1.0, 1.0, 1.0))
        .value("f_sigma", md::lj_force_magnitude(1.0, 1.0, 1.0))
        .value("cutoff", cutoff)
        .value("v_rc", md::lj_potential(cutoff, 1.0, 1.0))
        .value("f_rc", md::lj_force_magnitude(cutoff, 1.0, 1.0))
        .value("vsf_r0", md::lj_force_shifted_potential(r0, 1.0, 1.0, cutoff)))
}

fn periodic_figure() -> Result<Figure, String> {
    let l = 10.0;
    let (ri, rj) = ([1.0, 9.0, 5.0], [9.0, 1.0, 5.0]);
    let raw = [0, 1, 2].map(|k| rj[k] - ri[k]);
    let d = md::minimum_image_vector(raw, l);
    Ok(Figure::new()
        .value("wrap_a", md::wrap_position(12.3, l))
        .value("wrap_b", md::wrap_position(-0.4, l))
        .value("raw_distance", raw.iter().map(|c| c * c).sum::<f64>().sqrt())
        .value("dx", d[0])
        .value("dy", d[1])
        .value("dz", d[2])
        .value("distance", d.iter().map(|c| c * c).sum::<f64>().sqrt())
        .value("brute", md::nearest_image_distance(raw, l)))
}

fn observables_figure() -> Result<Figure, String> {
    let (l, cutoff) = (10.0, 2.5);
    let positions = [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0]];
    let velocities = [[1.0, 0.0, 0.0], [-1.0, 0.0, 0.0]];
    let forces = md::lj_forces(&positions, l, cutoff);
    let kinetic = md::kinetic_energy(&velocities, 1.0);
    let temperature = md::instantaneous_temperature(kinetic, 2);
    let volume = l * l * l;
    Ok(Figure::new()
        .value("kinetic", kinetic)
        .value("temperature", temperature)
        .value("potential", forces.potential)
        .value("force", forces.forces[0][0])
        .value("virial", forces.virial)
        .value("volume", volume)
        .value("ideal", md::virial_pressure(2, volume, temperature, 0.0))
        .value("pressure", md::virial_pressure(2, volume, temperature, forces.virial)))
}

/// 時系列を最大 `MAX` 点に間引いて持つ。
struct History {
    time: Vec<f64>,
    columns: Vec<Vec<f64>>,
}

impl History {
    const MAX: usize = 2400;

    fn new(columns: usize) -> Self {
        Self { time: Vec::new(), columns: vec![Vec::new(); columns] }
    }

    fn push(&mut self, time: f64, values: &[f64]) {
        self.time.push(time);
        for (column, value) in self.columns.iter_mut().zip(values) {
            column.push(*value);
        }
        if self.time.len() > Self::MAX {
            let thin = |v: &Vec<f64>| v.iter().step_by(2).copied().collect::<Vec<_>>();
            self.time = thin(&self.time);
            self.columns = self.columns.iter().map(thin).collect();
        }
    }

    fn series(&self, figure: Figure, column: usize, name: &str, role: &str) -> Figure {
        figure.series(name, role, self.time.clone(), self.columns[column].clone())
    }
}

#[derive(Clone, Copy, PartialEq)]
enum Integrator {
    Verlet,
    Euler,
}

fn integrator(config: &Value) -> Result<Integrator, String> {
    match text(config, "method", "verlet") {
        "verlet" => Ok(Integrator::Verlet),
        "euler" => Ok(Integrator::Euler),
        other => Err(format!("unknown method {other}")),
    }
}

/// 2原子の相対運動。原子1が原点にいる系で、原子2の位置が原子間距離 \(r\) である。
struct Dimer {
    method: Integrator,
    mass: f64,
    /// \([x_1, x_2, v_1, v_2]\)。
    state: [f64; 4],
    e0: f64,
    r0: f64,
    turning: Option<(f64, f64)>,
}

impl Dimer {
    fn new(config: &Value) -> Result<Self, String> {
        let mass = positive(config, "mass", 1.0)?;
        let w0 = num(config, "speed", 1.0)?;
        let r0 = md::lj_equilibrium_distance(1.0);
        let state = [-0.5 * r0, 0.5 * r0, -0.5 * w0, 0.5 * w0];
        let mut dimer = Self { method: integrator(config)?, mass, state, e0: 0.0, r0, turning: None };
        dimer.e0 = dimer.energy();
        if dimer.e0 >= -0.05 {
            return Err("the pair must stay bound: choose m w0^2 / 4 < 0.95".into());
        }
        dimer.turning = md::lj_turning_points(dimer.e0, 1.0, 1.0);
        Ok(dimer)
    }

    fn separation(&self) -> f64 {
        self.state[1] - self.state[0]
    }

    fn energy(&self) -> f64 {
        let [_, _, v1, v2] = self.state;
        0.5 * self.mass * (v1 * v1 + v2 * v2) + md::lj_potential(self.separation(), 1.0, 1.0)
    }
}

impl LessonModel for Dimer {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        let m = self.mass;
        match self.method {
            Integrator::Verlet => {
                let (mut x, mut v) = ([self.state[0], self.state[1]], [self.state[2], self.state[3]]);
                ergion_core::velocity_verlet_step(&mut x, &mut v, dt, |x, a| {
                    let f = md::lj_force_magnitude(x[1] - x[0], 1.0, 1.0);
                    a[0] = -f / m;
                    a[1] = f / m;
                });
                self.state = [x[0], x[1], v[0], v[1]];
            }
            Integrator::Euler => ergion_core::euler_step(&mut self.state, time, dt, |_, y, dy| {
                let f = md::lj_force_magnitude(y[1] - y[0], 1.0, 1.0);
                dy[0] = y[2];
                dy[1] = y[3];
                dy[2] = -f / m;
                dy[3] = f / m;
            }),
        }
        if !self.state.iter().all(|v| v.is_finite()) || self.separation() <= 0.0 {
            return Err("step left the finite range".into());
        }
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        ModelState { position: self.energy(), velocity: self.separation(), exact_position: self.e0, exact_velocity: self.r0 }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let r = self.separation();
        let curve = grid(0.95, 3.0, 300);
        let v: Vec<f64> = curve.iter().map(|&x| md::lj_potential(x, 1.0, 1.0)).collect();
        let mut figure = Figure::new()
            .series("potential", "exact", curve, v)
            .point("atom-a", "reference", 0.0, 0.6)
            .point("atom-b", "numerical", r, 0.6)
            .point("state", "numerical", r, md::lj_potential(r, 1.0, 1.0))
            .point("minimum", "exact", self.r0, -1.0)
            .value("energy", self.energy())
            .value("e0", self.e0)
            .value("separation", r)
            .value("r0", self.r0);
        if let Some((lo, hi)) = self.turning {
            figure = figure
                .series("level", "muted", vec![lo, hi], vec![self.e0, self.e0])
                .value("r_min", lo)
                .value("r_max", hi);
        }
        Some(figure)
    }
}

/// 力を受けずに等速で進む粒子。周期境界で折り返した位置と、折り返さない位置を持つ。
struct FreeFlight {
    box_length: f64,
    wrapped: Vec<[f64; 3]>,
    unwrapped: Vec<[f64; 3]>,
    velocities: Vec<[f64; 3]>,
    history: History,
}

impl FreeFlight {
    fn new(config: &Value) -> Result<Self, String> {
        let box_length = positive(config, "box_length", 10.0)?;
        let n = count(config, "particles", 6, 20)?;
        let speed = positive(config, "speed", 2.0)?;
        let seed = num(config, "seed", 1.0)?;
        if n < 2 || box_length > 1000.0 || seed < 0.0 || seed.fract() != 0.0 {
            return Err("need 2..=20 particles, box_length <= 1000 and an integer seed >= 0".into());
        }
        let mut rng = Rng::new(seed as u64);
        let wrapped: Vec<[f64; 3]> = (0..n).map(|_| [0; 3].map(|_| box_length * rng.uniform())).collect();
        let velocities = (0..n).map(|_| [0; 3].map(|_| speed * rng.standard_normal() / 3f64.sqrt())).collect();
        let mut flight = Self { box_length, unwrapped: wrapped.clone(), wrapped, velocities, history: History::new(4) };
        flight.record(0.0);
        Ok(flight)
    }

    fn pair(&self, i: usize, j: usize) -> ([f64; 3], [f64; 3]) {
        let raw = [0, 1, 2].map(|k| self.wrapped[j][k] - self.wrapped[i][k]);
        (raw, md::minimum_image_vector(raw, self.box_length))
    }

    fn record(&mut self, time: f64) {
        let (_, d) = self.pair(0, 1);
        let free = [0, 1, 2].map(|k| self.unwrapped[1][k] - self.unwrapped[0][k]);
        let values = [norm(d), norm(free), self.wrapped[1][0], self.unwrapped[1][0]];
        self.history.push(time, &values);
    }
}

fn norm(d: [f64; 3]) -> f64 {
    (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]).sqrt()
}

impl LessonModel for FreeFlight {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        for i in 0..self.wrapped.len() {
            for k in 0..3 {
                self.unwrapped[i][k] += dt * self.velocities[i][k];
                self.wrapped[i][k] = md::wrap_position(self.wrapped[i][k] + dt * self.velocities[i][k], self.box_length);
            }
        }
        self.record(time + dt);
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let (raw, d) = self.pair(0, 1);
        ModelState {
            position: norm(d),
            velocity: self.wrapped[1][0],
            exact_position: md::nearest_image_distance(raw, self.box_length),
            exact_velocity: self.unwrapped[1][0],
        }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let l = self.box_length;
        let mut figure = Figure::new();
        for i in -1..=2 {
            let c = f64::from(i) * l;
            let role = if i == 0 || i == 1 { "numerical" } else { "muted" };
            figure = figure
                .series(&format!("vertical{i}"), role, vec![c, c], vec![-l, 2.0 * l])
                .series(&format!("horizontal{i}"), role, vec![-l, 2.0 * l], vec![c, c]);
        }
        let mut distances = Vec::new();
        for i in 0..self.wrapped.len() {
            for j in i + 1..self.wrapped.len() {
                distances.push(norm(self.pair(i, j).1));
            }
        }
        for (i, r) in self.wrapped.iter().enumerate() {
            figure = figure.point(&format!("p{i}"), "numerical", r[0], r[1]);
            for a in -1..=1 {
                for b in -1..=1 {
                    if a != 0 || b != 0 {
                        let (x, y) = (r[0] + f64::from(a) * l, r[1] + f64::from(b) * l);
                        figure = figure.point(&format!("image{i}_{a}_{b}"), "muted", x, y);
                    }
                }
            }
            if i > 0 {
                let (_, d) = self.pair(0, i);
                let start = self.wrapped[0];
                figure = figure.series(&format!("link{i}"), "exact", vec![start[0], start[0] + d[0]], vec![start[1], start[1] + d[1]]);
            }
        }
        let largest = distances.iter().copied().fold(0.0, f64::max);
        figure = self.history.series(figure, 0, "minimum-image", "numerical");
        figure = self.history.series(figure, 1, "unwrapped-distance", "muted");
        figure = self.history.series(figure, 2, "x-wrapped", "numerical");
        figure = self.history.series(figure, 3, "x-unwrapped", "muted");
        Some(figure.array("pair_distances", distances).value("largest", largest).value("pairs", (self.wrapped.len() * (self.wrapped.len() - 1) / 2) as f64))
    }
}

/// 周期境界の立方体セルの Lennard–Jones 粒子系。面心立方格子から始める。
struct LjSystem {
    method: Integrator,
    positions: Vec<[f64; 3]>,
    velocities: Vec<[f64; 3]>,
    forces: md::LjForces,
    box_length: f64,
    cutoff: f64,
}

impl LjSystem {
    fn new(config: &Value, default_cells: usize, default_temperature: f64) -> Result<Self, String> {
        let cells = count(config, "cells", default_cells, 5)?;
        let density = positive(config, "density", 0.8)?;
        let temperature = positive(config, "temperature", default_temperature)?;
        let cutoff = positive(config, "cutoff", 2.5)?;
        let seed = num(config, "seed", 1.0)?;
        if seed < 0.0 || seed.fract() != 0.0 {
            return Err("seed must be an integer >= 0".into());
        }
        if !(0.05..=1.2).contains(&density) || temperature > 10.0 {
            return Err("density must be in [0.05, 1.2] and temperature <= 10".into());
        }
        let (positions, box_length) = md::fcc_lattice(cells, density);
        if cutoff >= 0.5 * box_length {
            return Err(format!("cutoff must be smaller than L/2 = {:.4}: use more cells or a smaller cutoff", 0.5 * box_length));
        }
        let velocities = md::initial_velocities(positions.len(), temperature, 1.0, seed as u64);
        let forces = md::lj_forces(&positions, box_length, cutoff);
        Ok(Self { method: integrator(config)?, positions, velocities, forces, box_length, cutoff })
    }

    fn step(&mut self, dt: f64) -> Result<(), String> {
        let advance = if self.method == Integrator::Verlet { md::velocity_verlet } else { md::forward_euler };
        self.forces = advance(&mut self.positions, &mut self.velocities, &self.forces, 1.0, dt, self.box_length, self.cutoff);
        let finite = self.forces.potential.is_finite() && self.velocities.iter().flatten().all(|v| v.is_finite());
        if finite { Ok(()) } else { Err("step left the finite range".into()) }
    }

    fn kinetic(&self) -> f64 {
        md::kinetic_energy(&self.velocities, 1.0)
    }

    fn temperature(&self) -> f64 {
        md::instantaneous_temperature(self.kinetic(), self.positions.len())
    }

    fn pressure(&self) -> f64 {
        md::virial_pressure(self.positions.len(), self.box_length.powi(3), self.temperature(), self.forces.virial)
    }

    fn scene(&self, figure: Figure) -> Figure {
        let l = self.box_length;
        let mut figure = figure.series("box", "muted", vec![0.0, l, l, 0.0, 0.0], vec![0.0, 0.0, l, l, 0.0]);
        for (i, r) in self.positions.iter().enumerate() {
            figure = figure.point(&format!("atom{i}"), "numerical", r[0], r[1]);
        }
        let p = md::total_momentum(&self.velocities, 1.0);
        figure
            .value("particles", self.positions.len() as f64)
            .value("box_length", l)
            .value("momentum", norm(p))
            .value("temperature", self.temperature())
    }
}

struct Nve {
    system: LjSystem,
    e0: f64,
    history: History,
    max_drift: f64,
}

impl Nve {
    fn new(config: &Value) -> Result<Self, String> {
        let system = LjSystem::new(config, 3, 1.0)?;
        let e0 = system.kinetic() + system.forces.potential;
        let mut nve = Self { system, e0, history: History::new(4), max_drift: 0.0 };
        nve.record(0.0);
        Ok(nve)
    }

    fn record(&mut self, time: f64) {
        let (k, u) = (self.system.kinetic(), self.system.forces.potential);
        let drift = (k + u - self.e0) / self.e0.abs();
        self.max_drift = self.max_drift.max(drift.abs());
        self.history.push(time, &[k, u, k + u, drift]);
    }
}

impl LessonModel for Nve {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        self.system.step(dt)?;
        self.record(time + dt);
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let (k, u) = (self.system.kinetic(), self.system.forces.potential);
        ModelState { position: k + u, velocity: k, exact_position: self.e0, exact_velocity: u }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let mut figure = self.system.scene(Figure::new());
        for (column, name, role) in [(0, "kinetic", "reference"), (1, "potential", "difference"), (2, "total", "numerical"), (3, "drift", "numerical")] {
            figure = self.history.series(figure, column, name, role);
        }
        let end = *self.history.time.last().unwrap_or(&0.0);
        let (k, u) = (self.system.kinetic(), self.system.forces.potential);
        Some(figure
            .series("initial", "exact", vec![0.0, end.max(1e-9)], vec![self.e0, self.e0])
            .value("e0", self.e0)
            .value("drift", (k + u - self.e0) / self.e0.abs())
            .value("max_drift", self.max_drift))
    }
}

struct Observables {
    system: LjSystem,
    equilibration: usize,
    interval: usize,
    block: usize,
    r_max: f64,
    counts: Vec<f64>,
    configurations: usize,
    steps: usize,
    temperatures: Vec<f64>,
    pressures: Vec<f64>,
    history: History,
}

impl Observables {
    fn new(config: &Value) -> Result<Self, String> {
        let system = LjSystem::new(config, 3, 1.6)?;
        let bins = count(config, "bins", 40, 200)?;
        let equilibration = num(config, "equilibration", 400.0)?;
        if equilibration < 0.0 || equilibration.fract() != 0.0 {
            return Err("equilibration must be an integer >= 0".into());
        }
        let interval = count(config, "sample_interval", 10, 1000)?;
        let block = count(config, "block", 200, 100_000)?;
        let r_max = 0.5 * system.box_length;
        let mut observables = Self {
            system,
            equilibration: equilibration as usize,
            interval,
            block,
            r_max,
            counts: vec![0.0; bins],
            configurations: 0,
            steps: 0,
            temperatures: Vec::new(),
            pressures: Vec::new(),
            history: History::new(2),
        };
        observables.history.push(0.0, &[observables.system.temperature(), observables.system.pressure()]);
        Ok(observables)
    }

    fn mean(&self, values: &[f64], current: f64) -> f64 {
        if values.is_empty() { current } else { values.iter().sum::<f64>() / values.len() as f64 }
    }
}

impl LessonModel for Observables {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        self.system.step(dt)?;
        self.steps += 1;
        let (t, p) = (self.system.temperature(), self.system.pressure());
        if self.steps > self.equilibration {
            self.temperatures.push(t);
            self.pressures.push(p);
            if (self.steps - self.equilibration) % self.interval == 0 {
                md::pair_distance_histogram(&self.system.positions, self.system.box_length, self.r_max, &mut self.counts);
                self.configurations += 1;
            }
        }
        self.history.push(time + dt, &[t, p]);
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let (t, p) = (self.system.temperature(), self.system.pressure());
        ModelState { position: self.mean(&self.temperatures, t), velocity: self.mean(&self.pressures, p), exact_position: t, exact_velocity: p }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let bins = self.counts.len();
        let width = self.r_max / bins as f64;
        let centers: Vec<f64> = (0..bins).map(|k| (k as f64 + 0.5) * width).collect();
        let mut figure = self.system.scene(Figure::new());
        figure = self.history.series(figure, 0, "temperature", "numerical");
        figure = self.history.series(figure, 1, "pressure", "numerical");
        figure = figure.series("ideal", "reference", vec![0.0, self.r_max], vec![1.0, 1.0]);
        if self.configurations > 0 {
            let g = md::radial_distribution(&self.counts, self.configurations, self.system.positions.len(), self.system.box_length, self.r_max);
            let (peak, value) = g.iter().enumerate().fold((0, 0.0), |best, (k, &v)| if v > best.1 { (k, v) } else { best });
            figure = figure.series("g", "numerical", centers.clone(), g).value("peak_r", centers[peak]).value("peak_g", value);
        }
        let start = self.equilibration as f64;
        let dt = self.history.time.last().copied().unwrap_or(0.0) / self.steps.max(1) as f64;
        for (series, name) in [(&self.temperatures, "t"), (&self.pressures, "p")] {
            if let Some(blocks) = md::block_average(series, self.block) {
                for (m, mean) in blocks.block_means.iter().enumerate() {
                    let mid = (start + (m as f64 + 0.5) * self.block as f64) * dt;
                    figure = figure.point(&format!("block-{name}-{m}"), "difference", mid, *mean);
                }
                figure = figure.value(&format!("mean_{name}"), blocks.mean).value(&format!("se_{name}"), blocks.standard_error).value("blocks", blocks.block_means.len() as f64);
            }
        }
        Some(figure
            .value("configurations", self.configurations as f64)
            .value("collected", self.temperatures.len() as f64)
            .value("equilibration_time", start * dt))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::LessonSimulation;
    use serde_json::json;

    fn run(config: Value) -> crate::lesson::LessonSnapshot {
        LessonSimulation::new(&config.to_string()).unwrap().run_to_end().unwrap()
    }

    #[test]
    fn figures_give_the_hand_values() {
        let lj = figure("lennard-jones", &json!({})).unwrap();
        assert!((lj.values["v_r0"] + 1.0).abs() < 1e-14);
        assert!((lj.values["v_rc"] + 0.016316891136).abs() < 1e-14);
        let p = figure("periodic", &json!({})).unwrap();
        assert!((p.values["distance"] - 8f64.sqrt()).abs() < 1e-15);
        assert!((p.values["wrap_b"] - 9.6).abs() < 1e-14);
        let o = figure("observables", &json!({})).unwrap();
        assert!((o.values["pressure"] - 0.0093463331591509).abs() < 1e-15);
        assert!(figure("nvt", &json!({})).unwrap_err().starts_with("unknown unit"));
    }

    #[test]
    fn dimer_oscillates_between_the_turning_points() {
        let end = run(json!({"schema_version": 1, "kind": "md/lennard-jones", "mass": 1, "speed": 1, "dt": 0.005, "steps": 1000}));
        assert!((end.exact_position + 0.75).abs() < 1e-14);
        assert!(end.position_error.abs() < 1e-3, "{}", end.position_error);
        let frame = end.frame.unwrap();
        assert!((frame.values["r_max"] - 2f64.cbrt()).abs() < 1e-14);
        let euler = run(json!({"schema_version": 1, "kind": "md/lennard-jones", "method": "euler", "dt": 0.005, "steps": 1000}));
        assert!(euler.position_error.abs() > 10.0 * end.position_error.abs());
    }

    #[test]
    fn periodic_minimum_image_matches_the_brute_force() {
        let mut sim = LessonSimulation::new(&json!({"schema_version": 1, "kind": "md/periodic", "dt": 0.02, "steps": 1000}).to_string()).unwrap();
        for _ in 0..10 {
            let batch: Value = serde_json::from_str(&sim.advance(100).unwrap()).unwrap();
            for s in batch["samples"].as_array().unwrap() {
                let (a, b) = (s["position"].as_f64().unwrap(), s["exact_position"].as_f64().unwrap());
                assert!((a - b).abs() < 1e-12);
                assert!(s["velocity"].as_f64().unwrap() < 10.0);
            }
        }
    }

    #[test]
    fn nve_drift_is_small_for_verlet() {
        let end = run(json!({"schema_version": 1, "kind": "md/nve", "dt": 0.002, "steps": 1000}));
        let f = end.frame.unwrap();
        println!("verlet max drift {} T {}", f.values["max_drift"], f.values["temperature"]);
        assert!(f.values["max_drift"] < 1e-3);
        assert!(f.values["momentum"] < 1e-10);
        let euler = run(json!({"schema_version": 1, "kind": "md/nve", "method": "euler", "dt": 0.002, "steps": 1000}));
        let g = euler.frame.unwrap();
        println!("euler max drift {} T {}", g.values["max_drift"], g.values["temperature"]);
        assert!(g.values["max_drift"] > 10.0 * f.values["max_drift"]);
    }

    #[test]
    fn observables_accumulate_g_and_blocks() {
        let end = run(json!({"schema_version": 1, "kind": "md/observables", "dt": 0.005, "steps": 3000}));
        let f = end.frame.unwrap();
        println!("T {} ± {}  P {} ± {}  peak {} {}", f.values["mean_t"], f.values["se_t"], f.values["mean_p"], f.values["se_p"], f.values["peak_r"], f.values["peak_g"]);
        assert!(f.values["blocks"] >= 2.0);
        assert!((1.0..1.25).contains(&f.values["peak_r"]));
        assert!(f.values["peak_g"] > 2.0);
    }
}
#[cfg(test)]
mod probe {
    use crate::lesson::LessonSimulation;
    use serde_json::json;
    fn pick(f: &crate::lesson::Figure, name: &str, n: usize) -> (Vec<f64>, Vec<f64>) {
        let s = f.series.iter().find(|s| s.name == name).unwrap();
        let step = (s.x.len() / n).max(1);
        (s.x.iter().step_by(step).copied().collect(), s.y.iter().step_by(step).copied().collect())
    }
    fn r(v: &[f64], d: i32) -> Vec<f64> { let m = 10f64.powi(d); v.iter().map(|x| (x * m).round() / m).collect() }
    #[test]
    fn probe_series() {
        let mut out = serde_json::Map::new();
        for (name, method) in [("verlet", "verlet"), ("euler", "euler")] {
            let mut sim = LessonSimulation::new(&json!({"schema_version": 1, "kind": "md/nve", "method": method, "dt": 0.002, "steps": 1000}).to_string()).unwrap();
            let f = sim.run_to_end().unwrap().frame.unwrap();
            for s in ["kinetic", "potential", "total", "drift"] {
                let (t, y) = pick(&f, s, 100);
                out.insert(format!("{name}_t"), json!(r(&t, 4)));
                out.insert(format!("{name}_{s}"), json!(if s == "drift" { y.iter().map(|v| format!("{v:.3e}").parse::<f64>().unwrap()).collect::<Vec<_>>() } else { r(&y, 3) }));
            }
        }
        let mut sim = LessonSimulation::new(&json!({"schema_version": 1, "kind": "md/observables", "dt": 0.005, "steps": 3000}).to_string()).unwrap();
        let f = sim.run_to_end().unwrap().frame.unwrap();
        let (gx, gy) = pick(&f, "g", 1000);
        out.insert("g_r".into(), json!(r(&gx, 4)));
        out.insert("g".into(), json!(r(&gy, 3)));
        let (tt, ty) = pick(&f, "temperature", 150);
        out.insert("temp_t".into(), json!(r(&tt, 3)));
        out.insert("temp".into(), json!(r(&ty, 4)));
        out.insert("mean_t".into(), json!(f.values["mean_t"]));
        out.insert("se_t".into(), json!(f.values["se_t"]));
        let blocks: Vec<(f64, f64)> = f.points.iter().filter(|p| p.name.starts_with("block-t-")).map(|p| (p.x, p.y)).collect();
        out.insert("blocks".into(), json!(blocks.iter().map(|(x, y)| [(x * 1000.0).round() / 1000.0, (y * 10000.0).round() / 10000.0]).collect::<Vec<_>>()));
        std::fs::write("/tmp/md-a-series.json", serde_json::to_string(&out).unwrap()).unwrap();
    }
}
