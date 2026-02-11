import { store } from '../../state/store';
import { qa } from '../../utils/dom';

export interface NavigationDeps {
  overlay: HTMLElement;
  updateImage: () => void;
  checkAndLoadNextPage: () => void;
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
      if (store.settings.autoPlay) {
        deps.stopAutoPlayAtEnd();
      }
    }
  }

  function previousImage(): void {
    if (store.currentImageIndex > 0) {
      store.currentImageIndex--;
      deps.updateImage();
      if (store.settings.autoPlay) {
        deps.resetAutoPlay();
      }
    }
  }

  // Wheel scroll
  let wheelTimeout: ReturnType<typeof setTimeout>;
  let wheelDelta = 0;
  let isScrolling = false;

  const processWheelScroll = (): void => {
    if (!isScrolling) return;
    const threshold = 100;
    if (Math.abs(wheelDelta) >= threshold) {
      if (wheelDelta > 0) {
        nextImage();
      } else {
        previousImage();
      }
      wheelDelta = wheelDelta > 0 ? wheelDelta - threshold : wheelDelta + threshold;
    }
    if (isScrolling) {
      requestAnimationFrame(processWheelScroll);
    }
  };

  deps.overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelDelta += e.deltaY;
    if (!isScrolling) {
      isScrolling = true;
      processWheelScroll();
    }
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      isScrolling = false;
      wheelDelta = 0;
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
