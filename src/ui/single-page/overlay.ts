import { store } from '../../state/store';
import { qa } from '../../utils/dom';
import { getNextUrl } from '../../services/page-parser';
import { createScrollbar } from './scrollbar';
import { setupNavigation } from './navigation';
import { createAutoPlay } from './auto-play';
import type { SinglePageModeHandle } from '../../types';

export interface OverlayDeps {
  onLoadNextPage: (links: string[], doc: Document) => void;
}

export function createSinglePageOverlay(deps: OverlayDeps): SinglePageModeHandle {
  const overlay = document.createElement('div');
  overlay.className = 'single-page-overlay';

  const closeBtn = document.createElement('div');
  closeBtn.className = 'sp-close-btn';
  closeBtn.innerHTML = '&#10005;';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'sp-image-container';

  const currentImage = document.createElement('img');
  currentImage.className = 'sp-current-image';
  imageContainer.appendChild(currentImage);

  let loadPollTimer: ReturnType<typeof setInterval> | null = null;

  function isImageReady(img: HTMLImageElement): boolean {
    return !!(img && img.src && !img.src.includes('data:') && img.complete && img.naturalWidth > 0);
  }

  function clearLoadPoll(): void {
    if (loadPollTimer) {
      clearInterval(loadPollTimer);
      loadPollTimer = null;
    }
  }

  function showPlaceholder(): void {
    currentImage.style.display = 'none';
    const existing = imageContainer.querySelector('.sp-placeholder');
    if (existing) existing.remove();

    const ph = document.createElement('div');
    ph.className = 'sp-placeholder';
    ph.innerHTML = `<div class="sp-placeholder-pulse"></div><div class="sp-placeholder-text">${store.currentImageIndex + 1} / ${store.allImages.length}</div>`;
    imageContainer.appendChild(ph);
  }

  function removePlaceholder(): void {
    const ph = imageContainer.querySelector('.sp-placeholder');
    if (ph) ph.remove();
    currentImage.style.display = '';
  }

  function updateImage(): void {
    clearLoadPoll();
    const idx = store.currentImageIndex;
    const img = store.allImages[idx];

    if (!img) {
      showPlaceholder();
      scrollbar.update();
      startLoadPoll(idx);
      return;
    }

    if (isImageReady(img)) {
      removePlaceholder();
      currentImage.src = img.src;
      scrollbar.update();
      return;
    }

    showPlaceholder();
    scrollbar.update();
    startLoadPoll(idx);
  }

  function startLoadPoll(idx: number): void {
    const wasAutoPlaying = !!store.autoPlayTimer;
    if (wasAutoPlaying) autoPlay.stop();

    loadPollTimer = setInterval(() => {
      if (store.currentImageIndex !== idx) {
        clearLoadPoll();
        return;
      }

      const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
      if (freshImages.length !== store.allImages.length) {
        store.allImages = freshImages;
        scrollbar.update();
      }

      const img = store.allImages[idx];
      if (img && isImageReady(img)) {
        clearLoadPoll();
        removePlaceholder();
        currentImage.src = img.src;
        scrollbar.update();
        if (wasAutoPlaying && store.settings.autoPlay) autoPlay.start();
      }
    }, 200);
  }

  // Wire up sub-modules (forward declarations resolved via closures)
  const autoPlay = createAutoPlay(() => nav.nextImage());

  const scrollbar = createScrollbar((index) => {
    store.currentImageIndex = index;
    updateImage();
    autoPlay.reset();
  });

  const nav = setupNavigation({
    overlay,
    updateImage,
    checkAndLoadNextPage: () => checkAndLoadNextPage(),
    resetAutoPlay: () => autoPlay.reset(),
    stopAutoPlayAtEnd: () => autoPlay.stopAtEnd(),
    closeSinglePageMode: () => close(),
  });

  // Assemble DOM
  overlay.appendChild(closeBtn);
  overlay.appendChild(scrollbar.getElement());
  overlay.appendChild(imageContainer);
  document.body.appendChild(overlay);

  closeBtn.onclick = () => close();

  function open(): void {
    store.allImages = Array.from(qa('.r-img')) as HTMLImageElement[];
    if (store.allImages.length === 0) {
      alert('Please wait for images to load');
      return;
    }

    const viewportCenter = window.scrollY + window.innerHeight / 2;
    const searchRange = window.innerHeight * 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    store.allImages.forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      const imgTop = rect.top + window.scrollY;

      if (Math.abs(imgTop - viewportCenter) < searchRange) {
        const imgCenter = imgTop + rect.height / 2;
        const distance = Math.abs(imgCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      }
    });

    store.currentImageIndex = closestIndex;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateImage();

    if (store.settings.autoPlay) {
      autoPlay.start();
    }
  }

  function close(): void {
    clearLoadPoll();
    autoPlay.stop();
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    const currentImages = Array.from(qa('.r-img')) as HTMLImageElement[];
    if (store.currentImageIndex >= 0 && store.currentImageIndex < currentImages.length) {
      const targetImg = currentImages[store.currentImageIndex];
      if (targetImg) {
        setTimeout(() => {
          targetImg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }

  // Listen for autoPlay setting changes from float-control button
  store.on('settingsChanged', () => {
    if (!overlay.classList.contains('active')) return;
    if (store.settings.autoPlay) {
      autoPlay.start();
    } else {
      autoPlay.stop();
    }
  });

  function checkAndLoadNextPage(): void {
    if (!store.settings.autoScroll || !store.nextUrl || store.isFetching) return;

    const remainingImages = store.allImages.length - store.currentImageIndex;
    if (remainingImages <= 10) {
      store.isFetching = true;

      const parser = new DOMParser();
      fetch(store.nextUrl).then(r => r.text()).then(html => {
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(qa('#gdt a', doc)).map(a => (a as HTMLAnchorElement).href);

        deps.onLoadNextPage(links, doc);

        const mainBox = document.querySelector('#gdt');
        if (mainBox) {
          const expectedTotal = store.allImages.length + links.length;
          const obs = new MutationObserver(() => {
            const newImages = Array.from(qa('.r-img')) as HTMLImageElement[];
            if (newImages.length !== store.allImages.length) {
              store.allImages = newImages;
              scrollbar.update();
            }
            if (newImages.length >= expectedTotal) {
              obs.disconnect();
            }
          });
          obs.observe(mainBox, { childList: true, subtree: true });
          setTimeout(() => {
            obs.disconnect();
            const finalImages = Array.from(qa('.r-img')) as HTMLImageElement[];
            if (finalImages.length !== store.allImages.length) {
              store.allImages = finalImages;
              scrollbar.update();
            }
          }, 30000);
        }

        store.nextUrl = getNextUrl(doc);
        store.isFetching = false;
        store.nextPagePrefetched = false;
      }).catch((err) => {
        console.error('[Single Page] Load failed', err);
        store.isFetching = false;
      });
    }
  }

  return {
    open,
    close,
    isActive: () => overlay.classList.contains('active'),
    getOverlayElement: () => overlay,
  };
}
