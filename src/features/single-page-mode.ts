import { store } from '../state/store';
import { createSinglePageOverlay } from '../ui/single-page/overlay';
import { processBatch } from './scroll-mode';
import type { SinglePageModeHandle } from '../types';

export function initSinglePageMode(): SinglePageModeHandle {
  const spm = createSinglePageOverlay({
    onLoadNextPage: (links, nextUrl) => {
      store.currPage++;
      processBatch(links, store.currPage, undefined, false, store.nextUrl || undefined);
      store.nextUrl = nextUrl;
    },
    onLoadPrevPage: (links, prevUrl) => {
      processBatch(links, store.currPage - 1, undefined, true, store.prevUrl || undefined);
      store.prevUrl = prevUrl;
    },
  });

  return spm;
}
