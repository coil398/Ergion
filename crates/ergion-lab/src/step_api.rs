//! ページが読む WASM から、ergion-core の1ステップをそのまま呼ぶ。

use std::cell::RefCell;

use js_sys::{Array, Float64Array, Function};
use wasm_bindgen::prelude::*;

macro_rules! apply {
    ($state:expr, $time:expr, $dt:expr, $derivative:expr, $step:path) => {{
        let error = RefCell::new(None);
        {
            let call = |time: f64, state: &[f64], slope: &mut [f64]| {
                if error.borrow().is_some() {
                    return;
                }
                if let Err(err) = write_slope($derivative, time, state, slope) {
                    *error.borrow_mut() = Some(err);
                }
            };
            $step($state, $time, $dt, &call);
        }
        match error.into_inner() {
            Some(err) => Err(err),
            None => Ok(()),
        }
    }};
}

/// [`ergion_core::euler_step`] を1回呼ぶ。
///
/// `derivative` は時刻と状態を受け取り、右辺の値を返す。成分が一つのときは数、複数のときはその個数の配列である。
#[wasm_bindgen]
pub fn euler_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: &Function,
) -> Result<(), JsValue> {
    apply!(state, time, dt, derivative, ergion_core::euler_step)
}

/// [`ergion_core::midpoint_step`] を1回呼ぶ。
///
/// `derivative` の約束は [`euler_step`] と同じである。
#[wasm_bindgen]
pub fn midpoint_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: &Function,
) -> Result<(), JsValue> {
    apply!(state, time, dt, derivative, ergion_core::midpoint_step)
}

/// [`ergion_core::rk4_step`] を1回呼ぶ。
///
/// `derivative` の約束は [`euler_step`] と同じである。
#[wasm_bindgen]
pub fn rk4_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: &Function,
) -> Result<(), JsValue> {
    apply!(state, time, dt, derivative, ergion_core::rk4_step)
}

/// [`ergion_core::newton_step`] を1回呼ぶ。
///
/// `value` は \(f(x)\)、`derivative` は \(f'(x)\) を数で返す。
#[wasm_bindgen]
pub fn newton_step(x: f64, value: &Function, derivative: &Function) -> Result<f64, JsValue> {
    let error = RefCell::new(None);
    let result = {
        let scalar = |fun: &Function, x: f64| -> f64 {
            if error.borrow().is_some() {
                return f64::NAN;
            }
            match fun.call1(&JsValue::UNDEFINED, &JsValue::from(x)) {
                Ok(out) => match out.as_f64() {
                    Some(number) if number.is_finite() => number,
                    _ => {
                        *error.borrow_mut() =
                            Some(JsValue::from_str("関数値は有限な数で返します。"));
                        f64::NAN
                    }
                },
                Err(err) => {
                    *error.borrow_mut() = Some(err);
                    f64::NAN
                }
            }
        };
        ergion_core::newton_step(x, |x| scalar(value, x), |x| scalar(derivative, x))
    };
    match error.into_inner() {
        Some(err) => Err(err),
        None => Ok(result),
    }
}

fn write_slope(
    derivative: &Function,
    time: f64,
    state: &[f64],
    slope: &mut [f64],
) -> Result<(), JsValue> {
    let state_js = Float64Array::new_with_length(state.len() as u32);
    state_js.copy_from(state);
    let value = derivative.call2(&JsValue::UNDEFINED, &JsValue::from(time), &state_js)?;
    if let Some(number) = value.as_f64() {
        if slope.len() != 1 {
            return Err(JsValue::from_str("成分が一つのとき、右辺は数で返します。"));
        }
        if !number.is_finite() {
            return Err(JsValue::from_str("右辺は有限な数で返します。"));
        }
        slope[0] = number;
        return Ok(());
    }
    if !Array::is_array(&value) {
        return Err(JsValue::from_str("右辺は数で返します。"));
    }
    let array = Array::from(&value);
    if array.length() as usize != slope.len() {
        return Err(JsValue::from_str("右辺の成分数は状態と揃えます。"));
    }
    for (index, slot) in slope.iter_mut().enumerate() {
        let Some(number) = array.get(index as u32).as_f64() else {
            return Err(JsValue::from_str("右辺は有限な数で返します。"));
        };
        if !number.is_finite() {
            return Err(JsValue::from_str("右辺は有限な数で返します。"));
        }
        *slot = number;
    }
    Ok(())
}
