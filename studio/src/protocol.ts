export interface Config {
  schema_version: 1;
  initial_position: number;
  velocity: number;
  dt: number;
  steps: number;
}

export interface ConstantAccelerationConfig {
  schema_version: 1;
  initial_position: number;
  initial_velocity: number;
  acceleration: number;
  dt: number;
  steps: number;
}

export type MotionModel = 'uniform' | 'constant-acceleration' | 'position-derivative' | 'euler';

export interface Snapshot {
  step: number;
  time: number;
  position: number;
  velocity: number;
  exact_position: number;
  exact_velocity: number;
  finished: boolean;
}

export interface Batch { samples: Snapshot[]; state: Snapshot }
export type Command =
  | { id: number; command: 'load'; model?: MotionModel; config: Config | ConstantAccelerationConfig }
  | { id: number; command: 'start' | 'pause' | 'step' };
export interface Update extends Batch {
  id: number;
  phase: 'ready' | 'running' | 'paused' | 'finished';
}
export type Reply = Update | { id: number; error: string };
