import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChartOutlined,
  PieChartOutlined,
  MenuOutlined,
  InboxOutlined,
  ExpandOutlined,
  CloseOutlined,
} from '@ant-design/icons';

// Premium color palette
const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

const RADIAN = Math.PI / 180;

// Dış etiketler için (% ve çizgi)
const renderCombinedLabel = (count) => ({ cx, cy, midAngle, outerRadius, percent, index, name }) => {
  if (percent <= 0) return null;
  // Dışarıda: çizgi ve % etiketi; y-çakışmasını azaltmak için index bazlı küçük ofset
  const ro1 = outerRadius + 8;
  const ro2 = outerRadius + 44; // biraz daha geniş çek
  const x1 = cx + ro1 * Math.cos(-midAngle * RADIAN);
  const y1 = cy + ro1 * Math.sin(-midAngle * RADIAN);
  // daha dengeli bir y-ofset hesapla
  const spread = Math.max(6, Math.min(18, Math.floor(160 / Math.max(6, count))));
  const centerIndex = (count - 1) / 2;
  const idx = index - centerIndex;
  const yNudge = idx * spread * 0.25; // hafifçe yukarı/aşağı kaydır
  const x2 = cx + ro2 * Math.cos(-midAngle * RADIAN);
  const y2 = cy + ro2 * Math.sin(-midAngle * RADIAN) + yNudge;
  const anchor = x2 > cx ? 'start' : 'end';
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1} />
      <text x={x2 + (anchor === 'start' ? 6 : -6)} y={y2} fill="#374151"
        textAnchor={anchor} dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700 }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// Pasta dilimi içinde % yazısı
const renderPieLabelInner = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload, value }) => {
  if (percent <= 0) return null;
  const radius = (innerRadius + outerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const name = payload && (payload.name || payload[kNameSymbol] || payload.label || '');
  const rawVal = payload && (payload[dataKeySymbol] ?? payload.value ?? value);
  const valNum = toNumber(rawVal);
  const formatted = (typeof payloadFormatter === 'function') ? payloadFormatter(valNum) : formatNumber(valNum);

  // dynamic font sizing: larger slices get larger text, small slices get smaller but still visible
  const base = Math.max(8, Math.min(12, Math.round(10 + percent * 20)));
  const nameSize = Math.max(8, Math.min(11, base - 1));
  const valueSize = Math.max(9, Math.min(13, base + 1));

  const shortName = name ? (String(name).length > 18 ? String(name).substring(0, 18) + '…' : name) : '';

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      <tspan x={x} dy={-8} style={{ fontSize: nameSize, fontWeight: 700, fill: 'rgba(255,255,255,0.95)', pointerEvents: 'none' }}>
        {shortName}
      </tspan>
      <tspan x={x} dy={14} style={{ fontSize: valueSize, fontWeight: 800, fill: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
        {formatted} · {(percent * 100).toFixed(0)}%
      </tspan>
    </text>
  );
};

const CHART_TYPES = [
  { key: 'bar', icon: <BarChartOutlined />, label: 'Cubuk Grafik' },
  { key: 'pie', icon: <PieChartOutlined />, label: 'Pasta Grafik' },
  { key: 'horizontal', icon: <MenuOutlined />, label: 'Yatay Cubuk' },
];

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString('tr-TR');
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 TL';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Birim fiyat gibi küçük ondalıklı değerleri tam hassasiyetle gösterir.
 * 4.454245 → ₺4,454245 | 81.68 → ₺81,68 | 6500 → ₺6.500
 * Böylece kullanıcı Miktar × Birim Fiyat = Toplam doğrulaması yapabilir.
 */
const formatUnitPrice = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return '-';
  if (num % 1 === 0) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency', currency: 'TRY',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(num);
  }
  // 6 haneye kadar göster; trailing sıfırları kaldır
  // tr-TR'de ondalık ayırıcı virgüldür → "₺4,454200" → "₺4,4542"
  const raw = new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY',
    minimumFractionDigits: 2, maximumFractionDigits: 6,
  }).format(num);
  // Ondalık kısmı (virgülden sonrası) bul ve trailing sıfırları temizle
  const commaIdx = raw.lastIndexOf(',');
  if (commaIdx === -1) return raw;
  const intPart = raw.slice(0, commaIdx);
  const decPart = raw.slice(commaIdx + 1).replace(/0+$/, '');
  return decPart.length > 0 ? intPart + ',' + decPart : intPart;
};

