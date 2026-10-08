/**
 * 表示する式の板と番号。
 * 短いつなぎだけで続く式は一つの地を共有する。本文が指す式には、板の右に（1）、（2）を付ける。
 * 文の一部である行中の式には番号を付けない。先の表示を指す語は、その番号に引き換える。
 */

import { drawPlot } from './figures/plot';
import { onThemeChange } from './theme';

const FORWARD = ['次の等式', '次の増分', '次の式'] as const;

/** ページの式を、一つの板と番号に整える。各ページの本文を置いたあとで呼ぶ。 */
export function mountEquationPlates(): void {
  const main = document.querySelector('main');
  if (!main || main.dataset.equations === 'ready') return;
  placeOpeningChart(main);
  mergeTouchingEquations(main);
  groupSolutionEquations(main);
  pruneEmptyItems(main);
  numberReferredDisplays(main);
  main.dataset.equations = 'ready';
}

function placeOpeningChart(main: HTMLElement) {
  const figure = main.querySelector<HTMLElement>('.page-figure');
  const intro = main.querySelector('.intro');
  if (figure && intro) intro.after(figure);
  const opening = main.querySelector<HTMLCanvasElement>('#opening-chart');
  if (!opening) return;
  const drawFallback = () => {
    if (opening.dataset.source && opening.dataset.source !== 'fallback') return;
    drawPlot(opening, { label: '軸', xMin: 0, xMax: 1, yMin: -1, yMax: 1 });
    if (opening.width > 2) opening.dataset.source = 'fallback';
  };
  requestAnimationFrame(drawFallback);
  onThemeChange(() => {
    if (opening.dataset.source === 'fallback') {
      delete opening.dataset.source;
      drawFallback();
    }
  });
}

function displaysIn(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('.tex-display')];
}

function proseBetween(start: Node, end: Node): string {
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  const holder = document.createElement('div');
  holder.append(range.cloneContents());
  holder.querySelectorAll('.tex, .katex').forEach(node => node.remove());
  return holder.textContent ?? '';
}

