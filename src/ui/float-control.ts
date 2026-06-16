import { store } from '../state/store';
import { svgReader, svgPlay, svgPause, svgSettings, svgTop } from '../utils/icons';
import { createSettingsPanel } from './settings-panel';
import { i18n } from '../utils/i18n';
import type { SinglePageModeHandle } from '../types';

export function createFloatControl(spmHandle: SinglePageModeHandle): void {
  const floatControl = document.createElement('div');
  floatControl.className = `float-control${store.settings.showControl ? '' : ' hidden'}`;

  // Auto-play button (left, hidden until reader mode opens)
  const autoPlayBtn = document.createElement('div');
  autoPlayBtn.className = `side-btn auto-play-btn hidden${store.autoPlay ? ' active' : ''}`;
  autoPlayBtn.innerHTML = store.autoPlay ? svgPause : svgPlay;
  autoPlayBtn.title = i18n.autoPlay;
  autoPlayBtn.onclick = (e) => {
    e.stopPropagation();
    const newValue = !store.autoPlay;
    store.autoPlay = newValue;
    store.emit('settingsChanged');
    autoPlayBtn.innerHTML = newValue ? svgPause : svgPlay;
    autoPlayBtn.classList.toggle('active', newValue);
  };

  // Center circle — reader mode toggle
  const circleControl = document.createElement('div');
  circleControl.className = 'circle-control';
  circleControl.innerHTML = svgReader;
  circleControl.title = i18n.readerMode;
  circleControl.onclick = (e) => {
    if (e.target !== circleControl && !circleControl.querySelector('svg')?.contains(e.target as Node)) return;
    if (spmHandle.isActive()) {
      spmHandle.close();
    } else {
      spmHandle.open();
    }
  };

  // Sync play button visibility with reader mode state (works for both manual and auto-enter)
  store.on('readerModeChanged', () => {
    if (spmHandle.isActive()) {
      autoPlayBtn.classList.remove('hidden');
      autoPlayBtn.innerHTML = store.autoPlay ? svgPause : svgPlay;
      autoPlayBtn.classList.toggle('active', store.autoPlay);
    } else {
      autoPlayBtn.classList.add('hidden');
    }
  });

  // Settings button (right)
  const settings = createSettingsPanel();
  const settingsBtn = settings.getButtonElement();
  settingsBtn.className = 'side-btn';
  settingsBtn.innerHTML = svgSettings;
  settingsBtn.title = i18n.settings;

  // Back to top button (above the control bar)
  const topBtn = document.createElement('div');
  topBtn.className = 'side-btn top-btn';
  topBtn.innerHTML = svgTop;
  topBtn.title = i18n.backToTop;
  topBtn.onclick = (e) => {
    e.stopPropagation();
    if (spmHandle.isActive()) {
      spmHandle.jumpTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Assemble horizontally: [play] [circle] [settings], with top button above circle
  circleControl.appendChild(topBtn);
  floatControl.appendChild(autoPlayBtn);
  floatControl.appendChild(circleControl);
  floatControl.appendChild(settingsBtn);
  floatControl.appendChild(settings.getPanelElement());

  document.body.appendChild(floatControl);
}
