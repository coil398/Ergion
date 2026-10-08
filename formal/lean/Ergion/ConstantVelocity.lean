import Init.Data.Rat.Lemmas

/-!
一定速度の1ステップ。

速度 \(v\) が有理数として一定のとき、\(x' = v\) の離散的な1ステップは
\(x \mapsto x + v\,\Delta t\) です。同じ刻みを \(n\) 回繰り返すと
\(x + n v\,\Delta t\) になります。

数は有理数です。この等式は有理数の上で厳密です。
プログラムが使う倍精度の f64 の丸めは、ここでは証明していません。
-/

namespace Ergion

/-- 速度 \(v\) が一定のときの1ステップ。位置、速度、時間刻みは有理数。 -/
def constantVelocityStep (x v dt : Rat) : Rat :=
  x + v * dt

/-- 同じ速度と同じ時間刻みで、1ステップを \(n\) 回繰り返す。 -/
def constantVelocitySteps (x v dt : Rat) : Nat → Rat
  | 0 => x
  | n + 1 => constantVelocityStep (constantVelocitySteps x v dt n) v dt

/-- 1ステップは \(x + v\,\Delta t\)。 -/
theorem constantVelocityStep_eq (x v dt : Rat) :
    constantVelocityStep x v dt = x + v * dt :=
  rfl

private theorem repeat_step (x v dt : Rat) (n : Nat) :
    x + (n : Rat) * v * dt + v * dt = x + ((n + 1 : Nat) : Rat) * v * dt := by
  rw [Rat.natCast_add]
  rw [Rat.add_mul]
  rw [Rat.add_mul]
  rw [show ((1 : Nat) : Rat) = ((1 : Int) : Rat) from rfl]
  rw [Rat.intCast_one, Rat.one_mul]
  rw [Rat.add_assoc]

/-- \(n\) ステップ後は \(x + n v\,\Delta t\)。 \(n = 0\) のときは元の位置。 -/
theorem constantVelocitySteps_eq (x v dt : Rat) (n : Nat) :
    constantVelocitySteps x v dt n = x + (n : Rat) * v * dt := by
  induction n with
  | zero =>
    rw [constantVelocitySteps]
    rw [show ((0 : Nat) : Rat) = ((0 : Int) : Rat) from rfl]
    rw [Rat.intCast_zero, Rat.zero_mul, Rat.zero_mul, Rat.add_zero]
  | succ n ih =>
    rw [constantVelocitySteps, constantVelocityStep, ih, repeat_step]

end Ergion
