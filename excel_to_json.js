// SADECE Excel'den ocak_2026_data.json oluştur
// SQL'den çekme yok - Excel tek kaynak
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const wb = XLSX.readFile(path.join(__dirname, 'ocak.xls'));
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(ws);

console.log('Excel satır sayısı:', excelData.length);

// Excel tarihini ISO string'e çevir
function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + serial * 86400000);
  return date.toISOString();
}

// Dövizli tutar'dan para birimini çıkar
function parseDovizliTutar(dovizStr) {
  if (!dovizStr) return { paraBirimi: 'TL', dovizTutar: null, birimFiyat: null };
  const str = String(dovizStr).trim();
  // "77,44 €" veya "40440,00 $" formatı
  const numMatch = str.match(/^([0-9.,]+)/);
  let numVal = null;
  if (numMatch) {
    numVal = parseFloat(numMatch[1].replace(/\./g, '').replace(',', '.'));
  }
  if (str.includes('€')) return { paraBirimi: 'EUR', dovizTutar: numVal };
  if (str.includes('$')) return { paraBirimi: 'USD', dovizTutar: numVal };
  if (str.includes('£')) return { paraBirimi: 'GBP', dovizTutar: numVal };
  return { paraBirimi: 'TL', dovizTutar: numVal };
}

// Güvenli birim fiyat / tutar parse
function parseBirimTutar(val) {
  if (val === null || val === undefined || val === '') return null;
  // number already
  if (typeof val === 'number' && !isNaN(val)) return val;
  const s = String(val).trim();
  // currency-like (uses parseDovizliTutar to extract number)
  const c = parseDovizliTutar(s);
  if (c.dovizTutar !== null) return c.dovizTutar;

  // Remove non-numeric trailing/leading text (e.g., accidental month labels)
  // Allow digits, dots and commas, minus
  const numLike = s.match(/[-0-9.,]+/);
  if (!numLike) return null;
  let n = numLike[0];
  // If contains both '.' and ',' assume '.' thousands and ',' decimal (e.g. 1.234,56)
  if (n.indexOf('.') !== -1 && n.indexOf(',') !== -1) {
    n = n.replace(/\./g, '').replace(/,/g, '.');
  } else if (n.indexOf(',') !== -1 && n.indexOf('.') === -1) {
    // Turkish format 1234,56
    n = n.replace(/,/g, '.');
  } else {
    // remove thousand commas like 1,234 or 1 234
    n = n.replace(/,/g, '');
  }
  const parsed = parseFloat(n);
  return isNaN(parsed) ? null : parsed;
}

// Ambar adını normalize et
function normalizeAmbar(ambarAciklama) {
  if (!ambarAciklama) return 'Gaziantep';
  const s = String(ambarAciklama).trim();
  const upper = s.toUpperCase();
  if (upper.includes('GAZ')) return 'Gaziantep';
  if (upper === 'BORNOVA') return 'Bornova';
  if (upper.includes('TİRE') || upper.includes('TIRE')) return 'Tire';
  if (upper.includes('AKH')) return 'Akhisar';
  if (upper.includes('GÖN')) return 'Gönen';
  return s;
}

