import { GM_getValue } from '$';
import type { AppConfig, UserSettings } from '../types';

export const CFG: AppConfig = {
  nextPage: '3000px 0px',
  prefetchDistance: 5000,
  maxRetries: 3,
  retryDelay: 1000,
};

export function loadSettings(): UserSettings {
  return {
    autoScroll: GM_getValue('autoScroll', true),
    showControl: GM_getValue('showControl', true),
    autoEnterSinglePage: GM_getValue('autoEnterSinglePage', false),
    autoPlay: GM_getValue('autoPlay', false),
    autoPlayInterval: GM_getValue('autoPlayInterval', 3000),
  };
}
