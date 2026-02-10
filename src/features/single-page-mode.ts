import { store } from '../state/store';
import { createSinglePageOverlay } from '../ui/single-page/overlay';
import { processBatch } from './scroll-mode';
import { getNextUrl } from '../services/page-parser';
import type { SinglePageModeHandle } from '../types';

export function initSinglePageMode(): SinglePageModeHandle {
  const spm = createSinglePageOverlay({
    onLoadNextPage: (links, doc) => {
      store.currPage++;
      processBatch(links, store.currPage);
      store.nextUrl = getNextUrl(doc);
    },
  });

  return spm;
}
