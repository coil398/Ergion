import { mountMethodPage } from './method-page';

mountMethodPage({
  figureAlt: '速度が一定のとき、Euler 法が始点の接線を Δt だけ延ばした線は厳密解と同じ一つの直線になり、打ち切り誤差は 0 である。',
  page: 'euler',
  method: 'euler',
  title: 'Euler法',
  fn: 'euler_step',
  formula: String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`,
  prose: 'Euler 法は、右辺を区間の始点で一定とみなします。',
});
