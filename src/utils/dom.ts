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
