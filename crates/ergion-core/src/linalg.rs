//! 線形代数の単元の式と計算。小さな密行列を行優先の [`Matrix`] に置き、各関数の rustdoc に式を書く。
//!
//! 行と列の番号は 0 から数える。式の中の添字は 1 から数える。

use std::ops::{Index, IndexMut};

/// 実数の \(m \times n\) 行列。成分 \(a_{ij}\) は `data[i * cols + j]` にある（行優先）。
#[derive(Clone, Debug, PartialEq)]
pub struct Matrix {
    pub rows: usize,
    pub cols: usize,
    pub data: Vec<f64>,
}

impl Matrix {
    /// 行優先の成分の並びから行列を作る。`data` の長さは `rows * cols`。
    pub fn new(rows: usize, cols: usize, data: Vec<f64>) -> Self {
        assert_eq!(data.len(), rows * cols, "data must have rows * cols entries");
        Self { rows, cols, data }
    }

    /// 行の並びから行列を作る。すべての行は同じ長さ。
    pub fn from_rows(rows: &[&[f64]]) -> Self {
        let cols = rows.first().map_or(0, |r| r.len());
        assert!(rows.iter().all(|r| r.len() == cols), "rows must have the same length");
        Self::new(rows.len(), cols, rows.iter().flat_map(|r| r.iter().copied()).collect())
    }

    /// 零行列。
    pub fn zeros(rows: usize, cols: usize) -> Self {
        Self::new(rows, cols, vec![0.0; rows * cols])
    }

    /// \(n\) 次の単位行列 \(I\)。
    pub fn identity(n: usize) -> Self {
        let mut m = Self::zeros(n, n);
        for i in 0..n {
            m[(i, i)] = 1.0;
        }
        m
    }

    /// 列を並べて行列を作る。列 \(j\) は `columns[j]`。
    pub fn from_columns(columns: &[Vec<f64>]) -> Self {
        let cols = columns.len();
        let rows = columns.first().map_or(0, Vec::len);
        let mut m = Self::zeros(rows, cols);
        for (j, column) in columns.iter().enumerate() {
            assert_eq!(column.len(), rows, "columns must have the same length");
            for (i, &v) in column.iter().enumerate() {
                m[(i, j)] = v;
            }
        }
        m
    }

    /// 第 \(i\) 行。
    pub fn row(&self, i: usize) -> &[f64] {
        &self.data[i * self.cols..(i + 1) * self.cols]
    }

    /// 第 \(j\) 列。
    pub fn column(&self, j: usize) -> Vec<f64> {
        (0..self.rows).map(|i| self[(i, j)]).collect()
    }

    /// 正方行列か。
    pub fn is_square(&self) -> bool {
        self.rows == self.cols
    }

    /// 転置行列 \(A^T\)。\((A^T)_{ij} = a_{ji}\)。
    pub fn transpose(&self) -> Matrix {
        let mut t = Matrix::zeros(self.cols, self.rows);
        for i in 0..self.rows {
            for j in 0..self.cols {
                t[(j, i)] = self[(i, j)];
            }
        }
        t
    }

    /// 行列の積 \(C = AB\)。\(c_{ij} = \sum_k a_{ik} b_{kj}\)。
    pub fn mul(&self, other: &Matrix) -> Matrix {
        assert_eq!(self.cols, other.rows, "inner dimensions must agree");
        let mut c = Matrix::zeros(self.rows, other.cols);
        for i in 0..self.rows {
            for k in 0..self.cols {
                let a = self[(i, k)];
                if a == 0.0 {
                    continue;
                }
                for j in 0..other.cols {
                    c[(i, j)] += a * other[(k, j)];
                }
            }
        }
        c
    }

    /// 行列とベクトルの積 \(A\mathbf{x}\)。\((A\mathbf{x})_i = \sum_j a_{ij} x_j\)。
    pub fn mul_vec(&self, x: &[f64]) -> Vec<f64> {
        assert_eq!(self.cols, x.len(), "vector length must equal the number of columns");
        (0..self.rows).map(|i| dot(self.row(i), x)).collect()
    }

    /// 第 \(i\) 行と第 \(k\) 行を入れ替える。
    pub fn swap_rows(&mut self, i: usize, k: usize) {
        if i == k {
            return;
        }
        for j in 0..self.cols {
            self.data.swap(i * self.cols + j, k * self.cols + j);
        }
    }

    /// 右に列ベクトル \(\mathbf{b}\) を付けた拡大係数行列 \([A \mid \mathbf{b}]\)。
    pub fn augment(&self, b: &[f64]) -> Matrix {
        assert_eq!(self.rows, b.len(), "b must have one entry per row");
        let mut m = Matrix::zeros(self.rows, self.cols + 1);
        for i in 0..self.rows {
            for j in 0..self.cols {
                m[(i, j)] = self[(i, j)];
            }
            m[(i, self.cols)] = b[i];
        }
        m
    }
}

impl Index<(usize, usize)> for Matrix {
    type Output = f64;
    fn index(&self, (i, j): (usize, usize)) -> &f64 {
        &self.data[i * self.cols + j]
    }
}

impl IndexMut<(usize, usize)> for Matrix {
    fn index_mut(&mut self, (i, j): (usize, usize)) -> &mut f64 {
        &mut self.data[i * self.cols + j]
    }
}

/// 内積 \(\mathbf{x}\cdot\mathbf{y} = \sum_i x_i y_i\)。
pub fn dot(x: &[f64], y: &[f64]) -> f64 {
    assert_eq!(x.len(), y.len(), "vectors must have the same length");
    x.iter().zip(y).map(|(a, b)| a * b).sum()
}

/// ユークリッドノルム \(\|\mathbf{x}\| = \sqrt{\sum_i x_i^2}\)。
pub fn norm2(x: &[f64]) -> f64 {
    dot(x, x).sqrt()
}

/// 残差ベクトル \(\mathbf{r} = \mathbf{b} - A\mathbf{x}\)。
pub fn residual(a: &Matrix, x: &[f64], b: &[f64]) -> Vec<f64> {
    a.mul_vec(x).iter().zip(b).map(|(ax, bi)| bi - ax).collect()
}

/// 残差ノルム \(\|A\mathbf{x} - \mathbf{b}\|\) を返します。
///
/// 近似解 \(\mathbf{x}\) を連立1次方程式 \(A\mathbf{x} = \mathbf{b}\) に代入したときの、左辺と右辺の差の長さです。
/// 厳密解では 0 です。
pub fn residual_norm(a: &Matrix, x: &[f64], b: &[f64]) -> f64 {
    norm2(&residual(a, x, b))
}

/// Gauss の消去法で、各段の軸（ピボット）をどう選ぶか。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Pivoting {
    /// 第 \(k\) 段の軸は、そのときの対角成分 \(a_{kk}\)。行を入れ替えない。
    None,
    /// 部分ピボット選択。第 \(k\) 段で、第 \(k\) 列の対角より下（対角を含む）から絶対値が最大の成分の行を第 \(k\) 行と入れ替える。
    Partial,
}

