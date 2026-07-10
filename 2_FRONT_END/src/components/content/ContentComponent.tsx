import { ContentType } from '@/interfaces/content';
import { getMeaningWords, insertWord } from '@/utils/apiService';
import {
  MinusCircleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RetweetOutlined,
  RollbackOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Button, Empty, Form, Input, Modal, notification, Space, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/content.css';
import debounce from 'lodash.debounce';
import { useRouter } from 'next/navigation';

interface ContentComponentProps {
  contents: ContentType[];
  volumeSlug: string | string[];
  loading: boolean;
  handlePlayAudio: (startTime: string, endTime: string) => void;
  handlePauseAudio: (isStop: boolean) => void;
  handleToggleAudio: (
    itemId: string,
    startTime: string,
    endTime: string,
    isLoop: boolean
  ) => void;
  isParentPlaying: boolean;
}

const ContentComponent = ({
  contents,
  volumeSlug,
  handlePlayAudio,
  handlePauseAudio,
  handleToggleAudio,
}: ContentComponentProps) => {
  const router = useRouter();
  const { volumeEngName, volumeViName } = contents[0] || {};

  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});
  const [renderCount, setRenderCount] = useState(0);
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // States to control visibility
  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  //  Bat tat hightlight tu moi
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  // Thêm từ mới modal
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertForm] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const handleOpenInsert = () => {
    insertForm.resetFields();
    setInsertModalOpen(true);
  };

  const handleCancelInsert = () => {
    setInsertModalOpen(false);
    insertForm.resetFields();
  };

  const handleInsert = async () => {
    try {
      const values = await insertForm.validateFields();
      const viList: string[] = values.viList
        .map((item: { vi: string }) => item.vi?.trim())
        .filter(Boolean);

      if (viList.length === 0) {
        insertForm.setFields([
          { name: ['viList', 0, 'vi'], errors: ['Vui lòng nhập ít nhất 1 nghĩa tiếng Việt'] },
        ]);
        return;
      }

      setInsertLoading(true);
      await insertWord(values.eng.trim(), viList);
      api.success({
        message: 'Thêm từ thành công',
        description: `Đã thêm từ "${values.eng.trim()}" vào từ điển.`,
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelInsert();
    } catch (error: any) {
      if (error?.errorFields) return; // validation error, antd tự hiển thị
      api.error({
        message: 'Thêm từ thất bại',
        description: error.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setInsertLoading(false);
    }
  };
  useEffect(() => {
    const initialPlayState: Record<string, boolean> = {};
    const initialLoopState: Record<string, boolean> = {};
    contents.forEach((item) => {
      initialPlayState[item.id] = false;
      initialLoopState[item.id] = false;
    });

    playStatesRef.current = initialPlayState;
    loopStatesRef.current = initialLoopState;
  }, [contents]);

  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStatesRef.current[itemId];
      Object.keys(playStatesRef.current).forEach((key) => {
        playStatesRef.current[key] =
          key === itemId ? !isCurrentlyPlaying : false;
      });

      Object.keys(loopStatesRef.current).forEach((key) => {
        loopStatesRef.current[key] =
          key === itemId ? !isCurrentlyPlaying : false;
      });

      if (isCurrentlyPlaying) {
        handlePauseAudio(true);
      } else {
        handlePlayAudio(startTime, endTime);
        //  Lap vo han
        // handleToggleAudio(itemId, startTime, endTime, true);
         //  Khong Lap vo han
        handleToggleAudio(itemId, startTime, endTime, false);
      }

      setRenderCount((prev) => prev + 1);
    },
    [handlePlayAudio, handlePauseAudio, handleToggleAudio]
  );

  const onToggleLoop = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
      handleToggleAudio(
        itemId,
        startTime,
        endTime,
        loopStatesRef.current[itemId]
      );
      setRenderCount((prev) => prev + 1);
    },
    [handleToggleAudio]
  );

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

  useEffect(() => {
    const handleSelectionChange = () => {
      handleGetMeaning();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleGetMeaning]);

  return (
    <div className="content-container">
      {contextHolder}
      <Space>
        <Button
          icon={showEnglish ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setShowEnglish((prev) => !prev)}
          className="custom-button"
        >
          {showEnglish ? 'Show Eng' : 'Hide Eng'}
        </Button>
        <Button
          icon={showVietnamese ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setShowVietnamese((prev) => !prev)}
          className="custom-button"
        >
          {showVietnamese ? 'Show Vi' : 'Hide Vi'}
        </Button>
        <Button
          type="dashed"
          onClick={() => setHighlightMissingWords((prev) => !prev)}
          className="custom-button"
        >
          {highlightMissingWords ? 'Ẩn từ mới' : 'Từ mới'}
        </Button>
        <Button
          type="primary"
          onClick={() => router.push(`/test?volumeSlug=${volumeSlug}`)}
          className="custom-button"
        >
          Kiểm tra
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenInsert}
          className="custom-button"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Thêm từ mới
        </Button>
      </Space>
      {contents && contents.length > 0 ? (
        <div>
          <Typography.Title level={3} className="volume-title">
            {volumeEngName}
          </Typography.Title>
          <Typography.Text className="volume-vi-name">
            {volumeViName}
          </Typography.Text>
          <Typography.Text className="volume-total-sentence">
            Bài có tổng cộng:{' '}
            <strong style={{ color: 'red' }}>{contents.length}</strong> câu cần
            học
          </Typography.Text>
          {contents.map((item) => (
            <div key={item.id} className="content-item">
              <div className="eng-line">
                <div
                  style={{
                    visibility: showEnglish ? 'visible' : 'hidden', // This keeps the space occupied
                  }}
                >
                  <Typography.Text
                    strong
                    className="engClass"
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      handleGetMeaning();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      handleGetMeaning();
                    }}
                  >
                    {item.eng.split(/\s+/).map((word, idx) => {
                      const cleanedWord = word
                        .replace(/[.,?!";']/g, '')
                        .toLowerCase();
                      const isMissing =
                        highlightMissingWords &&
                        item.missingWords
                          ?.map((w) => w.toLowerCase())
                          .includes(cleanedWord);
                      return (
                        <span
                          key={idx}
                          className={isMissing ? 'highlight-missing' : ''}
                          style={
                            isMissing ? { backgroundColor: '#ffe58f' } : {}
                          }
                        >
                          {word + ' '}
                        </span>
                      );
                    })}
                  </Typography.Text>
                </div>
                <Space className="button-group">
                  <Button
                    type="link"
                    icon={
                      playStatesRef.current[item.id] ? (
                        <PauseOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={() =>
                      onPlayPauseAudio(item.id, item.startTime, item.endTime)
                    }
                  />
                  <Button
                    type="link"
                    icon={
                      loopStatesRef.current[item.id] ? (
                        <RetweetOutlined />
                      ) : (
                        <RollbackOutlined />
                      )
                    }
                    disabled={!playStatesRef.current[item.id]}
                    onClick={() =>
                      onToggleLoop(item.id, item.startTime, item.endTime)
                    }
                  />
                </Space>
              </div>
              <div
                style={{
                  visibility: showVietnamese ? 'visible' : 'hidden', // This keeps the space occupied
                }}
              >
                <Typography.Text
                  strong
                  className="viClass"
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleGetMeaning();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleGetMeaning();
                  }}
                >
                  {item.vi}
                </Typography.Text>
              </div>
            </div>
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
        </div>
      ) : (
        <Empty description="Không có dữ liệu" className="emptyClass" />
      )}

      {/* Modal thêm từ mới */}
      <Modal
        title="Thêm từ mới"
        open={insertModalOpen}
        onCancel={handleCancelInsert}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelInsert}>Hủy</Button>
              <Button type="primary" loading={insertLoading} onClick={handleInsert}>
                Thêm mới
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={insertForm} layout="vertical">
          <Form.Item
            label="Từ tiếng Anh"
            name="eng"
            rules={[{ required: true, message: 'Vui lòng nhập từ tiếng Anh' }]}
          >
            <Input placeholder="Nhập từ tiếng Anh..." />
          </Form.Item>

          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    key={field.key}
                    label={index === 0 ? 'Nghĩa tiếng Việt' : ''}
                    required={index === 0}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'vi']}
                        noStyle
                        rules={
                          index === 0
                            ? [{ required: true, message: 'Vui lòng nhập nghĩa tiếng Việt' }]
                            : []
                        }
                      >
                        <Input
                          placeholder={`Nghĩa ${index + 1}...`}
                          style={{ flex: 1, width: '100%' }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                          style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
                        />
                      )}
                    </div>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ vi: '' })}
                    icon={<PlusOutlined />}
                    block
                  >
                    Thêm nghĩa
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentComponent;
