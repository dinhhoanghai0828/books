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

// Style cho tooltip tra nghia tu
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

// Style highlight khi cau dang duoc phat (audio hoac video)
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

// Chuyen chuoi "hh:mm:ss" thanh so giay
const parseTimeToSeconds = (time: string): number => {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

// Tim item trong danh sach contents co startTime <= currentTime < endTime
const findActiveItem = (
  contents: ContentType[],
  currentTime: number
): ContentType | undefined =>
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

  // Lay duong dan video duy nhat cua tap (lay tu item dau tien co video)
  const sharedVideoPath = contents.find((item) => item.video)?.video;

  // Ref tro den the <video> duy nhat dung chung cho toan tap
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Luu startTime/endTime (so giay) cua doan video dang phat de xu ly trong timeupdate
  const videoEndRef = useRef<number>(0);

  // Dung ref thay vi state de tranh re-render khong can thiet khi doi trang thai play/loop
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});

  // forceRender dung de ep React ve lai UI sau khi thay doi ref
  const [, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // ID cau dang duoc highlight boi audio (set khi click play, clear khi dung)
  const [activeAudioItemId, setActiveAudioItemId] = useState<string | null>(null);

  // ID cau dang duoc highlight boi video (tu dong detect theo currentTime)
  const [activeVideoItemId, setActiveVideoItemId] = useState<string | null>(null);

  // Track trang thai video dang phat hay dung de re-render icon dung luc
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Flag: chi scroll khi nguoi dung bam audio, KHONG scroll khi bam video
  const shouldScrollRef = useRef(false);

  // Ref tro den tung hang noi dung de auto-scroll khi cau thay doi
  const itemRefsRef = useRef<Record<string, HTMLDivElement | null>>({});

  // Trang thai tooltip tra nghia tu
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // An/hien van ban tieng Anh va tieng Viet
  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);

  // Bat/tat highlight tu moi (missingWords) trong noi dung
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  // Trang thai modal them tu moi vao tu dien
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertForm] = Form.useForm();
  const [notifApi, notifContextHolder] = notification.useNotification();

  // ============================================================
  // EFFECTS
  // ============================================================

  // Khoi tao trang thai play/loop cho tung item khi danh sach noi dung thay doi
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

  // Theo doi isPlaying tu parent:
  // Khi audio ket thuc (isPlaying: true -> false), reset tat ca icon + xoa highlight audio
  const prevIsPlayingRef = useRef(false);
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    if (wasPlaying && !isPlaying) {
      Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
      Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
      setActiveAudioItemId(null);
      forceRender();
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Dang ky timeupdate listener 1 lan duy nhat cho video dung chung.
  // Moi frame: tim cau tuong ung voi currentTime, highlight + auto-scroll.
  // Khi vuot videoEndRef: dung video va reset highlight.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      // Dung khi den endTime cua doan dang phat
      if (videoEndRef.current > 0 && currentTime >= videoEndRef.current) {
        video.pause();
        videoEndRef.current = 0;
        setActiveVideoItemId(null);
        setIsVideoPlaying(false);
        return;
      }

      // Tim cau dang chay theo currentTime va highlight
      const activeItem = findActiveItem(contents, currentTime);
      if (activeItem) {
        setActiveVideoItemId((prev) => {
          if (prev !== activeItem.id) {
            // Cau moi: scroll no vao view trong vung cuon ben phai
            itemRefsRef.current[activeItem.id]?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
          return activeItem.id;
        });
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [contents]);

  // Scroll den phan tu voi offset bu header co dinh (~170px)
  const scrollToItem = (itemId: string) => {
    const el = itemRefsRef.current[itemId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 170;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Auto-scroll chi chay khi nguoi dung bam audio (shouldScrollRef = true)
  useEffect(() => {
    if (activeAudioItemId && shouldScrollRef.current) {
      scrollToItem(activeAudioItemId);
      shouldScrollRef.current = false;
    }
  }, [activeAudioItemId]);

  // ============================================================
  // VIDEO HANDLER
  // ============================================================

  // Seek video dung chung den doan cua item duoc click.
  // Neu item nay dang phat: dung lai.
  // Neu item khac hoac video dang dung: seek den startTime va bat dau phat.
  const onPlayPauseVideo = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const video = videoRef.current;
      if (!video) return;

      if (activeVideoItemId === itemId && isVideoPlaying) {
        // Dang phat item nay -> dung video lai
        video.pause();
        videoEndRef.current = 0;
        setActiveVideoItemId(null);
        setIsVideoPlaying(false);
        return;
      }

      // Bat dau phat video -> dung audio neu dang chay
      if (activeAudioItemId) {
        Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
        Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
        setActiveAudioItemId(null);
        handlePauseAudio(true);
        forceRender();
      }

      // Seek video den doan can phat
      videoEndRef.current = parseTimeToSeconds(endTime);
      video.currentTime = parseTimeToSeconds(startTime);
      video.play();
      setActiveVideoItemId(itemId);
      setIsVideoPlaying(true);
    },
    [activeVideoItemId, isVideoPlaying, activeAudioItemId, handlePauseAudio]
  );

  // ============================================================
  // AUDIO HANDLERS
  // ============================================================

  // Bat/dung audio cua 1 item:
  // - Dang phat item nay: dung lai, xoa highlight
  // - Phat item moi: goi handleToggleAudio voi itemId moi ->
  //   AudioComponent nhan itemId thay doi, useEffect re-run, seek va phat dung doan
  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStatesRef.current[itemId];

      // Toggle item duoc click, tat tat ca item khac
      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === itemId ? !isCurrentlyPlaying : false;
      });

      if (isCurrentlyPlaying) {
        // Dang phat item nay -> dung audio lai
        loopStatesRef.current[itemId] = false;
        setActiveAudioItemId(null);
        handlePauseAudio(true);
      } else {
        // Bat dau phat audio -> dung video neu dang chay
        const video = videoRef.current;
        if (isVideoPlaying && video) {
          video.pause();
          videoEndRef.current = 0;
          setActiveVideoItemId(null);
          setIsVideoPlaying(false);
        }

        // Phat audio moi
        loopStatesRef.current[itemId] = false;
        shouldScrollRef.current = true;
        setActiveAudioItemId(itemId);
        handleToggleAudio(itemId, startTime, endTime, false);
        handlePlayAudio(startTime, endTime, Number(itemId));
        scrollToItem(itemId);
      }

      forceRender();
    },
    [handlePlayAudio, handlePauseAudio, handleToggleAudio, isVideoPlaying]
  );

  // Bat/tat che do lap lai cho 1 item
  const onToggleLoop = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      loopStatesRef.current[itemId] = !loopStatesRef.current[itemId];
      handleToggleAudio(itemId, startTime, endTime, loopStatesRef.current[itemId]);
      forceRender();
    },
    [handleToggleAudio]
  );

  // ============================================================
  // TOOLTIP - TRA NGHIA TU
  // ============================================================

  // Lay nghia cua tu nguoi dung boi chon (debounce 300ms)
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

        // Tranh goi API lai neu tu da duoc hien thi truoc do
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
        console.error('Loi khi tra nghia tu:', error);
      }
    }, 300),
    [meaningEnKeywords, meaningViKeywords]
  );

  // Lang nghe su kien boi chu tren toan trang de hien tooltip
  useEffect(() => {
    document.addEventListener('selectionchange', handleGetMeaning);
    return () => document.removeEventListener('selectionchange', handleGetMeaning);
  }, [handleGetMeaning]);

  // ============================================================
  // MODAL THEM TU MOI
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
          { name: ['viList', 0, 'vi'], errors: ['Vui long nhap it nhat 1 nghia tieng Viet'] },
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
  // RENDER NOI DUNG TUNG CAU
  // isActive: cau nay dang duoc phat (audio hoac video) -> highlight toan bo hang
  // ============================================================

  const renderItemContent = (item: ContentType, isActive: boolean) => (
    <div>
      {/* Dong tieng Anh + nut play audio + nut loop + nut play video */}
      <div className="eng-line">
        <div style={{ visibility: showEnglish ? 'visible' : 'hidden' }}>
          <Typography.Text
            strong
            className="engClass"
            style={isActive ? { color: '#1677ff' } : {}}
            onMouseUp={(e) => { e.stopPropagation(); handleGetMeaning(); }}
            onTouchEnd={(e) => { e.stopPropagation(); handleGetMeaning(); }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.eng.split(/\s+/).map((word, idx) => {
              const cleanWord = word.replace(/[.,?!";']/g, '').toLowerCase();
              const isMissing =
                highlightMissingWords &&
                item.missingWords?.map((w) => w.toLowerCase()).includes(cleanWord);
              return (
                <span
                  key={idx}
                  className={isMissing ? 'highlight-missing' : ''}
                  style={isMissing ? { backgroundColor: '#ffe58f' } : {}}
                >
                  {word + ' '}
                </span>
              );
            })}
          </Typography.Text>
        </div>

        <Space className="button-group">
          {/* Nut Play / Pause video dung chung (chi hien khi item co video) — dat TRUOC audio */}
          {item.video && (
            <Button
              type="link"
              icon={
                activeVideoItemId === item.id && isVideoPlaying
                  ? <PauseOutlined style={{ color: '#1677ff' }} />
                  : <VideoCameraOutlined />
              }
              onClick={(e) => { e.stopPropagation(); onPlayPauseVideo(item.id, item.startTime, item.endTime); }}
            />
          )}
          {/* Nut Play / Pause audio */}
          <Button
            type="link"
            icon={playStatesRef.current[item.id] ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={(e) => { e.stopPropagation(); onPlayPauseAudio(item.id, item.startTime, item.endTime); }}
          />
          {/* Nut bat/tat lap lai, chi hoat dong khi item dang phat audio */}
          <Button
            type="link"
            icon={loopStatesRef.current[item.id] ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!playStatesRef.current[item.id]}
            onClick={(e) => { e.stopPropagation(); onToggleLoop(item.id, item.startTime, item.endTime); }}
          />
        </Space>
      </div>

      {/* Dong tieng Viet */}
      <div style={{ visibility: showVietnamese ? 'visible' : 'hidden' }}>
        <Typography.Text
          strong
          className="viClass"
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

  // Tong hop: cau duoc coi la active neu dang duoc phat boi audio HOAC video
  const getIsActive = (itemId: string) =>
    activeAudioItemId === itemId || activeVideoItemId === itemId;

  // ============================================================
  // CLICK VAO CAU: seek ca audio va video den doan do roi phat
  // [DISABLED] - comment lai, mo ra khi can dung
  // ============================================================

  // const onClickItem = useCallback(
  //   (item: ContentType) => {
  //     const video = videoRef.current;
  //     if (!video) return;
  //     videoEndRef.current = parseTimeToSeconds(item.endTime);
  //     video.currentTime = parseTimeToSeconds(item.startTime);
  //     video.play();
  //     setActiveVideoItemId(item.id);
  //   },
  //   []
  // );

  // ============================================================
  // RENDER DANH SACH CAU (dung chung cho ca 2 layout)
  // ============================================================

  const renderContentList = () =>
    contents.map((item) => {
      const isActive = getIsActive(item.id);
      return (
        <div
          key={item.id}
          ref={(el) => { itemRefsRef.current[item.id] = el; }}
          className="content-item"
          style={isActive ? ACTIVE_ITEM_STYLE : {}}
          // onClick={() => onClickItem(item)} // [DISABLED] click de seek video
        >
          {renderItemContent(item, isActive)}
        </div>
      );
    });

  // ============================================================
  // RENDER TOOLTIP
  // ============================================================

  const renderTooltip = () =>
    meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 ? (
      <div
        className="meaning-container"
        style={{ ...TOOLTIP_STYLE, left: tooltipPosition.x, top: tooltipPosition.y }}
      >
        {/^[a-zA-Z ]+$/.test(window.getSelection()?.toString().trim() || '')
          ? meaningEnKeywords.map((word, i) => (
              <div key={i}><strong>{word}</strong>: {meaningViKeywords[i]}</div>
            ))
          : meaningViKeywords.map((word, i) => (
              <div key={i}><strong>{word}</strong>: {meaningEnKeywords[i]}</div>
            ))}
      </div>
    ) : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

      {/* Thanh cong cu */}
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
          {highlightMissingWords ? 'An tu moi' : 'Tu moi'}
        </Button>
        <Button
          type="primary"
          onClick={() => router.push(`/test?volumeSlug=${volumeSlug}`)}
          className="custom-button"
        >
          Kiem tra
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenInsert}
          className="custom-button"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }}
        >
          Them tu moi
        </Button>
      </Space>

      {contents && contents.length > 0 ? (
        sharedVideoPath ? (
          // ── Layout 2 cot: tap co video ──────────────────────────────
          <Row gutter={24} align="top" style={{ marginTop: 16 }}>

            {/* Cot trai: video sticky */}
            <Col xs={24} md={10}>
              <div style={{ position: 'sticky', top: 16 }}>
                {/* 1 the <video> duy nhat dung chung cho ca tap */}
                <video
                  ref={videoRef}
                  src={`/media/${sharedVideoPath}`}
                  controls
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </div>
            </Col>

            {/* Cot phai: tieu de + danh sach cau cuon doc lap */}
            <Col xs={24} md={14}>
              <Typography.Title level={3} className="volume-title">
                {volumeEngName}
              </Typography.Title>
              <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
              <Typography.Text className="volume-total-sentence" style={{ display: 'block', marginBottom: 8 }}>
                Bai co tong cong:{' '}
                <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
              </Typography.Text>

              {/* Vung cuon doc lap de danh sach luon thay doi theo video */}
              <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
                {renderContentList()}
                {renderTooltip()}
              </div>
            </Col>
          </Row>
        ) : (
          // ── Layout 1 cot: tap khong co video ────────────────────────
          <div>
            <Typography.Title level={3} className="volume-title">
              {volumeEngName}
            </Typography.Title>
            <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
            <Typography.Text className="volume-total-sentence">
              Bai co tong cong:{' '}
              <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
            </Typography.Text>

            {renderContentList()}
            {renderTooltip()}
          </div>
        )
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      {/* Modal them tu moi vao tu dien */}
      <Modal
        title="Them tu moi"
        open={insertModalOpen}
        onCancel={handleCancelInsert}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={handleCancelInsert}>Huy</Button>
              <Button type="primary" loading={insertLoading} onClick={handleInsert}>
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
                            ? [{ required: true, message: 'Vui long nhap nghia tieng Viet' }]
                            : []
                        }
                      >
                        <Input placeholder={`Nghia ${index + 1}...`} style={{ flex: 1 }} />
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
                  <Button type="dashed" onClick={() => add({ vi: '' })} icon={<PlusOutlined />} block>
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
