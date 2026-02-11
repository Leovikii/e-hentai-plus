import { store } from '../../state/store';
import { isImageReady } from '../../utils/dom';

export interface ThumbnailPanelHandle {
  update: () => void;
  getElement: () => HTMLElement;
}

const ITEM_HEIGHT = 80;
const VISIBLE_COUNT = 12;
const BUFFER = 3;

export function createThumbnailPanel(
  onIndexChange: (index: number) => void,
): ThumbnailPanelHandle {
  const panel = document.createElement('div');
  panel.className = 'sp-thumb-panel';

  const viewport = document.createElement('div');
  viewport.className = 'sp-thumb-viewport';

  const content = document.createElement('div');
  content.className = 'sp-thumb-content';

  const counter = document.createElement('div');
  counter.className = 'sp-thumb-counter';

  viewport.appendChild(content);
  panel.appendChild(viewport);
  panel.appendChild(counter);

  let scrollOffset = 0;
  let lastCenteredIndex = -1;
  let clickedFromPanel = false;
  const itemPool: HTMLElement[] = [];
  const activeItems = new Map<number, HTMLElement>();

  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  function vpHeight(): number {
    return Math.min(VISIBLE_COUNT * ITEM_HEIGHT, store.allImages.length * ITEM_HEIGHT);
  }

  function maxOffset(): number {
    return Math.max(0, store.allImages.length * ITEM_HEIGHT - vpHeight());
  }

  function acquireItem(): HTMLElement {
    return itemPool.pop() || (() => {
      const el = document.createElement('div');
      el.className = 'sp-thumb-item';
      return el;
    })();
  }

  function releaseItem(el: HTMLElement): void {
    el.remove();
    itemPool.push(el);
  }

  function renderItemContent(el: HTMLElement, index: number): void {
    el.dataset.index = String(index);
    el.classList.toggle('sp-thumb-active', index === store.currentImageIndex);

    const img = store.allImages[index];
    if (img && isImageReady(img)) {
      let thumbImg = el.querySelector('img') as HTMLImageElement | null;
      if (!thumbImg) {
        el.innerHTML = '';
        thumbImg = document.createElement('img');
        thumbImg.className = 'sp-thumb-img';
        el.appendChild(thumbImg);
      }
      if (thumbImg.src !== img.src) {
        thumbImg.src = img.src;
      }
    } else {
      if (!el.querySelector('.sp-thumb-ph')) {
        el.innerHTML = '';
        const ph = document.createElement('div');
        ph.className = 'sp-thumb-ph';
        ph.textContent = String(index + 1);
        el.appendChild(ph);
      }
    }
  }

  function renderVisibleItems(): void {
    const total = store.allImages.length;
    if (total === 0) return;

    const vp = vpHeight();
    viewport.style.height = `${vp}px`;
    content.style.height = `${total * ITEM_HEIGHT}px`;

    scrollOffset = clamp(scrollOffset, 0, maxOffset());

    const startIdx = Math.max(0, Math.floor(scrollOffset / ITEM_HEIGHT) - BUFFER);
    const endIdx = Math.min(total - 1, Math.ceil((scrollOffset + vp) / ITEM_HEIGHT) + BUFFER);

    for (const [idx, el] of activeItems) {
      if (idx < startIdx || idx > endIdx) {
        releaseItem(el);
        activeItems.delete(idx);
      }
    }

    for (let i = startIdx; i <= endIdx; i++) {
      let el = activeItems.get(i);
      if (!el) {
        el = acquireItem();
        activeItems.set(i, el);
        content.appendChild(el);
      }
      el.style.transform = `translateY(${i * ITEM_HEIGHT}px)`;
      renderItemContent(el, i);
    }

    content.style.transform = `translateY(${-scrollOffset}px)`;
  }

  function centerOnCurrent(): void {
    const vp = vpHeight();
    const target = store.currentImageIndex * ITEM_HEIGHT - vp / 2 + ITEM_HEIGHT / 2;
    scrollOffset = clamp(target, 0, maxOffset());
  }

  function ensureVisible(): void {
    const vp = vpHeight();
    const itemTop = store.currentImageIndex * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;
    if (itemTop < scrollOffset) {
      scrollOffset = itemTop;
    } else if (itemBottom > scrollOffset + vp) {
      scrollOffset = itemBottom - vp;
    }
    scrollOffset = clamp(scrollOffset, 0, maxOffset());
  }

  function update(): void {
    if (store.currentImageIndex !== lastCenteredIndex) {
      if (clickedFromPanel) {
        ensureVisible();
        clickedFromPanel = false;
      } else {
        centerOnCurrent();
      }
      lastCenteredIndex = store.currentImageIndex;
    }
    renderVisibleItems();
    counter.textContent = `${store.currentImageIndex + 1} / ${store.allImages.length}`;
  }

  // Wheel: scroll thumbnail list, isolate from reader navigation
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    scrollOffset = clamp(scrollOffset + e.deltaY, 0, maxOffset());
    renderVisibleItems();
  }, { passive: false });

  // Click: event delegation
  content.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.sp-thumb-item') as HTMLElement | null;
    if (item?.dataset.index) {
      const index = parseInt(item.dataset.index);
      if (!isNaN(index) && index >= 0 && index < store.allImages.length) {
        clickedFromPanel = true;
        onIndexChange(index);
      }
    }
  });

  return { update, getElement: () => panel };
}
