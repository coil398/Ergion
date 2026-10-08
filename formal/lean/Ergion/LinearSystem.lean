import Ergion.Growth
import Mathlib.Analysis.Calculus.MeanValue

/-!
連立 \(x' = x + y\)、\(y' = 4x + y\) の、\(x(0) = 1\)、\(y(0) = 0\) の厳密解。

\[
x(t) = \tfrac12(e^{3t} + e^{-t}),\qquad y(t) = e^{3t} - e^{-t}
\]

固有値は \(3\) と \(-1\)、固有ベクトルは \((1, 2)\) と \((1, -2)\) です。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

def linearSystemX (t : ℝ) : ℝ := (2 : ℝ)⁻¹ * (exp (3 * t) + exp (-t))

def linearSystemY (t : ℝ) : ℝ := exp (3 * t) - exp (-t)

theorem linearSystem_initial : linearSystemX 0 = 1 ∧ linearSystemY 0 = 0 := by
  unfold linearSystemX linearSystemY
  simp [exp_zero]
  norm_num

theorem linearSystemX_hasDeriv (t : ℝ) :
    HasDerivAt linearSystemX (linearSystemX t + linearSystemY t) t := by
  have h3 := exp_linear_hasDeriv 3 t
  have hm : HasDerivAt (fun s => exp (-s)) (exp (-t) * -1) t := by
    simpa [neg_one_mul] using exp_linear_hasDeriv (-1) t
  have hsum := h3.add hm
  have hmul := hsum.const_mul (2 : ℝ)⁻¹
  have hx : HasDerivAt linearSystemX ((2 : ℝ)⁻¹ * (exp (3 * t) * 3 + exp (-t) * (-1))) t := by
    apply hmul.congr_of_eventuallyEq
    refine Filter.EventuallyEq.of_eq ?_
    ext s
    simp [linearSystemX, Pi.add_apply]
  convert hx using 1
  unfold linearSystemX linearSystemY
  ring

theorem linearSystemY_hasDeriv (t : ℝ) :
    HasDerivAt linearSystemY (4 * linearSystemX t + linearSystemY t) t := by
  have h3 := exp_linear_hasDeriv 3 t
  have hm : HasDerivAt (fun s => exp (-s)) (exp (-t) * -1) t := by
    simpa [neg_one_mul] using exp_linear_hasDeriv (-1) t
  have hsub := h3.sub hm
  have hy : HasDerivAt linearSystemY (exp (3 * t) * 3 - exp (-t) * (-1)) t := by
    apply hsub.congr_of_eventuallyEq
    refine Filter.EventuallyEq.of_eq ?_
    ext s
    simp [linearSystemY, Pi.sub_apply]
  convert hy using 1
  unfold linearSystemX linearSystemY
  ring

/-- 初期値を満たす解は、この二つの式です。 -/
theorem linearSystem_solves (x y : ℝ → ℝ) (hx : Differentiable ℝ x) (hy : Differentiable ℝ y)
    (hx' : ∀ t, deriv x t = x t + y t) (hy' : ∀ t, deriv y t = 4 * x t + y t)
    (hx0 : x 0 = 1) (hy0 : y 0 = 0) (t : ℝ) :
    x t = linearSystemX t ∧ y t = linearSystemY t := by
  let a : ℝ → ℝ := fun s => (2 * x s + y s) / 4
  let b : ℝ → ℝ := fun s => (2 * x s - y s) / 4
  have ha' : ∀ s, deriv a s = 3 * a s := by
    intro s
    have hsum := (((hx s).hasDerivAt).const_mul 2).add (hy s).hasDerivAt
    have hdiv : HasDerivAt a ((2 * deriv x s + deriv y s) / 4) s := by
      apply (hsum.div_const 4).congr_of_eventuallyEq
      refine Filter.EventuallyEq.of_eq ?_
      ext u
      simp [a, Pi.add_apply]
    rw [hdiv.deriv, hx', hy']
    simp [a]
    ring
  have hb' : ∀ s, deriv b s = -1 * b s := by
    intro s
    have hsub := (((hx s).hasDerivAt).const_mul 2).sub (hy s).hasDerivAt
    have hdiv : HasDerivAt b ((2 * deriv x s - deriv y s) / 4) s := by
      apply (hsub.div_const 4).congr_of_eventuallyEq
      refine Filter.EventuallyEq.of_eq ?_
      ext u
      simp [b, Pi.sub_apply]
    rw [hdiv.deriv, hx', hy']
    simp [b]
    ring
  have hadiff : Differentiable ℝ a := fun s => by
    have hsum := (((hx s).hasDerivAt).const_mul 2).add (hy s).hasDerivAt
    have hdiv : HasDerivAt a ((2 * deriv x s + deriv y s) / 4) s := by
      apply (hsum.div_const 4).congr_of_eventuallyEq
      refine Filter.EventuallyEq.of_eq ?_
      ext u
      simp [a, Pi.add_apply]
    exact hdiv.differentiableAt
  have hbdiff : Differentiable ℝ b := fun s => by
    have hsub := (((hx s).hasDerivAt).const_mul 2).sub (hy s).hasDerivAt
    have hdiv : HasDerivAt b ((2 * deriv x s - deriv y s) / 4) s := by
      apply (hsub.div_const 4).congr_of_eventuallyEq
      refine Filter.EventuallyEq.of_eq ?_
      ext u
      simp [b, Pi.sub_apply]
    exact hdiv.differentiableAt
  have ha := eq_mul_exp 3 a hadiff ha' t
  have hb := eq_mul_exp (-1) b hbdiff hb' t
  have ha0 : a 0 = (2 : ℝ)⁻¹ := by simp [a, hx0, hy0]; norm_num
  have hb0 : b 0 = (2 : ℝ)⁻¹ := by simp [b, hx0, hy0]; norm_num
  have ha_t : a t = (2 : ℝ)⁻¹ * exp (3 * t) := by simpa [ha0] using ha
  have hb_t : b t = (2 : ℝ)⁻¹ * exp (-t) := by simpa [hb0] using hb
  have hx_t : x t = a t + b t := by simp [a, b]; ring
  have hy_t : y t = 2 * a t - 2 * b t := by simp [a, b]; ring
  refine ⟨?_, ?_⟩
  · rw [hx_t, ha_t, hb_t]
    unfold linearSystemX
    ring
  · rw [hy_t, ha_t, hb_t]
    unfold linearSystemY
    ring

end

end Ergion
