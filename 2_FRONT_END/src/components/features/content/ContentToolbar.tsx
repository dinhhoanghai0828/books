import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Space } from 'antd';
import React from 'react';

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
  return (
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
      </Space>
    </div>
  );
};

export default ContentToolbar;
