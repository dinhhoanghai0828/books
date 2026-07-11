import { useCallback, useRef, useState } from 'react';
import { parseTimeToSeconds } from '../helpers/timeHelpers';

// ============================================================
// USE VIDEO PLAYER HOOK
// Hook quan ly phat video voi cac chuc nang:
// - Phat/dung video theo doan thoi gian
// - Lap lai video
// - Tu dong highlight item theo thoi gian
// ============================================================

interface UseVideoPlayerProps {
  contents: any[];
  onActiveItemChange?: (itemId: string) => void;
}

export const useVideoPlayer = ({ contents, onActiveItemChange }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoMounted, setVideoMounted] = useState(false);
  
  // Ref de luu thong tin doan video dang phat
  const videoSegmentRef = useRef({ start: 0, end: 0, itemId: '' });
  const isSeekingByCodeRef = useRef(false);
  const loopStatesRef = useRef<Record<string, boolean>>({});

  // Callback de set video ref
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    setVideoMounted(!!el);
  }, []);

  // Phat/dung video theo doan thoi gian
  const toggleVideo = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const video = videoRef.current;
      if (!video) return;

      const start = parseTimeToSeconds(startTime);
      const end = parseTimeToSeconds(endTime);

      // Neu dang phat doan nay: dung lai
      if (videoSegmentRef.current.itemId === itemId && isVideoPlaying) {
        video.pause();
        setIsVideoPlaying(false);
        videoSegmentRef.current = { start: 0, end: 0, itemId: '' };
        return;
      }

      // Phat doan moi
      videoSegmentRef.current = { start, end, itemId };
      isSeekingByCodeRef.current = true;
      video.currentTime = start;
      isSeekingByCodeRef.current = false;

      video.play();
      setIsVideoPlaying(true);
      
      if (onActiveItemChange) {
        onActiveItemChange(itemId);
      }
    },
    [isVideoPlaying, onActiveItemChange]
  );

  // Cap nhat trang thai loop cho item
  const toggleLoop = useCallback((itemId: string) => {
    loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
  }, []);

  // Dung video
  const stopVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsVideoPlaying(false);
      videoSegmentRef.current = { start: 0, end: 0, itemId: '' };
    }
  }, []);

  return {
    videoRef,
    videoRefCallback,
    isVideoPlaying,
    setIsVideoPlaying,
    videoSegmentRef,
    isSeekingByCodeRef,
    loopStatesRef,
    toggleVideo,
    toggleLoop,
    stopVideo,
  };
};
