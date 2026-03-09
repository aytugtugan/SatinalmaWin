import React, { useState } from 'react';
import { SwitchableChart, formatNumber, formatCurrency } from '../components/SwitchableChart';
import CompareSwitch from '../components/CompareSwitch';
import ComparisonChart from '../components/ComparisonChart';
import { ShoppingCartOutlined, CalendarOutlined, UserSwitchOutlined, ClockCircleOutlined } from '@ant-design/icons';

const TOP_N = 10;

const ShowAllBtn = ({ show, onToggle, total }) => (
  <div style={{ textAlign: 'center', marginTop: -4, marginBottom: 16 }}>
    <button
      onClick={onToggle}
      style={{
        background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '6px 18px', cursor: 'pointer', fontSize: 12,
        color: '#3b82f6', fontWeight: 600, transition: 'all 0.15s ease',
      }}
    >
      {show ? `İlk ${TOP_N}'u Göster` : `Tümünü Gör (${total})`}
    </button>
  </div>
);

const SiparisAnaliz = ({ data, comparisonData = {}, selectedAmbar = 'all' }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAllDurum, setShowAllDurum] = useState(false);

  if (!data) return null;
  const { monthlyTrend, durum, summary, teslimatSuresi } = data;

  const trendData = (monthlyTrend || []).slice(0, 12).reverse().map(item => ({
    name: item.ay,
    value: item.siparisAdedi || item.kayitAdedi || 0,
  }));

  const tutarTrendData = (monthlyTrend || []).slice(0, 12).reverse().map(item => ({
    name: item.ay,
    value: item.toplamTutar || 0,
  }));

  const durumFull = (durum || []).map(item => ({
    name: item.durum,
    value: item.siparisAdedi || item.kayitAdedi || 0,
  }));
  const durumData = showAllDurum ? durumFull : durumFull.slice(0, TOP_N);

  return (
    <div>
      <div className="page-header">
        <h2>Sipariş Analizi</h2>
        <p>Sipariş süreçlerinin detaylı analizi ve performans takibi</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><ShoppingCartOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalSiparis || 0)}</div>
          <div className="kpi-label">Toplam Sipariş</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CalendarOutlined /></div>
          <div className="kpi-value">{trendData.length}</div>
          <div className="kpi-label">Aktif Ay Sayısı</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><UserSwitchOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalSiparis || 0)}</div>
          <div className="kpi-label">Toplam Sipariş</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><ClockCircleOutlined /></div>
          <div className="kpi-value">{teslimatSuresi?.ortalamaTeslimatSuresi || 0} Gün</div>
          <div className="kpi-label">Ort. Teslimat Süresi</div>
        </div>
      </div>

      <div style={{ padding: '0 32px 8px' }}>
        <CompareSwitch
          isVisible={selectedAmbar === 'all'}
          isCompareMode={isCompareMode}
          onToggle={() => setIsCompareMode(!isCompareMode)}
        />
      </div>

      <div className="charts-grid">
        {isCompareMode && selectedAmbar === 'all' ? (
          <>
            <ComparisonChart title="Fabrika Bazında Sipariş Adedi" comparisonData={comparisonData} metric="siparisAdedi" height={320} />
            <ComparisonChart title="Fabrika Bazında Sipariş Tutarı" comparisonData={comparisonData} metric="toplamTutar" valueFormatter={formatCurrency} height={320} />
            <ComparisonChart title="Fabrika Bazında Teslim Oranı (%)" comparisonData={comparisonData} metric="teslimOrani" valueFormatter={(v) => `${v}%`} height={320} />
          </>
        ) : (
          <>
            <SwitchableChart
              title="Aylık Sipariş Adedi Trendi"
              data={trendData}
              dataKey="value"
              nameKey="name"
              defaultType="bar"
              height={320}
              sort={false}
            />
            <SwitchableChart
              title="Aylık Sipariş Tutarı"
              data={tutarTrendData}
              dataKey="value"
              nameKey="name"
              defaultType="bar"
              valueFormatter={formatCurrency}
              height={320}
              sort={false}
              showPct={true}
            />
            <div style={showAllDurum ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Sipariş Durumu Dağılımı"
                data={durumData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                height={320}
                sort={false}
                expanded={showAllDurum}
              />
              {durumFull.length > TOP_N && <ShowAllBtn show={showAllDurum} onToggle={() => setShowAllDurum(v => !v)} total={durumFull.length} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SiparisAnaliz;
