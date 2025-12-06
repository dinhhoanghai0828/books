'use client';
import HomePageContentComponent from '@/components/content/HomePageContentComponent';
import HomePageSearchComponent from '@/components/content/HomePageSearchComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import { ContentType } from '@/interfaces/content';
import { getContentSearch, getHighLightWords } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import NProgress from 'nprogress'; // Import thư viện nprogress
import 'nprogress/nprogress.css'; // Import CSS của nprogress
import { useEffect, useState } from 'react';
import '../styles/global.css'; // CSS của bạn
import '../styles/home-page.css'; // CSS của bạn

function HomePage() {
  const [searchValueEn, setSearchValueEn] = useState<string>('');
  const [searchValueVi, setSearchValueVi] = useState<string>('');
  const [contents, setContents] = useState<ContentType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1); // Mặc định là 100%
  const hasMounted = useHasMounted();
  const [highlightedEnKeywords, setHighlightedEnKeywords] = useState<string[]>(
    []
  );
  const [highlightedViKeywords, setHighlightedViKeywords] = useState<string[]>(
    []
  );

  const fetchContents = async () => {
    NProgress.start(); // Bắt đầu thanh nprogress
    try {
      const response = await getContentSearch(
        searchValueEn,
        searchValueVi,
        currentPage,
        pageSize
      );
      setContents(response.data || []);
      setTotalItems(response.totalElements || 0);
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
    } finally {
      NProgress.done(); // Kết thúc thanh nprogress
    }
  };

  useEffect(() => {
    fetchContents();
    fetchHighlight();
  }, [searchValueEn, searchValueVi, currentPage, pageSize]); // Chạy khi bất kỳ state nào thay đổi

  const fetchHighlight = async () => {
    NProgress.start(); // Bắt đầu thanh nprogress
    try {
      const response = await getHighLightWords(searchValueEn, searchValueVi);
      // Tách các từ khóa từ kết quả trả về
      const enKeywords = response.map(
        (item: { eng: string; vi: string }) => item.eng
      );
      const viKeywords = response.map(
        (item: { eng: string; vi: string }) => item.vi
      );

      // Cập nhật state
      setHighlightedEnKeywords(enKeywords);
      setHighlightedViKeywords(viKeywords);
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
    } finally {
      NProgress.done(); // Kết thúc thanh nprogress
    }
  };

  const handleSearch = async (searchEn: string, searchVi: string) => {
    const trimmedEn = searchEn.trim();
    const trimmedVi = searchVi.trim();
    setSearchValueEn(trimmedEn);
    setSearchValueVi(trimmedVi);
    setCurrentPage(1);
  };

  const handlePageChange = async (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSelectChange = (value: string) => {
    const speed = parseFloat(value.replace('%', '')) / 100; // Chuyển giá trị % sang hệ số
    setSelectedSpeed(speed); // Lưu tốc độ
  };

  if (!hasMounted) return <></>; // Chỉ render khi đã mount

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="contentClass">
        <HomePageSearchComponent
          onSearch={handleSearch}
          onSelectChange={handleSelectChange}
        />
        <HomePageContentComponent
          contents={contents}
          playbackSpeed={selectedSpeed}
          searchValueEn={searchValueEn}
          searchValueVi={searchValueVi}
          highlightedEnKeywords={highlightedEnKeywords}
          highlightedViKeywords={highlightedViKeywords}
        />
        <PaginationComponent
          currentPage={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={handlePageChange}
        />
      </Content>
    </Layout>
  );
}

export default HomePage;
