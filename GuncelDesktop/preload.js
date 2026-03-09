const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getData: (query) => ipcRenderer.invoke('get-data', query),
  getAllData: () => ipcRenderer.invoke('get-all-data'),
  getDashboardStats: (ambarFilter) => ipcRenderer.invoke('get-dashboard-stats', ambarFilter),
  getAmbarList: () => ipcRenderer.invoke('get-ambar-list'),
  getFactoryComparison: () => ipcRenderer.invoke('get-factory-comparison'),
  testConnection: () => ipcRenderer.invoke('test-connection'),
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  restartForUpdate: () => ipcRenderer.invoke('restart-for-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  // Dosya Yönetimi
  dosyaListele: (siparisNo) => ipcRenderer.invoke('dosya-listele', siparisNo),
  dosyaSayilari: (siparisNolar) => ipcRenderer.invoke('dosya-sayilari', siparisNolar),
  dosyaYukle: (params) => ipcRenderer.invoke('dosya-yukle', params),
  dosyaSil: (id) => ipcRenderer.invoke('dosya-sil', id),
  dosyaIndir: (params) => ipcRenderer.invoke('dosya-indir', params),
  dosyaGoruntule: (id) => ipcRenderer.invoke('dosya-goruntule', id),
  dosyaGoruntuleUrl: (id) => ipcRenderer.invoke('dosya-goruntule-url', id),
});