/// 前進消去の一つの行基本変形 \(R_i \leftarrow R_i - m_{ik} R_k\)。
#[derive(Clone, Debug, PartialEq)]
pub struct RowOperation {
    /// 消去の段 \(k\)（軸の行）。
    pub pivot_row: usize,
    /// 変える行 \(i\)。
    pub row: usize,
    /// 乗数 \(m_{ik} = a_{ik}/a_{kk}\)。
    pub multiplier: f64,
}

/// Gauss の消去法の記録。
#[derive(Clone, Debug, PartialEq)]
pub struct Elimination {
    /// 前進消去を終えた拡大係数行列 \([U \mid \mathbf{c}]\)。左の \(n \times n\) は上三角。
    pub upper: Matrix,
    /// 各段の行の入れ替え \((k, p)\)。第 \(k\) 段で第 \(k\) 行と第 \(p\) 行を入れ替えた。入れ替えない段は \(p = k\)。
    pub swaps: Vec<(usize, usize)>,
    /// 前進消去の行基本変形を、行った順に並べたもの。
    pub operations: Vec<RowOperation>,
    /// 後退代入で求めた解 \(\mathbf{x}\)。
    pub solution: Vec<f64>,
}

/// 連立1次方程式 \(A\mathbf{x} = \mathbf{b}\) を Gauss の消去法で解きます。
///
/// \(A\) は \(n \times n\) の正則行列、\(\mathbf{b}\) は長さ \(n\) の定数ベクトルです。
/// 拡大係数行列 \([A \mid \mathbf{b}]\) に、第 \(k = 1, \ldots, n-1\) 段で次の行基本変形を行います（前進消去）。
/// \[
/// m_{ik} = \frac{a_{ik}}{a_{kk}}, \qquad R_i \leftarrow R_i - m_{ik} R_k \quad (i = k+1, \ldots, n)
/// \]
/// \(R_i\) は第 \(i\) 行、\(a_{kk}\) はその段の軸（ピボット）、\(m_{ik}\) は乗数です。
/// [`Pivoting::Partial`] では、各段の前に第 \(k\) 列の \(|a_{ik}|\ (i \ge k)\) が最大の行を第 \(k\) 行と入れ替え、\(|m_{ik}| \le 1\) にします。
/// 左が上三角行列 \(U\)、右が \(\mathbf{c}\) になったら、下の行から後退代入します。
/// \[
/// x_i = \frac{1}{u_{ii}}\left(c_i - \sum_{j=i+1}^{n} u_{ij} x_j\right) \quad (i = n, n-1, \ldots, 1)
/// \]
/// 軸がちょうど 0 になったときは誤りを返します。
/// 数値の計算なので、結果は丸めを含む近似解です。軸の絶対値が他の成分より極端に小さいと、乗数が大きくなり誤差が増えます。
pub fn gauss_eliminate(a: &Matrix, b: &[f64], pivoting: Pivoting) -> Result<Elimination, String> {
    if !a.is_square() {
        return Err("A must be square".into());
    }
    let n = a.rows;
    let mut m = a.augment(b);
    let mut swaps = Vec::new();
    let mut operations = Vec::new();
    for k in 0..n {
        let p = match pivoting {
            Pivoting::None => k,
            Pivoting::Partial => (k..n)
                .max_by(|&i, &j| m[(i, k)].abs().total_cmp(&m[(j, k)].abs()).then(j.cmp(&i)))
                .unwrap_or(k),
        };
        if k + 1 < n {
            swaps.push((k, p));
        }
        m.swap_rows(k, p);
        let pivot = m[(k, k)];
        if pivot == 0.0 {
            return Err(format!("zero pivot at step {}", k + 1));
        }
        for i in k + 1..n {
            let factor = m[(i, k)] / pivot;
            operations.push(RowOperation { pivot_row: k, row: i, multiplier: factor });
            m[(i, k)] = 0.0;
            for j in k + 1..=n {
                m[(i, j)] -= factor * m[(k, j)];
            }
        }
    }
    let mut u = Matrix::zeros(n, n);
    let mut c = vec![0.0; n];
    for i in 0..n {
        for j in 0..n {
            u[(i, j)] = m[(i, j)];
        }
        c[i] = m[(i, n)];
    }
    let solution = back_substitution(&u, &c)?;
    Ok(Elimination { upper: m, swaps, operations, solution })
}

/// 2行2列の連立1次方程式 \(A\mathbf{x} = \mathbf{b}\) の解を Cramer の公式で返します。
///
/// \[
/// x_1 = \frac{b_1 a_{22} - a_{12} b_2}{\det A}, \qquad x_2 = \frac{a_{11} b_2 - b_1 a_{21}}{\det A}, \qquad \det A = a_{11} a_{22} - a_{12} a_{21}
/// \]
/// 割り算は一度だけで、消去の乗数を作りません。\(\det A = 0\) のときは `None` です。
pub fn cramer_2x2(a: &Matrix, b: &[f64]) -> Option<[f64; 2]> {
    assert!(a.rows == 2 && a.cols == 2 && b.len() == 2, "A must be 2x2 and b of length 2");
    let det = a[(0, 0)] * a[(1, 1)] - a[(0, 1)] * a[(1, 0)];
    if det == 0.0 {
        return None;
    }
    Some([(b[0] * a[(1, 1)] - a[(0, 1)] * b[1]) / det, (a[(0, 0)] * b[1] - b[0] * a[(1, 0)]) / det])
}

/// 下三角行列 \(L\) の連立方程式 \(L\mathbf{y} = \mathbf{c}\) を前進代入で解きます。
///
/// 上の行から順に
/// \[
/// y_i = \frac{1}{l_{ii}}\left(c_i - \sum_{j=1}^{i-1} l_{ij} y_j\right) \quad (i = 1, 2, \ldots, n)
/// \]
/// です。\(L\) の対角より上の成分は読みません。対角成分が 0 のときは誤りを返します。
pub fn forward_substitution(l: &Matrix, c: &[f64]) -> Result<Vec<f64>, String> {
    if !l.is_square() || l.rows != c.len() {
        return Err("L must be square and match c".into());
    }
    let n = l.rows;
    let mut y = vec![0.0; n];
    for i in 0..n {
        let s: f64 = (0..i).map(|j| l[(i, j)] * y[j]).sum();
        if l[(i, i)] == 0.0 {
            return Err(format!("zero diagonal at row {}", i + 1));
        }
        y[i] = (c[i] - s) / l[(i, i)];
    }
    Ok(y)
}

/// 上三角行列 \(U\) の連立方程式 \(U\mathbf{x} = \mathbf{y}\) を後退代入で解きます。
///
/// 下の行から順に
/// \[
/// x_i = \frac{1}{u_{ii}}\left(y_i - \sum_{j=i+1}^{n} u_{ij} x_j\right) \quad (i = n, n-1, \ldots, 1)
/// \]
/// です。\(U\) は \(n \times n\) 以上の行を持ってよく、上の \(n\) 行だけを読みます（Householder 変換の \(R\) に使う）。
/// 対角成分が 0 のときは誤りを返します。
pub fn back_substitution(u: &Matrix, y: &[f64]) -> Result<Vec<f64>, String> {
    let n = u.cols;
    if u.rows < n || y.len() < n {
        return Err("U must have at least as many rows as columns".into());
    }
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        let s: f64 = (i + 1..n).map(|j| u[(i, j)] * x[j]).sum();
        if u[(i, i)] == 0.0 {
            return Err(format!("zero diagonal at row {}", i + 1));
        }
        x[i] = (y[i] - s) / u[(i, i)];
    }
    Ok(x)
}

