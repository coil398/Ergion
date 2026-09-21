export type Integrator = 'rk4' | 'verlet';
export interface Config {
  schema_version: 1;
  mass: number;
  spring_constant: number;
  initial_position: number;
  initial_velocity: number;
  dt: number;
  steps: number;
  integrator: Integrator;
}
export interface Snapshot {
  step: number;
  time: number;
  position: number;
  velocity: number;
  kinetic_energy: number;
  potential_energy: number;
  total_energy: number;
  initial_energy: number;
  relative_energy_error: number;
  exact_position: number;
  exact_velocity: number;
  finished: boolean;
}
export interface Batch { samples: Snapshot[]; state: Snapshot }
export type Command =
  | { id: number; command: 'load'; config: Config }
  | { id: number; command: 'start' | 'pause' | 'step' };
export interface Update extends Batch {
  id: number;
  phase: 'ready' | 'running' | 'paused' | 'finished';
}
export type Reply = Update | { id: number; error: string };
