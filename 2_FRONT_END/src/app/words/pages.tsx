'use client';
import Pagination from '@/components/common/Pagination/Pagination';
import WordsContent from '@/components/features/words/WordsContent';
import WordsSearch from '@/components/features/words/WordsSearch';
import { WordItem } from '@/types/word';
import { getWordSearch } from '@/lib/apiService';
import { useHasMounted } from '@/hooks/useHasMounted';
import { App, Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect, useState } from 'react';
import '../../styles/global.css';
import '../../styles/home-page.css';

const WordsPage = () => {
    const hasMounted = useHasMounted();

    const [searchEng, setSearchEng]   = useState('');
    const [searchVi, setSearchVi]     = useState('');
    const [words, setWords]           = useState<WordItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize]     = useState(50);
    const [totalItems, setTotalItems] = useState(0);

    const fetchWords = async () => {
        NProgress.start();
        try {
            const response = await getWordSearch(
                searchEng || null,
                searchVi  || null,
                currentPage,
                pageSize
            );
            setWords(response.data || []);
            setTotalItems(response.totalElements || 0);
        } catch (error) {
            console.error('Loi khi lay danh sach tu:', error);
        } finally {
            NProgress.done();
        }
    };

    useEffect(() => {
        fetchWords();
    }, [searchEng, searchVi, currentPage, pageSize]);

    const handleSearch = (eng: string, vi: string) => {
        setSearchEng(eng);
        setSearchVi(vi);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number, size: number) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    if (!hasMounted) return null;

    return (
        <App>
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ backgroundColor: '#fff' }}>
                    <WordsSearch
                        onSearch={handleSearch}
                        onWordAdded={fetchWords}
                    />
                    <WordsContent
                        words={words}
                        onRefresh={fetchWords}
                        searchEng={searchEng}
                        searchVi={searchVi}
                    />
                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        total={totalItems}
                        onPageChange={handlePageChange}
                    />
                </Content>
            </Layout>
        </App>
    );
};

export default WordsPage;
