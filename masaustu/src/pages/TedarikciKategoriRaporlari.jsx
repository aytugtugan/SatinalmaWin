import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Label,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { SwitchableChart } from '../components/SwitchableChart';
import {
  BarChartOutlined, PieChartFilled, ReloadOutlined,
  TeamOutlined, TagsOutlined, WarningOutlined, SwapOutlined,
  SearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getRaporIstatistik, getRaporKategoriOzet, getRaporTipDagilimi,
  getRaporTedarikciProfil, getRaporEksikBilgi, getRaporCokluKategori,
  getRaporKategoriKarsilastirma, getRaporKategoriListesi,
  getTedarikciKategoriler,
} from '../api/tedarikciKategoriApi';

const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

const RADIAN = Math.PI / 180;
const fmtShort = (val) => {
  if (!val && val !== 0) return '0';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
  return val.toLocaleString('tr-TR');
};
const renderCombinedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  if (percent < 0.03) return null;
  const ri = outerRadius * 0.6;
  const xi = cx + ri * Math.cos(-midAngle * RADIAN);
  const yi = cy + ri * Math.sin(-midAngle * RADIAN);
  const ro1 = outerRadius + 8;
  const ro2 = outerRadius + 30;
  const x1 = cx + ro1 * Math.cos(-midAngle * RADIAN);
  const y1 = cy + ro1 * Math.sin(-midAngle * RADIAN);
  const x2 = cx + ro2 * Math.cos(-midAngle * RADIAN);
  const y2 = cy + ro2 * Math.sin(-midAngle * RADIAN);
  const anchor = x2 > cx ? 'start' : 'end';
  const shortName = name ? (name.length > 10 ? name.substring(0, 10) + '..' : name) : '';
  return (
    <g>
      {percent >= 0.10 ? (
        <g>
          <text x={xi} y={yi - 8} fill="#fff" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 10, fontWeight: 600 }}>
            {shortName}
          </text>
          <text x={xi} y={yi + 8} fill="#fff" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {fmtShort(value)}
          </text>
        </g>
      ) : percent > 0.05 ? (
        <text x={xi} y={yi} fill="#fff" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {fmtShort(value)}
        </text>
      ) : null}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1} />
      <text x={x2 + (anchor === 'start' ? 4 : -4)} y={y2} fill="#374151"
        textAnchor={anchor} dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700 }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

const tipLabel = (v) => {
  if (!v) return '-';
  if (v === 'D') return 'Direkt';
  if (v === 'E') return 'Endirekt';
  return v;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label || payload[0]?.name}</div>
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
          <span>{e.name}:</span>
          <span style={{ fontWeight: 600 }}>{e.value?.toLocaleString('tr-TR')}</span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, icon, children, style, headerRight }) => (
  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {title}</h3>
      {headerRight}
    </div>
    <div style={{ padding: '16px 20px' }}>{children}</div>
  </div>
);

const ErrorBox = ({ message }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
    <ExclamationCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
    <div>{message || 'Veri yüklenirken hata oluştu'}</div>
  </div>
);

const NoData = () => <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Veri bulunamadı</div>;

