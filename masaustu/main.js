const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false;

// GitHub release feed URL'sini açıkça belirt
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'mustafabakoglu',
  repo: 'Satin-alma',
  releaseType: 'release'
});

// Public repo - token gerekmez
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

autoUpdater.on('update-available', (info) => {
  console.log('Güncelleme mevcut:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Uygulama güncel.');
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('Güncelleme hatası (DETAYLI):', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    fullError: err
  });
  if (mainWindow) {
    mainWindow.webContents.send('update-error', `Hata: ${err.message || err.code || 'Bilinmeyen hata'}`);
  }
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
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
    console.log('autoUpdater config:', {
      provider: 'github',
      owner: 'mustafabakoglu',
      repo: 'Satin-alma',
      updateUrl: autoUpdater.updateUrl
    });
    const result = await autoUpdater.checkForUpdates();
    console.log('Güncelleme kontrolü sonucu:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Güncelleme kontrol hatası (DETAYLI):', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      path: error.path,
      stack: error.stack
    });
    return { success: false, error: error.message || JSON.stringify(error) };
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

// ─── İhale IPC Handlers ─────────────────────────────────

const IHALE_API_URL = 'http://10.35.20.17:5055';

async function ihaleFetch(path, options = {}) {
  const res = await fetch(`${IHALE_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// Tüm ihale kayıtlarını çek (rapor hesaplamaları için)
async function fetchAllIhaleRecords(extraParams = {}) {
  const qs = new URLSearchParams({ limit: '10000', ...extraParams });
  const json = await ihaleFetch(`/api/ihaleler?${qs.toString()}`);
  return json.data || [];
}

ipcMain.handle('ihale-list', async (event, params) => {
  try {
    const qs = new URLSearchParams();
    if (params?.lokasyon) qs.set('lokasyon', params.lokasyon);
    if (params?.tarih_baslangic) qs.set('tarih_baslangic', params.tarih_baslangic);
    if (params?.tarih_bitis) qs.set('tarih_bitis', params.tarih_bitis);
    if (params?.page) qs.set('page', params.page);
    if (params?.limit) qs.set('limit', params.limit);
    const query = qs.toString();
    const data = await ihaleFetch(`/api/ihaleler${query ? '?' + query : ''}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-get', async (event, siraNo) => {
  try {
    const data = await ihaleFetch(`/api/ihaleler/${siraNo}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-create', async (event, dto) => {
  try {
    const data = await ihaleFetch('/api/ihaleler', { method: 'POST', body: JSON.stringify(dto) });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-update', async (event, { siraNo, dto }) => {
  try {
    const data = await ihaleFetch(`/api/ihaleler/${siraNo}`, { method: 'PUT', body: JSON.stringify(dto) });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-delete', async (event, siraNo) => {
  try {
    const data = await ihaleFetch(`/api/ihaleler/${siraNo}`, { method: 'DELETE' });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-lokasyonlar', async () => {
  try {
    const records = await fetchAllIhaleRecords();
    const lokSet = new Set(records.map(r => r.lokasyon).filter(Boolean));
    const data = [...lokSet].sort();
    return { success: true, data };
  } catch (e) { return { success: false, error: e.message }; }
});

// ─── Yardımcı rapor hesaplama fonksiyonları ─────────────

function filterByParams(records, params) {
  let data = records;
  if (params?.lokasyon) {
    const normLok = (params.lokasyon || '').toLowerCase().replace(/\s+/g, ' ').trim();
    data = data.filter(r => {
      const rl = (r.lokasyon || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return rl === normLok || rl.includes(normLok) || normLok.includes(rl);
    });
  }
  if (params?.tarih_baslangic) {
    const d = new Date(params.tarih_baslangic);
    data = data.filter(r => new Date(r.tarih) >= d);
  }
  if (params?.tarih_bitis) {
    const d = new Date(params.tarih_bitis);
    data = data.filter(r => new Date(r.tarih) <= d);
  }
  return data;
}

function calcOzet(records) {
  const total = records.length;
  const totalKazanc = records.reduce((s, r) => s + (r.kazanc_tutari_tl || 0), 0);
  const avg = total > 0 ? totalKazanc / total : 0;
  const maxRec = records.reduce((mx, r) => (!mx || (r.kazanc_tutari_tl || 0) > (mx.kazanc_tutari_tl || 0)) ? r : mx, null);
  return {
    toplam_ihale_sayisi: total,
    toplam_kazanc_tl: Math.round(totalKazanc),
    ortalama_kazanc_tl: Math.round(avg),
    en_yuksek_kazanc: maxRec ? {
      tutar: Math.round(maxRec.kazanc_tutari_tl || 0),
      malzeme: maxRec.malzeme_hizmet,
      kazanan_tedarikci: maxRec.kazanan_tedarikci,
      lokasyon: maxRec.lokasyon,
      tarih: maxRec.tarih,
      siparis_numarasi: maxRec.siparis_numarasi,
      firma_1: maxRec.firma_1, teklif_1_tl: maxRec.teklif_1_tl,
      firma_2: maxRec.firma_2, teklif_2_tl: maxRec.teklif_2_tl,
      firma_3: maxRec.firma_3, teklif_3_tl: maxRec.teklif_3_tl,
      firma_4: maxRec.firma_4, teklif_4_tl: maxRec.teklif_4_tl,
      firma_5: maxRec.firma_5, teklif_5_tl: maxRec.teklif_5_tl,
    } : { tutar: 0 },
  };
}

function calcLokasyon(records) {
  const map = {};
  for (const r of records) {
    const l = r.lokasyon || 'Diğer';
    if (!map[l]) map[l] = { lokasyon: l, ihale_sayisi: 0, toplam_kazanc_tl: 0 };
    map[l].ihale_sayisi++;
    map[l].toplam_kazanc_tl += (r.kazanc_tutari_tl || 0);
  }
  return Object.values(map)
    .sort((a, b) => b.toplam_kazanc_tl - a.toplam_kazanc_tl)
    .map(x => ({ ...x, toplam_kazanc_tl: Math.round(x.toplam_kazanc_tl) }));
}

function calcTedarikci(records) {
  const map = {};
  for (const r of records) {
    const t = r.kazanan_tedarikci || 'Bilinmiyor';
    if (!map[t]) map[t] = { kazanan_tedarikci: t, kazandigi_ihale_sayisi: 0, toplam_kazanc_tl: 0 };
    map[t].kazandigi_ihale_sayisi++;
    map[t].toplam_kazanc_tl += (r.kazanc_tutari_tl || 0);
  }
  return Object.values(map)
    .sort((a, b) => b.toplam_kazanc_tl - a.toplam_kazanc_tl)
    .map(x => ({ ...x, toplam_kazanc_tl: Math.round(x.toplam_kazanc_tl) }));
}

function calcMasrafMerkezi(records) {
  const map = {};
  for (const r of records) {
    const m = (r.masraf_merkezi || '').trim() || 'Belirtilmemiş';
    if (!map[m]) map[m] = { masraf_merkezi: m, ihale_sayisi: 0, toplam_kazanc_tl: 0 };
    map[m].ihale_sayisi++;
    map[m].toplam_kazanc_tl += (r.kazanc_tutari_tl || 0);
  }
  return Object.values(map)
    .sort((a, b) => b.toplam_kazanc_tl - a.toplam_kazanc_tl)
    .map(x => ({ ...x, toplam_kazanc_tl: Math.round(x.toplam_kazanc_tl) }));
}

function calcRekabet(records) {
  const map = {};
  for (const r of records) {
    const firmalar = [r.firma_1, r.firma_2, r.firma_3, r.firma_4, r.firma_5].filter(f => f && f.trim());
    for (let i = 0; i < firmalar.length; i++) {
      for (let j = i + 1; j < firmalar.length; j++) {
        const a = firmalar[i].trim(), b = firmalar[j].trim();
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        if (!map[key]) map[key] = { firma_a: a < b ? a : b, firma_b: a < b ? b : a, kac_ihalede_karsilastilar: 0 };
        map[key].kac_ihalede_karsilastilar++;
      }
    }
  }
  return Object.values(map).sort((a, b) => b.kac_ihalede_karsilastilar - a.kac_ihalede_karsilastilar).slice(0, 50);
}

function calcTrend(records, yil) {
  const y = parseInt(yil) || new Date().getFullYear();
  const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const months = AY.map((ay_isim, i) => ({ ay: i + 1, ay_isim, ihale_sayisi: 0, toplam_kazanc_tl: 0, bir_onceki_aya_gore_degisim_yuzdesi: null }));
  for (const r of records) {
    const d = new Date(r.tarih);
    if (d.getFullYear() === y) {
      months[d.getMonth()].ihale_sayisi++;
      months[d.getMonth()].toplam_kazanc_tl += (r.kazanc_tutari_tl || 0);
    }
  }
  for (let i = 1; i < 12; i++) {
    const prev = months[i - 1].toplam_kazanc_tl;
    const curr = months[i].toplam_kazanc_tl;
    if (prev !== 0) months[i].bir_onceki_aya_gore_degisim_yuzdesi = Math.round((curr - prev) / prev * 1000) / 10;
  }
  return months.map(m => ({ ...m, toplam_kazanc_tl: Math.round(m.toplam_kazanc_tl) }));
}

function calcTasarruf(records) {
  return records
    .filter(r => r.kazanc_tutari_tl > 0)
    .map(r => {
      const teklifler = [r.teklif_1_tl, r.teklif_2_tl, r.teklif_3_tl, r.teklif_4_tl, r.teklif_5_tl].filter(t => t != null && t > 0);
      const enYuksek = teklifler.length > 0 ? Math.max(...teklifler) : 0;
      const oran = enYuksek > 0 ? Math.round((r.kazanc_tutari_tl / enYuksek) * 1000) / 10 : 0;
      return { malzeme_hizmet: r.malzeme_hizmet, kazanan_tedarikci: r.kazanan_tedarikci, en_yuksek_teklif_tl: Math.round(enYuksek), kazanc_tutari_tl: Math.round(r.kazanc_tutari_tl || 0), tasarruf_orani_yuzde: oran };
    })
    .sort((a, b) => b.tasarruf_orani_yuzde - a.tasarruf_orani_yuzde)
    .slice(0, 100);
}

ipcMain.handle('ihale-rapor-ozet', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcOzet(records) };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-lokasyon', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcLokasyon(records) };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-tedarikci', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcTedarikci(records) };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-masraf-merkezi', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    const missing = (records || []).filter(r => {
      const v = (r.masraf_merkezi || r.MASRAF_MERKEZI || '').toString().trim();
      return !v;
    }).map(r => ({ siparis_no: r.siparis_numarasi || r.SIPARIS_NO || r.siparisNo || null, talep_no: r.talep_no || r.TALEP_NO || null, toplam: r.kazanc_tutari_tl || r.TOPLAM || null }));
    if (missing.length) console.log('Masraf merkezi eksik olan kayıtlar:', missing);
    return { success: true, data: calcMasrafMerkezi(records), missingRecords: missing };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-rekabet', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcRekabet(records) };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-trend', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcTrend(records, params?.yil || new Date().getFullYear()) };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('ihale-rapor-tasarruf', async (event, params) => {
  try {
    const records = filterByParams(await fetchAllIhaleRecords(), params);
    return { success: true, data: calcTasarruf(records) };
  } catch (e) { return { success: false, error: e.message }; }
});

// ─── Tedarikçi Kategori IPC Handlers ─────────────────────

ipcMain.handle('tedarikci-kategori-list', async (event, params) => {
  try {
    const qs = new URLSearchParams();
    if (params?.tip) qs.set('tip', params.tip);
    if (params?.kategori) qs.set('kategori', params.kategori);
    if (params?.tedarikci) qs.set('tedarikci', params.tedarikci);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', params.page);
    if (params?.limit) qs.set('limit', params.limit);
    const query = qs.toString();
    const data = await ihaleFetch(`/api/TedarikciKategori${query ? '?' + query : ''}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-get', async (event, id) => {
  try {
    const data = await ihaleFetch(`/api/TedarikciKategori/${id}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-create', async (event, dto) => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori', { method: 'POST', body: JSON.stringify(dto) });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-update', async (event, { id, dto }) => {
  try {
    const data = await ihaleFetch(`/api/TedarikciKategori/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-delete', async (event, id) => {
  try {
    const data = await ihaleFetch(`/api/TedarikciKategori/${id}`, { method: 'DELETE' });
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

// Tedarikçi Kategori Raporları
ipcMain.handle('tedarikci-kategori-rapor-istatistik', async () => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori/raporlar/genel-istatistik');
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-kategori-ozet', async (event, params) => {
  try {
    const qs = new URLSearchParams();
    if (params?.tip) qs.set('tip', params.tip);
    const query = qs.toString();
    const data = await ihaleFetch(`/api/TedarikciKategori/raporlar/kategori-ozet${query ? '?' + query : ''}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-tip-dagilimi', async () => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori/raporlar/tip-dagilimi');
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-tedarikci-profil', async (event, params) => {
  try {
    const qs = new URLSearchParams();
    if (params?.cari_kodu) qs.set('cari_kodu', params.cari_kodu);
    if (params?.unvan) qs.set('unvan', params.unvan);
    const query = qs.toString();
    const data = await ihaleFetch(`/api/TedarikciKategori/raporlar/tedarikci-profil${query ? '?' + query : ''}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-eksik-bilgi', async () => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori/raporlar/eksik-bilgi');
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-coklu-kategori', async () => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori/raporlar/coklu-kategori');
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-kategori-karsilastirma', async (event, params) => {
  try {
    const qs = new URLSearchParams();
    if (params?.kategoriler) qs.set('kategoriler', params.kategoriler);
    const data = await ihaleFetch(`/api/TedarikciKategori/raporlar/kategori-karsilastirma?${qs.toString()}`);
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('tedarikci-kategori-rapor-kategori-listesi', async () => {
  try {
    const data = await ihaleFetch('/api/TedarikciKategori/raporlar/kategori-listesi');
    return { success: true, ...data };
  } catch (e) { return { success: false, error: e.message }; }
});
