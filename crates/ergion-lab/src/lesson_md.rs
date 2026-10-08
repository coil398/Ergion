//! 単元の値。式は ergion-core の各関数の rustdoc にある。

use serde_json::Value;

use crate::lesson::{Figure, LessonModel};

/// この科目の単元の図。
pub fn figure(unit: &str, _params: &Value) -> Result<Figure, String> {
    Err(format!("unknown unit {unit}"))
}

/// この科目の単元の時間発展。
pub fn model(unit: &str, _config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    Err(format!("unknown unit {unit}"))
}
