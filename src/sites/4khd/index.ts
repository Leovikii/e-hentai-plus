import type { SiteAdapter, PageLink } from '../../types/site-adapter';
import { qa } from '../../utils/dom';
import { store } from '../../state/store';

const parser = new DOMParser();

function extract4KHDImages(doc: Document): PageLink[] {
  const images = Array.from(qa('figure.wp-block-image img, #basicExample img, .entry-content p img', doc));
  return images.map(img => {
    let src = (img as HTMLImageElement).src;
    
    let thumb = src;
    thumb = thumb.replace(/i\d\.wp\.com\//, '');
    thumb = thumb.replace('pic.4khd.com', 'img.4khd.com');
    thumb = thumb.replace(/\?.+$/, '');
    thumb = thumb.replace(/\/w\d+-rw\//, '/w300-h300-rw/');

    src = src.replace(/i\d\.wp\.com\//, '');
    src = src.replace('pic.4khd.com', 'img.4khd.com');
    src = src.replace(/\?.+$/, '');
    src = src.replace(/\/w\d+-rw\//, '/w2500-h2500-rw/');
    
    return { url: src, thumb };
  }).filter(link => link.url && !link.url.includes('avatar')); // filter out possible junk
}

function get4KHDNextUrl(doc: Document): string | null {
  const pageBox = doc.querySelector('.page-link-box, .pagination, .nav-links, .nav-previous');
  if (pageBox) {
    const current = pageBox.querySelector('.current, .active') || Array.from(pageBox.querySelectorAll('span')).find(s => !s.querySelector('a'));
    if (current) {
      const currentPageNum = parseInt(current.textContent || '1', 10);
      if (!isNaN(currentPageNum)) {
        const nextBtn = Array.from(pageBox.querySelectorAll('a')).find(a => parseInt(a.textContent || '0', 10) === currentPageNum + 1);
        if (nextBtn && nextBtn.href && nextBtn.href !== window.location.href) {
          return nextBtn.href;
        }
      }
    }
    const nextBtnFallback = pageBox.querySelector('a.next') || doc.querySelector('a.next.page-numbers');
    if (nextBtnFallback && (nextBtnFallback as HTMLAnchorElement).href) {
      const url = (nextBtnFallback as HTMLAnchorElement).href;
      if (url !== window.location.href) return url;
    }
  }
  return null;
}

function get4KHDPrevUrl(doc: Document): string | null {
  const pageBox = doc.querySelector('.page-link-box, .pagination, .nav-links, .nav-previous');
  if (pageBox) {
    const current = pageBox.querySelector('.current, .active') || Array.from(pageBox.querySelectorAll('span')).find(s => !s.querySelector('a'));
    if (current) {
      const currentPageNum = parseInt(current.textContent || '1', 10);
      if (!isNaN(currentPageNum) && currentPageNum > 1) {
        const prevBtn = Array.from(pageBox.querySelectorAll('a')).find(a => parseInt(a.textContent || '0', 10) === currentPageNum - 1);
        if (prevBtn && prevBtn.href && prevBtn.href !== window.location.href) {
          return prevBtn.href;
        }
      }
    }
    const prevBtnFallback = pageBox.querySelector('a.prev') || doc.querySelector('a.prev.page-numbers');
    if (prevBtnFallback && (prevBtnFallback as HTMLAnchorElement).href) {
      const url = (prevBtnFallback as HTMLAnchorElement).href;
      if (url !== window.location.href) return url;
    }
  }
  return null;
}

export const FourKHDAdapter: SiteAdapter = {
  name: '4KHD',
  
  match(url: string) {
    return url.includes('4khd.com') || url.includes('xxtt.ink') || url.includes('uuss.uk') || url.includes('ssuu.uk');
  },

  async init(doc: Document) {
    const initLinks = extract4KHDImages(doc);
    
    // For 4KHD, we might not know the absolute total pages up front without parsing them all,
    // so we set a default high number or rely on infinite scroll stopping when nextUrl is null.
    // For now we just default to 1, and the store will keep accumulating as we fetch pages.
    const totalPage = 1; 

    const pageBox = doc.querySelector('.page-link-box, .pagination, .nav-links, .nav-previous');
    let currentPageNum = 1;
    if (pageBox) {
      const current = pageBox.querySelector('.current, .active') || Array.from(pageBox.querySelectorAll('span')).find(s => !s.querySelector('a'));
      if (current) {
        currentPageNum = parseInt(current.textContent || '1', 10);
        if (isNaN(currentPageNum)) currentPageNum = 1;
      }
    }
    
    if (currentPageNum > 1) {
      const perPage = initLinks.length > 0 ? initLinks.length : 20;
      store.imageOffset = (currentPageNum - 1) * perPage;
    }

    return {
      links: initLinks,
      nextUrl: get4KHDNextUrl(doc),
      prevUrl: get4KHDPrevUrl(doc),
      totalPage,
    };
  },

  async resolveImage(url: string) {
    // 4KHD already provides direct image links via `init` and `fetchPage`
    // We just return it directly. No extra fetching needed!
    return { src: url };
  },

  async fetchPage(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch page');
    const html = await response.text();
    const doc = parser.parseFromString(html, 'text/html');
    const links = extract4KHDImages(doc);
    return {
      links,
      nextUrl: get4KHDNextUrl(doc),
      prevUrl: get4KHDPrevUrl(doc),
    };
  },

  getContainer() {
    const entryContent = document.querySelector('.entry-content, .wp-block-post-content');
    if (entryContent) return entryContent as HTMLElement;
    const basicExample = document.querySelector('#basicExample');
    if (basicExample && basicExample.parentElement) return basicExample.parentElement;
    return document.querySelector('.post-content') as HTMLElement | null;
  },

  hideOriginalElements() {
    const HIDDEN_SELECTORS = [
      '.centbtd', '.popup', '.wp-container-13', '.popup-iframe',
      '#basicExample', '.wp-block-image', '.page-link-box'
    ];
    document.querySelectorAll<HTMLElement>(HIDDEN_SELECTORS.join(',')).forEach(el => {
      el.style.display = 'none';
    });
  }
};