/// 部分ピボット選択付き LU 分解 \(PA = LU\) の結果。
#[derive(Clone, Debug, PartialEq)]
pub struct Lu {
    /// 対角成分が 1 の下三角行列 \(L\)。対角より下は消去の乗数 \(l_{ik} = m_{ik}\)。
    pub l: Matrix,
    /// 上三角行列 \(U\)。前進消去を終えた係数行列。
    pub u: Matrix,
    /// 行の並び。\(PA\) の第 \(i\) 行は \(A\) の第 `perm[i]` 行。
    pub perm: Vec<usize>,
}

impl Lu {
    /// 置換行列 \(P\)。第 \(i\) 行の第 `perm[i]` 列だけが 1。
    pub fn permutation(&self) -> Matrix {
        let n = self.perm.len();
        let mut p = Matrix::zeros(n, n);
        for (i, &j) in self.perm.iter().enumerate() {
            p[(i, j)] = 1.0;
        }
        p
    }

    /// 並べ替えた右辺 \(P\mathbf{b}\)。
    pub fn permute(&self, b: &[f64]) -> Vec<f64> {
        self.perm.iter().map(|&j| b[j]).collect()
    }

    /// \(A\mathbf{x} = \mathbf{b}\) を、前進代入 \(L\mathbf{y} = P\mathbf{b}\) と後退代入 \(U\mathbf{x} = \mathbf{y}\) で解く。
    /// 返り値は \((P\mathbf{b}, \mathbf{y}, \mathbf{x})\)。
    pub fn solve(&self, b: &[f64]) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>), String> {
        let pb = self.permute(b);
        let y = forward_substitution(&self.l, &pb)?;
        let x = back_substitution(&self.u, &y)?;
        Ok((pb, y, x))
    }
}

/// 正方行列 \(A\) を、部分ピボット選択付きの Doolittle 法で \(PA = LU\) に分解します。
///
/// \(P\) は置換行列、\(L\) は対角成分が 1 の下三角行列、\(U\) は上三角行列です。
/// 第 \(k\) 段では、第 \(k\) 列の対角から下で絶対値が最大の行を第 \(k\) 行と入れ替え（\(L\) のすでに決まった列も同じ行を入れ替える）、
/// \[
/// l_{ik} = \frac{a^{(k)}_{ik}}{a^{(k)}_{kk}}, \qquad a^{(k+1)}_{ij} = a^{(k)}_{ij} - l_{ik} a^{(k)}_{kj} \quad (i, j > k)
/// \]
/// とします。\(a^{(k)}\) は第 \(k\) 段の前の係数で、\(U\) の第 \(k\) 行は \(a^{(k)}_{kj}\ (j \ge k)\) です。
/// 乗数 \(l_{ik}\) は [`gauss_eliminate`] の乗数と同じ数で、\(L\) はそれを対角の下に並べた行列です。
/// 軸がちょうど 0 のとき（\(A\) が特異）は誤りを返します。結果は丸めを含む近似値です。
pub fn lu_decompose(a: &Matrix) -> Result<Lu, String> {
    if !a.is_square() {
        return Err("A must be square".into());
    }
    let n = a.rows;
    let mut u = a.clone();
    let mut l = Matrix::zeros(n, n);
    let mut perm: Vec<usize> = (0..n).collect();
    for k in 0..n {
        let p = (k..n)
            .max_by(|&i, &j| u[(i, k)].abs().total_cmp(&u[(j, k)].abs()).then(j.cmp(&i)))
            .unwrap_or(k);
        if p != k {
            u.swap_rows(k, p);
            l.swap_rows(k, p);
            perm.swap(k, p);
        }
        let pivot = u[(k, k)];
        if pivot == 0.0 {
            return Err(format!("zero pivot at step {}", k + 1));
        }
        for i in k + 1..n {
            let factor = u[(i, k)] / pivot;
            l[(i, k)] = factor;
            u[(i, k)] = 0.0;
            for j in k + 1..n {
                u[(i, j)] -= factor * u[(k, j)];
            }
        }
    }
    for i in 0..n {
        l[(i, i)] = 1.0;
    }
    Ok(Lu { l, u, perm })
}

/// ベキ乗法の一つの反復。
#[derive(Clone, Debug, PartialEq)]
pub struct PowerStep {
    /// 長さ 1 に正規化した反復ベクトル \(\mathbf{x}_k\)。
    pub vector: Vec<f64>,
    /// Rayleigh 商による固有値の推定 \(\lambda^{(k)} = \mathbf{x}_k^T A \mathbf{x}_k\)。
    pub estimate: f64,
}

/// 正方行列 \(A\) の絶対値最大の固有値を、ベキ乗法で近似します。
///
/// 初期ベクトル \(\mathbf{x}_0\) を長さ 1 にし、\(k = 0, 1, \ldots\) について
/// \[
/// \mathbf{x}_{k+1} = \frac{A\mathbf{x}_k}{\|A\mathbf{x}_k\|}, \qquad \lambda^{(k)} = \frac{\mathbf{x}_k^T A \mathbf{x}_k}{\mathbf{x}_k^T \mathbf{x}_k}
/// \]
/// とします。\(\lambda^{(k)}\) は Rayleigh 商です。\(A\) の固有値が \(|\lambda_1| > |\lambda_2| \ge \cdots\) で、
/// \(\mathbf{x}_0\) が固有ベクトル \(\mathbf{v}_1\) の成分を持つとき、\(\mathbf{x}_k\) の向きは \(\mathbf{v}_1\) に近づき、
/// 誤差は1回の反復でおよそ \(|\lambda_2/\lambda_1|\) 倍になります。
/// 返り値は \(k = 0, 1, \ldots, N\) の \(N + 1\) 個です（\(N\) は `iterations`）。結果は近似値です。
pub fn power_iteration(a: &Matrix, x0: &[f64], iterations: usize) -> Result<Vec<PowerStep>, String> {
    if !a.is_square() || a.rows != x0.len() {
        return Err("A must be square and match x0".into());
    }
    let length = norm2(x0);
    if length == 0.0 {
        return Err("x0 must be nonzero".into());
    }
    let mut x: Vec<f64> = x0.iter().map(|v| v / length).collect();
    let mut steps = Vec::with_capacity(iterations + 1);
    for k in 0..=iterations {
        let ax = a.mul_vec(&x);
        steps.push(PowerStep { vector: x.clone(), estimate: dot(&x, &ax) });
        if k == iterations {
            break;
        }
        let length = norm2(&ax);
        if length == 0.0 {
            return Err("A x became zero".into());
        }
        x = ax.iter().map(|v| v / length).collect();
    }
    Ok(steps)
}

