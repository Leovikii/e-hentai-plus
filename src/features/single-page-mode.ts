import { store } from '../state/store';
import { createSinglePageOverlay } from '../ui/single-page/overlay';
import { processBatch } from './scroll-mode';
import { getNextUrl, getPrevUrl } from '../services/page-parser';
import type { SinglePageModeHandle } from '../types';

export function initSinglePageMode(): SinglePageModeHandle {
  const spm = createSinglePageOverlay({
    onLoadNextPage: (links, doc) => {
      store.currPage++;
      processBatch(links, store.currPage);
      store.nextUrl = getNextUrl(doc);
    },
    onLoadPrevPage: (links, doc) => {
      processBatch(links, store.currPage - 1, true);
      store.prevUrl = getPrevUrl(doc);
    },
  });

  return spm;
}
