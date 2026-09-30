//! Single-species force-shifted Lennard-Jones pair interaction.
//!
//! `phi(r) = 4 epsilon [(sigma/r)^12 - (sigma/r)^6]` and, for `r < rc`,
//! `U(r) = phi(r) - phi(rc) - (r - rc) phi'(rc)`. For `r >= rc` both the
//! energy and the force are exactly zero. No tail correction. This is the
//! same form as LAMMPS `lj/smooth/linear`.

use std::fmt;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LjError {
    /// `epsilon`, `sigma` or `cutoff` is not finite and positive, or the
    /// shift at the cutoff overflows.
    InvalidParameter(&'static str),
    /// The separation is NaN, negative, or has a non-finite component.
    InvalidSeparation,
    /// The two particles are at the same position.
    Overlap,
    /// The energy or force overflowed at a short but non-zero separation.
    NonFinite,
}

impl fmt::Display for LjError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LjError::InvalidParameter(name) => {
                write!(f, "{name} must be finite and positive")
            }
            LjError::InvalidSeparation => f.write_str("separation must be finite and non-negative"),
            LjError::Overlap => f.write_str("particles overlap"),
            LjError::NonFinite => f.write_str("pair energy or force is not finite"),
        }
    }
}

impl std::error::Error for LjError {}

/// Energy and radial force of one pair at scalar distance `r`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PairTerm {
    pub energy: f64,
    /// `-dU/dr`. Positive is repulsive.
    pub radial_force: f64,
}

/// Energy of one pair and the force on particle `i` for `separation = r_i - r_j`.
/// The force on `j` is the exact negation.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PairForce {
    pub energy: f64,
    pub force: [f64; 3],
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ForceShiftedLj {
    epsilon: f64,
    sigma: f64,
    cutoff: f64,
    phi_cutoff: f64,
    dphi_cutoff: f64,
}

impl ForceShiftedLj {
    pub fn new(epsilon: f64, sigma: f64, cutoff: f64) -> Result<Self, LjError> {
        for (name, value) in [("epsilon", epsilon), ("sigma", sigma), ("cutoff", cutoff)] {
            if !value.is_finite() || value <= 0.0 {
                return Err(LjError::InvalidParameter(name));
            }
        }
        let (phi_cutoff, dphi_cutoff) = phi_and_derivative(epsilon, sigma, cutoff);
        if !phi_cutoff.is_finite() || !dphi_cutoff.is_finite() {
            return Err(LjError::InvalidParameter("cutoff"));
        }
        Ok(Self {
            epsilon,
            sigma,
            cutoff,
            phi_cutoff,
            dphi_cutoff,
        })
    }

    pub fn epsilon(&self) -> f64 {
        self.epsilon
    }

    pub fn sigma(&self) -> f64 {
        self.sigma
    }

    pub fn cutoff(&self) -> f64 {
        self.cutoff
    }

    /// Energy and radial force at distance `r`. `r = +inf` is outside the cutoff.
    pub fn pair(&self, r: f64) -> Result<PairTerm, LjError> {
        if r.is_nan() || r < 0.0 {
            return Err(LjError::InvalidSeparation);
        }
        // Branch instead of evaluating the shifted form so that r >= rc is exactly zero.
        if r >= self.cutoff {
            return Ok(PairTerm {
                energy: 0.0,
                radial_force: 0.0,
            });
        }
        if r == 0.0 {
            return Err(LjError::Overlap);
        }
        let (phi, dphi) = phi_and_derivative(self.epsilon, self.sigma, r);
        let energy = phi - self.phi_cutoff - (r - self.cutoff) * self.dphi_cutoff;
        let radial_force = self.dphi_cutoff - dphi;
        if !energy.is_finite() || !radial_force.is_finite() {
            return Err(LjError::NonFinite);
        }
        Ok(PairTerm {
            energy,
            radial_force,
        })
    }

    /// Energy and force on `i` for the displacement `separation = r_i - r_j`.
    /// Periodic images are the caller's responsibility.
    pub fn pair_force(&self, separation: [f64; 3]) -> Result<PairForce, LjError> {
        if separation.iter().any(|d| !d.is_finite()) {
            return Err(LjError::InvalidSeparation);
        }
        let [dx, dy, dz] = separation;
        let r = (dx * dx + dy * dy + dz * dz).sqrt();
        let term = self.pair(r)?;
        if term.radial_force == 0.0 {
            return Ok(PairForce {
                energy: term.energy,
                force: [0.0; 3],
            });
        }
        let scale = term.radial_force / r;
        let force = [scale * dx, scale * dy, scale * dz];
        if force.iter().any(|f| !f.is_finite()) {
            return Err(LjError::NonFinite);
        }
        Ok(PairForce {
            energy: term.energy,
            force,
        })
    }
}

/// Unshifted `phi(r)` and `phi'(r)`. Integer powers by multiplication so that
/// Native and Wasm do not depend on a libm `powf`.
fn phi_and_derivative(epsilon: f64, sigma: f64, r: f64) -> (f64, f64) {
    let s = sigma / r;
    let s2 = s * s;
    let s6 = s2 * s2 * s2;
    let s12 = s6 * s6;
    let phi = 4.0 * epsilon * (s12 - s6);
    let dphi = -24.0 * epsilon * (2.0 * s12 - s6) / r;
    (phi, dphi)
}
