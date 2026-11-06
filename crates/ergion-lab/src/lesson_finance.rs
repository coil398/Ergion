//! 金融数学の単元の値。式は `ergion_core::finance` の各関数の rustdoc にある。
//!
//! 擬似乱数を使う単元は、計算条件の `seed`（既定 1）から [`Rng`] を作る。同じ種からは同じ標本が出る。

use ergion_core::finance::{self as core, HeatScheme};
use ergion_core::statistics::{Rng, Welford, histogram};
use serde_json::Value;

use crate::lesson::{Figure, LessonModel, ModelState, count, grid, num, positive, text};

/// 連続複利のページの元本 \(S_0\)、年利率 \(r\)、図の期間 \(T\)（年）。
const COMPOUND: (f64, f64, f64) = (100.0, 0.05, 10.0);

/// 表に並べる複利の回数。年複利、月複利、日複利。
const COMPOUND_M: [f64; 3] = [1.0, 12.0, 365.0];

/// Black–Scholes のページの権利行使価格 \(K\)、無リスク金利 \(r\)、ボラティリティ \(\sigma\)、最長の満期までの時間 \(T - t\)。
const BS: (f64, f64, f64, f64) = (100.0, 0.05, 0.2, 1.0);

/// 差分法の格子。区間 \([-L, L]\) の半幅 \(L\)、空間の分割数、時間の分割数。
const BS_GRID: (f64, usize, usize) = (2.0, 400, 800);

/// 図に描く満期までの時間 \(T - t\)。最長の時間の 1/4、1/2、1 倍。
const BS_TAUS: [f64; 3] = [0.25, 0.5, 1.0];

/// 価格の表に並べる原資産価格 \(S\)。
const BS_TABLE: [f64; 5] = [80.0, 90.0, 100.0, 110.0, 120.0];

/// Monte Carlo 価格評価の例に使う4個の標準正規分布の値 \(Z\)。
const MC_EXAMPLE_Z: [f64; 4] = [-1.0, 0.0, 0.5, 1.0];

/// 金融数学の単元の図。
///
/// - `compound`: 年 \(m\) 回の複利の階段と連続複利の曲線、および \(m\) に対する差。`method` は `annual`、`monthly`、`daily`。
/// - `gbm`: 幾何 Brownian 運動の1ステップの例。Euler–Maruyama 法と厳密な更新を \(Z = 0.5\) で比べる。
/// - `black-scholes`: 満期の支払い、Black–Scholes 公式と差分法の価格、熱伝導方程式の値。`method` は `crank-nicolson` か `explicit`。
/// - `mc-pricing`: 4個の標本 \(Z = -1, 0, 0.5, 1\) による価格の推定の例。
pub fn figure(unit: &str, params: &Value) -> Result<Figure, String> {
    match unit {
        "compound" => compound(params),
        "gbm" => Ok(gbm_example()),
        "black-scholes" => black_scholes(params),
        "mc-pricing" => Ok(mc_example()),
        _ => Err(format!("unknown finance unit {unit}")),
    }
}

/// 金融数学の単元の時間発展。
///
/// - `gbm`: 多数の株価の経路を、同じ擬似乱数の増分で、選んだ方法と厳密解の両方で進める。
/// - `mc-pricing`: 1ステップごとに満期の価格の標本を加え、コールの価格を推定する。
pub fn model(unit: &str, config: &Value, _dt: f64) -> Result<Box<dyn LessonModel>, String> {
    match unit {
        "gbm" => Ok(Box::new(Gbm::new(config)?)),
        "mc-pricing" => Ok(Box::new(McPricing::new(config)?)),
        _ => Err(format!("unknown finance unit {unit}")),
    }
}

/// 種を読む。0 以上 \(2^{53}\) 以下の整数。
fn seed(params: &Value) -> Result<u64, String> {
    let value = num(params, "seed", 1.0)?;
    if !(value >= 0.0 && value.fract() == 0.0 && value <= 9_007_199_254_740_992.0) {
        return Err("seed must be an integer in [0, 2^53]".into());
    }
    Ok(value as u64)
}

