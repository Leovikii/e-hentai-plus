import { store } from '../../state/store';
import { CFG } from '../../state/config';
import { qa, isImageReady, fetchPageLinks } from '../../utils/dom';
import { getNextUrl, getPrevUrl } from '../../services/page-parser';
import { createScrollbar } from './scrollbar';
import { setupNavigation } from './navigation';
import { createAutoPlay } from './auto-play';
import type { SinglePageModeHandle } from '../../types';

export interface OverlayDeps {
  onLoadNextPage: (links: string[], doc: Document) => void;
  onLoadPrevPage: (links: string[], doc: Document) => void;
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

  // Error handler for the overlay display image itself
  currentImage.addEventListener('error', () => {
    if (!overlay.classList.contains('active')) return;
    if (!currentImage.src || currentImage.src === location.href) return;
    showError();
  });

  let loadPollTimer: ReturnType<typeof setInterval> | null = null;
  let loadTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let loadObserver: MutationObserver | null = null;

  function clearLoadPoll(): void {
    if (loadPollTimer) {
      clearInterval(loadPollTimer);
      loadPollTimer = null;
    }
    if (loadTimeoutTimer) {
      clearTimeout(loadTimeoutTimer);
      loadTimeoutTimer = null;
    }
    if (loadObserver) {
      loadObserver.disconnect();
      loadObserver = null;
    }
  }

  function showPlaceholder(statusText: string = 'Loading...'): void {
    currentImage.style.display = 'none';
    removeErrorUI();
    const existing = imageContainer.querySelector('.sp-placeholder');
    if (existing) existing.remove();

    const ph = document.createElement('div');
    ph.className = 'sp-placeholder';
    ph.innerHTML = `
      <div class="sp-placeholder-pulse"></div>
      <div class="sp-placeholder-text">${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}</div>
      <div class="sp-placeholder-status" style="margin-top: 10px; font-size: 14px; opacity: 0.8; font-weight: bold; letter-spacing: 0.5px;">${statusText}</div>
    `;
    imageContainer.appendChild(ph);
  }

  function removePlaceholder(): void {
    const ph = imageContainer.querySelector('.sp-placeholder');
    if (ph) ph.remove();
    removeErrorUI();
    currentImage.style.display = '';
  }

  function showError(): void {
    clearLoadPoll();
    currentImage.style.display = 'none';
    const existing = imageContainer.querySelector('.sp-placeholder');
    if (existing) existing.remove();
    removeErrorUI();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'sp-error';
    errorDiv.innerHTML = `<div class="sp-error-text">${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}</div><div class="sp-error-msg">Load Failed</div><button class="sp-error-retry">Retry</button>`;
    const retryBtn = errorDiv.querySelector('.sp-error-retry') as HTMLButtonElement;
    retryBtn.onclick = () => retryCurrentImage();
    imageContainer.appendChild(errorDiv);
  }

  function removeErrorUI(): void {
    const err = imageContainer.querySelector('.sp-error');
    if (err) err.remove();
  }

  function retryCurrentImage(): void {
    const idx = store.currentImageIndex;
    // Re-sync DOM images first
    syncImages();
    const img = store.allImages[idx];
    if (img) {
      // Force re-download by resetting src
      const oldSrc = img.src;
      img.removeAttribute('src');
      img.src = oldSrc;
    }
    // Re-enter the normal loading flow
    updateImage();
  }

  function syncImages(): void {
    const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
    if (freshImages.length !== store.allImages.length || freshImages.some((img, i) => img !== store.allImages[i])) {
      store.allImages = freshImages;
      scrollbar.update();
    }
  }

  let currentDecodePromise: Promise<void> | null = null;

  function renderImageSafely(targetIdx: number, src: string, onComplete?: () => void): void {
    if (currentImage.src === src) {
      removePlaceholder();
      scrollbar.update();
      if (onComplete) onComplete();
      return;
    }

    showPlaceholder('Decoding Image...');
    currentImage.removeAttribute('src'); // Clear old image instantly
    currentImage.src = src;
    
    const promise = currentImage.decode();
    currentDecodePromise = promise;

    promise.then(() => {
      if (currentDecodePromise !== promise || store.currentImageIndex !== targetIdx) return;
      removePlaceholder();
      scrollbar.update();
      if (onComplete) onComplete();
    }).catch(() => {
      // Fallback if decode fails or is not supported
      if (currentDecodePromise !== promise || store.currentImageIndex !== targetIdx) return;
      removePlaceholder();
      scrollbar.update();
      if (onComplete) onComplete();
    });
  }