/// \(m \times n\) 行列 \(A\)（\(m \ge n\)、列は1次独立）を、修正 Gram–Schmidt 法で \(A = QR\) に分解します。
///
/// \(Q\) は正規直交な \(n\) 本の列を持つ \(m \times n\) 行列、\(R\) は対角成分が正の \(n \times n\) 上三角行列です。
/// 列 \(\mathbf{a}_j\) から、それまでの \(\mathbf{q}_i\) の成分を順に引きます。
/// \[
/// r_{ij} = \mathbf{q}_i^T \mathbf{w}, \quad \mathbf{w} \leftarrow \mathbf{w} - r_{ij}\mathbf{q}_i \ (i < j), \qquad r_{jj} = \|\mathbf{w}\|, \quad \mathbf{q}_j = \frac{\mathbf{w}}{r_{jj}}
/// \]
/// \(\mathbf{w}\) は \(\mathbf{a}_j\) から始めます。\(r_{jj} = 0\)（列が1次従属）のときは誤りを返します。
pub fn qr_gram_schmidt(a: &Matrix) -> Result<(Matrix, Matrix), String> {
    let (m, n) = (a.rows, a.cols);
    if m < n {
        return Err("A must have at least as many rows as columns".into());
    }
    let mut q_cols: Vec<Vec<f64>> = Vec::with_capacity(n);
    let mut r = Matrix::zeros(n, n);
    for j in 0..n {
        let mut w = a.column(j);
        for (i, q) in q_cols.iter().enumerate() {
            let rij = dot(q, &w);
            r[(i, j)] = rij;
            for (wk, qk) in w.iter_mut().zip(q) {
                *wk -= rij * qk;
            }
        }
        let rjj = norm2(&w);
        if rjj == 0.0 {
            return Err(format!("column {} is linearly dependent", j + 1));
        }
        r[(j, j)] = rjj;
        q_cols.push(w.iter().map(|v| v / rjj).collect());
    }
    Ok((Matrix::from_columns(&q_cols), r))
}

/// 正方行列 \(A\) に、シフトなしの QR 法を `iterations` 回行い、\(A_0, A_1, \ldots, A_N\) を返します。
///
/// \(A_0 = A\) とし、\(A_k\) を [`qr_gram_schmidt`] で \(A_k = Q_k R_k\) に分解して
/// \[
/// A_{k+1} = R_k Q_k = Q_k^T A_k Q_k
/// \]
/// とします。\(A_{k+1}\) は \(A_k\) と相似なので、固有値は変わりません。
/// 固有値の絶対値がすべて異なる実数 \(|\lambda_1| > |\lambda_2| > \cdots\) のとき、\(A_k\) は上三角行列に近づき、
/// 対角成分は \(\lambda_1, \lambda_2, \ldots\) に、成分 \((A_k)_{i+1,i}\) は \((\lambda_{i+1}/\lambda_i)^k\) の速さで 0 に近づきます。結果は近似値です。
pub fn qr_iteration(a: &Matrix, iterations: usize) -> Result<Vec<Matrix>, String> {
    if !a.is_square() {
        return Err("A must be square".into());
    }
    let mut out = Vec::with_capacity(iterations + 1);
    out.push(a.clone());
    for _ in 0..iterations {
        let (q, r) = qr_gram_schmidt(out.last().expect("one matrix"))?;
        out.push(r.mul(&q));
    }
    Ok(out)
}

/// 2行2列の行列の固有値を、特性方程式の解の公式で返します。
///
/// 特性方程式は
/// \[
/// \det(A - \lambda I) = \lambda^2 - (\operatorname{tr} A)\lambda + \det A = 0
/// \]
/// で、\(\operatorname{tr} A = a_{11} + a_{22}\)、\(\det A = a_{11}a_{22} - a_{12}a_{21}\) です。判別式 \(D = (\operatorname{tr} A)^2 - 4\det A \ge 0\) のとき、
/// \[
/// \lambda = \frac{\operatorname{tr} A \pm \sqrt{D}}{2}
/// \]
/// を大きい順に返します。\(D < 0\)（複素共役の固有値）のときは `None` です。
/// 成分が整数で \(D\) が平方数なら、返す値は厳密です。
pub fn eigenvalues_2x2(a: &Matrix) -> Option<[f64; 2]> {
    assert!(a.rows == 2 && a.cols == 2, "A must be 2x2");
    let tr = a[(0, 0)] + a[(1, 1)];
    let det = a[(0, 0)] * a[(1, 1)] - a[(0, 1)] * a[(1, 0)];
    let disc = tr * tr - 4.0 * det;
    if disc < 0.0 {
        return None;
    }
    let s = disc.sqrt();
    Some([(tr + s) / 2.0, (tr - s) / 2.0])
}

/// 2行2列の行列 \(A\) の固有値 \(\lambda\) に属する固有ベクトルを返します。
///
/// \((A - \lambda I)\mathbf{v} = \mathbf{0}\) の第1行は \((a_{11} - \lambda)v_1 + a_{12}v_2 = 0\) なので、
/// \(a_{12} \ne 0\) なら \(\mathbf{v} = (a_{12},\ \lambda - a_{11})^T\) です。
/// \(a_{12} = 0\) のときは第2行 \(a_{21}v_1 + (a_{22} - \lambda)v_2 = 0\) から \(\mathbf{v} = (\lambda - a_{22},\ a_{21})^T\) を使い、
/// それも零ベクトルなら \(A\) は対角なので、対応する単位ベクトルを返します。長さは正規化しません。
pub fn eigenvector_2x2(a: &Matrix, lambda: f64) -> [f64; 2] {
    assert!(a.rows == 2 && a.cols == 2, "A must be 2x2");
    if a[(0, 1)] != 0.0 {
        return [a[(0, 1)], lambda - a[(0, 0)]];
    }
    if a[(1, 0)] != 0.0 || lambda != a[(1, 1)] {
        let v = [lambda - a[(1, 1)], a[(1, 0)]];
        if v != [0.0, 0.0] {
            return v;
        }
    }
    if lambda == a[(0, 0)] { [1.0, 0.0] } else { [0.0, 1.0] }
}

