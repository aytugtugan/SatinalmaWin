import React, { useState } from 'react';
import { SwitchableChart, formatNumber, formatCurrency } from '../components/SwitchableChart';
import CompareSwitch from '../components/CompareSwitch';
import ComparisonChart from '../components/ComparisonChart';
import FabrikaTeslimKarsilastirma from '../components/FabrikaTeslimKarsilastirma';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WalletOutlined,
  UserOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';

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

const Dashboard = ({ data, comparisonData = {}, selectedAmbar = 'all' }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAllMasraf, setShowAllMasraf] = useState(false);
  const [showAllTedarikci, setShowAllTedarikci] = useState(false);
  const [showAllOdeme, setShowAllOdeme] = useState(false);
  const [showAllOdemeAdet, setShowAllOdemeAdet] = useState(false);
  const [showAllTalep, setShowAllTalep] = useState(false);
  const [showAllDurum, setShowAllDurum] = useState(false);
  const [showAllParaBirimi, setShowAllParaBirimi] = useState(false);

  if (!data) return null;

  const { summary, monthlyTrend, tedarikci, durum, masrafMerkezi, isyeri, paraBirimi, paraBirimiConverted, odemeVadesi, talepEden } = data;

  // Aylık trend (zaman sıralamasını koru)
  const trendData = (monthlyTrend || []).slice(0, 12).reverse().map(item => ({
    name: item.ay,
    'Toplam Tutar': item.toplamTutar,
    'Sipariş Adedi': item.siparisAdedi,
  }));

  // Teslim durumu - full + sliced
  const durumFull = (durum || [])
    .slice().sort((a, b) => (b.siparisAdedi || 0) - (a.siparisAdedi || 0))
    .map(item => ({ name: item.durum, value: item.siparisAdedi }));
  const durumData = showAllDurum ? durumFull : durumFull.slice(0, TOP_N);

  // Masraf merkezi - full + sliced
  const masrafFull = (masrafMerkezi || [])
    .slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(item => ({ name: item.masrafMerkezi?.substring(0, 20) || 'Belirsiz', value: item.toplamTutar }));
  const masrafData = showAllMasraf ? masrafFull : masrafFull.slice(0, TOP_N);

  // Tedarikçi - full + sliced
  const tedFull = (tedarikci || [])
    .slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(item => ({ name: item.tedarikci?.substring(0, 20) || 'Belirsiz', value: item.toplamTutar }));
  const tedData = showAllTedarikci ? tedFull : tedFull.slice(0, TOP_N);

  // Para birimi - full + sliced
  const paraBirimiFull = (paraBirimi || [])
    .slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(item => ({ name: item.paraBirimi || 'TRY', value: item.toplamTutar || 0 }));
  const paraBirimiData = showAllParaBirimi ? paraBirimiFull : paraBirimiFull.slice(0, TOP_N);

  // Ödeme vadesi tutar - full + sliced
  const odemeFull = (odemeVadesi || [])
    .filter(item => item.odemeVadesi !== 'Belirsiz')
    .slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(item => ({ name: item.odemeVadesi, value: item.toplamTutar }));
  const odemeData = showAllOdeme ? odemeFull : odemeFull.slice(0, TOP_N);

  // Ödeme vadesi adet - full + sliced
  const odemeAdetFull = (odemeVadesi || [])
    .filter(item => item.odemeVadesi !== 'Belirsiz')
    .slice().sort((a, b) => (b.siparisAdedi || b.kayitAdedi || 0) - (a.siparisAdedi || a.kayitAdedi || 0))
    .map(item => ({ name: item.odemeVadesi, value: item.siparisAdedi || item.kayitAdedi || 0 }));
  const odemeAdetData = showAllOdemeAdet ? odemeAdetFull : odemeAdetFull.slice(0, TOP_N);

  // Talep eden - full + sliced
  const talepFull = (talepEden || [])
    .slice().sort((a, b) => (b.toplamTutar || 0) - (a.toplamTutar || 0))
    .map(item => ({ name: item.talepEden?.substring(0, 15) || 'Belirsiz', value: item.toplamTutar }));
  const talepData = showAllTalep ? talepFull : talepFull.slice(0, TOP_N);

  return (
    <div>
      <div className="page-header">
        <h2>Satın Alma Dashboard</h2>
        <p>Satın alma süreçlerinizin genel görünümü ve temel performans göstergeleri</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><ShoppingCartOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalSiparis || 0)}</div>
          <div className="kpi-label">Toplam Sipariş</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><WalletOutlined /></div>
          <div className="kpi-value">{formatCurrency(summary?.toplamTutarTRY ?? summary?.toplamTutar ?? 0)}</div>
          <div className="kpi-label">Toplam Tutar (TRY)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircleOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTeslimat || 0)}</div>
          <div className="kpi-label">Teslim Edilen</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><ClockCircleOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.bekleyenTeslimat || 0)}</div>
          <div className="kpi-label">Teslim Bekleyen</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><TeamOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTedarikci || 0)}</div>
          <div className="kpi-label">Tedarikçi Sayısı</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><UserOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTalepEden || 0)}</div>
          <div className="kpi-label">Talep Eden Sayısı</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><FileTextOutlined /></div>
          <div className="kpi-value">{formatNumber(summary?.totalTalep || 0)}</div>
          <div className="kpi-label">Toplam Talep</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><FieldTimeOutlined /></div>
          <div className="kpi-value">{data.teslimatSuresi?.ortalamaTeslimatSuresi || 0} Gün</div>
          <div className="kpi-label">Ort. Teslimat Süresi</div>
        </div>
      </div>

      {/* Fabrika Karşılaştırma Toggle */}
      <div style={{ padding: '0 32px 8px' }}>
        <CompareSwitch
          isVisible={selectedAmbar === 'all'}
          isCompareMode={isCompareMode}
          onToggle={() => setIsCompareMode(!isCompareMode)}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {isCompareMode && selectedAmbar === 'all' ? (
          <>
            <ComparisonChart title="Fabrika Bazında Toplam Harcama" comparisonData={comparisonData} metric="toplamTutar" valueFormatter={formatCurrency} height={320} />
            <FabrikaTeslimKarsilastirma comparisonData={comparisonData} height={300} />
          </>
        ) : (
          <>
            <SwitchableChart title="Aylık Sipariş Tutarı" data={trendData} dataKey="Toplam Tutar" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} showPct={true} />
            <div style={showAllDurum ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Genel Teslim Durumu Dağılımı" data={durumData} dataKey="value" nameKey="name" defaultType="bar" height={300} sort={false} expanded={showAllDurum} />
              {durumFull.length > TOP_N && <ShowAllBtn show={showAllDurum} onToggle={() => setShowAllDurum(v => !v)} total={durumFull.length} />}
            </div>

            <div style={showAllMasraf ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Masraf Merkezine Göre Tutar" data={masrafData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} expanded={showAllMasraf} showPct={true} />
              {masrafFull.length > TOP_N && <ShowAllBtn show={showAllMasraf} onToggle={() => setShowAllMasraf(v => !v)} total={masrafFull.length} />}
            </div>

            <div style={showAllTedarikci ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Tedarikçilere Göre Tutar" data={tedData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} expanded={showAllTedarikci} showPct={true} />
              {tedFull.length > TOP_N && <ShowAllBtn show={showAllTedarikci} onToggle={() => setShowAllTedarikci(v => !v)} total={tedFull.length} />}
            </div>

            <div style={showAllParaBirimi ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Para Birimi Dağılımı" data={paraBirimiData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} expanded={showAllParaBirimi} showPct={true} />
              {paraBirimiFull.length > TOP_N && <ShowAllBtn show={showAllParaBirimi} onToggle={() => setShowAllParaBirimi(v => !v)} total={paraBirimiFull.length} />}
            </div>

            <div style={showAllOdeme ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Ödeme Vadesi Dağılımı (Tutar)" data={odemeData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} expanded={showAllOdeme} showPct={true} />
              {odemeFull.length > TOP_N && <ShowAllBtn show={showAllOdeme} onToggle={() => setShowAllOdeme(v => !v)} total={odemeFull.length} />}
            </div>

            <div style={showAllOdemeAdet ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Ödeme Vadesi Dağılımı (Adet)" data={odemeAdetData} dataKey="value" nameKey="name" defaultType="bar" height={300} sort={false} expanded={showAllOdemeAdet} />
              {odemeAdetFull.length > TOP_N && <ShowAllBtn show={showAllOdemeAdet} onToggle={() => setShowAllOdemeAdet(v => !v)} total={odemeAdetFull.length} />}
            </div>

            <div style={showAllTalep ? { gridColumn: 'span 2' } : {}}>
              <SwitchableChart title="Talep Edenlere Göre Tutar" data={talepData} dataKey="value" nameKey="name" defaultType="bar" valueFormatter={formatCurrency} height={300} sort={false} expanded={showAllTalep} showPct={true} />
              {talepFull.length > TOP_N && <ShowAllBtn show={showAllTalep} onToggle={() => setShowAllTalep(v => !v)} total={talepFull.length} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
