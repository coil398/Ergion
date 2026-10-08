import Mathlib.Analysis.Calculus.Deriv.Pow
import Mathlib.Analysis.Calculus.MeanValue

/-!
加速度が一定のときの速度と位置。

速度は \(v(t) = v_0 + a t\)、位置は \(x(t) = x_0 + v_0 t + \tfrac{1}{2} a t^2\) です。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

def constantAccelerationVelocity (v0 a t : ℝ) : ℝ := v0 + a * t

def constantAccelerationPosition (x0 v0 a t : ℝ) : ℝ :=
  x0 + v0 * t + a * t ^ 2 / 2

theorem constantAccelerationVelocity_hasDeriv (v0 a t : ℝ) :
    HasDerivAt (fun s => constantAccelerationVelocity v0 a s) a t := by
  unfold constantAccelerationVelocity
  have hconst : HasDerivAt (fun _ : ℝ => v0) 0 t := hasDerivAt_const t v0
  have hlin : HasDerivAt (fun s : ℝ => a * s) a t := by
    simpa using (hasDerivAt_id t).const_mul a
  convert hconst.add hlin using 1
  ring

theorem constantAccelerationVelocity_deriv (v0 a t : ℝ) :
    deriv (fun s => constantAccelerationVelocity v0 a s) t = a :=
  (constantAccelerationVelocity_hasDeriv v0 a t).deriv

theorem constantAccelerationVelocity_initial (v0 a : ℝ) :
    constantAccelerationVelocity v0 a 0 = v0 := by
  unfold constantAccelerationVelocity
  ring

theorem constantAccelerationPosition_hasDeriv (x0 v0 a t : ℝ) :
    HasDerivAt (fun s => constantAccelerationPosition x0 v0 a s)
      (constantAccelerationVelocity v0 a t) t := by
  unfold constantAccelerationPosition constantAccelerationVelocity
  have h0 : HasDerivAt (fun _ : ℝ => x0) 0 t := hasDerivAt_const t x0
  have h1 : HasDerivAt (fun s : ℝ => v0 * s) v0 t := by
    simpa using (hasDerivAt_id t).const_mul v0
  have hpow : HasDerivAt (fun s : ℝ => s ^ 2) (2 * t) t := by
    simpa using hasDerivAt_pow 2 t
  have hmul : HasDerivAt (fun s : ℝ => a * s ^ 2) (a * (2 * t)) t := hpow.const_mul a
  have hdiv : HasDerivAt (fun s : ℝ => a * s ^ 2 / 2) ((a * (2 * t)) / 2) t := hmul.div_const 2
  have hquad : HasDerivAt (fun s : ℝ => a * s ^ 2 / 2) (a * t) t := by
    convert hdiv using 1
    ring
  convert (h0.add h1).add hquad using 1
  ring

theorem constantAccelerationPosition_deriv (x0 v0 a t : ℝ) :
    deriv (fun s => constantAccelerationPosition x0 v0 a s) t =
      constantAccelerationVelocity v0 a t :=
  (constantAccelerationPosition_hasDeriv x0 v0 a t).deriv

theorem constantAccelerationPosition_initial (x0 v0 a : ℝ) :
    constantAccelerationPosition x0 v0 a 0 = x0 := by
  unfold constantAccelerationPosition
  ring

theorem constantAccelerationVelocity_unique (v0 a : ℝ) (y : ℝ → ℝ)
    (hy : Differentiable ℝ y) (hy' : ∀ t, deriv y t = a) (hy0 : y 0 = v0) (t : ℝ) :
    y t = constantAccelerationVelocity v0 a t := by
  let z : ℝ → ℝ := fun u => y u - constantAccelerationVelocity v0 a u
  have hzderiv : ∀ s, deriv z s = 0 := by
    intro s
    have hsub : HasDerivAt z (deriv y s - a) s :=
      ((hy s).hasDerivAt).sub (constantAccelerationVelocity_hasDeriv v0 a s)
    rw [hsub.deriv, hy']
    ring
  have hzdiff : Differentiable ℝ z :=
    hy.sub fun s => (constantAccelerationVelocity_hasDeriv v0 a s).differentiableAt
  have hconst : z t = z 0 := is_const_of_deriv_eq_zero hzdiff hzderiv t 0
  have hz0 : z 0 = 0 := by
    simp [z, hy0, constantAccelerationVelocity_initial]
  have hzt : z t = y t - constantAccelerationVelocity v0 a t := rfl
  linarith

theorem constantAccelerationPosition_unique (x0 v0 a : ℝ) (x : ℝ → ℝ)
    (hx : Differentiable ℝ x) (hx' : ∀ t, deriv x t = constantAccelerationVelocity v0 a t)
    (hx0 : x 0 = x0) (t : ℝ) :
    x t = constantAccelerationPosition x0 v0 a t := by
  let z : ℝ → ℝ := fun u => x u - constantAccelerationPosition x0 v0 a u
  have hzderiv : ∀ s, deriv z s = 0 := by
    intro s
    have hsub : HasDerivAt z (deriv x s - constantAccelerationVelocity v0 a s) s :=
      ((hx s).hasDerivAt).sub (constantAccelerationPosition_hasDeriv x0 v0 a s)
    rw [hsub.deriv, hx']
    ring
  have hzdiff : Differentiable ℝ z :=
    hx.sub fun s => (constantAccelerationPosition_hasDeriv x0 v0 a s).differentiableAt
  have hconst : z t = z 0 := is_const_of_deriv_eq_zero hzdiff hzderiv t 0
  have hz0 : z 0 = 0 := by
    simp [z, hx0, constantAccelerationPosition_initial]
  linarith

/-- 加速度が一定で、初期位置と初期速度を与えた解は、この速度と位置です。 -/
theorem constantAcceleration_solves (x0 v0 a : ℝ) (x : ℝ → ℝ)
    (hx : Differentiable ℝ x) (hx' : Differentiable ℝ (deriv x))
    (hacc : ∀ t, deriv (deriv x) t = a) (hv0 : deriv x 0 = v0) (hx0 : x 0 = x0) (t : ℝ) :
    deriv x t = constantAccelerationVelocity v0 a t ∧
      x t = constantAccelerationPosition x0 v0 a t := by
  have hv : ∀ s, deriv x s = constantAccelerationVelocity v0 a s :=
    fun s => constantAccelerationVelocity_unique v0 a (deriv x) hx' hacc hv0 s
  refine ⟨hv t, ?_⟩
  exact constantAccelerationPosition_unique x0 v0 a x hx hv hx0 t

end

end Ergion
