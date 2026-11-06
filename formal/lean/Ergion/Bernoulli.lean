import Ergion.Growth
import Mathlib.Analysis.SpecialFunctions.Pow.Deriv

/-!
ベルヌーイ方程式 \(x' + px = q x^{n}\)（\(n \neq 0, 1\)、\(x > 0\)）は、
\(u = x^{1-n}\) と置くと1階線形方程式 \(u' + (1-n)pu = (1-n)q\) になります。

例 \(x' - x = -x^{2}\) の厳密解 \(x(t) = 1 / (1 + (1/x_0 - 1)e^{-t})\) も確かめます。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

/-- \(n \neq 0, 1\) かつ \(x > 0\) のとき、\(u = x^{1-n}\) は1階線形方程式を満たします。 -/
theorem bernoulli_to_linear (n p q : ℝ) (hn0 : n ≠ 0) (hn1 : n ≠ 1) (x : ℝ → ℝ)
    (hx : Differentiable ℝ x) (hpos : ∀ t, 0 < x t)
    (hode : ∀ t, deriv x t + p * x t = q * (x t) ^ n) :
    (∀ t, deriv (fun s => (x s) ^ (1 - n)) t + (1 - n) * p * (x t) ^ (1 - n) = (1 - n) * q)
      ∧ 1 - n ≠ 0 ∧ 1 - n ≠ 1 := by
  refine ⟨?_, ?_, ?_⟩
  · intro t
    have hpow := ((hx t).hasDerivAt).rpow_const (p := 1 - n) (Or.inl (hpos t).ne')
    rw [hpow.deriv]
    have hshift : (1 - n) - 1 = -n := by ring
    rw [hshift]
    have hx' : deriv x t = q * (x t) ^ n - p * x t := by
      have h := hode t
      linarith
    rw [hx']
    have hpos' : 0 < x t := hpos t
    have hcancel : (x t) ^ n * (x t) ^ (-n) = 1 := by
      rw [← rpow_add hpos', add_neg_cancel, rpow_zero]
    have hmove : x t * (x t) ^ (-n) = (x t) ^ (1 - n) := by
      nth_rw 1 [← rpow_one (x t)]
      rw [← rpow_add hpos']
      congr 1
    calc
      (q * (x t) ^ n - p * x t) * (1 - n) * (x t) ^ (-n)
          + (1 - n) * p * (x t) ^ (1 - n)
        = (1 - n) * q * ((x t) ^ n * (x t) ^ (-n))
          - (1 - n) * p * (x t * (x t) ^ (-n))
          + (1 - n) * p * (x t) ^ (1 - n) := by ring
      _ = (1 - n) * q * 1 - (1 - n) * p * (x t) ^ (1 - n)
          + (1 - n) * p * (x t) ^ (1 - n) := by rw [hcancel, hmove]
      _ = (1 - n) * q := by ring
  · intro h
    exact hn1 (by linarith)
  · intro h
    exact hn0 (by linarith)

def bernoulliDenom (x0 t : ℝ) : ℝ := 1 + (x0⁻¹ - 1) * exp (-t)

def bernoulliLogistic (x0 t : ℝ) : ℝ := (bernoulliDenom x0 t)⁻¹

theorem bernoulliDenom_deriv (x0 t : ℝ) :
    deriv (fun s => bernoulliDenom x0 s) t = (x0⁻¹ - 1) * (exp (-t) * -1) := by
  have hexp : deriv (fun s => exp (-s)) t = exp (-t) * -1 := by
    simpa [neg_one_mul] using deriv_exp_linear (-1) t
  have hfun : (fun s => bernoulliDenom x0 s) = fun s => (1 : ℝ) + (x0⁻¹ - 1) * exp (-s) := rfl
  rw [hfun, deriv_const_add, deriv_const_mul_field, hexp]

theorem bernoulliLogistic_initial (x0 : ℝ) (_hx0 : x0 ≠ 0) :
    bernoulliLogistic x0 0 = x0 := by
  unfold bernoulliLogistic bernoulliDenom
  simp [exp_zero]

theorem bernoulliLogistic_deriv (x0 t : ℝ) (hden : bernoulliDenom x0 t ≠ 0) :
    deriv (fun s => bernoulliLogistic x0 s) t
      = bernoulliLogistic x0 t - bernoulliLogistic x0 t ^ 2 := by
  have hd : DifferentiableAt ℝ (fun s => bernoulliDenom x0 s) t := by
    have hmul := ((exp_linear_hasDeriv (-1) t).differentiableAt).const_mul (x0⁻¹ - 1)
    simpa [bernoulliDenom, neg_one_mul] using (differentiableAt_const (1 : ℝ)).add hmul
  rw [show (fun s => bernoulliLogistic x0 s) = fun s => (bernoulliDenom x0 s)⁻¹ from rfl]
  rw [deriv_fun_inv'' hd hden, bernoulliDenom_deriv]
  unfold bernoulliLogistic bernoulliDenom
  field_simp [hden]
  ring

/-- \(x_0 = 1/2\) の例 \(x(t) = 1/(1 + e^{-t})\) は \(x' = x - x^{2}\) と \(x(0) = 1/2\) を満たします。 -/
theorem bernoulliExample (t : ℝ) :
    deriv (fun s => bernoulliLogistic (1 / 2) s) t
      = bernoulliLogistic (1 / 2) t - bernoulliLogistic (1 / 2) t ^ 2
      ∧ bernoulliLogistic (1 / 2) 0 = 1 / 2 := by
  refine ⟨bernoulliLogistic_deriv (1 / 2) t ?_, bernoulliLogistic_initial (1 / 2) (by norm_num)⟩
  unfold bernoulliDenom
  have htwo : ((1 / 2 : ℝ)⁻¹) = 2 := by norm_num
  rw [htwo]
  have hpos : (0 : ℝ) < 1 + (2 - 1) * exp (-t) := by
    have hexp : (0 : ℝ) < exp (-t) := exp_pos _
    nlinarith
  exact hpos.ne'

end

end Ergion
