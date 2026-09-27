'use client';
import BreadCrumbComponent from '@/components/breadcumb/BreadcrumbComponent';
import BookContentComponent from '@/components/books/BookContentComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import VolumeContentComponent from '@/components/volumes/VolumeContentComponent';
import ContentComponent from '@/components/content/ContentComponent';
import { Book } from '@/interfaces/book';
import { Volume } from '@/interfaces/volume';
import { ContentType } from '@/interfaces/content';
import { getBooksByCategorySlug, getVolumes, getVolumeDetail } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import '../../../../styles/global.css';
import '../../../../styles/volume.css';

// ============================================================
// Phân loại trang dựa vào slug pattern:
//
// URL: /[cat]/[subcat]/[bookSlug]
//   - bookSlug === subcategorySlug  → trang BOOKS (subcategory = book)
//   - bookSlug là volume slug       → trang CONTENT (3 cấp, không có volumeSlug riêng)
//   - bookSlug khác subcategorySlug → trang VOLUMES
//
// Cách phân biệt volume slug vs book slug:
//   - Gọi getVolumeDetail, nếu thành công → là volume → hiển thị content
//   - Nếu lỗi → là book slug → hiển thị volumes
// ============================================================

type PageMode = 'loading' | 'books' | 'volumes' | 'content';

const ThreeLevelBookPage = () => {
  const hasMounted = useHasMounted();
  const params = useParams();
  const pathname = usePathname();

  const subcategorySlug = Array.isArray(params.subcategorySlug)
    ? params.subcategorySlug[0]
    : (params.subcategorySlug ?? '');
  const bookSlug = Array.isArray(params.bookSlug)
    ? params.bookSlug[0]
    : (params.bookSlug ?? '');

  const [mode, setMode]         = useState<PageMode>('loading');
  const [books, setBooks]       = useState<Book[]>([]);
  const [volumes, setVolumes]   = useState<Volume[]>([]);
  const [contents, setContents] = useState<ContentType[]>([]);
  const [volume, setVolume]     = useState<Volume | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems]   = useState(0);
  const [loading, setLoading]   = useState(false);

  // ============================================================
  // Xác định mode và fetch dữ liệu
  // ============================================================

  useEffect(() => {
    if (!bookSlug || !subcategorySlug) return;
    setMode('loading');
    detectAndFetch();
  }, [bookSlug, subcategorySlug, currentPage, pageSize]);

  const detectAndFetch = async () => {
    NProgress.start();
    setLoading(true);
    try {
      if (bookSlug === subcategorySlug) {
        // Trang BOOKS
        const res = await getBooksByCategorySlug(subcategorySlug, currentPage, pageSize);
        setBooks(res.data);
        setTotalItems(res.totalElements);
        setMode('books');
        return;
      }

      // Thử xem bookSlug có phải volume không
      try {
        const volumeData = await getVolumeDetail(bookSlug);
        // Nếu thành công → là volume slug → hiển thị content
        setVolume(volumeData);
        setContents(volumeData.contents ?? []);
        setMode('content');
      } catch {
        // Không phải volume → là book slug → hiển thị volumes
        const res = await getVolumes(bookSlug, currentPage, pageSize);
        setVolumes(res.data);
        setTotalItems(res.totalElements);
        setMode('volumes');
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu:', err);
      setMode('books');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleVolumeUpdate = () => detectAndFetch();
  const handleContentUpdate = () => detectAndFetch();

  // ============================================================
  // Breadcrumb
  // ============================================================

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

  // ============================================================
  // Render
  // ============================================================

  return (
    <div>
      <BreadCrumbComponent items={breadcrumbItems} />

      {mode === 'content' ? (
        <ContentComponent
          contents={contents}
          loading={loading}
          volumeSlug={bookSlug}
          isPlaying={false}
          isParentPlaying={false}
          handlePlayAudio={() => {}}
          handlePauseAudio={() => {}}
          handleToggleAudio={() => {}}
          onViewModeChange={undefined}
          volume={volume}
          onContentUpdate={handleContentUpdate}
        />
      ) : mode === 'volumes' ? (
        <>
          <VolumeContentComponent
            volumes={volumes}
            loading={loading}
            onVolumeUpdate={handleVolumeUpdate}
          />
          <PaginationComponent
            currentPage={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </>
      ) : mode === 'books' ? (
        <>
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
        </>
      ) : (
        // loading state
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span>Đang tải...</span>
        </div>
      )}
    </div>
  );
};

export default ThreeLevelBookPage;
