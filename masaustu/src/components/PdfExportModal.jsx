import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Tag, Typography, message, Select, Spin, Empty } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  TeamOutlined,
  FundOutlined,
  DatabaseOutlined,
  ShopOutlined,
  TrophyOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SwitchableChart, formatCurrency, formatNumber } from './SwitchableChart';
import logoImgInline from '../../assets/logo.jpg?inline';

const { Text } = Typography;

const STYLE_OPTIONS = [
  { value: 'bar', label: 'Çubuk' },
  { value: 'horizontal', label: 'Yatay Çubuk' },
  { value: 'pie', label: 'Pasta' },
];

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: <AppstoreOutlined /> },
  { key: 'talep', label: 'Talep Analizi', icon: <BarChartOutlined /> },
  { key: 'siparis', label: 'Sipariş Analizi', icon: <BarChartOutlined /> },
  { key: 'tedarikci', label: 'Tedarikçi Analizi', icon: <TeamOutlined /> },
  { key: 'finansal', label: 'Finansal Analiz', icon: <FundOutlined /> },
  { key: 'detayli', label: 'Detaylı Rapor', icon: <DatabaseOutlined /> },
  { key: 'fabrika', label: 'Fabrika Özel', icon: <ShopOutlined /> },
  { key: 'ihale', label: 'İhale Raporları', icon: <TrophyOutlined /> },
  { key: 'kategori', label: 'Tedarikçi Kategori', icon: <PieChartOutlined /> },
];

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function truncate(v, len = 28) {
  const s = (v || '').toString();
  return s.length > len ? `${s.slice(0, len)}...` : s;
}

function sortDesc(arr) {
  return [...arr].sort((a, b) => toNumber(b.value) - toNumber(a.value));
}

function mapRows(rows, nameField, valueField) {
  return (rows || []).map((x) => ({ name: truncate(x[nameField] || 'Belirsiz'), value: toNumber(x[valueField]) }));
}

function makeChart(id, section, title, data, formatter, styles = ['bar', 'horizontal', 'pie']) {
  const clean = (Array.isArray(data) ? data : []).filter((x) => x && x.name !== undefined && x.value !== undefined);
  return { id, section, title, data: clean, formatter, styles };
}

