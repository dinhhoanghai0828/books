import { ContentType } from '@/interfaces/content';
import { Empty, Typography } from 'antd';
import React from 'react';
import ContentItem from './ContentItem';

// ============================================================
// TYPES
// ============================================================

export interface VideoLayoutProps {
  contents: ContentType[];
  videoPath: string;
  volumeEngName: string;
  volumeViName: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  activeItemId: string | null;
  activeSource: 'audio' | 'video' | null;
  isVideoPlaying: boolean;
  playStates: Record<string, boolean>;
  loopStates: Record<string, boolean>;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  itemRefsRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  renderTooltip: () => React.ReactNode;
}

// ============================================================
// COMPONENT — chi render, khong chua logic media
// ============================================================

const VideoLayout: React.FC<VideoLayoutProps> = ({
  contents,
  videoPath,
  volumeEngName,
  volumeViName,
  videoRef,
  listScrollRef,
  activeItemId,
  activeSource,
  isVideoPlaying,
  playStates,
  loopStates,
  showEnglish,
  showVietnamese,
  highlightMissingWords,
  itemRefsRef,
  onPlayPauseAudio,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  renderTooltip,
}) => {
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 16, alignItems: 'flex-start' }}>
      {/* Cot trai: video sticky */}
      <div style={{ flex: '0 0 42%', position: 'sticky', top: 16 }}>
        <video
          ref={videoRef}
          src={`/media/${videoPath}`}
          controls
          style={{ width: '100%', borderRadius: 8 }}
        />
      </div>

      {/* Cot phai: tieu de + danh sach cau cuon doc lap */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Title level={3} className="volume-title">
          {volumeEngName}
        </Typography.Title>
        <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
        <Typography.Text
          className="volume-total-sentence"
          style={{ display: 'block', marginBottom: 8 }}
        >
          Bai co tong cong:{' '}
          <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
        </Typography.Text>

        {/* Vung cuon doc lap — Story List */}
        <div
          ref={listScrollRef}
          style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}
        >
          {contents.length > 0 ? (
            contents.map((item) => (
              <ContentItem
                key={item.id}
                item={item}
                isActive={activeItemId === item.id}
                isAudioPlaying={playStates[item.id] ?? false}
                isLooping={loopStates[item.id] ?? false}
                isVideoPlaying={isVideoPlaying}
                showEnglish={showEnglish}
                showVietnamese={showVietnamese}
                highlightMissingWords={highlightMissingWords}
                showVideoButton={true}
                activeSource={activeSource}
                onPlayPauseAudio={onPlayPauseAudio}
                onPlayPauseVideo={onPlayPauseVideo}
                onToggleLoop={onToggleLoop}
                onGetMeaning={onGetMeaning}
                itemRef={(el) => { itemRefsRef.current[item.id] = el; }}
              />
            ))
          ) : (
            <Empty description="Khong co du lieu" className="emptyClass" />
          )}
          {renderTooltip()}
        </div>
      </div>
    </div>
  );
};

export default VideoLayout;
