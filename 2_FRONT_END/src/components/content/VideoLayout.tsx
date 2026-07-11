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
  videoRef: ((el: HTMLVideoElement | null) => void) | React.RefObject<HTMLVideoElement | null>;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  activeItemId: string | null;
  activeSource: 'audio' | 'video' | null;
  isVideoPlaying: boolean;
  loopStates: Record<string, boolean>;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  itemRefsRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  renderTooltip?: () => React.ReactNode;
}

// ============================================================
// COMPONENT
// Video Mode layout:
// - Video co dinh o vi tri cua audio player (fixed bottom)
// - Danh sach cau hien thi day du chieu rong, can giua giong Audio Mode
// - Chi co nut video va nut loop, KHONG co nut audio
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
  loopStates,
  showEnglish,
  showVietnamese,
  highlightMissingWords,
  itemRefsRef,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  renderTooltip,
}) => {
  return (
    <>
      {/* Video co dinh o cuoi man hinh — thay the vi tri audio player */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 600,
          zIndex: 1000,
          backgroundColor: '#000',
          borderRadius: '10px 10px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.25)',
        }}
      >
        <video
          ref={videoRef}
          src={`/media/${videoPath}`}
          controls
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* Danh sach cau — can giua, co padding-bottom de khong bi che boi video */}
      <div ref={listScrollRef}>
        <Typography.Title level={3} className="volume-title">
          {volumeEngName}
        </Typography.Title>
        <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
        <Typography.Text className="volume-total-sentence">
          Bai co tong cong:{' '}
          <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
        </Typography.Text>

        {contents.length > 0 ? (
          contents.map((item) => (
            <ContentItem
              key={item.id}
              item={item}
              isActive={String(activeItemId) === String(item.id)}
              isAudioPlaying={false}         // Video Mode: khong co audio
              isLooping={loopStates[item.id] ?? false}
              isVideoPlaying={isVideoPlaying}
              showEnglish={showEnglish}
              showVietnamese={showVietnamese}
              highlightMissingWords={highlightMissingWords}
              showVideoButton={true}
              showAudioButton={false}        // An nut audio
              activeSource={activeSource}
              onPlayPauseAudio={() => {}}    // Khong dung trong Video Mode
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
    </>
  );
};

export default VideoLayout;
