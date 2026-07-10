import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';
import { Empty, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  // Props dieu khien AudioPlayer
  volume?: Volume;
  startTime: string;
  endTime: string;
  isLoop: boolean;
  isPause: boolean;
  isPlaying: boolean;
  itemId: number;
  resetIsPlaying: () => void;
  handlePauseAudio: (isPause: boolean) => void;
  // Callback khi timeupdate phat hien cau dang chay (de ContentComponent highlight + scroll)
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
  const [audioSrc, setAudioSrc] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Ref tro thang vao HTMLAudioElement (khong qua AudioPlayer wrapper)
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Segment dang phat: start/end/itemId
  // end = 0 nghia la khong gioi han (nguoi dung tu seek, chay den het file)
  const segmentRef = useRef({ start: 0, end: 0, itemId: '' });

  // Flag phan biet seek tu code vs seek tu nguoi dung
  const isSeekingByCodeRef = useRef(false);

  // Ref giu gia tri moi nhat cua cac callback de tranh stale closure
  const isLoopRef = useRef(isLoop);
  useEffect(() => { isLoopRef.current = isLoop; }, [isLoop]);

  const contentsRef = useRef(contents);
  useEffect(() => { contentsRef.current = contents; }, [contents]);

  const onActiveItemChangeRef = useRef(onActiveItemChange);
  useEffect(() => { onActiveItemChangeRef.current = onActiveItemChange; }, [onActiveItemChange]);

  const handlePauseAudioRef = useRef(handlePauseAudio);
  useEffect(() => { handlePauseAudioRef.current = handlePauseAudio; }, [handlePauseAudio]);

  const resetIsPlayingRef = useRef(resetIsPlaying);
  useEffect(() => { resetIsPlayingRef.current = resetIsPlaying; }, [resetIsPlaying]);

  // ============================================================
  // ATTACH LISTENERS KHI AUDIOSRC SAN SANG
  // Dung ref callback cho AudioPlayer de lay HTMLAudioElement ngay khi mount.
  // Dang ky seeking + timeupdate 1 lan duy nhat, cleanup dung khi src thay doi.
  // ============================================================

  const playerRefCallback = useCallback((player: AudioPlayer | null) => {
    if (!player) return;
    const audio = player.audio?.current;
    if (!audio) return;
    audioElRef.current = audio;
  }, []);

  useEffect(() => {
    const audio = audioElRef.current;
    if (!audio || !audioSrc) return;

    const lastActiveId = { current: '' };

    // Nguoi dung tu seek tren controls -> reset segment, chay tu do den het file
    const onSeeking = () => {
      if (isSeekingByCodeRef.current) return;
      segmentRef.current = { start: 0, end: 0, itemId: '' };
    };

    // 1 listener duy nhat xu ly ca stop/loop/highlight
    const onTimeUpdate = () => {
      const t = audio.currentTime;
      const { start, end } = segmentRef.current;

      // Dung hoac loop khi den endTime (chi khi end > 0)
      if (end > 0 && t >= end) {
        if (isLoopRef.current) {
          audio.currentTime = start;
        } else {
          audio.pause();
          segmentRef.current = { start: 0, end: 0, itemId: '' };
          handlePauseAudioRef.current(true);
          resetIsPlayingRef.current();
        }
        return;
      }

      // Highlight + scroll cau dang chay theo currentTime
      const found = findActiveItem(contentsRef.current, t);
      if (found && String(found.id) !== lastActiveId.current) {
        lastActiveId.current = String(found.id);
        onActiveItemChangeRef.current(String(found.id));
      }
    };

    audio.addEventListener('seeking', onSeeking);
    audio.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      audio.removeEventListener('seeking', onSeeking);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [audioSrc]); // re-attach khi src thay doi (sang tap moi)

  // ============================================================
  // PHAT / CHUYEN BAI KHI isPlaying HOAC itemId THAY DOI
  // ============================================================

  useEffect(() => {
    const audio = audioElRef.current;
    if (!audio || !isPlaying) return;

    const start = parseTimeToSeconds(startTime);
    const end   = parseTimeToSeconds(endTime);

    segmentRef.current = { start, end, itemId: String(itemId) };

    isSeekingByCodeRef.current = true;
    audio.currentTime = start;
    isSeekingByCodeRef.current = false;

    audio.playbackRate = playbackSpeed;
    audio.play();
  }, [isPlaying, itemId]);

  // ============================================================
  // DUNG NGAY KHI isPause = true
  // ============================================================

  useEffect(() => {
    if (isPause && audioElRef.current) {
      audioElRef.current.pause();
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
    if (audioElRef.current) {
      audioElRef.current.playbackRate = value;
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
            ref={playerRefCallback}
            src={audioSrc}
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
