import { ContentType } from '@/interfaces/content';
import {
  EditOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  PlusOutlined,
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
  isActive: boolean;
  isAudioPlaying: boolean;
  isLooping: boolean;
  isVideoPlaying: boolean;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  showVideoButton: boolean;
  showAudioButton: boolean;
  activeSource: 'audio' | 'video' | null;
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  onEdit: (item: ContentType) => void;
  onInsertWord: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

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
  showAudioButton,
  activeSource,
  onPlayPauseAudio,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  onEdit,
  onInsertWord,
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
          {/* Nut video — chi hien o Video Mode */}
          {showVideoButton && (
            <Button
              type="link"
              icon={
                isVideoPlaying
                  ? <PauseOutlined style={{ color: '#1677ff' }} />
                  : <PlayCircleOutlined />
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

          {/* Nut chinh sua noi dung */}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          />

          {/* Nut them tu moi */}
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onInsertWord();
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
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.eng === nextProps.item.eng &&
    prevProps.item.vi === nextProps.item.vi &&
    prevProps.item.startTime === nextProps.item.startTime &&
    prevProps.item.endTime === nextProps.item.endTime &&
    prevProps.item.missingWords?.length === nextProps.item.missingWords?.length &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isAudioPlaying === nextProps.isAudioPlaying &&
    prevProps.isLooping === nextProps.isLooping &&
    prevProps.isVideoPlaying === nextProps.isVideoPlaying &&
    prevProps.showEnglish === nextProps.showEnglish &&
    prevProps.showVietnamese === nextProps.showVietnamese &&
    prevProps.highlightMissingWords === nextProps.highlightMissingWords &&
    prevProps.showVideoButton === nextProps.showVideoButton &&
    prevProps.showAudioButton === nextProps.showAudioButton &&
    prevProps.activeSource === nextProps.activeSource
  );
});

ContentItem.displayName = 'ContentItem';

export default ContentItem;