// Excel kayıtlarını uygulama formatına çevir
// OCAK AYI TAMAMI TESLİM EDİLDİ OLARAK KABUL EDİLECEK
const records = excelData.map(r => {
  const { paraBirimi, dovizTutar } = parseDovizliTutar(r['Dövizli Tutar']);
  const odemePlan = r['Ödeme Planı Kodu'] ? String(r['Ödeme Planı Kodu']).trim() : null;
  const ambar = normalizeAmbar(r['Ambar Açıklaması']);
  const siparisTarihi = excelDateToISO(r['Tarih']);
  
  return {
    FIRMA_NUMARASI: 32,
    FIRMA_ADI: '2022-2026 ACEMOĞLU GIDA SAN. VE TİC. A.Ş.',
    ISYERI: ambar,
    AMBAR: ambar,
    TUR: 'MALZEME',
    MALZEME_HIZMET_KODU: null,
    MASRAF_MERKEZI: null,
    TALEP_NO: null,
    TALEP_EDEN: r['Ekleyen'] || null,
    TALEP_TARIHI: siparisTarihi,
    TALEP_ONAYLAYAN: null,
    TALEP_ONAY_TARIHI: null,
    TALEP_ACIKLAMA: null,
    SIPARIS_NO: r['Fiş No.'] || null,
    SIPARISI_ACAN: r['Ekleyen'] || null,
    SIPARIS_TARIHI: siparisTarihi,
    SIPARIS_ONAYLAYAN: null,
    SIPARIS_ONAY_TARIHI: null,
    SIPARIS_MALZEME: null,
    TESLIM_EVRAK_NO: null,
    TESLIM_TARIHI: siparisTarihi, // Ocak ayı tamamı teslim edildi
    CARI_UNVANI: r['Cari Hesap Unvanı'] || null,
    TESLIM_ALAN: null,
    ACIKLAMA: null,
    MIKTAR: 1,
    BIRIM: 'ADET',
    ODEME_VADESI: odemePlan,
    PARA_BIRIMI: paraBirimi,
    BIRIM_FIYAT: (() => {
      const p = parseBirimTutar(r['Tutar']);
      return p === null ? 0 : p;
    })(),
    TOPLAM: (() => {
      const p = parseBirimTutar(r['Tutar']);
      return p === null ? 0 : p;
    })(),
    // OCAK AYI TAMAMI TESLİM EDİLDİ
    FATURAYI_KAYDEDEN: 'OCAK_TESLIM',
    FATURA_KAYDETME_TARIHI: siparisTarihi,
    FATURA_TARIHI: siparisTarihi,
    FATURA_NO: null,
  };
});

console.log('Oluşturulan kayıt sayısı:', records.length);

// Unique sipariş sayısı
const uniqueSiparis = new Set(records.map(r => r.SIPARIS_NO).filter(Boolean));
console.log('Unique sipariş:', uniqueSiparis.size);

// Ambar dağılımı
const ambarDist = {};
records.forEach(r => {
  const a = r.AMBAR || 'YOK';
  if (!ambarDist[a]) ambarDist[a] = { kayit: 0, siparis: new Set() };
  ambarDist[a].kayit++;
  if (r.SIPARIS_NO) ambarDist[a].siparis.add(r.SIPARIS_NO);
});
console.log('Ambar dağılımı:');
Object.entries(ambarDist).forEach(([a, d]) => {
  console.log('  ' + a + ': ' + d.kayit + ' kayıt, ' + d.siparis.size + ' sipariş');
});

// Toplam tutar
const toplamTutar = records.reduce((s, r) => s + (Number(r.TOPLAM) || 0), 0);
console.log('Toplam tutar:', toplamTutar.toLocaleString('tr-TR'));

// Teslim edildi durumu
const teslimEdildi = records.filter(r => r.FATURAYI_KAYDEDEN && r.FATURAYI_KAYDEDEN !== '');
console.log('Teslim edildi:', teslimEdildi.length, '/', records.length);

// Tarih aralığı
const dates = records.map(r => r.SIPARIS_TARIHI ? new Date(r.SIPARIS_TARIHI) : null).filter(Boolean).sort((a,b) => a-b);
console.log('Tarih aralığı:', dates[0]?.toISOString().split('T')[0], '-', dates[dates.length-1]?.toISOString().split('T')[0]);

// Kaydet
const mobileOut = path.join(__dirname, 'masaustu/mobile/src/data/ocak_2026_data.json');
const desktopOut = path.join(__dirname, 'GuncelDesktop/ocak_2026_data.json');

fs.writeFileSync(mobileOut, JSON.stringify(records, null, 2), 'utf-8');
console.log('\nMobile JSON kaydedildi:', mobileOut);

fs.writeFileSync(desktopOut, JSON.stringify(records, null, 2), 'utf-8');
console.log('Desktop JSON kaydedildi:', desktopOut);
