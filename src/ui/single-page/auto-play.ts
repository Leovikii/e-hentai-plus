import { store } from '../../state/store';

export interface AutoPlayHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
  stopAtEnd: () => void;
}

export function createAutoPlay(nextImageFn: () => void): AutoPlayHandle {
  function start(): void {
    if (store.autoPlayTimer) clearInterval(store.autoPlayTimer);
    if (store.autoPlay) {
      store.autoPlayTimer = setInterval(nextImageFn, store.settings.autoPlayInterval);
    }
  }

  function stop(): void {
    if (store.autoPlayTimer) {
      clearInterval(store.autoPlayTimer);
      store.autoPlayTimer = null;
    }
  }

  function reset(): void {
    if (store.autoPlay) {
      stop();
      start();
    }
  }

  function stopAtEnd(): void {
    store.autoPlay = false;
    store.emit('settingsChanged');
    stop();
  }

  return { start, stop, reset, stopAtEnd };
}
