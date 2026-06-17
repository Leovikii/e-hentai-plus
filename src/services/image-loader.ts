import { CFG } from '../state/config';
import { requestQueue } from './request-queue';
import { store } from '../state/store';

export interface ImageLoadResult {
  src: string;
  nl: string | null;
}

const imageCache = new Map<string, ImageLoadResult>();

async function fetchImageSrc(url: string, retries = 0): Promise<ImageLoadResult | null> {
  try {
    const response = await fetch(url);
    if (response.status === 429 || response.status === 503) {
      requestQueue.pauseGlobally(5000);
      throw { rateLimited: true };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    
    // Use fast RegExp instead of synchronous DOMParser to avoid blocking the main thread
    const srcMatch = html.match(/<img[^>]+id=["']img["'][^>]+src=["']([^"']+)["']/i);
    const imgSrc = srcMatch ? srcMatch[1] : null;
    if (!imgSrc) throw new Error('Image not found');
    
    const onerrorMatch = html.match(/<img[^>]+id=["']img["'][^>]+onerror=["']([^"']+)["']/i);
    const onerror = onerrorMatch ? onerrorMatch[1] : '';
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

export function loadImageWithRetry(originalUrl: string, fetchUrl?: string, globalIndex?: number): Promise<ImageLoadResult | null> {
  const urlToFetch = fetchUrl || originalUrl;

  if (!fetchUrl) {
    const cached = imageCache.get(originalUrl);
    if (cached) return Promise.resolve(cached);
  }

  const priorityFn = globalIndex !== undefined 
    ? () => -Math.abs(store.currentImageIndex - globalIndex) 
    : undefined;

  return requestQueue.enqueue(() => fetchImageSrc(urlToFetch), priorityFn).then(res => {
    if (res) imageCache.set(originalUrl, res);
    return res;
  });
}

export function clearCachedImage(url: string): void {
  imageCache.delete(url);
}
