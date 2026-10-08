/** 配色。キーがないときは prefers-color-scheme に従い、ボタンを押すと反対の配色をページをまたぐ一つの localStorage のキーに置く。 */

export type Scheme = 'light' | 'dark';

export const THEME_KEY = 'ergion-theme';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();
/** localStorage を使えない環境で、このページだけに置く選択。 */
let unsaved: Scheme | undefined;

function stored(): Scheme | undefined {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : unsaved;
  } catch {
    return unsaved;
  }
}

/** いまページが使っている配色。 */
export function currentScheme(): Scheme {
  return stored() ?? (darkQuery.matches ? 'dark' : 'light');
}

const MOON = '<svg class="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const SUN = '<svg class="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/** 明るいページは月、暗いページは太陽。画面に文字は出さず、名前は読み上げのためだけに置く。 */
function paint(button: HTMLButtonElement, scheme: Scheme) {
  button.innerHTML = scheme === 'dark' ? SUN : MOON;
  button.setAttribute('aria-label', scheme === 'dark' ? '明るい配色にする' : '暗い配色にする');
  button.dataset.scheme = scheme;
}

function apply() {
  const root = document.documentElement;
  const choice = stored();
  if (choice) root.dataset.theme = choice;
  else delete root.dataset.theme;
  const scheme = currentScheme();
  for (const button of document.querySelectorAll<HTMLButtonElement>('.theme-toggle')) paint(button, scheme);
  for (const listener of listeners) listener();
}

export function setScheme(scheme: Scheme) {
  try {
    localStorage.setItem(THEME_KEY, scheme);
  } catch {
    unsaved = scheme;
  }
  apply();
}

/** 配色が変わったときに図を描き直す。端末の配色の変化と、別のタブでの選択も含む。 */
export function onThemeChange(listener: () => void) {
  listeners.add(listener);
}

export function themeControl(): string {
  const scheme = currentScheme();
  return `<button type="button" class="theme-toggle" data-scheme="${scheme}" aria-label="${scheme === 'dark' ? '明るい配色にする' : '暗い配色にする'}">${scheme === 'dark' ? SUN : MOON}</button>`;
}

document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest('button.theme-toggle')) return;
  setScheme(currentScheme() === 'dark' ? 'light' : 'dark');
});

darkQuery.addEventListener('change', () => {
  if (!stored()) apply();
});

window.addEventListener('storage', event => {
  if (event.key === THEME_KEY || event.key === null) apply();
});

apply();