/// 区間 \([a, b]\) を `bins` 等分した棒の左端と右端を交互に並べる。
fn bar_edges(lo: f64, hi: f64, bins: usize) -> Vec<f64> {
    let width = (hi - lo) / bins as f64;
    (0..bins).flat_map(|j| [lo + j as f64 * width, lo + (j + 1) as f64 * width]).collect()
}

fn compound(params: &Value) -> Result<Figure, String> {
    let m = match text(params, "method", "annual") {
        "annual" => 1.0,
        "monthly" => 12.0,
        "daily" => 365.0,
        other => return Err(format!("unknown method {other}")),
    };
    let (s0, r, horizon) = COMPOUND;
    let periods = (m * horizon).round() as usize;
    let mut stair_t = Vec::with_capacity(2 * periods + 1);
    let mut stair_s = Vec::with_capacity(2 * periods + 1);
    for k in 0..periods {
        let level = core::credited_balance(s0, r, m, k as f64 / m);
        stair_t.extend([k as f64 / m, (k + 1) as f64 / m]);
        stair_s.extend([level, level]);
    }
    stair_t.push(horizon);
    stair_s.push(core::discrete_compound(s0, r, m, horizon));
    let ts = grid(0.0, horizon, 401);
    let continuous = ts.iter().map(|&t| core::continuous_compound(s0, r, t)).collect();

    let ms = [1.0, 2.0, 4.0, 12.0, 52.0, 365.0, 8760.0];
    let exact_end = core::continuous_compound(s0, r, horizon);
    let gaps: Vec<f64> = ms.iter().map(|&k| exact_end - core::discrete_compound(s0, r, k, horizon)).collect();
    let leads: Vec<f64> = ms.iter().map(|&k| core::compound_gap_leading(s0, r, k, horizon)).collect();
    let logs: Vec<f64> = ms.iter().map(|k| k.log10()).collect();

    let discrete_end = core::discrete_compound(s0, r, m, horizon);
    Ok(Figure::new()
        .series("continuous", "exact", ts, continuous)
        .series("staircase", "numerical", stair_t, stair_s)
        .series("gap-leading", "exact", logs.clone(), leads)
        .series("gap", "numerical", logs, gaps)
        .point("chosen", "numerical", m.log10(), exact_end - discrete_end)
        .value("m", m)
        .value("s0", s0)
        .value("rate", r)
        .value("horizon", horizon)
        .value("factor", (1.0 + r / m).powf(m))
        .value("e_r", r.exp())
        .value("discrete_1", core::discrete_compound(s0, r, m, 1.0))
        .value("continuous_1", core::continuous_compound(s0, r, 1.0))
        .value("discrete_end", discrete_end)
        .value("continuous_end", exact_end)
        .value("gap_end", exact_end - discrete_end)
        .value("lead_end", core::compound_gap_leading(s0, r, m, horizon))
        .array("table_m", COMPOUND_M.to_vec())
        .array("table_1", COMPOUND_M.iter().map(|&k| core::discrete_compound(s0, r, k, 1.0)).collect())
        .array("table_end", COMPOUND_M.iter().map(|&k| core::discrete_compound(s0, r, k, horizon)).collect())
        .array("table_gap", COMPOUND_M.iter().map(|&k| exact_end - core::discrete_compound(s0, r, k, horizon)).collect()))
}

fn gbm_example() -> Figure {
    let (s0, mu, sigma, dt, z) = (100.0, 0.08, 0.3, 0.01, 0.5);
    let em = core::gbm_euler_maruyama_step(s0, mu, sigma, dt, z);
    let exact = core::gbm_exact_step(s0, mu, sigma, dt, z);
    Figure::new()
        .value("em_step", em)
        .value("exact_step", exact)
        .value("step_gap", em - exact)
        .value("mean_1", core::gbm_mean(s0, mu, 1.0))
}

