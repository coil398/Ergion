import Mathlib.Analysis.Calculus.Deriv.Add
import Mathlib.Analysis.Calculus.Deriv.Mul
import Mathlib.Analysis.Convex.Basic
import Mathlib.Analysis.SpecialFunctions.Log.Deriv
import Mathlib.Analysis.SpecialFunctions.Trigonometric.ArctanDeriv
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Basic
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Deriv
import Mathlib.Topology.Order.OrderClosed

/-!
定数変化法の例 \(x'' + x = \tan t\)、区間 \((-\pi/2, \pi/2)\)、\(x(0) = x'(0) = 0\)。

厳密解は \(x(t) = \sin t - \cos t \cdot \ln((1 + \sin t)/\cos t)\) です。
この区間では \(\sec t + \tan t = (1 + \sin t)/\cos t > 0\) なので、絶対値は外れます。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real Set Filter
open scoped Topology

def variationInterval : Set ℝ := Ioo (-(π / 2)) (π / 2)

def variationLog (t : ℝ) : ℝ := log ((1 + sin t) / cos t)

def variationSolution (t : ℝ) : ℝ := sin t - cos t * variationLog t

theorem variation_cos_pos {t : ℝ} (ht : t ∈ variationInterval) : 0 < cos t :=
  cos_pos_of_mem_Ioo ht

theorem variation_one_add_sin_pos {t : ℝ} (ht : t ∈ variationInterval) : 0 < 1 + sin t := by
  have htI : t ∈ Icc (-(π / 2)) (π / 2) := ⟨le_of_lt ht.1, le_of_lt ht.2⟩
  have hleft : -(π / 2) ∈ Icc (-(π / 2)) (π / 2) := ⟨le_rfl, by linarith [pi_pos]⟩
  have hlt : sin (-(π / 2)) < sin t := strictMonoOn_sin hleft htI ht.1
  rw [sin_neg, sin_pi_div_two] at hlt
  linarith

theorem variationLog_hasDeriv {t : ℝ} (ht : t ∈ variationInterval) :
    HasDerivAt variationLog (1 / cos t) t := by
  have hcos := variation_cos_pos ht
  have h1 := variation_one_add_sin_pos ht
  have hsum : HasDerivAt (fun s => (1 : ℝ) + sin s) (cos t) t := by
    convert (hasDerivAt_const t (1 : ℝ)).add (hasDerivAt_sin t) using 1
    ring
  have hlog1 := hsum.log h1.ne'
  have hlogc := (hasDerivAt_cos t).log hcos.ne'
  have hdiff : HasDerivAt (fun s => log (1 + sin s) - log (cos s))
      (cos t / (1 + sin t) - -sin t / cos t) t := by
    have hsub := hlog1.sub hlogc
    apply hsub.congr_of_eventuallyEq
    refine EventuallyEq.of_eq ?_
    ext s
    simp [Pi.sub_apply]
  have hagree : variationLog =ᶠ[𝓝 t] fun s => log (1 + sin s) - log (cos s) := by
    filter_upwards [isOpen_Ioo.mem_nhds ht] with s hs
    have hcs := variation_cos_pos hs
    have h1s := variation_one_add_sin_pos hs
    unfold variationLog
    exact log_div h1s.ne' hcs.ne'
  have hvar := hdiff.congr_of_eventuallyEq hagree
  convert hvar using 1
  field_simp [hcos.ne', h1.ne']
  have hrhs : cos t ^ 2 - -(sin t * (1 + sin t)) = 1 + sin t := by
    have hneg : -(sin t * (1 + sin t)) = -sin t - sin t ^ 2 := by ring
    rw [hneg]
    have hsum : cos t ^ 2 - (-sin t - sin t ^ 2) = cos t ^ 2 + sin t + sin t ^ 2 := by ring
    rw [hsum]
    have hcomm : cos t ^ 2 + sin t + sin t ^ 2 = sin t + (sin t ^ 2 + cos t ^ 2) := by ring
    rw [hcomm, sin_sq_add_cos_sq]
    ring
  exact hrhs.symm

theorem variationSolution_hasDeriv {t : ℝ} (ht : t ∈ variationInterval) :
    HasDerivAt variationSolution (cos t + sin t * variationLog t - 1) t := by
  have hlog := variationLog_hasDeriv ht
  have hprod := (hasDerivAt_cos t).mul hlog
  have hsub := (hasDerivAt_sin t).sub hprod
  have hx : HasDerivAt variationSolution
      (cos t - (-sin t * variationLog t + cos t * (1 / cos t))) t := by
    apply hsub.congr_of_eventuallyEq
    refine EventuallyEq.of_eq ?_
    ext s
    simp [variationSolution, Pi.sub_apply, Pi.mul_apply]
  convert hx using 1
  have hcos := variation_cos_pos ht
  field_simp [hcos.ne']
  ring

theorem variationSolution_deriv {t : ℝ} (ht : t ∈ variationInterval) :
    deriv variationSolution t = cos t + sin t * variationLog t - 1 :=
  (variationSolution_hasDeriv ht).deriv

theorem variationPrime_hasDeriv {t : ℝ} (ht : t ∈ variationInterval) :
    HasDerivAt (fun s => cos s + sin s * variationLog s - 1)
      (-sin t + cos t * variationLog t + sin t / cos t) t := by
  have hlog := variationLog_hasDeriv ht
  have hprod := (hasDerivAt_sin t).mul hlog
  have hsum := (hasDerivAt_cos t).add hprod
  have hconst := hsum.sub (hasDerivAt_const t (1 : ℝ))
  have hfun : HasDerivAt (fun s => cos s + sin s * variationLog s - 1)
      (-sin t + (cos t * variationLog t + sin t * (1 / cos t)) - 0) t := by
    apply hconst.congr_of_eventuallyEq
    refine EventuallyEq.of_eq ?_
    ext s
    simp [Pi.add_apply, Pi.mul_apply, Pi.sub_apply]
  convert hfun using 1
  have hcos := variation_cos_pos ht
  field_simp [hcos.ne']
  ring

theorem variationSolution_second {t : ℝ} (ht : t ∈ variationInterval) :
    deriv (deriv variationSolution) t = -sin t + cos t * variationLog t + tan t := by
  have hnear : (fun s => cos s + sin s * variationLog s - 1) =ᶠ[𝓝 t] deriv variationSolution := by
    filter_upwards [isOpen_Ioo.mem_nhds ht] with s hs
    exact (variationSolution_deriv hs).symm
  have hprime := (variationPrime_hasDeriv ht).congr_of_eventuallyEq hnear.symm
  rw [hprime.deriv, tan_eq_sin_div_cos]

theorem variation_solves {t : ℝ} (ht : t ∈ variationInterval) :
    deriv (deriv variationSolution) t + variationSolution t = tan t := by
  rw [variationSolution_second ht]
  unfold variationSolution
  ring

theorem variation_initial :
    variationSolution 0 = 0 ∧ deriv variationSolution 0 = 0 := by
  have h0 : (0 : ℝ) ∈ variationInterval := by
    constructor <;> linarith [pi_pos]
  have hlog : variationLog 0 = 0 := by
    unfold variationLog
    simp [sin_zero, cos_zero, log_one]
  refine ⟨?_, ?_⟩
  · simp [variationSolution, hlog, sin_zero, cos_zero]
  · rw [variationSolution_deriv h0, hlog, sin_zero, cos_zero]
    ring

end

end Ergion
