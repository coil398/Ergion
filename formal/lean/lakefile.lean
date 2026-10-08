import Lake
open Lake DSL

package «ergion» where

@[default_target]
lean_lib Ergion where
  roots := #[`Ergion.ConstantVelocity]
