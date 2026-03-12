import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, CloseOutlined, SaveOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, EyeOutlined, TagsOutlined,
  LeftOutlined, RightOutlined, FilterOutlined,
} from '@ant-design/icons';
import {
  getTedarikciKategoriler, createTedarikciKategori,
  updateTedarikciKategori, deleteTedarikciKategori,
} from '../api/tedarikciKategoriApi';

const emptyForm = {
  TIP: '',
  MALZEME_VEYA_HIZMET_GRUBU: '',
  TEDARIKCI_CARI_KODU: '',
  TEDARIKCI_UNVANI: '',
  FIRMA_YETKILISI: '',
  MAIL_ADRESI: '',
  TELEFON_NUMARASI: '',
  ACIKLAMA: '',
};

const TedarikciKategori = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterTip, setFilterTip] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);

  const tipLabel = (v) => {
    if (!v) return '-';
    if (v === 'D') return 'Direkt';
    if (v === 'E') return 'Endirekt';
    return v;
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchText.trim()) params.search = searchText.trim();
      if (filterTip) params.tip = filterTip;
      const res = await getTedarikciKategoriler(params);
      setData(res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchText, filterTip]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.ID);
    setForm({
      TIP: item.TIP || '',
      MALZEME_VEYA_HIZMET_GRUBU: item.MALZEME_VEYA_HIZMET_GRUBU || item.MALZEME_HIZMET_GRUBU || '',
      TEDARIKCI_CARI_KODU: item.TEDARIKCI_CARI_KODU || '',
      TEDARIKCI_UNVANI: item.TEDARIKCI_UNVANI || '',
      FIRMA_YETKILISI: item.FIRMA_YETKILISI || '',
      MAIL_ADRESI: item.MAIL_ADRESI || '',
      TELEFON_NUMARASI: item.TELEFON_NUMARASI || '',
      ACIKLAMA: item.ACIKLAMA || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.TEDARIKCI_UNVANI.trim()) {
      showToast('Tedarikçi unvanı zorunludur', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTedarikciKategori(editingId, form);
        showToast('Kayıt güncellendi');
      } else {
        await createTedarikciKategori(form);
        showToast('Kayıt oluşturuldu');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTedarikciKategori(id);
      showToast('Kayıt silindi');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') { setPage(1); loadData(); }
  };

  const fieldDef = (key, label) => ({ key, label });
  const fields = [
    fieldDef('TIP', 'Tip'),
    fieldDef('MALZEME_VEYA_HIZMET_GRUBU', 'Malzeme/Hizmet Grubu'),
    fieldDef('TEDARIKCI_CARI_KODU', 'Cari Kodu'),
    fieldDef('TEDARIKCI_UNVANI', 'Tedarikçi Unvanı'),
    fieldDef('FIRMA_YETKILISI', 'Firma Yetkilisi'),
    fieldDef('MAIL_ADRESI', 'E-Posta'),
    fieldDef('TELEFON_NUMARASI', 'Telefon'),
    fieldDef('ACIKLAMA', 'Açıklama'),
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 24px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: toast.type === 'error' ? '#ef4444' : '#10b981' }}>
          {toast.type === 'error' ? <ExclamationCircleOutlined style={{ marginRight: 8 }} /> : <CheckCircleOutlined style={{ marginRight: 8 }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TagsOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Tedarikçi Kategori</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Tedarikçi kategori kartı yönetimi ({totalCount} kayıt)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadData} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <ReloadOutlined spin={loading} /> Yenile
          </button>
          <button onClick={handleNew}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <PlusOutlined /> Yeni Kayıt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={handleSearch}
            placeholder="Tedarikçi, kategori veya cari kodu ara..."
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterTip} onChange={e => { setFilterTip(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', cursor: 'pointer', minWidth: 120 }}>
          <option value="">Tüm Tipler</option>
          <option value="D">Direkt</option>
          <option value="E">Endirekt</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TİP</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>MALZEME/HİZMET GRUBU</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>CARİ KODU</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TEDARİKÇİ UNVANI</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>YETKİLİ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>E-POSTA</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TELEFON</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AÇIKLAMA</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>OLUŞTURMA TARİHİ</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data.length ? (
                <tr><td colSpan={11} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}><ReloadOutlined spin style={{ fontSize: 24 }} /><br />Yükleniyor...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Kayıt bulunamadı</td></tr>
              ) : data.map((item) => (
                <tr key={item.ID} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => setDetailItem(item)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.ID}</td>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: item.TIP === 'D' ? '#dbeafe' : '#fef3c7', color: item.TIP === 'D' ? '#2563eb' : '#d97706' }}>
                      {tipLabel(item.TIP)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1e293b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.MALZEME_VEYA_HIZMET_GRUBU || item.MALZEME_HIZMET_GRUBU}>
                    {item.MALZEME_VEYA_HIZMET_GRUBU || item.MALZEME_HIZMET_GRUBU || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.TEDARIKCI_CARI_KODU || '-'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1e293b', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.TEDARIKCI_UNVANI}>
                    {item.TEDARIKCI_UNVANI || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.FIRMA_YETKILISI}>
                    {item.FIRMA_YETKILISI || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.MAIL_ADRESI}>
                    {item.MAIL_ADRESI || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {item.TELEFON_NUMARASI || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.ACIKLAMA}>
                    {item.ACIKLAMA || '-'}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {item.OLUSTURMA_TARIHI ? new Date(item.OLUSTURMA_TARIHI).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} title="Düzenle"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: 15, padding: '4px 6px' }}><EditOutlined /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.ID); }} title="Sil"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 15, padding: '4px 6px' }}><DeleteOutlined /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
          <span>Toplam {totalCount} kayıt — Sayfa {page}/{totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page <= 1 ? 0.5 : 1 }}>
              <LeftOutlined />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page < totalPages ? 'pointer' : 'not-allowed', opacity: page >= totalPages ? 0.5 : 1 }}>
              <RightOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 600, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                {editingId ? 'Kayıt Düzenle' : 'Yeni Kayıt'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}><CloseOutlined /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Tip</label>
                    <select value={form.TIP} onChange={e => setForm(f => ({ ...f, TIP: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }}>
                    <option value="">Seçiniz</option>
                    <option value="D">Direkt</option>
                    <option value="E">Endirekt</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Cari Kodu</label>
                  <input value={form.TEDARIKCI_CARI_KODU} onChange={e => setForm(f => ({ ...f, TEDARIKCI_CARI_KODU: e.target.value }))}
                    placeholder="320.00.0125" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Malzeme/Hizmet Grubu</label>
                <input value={form.MALZEME_VEYA_HIZMET_GRUBU} onChange={e => setForm(f => ({ ...f, MALZEME_VEYA_HIZMET_GRUBU: e.target.value }))}
                  placeholder="SİTRİK ASİT" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Tedarikçi Unvanı *</label>
                <input value={form.TEDARIKCI_UNVANI} onChange={e => setForm(f => ({ ...f, TEDARIKCI_UNVANI: e.target.value }))}
                  placeholder="GÜVEN SEYLAN BAHARAT SAN. TİC. LTD. ŞTİ." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Firma Yetkilisi</label>
                <input value={form.FIRMA_YETKILISI} onChange={e => setForm(f => ({ ...f, FIRMA_YETKILISI: e.target.value }))}
                  placeholder="KENAN TEKİN" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>E-Posta</label>
                  <input value={form.MAIL_ADRESI} onChange={e => setForm(f => ({ ...f, MAIL_ADRESI: e.target.value }))}
                    placeholder="info@firma.com.tr" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Telefon</label>
                  <input value={form.TELEFON_NUMARASI} onChange={e => setForm(f => ({ ...f, TELEFON_NUMARASI: e.target.value }))}
                    placeholder="05321234567" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Açıklama</label>
                <textarea value={form.ACIKLAMA} onChange={e => setForm(f => ({ ...f, ACIKLAMA: e.target.value }))}
                  rows={3} placeholder="Opsiyonel açıklama..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>İptal</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                <SaveOutlined style={{ marginRight: 6 }} />{saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 550, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Kayıt Detayı</h3>
              <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}><CloseOutlined /></button>
            </div>
            <div style={{ padding: 24 }}>
              {[
                ['ID', detailItem.ID],
                ['Tip', tipLabel(detailItem.TIP)],
                ['Malzeme/Hizmet Grubu', detailItem.MALZEME_VEYA_HIZMET_GRUBU || detailItem.MALZEME_HIZMET_GRUBU],
                ['Cari Kodu', detailItem.TEDARIKCI_CARI_KODU],
                ['Tedarikçi Unvanı', detailItem.TEDARIKCI_UNVANI],
                ['Firma Yetkilisi', detailItem.FIRMA_YETKILISI],
                ['E-Posta', detailItem.MAIL_ADRESI],
                ['Telefon', detailItem.TELEFON_NUMARASI],
                ['Açıklama', detailItem.ACIKLAMA],
                ['Oluşturma Tarihi', detailItem.OLUSTURMA_TARIHI ? new Date(detailItem.OLUSTURMA_TARIHI).toLocaleString('tr-TR') : '-'],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ width: 160, fontWeight: 600, color: '#64748b', fontSize: 13, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: '#1e293b', fontSize: 13, wordBreak: 'break-word' }}>{value || '-'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => { handleEdit(detailItem); setDetailItem(null); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <EditOutlined style={{ marginRight: 6 }} />Düzenle
              </button>
              <button onClick={() => setDetailItem(null)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 400, padding: 32, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Kaydı Sil</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>İptal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TedarikciKategori;
