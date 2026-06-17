export const q = (selector: string, root: Document | Element = document): Element | null =>
  root.querySelector(selector);

export const qa = (selector: string, root: Document | Element = document): NodeListOf<Element> =>
  root.querySelectorAll(selector);

const HIDDEN_SELECTORS = ['#fb', '#cdiv', '.gt', '.gpc', '.ptt', '#db'];

export function hideOriginalElements(): void {
  HIDDEN_SELECTORS.forEach(sel => {
    const el = q(sel) as HTMLElement | null;
    if (el) el.style.display = 'none';
  });
}

export function isImageReady(img: HTMLImageElement): boolean {
  if (img.dataset.realSrc) return true;
  return !!(img && img.src && !img.src.includes('data:') && img.complete && img.naturalWidth > 0);
}



let toastContainer: HTMLElement | null = null;

export function showToast(msg: string, duration = 3000): void {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.left = '50%';
    toastContainer.style.transform = 'translateX(-50%)';
    toastContainer.style.zIndex = '2147483647';
    toastContainer.style.pointerEvents = 'none';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '8px';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.background = 'rgba(20, 20, 20, 0.9)';
  toast.style.color = '#fff';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '14px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
  toast.style.border = '1px solid rgba(255,255,255,0.1)';
  toast.style.transition = 'opacity 0.3s';
  toast.textContent = msg;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
