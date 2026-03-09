const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
// Ozel GitHub reposu icin token - tum makinelerde guncelleme calissin
autoUpdater.requestHeaders = { 'Authorization': 'token TOKEN_REMOVED' };
// Guncelleme logunu dosyaya yaz
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
const path = require('path');
const fs = require('fs');
const database = require('./database');

// Dosya API base URL
const DOSYA_API_URL = 'http://10.35.20.17:5055';

// Ensure AppUserModelID for correct taskbar/exe icon on Windows
try {
  app.setAppUserModelId && app.setAppUserModelId('com.satinalma.rapor');
} catch (e) {
  // ignore if not supported in this environment
}

// Ensure app.name uses proper Unicode to avoid Alt-Tab encoding issues on Windows
try {
  app.name = 'Satın Alma Rapor Sistemi';
} catch (e) {
  // ignore
}

// Menu bar'i kaldir
Menu.setApplicationMenu(null);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'Satın Alma Rapor Sistemi',
    backgroundColor: '#f5f6f7',
    show: false,
    frame: true,
    autoHideMenuBar: true,
    fullscreen: true,
    simpleFullscreen: true,
    kiosk: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Pencere hazir oldugunda fullscreen goster
  mainWindow.once('ready-to-show', () => {
    mainWindow.setFullScreen(true);
    mainWindow.show();
  });

  // Development modunda DevTools'u ac
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Auto-update kontrolü (production modda)
  if (!process.argv.includes('--dev')) {
    autoUpdater.checkForUpdatesAndNotify();
    
    // Her 30 dakikada bir güncelleme kontrolü
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 30 * 60 * 1000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Güncelleme kontrolü yapılıyor...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Yeni güncelleme bulundu:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('Uygulama güncel.');
});

