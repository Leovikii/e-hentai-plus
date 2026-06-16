import type { SiteAdapter } from '../types/site-adapter';
import { EHentaiAdapter } from './e-hentai';
import { FourKHDAdapter } from './4khd';

const adapters: SiteAdapter[] = [EHentaiAdapter, FourKHDAdapter];

export const SiteManager = {
  register(adapter: SiteAdapter) {
    adapters.push(adapter);
  },

  getAdapter(url: string, doc: Document = document): SiteAdapter | null {
    return adapters.find(a => a.match(url, doc)) || null;
  }
};