/* ============ ÖZET TAB ============ */
const OzetTab = ({ istatistik, istatistikErr, tipData, tipErr, kategoriOzet, kategoriOzetErr }) => {
  const [chartMode, setChartMode] = useState('bar');
  const [expandedKategori, setExpandedKategori] = useState(false);

  return (
    <div>
      {/* KPI Cards */}
      {istatistikErr ? <ErrorBox message={istatistikErr} /> : istatistik && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Toplam Tedarikçi', value: istatistik.toplam_kayit, color: '#8b5cf6', icon: <TagsOutlined /> },
            { label: 'Benzersiz Tedarikçi', value: istatistik.benzersiz_tedarikci, color: '#3b82f6', icon: <TeamOutlined /> },
            { label: 'Benzersiz Tedarikçi Kategorisi', value: istatistik.benzersiz_kategori, color: '#10b981', icon: <TagsOutlined /> },
            { label: 'Benzersiz Tip', value: istatistik.benzersiz_tip, color: '#f59e0b', icon: <SwapOutlined /> },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: c.color + '15', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{c.value?.toLocaleString('tr-TR') ?? '-'}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* TIP Dağılımı */}
        <ChartCard title="Tip Dağılımı" icon={<PieChartFilled />}>
          {tipErr ? <ErrorBox message={tipErr} /> : tipData?.length > 0 ? (
            <SwitchableChart
              title="Tip Dağılımı"
              data={tipData}
              dataKey="kayit_sayisi"
              nameKey="tip"
              defaultType="pie"
              valueFormatter={(v) => String(v)}
              height={340}
              showPct={true}
            />
          ) : <NoData />}
        </ChartCard>

        {/* Kategori Özet */}
        <ChartCard title="Kategori Bazlı Tedarikçi Sayısı" icon={<BarChartOutlined />}
          headerRight={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                <button onClick={() => setChartMode('bar')}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14,
                    background: chartMode === 'bar' ? '#8b5cf6' : 'transparent', color: chartMode === 'bar' ? '#fff' : '#64748b' }}>
                  <BarChartOutlined />
                </button>
                <button onClick={() => setChartMode('pie')}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14,
                    background: chartMode === 'pie' ? '#8b5cf6' : 'transparent', color: chartMode === 'pie' ? '#fff' : '#64748b' }}>
                  <PieChartFilled />
                </button>
              </div>
              <button onClick={() => setExpandedKategori(s => !s)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: expandedKategori ? '#8b5cf6' : '#fff', color: expandedKategori ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                {expandedKategori ? 'Kapat' : 'Tümünü Gör'}
              </button>
            </div>
          }
        >
          {kategoriOzetErr ? <ErrorBox message={kategoriOzetErr} /> : kategoriOzet?.length > 0 ? (
            chartMode === 'pie' ? (
              <SwitchableChart
                title="Kategori Bazlı Tedarikçi Sayısı"
                data={kategoriOzet}
                dataKey="tedarikci_sayisi"
                nameKey="kategori"
                defaultType="pie"
                valueFormatter={(v) => String(v)}
                height={340}
                showPct={true}
                maxPieItems={10}
                expanded={expandedKategori}
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={kategoriOzet.slice(0, 15)} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="kategori" tick={{ fontSize: 10, fill: '#6a6d70' }} angle={-45} textAnchor="end" height={80} tickLine={false}
                    tickFormatter={v => v?.length > 15 ? v.substring(0, 15) + '...' : v} />
                  <YAxis tick={{ fontSize: 11, fill: '#6a6d70' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="tedarikci_sayisi" name="Tedarikçi Sayısı" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {kategoriOzet.slice(0, 15).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : <NoData />}
        </ChartCard>
      </div>
    </div>
  );
};

/* ============ TEDARİKÇİ PROFİL TAB ============ */
const ProfilTab = () => {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const [profil, setProfil] = useState(null);
  const [profilErr, setProfilErr] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const [dropdownRect, setDropdownRect] = React.useState(null);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSug(true);
      // Dropdown konumunu güncelle
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
      try {
        const res = await getTedarikciKategoriler({ search: q, limit: 15 });
        const items = res.data || [];
        const unique = [...new Map(items.map(it => [it.TEDARIKCI_UNVANI, it])).values()];
        setSuggestions(unique.slice(0, 10));
        setShowDropdown(unique.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSug(false);
      }
    }, 300);
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setInputVal(q);
    fetchSuggestions(q);
  };

  const handleSelect = (item) => {
    setInputVal(item.TEDARIKCI_UNVANI || '');
    setSuggestions([]);
    setShowDropdown(false);
    doSearch(item.TEDARIKCI_UNVANI || '');
  };

  const doSearch = async (unvan) => {
    const q = (unvan || inputVal).trim();
    if (!q) return;
    setSearching(true);
    setProfilErr(null);
    setProfil(null);
    try {
      const res = await getRaporTedarikciProfil({ unvan: q });
      // res.data may be the profil object if IPC wraps correctly
      const profileData = res?.data ?? res;
      if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
        setProfil(profileData);
      } else {
        setProfilErr('Tedarikçi bulunamadı');
      }
    } catch (err) {
      setProfilErr(err?.message || 'Bir hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  // Güvenli kategoriler çıkarma — API [{kategori,tip}] veya string döndürebilir
  const getKategoriler = (p) => {
    if (!p) return [];
    if (Array.isArray(p.kategoriler)) return p.kategoriler.map(k => typeof k === 'string' ? { kategori: k, tip: '' } : k);
    if (typeof p.kategoriler === 'string' && p.kategoriler) return p.kategoriler.split(',').map(s => ({ kategori: s.trim(), tip: '' }));
    return [];
  };

  return (
    <div>
      <ChartCard title="Tedarikçi Profil Sorgula" icon={<TeamOutlined />} style={{ overflow: 'visible' }}>
        <div ref={wrapperRef} style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter') { setShowDropdown(false); doSearch(); } if (e.key === 'Escape') setShowDropdown(false); }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    if (inputRef.current) {
                      const rect = inputRef.current.getBoundingClientRect();
                      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                    }
                    setShowDropdown(true);
                  }
                }}
                placeholder="Tedarikçi unvanı yazın (en az 2 harf)..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              />
              {loadingSug && (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 11 }}>
                  <ReloadOutlined spin />
                </span>
              )}
            </div>
            <button onClick={() => { setShowDropdown(false); doSearch(); }} disabled={searching}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <SearchOutlined style={{ marginRight: 6 }} />{searching ? 'Arıyor...' : 'Ara'}
            </button>
          </div>

          {/* Autocomplete dropdown — position:fixed overflow’dan kaçmak için */}
          {showDropdown && suggestions.length > 0 && dropdownRect && (
            <div style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 99999, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', maxHeight: 320, overflow: 'auto' }}>
              {suggestions.map((item, i) => (
                <div key={i} onMouseDown={() => handleSelect(item)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.TEDARIKCI_UNVANI}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {item.TEDARIKCI_CARI_KODU && <span style={{ marginRight: 8 }}>#{item.TEDARIKCI_CARI_KODU}</span>}
                    {item.MALZEME_VEYA_HIZMET_GRUBU && <span>{item.MALZEME_VEYA_HIZMET_GRUBU}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {profilErr ? (
          <ErrorBox message={profilErr} />
        ) : profil ? (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: 15 }}>
                {profil.tedarikci_unvani || profil.TEDARIKCI_UNVANI || '—'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8' }}>Cari Kodu: </span><strong>{profil.tedarikci_cari_kodu || profil.TEDARIKCI_CARI_KODU || '-'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>E-Posta: </span><strong>{profil.mail_adresi || profil.MAIL_ADRESI || '-'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Telefon: </span><strong>{profil.telefon_numarasi || profil.TELEFON_NUMARASI || '-'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Yetkili: </span><strong>{profil.firma_yetkilisi || profil.FIRMA_YETKILISI || '-'}</strong></div>
              </div>
            </div>
            {getKategoriler(profil).length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#64748b' }}>Bulunduğu Kategoriler ({getKategoriler(profil).length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {getKategoriler(profil).map((k, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 16, background: '#ede9fe', color: '#7c3aed', fontSize: 12, fontWeight: 500 }}>
                      {k.kategori || '-'}{k.tip ? <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>({k.tip === 'D' ? 'Direkt' : k.tip === 'E' ? 'Endirekt' : k.tip})</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Tedarikçi unvanı yazarak arama yapabilirsiniz (en az 2 harf)
          </div>
        )}
      </ChartCard>
    </div>
  );
};

/* ============ ANALİZ TAB ============ */
const AnalizTab = ({ eksikBilgi, eksikErr, cokluKategori, cokluErr }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {/* Eksik Bilgi */}
    <ChartCard title="Eksik İletişim Bilgisi Raporu" icon={<WarningOutlined />}>
      {eksikErr ? <ErrorBox message={eksikErr} /> : eksikBilgi ? (
        <div>
          {eksikBilgi.ozet && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              {Object.entries(eksikBilgi.ozet).map(([key, val], i) => (
                <div key={i} style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{val?.toLocaleString('tr-TR') ?? '-'}</div>
                  <div style={{ fontSize: 12, color: '#b91c1c', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')} eksik</div>
                </div>
              ))}
            </div>
          )}
          {eksikBilgi.eksik_kayitlar?.length > 0 && (
            <div style={{ fontSize: 13, maxHeight: 300, overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', position: 'sticky', top: 0, background: '#fff' }}>
                <span>Tedarikçi</span><span>Kategori</span><span>Mail</span><span>Telefon</span>
              </div>
              {eksikBilgi.eksik_kayitlar.slice(0, 50).map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.TEDARIKCI_UNVANI}>{item.TEDARIKCI_UNVANI}</span>
                  <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.MALZEME_VEYA_HIZMET_GRUBU || item.MALZEME_HIZMET_GRUBU || '-'}</span>
                  <span style={{ color: item.MAIL_ADRESI ? '#10b981' : '#ef4444' }}>{item.MAIL_ADRESI ? '✓' : '✗'}</span>
                  <span style={{ color: item.TELEFON_NUMARASI ? '#10b981' : '#ef4444' }}>{item.TELEFON_NUMARASI ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : <NoData />}
    </ChartCard>

    {/* Çoklu Kategori */}
    <ChartCard title="Çoklu Kategorideki Tedarikçiler" icon={<SwapOutlined />}>
      {cokluErr ? <ErrorBox message={cokluErr} /> : cokluKategori?.length > 0 ? (
        <div style={{ fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 3fr', gap: 8, padding: '8px 0', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', position: 'sticky', top: 0, background: '#fff' }}>
            <span>Tedarikçi</span><span>Kategori Sayısı</span><span>Kategoriler</span>
          </div>
          {cokluKategori.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 3fr', gap: 8, padding: '10px 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>{item.tedarikci_unvani || item.TEDARIKCI_UNVANI}</span>
              <span><span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>{item.kategori_sayisi}</span></span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{Array.isArray(item.kategoriler) ? item.kategoriler.join(', ') : (item.kategoriler || '-')}</span>
            </div>
          ))}
        </div>
      ) : <NoData />}
    </ChartCard>
  </div>
);

/* ============ KARŞILAŞTIRMA TAB ============ */
const KarsilastirmaTab = ({ kategoriListesi }) => {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [resultErr, setResultErr] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleCompare = async () => {
    if (!selected.trim() || selected.split(',').length < 2) return;
    setSearching(true);
    setResultErr(null);
    try {
      const res = await getRaporKategoriKarsilastirma({ kategoriler: selected.trim() });
      setResult(res.data || null);
    } catch (err) {
      setResultErr(err.message);
      setResult(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <ChartCard title="Kategori Karşılaştırma" icon={<SwapOutlined />}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>
            Virgülle ayrılmış en az 2 kategori girin
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={selected} onChange={e => setSelected(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCompare()}
              placeholder="SİTRİK ASİT,KARAMEL"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
            <button onClick={handleCompare} disabled={searching}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <SearchOutlined style={{ marginRight: 6 }} />{searching ? 'Arıyor...' : 'Karşılaştır'}
            </button>
          </div>
        </div>

        {kategoriListesi?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Mevcut kategoriler: </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, maxHeight: 80, overflow: 'auto' }}>
              {kategoriListesi.map((k, i) => (
                <span key={i} onClick={() => {
                  const arr = selected ? selected.split(',').map(s => s.trim()).filter(Boolean) : [];
                  if (!arr.includes(k)) setSelected([...arr, k].join(','));
                }}
                  style={{ padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {resultErr ? <ErrorBox message={resultErr} /> : result ? (
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#1e293b' }}>
              Ortak Tedarikçiler ({result.ortak_tedarikciler?.length || 0})
            </h4>
            {result.ortak_tedarikciler?.length > 0 ? (
              <div style={{ fontSize: 13 }}>
                {result.ortak_tedarikciler.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{t.tedarikci_unvani || t.TEDARIKCI_UNVANI}</span>
                    <span style={{ color: '#64748b' }}>{t.tedarikci_cari_kodu || t.TEDARIKCI_CARI_KODU || '-'}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Ortak tedarikçi bulunamadı</div>}
          </div>
        ) : <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Kategori seçip karşılaştırabilirsiniz</div>}
      </ChartCard>
    </div>
  );
};

/* ============ MAIN COMPONENT ============ */
const TedarikciKategoriRaporlari = () => {
  const [activeTab, setActiveTab] = useState('ozet');
  const [loading, setLoading] = useState(false);
  const [istatistik, setIstatistik] = useState(null);
  const [istatistikErr, setIstatistikErr] = useState(null);
  const [tipData, setTipData] = useState([]);
  const [tipErr, setTipErr] = useState(null);
  const [kategoriOzet, setKategoriOzet] = useState([]);
  const [kategoriOzetErr, setKategoriOzetErr] = useState(null);
  const [eksikBilgi, setEksikBilgi] = useState(null);
  const [eksikErr, setEksikErr] = useState(null);
  const [cokluKategori, setCokluKategori] = useState([]);
  const [cokluErr, setCokluErr] = useState(null);
  const [kategoriListesi, setKategoriListesi] = useState([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const safe = async (fn) => {
      try { return { data: await fn(), err: null }; }
      catch (e) { return { data: null, err: e.message }; }
    };
    const [ist, tip, kat, eks, cok, lis] = await Promise.all([
      safe(() => getRaporIstatistik()),
      safe(() => getRaporTipDagilimi()),
      safe(() => getRaporKategoriOzet()),
      safe(() => getRaporEksikBilgi()),
      safe(() => getRaporCokluKategori()),
      safe(() => getRaporKategoriListesi()),
    ]);

    console.log('=== TED KAT RAPOR RAW ===', { ist, tip, kat, eks, cok, lis });

    setIstatistik(ist.data?.data || null); setIstatistikErr(ist.err);
    setTipData(Array.isArray(tip.data?.data) ? tip.data.data.map(t => ({ ...t, tip: tipLabel(t.tip) })) : []); setTipErr(tip.err);
    setKategoriOzet(Array.isArray(kat.data?.data) ? kat.data.data : []); setKategoriOzetErr(kat.err);
    setEksikBilgi(eks.data?.data || null); setEksikErr(eks.err);
    setCokluKategori(Array.isArray(cok.data?.data) ? cok.data.data : []); setCokluErr(cok.err);
    setKategoriListesi(Array.isArray(lis.data?.data) ? lis.data.data : []); 
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs = [
    { key: 'ozet', icon: <BarChartOutlined />, label: 'Özet' },
    { key: 'profil', icon: <TeamOutlined />, label: 'Tedarikçi Profil' },
    { key: 'analiz', icon: <WarningOutlined />, label: 'Analiz' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChartOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Tedarikçi Kategori Raporları</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Tedarikçi kategori analiz ve raporları</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748b' }}>
          <ReloadOutlined spin={loading} /> Yenile
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#8b5cf6' : '#64748b',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && !istatistik ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#94a3b8', gap: 16 }}>
          <ReloadOutlined spin style={{ fontSize: 32 }} />
          <span>Raporlar yükleniyor...</span>
        </div>
      ) : (
        <>
          {activeTab === 'ozet' && <OzetTab istatistik={istatistik} istatistikErr={istatistikErr} tipData={tipData} tipErr={tipErr} kategoriOzet={kategoriOzet} kategoriOzetErr={kategoriOzetErr} />}
          {activeTab === 'profil' && <ProfilTab />}
          {activeTab === 'analiz' && <AnalizTab eksikBilgi={eksikBilgi} eksikErr={eksikErr} cokluKategori={cokluKategori} cokluErr={cokluErr} />}
        </>
      )}
    </div>
  );
};

export default TedarikciKategoriRaporlari;
