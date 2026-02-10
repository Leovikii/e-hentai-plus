import { store } from '../state/store';

export interface SettingsPanelHandle {
  getButtonElement: () => HTMLElement;
  getPanelElement: () => HTMLElement;
}

interface SettingItem {
  label: string;
  key: keyof Pick<typeof store.settings, 'showControl' | 'autoScroll' | 'autoEnterSinglePage'>;
}

const SETTINGS: SettingItem[] = [
  { label: 'Show Control', key: 'showControl' },
  { label: 'Auto Scroll', key: 'autoScroll' },
  { label: 'Auto Enter Reader', key: 'autoEnterSinglePage' },
];

export function createSettingsPanel(): SettingsPanelHandle {
  const settingsBtn = document.createElement('div');
  settingsBtn.className = 'settings-btn';

  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'settings-panel';

  SETTINGS.forEach(({ label, key }) => {
    const item = document.createElement('div');
    item.className = 'settings-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'settings-label';
    labelEl.textContent = label;

    const toggle = document.createElement('div');
    toggle.className = `toggle-switch${store.settings[key] ? ' on' : ''}`;

    const slider = document.createElement('div');
    slider.className = 'toggle-slider';
    toggle.appendChild(slider);

    toggle.onclick = () => {
      const newValue = !store.settings[key];
      store.updateSetting(key, newValue);
      toggle.classList.toggle('on', newValue);
    };

    item.appendChild(labelEl);
    item.appendChild(toggle);
    settingsPanel.appendChild(item);
  });

  // Auto-play interval setting
  const intervalItem = document.createElement('div');
  intervalItem.className = 'settings-item';

  const intervalLabel = document.createElement('span');
  intervalLabel.className = 'settings-label';
  intervalLabel.textContent = 'Play Interval';

  const intervalRight = document.createElement('div');
  intervalRight.style.cssText = 'display:flex;align-items:center;gap:4px;';

  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.className = 'interval-input';
  intervalInput.min = '1';
  intervalInput.max = '60';
  intervalInput.step = '0.5';
  intervalInput.value = String(store.settings.autoPlayInterval / 1000);
  intervalInput.onclick = (e) => e.stopPropagation();
  intervalInput.onchange = (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(value) && value >= 1 && value <= 60) {
      store.updateSetting('autoPlayInterval', value * 1000);
    }
  };

  const intervalUnit = document.createElement('span');
  intervalUnit.textContent = 's';
  intervalUnit.style.cssText = 'font-size:12px;color:#888;';

  intervalRight.appendChild(intervalInput);
  intervalRight.appendChild(intervalUnit);
  intervalItem.appendChild(intervalLabel);
  intervalItem.appendChild(intervalRight);
  settingsPanel.appendChild(intervalItem);

  settingsBtn.onclick = (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('show');
  };

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target as Node) && !settingsBtn.contains(e.target as Node)) {
      settingsPanel.classList.remove('show');
    }
  });

  return {
    getButtonElement: () => settingsBtn,
    getPanelElement: () => settingsPanel,
  };
}