/// 対称行列 \(S\) の固有値と固有ベクトルを、Jacobi 法で求めます。
///
/// 非対角成分 \(s_{pq}\) を消す平面回転 \(J\)（角 \(\theta\)、\(\tan 2\theta = 2s_{pq}/(s_{qq} - s_{pp})\)）で
/// \(S \leftarrow J^T S J\) を繰り返します。非対角成分の2乗和は毎回 \(2s_{pq}^2\) だけ減り、\(S\) は対角行列 \(\Lambda\) に近づきます。
/// 回転を掛け合わせた直交行列 \(V\) について \(S = V \Lambda V^T\) です。
/// 返り値は、大きい順の固有値と、それぞれの単位固有ベクトルを列に持つ \(V\) です。各列は最大成分が正になる向きにそろえます。
/// 結果は近似値で、非対角成分の2乗和が \(10^{-30}\) 倍以下になるまで回します。主成分分析の共分散行列にも使えます。
pub fn symmetric_eigen(s: &Matrix) -> Result<(Vec<f64>, Matrix), String> {
    if !s.is_square() {
        return Err("S must be square".into());
    }
    let n = s.rows;
    for i in 0..n {
        for j in 0..i {
            let scale = s[(i, j)].abs().max(s[(j, i)].abs()).max(1.0);
            if (s[(i, j)] - s[(j, i)]).abs() > 1e-12 * scale {
                return Err("S must be symmetric".into());
            }
        }
    }
    let mut a = s.clone();
    let mut v = Matrix::identity(n);
    let total: f64 = a.data.iter().map(|x| x * x).sum();
    for _sweep in 0..100 {
        let off: f64 = (0..n).flat_map(|i| (0..n).filter(move |&j| j != i).map(move |j| (i, j))).map(|(i, j)| a[(i, j)] * a[(i, j)]).sum();
        if off <= 1e-30 * total.max(f64::MIN_POSITIVE) {
            break;
        }
        for p in 0..n {
            for q in p + 1..n {
                let apq = a[(p, q)];
                if apq == 0.0 {
                    continue;
                }
                let theta = (a[(q, q)] - a[(p, p)]) / (2.0 * apq);
                let t = theta.signum() / (theta.abs() + (theta * theta + 1.0).sqrt());
                let t = if theta == 0.0 { 1.0 } else { t };
                let c = 1.0 / (t * t + 1.0).sqrt();
                let sn = t * c;
                for k in 0..n {
                    let akp = a[(k, p)];
                    let akq = a[(k, q)];
                    a[(k, p)] = c * akp - sn * akq;
                    a[(k, q)] = sn * akp + c * akq;
                }
                for k in 0..n {
                    let apk = a[(p, k)];
                    let aqk = a[(q, k)];
                    a[(p, k)] = c * apk - sn * aqk;
                    a[(q, k)] = sn * apk + c * aqk;
                }
                for k in 0..n {
                    let vkp = v[(k, p)];
                    let vkq = v[(k, q)];
                    v[(k, p)] = c * vkp - sn * vkq;
                    v[(k, q)] = sn * vkp + c * vkq;
                }
            }
        }
    }
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&i, &j| a[(j, j)].total_cmp(&a[(i, i)]));
    let values = order.iter().map(|&i| a[(i, i)]).collect();
    let columns: Vec<Vec<f64>> = order
        .iter()
        .map(|&j| {
            let col = v.column(j);
            let big = col.iter().copied().fold(0.0_f64, |m, x| if x.abs() > m.abs() { x } else { m });
            if big < 0.0 { col.iter().map(|x| -x).collect() } else { col }
        })
        .collect();
    Ok((values, Matrix::from_columns(&columns)))
}

/// 行列 \(A\) の特異値 \(\sigma_1 \ge \sigma_2 \ge \cdots \ge 0\) を、片側 Jacobi 法で求めます。
///
/// 特異値は \(A^T A\) の固有値の平方根です。\(A^T A\) を作らず、\(A\) の2本の列 \(\mathbf{a}_p, \mathbf{a}_q\) に平面回転
/// \[
/// \begin{pmatrix} \mathbf{a}_p' & \mathbf{a}_q' \end{pmatrix} = \begin{pmatrix} \mathbf{a}_p & \mathbf{a}_q \end{pmatrix} \begin{pmatrix} c & s \\ -s & c \end{pmatrix}, \qquad \mathbf{a}_p'^T \mathbf{a}_q' = 0
/// \]
/// を掛けて、すべての列が直交するまで繰り返します。回転は直交行列なので特異値を変えず、
/// 直交した列の長さ \(\|\mathbf{a}_j\|\) が特異値です。\(A^T A\) の条件数が大きい行列でも小さい特異値を失いにくい方法です。
/// 列が行より多いときは \(A^T\) に行います。結果は近似値です。
pub fn singular_values(a: &Matrix) -> Vec<f64> {
    let mut u = if a.rows >= a.cols { a.clone() } else { a.transpose() };
    let (m, n) = (u.rows, u.cols);
    for _sweep in 0..60 {
        let mut rotated = false;
        for p in 0..n {
            for q in p + 1..n {
                let (mut alpha, mut beta, mut gamma) = (0.0, 0.0, 0.0);
                for k in 0..m {
                    alpha += u[(k, p)] * u[(k, p)];
                    beta += u[(k, q)] * u[(k, q)];
                    gamma += u[(k, p)] * u[(k, q)];
                }
                if gamma == 0.0 || gamma.abs() <= 1e-15 * (alpha * beta).sqrt() {
                    continue;
                }
                rotated = true;
                let zeta = (beta - alpha) / (2.0 * gamma);
                let t = zeta.signum() / (zeta.abs() + (1.0 + zeta * zeta).sqrt());
                let c = 1.0 / (1.0 + t * t).sqrt();
                let s = c * t;
                for k in 0..m {
                    let (up, uq) = (u[(k, p)], u[(k, q)]);
                    u[(k, p)] = c * up - s * uq;
                    u[(k, q)] = s * up + c * uq;
                }
            }
        }
        if !rotated {
            break;
        }
    }
    let mut sigma: Vec<f64> = (0..n).map(|j| norm2(&u.column(j))).collect();
    sigma.sort_by(|x, y| y.total_cmp(x));
    sigma
}

/// 行列 \(A\) の2ノルムの条件数 \(\kappa_2(A) = \sigma_{\max}/\sigma_{\min}\) を返します。
///
/// \(\sigma\) は \(A\) の特異値です（[`singular_values`]）。
/// 条件数は、右辺や係数の相対的な誤差が解の相対誤差として何倍まで大きくなりうるかの目安です。
/// \(A^T A\) の条件数は \(\kappa_2(A^T A) = \kappa_2(A)^2\) です。最小の特異値が 0 のときは無限大を返します。結果は近似値です。
pub fn condition_number(a: &Matrix) -> f64 {
    let sigma = singular_values(a);
    let max = sigma.first().copied().unwrap_or(0.0);
    let min = sigma.last().copied().unwrap_or(0.0);
    if min == 0.0 { f64::INFINITY } else { max / min }
}

/// 正定値対称行列 \(S\) を Cholesky 分解 \(S = GG^T\) します（\(G\) は対角成分が正の下三角行列）。
///
/// \[
/// g_{jj} = \sqrt{s_{jj} - \sum_{k<j} g_{jk}^2}, \qquad g_{ij} = \frac{1}{g_{jj}}\left(s_{ij} - \sum_{k<j} g_{ik} g_{jk}\right) \quad (i > j)
/// \]
/// 根号の中が正でないとき（正定値でない）は誤りを返します。
pub fn cholesky(s: &Matrix) -> Result<Matrix, String> {
    if !s.is_square() {
        return Err("S must be square".into());
    }
    let n = s.rows;
    let mut g = Matrix::zeros(n, n);
    for j in 0..n {
        let d = s[(j, j)] - (0..j).map(|k| g[(j, k)] * g[(j, k)]).sum::<f64>();
        if d <= 0.0 {
            return Err(format!("matrix is not positive definite at column {}", j + 1));
        }
        g[(j, j)] = d.sqrt();
        for i in j + 1..n {
            g[(i, j)] = (s[(i, j)] - (0..j).map(|k| g[(i, k)] * g[(j, k)]).sum::<f64>()) / g[(j, j)];
        }
    }
    Ok(g)
}

