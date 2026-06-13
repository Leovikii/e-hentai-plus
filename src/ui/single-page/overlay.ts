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
    removeErrorUI();
    const existing = imageContainer.querySelector('.sp-placeholder');
    if (existing) existing.remove();

    const ph = document.createElement('div');
    ph.className = 'sp-placeholder';
    ph.style.position = 'absolute';
    ph.style.top = '50%';
    ph.style.left = '50%';
    ph.style.transform = 'translate(-50%, -50%)';
    ph.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); margin-bottom: 16px;">
          <style>@keyframes sp-spin { 100% { transform: rotate(360deg); } }</style>
          <svg style="color: #F596AA; width: 20px; height: 20px; animation: sp-spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <div style="font-size: 15px; color: #f3f4f6; font-weight: 500; letter-spacing: 0.5px;">${statusText}</div>
        </div>
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); font-family: monospace; letter-spacing: 1px;">${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}</div>
      </div>
    `;
    imageContainer.appendChild(ph);
  }

  function removePlaceholder(): void {
    const ph = imageContainer.querySelector('.sp-placeholder');
    if (ph) ph.remove();
    removeErrorUI();
  }

  function showError(): void {
    clearLoadPoll();
    currentImage.style.display = 'none';
    const existing = imageContainer.querySelector('.sp-placeholder');
    if (existing) existing.remove();
    removeErrorUI();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'sp-error';
    errorDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-20px); cursor: pointer;" class="retry-btn-wrapper">
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(200, 40, 40, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); margin-bottom: 16px; transition: all 0.2s;">
          <svg style="color: #fff; width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
          <div style="font-size: 15px; color: #fff; font-weight: 500; letter-spacing: 0.5px;">Load Failed. Click to Retry</div>
        </div>
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); font-family: monospace; letter-spacing: 1px;">${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}</div>
      </div>
    `;
    const wrapper = errorDiv.querySelector('.retry-btn-wrapper') as HTMLElement;
    wrapper.onclick = () => retryCurrentImage();
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
      const viewerUrl = img.dataset.viewerUrl;
      const nlToken = img.dataset.nl;
      
      if (viewerUrl) {
        showPlaceholder(nlToken ? 'Requesting New Node...' : 'Reloading...');
        
        import('../../services/image-loader').then(({ loadImageWithRetry, clearCachedImage }) => {
          clearCachedImage(viewerUrl);
          const fetchUrl = nlToken ? `${viewerUrl}${viewerUrl.includes('?') ? '&' : '?'}nl=${nlToken}` : undefined;
          
          loadImageWithRetry(viewerUrl, fetchUrl).then(res => {
            if (res) {
              img.src = res.src;
              if (res.nl) img.dataset.nl = res.nl;
              updateImage();
            } else {
              showError();
            }
          }).catch(() => showError());
        });
        return;
      }

      // Fallback for native images
      const oldSrc = img.src;
      img.removeAttribute('src');
      img.src = oldSrc;
    }
    updateImage();
  }

  function syncImages(): void {
    const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
    if (freshImages.length !== store.allImages.length || freshImages.some((img, i) => img !== store.allImages[i])) {
      store.allImages = freshImages;
      scrollbar.update();
    }
  }

  function updateImage(): void {
    clearLoadPoll();
    removeErrorUI();
    const idx = store.currentImageIndex;

    syncImages();
    const img = store.allImages[idx];

    if (!img) {
      showPlaceholder('Waiting for network...');
      scrollbar.update();
      startLoadPoll(idx);
      return;
    }

    if (img.src && currentImage.dataset.assignedSrc !== img.src) {
      currentImage.removeAttribute('src');
      setTimeout(() => {
        currentImage.src = img.src;
        currentImage.dataset.assignedSrc = img.src;
      }, 0);
    } else if (!img.src) {
      currentImage.removeAttribute('src');
      delete currentImage.dataset.assignedSrc;
    }
    
    currentImage.style.display = 'block';

    if (img.src) {
      removePlaceholder();
    } else {
      showPlaceholder('Waiting for network...');
    }

    scrollbar.update();

    if (!isImageReady(img)) {
      startLoadPoll(idx);
    }
  }

  function startLoadPoll(idx: number): void {
    const wasAutoPlaying = !!store.autoPlayTimer;
    if (wasAutoPlaying) autoPlay.stop();

    let imageErrored = false;
    let lastKnownImg = store.allImages[idx];

    function onImageReady(): void {
      if (store.currentImageIndex !== idx) return;
      const img = store.allImages[idx];
      if (img && isImageReady(img)) {
        clearLoadPoll();
        removePlaceholder();
        scrollbar.update();
        if (wasAutoPlaying && store.autoPlay) autoPlay.start();
      }
    }

    function onImageError(): void {
      imageErrored = true;
      if (wasAutoPlaying && store.autoPlay) {
        tryAutoSkip();
      } else {
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
          updateImage();
          checkAndLoadNextPage();
          if (wasAutoPlaying && store.autoPlay) autoPlay.start();
          return;
        }
      }
      if (nextIdx < store.allImages.length || imageErrored) {
        clearLoadPoll();
        store.currentImageIndex = nextIdx < store.allImages.length ? nextIdx : idx;
        updateImage();
        if (nextIdx < store.allImages.length) {
          checkAndLoadNextPage();
        }
      }
    }

    if (lastKnownImg) {
      lastKnownImg.addEventListener('load', onImageReady, { once: true });
      lastKnownImg.addEventListener('error', onImageError, { once: true });
    }

    const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
    if (mainBox) {
      loadObserver = new MutationObserver(() => {
        if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
        const freshImages = Array.from(qa('.r-img')) as HTMLImageElement[];
        if (freshImages.length !== store.allImages.length) {
          store.allImages = freshImages;
          scrollbar.update();
        }
        const currentImg = store.allImages[idx];
        if (currentImg) {
          if (currentImg.src && currentImage.dataset.assignedSrc !== currentImg.src) {
             currentImage.removeAttribute('src');
             setTimeout(() => {
               currentImage.src = currentImg.src;
               currentImage.dataset.assignedSrc = currentImg.src;
               removePlaceholder();
             }, 0);
          }
          if (currentImg !== lastKnownImg) {
            lastKnownImg = currentImg;
            currentImg.addEventListener('load', onImageReady, { once: true });
            currentImg.addEventListener('error', onImageError, { once: true });
            if (isImageReady(currentImg)) onImageReady();
          }
        }
      });
      loadObserver.observe(mainBox, { childList: true, subtree: true });
    }

    loadPollTimer = setInterval(() => {
      if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
      const currentImg = store.allImages[idx];
      if (currentImg) {
        if (currentImg.src && currentImage.dataset.assignedSrc !== currentImg.src) {
           currentImage.removeAttribute('src');
           setTimeout(() => {
             currentImage.src = currentImg.src;
             currentImage.dataset.assignedSrc = currentImg.src;
             removePlaceholder();
           }, 0);
        }
        if (currentImg !== lastKnownImg) {
          lastKnownImg = currentImg;
          currentImg.addEventListener('load', onImageReady, { once: true });
          currentImg.addEventListener('error', onImageError, { once: true });
        }
      }
      onImageReady();
    }, 500);

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