fn black_scholes(params: &Value) -> Result<Figure, String> {
    let scheme = match text(params, "method", "crank-nicolson") {
        "crank-nicolson" => HeatScheme::CrankNicolson,
        "explicit" => HeatScheme::Explicit,
        other => return Err(format!("unknown method {other}")),
    };
    let (strike, r, sigma, tau_max) = BS;
    let (half_width, cells, steps) = BS_GRID;
    let heat_end = 0.5 * sigma * sigma * tau_max;
    let sol = core::solve_call_heat(r, sigma, half_width, cells, heat_end, steps, scheme, steps / 4);
    let t = sol.transform;
    let price_at = |level: usize, s: f64| {
        let x = (s / strike).ln();
        let heat_tau = sol.steps_at[level] as f64 * sol.dtau;
        let prices: Vec<f64> = sol.x.iter().zip(&sol.levels[level]).map(|(&xj, &u)| t.to_price(strike, xj, heat_tau, u)).collect();
        core::interpolate(&sol.x, &prices, x)
    };
    let level_of = |tau: f64| sol.steps_at.iter().position(|&n| ((n as f64 * sol.dtau) - 0.5 * sigma * sigma * tau).abs() < 1e-12).unwrap();

    let s_grid = grid(50.0, 150.0, 201);
    let mut fig = Figure::new().series("payoff", "text", vec![50.0, strike, 150.0], vec![0.0, 0.0, 50.0]);
    for (i, &tau) in BS_TAUS.iter().enumerate() {
        let level = level_of(tau);
        let heat_tau = sol.steps_at[level] as f64 * sol.dtau;
        let (mut fd_s, mut fd_v) = (vec![], vec![]);
        for (&xj, &u) in sol.x.iter().zip(&sol.levels[level]) {
            let s = strike * xj.exp();
            if (50.0..=150.0).contains(&s) {
                fd_s.push(s);
                fd_v.push(t.to_price(strike, xj, heat_tau, u));
            }
        }
        let formula = s_grid.iter().map(|&s| core::black_scholes_call(s, strike, r, sigma, tau).price).collect();
        fig = fig.series(&format!("fd-{i}"), "numerical", fd_s, fd_v).series(&format!("formula-{i}"), "exact", s_grid.clone(), formula);
    }

    let last = sol.levels.len() - 1;
    let (mut hx, mut h0, mut hn, mut he) = (vec![], vec![], vec![], vec![]);
    for (j, &xj) in sol.x.iter().enumerate() {
        if (-1.0..=1.0).contains(&xj) {
            hx.push(xj);
            h0.push(sol.levels[0][j]);
            hn.push(sol.levels[last][j]);
            let exact = core::black_scholes_call(strike * xj.exp(), strike, r, sigma, tau_max).price;
            he.push(t.from_price(strike, xj, heat_end, exact));
        }
    }

    let v = core::black_scholes_call(strike, strike, r, sigma, tau_max);
    let fd = price_at(last, strike);
    let table_fd: Vec<f64> = BS_TABLE.iter().map(|&s| price_at(last, s)).collect();
    let table_formula: Vec<f64> = BS_TABLE.iter().map(|&s| core::black_scholes_call(s, strike, r, sigma, tau_max).price).collect();
    let table_diff = table_fd.iter().zip(&table_formula).map(|(a, b)| a - b).collect();
    let table_delta = BS_TABLE.iter().map(|&s| core::black_scholes_call(s, strike, r, sigma, tau_max).delta).collect();
    Ok(fig
        .series("heat-initial", "reference", hx.clone(), h0)
        .series("heat-exact", "exact", hx.clone(), he)
        .series("heat-fd", "numerical", hx, hn)
        .point("strike", "text", strike, 0.0)
        .value("price", v.price)
        .value("fd_price", fd)
        .value("fd_gap", fd - v.price)
        .value("delta", v.delta)
        .value("gamma", v.gamma)
        .value("d1", v.d1)
        .value("d2", v.d2)
        .value("discount", (-r * tau_max).exp())
        .value("k", t.k)
        .value("alpha", t.alpha)
        .value("beta", t.beta)
        .value("heat_end", heat_end)
        .value("dx", 2.0 * half_width / cells as f64)
        .value("dtau", sol.dtau)
        .value("rho", sol.rho)
        .value("steps", steps as f64)
        .array("table_s", BS_TABLE.to_vec())
        .array("table_formula", table_formula)
        .array("table_fd", table_fd)
        .array("table_diff", table_diff)
        .array("table_delta", table_delta))
}

