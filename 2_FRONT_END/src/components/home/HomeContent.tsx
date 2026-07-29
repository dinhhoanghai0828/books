import { ContentType } from '@/interfaces/content';
import { getMeaningWords, updateContent } from '@/utils/apiService';
import { getMediaPath } from '@/utils/mediaPathHelper';
import {
  CheckOutlined,
  EditOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  RollbackOutlined,
  VideoCameraOutlined,
  SoundOutlined,
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
  Select,
  Space,
  Typography,
} from 'antd';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';

const { Content } = Layout;
const { Text } = Typography;

// ============================================================
// HOME CONTENT COMPONENT
// Component hien thi danh sach noi dung tren trang chu voi cac chuc nang:
// - Phat audio theo doan thoi gian
// - Lap lai audio
// - Xem video theo doan thoi gian
// - Tra nghia tu khi boi chon text
// - Chinh sua noi dung
// ============================================================

interface HomeContentProps {
  contents: ContentType[];
  playbackSpeed: number;
  searchValueEn: string;
  searchValueVi: string;
  highlightedEnKeywords: string[];
  highlightedViKeywords: string[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

// Style cho tooltip tra nghia tu — dung fixed thay vi absolute
// de khong bi anh huong boi overflow hay transform cua parent
const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#1d1d2e',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 10,
  boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
  zIndex: 10000,
  maxWidth: 360,
  wordWrap: 'break-word',
  fontSize: 14,
  lineHeight: '1.85',
  pointerEvents: 'auto',
  borderLeft: '4px solid #108ee9',
};

const TOOLTIP_BODY_STYLE: React.CSSProperties = {
  maxHeight: '60vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  pointerEvents: 'auto',
};

// ============================================================
// HELPERS
// ============================================================

// Highlight cac tu khop voi keywords trong doan van ban
const highlightText = (
  text: string,
  keywords: string[] | string
): React.ReactNode => {
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  if (!keywordList.length || (keywordList.length === 1 && !keywordList[0])) {
    return text;
  }
  const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part)
      ? <mark key={index} style={{ backgroundColor: 'yellow' }}>{part}</mark>
      : part
  );
};

// ============================================================
// COMPONENT
// ============================================================

