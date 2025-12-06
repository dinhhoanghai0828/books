'use client';
import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import BookContentComponent from '@/components/books/BookContentComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import { Book } from '@/interfaces/book';
import { getBooksBySubCategory } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import '../../../styles/global.css';
import NProgress from 'nprogress'; // Import thư viện nprogress
import 'nprogress/nprogress.css'; // Import CSS mặc định của nprogress
const SubCategoryPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { subcategorySlug } = params;
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Gọi API lấy danh sách sách
  const fetchBooks = async (page: number, size: number) => {
    NProgress.start();
    if (!subcategorySlug || Array.isArray(subcategorySlug)) return;
    setLoading(true);
    try {
      const response = await getBooksBySubCategory(subcategorySlug, page, size);
      setBooks(response.data);
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
    fetchBooks(currentPage, pageSize);
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

      {/* Nội dung danh sách sách */}
      <BookContentComponent books={books} loading={loading} />

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

export default SubCategoryPage;
