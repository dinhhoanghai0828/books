import { ContentType } from '@/interfaces/content';
import { getMeaningWords, insertWord } from '@/utils/apiService';
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Space,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/content.css';

import { findActiveItem, parseTimeToSeconds } from './contentHelpers';
import ContentToolbar, { ViewMode } from './ContentToolbar';
import VideoLayout from './VideoLayout';
import AudioLayout from './AudioLayout';

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
  handleToggleAudio: (
    itemId: string,
    startTime: string,
    endTime: string,
    isLoop: boolean
  ) => void;
}

// Style tooltip tra nghia
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
  const { volumeEngName = '', volumeViName = '' } = contents[0] || {};

  // Duong dan video dung chung cua tap (lay tu item dau tien co video)
  const sharedVideoPath = contents.find((item) => item.video)?.video;

  // ============================================================
  // VIEW MODE
  // ============================================================

  // Mac dinh Video Mode neu tap co video, nguoc lai Audio Mode
  const [viewMode, setViewMode] = useState<ViewMode>(
    sharedVideoPath ? 'video' : 'audio'
  );

  // Khi chuyen mode: chi doi layout, khong goi API, khong reset media
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // ============================================================
  // REFS
  // ============================================================

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // End time (giay) cua doan video dang phat; 0 = khong gioi han
  const videoEndRef = useRef<number>(0);

  // Ref tung phan tu hang de tinh offset scroll
  const itemRefsRef = useRef<Record<string, HTMLDivElement | null>>({});
  // Ref vung cuon noi bo (Video Mode Story List)
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  // Ref cho isLoop de tranh stale closure trong AudioComponent listener
  const isLoopRef = useRef(false);

  // ============================================================
  // STATE — play / loop (dung state thuan React, khong dung forceRender)
  // ============================================================

  // playStates[id] = true neu audio cua item do dang phat
  const [playStates, setPlayStates] = useState<Record<string, boolean>>({});
  // loopStates[id] = true neu loop cua item do dang bat
  const [loopStates, setLoopStates] = useState<Record<string, boolean>>({});

  // ============================================================
  // STATE — active item (duy nhat 1 item duoc highlight)
  // ============================================================

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItemIdRef = useRef<string | null>(null);

  const [activeSource, setActiveSource] = useState<'audio' | 'video' | null>(null);
  const activeSourceRef = useRef<'audio' | 'video' | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isVideoPlayingRef = useRef(false);

  // Helper duy nhat de cap nhat trang thai active (dam bao ref & state dong bo)
  const setActive = useCallback(
    (id: string | null, source: 'audio' | 'video' | null) => {
      activeItemIdRef.current = id;
      activeSourceRef.current = source;
      setActiveItemId(id);
      setActiveSource(source);
    },
    []
  );

  const setVideoPaying = useCallback((val: boolean) => {
    isVideoPlayingRef.current = val;
    setIsVideoPlaying(val);
  }, []);

  // ============================================================
  // STATE — UI toggles
  // ============================================================

  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  // ============================================================
  // STATE — tooltip
  // ============================================================

  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // ============================================================
  // STATE — insert word modal
  // ============================================================

  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // ============================================================
  // SCROLL API — duy nhat 1 ham, tu chon implementation theo viewMode
  // ============================================================

  const scrollToActiveItem = useCallback(
    (itemId: string) => {
      const el = itemRefsRef.current[itemId];
      if (!el) return;

      if (viewMode === 'video') {
        // Scroll noi bo Story List — day item len ngang video
        const container = listScrollRef.current;
        if (!container) return;
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const offset = elTop - containerTop + container.scrollTop;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      } else {
        // Scroll toan trang — bu offset header co dinh
        const top = el.getBoundingClientRect().top + window.scrollY - 170;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [viewMode]
  );

  // ============================================================
  // EFFECTS
  // ============================================================

  // Khoi tao play/loop state khi danh sach noi dung thay doi
  useEffect(() => {
    const play: Record<string, boolean> = {};
    const loop: Record<string, boolean> = {};
    contents.forEach((item) => {
      play[item.id] = false;
      loop[item.id] = false;
    });
    setPlayStates(play);
    setLoopStates(loop);
  }, [contents]);

  // Khi audio ket thuc tu nhien (isPlaying: true -> false): reset tat ca trang thai
  const prevIsPlayingRef = useRef(false);
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    if (wasPlaying && !isPlaying) {
      setPlayStates((prev) =>
        Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
      );
      setLoopStates((prev) =>
        Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
      );
      setActive(null, null);
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, setActive]);

  // Listener timeupdate cho video:
  // - Kiem tra endTime -> dung neu het doan
  // - Tim cau tuong ung -> highlight + scroll neu cau moi
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Chi xu ly khi source la video
      if (activeSourceRef.current !== 'video') return;

      const currentTime = video.currentTime;

      // Het doan: dung va reset
      if (videoEndRef.current > 0 && currentTime >= videoEndRef.current) {
        video.pause();
        videoEndRef.current = 0;
        setActive(null, null);
        setVideoPaying(false);
        return;
      }

      // Tim cau theo currentTime
      const activeItem = findActiveItem(contents, currentTime);
      if (!activeItem) return;

      // Chi cap nhat khi cau thay doi (tranh scroll lien tuc)
      if (activeItemIdRef.current !== activeItem.id) {
        setActive(activeItem.id, 'video');
        // setTimeout de dam bao DOM da cap nhat truoc khi scroll
        setTimeout(() => scrollToActiveItem(activeItem.id), 0);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [contents, setActive, setVideoPaying, scrollToActiveItem]);

  // ============================================================
  // VIDEO HANDLER
  // ============================================================

  const onPlayPauseVideo = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const video = videoRef.current;
      if (!video) return;

      const isCurrentlyPlaying =
        activeItemIdRef.current === itemId &&
        activeSourceRef.current === 'video' &&
        isVideoPlayingRef.current;

      if (isCurrentlyPlaying) {
        // Dang phat item nay -> dung lai
        video.pause();
        videoEndRef.current = 0;
        setActive(null, null);
        setVideoPaying(false);
        return;
      }

      // Dung audio neu dang chay (mutual exclusion)
      if (activeSourceRef.current === 'audio') {
        setPlayStates((prev) =>
          Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
        );
        setLoopStates((prev) =>
          Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
        );
        handlePauseAudio(true);
      }

      // Seek va phat video
      videoEndRef.current = parseTimeToSeconds(endTime);
      video.currentTime = parseTimeToSeconds(startTime);
      video.play();
      setActive(itemId, 'video');
      setVideoPaying(true);
      setTimeout(() => scrollToActiveItem(itemId), 0);
    },
    [handlePauseAudio, setActive, setVideoPaying, scrollToActiveItem]
  );

  // ============================================================
  // AUDIO HANDLER
  // ============================================================

  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStates[itemId] ?? false;

      if (isCurrentlyPlaying) {
        // Dang phat -> dung lai
        setPlayStates((prev) =>
          Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
        );
        setActive(null, null);
        handlePauseAudio(true);
        return;
      }

      // Dung video neu dang chay (mutual exclusion)
      const video = videoRef.current;
      if (isVideoPlayingRef.current && video) {
        video.pause();
        videoEndRef.current = 0;
        setVideoPaying(false);
      }

      // Phat audio moi
      setPlayStates((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((k) => [k, k === itemId])
        )
      );
      setLoopStates((prev) => ({ ...prev, [itemId]: false }));
      setActive(itemId, 'audio');
      handleToggleAudio(itemId, startTime, endTime, false);
      handlePlayAudio(startTime, endTime, Number(itemId));
      setTimeout(() => scrollToActiveItem(itemId), 50);
    },
    [
      playStates,
      handlePlayAudio,
      handlePauseAudio,
      handleToggleAudio,
      setActive,
      setVideoPaying,
      scrollToActiveItem,
    ]
  );

  // ============================================================
  // LOOP HANDLER
  // ============================================================

  const onToggleLoop = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      setLoopStates((prev) => {
        const newVal = !prev[itemId];
        isLoopRef.current = newVal;
        handleToggleAudio(itemId, startTime, endTime, newVal);
        return { ...prev, [itemId]: newVal };
      });
    },
    [handleToggleAudio]
  );

  // ============================================================
  // TOOLTIP — tra nghia tu
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
          setTooltipPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY + 30,
          });
        }
      } catch (error) {
        console.error('Loi khi tra nghia tu:', error);
      }
    }, 300),
    [meaningEnKeywords, meaningViKeywords]
  );

  // Lang nghe su kien boi chu de hien tooltip
  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => document.removeEventListener('selectionchange', handleGetMeaning);
  }, [handleGetMeaning]);

  // ============================================================
  // RENDER TOOLTIP
  // ============================================================

  const renderTooltip = useCallback((): React.ReactNode => {
    if (meaningEnKeywords.length === 0 || meaningViKeywords.length === 0) return null;
    const selectedText = window.getSelection()?.toString().trim() || '';
    const isEnglish = /^[a-zA-Z ]+$/.test(selectedText);
    return (
      <div
        className="meaning-container"
        style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}
      >
        {isEnglish
          ? meaningEnKeywords.map((word, i) => (
              <div key={i}>
                <strong>{word}</strong>: {meaningViKeywords[i]}
              </div>
            ))
          : meaningViKeywords.map((word, i) => (
              <div key={i}>
                <strong>{word}</strong>: {meaningEnKeywords[i]}
              </div>
            ))}
      </div>
    );
  }, [meaningEnKeywords, meaningViKeywords, tooltipPosition]);

  // ============================================================
  // INSERT WORD MODAL
  // ============================================================

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
          {
            name: ['viList', 0, 'vi'],
            errors: ['Vui long nhap it nhat 1 nghia tieng Viet'],
          },
        ]);
        return;
      }

      setInsertLoading(true);
      await insertWord(values.eng.trim(), viList);

      notifApi.success({
        message: 'Them tu thanh cong',
        description: `Da them tu "${values.eng.trim()}" vao tu dien.`,
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelInsert();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifApi.error({
        message: 'Them tu that bai',
        description: error.message || 'Da xay ra loi, vui long thu lai.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setInsertLoading(false);
    }
  };

  // ============================================================
  // PROPS CHUNG CHO LAYOUT
  // ============================================================

  const sharedLayoutProps = {
    contents,
    volumeEngName,
    volumeViName,
    activeItemId,
    activeSource,
    isVideoPlaying,
    playStates,
    loopStates,
    showEnglish,
    showVietnamese,
    highlightMissingWords,
    itemRefsRef,
    onPlayPauseAudio,
    onPlayPauseVideo,
    onToggleLoop,
    onGetMeaning: handleGetMeaning,
    renderTooltip,
  };

  // ============================================================
  // RENDER LAYOUT — dung switch(viewMode), KHONG dung sharedVideoPath
  // ============================================================

  const renderLayout = () => {
    if (contents.length === 0) {
      return <Empty description="Khong co du lieu" className="emptyClass" />;
    }

    switch (viewMode) {
      case 'video':
        // Neu tap khong co video: fallthrough ve Audio layout
        if (!sharedVideoPath) return renderAudioLayout();
        return (
          <VideoLayout
            contents={contents}
            videoPath={sharedVideoPath}
            volumeEngName={volumeEngName}
            volumeViName={volumeViName}
            videoRef={videoRef}
            listScrollRef={listScrollRef}
            activeItemId={activeItemId}
            activeSource={activeSource}
            isVideoPlaying={isVideoPlaying}
            loopStates={loopStates}
            showEnglish={showEnglish}
            showVietnamese={showVietnamese}
            highlightMissingWords={highlightMissingWords}
            itemRefsRef={itemRefsRef}
            onPlayPauseVideo={onPlayPauseVideo}
            onToggleLoop={onToggleLoop}
            onGetMeaning={handleGetMeaning}
            renderTooltip={renderTooltip}
          />
        );

      case 'audio':
        return renderAudioLayout();

      default:
        return renderAudioLayout();
    }
  };

  const renderAudioLayout = () => (
    <AudioLayout
      contents={contents}
      volumeEngName={volumeEngName}
      volumeViName={volumeViName}
      activeItemId={activeItemId}
      activeSource={activeSource}
      isVideoPlaying={isVideoPlaying}
      playStates={playStates}
      loopStates={loopStates}
      showEnglish={showEnglish}
      showVietnamese={showVietnamese}
      highlightMissingWords={highlightMissingWords}
      itemRefsRef={itemRefsRef}
      onPlayPauseAudio={onPlayPauseAudio}
      onToggleLoop={onToggleLoop}
      onGetMeaning={handleGetMeaning}
      renderTooltip={renderTooltip}
    />
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

      {/* Toolbar luon hien thi phia tren */}
      <ContentToolbar
        viewMode={viewMode}
        showEnglish={showEnglish}
        showVietnamese={showVietnamese}
        highlightMissingWords={highlightMissingWords}
        hasVideo={!!sharedVideoPath}
        onViewModeChange={handleViewModeChange}
        onToggleEnglish={() => setShowEnglish((p) => !p)}
        onToggleVietnamese={() => setShowVietnamese((p) => !p)}
        onToggleMissingWords={() => setHighlightMissingWords((p) => !p)}
        onTest={() => router.push(`/test?volumeSlug=${volumeSlug}`)}
        onInsertWord={handleOpenInsert}
      />

      {/* Layout chinh */}
      {renderLayout()}

      {/* Modal them tu moi */}
      <Modal
        title="Them tu moi"
        open={insertModalOpen}
        onCancel={handleCancelInsert}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelInsert}>Huy</Button>
              <Button
                type="primary"
                loading={insertLoading}
                onClick={handleInsert}
              >
                Them moi
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={insertForm} layout="vertical">
          <Form.Item
            label="Tu tieng Anh"
            name="eng"
            rules={[{ required: true, message: 'Vui long nhap tu tieng Anh' }]}
          >
            <Input placeholder="Nhap tu tieng Anh..." />
          </Form.Item>

          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    key={field.key}
                    label={index === 0 ? 'Nghia tieng Viet' : ''}
                    required={index === 0}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Form.Item
                        key={field.key}
                        name={[field.name, 'vi']}
                        noStyle
                        rules={
                          index === 0
                            ? [{ required: true, message: 'Vui long nhap nghia' }]
                            : []
                        }
                      >
                        <Input
                          placeholder={`Nghia ${index + 1}...`}
                          style={{ flex: 1 }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                          style={{
                            color: '#ff4d4f',
                            fontSize: 18,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
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
                    Them nghia
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