function buildBaseCatalog(dashboardData, comparisonData, selectedAmbar) {
  if (!dashboardData) return [];
  const monthly = (dashboardData.monthlyTrend || []).slice(0, 12).reverse();
  const talep = dashboardData.talepEden || [];
  const tedarikci = dashboardData.tedarikci || [];
  const masraf = dashboardData.masrafMerkezi || [];
  const para = dashboardData.paraBirimi || [];
  const vade = (dashboardData.odemeVadesi || []).filter((x) => x.odemeVadesi && x.odemeVadesi !== 'Belirsiz');
  const tur = dashboardData.tur || [];
  const ambar = dashboardData.ambar || [];
  const isyeri = dashboardData.isyeri || [];
  const onaylayan = dashboardData.onaylayan || [];
  const durum = dashboardData.durum || [];
  const charts = [];

  charts.push(makeChart('db-monthly-total', 'dashboard', 'Aylık Sipariş Tutarı', monthly.map((x) => ({ name: x.ay, value: toNumber(x.toplamTutar) })), formatCurrency, ['bar', 'pie']));
  charts.push(makeChart('db-monthly-count', 'dashboard', 'Aylık Sipariş Adedi', monthly.map((x) => ({ name: x.ay, value: toNumber(x.siparisAdedi) })), formatNumber, ['bar', 'pie']));
  charts.push(makeChart('db-durum', 'dashboard', 'Teslim Durumu Dağılımı', sortDesc(mapRows(durum, 'durum', 'siparisAdedi')), formatNumber));

  charts.push(makeChart('talep-tutar', 'talep', 'Talep Edene Göre Tutar', sortDesc(mapRows(talep, 'talepEden', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('talep-adet', 'talep', 'Talep Edene Göre Talep', sortDesc(talep.map((x) => ({ name: truncate(x.talepEden), value: toNumber(x.talepAdedi || x.siparisAdedi || x.kayitAdedi) }))), formatNumber));
  charts.push(makeChart('talep-masraf-tutar', 'talep', 'Masraf Merkezine Göre Tutar', sortDesc(mapRows(masraf, 'masrafMerkezi', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('talep-masraf-adet', 'talep', 'Masraf Merkezine Göre Adet', sortDesc(masraf.map((x) => ({ name: truncate(x.masrafMerkezi), value: toNumber(x.siparisAdedi || x.kayitAdedi || x.talepAdedi) }))), formatNumber));

  charts.push(makeChart('siparis-durum', 'siparis', 'Sipariş Durumu', sortDesc(mapRows(durum, 'durum', 'siparisAdedi')), formatNumber));
  charts.push(makeChart('siparis-monthly-total', 'siparis', 'Aylık Sipariş Tutarı', monthly.map((x) => ({ name: x.ay, value: toNumber(x.toplamTutar) })), formatCurrency, ['bar', 'pie']));
  charts.push(makeChart('siparis-monthly-count', 'siparis', 'Aylık Sipariş Adedi', monthly.map((x) => ({ name: x.ay, value: toNumber(x.siparisAdedi) })), formatNumber, ['bar', 'pie']));

  charts.push(makeChart('tedarikci-tutar', 'tedarikci', 'Tedarikçilere Göre Tutar', sortDesc(mapRows(tedarikci, 'tedarikci', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('tedarikci-adet', 'tedarikci', 'Tedarikçilere Göre Sipariş Adedi', sortDesc(mapRows(tedarikci, 'tedarikci', 'siparisAdedi')), formatNumber));

  charts.push(makeChart('finans-para-tutar', 'finansal', 'Para Birimine Göre Tutar', sortDesc(mapRows(para, 'paraBirimi', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('finans-para-adet', 'finansal', 'Para Birimine Göre İşlem Adedi', sortDesc(mapRows(para, 'paraBirimi', 'kayitAdedi')), formatNumber));
  charts.push(makeChart('finans-vade-tutar', 'finansal', 'Ödeme Vadesine Göre Tutar', sortDesc(mapRows(vade, 'odemeVadesi', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('finans-vade-adet', 'finansal', 'Ödeme Vadesine Göre İşlem Adedi', sortDesc(vade.map((x) => ({ name: truncate(x.odemeVadesi), value: toNumber(x.siparisAdedi || x.kayitAdedi) }))), formatNumber));

  charts.push(makeChart('detay-tur-tutar', 'detayli', 'Türe Göre Tutar', sortDesc(mapRows(tur, 'tur', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('detay-tur-adet', 'detayli', 'Türe Göre Adet', sortDesc(tur.map((x) => ({ name: truncate(x.tur), value: toNumber(x.siparisAdedi || x.kayitAdedi) }))), formatNumber));
  charts.push(makeChart('detay-ambar-tutar', 'detayli', 'Ambara Göre Tutar', sortDesc(mapRows(ambar, 'ambar', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('detay-ambar-adet', 'detayli', 'Ambara Göre Adet', sortDesc(ambar.map((x) => ({ name: truncate(x.ambar), value: toNumber(x.siparisAdedi || x.kayitAdedi) }))), formatNumber));
  charts.push(makeChart('detay-isyeri-tutar', 'detayli', 'İşyerine Göre Tutar', sortDesc(mapRows(isyeri, 'isyeri', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('detay-isyeri-adet', 'detayli', 'İşyerine Göre Adet', sortDesc(isyeri.map((x) => ({ name: truncate(x.isyeri), value: toNumber(x.siparisAdedi || x.kayitAdedi) }))), formatNumber));
  charts.push(makeChart('detay-onaylayan-tutar', 'detayli', 'Onaylayana Göre Tutar', sortDesc(mapRows(onaylayan, 'onaylayan', 'toplamTutar')), formatCurrency));
  charts.push(makeChart('detay-onaylayan-adet', 'detayli', 'Onaylayana Göre Adet', sortDesc(mapRows(onaylayan, 'onaylayan', 'siparisAdedi')), formatNumber));

  const f = Object.entries(comparisonData || {});
  if (f.length > 0) {
    charts.push(makeChart('fabrika-toplam', 'fabrika', 'Fabrika Bazında Toplam Tutar', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.toplamTutar) }))), formatCurrency));
    charts.push(makeChart('fabrika-siparis', 'fabrika', 'Fabrika Bazında Sipariş Adedi', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.siparisAdedi) }))), formatNumber));
    charts.push(makeChart('fabrika-talep', 'fabrika', 'Fabrika Bazında Talep Adedi', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.talepAdedi) }))), formatNumber));
    charts.push(makeChart('fabrika-teslim-orani', 'fabrika', 'Fabrika Bazında Teslim Oranı (%)', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.teslimOrani) }))), (v) => `%${toNumber(v).toFixed(1)}`, ['bar', 'horizontal']));
    charts.push(makeChart('fabrika-teslim-edilen', 'fabrika', 'Fabrika Bazında Teslim Edilen', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.teslimEdilen) }))), formatNumber));
    charts.push(makeChart('fabrika-bekleyen', 'fabrika', 'Fabrika Bazında Bekleyen', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.bekleyen) }))), formatNumber));
    charts.push(makeChart('fabrika-siparis-vs-teslim', 'fabrika', 'Fabrika Bazında Sipariş & Teslim', sortDesc(f.map(([n, v]) => ({ name: n, value: toNumber(v.siparisAdedi) + toNumber(v.teslimEdilen) }))), formatNumber, ['bar', 'horizontal']));
    charts.push(
      makeChart(
        'fabrika-bekleme-orani',
        'fabrika',
        'Fabrika Bazında Bekleme Oranı (%)',
        sortDesc(
          f.map(([n, v]) => {
            const total = toNumber(v.siparisAdedi);
            const wait = toNumber(v.bekleyen);
            return { name: n, value: total > 0 ? (wait / total) * 100 : 0 };
          })
        ),
        (v) => `%${toNumber(v).toFixed(1)}`,
        ['bar', 'horizontal']
      )
    );
  }

  if (selectedAmbar && selectedAmbar !== 'all') {
    const one = f.find(([n]) => n === selectedAmbar || n.includes(selectedAmbar));
    if (one) {
      const [factoryName, m] = one;
      charts.push(
        makeChart(
          'fabrika-secili-kpi',
          'fabrika',
          `Seçili Fabrika KPI Dağılımı (${factoryName})`,
          [
            { name: 'Sipariş Adedi', value: toNumber(m.siparisAdedi) },
            { name: 'Talep Adedi', value: toNumber(m.talepAdedi) },
            { name: 'Teslim Edilen', value: toNumber(m.teslimEdilen) },
            { name: 'Bekleyen', value: toNumber(m.bekleyen) },
            { name: 'Teslim Oranı', value: toNumber(m.teslimOrani) },
          ],
          formatNumber
        )
      );
    }
  }

  return charts;
}

