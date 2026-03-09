import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { InboxOutlined } from '@ant-design/icons';

// Premium factory colors
const FACTORY_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
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

const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        padding: '12px 16px',
        border: '1px solid #f1f5f9',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        minWidth: '160px',
        fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
      }}>
        <p style={{ fontWeight: 600, marginBottom: 8, color: '#1a1d1f', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || '#32363a', margin: '5px 0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#6a6d70' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>{valueFormatter ? valueFormatter(entry.value) : formatNumber(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Fabrikaları karşılaştıran bar chart bileşeni (recharts)
 */
const ComparisonChart = ({
  title,
  comparisonData = {},
  metric = 'toplamTutar',
  valueFormatter,
  height = 320,
}) => {
  const formatter = valueFormatter || (metric === 'toplamTutar' ? formatCurrency : formatNumber);

  const factories = Object.keys(comparisonData);

  if (factories.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>{title}</h3>
          <span className="compare-badge">Karşılaştırma</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height, color: '#6a6d70', fontSize: '13px' }}>
          <InboxOutlined style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
          <span>Karşılaştırma verisi yok</span>
        </div>
      </div>
    );
  }

  // Recharts için data formatına çevir: [{ name: 'Fabrika', value: 123 }, ...]
  const chartData = factories
    .map((factory, idx) => ({
      name: factory,
      value: comparisonData[factory]?.[metric] || 0,
      color: FACTORY_COLORS[idx % FACTORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const totalValue = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        <span className="compare-badge">Karşılaştırma</span>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6a6d70', fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}
              axisLine={{ stroke: '#f1f5f9' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fontSize: 11, fill: '#6a6d70', fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip valueFormatter={formatter} />} />
            <Bar dataKey="value" name="Değer" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Fabrika listesi - toplam ve yüzde */}
        <div className="comparison-legend">
          {chartData.map((item, index) => {
            const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="comparison-legend-item">
                <div className="comparison-legend-left">
                  <span className="comparison-legend-dot" style={{ background: item.color }} />
                  <span className="comparison-legend-name">{item.name}</span>
                </div>
                <div className="comparison-legend-right">
                  <span className="comparison-legend-value">{formatter(item.value)}</span>
                  <span className="comparison-legend-pct">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
export { formatNumber, formatCurrency };
