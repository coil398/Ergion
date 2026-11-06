import Ergion.Growth
import Mathlib.Analysis.Calculus.Deriv.Add
import Mathlib.Analysis.Calculus.Deriv.Mul

/-!
未定係数法。\(x'' - 3x' + 2x = e^{3t}\) の特殊解を \(K e^{3t}\) と置くと \(K = 1/2\) です。
初期条件 \(x(0) = x'(0) = 0\) の厳密解は
\(\tfrac12 e^{t} - e^{2t} + \tfrac12 e^{3t}\) です。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

def undeterminedMode (K t : ℝ) : ℝ := K * exp (3 * t)

theorem undeterminedMode_deriv (K t : ℝ) :
    deriv (fun s => undeterminedMode K s) t = K * (exp (3 * t) * 3) := by
  unfold undeterminedMode
  rw [deriv_const_mul_field, deriv_exp_linear]

theorem undeterminedMode_second (K t : ℝ) :
    deriv (deriv (fun s => undeterminedMode K s)) t = K * (exp (3 * t) * 3 * 3) := by
  have hfun : deriv (fun s => undeterminedMode K s) = fun s => K * (exp (3 * s) * 3) := by
    ext s
    exact undeterminedMode_deriv K s
  rw [hfun, deriv_const_mul_field, deriv_mul_const_field, deriv_exp_linear]

/-- \(K e^{3t}\) が特殊解であることは \(K = 1/2\) と同値です。 -/
theorem undetermined_coefficient (K t : ℝ) :
    deriv (deriv (fun s => undeterminedMode K s)) t - 3 * deriv (fun s => undeterminedMode K s) t
      + 2 * undeterminedMode K t = exp (3 * t) ↔ K = 1 / 2 := by
  rw [undeterminedMode_second, undeterminedMode_deriv]
  unfold undeterminedMode
  constructor
  · intro h
    have hexp : exp (3 * t) ≠ 0 := exp_ne_zero _
    have hK : (2 * K) * exp (3 * t) = exp (3 * t) := by
      nlinarith [h]
    have h2 : 2 * K = 1 := by
      apply mul_right_cancel₀ hexp
      simpa [mul_assoc] using hK
    linarith
  · intro h
    rw [h]
    ring

def undeterminedSolution (t : ℝ) : ℝ :=
  (1 / 2) * exp t - exp (2 * t) + (1 / 2) * exp (3 * t)

theorem undeterminedSolution_deriv (t : ℝ) :
    deriv undeterminedSolution t
      = (1 / 2) * exp t - exp (2 * t) * 2 + (1 / 2) * (exp (3 * t) * 3) := by
  have h1 := ((exp_linear_hasDeriv 1 t).const_mul (1 / 2)).differentiableAt
  have h2 := (exp_linear_hasDeriv 2 t).differentiableAt
  have h3 := ((exp_linear_hasDeriv 3 t).const_mul (1 / 2)).differentiableAt
  unfold undeterminedSolution
  have hsub : DifferentiableAt ℝ (fun s => (1 / 2) * exp (1 * s) - exp (2 * s)) t := h1.sub h2
  rw [show (fun s => (1 / 2) * exp s - exp (2 * s) + (1 / 2) * exp (3 * s))
      = fun s => ((1 / 2) * exp (1 * s) - exp (2 * s)) + (1 / 2) * exp (3 * s) by
        ext s; simp]
  rw [deriv_fun_add hsub h3, deriv_fun_sub h1 h2, deriv_const_mul_field, deriv_const_mul_field,
    deriv_exp_linear, deriv_exp_linear, deriv_exp_linear]
  simp

theorem undeterminedSolution_second (t : ℝ) :
    deriv (deriv undeterminedSolution) t
      = (1 / 2) * exp t - (exp (2 * t) * 2) * 2 + (1 / 2) * (exp (3 * t) * 3 * 3) := by
  have hfun : deriv undeterminedSolution = fun s =>
      (1 / 2) * exp s - exp (2 * s) * 2 + (1 / 2) * (exp (3 * s) * 3) := by
    ext s
    simp [undeterminedSolution_deriv]
  rw [hfun]
  have h1 := ((exp_linear_hasDeriv 1 t).const_mul (1 / 2)).differentiableAt
  have h2 := ((exp_linear_hasDeriv 2 t).mul_const 2).differentiableAt
  have h3 := (((exp_linear_hasDeriv 3 t).mul_const 3).const_mul (1 / 2)).differentiableAt
  have hsub : DifferentiableAt ℝ (fun s => (1 / 2) * exp (1 * s) - exp (2 * s) * 2) t :=
    h1.sub h2
  rw [show (fun s => (1 / 2) * exp s - exp (2 * s) * 2 + (1 / 2) * (exp (3 * s) * 3))
      = fun s => ((1 / 2) * exp (1 * s) - exp (2 * s) * 2) + (1 / 2) * (exp (3 * s) * 3) by
        ext s; simp]
  rw [deriv_fun_add hsub h3, deriv_fun_sub h1 h2,
    deriv_const_mul_field, deriv_mul_const_field, deriv_const_mul_field, deriv_mul_const_field,
    deriv_exp_linear, deriv_exp_linear, deriv_exp_linear]
  simp

theorem undetermined_solves (t : ℝ) :
    deriv (deriv undeterminedSolution) t - 3 * deriv undeterminedSolution t
      + 2 * undeterminedSolution t = exp (3 * t)
      ∧ undeterminedSolution 0 = 0 ∧ deriv undeterminedSolution 0 = 0 := by
  refine ⟨?_, ?_, ?_⟩
  · rw [undeterminedSolution_second, undeterminedSolution_deriv]
    unfold undeterminedSolution
    ring
  · unfold undeterminedSolution
    simp [exp_zero]
    ring
  · rw [undeterminedSolution_deriv]
    simp [exp_zero]
    ring

end

end Ergion
