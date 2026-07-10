'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import ContentComponent from '@/components/content/ContentComponent';
import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getContents, getVolumeDetail } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useCallback, useEffect, useState } from 'react';
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

  // Trang thai dieu khien AudioPlayer ben trong AudioLayout
  const [startTime, setStartTime]   = useState('');
  const [endTime, setEndTime]       = useState('');
  const [isLoop, setIsLoop]         = useState(false);
  const [isPause, setIsPause]       = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [itemId, setItemId]         = useState(0);

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
  // AUDIO HANDLERS
  // ============================================================

  // Bat dau phat: set startTime/endTime/itemId va danh dau isPlaying
  const handlePlayAudio = useCallback((start: string, end: string, id: number) => {
    setIsPause(false);
    setItemId(id);
    setStartTime(start);
    setEndTime(end);
    setIsPlaying(true);
  }, []);

  // Dung phat va reset trang thai
  const handlePauseAudio = useCallback((pause: boolean) => {
    setIsPause(pause);
    setIsPlaying(false);
    setIsLoop(false);
  }, []);

  // AudioLayout goi khi audio tu dong ket thuc
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
        // Props audio truyen thang xuong AudioLayout
        volume={volume}
        startTime={startTime}
        endTime={endTime}
        isLoop={isLoop}
        isPause={isPause}
        itemId={itemId}
        resetIsPlaying={resetIsPlaying}
      />
    </div>
  );
};

export default ContentPage;
