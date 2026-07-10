import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';
import { Empty, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../styles/audio.css';
import ContentItem from './ContentItem';
import { findActiveItem, parseTimeToSeconds } from './contentHelpers';

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
  // Callback khi audio timeupdate phat hien ra cau dang chay
  onActiveItemChange: (itemId: string) => void;
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
  onActiveItemChange,
}) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [audioSrc, setAudioSrc] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Segment dang phat: start/end/itemId (end=0 = khong gioi han, chay tu do)
  const segmentRef = useRef({ start: 0, end: 0, itemId: '' });

  // Flag: true khi code dang seek (khong phai nguoi dung tu seek)
  const isSeekingByCodeRef = useRef(false);

  // Ref giu gia tri moi nhat cua isLoop tranh stale closure
  const isLoopRef = useRef(isLoop);
  useEffect(() => { isLoopRef.current = isLoop; }, [isLoop]);

  // Ref giu onActiveItemChange moi nhat tranh stale closure
  const onActiveItemChangeRef = useRef(onActiveItemChange);
  useEffect(() => { onActiveItemChangeRef.current = onActiveItemChange; }, [onActiveItemChange]);

  // Ref giu contents moi nhat tranh stale closure
  const contentsRef = useRef(contents);
  useEffect(() => { contentsRef.current = contents; }, [contents]);

  // ============================================================
  // ATTACH UNIFIED TIMEUPDATE + SEEKING LISTENER
  // Chi dang ky 1 lan khi audioSrc san sang.
  // Xu ly ca 3 viec trong 1 listener:
  //   1. Highlight + scroll cau dang chay theo currentTime
  //   2. Dung / loop khi den endTime (chi khi segment.end > 0)
  //   3. Khi nguoi dung tu seek: reset segment.end = 0 -> chay tu do den het file
  // ============================================================

  useEffect(() => {
    // Doi AudioPlayer mount xong moi attach
    const waitForPlayer = setInterval(() => {
      const player = playerRef.current?.audio?.current;
      if (!player) return;
      clearInterval(waitForPlayer);

      const lastActiveIdRef = { current: '' };

      // Nguoi dung tu seek tren controls -> reset segment, chay tu do
      const onSeeking = () => {
        if (isSeekingByCodeRef.current) return;
        segmentRef.current = { start: 0, end: 0, itemId: '' };
      };

      const onTimeUpdate = () => {
        const t = player.currentTime;
        const { start, end, itemId: segItemId } = segmentRef.current;

        // Dung hoac loop khi den endTime (chi khi end > 0)
        if (end > 0 && t >= end) {
          if (isLoopRef.current) {
            player.currentTime = start;
          } else {
            player.pause();
            segmentRef.current = { start: 0, end: 0, itemId: '' };
            handlePauseAudio(true);
            resetIsPlaying();
          }
          return;
        }

        // Highlight cau dang chay theo currentTime
        const found = findActiveItem(contentsRef.current, t);
        if (found && String(found.id) !== lastActiveIdRef.current) {
          lastActiveIdRef.current = String(found.id);
          onActiveItemChangeRef.current(String(found.id));
        }
      };

      player.addEventListener('seeking', onSeeking);
      player.addEventListener('timeupdate', onTimeUpdate);

      // Cleanup khi src thay doi (tap moi) hoac component unmount
      player.addEventListener('emptied', () => {
        player.removeEventListener('seeking', onSeeking);
        player.removeEventListener('timeupdate', onTimeUpdate);
      });
    }, 200);

    return () => clearInterval(waitForPlayer);
  }, [audioSrc]);

  // ============================================================
  // PHAT / CHUYEN BAI
  // Khi isPlaying = true hoac itemId thay doi: seek den startTime va phat.
  // Danh dau isSeekingByCode de onSeeking khong reset segment.
  // ============================================================

  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;
    const player = playerRef.current.audio.current!;
    const start = parseTimeToSeconds(startTime);
    const end   = parseTimeToSeconds(endTime);

    segmentRef.current = { start, end, itemId: String(itemId) };

    isSeekingByCodeRef.current = true;
    player.currentTime = start;
    isSeekingByCodeRef.current = false;

    player.playbackRate = playbackSpeed;
    player.play();
  }, [isPlaying, playbackSpeed, itemId]);

  // ============================================================
  // DUNG NGAY KHI isPause = true
  // ============================================================

  useEffect(() => {
    if (playerRef.current && isPause) {
      playerRef.current.audio.current!.pause();
    }
  }, [isPause]);

  // ============================================================
  // CAP NHAT AUDIO SRC
  // ============================================================

  useEffect(() => {
    if (volume?.audio) setAudioSrc(`/media/${volume.audio}`);
  }, [volume]);

  // ============================================================
  // CAP NHAT TOC DO PHAT
  // ============================================================

  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value);
    if (playerRef.current) {
      playerRef.current.audio.current!.playbackRate = value;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
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

      {/* AudioPlayer co dinh o cuoi man hinh */}
      {audioSrc && (
        <div className="audio-component-fixed">
          <AudioPlayer
            ref={playerRef}
            src={audioSrc}
            onPlay={() => {}}
            onPause={() => {}}
            showJumpControls={false}
            autoPlay={false}
            loop={false}
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
