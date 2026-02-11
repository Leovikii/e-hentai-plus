import { store } from '../state/store';
import { CFG } from '../state/config';
import { fetchPageLinks } from '../utils/dom';
import { loadImageWithRetry } from './image-loader';

const prefetchedUrls = new Set<string>();

export function prefetchNextPage(): void {
  if (!store.nextUrl || store.nextPagePrefetched || prefetchedUrls.has(store.nextUrl)) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);

  if (distanceToBottom < CFG.prefetchDistance) {
    store.nextPagePrefetched = true;
    prefetchedUrls.add(store.nextUrl);

    fetchPageLinks(store.nextUrl).then(({ links }) => {
      links.forEach(url => {
        loadImageWithRetry(url).then(imgSrc => {
          if (imgSrc) {
            const preloadImg = new Image();
            preloadImg.src = imgSrc;
          }
        }).catch(() => null);
      });
    }).catch(err => {
      console.error('[Prefetch Failed]', err);
      store.nextPagePrefetched = false;
      if (store.nextUrl) prefetchedUrls.delete(store.nextUrl);
    });
  }
}

export function setupPrefetchListener(): void {
  let scrollTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(prefetchNextPage, 200);
  }, { passive: true });
}
