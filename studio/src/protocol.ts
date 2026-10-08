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

export interface SeparationConfig {
  schema_version: 1;
  initial_position: number;
  k: number;
  dt: number;
  steps: number;
}

export interface LinearConfig {
  schema_version: 1;
  initial_position: number;
  p: number;
  q: number;
  dt: number;
  steps: number;
}

export type TextbookKind =
  | 'homogeneous'
  | 'exact'
  | 'bernoulli'
  | 'two-real'
  | 'undetermined'
  | 'variation'
  | 'laplace'
  | 'series'
  | 'system';

export interface TextbookConfig {
  schema_version: 1;
  kind: TextbookKind;
  t0: number;
  dt: number;
  steps: number;
}

export type CompareKind =
  | 'uniform'
  | 'derivative'
  | 'accelerated'
  | 'separation'
  | 'linear'
  | TextbookKind;

export interface CompareConfig {
  schema_version: 1;
  kind: CompareKind;
  t0: number;
  dt: number;
  steps: number;
  initial_position?: number;
  initial_velocity?: number;
  velocity?: number;
  acceleration?: number;
  k?: number;
  p?: number;
  q?: number;
}

export interface NewtonConfig {
  schema_version: 1;
  steps: number;
}

export type MotionModel = 'uniform' | 'constant-acceleration' | 'position-derivative' | 'euler' | 'separation' | 'linear' | 'textbook' | 'compare' | 'newton' | 'lesson';

/** ライブラリの関数 lesson_figure と LessonSimulation が返す図の値。ページはこれをそのまま描く。 */
export interface FigureSeries { name: string; role: string; x: number[]; y: number[] }
export interface FigurePoint { name: string; role: string; x: number; y: number }
export interface FigureArrow { name: string; role: string; x1: number; y1: number; x2: number; y2: number }
export interface LessonFigure {
  series: FigureSeries[];
  points: FigurePoint[];
  arrows: FigureArrow[];
  polygons: FigureSeries[];
  bars: FigureSeries[];
  values: Record<string, number>;
  arrays: Record<string, number[]>;
}

/** LessonSimulation の計算条件。kind は「科目/単元」。残りの項目は単元が読む。 */
export interface LessonConfig {
  schema_version: 1;
  kind: string;
  dt: number;
  steps: number;
  [name: string]: number | string;
}

export type StepMethod = 'euler' | 'midpoint' | 'rk4';

export interface Snapshot {
  step: number;
  time: number;
  position: number;
  velocity: number;
  exact_position: number;
  exact_velocity: number;
  position_error?: number;
  velocity_error?: number;
  finished: boolean;
  frame?: LessonFigure;
}

export interface Batch { samples: Snapshot[]; state: Snapshot }
export type Command =
  | { id: number; command: 'load'; model?: MotionModel; method?: string; config: Config | ConstantAccelerationConfig | SeparationConfig | LinearConfig | TextbookConfig | CompareConfig | NewtonConfig | LessonConfig }
  | { id: number; command: 'start' | 'pause' | 'step' }
  | { id: number; command: 'extend'; steps: number };
export interface Update extends Batch {
  id: number;
  phase: 'ready' | 'running' | 'paused' | 'finished';
  extended?: number;
}
export type Reply = Update | { id: number; error: string };
