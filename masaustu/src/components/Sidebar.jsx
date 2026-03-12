import React, { useState } from 'react';
import {
  AppstoreOutlined,
  FileSearchOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FundOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  BarChartOutlined,
  DownloadOutlined,
  CheckOutlined,
  LoadingOutlined,
  TagsOutlined,
  PieChartFilled,
} from '@ant-design/icons';

import logoImgInline from '../../assets/logo.jpg?inline';

const menuItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'talep', icon: <FileSearchOutlined />, label: 'Talep Analizi' },
  { key: 'siparis', icon: <ShoppingCartOutlined />, label: 'Sipariş Analizi' },
  { key: 'tedarikci', icon: <TeamOutlined />, label: 'Tedarikçi Analizi' },
  { key: 'finansal', icon: <FundOutlined />, label: 'Finansal Analiz' },
  { key: 'detay', icon: <DatabaseOutlined />, label: 'Detaylı Rapor' },
  { key: 'ihale', icon: <TrophyOutlined />, label: 'İhale Yönetimi' },
  { key: 'ihaleRapor', icon: <BarChartOutlined />, label: 'İhale Raporları' },
  { key: 'tedarikciKategori', icon: <TagsOutlined />, label: 'Tedarikçi Kategori' },
  { key: 'tedarikciKategoriRapor', icon: <PieChartFilled />, label: 'Kategori Raporları' },
];

const Sidebar = ({ currentPage, setCurrentPage, updateStatus, downloadPercent, onCheckUpdate, onRestartUpdate }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckClick = async () => {
    setIsChecking(true);
    if (onCheckUpdate) {
      try {
        await onCheckUpdate();
      } catch (err) {
        console.error('Güncelleme kontrol hatası:', err);
      }
    }
    setIsChecking(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src={logoImgInline} alt="logo" className="logo-img" />
        </div>
        <div className="logo-text">
          <h1>Satın Alma</h1>
          <p>Rapor Sistemi</p>
        </div>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`menu-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.key)}
            title={item.label}
          >
            <span className="icon">{item.icon}</span>
            <span className="menu-text">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-update-section">
        {updateStatus === 'current' ? (
          <div className="update-current">
            <CheckOutlined style={{ color: '#52c41a', marginRight: 6 }} />
            <span>Uygulama güncel</span>
          </div>
        ) : updateStatus === 'error' ? (
          <div className="update-error-msg">
            <span>Bağlantı hatası, tekrar deneyin</span>
          </div>
        ) : updateStatus === 'ready' ? (
          <div className="update-ready">
            <div className="update-label">✓ Güncelleme Hazır!</div>
            <button className="update-action-btn" onClick={onRestartUpdate} title="Uygulamayı yeniden başlat">
              Şimdi Güncelle
            </button>
          </div>
        ) : updateStatus === 'downloading' ? (
          <div className="update-downloading">
            <LoadingOutlined className="update-spinner" />
            <div className="update-label">İndiriliyor... %{downloadPercent}</div>
            <div className="update-progress-bar">
              <div className="update-progress-fill" style={{ width: `${downloadPercent}%` }}></div>
            </div>
          </div>
        ) : (
          <button 
            className="update-check-btn" 
            onClick={handleCheckClick} 
            disabled={isChecking}
            title="Güncellemeleri kontrol et"
          >
            {isChecking ? <LoadingOutlined /> : <DownloadOutlined />}
            <span>{isChecking ? 'Kontrol ediliyor...' : 'Güncellemeleri\nKontrol Et'}</span>
          </button>
        )}
      </div>
      <div className="sidebar-footer">
        v1.0.18 — Enterprise
      </div>
    </aside>
  );
};

export default Sidebar;
