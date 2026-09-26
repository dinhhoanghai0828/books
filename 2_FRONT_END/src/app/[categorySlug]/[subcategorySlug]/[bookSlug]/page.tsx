'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import BookContentComponent from '@/components/books/BookContentComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import VolumeContentComponent from '@/components/volumes/VolumeContentComponent';
import { Book } from '@/interfaces/book';
import { Volume } from '@/interfaces/volume';
import { getBooksBySubCategory, getVolumes } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../../styles/global.css';

const ThreeLevelBookPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { categorySlug, subcategorySlug, bookSlug } = params;

  const [books, setBooks] = useState<Book[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isVolumePage, setIsVolumePage] = useState(false);

  // Xác định xem đây là trang hiển thị books hay volumes
  useEffect(() => {
    // Nếu bookSlug giống với subcategorySlug thì đây là trang hiển thị books
    // Nếu khác thì đây là trang hiển thị volumes của một book cụ thể
    if (bookSlug && subcategorySlug && !Array.isArray(bookSlug) && !Array.isArray(subcategorySlug)) {
      setIsVolumePage(bookSlug !== subcategorySlug);
    }
  }, [bookSlug, subcategorySlug]);

  // Lay danh sach sach theo danh muc con (cho trang 3 cấp)
  const fetchBooks = async (page: number, size: number) => {
    if (!subcategorySlug || Array.isArray(subcategorySlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      const response = await getBooksBySubCategory(subcategorySlug, page, size);
      setBooks(response.data);
      setTotalItems(response.totalElements);
    } catch (error) {
      console.error('Loi khi lay danh sach sach:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Lay danh sach volumes theo book (cho trang hiển thị volumes)
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

  // Refresh volumes sau khi cap nhat
  const handleVolumeUpdate = () => {
    if (isVolumePage) {
      fetchVolumes(currentPage, pageSize);
    }
  };

  // Goi lai API khi trang hoac kich thuoc trang thay doi
  useEffect(() => {
    if (isVolumePage) {
      fetchVolumes(currentPage, pageSize);
    } else {
      fetchBooks(currentPage, pageSize);
    }
  }, [currentPage, pageSize, isVolumePage]);

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

export default ThreeLevelBookPage;