const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        padding: '14px 18px',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
        minWidth: '160px',
        fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
        backdropFilter: 'blur(8px)',
      }}>
        <p style={{ 
          fontWeight: 600, 
          marginBottom: 8, 
          color: '#0f172a',
          fontSize: '13px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
          letterSpacing: '-0.01em',
        }}>
          {label || payload[0]?.name}
        </p>
        {payload.map((entry, index) => {
          // Normalize label: if recharts provides generic 'value' label, show 'Tutar'
          const rawLabel = entry.name || entry.dataKey || (entry.payload && entry.payload.name) || '';
          const label = (rawLabel && String(rawLabel).toLowerCase() === 'value') ? 'Tutar' : (rawLabel || 'Tutar');
          return (
            <p key={index} style={{ 
              color: entry.color || '#32363a', 
              margin: '6px 0',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <span style={{ color: '#6a6d70' }}>{label}:</span>
              <span style={{ fontWeight: 600 }}>
                {valueFormatter ? valueFormatter(entry.value) : formatNumber(entry.value)}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '14px',
      marginTop: '12px',
      fontSize: '12px',
      fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    }}>
      {payload?.map((entry, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: entry.color,
          }} />
          <span style={{ color: '#475569', fontWeight: 500 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// helper to coerce values to numbers for sorting
function toNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // remove currency symbols, commas, spaces
    const n = parseFloat(v.replace(/[^0-9.-]+/g, ''));
    return isNaN(n) ? 0 : n;
  }
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

const SwitchableChart = ({
  title,
  data = [],
  dataKey,
  nameKey,
  defaultType = 'bar',
  mode, // optional controlled mode
  onModeChange, // optional callback when mode changes
  valueFormatter,
  height = 280,
  showLegend = false,
  sort = true, // new prop: whether to sort descending by dataKey
  expanded = false, // when true: force horizontal bars, dynamic height, full width
  showPct = false, // when true: show % breakdown list below chart
  hideHeader = false, // when true: don't render internal header (used when embedded in ChartCard)
  maxPieItems, // optional: when set, limit pie rendering to top N items
}) => {
  const [chartType, setChartType] = useState(defaultType);
  // Başlangıçta tam ekran açık olmasın; kullanıcı isteğiyle açılacak
  const [isPieFullscreen, setIsPieFullscreen] = useState(false);

  // Pasta grafiği seçildiğinde tam ekran aç (ve dışarıya haber ver)
  const handleChartTypeChange = (type) => {
    setChartType(type);
    if (onModeChange) onModeChange(type);
    if (type === 'pie') {
      setIsPieFullscreen(true);
    } else {
      // pie dışına geçince modal açık ise kapat
      setIsPieFullscreen(false);
    }
  };

  // When expanded, increase height but don't force chart type change for pies.
  const effectiveChartType = typeof mode === 'string' ? mode : chartType;
  let effectiveType = effectiveChartType;
  if (expanded && effectiveChartType === 'bar') {
    effectiveType = 'horizontal';
  }
  const effectiveHeight = expanded ? Math.max(400, (data?.length || 0) * 34) : height;

  // safe sorted copy (descending by numeric value of dataKey) when sort enabled
  const allSorted = Array.isArray(data)
    ? (sort ? [...data].sort((a, b) => toNumber(b[dataKey]) - toNumber(a[dataKey])) : [...data])
    : [];

  // Pasta grafik için de tüm veri kullanılır (dilim gizlenmez)
  const sortedData = (() => {
    return allSorted;
  })();

  // Auto-expand pie when many slices so inner labels can fit
  useEffect(() => {
    const threshold = 12;
    // Eğer çok sayıda dilim varsa otomatik olarak tam ekran aç;
    // manuel kullanıcı eylemini (tek tıklama) burada kapatmayalım.
    if ((chartType === 'pie' || effectiveType === 'pie') && (sortedData?.length || 0) > threshold) {
      setIsPieFullscreen(true);
    }
  }, [sortedData?.length, chartType, effectiveType]);

  const renderChart = () => {
    if (!sortedData || sortedData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: effectiveHeight,
          color: '#94a3b8',
          fontSize: '13px',
          fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
        }}>
          <InboxOutlined style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }} />
          <span style={{ fontWeight: 500 }}>Veri bulunamadı</span>
        </div>
      );
    }

    const formatter = valueFormatter || formatNumber;

    // İç etiket: dilim içinde isim + miktar + % gösterir
    const renderPieLabelInner = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload, value }) => {
      if (percent <= 0) return null;

      const name = payload && (payload[nameKey] || payload.name || '');
      const rawVal = payload && (payload[dataKey] ?? payload.value ?? value);
      const valNum = toNumber(rawVal);
      const formatted = formatter(valNum);

      // radial position closer to outer edge
      const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      // rotate text parallel to slice direction
      let rotate = -midAngle;
      if (rotate > 90) rotate -= 180;
      if (rotate < -90) rotate += 180;

      // dynamic sizing for readability
      const nameSize = Math.max(9, Math.min(12, Math.round(10 + percent * 12)));
      const valueSize = Math.max(10, Math.min(14, Math.round(11 + percent * 12)));

      // Çok küçük dilimler için sadece miktar ve yüzde göster (isim kaldırılır)
      const smallSliceThreshold = 0.035; // %3.5'in altı -> sade gösterim
      if (percent < smallSliceThreshold) {
        return (
          <g transform={`translate(${x},${y}) rotate(${rotate})`}>
            <text x={0} y={0} fill="white" textAnchor="middle" dominantBaseline="central">
              <tspan x={0} dy={0} style={{ fontSize: valueSize, fontWeight: 800, fill: 'white' }}>
                {formatted}
              </tspan>
              <tspan x={0} dy={Math.max(12, valueSize + 6)} style={{ fontSize: Math.max(9, valueSize - 2), fontWeight: 700, fill: 'rgba(255,255,255,0.95)' }}>
                {(percent * 100).toFixed(0)}%
              </tspan>
            </text>
          </g>
        );
      }

      return (
        <g transform={`translate(${x},${y}) rotate(${rotate})`}>
          <text x={0} y={0} fill="white" textAnchor="middle" dominantBaseline="central">
            <tspan x={0} dy={-8} style={{ fontSize: nameSize, fontWeight: 700, fill: 'rgba(255,255,255,0.95)' }}>
              {String(name).length > 20 ? String(name).slice(0, 20) + '…' : name}
            </tspan>
            <tspan x={0} dy={14} style={{ fontSize: valueSize, fontWeight: 800, fill: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
              {formatted} · {(percent * 100).toFixed(0)}%
            </tspan>
          </text>
        </g>
      );
    };

    switch (effectiveType) {
      case 'pie': {
        // If expanded, show full data even if maxPieItems is set; otherwise limit to top N
        const pieData = (expanded || !(typeof maxPieItems === 'number' && maxPieItems > 0)) ? sortedData : sortedData.slice(0, maxPieItems);
        const pieTotal = pieData.reduce((s, d) => s + (toNumber(d[dataKey]) || 0), 0);

        const pieContent = (
          <ResponsiveContainer width="100%" height={isPieFullscreen ? 600 : 420}>
            <PieChart margin={{ top: 40, right: 100, bottom: 40, left: 100 }}>
              <Pie
                data={pieData}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%" cy="50%"
                outerRadius={isPieFullscreen ? 220 : 150}
                paddingAngle={0} startAngle={90} endAngle={-270}
                labelLine={false}
                label={renderPieLabelInner}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip valueFormatter={formatter} />} />
            </PieChart>
          </ResponsiveContainer>
        );

        if (isPieFullscreen) {
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                width: '95vw',
                height: '95vh',
                maxWidth: '1400px',
                maxHeight: '900px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {/* Modal Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#f8fafc',
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {title}
                  </h2>
                  <button
                    onClick={() => setIsPieFullscreen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '24px',
                      color: '#6a6d70',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CloseOutlined />
                  </button>
                </div>

                {/* Modal Body - Flex Layout */}
                <div style={{
                  display: 'flex',
                  flex: 1,
                  overflow: 'hidden',
                  minHeight: 0,
                }}>
                  {/* Left: Chart */}
                  <div style={{
                    flex: '1.2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    padding: '20px',
                  }}>
                    {pieContent}
                  </div>

                  {/* Right: Legend with Details */}
                  <div style={{
                    flex: '0.8',
                    borderLeft: '1px solid #f1f5f9',
                    overflow: 'auto',
                    padding: '20px',
                    background: '#fafbfc',
                  }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Detaylı Bilgi
                    </h4>
                    {pieData.map((item, i) => {
                      const val = toNumber(item[dataKey]);
                      const pct = pieTotal > 0 ? (val / pieTotal) * 100 : 0;
                      return (
                        <div key={i} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '12px',
                          marginBottom: '8px',
                          background: '#fff',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
                          borderTop: '1px solid #e2e8f0',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <span style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              fontWeight: 700,
                              width: '20px',
                              textAlign: 'center',
                            }}>
                              #{i + 1}
                            </span>
                            <span style={{
                              flex: 1,
                              fontSize: '12px',
                              color: '#1e293b',
                              fontWeight: 600,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}>
                              {item[nameKey]}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '11px',
                          }}>
                            <span style={{ color: '#6a6d70' }}>Miktar:</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatter(val)}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '11px',
                          }}>
                            <span style={{ color: '#6a6d70' }}>Oran:</span>
                            <span style={{ fontWeight: 700, color: '#3b82f6' }}>{pct.toFixed(2)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <>
            {pieContent}
            <div style={{ padding: '8px 12px 4px', borderTop: '1px solid #f1f5f9', maxHeight: 500, overflowY: 'auto' }}>
              {pieData.map((item, i) => {
                const val = toNumber(item[dataKey]);
                const pct = pieTotal > 0 ? (val / pieTotal) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < sortedData.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: '#1e293b', whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: 500 }}>{item[nameKey]}</span>
                    <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textAlign: 'right', width: 44, flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textAlign: 'right', width: 96, flexShrink: 0 }}>{formatter(val)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }

      case 'horizontal':
        return (
          <ResponsiveContainer width="100%" height={effectiveHeight}>
            <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={formatter} 
                tick={{ fontSize: 11, fill: '#6a6d70', fontFamily: "'72', 'Segoe UI', sans-serif" }}
                axisLine={{ stroke: '#f1f5f9' }}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey={nameKey} 
                tick={{ fontSize: 11, fill: '#6a6d70', fontFamily: "'72', 'Segoe UI', sans-serif" }} 
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip valueFormatter={formatter} />} />
              <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={28}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={effectiveHeight}>
            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fontSize: 11, fill: '#6a6d70', fontFamily: "'72', 'Segoe UI', sans-serif" }} 
                angle={-45} 
                textAnchor="end"
                height={70}
                axisLine={{ stroke: '#f1f5f9' }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatter} 
                tick={{ fontSize: 11, fill: '#6a6d70', fontFamily: "'72', 'Segoe UI', sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip valueFormatter={formatter} />} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={45}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const pctTotal = (showPct || effectiveType === 'pie') ? sortedData.reduce((s, d) => s + (toNumber(d[dataKey]) || 0), 0) : 0;

  return (
    <div className={`chart-card${expanded ? ' full-width' : ''}`}>
      {!hideHeader && (
        <div className="chart-header">
          <h3>{title}</h3>
          <div className="chart-type-selector" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {CHART_TYPES.map((type) => (
              <button
                key={type.key}
                className={`chart-type-btn ${(expanded ? 'horizontal' : effectiveChartType) === type.key ? 'active' : ''}`}
                onClick={() => { if (!expanded) handleChartTypeChange(type.key); }}
                title={type.label}
                style={expanded ? { opacity: 0.4, cursor: 'default' } : {}}
              >
                {type.icon}
              </button>
            ))}
            {/* Tek tıklamayla tam ekrana geçiş için ayrı buton (pie view için çalışır) */}
            <button
              className={`chart-type-btn expand-btn`}
              onClick={() => {
                if (expanded) return;
                // Eğer şu an pie değilse önce pie'ı seç, sonra fullscreen aç
                if ((typeof mode === 'string' ? mode : chartType) !== 'pie') {
                  setChartType('pie');
                  if (onModeChange) onModeChange('pie');
                }
                setIsPieFullscreen(true);
              }}
              title="Tam Ekran"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ExpandOutlined />
            </button>
          </div>
        </div>
      )}
      <div className="chart-body">
        {renderChart()}
      </div>
      {showPct && effectiveType !== 'pie' && sortedData.length > 0 && (
        <div style={{ padding: '0 16px 12px', borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
          {sortedData.map((item, i) => {
            const val = toNumber(item[dataKey]) || 0;
            const pct = pctTotal > 0 ? (val / pctTotal) * 100 : 0;
            const formatter = valueFormatter || formatNumber;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < sortedData.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: COLORS[i % COLORS.length] }} />
                <span style={{ flex: 1, fontSize: 11, color: '#44474a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{item[nameKey]}</span>
                <div style={{ width: 80, background: '#f1f5f9', borderRadius: 4, height: 6, flexShrink: 0, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', width: 38, textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                <span style={{ fontSize: 11, color: '#6a6d70', width: 90, textAlign: 'right', flexShrink: 0 }}>{formatter(val)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { SwitchableChart, formatNumber, formatCurrency, formatUnitPrice, COLORS };
