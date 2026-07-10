'use client';
import HomePageContentComponent from '@/components/content/HomePageContentComponent';
import HomePageSearchComponent from '@/components/content/HomePageSearchComponent';
import PaginationComponent from '@/components/pagination/PaginationComponent';
import { ContentType } from '@/interfaces/content';
import { getContentSearch, getHighLightWords } from '@/utils/apiService';
import { useHasMounted } from '@/utils/customHook';
import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import '../styles/global.css';
import '../styles/home-page.css';

const HomePage = () => {
  const hasMounted = useHasMounted();

  const [searchValueEn, setSearchValueEn] = useState('');
  const [searchValueVi, setSearchValueVi] = useState('');
  const [contents, setContents] = useState<ContentType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [highlightedEnKeywords, setHighlightedEnKeywords] = useState<string[]>([]);
  const [highlightedViKeywords, setHighlightedViKeywords] = useState<string[]>([]);

  // Lay danh sach noi dung theo tu khoa tim kiem va phan trang
  const fetchContents = async () => {
    NProgress.start();
    try {
      const response = await getContentSearch(searchValueEn, searchValueVi, currentPage, pageSize);
      setContents(response.data || []);
      setTotalItems(response.totalElements || 0);
    } catch (error) {
      console.error('Loi khi lay noi dung:', error);
    } finally {
      NProgress.done();
    }
  };

  // Lay danh sach tu can highlight tuong ung voi ket qua tim kiem
  const fetchHighlight = async () => {
    NProgress.start();
    try {
      const response = await getHighLightWords(searchValueEn, searchValueVi);
      setHighlightedEnKeywords(response.map((item) => item.eng));
      setHighlightedViKeywords(response.map((item) => item.vi));
    } catch (error) {
      console.error('Loi khi lay tu highlight:', error);
    } finally {
      NProgress.done();
    }
  };

  // Goi lai API moi khi tu khoa, trang hien tai, hoac kich thuoc trang thay doi
  useEffect(() => {
    fetchContents();
    fetchHighlight();
  }, [searchValueEn, searchValueVi, currentPage, pageSize]);

  // Cap nhat tu khoa tim kiem va reset ve trang dau
  const handleSearch = (searchEn: string, searchVi: string) => {
    setSearchValueEn(searchEn.trim());
    setSearchValueVi(searchVi.trim());
    setCurrentPage(1);
  };

  // Cap nhat trang va kich thuoc trang khi nguoi dung thay doi phan trang
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Chuyen gia tri toc do tu dang "100%" sang he so so thuc (vi du: "100%" -> 1.0)
  const handleSelectChange = (value: string) => {
    const speed = parseFloat(value.replace('%', '')) / 100;
    setSelectedSpeed(speed);
  };

  if (!hasMounted) return null;

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
};

export default HomePage;
