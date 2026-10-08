import { mountMethodPage } from './method-page';

mountMethodPage({
  figureAlt: '速度が一定のとき、古典的 RK4 の四つの傾きはみな v で、重み 1, 2, 2, 1 の平均も v になる。1ステップは厳密解と同じ一つの直線である。二つの解は一致し、打ち切り誤差は 0。',
  page: 'rk4',
  method: 'rk4',
  title: '古典的RK4',
  fn: 'rk4_step',
  formula: String.raw`x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)`,
  prose: '古典的な4次の Runge–Kutta 法は、始点、中点、終点で求めた四つの傾きを上の重みで足します。',
});
