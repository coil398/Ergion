//! Domain-independent, double-precision time integration.

/// 微分方程式 \(x' = f(x, t)\) を、古典的な4次の Runge–Kutta 法で1ステップ進める。
///
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\)、時間刻みを \(\Delta t\) とします。
/// 四つの傾きは、始点、中点を二度、終点で右辺を評価したものです。
/// \[
/// \begin{align*}
/// k_1 &= f(x_n, t_n), \\
/// k_2 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_1,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// k_3 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_2,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// k_4 &= f(x_n + \Delta t\, k_3,\ t_n + \Delta t).
/// \end{align*}
/// \]
/// 位置は次の式で進みます。
/// \[
/// x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)
/// \]
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、四つの傾きは同じ値です。
/// そのときこの式は \(x_n + \Delta t\, f\) と一致し、区間の積分と同じ厳密な増分です。
/// 打ち切り誤差はありません。数値との差は、倍精度浮動小数点の丸めだけです。
/// 右辺が区間の途中で変わるときは、この1ステップは近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn rk4_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut k1 = vec![0.0; state.len()];
    let mut k2 = k1.clone();
    let mut k3 = k1.clone();
    let mut k4 = k1.clone();
    let mut stage = k1.clone();
    derivative(time, state, &mut k1);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * 0.5 * k1[i];
    }
    derivative(time + dt * 0.5, &stage, &mut k2);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * 0.5 * k2[i];
    }
    derivative(time + dt * 0.5, &stage, &mut k3);
    for i in 0..state.len() {
        stage[i] = state[i] + dt * k3[i];
    }
    derivative(time + dt, &stage, &mut k4);
    for i in 0..state.len() {
        state[i] += dt / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
    }
}

/// 微分方程式 \(x' = f(x, t)\) を、Euler 法で時間刻み \(\Delta t\) の1ステップだけ進める。
///
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\) とします。
/// \(\Delta t\) はこの1ステップの時間刻みです。
/// Euler 法は、右辺を区間 \([t_n, t_n + \Delta t]\) の始点の値で一定とみなし、
/// \[
/// x_{n+1} = x_n + \Delta t \, f(x_n, t_n)
/// \]
/// と進めます。
///
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、この式は、その区間で微分方程式を積分した結果と一致します。
/// その1ステップは厳密です。打ち切り誤差はありません。
/// 数値と厳密な増分との差は、倍精度浮動小数点の丸めだけです。
/// \(x' = v\) で速度 \(v\) が一定のときは \(f(x_n, t_n) = v\) なので、
/// \[
/// x_{n+1} = x_n + v \Delta t
/// \]
/// となり、[`x_prime_eq_v_step`] と同じ更新です。
///
/// 右辺が区間の途中で変わるときは、始点の値だけで区間全体を置き換える近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn euler_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut slope = vec![0.0; state.len()];
    derivative(time, state, &mut slope);
    assert_eq!(slope.len(), state.len());
    for i in 0..state.len() {
        state[i] += dt * slope[i];
    }
}

/// 微分方程式 \(x' = f(x, t)\) を、中点法で時間刻み \(\Delta t\) の1ステップだけ進める。
///
/// 中点法は、2次の Runge–Kutta 法です。
/// \(x\) は未知関数、\(t\) は独立変数、\(f(x, t)\) は右辺です。
/// ステップ \(n\) の値を \(x_n\)、その時刻を \(t_n\) とします。
/// \(\Delta t\) はこの1ステップの時間刻みです。
/// まず始点の傾きを求め、その傾きで区間の中点まで仮に進んだ位置の傾きを使います。
/// \[
/// \begin{align*}
/// k_1 &= f(x_n, t_n), \\
/// k_2 &= f\!\left(x_n + \tfrac{1}{2}\Delta t\, k_1,\ t_n + \tfrac{1}{2}\Delta t\right), \\
/// x_{n+1} &= x_n + \Delta t\, k_2.
/// \end{align*}
/// \]
/// 右辺 \(f\) が \(x\) にも \(t\) にもよらず一定ならば、\(k_1 = k_2 = f\) です。
/// そのときこの式は \(x_n + \Delta t\, f\) と一致し、[`euler_step`] および区間の積分と同じ厳密な増分です。
/// 打ち切り誤差はありません。数値との差は、倍精度浮動小数点の丸めだけです。
/// 右辺が区間の途中で変わるときは、中点の傾きで区間全体を置き換える近似です。
///
/// `derivative` は、時刻と状態を受け取り、右辺の各成分を出力へ書き込みます。
/// 出力の成分数は状態と同じでなければなりません。
pub fn midpoint_step(
    state: &mut [f64],
    time: f64,
    dt: f64,
    derivative: impl Fn(f64, &[f64], &mut [f64]),
) {
    let mut k1 = vec![0.0; state.len()];
    let mut k2 = vec![0.0; state.len()];
    let mut stage = vec![0.0; state.len()];
    derivative(time, state, &mut k1);
    assert_eq!(k1.len(), state.len());
    for i in 0..state.len() {
        stage[i] = state[i] + 0.5 * dt * k1[i];
    }
    derivative(time + 0.5 * dt, &stage, &mut k2);
    assert_eq!(k2.len(), state.len());
    for i in 0..state.len() {
        state[i] += dt * k2[i];
    }
}

