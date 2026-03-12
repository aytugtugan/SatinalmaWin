import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Label,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  TrophyOutlined, BarChartOutlined, PieChartFilled,
  LeftOutlined, RightOutlined, CloseOutlined, EnvironmentOutlined,
  SwapOutlined, DollarOutlined, ThunderboltOutlined, CrownOutlined,
  FireOutlined, AimOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
  getRaporOzet, getRaporLokasyon, getRaporTedarikci,
  getRaporRekabet, getRaporTrend, getRaporTasarruf,
  getLokasyonlar,
} from '../api/ihaleApi';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

const fmtCurrency = (val) => {
  if (!val && val !== 0) return '₺0';
  return '₺' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

const fmtShort = (val) => {
  if (!val && val !== 0) return '0';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
  return val.toLocaleString('tr-TR');
};

const RADIAN = Math.PI / 180;
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

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label || payload[0]?.name}</div>
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
          <span>{e.name || 'Deger'}:</span>
          <span style={{ fontWeight: 600 }}>{formatter ? formatter(e.value) : e.value?.toLocaleString('tr-TR')}</span>
        </div>
      ))}
    </div>
  );
};

const ChartSwitch = ({ mode, setMode, types = ['bar', 'pie'] }) => (
  <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
    {types.includes('bar') && (
      <button onClick={() => setMode('bar')}
        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14,
          background: mode === 'bar' ? '#3b82f6' : 'transparent', color: mode === 'bar' ? '#fff' : '#64748b' }}>
        <BarChartOutlined />
      </button>
    )}
    {types.includes('pie') && (
      <button onClick={() => setMode('pie')}
        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14,
          background: mode === 'pie' ? '#3b82f6' : 'transparent', color: mode === 'pie' ? '#fff' : '#64748b' }}>
        <PieChartFilled />
      </button>
    )}
  </div>
);

