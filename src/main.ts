import 'virtual:uno.css';
import './ui/styles.css';
import { store } from './state/store';
import { SiteManager } from './sites/site-manager';
import { processBatch, setupAutoScroll } from './features/scroll-mode';
import { initSinglePageMode } from './features/single-page-mode';
import { createFloatControl } from './ui/float-control';
import { registerMenuCommands } from './menu-commands';
import { initMemoryManager } from './features/memory-manager';

(async function main() {
  const adapter = SiteManager.getAdapter(window.location.href);
  if (!adapter) return; // Exit if no adapter matches current URL

  store.activeAdapter = adapter;
  const initData = await adapter.init(document);
  if (!initData.links || initData.links.length === 0) return; // Nothing to process

  store.totalPage = initData.totalPage ?? 1;
  store.nextUrl = initData.nextUrl;
  store.prevUrl = initData.prevUrl;
  store.perPage = initData.links.length;

  const container = adapter.getContainer();
  if (!container && store.settings.scrollMode) return;

  if (store.settings.scrollMode) {
    document.documentElement.classList.add('scroll-mode');
    adapter.hideOriginalElements?.();
    if (container) container.innerHTML = '';
    processBatch(initData.links, store.currPage, container!);
    setupAutoScroll();
  } else {
    const hiddenBox = document.createElement('div');
    hiddenBox.id = 'gdt-hidden';
    hiddenBox.style.display = 'none';
    document.body.appendChild(hiddenBox);
    processBatch(initData.links, store.currPage, hiddenBox);
  }

  // Initialize single page mode with lazy wrapper for circular dependency
  let spmHandle: ReturnType<typeof initSinglePageMode>;

  createFloatControl({
    open: () => spmHandle.open(),
    close: () => spmHandle.close(),
    isActive: () => spmHandle.isActive(),
    getOverlayElement: () => spmHandle.getOverlayElement(),
    jumpTo: (index: number) => spmHandle.jumpTo(index),
  });

  spmHandle = initSinglePageMode();

  // Menu commands
  registerMenuCommands();

  // Auto enter reader mode
  if (store.settings.autoEnterSinglePage) {
    setTimeout(() => spmHandle.open(), 1000);
  }

  initMemoryManager();
})();
