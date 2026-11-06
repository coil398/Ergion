import Mathlib.Analysis.Calculus.MeanValue
import Mathlib.Analysis.SpecialFunctions.ExpDeriv

/-!
導関数が自分の定数倍である関数は、指数関数の定数倍です。

数は実数です。この補題は、各方程式の解が一つであることを示すために使います。
-/

namespace Ergion

noncomputable section

open Real

theorem exp_linear_hasDeriv (c t : ℝ) :
    HasDerivAt (fun s => exp (c * s)) (exp (c * t) * c) t := by
  have hlin : HasDerivAt (fun s => c * s) c t := by
    simpa using (hasDerivAt_id t).const_mul c
  simpa using hlin.exp

theorem deriv_exp_linear (c t : ℝ) :
    deriv (fun s => exp (c * s)) t = exp (c * t) * c :=
  (exp_linear_hasDeriv c t).deriv

theorem eq_mul_exp (k : ℝ) (y : ℝ → ℝ) (hy : Differentiable ℝ y)
    (hy' : ∀ t, deriv y t = k * y t) (t : ℝ) : y t = y 0 * exp (k * t) := by
  let z : ℝ → ℝ := y * fun u => exp (-k * u)
  have hzderiv : ∀ s, deriv z s = 0 := by
    intro s
    have hexp := exp_linear_hasDeriv (-k) s
    have hmul : HasDerivAt z (deriv y s * exp (-k * s) + y s * (exp (-k * s) * (-k))) s := by
      simpa [z] using ((hy s).hasDerivAt).mul hexp
    rw [hmul.deriv, hy']
    ring
  have hzdiff : Differentiable ℝ z := by
    intro s
    have hexp := exp_linear_hasDeriv (-k) s
    simpa [z] using (((hy s).hasDerivAt).mul hexp).differentiableAt
  have hconst : z t = z 0 := is_const_of_deriv_eq_zero hzdiff hzderiv t 0
  have hmul : y t * exp (-k * t) = y 0 := by simpa [z, exp_zero] using hconst
  calc
    y t = y t * (exp (-k * t) * exp (k * t)) := by rw [← exp_add]; simp
    _ = (y t * exp (-k * t)) * exp (k * t) := by ring
    _ = y 0 * exp (k * t) := by rw [hmul]

end

end Ergion
