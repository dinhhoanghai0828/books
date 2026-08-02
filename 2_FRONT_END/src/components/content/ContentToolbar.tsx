import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  FileWordOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Space, notification, Dropdown } from 'antd';
import { App } from 'antd';
import React, { useState } from 'react';
import { runContentsExport, runWordGeneral, downloadSingleVolumeWord } from '@/utils/apiService';

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
  onFillBlanks: () => void;
  onInsertWord: () => void;
  volumeSlug: string | string[];
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
  onFillBlanks,
  onInsertWord,
  volumeSlug,
}) => {
  const [notifApi, notifContextHolder] = notification.useNotification({
    top: 80,
  });
  const [loadingTonghopCau, setLoadingTonghopCau] = useState(false);
  const [loadingTonghopTu, setLoadingTonghopTu] = useState(false);
  const [loadingDownloadWord, setLoadingDownloadWord] = useState(false);

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

  const handleDownloadWord = async () => {
    setLoadingDownloadWord(true);
    try {
      const slug = Array.isArray(volumeSlug) ? volumeSlug[0] : volumeSlug;
      await downloadSingleVolumeWord(slug || '');
      notifApi.success({
        message: 'Download thanh cong',
        description: 'File Word da duoc tai xuong.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      notifApi.error({
        message: 'Download that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setLoadingDownloadWord(false);
    }
  };

  const adminMenuItems = [
    {
      key: 'tonghopcau',
      label: (
        <span>
          {loadingTonghopCau ? 'Đang tổng hợp...' : 'Tổng hợp Câu'}
        </span>
      ),
      onClick: handleTonghopCau,
      disabled: loadingTonghopCau || loadingTonghopTu || loadingDownloadWord,
    },
    {
      key: 'tonghoptu',
      label: (
        <span>
          {loadingTonghopTu ? 'Đang tổng hợp...' : 'Tổng hợp Từ'}
        </span>
      ),
      onClick: handleTonghopTu,
      disabled: loadingTonghopCau || loadingTonghopTu || loadingDownloadWord,
    },
    {
      key: 'download',
      label: (
        <span>
          {loadingDownloadWord ? 'Đang download...' : 'Download Word'}
        </span>
      ),
      onClick: handleDownloadWord,
      disabled: loadingTonghopCau || loadingTonghopTu || loadingDownloadWord,
      icon: <FileWordOutlined />,
    },
  ];

  const displayMenuItems = [
    {
      key: 'eng',
      label: (
        <span>
          {showEnglish ? 'Ẩn Tiếng Anh' : 'Hiện Tiếng Anh'}
        </span>
      ),
      onClick: onToggleEnglish,
    },
    {
      key: 'vi',
      label: (
        <span>
          {showVietnamese ? 'Ẩn Tiếng Việt' : 'Hiện Tiếng Việt'}
        </span>
      ),
      onClick: onToggleVietnamese,
    },
    {
      key: 'words',
      label: (
        <span>
          {highlightMissingWords ? 'Ẩn từ mới' : 'Hiện từ mới'}
        </span>
      ),
      onClick: onToggleMissingWords,
    },
  ];
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
        {/* Group 1: Hiển thị - Dropdown */}
        <Dropdown
          menu={{
            items: displayMenuItems.map(item => ({
              key: item.key,
              label: item.label,
              onClick: item.onClick,
            })),
          }}
          trigger={['click']}
        >
          <Button
            icon={<EyeOutlined />}
            className="custom-button"
          >
            Hiển thị
          </Button>
        </Dropdown>

        {/* Group 2: Học tập */}
        <Dropdown
          menu={{
            items: [
              {
                key: 'ghép câu',
                label: 'Ghép câu',
                onClick: onTest,
              },
              {
                key: 'điền từ',
                label: 'Điền từ còn thiếu',
                onClick: onFillBlanks,
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="primary" icon={<CheckOutlined />} className="custom-button">
            Kiểm tra
          </Button>
        </Dropdown>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onInsertWord}
          className="custom-button"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Them tu moi
        </Button>

        {/* Group 3: Admin functions - Dropdown */}
        <Dropdown
          menu={{
            items: adminMenuItems.map(item => ({
              key: item.key,
              label: item.label,
              onClick: item.onClick,
              icon: item.icon,
              disabled: item.disabled,
            })),
          }}
          trigger={['click']}
        >
          <Button
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
            className="custom-button"
            icon={<DownOutlined />}
          >
            Tác vụ khác
          </Button>
        </Dropdown>
      </Space>
    </div>
    </>
  );
};

export default ContentToolbar;
