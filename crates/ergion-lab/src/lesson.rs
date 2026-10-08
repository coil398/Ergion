//! 単元のページが描く値を返す。
//!
//! 図の値は [`lesson_figure`]、時間とともに進む計算は [`LessonSimulation`] が返す。
//! 式は、それぞれの単元の値を計算する `ergion_core` の関数の rustdoc に書いてある。
//! ここは、その関数を呼んで、ページが描ける形に並べるだけである。

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// 図の一本の線。`role` は線の役割で、`numerical`（数値解の実線）、`exact`（厳密解の破線）、
/// `difference`（誤差の実線）、`reference`（補助の実線）、`muted`（補助の破線）、`vector`（矢印の色）のいずれか。
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct Series {
    pub name: String,
    pub role: String,
    pub x: Vec<f64>,
    pub y: Vec<f64>,
}

/// 図の一点。役割は [`Series`] と同じ。
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct Point {
    pub name: String,
    pub role: String,
    pub x: f64,
    pub y: f64,
}

/// 図の矢印。始点 \((x_1, y_1)\) から終点 \((x_2, y_2)\) へ向かう。
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct Arrow {
    pub name: String,
    pub role: String,
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

/// 一つの図の値。線、点、矢印、塗る多角形、棒、および数の読み出し。
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct Figure {
    pub series: Vec<Series>,
    pub points: Vec<Point>,
    pub arrows: Vec<Arrow>,
    /// 塗る多角形。`x` と `y` は頂点の座標。
    pub polygons: Vec<Series>,
    /// 棒。`x` は区間の左端と右端を交互に並べ、`y` は各棒の高さ。
    pub bars: Vec<Series>,
    pub values: BTreeMap<String, f64>,
    /// 行列やベクトルなど、数の並び。
    pub arrays: BTreeMap<String, Vec<f64>>,
}

impl Figure {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn series(mut self, name: &str, role: &str, x: Vec<f64>, y: Vec<f64>) -> Self {
        self.series.push(Series { name: name.into(), role: role.into(), x, y });
        self
    }

    pub fn point(mut self, name: &str, role: &str, x: f64, y: f64) -> Self {
        self.points.push(Point { name: name.into(), role: role.into(), x, y });
        self
    }

    pub fn arrow(mut self, name: &str, role: &str, from: (f64, f64), to: (f64, f64)) -> Self {
        self.arrows.push(Arrow {
            name: name.into(),
            role: role.into(),
            x1: from.0,
            y1: from.1,
            x2: to.0,
            y2: to.1,
        });
        self
    }

    pub fn polygon(mut self, name: &str, x: Vec<f64>, y: Vec<f64>) -> Self {
        self.polygons.push(Series { name: name.into(), role: "tint".into(), x, y });
        self
    }

    pub fn bars(mut self, name: &str, role: &str, edges: Vec<f64>, heights: Vec<f64>) -> Self {
        self.bars.push(Series { name: name.into(), role: role.into(), x: edges, y: heights });
        self
    }

    pub fn value(mut self, name: &str, value: f64) -> Self {
        self.values.insert(name.into(), value);
        self
    }

    pub fn array(mut self, name: &str, values: Vec<f64>) -> Self {
        self.arrays.insert(name.into(), values);
        self
    }

    /// すべての数が有限であることを確かめる。
    pub fn checked(self) -> Result<Self, String> {
        let finite = |v: &f64| v.is_finite();
        let ok = self.series.iter().chain(&self.polygons).chain(&self.bars).all(|s| {
            s.x.iter().all(finite) && s.y.iter().all(finite)
        }) && self.points.iter().all(|p| p.x.is_finite() && p.y.is_finite())
            && self.arrows.iter().all(|a| [a.x1, a.y1, a.x2, a.y2].iter().all(finite))
            && self.values.values().all(finite)
            && self.arrays.values().all(|a| a.iter().all(finite));
        if ok { Ok(self) } else { Err("values left the finite range".into()) }
    }
}

/// 等間隔の点 \(a, a + h, \ldots, b\)（\(n\) 個、\(h = (b - a)/(n - 1)\)）。
pub fn grid(a: f64, b: f64, n: usize) -> Vec<f64> {
    if n < 2 {
        return vec![a];
    }
    (0..n).map(|i| a + (b - a) * i as f64 / (n - 1) as f64).collect()
}

/// 計算条件から有限な数を読む。ないときは既定値。絶対値は \(10^{12}\) 以下に限る。
pub fn num(params: &Value, name: &str, default: f64) -> Result<f64, String> {
    let value = match params.get(name) {
        None | Some(Value::Null) => default,
        Some(v) => v.as_f64().ok_or_else(|| format!("{name} must be a number"))?,
    };
    if !value.is_finite() || value.abs() > 1e12 {
        return Err(format!("{name} must be finite and in [-1e12, 1e12]"));
    }
    Ok(value)
}

/// 正の数を読む。
pub fn positive(params: &Value, name: &str, default: f64) -> Result<f64, String> {
    let value = num(params, name, default)?;
    if value <= 0.0 {
        return Err(format!("{name} must be positive"));
    }
    Ok(value)
}

/// 範囲 \([1, \mathrm{max}]\) の整数を読む。
pub fn count(params: &Value, name: &str, default: usize, max: usize) -> Result<usize, String> {
    let value = match params.get(name) {
        None | Some(Value::Null) => default as f64,
        Some(v) => v.as_f64().ok_or_else(|| format!("{name} must be a number"))?,
    };
    if !(value >= 1.0 && value <= max as f64 && value.fract() == 0.0) {
        return Err(format!("{name} must be an integer in 1..={max}"));
    }
    Ok(value as usize)
}

/// 文字列を読む。
pub fn text<'a>(params: &'a Value, name: &str, default: &'a str) -> &'a str {
    params.get(name).and_then(Value::as_str).unwrap_or(default)
}

/// `kind` は `科目/単元` の形。科目ごとのモジュールが値を作る。
pub fn figure_for(kind: &str, params: &Value) -> Result<Figure, String> {
    let (subject, unit) = kind.split_once('/').ok_or("kind must be subject/unit")?;
    let figure = match subject {
        "mechanics" => crate::lesson_mechanics::figure(unit, params),
        "calculus" => crate::lesson_calculus::figure(unit, params),
        "ode" => crate::lesson_ode::figure(unit, params),
        "linalg" => crate::lesson_linalg::figure(unit, params),
        "statistics" => crate::lesson_statistics::figure(unit, params),
        "finance" => crate::lesson_finance::figure(unit, params),
        "em" => crate::lesson_em::figure(unit, params),
        "analytical" => crate::lesson_analytical::figure(unit, params),
        "md" => crate::lesson_md::figure(unit, params),
        _ => Err(format!("unknown subject {subject}")),
    }?;
    figure.checked()
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct FigureRequest {
    kind: String,
    #[serde(default)]
    params: Value,
}

/// 単元の図の値を JSON で返す。
///
/// 入力は `{"kind": "科目/単元", "params": {...}}`。出力は [`Figure`] の JSON。
/// ページはこの値をそのまま描き、式を計算し直さない。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub fn lesson_figure(config_json: &str) -> Result<String, String> {
    let request: FigureRequest = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
    let params = if request.params.is_null() { Value::Object(Default::default()) } else { request.params };
    let figure = figure_for(&request.kind, &params)?;
    serde_json::to_string(&figure).map_err(|e| e.to_string())
}

/// 時刻 \(t\) における、ページの計器に出す四つの数。
///
/// `position` と `velocity` は数値計算の値、`exact_position` と `exact_velocity` は同じ時刻の厳密解または参照値。
/// 何を入れるかは単元が決め、ページの計器のラベルがそれを名付ける。
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct ModelState {
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
}

/// 時間とともに進む単元の計算。
pub trait LessonModel {
    /// 時刻 `time` から時間刻み `dt` だけ進める。
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String>;
    /// 時刻 `time` の計器の値。
    fn state(&self, time: f64) -> ModelState;
    /// 時刻 `time` の図。値が要らない単元は `None`。
    fn frame(&self, _time: f64) -> Option<Figure> {
        None
    }
    /// 終了時刻 `final_time` まで計算してよいか。
    fn check_horizon(&self, _final_time: f64) -> Result<(), String> {
        Ok(())
    }
}

/// [`LessonSimulation`] の1時刻の値。`frame` は状態（`snapshot`）と最後の値にだけ付く。
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct LessonSnapshot {
    pub step: u32,
    pub time: f64,
    pub position: f64,
    pub velocity: f64,
    pub exact_position: f64,
    pub exact_velocity: f64,
    pub position_error: f64,
    pub velocity_error: f64,
    pub finished: bool,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub frame: Option<Figure>,
}

#[derive(Serialize)]
struct LessonBatch {
    samples: Vec<LessonSnapshot>,
    state: LessonSnapshot,
}

/// 時間刻みの計算の共通の条件。残りの項目は単元が読む。
#[derive(Deserialize)]
struct LessonHead {
    schema_version: u32,
    kind: String,
    dt: f64,
    steps: u32,
    #[serde(default)]
    t0: f64,
}

/// 数値解法の名前。`euler`、`midpoint`、`rk4` のいずれか。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Method {
    Euler,
    Midpoint,
    Rk4,
}

