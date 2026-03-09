import React, { useState, useEffect } from 'react';
import { ConfigProvider, Select, Spin } from 'antd';
import trTR from 'antd/locale/tr_TR';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TalepAnaliz from './pages/TalepAnaliz';
import SiparisAnaliz from './pages/SiparisAnaliz';
import TedarikciAnaliz from './pages/TedarikciAnaliz';
import FinansalAnaliz from './pages/FinansalAnaliz';
import DetayliRapor from './pages/DetayliRapor';
import { ShopOutlined, ReloadOutlined, MinusOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from '@ant-design/icons';
import './styles.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [allData, setAllData] = useState(null);
  const [columnMapping, setColumnMapping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ambarList, setAmbarList] = useState([]);
  const [selectedAmbar, setSelectedAmbar] = useState('all');
  const [comparisonData, setComparisonData] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [updateStatus, setUpdateStatus] = useState(null); // null | 'downloading' | 'ready'
  const [updateVersion, setUpdateVersion] = useState('');
  const [downloadPercent, setDownloadPercent] = useState(0);

  // Güncelleme event listener
  useEffect(() => {
    if (window.api?.onUpdateAvailable) {
      window.api.onUpdateAvailable((info) => {
        setUpdateStatus('downloading');
        setUpdateVersion(info?.version || '');
      });
    }
    if (window.api?.onDownloadProgress) {
      window.api.onDownloadProgress((progress) => {
        setDownloadPercent(Math.round(progress?.percent || 0));
      });
    }
    if (window.api?.onUpdateDownloaded) {
      window.api.onUpdateDownloaded((info) => {
        setUpdateStatus('ready');
        setUpdateVersion(info?.version || '');
      });
    }
  }, []);

  const handleRestartForUpdate = () => {
    if (window.api?.restartForUpdate) {
      window.api.restartForUpdate();
    }
  };

  // Ambar listesini yukle
  const loadAmbarList = async () => {
    try {
      const result = await window.api.getAmbarList();
      if (result.success) {
        setAmbarList(result.data);
      }
    } catch (err) {
      console.error('Ambar list error:', err);
    }
  };

  // Dashboard verilerini yukle
  const loadDashboardData = async (ambarFilter) => {
    try {
      setLoading(true);
      const result = await window.api.getDashboardStats(ambarFilter);
      if (result.success) {
        setDashboardData(result.data);
        // Kolon mapping'ini dashboardData'dan al
        if (result.data.columns) {
          setColumnMapping(result.data.columns);
        }
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tum verileri yukle
  const loadAllData = async () => {
    try {
      const result = await window.api.getAllData();
      if (result.success) {
        // Yeni format: { data, columns }
        if (result.data.data && result.data.columns) {
          setAllData(result.data.data);
          setColumnMapping(result.data.columns);
        } else {
          setAllData(result.data);
        }
      }
    } catch (err) {
      console.error('All data error:', err);
    }
  };

  // Fabrika karşılaştırma verilerini yukle
  const loadComparisonData = async () => {
    try {
      const result = await window.api.getFactoryComparison();
      if (result.success) {
        setComparisonData(result.data || {});
      }
    } catch (err) {
      console.error('Comparison data error:', err);
    }
  };

  // Ilk yukleme
  useEffect(() => {
    loadAmbarList();
    loadDashboardData(selectedAmbar);
    loadAllData();
    loadComparisonData();
  }, []);

  // Ambar degistiginde verileri yeniden yukle
  useEffect(() => {
    loadDashboardData(selectedAmbar);
  }, [selectedAmbar]);

  const handleRefresh = () => {
    loadDashboardData(selectedAmbar);
    loadAllData();
    loadComparisonData();
    // Güncelleme kontrolü
    if (window.api?.checkForUpdates) {
      window.api.checkForUpdates().then(result => {
        console.log('Güncelleme kontrol sonucu:', result);
      }).catch(err => {
        console.error('Güncelleme kontrol hatası:', err);
      });
    }
  };

  const handleMinimize = () => {
    if (window.api?.windowMinimize) window.api.windowMinimize();
  };

  const handleFullscreenToggle = async () => {
    if (window.api?.windowMaximize) {
      await window.api.windowMaximize();
      setIsFullscreen(prev => !prev);
    }
  };

  const handleClose = () => {
    if (window.api?.windowClose) window.api.windowClose();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
      case 'talep':
        return <TalepAnaliz data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
      case 'siparis':
        return <SiparisAnaliz data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
      case 'tedarikci':
        return <TedarikciAnaliz data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
      case 'finansal':
        return <FinansalAnaliz data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
      case 'detay':
        return <DetayliRapor data={allData} selectedAmbar={selectedAmbar} columns={columnMapping} />;
      default:
        return <Dashboard data={dashboardData} columns={columnMapping} comparisonData={comparisonData} selectedAmbar={selectedAmbar} />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Veriler yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="error-container">
            <div className="error-icon">!</div>
            <div className="error-message">{error}</div>
            <button className="retry-btn" onClick={handleRefresh}>
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={trTR}>
      <div className="app-wrapper">
        <div className="app-container">
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <main className="main-content">
            {/* Global Filter Bar */}
            <div className="global-filter-bar">
              <div className="filter-left">
                <ShopOutlined className="filter-icon" />
                <span className="filter-label">Fabrika:</span>
                <Select
                  value={selectedAmbar}
                  onChange={setSelectedAmbar}
                  style={{ width: 220 }}
                  size="middle"
                    options={[
                    { value: 'all', label: 'Tüm Fabrikalar' },
                    ...ambarList.map(item => ({
                      value: item.ambar,
                      label: item.displayName || item.ambar
                    }))
                  ]}
                />
              </div>
              <div className="filter-right">
                <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
                  <ReloadOutlined spin={loading} />
                  <span>Yenile</span>
                </button>

                <div className="win-controls">
                  <button className="win-btn win-minimize" onClick={handleMinimize} title="Küçült">
                    <MinusOutlined />
                  </button>
                  <button className="win-btn win-maximize" onClick={handleFullscreenToggle} title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}>
                    {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  </button>
                  <button className="win-btn win-close" onClick={handleClose} title="Kapat">
                    <CloseOutlined />
                  </button>
                </div>
              </div>
            </div>
            {/* Güncelleme bildirimi */}
            {updateStatus === 'downloading' && (
              <div className="update-banner downloading">
                <span>Güncelleme indiriliyor... %{downloadPercent}</span>
                <div className="update-progress-bar">
                  <div className="update-progress-fill" style={{ width: `${downloadPercent}%` }}></div>
                </div>
              </div>
            )}
            {updateStatus === 'ready' && (
              <div className="update-banner ready">
                <span>Yeni sürüm (v{updateVersion}) hazır!</span>
                <button className="update-restart-btn" onClick={handleRestartForUpdate}>
                  Şimdi Güncelle
                </button>
              </div>
            )}
            {renderPage()}
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;
