import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { getMeaningWords, insertWord, updateContent, downloadSingleVolumeWord } from '@/utils/apiService';
import { MinusCircleOutlined, PlusOutlined, SoundOutlined, FileWordOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, notification, Space, Select, Switch } from 'antd';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import '../../styles/content.css';

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
  handleToggleAudio: (itemId: string, startTime: string, endTime: string, isLoop: boolean) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  volume?: Volume;
  onContentUpdate?: () => void;
}

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
// COMPONENT
// ============================================================

const ContentComponent = ({
  contents,
  volumeSlug,
  isPlaying,
  handlePauseAudio,
  onViewModeChange,
  volume,
  onContentUpdate,
}: ContentComponentProps) => {
  const router = useRouter();
  const { volumeEngName = '', volumeViName = '' } = contents?.[0] || {};

  // Đường dẫn video dùng chung
  const sharedVideoPath = contents?.find((item) => item.video)?.video ?? null;

  // ============================================================
  // VIEW MODE
  // ============================================================

  const [viewMode, setViewMode] = useState<ViewMode>('audio');
  const viewModeRef = useRef<ViewMode>('audio');

  // ============================================================
  // REFS
  // ============================================================

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const itemRefsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  // ============================================================
  // STATE — play / loop & Commands (Dùng chung cho cả Audio và Video)
  // ============================================================

  const [playStates, setPlayStates] = useState<Record<string, boolean>>({});
  const [loopStates, setLoopStates] = useState<Record<string, boolean>>({});

  // Lệnh điều khiển dạng {data, ts} truyền xuống AudioLayout / VideoLayout
  const [playCommand, setPlayCommand] = useState<{
    itemId: string; startTime: string; endTime: string; ts: number;
  } | null>(null);
  const [loopCommand, setLoopCommand] = useState<{
    itemId: string; startTime: string; endTime: string; isLoop: boolean; ts: number;
  } | null>(null);
  const [pauseCommand, setPauseCommand] = useState<number | null>(null);

  // ============================================================
  // STATE — active item
  // ============================================================

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItemIdRef = useRef<string | null>(null);

  const [activeSource, setActiveSource] = useState<'audio' | 'video' | null>(null);
  const activeSourceRef = useRef<'audio' | 'video' | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const setActive = useCallback((id: string | null, source: 'audio' | 'video' | null) => {
    const normalizedId = id !== null ? String(id) : null;
    activeItemIdRef.current = normalizedId;
    activeSourceRef.current = source;
    setActiveItemId(normalizedId);
    setActiveSource(source);
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
  const [selectedText, setSelectedText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [autoRead, setAutoRead] = useState(true);
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
  const [notifApi, notifContextHolder] = notification.useNotification({
    top: 80,
  });

  // ============================================================
  // STATE — edit content modal
  // ============================================================

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  // Reset toàn bộ trạng thái chạy media khi đổi Tab
  const resetAllPlayStates = useCallback(() => {
    setPauseCommand(Date.now());
    if (activeSourceRef.current === 'audio') {
      handlePauseAudio(true);
    }
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setLoopStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setActive(null, null);
    setIsVideoPlaying(false);
    setPlayCommand(null);
    setLoopCommand(null);
  }, [handlePauseAudio, setActive]);

  useEffect(() => {
    if (sharedVideoPath && viewModeRef.current === 'audio') {
      viewModeRef.current = 'video';
      setViewMode('video');
      onViewModeChange?.('video');
    } else {
      viewModeRef.current = 'audio';
      setViewMode('audio');
      onViewModeChange?.('audio');
    }
  }, [sharedVideoPath, onViewModeChange]);

  const handleViewModeChange = (mode: ViewMode) => {
    if (viewMode === mode) return;

    // Reset media & trạng thái item khi chuyển Tab
    resetAllPlayStates();

    viewModeRef.current = mode;
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  // Khởi tạo play/loop state khi contents thay đổi
  useEffect(() => {
    const play: Record<string, boolean> = {};
    const loop: Record<string, boolean> = {};
    contents?.forEach((item) => {
      const idStr = String(item.id);
      play[idStr] = false;
      loop[idStr] = false;
    });
    setPlayStates(play);
    setLoopStates(loop);
  }, [contents]);

  // Load available voices for text-to-speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Select default voice if none selected
        if (!selectedVoice && voices.length > 0) {
          const defaultVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.name);
          } else {
            setSelectedVoice(voices[0].name);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      const timeoutId = setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          loadVoices();
        }
      }, 1000);

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        clearTimeout(timeoutId);
      };
    }
  }, [selectedVoice]);

  // Đồng bộ trạng thái từ Audio Player bên dưới
  const onAudioPlayStateChange = useCallback((isPlayingAudio: boolean, currentActiveId: string | null) => {
    if (!currentActiveId) return;
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k] && k !== currentActiveId) {
          newStates[k] = false;
        }
      });
      newStates[currentActiveId] = isPlayingAudio;
      return newStates;
    });
  }, []);

  // ============================================================
  // HANDLERS (Audio & Video đồng bộ)
  // ============================================================

  // 1. VIDEO PLAY/PAUSE HANDLER (Đồng bộ giống Audio)
  const onPlayPauseVideo = useCallback((itemId: string, startTime: string, endTime: string) => {
    const itemIdStr = String(itemId);
    const isCurrentlyPlaying = playStates[itemIdStr] ?? false;

    if (isCurrentlyPlaying) {
      // Đang phát item này -> tạm dừng
      setPlayStates((prev) => ({ ...prev, [itemIdStr]: false }));
      setActive(null, null);
      setIsVideoPlaying(false);
      setPauseCommand(Date.now());
      return;
    }

    // Nếu audio đang chạy -> Dừng audio
    if (activeSourceRef.current === 'audio') {
      handlePauseAudio(true);
    }

    // Cập nhật state & phát command cho Video - chỉ cập nhật item được click
    setPlayStates((prev) => {
      const newStates = { ...prev };
      // Chỉ set false cho đang playing, không set toàn bộ
      Object.keys(prev).forEach(k => {
        if (prev[k] && k !== itemIdStr) {
          newStates[k] = false;
        }
      });
      newStates[itemIdStr] = true;
      return newStates;
    });
    setLoopStates((prev) => ({ ...prev, [itemIdStr]: false }));
    setActive(itemIdStr, 'video');
    setIsVideoPlaying(true);
    setPlayCommand({ itemId: itemIdStr, startTime, endTime, ts: Date.now() });
  }, [playStates, setActive, handlePauseAudio]);

  // Callback từ VideoLayout khi video dừng/hết đoạn
  const onVideoStop = useCallback(() => {
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setLoopStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setActive(null, null);
    setIsVideoPlaying(false);
  }, [setActive]);

  // Callback từ VideoLayout khi timeupdate phát hiện câu mới
  const onVideoActiveItemChange = useCallback((id: string) => {
    if (activeItemIdRef.current === id) return;
    setActive(id, 'video');
    setPlayStates((prev) => {
      const newStates = { ...prev };
      // Chỉ set false cho đang playing, set true cho id mới
      Object.keys(prev).forEach(k => {
        if (prev[k] && k !== id) {
          newStates[k] = false;
        }
      });
      newStates[id] = true;
      return newStates;
    });
  }, [setActive]);

  // 2. AUDIO PLAY/PAUSE HANDLER
  const onPlayPauseAudio = useCallback((itemId: string, startTime: string, endTime: string) => {
    const itemIdStr = String(itemId);
    const isCurrentlyPlaying = playStates[itemIdStr] ?? false;

    if (isCurrentlyPlaying) {
      setPlayStates((prev) => ({ ...prev, [itemIdStr]: false }));
      setActive(null, null);
      setPauseCommand(Date.now());
      return;
    }

    // Dừng video nếu đang chạy
    if (activeSourceRef.current === 'video') {
      setIsVideoPlaying(false);
      setPauseCommand(Date.now());
    }

    // Chỉ cập nhật item được click và các item đang playing
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k] && k !== itemIdStr) {
          newStates[k] = false;
        }
      });
      newStates[itemIdStr] = true;
      return newStates;
    });
    setLoopStates((prev) => ({ ...prev, [itemIdStr]: false }));
    setActive(itemIdStr, 'audio');
    setPlayCommand({ itemId: itemIdStr, startTime, endTime, ts: Date.now() });
  }, [playStates, setActive]);

  const onAudioStop = useCallback(() => {
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setLoopStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k]) {
          newStates[k] = false;
        }
      });
      return newStates;
    });
    setActive(null, null);
  }, [setActive]);

  const onAudioActiveItemChange = useCallback((id: string) => {
    if (activeItemIdRef.current === id) return;
    setActive(id, 'audio');
    setPlayStates((prev) => {
      const newStates = { ...prev };
      Object.keys(prev).forEach(k => {
        if (prev[k] && k !== id) {
          newStates[k] = false;
        }
      });
      newStates[id] = true;
      return newStates;
    });
  }, [setActive]);

  // 3. LOOP HANDLER (Chung cho cả Audio & Video)
  const onToggleLoop = useCallback((itemId: string, startTime: string, endTime: string) => {
    const itemIdStr = String(itemId);
    setLoopStates((prev) => {
      const newVal = !prev[itemIdStr];
      setLoopCommand({ itemId: itemIdStr, startTime, endTime, isLoop: newVal, ts: Date.now() });
      return { ...prev, [itemIdStr]: newVal };
    });
  }, []);

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
            setSelectedText('');
            return;
          }

          setSelectedText(searchValue);

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

          // Auto-read if enabled
          if (autoRead) {
            speakText(searchValue);
          }
        } catch (e) {
          console.error(e);
        }
      }, 300),
    [autoRead, selectedVoice]
  );

  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => {
      document.removeEventListener('selectionchange', handleGetMeaning);
      handleGetMeaning.cancel();
    };
  }, [handleGetMeaning]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the tooltip or any dropdown
      const target = event.target as HTMLElement;
      const tooltip = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');

      // Check all possible dropdown containers
      const dropdowns = document.querySelectorAll('.ant-select-dropdown');
      const isInDropdown = Array.from(dropdowns).some(dropdown => dropdown.contains(target));

      // Don't close if clicking inside tooltip or any dropdown
      if (tooltip?.contains(target) || isInDropdown) {
        return;
      }

      // Only close if clicking outside and no text is selected
      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
      }
    };

    // Also prevent closing when selection is lost but dropdown is still open
    const handleSelectionChange = () => {
      const dropdowns = document.querySelectorAll('.ant-select-dropdown');
      const isDropdownOpen = Array.from(dropdowns).some(dropdown => {
        const htmlDropdown = dropdown as HTMLElement;
        return htmlDropdown.style.display !== 'none' && htmlDropdown.style.visibility !== 'hidden';
      });

      // Don't close if dropdown is open, even if selection is lost
      if (isDropdownOpen) {
        return;
      }

      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
        setSelectedText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.rate = 1.0;
        utterance.lang = /^[a-zA-Z ]+$/.test(cleanedText) ? 'en-US' : 'vi-VN';

        if (selectedVoice) {
          const voice = availableVoices.find(v => v.name === selectedVoice);
          if (voice) {
            utterance.voice = voice;
          }
        }

        utterance.onerror = (event) => {
          console.error('TTS Error:', event.error);
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('TTS Exception:', error);
      }
    }
  };

  const renderTooltip = useCallback((): React.ReactNode => {
    if (!selectedText) return null;
    const sel = window.getSelection()?.toString().trim() || '';
    const isEng = /^[a-zA-Z ]+$/.test(sel);
    return createPortal(
      <div style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}>
        <div style={TOOLTIP_BODY_STYLE}>
          <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ marginBottom: 8 }}>
              <Select
                value={selectedVoice}
                onChange={setSelectedVoice}
                style={{ width: '100%' }}
                placeholder="Chon giọng đọc"
                size="small"
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                dropdownStyle={{ zIndex: 10001 }}
                options={availableVoices.map(voice => ({
                  value: voice.name,
                  label: `${voice.name} (${voice.lang})`
                }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Button
                type="link"
                icon={<SoundOutlined />}
                onClick={() => speakText(selectedText)}
                style={{ color: '#7dd3fc', padding: 0, height: 'auto' }}
              >
                Đọc từ đã chọn
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Tự động đọc</span>
                <Switch
                  size="small"
                  checked={autoRead}
                  onChange={setAutoRead}
                />
              </div>
            </div>
          </div>
          {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
            <>
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
            </>
          )}
        </div>
      </div>,
      document.body
    );
  }, [selectedText, selectedVoice, availableVoices, autoRead, meaningEnKeywords, meaningViKeywords, tooltipPosition]);

  // ============================================================
  // EDIT CONTENT MODAL HANDLERS
  // ============================================================

  // Mo modal chinh sua voi du lieu cua item duoc chon
  const handleOpenEdit = useCallback((item: ContentType) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      eng: item.eng,
      vi: item.vi,
      startTime: item.startTime,
      endTime: item.endTime,
    });
    setEditModalOpen(true);
  }, [editForm]);

  const handleCancelEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingItem(null);
    editForm.resetFields();
  }, [editForm]);

  // Gui yeu cau cap nhat, phan anh thay doi truc tiep tren UI khong can reload
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
      handleCancelEdit();
      onContentUpdate?.();
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
  // INSERT WORD MODAL HANDLERS
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
        insertForm.setFields([{ name: ['viList', 0, 'vi'], errors: ['Vui lòng nhập ít nhất 1 nghĩa'] }]);
        return;
      }
      setInsertLoading(true);
      await insertWord(values.eng.trim(), viList);
      notifApi.success({
        message: 'Thêm từ thành công',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }
      });
      handleCancelInsert();
      // Trigger content update to refresh highlights
      onContentUpdate?.();
    } catch (e: any) {
      if (e?.errorFields) return;
      notifApi.error({
        message: 'Thêm từ thất bại',
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
  // SHARED PROPS
  // ============================================================

  const commonItemProps = useMemo(() => ({
    activeItemId,
    activeSource,
    isVideoPlaying,
    showEnglish,
    showVietnamese,
    highlightMissingWords,
    itemRefsRef,
    onGetMeaning: handleGetMeaning,
    renderTooltip,
    onEdit: handleOpenEdit,
    onInsertWord: handleOpenInsert,
  }), [activeItemId, activeSource, isVideoPlaying, showEnglish, showVietnamese, highlightMissingWords, itemRefsRef, handleGetMeaning, renderTooltip, handleOpenEdit, handleOpenInsert]);

  // ============================================================
  // RENDER LAYOUT
  // ============================================================

  const renderLayout = () => {
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
            videoRef={videoRef}
            listScrollRef={listScrollRef}
            playStates={playStates}
            loopStates={loopStates}
            onPlayPauseVideo={onPlayPauseVideo}
            onToggleLoop={onToggleLoop}
            onActiveItemChange={onVideoActiveItemChange}
            onVideoStop={onVideoStop}
            playCommand={playCommand}
            loopCommand={loopCommand}
            pauseCommand={pauseCommand}
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
      onAudioPlayStateChange={onAudioPlayStateChange}
      selectedVoice={selectedVoice}
      onVoiceChange={setSelectedVoice}
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
        volumeSlug={volumeSlug}
      />

      {renderLayout()}

      <Modal
        title="Thêm từ mới" open={insertModalOpen} onCancel={handleCancelInsert}
        footer={<div style={{ textAlign: 'center' }}><Space><Button
          onClick={handleCancelInsert}>Hủy</Button><Button type="primary" loading={insertLoading}
            onClick={handleInsert}>Thêm mới</Button></Space>
        </div>}
      >
        <Form form={insertForm} layout="vertical">
          <Form.Item label="Từ tiếng Anh" name="eng"
            rules={[{ required: true, message: 'Vui lòng nhập từ tiếng Anh' }]}>
            <Input placeholder="Nhập từ tiếng Anh..." />
          </Form.Item>
          <Form.List name="viList" initialValue={[{ vi: '' }]}>
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <Form.Item key={field.key} label={index === 0 ? 'Nghĩa tiếng Việt' : ''}
                  required={index === 0}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item key={field.key} name={[field.name, 'vi']} noStyle
                      rules={index === 0 ? [{
                        required: true,
                        message: 'Vui lòng nhập nghĩa'
                      }] : []}>
                      <Input placeholder={`Nghĩa ${index + 1}...`} style={{ flex: 1 }} />
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
              <Form.Item><Button type="dashed" onClick={() => add({ vi: '' })} icon={<PlusOutlined />} block>Thêm nghĩa</Button></Form.Item>
            </>)}
          </Form.List>
        </Form>
      </Modal>
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
    </div>
  );
};

export default ContentComponent;