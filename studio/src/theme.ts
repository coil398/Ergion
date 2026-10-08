/** 配色。選択はページをまたぐ一つの localStorage のキーに置き、端末を選ぶとキーを消して prefers-color-scheme に従う。 */

export type ThemeChoice = 'light' | 'dark' | 'system';

export const THEME_KEY = 'ergion-theme';

const choices: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: '明るい' },
  { value: 'dark', label: '暗い' },
  { value: 'system', label: '端末' },
];

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();

function stored(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  for (const button of document.querySelectorAll<HTMLButtonElement>('.theme-choice')) {
    button.setAttribute('aria-pressed', button.value === choice ? 'true' : 'false');
  }
  for (const listener of listeners) listener();
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // 保存できない環境でも、このページの配色は切り替える。
  }
  apply(choice);
}

/** 配色が変わったときに図を描き直す。端末の配色の変化と、別のタブでの選択も含む。 */
export function onThemeChange(listener: () => void) {
  listeners.add(listener);
}

export function themeControl(): string {
  const current = stored();
  const buttons = choices
    .map(choice => `<button type="button" class="theme-choice" value="${choice.value}" aria-pressed="${choice.value === current ? 'true' : 'false'}">${choice.label}</button>`)
    .join('');
  return `<div class="theme-switch" role="group" aria-labelledby="theme-label"><span class="theme-label" id="theme-label">配色</span>${buttons}</div>`;
}

document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button.theme-choice');
  if (!(button instanceof HTMLButtonElement)) return;
  setThemeChoice(button.value as ThemeChoice);
});

darkQuery.addEventListener('change', () => {
  if (stored() === 'system') apply('system');
});

window.addEventListener('storage', event => {
  if (event.key === THEME_KEY || event.key === null) apply(stored());
});

apply(stored());
