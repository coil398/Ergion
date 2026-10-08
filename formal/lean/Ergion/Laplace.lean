import Ergion.Growth
import Mathlib.Analysis.Calculus.Deriv.Add
import Mathlib.Analysis.Calculus.Deriv.Mul
import Mathlib.Analysis.SpecialFunctions.ImproperIntegrals
import Mathlib.MeasureTheory.Integral.Bochner.Basic

/-!
Laplace 変換で解く初期値問題 \(x'' - 3x' + 2x = e^{3t}\)、\(x(0) = x'(0) = 0\)。

閉形式 \(x(t) = \tfrac12 e^{t} - e^{2t} + \tfrac12 e^{3t}\) の変換は、\(s > 3\) で
\(1/((s-1)(s-2)(s-3))\) です。同じ閉形式が初期値問題を満たします。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real MeasureTheory Set

def laplace (f : ℝ → ℝ) (s : ℝ) : ℝ :=
  ∫ t in Ioi (0 : ℝ), exp (-s * t) * f t

def laplaceSolution (t : ℝ) : ℝ :=
  (1 / 2) * exp t - exp (2 * t) + (1 / 2) * exp (3 * t)

theorem laplace_exp (a s : ℝ) (hs : a < s) :
    laplace (fun t => exp (a * t)) s = 1 / (s - a) := by
  unfold laplace
  have hneg : a - s < 0 := by linarith
  have hint := integral_exp_mul_Ioi hneg 0
  have heq : (fun t : ℝ => exp (-s * t) * exp (a * t)) = fun t => exp ((a - s) * t) := by
    ext t
    rw [← exp_add]
    congr 1
    ring
  rw [heq, hint, mul_zero, exp_zero]
  have hden : a - s = -(s - a) := by ring
  rw [hden, div_neg, neg_div, neg_neg]

theorem laplaceSolution_transform (s : ℝ) (hs : 3 < s) :
    laplace laplaceSolution s = 1 / ((s - 1) * (s - 2) * (s - 3)) := by
  unfold laplace laplaceSolution
  have heq : (fun t : ℝ => exp (-s * t) *
      ((1 / 2) * exp t - exp (2 * t) + (1 / 2) * exp (3 * t)))
      = fun t => (1 / 2) * exp ((1 - s) * t) - exp ((2 - s) * t) + (1 / 2) * exp ((3 - s) * t) := by
    ext t
    have h1 : exp (-s * t) * exp t = exp ((1 - s) * t) := by rw [← exp_add]; ring_nf
    have h2 : exp (-s * t) * exp (2 * t) = exp ((2 - s) * t) := by rw [← exp_add]; ring_nf
    have h3 : exp (-s * t) * exp (3 * t) = exp ((3 - s) * t) := by rw [← exp_add]; ring_nf
    calc
      exp (-s * t) * ((1 / 2) * exp t - exp (2 * t) + (1 / 2) * exp (3 * t))
        = (1 / 2) * (exp (-s * t) * exp t) - exp (-s * t) * exp (2 * t)
          + (1 / 2) * (exp (-s * t) * exp (3 * t)) := by ring
      _ = (1 / 2) * exp ((1 - s) * t) - exp ((2 - s) * t) + (1 / 2) * exp ((3 - s) * t) := by
          rw [h1, h2, h3]
  rw [heq]
  have i1 : IntegrableOn (fun t : ℝ => exp ((1 - s) * t)) (Ioi 0) :=
    integrableOn_exp_mul_Ioi (by linarith : 1 - s < 0) 0
  have i2 : IntegrableOn (fun t : ℝ => exp ((2 - s) * t)) (Ioi 0) :=
    integrableOn_exp_mul_Ioi (by linarith : 2 - s < 0) 0
  have i3 : IntegrableOn (fun t : ℝ => exp ((3 - s) * t)) (Ioi 0) :=
    integrableOn_exp_mul_Ioi (by linarith : 3 - s < 0) 0
  have i1s : IntegrableOn (fun t : ℝ => (1 / 2) * exp ((1 - s) * t)) (Ioi 0) := i1.const_mul (1 / 2)
  have i3s : IntegrableOn (fun t : ℝ => (1 / 2) * exp ((3 - s) * t)) (Ioi 0) := i3.const_mul (1 / 2)
  have hsub : IntegrableOn (fun t : ℝ => (1 / 2) * exp ((1 - s) * t) - exp ((2 - s) * t)) (Ioi 0) :=
    i1s.sub i2
  have hadd : IntegrableOn (fun t : ℝ =>
      (1 / 2) * exp ((1 - s) * t) - exp ((2 - s) * t) + (1 / 2) * exp ((3 - s) * t)) (Ioi 0) :=
    hsub.add i3s
  rw [integral_add hsub i3s, integral_sub i1s i2, integral_const_mul, integral_const_mul]
  have h1 := laplace_exp 1 s (by linarith)
  have h2 := laplace_exp 2 s (by linarith)
  have h3 := laplace_exp 3 s (by linarith)
  unfold laplace at h1 h2 h3
  have e1 : (fun t : ℝ => exp (-s * t) * exp (1 * t)) = fun t => exp ((1 - s) * t) := by
    ext t; rw [← exp_add]; ring_nf
  have e2 : (fun t : ℝ => exp (-s * t) * exp (2 * t)) = fun t => exp ((2 - s) * t) := by
    ext t; rw [← exp_add]; ring_nf
  have e3 : (fun t : ℝ => exp (-s * t) * exp (3 * t)) = fun t => exp ((3 - s) * t) := by
    ext t; rw [← exp_add]; ring_nf
  rw [e1] at h1
  rw [e2] at h2
  rw [e3] at h3
  rw [h1, h2, h3]
  field_simp [show s - 1 ≠ 0 by linarith, show s - 2 ≠ 0 by linarith, show s - 3 ≠ 0 by linarith]
  ring

