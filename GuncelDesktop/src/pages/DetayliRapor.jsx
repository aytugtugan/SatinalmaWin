import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Table, Input, DatePicker, Button, Space, Tag, Tooltip, Badge, Switch } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, ExpandAltOutlined, ShrinkOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DosyaYonetimi from '../components/DosyaYonetimi';
import { formatCurrency, formatUnitPrice } from '../components/SwitchableChart';

const { RangePicker } = DatePicker;

const DetayliRapor = ({ data, selectedIsyeri, columns }) => {
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [groupByOrder, setGroupByOrder] = useState(true); // Varsayılan: gruplu görünüm
  const [dosyaModalSiparis, setDosyaModalSiparis] = useState(null);
  const [dosyaSayilari, setDosyaSayilari] = useState({});

  // Kolon isimlerini al (columns prop'undan veya varsayilan)
  const C = columns || {
    SIPARIS_NO: 'SİPARİŞ NUMARASI',
    TALEP_NO: 'TALEP NUMARASI',
    TALEP_EDEN: 'TALEP EDEN',
    SIPARIS_TARIHI: 'SİPARİŞ TARİHİ',
    CARI_UNVANI: 'CARİ ÜNVANI',
    MASRAF_MERKEZI: 'MASRAF MERKEZİ',
    SIPARIS_MALZEME: 'SİPARİŞ MALZEME',
    MIKTAR: 'MİKTAR',
    BIRIM_FIYAT: 'BİRİM FİYAT',
    TOPLAM: 'TOPLAM',
    PARA_BIRIMI: 'PARA BİRİMİ',
    ODEME_VADESI: 'Ö-DEME VADESİ',
    TESLIM_EVRAK_NO: 'TESLİM EVRAK NO',
    ISYERI: 'İŞ YERİ'
  };

  // helper to strip brackets
  const unbracket = (s) => (s ? s.replace(/^\[|\]$/g, '') : s);

  // normalize incoming records: ensure keys like SIPARIS_NO, TALEP_NO exist on each record
  const normalizedData = useMemo(() => {
    const src = data || [];
    const keys = Object.keys(C);
    return src.map((rec) => {
      const out = { ...rec };
      for (const k of keys) {
        if (out[k] !== undefined) continue;
        const colVal = columns && columns[k] ? columns[k] : C[k];
        const candidates = [k, colVal, unbracket(colVal), `[${unbracket(colVal)}]`];
        for (const cand of candidates) {
          if (cand && rec[cand] !== undefined) {
            out[k] = rec[cand];
            break;
          }
        }
      }
      return out;
    });
  }, [data, columns]);

  // Filtreleme - isyeri filtresi dahil
  const filteredData = useMemo(() => {
    let result = normalizedData || [];

    // Isyeri filtresi
    if (selectedIsyeri && selectedIsyeri !== 'all' && C.ISYERI) {
      result = result.filter(item => item['ISYERI'] === selectedIsyeri);
    }

    // Metin aramasi
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(item =>
        (item['TALEP_NO'] || '').toString().toLowerCase().includes(search) ||
        (item['SIPARIS_NO'] || '').toString().toLowerCase().includes(search) ||
        (item['TALEP_EDEN'] || '').toString().toLowerCase().includes(search) ||
        (item['CARI_UNVANI'] || '').toString().toLowerCase().includes(search) ||
        (item['SIPARIS_MALZEME'] || '').toString().toLowerCase().includes(search) ||
        (item['MASRAF_MERKEZI'] || '').toString().toLowerCase().includes(search)
      );
    }

    // Tarih araligi filtresi
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      result = result.filter(item => {
        const itemDate = dayjs(item['SIPARIS_TARIHI']);
        return itemDate.isValid() && (itemDate.isAfter(startDate) || itemDate.isSame(startDate)) && (itemDate.isBefore(endDate) || itemDate.isSame(endDate));
      });
    }

    return result;
  }, [normalizedData, searchText, dateRange, selectedIsyeri, C]);

  // Sipariş bazlı gruplama
  const groupedData = useMemo(() => {
    if (!groupByOrder) return null;
    
    const groups = new Map();
    
    filteredData.forEach((item, idx) => {
      const siparisNo = item['SIPARIS_NO'] || `NO_ORDER_${idx}`;
      
      if (!groups.has(siparisNo)) {
        groups.set(siparisNo, {
          key: siparisNo,
          SIPARIS_NO: siparisNo,
          SIPARIS_TARIHI: item['SIPARIS_TARIHI'],
          CARI_UNVANI: item['CARI_UNVANI'],
          TALEP_EDEN: item['TALEP_EDEN'],
          MASRAF_MERKEZI: item['MASRAF_MERKEZI'],
          ODEME_VADESI: item['ODEME_VADESI'],
          items: [],
          totalTRY: 0,
          isDelivered: false,
        });
      }
      
      const group = groups.get(siparisNo);
      group.items.push({ ...item, _itemKey: `${siparisNo}_item_${group.items.length}` });
      
      const tryVal = item['TOPLAM_TRY'] ?? item['TOPLAM'];
      // Türkçe ondalık virgüllü string'leri de doğru parse et
      const tryNum = typeof tryVal === 'number' ? tryVal
        : parseFloat(String(tryVal ?? '0').trim().replace(/\./g, '').replace(',', '.')) || 0;
      group.totalTRY += tryNum;
      
      // Herhangi bir kalem teslim edildiyse siparişi teslim edilmiş say
      const evrakNo = item['TESLIM_EVRAK_NO'];
      if (evrakNo && String(evrakNo).trim() !== '') {
        group.isDelivered = true;
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = a.SIPARIS_TARIHI ? new Date(a.SIPARIS_TARIHI) : new Date(0);
      const dateB = b.SIPARIS_TARIHI ? new Date(b.SIPARIS_TARIHI) : new Date(0);
      return dateB - dateA;
    });
  }, [filteredData, groupByOrder]);

  // Dosya sayılarını yükle
  const loadDosyaSayilari = useCallback(async () => {
    // Hem gruplu hem düz liste modunda benzersiz sipariş numaralarını topla
    const siparisSet = new Set();
    if (groupedData) {
      groupedData.forEach(g => { if (g.SIPARIS_NO && !g.SIPARIS_NO.startsWith('NO_ORDER_')) siparisSet.add(g.SIPARIS_NO); });
    } else {
      filteredData.forEach(r => { if (r.SIPARIS_NO) siparisSet.add(r.SIPARIS_NO); });
    }
    const siparisNolar = Array.from(siparisSet);
    if (siparisNolar.length === 0) return;
    try {
      const result = await window.api.dosyaSayilari(siparisNolar);
      if (result.success && result.data) {
        // API doğrudan { "S.032...": 3, ... } map objesi döndürür
        setDosyaSayilari(result.data);
      }
    } catch (err) {
      console.error('Dosya sayıları alınamadı:', err);
    }
  }, [groupedData, filteredData]);

  useEffect(() => {
    loadDosyaSayilari();
  }, [loadDosyaSayilari]);

  // Çoklu kalem içeren sipariş sayısı
  const multiItemOrderCount = useMemo(() => {
    if (!groupedData) return 0;
    return groupedData.filter(g => g.items.length > 1).length;
  }, [groupedData]);

  // Gruplu görünüm için ana tablo kolonları
  const groupedColumns = [
    {
      title: 'Sipariş No',
      dataIndex: 'SIPARIS_NO',
      key: 'siparisNo',
      width: 180,
      fixed: 'left',
      sorter: (a, b) => (a['SIPARIS_NO'] || '').toString().localeCompare((b['SIPARIS_NO'] || '').toString()),
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{text}</span>
          {record.items.length > 1 && (
            <Badge 
              count={`${record.items.length} kalem`} 
              style={{ 
                backgroundColor: '#3b82f6', 
                fontSize: 11,
                fontWeight: 500,
              }} 
            />
          )}
        </div>
      ),
    },
    {
      title: 'Sipariş Tarihi',
      dataIndex: 'SIPARIS_TARIHI',
      key: 'siparisTarihi',
      width: 110,
      render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
      sorter: (a, b) => new Date(a['SIPARIS_TARIHI'] || 0) - new Date(b['SIPARIS_TARIHI'] || 0),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Tedarikçi',
      dataIndex: 'CARI_UNVANI',
      key: 'cariUnvani',
      width: 220,
      ellipsis: { showTitle: false },
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text || '-'}</Tooltip>),
    },
    {
      title: 'Talep Eden',
      dataIndex: 'TALEP_EDEN',
      key: 'talepEden',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Masraf Merkezi',
      dataIndex: 'MASRAF_MERKEZI',
      key: 'masrafMerkezi',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Kalem Sayısı',
      key: 'kalemSayisi',
      width: 110,
      align: 'center',
      sorter: (a, b) => a.items.length - b.items.length,
      render: (_, record) => (
        <Tag color={record.items.length > 1 ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
          {record.items.length}
        </Tag>
      ),
    },
    {
      title: 'Toplam Tutar (TRY)',
      key: 'totalTRY',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.totalTRY - b.totalTRY,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#059669' }}>
          {formatCurrency(record.totalTRY)}
        </span>
      ),
    },
    {
      title: 'Ödeme Vadesi',
      dataIndex: 'ODEME_VADESI',
      key: 'odemeVadesi',
      width: 120,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Teslim Durumu',
      key: 'teslimDurumu',
      width: 120,
      render: (_, record) => {
        if (record.isDelivered) {
          return <Tag color="green">Teslim Edildi</Tag>;
        }
        return <Tag color="orange">Bekliyor</Tag>;
      },
      filters: [
        { text: 'Teslim Edildi', value: 'teslim' },
        { text: 'Bekliyor', value: 'bekliyor' },
      ],
      onFilter: (value, record) => {
        if (value === 'teslim') return record.isDelivered;
        return !record.isDelivered;
      },
    },
    {
      title: 'Dosya',
      key: 'dosya',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const count = dosyaSayilari[record.SIPARIS_NO] || 0;
        return (
          <Tooltip title="Dosya Yönetimi">
            <Button
              type="text"
              size="small"
              icon={<PaperClipOutlined />}
              onClick={(e) => { e.stopPropagation(); setDosyaModalSiparis(record.SIPARIS_NO); }}
              style={{ color: count > 0 ? '#3b82f6' : '#bfbfbf' }}
            >
              {count > 0 && <Badge count={count} size="small" style={{ backgroundColor: '#3b82f6', marginLeft: 2 }} />}
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  // Genişletilmiş satır (kalemler) için kolonlar
  const expandedColumns = [
    {
      title: 'Talep No',
      dataIndex: 'TALEP_NO',
      key: 'talepNo',
      width: 120,
    },
    {
      title: 'Malzeme/Hizmet',
      dataIndex: 'SIPARIS_MALZEME',
      key: 'malzeme',
      width: 280,
      ellipsis: { showTitle: false },
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text || '-'}</Tooltip>),
    },
    {
      title: 'Miktar',
      dataIndex: 'MIKTAR',
      key: 'miktar',
      width: 80,
      align: 'right',
      render: (val) => val != null ? Number(val) : '-',
    },
    {
      title: 'Birim Fiyatı',
      dataIndex: 'BIRIM_FIYAT',
      key: 'birimFiyat',
      width: 120,
      align: 'right',
      render: (val) => val != null ? formatUnitPrice(val) : '-',
    },
    {
      title: 'Toplam (TRY)',
      key: 'TOPLAM_TRY',
      width: 130,
      align: 'right',
      render: (_, r) => {
        const val = r.TOPLAM_TRY ?? r.TOPLAM;
        return val != null ? formatCurrency(Number(val)) : '-';
      },
    },
    {
      title: 'Para Birimi',
      dataIndex: 'PARA_BIRIMI',
      key: 'paraBirimi',
      width: 90,
      render: (val) => val || 'TRY',
    },
    {
      title: 'Teslim Evrak No',
      dataIndex: 'TESLIM_EVRAK_NO',
      key: 'teslimEvrakNo',
      width: 130,
      render: (text) => text || '-',
    },
    {
      title: 'Durum',
      key: 'durumKalem',
      width: 110,
      render: (_, record) => {
        const evrakNo = record['TESLIM_EVRAK_NO'];
        if (evrakNo && String(evrakNo).trim() !== '') {
          return <Tag color="green" style={{ fontSize: 11 }}>Teslim</Tag>;
        }
        return <Tag color="orange" style={{ fontSize: 11 }}>Bekliyor</Tag>;
      },
    },
  ];

  // Düz liste görünümü için kolonlar (eski davranış)
  const flatColumns = [
    {
      title: 'Sipariş No',
      dataIndex: 'SIPARIS_NO',
      key: 'siparisNo',
      width: 130,
      fixed: 'left',
      sorter: (a, b) => (a['SIPARIS_NO'] || '').toString().localeCompare((b['SIPARIS_NO'] || '').toString()),
    },
    {
      title: 'Talep No',
      dataIndex: 'TALEP_NO',
      key: 'talepNo',
      width: 130,
      sorter: (a, b) => (a['TALEP_NO'] || '').toString().localeCompare((b['TALEP_NO'] || '').toString()),
    },
    {
      title: 'Talep Eden',
      dataIndex: 'TALEP_EDEN',
      key: 'talepEden',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Sipariş Tarihi',
      dataIndex: 'SIPARIS_TARIHI',
      key: 'siparisTarihi',
      width: 110,
      render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
      sorter: (a, b) => new Date(a['SIPARIS_TARIHI'] || 0) - new Date(b['SIPARIS_TARIHI'] || 0),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Tedarikçi',
      dataIndex: 'CARI_UNVANI',
      key: 'cariUnvani',
      width: 200,
      ellipsis: { showTitle: false },
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text || '-'}</Tooltip>),
    },
    {
      title: 'Masraf Merkezi',
      dataIndex: 'MASRAF_MERKEZI',
      key: 'masrafMerkezi',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Malzeme/Hizmet',
      dataIndex: 'SIPARIS_MALZEME',
      key: 'malzeme',
      width: 200,
      ellipsis: { showTitle: false },
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text || '-'}</Tooltip>),
    },
    {
      title: 'Miktar',
      dataIndex: 'MIKTAR',
      key: 'miktar',
      width: 80,
      align: 'right',
      render: (val) => val != null ? Number(val) : '-',
    },
    {
      title: 'Birim Fiyatı',
      dataIndex: 'BIRIM_FIYAT',
      key: 'birimFiyat',
      width: 110,
      align: 'right',
      render: (val) => val != null ? formatUnitPrice(val) : '-',
    },
    {
      title: 'Toplam (TRY)',
      dataIndex: 'TOPLAM_TRY',
      key: 'TOPLAM_TRY',
      width: 120,
      align: 'right',
      render: (v, r) => {
        const val = v ?? r.TOPLAM;
        return val != null ? formatCurrency(Number(val)) : '-';
      },
      sorter: (a, b) => (a.TOPLAM_TRY ?? a.TOPLAM) - (b.TOPLAM_TRY ?? b.TOPLAM),
    },
    {
      title: 'Para Birimi',
      dataIndex: 'PARA_BIRIMI',
      key: 'paraBirimi',
      width: 90,
      render: (val) => val || 'TRY',
    },
    {
      title: 'Ödeme Vadesi',
      dataIndex: 'ODEME_VADESI',
      key: 'odemeVadesi',
      width: 120,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Teslim Evrak No',
      dataIndex: 'TESLIM_EVRAK_NO',
      key: 'teslimEvrakNo',
      width: 130,
      render: (text) => text || '-',
    },
    {
      title: 'Teslim Durumu',
      key: 'teslimDurumu',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const evrakNo = record['TESLIM_EVRAK_NO'];
        if (evrakNo && String(evrakNo).trim() !== '') {
          return <Tag color="green">Teslim Edildi</Tag>;
        }
        return <Tag color="orange">Bekliyor</Tag>;
      },
      filters: [
        { text: 'Teslim Edildi', value: 'teslim' },
        { text: 'Bekliyor', value: 'bekliyor' },
      ],
      onFilter: (value, record) => {
        const evrakNo = record['TESLIM_EVRAK_NO'];
        if (value === 'teslim') return evrakNo && String(evrakNo).trim() !== '';
        return !evrakNo || String(evrakNo).trim() === '';
      },
    },
    {
      title: 'Dosya',
      key: 'dosyaFlat',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const sipNo = record['SIPARIS_NO'];
        const count = dosyaSayilari[sipNo] || 0;
        return (
          <Tooltip title="Dosya Yönetimi">
            <Button
              type="text"
              size="small"
              icon={<PaperClipOutlined />}
              onClick={(e) => { e.stopPropagation(); setDosyaModalSiparis(sipNo); }}
              style={{ color: count > 0 ? '#3b82f6' : '#bfbfbf' }}
            >
              {count > 0 && <Badge count={count} size="small" style={{ backgroundColor: '#3b82f6', marginLeft: 2 }} />}
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  // Genişletilmiş satır render fonksiyonu
  const expandedRowRender = (record) => {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        padding: '16px 20px', 
        borderRadius: 12,
        margin: '8px 0',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          marginBottom: 12, 
          fontSize: 13, 
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 500
        }}>
          <span style={{ fontSize: 16 }}>gY"ş</span>
          <span>Bu siparişe ait <strong style={{ color: '#3b82f6' }}>{record.items.length}</strong> kalem:</span>
        </div>
        <Table
          columns={expandedColumns}
          dataSource={record.items}
          rowKey="_itemKey"
          pagination={false}
          size="small"
          style={{ 
            background: '#fff', 
            borderRadius: 8,
            overflow: 'hidden'
          }}
          rowClassName={(_, index) => index % 2 === 0 ? 'row-even' : 'row-odd'}
        />
      </div>
    );
  };

  // Tümünü aç/kapat
  const handleExpandAll = () => {
    if (expandedRowKeys.length === groupedData?.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(groupedData?.map(g => g.key) || []);
    }
  };

  // Excel export
  const handleExport = () => {
    const headers = ['Sipariş No', 'Talep No', 'Talep Eden', 'Sipariş Tarihi', 'Tedarikçi', 'Masraf Merkezi', 'Malzeme/Hizmet', 'Miktar', 'Birim Fiyatı', 'Toplam (TRY)', 'Toplam (Orijinal)', 'Para Birimi', 'Ödeme Vadesi', 'Teslim Evrak No'];
    const keys = ['SIPARIS_NO', 'TALEP_NO', 'TALEP_EDEN', 'SIPARIS_TARIHI', 'CARI_UNVANI', 'MASRAF_MERKEZI', 'SIPARIS_MALZEME', 'MIKTAR', 'BIRIM_FIYAT', 'TOPLAM_TRY', 'TOPLAM', 'PARA_BIRIMI', 'ODEME_VADESI', 'TESLIM_EVRAK_NO'];
    
    const csvContent = [
      headers.join(';'),
      ...filteredData.map(row =>
        keys.map(key => {
          const value = row[key];
          if (key === 'SIPARIS_TARIHI' && value) {
            return dayjs(value).format('DD.MM.YYYY');
          }
          return value != null ? String(value).replace(/;/g, ',') : '';
        }).join(';')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `satinalma_rapor_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click();
  };

  // Ozet bilgiler
  const toplamTutar = filteredData.reduce((sum, item) => {
    const tryVal = item['TOPLAM_TRY'];
    if (tryVal != null && !Number.isNaN(Number(tryVal))) return sum + Number(tryVal);
    return sum + (Number(item['TOPLAM']) || 0);
  }, 0);

  const siparisMap = new Map();
  for (const item of filteredData) {
    const id = item['SIPARIS_NO'];
    if (!id) continue;
    const evrakNo = item['TESLIM_EVRAK_NO'];
    const delivered = evrakNo && String(evrakNo).trim() !== '';
    const prev = siparisMap.get(id) || { delivered: false };
    siparisMap.set(id, { delivered: prev.delivered || delivered });
  }
  const teslimEdilen = Array.from(siparisMap.values()).filter(v => v.delivered).length;
  const bekleyen = Array.from(siparisMap.values()).filter(v => !v.delivered).length;
  
  const benzersizSiparisSayisi = siparisMap.size;

  return (
    <div>
      <div className="page-header">
        <h2>Detaylı Rapor</h2>
        <p>Tüm satın alma kayıtlarının detaylı listesi ve filtreleme</p>
      </div>

      {/* Filters */}
      <div className="data-table-container" style={{ margin: '24px 32px 20px' }}>
        <div className="filter-section">
          <Space wrap size="middle">
            <Input
              placeholder="Ara... (Talep No, Sipariş No, Tedarikçi, Malzeme)"
              prefix={<SearchOutlined style={{ color: '#8c8f93' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 360 }}
              allowClear
            />
            <RangePicker
              placeholder={["Başlangıç", "Bitiş"]}
              onChange={setDateRange}
              format="DD.MM.YYYY"
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setDateRange(null); }}>
              Sıfırla
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              Excel İndir
            </Button>
          </Space>
        </div>

        {/* View Toggle & Summary */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 16,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 8,
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Sol: Görünüm Ayarları */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Görünüm:</span>
              <Switch
                checked={groupByOrder}
                onChange={setGroupByOrder}
                checkedChildren="Gruplu"
                unCheckedChildren="Liste"
                style={{ background: groupByOrder ? '#3b82f6' : undefined }}
              />
            </div>
            
            {groupByOrder && groupedData && (
              <Button 
                size="small"
                icon={expandedRowKeys.length === groupedData.length ? <ShrinkOutlined /> : <ExpandAltOutlined />}
                onClick={handleExpandAll}
                style={{ fontSize: 12 }}
              >
                {expandedRowKeys.length === groupedData.length ? 'Tümünü Kapat' : 'Tümünü Aç'}
              </Button>
            )}
          </div>

          {/* Sağ: Özet Bilgiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>
              <strong>Toplam Kayıt:</strong> {filteredData.length.toLocaleString('tr-TR')}
            </span>
            <span style={{ fontSize: 13 }}>
              <strong>Sipariş:</strong> <Tag color="blue">{benzersizSiparisSayisi.toLocaleString('tr-TR')}</Tag>
            </span>
            {groupByOrder && multiItemOrderCount > 0 && (
              <span style={{ fontSize: 13 }}>
                <strong>Çok Kalemli:</strong> <Tag color="blue">{multiItemOrderCount}</Tag>
              </span>
            )}
            <span style={{ fontSize: 13 }}>
              <strong>Toplam:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(toplamTutar)}</span>
            </span>
            <span style={{ fontSize: 13 }}>
              <Tag color="green">Teslim: {teslimEdilen}</Tag>
            </span>
            <span style={{ fontSize: 13 }}>
              <Tag color="orange">Bekleyen: {bekleyen}</Tag>
            </span>
          </div>
        </div>

        {/* Table - Gruplu veya Düz Liste */}
        {groupByOrder && groupedData ? (
          <Table
            columns={groupedColumns}
            dataSource={groupedData}
            rowKey="key"
            scroll={{ x: 1500, y: 500 }}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
              rowExpandable: () => true,
            }}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Toplam ${total} sipariş`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => setPageSize(size),
            }}
            size="small"
            rowClassName={(record) => record.items.length > 1 ? 'multi-item-row' : ''}
          />
        ) : (
          <Table
            columns={flatColumns}
            dataSource={filteredData}
            rowKey={(record, index) => `${record['SIPARIS_NO']}_${record['TALEP_NO']}_${index}`}
            scroll={{ x: 2000, y: 500 }}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Toplam ${total} kayıt`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => setPageSize(size),
            }}
            size="small"
          />
        )}
      </div>

      {/* Custom styles */}
      <style>{`
        .multi-item-row {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%);
        }
        .multi-item-row:hover > td {
          background: rgba(59, 130, 246, 0.06) !important;
        }
        .ant-table-expanded-row > td {
          background: transparent !important;
          padding: 0 !important;
        }
        .row-even {
          background: #fafafa;
        }
        .row-odd {
          background: #fff;
        }
      `}</style>

      {/* Dosya Yönetimi Modalı */}
      <DosyaYonetimi
        visible={!!dosyaModalSiparis}
        siparisNo={dosyaModalSiparis}
        onClose={() => setDosyaModalSiparis(null)}
        onDosyaSayisiDegisti={loadDosyaSayilari}
      />
    </div>
  );
};

export default DetayliRapor;