/// 方程式 \(f(x) = 0\) を、接線で 1 回更新する。
///
/// \(f\) は微分できる実関数、\(x\) は未知数です。
/// \(n\) は反復の番号、\(x_n\) は \(n\) 回目の近似、\(x_0\) は出発点です。
/// \(f'(x_n)\) は \(x_n\) における導関数です。
/// 点 \((x_n, f(x_n))\) における接線は
/// \[
/// y = f(x_n) + f'(x_n)(x - x_n)
/// \]
/// です。次の近似 \(x_{n+1}\) は、この接線が \(y = 0\) と交わる点です。
/// \[
/// 0 = f(x_n) + f'(x_n)(x_{n+1} - x_n).
/// \]
/// \(f'(x_n) \neq 0\) ならば、交点は次の式になります。
/// \[
/// x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.
/// \]
/// これは微分方程式を時刻で進める1ステップではありません。
///
/// 例として \(f(x) = x^2 - 2\)、\(f'(x) = 2x\)、\(x_0 = 1\) をとると、
/// 第1回は \(x_1 = 3/2\)、第2回は \(x_2 = 17/12\) です。
/// \(f(\sqrt{2}) = 0\) であり、正の出発点から始めると以後の近似も正です。
/// 列の極限は正の根 \(\sqrt{2}\) です。
///
/// `value` は \(f(x_n)\)、`derivative` は \(f'(x_n)\) を返します。
pub fn newton_step(x: f64, value: impl Fn(f64) -> f64, derivative: impl Fn(f64) -> f64) -> f64 {
    let slope = derivative(x);
    x - value(x) / slope
}

/// 微分方程式 \(x' = v\) を、時間刻み \(\Delta t\) で1ステップ進める。
///
/// \(x\) は直線上の位置、\(v\) は速度、\(t\) は時刻です。
/// \(\Delta t\) はこの1ステップの時間刻み、\(x_n\) はステップ \(n\) の位置です。
/// この刻みのあいだ速度 \(v\) が一定ならば、\(x' = v\) を区間 \([t_n, t_n + \Delta t]\) で積分して
/// \[
/// x_{n+1} = x_n + v \Delta t
/// \]
/// を得ます。右辺は、速度が区間内で一定であるときの厳密な増分です。
/// 打ち切り誤差はありません。数値とこの式との差は、倍精度浮動小数点の丸めだけです。
/// この更新は、右辺が一定の速度であるときの [`euler_step`] です。
/// 速度が区間の途中で変わる運動は、この関数では扱いません。
///
/// `position` と `velocity` の成分数は同じでなければなりません。
pub fn x_prime_eq_v_step(position: &mut [f64], velocity: &[f64], dt: f64) {
    assert_eq!(position.len(), velocity.len());
    euler_step(position, 0.0, dt, |_time, _state, slope| {
        slope.copy_from_slice(velocity);
    });
}

/// Advances a separable system with position-dependent acceleration.
/// Panics if the position and velocity dimensions differ.
///
/// The position update is one step of \(x' = v\), taken by [`x_prime_eq_v_step`]
/// at the half-step velocity.
pub fn velocity_verlet_step(
    position: &mut [f64],
    velocity: &mut [f64],
    dt: f64,
    acceleration: impl Fn(&[f64], &mut [f64]),
) {
    assert_eq!(position.len(), velocity.len());
    let mut a = vec![0.0; position.len()];
    acceleration(position, &mut a);
    for i in 0..position.len() {
        velocity[i] += 0.5 * dt * a[i];
    }
    x_prime_eq_v_step(position, velocity, dt);
    acceleration(position, &mut a);
    for i in 0..position.len() {
        velocity[i] += 0.5 * dt * a[i];
    }
}