/// 正規方程式の係数 \((A^T A,\ A^T\mathbf{b})\) を返します。
///
/// \(A\) は \(m \times n\) の計画行列、\(\mathbf{b}\) は長さ \(m\) の観測値です。成分は
/// \[
/// (A^T A)_{jk} = \sum_{i=1}^{m} a_{ij} a_{ik}, \qquad (A^T\mathbf{b})_j = \sum_{i=1}^{m} a_{ij} b_i
/// \]
/// です。成分が整数なら、返す値は厳密です。
pub fn normal_equations(a: &Matrix, b: &[f64]) -> (Matrix, Vec<f64>) {
    let at = a.transpose();
    (at.mul(a), at.mul_vec(b))
}

/// 過剰決定系 \(A\mathbf{x} \approx \mathbf{b}\) の最小二乗解を、正規方程式 \(A^T A\mathbf{x} = A^T\mathbf{b}\) で求めます。
///
/// \(A^T A\) は列が1次独立なら正定値対称なので、[`cholesky`] で \(A^T A = GG^T\) とし、
/// 前進代入 \(G\mathbf{z} = A^T\mathbf{b}\) と後退代入 \(G^T\mathbf{x} = \mathbf{z}\) で解きます。
/// \(A^T A\) の条件数は \(A\) の条件数の2乗なので、列が1次従属に近いと誤差が大きくなります。結果は近似値です。
pub fn least_squares_normal(a: &Matrix, b: &[f64]) -> Result<Vec<f64>, String> {
    let (ata, atb) = normal_equations(a, b);
    let g = cholesky(&ata)?;
    let z = forward_substitution(&g, &atb)?;
    back_substitution(&g.transpose(), &z)
}

/// Householder 変換による QR 分解の結果。
#[derive(Clone, Debug, PartialEq)]
pub struct HouseholderQr {
    /// \(m \times m\) の直交行列 \(Q = H_1 H_2 \cdots H_n\)。
    pub q: Matrix,
    /// \(m \times n\) の上三角行列 \(R = Q^T A\)。第 \(n+1\) 行から下は 0。
    pub r: Matrix,
}

/// \(m \times n\) 行列 \(A\)（\(m \ge n\)）を Householder 変換で \(A = QR\) に分解します。
///
/// 第 \(k\) 段では、いまの第 \(k\) 列の対角から下の部分 \(\mathbf{x}\) を、\(\alpha = -\operatorname{sign}(x_1)\|\mathbf{x}\|\) として
/// \[
/// \mathbf{v} = \mathbf{x} - \alpha\mathbf{e}_1, \qquad H_k = I - 2\frac{\mathbf{v}\mathbf{v}^T}{\mathbf{v}^T\mathbf{v}}
/// \]
/// の鏡映 \(H_k\) で \(\alpha\mathbf{e}_1\) に写します。\(H_k\) は対称な直交行列で、長さを変えません。
/// \(R = H_n \cdots H_1 A\)、\(Q = H_1 \cdots H_n\) です。符号の選び方は、\(\mathbf{v}\) の計算で近い数どうしの引き算を避けるためです。
pub fn householder_qr(a: &Matrix) -> Result<HouseholderQr, String> {
    let (m, n) = (a.rows, a.cols);
    if m < n {
        return Err("A must have at least as many rows as columns".into());
    }
    let mut r = a.clone();
    let mut q = Matrix::identity(m);
    for k in 0..n.min(m - 1) {
        let x: Vec<f64> = (k..m).map(|i| r[(i, k)]).collect();
        let length = norm2(&x);
        if length == 0.0 {
            continue;
        }
        let alpha = if x[0] > 0.0 { -length } else { length };
        let mut v = x;
        v[0] -= alpha;
        let vv = dot(&v, &v);
        if vv == 0.0 {
            continue;
        }
        for j in 0..n {
            let s: f64 = (k..m).map(|i| v[i - k] * r[(i, j)]).sum::<f64>() * 2.0 / vv;
            for i in k..m {
                r[(i, j)] -= s * v[i - k];
            }
        }
        for i in k + 1..m {
            r[(i, k)] = 0.0;
        }
        for i in 0..m {
            let s: f64 = (k..m).map(|j| q[(i, j)] * v[j - k]).sum::<f64>() * 2.0 / vv;
            for j in k..m {
                q[(i, j)] -= s * v[j - k];
            }
        }
    }
    Ok(HouseholderQr { q, r })
}

/// QR 分解による最小二乗解の結果。
#[derive(Clone, Debug, PartialEq)]
pub struct QrLeastSquares {
    /// \(R\) の上の \(n \times n\) の上三角部分 \(R_1\)。
    pub r: Matrix,
    /// \(Q^T\mathbf{b}\)（長さ \(m\)）。上の \(n\) 個が \(R_1\mathbf{x}\) の右辺、残りの2乗和が最小の残差の2乗 \(\|\mathbf{r}\|^2\)。
    pub qtb: Vec<f64>,
    /// 最小二乗解 \(\mathbf{x}\)。
    pub solution: Vec<f64>,
}

/// 過剰決定系 \(A\mathbf{x} \approx \mathbf{b}\) の最小二乗解を、Householder 変換の QR 分解で求めます。
///
/// \(A = QR\)（[`householder_qr`]）で \(Q\) は直交なので、長さを変えずに
/// \[
/// \|\mathbf{b} - A\mathbf{x}\|^2 = \|Q^T\mathbf{b} - R\mathbf{x}\|^2 = \|\mathbf{c}_1 - R_1\mathbf{x}\|^2 + \|\mathbf{c}_2\|^2
/// \]
/// と書けます。\(\mathbf{c}_1\) は \(Q^T\mathbf{b}\) の上の \(n\) 個、\(\mathbf{c}_2\) は残りの \(m - n\) 個、\(R_1\) は \(R\) の上の \(n \times n\) です。
/// 第1項は後退代入 \(R_1\mathbf{x} = \mathbf{c}_1\) で 0 にでき、そのとき最小値 \(\|\mathbf{c}_2\|^2\) をとります。
/// \(A^T A\) を作らないので、解く行列の条件数は \(\kappa_2(R_1) = \kappa_2(A)\) のままです。結果は近似値です。
pub fn least_squares_qr(a: &Matrix, b: &[f64]) -> Result<QrLeastSquares, String> {
    if a.rows != b.len() {
        return Err("b must have one entry per row of A".into());
    }
    let HouseholderQr { q, r } = householder_qr(a)?;
    let qtb = q.transpose().mul_vec(b);
    let n = a.cols;
    let mut r1 = Matrix::zeros(n, n);
    for i in 0..n {
        for j in 0..n {
            r1[(i, j)] = r[(i, j)];
        }
    }
    let solution = back_substitution(&r1, &qtb[..n])?;
    Ok(QrLeastSquares { r: r1, qtb, solution })
}

/// 点 \((t_i, b_i)\) に直線 \(b = c_0 + c_1 t\) を当てはめるときの計画行列 \(A\) を返します。
///
/// 第 \(i\) 行は \((1,\ t_i)\) で、\(A\mathbf{c} = (c_0 + c_1 t_i)_i\) は直線の各点の値です。
pub fn line_design(t: &[f64]) -> Matrix {
    Matrix::new(t.len(), 2, t.iter().flat_map(|&ti| [1.0, ti]).collect())
}

