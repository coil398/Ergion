import Ergion.Growth
import Mathlib.Analysis.Calculus.Deriv.Add
import Mathlib.Analysis.Calculus.Deriv.Mul
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Deriv

/-!
定数係数の2階同次方程式 \(x'' + b x' + c x = 0\) の一般解。

特性根が相異なる実数なら \(A e^{r_1 t} + B e^{r_2 t}\)、
重根なら \((A + Bt) e^{rt}\)、
複素根 \( \alpha \pm i\beta \) なら \( e^{\alpha t}(A\cos\beta t + B\sin\beta t) \) です。
数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

open Real

def twoRealSolution (A B r1 r2 : ℝ) : ℝ → ℝ :=
  fun t => A * exp (r1 * t) + B * exp (r2 * t)

theorem twoReal_deriv (A B r1 r2 t : ℝ) :
    deriv (twoRealSolution A B r1 r2) t
      = A * (exp (r1 * t) * r1) + B * (exp (r2 * t) * r2) := by
  unfold twoRealSolution
  have h1 := ((exp_linear_hasDeriv r1 t).const_mul A).differentiableAt
  have h2 := ((exp_linear_hasDeriv r2 t).const_mul B).differentiableAt
  rw [deriv_fun_add h1 h2, deriv_const_mul_field, deriv_const_mul_field, deriv_exp_linear,
    deriv_exp_linear]

theorem twoReal_second (A B r1 r2 t : ℝ) :
    deriv (deriv (twoRealSolution A B r1 r2)) t
      = A * (exp (r1 * t) * r1 * r1) + B * (exp (r2 * t) * r2 * r2) := by
  have hfun : deriv (twoRealSolution A B r1 r2)
      = fun s => A * (exp (r1 * s) * r1) + B * (exp (r2 * s) * r2) := by
    ext s
    exact twoReal_deriv A B r1 r2 s
  rw [hfun]
  have h1 := ((((exp_linear_hasDeriv r1 t).mul (hasDerivAt_const t r1)).const_mul A)).differentiableAt
  have h2 := ((((exp_linear_hasDeriv r2 t).mul (hasDerivAt_const t r2)).const_mul B)).differentiableAt
  have h1' : DifferentiableAt ℝ (fun s => A * (exp (r1 * s) * r1)) t := by
    simpa [Pi.mul_apply] using h1
  have h2' : DifferentiableAt ℝ (fun s => B * (exp (r2 * s) * r2)) t := by
    simpa [Pi.mul_apply] using h2
  rw [deriv_fun_add h1' h2', deriv_const_mul_field, deriv_const_mul_field, deriv_mul_const_field,
    deriv_mul_const_field, deriv_exp_linear, deriv_exp_linear]

/-- 相異なる実根の一次結合は方程式を満たします。 -/
theorem twoReal_ode (A B r1 r2 b c t : ℝ) (hsum : r1 + r2 = -b) (hprod : r1 * r2 = c) :
    deriv (deriv (twoRealSolution A B r1 r2)) t + b * deriv (twoRealSolution A B r1 r2) t
      + c * twoRealSolution A B r1 r2 t = 0 := by
  rw [twoReal_second, twoReal_deriv]
  unfold twoRealSolution
  have hb : b = -(r1 + r2) := by linarith
  rw [hb, ← hprod]
  ring

def repeatedSolution (A B r : ℝ) : ℝ → ℝ :=
  fun t => (A + B * t) * exp (r * t)

theorem repeated_deriv (A B r t : ℝ) :
    deriv (repeatedSolution A B r) t
      = B * exp (r * t) + (A + B * t) * (exp (r * t) * r) := by
  unfold repeatedSolution
  have hlin : DifferentiableAt ℝ (fun s => A + B * s) t :=
    ((hasDerivAt_const t A).add ((hasDerivAt_id' t).const_mul B)).differentiableAt
  have hexp : DifferentiableAt ℝ (fun s => exp (r * s)) t :=
    (exp_linear_hasDeriv r t).differentiableAt
  rw [deriv_fun_mul hlin hexp, deriv_exp_linear]
  have hcoeff : deriv (fun s => A + B * s) t = B := by
    rw [deriv_fun_add (differentiableAt_const A) (((hasDerivAt_id' t).const_mul B).differentiableAt),
      deriv_const, deriv_const_mul_field, deriv_id'']
    ring
  rw [hcoeff]

theorem repeated_second (A B r t : ℝ) :
    deriv (deriv (repeatedSolution A B r)) t
      = exp (r * t) * (2 * r * B + r * r * (A + B * t)) := by
  have hfun : deriv (repeatedSolution A B r)
      = fun s => B * exp (r * s) + (A + B * s) * (exp (r * s) * r) := by
    ext s
    exact repeated_deriv A B r s
  rw [hfun]
  have hB : DifferentiableAt ℝ (fun s => B * exp (r * s)) t :=
    ((exp_linear_hasDeriv r t).const_mul B).differentiableAt
  have hpoly : DifferentiableAt ℝ (fun s => A + B * s) t :=
    ((hasDerivAt_const t A).add ((hasDerivAt_id' t).const_mul B)).differentiableAt
  have hexp : DifferentiableAt ℝ (fun s => exp (r * s) * r) t :=
    ((exp_linear_hasDeriv r t).mul_const r).differentiableAt
  have hprod : DifferentiableAt ℝ (fun s => (A + B * s) * (exp (r * s) * r)) t :=
    hpoly.mul hexp
  rw [deriv_fun_add hB hprod, deriv_const_mul_field, deriv_exp_linear, deriv_fun_mul hpoly hexp]
  have hcoeff : deriv (fun s => A + B * s) t = B := by
    rw [deriv_fun_add (differentiableAt_const A) (((hasDerivAt_id' t).const_mul B).differentiableAt),
      deriv_const, deriv_const_mul_field, deriv_id'']
    ring
  have hexp' : deriv (fun s => exp (r * s) * r) t = exp (r * t) * r * r := by
    rw [deriv_mul_const_field, deriv_exp_linear]
  rw [hcoeff, hexp']
  ring

/-- 重根の解 \((A + Bt)e^{rt}\) は、\(b = -2r\)、\(c = r^{2}\) の方程式を満たします。 -/
theorem repeated_ode (A B r b c t : ℝ) (hb : b = -2 * r) (hc : c = r * r) :
    deriv (deriv (repeatedSolution A B r)) t + b * deriv (repeatedSolution A B r) t
      + c * repeatedSolution A B r t = 0 := by
  rw [repeated_second, repeated_deriv, hb, hc]
  unfold repeatedSolution
  ring

def complexSolution (A B α β : ℝ) : ℝ → ℝ :=
  fun t => exp (α * t) * (A * cos (β * t) + B * sin (β * t))

theorem cos_mul_deriv (β t : ℝ) :
    deriv (fun s => cos (β * s)) t = β * -sin (β * t) := by
  rw [deriv_comp_mul_left, Real.deriv_cos, smul_eq_mul]

theorem sin_mul_deriv (β t : ℝ) :
    deriv (fun s => sin (β * s)) t = β * cos (β * t) := by
  rw [deriv_comp_mul_left, Real.deriv_sin, smul_eq_mul]

theorem cos_mul_diff (β t : ℝ) : DifferentiableAt ℝ (fun s => cos (β * s)) t := by
  have hlin : HasDerivAt (fun s => β * s) β t := by
    simpa using (hasDerivAt_id t).const_mul β
  exact ((hasDerivAt_cos (β * t)).comp t hlin).differentiableAt

theorem sin_mul_diff (β t : ℝ) : DifferentiableAt ℝ (fun s => sin (β * s)) t := by
  have hlin : HasDerivAt (fun s => β * s) β t := by
    simpa using (hasDerivAt_id t).const_mul β
  exact ((hasDerivAt_sin (β * t)).comp t hlin).differentiableAt

theorem trig_deriv (A B β t : ℝ) :
    deriv (fun s => A * cos (β * s) + B * sin (β * s)) t
      = A * (β * -sin (β * t)) + B * (β * cos (β * t)) := by
  have hA := (cos_mul_diff β t).const_mul A
  have hB := (sin_mul_diff β t).const_mul B
  rw [deriv_fun_add hA hB, deriv_const_mul_field, deriv_const_mul_field, cos_mul_deriv, sin_mul_deriv]

theorem complex_deriv (A B α β t : ℝ) :
    deriv (complexSolution A B α β) t
      = exp (α * t) * α * (A * cos (β * t) + B * sin (β * t))
        + exp (α * t) * (A * (β * -sin (β * t)) + B * (β * cos (β * t))) := by
  unfold complexSolution
  have hexp := (exp_linear_hasDeriv α t).differentiableAt
  have htrig : DifferentiableAt ℝ (fun s => A * cos (β * s) + B * sin (β * s)) t :=
    ((cos_mul_diff β t).const_mul A).add ((sin_mul_diff β t).const_mul B)
  rw [deriv_fun_mul hexp htrig, deriv_exp_linear, trig_deriv]

/-- 複素根の実形は方程式を満たします。 -/
theorem complex_ode (A B α β b c t : ℝ) (hb : b = -2 * α) (hc : c = α ^ 2 + β ^ 2) :
    deriv (deriv (complexSolution A B α β)) t + b * deriv (complexSolution A B α β) t
      + c * complexSolution A B α β t = 0 := by
  let U : ℝ → ℝ := fun s => A * cos (β * s) + B * sin (β * s)
  let V : ℝ → ℝ := fun s => -(A * β * sin (β * s)) + (B * β) * cos (β * s)
  have hfun : deriv (complexSolution A B α β)
      = fun s => (α * exp (α * s)) * U s + exp (α * s) * V s := by
    ext s
    rw [complex_deriv]
    unfold U V
    ring
  have hU : DifferentiableAt ℝ U t := by
    unfold U
    exact ((cos_mul_diff β t).const_mul A).add ((sin_mul_diff β t).const_mul B)
  have hV : DifferentiableAt ℝ V t := by
    unfold V
    exact (((sin_mul_diff β t).const_mul (A * β)).neg).add ((cos_mul_diff β t).const_mul (B * β))
  have hexpα : DifferentiableAt ℝ (fun s => α * exp (α * s)) t :=
    ((exp_linear_hasDeriv α t).const_mul α).differentiableAt
  have hexp : DifferentiableAt ℝ (fun s => exp (α * s)) t :=
    (exp_linear_hasDeriv α t).differentiableAt
  have hdU : deriv U t = V t := by
    unfold U V
    rw [trig_deriv]
    ring
  have hdV : deriv V t = -(β * β) * U t := by
    unfold V U
    have hneg : DifferentiableAt ℝ (fun s => (-(A * β)) * sin (β * s)) t :=
      (sin_mul_diff β t).const_mul (-(A * β))
    have hpos : DifferentiableAt ℝ (fun s => (B * β) * cos (β * s)) t :=
      (cos_mul_diff β t).const_mul (B * β)
    have hVfun : (fun s => -(A * β * sin (β * s)) + B * β * cos (β * s))
        = fun s => (-(A * β)) * sin (β * s) + (B * β) * cos (β * s) := by
      ext s
      ring
    rw [hVfun, deriv_fun_add hneg hpos, deriv_const_mul_field, deriv_const_mul_field, sin_mul_deriv,
      cos_mul_deriv]
    ring
  have hexpα_deriv : deriv (fun s => α * exp (α * s)) t = α * (exp (α * t) * α) := by
    rw [deriv_const_mul_field, deriv_exp_linear]
  have h1 : HasDerivAt (fun s => (α * exp (α * s)) * U s)
      (deriv (fun s => α * exp (α * s)) t * U t + (α * exp (α * t)) * deriv U t) t := by
    have hpi := hexpα.hasDerivAt.mul hU.hasDerivAt
    apply hpi.congr_of_eventuallyEq
    refine Filter.EventuallyEq.of_eq ?_
    ext s
    simp [Pi.mul_apply]
  have h2 : HasDerivAt (fun s => exp (α * s) * V s)
      ((exp (α * t) * α) * V t + exp (α * t) * deriv V t) t := by
    have hpi := hexp.hasDerivAt.mul hV.hasDerivAt
    have hmoved : HasDerivAt (fun s => exp (α * s) * V s)
        (deriv (fun s => exp (α * s)) t * V t + exp (α * t) * deriv V t) t := by
      apply hpi.congr_of_eventuallyEq
      refine Filter.EventuallyEq.of_eq ?_
      ext s
      simp [Pi.mul_apply]
    simpa [deriv_exp_linear] using hmoved
  have hsum := h1.add h2
  have hsecond : HasDerivAt (deriv (complexSolution A B α β))
      (deriv (fun s => α * exp (α * s)) t * U t + (α * exp (α * t)) * deriv U t
        + ((exp (α * t) * α) * V t + exp (α * t) * deriv V t)) t := by
    have hfun' : deriv (complexSolution A B α β)
        = fun s => (α * exp (α * s)) * U s + exp (α * s) * V s := hfun
    rw [hfun']
    apply hsum.congr_of_eventuallyEq
    refine Filter.EventuallyEq.of_eq ?_
    ext s
    simp [Pi.add_apply]
  rw [hsecond.deriv, hexpα_deriv, hdU, hdV, hfun, hb, hc]
  unfold complexSolution U V
  ring_nf

def characteristicTwoReal (t : ℝ) : ℝ := -exp t + 2 * exp (2 * t)

theorem characteristicTwoReal_solves (t : ℝ) :
    deriv (deriv characteristicTwoReal) t - 3 * deriv characteristicTwoReal t
      + 2 * characteristicTwoReal t = 0
      ∧ characteristicTwoReal 0 = 1 ∧ deriv characteristicTwoReal 0 = 3 := by
  have hfun : characteristicTwoReal = twoRealSolution (-1) 2 1 2 := by
    ext s
    unfold characteristicTwoReal twoRealSolution
    simp
  have hode := twoReal_ode (-1) 2 1 2 (-3) 2 t (by norm_num) (by norm_num)
  refine ⟨?_, ?_, ?_⟩
  · rw [hfun]
    convert hode using 1
    ring
  · unfold characteristicTwoReal
    simp [exp_zero]
    norm_num
  · rw [hfun, twoReal_deriv]
    simp [exp_zero]
    ring

def characteristicRepeated (t : ℝ) : ℝ := (1 - t) * exp t

theorem characteristicRepeated_solves (t : ℝ) :
    deriv (deriv characteristicRepeated) t - 2 * deriv characteristicRepeated t
      + characteristicRepeated t = 0
      ∧ characteristicRepeated 0 = 1 ∧ deriv characteristicRepeated 0 = 0 := by
  have hfun : characteristicRepeated = repeatedSolution 1 (-1) 1 := by
    ext s
    unfold characteristicRepeated repeatedSolution
    simp
    ring
  have hode := repeated_ode 1 (-1) 1 (-2) 1 t (by norm_num) (by norm_num)
  refine ⟨?_, ?_, ?_⟩
  · rw [hfun]
    convert hode using 1
    ring
  · unfold characteristicRepeated
    simp [exp_zero]
  · rw [hfun, repeated_deriv]
    simp [exp_zero]

def characteristicComplex (t : ℝ) : ℝ := cos t

theorem characteristicComplex_solves (t : ℝ) :
    deriv (deriv characteristicComplex) t + characteristicComplex t = 0
      ∧ characteristicComplex 0 = 1 ∧ deriv characteristicComplex 0 = 0 := by
  refine ⟨?_, cos_zero, ?_⟩
  · have h : characteristicComplex = complexSolution 1 0 0 1 := by
      ext s
      unfold characteristicComplex complexSolution
      simp [exp_zero]
    have hode := complex_ode 1 0 0 1 0 1 t (by norm_num) (by norm_num)
    simpa [h] using hode
  · rw [show characteristicComplex = cos from rfl, Real.deriv_cos, sin_zero]
    ring

theorem eq_add_mul_of_deriv_const (y : ℝ → ℝ) (hy : Differentiable ℝ y) (c : ℝ)
    (hy' : ∀ t, deriv y t = c) (t : ℝ) : y t = y 0 + c * t := by
  let z : ℝ → ℝ := y - fun u => c * u
  have hzderiv : ∀ s, deriv z s = 0 := by
    intro s
    have hlin : HasDerivAt (fun u => c * u) c s := by
      simpa using (hasDerivAt_id s).const_mul c
    have hsub : HasDerivAt z (deriv y s - c) s := by
      simpa [z] using ((hy s).hasDerivAt).sub hlin
    rw [hsub.deriv, hy']
    ring
  have hzdiff : Differentiable ℝ z := by
    intro s
    have hlin : HasDerivAt (fun u => c * u) c s := by
      simpa using (hasDerivAt_id s).const_mul c
    simpa [z] using (((hy s).hasDerivAt).sub hlin).differentiableAt
  have hconst : z t = z 0 := is_const_of_deriv_eq_zero hzdiff hzderiv t 0
  have : y t - c * t = y 0 := by simpa [z, Pi.sub_apply] using hconst
  linarith

/-- 相異なる実根なら、解は二つの指数関数の一次結合です。 -/
theorem twoReal_general (b c r1 r2 : ℝ) (hr : r1 ≠ r2) (hsum : r1 + r2 = -b) (hprod : r1 * r2 = c)
    (x : ℝ → ℝ) (hx : Differentiable ℝ x) (hx' : Differentiable ℝ (deriv x))
    (hode : ∀ t, deriv (deriv x) t + b * deriv x t + c * x t = 0) :
    ∃ A B : ℝ, ∀ t, x t = A * exp (r1 * t) + B * exp (r2 * t) := by
  let z : ℝ → ℝ := deriv x - fun s => r2 * x s
  have hzderiv : ∀ s, deriv z s = r1 * z s := by
    intro s
    have hx'' := (hx' s).hasDerivAt
    have hmul := ((hx s).hasDerivAt).const_mul r2
    have hsub : HasDerivAt z (deriv (deriv x) s - r2 * deriv x s) s := by
      simpa [z] using hx''.sub hmul
    have hsecond : deriv (deriv x) s = -b * deriv x s - c * x s := by
      have h := hode s
      linarith
    rw [hsub.deriv, hsecond]
    have hb : b = -(r1 + r2) := by linarith
    rw [hb, ← hprod]
    simp [z, Pi.sub_apply]
    ring
  have hzdiff : Differentiable ℝ z := by
    intro s
    have hx'' := (hx' s).hasDerivAt
    have hmul := ((hx s).hasDerivAt).const_mul r2
    simpa [z] using (hx''.sub hmul).differentiableAt
  have hz_t : ∀ s, z s = z 0 * exp (r1 * s) := fun s => eq_mul_exp r1 z hzdiff hzderiv s
  let w : ℝ → ℝ := x * fun u => exp (-r2 * u)
  have hwderiv : ∀ s, deriv w s = z 0 * exp ((r1 - r2) * s) := by
    intro s
    have hexp := exp_linear_hasDeriv (-r2) s
    have hmul : HasDerivAt w (deriv x s * exp (-r2 * s) + x s * (exp (-r2 * s) * -r2)) s := by
      simpa [w] using ((hx s).hasDerivAt).mul hexp
    rw [hmul.deriv]
    have hfac : deriv x s * exp (-r2 * s) + x s * (exp (-r2 * s) * -r2)
        = (deriv x s + x s * -r2) * exp (-r2 * s) := by ring
    rw [hfac]
    have hz : deriv x s + x s * -r2 = z s := by
      simp [z, Pi.sub_apply]
      ring
    rw [hz, hz_t, mul_assoc, ← exp_add]
    congr 1
    ring
  have hwdiff : Differentiable ℝ w := by
    intro s
    have hexp := exp_linear_hasDeriv (-r2) s
    simpa [w] using (((hx s).hasDerivAt).mul hexp).differentiableAt
  have hdelta : r1 - r2 ≠ 0 := sub_ne_zero.mpr hr
  let A : ℝ := z 0 / (r1 - r2)
  let v : ℝ → ℝ := w - fun u => A * exp ((r1 - r2) * u)
  have hvderiv : ∀ s, deriv v s = 0 := by
    intro s
    have hexp := (exp_linear_hasDeriv (r1 - r2) s).const_mul A
    have hsub : HasDerivAt v (deriv w s - A * (exp ((r1 - r2) * s) * (r1 - r2))) s := by
      simpa [v] using ((hwdiff s).hasDerivAt).sub hexp
    rw [hsub.deriv, hwderiv]
    have hA : A * (r1 - r2) = z 0 := by
      unfold A
      field_simp [hdelta]
    calc
      z 0 * exp ((r1 - r2) * s) - A * (exp ((r1 - r2) * s) * (r1 - r2))
        = exp ((r1 - r2) * s) * (z 0 - A * (r1 - r2)) := by ring
      _ = exp ((r1 - r2) * s) * (z 0 - z 0) := by rw [hA]
      _ = 0 := by ring
  have hvdiff : Differentiable ℝ v := by
    intro s
    have hexp := (exp_linear_hasDeriv (r1 - r2) s).const_mul A
    simpa [v] using (((hwdiff s).hasDerivAt).sub hexp).differentiableAt
  have hvconst : ∀ t, v t = v 0 := fun t => is_const_of_deriv_eq_zero hvdiff hvderiv t 0
  let B : ℝ := x 0 - A
  refine ⟨A, B, ?_⟩
  intro t
  have hv : v t = x 0 - A := by
    have h0 : v 0 = x 0 - A := by
      simp [v, w, A, exp_zero]
    simpa [h0] using hvconst t
  have hw : w t = x 0 - A + A * exp ((r1 - r2) * t) := by
    have hvw : v t = w t - A * exp ((r1 - r2) * t) := by simp [v, Pi.sub_apply]
    linarith
  have hxw : x t = w t * exp (r2 * t) := by
    have hwmul : w t = x t * exp (-r2 * t) := by simp [w]
    calc
      x t = x t * (exp (-r2 * t) * exp (r2 * t)) := by rw [← exp_add]; simp
      _ = (x t * exp (-r2 * t)) * exp (r2 * t) := by ring
      _ = w t * exp (r2 * t) := by rw [hwmul]
  rw [hxw, hw]
  simp [B]
  have hdist : (x 0 - A + A * exp ((r1 - r2) * t)) * exp (r2 * t)
      = (x 0 - A) * exp (r2 * t) + A * exp ((r1 - r2) * t) * exp (r2 * t) := by ring
  rw [hdist]
  have hprod : A * exp ((r1 - r2) * t) * exp (r2 * t) = A * exp ((r1 - r2) * t + r2 * t) := by
    rw [mul_assoc, ← exp_add]
  rw [hprod]
  ring

/-- 重根なら、解は \((A + Bt)e^{rt}\) です。 -/
theorem repeated_general (b c r : ℝ) (hb : b = -2 * r) (hc : c = r * r) (x : ℝ → ℝ)
    (hx : Differentiable ℝ x) (hx' : Differentiable ℝ (deriv x))
    (hode : ∀ t, deriv (deriv x) t + b * deriv x t + c * x t = 0) :
    ∃ A B : ℝ, ∀ t, x t = (A + B * t) * exp (r * t) := by
  let z : ℝ → ℝ := deriv x - fun s => r * x s
  have hzderiv : ∀ s, deriv z s = r * z s := by
    intro s
    have hsub : HasDerivAt z (deriv (deriv x) s - r * deriv x s) s := by
      simpa [z] using ((hx' s).hasDerivAt).sub (((hx s).hasDerivAt).const_mul r)
    have hsecond : deriv (deriv x) s = -b * deriv x s - c * x s := by
      have h := hode s
      linarith
    rw [hsub.deriv, hsecond, hb, hc]
    simp [z, Pi.sub_apply]
    ring
  have hzdiff : Differentiable ℝ z := by
    intro s
    simpa [z] using (((hx' s).hasDerivAt).sub (((hx s).hasDerivAt).const_mul r)).differentiableAt
  have hz_t : ∀ s, z s = z 0 * exp (r * s) := fun s => eq_mul_exp r z hzdiff hzderiv s
  let w : ℝ → ℝ := x * fun u => exp (-r * u)
  have hwderiv : ∀ s, deriv w s = z 0 := by
    intro s
    have hexp := exp_linear_hasDeriv (-r) s
    have hmul : HasDerivAt w (deriv x s * exp (-r * s) + x s * (exp (-r * s) * -r)) s := by
      simpa [w] using ((hx s).hasDerivAt).mul hexp
    rw [hmul.deriv]
    have hfac : deriv x s * exp (-r * s) + x s * (exp (-r * s) * -r)
        = (deriv x s + x s * -r) * exp (-r * s) := by ring
    rw [hfac]
    have hz : deriv x s + x s * -r = z s := by
      simp [z, Pi.sub_apply]
      ring
    rw [hz, hz_t]
    calc
      z 0 * exp (r * s) * exp (-r * s) = z 0 * (exp (r * s) * exp (-r * s)) := by ring
      _ = z 0 * exp (r * s + -r * s) := by rw [← exp_add]
      _ = z 0 := by simp
  have hwdiff : Differentiable ℝ w := by
    intro s
    simpa [w] using (((hx s).hasDerivAt).mul (exp_linear_hasDeriv (-r) s)).differentiableAt
  have hw_t : ∀ t, w t = w 0 + z 0 * t := eq_add_mul_of_deriv_const w hwdiff (z 0) hwderiv
  let A : ℝ := x 0
  let B : ℝ := z 0
  refine ⟨A, B, ?_⟩
  intro t
  have hw0 : w 0 = x 0 := by simp [w, exp_zero]
  have hw := hw_t t
  have hxw : x t = w t * exp (r * t) := by
    have hwmul : w t = x t * exp (-r * t) := by simp [w]
    calc
      x t = x t * (exp (-r * t) * exp (r * t)) := by rw [← exp_add]; simp
      _ = (x t * exp (-r * t)) * exp (r * t) := by ring
      _ = w t * exp (r * t) := by rw [hwmul]
  rw [hxw, hw, hw0]

/-- 複素根なら、解は \(e^{\alpha t}(A\cos\beta t + B\sin\beta t)\) です。 -/
theorem complex_general (b c α β : ℝ) (hb : b = -2 * α) (hc : c = α ^ 2 + β ^ 2) (hβ : β ≠ 0)
    (x : ℝ → ℝ) (hx : Differentiable ℝ x) (hx' : Differentiable ℝ (deriv x))
    (hode : ∀ t, deriv (deriv x) t + b * deriv x t + c * x t = 0) :
    ∃ A B : ℝ, ∀ t, x t = exp (α * t) * (A * cos (β * t) + B * sin (β * t)) := by
  let u : ℝ → ℝ := x * fun s => exp (-α * s)
  have hu' : ∀ s, deriv u s = (deriv x s - α * x s) * exp (-α * s) := by
    intro s
    have hexp := exp_linear_hasDeriv (-α) s
    have hmul : HasDerivAt u
        (deriv x s * exp (-α * s) + x s * (exp (-α * s) * -α)) s := by
      simpa [u] using ((hx s).hasDerivAt).mul hexp
    rw [hmul.deriv]
    ring
  have hudiff : Differentiable ℝ u := by
    intro s
    simpa [u] using (((hx s).hasDerivAt).mul (exp_linear_hasDeriv (-α) s)).differentiableAt
  let uprime : ℝ → ℝ := fun s => (deriv x s - α * x s) * exp (-α * s)
  have huprime : deriv u = uprime := by
    ext s
    simpa [uprime] using hu' s
  have hu'' : ∀ s, deriv uprime s = -(β * β) * u s := by
    intro s
    have hfactor : DifferentiableAt ℝ (fun q => deriv x q - α * x q) s :=
      (hx' s).sub (((hx s).const_mul α))
    have hexp : DifferentiableAt ℝ (fun q => exp (-α * q)) s :=
      (exp_linear_hasDeriv (-α) s).differentiableAt
    have hmul := deriv_fun_mul hfactor hexp
    have huprime_fun : uprime = fun q => (deriv x q - α * x q) * exp (-α * q) := rfl
    rw [huprime_fun, hmul, deriv_exp_linear]
    have hinner : deriv (fun q => deriv x q - α * x q) s
        = deriv (deriv x) s - α * deriv x s := by
      rw [deriv_fun_sub (hx' s) (((hx s).const_mul α)), deriv_const_mul_field]
    rw [hinner]
    have hsecond : deriv (deriv x) s = -b * deriv x s - c * x s := by
      have h := hode s
      linarith
    rw [hsecond, hb, hc]
    simp [u]
    ring
  have huprime_diff : Differentiable ℝ uprime := by
    intro s
    have hfactor : DifferentiableAt ℝ (fun q => deriv x q - α * x q) s :=
      (hx' s).sub ((hx s).const_mul α)
    exact hfactor.mul (exp_linear_hasDeriv (-α) s).differentiableAt
  let Afun : ℝ → ℝ := fun s => u s * cos (β * s) - (uprime s / β) * sin (β * s)
  let Bfun : ℝ → ℝ := fun s => u s * sin (β * s) + (uprime s / β) * cos (β * s)
  have hA' : ∀ s, deriv Afun s = 0 := by
    intro s
    have hu_s := hudiff s
    have hp := huprime_diff s
    have hdiv : DifferentiableAt ℝ (fun q => uprime q / β) s := by
      simpa using hp.div_const β
    have h1 : DifferentiableAt ℝ (fun q => u q * cos (β * q)) s := hu_s.mul (cos_mul_diff β s)
    have h2 : DifferentiableAt ℝ (fun q => (uprime q / β) * sin (β * q)) s :=
      hdiv.mul (sin_mul_diff β s)
    have hAfun : Afun = fun q => u q * cos (β * q) - (uprime q / β) * sin (β * q) := rfl
    rw [hAfun, deriv_fun_sub h1 h2, deriv_fun_mul hu_s (cos_mul_diff β s),
      deriv_fun_mul hdiv (sin_mul_diff β s), cos_mul_deriv, sin_mul_deriv, deriv_div_const]
    rw [hu'', huprime]
    field_simp [hβ]
    ring
  have hB' : ∀ s, deriv Bfun s = 0 := by
    intro s
    have hu_s := hudiff s
    have hp := huprime_diff s
    have hdiv : DifferentiableAt ℝ (fun q => uprime q / β) s := by
      simpa using hp.div_const β
    have h1 : DifferentiableAt ℝ (fun q => u q * sin (β * q)) s := hu_s.mul (sin_mul_diff β s)
    have h2 : DifferentiableAt ℝ (fun q => (uprime q / β) * cos (β * q)) s :=
      hdiv.mul (cos_mul_diff β s)
    rw [show Bfun = fun q => u q * sin (β * q) + (uprime q / β) * cos (β * q) from rfl,
      deriv_fun_add h1 h2, deriv_fun_mul hu_s (sin_mul_diff β s),
      deriv_fun_mul hdiv (cos_mul_diff β s), sin_mul_deriv, cos_mul_deriv, deriv_div_const]
    rw [hu'', huprime]
    field_simp [hβ]
    ring
  have hAdiff : Differentiable ℝ Afun := by
    intro s
    have hdiv : DifferentiableAt ℝ (fun q => uprime q / β) s :=
      (huprime_diff s).div_const β
    have hsub : DifferentiableAt ℝ Afun s := by
      unfold Afun
      exact ((hudiff s).mul (cos_mul_diff β s)).sub (hdiv.mul (sin_mul_diff β s))
    exact hsub
  have hBdiff : Differentiable ℝ Bfun := by
    intro s
    have hdiv : DifferentiableAt ℝ (fun q => uprime q / β) s :=
      (huprime_diff s).div_const β
    have hadd : DifferentiableAt ℝ Bfun s := by
      unfold Bfun
      exact ((hudiff s).mul (sin_mul_diff β s)).add (hdiv.mul (cos_mul_diff β s))
    exact hadd
  have hAconst := fun t => is_const_of_deriv_eq_zero hAdiff hA' t 0
  have hBconst := fun t => is_const_of_deriv_eq_zero hBdiff hB' t 0
  let A : ℝ := Afun 0
  let B : ℝ := Bfun 0
  refine ⟨A, B, ?_⟩
  intro t
  have hA : Afun t = A := hAconst t
  have hB : Bfun t = B := hBconst t
  have hrecover : u t = Afun t * cos (β * t) + Bfun t * sin (β * t) := by
    have hsq : sin (β * t) ^ 2 + cos (β * t) ^ 2 = 1 := sin_sq_add_cos_sq (β * t)
    calc
      u t = u t * (sin (β * t) ^ 2 + cos (β * t) ^ 2) := by rw [hsq]; ring
      _ = (u t * cos (β * t) - (uprime t / β) * sin (β * t)) * cos (β * t)
          + (u t * sin (β * t) + (uprime t / β) * cos (β * t)) * sin (β * t) := by
            field_simp [hβ]; ring
      _ = Afun t * cos (β * t) + Bfun t * sin (β * t) := by simp [Afun, Bfun]
  have hxu : x t = u t * exp (α * t) := by
    have humul : u t = x t * exp (-α * t) := by simp [u]
    calc
      x t = x t * (exp (-α * t) * exp (α * t)) := by rw [← exp_add]; simp
      _ = (x t * exp (-α * t)) * exp (α * t) := by ring
      _ = u t * exp (α * t) := by rw [humul]
  rw [hxu, hrecover, hA, hB]
  ring

end

end Ergion
