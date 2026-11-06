//! ergion-core の1ステップを Python から呼ぶ。

use std::cell::RefCell;

use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyList;

macro_rules! advance {
    ($py:expr, $state:expr, $time:expr, $dt:expr, $derivative:expr, $step:path) => {{
        let mut values: Vec<f64> = $state.extract()?;
        let error: RefCell<Option<PyErr>> = RefCell::new(None);
        {
            let call = |time: f64, state: &[f64], slope: &mut [f64]| {
                if error.borrow().is_some() {
                    return;
                }
                let result = (|| -> PyResult<()> {
                    let y_list = PyList::new($py, state)?;
                    let returned = $derivative.call1((time, y_list))?;
                    fill_slope(&returned, slope)
                })();
                if let Err(err) = result {
                    *error.borrow_mut() = Some(err);
                }
            };
            $step(&mut values, $time, $dt, &call);
        }
        if let Some(err) = error.into_inner() {
            return Err(err);
        }
        for (index, value) in values.iter().enumerate() {
            $state.set_item(index, value)?;
        }
        Ok(())
    }};
}

/// [`ergion_core::euler_step`] を1回呼ぶ。
///
/// `derivative` は時刻と状態を受け取り、右辺の値を返す。成分が一つのときは数、複数のときはその個数の列である。
/// 状態のリストは、進んだ値に置き換わる。
#[pyfunction]
fn euler_step(
    py: Python<'_>,
    state: &Bound<'_, PyList>,
    time: f64,
    dt: f64,
    derivative: &Bound<'_, PyAny>,
) -> PyResult<()> {
    advance!(py, state, time, dt, derivative, ergion_core::euler_step)
}

/// [`ergion_core::midpoint_step`] を1回呼ぶ。
///
/// `derivative` の約束は [`euler_step`] と同じである。
#[pyfunction]
fn midpoint_step(
    py: Python<'_>,
    state: &Bound<'_, PyList>,
    time: f64,
    dt: f64,
    derivative: &Bound<'_, PyAny>,
) -> PyResult<()> {
    advance!(py, state, time, dt, derivative, ergion_core::midpoint_step)
}

/// [`ergion_core::rk4_step`] を1回呼ぶ。
///
/// `derivative` の約束は [`euler_step`] と同じである。
#[pyfunction]
fn rk4_step(
    py: Python<'_>,
    state: &Bound<'_, PyList>,
    time: f64,
    dt: f64,
    derivative: &Bound<'_, PyAny>,
) -> PyResult<()> {
    advance!(py, state, time, dt, derivative, ergion_core::rk4_step)
}

/// [`ergion_core::newton_step`] を1回呼ぶ。
///
/// `value` は \(f(x)\)、`derivative` は \(f'(x)\) を数で返す。
#[pyfunction]
fn newton_step(x: f64, value: &Bound<'_, PyAny>, derivative: &Bound<'_, PyAny>) -> PyResult<f64> {
    let error: RefCell<Option<PyErr>> = RefCell::new(None);
    let result = {
        let scalar = |fun: &Bound<'_, PyAny>, x: f64| -> f64 {
            if error.borrow().is_some() {
                return f64::NAN;
            }
            match fun.call1((x,)).and_then(|out| finite_number(&out)) {
                Ok(number) => number,
                Err(err) => {
                    *error.borrow_mut() = Some(err);
                    f64::NAN
                }
            }
        };
        ergion_core::newton_step(x, |x| scalar(value, x), |x| scalar(derivative, x))
    };
    if let Some(err) = error.into_inner() {
        return Err(err);
    }
    Ok(result)
}

fn fill_slope(value: &Bound<'_, PyAny>, slope: &mut [f64]) -> PyResult<()> {
    if let Ok(number) = value.extract::<f64>() {
        if slope.len() != 1 {
            return Err(PyValueError::new_err(
                "成分が一つのとき、右辺は数で返します。",
            ));
        }
        if !number.is_finite() {
            return Err(PyValueError::new_err("右辺は有限な数で返します。"));
        }
        slope[0] = number;
        return Ok(());
    }
    let values: Vec<f64> = value.extract()?;
    if values.len() != slope.len() {
        return Err(PyValueError::new_err("右辺の成分数は状態と揃えます。"));
    }
    if values.iter().any(|number| !number.is_finite()) {
        return Err(PyValueError::new_err("右辺は有限な数で返します。"));
    }
    slope.copy_from_slice(&values);
    Ok(())
}

fn finite_number(value: &Bound<'_, PyAny>) -> PyResult<f64> {
    let number: f64 = value.extract()?;
    if !number.is_finite() {
        return Err(PyValueError::new_err("関数値は有限な数で返します。"));
    }
    Ok(number)
}

#[pymodule]
fn ergion(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(euler_step, m)?)?;
    m.add_function(wrap_pyfunction!(midpoint_step, m)?)?;
    m.add_function(wrap_pyfunction!(rk4_step, m)?)?;
    m.add_function(wrap_pyfunction!(newton_step, m)?)?;
    Ok(())
}