/// 直線 \(b = c_0 + c_1 t\) の最小二乗の係数を、平均からの偏差の式で返します。
///
/// \(\bar t = \frac{1}{m}\sum t_i\)、\(\bar b = \frac{1}{m}\sum b_i\) として、正規方程式を解いた式は
/// \[
/// c_1 = \frac{\sum_i (t_i - \bar t)(b_i - \bar b)}{\sum_i (t_i - \bar t)^2}, \qquad c_0 = \bar b - c_1 \bar t
/// \]
/// です。\(t_i - \bar t\) を先に引くので、\(t_i\) が大きな数だけずれていても桁を失いません。
/// \(t_i\) がすべて等しいときは `None` です。
pub fn line_fit_centered(t: &[f64], b: &[f64]) -> Option<(f64, f64)> {
    assert_eq!(t.len(), b.len(), "t and b must have the same length");
    let m = t.len() as f64;
    if t.is_empty() {
        return None;
    }
    let tm = t.iter().sum::<f64>() / m;
    let bm = b.iter().sum::<f64>() / m;
    let stt: f64 = t.iter().map(|ti| (ti - tm) * (ti - tm)).sum();
    if stt == 0.0 {
        return None;
    }
    let stb: f64 = t.iter().zip(b).map(|(ti, bi)| (ti - tm) * (bi - bm)).sum();
    let c1 = stb / stt;
    Some((bm - c1 * tm, c1))
}

