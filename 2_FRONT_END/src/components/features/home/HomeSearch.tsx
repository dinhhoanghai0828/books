'use client';
import { getSuggestions, runContentsExport } from '@/helpers/apiService';
import { Word } from '@/interfaces/word';
import { App, AutoComplete, Button, Col, Input, Layout, notification, Row, Select, Typography } from 'antd';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { useCallback, useState } from 'react';
import React from 'react';

const { Content } = Layout;
const { Title } = Typography;

// ============================================================
// HOME SEARCH COMPONENT
// Component tim kiem cau noi tren trang chu voi cac chuc nang:
// - Tim kiem theo tieng Anh hoac tieng Viet
// - AutoComplete goi y tu khi nhap
// - Chon toc do phat audio
// - Tong hop du lieu (word-general + contents-export)
// ============================================================

// Danh sach toc do phat co the chon
const SPEED_OPTIONS = [
  { value: '60%', label: '60%' },
  { value: '80%', label: '80%' },
  { value: '100%', label: '100%' },
  { value: '120%', label: '120%' },
  { value: '150%', label: '150%' },
  { value: '200%', label: '200%' },
];

interface HomeSearchProps {
  onSearch: (searchEn: string, searchVi: string) => void;
  onSelectChange: (value: string) => void;
}

const HomeSearch = React.memo(({
  onSearch,
  onSelectChange,
}: HomeSearchProps) => {
  const { message } = App.useApp();
  const [searchValueEn, setSearchValueEn] = useState('');
  const [searchValueVi, setSearchValueVi] = useState('');
  const [suggestionsEn, setSuggestionsEn] = useState<string[]>([]);
  const [suggestionsVi, setSuggestionsVi] = useState<string[]>([]);
  const [selectedSpeed, setSelectedSpeed] = useState('100%');
  const [loadingTonghop, setLoadingTonghop] = useState(false);
  const [notifApi, notifContextHolder] = notification.useNotification();

  // Lay goi y tu tieng Anh (debounce 300ms)
  const debounceFetchEn = useCallback(
    debounce(async (value: string) => {
      try {
        const results: Word[] = await getSuggestions(value, '');
        setSuggestionsEn(results.map((item) => item.eng));
      } catch (error) {
        console.error('Loi khi lay goi y tieng Anh:', error);
      }
    }, 300),
    []
  );

  // Lay goi y tu tieng Viet (throttle 300ms)
  const throttleFetchVi = useCallback(
    throttle(async (value: string) => {
      try {
        const results: Word[] = await getSuggestions('', value);
        setSuggestionsVi(results.map((item) => item.vi));
      } catch (error) {
        console.error('Loi khi lay goi y tieng Viet:', error);
      }
    }, 300),
    []
  );

  // Xu ly thay doi o nhap tieng Anh
  const handleChangeEn = (value: string) => {
    setSearchValueEn(value);
    debounceFetchEn(value);
  };

  // Xu ly thay doi o nhap tieng Viet
  const handleChangeVi = (value: string) => {
    setSearchValueVi(value);
    throttleFetchVi(value);
  };

  // Thuc hien tim kiem voi gia tri hien tai
  const handleSearch = () => {
    onSearch(searchValueEn.trim(), searchValueVi.trim());
  };

  // Xu ly phim Enter de tim kiem nhanh
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Cap nhat toc do phat va thong bao cho parent
  const handleSpeedChange = (value: string) => {
    setSelectedSpeed(value);
    onSelectChange(value);
  };

  // Goi lan luot 2 API: word-general roi contents-export
  const handleTonghop = async () => {
    setLoadingTonghop(true);
    try {
      const msgExport = await runContentsExport();
      notifApi.success({
        message: msgExport,
        description: 'Noi dung da duoc luu lai.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
    } catch (error: any) {
      // message.error('Tổng hợp thất bại: ' + error.message);
      notifApi.error({
        message: 'Cap nhat that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setLoadingTonghop(false);
    }
  };

  return (
    <Content className="searchClass">
      {notifContextHolder}
      <Title level={4}>Tim kiem cau noi</Title>
      <Row gutter={[16, 16]} justify="start" className="rowClass">

        {/* O AutoComplete tim kiem tieng Anh */}
        <Col span={8} xs={24} sm={8} md={8} lg={7}>
          <AutoComplete
            value={searchValueEn}
            onChange={handleChangeEn}
            onSelect={(value) => setSearchValueEn(value)}
            onClear={() => setSearchValueEn('')}
            options={suggestionsEn.map((item) => ({ value: item }))}
            style={{ width: '100%' }}
          >
            <Input
              placeholder="Nhap cau tieng Anh"
              allowClear
              onKeyDown={handleKeyDown}
            />
          </AutoComplete>
        </Col>

        {/* O AutoComplete tim kiem tieng Viet */}
        <Col span={8} xs={24} sm={8} md={8} lg={7}>
          <AutoComplete
            value={searchValueVi}
            onChange={handleChangeVi}
            onSelect={(value) => setSearchValueVi(value)}
            onClear={() => setSearchValueVi('')}
            options={suggestionsVi.map((item) => ({ value: item }))}
            style={{ width: '100%' }}
          >
            <Input
              placeholder="Nhap cau tieng Viet"
              allowClear
              onKeyDown={handleKeyDown}
            />
          </AutoComplete>
        </Col>

        {/* Nut tim kiem */}
        <Col span={4} xs={12} sm={4} md={4} lg={2}>
          <Button type="primary" size="large" onClick={handleSearch} block>
            Tim
          </Button>
        </Col>

        {/* Chon toc do phat */}
        <Col span={4} xs={12} sm={4} md={4} lg={4}>
          <Select
            value={selectedSpeed}
            onChange={handleSpeedChange}
            size="large"
            style={{ width: '100%' }}
            options={SPEED_OPTIONS}
          />
        </Col>

        {/* Nut tong hop: goi word-general + contents-export */}
        <Col span={4} xs={12} sm={4} md={4} lg={3}>
          <Button
            size="large"
            onClick={handleTonghop}
            loading={loadingTonghop}
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
            block
          >
            Tổng hợp
          </Button>
        </Col>
      </Row>
    </Content>
  );
});

HomeSearch.displayName = 'HomeSearch';

export default HomeSearch;
