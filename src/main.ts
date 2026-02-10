import 'virtual:uno.css';
import './ui/styles.css';

import { store } from './state/store';
import { qa } from './utils/dom';
import { hideOriginalElements } from './utils/dom';
import { calcTotal, getNextUrl } from './services/page-parser';
import { setupPrefetchListener } from './services/prefetch';
import { processBatch, setupAutoScroll } from './features/scroll-mode';
import { initSinglePageMode } from './features/single-page-mode';
import { createFloatControl } from './ui/float-control';
import { registerMenuCommands } from './menu-commands';

(function main() {
  hideOriginalElements();

  const mainBox = document.querySelector('#gdt') as HTMLElement;
  if (!mainBox) return;

  // Parse initial page state
  const urlP = new URLSearchParams(window.location.search).get('p');
  store.currPage = urlP ? parseInt(urlP) + 1 : 1;

  const initLinks = Array.from(qa('#gdt a', document)).map(a => (a as HTMLAnchorElement).href);

  const galleryId = window.location.pathname;
  const savedTotal = localStorage.getItem(`eh_total_${galleryId}`);

  if (savedTotal && parseInt(savedTotal) > 0) {
    store.totalPage = parseInt(savedTotal);
  } else {
    store.totalPage = calcTotal(document, initLinks.length);
    localStorage.setItem(`eh_total_${galleryId}`, String(store.totalPage));
  }

  store.nextUrl = getNextUrl(document);

  // Clear original content and load first batch
  mainBox.innerHTML = '';
  processBatch(initLinks, store.currPage);

  // Initialize single page mode with lazy wrapper for circular dependency
  let spmHandle: ReturnType<typeof initSinglePageMode>;

  createFloatControl({
    open: () => spmHandle.open(),
    close: () => spmHandle.close(),
    isActive: () => spmHandle.isActive(),
    getOverlayElement: () => spmHandle.getOverlayElement(),
  });

  spmHandle = initSinglePageMode();

  // Auto scroll (IntersectionObserver)
  setupAutoScroll();

  // Prefetch
  setupPrefetchListener();

  // Menu commands
  registerMenuCommands();

  // Auto enter reader mode
  if (store.settings.autoEnterSinglePage) {
    setTimeout(() => spmHandle.open(), 1000);
  }
})();
