import { useCallback, useRef, useState } from 'react';
import { message } from 'antd';
import { getMediaPath } from '@/utils/mediaPathHelper';
import { parseTimeToSeconds } from '../helpers/timeHelpers';

// ============================================================
// USE AUDIO PLAYER HOOK
// Hook quan ly phat audio voi cac chuc nang:
// - Phat/dung audio theo doan thoi gian
// - Lap lai audio
// - Quan ly trang thai play/loop cua nhieu item
// ============================================================

interface UseAudioPlayerProps {
  playbackSpeed: number;
}

export const useAudioPlayer = ({ playbackSpeed }: UseAudioPlayerProps) => {
  // Dung ref thay vi state de tranh stale closure va re-render khong can thiet
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingIdRef = useRef<string | null>(null);

  // forceRender dung de ep React ve lai UI sau khi thay doi ref
  const [, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // Dung audio dang phat va reset trang thai tat ca item
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    currentPlayingIdRef.current = null;
    Object.keys(playStatesRef.current).forEach((key) => {
      playStatesRef.current[key] = false;
    });
    Object.keys(loopStatesRef.current).forEach((key) => {
      loopStatesRef.current[key] = false;
    });
    forceRender();
  }, []);

  // Khoi tao trang thai play/loop cho danh sach item moi
  const initializeStates = useCallback((itemIds: string[]) => {
    const playState: Record<string, boolean> = {};
    const loopState: Record<string, boolean> = {};
    itemIds.forEach((id) => {
      playState[id] = false;
      loopState[id] = false;
    });
    playStatesRef.current = playState;
    loopStatesRef.current = loopState;
    forceRender();
  }, []);

  // Bat/dung audio cua 1 item
  const toggleAudio = useCallback(
    (itemId: string, audioPath: string, startTime: string, endTime: string) => {
      const normalizedId = String(itemId);

      if (!audioPath || !startTime || !endTime) {
        message.error('Khong co tep am thanh hoac thoi gian khong hop le.');
        return;
      }

      const start = parseTimeToSeconds(startTime);
      const end = parseTimeToSeconds(endTime);

      if (start >= end) {
        message.error('Thoi gian bat dau phai nho hon thoi gian ket thuc.');
        return;
      }

      // Neu dang phat item nay: dung lai
      if (currentPlayingIdRef.current === normalizedId) {
        stopAudio();
        return;
      }

      // Dung audio cu truoc khi phat moi
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const audio = new Audio(getMediaPath(audioPath));
      audio.currentTime = start;
      audio.playbackRate = playbackSpeed;

      // Tu dong dung hoac lap lai khi den endTime
      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime >= end) {
          if (loopStatesRef.current[normalizedId]) {
            // Dang loop: quay lai dau doan
            audio.currentTime = start;
          } else {
            // Khong loop: dung va reset trang thai
            audio.pause();
            currentAudioRef.current = null;
            currentPlayingIdRef.current = null;
            Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
            Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
            forceRender();
          }
        }
      });

      // Reset trang thai khi audio ket thuc tu nhien
      audio.addEventListener('ended', () => {
        currentAudioRef.current = null;
        currentPlayingIdRef.current = null;
        Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
        forceRender();
      });

      currentAudioRef.current = audio;
      currentPlayingIdRef.current = normalizedId;
      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === normalizedId;
      });
      loopStatesRef.current[normalizedId] = false;
      forceRender();

      audio.play().catch(() => {
        message.error('Khong the phat am thanh.');
        stopAudio();
      });
    },
    [playbackSpeed, stopAudio]
  );

  // Bat/tat che do lap lai cho 1 item
  const toggleLoop = useCallback((itemId: string) => {
    const normalizedId = String(itemId);
    loopStatesRef.current[normalizedId] = !loopStatesRef.current[normalizedId];
    forceRender();
  }, []);

  // Cap nhat toc do phat khi playbackSpeed thay doi
  const updatePlaybackSpeed = useCallback((speed: number) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = speed;
    }
  }, []);

  return {
    playStatesRef,
    loopStatesRef,
    currentPlayingIdRef,
    toggleAudio,
    toggleLoop,
    stopAudio,
    initializeStates,
    updatePlaybackSpeed,
  };
};
