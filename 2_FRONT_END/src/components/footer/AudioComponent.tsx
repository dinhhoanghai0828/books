import React, { useEffect, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player'; // Import React H5 Audio Player
import 'react-h5-audio-player/lib/styles.css'; // Import CSS mặc định
import '../../styles/audio.css'; // Nếu bạn cần thêm CSS tùy chỉnh
import { Volume } from '@/interfaces/volume';
import { Select } from 'antd';

interface AudioComponentProps {
  startTime: string; // Thời gian bắt đầu phát âm thanh
  endTime: string; // Thời gian kết thúc phát âm thanh
  isPause: boolean; // Biến để kiểm tra xem có dừng âm thanh không
  isPlaying: boolean;
  isLoop: boolean; // Biến để kiểm tra xem có lặp âm thanh không
  itemId: number;
  volume: Volume | undefined; // Thông tin về volume chứa tệp âm thanh
  resetIsPlaying: () => void;
}

const AudioComponent = ({
  startTime,
  endTime,
  isPause,
  isPlaying,
  isLoop,
  itemId,
  volume,
  resetIsPlaying,
}: AudioComponentProps) => {
  const playerRef = useRef<AudioPlayer | null>(null); // Tham chiếu đến React H5 Audio Player
  const [audioSrc, setAudioSrc] = useState<string>(''); // URL tệp âm thanh
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // State quản lý tốc độ phát
  // Hàm chuyển đổi chuỗi thời gian "hh:mm:ss" sang giây
  const timeStringToSeconds = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':');
    return (
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseFloat(seconds)
    );
  };

  useEffect(() => {
    // Hàm lấy tệp âm thanh với Authorization header
    //  const fetchAudioWithAuthorization = async () => {
    //   if (volume) {
    //     const token = localStorage.getItem('jwt'); // Lấy JWT từ localStorage
    //     if (token) {
    //       try {
    //         const response = await fetch(
    //           `${process.env.NEXT_PUBLIC_BACKEND_URL}/audio/${volume.audio}`,
    //           {
    //             headers: {
    //               Authorization: `Bearer ${token}`,
    //             },
    //           }
    //         );

    //         if (response.ok) {
    //           const blob = await response.blob(); // Lấy tệp âm thanh dưới dạng Blob
    //           const audioURL = URL.createObjectURL(blob); // Tạo URL từ Blob
    //           setAudioSrc(audioURL); // Lưu URL vào state
    //         } else {
    //           console.error('Không thể tải âm thanh:', response.statusText);
    //         }
    //       } catch (error) {
    //         console.error('Lỗi khi tải âm thanh:', error);
    //       }
    //     }
    //   }
    // Kiểm tra nếu có `volume` và có trường `audio` thì cập nhật đường dẫn tới tệp âm thanh
    if (volume && volume.audio) {
      // Đặt đường dẫn trực tiếp đến thư mục media
      const audioPath = `/media/${volume.audio}`;
      setAudioSrc(audioPath); // Cập nhật lại đường dẫn cho audioSrc
    }
  }, [volume]); // Chỉ chạy lại khi volume thay đổi

  useEffect(() => {
    if (playerRef.current && isPlaying) {
      const start = timeStringToSeconds(startTime); // Thời gian bắt đầu (giây)
      const end = timeStringToSeconds(endTime); // Thời gian bắt đầu (giây)
      const player = playerRef.current.audio.current!; // Lấy thẻ audio bên trong React H5 Audio Player
      // Đặt lại thời gian phát về `startTime`
      player.currentTime = start;
      player.playbackRate = playbackSpeed; // Áp dụng tốc độ phát
      // Tự động phát âm thanh
      player.play();
      resetIsPlaying(); // Gọi hàm reset trạng thái
      // Hàm xử lý khi cập nhật thời gian phát
      const handleTimeUpdate = () => {
        if (player.currentTime >= end && !isLoop) {
          player.pause(); // Dừng phát
          player.currentTime = start; // Reset về thời gian bắt đầu
        }
      };

      // Lắng nghe sự kiện `timeupdate`
      player.addEventListener('timeupdate', handleTimeUpdate);

      // Cleanup sự kiện khi unmount hoặc khi `isPlaying` thay đổi
      return () => {
        player.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [isPlaying, playbackSpeed]);

  // Khi chạy lặp lại 1 phần audio
  useEffect(() => {
    if (isLoop) {
      if (startTime !== '' && endTime !== '' && playerRef.current) {
        const start = timeStringToSeconds(startTime); // Thời gian bắt đầu (giây)
        const end = timeStringToSeconds(endTime); // Thời gian kết thúc (giây)
        const player = playerRef.current.audio.current!; // Lấy thẻ audio bên trong React H5 Audio Player
        // player.currentTime = start;
        const onTimeUpdate = () => {
          if (player.currentTime >= end) {
            player.currentTime = start; // Reset về `startTime`
          }
        };

        // Gắn sự kiện `timeupdate`
        player.addEventListener('timeupdate', onTimeUpdate);

        // Cleanup sự kiện khi component unmount hoặc `startTime`, `endTime` thay đổi
        return () => {
          player.removeEventListener('timeupdate', onTimeUpdate);
        };
      }
    }
  }, [isLoop, itemId, startTime, endTime]);

  useEffect(() => {
    if (playerRef.current && isPause) {
      const player = playerRef.current.audio.current!; // Lấy thẻ audio bên trong React H5 Audio Player
      player.pause();
    }
  }, [isPause]);

  const handlePlay = () => {};

  const handlePause = () => {
    if (playerRef.current) {
      const player = playerRef.current.audio.current!;
      player.pause();
    }
  };
  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value); // Cập nhật tốc độ phát
    if (playerRef.current) {
      const player = playerRef.current.audio.current!;
      player.playbackRate = value;
    }
  };

  return (
    <div className="audio-component-fixed">
      {audioSrc && (
        <>
          <AudioPlayer
            ref={playerRef}
            src={audioSrc} // Đường dẫn tới file âm thanh
            onPlay={handlePlay} // Gọi khi âm thanh bắt đầu phát
            onPause={handlePause} // Gọi khi âm thanh dừng phát
            showJumpControls={false} // Tắt nút tua
            autoPlay={false} // Không tự động phát
            loop={isLoop} // Không lặp lại tự động
          />
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Tốc độ phát:</span>
            <Select
              value={playbackSpeed}
              onChange={handleSpeedChange}
              style={{ width: 200 }}
              options={[
                { value: 0.5, label: '0.5x' },
                { value: 0.7, label: '0.7x' },
                { value: 0.8, label: '0.8x' },
                { value: 0.9, label: '0.9x' },
                { value: 1.0, label: '1.0x (Mặc định)' },
                { value: 1.2, label: '1.2x' },
                { value: 1.5, label: '1.5x' },
                { value: 1.7, label: '1.7x' },
                { value: 2.0, label: '2.0x' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AudioComponent;