  function updateImage(): void {
    clearLoadPoll();
    removeErrorUI();
    const idx = store.currentImageIndex;

    // Re-sync DOM to catch any replacements (error→retry→new img)
    syncImages();
    const img = store.allImages[idx];

    if (!img) {
      showPlaceholder('Waiting for network...');
      scrollbar.update();
      startLoadPoll(idx);
      return;
    }

    if (isImageReady(img)) {
      renderImageSafely(idx, img.src);
      return;
    }

    showPlaceholder('Downloading Image...');
    scrollbar.update();
    startLoadPoll(idx);
  }

  function startLoadPoll(idx: number): void {
    const wasAutoPlaying = !!store.autoPlayTimer;
    if (wasAutoPlaying) autoPlay.stop();

    let imageErrored = false;
    let lastKnownImg = store.allImages[idx];

    function onImageReady(): void {
      if (store.currentImageIndex !== idx) return;
      // Re-check with fresh reference in case DOM was swapped
      const img = store.allImages[idx];
      if (img && isImageReady(img)) {
        clearLoadPoll();
        renderImageSafely(idx, img.src, () => {
          if (wasAutoPlaying && store.autoPlay) autoPlay.start();
        });
      }
    }

    function onImageError(): void {
      imageErrored = true;
      if (wasAutoPlaying && store.autoPlay) {
        tryAutoSkip();
      } else {
        // Non-autoplay: show error UI with retry button
        if (store.currentImageIndex === idx) {
          showError();
        }
      }
    }

    function tryAutoSkip(): void {
      if (store.currentImageIndex !== idx) return;
      const nextIdx = idx + 1;
      if (nextIdx < store.allImages.length) {
        const nextImg = store.allImages[nextIdx];
        if (nextImg && isImageReady(nextImg)) {
          clearLoadPoll();
          store.currentImageIndex = nextIdx;
          renderImageSafely(nextIdx, nextImg.src, () => {
            checkAndLoadNextPage();
            autoPlay.start();
          });
          return;
        }
      }
      // Next image not ready either — skip forward and let it poll again
      if (nextIdx < store.allImages.length || imageErrored) {
        clearLoadPoll();
        store.currentImageIndex = nextIdx < store.allImages.length ? nextIdx : idx;
        updateImage();
        if (nextIdx < store.allImages.length) {
          checkAndLoadNextPage();
        }
      }
    }

    // Watch for the target image becoming ready via load/error events
    if (lastKnownImg) {
      lastKnownImg.addEventListener('load', onImageReady, { once: true });
      lastKnownImg.addEventListener('error', onImageError, { once: true });
    }

    // Watch for new images appearing in DOM (auto-scroll adding pages)
    const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
    if (mainBox) {
      loadObserver = new MutationObserver(() => {
        if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
        const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
        if (freshImages.length !== store.allImages.length) {
          store.allImages = freshImages;
          scrollbar.update();
        }
        // Check if the image at idx changed (e.g. error→retry created a new <img>)
        const currentImg = store.allImages[idx];
        if (currentImg && currentImg !== lastKnownImg) {
          lastKnownImg = currentImg;
          currentImg.addEventListener('load', onImageReady, { once: true });
          currentImg.addEventListener('error', onImageError, { once: true });
          if (isImageReady(currentImg)) onImageReady();
        }
      });
      loadObserver.observe(mainBox, { childList: true, subtree: true });
    }

    // Fallback poll for cached images that don't fire load
    loadPollTimer = setInterval(() => {
      if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
      // Check if the image reference changed (DOM swap not caught by observer)
      const currentImg = store.allImages[idx];
      if (currentImg && currentImg !== lastKnownImg) {
        lastKnownImg = currentImg;
        currentImg.addEventListener('load', onImageReady, { once: true });
        currentImg.addEventListener('error', onImageError, { once: true });
      }
      onImageReady();
    }, 1000);

    // Timeout: if image isn't ready after N seconds and auto-playing, skip forward
    if (wasAutoPlaying && store.autoPlay) {
      loadTimeoutTimer = setTimeout(() => {
        if (store.currentImageIndex !== idx) return;
        const img = store.allImages[idx];
        if (img && isImageReady(img)) return;
        tryAutoSkip();
      }, CFG.imageLoadTimeout);
    }
  }

