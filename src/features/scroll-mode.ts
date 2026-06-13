import { store } from '../state/store';
import { fetchPageLinks } from '../utils/dom';
import { CFG } from '../state/config';
import { getNextUrl } from '../services/page-parser';
import { loadImageWithRetry, clearCachedImage } from '../services/image-loader';

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

    clearCachedImage(originalUrl);
    const fetchUrl = nlToken ? `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}nl=${nlToken}` : undefined;

    loadImageWithRetry(originalUrl, fetchUrl).then(res => {
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

export function processBatch(links: string[], pIndex: number, prepend = false): void {
  const container = store.settings.scrollMode
    ? document.querySelector('#gdt') as HTMLElement
    : document.querySelector('#gdt-hidden') as HTMLElement;
  const batchDiv = document.createElement('div');
  batchDiv.className = 'page-batch';
  const fragment = document.createDocumentFragment();

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

    const globalIndex = (pIndex - 1) * store.perPage + index;

    loadImageWithRetry(url, undefined, globalIndex)
      .then(res => {
        if (res) {
          const img = document.createElement('img');
          img.className = 'r-img';
          img.dataset.viewerUrl = url;
          if (res.nl) img.dataset.nl = res.nl;

          img.onerror = () => {
            if (placeholder.parentNode) {
              setErrorState(placeholder, url, pIndex, index, res.nl);
              placeholder.parentNode.replaceChild(placeholder, img);
            }
          };

          img.src = res.src;
          placeholder.parentNode?.replaceChild(img, placeholder);
        } else {
          setErrorState(placeholder, url, pIndex, index);
        }
      })
      .catch(() => {
        setErrorState(placeholder, url, pIndex, index);
      });
  });

  batchDiv.appendChild(fragment);
  if (prepend && container.firstChild) {
    container.insertBefore(batchDiv, container.firstChild);
  } else {
    container.appendChild(batchDiv);
  }
}

export function setupAutoScroll(): void {
  if (!store.settings.autoScroll) return;

  const scrollSent = document.createElement('div');
  document.body.appendChild(scrollSent);

  const pageObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && store.nextUrl && !store.isFetching && store.settings.autoScroll) {
      store.isFetching = true;
      fetchPageLinks(store.nextUrl).then(({ doc, links }) => {
        const nUrl = getNextUrl(doc);

        store.currPage++;
        processBatch(links, store.currPage);

        store.nextUrl = nUrl;
        store.isFetching = false;
        store.nextPagePrefetched = false;
        if (!store.nextUrl) pageObs.disconnect();
      }).catch(() => { store.isFetching = false; });
    }
  }, { rootMargin: CFG.nextPage });

  pageObs.observe(scrollSent);
}