function compact(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * 理由を述べる段落かどうか。
 * 文がないとき、一文のつなぎ、次の式へ導く二文は段落ではない。板が分かれるのは、この段落が始まるときだけである。
 */
function reasoningParagraph(text: string): boolean {
  const body = compact(text);
  if (!body) return false;
  const sentences = body.match(/。/g)?.length ?? 0;
  if (sentences <= 1) return false;
  if (sentences === 2 && /次の式|したがって|よって|すると|移項/.test(body)) return false;
  return true;
}

function blockedGap(start: Element, end: Element): boolean {
  if (start.closest('section') !== end.closest('section')) return true;
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  const holder = document.createElement('div');
  holder.append(range.cloneContents());
  return holder.querySelector('h1, h2, h3, p, ul, ol, blockquote, canvas, table, figure, .page-figure, .panel') !== null;
}

function canSharePlate(start: Element, end: Element): boolean {
  if (blockedGap(start, end)) return false;
  return !reasoningParagraph(proseBetween(start, end));
}

function groupsOf(elements: Element[], join: (start: Element, end: Element) => boolean): Element[][] {
  const groups: Element[][] = [];
  for (const element of elements) {
    const current = groups[groups.length - 1];
    if (current && join(current[current.length - 1], element)) current.push(element);
    else groups.push([element]);
  }
  return groups;
}

/** あいだに文がない式の板を、一つの .equation にまとめる。 */
function mergeTouchingEquations(main: Element): void {
  const plates = [...main.querySelectorAll<HTMLElement>('.equation')];
  for (const group of groupsOf(plates, canSharePlate)) {
    const host = group[0];
    for (const extra of group.slice(1)) {
      while (extra.firstChild) host.append(extra.firstChild);
      extra.remove();
    }
  }
}

function following(node: Node, stop: Element): Node | null {
  if (node.nextSibling) return node.nextSibling;
  let parent = node.parentNode;
  while (parent && parent !== stop) {
    if (parent.nextSibling) return parent.nextSibling;
    parent = parent.parentNode;
  }
  return null;
}

/** 一つのまとまりの式と、そのあいだの短いつなぎを、一つの板へ移す。 */
function absorbPlate(first: Element, last: Element, stop: Element): void {
  const plate = document.createElement('div');
  plate.className = 'equation-plate';
  first.before(plate);
  let node: Node | null = plate.nextSibling;
  while (node && stop.contains(node)) {
    if (node === last) {
      plate.append(node);
      return;
    }
    if (node instanceof Element && node.contains(last)) {
      node = node.firstChild;
      continue;
    }
    const next = following(node, stop);
    plate.append(node);
    node = next;
  }
}

function groupSolutionEquations(main: Element): void {
  const equations = [...main.querySelectorAll<HTMLElement>('.solution-equation')];
  for (const group of groupsOf(equations, canSharePlate)) {
    const stop = group[0].closest('section') ?? main;
    absorbPlate(group[0], group[group.length - 1], stop);
  }
}

function pruneEmptyItems(main: Element): void {
  for (const item of [...main.querySelectorAll('li')]) {
    if (!item.textContent?.trim() && item.children.length === 0) item.remove();
  }
}

function lastBefore(node: Node, displays: HTMLElement[]): HTMLElement | null {
  let found: HTMLElement | null = null;
  for (const display of displays) {
    if (node.compareDocumentPosition(display) & Node.DOCUMENT_POSITION_PRECEDING) found = display;
    else break;
  }
  return found;
}

function nextAfter(node: Node, displays: HTMLElement[]): HTMLElement | null {
  return displays.find(display => (node.compareDocumentPosition(display) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) ?? null;
}

/** 直前に重なって並ぶ表示。あいだの「です。」だけは同じ並びとみなす。 */
function precedingRun(node: Node, displays: HTMLElement[]): HTMLElement[] {
  const before = displays.filter(display => node.compareDocumentPosition(display) & Node.DOCUMENT_POSITION_PRECEDING);
  if (before.length === 0) return [];
  const run = [before[before.length - 1]];
  for (let index = before.length - 2; index >= 0; index -= 1) {
    const gap = compact(proseBetween(before[index], before[index + 1]));
    if (gap && gap !== 'です。' && gap !== 'です') break;
    run.unshift(before[index]);
  }
  return run;
}

function markForwardRun(from: Node, displays: HTMLElement[], referred: Set<HTMLElement>): void {
  const first = nextAfter(from, displays);
  if (!first) return;
  referred.add(first);
  const start = displays.indexOf(first);
  for (let index = start + 1; index < displays.length; index += 1) {
    if (compact(proseBetween(displays[index - 1], displays[index]))) break;
    referred.add(displays[index]);
  }
}

function inlineCloserThan(node: Node, display: HTMLElement): boolean {
  let current: Node | null = node;
  while (current) {
    if (current === display) return false;
    if (current instanceof Element && current.classList.contains('tex') && !current.classList.contains('tex-display')) return true;
    current = previousNode(current);
  }
  return false;
}

function previousNode(node: Node): Node | null {
  if (node.previousSibling) {
    let current: Node = node.previousSibling;
    while (current.lastChild) current = current.lastChild;
    return current;
  }
  return node.parentNode;
}

interface Replacement {
  node: Text;
  index: number;
  length: number;
  displays: HTMLElement[];
  pair: boolean;
}

function konoDisplay(node: Text, index: number, displays: HTMLElement[]): HTMLElement | null {
  const after = node.textContent?.slice(index + 'この式'.length) ?? '';
  if (after.startsWith('へ')) return null;
  const nearest = lastBefore(node, displays);
  if (!nearest) return null;
  const item = node.parentElement?.closest('li');
  const displayItem = nearest.closest('li');
  const sameItem = item != null && item === displayItem;
  const itemStarts = item != null && item !== displayItem && (item.textContent ?? '').trimStart().startsWith('この式');
  if (!sameItem && !itemStarts) return null;
  if (after.startsWith('の') && !after.startsWith('の値') && inlineCloserThan(node, nearest)) return null;
  return nearest;
}

function maeDisplay(node: Text, index: number, displays: HTMLElement[]): HTMLElement | null {
  const nearest = lastBefore(node, displays);
  if (!nearest) return null;
  const before = compact(node.textContent?.slice(0, index) ?? '');
  if (before === 'なので、' || before === 'なので') return lastBefore(nearest, displays) ?? nearest;
  return nearest;
}

function textNodes(root: Element): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('.tex, .katex, script, style, .equation-number')) return NodeFilter.FILTER_REJECT;
      if (!node.textContent) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

function numberReferredDisplays(main: Element): void {
  const displays = displaysIn(main);
  const referred = new Set<HTMLElement>();
  const replacements: Replacement[] = [];
  for (const node of textNodes(main)) {
    const text = node.textContent ?? '';
    let cursor = 0;
    while (cursor < text.length) {
      const rest = text.slice(cursor);
      let found: { at: number; length: number; kind: string } | null = null;
      const options: [string, string][] = [
        ['上の式から下の式', 'pair'],
        ['次の等式', 'forward'],
        ['次の増分', 'forward'],
        ['次の式', 'forward'],
        ['前の式', 'mae'],
        ['上の式', 'back'],
        ['この式', 'kono'],
      ];
      for (const [phrase, kind] of options) {
        const at = rest.indexOf(phrase);
        if (at < 0) continue;
        if (!found || at < found.at || (at === found.at && phrase.length > found.length)) found = { at, length: phrase.length, kind };
      }
      if (!found) break;
      const index = cursor + found.at;
      if (found.kind === 'forward') markForwardRun(node, displays, referred);
      else if (found.kind === 'kono' && (text.slice(index + found.length).startsWith('へ'))) markForwardRun(node, displays, referred);
      else if (found.kind === 'pair') {
        const run = precedingRun(node, displays);
        const upper = run.length >= 2 ? run[run.length - 2] : run[0];
        const lower = run.length >= 2 ? run[run.length - 1] : nextAfter(node, displays);
        if (upper && lower) {
          referred.add(upper);
          referred.add(lower);
          replacements.push({ node, index, length: found.length, displays: [upper, lower], pair: true });
        }
      } else if (found.kind === 'mae') {
        const display = maeDisplay(node, index, displays);
        if (display) {
          referred.add(display);
          replacements.push({ node, index, length: found.length, displays: [display], pair: false });
        }
      } else if (found.kind === 'back') {
        const display = lastBefore(node, displays);
        if (display) {
          referred.add(display);
          replacements.push({ node, index, length: found.length, displays: [display], pair: false });
        }
      } else if (found.kind === 'kono') {
        const display = konoDisplay(node, index, displays);
        if (display) {
          referred.add(display);
          replacements.push({ node, index, length: found.length, displays: [display], pair: false });
        }
      }
      cursor = index + found.length;
    }
  }

  const numbers = new Map<HTMLElement, number>();
  let count = 0;
  for (const display of displays) {
    if (!referred.has(display)) continue;
    count += 1;
    numbers.set(display, count);
  }
  const byNode = new Map<Text, Replacement[]>();
  for (const replacement of replacements) {
    const list = byNode.get(replacement.node) ?? [];
    list.push(replacement);
    byNode.set(replacement.node, list);
  }
  for (const [node, list] of byNode) {
    let text = node.textContent ?? '';
    for (const replacement of list.sort((left, right) => right.index - left.index)) {
      const labels = replacement.displays.map(display => `（${numbers.get(display) ?? ''}）`);
      const citation = replacement.pair ? `${labels[0]}から${labels[1]}` : labels[0];
      text = text.slice(0, replacement.index) + citation + text.slice(replacement.index + replacement.length);
    }
    node.textContent = text;
  }
  for (const [display, number] of numbers) placeNumber(display, number);
}

function placeNumber(display: HTMLElement, number: number): void {
  const solution = display.closest('.solution-equation');
  const badge = document.createElement('span');
  badge.className = 'equation-number';
  badge.textContent = `（${number}）`;
  if (solution) {
    solution.classList.add('is-numbered');
    solution.append(badge);
    return;
  }
  const equation = display.closest('.equation');
  if (!equation) return;
  let line = display.parentElement;
  if (!line?.classList.contains('equation-line')) {
    line = document.createElement('div');
    line.className = 'equation-line';
    display.before(line);
    line.append(display);
  }
  line.classList.add('is-numbered');
  line.append(badge);
}