const AY_ISIM = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/* ============ KPI Cards ============ */
const KpiCards = ({ ozet, onCardClick }) => {
  const cards = [
    { key: 'toplam', icon: <TrophyOutlined />, color: '#3b82f6', value: ozet?.toplam_ihale_sayisi?.toLocaleString('tr-TR') || '0', label: 'Toplam İhale' },
    { key: 'getiri', icon: <DollarOutlined />, color: '#10b981', value: fmtCurrency(ozet?.toplam_kazanc_tl), label: 'Toplam Getiri' },
    { key: 'ortalama', icon: <ThunderboltOutlined />, color: '#f59e0b', value: fmtCurrency(ozet?.ortalama_kazanc_tl), label: 'Ortalama' },
    { key: 'en_yuksek', icon: <CrownOutlined />, color: '#8b5cf6', value: fmtCurrency(ozet?.en_yuksek_kazanc?.tutar), label: 'En Yüksek', hasDetail: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
      {cards.map((c, i) => (
        <div key={i}
          onClick={() => c.hasDetail && onCardClick && onCardClick(c.key)}
          style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: c.hasDetail ? 'pointer' : 'default',
            transition: 'box-shadow 0.2s, transform 0.2s',
            ...(c.hasDetail ? { border: '1px solid transparent' } : {}),
          }}
          onMouseEnter={e => { if (c.hasDetail) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = c.color + '40'; } }}
          onMouseLeave={e => { if (c.hasDetail) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'transparent'; } }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: c.color + '15', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{c.value}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{c.label}{c.hasDetail ? ' ▸' : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============ Chart Card Wrapper ============ */
const ChartCard = ({ title, icon, children, style, headerRight }) => (
  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {title}</h3>
      {headerRight}
    </div>
    <div style={{ padding: '16px 20px' }}>{children}</div>
  </div>
);

/* ============ Legend Table ============ */
const LegendTable = ({ headers, rows }) => (
  <div style={{ padding: '0 20px 16px', fontSize: 13 }}>
    <div style={{ display: 'grid', gridTemplateColumns: `2fr ${headers.slice(1).map(() => '1fr').join(' ')}`, gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
      {headers.map((h, i) => <span key={i}>{h}</span>)}
    </div>
    {rows.map((row, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: `2fr ${headers.slice(1).map(() => '1fr').join(' ')}`, gap: 8, padding: '8px 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
        {row.map((cell, j) => <span key={j}>{cell}</span>)}
      </div>
    ))}
  </div>
);

/* ============ Generic Chart Renderer ============ */
const RenderChart = ({ data, mode, dataKey, nameKey, height = 280 }) => {
  if (!data?.length) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Veri bulunamadı</div>;

  // Pasta grafik: top 10 + Diğer
  const pieData = (() => {
    if (mode !== 'pie' || data.length <= 10) return data;
    const top10 = data.slice(0, 10);
    const rest = data.slice(10);
    const otherVal = rest.reduce((s, d) => s + (parseFloat(d[dataKey]) || 0), 0);
    return [...top10, { [nameKey]: 'Diğer (' + rest.length + ')', [dataKey]: otherVal }];
  })();

  if (mode === 'pie') {
    const pieTotal = pieData.reduce((s, d) => s + (parseFloat(d[dataKey]) || 0), 0);
    return (
      <>
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart margin={{ top: 20, right: 70, bottom: 20, left: 70 }}>
              <Pie data={pieData} dataKey={dataKey} nameKey={nameKey}
                cx="50%" cy="50%"
                outerRadius={110}
                paddingAngle={2} startAngle={90} endAngle={-270}
                labelLine={false} label={renderCombinedLabel}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={fmtCurrency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ padding: '8px 12px 4px', borderTop: '1px solid #f1f5f9' }}>
          {pieData.map((item, i) => {
            const val = parseFloat(item[dataKey]) || 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < pieData.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item[nameKey]}</span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>{fmtShort(val)}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // bar (default)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#6a6d70' }} angle={-45} textAnchor="end" height={70} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#6a6d70' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip formatter={fmtShort} />} />
        <Bar dataKey={dataKey} name="Getiri" radius={[4, 4, 0, 0]} maxBarSize={45}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ============ OZET TAB ============ */
const OzetTab = ({ ozet, lokasyonData, tedarikciData, trendData, trendYil, setTrendYil }) => {
  const [lokMode, setLokMode] = useState('bar');
  const [tedMode, setTedMode] = useState('bar');
  const [trendMode, setTrendMode] = useState('bar');
  const [showAllTed, setShowAllTed] = useState(false);
  const [kpiDetail, setKpiDetail] = useState(null);
  const sortedTedarikci = (tedarikciData || []).slice().sort((a, b) => (b.toplam_kazanc_tl || 0) - (a.toplam_kazanc_tl || 0));
  const visibleTedarikci = showAllTed ? sortedTedarikci : sortedTedarikci.slice(0, 10);

  const handleKpiClick = (key) => {
    if (key === 'en_yuksek' && ozet?.en_yuksek_kazanc) {
      setKpiDetail(ozet.en_yuksek_kazanc);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      <KpiCards ozet={ozet} onCardClick={handleKpiClick} />

      {/* KPI Detail Modal */}
      {kpiDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setKpiDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 520, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 14, opacity: 0.85 }}>En Yüksek Kazançlı İhale</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtCurrency(kpiDetail.tutar)}</div>
              </div>
              <button onClick={() => setKpiDetail(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 16 }}><CloseOutlined /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>MALZEME/HİZMET</div><div style={{ fontWeight: 600, color: '#1e293b' }}>{kpiDetail.malzeme || '-'}</div></div>
                <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>KAZANAN TEDARİKÇİ</div><div style={{ fontWeight: 600, color: '#059669' }}>{kpiDetail.kazanan_tedarikci || '-'}</div></div>
                <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>LOKASYON</div><div style={{ fontWeight: 500 }}><EnvironmentOutlined /> {kpiDetail.lokasyon || '-'}</div></div>
                <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>TARİH</div><div style={{ fontWeight: 500 }}>{formatDate(kpiDetail.tarih)}</div></div>
                {kpiDetail.siparis_numarasi && <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>SİPARİŞ NO</div><div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{kpiDetail.siparis_numarasi}</div></div>}
              </div>
              {/* Firmalar */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>TEKLİFLER</div>
                {[1,2,3,4,5].map(i => {
                  const firma = kpiDetail[`firma_${i}`];
                  const teklif = kpiDetail[`teklif_${i}_tl`];
                  if (!firma && !teklif) return null;
                  const kazandi = firma === kpiDetail.kazanan_tedarikci;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: 4, borderRadius: 8, background: kazandi ? '#f0fdf4' : '#f8fafc', border: kazandi ? '1px solid #86efac' : '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: kazandi ? 700 : 400, color: kazandi ? '#15803d' : '#1e293b' }}>{firma || '-'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{fmtCurrency(teklif)}</span>
                        {kazandi && <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Kazandı</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Lokasyon */}
        <ChartCard title="Lokasyon Getiri Dağılımı" headerRight={<ChartSwitch mode={lokMode} setMode={setLokMode} />}>
          <RenderChart data={lokasyonData} mode={lokMode} dataKey="toplam_kazanc_tl" nameKey="lokasyon" />
          {lokasyonData?.length > 0 && lokMode !== 'pie' && (
            <LegendTable headers={['Lokasyon', 'İhale', 'Getiri']}
              rows={lokasyonData.map((item, i) => [
                <span key="n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                  {i + 1}. {item.lokasyon}
                </span>,
                item.ihale_sayisi,
                <strong key="v">{fmtCurrency(item.toplam_kazanc_tl)}</strong>,
              ])}
            />
          )}
        </ChartCard>

        {/* Tedarikçi */}
          <ChartCard title="Tedarikçi Kazanç Dağılımı" headerRight={<ChartSwitch mode={tedMode} setMode={setTedMode} />}>
          <RenderChart data={visibleTedarikci} mode={tedMode} dataKey="toplam_kazanc_tl" nameKey="kazanan_tedarikci" />
          {sortedTedarikci?.length > 0 && tedMode !== 'pie' && (
            <>
              <LegendTable headers={['Tedarikçi', 'Adet', 'Kazanç']}
                rows={visibleTedarikci.map((item, i) => [
                  <span key="n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {i + 1}. {item.kazanan_tedarikci}
                  </span>,
                  <span key="a" style={{ fontWeight: 600 }}>{item.kazandigi_ihale_sayisi} ihale</span>,
                  <strong key="v">{fmtCurrency(item.toplam_kazanc_tl)}</strong>,
                ])}
              />
              {sortedTedarikci.length > 10 && (
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <button onClick={() => setShowAllTed(v => !v)}
                    style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {showAllTed ? 'İlk 10\'u Göster' : `Tümünü Gör (${sortedTedarikci.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </ChartCard>
      </div>

      {/* Trend */}
      <ChartCard title="Aylık Trend" icon={<BarChartOutlined />}
        headerRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setTrendYil(y => y - 1)} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><LeftOutlined /></button>
              <span style={{ minWidth: 50, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{trendYil}</span>
              <button onClick={() => setTrendYil(y => y + 1)} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><RightOutlined /></button>
            </div>
            <ChartSwitch mode={trendMode} setMode={setTrendMode} />
          </div>
        }
      >
        <RenderChart data={trendData} mode={trendMode} dataKey="toplam_kazanc_tl" nameKey="ay_isim" height={300} />
        {trendData?.length > 0 && trendMode !== 'pie' && (
          <LegendTable headers={['Ay', 'İhale', 'Getiri']}
            rows={trendData.map((item, i) => [
              <span key="n" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                {item.ay_isim}
              </span>,
              item.ihale_sayisi,
              <strong key="v">{fmtCurrency(item.toplam_kazanc_tl)}</strong>,
            ])}
          />
        )}
      </ChartCard>
    </div>
  );
};

/* ============ REKABET TAB ============ */
const RekabeTab = ({ rekabeData }) => {
  const pairs = rekabeData || [];
  const chartData = pairs.slice(0, 10).map(p => ({
    isim: (p.firma_a?.length > 12 ? p.firma_a.substring(0, 12) + '..' : p.firma_a) + ' vs ' + (p.firma_b?.length > 12 ? p.firma_b.substring(0, 12) + '..' : p.firma_b),
    sayi: p.kac_ihalede_karsilastilar,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ChartCard title="En Çok Karşılaşan Firmalar" icon={<BarChartOutlined />}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="isim" tick={{ fontSize: 10, fill: '#6a6d70' }} angle={-35} textAnchor="end" height={80} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6a6d70' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="sayi" name="Karşılaşma" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Veri bulunamadı</div>}
      </ChartCard>

      <ChartCard title="İkili Firma Karşılaşmaları" icon={<SwapOutlined />}>
        <div style={{ fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 2fr 1fr', gap: 8, padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
            <span>#</span><span>Firma A</span><span>Firma B</span><span>Karşılaşma</span>
          </div>
          {pairs.length > 0 ? pairs.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 2fr 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>{i + 1}.</span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>{p.firma_a}</span>
              <span style={{ fontWeight: 500, color: '#1e293b' }}>{p.firma_b}</span>
              <span><span style={{ background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>{p.kac_ihalede_karsilastilar}</span></span>
            </div>
          )) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Veri bulunamadı</div>}
        </div>
      </ChartCard>
    </div>
  );
};

/* ============ TASARRUF TAB ============ */
const TasarrufTab = ({ tasarrufData }) => (
  <div>
    <ChartCard title="Tasarruf Analizi" icon={<AimOutlined />}>
      {tasarrufData?.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasarrufData.slice(0, 10)} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="malzeme_hizmet" tick={{ fontSize: 10, fill: '#6a6d70' }} angle={-45} textAnchor="end" height={80} tickLine={false}
                tickFormatter={v => v?.length > 20 ? v.substring(0, 20) + '...' : v} />
              <YAxis tick={{ fontSize: 11, fill: '#6a6d70' }} axisLine={false} tickLine={false} tickFormatter={v => '%' + v} />
              <Tooltip content={<ChartTooltip formatter={v => '%' + v} />} />
              <Bar dataKey="tasarruf_orani_yuzde" name="Tasarruf Oranı %" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {tasarrufData.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ fontSize: 13, marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '35px 2fr 1.5fr 1fr 1fr 80px', gap: 8, padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
              <span>#</span><span>Malzeme/Hizmet</span><span>Kazanan</span><span>En Yüksek Teklif</span><span>Kazanç</span><span>Tasarruf</span>
            </div>
            {tasarrufData.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '35px 2fr 1.5fr 1fr 1fr 80px', gap: 8, padding: '10px 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{i + 1}.</span>
                <span style={{ fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.malzeme_hizmet}>
                  {item.malzeme_hizmet}
                </span>
                <span style={{ color: '#64748b' }}>{item.kazanan_tedarikci || '-'}</span>
                <span style={{ color: '#64748b' }}>{fmtCurrency(item.en_yuksek_teklif_tl)}</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{fmtCurrency(item.kazanc_tutari_tl)}</span>
                <span style={{
                  fontWeight: 700, fontSize: 13,
                  color: item.tasarruf_orani_yuzde > 20 ? '#10b981' : item.tasarruf_orani_yuzde > 10 ? '#f59e0b' : '#64748b',
                }}>
                  %{item.tasarruf_orani_yuzde}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Veri bulunamadı</div>}
    </ChartCard>
  </div>
);

/* ============ MAIN COMPONENT ============ */
const IhaleRaporlari = ({ selectedAmbar = '' }) => {
  const [activeTab, setActiveTab] = useState('ozet');
  const [loading, setLoading] = useState(false);
  const [trendYil, setTrendYil] = useState(new Date().getFullYear());

  const [ozet, setOzet] = useState(null);
  const [lokasyonData, setLokasyonData] = useState([]);
  const [tedarikciData, setTedarikciData] = useState([]);
  const [rekabeData, setRekabeData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [tasarrufData, setTasarrufData] = useState([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (selectedAmbar && selectedAmbar !== 'all') params.lokasyon = selectedAmbar;
    try {
      const [ozetRes, lokRes, tedRes, rekRes, trendRes, tasRes] = await Promise.all([
        getRaporOzet(params).catch(e => { console.error('ozet err', e); return { data: {} }; }),
        getRaporLokasyon(params).catch(e => { console.error('lok err', e); return { data: [] }; }),
        getRaporTedarikci(params).catch(e => { console.error('ted err', e); return { data: [] }; }),
        getRaporRekabet(params).catch(e => { console.error('rek err', e); return { data: [] }; }),
        getRaporTrend({ ...params, yil: trendYil }).catch(e => { console.error('trend err', e); return { data: [] }; }),
        getRaporTasarruf(params).catch(e => { console.error('tas err', e); return { data: [] }; }),
      ]);

      console.log('=== RAPOR API RAW ===', { ozetRes, lokRes, tedRes, rekRes, trendRes, tasRes });

      setOzet(ozetRes.data || ozetRes || {});
      setLokasyonData(Array.isArray(lokRes.data) ? lokRes.data : (Array.isArray(lokRes) ? lokRes : []));
      setTedarikciData(Array.isArray(tedRes.data) ? tedRes.data : (Array.isArray(tedRes) ? tedRes : []));
      const rekRaw = rekRes.data || rekRes;
      setRekabeData(Array.isArray(rekRaw) ? rekRaw : (Array.isArray(rekRaw?.pairs) ? rekRaw.pairs : []));

      const rawTrend = Array.isArray(trendRes.data) ? trendRes.data : (Array.isArray(trendRes) ? trendRes : []);
      setTrendData(rawTrend.map(t => ({
        ...t,
        ay_isim: t.ay_isim || AY_ISIM[(t.ay || 1) - 1] || ('Ay ' + t.ay),
      })));

      setTasarrufData(Array.isArray(tasRes.data) ? tasRes.data : (Array.isArray(tasRes) ? tasRes : []));
    } catch (err) {
      console.error('Rapor yukleme hatasi:', err);
    } finally {
      setLoading(false);
    }
  }, [trendYil, selectedAmbar]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs = [
    { key: 'ozet', icon: <BarChartOutlined />, label: 'Özet' },
    { key: 'rekabet', icon: <FireOutlined />, label: 'Rekabet' },
    { key: 'tasarruf', icon: <AimOutlined />, label: 'Tasarruf' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChartOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>₺ İhale Raporları</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>İhale kazanç takip, analiz ve raporları</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={loadAll} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748b' }}>
            <ReloadOutlined spin={loading} /> Yenile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#3b82f6' : '#64748b',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && !ozet ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#94a3b8', gap: 16 }}>
          <ReloadOutlined spin style={{ fontSize: 32 }} />
          <span>Raporlar yükleniyor...</span>
        </div>
      ) : (
        <>
          {activeTab === 'ozet' && (
            <OzetTab ozet={ozet} lokasyonData={lokasyonData} tedarikciData={tedarikciData}
              trendData={trendData} trendYil={trendYil} setTrendYil={setTrendYil} />
          )}
          {activeTab === 'rekabet' && <RekabeTab rekabeData={rekabeData} />}
          {activeTab === 'tasarruf' && <TasarrufTab tasarrufData={tasarrufData} />}
        </>
      )}
    </div>
  );
};

export default IhaleRaporlari;
