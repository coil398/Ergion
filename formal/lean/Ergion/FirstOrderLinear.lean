import Mathlib.Analysis.Calculus.MeanValue
import Mathlib.Analysis.SpecialFunctions.ExpDeriv

/-!
定数係数の1階線形方程式 \(x' + px = q\)（\(p \neq 0\)）の厳密解。

\[
x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}
\]

数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

def firstOrderLinear (x0 p q t : ℝ) : ℝ :=
  q / p + (x0 - q / p) * exp (-p * t)

private theorem exp_linear_hasDeriv (c t : ℝ) :
    HasDerivAt (fun s => exp (c * s)) (exp (c * t) * c) t := by
  have hlin : HasDerivAt (fun s => c * s) c t := by
    simpa using (hasDerivAt_id t).const_mul c
  simpa using hlin.exp

theorem firstOrderLinear_hasDeriv (x0 p q t : ℝ) (hp : p ≠ 0) :
    HasDerivAt (fun s => firstOrderLinear x0 p q s)
      (q - p * firstOrderLinear x0 p q t) t := by
  unfold firstOrderLinear
  have hexp := exp_linear_hasDeriv (-p) t
  have hmul : HasDerivAt (fun s => (x0 - q / p) * exp (-p * s))
      ((x0 - q / p) * (exp (-p * t) * (-p))) t := hexp.const_mul (x0 - q / p)
  have hconst : HasDerivAt (fun _ : ℝ => q / p) 0 t := hasDerivAt_const t (q / p)
  convert hconst.add hmul using 1
  field_simp [hp]
  ring

theorem firstOrderLinear_ode (x0 p q t : ℝ) (hp : p ≠ 0) :
    deriv (fun s => firstOrderLinear x0 p q s) t + p * firstOrderLinear x0 p q t = q := by
  rw [(firstOrderLinear_hasDeriv x0 p q t hp).deriv]
  ring

theorem firstOrderLinear_initial (x0 p q : ℝ) :
    firstOrderLinear x0 p q 0 = x0 := by
  unfold firstOrderLinear
  simp [exp_zero]

/-- \(p \neq 0\) のとき、\(x' + px = q\) と \(x(0) = x_0\) の解はこの式です。 -/
theorem firstOrderLinear_solves (x0 p q : ℝ) (hp : p ≠ 0) (y : ℝ → ℝ) (hy : Differentiable ℝ y)
    (hy' : ∀ t, deriv y t + p * y t = q) (hy0 : y 0 = x0) (t : ℝ) :
    y t = firstOrderLinear x0 p q t := by
  let z : ℝ → ℝ := (fun u => y u - q / p) * fun u => exp (p * u)
  have hzderiv : ∀ s, deriv z s = 0 := by
    intro s
    have hshift : HasDerivAt (fun u => y u - q / p) (deriv y s) s := by
      convert ((hy s).hasDerivAt).sub (hasDerivAt_const s (q / p)) using 1
      ring
    have hexp := exp_linear_hasDeriv p s
    have hmul : HasDerivAt z
        (deriv y s * exp (p * s) + (y s - q / p) * (exp (p * s) * p)) s := by
      simpa [z] using hshift.mul hexp
    have hy_s : deriv y s = q - p * y s := by
      have := hy' s
      linarith
    rw [hmul.deriv, hy_s]
    field_simp [hp]
    ring
  have hzdiff : Differentiable ℝ z := by
    intro s
    have hshift : DifferentiableAt ℝ (fun u => y u - q / p) s :=
      (hy s).sub (differentiableAt_const (q / p))
    have hexp : DifferentiableAt ℝ (fun u => exp (p * u)) s :=
      (exp_linear_hasDeriv p s).differentiableAt
    simpa [z] using hshift.mul hexp
  have hconst : z t = z 0 := is_const_of_deriv_eq_zero hzdiff hzderiv t 0
  have hscaled : (y t - q / p) * exp (p * t) = x0 - q / p := by
    simpa [z, hy0, exp_zero] using hconst
  have hy_t : y t = q / p + (x0 - q / p) * exp (-(p * t)) := by
    have hmul := congrArg (fun r => r * exp (-(p * t))) hscaled
    rw [mul_assoc, ← exp_add, add_neg_cancel, exp_zero, mul_one] at hmul
    linarith
  unfold firstOrderLinear
  rw [neg_mul]
  exact hy_t

end

end Ergion
