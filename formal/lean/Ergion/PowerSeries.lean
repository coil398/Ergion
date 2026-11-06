import Mathlib.Analysis.Calculus.Deriv.Add
import Mathlib.Analysis.Calculus.Deriv.Mul
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Deriv
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Series
import Mathlib.Topology.Algebra.InfiniteSum.NatInt

/-!
\(x'' + x = 0\)、\(x(0) = 1\)、\(x'(0) = 0\) のべき級数。

係数は \(a_0 = 1\)、\(a_1 = 0\)、\(a_{m+2} = -a_m/((m+1)(m+2))\) です。
和は \(\cos t\) であり、\(\cos\) はこの初期値問題の解です。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

/-- 偶数番は余弦級数の係数、奇数番は 0 です。 -/
def seriesCoeff (n : ℕ) : ℝ :=
  if Even n then (-1 : ℝ) ^ (n / 2) / ↑(Nat.factorial n) else 0

theorem seriesCoeff_even (n : ℕ) :
    seriesCoeff (2 * n) = (-1 : ℝ) ^ n / ↑(Nat.factorial (2 * n)) := by
  have heven : Even (2 * n) := even_two_mul n
  simp [seriesCoeff, heven, Nat.mul_div_cancel_left n (by norm_num : 0 < 2)]

theorem seriesCoeff_odd (n : ℕ) : seriesCoeff (2 * n + 1) = 0 := by
  have hodd : ¬ Even (2 * n + 1) := by
    intro h
    exact (Nat.even_add_one.mp h) (even_two_mul n)
  simp [seriesCoeff, hodd]

theorem seriesCoeff_recurrence (m : ℕ) :
    seriesCoeff (m + 2) = -seriesCoeff m / ((↑(m + 1) : ℝ) * ↑(m + 2)) := by
  have hparity : Even (m + 2) ↔ Even m := by
    rw [Nat.even_add]
    simp [even_two]
  by_cases hm : Even m
  · have hm2 : Even (m + 2) := hparity.mpr hm
    simp [seriesCoeff, hm, hm2]
    have hfact : Nat.factorial (m + 2) = (m + 2) * (m + 1) * Nat.factorial m := by
      rw [Nat.factorial_succ, Nat.factorial_succ]
      ring
    rw [hfact, pow_succ]
    push_cast
    field_simp
  · have hm2 : ¬ Even (m + 2) := by
      intro h
      exact hm (hparity.mp h)
    simp [seriesCoeff, hm, hm2]

theorem powerSeries_even_sum (t : ℝ) :
    ∑' n : ℕ, seriesCoeff (2 * n) * t ^ (2 * n) = cos t := by
  have hfun : (fun n : ℕ => seriesCoeff (2 * n) * t ^ (2 * n))
      = fun n => (-1 : ℝ) ^ n * t ^ (2 * n) / ↑(Nat.factorial (2 * n)) := by
    ext n
    rw [seriesCoeff_even, div_mul_eq_mul_div]
  rw [hfun, Real.cos_eq_tsum]

theorem powerSeries_eq_cos (t : ℝ) :
    ∑' n : ℕ, seriesCoeff n * t ^ n = cos t := by
  let f : ℕ → ℝ := fun n =>
    if Even n then (-1 : ℝ) ^ (n / 2) * t ^ n / ↑(Nat.factorial n) else 0
  have hterm : (fun n => seriesCoeff n * t ^ n) = f := by
    ext n
    by_cases hn : Even n
    · simp [seriesCoeff, f, hn, div_mul_eq_mul_div]
    · simp [seriesCoeff, f, hn]
  rw [hterm, Real.cos_eq_tsum]
  have he : HasSum (fun k => f (2 * k))
      (∑' n : ℕ, (-1 : ℝ) ^ n * t ^ (2 * n) / ↑(Nat.factorial (2 * n))) := by
    have hfun : (fun k => f (2 * k))
        = fun k => (-1 : ℝ) ^ k * t ^ (2 * k) / ↑(Nat.factorial (2 * k)) := by
      ext k
      have heven : Even (2 * k) := even_two_mul k
      simp [f, heven, Nat.mul_div_cancel_left k (by norm_num : 0 < 2)]
    rw [hfun, ← Real.cos_eq_tsum]
    exact Real.hasSum_cos t
  have ho : HasSum (fun k => f (2 * k + 1)) 0 := by
    have hfun : (fun k => f (2 * k + 1)) = fun _ => (0 : ℝ) := by
      ext k
      have hodd : ¬ Even (2 * k + 1) := by
        intro h
        exact (Nat.even_add_one.mp h) (even_two_mul k)
      simp [f, hodd]
    rw [hfun]
    exact hasSum_single 0 fun _ _ => rfl
  have hall := he.even_add_odd ho
  rw [add_zero] at hall
  exact hall.tsum_eq

theorem cosine_second_deriv (t : ℝ) : deriv (deriv cos) t = -cos t := by
  have hfun : deriv cos = fun s => -sin s := by
    ext s
    exact Real.deriv_cos
  rw [hfun]
  exact ((Real.hasDerivAt_sin t).neg).deriv

theorem cosine_solves (t : ℝ) : deriv (deriv cos) t + cos t = 0 := by
  rw [cosine_second_deriv]
  ring

theorem cosine_initial : cos 0 = 1 ∧ deriv cos 0 = 0 := by
  constructor
  · exact cos_zero
  · rw [Real.deriv_cos, sin_zero]
    ring

end

end Ergion
