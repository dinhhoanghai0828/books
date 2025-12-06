'use client';
import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import VolumeContentComponent from '@/components/volumes/VolumeContentComponent';
import { useHasMounted } from '@/utils/customHook';
import { Volume } from '@/interfaces/volume';
import { getVolumes } from '@/utils/apiService';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import '../../../../styles/global.css';
import NProgress from 'nprogress'; // Import thư viện nprogress
import 'nprogress/nprogress.css'; // Import CSS mặc định của nprogress
const BookPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { bookSlug } = params;
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Gọi API lấy danh sách sách
  const fetchVolumes = async (page: number, size: number) => {
    NProgress.start();
    if (!bookSlug || Array.isArray(bookSlug)) return;
    setLoading(true);
    try {
      const response = await getVolumes(bookSlug, page, size);
      setVolumes(response.data);
      setTotalItems(response.totalElements);
    } catch (error) {
      console.error('Lỗi khi lấy sách:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Gọi API khi trang hoặc kích thước trang thay đổi
  useEffect(() => {
    fetchVolumes(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
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

      {/* Nội dung danh sách các tập */}
      <VolumeContentComponent volumes={volumes} loading={loading} />

      {/* Phân trang */}
      <PaginationComponent
        currentPage={currentPage}
        pageSize={pageSize}
        total={totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default BookPage;
