import { store } from '../state/store';
import { qa } from '../utils/dom';

let visibleObserver: IntersectionObserver | null = null;

export function initMemoryManager(): void {
  // 1. Track currentImageIndex in scroll mode so priority scheduling and recycling work
  visibleObserver = new IntersectionObserver((entries) => {
    if (document.querySelector('.single-page-overlay.active')) return;
    
    // Find the entry closest to the center
    const visible = entries.find(e => e.isIntersecting);
    if (visible) {
      const idx = store.allImages.indexOf(visible.target as HTMLImageElement);
      if (idx !== -1) {
        store.currentImageIndex = idx;
      }
    }
  }, { rootMargin: '-50% 0px -50% 0px' });

  // Watch for new images to observe
  const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
  if (mainBox) {
    const domObs = new MutationObserver(() => {
      const images = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
      if (images.length !== store.allImages.length) {
        store.allImages = images;
        images.forEach(img => {
          if (!img.dataset.observed && img.tagName === 'IMG') {
            visibleObserver?.observe(img);
            img.dataset.observed = 'true';
          }
        });
      }
    });
    domObs.observe(mainBox, { childList: true, subtree: true });
  }

  // 2. Periodic memory recycling (Virtual DOM behavior for image bitmaps)
  setInterval(() => {
    if (store.allImages.length < 40) return; // Only recycle on large galleries
    
    const curr = store.currentImageIndex;
    const buffer = 30; // Keep 30 images before and after fully loaded

    store.allImages.forEach((img, i) => {
      const distance = Math.abs(i - curr);
      
      if (distance > buffer) {
        // Unload far away images to free RAM/GPU
        if (img.tagName === 'IMG' && (img as HTMLImageElement).src && (img as HTMLImageElement).complete) {
          img.dataset.recycledSrc = (img as HTMLImageElement).src;
          img.removeAttribute('src');
        }
      } else {
        // Restore images that come back into the buffer zone
        if (img.tagName === 'IMG' && !(img as HTMLImageElement).src && img.dataset.recycledSrc) {
          (img as HTMLImageElement).src = img.dataset.recycledSrc;
          delete img.dataset.recycledSrc;
        }
      }
    });
  }, 2000);
}
