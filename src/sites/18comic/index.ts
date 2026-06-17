import type { SiteAdapter, PageLink } from '../../types/site-adapter';

declare const unsafeWindow: any;

const idToUrlMap = new Map<string, string>();

class Mutex {
  private queue: (() => void)[] = [];
  private activeCount = 0;
  constructor(private maxConcurrent: number) {}

  async lock(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.activeCount--;
    }
  }
}

const decodeMutex = new Mutex(1);

export const Comic18Adapter: SiteAdapter = {
  name: '18comic',

  match: (url: string): boolean => {
    return url.includes('18comic.vip') || url.includes('18comic.ink');
  },

  init: async (doc: Document): Promise<{ links: PageLink[]; nextUrl: string | null; prevUrl: string | null }> => {
    const aidMatch = doc.documentElement.innerHTML.match(/aid\s*=\s*['"]?(\d+)['"]?/);
    const scrambleMatch = doc.documentElement.innerHTML.match(/scramble_id\s*=\s*['"]?(\d+)['"]?/);
    
    const aid = aidMatch ? aidMatch[1] : (unsafeWindow.aid ? String(unsafeWindow.aid) : '');
    const scrambleId = scrambleMatch ? scrambleMatch[1] : (unsafeWindow.scramble_id ? String(unsafeWindow.scramble_id) : '');

    const links: PageLink[] = [];
    const imgs = doc.querySelectorAll('.scramble-page img[id], .owl-item .center img[id]');
    
    imgs.forEach((img: Element) => {
      const url = img.getAttribute('data-original') || img.getAttribute('data-src') || (img as HTMLImageElement).src;
      if (url) {
        // Encode aid and scramble_id into the URL hash to handle cross-chapter pagination
        const urlObj = new URL(url, window.location.href);
        if (aid) urlObj.searchParams.set('18aid', aid);
        if (scrambleId) urlObj.searchParams.set('18scid', scrambleId);
        
        const viewerUrl = urlObj.toString();
        (img as HTMLElement).dataset.viewerUrl = viewerUrl;
        
        if (img.id) {
          // Save original id for tracking but remove it so native script fails to bind to it
          (img as HTMLElement).dataset.originalId = img.id;
          idToUrlMap.set(img.id, viewerUrl);
        }
        
        links.push({ url: viewerUrl });

        // Strip attributes to blind the native 18comic scripts and prevent them from 
        // initiating duplicate, heavy descrambling tasks in the background.
        img.removeAttribute('id');
        img.removeAttribute('data-original');
        img.removeAttribute('data-src');
      }
    });

    return {
      links,
      nextUrl: getNextUrl(doc),
      prevUrl: getPrevUrl(doc),
    };
  },

  fetchPage: async (url: string): Promise<{ links: PageLink[]; nextUrl: string | null; prevUrl: string | null }> => {
    const res = await fetch(url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const aidMatch = html.match(/aid\s*=\s*['"]?(\d+)['"]?/);
    const scrambleMatch = html.match(/scramble_id\s*=\s*['"]?(\d+)['"]?/);
    
    const aid = aidMatch ? aidMatch[1] : '';
    const scrambleId = scrambleMatch ? scrambleMatch[1] : '';

    const links: PageLink[] = [];
    const imgs = doc.querySelectorAll('.scramble-page img[id], .owl-item .center img[id]');
    
    imgs.forEach((img: Element) => {
      const imgUrl = img.getAttribute('data-original') || img.getAttribute('data-src') || (img as HTMLImageElement).src;
      if (imgUrl) {
        const urlObj = new URL(imgUrl, window.location.href);
        if (aid) urlObj.searchParams.set('18aid', aid);
        if (scrambleId) urlObj.searchParams.set('18scid', scrambleId);
        const viewerUrl = urlObj.toString();
        (img as HTMLElement).dataset.viewerUrl = viewerUrl;
        if (img.id) {
          idToUrlMap.set(img.id, viewerUrl);
        }
        links.push({ url: viewerUrl });
      }
    });

    return {
      links,
      nextUrl: getNextUrl(doc),
      prevUrl: getPrevUrl(doc),
    };
  },

  resolveImage: async (urlStr: string): Promise<{ src: string }> => {
    try {
      const urlObj = new URL(urlStr);
      const aid = urlObj.searchParams.get('18aid');
      const scrambleId = urlObj.searchParams.get('18scid');
      
      // Clean up the URL
      urlObj.searchParams.delete('18aid');
      urlObj.searchParams.delete('18scid');
      const realUrl = urlObj.toString();

      if (realUrl.includes('.gif') || !aid || !scrambleId || Number(aid) < Number(scrambleId)) {
        return { src: realUrl };
      }

      // Fetch the blob
      const res = await fetch(realUrl);
      if (!res.ok) throw new Error('Failed to fetch image');
      const blob = await res.blob();
      
      const fileName = urlObj.pathname.split('/').pop() || '';
      const id = fileName.split('.')[0];
      if (!id) return { src: realUrl };

      // Load into Image to get dimensions
      await decodeMutex.lock();
      try {
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = blobUrl;
        });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        if (!unsafeWindow.get_num) {
          URL.revokeObjectURL(blobUrl);
          return { src: realUrl };
        }

        const num = unsafeWindow.get_num(btoa(aid), btoa(id));
        if (!num || num <= 1) {
          URL.revokeObjectURL(blobUrl);
          return { src: realUrl };
        }

        const canvas = new OffscreenCanvas(imgWidth, imgHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          return { src: realUrl };
        }

        const cropHeight = Number(imgHeight % num);
        const sHeight = Math.floor(imgHeight / num);
        let sy = imgHeight - cropHeight - sHeight;
        let dy = cropHeight + sHeight;
        
        // Draw first piece (includes remainder)
        ctx.drawImage(img, 0, sy, imgWidth, cropHeight + sHeight, 0, 0, imgWidth, cropHeight + sHeight);
        
        // Draw subsequent pieces
        for (let i = 1; i < num; ++i) {
          sy -= sHeight;
          ctx.drawImage(img, 0, sy, imgWidth, sHeight, 0, dy, imgWidth, sHeight);
          dy += sHeight;
        }

        URL.revokeObjectURL(blobUrl);

        const finalBlob = await canvas.convertToBlob({ type: blob.type, quality: 0.9 });
        const finalUrl = URL.createObjectURL(finalBlob);

        return { src: finalUrl };
      } finally {
        decodeMutex.unlock();
      }

    } catch (err) {
      // Fallback to original url
      const cleanUrl = new URL(urlStr);
      cleanUrl.searchParams.delete('18aid');
      cleanUrl.searchParams.delete('18scid');
      return { src: cleanUrl.toString() };
    }
  },

  getContainer: () => {
    return document.querySelector('.scramble-page') || document.body;
  },

  getNativeImages: () => {
    const images = Array.from(document.querySelectorAll('.scramble-page img[data-viewer-url], .owl-item .center img[data-viewer-url], .scramble-page canvas[data-viewer-url], .owl-item .center canvas[data-viewer-url]')) as HTMLElement[];
    images.forEach(img => {
      const originalId = img.dataset.originalId;
      if (originalId && idToUrlMap.has(originalId)) {
        img.dataset.viewerUrl = idToUrlMap.get(originalId)!;
      }
    });
    return images;
  },

  hideOriginalElements: () => {
    // We shouldn't hide .scramble-page since it's the container
  },
};

function getNextUrl(doc: Document): string | null {
  const activeLi = doc.querySelector('.pagination li.active');
  if (activeLi) {
    const nextA = activeLi.nextElementSibling?.querySelector('a:not(.prevnext)');
    if (nextA) return (nextA as HTMLAnchorElement).href;
  }
  
  const nextChapter = Array.from(doc.querySelectorAll('.menu-bolock-ul a[href^="/photo/"]'))
    .find(a => a.textContent?.includes('下一'));
  if (nextChapter) return (nextChapter as HTMLAnchorElement).href;
  
  return null;
}

function getPrevUrl(doc: Document): string | null {
  const activeLi = doc.querySelector('.pagination li.active');
  if (activeLi) {
    const prevA = activeLi.previousElementSibling?.querySelector('a:not(.prevnext)');
    if (prevA) return (prevA as HTMLAnchorElement).href;
  }
  
  const prevChapter = Array.from(doc.querySelectorAll('.menu-bolock-ul a[href^="/photo/"]'))
    .find(a => a.textContent?.includes('上一'));
  if (prevChapter) return (prevChapter as HTMLAnchorElement).href;
  
  return null;
}
