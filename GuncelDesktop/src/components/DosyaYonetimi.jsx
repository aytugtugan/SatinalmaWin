import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, List, Tag, Tooltip, message, Popconfirm, Input, Empty, Spin, Badge, Typography } from 'antd';
import {
  UploadOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined,
  FileExcelOutlined, FileWordOutlined, FilePptOutlined, FileZipOutlined,
  FileTextOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined,
  PaperClipOutlined, CloudUploadOutlined, InboxOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Dosya tipine göre ikon (API format: image, pdf, word, excel, powerpoint, text, archive)
const getFileIcon = (format) => {
  if (!format) return <FileOutlined style={{ fontSize: 28, color: '#8c8c8c' }} />;
  const f = format.toLowerCase();
  if (f === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(f))
    return <FileImageOutlined style={{ fontSize: 28, color: '#1890ff' }} />;
  if (f === 'pdf')
    return <FilePdfOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />;
  if (f === 'excel' || ['xls', 'xlsx', 'csv'].includes(f))
    return <FileExcelOutlined style={{ fontSize: 28, color: '#52c41a' }} />;
  if (f === 'word' || ['doc', 'docx'].includes(f))
    return <FileWordOutlined style={{ fontSize: 28, color: '#2f54eb' }} />;
  if (f === 'powerpoint' || ['ppt', 'pptx'].includes(f))
    return <FilePptOutlined style={{ fontSize: 28, color: '#fa8c16' }} />;
  if (f === 'archive' || ['zip', 'rar'].includes(f))
    return <FileZipOutlined style={{ fontSize: 28, color: '#722ed1' }} />;
  if (f === 'text' || f === 'txt')
    return <FileTextOutlined style={{ fontSize: 28, color: '#595959' }} />;
  return <FileOutlined style={{ fontSize: 28, color: '#8c8c8c' }} />;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const isPreviewable = (format) => {
  if (!format) return false;
  const f = format.toLowerCase();
  return ['image', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(f);
};

const DosyaYonetimi = ({ visible, siparisNo, onClose, onDosyaSayisiDegisti }) => {
  const [dosyalar, setDosyalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aciklama, setAciklama] = useState('');

  const loadDosyalar = useCallback(async () => {
    if (!siparisNo) return;
    setLoading(true);
    try {
      const result = await window.api.dosyaListele(siparisNo);
      if (result.success) {
        setDosyalar(result.data || []);
      } else {
        console.error('Dosya listesi hatası:', result.error);
        setDosyalar([]);
      }
    } catch (err) {
      console.error('Dosya listesi yüklenemedi:', err);
      setDosyalar([]);
    } finally {
      setLoading(false);
    }
  }, [siparisNo]);

  useEffect(() => {
    if (visible && siparisNo) {
      loadDosyalar();
      setAciklama('');
    }
  }, [visible, siparisNo, loadDosyalar]);

  const handleUpload = async () => {
    if (!siparisNo) return;
    setUploading(true);
    try {
      const result = await window.api.dosyaYukle({ siparisNo, aciklama: aciklama.trim() || undefined });
      if (result.canceled) {
        setUploading(false);
        return;
      }
      if (result.success) {
        message.success('Dosya başarıyla yüklendi');
        setAciklama('');
        await loadDosyalar();
        onDosyaSayisiDegisti && onDosyaSayisiDegisti();
      } else {
        message.error(result.error || 'Dosya yüklenemedi');
      }
    } catch (err) {
      message.error('Dosya yüklenirken hata: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (dosya) => {
    try {
      const result = await window.api.dosyaIndir({ id: dosya.id, dosyaAdi: dosya.dosyaAdi });
      if (result.canceled) return;
      if (result.success) {
        message.success('Dosya kaydedildi');
      } else {
        message.error(result.error || 'Dosya indirilemedi');
      }
    } catch (err) {
      message.error('İndirme hatası: ' + err.message);
    }
  };

  const handlePreview = async (dosya) => {
    try {
      await window.api.dosyaGoruntule(dosya.id);
    } catch (err) {
      message.error('Dosya açılamadı: ' + err.message);
    }
  };

  const handleDelete = async (dosya) => {
    try {
      const result = await window.api.dosyaSil(dosya.id);
      if (result.success) {
        message.success('Dosya silindi');
        await loadDosyalar();
        onDosyaSayisiDegisti && onDosyaSayisiDegisti();
      } else {
        message.error(result.error || 'Dosya silinemedi');
      }
    } catch (err) {
      message.error('Silme hatası: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PaperClipOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
          <span>Dosya Yönetimi</span>
          <Tag color="blue" style={{ marginLeft: 4 }}>{siparisNo}</Tag>
          <Badge count={dosyalar.length} style={{ backgroundColor: '#3b82f6' }} />
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={720}
      footer={null}
      styles={{ body: { padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto' } }}
      destroyOnClose
    >
      {/* Yükleme Alanı */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '2px dashed #93c5fd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        textAlign: 'center',
      }}>
        <CloudUploadOutlined style={{ fontSize: 36, color: '#3b82f6', marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1d4ed8', marginBottom: 12 }}>
          Bu siparişe dosya ekleyin
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Input
            placeholder="Açıklama (isteğe bağlı)"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            style={{ maxWidth: 300 }}
            size="middle"
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={handleUpload}
            style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
          >
            Dosya Seç ve Yükle
          </Button>
        </div>
        <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 8 }}>
          Desteklenen: Görseller, PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, RAR (maks 25MB)
        </div>
      </div>

      {/* Dosya Listesi */}
      <Spin spinning={loading} tip="Dosyalar yükleniyor...">
        {dosyalar.length === 0 && !loading ? (
          <Empty
            image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description={<span style={{ color: '#8c8c8c' }}>Bu siparişe henüz dosya eklenmemiş</span>}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={dosyalar}
            renderItem={(dosya) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.2s',
                }}
                actions={[
                  isPreviewable(dosya.format) && (
                    <Tooltip title="Görüntüle" key="view">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(dosya)}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="İndir" key="download">
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(dosya)}
                      style={{ color: '#52c41a' }}
                    />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="Bu dosyayı silmek istediğinize emin misiniz?"
                    onConfirm={() => handleDelete(dosya)}
                    okText="Evet, Sil"
                    cancelText="İptal"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Sil">
                      <Button type="text" icon={<DeleteOutlined />} danger />
                    </Tooltip>
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getFileIcon(dosya.format)}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 13 }}>{dosya.dosyaAdi}</Text>
                      <Tag style={{ fontSize: 10, lineHeight: '16px' }}>
                        {(dosya.format || '?').toUpperCase()}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {formatFileSize(dosya.boyut)}
                      </Text>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                      {dosya.aciklama && (
                        <span style={{ color: '#595959', marginRight: 12 }}>💬 {dosya.aciklama}</span>
                      )}
                      <span>📅 {formatDate(dosya.tarih)}</span>
                      {dosya.yukleyenKullanici && (
                        <span style={{ marginLeft: 12 }}>👤 {dosya.yukleyenKullanici}</span>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default DosyaYonetimi;
