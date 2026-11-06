import Mathlib.Analysis.Calculus.Deriv.Basic

/-!
関数 \(x(t)\) が \(x' = f(x, t)\) の解であるとは、各時刻で導関数が右辺と一致することです。

数は実数です。倍精度の丸めは、ここでは証明していません。
-/

namespace Ergion

/-- 各時刻で、導関数が右辺 \(f(x(t), t)\) と一致する。 -/
def IsOdeSolution (f : ℝ → ℝ → ℝ) (x : ℝ → ℝ) : Prop :=
  ∀ t, HasDerivAt x (f (x t) t) t

theorem isOdeSolution_iff_deriv (f : ℝ → ℝ → ℝ) (x : ℝ → ℝ) (hx : Differentiable ℝ x) :
    IsOdeSolution f x ↔ ∀ t, deriv x t = f (x t) t := by
  constructor
  · intro h t
    exact (h t).deriv
  · intro h t
    exact ((hx t).hasDerivAt).congr_deriv (h t)

end Ergion
