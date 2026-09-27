'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import BookContentComponent from '@/components/books/BookContentComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import VolumeContentComponent from '@/components/volumes/VolumeContentComponent';
import { Book } from '@/interfaces/book';
import { Volume } from '@/interfaces/volume';
import { getBooksByCategorySlug, getVolumes } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../styles/global.css';

const SubCategoryPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { categorySlug, subcategorySlug } = params;

  const [books, setBooks] = useState<Book[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  // isVolumePage = true khi subcategorySlug thực ra là bookSlug (không tìm được books)
  const [isVolumePage, setIsVolumePage] = useState(false);

  const fetchData = async (page: number, size: number) => {
    if (!subcategorySlug || Array.isArray(subcategorySlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      // Thử fetch books theo subcategorySlug trước
      const booksRes = await getBooksByCategorySlug(subcategorySlug as string, page, size);
      if (booksRes.data && booksRes.data.length > 0) {
        // Có books → đây là trang danh mục con
        setBooks(booksRes.data);
        setTotalItems(booksRes.totalElements);
        setIsVolumePage(false);
      } else {
        // Không có books → subcategorySlug chính là bookSlug → fetch volumes
        const volumesRes = await getVolumes(subcategorySlug as string, page, size);
        setVolumes(volumesRes.data);
        setTotalItems(volumesRes.totalElements);
        setIsVolumePage(true);
      }
    } catch (error) {
      console.error('Loi khi lay du lieu:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleVolumeUpdate = () => {
    if (isVolumePage) fetchData(currentPage, pageSize);
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize, subcategorySlug]);

  const breadcrumbItems = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => ({
      name: segment.replace(/-/g, ' ').toUpperCase(),
      path: index < array.length - 1
        ? `/${array.slice(0, index + 1).join('/')}`
        : undefined,
    }));

  if (!hasMounted) return null;

  return (
    <div>
      <BreadCrumbComponent items={breadcrumbItems} />
      {isVolumePage ? (
        <VolumeContentComponent volumes={volumes} loading={loading} onVolumeUpdate={handleVolumeUpdate} />
      ) : (
        <BookContentComponent books={books} loading={loading} />
      )}
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

export default SubCategoryPage;
