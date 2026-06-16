import { GM_registerMenuCommand } from '$';
import { store } from './state/store';
import { i18n } from './utils/i18n';

export function registerMenuCommands(): void {
  GM_registerMenuCommand(`${i18n.toggle}${i18n.scrollMode}`, () => {
    store.updateSetting('scrollMode', !store.settings.scrollMode);
    alert(`${i18n.scrollMode} ${store.settings.scrollMode ? i18n.enabled : i18n.disabled}`);
    location.reload();
  });

  GM_registerMenuCommand(`${i18n.toggle}${i18n.showControl}`, () => {
    store.updateSetting('showControl', !store.settings.showControl);
    alert(`${i18n.showControl} ${store.settings.showControl ? i18n.enabled : i18n.disabled}`);
    location.reload();
  });

  GM_registerMenuCommand(`${i18n.toggle}${i18n.autoEnter}`, () => {
    store.updateSetting('autoEnterSinglePage', !store.settings.autoEnterSinglePage);
    alert(`${i18n.autoEnter} ${store.settings.autoEnterSinglePage ? i18n.enabled : i18n.disabled}`);
    location.reload();
  });
}
