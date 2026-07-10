import { ContentType } from '@/interfaces/content';
import { getMeaningWords, insertWord } from '@/utils/apiService';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RetweetOutlined,
  RollbackOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Space,
  Typography,
} from 'antd';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/content.css';

// ============================================================
// TYPES
// ============================================================

interface ContentComponentProps {
  contents: ContentType[];
  volumeSlug: string | string[];
  loading: boolean;
  isPlaying: boolean;
  isParentPlaying: boolean;
  handlePlayAudio: (startTime: string, endTime: string, itemId: number) => void;
  handlePauseAudio: (isStop: boolean) => void;
  handleToggleAudio: (itemId: string, startTime: string, endTime: string, isLoop: boolean) => void;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: '#108ee9',
  color: 'white',
  padding: '12px 15px',
  borderRadius: 8,
  boxShadow: '0 1px 8px rgba(0,0,0,0.1)',
  zIndex: 10,
  maxWidth: 400,
  wordWrap: 'break-word',
  fontSize: 15,
  lineHeight: '1.9',
  transition: 'transform 0.2s ease-out',
};

const ACTIVE_ITEM_STYLE: React.CSSProperties = {
  borderLeft: '4px solid #1677ff',
  paddingLeft: 10,
  backgroundColor: '#e6f4ff',
  borderRadius: 6,
  transition: 'background-color 0.3s ease',
};

// ============================================================
// HELPERS
// ============================================================

