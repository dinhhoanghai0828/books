'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import BookContentComponent from '@/components/books/BookContentComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import { Book } from '@/interfaces/book';
import { getBooksByCategory } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../styles/global.css';

const CategoryPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();
  const { categorySlug } = params;

  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lay danh sach sach theo danh muc lon, co phan trang
  const fetchBooks = async (page: number, size: number) => {
    if (!categorySlug || Array.isArray(categorySlug)) return;
    NProgress.start();
    setLoading(true);
    try {
      const response = await getBooksByCategory(categorySlug, page, size);
      setBooks(response.data);
      setTotalItems(response.totalElements);
    } catch (error) {
      console.error('Loi khi lay danh sach sach:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Goi lai API khi trang hoac kich thuoc trang thay doi
  useEffect(() => {
    fetchBooks(currentPage, pageSize);
  }, [currentPage, pageSize]);

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
      <BookContentComponent books={books} loading={loading} />
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

export default CategoryPage;
