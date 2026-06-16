const isZH = navigator.language.toLowerCase().includes('zh');

export const i18n = {
  // Float Control tooltips
  readerMode: isZH ? '阅读器模式' : 'Reader Mode',
  autoPlay: isZH ? '自动翻页' : 'Auto Play',
  settings: isZH ? '设置' : 'Settings',
  backToTop: isZH ? '回到顶部' : 'Back to Top',

  // Settings Panel
  scrollMode: isZH ? '卷轴模式 (往下滚动自动加载)' : 'Scroll Mode (Infinite Scroll)',
  autoEnter: isZH ? '自动进入阅读器' : 'Auto Enter Reader',
  showControl: isZH ? '显示悬浮控制钮' : 'Show Float Control',
  readerWidth: isZH ? '阅读器最大宽度 (px, 0=全屏)' : 'Reader Max Width (px, 0=Full)',
  playSpeed: isZH ? '自动翻页速度 (ms)' : 'Auto Play Speed (ms)',
  maxPreload: isZH ? '最大预加载图片数' : 'Max Preload Count',
  close: isZH ? '关闭' : 'Close',

  // Overlay Network Status
  waitingForNetwork: isZH ? '等待网络请求...' : 'Waiting for network...',
  downloading: isZH ? '下载中...' : 'Downloading...',
  requestingNewNode: isZH ? '正在请求新节点...' : 'Requesting New Node...',
  reloading: isZH ? '重新加载中...' : 'Reloading...',
  loadFailed: isZH ? '加载失败，点击重试' : 'Load Failed. Click to Retry',
  waitImagesToLoad: isZH ? '请等待图片加载' : 'Please wait for images to load',
};
