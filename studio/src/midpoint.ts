import { mountMethodPage } from './method-page';

mountMethodPage({
  page: 'midpoint',
  method: 'midpoint',
  title: '中点法',
  fn: 'midpoint_step',
  formula: String.raw`x_{n+1} = x_n + \Delta t \, k_2`,
  prose: '中点法は2次の Runge–Kutta 法です。始点の傾きで中点まで仮に進み、その中点の傾きで1ステップ進めます。',
});