const HomeContent = React.memo(({
  contents,
  playbackSpeed,
  searchValueEn,
  searchValueVi,
  highlightedEnKeywords,
  highlightedViKeywords,
  selectedVoice,
  onVoiceChange,
}: HomeContentProps) => {
  // Du lieu hien thi (dong bo voi contents tu props)
  const [filteredData, setFilteredData] = useState<ContentType[]>(contents);

  // Dung ref thay vi state de tranh stale closure va re-render khong can thiet
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingIdRef = useRef<string | null>(null);

  // forceRender dung de ep React ve lai UI sau khi thay doi ref
  const [, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // Trang thai tooltip tra nghia tu
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const meaningEnRef = useRef<string[]>([]);
  const meaningViRef = useRef<string[]>([]);
  meaningEnRef.current = meaningEnKeywords;
  meaningViRef.current = meaningViKeywords;

  // Trang thai modal chinh sua noi dung
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // Trang thai modal xem video
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoEndTime, setVideoEndTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Cap nhat toc do phat khi playbackSpeed thay doi
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Load available voices for text-to-speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Select default voice based on language if no voice is selected
        if (!selectedVoice) {
          const isEnglish = /^[a-zA-Z ]+$/.test(selectedText);
          const defaultVoice = voices.find(voice =>
            isEnglish ? voice.lang.startsWith('en') : voice.lang.startsWith('vi')
          );
          if (defaultVoice) {
            onVoiceChange(defaultVoice.name);
          }
        }
      };

      // Load voices immediately
      loadVoices();

      // Some browsers load voices asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [selectedText, selectedVoice, onVoiceChange]);

  // ============================================================
  // AUDIO HELPERS
  // ============================================================

  // Chuyen chuoi "hh:mm:ss" thanh so giay
  const parseTimeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Dung audio dang phat va reset trang thai tat ca item
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

  // ============================================================
  // AUDIO HANDLERS
  // ============================================================

  // Bat/dung audio cua 1 item:
  // - Neu dang phat item nay: dung lai
  // - Neu chua phat: dung item cu, tao Audio moi va phat
  const toggleAudio = useCallback(
    (itemId: string, audioPath: string, startTime: string, endTime: string) => {
      // Ep itemId ve string de tranh type mismatch
      const normalizedId = String(itemId);

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

      if (currentPlayingIdRef.current === normalizedId) {
        stopAudio();
        return;
      }

      // Dung audio cu truoc khi phat moi
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const audio = new Audio(getMediaPath(audioPath));
      audio.currentTime = start;
      audio.playbackRate = playbackSpeed;

      // Tu dong dung hoac lap lai khi den endTime
      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime >= end) {
          if (loopStatesRef.current[normalizedId]) {
            // Dang loop: quay lai dau doan
            audio.currentTime = start;
          } else {
            // Khong loop: dung va reset trang thai
            audio.pause();
            currentAudioRef.current = null;
            currentPlayingIdRef.current = null;
            Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
            Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
            forceRender();
          }
        }
      });

      // Reset trang thai khi audio ket thuc tu nhien
      audio.addEventListener('ended', () => {
        currentAudioRef.current = null;
        currentPlayingIdRef.current = null;
        Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
        forceRender();
      });

      currentAudioRef.current = audio;
      currentPlayingIdRef.current = normalizedId;
      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === normalizedId;
      });
      loopStatesRef.current[normalizedId] = false;
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
    const normalizedId = String(itemId);
    loopStatesRef.current[normalizedId] = !loopStatesRef.current[normalizedId];
    forceRender();
  }, []);

  // ============================================================
  // TOOLTIP - TRA NGHIA TU
  // ============================================================

  // Lay nghia cua tu nguoi dung boi chon (debounce 300ms)
  const handleGetMeaning = useMemo(
    () =>
      debounce(async () => {
        try {
          const selection = window.getSelection();
          const searchValue = selection?.toString().trim();

          if (!searchValue) {
            setMeaningEnKeywords([]);
            setMeaningViKeywords([]);
            setSelectedText('');
            return;
          }

          setSelectedText(searchValue);

          const alreadyShown =
            searchValue === meaningEnRef.current.join(' ') ||
            searchValue === meaningViRef.current.join(' ');
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

          if (selection?.rangeCount) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            setTooltipPosition({
              x: Math.min(rect.left, window.innerWidth - 380),
              y: rect.bottom + 8,
            });
          }
        } catch (error) {
          console.error('Loi khi tra nghia tu:', error);
        }
      }, 300),
    []
  );

  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => {
      document.removeEventListener('selectionchange', handleGetMeaning);
      handleGetMeaning.cancel();
    };
  }, [handleGetMeaning]);

  // Dong tooltip khi nguoi dung click ra ngoai vung boi
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the tooltip
      const target = event.target as HTMLElement;
      const tooltip = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
      const dropdown = document.querySelector('.ant-select-dropdown');

      // Don't close if clicking inside tooltip or dropdown
      if (tooltip?.contains(target) || dropdown?.contains(target)) {
        return;
      }

      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!text || text.trim().length === 0) {
      message.error('Vui long chon text de doc.');
      return;
    }

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Clean text - remove extra whitespace and special characters that might cause issues
      const cleanedText = text
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width characters
        .trim();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.rate = playbackSpeed;
        utterance.lang = /^[a-zA-Z ]+$/.test(cleanedText) ? 'en-US' : 'vi-VN';

        // Set selected voice if available
        if (selectedVoice) {
          const voice = availableVoices.find(v => v.name === selectedVoice);
          if (voice) {
            utterance.voice = voice;
          }
        }

        utterance.onerror = (event) => {
          console.error('TTS Error:', event.error, event);
          message.error(`Loi khi doc text: ${event.error}`);
        };

        utterance.onend = () => {
          console.log('TTS finished successfully');
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('TTS Exception:', error);
        message.error('Loi khi khoi tao text-to-speech.');
      }
    } else {
      message.error('Trinh duyet khong ho tro text-to-speech.');
    }
  };

  // ============================================================
  // EDIT MODAL HANDLERS
  // ============================================================

  // Chuyen chuoi "hh:mm:ss" thanh so giay
  const parseVideoTime = (time: string): number => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Mo modal va dat duong dan + khoang thoi gian can phat cua video
  const handleOpenVideo = (videoPath: string, startTime: string, endTime: string) => {
    setVideoSrc(getMediaPath(videoPath));
    setVideoStartTime(parseVideoTime(startTime));
    setVideoEndTime(parseVideoTime(endTime));
    setVideoModalOpen(true);
  };

  // Dong modal video va xoa src de dung phat ngam khi dong
  const handleCloseVideo = () => {
    setVideoModalOpen(false);
    setVideoSrc('');
    setVideoStartTime(0);
    setVideoEndTime(0);
  };

  // Khi video da load xong metadata: seek den startTime va bat dau phat
  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = videoStartTime;
    video.play();
  };

  // Tu dong dong modal khi video den endTime
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= videoEndTime) {
      handleCloseVideo();
    }
  };

  // Mo modal chinh sua voi du lieu cua item duoc chon
  const handleOpenEdit = (item: ContentType) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      eng: item.eng,
      vi: item.vi,
      startTime: item.startTime,
      endTime: item.endTime,
    });
    setEditModalOpen(true);
  };

  // Dong modal va reset form
  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    editForm.resetFields();
  };

  // Gui yeu cau cap nhat, cap nhat du lieu local neu thanh cong
  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await updateContent(editingItem.id, values.eng, values.vi, values.startTime, values.endTime);

      notifApi.success({
        message: 'Cap nhat thanh cong',
        description: 'Noi dung da duoc luu lai.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });

      // Cap nhat du lieu hien thi truc tiep, khong can reload
      setFilteredData((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? { ...it, eng: values.eng, vi: values.vi, startTime: values.startTime, endTime: values.endTime }
            : it
        )
      );
      handleCancelEdit();
    } catch (error: any) {
      if (error?.errorFields) return;
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

                {/* Dong tieng Anh + nut play + nut loop + nut chinh sua */}
                <div className="audioClass">
                  <Text strong className="engClass">
                    {highlightText(
                      item.eng,
                      highlightedEnKeywords.length > 0 ? highlightedEnKeywords : searchValueEn
                    )}
                  </Text>
                  <Space>
                    {item.checked === 'YES' && (
                      <CheckOutlined style={{ color: 'green', fontSize: 22 }} />
                    )}
                    {/* Nut Play / Pause */}
                    <Button
                      type="link"
                      icon={playStatesRef.current[item.id] ? <PauseOutlined /> : <PlayCircleOutlined />}
                      onClick={() => toggleAudio(item.id, item.audio, item.startTime, item.endTime)}
                    />
                    {/* Nut bat/tat lap lai, chi hoat dong khi item dang phat */}
                    <Button
                      type="link"
                      icon={loopStatesRef.current[item.id] ? <RetweetOutlined /> : <RollbackOutlined />}
                      disabled={!playStatesRef.current[item.id]}
                      onClick={() => onToggleLoop(item.id)}
                    />
                    {/* Nut xem video (chi hien khi item co video) */}
                    {item.video && (
                      <Button
                        type="link"
                        icon={<VideoCameraOutlined />}
                        onClick={() => handleOpenVideo(item.video!, item.startTime, item.endTime)}
                      />
                    )}
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

          {/* Tooltip tra nghia tu — render qua portal len document.body
              tranh bi cat boi overflow cua parent, dung fixed positioning */}
          {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 &&
            createPortal(
              <div style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
                <div style={TOOLTIP_BODY_STYLE}>
                <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <Button
                    type="link"
                    icon={<SoundOutlined />}
                    onClick={() => speakText(selectedText)}
                    style={{ color: '#7dd3fc', padding: 0, height: 'auto' }}
                  >
                    Đọc từ đã chọn
                  </Button>
                </div>
                {/^[a-zA-Z ]+$/.test(window.getSelection()?.toString().trim() || '') ? (
                  <>
                    <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1 }}>
                      EN → VI
                    </div>
                    {meaningEnKeywords.map((word, i) => (
                      <div key={i}>
                        <strong style={{ color: '#7dd3fc' }}>{word}</strong>
                        <span style={{ opacity: 0.8 }}> : </span>
                        {meaningViKeywords[i]}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: 1 }}>
                      VI → EN
                    </div>
                    {meaningViKeywords.map((word, i) => (
                      <div key={i}>
                        <strong style={{ color: '#7dd3fc' }}>{word}</strong>
                        <span style={{ opacity: 0.8 }}> : </span>
                        {meaningEnKeywords[i]}
                      </div>
                    ))}
                  </>
                )}
                </div>
              </div>,
              document.body
            )
          }
        </Row>
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      {/* Modal xem video */}
      <Modal
        title="Xem video"
        open={videoModalOpen}
        onCancel={handleCloseVideo}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          onLoadedMetadata={handleVideoLoaded}
          onTimeUpdate={handleVideoTimeUpdate}
          style={{ width: '100%', borderRadius: 8 }}
        />
      </Modal>

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
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ pattern: /^\d{2}:\d{2}:\d{2}\.\d{3}$/, message: 'Dinh dang: 00:00:00.000' }]}
            >
              <Input placeholder="00:00:00.000" />
            </Form.Item>
            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ pattern: /^\d{2}:\d{2}:\d{2}\.\d{3}$/, message: 'Dinh dang: 00:00:00.000' }]}
            >
              <Input placeholder="00:00:00.000" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Content>
  );
});

HomeContent.displayName = 'HomeContent';

export default HomeContent;
