import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  TrophyOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  getIhaleler,
  createIhale,
  updateIhale,
  deleteIhale,
  getLokasyonlar,
} from '../api/ihaleApi';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const emptyForm = {
  tarih: new Date().toISOString().split('T')[0],
  siparis_numarasi: '',
  malzeme_hizmet: '',
  masraf_merkezi: '',
  lokasyon: '',
  firma_1: '',
  firma_2: '',
  firma_3: '',
  firma_4: '',
  firma_5: '',
  kazanan_tedarikci: '',
  teklif_1_tl: '',
  teklif_2_tl: '',
  teklif_3_tl: '',
  teklif_4_tl: '',
  teklif_5_tl: '',
  kazanc_tutari_tl: '',
};

const normalizeFilterText = (v) =>
  (v || '')
    .toString()
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeIhaleRow = (row = {}) => ({
  ...row,
  sira_no: row.sira_no ?? row.siraNo ?? row.SIRA_NO ?? null,
  tarih: row.tarih ?? row.TARIH ?? '',
  siparis_numarasi: row.siparis_numarasi ?? row.siparisNo ?? row.SIPARIS_NO ?? '',
  malzeme_hizmet: row.malzeme_hizmet ?? row.malzemeHizmet ?? row.MALZEME_HIZMET ?? '',
  masraf_merkezi: row.masraf_merkezi ?? row.masrafMerkezi ?? row.MASRAF_MERKEZI ?? '',
  lokasyon: row.lokasyon ?? row.LOKASYON ?? '',
  firma_1: row.firma_1 ?? row.firma1 ?? row.FIRMA_1 ?? '',
  firma_2: row.firma_2 ?? row.firma2 ?? row.FIRMA_2 ?? '',
  firma_3: row.firma_3 ?? row.firma3 ?? row.FIRMA_3 ?? '',
  firma_4: row.firma_4 ?? row.firma4 ?? row.FIRMA_4 ?? '',
  firma_5: row.firma_5 ?? row.firma5 ?? row.FIRMA_5 ?? '',
  kazanan_tedarikci: row.kazanan_tedarikci ?? row.kazananTedarikci ?? row.KAZANAN_TEDARIKCI ?? '',
  teklif_1_tl: row.teklif_1_tl ?? row.teklif1Tl ?? row.TEKLIF_1_TL ?? 0,
  teklif_2_tl: row.teklif_2_tl ?? row.teklif2Tl ?? row.TEKLIF_2_TL ?? 0,
  teklif_3_tl: row.teklif_3_tl ?? row.teklif3Tl ?? row.TEKLIF_3_TL ?? 0,
  teklif_4_tl: row.teklif_4_tl ?? row.teklif4Tl ?? row.TEKLIF_4_TL ?? 0,
  teklif_5_tl: row.teklif_5_tl ?? row.teklif5Tl ?? row.TEKLIF_5_TL ?? 0,
  kazanc_tutari_tl: row.kazanc_tutari_tl ?? row.kazancTutariTl ?? row.KAZANC_TUTARI_TL ?? 0,
});