/// 変数分離で解く \(x' = kx\) の厳密解 \(x(t) = x_0 e^{kt}\) を返します。
///
/// \(k\) は時刻にも位置にもよらない定数です。初期位置を \(x(0) = x_0\) とします。
/// まず \(x \neq 0\) と仮定し、両辺を \(x\) で割って変数を分けます。
/// \[
/// \frac{dx}{x} = k\,dt
/// \]
/// 両辺を積分すると \(\ln|x| = kt + C\) です。\(C\) は積分定数です。
/// 指数関数に戻すと \(|x| = e^{C} e^{kt}\) です。
/// \(e^{C}\) は正なので、符号を含めた 0 でない定数を \(A = \pm e^{C}\) と書くと
/// \(x = A e^{kt}\) です。\(t = 0\) で \(A = x_0\) となり、
/// \[
/// x(t) = x_0 e^{kt}
/// \]
/// を得ます。\(x(t)\) は時刻 \(t\) の位置、\(t\) は時刻、\(x_0\) は時刻 0 の位置、
/// \(k\) は定数係数、\(e\) は自然対数の底です。
///
/// 定数関数 \(x(t) = 0\) も方程式を満たします。変数分離では \(x\) で割るため、
/// この解は積分の外にあります。\(x_0 = 0\) を公式へ入れると 0 になり、この定数解を含みます。
/// \(x_0 = 0\) のときは、指数が無限大でも 0 を返します。
///
/// この値は、級数にも時間刻みにもよらない厳密解です。打ち切り誤差はありません。
/// 数値との差は、倍精度の指数関数の丸めだけです。\(k\) が正でも負でも同じ式です。
pub fn separated_exponential(x0: f64, k: f64, t: f64) -> f64 {
    if x0 == 0.0 {
        return 0.0;
    }
    x0 * (k * t).exp()
}

/// 定数係数の1階線形方程式 \(x' + px = q\) の厳密解を返します。
///
/// \(p\) と \(q\) は定数で、\(p \neq 0\) とします。\(p = 0\) の方程式は \(x' = q\) であり、
/// 右辺が定数の積分です。この関数はその場合を扱いません。
/// 初期位置を \(x(0) = x_0\) とします。積分因子 \(e^{pt}\) を両辺に掛けると
/// \[
/// \frac{d}{dt}\bigl(x e^{pt}\bigr) = q e^{pt}
/// \]
/// です。\(p \neq 0\) として積分し、\(e^{pt} \neq 0\) で割ると
/// \(x = q/p + C e^{-pt}\) です。\(C\) は積分定数です。
/// \(t = 0\) から \(C = x_0 - q/p\) となり、
/// \[
/// x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}
/// \]
/// を得ます。\(x(t)\) は時刻 \(t\) の位置、\(t\) は時刻、\(x_0\) は時刻 0 の位置、
/// \(p\) は未知関数の係数、\(q\) は右辺の定数、\(e\) は自然対数の底です。
///
/// この値は、級数にも時間刻みにもよらない厳密解です。打ち切り誤差はありません。
/// 数値との差は、倍精度の除算と指数関数の丸めだけです。
pub fn first_order_linear(x0: f64, p: f64, q: f64, t: f64) -> f64 {
    let particular = q / p;
    particular + (x0 - particular) * (-p * t).exp()
}

/// 同次形 \(x' = 1 + x/t\) の厳密解を返します。
///
/// 右辺は比 \(u = x/t\) だけの関数です。\(t > 0\) とします。
/// \(x = ut\) を微分して代入すると \(u' = 1/t\) です。
/// 積分して \(u = \ln t + C\)、したがって
/// \[
/// x(t) = t(\ln t + C)
/// \]
/// です。\(C\) は積分定数で、\(x(1) = C\) です。
/// \(x(t)\) は時刻 \(t\) の位置、\(t\) は時刻、\(\ln\) は自然対数です。
/// この値は打ち切りのない厳密解です。
pub fn homogeneous_ratio(c: f64, t: f64) -> f64 {
    t * (c + t.ln())
}

