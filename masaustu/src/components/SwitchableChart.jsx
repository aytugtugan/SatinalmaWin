import React, { useState } from 'react';
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
const renderCombinedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  if (percent < 0.03) return null;
  // Dilim merkezi (tam pasta için outerRadius * 0.6)
  const ri = outerRadius * 0.6;
  const xi = cx + ri * Math.cos(-midAngle * RADIAN);
  const yi = cy + ri * Math.sin(-midAngle * RADIAN);
  // Dışarıda: % etiketi ve çizgi
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
            {formatNumber(value)}
          </text>
        </g>
      ) : percent > 0.05 ? (
        <text x={xi} y={yi} fill="#fff" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {formatNumber(value)}
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
  valueFormatter,
  height = 280,
  showLegend = false,
  sort = true, // new prop: whether to sort descending by dataKey
  expanded = false, // when true: force horizontal bars, dynamic height, full width
  showPct = false, // when true: show % breakdown list below chart
}) => {
  const [chartType, setChartType] = useState(defaultType);

  // When expanded, force horizontal and auto-calc height
  const effectiveType = expanded ? 'horizontal' : chartType;
  const effectiveHeight = expanded ? Math.max(400, (data?.length || 0) * 34) : height;

  // safe sorted copy (descending by numeric value of dataKey) when sort enabled
  const allSorted = Array.isArray(data)
    ? (sort ? [...data].sort((a, b) => toNumber(b[dataKey]) - toNumber(a[dataKey])) : [...data])
    : [];

  // Pasta grafik için top 10 + Diğer; diğer grafikler için tüm veri
  const sortedData = (() => {
    if (effectiveType !== 'pie' || allSorted.length <= 10) return allSorted;
    const top10 = allSorted.slice(0, 10);
    const rest = allSorted.slice(10);
    const otherVal = rest.reduce((s, d) => s + (toNumber(d[dataKey]) || 0), 0);
    return [...top10, { [nameKey]: 'Diğer (' + rest.length + ')', [dataKey]: otherVal }];
  })();

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

    switch (effectiveType) {
      case 'pie': {
        const pieTotal = sortedData.reduce((s, d) => s + (toNumber(d[dataKey]) || 0), 0);
        return (
          <>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 20, right: 70, bottom: 20, left: 70 }}>
                <Pie
                  data={sortedData}
                  dataKey={dataKey}
                  nameKey={nameKey}
                  cx="50%" cy="50%"
                  outerRadius={110}
                  paddingAngle={2} startAngle={90} endAngle={-270}
                  labelLine={false} label={renderCombinedLabel}
                >
                  {sortedData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip valueFormatter={formatter} />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ padding: '8px 12px 4px', borderTop: '1px solid #f1f5f9' }}>
              {sortedData.map((item, i) => {
                const val = toNumber(item[dataKey]);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < sortedData.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item[nameKey]}</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>{formatter(val)}</span>
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
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-type-selector">
          {CHART_TYPES.map((type) => (
            <button
              key={type.key}
              className={`chart-type-btn ${(expanded ? 'horizontal' : chartType) === type.key ? 'active' : ''}`}
              onClick={() => { if (!expanded) setChartType(type.key); }}
              title={type.label}
              style={expanded ? { opacity: 0.4, cursor: 'default' } : {}}
            >
              {type.icon}
            </button>
          ))}
        </div>
      </div>
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
