import React, { useState } from 'react';
import { SwitchableChart, formatNumber, formatCurrency } from '../components/SwitchableChart';
import CompareSwitch from '../components/CompareSwitch';
import ComparisonChart from '../components/ComparisonChart';
import { UserOutlined, BankOutlined, RiseOutlined } from '@ant-design/icons';

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

const TalepAnaliz = ({ data, comparisonData = {}, selectedAmbar = 'all' }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAllTalepAdet, setShowAllTalepAdet] = useState(false);
  const [showAllTalepTutar, setShowAllTalepTutar] = useState(false);
  const [showAllMasrafAdet, setShowAllMasrafAdet] = useState(false);
  const [showAllMasrafTutar, setShowAllMasrafTutar] = useState(false);

  if (!data) return null;
  const { talepEden, masrafMerkezi, summary } = data;

  const sortedTalepAdet = (talepEden || []).slice().sort((a, b) => (b.talepAdedi || b.siparisAdedi || 0) - (a.talepAdedi || a.siparisAdedi || 0));
  const sortedTalepTutar = (talepEden || []).slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0));
  const sortedMasrafAdet = (masrafMerkezi || []).slice().sort((a, b) => (b.siparisAdedi || b.kayitAdedi || 0) - (a.siparisAdedi || a.kayitAdedi || 0));
  const sortedMasrafTutar = (masrafMerkezi || []).slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0));

  const talepAdetFull = sortedTalepAdet.map(i => ({ name: i.talepEden?.substring(0, 20) || 'Belirsiz', value: i.talepAdedi || i.siparisAdedi || i.kayitAdedi || 0 }));
  const talepTutarFull = sortedTalepTutar.map(i => ({ name: i.talepEden?.substring(0, 20) || 'Belirsiz', value: i.toplamTutar || 0 }));
  const masrafAdetFull = sortedMasrafAdet.map(i => ({ name: i.masrafMerkezi?.substring(0, 22) || 'Belirsiz', value: i.siparisAdedi || i.kayitAdedi || i.talepAdedi || 0 }));
  const masrafTutarFull = sortedMasrafTutar.map(i => ({ name: i.masrafMerkezi?.substring(0, 22) || 'Belirsiz', value: i.toplamTutar || 0 }));

  const talepAdetData = showAllTalepAdet ? talepAdetFull : talepAdetFull.slice(0, TOP_N);
  const talepTutarData = showAllTalepTutar ? talepTutarFull : talepTutarFull.slice(0, TOP_N);
  const masrafAdetData = showAllMasrafAdet ? masrafAdetFull : masrafAdetFull.slice(0, TOP_N);
  const masrafTutarData = showAllMasrafTutar ? masrafTutarFull : masrafTutarFull.slice(0, TOP_N);

  return (
    <div>
      <div className="page-header">
        <h2>Talep Analizi</h2>
        <p>Talep süreçlerinin detaylı analizi ve performans metrikleri</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><UserOutlined /></div>
          <div className="kpi-value">{talepEden?.length || 0}</div>
          <div className="kpi-label">Talep Eden Kişi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><BankOutlined /></div>
          <div className="kpi-value">{masrafMerkezi?.length || 0}</div>
          <div className="kpi-label">Masraf Merkezi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><RiseOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTalep || 0)}</div>
          <div className="kpi-label">Toplam Talep</div>
        </div>
      </div>

      <div style={{ padding: '0 32px 8px' }}>
        <CompareSwitch isVisible={selectedAmbar === 'all'} isCompareMode={isCompareMode} onToggle={() => setIsCompareMode(!isCompareMode)} />
      </div>

      <div className="charts-grid">
        {isCompareMode && selectedAmbar === 'all' ? (
          <>
            <ComparisonChart title="Fabrika Bazında Talep Adedi" comparisonData={comparisonData} metric="talepAdedi" height={320} />
            <ComparisonChart title="Fabrika Bazında Toplam Tutar" comparisonData={comparisonData} metric="toplamTutar" valueFormatter={formatCurrency} height={320} />
          </>
        ) : (
          <>
            <div style={showAllTalepAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Talep Eden Kişilere Göre Adet" data={talepAdetData} dataKey="value" nameKey="name" defaultType="bar" height={320} sort={false} expanded={showAllTalepAdet} />
              {talepAdetFull.length > TOP_N && <ShowAllBtn show={showAllTalepAdet} onToggle={() => setShowAllTalepAdet(v => !v)} total={talepAdetFull.length} />}
            </div>
            <div style={showAllTalepTutar ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Talep Eden Kişilere Göre Tutar" data={talepTutarData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={320} sort={false} expanded={showAllTalepTutar} showPct={true} />
              {talepTutarFull.length > TOP_N && <ShowAllBtn show={showAllTalepTutar} onToggle={() => setShowAllTalepTutar(v => !v)} total={talepTutarFull.length} />}
            </div>
            <div style={showAllMasrafAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Masraf Merkezine Göre Kayıt Adedi" data={masrafAdetData} dataKey="value" nameKey="name" defaultType="bar" height={320} sort={false} expanded={showAllMasrafAdet} />
              {masrafAdetFull.length > TOP_N && <ShowAllBtn show={showAllMasrafAdet} onToggle={() => setShowAllMasrafAdet(v => !v)} total={masrafAdetFull.length} />}
            </div>
            <div style={showAllMasrafTutar ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Masraf Merkezine Göre Tutar" data={masrafTutarData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={320} sort={false} expanded={showAllMasrafTutar} showPct={true} />
              {masrafTutarFull.length > TOP_N && <ShowAllBtn show={showAllMasrafTutar} onToggle={() => setShowAllMasrafTutar(v => !v)} total={masrafTutarFull.length} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TalepAnaliz;