/// 完全微分 \((2x + y)\,dx + (x + 2y)\,dy = 0\) の、\(y = t\) における陽な厳密解を返します。
///
/// \(M = 2x + y\)、\(N = x + 2y\) とすると \(\partial M/\partial y = \partial N/\partial x = 1\) で、方程式は完全です。
/// ポテンシャルは \(x^2 + xy + y^2 = C\) です。\(C = 1\) の枝のうち、\(t = 0\) で \(x = 1\) となるものは
/// \[
/// x(t) = \frac{-t + \sqrt{4 - 3t^2}}{2}
/// \]
/// です。\(4 - 3t^2 \ge 0\) の範囲で使います。この値は厳密解です。
pub fn exact_quadratic(t: f64) -> f64 {
    let discriminant = 4.0 - 3.0 * t * t;
    (-t + discriminant.sqrt()) / 2.0
}

/// ベルヌーイ方程式 \(x' - x = -x^2\) の厳密解を返します。
///
/// \(n = 2\) なので \(n \neq 0, 1\) です。\(x_0 = x(0) \neq 0\) として \(u = 1/x\) と置くと、
/// \(u' + u = 1\) になります。積分因子 \(e^{t}\) で解くと
/// \[
/// x(t) = \frac{1}{1 + (1/x_0 - 1)e^{-t}}
/// \]
/// です。\(x(t)\) は時刻 \(t\) の位置、\(x_0\) は時刻 0 の位置、\(e\) は自然対数の底です。
/// この値は打ち切りのない厳密解です。
pub fn bernoulli_logistic(x0: f64, t: f64) -> f64 {
    1.0 / (1.0 + (1.0 / x0 - 1.0) * (-t).exp())
}

/// \(x'' - 3x' + 2x = 0\)、\(x(0) = 1\)、\(x'(0) = 3\) の厳密解を返します。
///
/// 特性方程式 \((r - 1)(r - 2) = 0\) の根は相異なる実数 \(1\) と \(2\) です。
/// 一般解は \(A e^{t} + B e^{2t}\) です。初期条件から \(A = -1\)、\(B = 2\) となり、
/// \[
/// x(t) = -e^{t} + 2e^{2t}
/// \]
/// です。この値は打ち切りのない厳密解です。
pub fn characteristic_two_real(t: f64) -> f64 {
    -t.exp() + 2.0 * (2.0 * t).exp()
}

/// [`characteristic_two_real`] の導関数です。これも厳密です。
pub fn characteristic_two_real_prime(t: f64) -> f64 {
    -t.exp() + 4.0 * (2.0 * t).exp()
}

/// \(x'' - 2x' + x = 0\)、\(x(0) = 1\)、\(x'(0) = 0\) の厳密解を返します。
///
/// 特性根は \(r = 1\) の重根です。一般解は \((A + Bt)e^{t}\) です。
/// 初期条件から
/// \[
/// x(t) = (1 - t)e^{t}
/// \]
/// です。この値は打ち切りのない厳密解です。
pub fn characteristic_repeated(t: f64) -> f64 {
    (1.0 - t) * t.exp()
}

/// \(x'' + x = 0\)、\(x(0) = 1\)、\(x'(0) = 0\) の厳密解を返します。
///
/// 特性根は \(\pm i\) です。一般解は \(A\cos t + B\sin t\) です。
/// 初期条件から
/// \[
/// x(t) = \cos t
/// \]
/// です。この値は打ち切りのない厳密解です。
pub fn characteristic_complex(t: f64) -> f64 {
    t.cos()
}

/// \(x'' - 3x' + 2x = e^{3t}\)、\(x(0) = x'(0) = 0\) の厳密解を返します。
///
/// 同次解は \(A e^{t} + B e^{2t}\) です。\(3\) は特性根ではないので、特殊解を \(K e^{3t}\) と置くと \(K = 1/2\) です。
/// 初期条件から
/// \[
/// x(t) = \frac{1}{2}e^{t} - e^{2t} + \frac{1}{2}e^{3t}
/// \]
/// です。この値は未定係数法で得た厳密解です。
pub fn undetermined_coefficient(t: f64) -> f64 {
    0.5 * t.exp() - (2.0 * t).exp() + 0.5 * (3.0 * t).exp()
}

/// [`undetermined_coefficient`] の導関数です。これも厳密です。
pub fn undetermined_coefficient_prime(t: f64) -> f64 {
    0.5 * t.exp() - 2.0 * (2.0 * t).exp() + 1.5 * (3.0 * t).exp()
}