const parseTimeToSeconds = (time: string): number => {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

const findActiveItem = (contents: ContentType[], currentTime: number): ContentType | undefined =>
  contents.find((item) => {
    const start = parseTimeToSeconds(item.startTime);
    const end = parseTimeToSeconds(item.endTime);
    return currentTime >= start && currentTime < end;
  });

// ============================================================
// COMPONENT
// ============================================================

const ContentComponent = ({
  contents,
  volumeSlug,
  isPlaying,
  handlePlayAudio,
  handlePauseAudio,
  handleToggleAudio,
}: ContentComponentProps) => {
  const router = useRouter();
  const { volumeEngName, volumeViName } = contents[0] || {};

  const sharedVideoPath = contents.find((item) => item.video)?.video;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoEndRef = useRef<number>(0);

  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});
  const [, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // 1 state duy nhat cho highlight — chi 1 item duoc highlight tai 1 thoi diem
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItemIdRef = useRef<string | null>(null);

  // Phan biet item dang duoc phat boi audio hay video de hien icon dung
  const [activeSource, setActiveSource] = useState<'audio' | 'video' | null>(null);
  const activeSourceRef = useRef<'audio' | 'video' | null>(null);

  // Track trang thai video dang phat de re-render icon
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isVideoPlayingRef = useRef(false);

  // Helper: set ca state lan ref cung luc de dam bao dong bo
  const setActive = (id: string | null, source: 'audio' | 'video' | null) => {
    activeItemIdRef.current = id;
    activeSourceRef.current = source;
    setActiveItemId(id);
    setActiveSource(source);
  };
  const setVideoPlaying = (val: boolean) => {
    isVideoPlayingRef.current = val;
    setIsVideoPlaying(val);
  };

  // Ref vung cuon danh sach (layout 2 cot)
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  // Ref tung hang item de tinh offset scroll
  const itemRefsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // ============================================================
  // SCROLL HELPERS
  // ============================================================

  // Scroll window den item (dung cho layout 1 cot, bu offset header)
  const scrollToItem = (itemId: string) => {
    const el = itemRefsRef.current[itemId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 170;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Scroll noi bo vung danh sach, day item len ngang voi top vung cuon (= ngang video)
  const scrollToItemInList = (itemId: string) => {
    const container = listScrollRef.current;
    const el = itemRefsRef.current[itemId];
    if (!container || !el) return;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const offset = elTop - containerTop + container.scrollTop;
    container.scrollTo({ top: offset, behavior: 'smooth' });
  };

  // Scroll phu hop voi layout: neu co video (2 cot) thi scroll noi bo, nguoc lai scroll window
  const scrollToActiveItem = (itemId: string) => {
    if (sharedVideoPath) {
      scrollToItemInList(itemId);
    } else {
      scrollToItem(itemId);
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    const playState: Record<string, boolean> = {};
    const loopState: Record<string, boolean> = {};
    contents.forEach((item) => {
      playState[item.id] = false;
      loopState[item.id] = false;
    });
    playStatesRef.current = playState;
    loopStatesRef.current = loopState;
  }, [contents]);

  // Khi audio ket thuc tu nhien (isPlaying: true -> false): reset trang thai
  const prevIsPlayingRef = useRef(false);
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    if (wasPlaying && !isPlaying) {
      Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
      Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
      setActive(null, null);
      forceRender();
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Listener timeupdate cho video: highlight cau dang chay, scroll noi bo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      if (videoEndRef.current > 0 && currentTime >= videoEndRef.current) {
        video.pause();
        videoEndRef.current = 0;
        setActive(null, null);
        setVideoPlaying(false);
        return;
      }

      const activeItem = findActiveItem(contents, currentTime);
      if (activeItem) {
        setActiveItemId((prev) => {
          if (prev !== activeItem.id) {
            scrollToItemInList(activeItem.id);
          }
          return activeItem.id;
        });
        activeItemIdRef.current = activeItem.id;
        activeSourceRef.current = 'video';
        setActiveSource('video');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [contents]);

  // ============================================================
  // VIDEO HANDLER
  // ============================================================

  const onPlayPauseVideo = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const video = videoRef.current;
      if (!video) return;

      // Doc tu ref de tranh stale closure
      const currentActiveId = activeItemIdRef.current;
      const currentSource = activeSourceRef.current;
      const currentVideoPlaying = isVideoPlayingRef.current;

      if (currentActiveId === itemId && currentSource === 'video' && currentVideoPlaying) {
        // Dang phat video item nay -> dung lai
        video.pause();
        videoEndRef.current = 0;
        setActive(null, null);
        setVideoPlaying(false);
        return;
      }

      // Bat dau phat video -> dung audio neu dang chay
      if (currentSource === 'audio') {
        Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
        Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
        handlePauseAudio(true);
        forceRender();
      }

      // Seek va phat video
      videoEndRef.current = parseTimeToSeconds(endTime);
      video.currentTime = parseTimeToSeconds(startTime);
      video.play();
      setActive(itemId, 'video');
      setVideoPlaying(true);
      scrollToItemInList(itemId);
    },
    [handlePauseAudio]
  );

  // ============================================================
  // AUDIO HANDLER
  // ============================================================

  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStatesRef.current[itemId];

      // Doc tu ref de tranh stale closure
      const currentSource = activeSourceRef.current;
      const currentVideoPlaying = isVideoPlayingRef.current;

      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === itemId ? !isCurrentlyPlaying : false;
      });

      if (isCurrentlyPlaying) {
        // Dung audio
        loopStatesRef.current[itemId] = false;
        setActive(null, null);
        handlePauseAudio(true);
      } else {
        // Bat dau phat audio -> dung video neu dang chay
        const video = videoRef.current;
        if (currentVideoPlaying && video) {
          video.pause();
          videoEndRef.current = 0;
          setVideoPlaying(false);
        }

        loopStatesRef.current[itemId] = false;
        setActive(itemId, 'audio');
        handleToggleAudio(itemId, startTime, endTime, false);
        handlePlayAudio(startTime, endTime, Number(itemId));
        // Doi 1 tick de DOM cap nhat xong roi moi scroll
        setTimeout(() => scrollToActiveItem(itemId), 50);
      }

      forceRender();
    },
    [handlePlayAudio, handlePauseAudio, handleToggleAudio]
  );

  const onToggleLoop = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
      handleToggleAudio(itemId, startTime, endTime, loopStatesRef.current[itemId]);
      forceRender();
    },
    [handleToggleAudio]
  );

  // ============================================================
  // TOOLTIP
  // ============================================================

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

        if (selection?.rangeCount) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          setTooltipPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY + 30 });
        }
      } catch (error) {
        console.error('Loi khi tra nghia tu:', error);
      }
    }, 300),
    [meaningEnKeywords, meaningViKeywords]
  );

  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => document.removeEventListener('selectionchange', handleGetMeaning);
  }, [handleGetMeaning]);

  // ============================================================
  // MODAL THEM TU MOI
  // ============================================================

  const handleOpenInsert = () => { insertForm.resetFields(); setInsertModalOpen(true); };
  const handleCancelInsert = () => { setInsertModalOpen(false); insertForm.resetFields(); };

  const handleInsert = async () => {
    try {
      const values = await insertForm.validateFields();
      const viList: string[] = values.viList.map((item: { vi: string }) => item.vi?.trim()).filter(Boolean);
      if (viList.length === 0) {
        insertForm.setFields([{ name: ['viList', 0, 'vi'], errors: ['Vui long nhap it nhat 1 nghia tieng Viet'] }]);
        return;
      }
      setInsertLoading(true);
      await insertWord(values.eng.trim(), viList);
      notifApi.success({
        message: 'Them tu thanh cong',
        description: `Da them tu "${values.eng.trim()}" vao tu dien.`,
        placement: 'topRight', duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelInsert();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifApi.error({
        message: 'Them tu that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight', duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setInsertLoading(false);
    }
  };

  // ============================================================
  // RENDER TUNG CAU
  // ============================================================

  const renderItemContent = (item: ContentType, isActive: boolean) => (
    <div>
      <div className="eng-line">
        <div style={{ visibility: showEnglish ? 'visible' : 'hidden' }}>
          <Typography.Text
            strong className="engClass"
            style={isActive ? { color: '#1677ff' } : {}}
            onMouseUp={(e) => { e.stopPropagation(); handleGetMeaning(); }}
            onTouchEnd={(e) => { e.stopPropagation(); handleGetMeaning(); }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.eng.split(/\s+/).map((word, idx) => {
              const cleanWord = word.replace(/[.,?!";']/g, '').toLowerCase();
              const isMissing = highlightMissingWords && item.missingWords?.map((w) => w.toLowerCase()).includes(cleanWord);
              return (
                <span key={idx} className={isMissing ? 'highlight-missing' : ''} style={isMissing ? { backgroundColor: '#ffe58f' } : {}}>
                  {word + ' '}
                </span>
              );
            })}
          </Typography.Text>
        </div>

        <Space className="button-group">
          {/* Nut video (chi hien khi item co video) */}
          {item.video && (
            <Button
              type="link"
              icon={
                activeItemId === item.id && activeSource === 'video' && isVideoPlaying
                  ? <PauseOutlined style={{ color: '#1677ff' }} />
                  : <VideoCameraOutlined />
              }
              onClick={(e) => { e.stopPropagation(); onPlayPauseVideo(item.id, item.startTime, item.endTime); }}
            />
          )}
          {/* Nut audio */}
          <Button
            type="link"
            icon={playStatesRef.current[item.id] ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={(e) => { e.stopPropagation(); onPlayPauseAudio(item.id, item.startTime, item.endTime); }}
          />
          {/* Nut loop */}
          <Button
            type="link"
            icon={loopStatesRef.current[item.id] ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!playStatesRef.current[item.id]}
            onClick={(e) => { e.stopPropagation(); onToggleLoop(item.id, item.startTime, item.endTime); }}
          />
        </Space>
      </div>

      <div style={{ visibility: showVietnamese ? 'visible' : 'hidden' }}>
        <Typography.Text
          strong className="viClass"
          style={isActive ? { color: '#1677ff' } : {}}
          onMouseUp={(e) => { e.stopPropagation(); handleGetMeaning(); }}
          onTouchEnd={(e) => { e.stopPropagation(); handleGetMeaning(); }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.vi}
        </Typography.Text>
      </div>
    </div>
  );

  const renderContentList = () =>
    contents.map((item) => {
      const isActive = activeItemId === item.id;
      return (
        <div
          key={item.id}
          ref={(el) => { itemRefsRef.current[item.id] = el; }}
          className="content-item"
          style={isActive ? ACTIVE_ITEM_STYLE : {}}
        >
          {renderItemContent(item, isActive)}
        </div>
      );
    });

  const renderTooltip = () =>
    meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 ? (
      <div className="meaning-container" style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
        {/^[a-zA-Z ]+$/.test(window.getSelection()?.toString().trim() || '')
          ? meaningEnKeywords.map((word, i) => <div key={i}><strong>{word}</strong>: {meaningViKeywords[i]}</div>)
          : meaningViKeywords.map((word, i) => <div key={i}><strong>{word}</strong>: {meaningEnKeywords[i]}</div>)}
      </div>
    ) : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

      <Space>
        <Button icon={showEnglish ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowEnglish((p) => !p)} className="custom-button">
          {showEnglish ? 'Show Eng' : 'Hide Eng'}
        </Button>
        <Button icon={showVietnamese ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowVietnamese((p) => !p)} className="custom-button">
          {showVietnamese ? 'Show Vi' : 'Hide Vi'}
        </Button>
        <Button type="dashed" onClick={() => setHighlightMissingWords((p) => !p)} className="custom-button">
          {highlightMissingWords ? 'An tu moi' : 'Tu moi'}
        </Button>
        <Button type="primary" onClick={() => router.push(`/test?volumeSlug=${volumeSlug}`)} className="custom-button">
          Kiem tra
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenInsert} className="custom-button" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}>
          Them tu moi
        </Button>
      </Space>

      {contents && contents.length > 0 ? (
        sharedVideoPath ? (
          <Row gutter={24} align="top" style={{ marginTop: 16 }}>
            <Col xs={24} md={10}>
              <div style={{ position: 'sticky', top: 16 }}>
                <video ref={videoRef} src={`/media/${sharedVideoPath}`} controls style={{ width: '100%', borderRadius: 8 }} />
              </div>
            </Col>
            <Col xs={24} md={14}>
              <Typography.Title level={3} className="volume-title">{volumeEngName}</Typography.Title>
              <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
              <Typography.Text className="volume-total-sentence" style={{ display: 'block', marginBottom: 8 }}>
                Bai co tong cong: <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
              </Typography.Text>
              <div ref={listScrollRef} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
                {renderContentList()}
                {renderTooltip()}
              </div>
            </Col>
          </Row>
        ) : (
          <div>
            <Typography.Title level={3} className="volume-title">{volumeEngName}</Typography.Title>
            <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
            <Typography.Text className="volume-total-sentence">
              Bai co tong cong: <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
            </Typography.Text>
            {renderContentList()}
            {renderTooltip()}
          </div>
        )
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      <Modal
        title="Them tu moi" open={insertModalOpen} onCancel={handleCancelInsert}
        footer={<div style={{ textAlign: 'center' }}><Space><Button onClick={handleCancelInsert}>Huy</Button><Button type="primary" loading={insertLoading} onClick={handleInsert}>Them moi</Button></Space></div>}
      >
        <Form form={insertForm} layout="vertical">
          <Form.Item label="Tu tieng Anh" name="eng" rules={[{ required: true, message: 'Vui long nhap tu tieng Anh' }]}>
            <Input placeholder="Nhap tu tieng Anh..." />
          </Form.Item>
          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item key={field.key} label={index === 0 ? 'Nghia tieng Viet' : ''} required={index === 0}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Form.Item key={field.key} name={[field.name, 'vi']} noStyle rules={index === 0 ? [{ required: true, message: 'Vui long nhap nghia tieng Viet' }] : []}>
                        <Input placeholder={`Nghia ${index + 1}...`} style={{ flex: 1 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer', flexShrink: 0 }} />
                      )}
                    </div>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ vi: '' })} icon={<PlusOutlined />} block>Them nghia</Button>
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
