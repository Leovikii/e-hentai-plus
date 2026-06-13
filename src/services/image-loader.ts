import { q } from '../utils/dom';
import { CFG } from '../state/config';
import { requestQueue } from './request-queue';

export interface ImageLoadResult {
  src: string;
  nl: string | null;
}

const parser = new DOMParser();
const imageCache = new Map<string, ImageLoadResult>();

async function fetchImageSrc(url: string, retries = 0): Promise<ImageLoadResult | null> {
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
    
    const onerror = imgEl.getAttribute('onerror') || '';
    const m = onerror.match(/nl\(['"]([^'"]+)['"]\)/);
    const nlToken = m ? m[1] : null;

    return { src: imgSrc, nl: nlToken };
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

export function loadImageWithRetry(originalUrl: string, fetchUrl?: string): Promise<ImageLoadResult | null> {
  const urlToFetch = fetchUrl || originalUrl;

  if (!fetchUrl) {
    const cached = imageCache.get(originalUrl);
    if (cached) return Promise.resolve(cached);
  }

  return requestQueue.enqueue(() => fetchImageSrc(urlToFetch)).then(res => {
    if (res) imageCache.set(originalUrl, res);
    return res;
  });
}

export function clearCachedImage(url: string): void {
  imageCache.delete(url);
}
