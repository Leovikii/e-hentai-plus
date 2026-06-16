import { store } from '../state/store';
import { CFG } from '../state/config';

export function createRetryHandler(
  originalUrl: string,
  placeholder: HTMLElement,
  pIndex: number,
  index: number,
  nlToken: string | null
): () => void {
  return () => {
    placeholder.className = 'r-ph sp-placeholder';
    placeholder.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-20px);">
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); margin-bottom: 16px;">
          <style>@keyframes sp-spin { 100% { transform: rotate(360deg); } }</style>
          <svg style="color: #F596AA; width: 20px; height: 20px; animation: sp-spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <div style="font-size: 15px; color: #f3f4f6; font-weight: 500; letter-spacing: 0.5px;">${nlToken ? 'Requesting New Node...' : 'Reloading...'}</div>
        </div>
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); font-family: monospace; letter-spacing: 1px;">P${pIndex}-${index + 1}</div>
      </div>
    `;

    const adapter = store.activeAdapter;
    if (!adapter) return;

    adapter.resolveImage(originalUrl, nlToken || undefined).then(res => {
      if (res) {
        const newImg = document.createElement('img');
        newImg.src = res.src;
        newImg.dataset.viewerUrl = originalUrl;
        if (res.nl) newImg.dataset.nl = res.nl;
        newImg.className = 'r-img';
        
        newImg.onerror = () => {
          if (placeholder.parentNode) {
            setErrorState(placeholder, originalUrl, pIndex, index, res.nl);
            placeholder.parentNode.replaceChild(placeholder, newImg);
          }
        };

        placeholder.parentNode?.replaceChild(newImg, placeholder);
      } else {
        setErrorState(placeholder, originalUrl, pIndex, index, nlToken);
      }
    }).catch(() => {
      setErrorState(placeholder, originalUrl, pIndex, index, nlToken);
    });
  };
}

function setErrorState(
  placeholder: HTMLElement,
  url: string,
  pIndex: number,
  index: number,
  nlToken: string | null = null
): void {
  placeholder.className = 'r-ph sp-placeholder error';
  placeholder.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-20px); cursor: pointer;" class="retry-btn-wrapper">
      <div style="display: flex; align-items: center; gap: 10px; background: rgba(200, 40, 40, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); margin-bottom: 16px; transition: all 0.2s;">
        <svg style="color: #fff; width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        <div style="font-size: 15px; color: #fff; font-weight: 500; letter-spacing: 0.5px;">Load Failed. Click to Retry</div>
      </div>
      <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); font-family: monospace; letter-spacing: 1px;">P${pIndex}-${index + 1}</div>
    </div>
  `;
  const wrapper = placeholder.querySelector('.retry-btn-wrapper') as HTMLElement;
  wrapper.onclick = createRetryHandler(url, placeholder, pIndex, index, nlToken);
}

let virtualizationObserver: IntersectionObserver | null = null;

function initVirtualization() {
  if (virtualizationObserver) return;
  virtualizationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const img = entry.target as HTMLImageElement;
      if (entry.isIntersecting) {
        img.classList.remove('sp-virtualized');
      } else {
        img.classList.add('sp-virtualized');
      }
    });
  }, { rootMargin: '3000px' });
}

export function processBatch(links: string[], pIndex: number, container?: HTMLElement, prepend = false, pageUrl?: string): void {
  const batchDiv = document.createElement('div');
  batchDiv.className = 'page-batch';
  if (pageUrl) {
    batchDiv.dataset.pageUrl = pageUrl;
  }
  const fragment = document.createDocumentFragment();

  initVirtualization();

  let targetContainer = container;
  if (!targetContainer) {
    targetContainer = document.querySelector('#gdt-hidden') as HTMLElement || 
                      document.querySelector('.scroll-mode #gdt, .scroll-mode .gm, .scroll-mode .entry-content, .scroll-mode .wp-block-post-content, .scroll-mode .post-content') as HTMLElement || 
                      document.body;
  }

  links.forEach((url, index) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'r-ph sp-placeholder loading';
    placeholder.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-20px);">
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); margin-bottom: 16px;">
          <style>@keyframes sp-spin { 100% { transform: rotate(360deg); } }</style>
          <svg style="color: #F596AA; width: 20px; height: 20px; animation: sp-spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <div style="font-size: 15px; color: #f3f4f6; font-weight: 500; letter-spacing: 0.5px;">Loading...</div>
        </div>
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); font-family: monospace; letter-spacing: 1px;">P${pIndex}-${index + 1}</div>
      </div>
    `;
    fragment.appendChild(placeholder);

    const adapter = store.activeAdapter;
    if (!adapter) return;
    adapter.resolveImage(url).then(res => {
        if (res) {
          const img = document.createElement('img');
          img.className = 'r-img';
          img.dataset.viewerUrl = url;
          img.dataset.realSrc = res.src;
          if (res.nl) img.dataset.nl = res.nl;

          img.onerror = () => {
            if (placeholder.parentNode) {
              setErrorState(placeholder, url, pIndex, index, res.nl);
              placeholder.parentNode.replaceChild(placeholder, img);
              virtualizationObserver?.unobserve(img);
            }
          };

          img.onload = () => {
            if (!img.dataset.locked && img.naturalWidth > 0) {
              img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
              img.style.width = '100%';
              img.style.maxWidth = `${img.naturalWidth}px`;
              img.style.height = 'auto';
              img.dataset.locked = 'true';
            }
          };

          img.src = res.src;
          placeholder.parentNode?.replaceChild(img, placeholder);
          virtualizationObserver?.observe(img);
        } else {
          setErrorState(placeholder, url, pIndex, index);
        }
      })
      .catch(() => {
        setErrorState(placeholder, url, pIndex, index);
      });
  });

  batchDiv.appendChild(fragment);
  if (prepend && targetContainer.firstChild) {
    targetContainer.insertBefore(batchDiv, targetContainer.firstChild);
  } else {
    targetContainer.appendChild(batchDiv);
  }
}

export function setupAutoScroll(): void {
  const scrollSent = document.createElement('div');
  document.body.appendChild(scrollSent);

  const pageObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && store.nextUrl && !store.isFetching) {
      store.isFetching = true;
      store.activeAdapter!.fetchPage(store.nextUrl).then(({ links, nextUrl: nUrl }) => {
        store.currPage++;
        processBatch(links, store.currPage, document.querySelector('.scroll-mode #gdt, .scroll-mode .gm, .scroll-mode .entry-content, .scroll-mode .wp-block-post-content') as HTMLElement || document.body);

        store.nextUrl = nUrl;
        store.isFetching = false;
        store.nextPagePrefetched = false;
        if (!store.nextUrl) pageObs.disconnect();
      }).catch(() => { store.isFetching = false; });
    }
  }, { rootMargin: CFG.nextPage });

  pageObs.observe(scrollSent);
}
