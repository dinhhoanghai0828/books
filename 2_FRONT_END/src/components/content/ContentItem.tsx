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
// TYPES
// ============================================================

export interface ContentItemProps {
  item: ContentType;
  isActive: boolean;           // Cau nay dang duoc highlight
  isAudioPlaying: boolean;     // Audio cua cau nay dang phat
  isLooping: boolean;          // Loop cua cau nay dang bat
  isVideoPlaying: boolean;     // Video cua cau nay dang phat
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  showVideoButton: boolean;    // Video Mode moi hien nut video
  activeSource: 'audio' | 'video' | null;
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

// Style cho item dang active
const ACTIVE_ITEM_STYLE: React.CSSProperties = {
  borderLeft: '4px solid #1677ff',
  paddingLeft: 10,
  backgroundColor: '#e6f4ff',
  borderRadius: 6,
  transition: 'background-color 0.3s ease',
};

// ============================================================
// COMPONENT
// ============================================================

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
  activeSource,
  onPlayPauseAudio,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  itemRef,
}: ContentItemProps) => {
  return (
    <div
      ref={itemRef}
      className="content-item"
      style={isActive ? ACTIVE_ITEM_STYLE : {}}
    >
      {/* Dong tieng Anh + nhom nut */}
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
          {/* Nut video — chi hien o Video Mode va khi item co video */}
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

          {/* Nut audio */}
          <Button
            type="link"
            icon={isAudioPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onPlayPauseAudio(item.id, item.startTime, item.endTime);
            }}
          />

          {/* Nut loop — chi hoat dong khi audio dang phat */}
          <Button
            type="link"
            icon={isLooping ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!isAudioPlaying}
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
