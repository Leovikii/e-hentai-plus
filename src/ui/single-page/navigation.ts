import { store } from '../../state/store';
import { qa } from '../../utils/dom';

export interface NavigationDeps {
  overlay: HTMLElement;
  updateImage: () => void;
  checkAndLoadNextPage: () => void;
  checkAndLoadPrevPage: () => void;
  resetAutoPlay: () => void;
  stopAutoPlayAtEnd: () => void;
  closeSinglePageMode: () => void;
}

export function setupNavigation(deps: NavigationDeps): {
  nextImage: () => void;
  previousImage: () => void;
} {
  function hasLoadingPlaceholders(): boolean {
    return document.querySelectorAll('.r-ph').length > 0;
  }

  function isCurrentImageLoading(): boolean {
    const img = store.allImages[store.currentImageIndex];
    if (!img) return true;
    if (img.classList.contains('r-ph') || img.classList.contains('loading') || img.classList.contains('error')) return true;
    const htmlImg = img as HTMLImageElement;
    if (htmlImg.tagName === 'IMG' && (!htmlImg.complete || htmlImg.naturalWidth === 0)) return true;
    return false;
  }

  function syncAllImages(): void {
    const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
    if (freshImages.length !== store.allImages.length) {
      store.allImages = freshImages;
    }
  }

  function nextImage(): void {
    // Only sync DOM when near the end where new images may have appeared
    if (store.currentImageIndex >= store.allImages.length - 3) {
      syncAllImages();
    }

    if (store.currentImageIndex < store.allImages.length - 1) {
      store.currentImageIndex++;
      deps.updateImage();
      deps.checkAndLoadNextPage();
    } else if (hasLoadingPlaceholders()) {
      deps.updateImage();
      deps.checkAndLoadNextPage();
    } else {
      deps.checkAndLoadNextPage();
      if (store.autoPlay) {
        deps.stopAutoPlayAtEnd();
      }
    }
  }

  function previousImage(): void {
    if (store.currentImageIndex > 0) {
      store.currentImageIndex--;
      deps.updateImage();
      if (store.autoPlay) {
        deps.resetAutoPlay();
      }
    }
    if (store.currentImageIndex <= 3) {
      deps.checkAndLoadPrevPage();
    }
  }

  // Wheel scroll
  let accumulatedDelta = 0;
  let isScrolling = false;
  let lastFlipTime = 0;
  let wheelTimeout: ReturnType<typeof setTimeout>;

  const processWheelScroll = (): void => {
    if (!isScrolling) return;

    const threshold = 70;
    const now = Date.now();
    const isLoading = isCurrentImageLoading();
    // Use 600ms if loading to wait for image, otherwise 60ms to allow rapid scrolling
    const cooldown = isLoading ? 600 : 60;
    
    if (Math.abs(accumulatedDelta) >= threshold && (now - lastFlipTime) >= cooldown) {
      if (accumulatedDelta > 0) {
        nextImage();
      } else {
        previousImage();
      }
      accumulatedDelta = 0;
      lastFlipTime = now;
    }

    if (isScrolling) {
      requestAnimationFrame(processWheelScroll);
    }
  };

  deps.overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    let normalizedDelta = e.deltaY;
    if (e.deltaMode === 1) {
      normalizedDelta *= 33; 
    } else if (e.deltaMode === 2) {
      normalizedDelta *= 800;
    }
    
    accumulatedDelta += normalizedDelta;
    
    // Clamp accumulated delta to prevent runaway scrolling
    if (accumulatedDelta > 140) accumulatedDelta = 140;
    else if (accumulatedDelta < -140) accumulatedDelta = -140;
    
    if (!isScrolling) {
      isScrolling = true;
      processWheelScroll();
    }
    
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      isScrolling = false;
      accumulatedDelta = 0;
    }, 150);
  }, { passive: false });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!deps.overlay.classList.contains('active')) return;
    if (e.key === 'Escape') {
      deps.closeSinglePageMode();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      previousImage();
    }
  });

  return { nextImage, previousImage };
}
