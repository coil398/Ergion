import Mathlib.Analysis.Calculus.Deriv.Pow
import Mathlib.Analysis.Calculus.MeanValue

/-!
完全微分 \((2x + y)\,dx + (x + 2y)\,dy = 0\) の解は、ポテンシャル
\(x^2 + xy + y^2\) が一定であることです。

数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

noncomputable section

def exactPotential (x y : ℝ) : ℝ := x ^ 2 + x * y + y ^ 2

theorem exactPotential_hasDeriv (x y : ℝ → ℝ) (hx : Differentiable ℝ x) (hy : Differentiable ℝ y)
    (t : ℝ) : HasDerivAt (fun s => exactPotential (x s) (y s))
      ((2 * x t + y t) * deriv x t + (x t + 2 * y t) * deriv y t) t := by
  have hx' : HasDerivAt x (deriv x t) t := (hx t).hasDerivAt
  have hy' : HasDerivAt y (deriv y t) t := (hy t).hasDerivAt
  have hx2 : HasDerivAt (fun s => x s ^ 2) (2 * x t * deriv x t) t := by
    convert hx'.pow 2 using 1
    simp
  have hy2 : HasDerivAt (fun s => y s ^ 2) (2 * y t * deriv y t) t := by
    convert hy'.pow 2 using 1
    simp
  have hxy : HasDerivAt (fun s => x s * y s) (deriv x t * y t + x t * deriv y t) t := hx'.mul hy'
  have hsum := (hx2.add hxy).add hy2
  have hfun : (fun s => exactPotential (x s) (y s)) =
      ((fun s => x s ^ 2) + (fun s => x s * y s)) + fun s => y s ^ 2 := by
    ext s
    simp [exactPotential, Pi.add_apply]
  rw [hfun]
  convert hsum using 1
  ring

theorem exactPotential_constant (x y : ℝ → ℝ) (hx : Differentiable ℝ x) (hy : Differentiable ℝ y)
    (hode : ∀ t, (2 * x t + y t) * deriv x t + (x t + 2 * y t) * deriv y t = 0) (t : ℝ) :
    exactPotential (x t) (y t) = exactPotential (x 0) (y 0) := by
  let phi : ℝ → ℝ := fun s => exactPotential (x s) (y s)
  have hderiv : ∀ s, deriv phi s = 0 := by
    intro s
    have h := exactPotential_hasDeriv x y hx hy s
    rw [show deriv phi s = (2 * x s + y s) * deriv x s + (x s + 2 * y s) * deriv y s by
      simpa [phi] using h.deriv]
    exact hode s
  have hdiff : Differentiable ℝ phi := fun s =>
    (exactPotential_hasDeriv x y hx hy s).differentiableAt
  have hconst := is_const_of_deriv_eq_zero hdiff hderiv t 0
  simpa [phi] using hconst

end

end Ergion