fn mc_example() -> Figure {
    let (strike, r, sigma, maturity) = BS;
    let s0 = strike;
    let terminal: Vec<f64> = MC_EXAMPLE_Z.iter().map(|&z| core::risk_neutral_terminal(s0, r, sigma, maturity, z)).collect();
    let payoffs: Vec<f64> = terminal.iter().map(|&s| core::call_payoff(s, strike)).collect();
    let mut w = Welford::new();
    let discount = (-r * maturity).exp();
    for p in &payoffs {
        w.push(discount * p);
    }
    let e = core::price_estimate(w.count(), w.mean(), w.m2());
    Figure::new()
        .array("z", MC_EXAMPLE_Z.to_vec())
        .array("terminal", terminal)
        .array("payoff", payoffs.clone())
        .value("payoff_mean", payoffs.iter().sum::<f64>() / payoffs.len() as f64)
        .value("discount", discount)
        .value("estimate", e.estimate)
        .value("standard_error", e.standard_error)
        .value("price", core::black_scholes_call(s0, strike, r, sigma, maturity).price)
}

/// 図に描く経路の数。平均とヒストグラムには、すべての経路を使う。
const SHOWN_PATHS: usize = 8;

/// 記録する時刻の数の上限。超えたら一つおきに間引く。
const HISTORY_LIMIT: usize = 2000;

#[derive(Clone, Copy, PartialEq, Eq)]
enum GbmMethod {
    EulerMaruyama,
    LogExact,
}

#[derive(Clone)]
struct GbmRecord {
    time: f64,
    numerical: Vec<f64>,
    exact: Vec<f64>,
    mean: f64,
}

/// 幾何 Brownian 運動の多数の経路。
///
/// 1ステップごとに、各経路 \(i\) について標準正規分布の擬似乱数 \(Z_i\) を一つ作り、増分 \(\Delta W_i = \sqrt{\Delta t}\,Z_i\) を
/// 選んだ方法の更新と厳密解 \(S_0\exp((\mu - \frac{1}{2}\sigma^2)t + \sigma W_i)\) の両方に使う。
/// 方法は `euler-maruyama`（[`core::gbm_euler_maruyama_step`]）か `log-exact`（[`core::gbm_exact_step`]）。
/// 計器の `position` は経路1の数値解、`velocity` は全経路の数値解の標本平均、`exact_position` は経路1の厳密解、
/// `exact_velocity` は期待値 \(S_0 e^{\mu t}\) である。
struct Gbm {
    rng: Rng,
    seed: u64,
    method: GbmMethod,
    s0: f64,
    mu: f64,
    sigma: f64,
    time: f64,
    numerical: Vec<f64>,
    brownian: Vec<f64>,
    history: Vec<GbmRecord>,
}

impl Gbm {
    fn new(config: &Value) -> Result<Self, String> {
        let method = match text(config, "method", "euler-maruyama") {
            "euler-maruyama" => GbmMethod::EulerMaruyama,
            "log-exact" => GbmMethod::LogExact,
            other => return Err(format!("unknown method {other}")),
        };
        let s0 = positive(config, "s0", 100.0)?;
        let mu = num(config, "mu", 0.08)?;
        let sigma = positive(config, "sigma", 0.3)?;
        if mu.abs() > 2.0 || sigma > 2.0 {
            return Err("mu must be in [-2, 2] and sigma in (0, 2]".into());
        }
        let paths = count(config, "paths", 1000, 5000)?;
        if paths < 2 {
            return Err("paths must be at least 2".into());
        }
        let seed = seed(config)?;
        let mut model = Self {
            rng: Rng::new(seed),
            seed,
            method,
            s0,
            mu,
            sigma,
            time: 0.0,
            numerical: vec![s0; paths],
            brownian: vec![0.0; paths],
            history: vec![],
        };
        model.record();
        Ok(model)
    }

