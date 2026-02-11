export const q = (selector: string, root: Document | Element = document): Element | null =>
  root.querySelector(selector);

export const qa = (selector: string, root: Document | Element = document): NodeListOf<Element> =>
  root.querySelectorAll(selector);

const HIDDEN_SELECTORS = ['#nb', '#fb', '#cdiv', '.gt', '.gpc', '.ptt', '#db'];

export function hideOriginalElements(): void {
  HIDDEN_SELECTORS.forEach(sel => {
    const el = q(sel) as HTMLElement | null;
    if (el) el.style.display = 'none';
  });
}

export function isImageReady(img: HTMLImageElement): boolean {
  return !!(img && img.src && !img.src.includes('data:') && img.complete && img.naturalWidth > 0);
}

const sharedParser = new DOMParser();

export function fetchPageLinks(url: string): Promise<{ doc: Document; links: string[] }> {
  return fetch(url).then(r => r.text()).then(html => {
    const doc = sharedParser.parseFromString(html, 'text/html');
    const links = Array.from(qa('#gdt a', doc)).map(a => (a as HTMLAnchorElement).href);
    return { doc, links };
  });
}
