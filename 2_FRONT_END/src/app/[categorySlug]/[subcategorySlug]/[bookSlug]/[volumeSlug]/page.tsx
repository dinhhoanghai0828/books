'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import ContentComponent from '@/components/content/ContentComponent';
import AudioComponent from '@/components/footer/AudioComponent';
import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getContents, getVolumeDetail } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import { useParams, usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import '../../../../../styles/global.css';
import '../../../../../styles/volume.css';

// ============================================================
// COMPONENT
// ============================================================

const ContentPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { volumeSlug } = params;

  // Du lieu noi dung va thong tin tap
  const [contents, setContents] = useState<ContentType[]>([]);
  const [volume, setVolume] = useState<Volume>();
  const [loading, setLoading] = useState<boolean>(false);

  // Trang thai dieu khien audio
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isPause, setIsPause] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [itemId, setItemId] = useState<number>(0);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Lay danh sach noi dung cua tap
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

  // Lay thong tin chi tiet cua tap (ten, duong dan audio...)
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
  // AUDIO HANDLERS (truyen xuong ContentComponent va AudioComponent)
  // ============================================================

  // Bat dau phat audio: cap nhat startTime, endTime va danh dau isPlaying = true
  const handlePlayAudio = (startTime: string, endTime: string) => {
    setStartTime(startTime);
    setEndTime(endTime);
    setIsPause(false);
    setIsPlaying(true);
  };

  // Dung audio: danh dau isPlaying = false, isLoop = false
  const handlePauseAudio = (isPause: boolean) => {
    setIsPause(isPause);
    setIsPlaying(false);
    setIsLoop(false);
  };

  // AudioComponent goi khi audio chay xong tu nhien -> reset isPlaying
  const resetIsPlaying = () => {
    setIsPlaying(false);
  };

  // Cap nhat thong tin audio khi nguoi dung chon item hoac bat/tat loop
  const handleToggleAudio = (
    itemId: string,
    startTime: string,
    endTime: string,
    isLoop: boolean
  ) => {
    setItemId(Number(itemId));
    setStartTime(startTime);
    setEndTime(endTime);
    setIsLoop(isLoop);
  };

  // ============================================================
  // BREADCRUMB
  // ============================================================

  // Tao breadcrumb tu pathname, moi segment la 1 cap
  const breadcrumbItems = pathname
    .split('/')
    .filter((segment) => segment)
    .map((segment, index, array) => ({
      name: segment.replace(/-/g, ' ').toUpperCase(),
      path: `/${array.slice(0, index + 1).join('/')}`,
    }));

  // Tranh render phia client truoc khi component mount (Next.js hydration)
  if (!hasMounted) return <></>;

  return (
    <div>
      {/* Breadcrumb hien thi duong dan hien tai */}
      <BreadCrumbComponent items={breadcrumbItems} />

      {/* Danh sach noi dung cua tap */}
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

      {/* Thanh phat audio co dinh o cuoi man hinh (chi hien khi co file audio) */}
      {volume?.audio && (
        <AudioComponent
          startTime={startTime || ''}
          endTime={endTime || ''}
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