    fn exact(&self, i: usize) -> f64 {
        core::gbm_exact(self.s0, self.mu, self.sigma, self.time, self.brownian[i])
    }

    fn mean(&self) -> f64 {
        self.numerical.iter().sum::<f64>() / self.numerical.len() as f64
    }

    fn shown(&self) -> usize {
        SHOWN_PATHS.min(self.numerical.len())
    }

    fn record(&mut self) {
        let shown = self.shown();
        let record = GbmRecord {
            time: self.time,
            numerical: self.numerical[..shown].to_vec(),
            exact: (0..shown).map(|i| self.exact(i)).collect(),
            mean: self.mean(),
        };
        self.history.push(record);
        if self.history.len() > HISTORY_LIMIT {
            let last = self.history.last().unwrap().clone();
            let mut thinned: Vec<GbmRecord> = self.history.iter().step_by(2).cloned().collect();
            if thinned.last().map(|r| r.time) != Some(last.time) {
                thinned.push(last);
            }
            self.history = thinned;
        }
    }
}

impl LessonModel for Gbm {
    fn step(&mut self, time: f64, dt: f64) -> Result<(), String> {
        for i in 0..self.numerical.len() {
            let z = self.rng.standard_normal();
            self.brownian[i] += dt.sqrt() * z;
            let s = self.numerical[i];
            self.numerical[i] = match self.method {
                GbmMethod::EulerMaruyama => core::gbm_euler_maruyama_step(s, self.mu, self.sigma, dt, z),
                GbmMethod::LogExact => core::gbm_exact_step(s, self.mu, self.sigma, dt, z),
            };
        }
        self.time = time + dt;
        self.record();
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        ModelState {
            position: self.numerical[0],
            velocity: self.mean(),
            exact_position: self.exact(0),
            exact_velocity: core::gbm_mean(self.s0, self.mu, self.time),
        }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let times: Vec<f64> = self.history.iter().map(|r| r.time).collect();
        let mut fig = Figure::new();
        for i in 0..self.shown() {
            fig = fig
                .series(&format!("exact-{i}"), "exact", times.clone(), self.history.iter().map(|r| r.exact[i]).collect())
                .series(&format!("path-{i}"), "numerical", times.clone(), self.history.iter().map(|r| r.numerical[i]).collect());
        }
        let expected = times.iter().map(|&t| core::gbm_mean(self.s0, self.mu, t)).collect();
        fig = fig
            .series("expected", "exact", times.clone(), expected)
            .series("mean", "numerical", times, self.history.iter().map(|r| r.mean).collect());

        let n = self.numerical.len();
        let exact_values: Vec<f64> = (0..n).map(|i| self.exact(i)).collect();
        let max_error = self.numerical.iter().zip(&exact_values).map(|(a, b)| (a - b).abs()).fold(0.0, f64::max);
        let logs: Vec<f64> = self.numerical.iter().filter(|&&s| s > 0.0).map(|s| s.ln()).collect();
        let log_mean = logs.iter().sum::<f64>() / logs.len().max(1) as f64;
        let log_var = if logs.len() > 1 { logs.iter().map(|y| (y - log_mean) * (y - log_mean)).sum::<f64>() / (logs.len() - 1) as f64 } else { 0.0 };
        let center = self.s0.ln() + (self.mu - 0.5 * self.sigma * self.sigma) * self.time;
        let spread = self.sigma * self.time.sqrt();
        if self.time > 0.0 {
            let (lo, hi, bins) = (center - 4.0 * spread, center + 4.0 * spread, 32);
            let width = (hi - lo) / bins as f64;
            let counts = histogram(&logs, lo, hi, bins);
            let density = counts.iter().map(|&c| c as f64 / (n as f64 * width)).collect();
            let ys = grid(lo, hi, 161);
            let pdf = ys.iter().map(|&y| core::log_price_density(y, self.s0, self.mu, self.sigma, self.time)).collect();
            fig = fig.bars("log-histogram", "numerical", bar_edges(lo, hi, bins), density).series("log-density", "exact", ys, pdf);
        } else {
            fig = fig.bars("log-histogram", "numerical", vec![], vec![]).series("log-density", "exact", vec![], vec![]);
        }
        Some(
            fig.value("seed", self.seed as f64)
                .value("paths", n as f64)
                .value("time", self.time)
                .value("mean", self.mean())
                .value("mean_exact", exact_values.iter().sum::<f64>() / n as f64)
                .value("expected", core::gbm_mean(self.s0, self.mu, self.time))
                .value("max_error", max_error)
                .value("log_mean", log_mean)
                .value("log_var", log_var)
                .value("log_mean_theory", center)
                .value("log_var_theory", spread * spread),
        )
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        if final_time.is_finite() && final_time <= 100.0 { Ok(()) } else { Err("final time must be at most 100".into()) }
    }
}

