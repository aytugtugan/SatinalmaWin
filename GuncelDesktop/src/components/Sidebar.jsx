import React from 'react';
import {
  AppstoreOutlined,
  FileSearchOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FundOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

import logoImgInline from '../../assets/logo.jpg?inline';

const menuItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'talep', icon: <FileSearchOutlined />, label: 'Talep Analizi' },
  { key: 'siparis', icon: <ShoppingCartOutlined />, label: 'Sipariş Analizi' },
  { key: 'tedarikci', icon: <TeamOutlined />, label: 'Tedarikçi Analizi' },
  { key: 'finansal', icon: <FundOutlined />, label: 'Finansal Analiz' },
  { key: 'detay', icon: <DatabaseOutlined />, label: 'Detaylı Rapor' },
];

const Sidebar = ({ currentPage, setCurrentPage }) => {
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
      <div className="sidebar-footer">
        v1.0.9 — Enterprise
      </div>
    </aside>
  );
};

export default Sidebar;
