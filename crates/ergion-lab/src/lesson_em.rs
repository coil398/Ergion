//! 電磁気学の単元の値。式は `ergion_core::electromagnetism` の各関数の rustdoc にある。

use serde_json::Value;

use crate::lesson::{Figure, LessonModel};

fn unknown<T>(result: &Result<T, String>) -> bool {
    matches!(result, Err(message) if message.starts_with("unknown unit"))
}

/// 電磁気学の単元の図。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    let first = crate::lesson_em_a::figure(unit, params);
    if unknown(&first) { crate::lesson_em_b::figure(unit, params) } else { first }
}

/// 電磁気学の単元の時間発展。
pub fn model(unit: &str, config: &Value, dt: f64) -> Result<Box<dyn LessonModel>, String> {
    let first = crate::lesson_em_a::model(unit, config, dt);
    if unknown(&first) { crate::lesson_em_b::model(unit, config, dt) } else { first }
}