/// 満期の価格のヒストグラムの区間と棒の数。
const MC_HIST: (f64, f64, usize) = (0.0, 250.0, 50);

/// Monte Carlo 法によるコールの価格の推定。
///
/// 計算の初めに \(k\) 個（`samples_per_step`）の標本を作り、1ステップごとに \(k\) 個を加える。各標本は
/// 標準正規分布の擬似乱数 \(Z\) から満期の価格 [`core::risk_neutral_terminal`] を作り、割り引いた支払い
/// \(Y = e^{-rT}\max(S_T - K, 0)\) を Welford の逐次更新で平均する。推移の系列の横軸は標本数 \(M\) を千個単位で表した値。
/// 計器の `position` は推定値 \(\hat{C}_M\)、`velocity` は標準誤差、`exact_position` は Black–Scholes 公式の値、
/// `exact_velocity` は母標準偏差から求めた \(\sigma_Y/\sqrt{M}\) である。
struct McPricing {
    rng: Rng,
    seed: u64,
    per_step: usize,
    s0: f64,
    strike: f64,
    rate: f64,
    sigma: f64,
    maturity: f64,
    price: f64,
    payoff_sd: f64,
    payoffs: Welford,
    in_the_money: u64,
    counts: Vec<usize>,
    history: Vec<(f64, f64, f64)>,
}

impl McPricing {
    fn new(config: &Value) -> Result<Self, String> {
        let s0 = positive(config, "s0", 100.0)?;
        let strike = positive(config, "strike", 100.0)?;
        let rate = num(config, "rate", 0.05)?;
        let sigma = positive(config, "sigma", 0.2)?;
        let maturity = positive(config, "maturity", 1.0)?;
        if rate.abs() > 1.0 || sigma > 2.0 || maturity > 50.0 || s0 > 1e6 || strike > 1e6 {
            return Err("rate must be in [-1, 1], sigma in (0, 2], maturity in (0, 50], prices at most 1e6".into());
        }
        let per_step = count(config, "samples_per_step", 50, 5000)?;
        let seed = seed(config)?;
        let mut model = Self {
            rng: Rng::new(seed),
            seed,
            per_step,
            s0,
            strike,
            rate,
            sigma,
            maturity,
            price: core::black_scholes_call(s0, strike, rate, sigma, maturity).price,
            payoff_sd: core::discounted_payoff_sd(s0, strike, rate, sigma, maturity),
            payoffs: Welford::new(),
            in_the_money: 0,
            counts: vec![0; MC_HIST.2],
            history: vec![],
        };
        model.add_samples();
        Ok(model)
    }

    fn add_samples(&mut self) {
        let discount = (-self.rate * self.maturity).exp();
        let (lo, hi, bins) = MC_HIST;
        let mut terminal = Vec::with_capacity(self.per_step);
        for _ in 0..self.per_step {
            let z = self.rng.standard_normal();
            let s = core::risk_neutral_terminal(self.s0, self.rate, self.sigma, self.maturity, z);
            if s > self.strike {
                self.in_the_money += 1;
            }
            self.payoffs.push(discount * core::call_payoff(s, self.strike));
            terminal.push(s);
        }
        for (c, add) in self.counts.iter_mut().zip(histogram(&terminal, lo, hi, bins)) {
            *c += add;
        }
        let e = self.estimate();
        self.history.push((self.payoffs.count() as f64, e.estimate, e.standard_error));
        if self.history.len() > HISTORY_LIMIT {
            let last = *self.history.last().unwrap();
            let mut thinned: Vec<_> = self.history.iter().step_by(2).copied().collect();
            if thinned.last() != Some(&last) {
                thinned.push(last);
            }
            self.history = thinned;
        }
    }