autoUpdater.on('error', (err) => {
  console.error('Güncelleme hatası:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let msg = `İndiriliyor: ${Math.round(progressObj.percent)}%`;
  console.log(msg);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Güncelleme indirildi:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
  // Uygulama kapanınca otomatik kurulacak (autoInstallOnAppQuit = true)
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window Control IPC Handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(false);
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    } else {
      mainWindow.setFullScreen(true);
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('Manuel güncelleme kontrolü başlandı...');
    const result = await autoUpdater.checkForUpdates();
    console.log('Güncelleme kontrolü sonucu:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Güncelleme kontrol hatası:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restart-for-update', () => {
  autoUpdater.quitAndInstall(true, true);
});

// IPC Handlers
ipcMain.handle('get-data', async (event, query) => {
  try {
    const result = await database.executeQuery(query);
    return { success: true, data: result };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-all-data', async () => {
  try {
    const result = await database.getAllData();
    return { success: true, data: result };
  } catch (error) {
    console.error('getAllData error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-dashboard-stats', async (event, ambarFilter) => {
  try {
    const result = await database.getDashboardStats(ambarFilter);
    return { success: true, data: result };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-ambar-list', async () => {
  try {
    const result = await database.getAmbarList();
    return { success: true, data: result };
  } catch (error) {
    console.error('getAmbarList error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-factory-comparison', async () => {
  try {
    const result = await database.getFactoryComparisonData();
    return { success: true, data: result };
  } catch (error) {
    console.error('getFactoryComparisonData error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-connection', async () => {
  try {
    await database.getAmbarList();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ─── Dosya Yönetimi IPC Handlers ────────────────────────────

// Sipariş numarasına ait dosyaları listele
ipcMain.handle('dosya-listele', async (event, siparisNo) => {
  try {
    const response = await fetch(`${DOSYA_API_URL}/api/Dosya/siparis/${encodeURIComponent(siparisNo)}`);
    if (!response.ok) throw new Error('Dosya listesi alınamadı');
    const json = await response.json();
    // API { success, data: [...] } döndürür — çift sarmalama önlenir
    return { success: true, data: json.data || json };
  } catch (error) {
    console.error('dosya-listele error:', error);
    return { success: false, error: error.message };
  }
});

// Birden fazla siparişin dosya sayılarını getir
ipcMain.handle('dosya-sayilari', async (event, siparisNolar) => {
  try {
    const response = await fetch(`${DOSYA_API_URL}/api/Dosya/sayilar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siparisNolar }),
    });
    if (!response.ok) throw new Error('Dosya sayıları alınamadı');
    const json = await response.json();
    // API { success, data: { "S.032...": 3 } } döndürür — çift sarmalama önlenir
    return { success: true, data: json.data || json };
  } catch (error) {
    console.error('dosya-sayilari error:', error);
    return { success: false, error: error.message };
  }
});

// Dosya yükle — dosya seçici dialog aç, seçilen dosyayı multipart POST gönder
ipcMain.handle('dosya-yukle', async (event, { siparisNo, aciklama }) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Dosya Seç',
      properties: ['openFile'],
      filters: [
        { name: 'Tüm Desteklenen', extensions: ['jpg','jpeg','png','gif','webp','bmp','pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','zip','rar'] },
        { name: 'Görseller', extensions: ['jpg','jpeg','png','gif','webp','bmp'] },
        { name: 'Belgeler', extensions: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv'] },
        { name: 'Arşiv', extensions: ['zip','rar'] },
      ],
    });
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    const mimeMap = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', bmp: 'image/bmp', pdf: 'application/pdf',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain', csv: 'text/csv', zip: 'application/zip', rar: 'application/x-rar-compressed',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    // Multipart form data oluştur
    const boundary = '----ElectronFormBoundary' + Date.now().toString(36);
    const parts = [];
    // file part
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const filePart = Buffer.from(parts[0]);
    // siparisNo part
    const sipPart = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="siparisNo"\r\n\r\n${siparisNo}`);
    // aciklama part
    let aciklamaPart = Buffer.alloc(0);
    if (aciklama) {
      aciklamaPart = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="aciklama"\r\n\r\n${aciklama}`);
    }
    const endPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([filePart, fileBuffer, sipPart, aciklamaPart, endPart]);

    const response = await fetch(`${DOSYA_API_URL}/api/Dosya/upload`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    const text = await response.text();
    if (!response.ok) {
      let errMsg = 'Dosya yüklenemedi';
      try { errMsg = JSON.parse(text).error || errMsg; } catch(_) { errMsg = text || errMsg; }
      throw new Error(errMsg);
    }
    return { success: true, data: JSON.parse(text) };
  } catch (error) {
    if (error.message === 'canceled') return { success: false, canceled: true };
    console.error('dosya-yukle error:', error);
    return { success: false, error: error.message };
  }
});

// Dosya sil
ipcMain.handle('dosya-sil', async (event, id) => {
  try {
    const response = await fetch(`${DOSYA_API_URL}/api/Dosya/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Dosya silinemedi');
    const json = await response.json();
    return { success: json.success !== false, data: json.data || json };
  } catch (error) {
    console.error('dosya-sil error:', error);
    return { success: false, error: error.message };
  }
});

// Dosya indir — tarayıcıda indirme yerine native save dialog
ipcMain.handle('dosya-indir', async (event, { id, dosyaAdi }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Dosyayı Kaydet',
      defaultPath: dosyaAdi || 'dosya',
    });
    if (result.canceled) return { success: false, canceled: true };
    const response = await fetch(`${DOSYA_API_URL}/api/Dosya/download/${id}`);
    if (!response.ok) throw new Error('Dosya indirilemedi');
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(result.filePath, buffer);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('dosya-indir error:', error);
    return { success: false, error: error.message };
  }
});

// Dosya görüntüle — uygulama içi pencerede aç
ipcMain.handle('dosya-goruntule', async (event, id) => {
  try {
    const url = `${DOSYA_API_URL}/api/Dosya/goruntule/${id}`;
    const previewWin = new BrowserWindow({
      width: 900,
      height: 700,
      parent: mainWindow,
      modal: false,
      title: 'Dosya Önizleme',
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      autoHideMenuBar: true,
    });
    previewWin.loadURL(url);
    return { success: true };
  } catch (error) {
    console.error('dosya-goruntule error:', error);
    return { success: false, error: error.message };
  }
});

// Dosya görüntüleme URL'si döndür
ipcMain.handle('dosya-goruntule-url', (event, id) => {
  return { success: true, url: `${DOSYA_API_URL}/api/Dosya/goruntule/${id}` };
});
