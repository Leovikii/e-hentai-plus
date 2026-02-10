import { q, qa } from '../utils/dom';

export function calcTotal(doc: Document, fallbackLinkCount: number): number {
  const gpc = q('.gpc', doc);
  if (gpc) {
    const txt = gpc.textContent ?? '';
    const m = txt.match(/of\s+(\d+)\s+images/);
    if (m && m[1]) {
      const totalImgs = parseInt(m[1]);
      const perPage = fallbackLinkCount || 20;
      return Math.ceil(totalImgs / perPage);
    }
  }
  const allLinks = Array.from(qa('.ptt td a', doc));
  const lastA = allLinks.pop();
  if (lastA) {
    const t = parseInt(lastA.textContent ?? '');
    if (!isNaN(t)) return t;
  }
  return 1;
}

export function getNextUrl(doc: Document): string | null {
  const ptt = q('.ptt', doc);
  if (!ptt) return null;
  const nextBtn = Array.from(qa('td a', ptt)).find(a => (a.textContent ?? '').includes('>'));
  return nextBtn ? (nextBtn as HTMLAnchorElement).href : null;
}
