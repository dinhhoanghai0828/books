import { ContentType } from '@/interfaces/content';
import {
  CheckOutlined,
  PauseOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Layout,
  Row,
  Typography,
  message,
  Space,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import { getMeaningWords } from '@/utils/apiService';
const { Content } = Layout;
const { Text } = Typography;

interface HomePageContentComponentProps {
  contents: ContentType[];
  playbackSpeed: number;
  searchValueEn: string;
  searchValueVi: string;
  highlightedEnKeywords: string[];
  highlightedViKeywords: string[];
}

const highlightText = (
  text: string,
  keywords: string[] | string
): React.ReactNode => {
  if (!keywords || (Array.isArray(keywords) && keywords.length === 0))
    return text;

  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} style={{ backgroundColor: 'yellow' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const HomePageContentComponent = ({
  contents,
  playbackSpeed,
  searchValueEn,
  searchValueVi,
  highlightedEnKeywords,
  highlightedViKeywords,
}: HomePageContentComponentProps) => {
  const [filteredData, setFilteredData] = useState<ContentType[]>(contents);
  const [playStates, setPlayStates] = useState<Record<string, boolean>>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  useEffect(() => {
    const initialState = contents.reduce((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setPlayStates(initialState);
    setFilteredData(contents);
  }, [contents]);

  useEffect(() => {
    if (currentAudio) {
      currentAudio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentAudio]);

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentPlayingId(null);
      setPlayStates((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  };

  const toggleAudio = (
    itemId: string,
    audioPath: string,
    startTime: string,
    endTime: string
  ) => {
    if (!audioPath || !startTime || !endTime) {
      message.error('Không có tệp âm thanh hoặc thời gian không hợp lệ.');
      return;
    }

    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);

    if (start >= end) {
      message.error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
      return;
    }

    if (currentPlayingId === itemId) {
      // Nếu đang phát, tạm dừng
      stopAudio();
    } else {
      // Nếu không, phát âm thanh mới
      stopAudio();

      const audioURL = `/media/${audioPath}`;
      const audio = new Audio(audioURL);

      audio.currentTime = start;
      audio.playbackRate = playbackSpeed;

      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime >= end) {
          audio.currentTime = start;
          audio.pause();
          stopAudio();
        }
      });

      audio.addEventListener('ended', () => stopAudio());

      setCurrentAudio(audio);
      setCurrentPlayingId(itemId);

      setPlayStates((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = key === itemId;
          return acc;
        }, {} as Record<string, boolean>)
      );

      audio.play().catch(() => {
        message.error('Không thể phát âm thanh.');
      });
    }
  };

  const parseTimeToSeconds = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleGetMeaning = useCallback(
    debounce(async () => {
      try {
        const selection = window.getSelection();
        const searchValue = selection?.toString().trim();

        if (!searchValue) {
          setMeaningEnKeywords([]);
          setMeaningViKeywords([]);
          return;
        }

        if (
          searchValue === meaningEnKeywords.join(' ') ||
          searchValue === meaningViKeywords.join(' ')
        ) {
          return;
        }

        let response = [];
        if (/^[a-zA-Z ]+$/.test(searchValue)) {
          response = await getMeaningWords(searchValue, null);
        } else {
          response = await getMeaningWords(null, searchValue);
        }

        if (response.length > 0) {
          setMeaningEnKeywords(response.map((item) => item.eng));
          setMeaningViKeywords(response.map((item) => item.vi));
        } else {
          setMeaningEnKeywords([]);
          setMeaningViKeywords([]);
        }

        if (selection?.rangeCount) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setTooltipPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY + 30,
          });
        }
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
      }
    }, 300),
    [meaningEnKeywords, meaningViKeywords]
  );
  //  Su kien tren mobile khi click vao chu
  useEffect(() => {
    const handleSelectionChange = () => {
      // Gọi hàm handleGetMeaning khi người dùng thay đổi văn bản đã chọn
      handleGetMeaning();
    };

    // Lắng nghe sự kiện selectionchange khi người dùng thay đổi văn bản được chọn
    document.addEventListener('selectionchange', handleSelectionChange);

    // Cleanup khi component unmount để tránh rò rỉ bộ nhớ
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleGetMeaning]);

  return (
    <Content className="contentClass">
      <>
        {filteredData && filteredData.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredData.map((item) => (
              <Col
                span={8}
                xs={24}
                sm={24}
                md={12}
                lg={12}
                key={item.id}
                className="colClass"
              >
                <div className="frameClass">
                  <div className="audioClass">
                    <Text strong className="engClass">
                      {highlightText(
                        item.eng,
                        highlightedEnKeywords &&
                          highlightedEnKeywords.length > 0
                          ? highlightedEnKeywords
                          : searchValueEn
                      )}
                    </Text>
                    <Space>
                      {/* Thêm icon check nếu checked = 'YES' */}
                      {item.checked === 'YES' && (
                        <CheckOutlined
                          style={{ color: 'green', fontSize: '22px' }}
                        />
                      )}
                      <Button
                        type="link"
                        icon={
                          playStates[item.id] ? (
                            <PauseOutlined />
                          ) : (
                            <PlayCircleOutlined />
                          )
                        }
                        onClick={() =>
                          toggleAudio(
                            item.id,
                            item.audio,
                            item.startTime,
                            item.endTime
                          )
                        }
                      />
                    </Space>
                  </div>
                  <Text className="viClass paddingBottom">
                    {highlightText(
                      item.vi,
                      highlightedViKeywords && highlightedViKeywords.length > 0
                        ? highlightedViKeywords
                        : searchValueVi
                    )}
                  </Text>
                  <div className="bookEngName">{item.bookEngName}</div>
                </div>
              </Col>
            ))}
            {/* Display meaning in a floating element */}
            {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
              <div
                className="meaning-container"
                style={{
                  position: 'absolute',
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  backgroundColor: '#108ee9',
                  color: 'white',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 8px rgba(0, 0, 0, 0.01)',
                  zIndex: 10,
                  maxWidth: '400px',
                  wordWrap: 'break-word',
                  fontSize: '15px',
                  lineHeight: '1.9',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                {/^[a-zA-Z ]+$/.test(
                  window.getSelection()?.toString().trim() || ''
                )
                  ? meaningEnKeywords.map((word, index) => (
                      <div key={index}>
                        <strong>{word}</strong>: {meaningViKeywords[index]}
                      </div>
                    ))
                  : meaningViKeywords.map((word, index) => (
                      <div key={index}>
                        <strong>{word}</strong>: {meaningEnKeywords[index]}
                      </div>
                    ))}
              </div>
            )}
          </Row>
        ) : (
          <Empty description="Không có dữ liệu" className="emptyClass" />
        )}
      </>
    </Content>
  );
};

export default HomePageContentComponent;
