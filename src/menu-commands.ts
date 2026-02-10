import { GM_registerMenuCommand } from '$';
import { store } from './state/store';

export function registerMenuCommands(): void {
  GM_registerMenuCommand('Toggle Auto Scroll', () => {
    store.updateSetting('autoScroll', !store.settings.autoScroll);
    alert(`Auto Scroll ${store.settings.autoScroll ? 'Enabled' : 'Disabled'}`);
    location.reload();
  });

  GM_registerMenuCommand('Toggle Control Display', () => {
    store.updateSetting('showControl', !store.settings.showControl);
    alert(`Control Display ${store.settings.showControl ? 'Enabled' : 'Disabled'}`);
    location.reload();
  });

  GM_registerMenuCommand('Toggle Auto Enter Single Page', () => {
    store.updateSetting('autoEnterSinglePage', !store.settings.autoEnterSinglePage);
    alert(`Auto Enter Single Page ${store.settings.autoEnterSinglePage ? 'Enabled' : 'Disabled'}`);
    location.reload();
  });
}