    fn estimate(&self) -> core::PriceEstimate {
        core::price_estimate(self.payoffs.count(), self.payoffs.mean(), self.payoffs.m2())
    }
}

impl LessonModel for McPricing {
    fn step(&mut self, _time: f64, _dt: f64) -> Result<(), String> {
        self.add_samples();
        Ok(())
    }

    fn state(&self, _time: f64) -> ModelState {
        let e = self.estimate();
        ModelState {
            position: e.estimate,
            velocity: e.standard_error,
            exact_position: self.price,
            exact_velocity: self.payoff_sd / (self.payoffs.count() as f64).sqrt(),
        }
    }

    fn frame(&self, _time: f64) -> Option<Figure> {
        let e = self.estimate();
        let m = self.payoffs.count();
        let (lo, hi, bins) = MC_HIST;
        let width = (hi - lo) / bins as f64;
        let density: Vec<f64> = self.counts.iter().map(|&c| c as f64 / (m as f64 * width)).collect();
        let ss = grid(lo + 0.5, hi, 250);
        let pdf: Vec<f64> = ss.iter().map(|&s| core::price_density(s, self.s0, self.rate, self.sigma, self.maturity)).collect();
        let top = 1.1 * density.iter().chain(&pdf).fold(0.0f64, |a, &b| a.max(b));
        let thousands: Vec<f64> = self.history.iter().map(|h| h.0 / 1000.0).collect();
        Some(
            Figure::new()
                .bars("histogram", "numerical", bar_edges(lo, hi, bins), density)
                .series("density", "exact", ss, pdf)
                .series("strike", "vector", vec![self.strike, self.strike], vec![0.0, top])
                .series("band-upper", "muted", thousands.clone(), self.history.iter().map(|h| self.price + h.2).collect())
                .series("band-lower", "muted", thousands.clone(), self.history.iter().map(|h| self.price - h.2).collect())
                .series("price", "exact", vec![thousands[0], *thousands.last().unwrap()], vec![self.price, self.price])
                .series("estimate", "numerical", thousands.clone(), self.history.iter().map(|h| h.1).collect())
                .series("se", "numerical", thousands.clone(), self.history.iter().map(|h| h.2).collect())
                .series("se-exact", "exact", thousands, self.history.iter().map(|h| self.payoff_sd / (h.0).sqrt()).collect())
                .value("seed", self.seed as f64)
                .value("samples", m as f64)
                .value("in_the_money", self.in_the_money as f64)
                .value("estimate", e.estimate)
                .value("standard_error", e.standard_error)
                .value("price", self.price)
                .value("payoff_sd", self.payoff_sd)
                .value("strike", self.strike),
        )
    }

