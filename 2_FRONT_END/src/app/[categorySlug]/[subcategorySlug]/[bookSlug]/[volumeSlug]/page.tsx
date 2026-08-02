'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import ContentComponent from '@/components/content/ContentComponent';
import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getVolumeDetail } from '@/utils/apiService';
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

  const [contents, setContents] = useState<ContentType[]>([]);
  const [volume, setVolume]     = useState<Volume>();
  const [loading, setLoading]   = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchVolumeDetail = async () => {
    if (!volumeSlug || Array.isArray(volumeSlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      const data = await getVolumeDetail(volumeSlug);
      setVolume(data);
      // Extract contents from volume detail
      if (data.contents) {
        setContents(data.contents);
      }
    } catch (error) {
      console.error('Loi khi lay chi tiet tap:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  useEffect(() => {
    fetchVolumeDetail();
  }, [volumeSlug]);

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
        isPlaying={false}
        isParentPlaying={false}
        handlePlayAudio={() => {}}
        handlePauseAudio={() => {}}
        handleToggleAudio={() => {}}
        onViewModeChange={undefined}
        volume={volume}
        onContentUpdate={fetchVolumeDetail}
      />
    </div>
  );
};

export default ContentPage;
