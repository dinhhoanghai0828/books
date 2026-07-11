import { ContentType } from '@/interfaces/content';
import { getMeaningWords, insertWord } from '@/utils/apiService';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Input, Modal, notification, Space } from 'antd';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import '../../styles/content.css';

import { findActiveItem, parseTimeToSeconds } from './contentHelpers';
import ContentToolbar, { ViewMode } from './ContentToolbar';
import VideoLayout from './VideoLayout';
import AudioLayout from './AudioLayout';
import { Volume } from '@/interfaces/volume';

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
  onViewModeChange?: (mode: ViewMode) => void;
  // Thong tin volume de AudioLayout lay src audio
  volume?: Volume;
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
  zIndex: 9999,
  maxWidth: 360,
  wordWrap: 'break-word',
  fontSize: 14,
  lineHeight: '1.85',
  pointerEvents: 'none',
  borderLeft: '4px solid #108ee9',
};

const TOOLTIP_BODY_STYLE: React.CSSProperties = {
  maxHeight: '60vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  pointerEvents: 'auto',
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
  onViewModeChange,
  volume,
}: ContentComponentProps) => {
  const router = useRouter();
  const { volumeEngName = '', volumeViName = '' } = contents[0] || {};

  // Lay video path tu contents (null neu khong co)
  const sharedVideoPath = contents.find((item) => item.video)?.video ?? null;

  // ============================================================
  // VIEW MODE — default audio, chuyen video khi contents co video
  // ============================================================

  const [viewMode, setViewMode] = useState<ViewMode>('audio');
  const viewModeRef = useRef<ViewMode>('audio');

  // Khi contents load xong va co video -> chuyen sang Video Mode
  useEffect(() => {
    if (sharedVideoPath && viewModeRef.current === 'audio') {
      viewModeRef.current = 'video';
      setViewMode('video');
      onViewModeChange?.('video');
    } else {
      //  Mac dinh luon la audio
      viewModeRef.current = 'audio';
      setViewMode('audio');
      onViewModeChange?.('audio');
    }
  }, [sharedVideoPath, onViewModeChange]);

  const handleViewModeChange = (mode: ViewMode) => {
    viewModeRef.current = mode;
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  // ============================================================
  // REFS
  // ============================================================

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Ref callback de biet khi nao video element duoc mount/unmount
  const [videoMounted, setVideoMounted] = useState(false);
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    setVideoMounted(!!el);
  }, []);
  const videoSegmentRef = useRef({
    start: 0,
    end: 0,
    itemId: '',
  });

  // Flag: true khi code dang seek (khong phai nguoi dung tu seek)
  // De phan biet seek tu code (onPlayPauseVideo) va seek tu nguoi dung (click vao video)
  const isSeekingByCodeRef = useRef(false);

  const itemRefsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  // ============================================================
  // STATE — play / loop
  // ============================================================

  const [playStates, setPlayStates] = useState<Record<string, boolean>>({});
  const [loopStates, setLoopStates] = useState<Record<string, boolean>>({});

  // Lenh gui xuong AudioLayout — dung {data, ts} pattern:
  // moi lan ts thay doi thi AudioLayout phat lai, tranh stale isPlaying
  const [playCommand, setPlayCommand] = useState<{
    itemId: string; startTime: string; endTime: string; ts: number;
  } | null>(null);
  const [loopCommand, setLoopCommand] = useState<{
    itemId: string; startTime: string; endTime: string; isLoop: boolean; ts: number;
  } | null>(null);
  const [pauseCommand, setPauseCommand] = useState<number | null>(null);

  // ============================================================
  // STATE — active item (1 item duy nhat duoc highlight)
  // ============================================================

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItemIdRef = useRef<string | null>(null);

  const [activeSource, setActiveSource] = useState<'audio' | 'video' | null>(null);
  const activeSourceRef = useRef<'audio' | 'video' | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isVideoPlayingRef = useRef(false);

  const setActive = useCallback((id: string | null, source: 'audio' | 'video' | null) => {
    // Ep String de tranh type mismatch khi API tra ve number thay vi string
    const normalizedId = id !== null ? String(id) : null;
    activeItemIdRef.current = normalizedId;
    activeSourceRef.current = source;
    setActiveItemId(normalizedId);
    setActiveSource(source);
  }, []);

  const setVideoPlaying = useCallback((val: boolean) => {
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
  const meaningEnRef = useRef<string[]>([]);
  const meaningViRef = useRef<string[]>([]);
  meaningEnRef.current = meaningEnKeywords;
  meaningViRef.current = meaningViKeywords;

  // ============================================================
  // STATE — insert word modal
  // ============================================================

  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // ============================================================
  // SCROLL — cuon item active len dau vung nhin thay
  // Bu offset 120px cho header + toolbar co dinh phia tren
  // ============================================================

  const scrollToActiveItem = useCallback((itemId: string) => {
    const el = itemRefsRef.current[itemId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 250;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);


  // ============================================================
  // EFFECTS
  // ============================================================
  const loopStatesRef = useRef(loopStates);

  useEffect(() => {
    loopStatesRef.current = loopStates;
  }, [loopStates]);
  // Khoi tao play/loop state khi contents thay doi
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

  // Reset khi audio ket thuc (isPlaying tu parent - giu de tuong thich video flow)
  const prevIsPlayingRef = useRef(false);
  useEffect(() => {
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Listener timeupdate cho video — attach sau khi VideoLayout mount
  // Attach timeupdate listener truc tiep vao videoRef khi co the
  // Dung useEffect don gian, khong can setTimeout
  useEffect(() => {
    if (viewMode !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    // Khi nguoi dung tu seek tren video controls (khong qua onPlayPauseVideo):
    // reset end = 0 va itemId = '' de timeupdate khong dung video nua,
    // video se chay tu vi tri seek den het file
    const onSeeking = () => {
      if (isSeekingByCodeRef.current) return;
      videoSegmentRef.current = { start: 0, end: 0, itemId: '' };
      setActive(null, null);
      setVideoPlaying(true);
    };

    const onTimeUpdate = () => {
      const t = video.currentTime;
      const { start, end, itemId } = videoSegmentRef.current;

      // Dung / loop khi den endTime (chi khi end > 0, tuc la dang phat theo segment)
      if (end > 0 && t >= end) {
        if (loopStatesRef.current[itemId]) {
          video.pause();
          video.currentTime = start;
          void video.play();
        } else {
          video.pause();
          setActive(null, null);
          setVideoPlaying(false);
        }
        return;
      }

      // Highlight cau hien tai theo currentTime
      const found = findActiveItem(contents, t);
      if (found && activeItemIdRef.current !== String(found.id)) {
        setActive(String(found.id), 'video');
        scrollToActiveItem(String(found.id));
      }
    };

    // Khi video tu play lai (vi du sau khi nguoi dung bam play tren controls)
    const onPlay = () => {
      if (!isSeekingByCodeRef.current) {
        setVideoPlaying(true);
      }
    };

    const onPause = () => {
      if (!isSeekingByCodeRef.current) {
        setVideoPlaying(false);
      }
    };

    video.addEventListener('seeking', onSeeking);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [viewMode, videoMounted, contents, setActive, setVideoPlaying, scrollToActiveItem]);

  // ============================================================
  // VIDEO HANDLER
  // ============================================================

  const onPlayPauseVideo = useCallback((itemId: string, startTime: string, endTime: string) => {
    const video = videoRef.current;
    if (!video) return;

    const alreadyPlaying =
      activeItemIdRef.current === itemId &&
      activeSourceRef.current === 'video' &&
      isVideoPlayingRef.current;

    if (alreadyPlaying) {
      video.pause();
      setActive(null, null);
      setVideoPlaying(false);
      return;
    }

    // Dung audio neu dang chay
    if (activeSourceRef.current === 'audio') {
      setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      setLoopStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      handlePauseAudio(true);
    }

    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);

    videoSegmentRef.current = { start, end, itemId };

    // Danh dau dang seek tu code de onSeeking listener khong reset segment
    isSeekingByCodeRef.current = true;
    video.currentTime = start;
    isSeekingByCodeRef.current = false;

    video.play();
    setActive(itemId, 'video');
    setVideoPlaying(true);
    requestAnimationFrame(() => scrollToActiveItem(itemId));
  }, [handlePauseAudio, setActive, setVideoPlaying, scrollToActiveItem]);

  // ============================================================
  // AUDIO HANDLER
  // ============================================================

  const onPlayPauseAudio = useCallback((itemId: string, startTime: string, endTime: string) => {
    const isCurrentlyPlaying = playStates[itemId] ?? false;

    if (isCurrentlyPlaying) {
      // Dang phat item nay -> dung lai
      setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      setActive(null, null);
      setPauseCommand(Date.now());
      return;
    }

    // Dung video neu dang chay
    const video = videoRef.current;
    if (isVideoPlayingRef.current && video) {
      video.pause();
      setVideoPlaying(false);
    }

    // Gui lenh phat xuong AudioLayout
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, k === itemId])));
    setLoopStates((prev) => ({ ...prev, [itemId]: false }));
    setActive(itemId, 'audio');
    setPlayCommand({ itemId, startTime, endTime, ts: Date.now() });

    requestAnimationFrame(() => scrollToActiveItem(itemId));
  }, [playStates, handlePauseAudio, handleToggleAudio, setActive, setVideoPlaying, scrollToActiveItem]);

  // Callback tu AudioLayout: audio het segment -> reset trang thai
  const onAudioStop = useCallback(() => {
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setLoopStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setActive(null, null);
  }, [setActive]);

  // Callback tu AudioLayout: timeupdate detect cau moi -> highlight + scroll + cap nhat playStates
  const onAudioActiveItemChange = useCallback((id: string) => {
    if (activeItemIdRef.current === id) return;
    setActive(id, 'audio');
    setPlayStates((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === id]))
    );
    scrollToActiveItem(id);
  }, [setActive, scrollToActiveItem]);

  // ============================================================
  // LOOP HANDLER
  // ============================================================

  const onToggleLoop = useCallback((itemId: string, startTime: string, endTime: string) => {
    const newVal = !loopStates[itemId];
    setLoopStates((prev) => ({ ...prev, [itemId]: newVal }));
    // Gui lenh loop xuong AudioLayout
    setLoopCommand({ itemId, startTime, endTime, isLoop: newVal, ts: Date.now() });
  }, [loopStates]);

  // ============================================================
  // TOOLTIP
  // ============================================================

  const handleGetMeaning = useMemo(
    () =>
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
            searchValue === meaningEnRef.current.join(' ') ||
            searchValue === meaningViRef.current.join(' ');
          if (alreadyShown) return;

          const isEng = /^[a-zA-Z ]+$/.test(searchValue);
          const res = isEng
            ? await getMeaningWords(searchValue, null)
            : await getMeaningWords(null, searchValue);

          if (res.length > 0) {
            setMeaningEnKeywords(res.map((w) => w.eng));
            setMeaningViKeywords(res.map((w) => w.vi));
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
        } catch (e) {
          console.error(e);
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
    const handleClickOutside = () => {
      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderTooltip = useCallback((): React.ReactNode => {
    if (!meaningEnKeywords.length || !meaningViKeywords.length) return null;
    const sel = window.getSelection()?.toString().trim() || '';
    const isEng = /^[a-zA-Z ]+$/.test(sel);
    return createPortal(
      <div style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
        <div style={TOOLTIP_BODY_STYLE}>
          {isEng ? (
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
      const viList = values.viList.map((it: { vi: string }) => it.vi?.trim()).filter(Boolean);
      if (!viList.length) {
        insertForm.setFields([{ name: ['viList', 0, 'vi'], errors: ['Vui long nhap it nhat 1 nghia'] }]);
        return;
      }
      setInsertLoading(true);
      await insertWord(values.eng.trim(), viList);
      notifApi.success({
        message: 'Them tu thanh cong',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }
      });
      handleCancelInsert();
    } catch (e: any) {
      if (e?.errorFields) return;
      notifApi.error({
        message: 'Them tu that bai',
        description: e.message,
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }
      });
    } finally {
      setInsertLoading(false);
    }
  };

  // ============================================================
  // SHARED PROPS CHO LAYOUT COMPONENTS
  // ============================================================

  const commonItemProps = {
    activeItemId,
    activeSource,
    isVideoPlaying,
    showEnglish,
    showVietnamese,
    highlightMissingWords,
    itemRefsRef,
    onGetMeaning: handleGetMeaning,
    renderTooltip,
  };

  // ============================================================
  // RENDER LAYOUT
  // ============================================================

  const renderLayout = () => {
    console.log('[ContentComponent] renderLayout viewMode=', viewMode, 'contents=', contents.length, 'sharedVideoPath=', sharedVideoPath);
    switch (viewMode) {
      case 'video':
        if (!sharedVideoPath) return renderAudioLayout();
        return (
          <VideoLayout
            {...commonItemProps}
            contents={contents}
            videoPath={sharedVideoPath}
            volumeEngName={volumeEngName}
            volumeViName={volumeViName}
            videoRef={videoRefCallback}
            listScrollRef={listScrollRef}
            loopStates={loopStates}
            onPlayPauseVideo={onPlayPauseVideo}
            onToggleLoop={onToggleLoop}
          />
        );
      case 'audio':
      default:
        return renderAudioLayout();
    }
  };

  const renderAudioLayout = () => (
    <AudioLayout
      {...commonItemProps}
      contents={contents}
      volumeEngName={volumeEngName}
      volumeViName={volumeViName}
      playStates={playStates}
      loopStates={loopStates}
      onPlayPauseAudio={onPlayPauseAudio}
      onToggleLoop={onToggleLoop}
      onActiveItemChange={onAudioActiveItemChange}
      onAudioStop={onAudioStop}
      volume={volume}
      playCommand={playCommand}
      loopCommand={loopCommand}
      pauseCommand={pauseCommand}
    />
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

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

      {renderLayout()}

      <Modal
        title="Them tu moi" open={insertModalOpen} onCancel={handleCancelInsert}
        footer={<div style={{ textAlign: 'center' }}><Space><Button
          onClick={handleCancelInsert}>Huy</Button><Button type="primary" loading={insertLoading}
            onClick={handleInsert}>Them moi</Button></Space>
        </div>}
      >
        <Form form={insertForm} layout="vertical">
          <Form.Item label="Tu tieng Anh" name="eng"
            rules={[{ required: true, message: 'Vui long nhap tu tieng Anh' }]}>
            <Input placeholder="Nhap tu tieng Anh..." />
          </Form.Item>
          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <Form.Item key={field.key} label={index === 0 ? 'Nghia tieng Viet' : ''}
                  required={index === 0}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item key={field.key} name={[field.name, 'vi']} noStyle
                      rules={index === 0 ? [{
                        required: true,
                        message: 'Vui long nhap nghia'
                      }] : []}>
                      <Input placeholder={`Nghia ${index + 1}...`} style={{ flex: 1 }} />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(field.name)}
                      style={{
                        color: '#ff4d4f',
                        fontSize: 18,
                        cursor: 'pointer'
                      }} />}
                  </div>
                </Form.Item>
              ))}
              <Form.Item><Button type="dashed" onClick={() => add({ vi: '' })} icon={<PlusOutlined />} block>Them
                nghia</Button></Form.Item>
            </>)}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentComponent;
