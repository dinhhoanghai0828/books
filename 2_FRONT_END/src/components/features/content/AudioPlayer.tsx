import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';
import { Empty, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../../styles/audio.css';
import ContentItem from './ContentItem';
import { findActiveItem, parseTimeToSeconds } from './helpers/timeHelpers';

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
  // Callback khi nguoi dung click nut play/pause tren item
  onPlayPauseAudio: (id: string, startTime: string, endTime: string) => void;
  onToggleLoop: (id: string, startTime: string, endTime: string) => void;
  onGetMeaning: () => void;
  renderTooltip?: () => React.ReactNode;
  // Thong tin volume de lay src audio
  volume?: Volume;
  // Callback khi timeupdate phat hien cau dang chay (de ContentComponent highlight + scroll)
  onActiveItemChange: (itemId: string) => void;
  // Callback khi audio tu dong dung (het segment hoac het file)
  onAudioStop: () => void;
  // Callback khi audio da pause xong (de reset pauseCommand)
  onAudioPaused?: () => void;
  // Lenh phat tu ContentComponent: thay doi khi user click item
  playCommand: { itemId: string; startTime: string; endTime: string; ts: number } | null;
  // Lenh loop tu ContentComponent: thay doi khi user toggle loop
  loopCommand: { itemId: string; startTime: string; endTime: string; isLoop: boolean; ts: number } | null;
  // Lenh dung tu ContentComponent: thay doi khi user click pause
  pauseCommand: number | null;
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
// AudioLayout tu quan ly toan bo trang thai audio noi bo:
// - Khong phu thuoc vao state trung gian tu page.tsx
// - Nhan lenh play/pause/loop qua props dang {data, ts}:
//   moi lan ts thay doi thi useEffect chay, tranh stale isPlaying
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
  onActiveItemChange,
  onAudioStop,
  onAudioPaused,
  playCommand,
  loopCommand,
  pauseCommand,
}) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [audioSrc, setAudioSrc] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Lay HTMLAudioElement tu AudioPlayer
  const getAudio = (): HTMLAudioElement | null =>
    playerRef.current?.audio?.current ?? null;

  // Segment dang phat noi bo: { start, end } (end=0 = chay tu do)
  const segmentRef = useRef({ start: 0, end: 0 });

  // isLoop noi bo, doc tu loopCommand
  const isLoopRef = useRef(false);

  // Flag phan biet seek tu code vs seek tu nguoi dung
  const isSeekingByCodeRef = useRef(false);

  // Ref giu callbacks moi nhat, tranh stale closure trong listener
  const onActiveItemChangeRef = useRef(onActiveItemChange);
  useEffect(() => { onActiveItemChangeRef.current = onActiveItemChange; }, [onActiveItemChange]);

  const onAudioStopRef = useRef(onAudioStop);
  useEffect(() => { onAudioStopRef.current = onAudioStop; }, [onAudioStop]);

  const onAudioPausedRef = useRef(onAudioPaused);
  useEffect(() => { onAudioPausedRef.current = onAudioPaused; }, [onAudioPaused]);

  const contentsRef = useRef(contents);
  useEffect(() => { contentsRef.current = contents; }, [contents]);

  // ============================================================
  // CAP NHAT AUDIO SRC
  // ============================================================

  useEffect(() => {
    if (volume?.audio) {
      console.log('[AudioLayout] Setting audioSrc:', `/media/${volume.audio}`);
      setAudioSrc(`/media/${volume.audio}`);
    }
  }, [volume]);

  // ============================================================
  // ATTACH LISTENERS — dang ky 1 lan, cleanup dung
  // useEffect chay lai khi audioSrc thay doi (sang tap moi)
  // ============================================================

  useEffect(() => {
    // Cho den khi AudioPlayer render xong va audio element san sang
    let audio = getAudio();
    let retryCount = 0;
    const maxRetry = 20;

    const attach = () => {
      audio = getAudio();
      if (!audio) {
        retryCount++;
        if (retryCount < maxRetry) {
          setTimeout(attach, 100);
        }
        return;
      }

      console.log('[AudioLayout] Audio element attached, readyState:', audio.readyState, 'paused:', audio.paused);

      const lastActiveId = { current: '' };

      const onSeeking = () => {
        if (isSeekingByCodeRef.current) return;
        // Nguoi dung tu seek: bo gioi han segment, chay tu do
        segmentRef.current = { start: 0, end: 0 };
      };

      const onTimeUpdate = () => {
        if (!audio) return;
        const t = audio.currentTime;
        const { start, end } = segmentRef.current;

        // Xu ly stop/loop khi den endTime
        if (end > 0 && t >= end) {
          console.log('[AudioLayout] onTimeUpdate: reached end time, pausing. t:', t, 'end:', end);
          if (isLoopRef.current) {
            isSeekingByCodeRef.current = true;
            audio.currentTime = start;
            isSeekingByCodeRef.current = false;
          } else {
            audio.pause();
            segmentRef.current = { start: 0, end: 0 };
            onAudioStopRef.current();
          }
          return;
        }

        // Highlight cau dang chay theo currentTime
        const found = findActiveItem(contentsRef.current, t);
        if (found && String(found.id) !== lastActiveId.current) {
          lastActiveId.current = String(found.id);
          onActiveItemChangeRef.current(String(found.id));
        }
      };

      audio.addEventListener('seeking', onSeeking);
      audio.addEventListener('timeupdate', onTimeUpdate);

      // Cleanup khi effect re-run (audioSrc doi) hoac unmount
      return () => {
        audio!.removeEventListener('seeking', onSeeking);
        audio!.removeEventListener('timeupdate', onTimeUpdate);
      };
    };

    const cleanup = attach();
    return () => { cleanup?.(); };
  }, [audioSrc]);

  // ============================================================
  // LENH PHAT: playCommand thay doi -> seek va play
  // ============================================================

  useEffect(() => {
    if (!playCommand) return;
    const audio = getAudio();
    if (!audio) {
      console.log('[AudioLayout] playCommand received but audio element not ready');
      return;
    }

    const start = parseTimeToSeconds(playCommand.startTime);
    const end   = parseTimeToSeconds(playCommand.endTime);

    console.log('[AudioLayout] playCommand:', playCommand, 'start:', start, 'end:', end);

    segmentRef.current = { start, end };
    isLoopRef.current = false; // reset loop khi phat bai moi

    isSeekingByCodeRef.current = true;
    audio.currentTime = start;
    isSeekingByCodeRef.current = false;

    audio.playbackRate = playbackSpeed;
    
    audio.play().then(() => {
      console.log('[AudioLayout] audio.play() succeeded');
      // Callback de bao cho ContentComponent biet audio dang phat
      onActiveItemChangeRef.current(playCommand.itemId);
    }).catch((err) => {
      console.error('[AudioLayout] audio.play() failed:', err);
    });
  }, [playCommand]);

  // ============================================================
  // LENH LOOP: loopCommand thay doi -> cap nhat isLoopRef
  // ============================================================

  useEffect(() => {
    if (!loopCommand) return;
    isLoopRef.current = loopCommand.isLoop;
    // Neu bat loop trong khi dang phat: cap nhat segment moi (startTime/endTime co the khac)
    const audio = getAudio();
    if (!audio || audio.paused) return;
    const start = parseTimeToSeconds(loopCommand.startTime);
    const end   = parseTimeToSeconds(loopCommand.endTime);
    segmentRef.current = { start, end };
  }, [loopCommand]);

  // ============================================================
  // LENH DUNG: pauseCommand thay doi -> pause
  // ============================================================

  useEffect(() => {
    if (pauseCommand === null || pauseCommand === undefined) return;
    console.log('[AudioLayout] pauseCommand received:', pauseCommand);
    const audio = getAudio();
    if (audio) {
      console.log('[AudioLayout] pausing audio, paused:', audio.paused);
      audio.pause();
      // Callback de reset pauseCommand sau khi da pause xong
      onAudioPausedRef.current?.();
    }
  }, [pauseCommand]);

  // ============================================================
  // CAP NHAT TOC DO PHAT
  // ============================================================

  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value);
    const audio = getAudio();
    if (audio) audio.playbackRate = value;
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
