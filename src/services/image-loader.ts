import { q } from '../utils/dom';
import { CFG } from '../state/config';
import { requestQueue } from './request-queue';

const parser = new DOMParser();
const imageCache = new Map<string, string>();

async function fetchImageSrc(url: string, retries = 0): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (response.status === 429 || response.status === 503) {
      throw { rateLimited: true };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const doc = parser.parseFromString(html, 'text/html');
    const imgEl = q('#img', doc) as HTMLImageElement | null;
    const imgSrc = imgEl?.src;
    if (!imgSrc) throw new Error('Image not found');
    return imgSrc;
  } catch (err) {
    if (retries < CFG.maxRetries) {
      const isRateLimited = err && typeof err === 'object' && 'rateLimited' in err;
      const delay = isRateLimited
        ? 5000
        : CFG.retryDelay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageSrc(url, retries + 1);
    }
    return null;
  }
}

export function loadImageWithRetry(url: string): Promise<string | null> {
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);

  return requestQueue.enqueue(() => fetchImageSrc(url)).then(src => {
    if (src) imageCache.set(url, src);
    return src;
  });
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
    imageCache.delete(url);
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
