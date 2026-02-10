import { q } from '../utils/dom';
import { CFG } from '../state/config';

const parser = new DOMParser();

export async function loadImageWithRetry(url: string, retries = 0): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const doc = parser.parseFromString(html, 'text/html');
    const imgEl = q('#img', doc) as HTMLImageElement | null;
    const imgSrc = imgEl?.src;
    if (!imgSrc) throw new Error('Image not found');
    return imgSrc;
  } catch {
    if (retries < CFG.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, CFG.retryDelay));
      return loadImageWithRetry(url, retries + 1);
    }
    return null;
  }
}

export function createRetryHandler(
  url: string,
  placeholder: HTMLElement,
  pIndex: number,
  index: number,
): () => void {
  return () => {
    placeholder.className = 'r-ph loading';
    placeholder.textContent = `P${pIndex}-${index + 1} Reloading...`;
    loadImageWithRetry(url).then(newSrc => {
      if (newSrc) {
        const newImg = document.createElement('img');
        newImg.src = newSrc;
        newImg.className = 'r-img';
        placeholder.parentNode?.replaceChild(newImg, placeholder);
      }
    });
  };
}