    fn check_horizon(&self, final_time: f64) -> Result<(), String> {
        if final_time.is_finite() { Ok(()) } else { Err("final time must be finite".into()) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lesson::LessonSimulation;

    #[test]
    fn compound_tabs_return_the_hand_values() {
        let annual = figure("compound", &serde_json::json!({ "method": "annual" })).unwrap();
        assert!((annual.values["discrete_1"] - 105.0).abs() < 1e-12);
        assert!((annual.values["continuous_1"] - 105.127_109_637_602_4).abs() < 1e-9);
        let monthly = figure("compound", &serde_json::json!({ "method": "monthly" })).unwrap();
        assert!((monthly.values["discrete_1"] - 105.116_189_788_173_3).abs() < 1e-9);
        let daily = figure("compound", &serde_json::json!({ "method": "daily" })).unwrap();
        assert!(daily.values["gap_end"] < monthly.values["gap_end"]);
        assert!((daily.values["gap_end"] / daily.values["lead_end"] - 1.0).abs() < 1e-3);
        let stairs = &daily.series.iter().find(|s| s.name == "staircase").unwrap().y;
        assert!((stairs.last().unwrap() - daily.values["discrete_end"]).abs() < 1e-9);
        assert!(figure("compound", &serde_json::json!({ "method": "hourly" })).is_err());
    }

    #[test]
    fn gbm_example_is_one_hand_step() {
        let f = figure("gbm", &serde_json::json!({})).unwrap();
        assert!((f.values["em_step"] - 101.58).abs() < 1e-12);
        assert!((f.values["exact_step"] - 101.546_841_637_126_42).abs() < 1e-10);
    }

    #[test]
    fn black_scholes_tabs_approach_the_formula() {
        let cn = figure("black-scholes", &serde_json::json!({ "method": "crank-nicolson" })).unwrap();
        let ex = figure("black-scholes", &serde_json::json!({ "method": "explicit" })).unwrap();
        for f in [&cn, &ex] {
            assert!((f.values["price"] - 10.450_583_572_185_565).abs() < 1e-12);
            assert!(f.values["fd_gap"].abs() < 3e-3);
            assert!((f.values["rho"] - 0.25).abs() < 1e-12);
            assert!(f.arrays["table_diff"].iter().all(|d| d.abs() < 1e-2));
        }
        assert_ne!(cn.values["fd_price"], ex.values["fd_price"]);
        assert!(figure("black-scholes", &serde_json::json!({ "method": "implicit" })).is_err());
    }

    #[test]
    fn mc_example_matches_the_hand_values() {
        let f = figure("mc-pricing", &serde_json::json!({})).unwrap();
        assert!((f.values["payoff_mean"] - 10.697_073_180_190_415).abs() < 1e-10);
        assert!((f.values["estimate"] - 10.175_370_765_034_55).abs() < 1e-10);
    }

    #[test]
    fn gbm_paths_share_increments_across_methods() {
        let config = |method: &str| format!(r#"{{"schema_version":1,"kind":"finance/gbm","dt":0.01,"steps":100,"s0":100,"mu":0.08,"sigma":0.3,"paths":1000,"seed":1,"method":"{method}"}}"#);
        let em = LessonSimulation::new(&config("euler-maruyama")).unwrap().run_to_end().unwrap();
        let exact = LessonSimulation::new(&config("log-exact")).unwrap().run_to_end().unwrap();
        assert_eq!(em.exact_position, exact.exact_position);
        assert!((exact.position - exact.exact_position).abs() < 1e-9);
        assert!((em.position - em.exact_position).abs() > 1e-6);
        assert!((em.exact_velocity - 108.328_706_767_495_86).abs() < 1e-9);
        let sd = 108.33 * (0.09f64.exp() - 1.0).sqrt() / 1000f64.sqrt();
        assert!((em.velocity - em.exact_velocity).abs() < 4.0 * sd);
        let frame = em.frame.unwrap();
        assert!((frame.values["log_var"] - 0.09).abs() < 0.02);
        assert!(frame.values["max_error"] < 10.0);
    }

    #[test]
    fn mc_pricing_is_reproducible_and_near_the_formula() {
        let json = r#"{"schema_version":1,"kind":"finance/mc-pricing","dt":1,"steps":200,"s0":100,"strike":100,"rate":0.05,"sigma":0.2,"maturity":1,"samples_per_step":50,"seed":1}"#;
        let a = LessonSimulation::new(json).unwrap().run_to_end().unwrap();
        let b = LessonSimulation::new(json).unwrap().run_to_end().unwrap();
        assert_eq!(a, b);
        let frame = a.frame.unwrap();
        assert_eq!(frame.values["samples"], 10050.0);
        assert!((a.exact_position - 10.450_583_572_185_565).abs() < 1e-12);
        assert!((a.position - a.exact_position).abs() < 4.0 * a.velocity);
        assert!((a.velocity / a.exact_velocity - 1.0).abs() < 0.1);
    }
}
