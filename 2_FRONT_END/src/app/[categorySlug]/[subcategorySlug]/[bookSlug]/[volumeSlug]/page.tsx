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
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../../../styles/global.css';
import '../../../../../styles/volume.css';

const ContentPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { volumeSlug } = params;

  // Du lieu noi dung va thong tin tap hien tai
  const [contents, setContents] = useState<ContentType[]>([]);
  const [volume, setVolume] = useState<Volume>();
  const [loading, setLoading] = useState(false);

  // Trang thai dieu khien AudioComponent
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoop, setIsLoop] = useState(false);
  const [isPause, setIsPause] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [itemId, setItemId] = useState(0);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Lay toan bo noi dung (cac cau) cua tap theo volumeSlug
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

  // Lay thong tin chi tiet cua tap (ten, duong dan audio, startTime, endTime...)
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

  // Bat dau phat: cap nhat thoi gian va danh dau trang thai dang phat
  const handlePlayAudio = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    setIsPause(false);
    setIsPlaying(true);
  };

  // Dung phat: danh dau trang thai dung, reset loop
  const handlePauseAudio = (pause: boolean) => {
    setIsPause(pause);
    setIsPlaying(false);
    setIsLoop(false);
  };

  // AudioComponent goi khi audio tu dong ket thuc -> reset isPlaying
  const resetIsPlaying = () => {
    setIsPlaying(false);
  };

  // Cap nhat thong tin item dang phat va trang thai loop
  const handleToggleAudio = (
    id: string,
    start: string,
    end: string,
    loop: boolean
  ) => {
    setItemId(Number(id));
    setStartTime(start);
    setEndTime(end);
    setIsLoop(loop);
  };

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
      />

      {/* Thanh audio co dinh o cuoi man hinh, chi hien khi tap co file audio */}
      {volume?.audio && (
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
      )}
    </div>
  );
};

export default ContentPage;
