'use client';
import {
  Button,
  Col,
  Layout,
  Row,
  Select,
  Typography,
  AutoComplete,
} from 'antd';
import React, { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { getSuggestions } from '@/utils/apiService';
import { Word } from '@/interfaces/word';

const { Content } = Layout;
const { Title } = Typography;

interface HomePageSearchComponentProps {
  onSearch: (searchEn: string, searchVi: string) => void;
  onSelectChange: (value: string) => void;
}

const HomePageSearchComponent: React.FC<HomePageSearchComponentProps> = ({
  onSearch,
  onSelectChange,
}) => {
  const [searchValueEn, setSearchValueEn] = useState('');
  const [searchValueVi, setSearchValueVi] = useState('');
  const [suggestionsEn, setSuggestionsEn] = useState<string[]>([]);
  const [suggestionsVi, setSuggestionsVi] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState('100%'); // Giá trị mặc định

  // Get the last word in a string
  const getLastWord = (str: string): string => {
    const words = str.trim().split(' ');
    return words[words.length - 1];
  };

  // Fetch suggestions from the server
  const fetchSuggestions = async (eng: string, vi: string): Promise<Word[]> => {
    return await getSuggestions(eng, vi);
  };

  // Debounce function to limit API calls for English suggestions
  const debounceFetchSuggestions = useCallback(
    debounce(
      async (
        value: string,
        setSuggestions: React.Dispatch<React.SetStateAction<string[]>>
      ) => {
        try {
          const results = await fetchSuggestions(value, '');
          const suggestions = results.map((item) => item.eng); // Extract English words
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching English suggestions:', error);
        }
      },
      300
    ),
    []
  );

  // Throttle function to limit API calls for Vietnamese suggestions
  const throttleFetchSuggestions = useCallback(
    throttle(
      async (
        value: string,
        setSuggestions: React.Dispatch<React.SetStateAction<string[]>>
      ) => {
        try {
          const results = await fetchSuggestions('', value);
          const suggestions = results.map((item) => item.vi); // Extract Vietnamese words
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching Vietnamese suggestions:', error);
        }
      },
      300
    ),
    []
  );

  // Handle English search input change
  const handleSearchChangeEn = (value: string) => {
    setSearchValueEn(value);
    debounceFetchSuggestions(value, setSuggestionsEn);
  };

  // Handle Vietnamese search input change
  const handleSearchChangeVi = (value: string) => {
    setSearchValueVi(value);
    throttleFetchSuggestions(value, setSuggestionsVi);
  };

  // Handle the selection of suggestions for English
  const handleSelectEn = (value: string) => {
    setSearchValueEn(value); // Set the search value to the selected suggestion
  };

  // Handle the selection of suggestions for Vietnamese
  const handleSelectVi = (value: string) => {
    setSearchValueVi(value); // Set the search value to the selected suggestion
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = () => {
    onSearch(searchValueEn.trim(), searchValueVi.trim());
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    onSelectChange(value);
  };

  return (
    <Content className="searchClass">
      <Title level={4}>Tìm kiếm câu nói</Title>
      <Row gutter={[16, 16]} justify="start" className="rowClass">
        {/* AutoComplete for English */}
        <Col span={8} xs={24} sm={8} md={8} lg={7}>
          <AutoComplete
            value={searchValueEn}
            onChange={handleSearchChangeEn}
            onSelect={handleSelectEn} // Replace the last word with selected suggestion
            onClear={() => setSearchValueEn('')} // Đảm bảo xóa hoàn toàn giá trị
            options={
              suggestionsEn.length > 0 &&
              suggestionsEn.map((item) => ({ value: item }))
            }
            style={{ width: '100%' }}
            placeholder="Nhập câu tiếng Anh"
            allowClear
          />
        </Col>

        {/* AutoComplete for Vietnamese */}
        <Col span={8} xs={24} sm={8} md={8} lg={7}>
          <AutoComplete
            value={searchValueVi}
            onChange={handleSearchChangeVi}
            onSelect={handleSelectVi} // Replace the last word with selected suggestion
            options={
              suggestionsVi.length > 0 &&
              suggestionsVi.map((item) => ({ value: item }))
            }
            style={{ width: '100%' }}
            placeholder="Nhập câu tiếng Việt"
            allowClear
          />
        </Col>

        {/* Search Button */}
        <Col span={4} xs={12} sm={4} md={4} lg={2}>
          <Button type="primary" size="large" onClick={handleSearch} block>
            Tìm
          </Button>
        </Col>

        {/* Select */}
        <Col span={4} xs={12} sm={4} md={4} lg={4}>
          <Select
            value={selectedValue}
            onChange={handleSelectChange}
            size="large"
            style={{ width: '100%' }}
            options={[
              { value: '60%', label: '60%' },
              { value: '80%', label: '80%' },
              { value: '100%', label: '100%' },
              { value: '120%', label: '120%' },
              { value: '150%', label: '150%' },
              { value: '200%', label: '200%' },
            ]}
          />
        </Col>
      </Row>
    </Content>
  );
};

export default HomePageSearchComponent;
