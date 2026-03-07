import { GM_getValue } from '$';
import type { AppConfig, UserSettings } from '../types';

export const CFG: AppConfig = {
  nextPage: '3000px 0px',
  prefetchDistance: 5000,
  maxRetries: 3,
  retryDelay: 1000,
  maxConcurrent: 3,
  requestSpacing: 100,
  imageLoadTimeout: 10000,
};

export function loadSettings(): UserSettings {
  return {
    scrollMode: GM_getValue('scrollMode', true),
    autoScroll: GM_getValue('autoScroll', true),
    showControl: GM_getValue('showControl', true),
    autoEnterSinglePage: GM_getValue('autoEnterSinglePage', false),
    autoPlayInterval: GM_getValue('autoPlayInterval', 3000),
  };
}
