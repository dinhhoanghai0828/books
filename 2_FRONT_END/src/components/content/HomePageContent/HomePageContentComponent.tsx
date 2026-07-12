import { ContentType } from '@/interfaces/content';
import { getMeaningWords, updateContent } from '@/utils/apiService';
import { getMediaPath } from '@/utils/mediaPathHelper';
import { Col, Empty, Form, Layout, message, notification, Row } from 'antd';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ContentCard from './ContentCard';
import EditModal from './EditModal';
import MeaningTooltip from './MeaningTooltip';
import VideoModal from './VideoModal';

const { Content } = Layout;

// ============================================================
// HOME PAGE CONTENT COMPONENT
// Hien thi danh sach noi dung tren trang chu voi cac chuc nang:
// - Phat audio theo doan thoi gian
// - Lap lai audio
// - Xem video theo doan thoi gian
// - Tra nghia tu khi boi chon text
// - Chinh sua noi dung
// ============================================================

interface HomePageContentComponentProps {
  contents: ContentType[];
  playbackSpeed: number;
  searchValueEn: string;
  searchValueVi: string;
  highlightedEnKeywords: string[];
  highlightedViKeywords: string[];
}

const HomePageContentComponent = ({
  contents,
  playbackSpeed,
  searchValueEn,
  searchValueVi,
  highlightedEnKeywords,
  highlightedViKeywords,
}: HomePageContentComponentProps) => {
  // ============================================================
  // STATE
  // ============================================================

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
            return;
          }

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
    const handleClickOutside = () => {
      if (window.getSelection()?.toString().trim() === '') {
        setMeaningEnKeywords([]);
        setMeaningViKeywords([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Bat/dung audio cua 1 item
  const toggleAudio = useCallback(
    (itemId: string, audioPath: string, startTime: string, endTime: string) => {
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
          if (loopStatesRef.current[itemId]) {
            audio.currentTime = start;
          } else {
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
      currentPlayingIdRef.current = itemId;
      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === itemId;
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

  // Bat/tat che do lap lai cho 1 item
  const onToggleLoop = useCallback((itemId: string) => {
    loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
    forceRender();
  }, []);

  // ============================================================
  // VIDEO HANDLERS
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

  // Dong modal video va xoa src
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

  // ============================================================
  // EDIT HANDLERS
  // ============================================================

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

      // Cap nhat du lieu hien thi truc tiep
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
              <ContentCard
                item={item}
                isPlaying={playStatesRef.current[item.id]}
                isLooping={loopStatesRef.current[item.id]}
                highlightedEnKeywords={highlightedEnKeywords}
                highlightedViKeywords={highlightedViKeywords}
                searchValueEn={searchValueEn}
                searchValueVi={searchValueVi}
                onToggleAudio={toggleAudio}
                onToggleLoop={onToggleLoop}
                onOpenVideo={handleOpenVideo}
                onOpenEdit={handleOpenEdit}
              />
            </Col>
          ))}

          <MeaningTooltip
            meaningEnKeywords={meaningEnKeywords}
            meaningViKeywords={meaningViKeywords}
            position={tooltipPosition}
          />
        </Row>
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      <VideoModal
        open={videoModalOpen}
        videoSrc={videoSrc}
        videoRef={videoRef}
        videoStartTime={videoStartTime}
        videoEndTime={videoEndTime}
        onClose={handleCloseVideo}
        onLoaded={handleVideoLoaded}
        onTimeUpdate={handleVideoTimeUpdate}
      />

      <EditModal
        open={editModalOpen}
        editingItem={editingItem}
        form={editForm}
        loading={editLoading}
        onCancel={handleCancelEdit}
        onUpdate={handleUpdate}
      />
    </Content>
  );
};

export default HomePageContentComponent;