/// \(x'' + x = \tan t\)、\(x(0) = x'(0) = 0\) の厳密解を返します。
///
/// 区間は \((-\pi/2, \pi/2)\) です。\(\tan t\) は多項式でも指数でもないので、未定係数法の基本形では表せません。
/// 基本解 \(\cos t\)、\(\sin t\) の定数変化から
/// \[
/// x(t) = \sin t - \cos t \cdot \ln|\sec t + \tan t|
/// \]
/// です。この値は打ち切りのない厳密解です。
pub fn variation_of_parameters(t: f64) -> f64 {
    let sine = t.sin();
    let cosine = t.cos();
    let sec_plus_tan = (1.0 + sine) / cosine;
    sine - cosine * sec_plus_tan.abs().ln()
}

/// [`variation_of_parameters`] の導関数です。これも厳密です。
pub fn variation_of_parameters_prime(t: f64) -> f64 {
    let sine = t.sin();
    let cosine = t.cos();
    let sec_plus_tan = (1.0 + sine) / cosine;
    cosine + sine * sec_plus_tan.abs().ln() - 1.0
}

/// Laplace 変換で解く初期値問題 \(x'' - 3x' + 2x = e^{3t}\)、\(x(0) = x'(0) = 0\) の厳密解です。
///
/// 変換後の代数方程式を部分分数に分けると、逆変換は未定係数法と同じ
/// \[
/// x(t) = \frac{1}{2}e^{t} - e^{2t} + \frac{1}{2}e^{3t}
/// \]
/// です。この値は厳密解です。
pub fn laplace_ivp(t: f64) -> f64 {
    undetermined_coefficient(t)
}

/// [`laplace_ivp`] の導関数です。これも厳密です。
pub fn laplace_ivp_prime(t: f64) -> f64 {
    undetermined_coefficient_prime(t)
}

/// 通常点 \(t = 0\) における \(x'' + x = 0\)、\(x(0) = 1\)、\(x'(0) = 0\) のべき級数の和を返します。
///
/// 級数 \(x = \sum a_n t^n\) の係数は \(a_{n+2} = -a_n/((n+1)(n+2))\) を満たし、
/// 奇数次は 0、偶数次は \(\cos t\) のテイラー係数です。和は
/// \[
/// x(t) = \cos t
/// \]
/// で、これは無限級数としての厳密解です。有限項で打ち切った多項式ではありません。
pub fn power_series_cosine(t: f64) -> f64 {
    t.cos()
}

/// [`power_series_cosine`] の導関数です。和は \(-\sin t\) で、これも厳密です。
pub fn power_series_cosine_prime(t: f64) -> f64 {
    -t.sin()
}

/// 連立方程式 \(x' = x + y\)、\(y' = 4x + y\)、\(x(0) = 1\)、\(y(0) = 0\) の \(x(t)\) を返します。
///
/// 係数行列の固有値は \(3\) と \(-1\)、固有ベクトルは \((1, 2)\) と \((1, -2)\) です。
/// \[
/// x(t) = \frac{1}{2}\bigl(e^{3t} + e^{-t}\bigr)
/// \]
/// この値は厳密解です。
pub fn linear_system_x(t: f64) -> f64 {
    0.5 * ((3.0 * t).exp() + (-t).exp())
}

