import { store } from '../../state/store';
import { createThumbnailPanel } from './thumbnail-panel';

export interface ScrollbarHandle {
  update: () => void;
  getElement: () => HTMLElement;
}

export function createScrollbar(onIndexChange: (index: number) => void): ScrollbarHandle {
  const pageIndicator = document.createElement('div');
  pageIndicator.className = 'sp-scrollbar';

  const scrollbarThumb = document.createElement('div');
  scrollbarThumb.className = 'sp-scrollbar-thumb';

  const scrollbarLabel = document.createElement('div');
  scrollbarLabel.className = 'sp-scrollbar-label';

  pageIndicator.appendChild(scrollbarThumb);
  pageIndicator.appendChild(scrollbarLabel);

  const thumbPanel = createThumbnailPanel(onIndexChange);
  pageIndicator.appendChild(thumbPanel.getElement());
  scrollbarLabel.style.display = 'none';

  let cachedTrackHeight = 0;

  function refreshTrackHeight(): void {
    cachedTrackHeight = pageIndicator.offsetHeight;
  }

  window.addEventListener('resize', refreshTrackHeight, { passive: true });

  function update(): void {
    if (store.allImages.length === 0) return;

    if (!cachedTrackHeight) refreshTrackHeight();
    const trackHeight = cachedTrackHeight;
    let thumbHeight: number;

    if (store.allImages.length <= 10) {
      thumbHeight = 60;
    } else if (store.allImages.length <= 50) {
      thumbHeight = Math.max(60, trackHeight * (10 / store.allImages.length));
    } else {
      thumbHeight = Math.max(60, trackHeight * (5 / store.allImages.length));
    }

    const scrollProgress = store.currentImageIndex / Math.max(1, store.allImages.length - 1);
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = scrollProgress * maxThumbTop;

    scrollbarThumb.style.height = `${thumbHeight}px`;
    scrollbarThumb.style.top = `${thumbTop}px`;
    scrollbarLabel.textContent = `${store.currentImageIndex + 1} / ${store.allImages.length}`;
    thumbPanel.update();
  }

  // Click to seek
  pageIndicator.onclick = (e) => {
    if (e.target === scrollbarThumb) return;
    if (thumbPanel.getElement().contains(e.target as Node)) return;
    const rect = pageIndicator.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollProgress = Math.min(1, Math.max(0, clickY / rect.height));
    const targetIndex = Math.round(scrollProgress * (store.allImages.length - 1));
    if (targetIndex >= 0 && targetIndex < store.allImages.length) {
      onIndexChange(targetIndex);
    }
  };

  // Drag functionality
  let isDragging = false;
  let dragStartY = 0;
  let thumbStartTop = 0;

  scrollbarThumb.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    dragStartY = e.clientY;
    thumbStartTop = scrollbarThumb.offsetTop;
    document.body.style.userSelect = 'none';
  };

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;
    const newTop = thumbStartTop + deltaY;
    const trackHeight = cachedTrackHeight;
    const thumbHeight = scrollbarThumb.offsetHeight;
    const maxTop = trackHeight - thumbHeight;
    const clampedTop = Math.max(0, Math.min(maxTop, newTop));
    const scrollProgress = maxTop > 0 ? clampedTop / maxTop : 0;
    const targetIndex = Math.round(scrollProgress * (store.allImages.length - 1));
    if (targetIndex >= 0 && targetIndex < store.allImages.length && targetIndex !== store.currentImageIndex) {
      onIndexChange(targetIndex);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
    }
  });

  scrollbarThumb.onclick = (e) => e.stopPropagation();

  return { update, getElement: () => pageIndicator };
}