impl Method {
    pub fn read(params: &Value, default: Method) -> Result<Method, String> {
        match params.get("method").and_then(Value::as_str) {
            None => Ok(default),
            Some("euler") => Ok(Method::Euler),
            Some("midpoint") => Ok(Method::Midpoint),
            Some("rk4") => Ok(Method::Rk4),
            Some(other) => Err(format!("unknown method {other}")),
        }
    }

    /// 選んだ方法で \(\mathbf{y}' = f(t, \mathbf{y})\) を1ステップ進める。
    /// 1ステップは [`ergion_core::euler_step`]、[`ergion_core::midpoint_step`]、[`ergion_core::rk4_step`] である。
    pub fn step(self, state: &mut [f64], time: f64, dt: f64, derivative: impl Fn(f64, &[f64], &mut [f64])) {
        match self {
            Method::Euler => ergion_core::euler_step(state, time, dt, derivative),
            Method::Midpoint => ergion_core::midpoint_step(state, time, dt, derivative),
            Method::Rk4 => ergion_core::rk4_step(state, time, dt, derivative),
        }
    }
}

fn model_for(kind: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    let (subject, unit) = kind.split_once('/').ok_or("kind must be subject/unit")?;
    match subject {
        "mechanics" => crate::lesson_mechanics::model(unit, config, dt),
        "calculus" => crate::lesson_calculus::model(unit, config, dt),
        "ode" => crate::lesson_ode::model(unit, config, dt),
        "linalg" => crate::lesson_linalg::model(unit, config, dt),
        "statistics" => crate::lesson_statistics::model(unit, config, dt),
        "finance" => crate::lesson_finance::model(unit, config, dt),
        "em" => crate::lesson_em::model(unit, config, dt),
        "analytical" => crate::lesson_analytical::model(unit, config, dt),
        "md" => crate::lesson_md::model(unit, config, dt),
        _ => Err(format!("unknown subject {subject}")),
    }
}