/// 平面の直線 \(a_1 x + a_2 y = c\) の上の点を、区間 \([x_0, x_1]\) の両端で返します。
///
/// \(a_2 \ne 0\) なら \(y = (c - a_1 x)/a_2\) です。\(a_2 = 0\) なら直線は \(x = c/a_1\) の縦線で、
/// \(y\) を区間 \([x_0, x_1]\) の両端にとった2点を返します。\(a_1 = a_2 = 0\) のときは `None` です。
/// 3元の連立方程式の各平面を \(z = z^*\) で切った切り口にも使います（\(c = b_i - a_{i3} z^*\)）。
pub fn line_endpoints(a1: f64, a2: f64, c: f64, x0: f64, x1: f64) -> Option<[(f64, f64); 2]> {
    if a2 != 0.0 {
        Some([(x0, (c - a1 * x0) / a2), (x1, (c - a1 * x1) / a2)])
    } else if a1 != 0.0 {
        Some([(c / a1, x0), (c / a1, x1)])
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() <= tol
    }

    fn example() -> (Matrix, Vec<f64>) {
        (
            Matrix::from_rows(&[&[2.0, 1.0, -1.0], &[-3.0, -1.0, 2.0], &[-2.0, 1.0, 2.0]]),
            vec![8.0, -11.0, -3.0],
        )
    }

    #[test]
    fn elimination_without_pivoting_matches_the_hand_steps() {
        let (a, b) = example();
        let e = gauss_eliminate(&a, &b, Pivoting::None).unwrap();
        let m: Vec<f64> = e.operations.iter().map(|o| o.multiplier).collect();
        assert_eq!(m, vec![-1.5, -1.0, 4.0]);
        assert_eq!(e.upper.data, vec![2.0, 1.0, -1.0, 8.0, 0.0, 0.5, 0.5, 1.0, 0.0, 0.0, -1.0, 1.0]);
        assert_eq!(e.solution, vec![2.0, 3.0, -1.0]);
        assert_eq!(residual_norm(&a, &e.solution, &b), 0.0);
    }

    #[test]
    fn partial_pivoting_swaps_rows_and_solves() {
        let (a, b) = example();
        let e = gauss_eliminate(&a, &b, Pivoting::Partial).unwrap();
        assert_eq!(e.swaps, vec![(0, 1), (1, 2)]);
        for (x, want) in e.solution.iter().zip([2.0, 3.0, -1.0]) {
            assert!(close(*x, want, 1e-14));
        }
        assert!(residual_norm(&a, &e.solution, &b) < 1e-13);
        assert!(e.operations.iter().all(|o| o.multiplier.abs() <= 1.0));
    }

    #[test]
    fn small_pivot_breaks_elimination_without_pivoting() {
        let eps = 1e-17;
        let a = Matrix::from_rows(&[&[eps, 1.0], &[1.0, 1.0]]);
        let b = [1.0, 2.0];
        let plain = gauss_eliminate(&a, &b, Pivoting::None).unwrap();
        assert_eq!(plain.solution, vec![0.0, 1.0]);
        assert_eq!(residual_norm(&a, &plain.solution, &b), 1.0);
        let pivoted = gauss_eliminate(&a, &b, Pivoting::Partial).unwrap();
        assert_eq!(pivoted.solution, vec![1.0, 1.0]);
        assert_eq!(cramer_2x2(&a, &b), Some([1.0, 1.0]));
    }

    #[test]
    fn lu_of_the_example_has_the_hand_factors() {
        let (a, b) = example();
        let lu = lu_decompose(&a).unwrap();
        assert_eq!(lu.perm, vec![1, 2, 0]);
        let l = [1.0, 0.0, 0.0, 2.0 / 3.0, 1.0, 0.0, -2.0 / 3.0, 0.2, 1.0];
        let u = [-3.0, -1.0, 2.0, 0.0, 5.0 / 3.0, 2.0 / 3.0, 0.0, 0.0, 0.2];
        for (x, y) in lu.l.data.iter().zip(l) {
            assert!(close(*x, y, 1e-15));
        }
        for (x, y) in lu.u.data.iter().zip(u) {
            assert!(close(*x, y, 1e-15));
        }
        let pa = lu.permutation().mul(&a);
        let prod = lu.l.mul(&lu.u);
        for (x, y) in pa.data.iter().zip(&prod.data) {
            assert!(close(*x, *y, 1e-14));
        }
        let (pb, y, x) = lu.solve(&b).unwrap();
        assert_eq!(pb, vec![-11.0, -3.0, 8.0]);
        for (v, want) in y.iter().zip([-11.0, 13.0 / 3.0, -0.2]) {
            assert!(close(*v, want, 1e-14));
        }
        for (v, want) in x.iter().zip([2.0, 3.0, -1.0]) {
            assert!(close(*v, want, 1e-14));
        }
    }

    #[test]
    fn eigen_2x2_is_exact_for_the_example() {
        let a = Matrix::from_rows(&[&[1.0, 1.0], &[4.0, 1.0]]);
        assert_eq!(eigenvalues_2x2(&a), Some([3.0, -1.0]));
        assert_eq!(eigenvector_2x2(&a, 3.0), [1.0, 2.0]);
        assert_eq!(eigenvector_2x2(&a, -1.0), [1.0, -2.0]);
        assert_eq!(eigenvalues_2x2(&Matrix::from_rows(&[&[0.0, -1.0], &[1.0, 0.0]])), None);
    }

    #[test]
    fn power_iteration_follows_the_hand_iterates() {
        let a = Matrix::from_rows(&[&[1.0, 1.0], &[4.0, 1.0]]);
        let steps = power_iteration(&a, &[1.0, 1.0], 40).unwrap();
        assert!(close(steps[0].estimate, 3.5, 1e-15));
        assert!(close(steps[1].estimate, 79.0 / 29.0, 1e-14));
        let s = 29f64.sqrt();
        assert!(close(steps[1].vector[0], 2.0 / s, 1e-15) && close(steps[1].vector[1], 5.0 / s, 1e-15));
        assert!(close(steps[40].estimate, 3.0, 1e-12));
        let v = &steps[40].vector;
        assert!(close(v[1] / v[0], 2.0, 1e-12));
    }

    #[test]
    fn qr_iteration_first_step_and_limit() {
        let a = Matrix::from_rows(&[&[1.0, 1.0], &[4.0, 1.0]]);
        let (q, r) = qr_gram_schmidt(&a).unwrap();
        let s = 17f64.sqrt();
        assert!(close(r[(0, 0)], s, 1e-14) && close(r[(0, 1)], 5.0 / s, 1e-14) && close(r[(1, 1)], 3.0 / s, 1e-14));
        assert!(close(q.transpose().mul(&q)[(0, 1)], 0.0, 1e-15));
        let iterates = qr_iteration(&a, 40).unwrap();
        let a1 = &iterates[1];
        for (x, want) in a1.data.iter().zip([37.0 / 17.0, 63.0 / 17.0, 12.0 / 17.0, -3.0 / 17.0]) {
            assert!(close(*x, want, 1e-14));
        }
        let last = &iterates[40];
        assert!(close(last[(0, 0)], 3.0, 1e-12) && close(last[(1, 1)], -1.0, 1e-12) && last[(1, 0)].abs() < 1e-12);
    }

    #[test]
    fn jacobi_and_condition_number() {
        let s = Matrix::from_rows(&[&[5.0, 10.0], &[10.0, 30.0]]);
        let (values, v) = symmetric_eigen(&s).unwrap();
        let root = 1025f64.sqrt();
        assert!(close(values[0], (35.0 + root) / 2.0, 1e-12) && close(values[1], (35.0 - root) / 2.0, 1e-12));
        let back = v.mul(&Matrix::from_rows(&[&[values[0], 0.0], &[0.0, values[1]]])).mul(&v.transpose());
        for (x, y) in back.data.iter().zip(&s.data) {
            assert!(close(*x, *y, 1e-12));
        }
        let three = Matrix::from_rows(&[&[4.0, 1.0, 0.0], &[1.0, 3.0, 1.0], &[0.0, 1.0, 2.0]]);
        let (values, _) = symmetric_eigen(&three).unwrap();
        assert!(close(values.iter().sum::<f64>(), 9.0, 1e-12));
        assert!(close(values[1], 3.0, 1e-12));
        let a = line_design(&[0.0, 1.0, 2.0, 3.0, 4.0]);
        let ka = condition_number(&a);
        let kn = condition_number(&s);
        assert!(close(kn, ka * ka, 1e-10));
        assert!(close(kn, (35.0 + root) / (35.0 - root), 1e-12));
        let sigma = singular_values(&a);
        assert!(close(sigma[0] * sigma[0], (35.0 + root) / 2.0, 1e-12));
        let shifted = line_design(&[1e5, 1e5 + 1.0, 1e5 + 2.0, 1e5 + 3.0, 1e5 + 4.0]);
        let sigma = singular_values(&shifted);
        assert!(close(sigma[0] * sigma[1], 50f64.sqrt(), 1e-6 * 50f64.sqrt()));
    }

    #[test]
    fn least_squares_line_both_ways() {
        let t = [0.0, 1.0, 2.0, 3.0, 4.0];
        let b = [1.0, 2.0, 2.0, 4.0, 5.0];
        let a = line_design(&t);
        let (ata, atb) = normal_equations(&a, &b);
        assert_eq!(ata.data, vec![5.0, 10.0, 10.0, 30.0]);
        assert_eq!(atb, vec![14.0, 38.0]);
        let x = least_squares_normal(&a, &b).unwrap();
        assert!(close(x[0], 0.8, 1e-14) && close(x[1], 1.0, 1e-14));
        let qr = least_squares_qr(&a, &b).unwrap();
        assert!(close(qr.solution[0], 0.8, 1e-14) && close(qr.solution[1], 1.0, 1e-14));
        let r2: f64 = qr.qtb[2..].iter().map(|c| c * c).sum();
        assert!(close(r2, 0.8, 1e-13));
        let rt = qr.r.transpose().mul(&qr.r);
        for (u, v) in rt.data.iter().zip(&ata.data) {
            assert!(close(*u, *v, 1e-12));
        }
        let res = residual(&a, &x, &b);
        let atr = a.transpose().mul_vec(&res);
        assert!(norm2(&atr) < 1e-13);
        let h = householder_qr(&a).unwrap();
        let qtq = h.q.transpose().mul(&h.q);
        for i in 0..5 {
            for j in 0..5 {
                assert!(close(qtq[(i, j)], if i == j { 1.0 } else { 0.0 }, 1e-14));
            }
        }
    }

    #[test]
    fn centered_fit_and_shifted_data() {
        let b = [1.0, 2.0, 2.0, 4.0, 5.0];
        let (c0, c1) = line_fit_centered(&[0.0, 1.0, 2.0, 3.0, 4.0], &b).unwrap();
        assert!(close(c0, 0.8, 1e-15) && c1 == 1.0);
        let t: Vec<f64> = (0..5).map(|i| 1e5 + i as f64).collect();
        let (c0, c1) = line_fit_centered(&t, &b).unwrap();
        assert!(close(c0, 0.8 - 1e5, 1e-9) && c1 == 1.0);
        let a = line_design(&t);
        let qr = least_squares_qr(&a, &b).unwrap();
        let normal = least_squares_normal(&a, &b).unwrap();
        assert!((qr.solution[1] - 1.0).abs() < 1e-10);
        assert!((normal[1] - 1.0).abs() > 100.0 * (qr.solution[1] - 1.0).abs());
    }

    #[test]
    fn plane_traces_meet_at_the_solution() {
        let (a, b) = example();
        let z = -1.0;
        for i in 0..3 {
            let [p, q] = line_endpoints(a[(i, 0)], a[(i, 1)], b[i] - a[(i, 2)] * z, 0.0, 4.0).unwrap();
            let y_at_2 = p.1 + (q.1 - p.1) * (2.0 - p.0) / (q.0 - p.0);
            assert!(close(y_at_2, 3.0, 1e-14));
        }
        assert_eq!(line_endpoints(2.0, 0.0, 4.0, -1.0, 1.0), Some([(2.0, -1.0), (2.0, 1.0)]));
    }

    #[test]
    fn cholesky_of_normal_matrix() {
        let g = cholesky(&Matrix::from_rows(&[&[5.0, 10.0], &[10.0, 30.0]])).unwrap();
        assert!(close(g[(0, 0)], 5f64.sqrt(), 1e-15) && close(g[(1, 0)], 2.0 * 5f64.sqrt(), 1e-14) && close(g[(1, 1)], 10f64.sqrt(), 1e-14));
        assert!(cholesky(&Matrix::from_rows(&[&[1.0, 2.0], &[2.0, 1.0]])).is_err());
    }
}
