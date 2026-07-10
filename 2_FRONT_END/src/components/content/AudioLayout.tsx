import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';
import { Empty, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../styles/audio.css';
import ContentItem from './ContentItem';

// ============================================================
// TYPES
// ============================================================

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
  // Du lieu de AudioPlayer hoat dong
  volume?: Volume;
  startTime: string;
  endTime: string;
  isLoop: boolean;
  isPause: boolean;
  isPlaying: boolean;
  itemId: number;
  resetIsPlaying: () => void;
  handlePauseAudio: (isPause: boolean) => void;
}

// Danh sach toc do phat
const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5,  label: '0.5x' },
  { value: 0.7,  label: '0.7x' },
  { value: 0.8,  label: '0.8x' },
  { value: 0.9,  label: '0.9x' },
  { value: 1.0,  label: '1.0x (Mac dinh)' },
  { value: 1.2,  label: '1.2x' },
  { value: 1.5,  label: '1.5x' },
  { value: 1.7,  label: '1.7x' },
  { value: 2.0,  label: '2.0x' },
];

// Chuyen chuoi "hh:mm:ss" thanh so giay
const timeStringToSeconds = (timeString: string): number => {
  const [hours, minutes, seconds] = timeString.split(':');
  return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds);
};

// ============================================================
// COMPONENT
// ============================================================

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
  startTime,
  endTime,
  isLoop,
  isPause,
  isPlaying,
  itemId,
  resetIsPlaying,
  handlePauseAudio,
}) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [audioSrc, setAudioSrc] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Dung ref de tranh stale closure khi isLoop thay doi sau khi listener duoc dang ky
  const isLoopRef = useRef(isLoop);
  useEffect(() => {
    isLoopRef.current = isLoop;
  }, [isLoop]);

  // Cap nhat duong dan audio khi volume thay doi
  useEffect(() => {
    if (volume?.audio) {
      setAudioSrc(`/media/${volume.audio}`);
    }
  }, [volume]);

  // Bat dau phat hoac chuyen bai khi isPlaying = true hoac itemId thay doi.
  // Dung khi den endTime neu khong loop.
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;
    const start = timeStringToSeconds(startTime);
    const end = timeStringToSeconds(endTime);
    const player = playerRef.current.audio.current!;
    player.currentTime = start;
    player.playbackRate = playbackSpeed;
    player.play();
    const handleTimeUpdate = () => {
      if (player.currentTime >= end && !isLoopRef.current) {
        player.pause();
        player.currentTime = start;
        handlePauseAudio(true);
        resetIsPlaying();
      }
    };
    player.addEventListener('timeupdate', handleTimeUpdate);
    return () => player.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlaying, playbackSpeed, itemId]);

  // Lap lai doan tu startTime den endTime khi isLoop = true
  useEffect(() => {
    if (!isLoop || !startTime || !endTime || !playerRef.current) return;
    const start = timeStringToSeconds(startTime);
    const end = timeStringToSeconds(endTime);
    const player = playerRef.current.audio.current!;
    const onTimeUpdate = () => {
      if (player.currentTime >= end) {
        player.currentTime = start;
      }
    };
    player.addEventListener('timeupdate', onTimeUpdate);
    return () => player.removeEventListener('timeupdate', onTimeUpdate);
  }, [isLoop, itemId, startTime, endTime]);

  // Dung audio ngay khi isPause = true
  useEffect(() => {
    if (playerRef.current && isPause) {
      playerRef.current.audio.current!.pause();
    }
  }, [isPause]);

  // Cap nhat toc do phat
  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value);
    if (playerRef.current) {
      playerRef.current.audio.current!.playbackRate = value;
    }
  };

  return (
    <div>
      {/* Tieu de tap */}
      <Typography.Title level={3} className="volume-title">
        {volumeEngName}
      </Typography.Title>
      <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
      <Typography.Text className="volume-total-sentence">
        Bai co tong cong:{' '}
        <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
      </Typography.Text>

      {/* Danh sach cau */}
      {contents.length > 0 ? (
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
            onPlayPauseVideo={() => {}}
            onToggleLoop={onToggleLoop}
            onGetMeaning={onGetMeaning}
            itemRef={(el) => { itemRefsRef.current[String(item.id)] = el; }}
          />
        ))
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      {renderTooltip()}

      {/* AudioPlayer co dinh o cuoi man hinh (chi hien khi co file audio) */}
      {audioSrc && (
        <div className="audio-component-fixed">
          <AudioPlayer
            ref={playerRef}
            src={audioSrc}
            onPlay={() => {}}
            onPause={() => playerRef.current?.audio.current?.pause()}
            showJumpControls={false}
            autoPlay={false}
            loop={isLoop}
          />
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 'bold' }}>Toc do phat:</span>
            <Select
              value={playbackSpeed}
              onChange={handleSpeedChange}
              style={{ width: 200 }}
              options={PLAYBACK_SPEED_OPTIONS}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioLayout;