function buildExtraCatalog(extra) {
  if (!extra) return [];
  const charts = [];
  const ihale = extra.ihale || {};
  const kategori = extra.kategori || {};

  if (ihale.ozet) {
    charts.push(
      makeChart(
        'ihale-ozet-kpi',
        'ihale',
        'İhale Özet KPI Dağılımı',
        [
          { name: 'Toplam İhale', value: toNumber(ihale.ozet.toplam_ihale_sayisi) },
          { name: 'Toplam Kazanç', value: toNumber(ihale.ozet.toplam_kazanc_tl) },
          { name: 'Ortalama Kazanç', value: toNumber(ihale.ozet.ortalama_kazanc_tl) },
          { name: 'En Yüksek Kazanç', value: toNumber(ihale.ozet.en_yuksek_kazanc?.tutar) },
        ],
        formatNumber
      )
    );
  }
  if (Array.isArray(ihale.lokasyon)) charts.push(makeChart('ihale-lokasyon', 'ihale', 'İhale Lokasyona Göre Kazanç', sortDesc(mapRows(ihale.lokasyon, 'lokasyon', 'toplam_kazanc_tl')), formatCurrency));
  if (Array.isArray(ihale.tedarikci)) charts.push(makeChart('ihale-tedarikci', 'ihale', 'İhale Tedarikçiye Göre Kazanç', sortDesc(mapRows(ihale.tedarikci, 'kazanan_tedarikci', 'toplam_kazanc_tl')), formatCurrency));
  if (Array.isArray(ihale.masraf)) charts.push(makeChart('ihale-masraf', 'ihale', 'İhale Masraf Merkezine Göre Kazanç', sortDesc(mapRows(ihale.masraf, 'masraf_merkezi', 'toplam_kazanc_tl')), formatCurrency));
  if (Array.isArray(ihale.trend)) charts.push(makeChart('ihale-trend', 'ihale', 'İhale Aylık Trend Kazancı', ihale.trend.map((x) => ({ name: x.ay_isim || `Ay ${x.ay}`, value: toNumber(x.toplam_kazanc_tl) })), formatCurrency, ['bar', 'pie']));
  if (Array.isArray(ihale.rekabet))
    charts.push(
      makeChart(
        'ihale-rekabet',
        'ihale',
        'İhale Rekabet (Firma Çiftleri)',
        sortDesc((ihale.rekabet || []).slice(0, 25).map((x) => ({ name: `${truncate(x.firma_a, 12)} - ${truncate(x.firma_b, 12)}`, value: toNumber(x.kac_ihalede_karsilastilar) }))),
        formatNumber,
        ['bar', 'horizontal']
      )
    );
  if (Array.isArray(ihale.tasarruf))
    charts.push(
      makeChart(
        'ihale-tasarruf',
        'ihale',
        'İhale Tasarruf Oranı (Top)',
        sortDesc((ihale.tasarruf || []).slice(0, 20).map((x) => ({ name: truncate(x.malzeme_hizmet || x.kazanan_tedarikci), value: toNumber(x.tasarruf_orani_yuzde) }))),
        (v) => `%${toNumber(v).toFixed(1)}`,
        ['bar', 'horizontal']
      )
    );

  if (kategori.istatistik) {
    charts.push(
      makeChart(
        'kategori-ozet-kpi',
        'kategori',
        'Tedarikçi Kategori KPI Dağılımı',
        [
          { name: 'Toplam Kayıt', value: toNumber(kategori.istatistik.toplam_kayit) },
          { name: 'Benzersiz Kategori', value: toNumber(kategori.istatistik.benzersiz_kategori) },
        ],
        formatNumber
      )
    );
  }
  if (Array.isArray(kategori.kategoriOzet))
    charts.push(makeChart('kategori-ozet', 'kategori', 'Kategori Bazlı Tedarikçi Sayısı', sortDesc((kategori.kategoriOzet || []).map((x) => ({ name: truncate(x.kategori), value: toNumber(x.tedarikci_sayisi) }))), formatNumber));
  if (Array.isArray(kategori.tipDagilimi))
    charts.push(
      makeChart(
        'kategori-tip',
        'kategori',
        'Kategori Tip Dağılımı',
        sortDesc((kategori.tipDagilimi || []).map((x) => ({ name: x.tip === 'D' ? 'Direkt' : x.tip === 'E' ? 'Endirekt' : x.tip, value: toNumber(x.kayit_sayisi) }))),
        formatNumber
      )
    );
  if (kategori.eksikBilgi?.ozet) {
    const o = kategori.eksikBilgi.ozet;
    charts.push(
      makeChart(
        'kategori-eksik',
        'kategori',
        'Eksik Bilgi Özeti',
        [
          { name: 'Mail Eksik', value: toNumber(o.mail_eksik) },
          { name: 'Telefon Eksik', value: toNumber(o.telefon_eksik) },
          { name: 'Yetkili Eksik', value: toNumber(o.yetkili_eksik) },
        ],
        formatNumber
      )
    );
  }
  if (Array.isArray(kategori.cokluKategori))
    charts.push(
      makeChart(
        'kategori-coklu',
        'kategori',
        'Çoklu Kategorideki Tedarikçiler',
        sortDesc((kategori.cokluKategori || []).slice(0, 20).map((x) => ({ name: truncate(x.tedarikci_unvani || x.TEDARIKCI_UNVANI), value: toNumber(x.kategori_sayisi) }))),
        formatNumber
      )
    );

  return charts;
}

function summaryRows(chart) {
  const total = chart.data.reduce((s, x) => s + toNumber(x.value), 0);
  return chart.data.map((x) => {
    const v = toNumber(x.value);
    return { name: x.name, value: v, pct: total > 0 ? (v / total) * 100 : 0 };
  });
}

const PdfExportModal = ({ open, onClose, dashboardData, comparisonData, selectedAmbarLabel, selectedAmbar, ambarList = [] }) => {
  const previewRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [styleByChart, setStyleByChart] = useState({});
  const [activeSection, setActiveSection] = useState('dashboard');
  const [exporting, setExporting] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraData, setExtraData] = useState(null);
  const [loadingFilterData, setLoadingFilterData] = useState(false);
  const [reportFilter, setReportFilter] = useState(selectedAmbar || 'all');
  const [filteredDashboardData, setFilteredDashboardData] = useState(dashboardData);

  useEffect(() => {
    setReportFilter(selectedAmbar || 'all');
  }, [selectedAmbar, open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoadingFilterData(true);
      try {
        const result = await window.api.getDashboardStats(reportFilter);
        if (alive && result?.success) setFilteredDashboardData(result.data);
      } catch {
        if (alive) setFilteredDashboardData(dashboardData);
      } finally {
        if (alive) setLoadingFilterData(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, reportFilter, dashboardData]);

  useEffect(() => {
    if (!open) return;
    setLoadingExtra(true);
    (async () => {
      try {
        const ihaleParams = reportFilter && reportFilter !== 'all' ? { lokasyon: reportFilter } : {};
        const yil = new Date().getFullYear();
        const [
          ihaleOzet,
          ihaleLokasyon,
          ihaleTedarikci,
          ihaleMasraf,
          ihaleRekabet,
          ihaleTrend,
          ihaleTasarruf,
          kategoriIstatistik,
          kategoriOzet,
          kategoriTip,
          kategoriEksik,
          kategoriCoklu,
        ] = await Promise.all([
          window.api.ihaleRaporOzet(ihaleParams).catch(() => ({ success: false })),
          window.api.ihaleRaporLokasyon(ihaleParams).catch(() => ({ success: false })),
          window.api.ihaleRaporTedarikci(ihaleParams).catch(() => ({ success: false })),
          window.api.ihaleRaporMasrafMerkezi(ihaleParams).catch(() => ({ success: false })),
          window.api.ihaleRaporRekabet(ihaleParams).catch(() => ({ success: false })),
          window.api.ihaleRaporTrend({ ...ihaleParams, yil }).catch(() => ({ success: false })),
          window.api.ihaleRaporTasarruf(ihaleParams).catch(() => ({ success: false })),
          window.api.tedarikciKategoriRaporIstatistik().catch(() => ({ success: false })),
          window.api.tedarikciKategoriRaporKategoriOzet({}).catch(() => ({ success: false })),
          window.api.tedarikciKategoriRaporTipDagilimi().catch(() => ({ success: false })),
          window.api.tedarikciKategoriRaporEksikBilgi().catch(() => ({ success: false })),
          window.api.tedarikciKategoriRaporCokluKategori().catch(() => ({ success: false })),
        ]);

        setExtraData({
          ihale: {
            ozet: ihaleOzet?.success ? ihaleOzet.data : null,
            lokasyon: ihaleLokasyon?.success ? ihaleLokasyon.data : [],
            tedarikci: ihaleTedarikci?.success ? ihaleTedarikci.data : [],
            masraf: ihaleMasraf?.success ? ihaleMasraf.data : [],
            rekabet: ihaleRekabet?.success ? ihaleRekabet.data : [],
            trend: ihaleTrend?.success ? ihaleTrend.data : [],
            tasarruf: ihaleTasarruf?.success ? ihaleTasarruf.data : [],
          },
          kategori: {
            istatistik: kategoriIstatistik?.success ? kategoriIstatistik.data : null,
            kategoriOzet: kategoriOzet?.success ? kategoriOzet.data : [],
            tipDagilimi: kategoriTip?.success ? kategoriTip.data : [],
            eksikBilgi: kategoriEksik?.success ? kategoriEksik.data : null,
            cokluKategori: kategoriCoklu?.success ? kategoriCoklu.data : [],
          },
        });
      } finally {
        setLoadingExtra(false);
      }
    })();
  }, [open, reportFilter]);

  const catalog = useMemo(() => {
    const base = buildBaseCatalog(filteredDashboardData || dashboardData, comparisonData, reportFilter);
    const extra = buildExtraCatalog(extraData);
    return [...base, ...extra].filter((x) => x.data.length > 0);
  }, [filteredDashboardData, dashboardData, comparisonData, reportFilter, extraData]);

  const filterOptions = useMemo(() => {
    const normalizeFactoryKey = (v) => (v || '').toString().trim().toLocaleLowerCase('tr-TR');
    const fromAmbarList = [];
    const seen = new Set();

    (ambarList || []).forEach((x) => {
      const value = (x?.ambar || '').toString().trim();
      if (!value) return;
      const normalized = normalizeFactoryKey(value);
      if (seen.has(normalized)) return;
      seen.add(normalized);
      fromAmbarList.push({ value, label: (x?.displayName || value).toString().trim() });
    });

    const fromComparison = Object.keys(comparisonData || {})
      .map((k) => k.toString().trim())
      .filter((k) => k && !seen.has(normalizeFactoryKey(k)))
      .map((k) => ({ value: k, label: k }));

    return [{ value: 'all', label: 'Tüm Fabrikalar' }, ...fromAmbarList, ...fromComparison];
  }, [ambarList, comparisonData]);

  const reportFilterLabel = useMemo(() => {
    if (reportFilter === 'all') return 'Tüm Fabrikalar';
    const found = filterOptions.find((x) => x.value === reportFilter);
    return found ? found.label : selectedAmbarLabel || reportFilter;
  }, [reportFilter, filterOptions, selectedAmbarLabel]);

  const sectionCounts = useMemo(() => {
    const counts = {};
    for (const s of SECTIONS) counts[s.key] = 0;
    for (const c of catalog) counts[c.section] = (counts[c.section] || 0) + 1;
    return counts;
  }, [catalog]);

  const chartsInSection = useMemo(() => catalog.filter((x) => x.section === activeSection), [catalog, activeSection]);
  const selectedCharts = useMemo(() => {
    const map = new Map(catalog.map((x) => [x.id, x]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [selectedIds, catalog]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const getStyle = (chart) => {
    const chosen = styleByChart[chart.id];
    if (chosen && chart.styles.includes(chosen)) return chosen;
    return chart.styles[0];
  };

  const exportPdf = async () => {
    if (!selectedCharts.length || !previewRef.current) return;
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 280));
      const doc = new jsPDF('p', 'mm', 'a4');
      const marginX = 8;
      const usableWidth = 194;
      const pageHeight = 297;
      let cursorY = 8;

      const nodes = previewRef.current.querySelectorAll('[data-pdf-capture]');
      for (const node of nodes) {
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * usableWidth) / canvas.width;
        if (cursorY + imgHeight > pageHeight - 8) {
          doc.addPage();
          cursorY = 8;
        }
        doc.addImage(imgData, 'PNG', marginX, cursorY, usableWidth, imgHeight, undefined, 'FAST');
        cursorY += imgHeight + 4;
      }

      const fileName = `satin-alma-kurumsal-rapor-${new Date().toISOString().slice(0, 10)}.pdf`;
      const bytes = Array.from(new Uint8Array(doc.output('arraybuffer')));
      if (window.api?.savePdfToDesktopAndOpen) {
        const result = await window.api.savePdfToDesktopAndOpen({ fileName, bytes });
        if (result?.success) message.success('PDF masaustune indirildi ve acildi.');
        else message.error(result?.error || 'PDF kaydetme hatasi');
      } else {
        doc.save(fileName);
        message.success('PDF indirildi.');
      }
    } catch (error) {
      message.error(`PDF olusturma hatasi: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FilePdfOutlined style={{ color: '#dc2626' }} />
          <span>Kurumsal PDF Tasarim Ekrani</span>
          <Tag color="blue">{catalog.length} Grafik</Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
      destroyOnClose
    >
      <div style={{ display: 'grid', gridTemplateColumns: '230px 420px 1fr', gap: 12, minHeight: 600 }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(6px)', color: '#334155', padding: 10 }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Rapor Menüsü</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>PDF Navigator</div>
          </div>
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Fabrika Filtresi</div>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={reportFilter}
              onChange={setReportFilter}
              options={filterOptions}
              loading={loadingFilterData}
            />
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                width: '100%',
                border: 'none',
                background: activeSection === s.key ? '#eff6ff' : 'transparent',
                color: activeSection === s.key ? '#1d4ed8' : '#334155',
                borderRadius: 8,
                padding: '10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.icon}
                <span style={{ fontSize: 12 }}>{s.label}</span>
              </span>
              <Tag color={activeSection === s.key ? 'blue' : 'default'} style={{ marginInlineEnd: 0 }}>
                {sectionCounts[s.key] || 0}
              </Tag>
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc', padding: 10, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>Grafik Kutuphanesi</Text>
            {loadingExtra || loadingFilterData ? <Spin size="small" /> : null}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            Sol panelden bölüm seç, buradan grafik ve grafik tipini seç.
          </div>
          {chartsInSection.length === 0 ? (
            <Empty description="Bu bölümde grafik yok" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chartsInSection.map((chart) => {
                const selected = selectedIds.includes(chart.id);
                return (
                  <div key={chart.id} style={{ border: '1px solid #dbeafe', borderRadius: 10, background: '#fff', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{chart.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{chart.data.length} veri noktası</div>
                      </div>
                      <Button size="small" type={selected ? 'default' : 'primary'} onClick={() => toggleSelection(chart.id)}>
                        {selected ? 'Kaldir' : 'Ekle'}
                      </Button>
                    </div>
                    {selected ? (
                      <div style={{ marginTop: 8 }}>
                        <Select
                          size="small"
                          style={{ width: '100%' }}
                          value={getStyle(chart)}
                          onChange={(value) => setStyleByChart((prev) => ({ ...prev, [chart.id]: value }))}
                          options={STYLE_OPTIONS.filter((x) => chart.styles.includes(x.value))}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: 10, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>Canli PDF Onizleme</Text>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportPdf} loading={exporting} disabled={!selectedCharts.length}>
              Masaustune Indir ve Ac
            </Button>
          </div>
          {!selectedCharts.length ? (
            <Empty description="Sag panelde onizleme icin grafik sec" />
          ) : (
            <div ref={previewRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                data-pdf-capture
                style={{
                  border: '1px solid #dbeafe',
                  borderRadius: 12,
                  background: '#ffffff',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={logoImgInline} alt="logo" style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Satın alma kurumsal rapor</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#334155' }}>
                  <div>
                    <strong>Tarih:</strong> {new Date().toLocaleString('tr-TR')}
                  </div>
                  <div>
                    <strong>Fabrika:</strong> {reportFilterLabel}
                  </div>
                </div>
              </div>

              {selectedCharts.map((chart) => {
                const rows = summaryRows(chart);
                const total = rows.reduce((s, x) => s + x.value, 0);
                const currentMode = getStyle(chart);
                return (
                  <div key={chart.id} data-pdf-capture style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text strong>{chart.title}</Text>
                      <Tag color="blue">{SECTIONS.find((s) => s.key === chart.section)?.label || chart.section}</Tag>
                    </div>
                    <SwitchableChart
                      title={chart.title}
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      mode={currentMode}
                      hideHeader
                      height={280}
                      sort={false}
                      valueFormatter={chart.formatter}
                    />
                    {currentMode !== 'pie' ? (
                    <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 8, fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                        <div>Kalem</div>
                        <div style={{ textAlign: 'right' }}>Değer</div>
                        <div style={{ textAlign: 'right' }}>%</div>
                      </div>
                      {rows.map((row, i) => (
                        <div key={`${chart.id}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 8, fontSize: 11, color: '#1e293b', padding: '2px 0' }}>
                          <div>{row.name}</div>
                          <div style={{ textAlign: 'right' }}>{chart.formatter ? chart.formatter(row.value) : formatNumber(row.value)}</div>
                          <div style={{ textAlign: 'right' }}>{row.pct.toFixed(1)}%</div>
                        </div>
                      ))}
                      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 8, fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                        <div>Toplam</div>
                        <div style={{ textAlign: 'right' }}>{chart.formatter ? chart.formatter(total) : formatNumber(total)}</div>
                        <div style={{ textAlign: 'right' }}>100%</div>
                      </div>
                    </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PdfExportModal;
