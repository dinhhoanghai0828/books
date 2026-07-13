'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import VolumeContentComponent from '@/components/volumes/VolumeContentComponent';
import { Volume } from '@/interfaces/volume';
import { getVolumes } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../../styles/global.css';

const BookPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { bookSlug } = params;

  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lay danh sach cac tap cua sach, co phan trang
  const fetchVolumes = async (page: number, size: number) => {
    if (!bookSlug || Array.isArray(bookSlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      const response = await getVolumes(bookSlug, page, size);
      setVolumes(response.data);
      setTotalItems(response.totalElements);
    } catch (error) {
      console.error('Loi khi lay danh sach tap:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Goi lai API khi trang hoac kich thuoc trang thay doi
  useEffect(() => {
    fetchVolumes(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Refresh volumes sau khi cap nhat
  const handleVolumeUpdate = () => {
    fetchVolumes(currentPage, pageSize);
  };

  // Tao danh sach breadcrumb tu pathname hien tai
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
      <VolumeContentComponent volumes={volumes} loading={loading} onVolumeUpdate={handleVolumeUpdate} />
      <PaginationComponent
        currentPage={currentPage}
        pageSize={pageSize}
        total={totalItems}
        onPageChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default BookPage;
