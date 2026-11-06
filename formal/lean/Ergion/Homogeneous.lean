import Mathlib.Analysis.Calculus.MeanValue
import Mathlib.Analysis.Convex.Basic
import Mathlib.Analysis.SpecialFunctions.Log.Deriv
import Mathlib.Topology.Order.OrderClosed

/-!
同次形 \(x' = 1 + x/t\)（\(t > 0\)）の厳密解 \(x(t) = t(\ln t + C)\)。

数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real Set

def homogeneousRatio (C t : ℝ) : ℝ := t * (log t + C)

theorem homogeneousRatio_hasDeriv {t : ℝ} (ht : 0 < t) (C : ℝ) :
    HasDerivAt (fun s => homogeneousRatio C s) (1 + homogeneousRatio C t / t) t := by
  unfold homogeneousRatio
  have hlog : HasDerivAt (fun s => log s + C) (t⁻¹) t := by
    convert (hasDerivAt_log ht.ne').add (hasDerivAt_const t C) using 1
    ring
  have hid : HasDerivAt (fun s => s) 1 t := hasDerivAt_id' t
  have hmul := hid.mul hlog
  convert hmul using 1
  field_simp [ht.ne']
  ring

theorem homogeneousRatio_initial (C : ℝ) : homogeneousRatio C 1 = C := by
  unfold homogeneousRatio
  simp [log_one]

/-- \(t > 0\) で \(x' = 1 + x/t\) かつ \(x(1) = C\) ならば \(x(t) = t(\ln t + C)\) です。 -/
theorem homogeneousRatio_solves (C : ℝ) (y : ℝ → ℝ)
    (hy : ∀ t, 0 < t → HasDerivAt y (1 + y t / t) t) (hy1 : y 1 = C) {t : ℝ} (ht : 0 < t) :
    y t = homogeneousRatio C t := by
  let z : ℝ → ℝ := (fun s => y s / s) - log
  have hzderiv : ∀ s, 0 < s → HasDerivAt z 0 s := by
    intro s hs
    have hy_s := hy s hs
    have hid : HasDerivAt (fun u => u) 1 s := hasDerivAt_id' s
    have hdiv : HasDerivAt (fun u => y u / u)
        ((((1 + y s / s) * s - y s) / s ^ 2)) s := by
      convert hy_s.div hid hs.ne' using 1
      ring
    have hsub := hdiv.sub (hasDerivAt_log hs.ne')
    have hzero : ((1 + y s / s) * s - y s) / s ^ 2 - s⁻¹ = 0 := by
      field_simp [hs.ne']
      ring
    simpa [z, hzero] using hsub
  have hdiff : DifferentiableOn ℝ z (Ioi 0) := fun s hs =>
    (hzderiv s hs).differentiableAt.differentiableWithinAt
  have heq : (Ioi (0 : ℝ)).EqOn (deriv z) 0 := fun s hs => (hzderiv s hs).deriv
  have hconst : z t = z 1 :=
    isOpen_Ioi.is_const_of_deriv_eq_zero (convex_Ioi (0 : ℝ)).isPreconnected hdiff heq
      ht (by simp : (1 : ℝ) ∈ Ioi 0)
  have hlevel : y t / t - log t = C := by simpa [z, hy1, log_one] using hconst
  have hmul : y t = t * (log t + C) := by
    have := congrArg (fun r => r * t) hlevel
    field_simp [ht.ne'] at this
    linarith
  simpa [homogeneousRatio] using hmul

end

end Ergion
