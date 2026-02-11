export interface UserSettings {
  autoScroll: boolean;
  showControl: boolean;
  autoEnterSinglePage: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
}

export interface AppConfig {
  nextPage: string;
  prefetchDistance: number;
  maxRetries: number;
  retryDelay: number;
}

export interface SinglePageModeHandle {
  open: () => void;
  close: () => void;
  isActive: () => boolean;
  getOverlayElement: () => HTMLElement;
  jumpTo: (index: number) => void;
}
