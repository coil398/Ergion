import { mountMethodPage } from './method-page';

mountMethodPage({
  page: 'euler',
  method: 'euler',
  title: 'Euler法',
  fn: 'euler_step',
  formula: String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`,
  prose: 'Euler 法は、右辺を区間の始点で一定とみなします。',
});
