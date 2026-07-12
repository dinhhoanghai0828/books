import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Space, notification } from 'antd';
import { App } from 'antd';
import React, { useState } from 'react';
import { runContentsExport, runWordGeneral } from '@/utils/apiService';

// ============================================================
// TYPES
// ============================================================

export type ViewMode = 'video' | 'audio';

export interface ContentToolbarProps {
  viewMode: ViewMode;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  hasVideo: boolean;           // An nut Video neu tap khong co video
  onViewModeChange: (mode: ViewMode) => void;
  onToggleEnglish: () => void;
  onToggleVietnamese: () => void;
  onToggleMissingWords: () => void;
  onTest: () => void;
  onInsertWord: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

const ContentToolbar: React.FC<ContentToolbarProps> = ({
  viewMode,
  showEnglish,
  showVietnamese,
  highlightMissingWords,
  hasVideo,
  onViewModeChange,
  onToggleEnglish,
  onToggleVietnamese,
  onToggleMissingWords,
  onTest,
  onInsertWord,
}) => {
  const [notifApi, notifContextHolder] = notification.useNotification();
  const [loadingTonghopCau, setLoadingTonghopCau] = useState(false);
  const [loadingTonghopTu, setLoadingTonghopTu] = useState(false);

  const handleTonghopCau = async () => {
    setLoadingTonghopCau(true);
    try {
      const msgExport = await runContentsExport();
      notifApi.success({
        message: msgExport,
        description: 'Noi dung da duoc luu lai.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notifApi.error({
        message: 'Cap nhat that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setLoadingTonghopCau(false);
    }
  };

  const handleTonghopTu = async () => {
    setLoadingTonghopTu(true);
    try {
      const msg = await runWordGeneral();
      notifApi.success({
        message: msg,
        description: 'Du lieu tu da duoc tong hop.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notifApi.error({
        message: 'Tong hop that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setLoadingTonghopTu(false);
    }
  };
  return (
    <>
      {notifContextHolder}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {/* Chuyen doi che do hoc: chi hien khi tap co video */}
      {hasVideo && (
        <Segmented
          value={viewMode}
          onChange={(val) => onViewModeChange(val as ViewMode)}
          options={[
            { label: '🎬 Video', value: 'video' },
            { label: '🎧 Audio', value: 'audio' },
          ]}
        />
      )}

      <Space wrap>
        {/* An / Hien tieng Anh */}
        <Button
          icon={showEnglish ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={onToggleEnglish}
          className="custom-button"
        >
          {showEnglish ? 'An Eng' : 'Hien Eng'}
        </Button>

        {/* An / Hien tieng Viet */}
        <Button
          icon={showVietnamese ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={onToggleVietnamese}
          className="custom-button"
        >
          {showVietnamese ? 'An Vi' : 'Hien Vi'}
        </Button>

        {/* An / Hien tu moi */}
        <Button
          icon={highlightMissingWords ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={onToggleMissingWords}
          className="custom-button"
        >
          {highlightMissingWords ? 'An tu moi' : 'Tu moi'}
        </Button>

        {/* Kiem tra */}
        <Button type="primary" onClick={onTest} className="custom-button">
          Kiem tra
        </Button>

        {/* Them tu moi */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onInsertWord}
          className="custom-button"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Them tu moi
        </Button>

        {/* Tong hop Cau */}
        <Button
          onClick={handleTonghopCau}
          loading={loadingTonghopCau}
          style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
          className="custom-button"
        >
          Tổng hợp Câu
        </Button>

        {/* Tong hop Tu */}
        <Button
          onClick={handleTonghopTu}
          loading={loadingTonghopTu}
          style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
          className="custom-button"
        >
          Tổng hợp Từ
        </Button>
      </Space>
    </div>
    </>
  );
};

export default ContentToolbar;
