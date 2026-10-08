import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

const names: Record<string, string> = { 'crank-nicolson': '陰解法（Crank–Nicolson）', explicit: '陽解法' };

renderLesson({
  id: 'black-scholes',
  section: { label: '金融数学' },
  title: 'Black–Scholes 方程式',
  description: `株価が幾何 Brownian 運動に従うとき、欧州型コールオプションの価格 ${tex('V(S, t)')} が満たす偏微分方程式です。変数変換で熱伝導方程式に直して Black–Scholes 公式を導き、同じ熱伝導方程式を差分法で解いた値と比べます。`,
  equation: [
    String.raw`\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2} + rS\frac{\partial V}{\partial S} - rV = 0`,
    String.raw`C(S, t) = S\,N(d_1) - K e^{-r(T - t)}N(d_2)`,
  ],
  equationLabel: 'Black–Scholes 方程式。V の t 偏微分 足す 2分の1 シグマ2乗 S2乗 V の S 2階偏微分 足す r S V の S 偏微分 引く r V は 0。コールの価格は S N(d1) 引く K e のマイナス r (T − t) 乗 N(d2)。',
  equationNote: `${tex(String.raw`d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)(T - t)}{\sigma\sqrt{T - t}}`)}、${tex(String.raw`d_2 = d_1 - \sigma\sqrt{T - t}`)}`,
  studyHeading: '複製の議論から熱伝導方程式と Black–Scholes 公式への手順',
  steps: [
    `記号を定めます。${tex('S')} は原資産（株）の価格、${tex('t')} は時刻、${tex('T')} は満期、${tex('K > 0')} は権利行使価格、${tex('r')} は無リスク金利、${tex(String.raw`\sigma > 0`)} はボラティリティです。株価は幾何 Brownian 運動 ${tex(String.raw`dS = \mu S\,dt + \sigma S\,dW`)} に従うとします。${tex('V(S, t)')} はオプションの価格で、欧州型コールは満期に ${tex(String.raw`V(S, T) = \max(S - K, 0)`)} を支払います。Itô の補題により
      ${eq(String.raw`dV = \left(\frac{\partial V}{\partial t} + \mu S\frac{\partial V}{\partial S} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2}\right)dt + \sigma S\frac{\partial V}{\partial S}\,dW`)}
      です。`,
    `オプションを1単位持ち、株を ${tex(String.raw`\Delta`)} 単位売った組 ${tex(String.raw`\Pi = V - \Delta S`)} を考えます。短い時間の変化は
      ${eq(String.raw`d\Pi = dV - \Delta\,dS = \left(\frac{\partial V}{\partial t} + \mu S\frac{\partial V}{\partial S} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2} - \Delta\mu S\right)dt + \sigma S\left(\frac{\partial V}{\partial S} - \Delta\right)dW`)}
      です。${tex(String.raw`\Delta = \partial V/\partial S`)} と選ぶと ${tex('dW')} の項が消え、${tex('dt')} の項の ${tex(String.raw`\mu S\frac{\partial V}{\partial S} - \Delta\mu S`)} も 0 になるので
      ${eq(String.raw`d\Pi = \left(\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2}\right)dt`)}
      となり、揺らぎのない資産になります。裁定（元手なしで確実に利益を得る取引）がないなら、この組は無リスク金利で増えるので
      ${eq(String.raw`d\Pi = r\Pi\,dt = r\left(V - S\frac{\partial V}{\partial S}\right)dt`)}
      です。二つの式の ${tex('dt')} の係数を等しいとおきます。
      ${eq(String.raw`\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2} = rV - rS\frac{\partial V}{\partial S}`)}
      右辺を左辺へ移項すると
      ${eq(String.raw`\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2\frac{\partial^2 V}{\partial S^2} + rS\frac{\partial V}{\partial S} - rV = 0`)}
      で、ページの上の Black–Scholes 方程式です。ドリフト率 ${tex(String.raw`\mu`)} は式に残りません。`,
    `変数を ${tex(String.raw`x = \ln(S/K)`)}、${tex(String.raw`\tau = \frac{1}{2}\sigma^2(T - t)`)}、${tex('V = K\\,v(x, \\tau)')} と変えます。${tex(String.raw`\tau`)} は満期から測った時間で、${tex('t = T')} が ${tex(String.raw`\tau = 0`)} です。添字 ${tex(String.raw`v_\tau, v_x, v_{xx}`)} は ${tex(String.raw`\tau`)}、${tex('x')} による偏微分を表します。新しい変数の微分は
      ${eq(String.raw`\frac{d\tau}{dt} = -\frac{1}{2}\sigma^2, \qquad \frac{dx}{dS} = \frac{d}{dS}\left(\ln S - \ln K\right) = \frac{1}{S}`)}
      です。合成関数の微分で
      ${eq(String.raw`\frac{\partial V}{\partial t} = K\frac{\partial v}{\partial \tau}\frac{d\tau}{dt} = -\frac{1}{2}\sigma^2 K\,v_\tau`)}
      ${eq(String.raw`\frac{\partial V}{\partial S} = K v_x\frac{dx}{dS} = \frac{K}{S}v_x`)}
      2階の微分は、積 ${tex(String.raw`\frac{K}{S}\cdot v_x`)} の微分で、${tex(String.raw`\frac{\partial v_x}{\partial S} = v_{xx}\frac{dx}{dS} = \frac{1}{S}v_{xx}`)} を使います。
      ${eq(String.raw`\frac{\partial^2 V}{\partial S^2} = \frac{\partial}{\partial S}\left(\frac{K}{S}v_x\right) = -\frac{K}{S^2}v_x + \frac{K}{S}\cdot\frac{1}{S}v_{xx} = \frac{K}{S^2}\left(v_{xx} - v_x\right)`)}
      です。方程式に代入すると
      ${eq(String.raw`-\frac{1}{2}\sigma^2 K v_\tau + \frac{1}{2}\sigma^2 S^2\cdot\frac{K}{S^2}\left(v_{xx} - v_x\right) + rS\cdot\frac{K}{S}v_x - rK v = 0`)}
      で、${tex('S')} が約分されて
      ${eq(String.raw`-\frac{1}{2}\sigma^2 K v_\tau + \frac{1}{2}\sigma^2 K\left(v_{xx} - v_x\right) + rK v_x - rK v = 0`)}
      です。${tex(String.raw`\frac{1}{2}\sigma^2 K`)} で割り、${tex(String.raw`k = 2r/\sigma^2`)} と置くと
      ${eq(String.raw`-v_\tau + v_{xx} - v_x + k v_x - k v = 0`)}
      ${eq(String.raw`v_\tau = v_{xx} + (k - 1)v_x - k v`)}
      です。満期の条件は、${tex(String.raw`S = Ke^x`)} を ${tex(String.raw`V(S, T) = \max(S - K, 0)`)} に入れて
      ${eq(String.raw`K v(x, 0) = \max(Ke^x - K, 0), \qquad v(x, 0) = \max(e^x - 1, 0)`)}
      になります。`,
    `残った1階の項と0階の項を消すため、定数 ${tex(String.raw`\alpha`)}、${tex(String.raw`\beta`)} と新しい未知関数 ${tex(String.raw`u(x, \tau)`)} を使って ${tex(String.raw`v = e^{-\alpha x - \beta\tau}u(x, \tau)`)} と置きます。${tex(String.raw`E = e^{-\alpha x - \beta\tau}`)} と書くと ${tex(String.raw`E_\tau = -\beta E`)}、${tex(String.raw`E_x = -\alpha E`)} なので、積の微分により
      ${eq(String.raw`v_\tau = E\left(u_\tau - \beta u\right)`)}
      ${eq(String.raw`v_x = E\left(u_x - \alpha u\right)`)}
      ${eq(String.raw`v_{xx} = -\alpha E\left(u_x - \alpha u\right) + E\left(u_{xx} - \alpha u_x\right) = E\left(u_{xx} - 2\alpha u_x + \alpha^2 u\right)`)}
      です。これらを ${tex(String.raw`v_\tau = v_{xx} + (k - 1)v_x - k v`)} に代入して、0 でない共通の因子 ${tex('E')} で割ると
      ${eq(String.raw`u_\tau - \beta u = u_{xx} - 2\alpha u_x + \alpha^2 u + (k - 1)(u_x - \alpha u) - k u`)}
      括弧を外すと
      ${eq(String.raw`u_\tau = u_{xx} - 2\alpha u_x + (k - 1)u_x + \beta u + \alpha^2 u - (k - 1)\alpha u - k u`)}
      で、${tex('u_x')} と ${tex('u')} の項をまとめると
      ${eq(String.raw`u_\tau = u_{xx} + \left[(k - 1) - 2\alpha\right]u_x + \left[\beta + \alpha^2 - (k - 1)\alpha - k\right]u`)}
      です。${tex(String.raw`\alpha = \frac{k - 1}{2}`)} と選ぶと ${tex('u_x')} の係数は 0 です。このとき ${tex(String.raw`\alpha^2 = \frac{(k-1)^2}{4}`)}、${tex(String.raw`(k - 1)\alpha = \frac{(k-1)^2}{2}`)} なので、${tex('u')} の係数は
      ${eq(String.raw`\beta + \frac{(k-1)^2}{4} - \frac{(k-1)^2}{2} - k = \beta - \frac{(k-1)^2 + 4k}{4} = \beta - \frac{k^2 + 2k + 1}{4} = \beta - \frac{(k + 1)^2}{4}`)}
      です。${tex(String.raw`\beta = \frac{(k + 1)^2}{4}`)} と選ぶと ${tex('u')} の係数も 0 になり、初期値は ${tex(String.raw`u(x, 0) = e^{\alpha x}v(x, 0)`)} と ${tex(String.raw`\alpha + 1 = \frac{k + 1}{2}`)} から
      ${eq(String.raw`u(x, 0) = e^{\alpha x}\max(e^x - 1, 0) = \max\left(e^{(\alpha + 1)x} - e^{\alpha x},\ 0\right) = \max\left(e^{(k+1)x/2} - e^{(k-1)x/2},\ 0\right)`)}
      です。こうして
      ${eq(String.raw`u_\tau = u_{xx}, \qquad u(x, 0) = \max\left(e^{(k+1)x/2} - e^{(k-1)x/2},\ 0\right)`)}
      の熱伝導方程式になります（${coreDoc('finance', 'heat_transform', '変数変換の説明')}）。${tex(String.raw`k = 2r/\sigma^2`)} を入れて言いかえると ${tex(String.raw`u = e^{\alpha x + \beta\tau}V/K`)}、${tex(String.raw`\alpha = \frac{1}{2}\left(\frac{2r}{\sigma^2} - 1\right) = \frac{r}{\sigma^2} - \frac{1}{2}`)}、${tex(String.raw`\beta = \frac{1}{4}\left(\frac{2r}{\sigma^2} + 1\right)^2 = \left(\frac{r}{\sigma^2} + \frac{1}{2}\right)^2`)} です。`,
    `熱伝導方程式の解は、初期値と熱核の積分 ${tex(String.raw`u(x, \tau) = \int_{-\infty}^{\infty} u(y, 0)\,\frac{1}{\sqrt{4\pi\tau}}e^{-(x - y)^2/(4\tau)}\,dy`)} です。${tex('u(y, 0)')} は ${tex('y > 0')} で ${tex('e^{ay}')}（${tex(String.raw`a = \frac{k \pm 1}{2}`)}）の差、${tex(String.raw`y \le 0`)} で 0 です。一つの項 ${tex(String.raw`e^{ay}`)} の積分を求めます。${tex(String.raw`y = x + \sqrt{2\tau}\,z`)} と置換すると ${tex(String.raw`dy = \sqrt{2\tau}\,dz`)}、${tex(String.raw`(x - y)^2/(4\tau) = 2\tau z^2/(4\tau) = z^2/2`)}、${tex('y = 0')} は ${tex(String.raw`z = -x/\sqrt{2\tau}`)} なので
      ${eq(String.raw`\frac{e^{-(x - y)^2/(4\tau)}}{\sqrt{4\pi\tau}}\,dy = \frac{\sqrt{2\tau}}{\sqrt{4\pi\tau}}e^{-z^2/2}\,dz = \frac{1}{\sqrt{2\pi}}e^{-z^2/2}\,dz = \varphi(z)\,dz`)}
      ${eq(String.raw`\int_0^\infty e^{ay}\frac{e^{-(x - y)^2/(4\tau)}}{\sqrt{4\pi\tau}}\,dy = \int_{-x/\sqrt{2\tau}}^{\infty} e^{ax + a\sqrt{2\tau}z}\varphi(z)\,dz`)}
      です（${tex(String.raw`\varphi`)} は標準正規分布の密度）。指数を平方完成します。
      ${eq(String.raw`a\sqrt{2\tau}\,z - \frac{z^2}{2} = -\frac{\left(z - a\sqrt{2\tau}\right)^2}{2} + a^2\tau`)}
      よって被積分関数は ${tex(String.raw`e^{ax + a^2\tau}\varphi(z - a\sqrt{2\tau})`)} で、${tex(String.raw`w = z - a\sqrt{2\tau}`)} と置くと下端は ${tex(String.raw`-x/\sqrt{2\tau} - a\sqrt{2\tau} = -(x + 2a\tau)/\sqrt{2\tau}`)} です。標準正規分布の対称性 ${tex(String.raw`\int_{-c}^{\infty}\varphi(w)\,dw = N(c)`)} により
      ${eq(String.raw`\int_{-x/\sqrt{2\tau}}^{\infty} e^{ax + a\sqrt{2\tau}z}\varphi(z)\,dz = e^{ax + a^2\tau}\int_{-(x + 2a\tau)/\sqrt{2\tau}}^{\infty}\varphi(w)\,dw = e^{ax + a^2\tau}\,N\!\left(\frac{x + 2a\tau}{\sqrt{2\tau}}\right)`)}
      です。${tex(String.raw`a = \frac{k + 1}{2}`)} と ${tex(String.raw`a = \frac{k - 1}{2}`)} の二つの項に使うと
      ${eq(String.raw`u = e^{\frac{k+1}{2}x + \frac{(k+1)^2}{4}\tau}N(d_1) - e^{\frac{k-1}{2}x + \frac{(k-1)^2}{4}\tau}N(d_2), \qquad d_{1,2} = \frac{x + (k \pm 1)\tau}{\sqrt{2\tau}}`)}
      です。${tex(String.raw`v = e^{-\alpha x - \beta\tau}u`)} に戻します。${tex(String.raw`\alpha = \frac{k-1}{2}`)}、${tex(String.raw`\beta = \frac{(k+1)^2}{4}`)} なので、二つの指数は
      ${eq(String.raw`\left(\tfrac{k+1}{2} - \tfrac{k-1}{2}\right)x + \left(\tfrac{(k+1)^2}{4} - \tfrac{(k+1)^2}{4}\right)\tau = x`)}
      ${eq(String.raw`\left(\tfrac{k-1}{2} - \tfrac{k-1}{2}\right)x + \frac{(k-1)^2 - (k+1)^2}{4}\tau = \frac{-4k}{4}\tau = -k\tau`)}
      となり、
      ${eq(String.raw`v = e^{x}N(d_1) - e^{-k\tau}N(d_2)`)}
      です。元の変数では
      ${eq(String.raw`\sqrt{2\tau} = \sqrt{\sigma^2(T - t)} = \sigma\sqrt{T - t}`)}
      ${eq(String.raw`(k + 1)\tau = \left(\frac{2r}{\sigma^2} + 1\right)\frac{\sigma^2}{2}(T - t) = \left(r + \tfrac{1}{2}\sigma^2\right)(T - t), \qquad k\tau = \frac{2r}{\sigma^2}\cdot\frac{\sigma^2}{2}(T - t) = r(T - t)`)}
      なので ${tex(String.raw`d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)(T - t)}{\sigma\sqrt{T - t}}`)}、${tex(String.raw`d_2 = d_1 - \frac{2\tau}{\sqrt{2\tau}} = d_1 - \sigma\sqrt{T - t}`)} です。最後に ${tex(String.raw`Ke^x = S`)} を使うと、${tex('V = Kv')} は Black–Scholes 公式
      ${eq(String.raw`C(S, t) = K e^{x}N(d_1) - K e^{-r(T - t)}N(d_2) = S\,N(d_1) - K e^{-r(T - t)}N(d_2)`)}
      です（${coreDoc('finance', 'black_scholes_call', 'Black–Scholes 公式の説明')}）。株価に対する変化率は ${tex(String.raw`\Delta = N(d_1)`)}、${tex(String.raw`\Gamma = \frac{\varphi(d_1)}{S\sigma\sqrt{T - t}}`)} です（${tex(String.raw`\Delta`)} の証明はページの最後）。`,
    `標準正規分布の累積分布関数 ${tex(String.raw`N(z) = \frac{1}{2}\operatorname{erfc}(-z/\sqrt{2})`)} は、相補誤差関数 ${tex(String.raw`\operatorname{erfc}`)} を ${tex('|x| < 2')} で正の項の級数、${tex(String.raw`|x| \ge 2`)} で連分数から求めた近似で、誤差は ${tex(String.raw`10^{-15}`)} 以下です（${coreDoc('finance', 'normal_cdf', '累積分布関数の近似の説明')}、${coreDoc('finance', 'erfc', '相補誤差関数の説明')}）。画面の公式の値は、この近似を除けば厳密です。`,
    `差分法では、区間 ${tex('[-L, L]')}（${tex('L = 2')}、${tex(String.raw`S \approx 13.5`)} から ${tex('739')}）を ${tex('M = 400')} 等分し（${tex(String.raw`\Delta x = 0.01`)}）、${tex(String.raw`\tau`)} を ${tex(String.raw`\Delta\tau = 2.5 \times 10^{-5}`)} ずつ ${tex('800')} 回進めます。${tex(String.raw`\rho = \Delta\tau/\Delta x^2 = 0.25`)} です。左端は ${tex('u = 0')}、右端は ${tex(String.raw`C \approx S - Ke^{-r(T - t)}`)} を移した ${tex(String.raw`u = e^{\alpha L + \beta\tau}(e^L - e^{-k\tau})`)} です。陽解法は
      ${eq(String.raw`u_j^{n+1} = u_j^n + \rho\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right)`)}
      で、${tex(String.raw`\rho \le 1/2`)} のときに限り安定です（${coreDoc('finance', 'explicit_heat_step', '陽解法の説明')}）。陰解法（Crank–Nicolson 法）は2階差分を新旧の時刻で平均した
      ${eq(String.raw`-\frac{\rho}{2}u_{j-1}^{n+1} + (1 + \rho)u_j^{n+1} - \frac{\rho}{2}u_{j+1}^{n+1} = \frac{\rho}{2}u_{j-1}^n + (1 - \rho)u_j^n + \frac{\rho}{2}u_{j+1}^n`)}
      で、三重対角の連立1次方程式を Thomas 法で解きます（${coreDoc('finance', 'crank_nicolson_heat_step', 'Crank–Nicolson 法の説明')}、${coreDoc('differential', 'solve_tridiagonal', 'Thomas 法の説明')}）。どの ${tex(String.raw`\rho`)} でも安定です。格子の値を ${tex(String.raw`V = Ke^{-\alpha x - \beta\tau}u`)} で価格に戻し、格子の間は線形補間します（${coreDoc('finance', 'interpolate', '線形補間の説明')}）。差分法の値は格子による近似で、主な誤差は ${tex(String.raw`\Delta x^2`)} に比例します。`,
  ],
  figureAlt: '満期の支払い max(S − 100, 0) の折れ線と、満期までの時間 0.25、0.5、1 年のコールの価格の曲線。時間が長いほど曲線は折れ線の上に丸く持ち上がる。右は熱伝導方程式の変数の初期値と時間発展。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">コールの価格と熱伝導方程式の変数</h2><div class="legend"><span><i class="numerical"></i>差分法</span><span><i class="analytical"></i>Black–Scholes 公式</span></div></div>
      ${methodTabs('熱伝導方程式の差分法', [{ id: 'crank-nicolson', label: '陰解法（Crank–Nicolson）' }, { id: 'explicit', label: '陽解法' }])}
      <div class="plot-pair">
        <div><h3>コールの価格 ${tex('C(S, t)')}</h3><canvas id="price-chart" role="img"></canvas><p>横軸は株価 ${tex('S')}。灰色の折れ線は満期の支払い ${tex(String.raw`\max(S - 100, 0)`)}、曲線は下から ${tex('T - t = 0.25, 0.5, 1')}</p></div>
        <div><h3>熱伝導方程式の変数 ${tex(String.raw`u(x, \tau)`)}</h3><canvas id="heat-chart" role="img"></canvas><p>横軸 ${tex(String.raw`x = \ln(S/K)`)}。灰色は初期値 ${tex('u(x, 0)')}、線は ${tex(String.raw`\tau = 0.02`)}（${tex('T - t = 1')}）</p></div>
      </div>
      <div class="readouts">
        <div><span>公式の値 C(100, 0)（厳密）</span><output id="formula-price">—</output></div>
        <div><span>差分法の値（近似）</span><output id="fd-price">—</output></div>
        <div><span>Δ = N(d₁)（厳密）</span><output id="delta">—</output></div>
        <div><span>差 差分法 − 公式（近似）</span><output id="fd-gap">—</output></div>
      </div>
      <p id="greek-note">—</p>
      <h3 id="table-heading">—</h3>
      <div class="table-scroll"><table class="value-table" id="price-table"></table></div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('S = K = 100')}、${tex('r = 0.05')}、${tex(String.raw`\sigma = 0.2`)}、${tex('T - t = 1')} とします。${tex(String.raw`\ln(S/K) = 0`)}、${tex(String.raw`\sigma^2/2 = 0.04/2 = 0.02`)}、${tex(String.raw`\sigma\sqrt{T - t} = 0.2`)} なので
      ${eq(String.raw`d_1 = \frac{0 + (0.05 + 0.02)\cdot 1}{0.2} = 0.35, \qquad d_2 = 0.35 - 0.2 = 0.15`)}
      で、どちらも厳密な値です。`,
    `正規分布表または ${tex(String.raw`N`)} の近似から ${tex(String.raw`N(0.35) \approx 0.636831`)}、${tex(String.raw`N(0.15) \approx 0.559618`)}、割引係数は ${tex(String.raw`e^{-0.05} \approx 0.951229`)} です。
      ${eq(String.raw`C = 100 \cdot 0.636831 - 100 \cdot 0.951229 \cdot 0.559618 \approx 63.6831 - 53.2325 = 10.4506`)}
      です。画面の公式の値 10.450584 は、${tex('N')} の近似を除けば厳密です。`,
    `${tex(String.raw`\Delta = N(0.35) \approx 0.636831`)} で、株価が 1 上がると価格は約 0.64 上がります。${tex(String.raw`\varphi(0.35) = e^{-0.06125}/\sqrt{2\pi} \approx 0.375240`)} なので
      ${eq(String.raw`\Gamma = \frac{0.375240}{100 \cdot 0.2 \cdot 1} \approx 0.018762`)}
      です。熱伝導方程式の定数は ${tex(String.raw`k = 2 \cdot 0.05/0.04 = 2.5`)}、${tex(String.raw`\alpha = 0.75`)}、${tex(String.raw`\beta = 3.5^2/4 = 3.0625`)}、満期までの1年は ${tex(String.raw`\tau = \frac{1}{2}\cdot 0.04 \cdot 1 = 0.02`)} です。差分法の値と公式の値の差は計器に示し、どちらのタブでも ${tex(String.raw`10^{-3}`)} 程度です。`,
  ],
  related: [
    { href: './heat.html', title: '熱伝導方程式' },
    { href: './compound.html', title: '連続複利と指数成長' },
    { href: './gbm.html', title: '幾何 Brownian 運動' },
    { href: './mc-pricing.html', title: 'Monte Carlo 価格評価' },
    { href: './elimination.html', title: '連立1次方程式と消去法' },
  ],
  footer: 'この画面の計算は、権利行使価格 100、金利 0.05、ボラティリティ 0.2 の欧州型コールの価格です。',
  proof: writtenProof([{
    statement: `Black–Scholes 公式の ${tex('C(S, t)')} について、${tex(String.raw`\tau = T - t > 0`)} のとき ${tex(String.raw`\frac{\partial C}{\partial S} = N(d_1)`)} です。`,
    proof: [
      `まず ${tex(String.raw`S\varphi(d_1) = Ke^{-r\tau}\varphi(d_2)`)} を示します。${tex(String.raw`d_1 - d_2 = \sigma\sqrt{\tau}`)}、${tex(String.raw`d_1 + d_2 = 2d_1 - \sigma\sqrt{\tau}`)} なので
        ${eq(String.raw`d_1^2 - d_2^2 = \sigma\sqrt{\tau}\left(2d_1 - \sigma\sqrt{\tau}\right) = 2\ln(S/K) + 2\left(r + \tfrac{1}{2}\sigma^2\right)\tau - \sigma^2\tau = 2\ln(S/K) + 2r\tau`)}
        です。よって
        ${eq(String.raw`\frac{\varphi(d_2)}{\varphi(d_1)} = e^{(d_1^2 - d_2^2)/2} = \frac{S}{K}e^{r\tau}`)}
        で、両辺に ${tex(String.raw`Ke^{-r\tau}\varphi(d_1)`)} を掛けると示す式になります。`,
      `${tex(String.raw`d_2 = d_1 - \sigma\sqrt{\tau}`)} なので ${tex(String.raw`\frac{\partial d_2}{\partial S} = \frac{\partial d_1}{\partial S} = \frac{1}{S\sigma\sqrt{\tau}}`)} です。積の微分と合成関数の微分により
        ${eq(String.raw`\frac{\partial C}{\partial S} = N(d_1) + S\varphi(d_1)\frac{\partial d_1}{\partial S} - Ke^{-r\tau}\varphi(d_2)\frac{\partial d_2}{\partial S}`)}
        ${eq(String.raw`= N(d_1) + \left(S\varphi(d_1) - Ke^{-r\tau}\varphi(d_2)\right)\frac{1}{S\sigma\sqrt{\tau}}`)}
        です。手順1により括弧の中は 0 なので、${tex(String.raw`\frac{\partial C}{\partial S} = N(d_1)`)} です。`,
      `もう一度 ${tex('S')} で微分すると ${tex(String.raw`\Gamma = \varphi(d_1)\frac{\partial d_1}{\partial S} = \frac{\varphi(d_1)}{S\sigma\sqrt{\tau}}`)} です。`,
    ],
  }]),
});

let method = 'crank-nicolson';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const price = document.getElementById('price-chart') as HTMLCanvasElement;
  const heat = document.getElementById('heat-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(price);
    clearFigure(heat);
    return;
  }
  const fig = current;
  drawPlot(price, {
    label: `満期の支払いと、満期までの時間 0.25、0.5、1 年のコールの価格。実線は${names[method]}、破線は Black–Scholes 公式。`,
    lines: [line(fig, 'payoff'), ...[0, 1, 2].flatMap(i => [line(fig, `fd-${i}`), line(fig, `formula-${i}`)])],
    dots: [{ x: 100, y: fig.values.fd_price, role: 'numerical', label: 'C(100)' }],
    xMin: 50,
    xMax: 150,
    yMin: 0,
    yMax: 52,
  });
  drawPlot(heat, {
    label: `熱伝導方程式の変数 u の初期値と τ = 0.02 の値。実線は${names[method]}、破線は公式から移した値。`,
    lines: [line(fig, 'heat-initial'), line(fig, 'heat-fd'), line(fig, 'heat-exact')],
    xMin: -1,
    xMax: 1,
    yMin: 0,
  });
}

function fill() {
  if (!current) return;
  const { values: v, arrays: a } = current;
  show('formula-price', fixed(v.price));
  show('fd-price', fixed(v.fd_price));
  show('delta', fixed(v.delta));
  show('fd-gap', v.fd_gap.toExponential(2));
  document.getElementById('greek-note')!.innerHTML = `${tex(String.raw`d_1`)} = ${fixed(v.d1)}、${tex(String.raw`d_2`)} = ${fixed(v.d2)}（厳密）、${tex(String.raw`\Gamma`)} = ${fixed(v.gamma)}（厳密）。${names[method]}は ${tex(String.raw`\rho`)} = ${fixed(v.rho, 2)}、${tex(String.raw`\Delta x`)} = ${fixed(v.dx, 2)}、${fixed(v.steps, 0)} ステップです。`;
  show('table-heading', `${names[method]}と公式の価格（T − t = 1、小数6桁）`);
  const row = (cells: (string | number)[], tag = 'td') => `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
  document.getElementById('price-table')!.innerHTML = row(['S', '公式 C（厳密）', '差分法（近似）', '差（近似）', 'Δ = N(d₁)（厳密）'], 'th')
    + a.table_s.map((s, i) => row([fixed(s, 0), fixed(a.table_formula[i]), fixed(a.table_fd[i]), a.table_diff[i].toExponential(2), fixed(a.table_delta[i])])).join('');
}

async function load() {
  try {
    current = await lessonFigure('finance/black-scholes', { method });
    fill();
    paint();
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

bindMethodTabs<string>(next => {
  method = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
