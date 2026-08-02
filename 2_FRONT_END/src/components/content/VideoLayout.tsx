import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Empty, Typography } from 'antd';
import React, { useEffect, useRef } from 'react';
import ContentItem from './ContentItem';
import { findActiveItem, parseTimeToSeconds } from './contentHelpers';

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
  playStates?: Record<string, boolean>; // Đồng bộ state phát của từng item như Audio
  loopStates: Record<string, boolean>;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  itemRefsRef: React.RefObject<Record<string, HTMLDivElement | null>>;
  onPlayPauseVideo: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  renderTooltip: () => React.ReactNode;
  volume?: Volume;
  onActiveItemChange?: (itemId: string) => void;
  onVideoStop?: () => void;
  playCommand?: { itemId: string; startTime: string; endTime: string; ts: number } | null;
  loopCommand?: { itemId: string; startTime: string; endTime: string; isLoop: boolean; ts: number } | null;
  pauseCommand?: number | null;
  onEdit: (item: ContentType) => void;
  onInsertWord: () => void;
}

// ============================================================
// COMPONENT
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
  playStates = {},
  loopStates,
  showEnglish,
  showVietnamese,
  highlightMissingWords,
  itemRefsRef,
  onPlayPauseVideo,
  onToggleLoop,
  onGetMeaning,
  renderTooltip,
  onActiveItemChange,
  onVideoStop,
  playCommand,
  loopCommand,
  pauseCommand,
  onEdit,
  onInsertWord,
}) => {
  const segmentRef = useRef({ start: 0, end: 0 });
  const isLoopRef = useRef(false);

  // Synchronize Refs
  const onActiveItemChangeRef = useRef(onActiveItemChange);
  useEffect(() => { onActiveItemChangeRef.current = onActiveItemChange; }, [onActiveItemChange]);

  const onVideoStopRef = useRef(onVideoStop);
  useEffect(() => { onVideoStopRef.current = onVideoStop; }, [onVideoStop]);

  const contentsRef = useRef(contents);
  useEffect(() => { contentsRef.current = contents; }, [contents]);

  const listenerCleanupRef = useRef<(() => void) | null>(null);

  // 1. GẮN EVENT LISTENERS CHO VIDEO (GIỐNG AUDIOLAYOUT)
  const attachListeners = (video: HTMLVideoElement) => {
    listenerCleanupRef.current?.();
    const lastActiveId = { current: '' };

    const onTimeUpdate = () => {
      const current = video.currentTime;
      const { start, end } = segmentRef.current;

      // Xử lý giới hạn khoảng Segment
      if (end > 0 && current >= end) {
        if (isLoopRef.current) {
          video.currentTime = start;
        } else {
          segmentRef.current = { start: 0, end: 0 };
          video.pause();
          onVideoStopRef.current?.();
        }
        return;
      }

      // Chỉ auto-switch item khi KHÔNG có segment (tức là user đang play toàn bộ video, không play từng item)
      // Khi user play từng item, segment sẽ được set và khi hết sẽ reset về 0
      if (segmentRef.current.end === 0) {
        // Tìm câu đang active trong khoảng thời gian
        const found = findActiveItem(contentsRef.current, current);
        if (found && String(found.id) !== lastActiveId.current) {
          lastActiveId.current = String(found.id);
          onActiveItemChangeRef.current?.(String(found.id));
        }
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);

    listenerCleanupRef.current = () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      attachListeners(video);
    }
    return () => {
      listenerCleanupRef.current?.();
      listenerCleanupRef.current = null;
    };
  }, [videoPath]);

  // 2. LỆNH PHÁT TỪ ITEM (PLAY COMMAND)
  useEffect(() => {
    if (!playCommand) return;
    const video = videoRef.current;
    if (!video) return;

    if (!listenerCleanupRef.current) {
      attachListeners(video);
    }

    const start = parseTimeToSeconds(playCommand.startTime);
    const end = parseTimeToSeconds(playCommand.endTime);

    // Validate that start is finite before setting currentTime
    if (isFinite(start)) {
      segmentRef.current = { start, end };

      video.currentTime = start;
      video.play().catch((err) => console.log('Video play error:', err));
    }
  }, [playCommand]);

  // 3. LỆNH LẶP TỪ ITEM (LOOP COMMAND)
  useEffect(() => {
    if (!loopCommand) return;
    isLoopRef.current = loopCommand.isLoop;
    const video = videoRef.current;
    if (!video || video.paused) return;

    const start = parseTimeToSeconds(loopCommand.startTime);
    const end = parseTimeToSeconds(loopCommand.endTime);
    segmentRef.current = { start, end };
  }, [loopCommand]);

  // 4. LỆNH PAUSE (PAUSE COMMAND)
  useEffect(() => {
    if (pauseCommand === null || pauseCommand === undefined) return;
    const video = videoRef.current;
    if (video) video.pause();
  }, [pauseCommand]);

  return (
    <div style={{ paddingBottom: '220px' }}>
      {/* Video cố định ở cuối màn hình */}
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

      {/* Danh sách câu */}
      <div ref={listScrollRef}>
        <Typography.Title level={3} className="volume-title">
          {volumeEngName}
        </Typography.Title>
        <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
        <Typography.Text className="volume-total-sentence">
          Bài có tổng cộng:{' '}
          <strong style={{ color: 'red' }}>{contents?.length || 0}</strong> câu cần học
        </Typography.Text>

        {contents?.length > 0 ? (
          contents.map((item) => {
            const itemIdStr = String(item.id);
            const isActive = activeItemId === itemIdStr;
            // Xử lý trạng thái isVideoPlaying giống logic isAudioPlaying của AudioLayout
            const itemIsVideoPlaying = playStates[itemIdStr] ?? (isActive && isVideoPlaying);

            return (
              <ContentItem
                key={item.id}
                item={item}
                isActive={isActive}
                isAudioPlaying={false}
                isLooping={loopStates[itemIdStr] ?? false}
                isVideoPlaying={itemIsVideoPlaying}
                showEnglish={showEnglish}
                showVietnamese={showVietnamese}
                highlightMissingWords={highlightMissingWords}
                showVideoButton={true}
                showAudioButton={false}
                activeSource={activeSource}
                onPlayPauseAudio={() => {}}
                onPlayPauseVideo={onPlayPauseVideo}
                onToggleLoop={onToggleLoop}
                onGetMeaning={onGetMeaning}
                onEdit={onEdit}
                onInsertWord={onInsertWord}
                itemRef={(el) => {
                  if (itemRefsRef.current) {
                    itemRefsRef.current[itemIdStr] = el;
                  }
                }}
              />
            );
          })
        ) : (
          <Empty description="Không có dữ liệu" className="emptyClass" />
        )}

        {renderTooltip()}
      </div>
    </div>
  );
};

export default VideoLayout;