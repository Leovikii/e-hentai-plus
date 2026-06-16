import type { SiteAdapter } from '../../types/site-adapter';
import { qa } from '../../utils/dom';

const parser = new DOMParser();

function extract4KHDImages(doc: Document): string[] {
  const images = Array.from(qa('figure.wp-block-image>a>img, #basicExample>a>img, .entry-content>p>a>img', doc));
  return images.map(img => {
    let src = (img as HTMLImageElement).src;
    src = src.replace(/i\d\.wp\.com\//, '');
    src = src.replace('pic.4khd.com', 'img.4khd.com');
    src = src.replace(/\?.+$/, '');
    src = src.replace(/\/w\d+-rw\//, '/w2500-h2500-rw/');
    return src;
  });
}

function get4KHDNextUrl(doc: Document): string | null {
  const nextBtn = document.querySelector('.page-link-box a.next') || 
                  Array.from(qa('.page-link-box a', doc)).pop();
  
  if (nextBtn && (nextBtn as HTMLAnchorElement).href) {
    const url = (nextBtn as HTMLAnchorElement).href;
    // Don't return the same page or undefined
    if (url !== window.location.href) {
      return url;
    }
  }
  return null;
}

export const FourKHDAdapter: SiteAdapter = {
  name: '4KHD',
  
  match(url: string) {
    return /https?:\/\/(www\.)?4khd\.com\//.test(url) || /https?:\/\/aynzl\.uuss\.uk\//.test(url) || /https?:\/\/zrxiu\.ssuu\.uk\//.test(url);
  },

  async init(doc: Document) {
    const initLinks = extract4KHDImages(doc);
    
    // For 4KHD, we might not know the absolute total pages up front without parsing them all,
    // so we set a default high number or rely on infinite scroll stopping when nextUrl is null.
    // For now we just default to 1, and the store will keep accumulating as we fetch pages.
    const totalPage = 1; 

    return {
      links: initLinks,
      nextUrl: get4KHDNextUrl(doc),
      prevUrl: null, // 4KHD usually goes forward
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
    };
  },

  getContainer() {
    return document.querySelector('.entry-content, .wp-block-post-content') as HTMLElement | null;
  },

  hideOriginalElements() {
    const HIDDEN_SELECTORS = [
      '.centbtd', '.popup', '.wp-container-13', '.popup-iframe',
      '#basicExample', '.wp-block-image', '.page-link-box', 'header', 'footer'
    ];
    document.querySelectorAll<HTMLElement>(HIDDEN_SELECTORS.join(',')).forEach(el => {
      el.style.display = 'none';
    });
  }
};
