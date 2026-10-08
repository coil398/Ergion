import Mathlib.Analysis.Calculus.MeanValue
import Mathlib.Analysis.SpecialFunctions.ExpDeriv

/-!
変数分離 \(x' = kx\) の厳密解 \(x(t) = x_0 e^{kt}\)。

数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

def separatedExponential (x0 k t : ℝ) : ℝ := x0 * exp (k * t)

private theorem exp_linear_hasDeriv (c t : ℝ) :
    HasDerivAt (fun s => exp (c * s)) (exp (c * t) * c) t := by
  have hlin : HasDerivAt (fun s => c * s) c t := by
    simpa using (hasDerivAt_id t).const_mul c
  simpa using hlin.exp

theorem separatedExponential_hasDeriv (x0 k t : ℝ) :
    HasDerivAt (fun s => separatedExponential x0 k s) (k * separatedExponential x0 k t) t := by
  unfold separatedExponential
  have hmul : HasDerivAt (fun s => x0 * exp (k * s)) (x0 * (exp (k * t) * k)) t :=
    (exp_linear_hasDeriv k t).const_mul x0
  convert hmul using 1
  ring

theorem separatedExponential_deriv (x0 k t : ℝ) :
    deriv (fun s => separatedExponential x0 k s) t = k * separatedExponential x0 k t :=
  (separatedExponential_hasDeriv x0 k t).deriv

theorem separatedExponential_initial (x0 k : ℝ) :
    separatedExponential x0 k 0 = x0 := by
  unfold separatedExponential
  simp [exp_zero]

/-- \(x' = kx\) と \(x(0) = x_0\) を満たす微分可能な関数は \(x_0 e^{kt}\) です。 -/
theorem separatedExponential_solves (x0 k : ℝ) (y : ℝ → ℝ) (hy : Differentiable ℝ y)
    (hy' : ∀ t, deriv y t = k * y t) (hy0 : y 0 = x0) (t : ℝ) :
    y t = separatedExponential x0 k t := by
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
  have hmul : y t * exp (-k * t) = x0 := by
    simpa [z, hy0, exp_zero] using hconst
  calc
    y t = y t * (exp (-k * t) * exp (k * t)) := by rw [← exp_add]; simp
    _ = (y t * exp (-k * t)) * exp (k * t) := by ring
    _ = separatedExponential x0 k t := by rw [hmul]; rfl

end

end Ergion
