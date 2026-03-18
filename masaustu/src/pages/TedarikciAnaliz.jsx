import React, { useState } from 'react';
import {    SwitchableChart, formatNumber, formatCurrency } from '../components/SwitchableChart';
import CompareSwitch from '../components/CompareSwitch';
import ComparisonChart from '../components/ComparisonChart';
import { TeamOutlined, WalletOutlined, ShoppingCartOutlined, CrownOutlined } from '@ant-design/icons';

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

const TedarikciAnaliz = ({ data, comparisonData = {}, selectedAmbar = 'all' }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAllTutar, setShowAllTutar] = useState(false);
  const [showAllAdet, setShowAllAdet] = useState(false);

  if (!data) return null;
  const { tedarikci, summary } = data;

  const byTutarDesc = (tedarikci || []).slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0));
  const byAdetDesc = (tedarikci || []).slice().sort((a, b) => (b.siparisAdedi || 0) - (a.siparisAdedi || 0));

  const tedarikciTutarFull = byTutarDesc.map(item => ({
    name: item.tedarikci?.substring(0, 25) || 'Belirsiz',
    value: item.toplamTutar,
  }));
  const tedarikciAdetFull = byAdetDesc.map(item => ({
    name: item.tedarikci?.substring(0, 25) || 'Belirsiz',
    value: item.siparisAdedi,
  }));

  const tedarikciTutarData = showAllTutar ? tedarikciTutarFull : tedarikciTutarFull.slice(0, TOP_N);
  const tedarikciAdetData = showAllAdet ? tedarikciAdetFull : tedarikciAdetFull.slice(0, TOP_N);

  const topTedarikci = byTutarDesc.length > 0 ? byTutarDesc[0] : null;
  const toplamTedarikciTutar = (tedarikci || []).reduce((sum, item) => sum + (item.toplamTutar || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>Tedarikçi Analizi</h2>
        <p>Tedarikçi performanslarının detaylı analizi ve karşılaştırması</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><TeamOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTedarikci || 0)}</div>
          <div className="kpi-label">Toplam Tedarikçi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><WalletOutlined /></div>
          <div className="kpi-value">{formatCurrency(toplamTedarikciTutar)}</div>
          <div className="kpi-label">Toplam Harcama</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><CrownOutlined /></div>
          <div className="kpi-value" style={{ fontSize: '16px' }}>
            {topTedarikci?.tedarikci?.substring(0, 18) || '-'}
          </div>
          <div className="kpi-label">En Büyük Tedarikçi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><ShoppingCartOutlined /></div>
          <div className="kpi-value">{formatCurrency(topTedarikci?.toplamTutar || 0)}</div>
          <div className="kpi-label">En Yüksek Harcama</div>
        </div>
      </div>

      <CompareSwitch
        isVisible={selectedAmbar === 'all'}
        isCompareMode={isCompareMode}
        onToggle={() => setIsCompareMode(!isCompareMode)}
      />

      <div className="charts-grid">
        {isCompareMode && selectedAmbar === 'all' ? (
          <>
            <ComparisonChart title="Fabrikalara Göre Toplam Tutar" comparisonData={comparisonData} metric="toplamTutar" valueFormatter={formatCurrency} height={360} />
            <ComparisonChart title="Fabrikalara Göre Sipariş Adedi" comparisonData={comparisonData} metric="siparisAdedi" valueFormatter={formatNumber} height={360} />
          </>
        ) : (
          <>
            <div style={showAllTutar ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Tedarikçilere Göre Toplam Tutar"
                data={tedarikciTutarData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                valueFormatter={formatCurrency}
                height={360}
                sort={false}
                expanded={showAllTutar}
                showPct={true}
              />
              {tedarikciTutarFull.length > TOP_N && (
                <ShowAllBtn
                  show={showAllTutar}
                  onToggle={() => setShowAllTutar(v => !v)}
                  total={tedarikciTutarFull.length}
                />
              )}
            </div>
            <div style={showAllAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Tedarikçilere Göre Sipariş Adedi"
                data={tedarikciAdetData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                height={360}
                sort={false}
                expanded={showAllAdet}
              />
              {tedarikciAdetFull.length > TOP_N && (
                <ShowAllBtn
                  show={showAllAdet}
                  onToggle={() => setShowAllAdet(v => !v)}
                  total={tedarikciAdetFull.length}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TedarikciAnaliz;
