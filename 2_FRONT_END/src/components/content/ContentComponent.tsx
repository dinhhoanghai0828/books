import { ContentType } from '@/interfaces/content';
import { Volume } from '@/interfaces/volume';
import { deleteContent, getMeaningWords, insertWord, updateContent } from '@/utils/apiService';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, notification, Space } from 'antd';
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
  // STATE — edit content modal
  // ============================================================

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  // ============================================================
  // STATE — delete content modal
  // ============================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContentType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset toàn bộ trạng thái chạy media khi đổi Tab
  const resetAllPlayStates = useCallback(() => {
    setPauseCommand(Date.now());
    if (activeSourceRef.current === 'audio') {
      handlePauseAudio(true);
    }
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setLoopStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
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

  // Đồng bộ trạng thái từ Audio Player bên dưới
  const onAudioPlayStateChange = useCallback((isPlayingAudio: boolean, currentActiveId: string | null) => {
    if (!currentActiveId) return;
    setPlayStates((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === currentActiveId ? isPlayingAudio : false]))
    );
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
      setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      setActive(null, null);
      setIsVideoPlaying(false);
      setPauseCommand(Date.now());
      return;
    }

    // Nếu audio đang chạy -> Dừng audio
    if (activeSourceRef.current === 'audio') {
      handlePauseAudio(true);
    }

    // Cập nhật state & phát command cho Video
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, k === itemIdStr])));
    setLoopStates((prev) => ({ ...prev, [itemIdStr]: false }));
    setActive(itemIdStr, 'video');
    setIsVideoPlaying(true);
    setPlayCommand({ itemId: itemIdStr, startTime, endTime, ts: Date.now() });
  }, [playStates, setActive, handlePauseAudio]);

  // Callback từ VideoLayout khi video dừng/hết đoạn
  const onVideoStop = useCallback(() => {
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setLoopStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setActive(null, null);
    setIsVideoPlaying(false);
  }, [setActive]);

  // Callback từ VideoLayout khi timeupdate phát hiện câu mới
  const onVideoActiveItemChange = useCallback((id: string) => {
    if (activeItemIdRef.current === id) return;
    setActive(id, 'video');
    setPlayStates((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === id]))
    );
  }, [setActive]);

  // 2. AUDIO PLAY/PAUSE HANDLER
  const onPlayPauseAudio = useCallback((itemId: string, startTime: string, endTime: string) => {
    const itemIdStr = String(itemId);
    const isCurrentlyPlaying = playStates[itemIdStr] ?? false;

    if (isCurrentlyPlaying) {
      setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      setActive(null, null);
      setPauseCommand(Date.now());
      return;
    }

    // Dừng video nếu đang chạy
    if (activeSourceRef.current === 'video') {
      setIsVideoPlaying(false);
      setPauseCommand(Date.now());
    }

    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, k === itemIdStr])));
    setLoopStates((prev) => ({ ...prev, [itemIdStr]: false }));
    setActive(itemIdStr, 'audio');
    setPlayCommand({ itemId: itemIdStr, startTime, endTime, ts: Date.now() });
  }, [playStates, setActive]);

  const onAudioStop = useCallback(() => {
    setPlayStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setLoopStates((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
    setActive(null, null);
  }, [setActive]);

  const onAudioActiveItemChange = useCallback((id: string) => {
    if (activeItemIdRef.current === id) return;
    setActive(id, 'audio');
    setPlayStates((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === id]))
    );
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
  // DELETE CONTENT MODAL HANDLERS
  // ============================================================

  // Mo modal xoa voi du lieu cua item duoc chon
  const handleOpenDelete = useCallback((item: ContentType) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingItem(null);
  }, []);

  // Gui yeu cau xoa, phan anh thay doi truc tiep tren UI khong can reload
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleteLoading(true);
      await deleteContent(deletingItem.id);
      notifApi.success({
        message: 'Xóa thành công',
        description: 'Câu đã được xóa.',
        placement: 'topRight',
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' },
      });
      handleCancelDelete();
      onContentUpdate?.();
    } catch (error: any) {
      notifApi.error({
        message: 'Xóa thất bại',
        description: error.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
        placement: 'topRight',
        duration: 4,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' },
      });
    } finally {
      setDeleteLoading(false);
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
    onEdit: handleOpenEdit,
    onInsertWord: handleOpenInsert,
    onDelete: handleOpenDelete,
  };

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
      <Modal
        title="Xác nhận xóa"
        open={deleteModalOpen}
        onCancel={handleCancelDelete}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelDelete}>Hủy</Button>
              <Button type="primary" danger loading={deleteLoading} onClick={handleDelete}>
                Xóa
              </Button>
            </Space>
          </div>
        }
      >
        {deletingItem && (
          <div>
            <p>Bạn có chắc chắn muốn xóa câu này?</p>
            <p style={{ fontWeight: 'bold', color: '#1677ff' }}>{deletingItem.eng}</p>
            <p style={{ fontWeight: 'bold', color: '#1677ff' }}>{deletingItem.vi}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContentComponent;