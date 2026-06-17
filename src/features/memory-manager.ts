import { store } from '../state/store';
import { qa } from '../utils/dom';

export function initMemoryManager(): void {
  // Watch for new images to observe
  const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
  if (mainBox) {
    const domObs = new MutationObserver(() => {
      const images = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
      let changed = images.length !== store.allImages.length;
      if (!changed) {
        for (let i = 0; i < images.length; i++) {
          if (images[i] !== store.allImages[i]) {
            changed = true;
            break;
          }
        }
      }
      
      if (changed) {
        store.allImages = images;
      }
    });
    domObs.observe(mainBox, { childList: true, subtree: true });
  }

  // Periodic memory recycling (Virtual DOM behavior for image bitmaps)
  setInterval(() => {
    if (store.allImages.length < 40) return; // Only recycle on large galleries
    if (document.querySelector('.single-page-overlay.active')) return;
    
    // Find currentImageIndex robustly based on viewport
    const viewportCenter = window.innerHeight / 2;
    let minDistance = Infinity;
    let closestIndex = store.currentImageIndex;

    store.allImages.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = i;
        }
      }
    });

    store.currentImageIndex = closestIndex;
    const curr = store.currentImageIndex;
    const buffer = 30; // Keep 30 images before and after fully loaded

    store.allImages.forEach((img, i) => {
      const distance = Math.abs(i - curr);
      
      if (distance > buffer) {
        // Unload far away images to free RAM/GPU
        if (img.tagName === 'IMG' && img.hasAttribute('src') && (img as HTMLImageElement).complete) {
          img.dataset.recycledSrc = img.getAttribute('src') || '';
          img.removeAttribute('src');
        }
      } else {
        // Restore images that come back into the buffer zone
        if (img.tagName === 'IMG' && !img.hasAttribute('src') && img.dataset.recycledSrc) {
          img.setAttribute('src', img.dataset.recycledSrc);
          delete img.dataset.recycledSrc;
        }
      }
    });
  }, 2000);
}