/// 単元の計算を、時間刻みごとに進める。再生、一時停止、1ステップ、計算時間を延ばす操作が呼ぶ。
///
/// 計算条件の JSON は `schema_version`、`kind`（`科目/単元`）、`dt`、`steps`、`t0`（既定 0）と、
/// 単元が読む項目を持つ。数値解法のタブがある単元は `method` も読む。
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct LessonSimulation {
    model: Box<dyn LessonModel>,
    t0: f64,
    dt: f64,
    steps: u32,
    step: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl LessonSimulation {
    /// 計算条件の JSON から初期状態を作る。
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new(config_json: &str) -> Result<LessonSimulation, String> {
        let config: Value = serde_json::from_str(config_json).map_err(|e| e.to_string())?;
        let head: LessonHead = serde_json::from_value(config.clone()).map_err(|e| e.to_string())?;
        if head.schema_version != 1 {
            return Err("schema_version must be 1".into());
        }
        if !head.dt.is_finite() || head.dt <= 0.0 || head.dt > 1e12 {
            return Err("dt must be finite and in (0, 1e12]".into());
        }
        if !(1..=1_000_000).contains(&head.steps) {
            return Err("steps must be in 1..=1000000".into());
        }
        if !head.t0.is_finite() || head.t0.abs() > 1e12 {
            return Err("t0 must be finite and in [-1e12, 1e12]".into());
        }
        let model = model_for(&head.kind, &config, head.dt)?;
        let final_time = head.t0 + head.dt * f64::from(head.steps);
        model.check_horizon(final_time)?;
        Ok(Self { model, t0: head.t0, dt: head.dt, steps: head.steps, step: 0 })
    }

    /// 現在の状態を JSON で返す。図の値 `frame` を含む。
    pub fn snapshot(&self) -> Result<String, String> {
        serde_json::to_string(&self.state(true)).map_err(|e| e.to_string())
    }

    /// 指定したステップ数だけ進める。1回の呼び出しは 1 から 500 ステップまで。
    pub fn advance(&mut self, steps: u32) -> Result<String, String> {
        if !(1..=500).contains(&steps) {
            return Err("batch steps must be in 1..=500".into());
        }
        let count = steps.min(self.steps - self.step);
        let mut samples = Vec::with_capacity(count as usize);
        for _ in 0..count {
            let time = self.time();
            self.model.step(time, self.dt)?;
            self.step += 1;
            samples.push(self.state(false));
        }
        serde_json::to_string(&LessonBatch { samples, state: self.state(true) }).map_err(|e| e.to_string())
    }

    /// 終了時刻を延ばす。初期条件と、いまの状態は変えない。
    pub fn extend(&mut self, additional_steps: u32) -> Result<String, String> {
        let steps = crate::additional_steps(self.steps, additional_steps)?;
        self.model.check_horizon(self.t0 + self.dt * f64::from(steps))?;
        self.steps = steps;
        self.snapshot()
    }
}

impl LessonSimulation {
    fn time(&self) -> f64 {
        self.t0 + f64::from(self.step) * self.dt
    }

    fn state(&self, with_frame: bool) -> LessonSnapshot {
        let time = self.time();
        let s = self.model.state(time);
        LessonSnapshot {
            step: self.step,
            time,
            position: s.position,
            velocity: s.velocity,
            exact_position: s.exact_position,
            exact_velocity: s.exact_velocity,
            position_error: s.position - s.exact_position,
            velocity_error: s.velocity - s.exact_velocity,
            finished: self.step == self.steps,
            frame: if with_frame { self.model.frame(time) } else { None },
        }
    }

    /// 終わりまで進めた状態を返す。テストと CLI が使う。
    pub fn run_to_end(&mut self) -> Result<LessonSnapshot, String> {
        while self.step < self.steps {
            self.advance(500)?;
        }
        Ok(self.state(true))
    }
}
