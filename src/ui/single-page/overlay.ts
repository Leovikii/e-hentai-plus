import { store } from '../../state/store';
import { CFG } from '../../state/config';
import { qa, isImageReady } from '../../utils/dom';
import { createSidebar } from './sidebar';
import { setupNavigation } from './navigation';
import { createAutoPlay } from './auto-play';
import { createStatusHUD } from '../components/status-hud';
import { i18n } from '../../utils/i18n';
import type { SinglePageModeHandle } from '../../types';

export interface SinglePageOverlayDeps {
  onLoadNextPage: (links: string[], nextUrl: string | null, prevUrl?: string | null) => void;
  onLoadPrevPage: (links: string[], prevUrl: string | null) => void;
}

export function createSinglePageOverlay(deps: SinglePageOverlayDeps): SinglePageModeHandle {
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

  const statusHUD = createStatusHUD();

  function showPlaceholder(statusText: string = 'Loading...'): void {
    statusHUD.show({
      status: 'loading',
      text: statusText,
      pageText: `${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}`
    });
  }

  function removePlaceholder(): void {
    statusHUD.hide();
  }

  function showError(): void {
    clearLoadPoll();
    currentImage.style.display = 'none';
    statusHUD.show({
      status: 'error',
      text: i18n.loadFailed,
      pageText: `${store.imageOffset + store.currentImageIndex + 1} / ${store.imageOffset + store.allImages.length}`,
      onClick: () => retryCurrentImage()
    });
  }

  function removeErrorUI(): void {
    statusHUD.hide();
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
        showPlaceholder(nlToken ? i18n.requestingNewNode : i18n.reloading);
        
        const adapter = store.activeAdapter;
        if (!adapter) return;

        adapter.resolveImage(viewerUrl, nlToken || undefined).then(res => {
            if (res) {
              (img as HTMLImageElement).src = res.src;
              if (res.nl) img.dataset.nl = res.nl;
              updateImage();
            } else {
              showError();
            }
          }).catch(() => showError());
        return;
      }

      // Fallback for native images
      const oldSrc = (img as HTMLImageElement).src;
      img.removeAttribute('src');
      (img as HTMLImageElement).src = oldSrc;
    }
    updateImage();
  }

  function syncImages(): void {
    const freshImages = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
    if (freshImages.length !== store.allImages.length || freshImages.some((img, i) => img !== store.allImages[i])) {
      store.allImages = freshImages;
      sidebar.update();
    }
  }

  function updateImage(): void {
    clearLoadPoll();
    removeErrorUI();
    const idx = store.currentImageIndex;

    syncImages();
    const img = store.allImages[idx];

    if (!img) {
      showPlaceholder(i18n.waitingForNetwork);
      sidebar.update();
      startLoadPoll(idx);
      return;
    }

    const imgSrc = (img as HTMLImageElement).dataset.realSrc || (img as HTMLImageElement).src;

    const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    if (imgSrc && currentImage.dataset.assignedSrc !== imgSrc) {
      currentImage.src = TRANSPARENT_GIF;
      setTimeout(() => {
        currentImage.src = imgSrc;
        currentImage.dataset.assignedSrc = imgSrc;
      }, 0);
    } else if (!imgSrc) {
      currentImage.src = TRANSPARENT_GIF;
      delete currentImage.dataset.assignedSrc;
    }
    
    currentImage.style.display = 'block';

    if (imgSrc) {
      if (!isImageReady(img as HTMLImageElement)) {
        showPlaceholder(i18n.downloading);
      } else {
        removePlaceholder();
      }
    } else {
      showPlaceholder(i18n.waitingForNetwork);
    }

    sidebar.update();

    if (!isImageReady(img as HTMLImageElement)) {
      startLoadPoll(idx);
    }
  }

  function startLoadPoll(idx: number): void {
    if (store.autoPlay) autoPlay.stop();

    let imageErrored = false;
    let lastKnownImg = store.allImages[idx];

    function onImageReady(): void {
      if (store.currentImageIndex !== idx) return;
      const img = store.allImages[idx];
      if (img && isImageReady(img as HTMLImageElement)) {
        clearLoadPoll();
        removePlaceholder();
        sidebar.update();
        if (store.autoPlay) autoPlay.start();
      }
    }

    function onImageError(): void {
      imageErrored = true;
      if (store.autoPlay) {
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
        if (nextImg && isImageReady(nextImg as HTMLImageElement)) {
          clearLoadPoll();
          store.currentImageIndex = nextIdx;
          updateImage();
          checkAndLoadNextPage();
          if (store.autoPlay) autoPlay.start();
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

    if (lastKnownImg && lastKnownImg.tagName === 'IMG') {
      lastKnownImg.addEventListener('load', onImageReady, { once: true });
      lastKnownImg.addEventListener('error', onImageError, { once: true });
    }

    const mainBox = document.querySelector(store.settings.scrollMode ? '#gdt' : '#gdt-hidden');
    if (mainBox) {
      loadObserver = new MutationObserver(() => {
        if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
        const freshImages = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
        if (freshImages.length !== store.allImages.length || freshImages.some((img, i) => img !== store.allImages[i])) {
          store.allImages = freshImages;
          sidebar.update();
        }
        const currentImg = store.allImages[idx];
        if (currentImg) {
           const imgSrc = (currentImg as HTMLImageElement).dataset.realSrc || (currentImg as HTMLImageElement).src;
           if (imgSrc && currentImage.dataset.assignedSrc !== imgSrc) {
             currentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
             setTimeout(() => {
               currentImage.src = imgSrc;
               currentImage.dataset.assignedSrc = imgSrc;
               if (!isImageReady(currentImg as HTMLImageElement)) {
                showPlaceholder(i18n.downloading);
              } else {
                 removePlaceholder();
               }
             }, 0);
          }
          if (currentImg !== lastKnownImg) {
            lastKnownImg = currentImg;
            if (currentImg.tagName === 'IMG') {
              currentImg.addEventListener('load', onImageReady, { once: true });
              currentImg.addEventListener('error', onImageError, { once: true });
              if (isImageReady(currentImg as HTMLImageElement)) onImageReady();
            }
          }
        }
      });
      loadObserver.observe(mainBox, { childList: true, subtree: true });
    }

    loadPollTimer = setInterval(() => {
      if (store.currentImageIndex !== idx) { clearLoadPoll(); return; }
      const currentImg = store.allImages[idx];
      if (currentImg) {
        const imgSrc = (currentImg as HTMLImageElement).dataset.realSrc || (currentImg as HTMLImageElement).src;
        if (imgSrc && currentImage.dataset.assignedSrc !== imgSrc) {
           currentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
           setTimeout(() => {
             currentImage.src = imgSrc;
             currentImage.dataset.assignedSrc = imgSrc;
             if (!isImageReady(currentImg as HTMLImageElement)) {
               showPlaceholder('Downloading...');
             } else {
               removePlaceholder();
             }
           }, 0);
        }
        if (currentImg !== lastKnownImg) {
          lastKnownImg = currentImg;
          if (currentImg.tagName === 'IMG') {
            currentImg.addEventListener('load', onImageReady, { once: true });
            currentImg.addEventListener('error', onImageError, { once: true });
          }
        }
      }
      onImageReady();
    }, 500);

    if (store.autoPlay) {
      loadTimeoutTimer = setTimeout(() => {
        if (store.currentImageIndex !== idx) return;
        const img = store.allImages[idx];
        if (img && isImageReady(img as HTMLImageElement)) return;
        tryAutoSkip();
      }, CFG.imageLoadTimeout);
    }
  }

  // Wire up sub-modules (forward declarations resolved via closures)
  const autoPlay = createAutoPlay(() => nav.nextImage());

  const sidebar = createSidebar((index) => {
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

  overlay.addEventListener('wheel', () => {
    sidebar.wakeUpProgressBar();
  }, { passive: true });

  // Assemble DOM
  overlay.appendChild(closeBtn);
  sidebar.getElements().forEach(el => overlay.appendChild(el));
  overlay.appendChild(statusHUD.getElement());
  overlay.appendChild(imageContainer);
  document.body.appendChild(overlay);

  closeBtn.onclick = () => close();

  function open(): void {
    store.allImages = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
    if (store.allImages.length === 0) {
      alert(i18n.waitImagesToLoad);
      return;
    }

    let startIndex = 0;

    if (store.settings.scrollMode) {
      let minDistance = Infinity;

      store.allImages.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          startIndex = index;
          minDistance = -1;
        } else if (minDistance !== -1) {
          const distanceToCenter = rect.bottom < viewportCenter 
            ? viewportCenter - rect.bottom 
            : rect.top - viewportCenter;
            
          if (distanceToCenter < minDistance) {
            minDistance = distanceToCenter;
            startIndex = index;
          }
        }
      });
    } else {
      // Non-scroll mode: try to find the native image closest to viewport center
      const adapter = store.activeAdapter;
      let nativeImages: HTMLElement[] = [];
      
      if (adapter?.getNativeImages) {
        nativeImages = adapter.getNativeImages();
      } else {
        const container = adapter?.getContainer();
        if (container) {
          nativeImages = Array.from(container.querySelectorAll('img')).filter(img => img.clientWidth > 50 || img.clientHeight > 50);
        }
      }

      if (nativeImages.length > 0) {
        let minDistance = Infinity;
        nativeImages.forEach((img, index) => {
          const rect = img.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          const viewportCenter = window.innerHeight / 2;
          if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            startIndex = index;
            minDistance = -1;
          } else if (minDistance !== -1) {
            const distanceToCenter = rect.bottom < viewportCenter 
              ? viewportCenter - rect.bottom 
              : rect.top - viewportCenter;
              
            if (distanceToCenter < minDistance) {
              minDistance = distanceToCenter;
              startIndex = index;
            }
          }
        });
        startIndex = Math.max(0, Math.min(startIndex, store.allImages.length - 1));
      } else {
        startIndex = 0;
      }
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
      const currentImages = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
      if (store.currentImageIndex >= 0 && store.currentImageIndex < currentImages.length) {
        const targetImg = currentImages[store.currentImageIndex];
        if (targetImg) {
          setTimeout(() => {
            targetImg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    } else {
      const adapter = store.activeAdapter;
      let nativeImages: HTMLElement[] = [];
      if (adapter?.getNativeImages) {
        nativeImages = adapter.getNativeImages();
      } else {
        const container = adapter?.getContainer();
        if (container) {
          nativeImages = Array.from(container.querySelectorAll('img')).filter(img => img.clientWidth > 50 || img.clientHeight > 50);
        }
      }

      if (store.currentImageIndex >= 0 && store.currentImageIndex < nativeImages.length) {
        const targetImg = nativeImages[store.currentImageIndex];
        if (targetImg) {
          setTimeout(() => {
            targetImg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return;
        }
      }

      const targetImgFallback = store.allImages[store.currentImageIndex];
      const batchDiv = targetImgFallback?.closest('.page-batch') as HTMLElement | null;
      if (batchDiv && batchDiv.dataset.pageUrl) {
        const targetUrl = new URL(batchDiv.dataset.pageUrl, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) {
          window.location.href = targetUrl.toString();
        }
        return;
      }

      // Fallback for sites that use ?p= parameter for pagination
      if (adapter?.name === 'E-Hentai' || adapter?.name === 'ExHentai') {
        const globalIndex = store.imageOffset + store.currentImageIndex;
        if (globalIndex >= 0) {
          const targetPage = Math.floor(globalIndex / store.perPage);
          const url = new URL(window.location.href);
          const currentPage = parseInt(url.searchParams.get('p') || '0');
          if (targetPage !== currentPage) {
            url.searchParams.set('p', String(targetPage));
            window.location.href = url.toString();
          }
        }
      }
    }
  }

  // Listen for autoPlay setting changes from float-control button
  store.on('settingsChanged', () => {
    if (!overlay.classList.contains('active')) return;
    if (store.autoPlay) {
      const img = store.allImages[store.currentImageIndex];
      if (img && isImageReady(img as HTMLImageElement)) {
        autoPlay.start();
      }
    } else {
      autoPlay.stop();
    }
  });

  function loadNextPage(): void {
    if (!store.nextUrl || store.isFetching) return;

    store.isFetching = true;
    store.activeAdapter!.fetchPage(store.nextUrl).then(({ links, nextUrl, prevUrl }) => {
      deps.onLoadNextPage(links, nextUrl, prevUrl);
      syncImages();
      store.isFetching = false;
      checkAndLoadNextPage();
    }).catch((err) => {
      console.error('[Single Page] Load failed', err);
      store.isFetching = false;
    });
  }

  function loadPrevPage(): void {
    if (!store.prevUrl || store.isFetching) return;

    store.isFetching = true;

    store.activeAdapter!.fetchPage(store.prevUrl).then(({ links, prevUrl }) => {
      const prevCount = links.length;

      deps.onLoadPrevPage(links, prevUrl ?? null);

      store.currentImageIndex += prevCount;
      store.imageOffset -= prevCount;
      
      if (prevCount > 0 && store.currentImageIndex === prevCount) {
        store.currentImageIndex--; // Auto-advance to the newly loaded previous image
      }

      store.allImages = Array.from(qa('.r-img, .r-ph')) as HTMLElement[];
      sidebar.update();
      updateImage();

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
