'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import ContentComponent from '@/components/content/ContentComponent';
import AudioComponent from '@/components/footer/AudioComponent';
import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getContents, getVolumeDetail } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../../../styles/global.css';
import '../../../../../styles/volume.css';

const ContentPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { volumeSlug } = params;

  const [contents, setContents] = useState<ContentType[]>([]);
  const [volume, setVolume] = useState<Volume>();
  const [loading, setLoading] = useState(false);

  // Dung ref cho audio state de tranh tao lai callback moi re-render
  const audioStateRef = useRef({
    startTime: '',
    endTime: '',
    isLoop: false,
    isPause: false,
    isPlaying: false,
    itemId: 0,
  });

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoop, setIsLoop] = useState(false);
  const [isPause, setIsPause] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [itemId, setItemId] = useState(0);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchContents = async () => {
    if (!volumeSlug || Array.isArray(volumeSlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      const response = await getContents(volumeSlug);
      setContents(response.data);
    } catch (error) {
      console.error('Loi khi lay noi dung:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const fetchVolumeDetail = async () => {
    if (!volumeSlug || Array.isArray(volumeSlug)) return;
    NProgress.start();
    try {
      const data = await getVolumeDetail(volumeSlug);
      setVolume(data);
    } catch (error) {
      console.error('Loi khi lay chi tiet tap:', error);
    } finally {
      NProgress.done();
    }
  };

  useEffect(() => {
    fetchContents();
    fetchVolumeDetail();
  }, [volumeSlug]);

  // ============================================================
  // AUDIO HANDLERS - dung useCallback de giu ham on dinh, tranh ContentComponent re-render
  // ============================================================

  // Bat dau phat: set thoi gian moi + isPlaying=true
  // Dung itemId lam "key" de AudioComponent phat lai dung khi doi bai
  const handlePlayAudio = useCallback((start: string, end: string, id: number) => {
    setIsPause(false);
    setItemId(id);
    setStartTime(start);
    setEndTime(end);
    setIsPlaying(true);
  }, []);

  // Dung phat
  const handlePauseAudio = useCallback((pause: boolean) => {
    setIsPause(pause);
    setIsPlaying(false);
    setIsLoop(false);
  }, []);

  // AudioComponent goi khi audio tu ket thuc
  const resetIsPlaying = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Bat/tat loop cho item dang phat
  const handleToggleAudio = useCallback((
    id: string,
    start: string,
    end: string,
    loop: boolean
  ) => {
    setItemId(Number(id));
    setStartTime(start);
    setEndTime(end);
    setIsLoop(loop);
  }, []);

  // ============================================================
  // BREADCRUMB
  // ============================================================

  const breadcrumbItems = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => ({
      name: segment.replace(/-/g, ' ').toUpperCase(),
      path: `/${array.slice(0, index + 1).join('/')}`,
    }));

  if (!hasMounted) return null;

  return (
    <div>
      <BreadCrumbComponent items={breadcrumbItems} />

      <ContentComponent
        contents={contents}
        loading={loading}
        volumeSlug={volumeSlug}
        isPlaying={isPlaying}
        isParentPlaying={isPlaying}
        handlePlayAudio={handlePlayAudio}
        handlePauseAudio={handlePauseAudio}
        handleToggleAudio={handleToggleAudio}
        onViewModeChange={undefined}
        audioPlayer={
          volume?.audio ? (
            <AudioComponent
              startTime={startTime}
              endTime={endTime}
              isLoop={isLoop}
              itemId={itemId}
              isPause={isPause}
              isPlaying={isPlaying}
              volume={volume}
              resetIsPlaying={resetIsPlaying}
              handlePauseAudio={handlePauseAudio}
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default ContentPage;
