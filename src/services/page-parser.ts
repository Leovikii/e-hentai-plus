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

export function parseImageRange(doc: Document): { start: number; total: number } | null {
  const gpc = q('.gpc', doc);
  if (!gpc) return null;
  const txt = gpc.textContent ?? '';
  const m = txt.match(/Showing\s+([\d,]+)\s*-\s*([\d,]+)\s+of\s+([\d,]+)/);
  if (!m) return null;
  return {
    start: parseInt(m[1].replace(/,/g, '')),
    total: parseInt(m[3].replace(/,/g, '')),
  };
}

export function getNextUrl(doc: Document): string | null {
  const ptt = q('.ptt', doc);
  if (!ptt) return null;
  const nextBtn = Array.from(qa('td a', ptt)).find(a => (a.textContent ?? '').includes('>'));
  return nextBtn ? (nextBtn as HTMLAnchorElement).href : null;
}

export function getPrevUrl(doc: Document): string | null {
  const ptt = q('.ptt', doc);
  if (!ptt) return null;
  const prevBtn = Array.from(qa('td a', ptt)).find(a => (a.textContent ?? '').includes('<'));
  return prevBtn ? (prevBtn as HTMLAnchorElement).href : null;
}
