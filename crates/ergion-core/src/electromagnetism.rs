//! 電磁気学の単元の式と計算。各関数の rustdoc に式を書く。

mod dynamics;
mod statics;

#[allow(unused_imports)]
pub use dynamics::*;
#[allow(unused_imports)]
pub use statics::*;
