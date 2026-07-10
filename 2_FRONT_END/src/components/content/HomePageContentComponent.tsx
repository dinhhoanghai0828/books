import { ContentType } from '@/interfaces/content';
import {
  CheckOutlined,
  EditOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Form,
  Input,
  Layout,
  message,
  Modal,
  notification,
  Row,
  Space,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { getMeaningWords, updateContent } from '@/utils/apiService';

const { Content } = Layout;
const { Text } = Typography;

// ============================================================
// TYPES
// ============================================================

interface HomePageContentComponentProps {
  contents: ContentType[];
  playbackSpeed: number;
  searchValueEn: string;
  searchValueVi: string;
  highlightedEnKeywords: string[];  // Tu can highlight (tu search highlight)
  highlightedViKeywords: string[];
}

// Style cho tooltip tra nghia tu
const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: '#108ee9',
  color: 'white',
  padding: '12px 15px',
  borderRadius: '8px',
  boxShadow: '0 1px 8px rgba(0,0,0,0.1)',
  zIndex: 10,
  maxWidth: '400px',
  wordWrap: 'break-word',
  fontSize: '15px',
  lineHeight: '1.9',
  transition: 'transform 0.2s ease-out',
};

// ============================================================
// HELPERS
// ============================================================

// Highlight cac tu khop voi keywords trong doan text
const highlightText = (
  text: string,
  keywords: string[] | string
): React.ReactNode => {
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  if (!keywordList.length || (keywordList.length === 1 && !keywordList[0])) {
    return text;
  }

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

// ============================================================
// COMPONENT
// ============================================================

const HomePageContentComponent = ({
  contents,
  playbackSpeed,
  searchValueEn,
  searchValueVi,
  highlightedEnKeywords,
  highlightedViKeywords,
}: HomePageContentComponentProps) => {
  // Du lieu hien thi (dong bo voi contents tu props)
  const [filteredData, setFilteredData] = useState<ContentType[]>(contents);

  // Dung ref thay vi state de tranh stale closure va re-render khong can thiet
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingIdRef = useRef<string | null>(null);

  // renderCount chi dung de ep React re-render sau khi doi ref
  const [renderCount, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // Trang thai tooltip tra nghia tu
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Trang thai modal chinh sua noi dung
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // ============================================================
  // EFFECTS
  // ============================================================

  // Dong bo du lieu va khoi tao trang thai play/loop khi contents thay doi
  useEffect(() => {
    const playState: Record<string, boolean> = {};
    const loopState: Record<string, boolean> = {};
    contents.forEach((item) => {
      playState[item.id] = false;
      loopState[item.id] = false;
    });
    playStatesRef.current = playState;
    loopStatesRef.current = loopState;
    setFilteredData(contents);
  }, [contents]);

  // Cap nhat toc do phat cua audio dang chay khi playbackSpeed thay doi
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // ============================================================
  // AUDIO HANDLERS
  // ============================================================

  // Chuyen doi chuoi "hh:mm:ss" sang so giay
  const parseTimeToSeconds = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Dung audio dang phat va reset trang thai tat ca item ve false
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    currentPlayingIdRef.current = null;
    Object.keys(playStatesRef.current).forEach((key) => {
      playStatesRef.current[key] = false;
    });
    Object.keys(loopStatesRef.current).forEach((key) => {
      loopStatesRef.current[key] = false;
    });
    forceRender();
  }, []);

  // Bat/dung audio cua 1 item
  // - Neu item dang phat: dung lai
  // - Neu item chua phat: dung item hien tai, tao Audio moi va phat
  const toggleAudio = useCallback(
    (
      itemId: string,
      audioPath: string,
      startTime: string,
      endTime: string
    ) => {
      if (!audioPath || !startTime || !endTime) {
        message.error('Khong co tep am thanh hoac thoi gian khong hop le.');
        return;
      }

      const start = parseTimeToSeconds(startTime);
      const end = parseTimeToSeconds(endTime);

      if (start >= end) {
        message.error('Thoi gian bat dau phai nho hon thoi gian ket thuc.');
        return;
      }

      if (currentPlayingIdRef.current === itemId) {
        // Dang phat item nay -> dung lai
        stopAudio();
        return;
      }

      // Dung item cu truoc khi phat item moi
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const audio = new Audio(`/media/${audioPath}`);
      audio.currentTime = start;
      audio.playbackRate = playbackSpeed;

      // Tu dong dung hoac lap lai khi den endTime
      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime >= end) {
          if (loopStatesRef.current[itemId]) {
            // Dang loop -> quay lai dau
            audio.currentTime = start;
          } else {
            // Khong loop -> dung lai va reset trang thai
            audio.pause();
            currentAudioRef.current = null;
            currentPlayingIdRef.current = null;
            Object.keys(playStatesRef.current).forEach((key) => {
              playStatesRef.current[key] = false;
            });
            Object.keys(loopStatesRef.current).forEach((key) => {
              loopStatesRef.current[key] = false;
            });
            forceRender();
          }
        }
      });

      // Xu ly truong hop audio ket thuc tu nhien
      audio.addEventListener('ended', () => {
        currentAudioRef.current = null;
        currentPlayingIdRef.current = null;
        Object.keys(playStatesRef.current).forEach((key) => {
          playStatesRef.current[key] = false;
        });
        forceRender();
      });

      currentAudioRef.current = audio;
      currentPlayingIdRef.current = itemId;

      // Cap nhat playStates: chi item dang click la true, cac item khac false
      Object.keys(playStatesRef.current).forEach((key) => {
        playStatesRef.current[key] = key === itemId;
      });
      loopStatesRef.current[itemId] = false;

      forceRender();

      audio.play().catch(() => {
        message.error('Khong the phat am thanh.');
        stopAudio();
      });
    },
    [playbackSpeed, stopAudio]
  );

  // Bat/tat che do lap lai cho 1 item (chi hoat dong khi item dang phat)
  const onToggleLoop = useCallback((itemId: string) => {
    loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
    forceRender();
  }, []);

  // ============================================================
  // TOOLTIP - TRA NGHIA TU
  // ============================================================

  // Lay nghia cua tu nguoi dung boi den (debounce 300ms)
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

        // Tranh goi API lai neu tu da duoc tra truoc do
        const alreadyShown =
          searchValue === meaningEnKeywords.join(' ') ||
          searchValue === meaningViKeywords.join(' ');
        if (alreadyShown) return;

        const isEnglish = /^[a-zA-Z ]+$/.test(searchValue);
        const response = isEnglish
          ? await getMeaningWords(searchValue, null)
          : await getMeaningWords(null, searchValue);

        if (response.length > 0) {
          setMeaningEnKeywords(response.map((w) => w.eng));
          setMeaningViKeywords(response.map((w) => w.vi));
        } else {
          setMeaningEnKeywords([]);
          setMeaningViKeywords([]);
        }

        // Dat toa do tooltip sat vi tri boi
        if (selection?.rangeCount) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          setTooltipPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY + 30,
          });
        }
      } catch (error) {
        console.error('Loi khi goi API tra nghia:', error);
      }
    }, 300),
    [meaningEnKeywords, meaningViKeywords]
  );

  // Lang nghe su kien boi chu de hien tooltip tra nghia
  // (phai dat SAU handleGetMeaning de tranh loi "cannot access before initialization")
  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => document.removeEventListener('selectionchange', handleGetMeaning);
  }, [handleGetMeaning]);

  // ============================================================
  // EDIT MODAL HANDLERS
  // ============================================================

  const handleOpenEdit = (item: ContentType) => {
    setEditingItem(item);
    editForm.setFieldsValue({ eng: item.eng, vi: item.vi });
    setEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    editForm.resetFields();
  };

  // Gui request cap nhat va cap nhat du lieu local neu thanh cong
  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await updateContent(editingItem.id, values.eng, values.vi);

      notifApi.success({
        message: 'Cap nhat thanh cong',
        description: 'Noi dung da duoc luu lai.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });

      // Cap nhat du lieu hien thi ngay ma khong can reload
      setFilteredData((prev) =>
        prev.map((it) =>
          it.id === editingItem.id ? { ...it, eng: values.eng, vi: values.vi } : it
        )
      );

      handleCancelEdit();
    } catch (error: any) {
      notifApi.error({
        message: 'Cap nhat that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setEditLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Content className="contentClass">
      {notifContextHolder}

      {filteredData && filteredData.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredData.map((item) => (
            <Col span={8} xs={24} sm={24} md={12} lg={12} key={item.id} className="colClass">
              <div className="frameClass">

                {/* Dong tieng Anh + icon check + nut play + nut loop + nut edit */}
                <div className="audioClass">
                  <Text strong className="engClass">
                    {highlightText(
                      item.eng,
                      highlightedEnKeywords.length > 0 ? highlightedEnKeywords : searchValueEn
                    )}
                  </Text>
                  <Space>
                    {/* Hien icon check neu item da duoc hoc */}
                    {item.checked === 'YES' && (
                      <CheckOutlined style={{ color: 'green', fontSize: '22px' }} />
                    )}
                    {/* Nut Play / Pause */}
                    <Button
                      type="link"
                      icon={
                        playStatesRef.current[item.id] ? <PauseOutlined /> : <PlayCircleOutlined />
                      }
                      onClick={() =>
                        toggleAudio(item.id, item.audio, item.startTime, item.endTime)
                      }
                    />
                    {/* Nut bat/tat lap lai (chi hoat dong khi dang phat) */}
                    <Button
                      type="link"
                      icon={
                        loopStatesRef.current[item.id]
                          ? <RetweetOutlined />
                          : <RollbackOutlined />
                      }
                      disabled={!playStatesRef.current[item.id]}
                      onClick={() => onToggleLoop(item.id)}
                    />
                    {/* Nut mo modal chinh sua */}
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEdit(item)}
                    />
                  </Space>
                </div>

                {/* Dong tieng Viet */}
                <Text className="viClass paddingBottom">
                  {highlightText(
                    item.vi,
                    highlightedViKeywords.length > 0 ? highlightedViKeywords : searchValueVi
                  )}
                </Text>

                {/* Ten sach */}
                <div className="bookEngName">{item.bookEngName}</div>
              </div>
            </Col>
          ))}

          {/* Tooltip tra nghia tu khi nguoi dung boi */}
          {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
            <div
              className="meaning-container"
              style={{
                ...TOOLTIP_STYLE,
                left: tooltipPosition.x,
                top: tooltipPosition.y,
              }}
            >
              {/^[a-zA-Z ]+$/.test(window.getSelection()?.toString().trim() || '')
                ? meaningEnKeywords.map((word, i) => (
                    <div key={i}><strong>{word}</strong>: {meaningViKeywords[i]}</div>
                  ))
                : meaningViKeywords.map((word, i) => (
                    <div key={i}><strong>{word}</strong>: {meaningEnKeywords[i]}</div>
                  ))}
            </div>
          )}
        </Row>
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      {/* Modal chinh sua noi dung */}
      <Modal
        title="Chinh sua noi dung"
        open={editModalOpen}
        onCancel={handleCancelEdit}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelEdit}>Huy</Button>
              <Button type="primary" loading={editLoading} onClick={handleUpdate}>
                Cap nhat
              </Button>
            </Space>
          </div>
        }
      >
        {editingItem && (
          <Form form={editForm} layout="vertical">
            <Form.Item label="ID">
              <Input value={editingItem.id} disabled />
            </Form.Item>
            <Form.Item
              label="Nghia tieng Anh"
              name="eng"
              rules={[{ required: true, message: 'Vui long nhap nghia tieng Anh' }]}
            >
              <Input.TextArea rows={4} maxLength={1000} showCount />
            </Form.Item>
            <Form.Item
              label="Nghia tieng Viet"
              name="vi"
              rules={[{ required: true, message: 'Vui long nhap nghia tieng Viet' }]}
            >
              <Input.TextArea rows={4} maxLength={1000} showCount />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Content>
  );
};

export default HomePageContentComponent;