theorem laplaceSolution_deriv (t : ℝ) :
    deriv laplaceSolution t
      = (1 / 2) * exp t - 2 * exp (2 * t) + (3 / 2) * exp (3 * t) := by
  have h1 := ((exp_linear_hasDeriv 1 t).const_mul (1 / 2)).differentiableAt
  have h2 := (exp_linear_hasDeriv 2 t).differentiableAt
  have h3 := ((exp_linear_hasDeriv 3 t).const_mul (1 / 2)).differentiableAt
  have hsub : DifferentiableAt ℝ (fun s => (1 / 2) * exp (1 * s) - exp (2 * s)) t := h1.sub h2
  have hfun : laplaceSolution = fun s =>
      ((1 / 2) * exp (1 * s) - exp (2 * s)) + (1 / 2) * exp (3 * s) := by
    ext s
    unfold laplaceSolution
    simp
  rw [hfun, deriv_fun_add hsub h3, deriv_fun_sub h1 h2, deriv_const_mul_field, deriv_const_mul_field,
    deriv_exp_linear, deriv_exp_linear, deriv_exp_linear]
  ring

theorem laplaceSolution_second (t : ℝ) :
    deriv (deriv laplaceSolution) t
      = (1 / 2) * exp t - 4 * exp (2 * t) + (9 / 2) * exp (3 * t) := by
  have hfun : deriv laplaceSolution = fun s =>
      (1 / 2) * exp s - 2 * exp (2 * s) + (3 / 2) * exp (3 * s) := by
    ext s
    exact laplaceSolution_deriv s
  rw [hfun]
  have h1 := ((exp_linear_hasDeriv 1 t).const_mul (1 / 2)).differentiableAt
  have h2 := ((exp_linear_hasDeriv 2 t).const_mul 2).differentiableAt
  have h3 := ((exp_linear_hasDeriv 3 t).const_mul (3 / 2)).differentiableAt
  have hsub : DifferentiableAt ℝ (fun s => (1 / 2) * exp (1 * s) - 2 * exp (2 * s)) t :=
    h1.sub h2
  rw [show (fun s => (1 / 2) * exp s - 2 * exp (2 * s) + (3 / 2) * exp (3 * s))
      = fun s => ((1 / 2) * exp (1 * s) - 2 * exp (2 * s)) + (3 / 2) * exp (3 * s) by
        ext s; simp]
  rw [deriv_fun_add hsub h3, deriv_fun_sub h1 h2,
    deriv_const_mul_field, deriv_const_mul_field, deriv_const_mul_field, deriv_exp_linear,
    deriv_exp_linear, deriv_exp_linear]
  ring

theorem laplace_solves (t : ℝ) :
    deriv (deriv laplaceSolution) t - 3 * deriv laplaceSolution t + 2 * laplaceSolution t
      = exp (3 * t)
      ∧ laplaceSolution 0 = 0 ∧ deriv laplaceSolution 0 = 0 := by
  refine ⟨?_, ?_, ?_⟩
  · rw [laplaceSolution_second, laplaceSolution_deriv]
    unfold laplaceSolution
    ring
  · unfold laplaceSolution
    simp [exp_zero]
    ring
  · rw [laplaceSolution_deriv]
    simp [exp_zero]
    ring

end

end Ergion
