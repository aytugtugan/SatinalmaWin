import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { InboxOutlined } from '@ant-design/icons';

const FACTORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316',
];

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('tr-TR');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#ffffff', padding: '12px 16px',
      border: '1px solid #f1f5f9', borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '180px',
      fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 8, color: '#1a1d1f', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '5px 0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ color: '#6a6d70' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>{formatNumber(entry.value)}</span>
        </p>
      ))}
      {/* teslim oranı'nı hesaplayıp tooltip'e ekle */}
      {payload.length >= 2 && (() => {
        const siparisVal = payload.find(p => p.dataKey === 'siparisAdedi')?.value || 0;
        const teslimVal = payload.find(p => p.dataKey === 'teslimEdilen')?.value || 0;
        const oran = siparisVal > 0 ? ((teslimVal / siparisVal) * 100).toFixed(1) : '0.0';
        return (
          <p style={{ margin: '7px 0 0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '7px' }}>
            <span style={{ color: '#6a6d70' }}>Teslim Oranı:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{oran}%</span>
          </p>
        );
      })()}
    </div>
  );
};

/**
 * Fabrika bazında Sipariş Adedi + Teslim Edilen + Teslim Oranı'nı
 * tek kart altında gösteren bileşen.
 */
const FabrikaTeslimKarsilastirma = ({ comparisonData = {}, height = 320 }) => {
  const factories = Object.keys(comparisonData);

  if (factories.length === 0) {
    return (
      <div className="chart-card" style={{ gridColumn: 'span 2' }}>
        <div className="chart-header">
          <h3>Fabrika Bazında Sipariş &amp; Teslimat</h3>
          <span className="compare-badge">Karşılaştırma</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height, color: '#6a6d70', fontSize: '13px' }}>
          <InboxOutlined style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
          <span>Karşılaştırma verisi yok</span>
        </div>
      </div>
    );
  }

  const chartData = factories.map((factory, idx) => {
    const fd = comparisonData[factory] || {};
    const siparis = fd.siparisAdedi || 0;
    const teslim = fd.teslimEdilen || 0;
    return {
      name: factory,
      siparisAdedi: siparis,
      teslimEdilen: teslim,
      teslimOrani: fd.teslimOrani || (siparis > 0 ? parseFloat(((teslim / siparis) * 100).toFixed(1)) : 0),
      color: FACTORY_COLORS[idx % FACTORY_COLORS.length],
    };
  }).sort((a, b) => b.siparisAdedi - a.siparisAdedi);

  return (
    <div className="chart-card" style={{ gridColumn: 'span 2' }}>
      <div className="chart-header">
        <h3>Fabrika Bazında Sipariş &amp; Teslimat</h3>
        <span className="compare-badge">Karşılaştırma</span>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }} barGap={4}>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#6a6d70', paddingTop: 8 }}
            />
            <Bar dataKey="siparisAdedi" name="Sipariş Adedi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="teslimEdilen" name="Teslim Edilen" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Özet tablo: Fabrika | Sipariş Adedi | Teslim | Oran */}
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: 12,
            fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Fabrika', 'Sipariş Adedi', 'Teslim Edilen', 'Teslim Oranı'].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right',
                    color: '#6a6d70', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: row.color, flexShrink: 0, display: 'inline-block',
                    }} />
                    <span style={{ fontWeight: 600, color: '#1a1d1f' }}>{row.name}</span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                    {formatNumber(row.siparisAdedi)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                    {formatNumber(row.teslimEdilen)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                      background: row.teslimOrani >= 80 ? '#dcfce7' : row.teslimOrani >= 50 ? '#fef9c3' : '#fee2e2',
                      color: row.teslimOrani >= 80 ? '#15803d' : row.teslimOrani >= 50 ? '#a16207' : '#991b1b',
                      fontWeight: 700, fontSize: 11,
                    }}>
                      {row.teslimOrani}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Genel toplam satırı */}
            {chartData.length > 1 && (() => {
              const totalSiparis = chartData.reduce((s, r) => s + r.siparisAdedi, 0);
              const totalTeslim = chartData.reduce((s, r) => s + r.teslimEdilen, 0);
              const totalOran = totalSiparis > 0 ? ((totalTeslim / totalSiparis) * 100).toFixed(1) : '0.0';
              return (
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1a1d1f' }}>Toplam</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>{formatNumber(totalSiparis)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{formatNumber(totalTeslim)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                        background: parseFloat(totalOran) >= 80 ? '#dcfce7' : parseFloat(totalOran) >= 50 ? '#fef9c3' : '#fee2e2',
                        color: parseFloat(totalOran) >= 80 ? '#15803d' : parseFloat(totalOran) >= 50 ? '#a16207' : '#991b1b',
                        fontWeight: 700, fontSize: 11,
                      }}>
                        {totalOran}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>
    </div>
  );
};

export default FabrikaTeslimKarsilastirma;
