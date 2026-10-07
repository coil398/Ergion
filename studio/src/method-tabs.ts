import type { StepMethod } from './protocol';

/** そのページの方程式を進める数値解法だけを切り替えるタブ。 */
export function methodTabs(label: string): string {
  return `
    <div class="method-tabs" role="tablist" aria-label="${label}">
      <button type="button" class="method-tab" role="tab" data-method="euler" aria-selected="true">Euler法</button>
      <button type="button" class="method-tab" role="tab" data-method="midpoint" aria-selected="false">中点法</button>
      <button type="button" class="method-tab" role="tab" data-method="rk4" aria-selected="false">古典的RK4</button>
    </div>`;
}

/** 選ばれているタブが変わったときだけ、数値解を読み直す。 */
export function bindMethodTabs(onChange: (method: StepMethod) => void) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-selected') === 'true') return;
      for (const item of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
        item.setAttribute('aria-selected', item === button ? 'true' : 'false');
      }
      onChange(button.dataset.method as StepMethod);
    });
  }
}
