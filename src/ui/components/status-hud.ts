export type HUDStatus = 'loading' | 'error';

export interface HUDConfig {
  status: HUDStatus;
  text: string;
  pageText?: string;
  onClick?: () => void;
}

export interface StatusHUDHandle {
  show: (config: HUDConfig) => void;
  hide: () => void;
  getElement: () => HTMLElement;
}

export function createStatusHUD(): StatusHUDHandle {
  const container = document.createElement('div');
  container.className = 'sp-hud-container';

  function show(config: HUDConfig): void {
    const isError = config.status === 'error';
    const color = isError ? '#ef4444' : '#F596AA';
    
    const iconSvg = isError 
      ? `<svg style="color: ${color}; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>`
      : `<style>@keyframes sp-spin { 100% { transform: rotate(360deg); } }</style><svg style="color: ${color}; width: 18px; height: 18px; animation: sp-spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;

    container.innerHTML = `
      <div class="sp-hud-box ${isError ? 'hud-error' : ''}">
        ${iconSvg}
        <div class="sp-hud-text">${config.text}</div>
        ${config.pageText ? `<div class="sp-hud-page">${config.pageText}</div>` : ''}
      </div>
    `;

    const box = container.querySelector('.sp-hud-box') as HTMLElement;
    if (config.onClick) {
      box.style.cursor = 'pointer';
      box.onclick = config.onClick;
    }

    container.classList.add('show');
  }

  function hide(): void {
    container.classList.remove('show');
  }

  return { show, hide, getElement: () => container };
}
