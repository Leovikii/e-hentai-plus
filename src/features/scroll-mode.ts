import { store } from '../state/store';
import { qa } from '../utils/dom';
import { CFG } from '../state/config';
import { getNextUrl } from '../services/page-parser';
import { loadImageWithRetry, createRetryHandler } from '../services/image-loader';

function setErrorState(
  placeholder: HTMLElement,
  url: string,
  pIndex: number,
  index: number,
): void {
  placeholder.className = 'r-ph error';
  placeholder.innerHTML = `
    <div>P${pIndex}-${index + 1} Failed</div>
    <button class="retry-btn">Retry</button>
  `;
  const retryBtn = placeholder.querySelector('.retry-btn') as HTMLElement;
  retryBtn.onclick = createRetryHandler(url, placeholder, pIndex, index);
}

export function processBatch(links: string[], pIndex: number): void {
  const mainBox = document.querySelector('#gdt') as HTMLElement;
  const batchDiv = document.createElement('div');
  batchDiv.className = 'page-batch';
  const fragment = document.createDocumentFragment();

  links.forEach((url, index) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'r-ph loading';
    placeholder.textContent = `P${pIndex}-${index + 1} Loading...`;
    fragment.appendChild(placeholder);

    loadImageWithRetry(url)
      .then(imgSrc => {
        if (imgSrc) {
          const img = document.createElement('img');
          img.className = 'r-img';

          img.onerror = () => {
            if (placeholder.parentNode) {
              setErrorState(placeholder, url, pIndex, index);
              placeholder.parentNode.replaceChild(placeholder, img);
            }
          };

          img.src = imgSrc;
          placeholder.parentNode?.replaceChild(img, placeholder);
        } else {
          setErrorState(placeholder, url, pIndex, index);
        }
      })
      .catch(() => {
        placeholder.className = 'r-ph error';
        placeholder.textContent = `P${pIndex}-${index + 1} Network Error`;
      });
  });

  batchDiv.appendChild(fragment);
  mainBox.appendChild(batchDiv);
}

export function setupAutoScroll(): void {
  if (!store.settings.autoScroll) return;

  const scrollSent = document.createElement('div');
  document.body.appendChild(scrollSent);

  const parser = new DOMParser();

  const pageObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && store.nextUrl && !store.isFetching && store.settings.autoScroll) {
      store.isFetching = true;
      fetch(store.nextUrl).then(r => r.text()).then(html => {
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(qa('#gdt a', doc)).map(a => (a as HTMLAnchorElement).href);
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
