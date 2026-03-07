export interface UserSettings {
  scrollMode: boolean;
  autoScroll: boolean;
  showControl: boolean;
  autoEnterSinglePage: boolean;
  autoPlayInterval: number;
}

export interface AppConfig {
  nextPage: string;
  prefetchDistance: number;
  maxRetries: number;
  retryDelay: number;
  maxConcurrent: number;
  requestSpacing: number;
}

export interface SinglePageModeHandle {
  open: () => void;
  close: () => void;
  isActive: () => boolean;
  getOverlayElement: () => HTMLElement;
  jumpTo: (index: number) => void;
}
