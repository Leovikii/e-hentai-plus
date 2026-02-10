import { GM_setValue } from '$';
import type { UserSettings } from '../types';
import { loadSettings } from './config';

type StoreEvent = 'settingsChanged';
type Listener = () => void;

class Store {
  private _settings: UserSettings;
  private listeners = new Map<StoreEvent, Set<Listener>>();

  // Page state
  currPage = 1;
  totalPage = 1;
  nextUrl: string | null = null;
  isFetching = false;
  nextPagePrefetched = false;

  // Single page state
  currentImageIndex = 0;
  allImages: HTMLImageElement[] = [];
  autoPlayTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this._settings = loadSettings();
  }

  get settings(): Readonly<UserSettings> {
    return this._settings;
  }

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this._settings[key] = value;
    GM_setValue(key, value);
    this.emit('settingsChanged');
  }

  on(event: StoreEvent, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  private emit(event: StoreEvent): void {
    this.listeners.get(event)?.forEach(fn => fn());
  }
}

export const store = new Store();
