import katex from 'katex';
import 'katex/dist/katex.min.css';
import './tex.css';

function escapeAttr(source: string): string {
  return source.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/** TeX を KaTeX で描く。source は TeX そのもの。 */
export function tex(source: string, display = false): string {
  const html = katex.renderToString(source, {
    throwOnError: true,
    displayMode: display,
    output: 'htmlAndMathml',
  });
  const mode = display ? ' tex-display' : '';
  return `<span class="tex${mode}" data-tex="${escapeAttr(source)}">${html}</span>`;
}