/// 同じ連立方程式の \(y(t)\) を返します。
/// \[
/// y(t) = e^{3t} - e^{-t}
/// \]
/// この値は厳密解です。
pub fn linear_system_y(t: f64) -> f64 {
    (3.0 * t).exp() - (-t).exp()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn euler_step_with_constant_slope_is_exact() {
        let mut state = [1.0];
        euler_step(&mut state, 4.0, 0.4, |time, value, slope| {
            assert_eq!(time, 4.0);
            assert_eq!(value, &[1.0]);
            slope[0] = 2.5;
        });
        assert_eq!(state[0], 1.0 + 0.4 * 2.5);
    }

    #[test]
    fn euler_step_uses_the_slope_at_the_start_of_the_interval() {
        let mut state = [0.0];
        euler_step(&mut state, 1.0, 0.5, |time, _value, slope| {
            slope[0] = time;
        });
        assert_eq!(state[0], 0.5);
    }

    #[test]
    fn midpoint_step_with_constant_slope_matches_euler() {
        let mut midpoint = [1.0];
        midpoint_step(&mut midpoint, 4.0, 0.4, |_time, _value, slope| {
            slope[0] = 2.5;
        });
        let mut euler = [1.0];
        euler_step(&mut euler, 4.0, 0.4, |_, _, slope| slope[0] = 2.5);
        assert_eq!(midpoint, euler);
        assert_eq!(midpoint[0], 1.0 + 0.4 * 2.5);
    }

    #[test]
    fn newton_step_from_one_on_x_squared_minus_two_is_three_halves() {
        let next = newton_step(1.0, |x| x * x - 2.0, |x| 2.0 * x);
        assert_eq!(next, 1.5);
    }

    #[test]
    fn newton_step_second_iterate_is_seventeen_twelfths() {
        let square = |x: f64| x * x - 2.0;
        let slope = |x: f64| 2.0 * x;
        let x1 = newton_step(1.0, square, slope);
        let x2 = newton_step(x1, square, slope);
        assert!((x2 - (1.5 - 0.25 / 3.0)).abs() < 1e-12);
        assert!((x2 - 17.0 / 12.0).abs() < 1e-12);
    }

    #[test]
    fn newton_step_approaches_the_positive_square_root_of_two() {
        let square = |x: f64| x * x - 2.0;
        let slope = |x: f64| 2.0 * x;
        let mut x = 1.0;
        for _ in 0..5 {
            x = newton_step(x, square, slope);
        }
        let root = 2.0_f64.sqrt();
        assert!((x - root).abs() < 1e-12);
        assert!(x > 0.0);
    }

    #[test]
    fn midpoint_step_uses_the_slope_at_the_middle() {
        let mut state = [0.0];
        midpoint_step(&mut state, 0.0, 1.0, |time, _value, slope| {
            slope[0] = time * time;
        });
        assert_eq!(state[0], 0.25);
    }

    #[test]
    fn rk4_step_with_constant_slope_is_exact_aside_from_rounding() {
        let mut state = [0.0];
        rk4_step(&mut state, 0.0, 0.25, |_, _, slope| slope[0] = 2.0);
        assert_eq!(state[0], 0.5);
    }

    #[test]
    fn x_prime_eq_v_step_is_exact_when_velocity_is_constant() {
        let mut position = [1.0];
        x_prime_eq_v_step(&mut position, &[2.5], 0.4);
        assert_eq!(position[0], 1.0 + 0.4 * 2.5);
        let mut euler = [1.0];
        euler_step(&mut euler, 0.0, 0.4, |_, _, slope| slope[0] = 2.5);
        assert_eq!(position, euler);
    }

    #[test]
    fn zero_acceleration_verlet_matches_x_prime_eq_v_step() {
        let mut verlet_position = [1.25];
        let mut verlet_velocity = [3.0];
        velocity_verlet_step(&mut verlet_position, &mut verlet_velocity, 0.2, |_, a| {
            a[0] = 0.0;
        });
        let mut position = [1.25];
        x_prime_eq_v_step(&mut position, &[3.0], 0.2);
        assert_eq!(verlet_position, position);
        assert_eq!(verlet_velocity, [3.0]);
    }

    #[test]
    fn constant_acceleration_verlet_steps_position_with_half_step_velocity() {
        let mut position = [0.0];
        let mut velocity = [1.0];
        velocity_verlet_step(&mut position, &mut velocity, 0.25, |_, acceleration| {
            acceleration[0] = 4.0;
        });
        assert_eq!(position[0], 0.375);
        assert_eq!(velocity[0], 2.0);
    }

    #[test]
    fn separated_exponential_zero_initial_position_is_the_zero_solution() {
        assert_eq!(separated_exponential(0.0, 2.0, 4.0), 0.0);
        assert_eq!(separated_exponential(0.0, 1e300, 1e300), 0.0);
    }

    #[test]
    fn separated_exponential_with_zero_rate_stays_at_the_initial_position() {
        assert_eq!(separated_exponential(3.0, 0.0, 4.0), 3.0);
    }

    #[test]
    fn separated_exponential_at_zero_time_is_the_initial_position() {
        assert_eq!(separated_exponential(3.0, 2.0, 0.0), 3.0);
    }

    #[test]
    fn separated_exponential_matches_the_closed_form() {
        let value = separated_exponential(3.0, 2.0, 1.0);
        assert!((value - 3.0 * 2.0_f64.exp()).abs() < 1e-12);
    }

    #[test]
    fn first_order_linear_at_zero_time_is_the_initial_position() {
        assert_eq!(first_order_linear(1.0, 2.0, 6.0, 0.0), 1.0);
    }

    #[test]
    fn first_order_linear_matches_the_closed_form() {
        let value = first_order_linear(1.0, 2.0, 6.0, 1.0);
        assert!((value - (3.0 - 2.0 * (-2.0_f64).exp())).abs() < 1e-12);
    }

    #[test]
    fn homogeneous_ratio_matches_the_example() {
        assert!((homogeneous_ratio(0.0, 1.0)).abs() < 1e-12);
        let value = homogeneous_ratio(0.0, 2.0);
        assert!((value - 2.0 * 2.0_f64.ln()).abs() < 1e-12);
    }

    #[test]
    fn exact_quadratic_matches_the_level_curve() {
        assert!((exact_quadratic(0.0) - 1.0).abs() < 1e-12);
        let value = exact_quadratic(0.5);
        let expected = (-0.5 + (4.0 - 3.0 * 0.25_f64).sqrt()) / 2.0;
        assert!((value - expected).abs() < 1e-12);
    }

    #[test]
    fn bernoulli_logistic_matches_the_example() {
        assert!((bernoulli_logistic(0.5, 0.0) - 0.5).abs() < 1e-12);
        let value = bernoulli_logistic(0.5, 1.0);
        assert!((value - 1.0 / (1.0 + (-1.0_f64).exp())).abs() < 1e-12);
    }

    #[test]
    fn characteristic_examples_match_their_closed_forms() {
        assert!((characteristic_two_real(0.0) - 1.0).abs() < 1e-12);
        assert!((characteristic_two_real_prime(0.0) - 3.0).abs() < 1e-12);
        let two = characteristic_two_real(1.0);
        assert!((two - (-1.0_f64.exp() + 2.0 * 2.0_f64.exp())).abs() < 1e-12);
        assert!((characteristic_repeated(0.0) - 1.0).abs() < 1e-12);
        assert!((characteristic_repeated(1.0)).abs() < 1e-12);
        assert!((characteristic_complex(0.0) - 1.0).abs() < 1e-12);
        assert!((characteristic_complex(1.0) - 1.0_f64.cos()).abs() < 1e-12);
    }

    #[test]
    fn undetermined_and_laplace_share_the_same_exact_solution() {
        assert!(undetermined_coefficient(0.0).abs() < 1e-12);
        assert!(undetermined_coefficient_prime(0.0).abs() < 1e-12);
        let value = undetermined_coefficient(1.0);
        let expected = 0.5 * 1.0_f64.exp() - 2.0_f64.exp() + 0.5 * 3.0_f64.exp();
        assert!((value - expected).abs() < 1e-12);
        assert!((laplace_ivp(1.0) - value).abs() < 1e-12);
        assert!((laplace_ivp_prime(1.0) - undetermined_coefficient_prime(1.0)).abs() < 1e-12);
    }

    #[test]
    fn variation_of_parameters_matches_the_initial_condition_and_the_formula() {
        assert!(variation_of_parameters(0.0).abs() < 1e-12);
        assert!(variation_of_parameters_prime(0.0).abs() < 1e-12);
        let t = 1.0_f64;
        let expected = t.sin() - t.cos() * ((1.0 + t.sin()) / t.cos()).ln();
        assert!((variation_of_parameters(t) - expected).abs() < 1e-12);
    }

    #[test]
    fn power_series_cosine_is_the_sum() {
        assert!((power_series_cosine(0.0) - 1.0).abs() < 1e-12);
        assert!(power_series_cosine_prime(0.0).abs() < 1e-12);
        assert!((power_series_cosine(1.0) - 1.0_f64.cos()).abs() < 1e-12);
    }

    #[test]
    fn linear_system_matches_the_initial_condition_and_the_formula() {
        assert!((linear_system_x(0.0) - 1.0).abs() < 1e-12);
        assert!(linear_system_y(0.0).abs() < 1e-12);
        let x = linear_system_x(1.0);
        let y = linear_system_y(1.0);
        assert!((x - 0.5 * (3.0_f64.exp() + (-1.0_f64).exp())).abs() < 1e-12);
        assert!((y - (3.0_f64.exp() - (-1.0_f64).exp())).abs() < 1e-12);
    }
}
