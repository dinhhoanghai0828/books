'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import ContentComponent from '@/components/content/ContentComponent';
import AudioComponent from '@/components/footer/AudioComponent';
import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getContents, getVolumeDetail } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import { useParams, usePathname } from 'next/navigation';
import NProgress from 'nprogress'; // Import thư viện nprogress
import 'nprogress/nprogress.css'; // Import CSS mặc định của nprogress
import { useEffect, useState } from 'react';
import '../../../../../styles/global.css';
import '../../../../../styles/volume.css';

const ContentPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { volumeSlug } = params;
  const [contents, setContents] = useState<ContentType[]>([]); // State cho danh sách nội dung
  const [volume, setVolume] = useState<Volume>(); // State để lưu dữ liệu volume
  const [loading, setLoading] = useState<boolean>(false); // State loading
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isPause, setIsPause] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isParentPlaying, setIsParentPlaying] = useState<boolean>(false);
  const [itemId, setItemId] = useState<number>(0);

  // Gọi API lấy danh sách sách
  const fetchContents = async () => {
    NProgress.start();
    if (!volumeSlug || Array.isArray(volumeSlug)) return;
    setLoading(true);
    try {
      const response = await getContents(volumeSlug);
      setContents(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy sách:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Gọi API lấy chi tiết volume
  const fetchVolumeDetail = async () => {
    NProgress.start();
    if (!volumeSlug || Array.isArray(volumeSlug)) return;
    try {
      const volumeData = await getVolumeDetail(volumeSlug);
      setVolume(volumeData);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết volume:', error);
    } finally {
      NProgress.done();
    }
  };

  useEffect(() => {
    fetchContents();
    fetchVolumeDetail();
  }, [volumeSlug]);

  const handlePlayAudio = (startTime: string, endTime: string) => {
    setStartTime(startTime);
    setEndTime(endTime);
    setIsPause(false);
    setIsPlaying(true);
  };
  const resetIsPlaying = () => {
    setIsPlaying(false); // Reset trạng thái isPlaying
  };

  const handlePauseAudio = (isPause: boolean) => {
    setIsPause(isPause);
    setIsPlaying(false);
    setIsLoop(false);
  };

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

  // Tạo dữ liệu Breadcrumb từ pathname
  const breadcrumbItems = pathname
    .split('/')
    .filter((segment) => segment) // Loại bỏ các segment rỗng
    .map((segment, index, array) => ({
      name: segment.replace(/-/g, ' ').toUpperCase(), // Tên hiển thị, đổi "-" thành " "
      path: `/${array.slice(0, index + 1).join('/')}`, // Đường dẫn
    }));
  if (!hasMounted) return <></>;

  return (
    <div>
      {/* Breadcrumb */}
      <BreadCrumbComponent items={breadcrumbItems} />

      {/* Nội dung tập truyện */}
      <ContentComponent
        contents={contents}
        loading={loading}
        volumeSlug={volumeSlug}
        handlePlayAudio={handlePlayAudio}
        handlePauseAudio={handlePauseAudio}
        handleToggleAudio={handleToggleAudio}
        isParentPlaying={isParentPlaying}
      />

      {/* Hiển thị thông tin volume và âm thanh */}
      {volume && volume.audio && (
        <AudioComponent
          startTime={startTime || ''}
          endTime={endTime || ''}
          isLoop={isLoop}
          itemId={itemId}
          isPause={isPause}
          isPlaying={isPlaying}
          volume={volume}
          resetIsPlaying={resetIsPlaying}
        />
      )}
    </div>
  );
};

export default ContentPage;
