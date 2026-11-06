import type { StepMethod } from './protocol';

export interface MethodTab { id: string; label: string }

const timeSteppers: MethodTab[] = [
  { id: 'euler', label: 'Euler法' },
  { id: 'midpoint', label: '中点法' },
  { id: 'rk4', label: '古典的RK4' },
];

/** そのページの方程式を進める数値解法だけを切り替えるタブ。帯は一行で、最初のタブが選ばれて始まる。 */
export function methodTabs(label: string, methods: MethodTab[] = timeSteppers): string {
  const tabs = methods.map((method, index) =>
    `<button type="button" class="method-tab" role="tab" data-method="${method.id}" aria-selected="${index === 0 ? 'true' : 'false'}">${method.label}</button>`).join('\n      ');
  return `
    <div class="method-tabs" role="tablist" aria-label="${label}">
      ${tabs}
    </div>`;
}

/** 選ばれているタブが変わったときだけ、数値解を読み直す。 */
export function bindMethodTabs<M extends string = StepMethod>(onChange: (method: M) => void) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-selected') === 'true') return;
      for (const item of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
        item.setAttribute('aria-selected', item === button ? 'true' : 'false');
      }
      onChange(button.dataset.method as M);
    });
  }
}
