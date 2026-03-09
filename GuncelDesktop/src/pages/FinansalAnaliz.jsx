import React, { useState } from 'react';
import { SwitchableChart, formatNumber, formatCurrency } from '../components/SwitchableChart';
import CompareSwitch from '../components/CompareSwitch';
import ComparisonChart from '../components/ComparisonChart';
import { DollarOutlined, GlobalOutlined, FieldTimeOutlined, BankOutlined } from '@ant-design/icons';

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

const FinansalAnaliz = ({ data, comparisonData = {}, selectedAmbar = 'all' }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAllVadeAdet, setShowAllVadeAdet] = useState(false);
  const [showAllVadeTutar, setShowAllVadeTutar] = useState(false);
  const [showAllParaTutar, setShowAllParaTutar] = useState(false);
  const [showAllParaAdet, setShowAllParaAdet] = useState(false);

  if (!data) return null;
  const { paraBirimi, odemeVadesi, summary, monthlyTrend } = data;

  const paraBirimiFull = (paraBirimi || [])
    .slice()
    .sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(i => ({ name: i.paraBirimi || 'TRY', value: i.toplamTutar || 0 }));
  const paraBirimiData = showAllParaTutar ? paraBirimiFull : paraBirimiFull.slice(0, TOP_N);

  const paraBirimiAdetFull = (paraBirimi || [])
    .slice()
    .sort((a, b) => (b.kayitAdedi || 0) - (a.kayitAdedi || 0))
    .map(i => ({ name: i.paraBirimi || 'TRY', value: i.kayitAdedi || 0 }));
  const paraBirimiAdetData = showAllParaAdet ? paraBirimiAdetFull : paraBirimiAdetFull.slice(0, TOP_N);

  const sortedVade = (odemeVadesi || [])
    .filter(i => i.odemeVadesi && i.odemeVadesi !== 'Belirsiz')
    .slice()
    .sort((a, b) => (b.siparisAdedi || b.kayitAdedi || 0) - (a.siparisAdedi || a.kayitAdedi || 0));

  const sortedVadeTutar = (odemeVadesi || [])
    .filter(i => i.odemeVadesi && i.odemeVadesi !== 'Belirsiz')
    .slice()
    .sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0));

  const vadeFull = sortedVade.map(i => ({
    name: i.odemeVadesi,
    value: i.siparisAdedi || i.kayitAdedi || i.talepAdedi || 0,
  }));
  const vadeTutarFull = sortedVadeTutar.map(i => ({
    name: i.odemeVadesi,
    value: i.toplamTutar || 0,
  }));

  const vadeData = showAllVadeAdet ? vadeFull : vadeFull.slice(0, TOP_N);
  const vadeTutarData = showAllVadeTutar ? vadeTutarFull : vadeTutarFull.slice(0, TOP_N);

  const aylikHarcamaData = (monthlyTrend || [])
    .slice(0, 12)
    .reverse()
    .map(i => ({ name: i.ay, value: i.toplamTutar || 0 }));

  return (
    <div>
      <div className="page-header">
        <h2>Finansal Analiz</h2>
        <p>Harcama ve ödeme analizleri, bütçe takibi</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><DollarOutlined /></div>
          <div className="kpi-value">{formatCurrency(summary?.toplamTutarTRY ?? summary?.toplamTutar ?? 0)}</div>
          <div className="kpi-label">Toplam Harcama</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><BankOutlined /></div>
          <div className="kpi-value">{formatCurrency(summary?.ortalamaTutar || 0)}</div>
          <div className="kpi-label">Ortalama Sipariş Tutarı</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><GlobalOutlined /></div>
          <div className="kpi-value">{paraBirimi?.length || 0}</div>
          <div className="kpi-label">Para Birimi Çeşidi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><FieldTimeOutlined /></div>
          <div className="kpi-value">{odemeVadesi?.length || 0}</div>
          <div className="kpi-label">Ödeme Vadesi Çeşidi</div>
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
            <SwitchableChart
              title="Aylık Harcama Tutarı"
              data={aylikHarcamaData}
              dataKey="value"
              nameKey="name"
              defaultType="bar"
              valueFormatter={formatCurrency}
              height={320}
              sort={false}
              showPct={true}
            />
            <div style={showAllParaTutar ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Para Birimine Göre Tutar Dağılımı"
                data={paraBirimiData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                valueFormatter={formatCurrency}
                height={320}
                sort={false}
                expanded={showAllParaTutar}
                showPct={true}
              />
              {paraBirimiFull.length > TOP_N && <ShowAllBtn show={showAllParaTutar} onToggle={() => setShowAllParaTutar(v => !v)} total={paraBirimiFull.length} />}
            </div>
            <div style={showAllParaAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Para Birimine Göre İşlem Adedi"
                data={paraBirimiAdetData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                height={320}
                sort={false}
                expanded={showAllParaAdet}
              />
              {paraBirimiAdetFull.length > TOP_N && <ShowAllBtn show={showAllParaAdet} onToggle={() => setShowAllParaAdet(v => !v)} total={paraBirimiAdetFull.length} />}
            </div>
            <div style={showAllVadeAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Ödeme Vadesine Göre İşlem Adedi"
                data={vadeData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                height={320}
                sort={false}
                expanded={showAllVadeAdet}
              />
              {vadeFull.length > TOP_N && (
                <ShowAllBtn
                  show={showAllVadeAdet}
                  onToggle={() => setShowAllVadeAdet(v => !v)}
                  total={vadeFull.length}
                />
              )}
            </div>
            <div style={showAllVadeTutar ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart
                title="Ödeme Vadesine Göre Tutar"
                data={vadeTutarData}
                dataKey="value"
                nameKey="name"
                defaultType="bar"
                valueFormatter={formatCurrency}
                height={320}
                sort={false}
                expanded={showAllVadeTutar}
                showPct={true}
              />
              {vadeTutarFull.length > TOP_N && (
                <ShowAllBtn
                  show={showAllVadeTutar}
                  onToggle={() => setShowAllVadeTutar(v => !v)}
                  total={vadeTutarFull.length}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinansalAnaliz;
