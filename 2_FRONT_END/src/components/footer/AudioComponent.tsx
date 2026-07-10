import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import '../../styles/audio.css';
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';

// ============================================================
// TYPES
// ============================================================

interface AudioComponentProps {
  startTime: string;          // Thoi diem bat dau phat (format hh:mm:ss)
  endTime: string;            // Thoi diem ket thuc phat (format hh:mm:ss)
  isPause: boolean;           // Khi true: dung audio ngay lap tuc
  isPlaying: boolean;         // Khi chuyen sang true: bat dau phat tu startTime
  isLoop: boolean;            // Khi true: lap lai doan tu startTime den endTime
  itemId: number;             // ID item dang phat (de re-trigger useEffect khi doi bai)
  volume: Volume | undefined; // Thong tin tap chua file audio
  resetIsPlaying: () => void; // Callback: bao parent biet audio da chay xong
  handlePauseAudio: (isPause: boolean) => void; // Callback: yeu cau parent dung audio
}

// Danh sach toc do phat co the chon
const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.7, label: '0.7x' },
  { value: 0.8, label: '0.8x' },
  { value: 0.9, label: '0.9x' },
  { value: 1.0, label: '1.0x (Mac dinh)' },
  { value: 1.2, label: '1.2x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.7, label: '1.7x' },
  { value: 2.0, label: '2.0x' },
];

// ============================================================
// COMPONENT
// ============================================================

const AudioComponent = ({
  startTime,
  endTime,
  isPause,
  isPlaying,
  isLoop,
  itemId,
  volume,
  resetIsPlaying,
  handlePauseAudio,
}: AudioComponentProps) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Dung ref de luon doc gia tri isLoop moi nhat ben trong closure cua listener
  // Vi neu chi dung state, listener duoc tao khi isPlaying=true se "nho" isLoop=false
  // va khong bao gio thay gia tri moi (stale closure problem)
  const isLoopRef = useRef(isLoop);
  useEffect(() => {
    isLoopRef.current = isLoop;
  }, [isLoop]);

  // Chuyen doi chuoi "hh:mm:ss" sang so giay
  const timeStringToSeconds = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':');
    return (
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseFloat(seconds)
    );
  };

  // Cap nhat duong dan file audio khi volume thay doi
  useEffect(() => {
    if (volume?.audio) {
      setAudioSrc(`/media/${volume.audio}`);
    }
  }, [volume]);

  // Bat dau phat audio khi isPlaying = true.
  // Khi currentTime vuot qua endTime:
  //   - Neu dang loop (isLoopRef.current = true): khong dung, de useEffect loop xu ly
  //   - Neu khong loop: dung audio va bao parent reset trang thai
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;

    const start = timeStringToSeconds(startTime);
    const end = timeStringToSeconds(endTime);
    const player = playerRef.current.audio.current!;

    player.currentTime = start;
    player.playbackRate = playbackSpeed;
    player.play();

    const handleTimeUpdate = () => {
      // Doc tu ref de lay gia tri isLoop moi nhat, khong bi stale closure
      if (player.currentTime >= end && !isLoopRef.current) {
        player.pause();
        player.currentTime = start;
        handlePauseAudio(true);
        resetIsPlaying();
      }
    };

    player.addEventListener('timeupdate', handleTimeUpdate);
    return () => player.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlaying, playbackSpeed]);

  // Xu ly lap lai doan audio khi isLoop = true:
  // Moi khi currentTime cham endTime thi reset ve startTime
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

  // Cap nhat toc do phat khi nguoi dung thay doi
  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value);
    if (playerRef.current) {
      playerRef.current.audio.current!.playbackRate = value;
    }
  };

  return (
    <div className="audio-component-fixed">
      {audioSrc && (
        <>
          <AudioPlayer
            ref={playerRef}
            src={audioSrc}
            onPlay={() => {}}
            onPause={() => playerRef.current?.audio.current?.pause()}
            showJumpControls={false}
            autoPlay={false}
            loop={isLoop}
          />

          {/* Chon toc do phat */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 'bold' }}>Toc do phat:</span>
            <Select
              value={playbackSpeed}
              onChange={handleSpeedChange}
              style={{ width: 200 }}
              options={PLAYBACK_SPEED_OPTIONS}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AudioComponent;
