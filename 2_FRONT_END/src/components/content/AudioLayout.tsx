import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Select, Button, Tooltip, Slider } from 'antd';
import { Empty, Typography } from 'antd';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  ReloadOutlined,
  SoundOutlined,
  MutedOutlined
} from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/audio.css';
import ContentItem from './ContentItem';
import { findActiveItem, parseTimeToSeconds } from './contentHelpers';

export interface AudioLayoutProps {
  contents: ContentType[];
  volumeEngName: string;
  volumeViName: string;
  activeItemId: string | null;
  activeSource: 'audio' | 'video' | null;
  isVideoPlaying: boolean;
  playStates: Record<string, boolean>;
  loopStates: Record<string, boolean>;
  showEnglish: boolean;
  showVietnamese: boolean;
  highlightMissingWords: boolean;
  itemRefsRef: React.RefObject<Record<string, HTMLDivElement | null>>;
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  renderTooltip: () => React.ReactNode;
  volume?: Volume;
  onActiveItemChange: (itemId: string) => void;
  onAudioStop: () => void;
  playCommand: { itemId: string; startTime: string; endTime: string; ts: number } | null;
  loopCommand: { itemId: string; startTime: string; endTime: string; isLoop: boolean; ts: number } | null;
  pauseCommand: number | null;
  onEdit: (item: ContentType) => void;
  onInsertWord: () => void;
  onAudioPlayStateChange?: (isPlayingAudio: boolean, currentActiveId: string | null) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.7, label: '0.7x' },
  { value: 0.8, label: '0.8x' },
  { value: 0.9, label: '0.9x' },
  { value: 1.0, label: '1.0x (Mặc định)' },
  { value: 1.2, label: '1.2x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.7, label: '1.7x' },
  { value: 2.0, label: '2.0x' },
];

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioLayout: React.FC<AudioLayoutProps> = ({
  contents,
  volumeEngName,
  volumeViName,
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
  onToggleLoop,
  onGetMeaning,
  renderTooltip,
  volume,
  onActiveItemChange,
  onAudioStop,
  playCommand,
  loopCommand,
  pauseCommand,
  onEdit,
  onInsertWord,
  onAudioPlayStateChange,
  selectedVoice,
  onVoiceChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isGlobalLoop, setIsGlobalLoop] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const getAudio = (): HTMLAudioElement | null => audioRef.current;
  const segmentRef = useRef({ start: 0, end: 0 });
  const isLoopRef = useRef(false);
  const justStoppedItemRef = useRef(false);

  const onActiveItemChangeRef = useRef(onActiveItemChange);
  useEffect(() => { onActiveItemChangeRef.current = onActiveItemChange; }, [onActiveItemChange]);

  const onAudioStopRef = useRef(onAudioStop);
  useEffect(() => { onAudioStopRef.current = onAudioStop; }, [onAudioStop]);

  const contentsRef = useRef(contents);
  useEffect(() => { contentsRef.current = contents; }, [contents]);

  useEffect(() => {
    if (volume?.audio) setAudioSrc(`/media/${volume.audio}`);
  }, [volume]);

  const listenerCleanupRef = useRef<(() => void) | null>(null);

  const attachListeners = (audio: HTMLAudioElement) => {
    listenerCleanupRef.current?.();
    const lastActiveId = { current: '' };

    const onPlay = () => {
      setIsPlaying(true);
      justStoppedItemRef.current = false;
    };
    const onPause = () => setIsPlaying(false);
    const onLoadedMetadata = () => setDuration(audio.duration);

    const onTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);

      const { start, end } = segmentRef.current;

      // Nếu đang chạy trong đoạn Segment (End > 0) và đã chạy đến/vượt quá End
      if (end > 0 && current >= end) {
        if (isLoopRef.current) {
          audio.currentTime = start;
        } else {
          // QUAN TRỌNG: Reset segment về 0 khi hết câu để cho phép bấm nút Play thủ công ở Player bên dưới
          segmentRef.current = { start: 0, end: 0 };
          audio.pause();
          // Reset lastActiveId và set flag để tránh auto-switch sang item tiếp theo
          lastActiveId.current = '';
          justStoppedItemRef.current = true;
          onAudioStopRef.current();
        }
        return;
      }

      // Chỉ auto-switch item khi KHÔNG có segment (tức là user đang play toàn bộ audio, không play từng item)
      // Và KHÔNG phải khi vừa stop item (để tránh auto-switch ngay sau khi stop item)
      if (segmentRef.current.end === 0 && !justStoppedItemRef.current) {
        const found = findActiveItem(contentsRef.current, current);
        if (found && String(found.id) !== lastActiveId.current) {
          lastActiveId.current = String(found.id);
          onActiveItemChangeRef.current(String(found.id));
        }
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);

    listenerCleanupRef.current = () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  };

  useEffect(() => {
    const audio = getAudio();
    if (audio) {
      attachListeners(audio);
    }
    return () => {
      listenerCleanupRef.current?.();
      listenerCleanupRef.current = null;
    };
  }, [audioSrc]);

  // LỆNH PHÁT TỪ ITEM
  useEffect(() => {
    if (!playCommand) return;
    const audio = getAudio();
    if (!audio) return;

    if (!listenerCleanupRef.current) {
      attachListeners(audio);
    }

    const start = parseTimeToSeconds(playCommand.startTime);
    const end = parseTimeToSeconds(playCommand.endTime);

    // Validate that start is finite before setting currentTime
    if (isFinite(start)) {
      segmentRef.current = { start, end };
      isLoopRef.current = isGlobalLoop;

      audio.currentTime = start;
      audio.playbackRate = playbackSpeed;

      // Đảm bảo bắt được lỗi Promise Play
      audio.play().catch((err) => console.log('Audio play error:', err));
    }
  }, [playCommand]);

  useEffect(() => {
    if (!loopCommand) return;
    isLoopRef.current = loopCommand.isLoop;
    setIsGlobalLoop(loopCommand.isLoop);
    const audio = getAudio();
    if (!audio || audio.paused) return;
    const start = parseTimeToSeconds(loopCommand.startTime);
    const end = parseTimeToSeconds(loopCommand.endTime);
    segmentRef.current = { start, end };
  }, [loopCommand]);

  useEffect(() => {
    if (pauseCommand === null || pauseCommand === undefined) return;
    const audio = getAudio();
    if (audio) audio.pause();
  }, [pauseCommand]);

  // BẤM NÚT PLAY / PAUSE TRỰC TIẾP TRÊN PLAYER DƯỚI CÙNG
  const togglePlayPause = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Nếu audio đang đứng ở cuối segment cũ, xóa segment để cho phép chạy tự do tiếp
      if (segmentRef.current.end > 0 && audio.currentTime >= segmentRef.current.end) {
        segmentRef.current = { start: 0, end: 0 };
      }
      audio.play().catch((err) => console.log('Audio play error:', err));
    }
  }, [isPlaying]);

  // KÉO HOẶC BẤM VÀO THANH SLIDER
  const handleSliderSeek = useCallback((value: number) => {
    const audio = getAudio();
    if (audio && isFinite(value)) {
      // Xóa giới hạn segment để phát tự do từ vị trí bấm
      segmentRef.current = { start: 0, end: 0 };
      audio.currentTime = value;
      setCurrentTime(value);

      // Phát nhạc tiếp nếu đang dừng
      if (audio.paused) {
        audio.play().catch((err) => console.log('Audio play error:', err));
      }
    }
  }, []);

  const handleSpeedChange = useCallback((value: number) => {
    setPlaybackSpeed(value);
    const audio = getAudio();
    if (audio) audio.playbackRate = value;
  }, []);

  const toggleGlobalLoop = useCallback(() => {
    const nextState = !isGlobalLoop;
    setIsGlobalLoop(nextState);
    isLoopRef.current = nextState;
  }, [isGlobalLoop]);

  const toggleMute = useCallback(() => {
    const audio = getAudio();
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((val: number) => {
    const audio = getAudio();
    if (audio) {
      audio.volume = val;
      setVolumeLevel(val);
      setIsMuted(val === 0);
    }
  }, []);

  // Memoized item ref handler to prevent unnecessary re-renders
  const handleItemRef = useCallback((itemId: string, el: HTMLDivElement | null) => {
    itemRefsRef.current[itemId] = el;
  }, [itemRefsRef]);

  return (
    <div style={{ paddingBottom: '100px' }}>
      <Typography.Title level={3} className="volume-title">
        {volumeEngName}
      </Typography.Title>
      <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
      <Typography.Text className="volume-total-sentence">
        Bài có tổng cộng:{' '}
        <strong style={{ color: 'red' }}>{contents?.length || 0}</strong> câu cần học
      </Typography.Text>

      {contents?.length > 0 ? (
        contents.map((item) => (
          <ContentItem
            key={item.id}
            item={item}
            isActive={activeItemId === String(item.id)}
            isAudioPlaying={playStates[String(item.id)] ?? false}
            isLooping={loopStates[String(item.id)] ?? false}
            isVideoPlaying={isVideoPlaying}
            showEnglish={showEnglish}
            showVietnamese={showVietnamese}
            highlightMissingWords={highlightMissingWords}
            showVideoButton={false}
            showAudioButton={true}
            activeSource={activeSource}
            onPlayPauseAudio={onPlayPauseAudio}
            onPlayPauseVideo={() => { }}
            onToggleLoop={onToggleLoop}
            onGetMeaning={onGetMeaning}
            onEdit={onEdit}
            onInsertWord={onInsertWord}
            itemRef={(el) => handleItemRef(String(item.id), el)}
          />
        ))
      ) : (
        <Empty description="Không có dữ liệu" className="emptyClass" />
      )}

      {renderTooltip()}

      {/* Audio Player UI Custom */}
      {audioSrc && (
        <div className="h5-clone-wrapper">
          <audio ref={audioRef} src={audioSrc} style={{ display: 'none' }} />

          <div className="h5-clone-container">
            <div className="h5-play-btn" onClick={togglePlayPause}>
              {isPlaying ? (
                <PauseCircleFilled style={{ fontSize: 40, color: '#f60' }} />
              ) : (
                <PlayCircleFilled style={{ fontSize: 40, color: '#f60' }} />
              )}
            </div>

            <div className="h5-progress-container">
              <span className="h5-time">{formatTime(currentTime)}</span>
              <Slider
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSliderSeek}
                tooltip={{ formatter: (val) => formatTime(val || 0) }}
                className="h5-slider"
              />
              <span className="h5-time">{formatTime(duration)}</span>
            </div>

            <div className="h5-controls-right">
              <div className="h5-volume-group">
                <Button
                  type="text"
                  icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
                  onClick={toggleMute}
                />
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volumeLevel}
                  onChange={handleVolumeChange}
                  style={{ width: 60 }}
                />
              </div>

              <Tooltip title={isGlobalLoop ? "Tắt lặp đoạn" : "Bật lặp đoạn"}>
                <Button
                  type={isGlobalLoop ? "primary" : "default"}
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={toggleGlobalLoop}
                  className={isGlobalLoop ? 'loop-active' : ''}
                />
              </Tooltip>

              <Select
                value={playbackSpeed}
                onChange={handleSpeedChange}
                style={{ width: 90 }}
                options={PLAYBACK_SPEED_OPTIONS}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioLayout;