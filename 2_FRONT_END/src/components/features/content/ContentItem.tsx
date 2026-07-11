import { ContentType } from '@/interfaces/content';
import {
  PauseOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  RollbackOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import React from 'react';

// ============================================================
// CONTENT ITEM COMPONENT
// Hien thi 1 item noi dung (cau tieng Anh + tieng Viet + cac nut dieu khien)
// - Highlight tu thieu trong cau
// - Phat/dung audio/video
// - Bat/tat lap lai
// - Tra nghia tu khi boi chon
// ============================================================

export interface ContentItemProps {
  item: ContentType;
  isActive: boolean;              // Item co phai la item dang active khong
  isAudioPlaying: boolean;         // Audio cua item dang phat khong
  isLooping: boolean;             // Item dang o che do lap lai khong
  isVideoPlaying: boolean;        // Video cua item dang phat khong
  showEnglish: boolean;           // Hien thi tieng Anh khong
  showVietnamese: boolean;        // Hien thi tieng Viet khong
  highlightMissingWords: boolean; // Highlight tu thieu khong
  showVideoButton: boolean;       // Hien nut video (true o Video Mode)
  showAudioButton: boolean;       // Hien nut audio (false o Video Mode)
  activeSource: 'audio' | 'video' | null;
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

// Style cho item dang active (dang phat audio/video)
const ACTIVE_ITEM_STYLE: React.CSSProperties = {
  borderLeft: '4px solid #1677ff',
  paddingLeft: 10,
  backgroundColor: '#e6f4ff',
  borderRadius: 6,
  transition: 'background-color 0.3s ease',
};

const ContentItem = React.memo(({
  item,
  isActive,
  isAudioPlaying,
  isLooping,
  isVideoPlaying,
  showEnglish,
  showVietnamese,
  highlightMissingWords,
  showVideoButton,
  showAudioButton,
  activeSource,
  onPlayPauseAudio,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  itemRef,
}: ContentItemProps) => {
  // Nut loop duoc phep nhan khi:
  // - Audio Mode: audio cua item dang phat
  // - Video Mode: video cua item dang phat
  const isLoopEnabled = showAudioButton
    ? isAudioPlaying
    : (isActive && isVideoPlaying);

  return (
    <div
      ref={itemRef}
      className="content-item"
      style={isActive ? ACTIVE_ITEM_STYLE : {}}
    >
      {/* Dong tieng Anh + nhom nut dieu khien */}
      <div className="eng-line">
        <div style={{ visibility: showEnglish ? 'visible' : 'hidden', flex: 1 }}>
          <Typography.Text
            strong
            className="engClass"
            style={isActive ? { color: '#1677ff' } : {}}
            onMouseUp={(e) => { e.stopPropagation(); onGetMeaning(); }}
            onTouchEnd={(e) => { e.stopPropagation(); onGetMeaning(); }}
          >
            {item.eng.split(/\s+/).map((word, idx) => {
              const cleanWord = word.replace(/[.,?!";']/g, '').toLowerCase();
              const isMissing =
                highlightMissingWords &&
                item.missingWords?.map((w) => w.toLowerCase()).includes(cleanWord);
              return (
                <span
                  key={idx}
                  className={isMissing ? 'highlight-missing' : ''}
                  style={isMissing ? { backgroundColor: '#ffe58f' } : {}}
                >
                  {word + ' '}
                </span>
              );
            })}
          </Typography.Text>
        </div>

        <Space className="button-group">
          {/* Nut video — chi hien o Video Mode */}
          {showVideoButton && item.video && (
            <Button
              type="link"
              icon={
                isActive && activeSource === 'video' && isVideoPlaying
                  ? <PauseOutlined style={{ color: '#1677ff' }} />
                  : <VideoCameraOutlined />
              }
              onClick={(e) => {
                e.stopPropagation();
                onPlayPauseVideo(item.id, item.startTime, item.endTime);
              }}
            />
          )}

          {/* Nut audio — an o Video Mode */}
          {showAudioButton && (
            <Button
              type="link"
              icon={isAudioPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onPlayPauseAudio(item.id, item.startTime, item.endTime);
              }}
            />
          )}

          {/* Nut loop */}
          <Button
            type="link"
            icon={isLooping ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!isLoopEnabled}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLoop(item.id, item.startTime, item.endTime);
            }}
          />
        </Space>
      </div>

      {/* Dong tieng Viet */}
      <div style={{ visibility: showVietnamese ? 'visible' : 'hidden' }}>
        <Typography.Text
          strong
          className="viClass"
          style={isActive ? { color: '#1677ff' } : {}}
          onMouseUp={(e) => { e.stopPropagation(); onGetMeaning(); }}
          onTouchEnd={(e) => { e.stopPropagation(); onGetMeaning(); }}
        >
          {item.vi}
        </Typography.Text>
      </div>
    </div>
  );
});

ContentItem.displayName = 'ContentItem';

export default ContentItem;