const IhaleYonetimi = ({ selectedAmbar = 'all' }) => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [filterLokasyon, setFilterLokasyon] = useState('');

  const [searchText, setSearchText] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSiraNo, setEditingSiraNo] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Detail view
  const [viewRow, setViewRow] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterLokasyon) params.lokasyon = filterLokasyon;
      const result = await getIhaleler(params);

      const payload = result?.data && !Array.isArray(result.data) ? result.data : result;
      const rawRows = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.data)
            ? payload.data
            : (Array.isArray(payload?.rows) ? payload.rows : []));
      const rows = rawRows.map(normalizeIhaleRow);
      const total = payload?.totalCount ?? payload?.total_count ?? payload?.pagination?.total ?? rows.length;

      // Geçici lokasyon uyuşmazlığında ilk açılışta boş dönmesini engelle
      if (rows.length === 0 && filterLokasyon && page === 1) {
        const fallbackResult = await getIhaleler({ page, limit });
        const fallbackPayload = fallbackResult?.data && !Array.isArray(fallbackResult.data) ? fallbackResult.data : fallbackResult;
        const fallbackRawRows = Array.isArray(fallbackPayload)
          ? fallbackPayload
          : (Array.isArray(fallbackPayload?.data)
              ? fallbackPayload.data
              : (Array.isArray(fallbackPayload?.rows) ? fallbackPayload.rows : []));
        const fallbackRows = fallbackRawRows.map(normalizeIhaleRow);
        const fallbackTotal = fallbackPayload?.totalCount ?? fallbackPayload?.total_count ?? fallbackPayload?.pagination?.total ?? fallbackRows.length;
        setFilterLokasyon('');
        setData(fallbackRows);
        setTotalCount(fallbackTotal);
      } else {
        setData(rows);
        setTotalCount(total);
      }
    } catch (err) {
      console.error('İhale verileri yüklenemedi:', err);
      showToast('Veriler yüklenemedi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterLokasyon]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    getLokasyonlar()
      .then(res => setLokasyonlar(res.data || []))
      .catch(() => {});
  }, []);

  // Global fabrika filtresini yalnızca lokasyon ile gerçekten eşleşiyorsa uygula
  useEffect(() => {
    setPage(1);
    if (selectedAmbar === 'all') {
      setFilterLokasyon('');
      return;
    }
    const foundLokasyon = lokasyonlar.find(
      l => normalizeFilterText(l) === normalizeFilterText(selectedAmbar)
    );
    setFilterLokasyon(foundLokasyon || '');
  }, [selectedAmbar, lokasyonlar]);

  const handleNew = () => {
    setEditingSiraNo(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const handleEdit = (row) => {
    setEditingSiraNo(row.sira_no);
    setForm({
      tarih: row.tarih ? new Date(row.tarih).toISOString().split('T')[0] : '',
      siparis_numarasi: row.siparis_numarasi || '',
      malzeme_hizmet: row.malzeme_hizmet || '',
      masraf_merkezi: row.masraf_merkezi || '',
      lokasyon: row.lokasyon || '',
      firma_1: row.firma_1 || '',
      firma_2: row.firma_2 || '',
      firma_3: row.firma_3 || '',
      firma_4: row.firma_4 || '',
      firma_5: row.firma_5 || '',
      kazanan_tedarikci: row.kazanan_tedarikci || '',
      teklif_1_tl: row.teklif_1_tl || '',
      teklif_2_tl: row.teklif_2_tl || '',
      teklif_3_tl: row.teklif_3_tl || '',
      teklif_4_tl: row.teklif_4_tl || '',
      teklif_5_tl: row.teklif_5_tl || '',
      kazanc_tutari_tl: row.kazanc_tutari_tl || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tarih || !form.malzeme_hizmet) {
      showToast('Tarih ve Malzeme/Hizmet alanları zorunludur', 'error');
      return;
    }
    setSaving(true);
    try {
      const dto = {
        ...form,
        masraf_merkezi: form.masraf_merkezi || '',
        masrafMerkezi: form.masraf_merkezi || '',
        MASRAF_MERKEZI: form.masraf_merkezi || '',
        teklif_1_tl: parseFloat(form.teklif_1_tl) || 0,
        teklif_2_tl: parseFloat(form.teklif_2_tl) || 0,
        teklif_3_tl: parseFloat(form.teklif_3_tl) || 0,
        teklif_4_tl: parseFloat(form.teklif_4_tl) || 0,
        teklif_5_tl: parseFloat(form.teklif_5_tl) || 0,
        kazanc_tutari_tl: parseFloat(form.kazanc_tutari_tl) || 0,
      };
      if (editingSiraNo) {
        await updateIhale(editingSiraNo, dto);
        showToast('Kayıt güncellendi');
      } else {
        await createIhale(dto);
        showToast('Yeni kayıt oluşturuldu');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast('Kayıt hatası: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (siraNo) => {
    try {
      await deleteIhale(siraNo);
      showToast('Kayıt silindi');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showToast('Silme hatası: ' + err.message, 'error');
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Client-side search filter
  const filteredData = searchText
    ? data.filter(row =>
        (row.malzeme_hizmet || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (row.siparis_numarasi || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (row.kazanan_tedarikci || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (row.lokasyon || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  const setField = (key, val) => setForm(f => {
    const updated = { ...f, [key]: val };
    // Teklif veya firma değiştiğinde kazanan ve kazancı otomatik hesapla
    if (key.startsWith('teklif_') || key.startsWith('firma_')) {
      const teklifler = [1,2,3,4,5].map(i => ({
        firma: updated[`firma_${i}`] || '',
        teklif: parseFloat(updated[`teklif_${i}_tl`]) || 0,
      })).filter(t => t.firma && t.teklif > 0);
      if (teklifler.length > 0) {
        const minTeklif = teklifler.reduce((min, t) => t.teklif < min.teklif ? t : min, teklifler[0]);
        const maxTeklif = Math.max(...teklifler.map(t => t.teklif));
        updated.kazanan_tedarikci = minTeklif.firma;
        updated.kazanc_tutari_tl = (maxTeklif - minTeklif.teklif).toFixed(2);
      }
    }
    return updated;
  });

  return (
    <div className="ihale-page">
      {/* Toast */}
      {toast && (
        <div className={`ihale-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="ihale-page-header">
        <div className="ihale-page-title">
          <TrophyOutlined className="ihale-title-icon" />
          <div>
            <h2>İhale Kazanç Takip</h2>
            <p>İhale kayıtlarını yönetin — toplam {totalCount} kayıt</p>
          </div>
        </div>
        <div className="ihale-page-actions">
          <button className="ihale-btn ihale-btn-primary" onClick={handleNew}>
            <PlusOutlined /> Yeni İhale
          </button>
          <button className="ihale-btn ihale-btn-ghost" onClick={loadData} disabled={loading}>
            <ReloadOutlined spin={loading} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ihale-filters">
        <div className="ihale-search-box">
          <SearchOutlined className="ihale-search-icon" />
          <input
            type="text"
            placeholder="Ara... (malzeme, sipariş no, tedarikçi)"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="ihale-filter-group">
          <FilterOutlined />
          <select value={filterLokasyon} onChange={e => { setFilterLokasyon(e.target.value); setPage(1); }}>
            <option value="">Tüm Lokasyonlar</option>
            {lokasyonlar.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ihale-table-wrapper">
        <table className="ihale-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th style={{ width: 100 }}>Tarih</th>
              <th style={{ width: 150 }}>Sipariş No</th>
              <th>Malzeme/Hizmet</th>
              <th style={{ width: 150 }}>Masraf Merkezi</th>
              <th style={{ width: 110 }}>Lokasyon</th>
              <th style={{ width: 140 }}>Kazanan Tedarikçi</th>
              <th style={{ width: 120 }} className="text-right">Kazanç (TL)</th>
              <th style={{ width: 100 }} className="text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data.length ? (
              <tr><td colSpan={9} className="ihale-empty">
                <ReloadOutlined spin style={{ fontSize: 24, color: '#94a3b8' }} />
                <span>Yükleniyor...</span>
              </td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={9} className="ihale-empty">
                <FileTextOutlined style={{ fontSize: 36, color: '#cbd5e1' }} />
                <span>Kayıt bulunamadı</span>
              </td></tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.sira_no} className={idx % 2 === 0 ? 'even' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setViewRow(row)}
                >
                  <td className="text-center row-num">{(page - 1) * limit + idx + 1}</td>
                  <td>{formatDate(row.tarih)}</td>
                  <td className="mono">{row.siparis_numarasi || '-'}</td>
                  <td className="malzeme-cell" title={row.malzeme_hizmet}>
                    {row.malzeme_hizmet || '-'}
                  </td>
                  <td>{row.masraf_merkezi || '-'}</td>
                  <td>
                    <span className="lokasyon-badge">
                      <EnvironmentOutlined /> {row.lokasyon || '-'}
                    </span>
                  </td>
                  <td className="tedarikci-cell">{row.kazanan_tedarikci || '-'}</td>
                  <td className="text-right kazanc-cell">
                    <span className={`kazanc-value ${row.kazanc_tutari_tl > 0 ? 'positive' : ''}`}>
                      {formatCurrency(row.kazanc_tutari_tl)}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="ihale-row-actions">
                      <button className="ihale-action-btn edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Düzenle">
                        <EditOutlined />
                      </button>
                      <button className="ihale-action-btn delete" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.sira_no); }} title="Sil">
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ihale-pagination">
          <span className="ihale-page-info">
            {(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} / {totalCount}
          </span>
          <div className="ihale-page-btns">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><LeftOutlined /></button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><RightOutlined /></button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="ihale-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ihale-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon delete">
              <ExclamationCircleOutlined />
            </div>
            <h3>Kaydı Sil</h3>
            <p>Bu ihale kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="confirm-actions">
              <button className="ihale-btn ihale-btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="ihale-btn ihale-btn-danger" onClick={() => handleDelete(deleteConfirm)}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewRow && (
        <div className="ihale-modal-overlay" onClick={() => setViewRow(null)}>
          <div className="ihale-form-modal" style={{ width: 680 }} onClick={e => e.stopPropagation()}>
            <div className="ihale-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrophyOutlined style={{ color: '#3b82f6' }} />
                İhale Detayı — #{viewRow.sira_no}
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ihale-btn ihale-btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => { setViewRow(null); handleEdit(viewRow); }}>
                  <EditOutlined /> Düzenle
                </button>
                <button className="ihale-modal-close" onClick={() => setViewRow(null)}><CloseOutlined /></button>
              </div>
            </div>
            <div className="ihale-modal-body">

              {/* Genel Bilgiler */}
              <div className="ihale-form-section">
                <h4>Genel Bilgiler</h4>
                <div className="ihale-detail-grid">
                  <div className="ihale-detail-item">
                    <span className="detail-label">Tarih</span>
                    <span className="detail-value">{formatDate(viewRow.tarih)}</span>
                  </div>
                  <div className="ihale-detail-item">
                    <span className="detail-label">Sipariş No</span>
                    <span className="detail-value mono">{viewRow.siparis_numarasi || '—'}</span>
                  </div>
                  <div className="ihale-detail-item full">
                    <span className="detail-label">Malzeme / Hizmet</span>
                    <span className="detail-value" style={{ fontWeight: 600 }}>{viewRow.malzeme_hizmet || '—'}</span>
                  </div>
                  <div className="ihale-detail-item">
                    <span className="detail-label">Masraf Merkezi</span>
                    <span className="detail-value">{viewRow.masraf_merkezi || '—'}</span>
                  </div>
                  <div className="ihale-detail-item">
                    <span className="detail-label">Lokasyon</span>
                    <span className="detail-value">
                      <span className="lokasyon-badge"><EnvironmentOutlined /> {viewRow.lokasyon || '—'}</span>
                    </span>
                  </div>
                  <div className="ihale-detail-item">
                    <span className="detail-label">Kazanan Tedarikçi</span>
                    <span className="detail-value" style={{ fontWeight: 600, color: '#059669' }}>{viewRow.kazanan_tedarikci || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Firmalar & Teklifler */}
              <div className="ihale-form-section">
                <h4>Firmalar &amp; Teklifler</h4>
                <div className="ihale-detail-teklif-table">
                  <div className="detail-teklif-header">
                    <span>#</span><span>Firma</span><span>Teklif (TL)</span><span>Durum</span>
                  </div>
                  {[1,2,3,4,5].map(i => {
                    const firma = viewRow[`firma_${i}`];
                    const teklif = viewRow[`teklif_${i}_tl`];
                    if (!firma && !teklif) return null;
                    const kazandi = firma === viewRow.kazanan_tedarikci;
                    return (
                      <div key={i} className={`detail-teklif-row ${kazandi ? 'winner' : ''}`}>
                        <span className="teklif-num">{i}</span>
                        <span style={{ fontWeight: kazandi ? 700 : 400 }}>{firma || '—'}</span>
                        <span style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(teklif)}</span>
                        <span>
                          {kazandi
                            ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>✓ Kazandı</span>
                            : <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '2px 10px', borderRadius: 12, fontSize: 11 }}>Katıldı</span>
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kazanç */}
              <div className="ihale-form-section" style={{ marginBottom: 0 }}>
                <h4>Kazanç</h4>
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#15803d', fontWeight: 600 }}>Toplam Kazanç Tutarı</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#059669', letterSpacing: '-0.03em' }}>
                    {formatCurrency(viewRow.kazanc_tutari_tl)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="ihale-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ihale-form-modal" onClick={e => e.stopPropagation()}>
            <div className="ihale-modal-header">
              <h3>{editingSiraNo ? 'İhale Düzenle' : 'Yeni İhale Kaydı'}</h3>
              <button className="ihale-modal-close" onClick={() => setShowModal(false)}><CloseOutlined /></button>
            </div>
            <div className="ihale-modal-body">
              {/* Genel Bilgiler */}
              <div className="ihale-form-section">
                <h4>Genel Bilgiler</h4>
                <div className="ihale-form-grid">
                  <div className="ihale-form-field">
                    <label>Tarih *</label>
                    <input type="date" value={form.tarih} onChange={e => setField('tarih', e.target.value)} />
                  </div>
                  <div className="ihale-form-field">
                    <label>Sipariş Numarası</label>
                    <input type="text" value={form.siparis_numarasi} onChange={e => setField('siparis_numarasi', e.target.value)} placeholder="S.ZYT.026.000001" />
                  </div>
                  <div className="ihale-form-field full">
                    <label>Malzeme/Hizmet *</label>
                    <input type="text" value={form.malzeme_hizmet} onChange={e => setField('malzeme_hizmet', e.target.value)} placeholder="Malzeme veya hizmet adı" />
                  </div>
                  <div className="ihale-form-field">
                    <label>Masraf Merkezi</label>
                    <input type="text" value={form.masraf_merkezi} onChange={e => setField('masraf_merkezi', e.target.value)} placeholder="Masraf merkezi" />
                  </div>
                  <div className="ihale-form-field">
                    <label>Lokasyon</label>
                    <input type="text" value={form.lokasyon} onChange={e => setField('lokasyon', e.target.value)} placeholder="Şehir / Tesis" list="lokasyonList" />
                    <datalist id="lokasyonList">
                      {lokasyonlar.map(l => <option key={l} value={l} />)}
                    </datalist>
                  </div>
                  <div className="ihale-form-field">
                    <label>Kazanan Tedarikçi (otomatik)</label>
                    <input type="text" value={form.kazanan_tedarikci} readOnly style={{ background: '#f8fafc', cursor: 'default' }} placeholder="En düşük teklif veren firma" />
                  </div>
                </div>
              </div>

              {/* Firmalar & Teklifler */}
              <div className="ihale-form-section">
                <h4>Firmalar & Teklifler</h4>
                <div className="ihale-teklif-grid">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="ihale-teklif-row">
                      <div className="teklif-num">{i}</div>
                      <div className="ihale-form-field">
                        <input type="text" value={form[`firma_${i}`]} onChange={e => setField(`firma_${i}`, e.target.value)} placeholder={`Firma ${i}`} />
                      </div>
                      <div className="ihale-form-field">
                        <div className="input-currency">
                          <input type="number" step="0.01" value={form[`teklif_${i}_tl`]} onChange={e => setField(`teklif_${i}_tl`, e.target.value)} placeholder="0.00" />
                          <span className="currency-suffix">₺</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kazanç */}
              <div className="ihale-form-section">
                <h4>Kazanç Bilgisi (otomatik hesaplanır)</h4>
                <div className="ihale-form-grid">
                  <div className="ihale-form-field">
                    <label>Kazanç Tutarı (en yüksek - en düşük teklif)</label>
                    <div className="input-currency lg">
                      <input type="number" value={form.kazanc_tutari_tl} readOnly style={{ background: '#f8fafc', cursor: 'default' }} placeholder="0.00" />
                      <span className="currency-suffix">₺</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ihale-modal-footer">
              <button className="ihale-btn ihale-btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="ihale-btn ihale-btn-primary" onClick={handleSave} disabled={saving}>
                <SaveOutlined /> {saving ? 'Kaydediliyor...' : (editingSiraNo ? 'Güncelle' : 'Kaydet')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IhaleYonetimi;