  // Wire up sub-modules (forward declarations resolved via closures)
  const autoPlay = createAutoPlay(() => nav.nextImage());

  const scrollbar = createScrollbar((index) => {
    store.currentImageIndex = index;
    updateImage();
    autoPlay.reset();
  }, () => loadNextPage(), () => loadPrevPage());

  const nav = setupNavigation({
    overlay,
    updateImage,
    checkAndLoadNextPage: () => checkAndLoadNextPage(),
    checkAndLoadPrevPage: () => loadPrevPage(),
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

    let startIndex = 0;

    if (store.settings.scrollMode) {
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const searchRange = window.innerHeight * 2;
      let minDistance = Infinity;

      store.allImages.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const imgTop = rect.top + window.scrollY;

        if (Math.abs(imgTop - viewportCenter) < searchRange) {
          const imgCenter = imgTop + rect.height / 2;
          const distance = Math.abs(imgCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            startIndex = index;
          }
        }
      });
    } else {
      // Non-scroll mode: start at first image of current page (index 0 in allImages)
      startIndex = 0;
    }

    store.currentImageIndex = startIndex;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateImage();
    store.emit('readerModeChanged');

    if (store.autoPlay) {
      autoPlay.start();
    }
  }

  function close(): void {
    clearLoadPoll();
    removeErrorUI();
    autoPlay.stop();
    store.autoPlay = false;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    store.emit('readerModeChanged');

    if (store.settings.scrollMode) {
      const currentImages = Array.from(qa('.r-img')) as HTMLImageElement[];
      if (store.currentImageIndex >= 0 && store.currentImageIndex < currentImages.length) {
        const targetImg = currentImages[store.currentImageIndex];
        if (targetImg) {
          setTimeout(() => {
            targetImg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    } else {
      // Navigate to the page containing the current image
      const globalIndex = store.imageOffset + store.currentImageIndex;
      const targetPage = Math.floor(globalIndex / store.perPage);
      const url = new URL(window.location.href);
      const currentPage = parseInt(url.searchParams.get('p') || '0');
      if (targetPage !== currentPage) {
        url.searchParams.set('p', String(targetPage));
        window.location.href = url.toString();
      }
    }
  }

  // Listen for autoPlay setting changes from float-control button
  store.on('settingsChanged', () => {
    if (!overlay.classList.contains('active')) return;
    if (store.autoPlay) {
      autoPlay.start();
    } else {
      autoPlay.stop();
    }
  });

  function loadNextPage(): void {
    if (!store.nextUrl || store.isFetching) return;

    store.isFetching = true;

    fetchPageLinks(store.nextUrl).then(({ doc, links }) => {

      deps.onLoadNextPage(links, doc);

      const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
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

  function loadPrevPage(): void {
    if (!store.prevUrl || store.isFetching || store.imageOffset <= 0) return;

    store.isFetching = true;

    fetchPageLinks(store.prevUrl).then(({ doc, links }) => {
      const prevCount = links.length;

      deps.onLoadPrevPage(links, doc);

      const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
      if (mainBox) {
        const expectedTotal = store.allImages.length + prevCount;
        const obs = new MutationObserver(() => {
          const newImages = Array.from(qa('.r-img')) as HTMLImageElement[];
          if (newImages.length !== store.allImages.length) {
            // Adjust currentImageIndex to account for prepended images
            const added = newImages.length - store.allImages.length;
            store.currentImageIndex += added;
            store.imageOffset -= added;
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
            const added = finalImages.length - store.allImages.length;
            store.currentImageIndex += added;
            store.imageOffset -= added;
            store.allImages = finalImages;
            scrollbar.update();
          }
        }, 30000);
      }

      store.prevUrl = getPrevUrl(doc);
      store.isFetching = false;
    }).catch((err) => {
      console.error('[Single Page] Load prev failed', err);
      store.isFetching = false;
    });
  }

  function checkAndLoadNextPage(): void {
    if (!store.nextUrl || store.isFetching) return;

    const remainingImages = store.allImages.length - store.currentImageIndex;
    if (remainingImages <= 10) {
      loadNextPage();
    }
  }

  function jumpTo(index: number): void {
    if (!overlay.classList.contains('active')) return;
    store.currentImageIndex = Math.max(0, Math.min(index, store.allImages.length - 1));
    updateImage();
    autoPlay.reset();
  }

  return {
    open,
    close,
    isActive: () => overlay.classList.contains('active'),
    getOverlayElement: () => overlay,
    jumpTo,
  };
}
