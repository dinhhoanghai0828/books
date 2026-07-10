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
  handlePlayAudio: (startTime: string, endTime: string) => void;
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

// ============================================================
// HELPERS
// ============================================================

// Chuyen chuoi "hh:mm:ss" thanh so giay
const parseTimeToSeconds = (time: string): number => {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
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
  const { volumeEngName, volumeViName } = contents[0] || {};

  // Lay duong dan video duy nhat cua tap (lay tu item dau tien co video)
  const sharedVideoPath = contents.find((item) => item.video)?.video;

  // Ref tro den the <video> duy nhat dung chung cho toan tap
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Luu endTime (so giay) cua doan dang phat de xu ly trong timeupdate listener
  const videoEndRef = useRef<number>(0);

  // Dung ref thay vi state de tranh re-render khong can thiet khi doi trang thai play/loop
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});

  // forceRender dung de ep React ve lai UI sau khi thay doi ref
  const [, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // Trang thai item dang phat tren video (de highlight hang active)
  const [activeVideoItemId, setActiveVideoItemId] = useState<string | null>(null);

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

  // Dang ky timeupdate listener 1 lan duy nhat cho video dung chung.
  // Khi currentTime vuot videoEndRef: dung video, reset trang thai active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (videoEndRef.current > 0 && video.currentTime >= videoEndRef.current) {
        video.pause();
        videoEndRef.current = 0;
        setActiveVideoItemId(null);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  // Theo doi isPlaying tu parent:
  // Khi audio ket thuc (isPlaying: true -> false), reset tat ca icon ve trang thai dung
  const prevIsPlayingRef = useRef(false);
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    if (wasPlaying && !isPlaying) {
      Object.keys(playStatesRef.current).forEach((k) => { playStatesRef.current[k] = false; });
      Object.keys(loopStatesRef.current).forEach((k) => { loopStatesRef.current[k] = false; });
      forceRender();
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ============================================================
  // VIDEO HANDLER
  // ============================================================

  // Seek video dung chung den doan cua item duoc click.
  // Neu item nay dang phat: dung lai.
  // Neu item khac: seek den startTime va bat dau phat.
  const onPlayPauseVideo = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const video = videoRef.current;
      if (!video) return;

      if (activeVideoItemId === itemId && !video.paused) {
        // Dang phat item nay -> dung lai
        video.pause();
        videoEndRef.current = 0;
        setActiveVideoItemId(null);
        return;
      }

      // Seek den startTime cua item moi va phat
      const start = parseTimeToSeconds(startTime);
      videoEndRef.current = parseTimeToSeconds(endTime);
      video.currentTime = start;
      video.play();
      setActiveVideoItemId(itemId);
    },
    [activeVideoItemId]
  );

  // ============================================================
  // AUDIO HANDLERS
  // ============================================================

  // Bat/dung audio cua 1 item:
  // - Dang phat: dung lai, reset loop
  // - Chua phat: dung item khac (neu co), phat item moi
  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStatesRef.current[itemId];

      // Toggle item duoc click, tat tat ca item khac
      Object.keys(playStatesRef.current).forEach((k) => {
        playStatesRef.current[k] = k === itemId ? !isCurrentlyPlaying : false;
      });

      if (isCurrentlyPlaying) {
        loopStatesRef.current[itemId] = false;
        handlePauseAudio(true);
      } else {
        loopStatesRef.current[itemId] = false;
        handlePlayAudio(startTime, endTime);
        handleToggleAudio(itemId, startTime, endTime, false);
      }

      forceRender();
    },
    [handlePlayAudio, handlePauseAudio, handleToggleAudio]
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

  // Mo modal them tu, reset form truoc khi hien
  const handleOpenInsert = () => {
    insertForm.resetFields();
    setInsertModalOpen(true);
  };

  // Dong modal va reset form
  const handleCancelInsert = () => {
    setInsertModalOpen(false);
    insertForm.resetFields();
  };

  // Validate va gui yeu cau them tu moi vao tu dien
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
  // RENDER NOI DUNG TUNG CAU (cot phai hoac toan bo neu khong co video)
  // ============================================================

  const renderItemContent = (item: ContentType) => (
    <div>
      {/* Dong tieng Anh + nut play audio + nut loop + (neu co video) nut play video */}
      <div className="eng-line">
        <div style={{ visibility: showEnglish ? 'visible' : 'hidden' }}>
          <Typography.Text
            strong
            className="engClass"
            onMouseUp={(e) => { e.stopPropagation(); handleGetMeaning(); }}
            onTouchEnd={(e) => { e.stopPropagation(); handleGetMeaning(); }}
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
          {/* Nut Play / Pause audio */}
          <Button
            type="link"
            icon={playStatesRef.current[item.id] ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={() => onPlayPauseAudio(item.id, item.startTime, item.endTime)}
          />
          {/* Nut bat/tat lap lai, chi hoat dong khi item dang phat audio */}
          <Button
            type="link"
            icon={loopStatesRef.current[item.id] ? <RetweetOutlined /> : <RollbackOutlined />}
            disabled={!playStatesRef.current[item.id]}
            onClick={() => onToggleLoop(item.id, item.startTime, item.endTime)}
          />
          {/* Nut Play / Pause video dung chung (chi hien khi item co video) */}
          {item.video && (
            <Button
              type="link"
              icon={
                activeVideoItemId === item.id
                  ? <PauseOutlined style={{ color: '#f5222d' }} />
                  : <PlayCircleOutlined style={{ color: '#f5222d' }} />
              }
              onClick={() => onPlayPauseVideo(item.id, item.startTime, item.endTime)}
            />
          )}
        </Space>
      </div>

      {/* Dong tieng Viet */}
      <div style={{ visibility: showVietnamese ? 'visible' : 'hidden' }}>
        <Typography.Text
          strong
          className="viClass"
          onMouseUp={(e) => { e.stopPropagation(); handleGetMeaning(); }}
          onTouchEnd={(e) => { e.stopPropagation(); handleGetMeaning(); }}
        >
          {item.vi}
        </Typography.Text>
      </div>
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

      {/* Thanh cong cu: an/hien van ban, highlight tu moi, kiem tra, them tu */}
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
        // Layout chinh: neu tap co video thi chia 2 cot (video trai co dinh, noi dung phai)
        // neu tap khong co video thi hien thi 1 cot binh thuong
        sharedVideoPath ? (
          <Row gutter={24} align="top" style={{ marginTop: 16 }}>

            {/* Cot trai: video duy nhat, sticky theo scroll */}
            <Col xs={24} md={10}>
              <div style={{ position: 'sticky', top: 16 }}>
                <Typography.Title level={3} className="volume-title">
                  {volumeEngName}
                </Typography.Title>
                <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>

                {/* The <video> duy nhat dung chung cho ca tap */}
                <video
                  ref={videoRef}
                  src={`/media/${sharedVideoPath}`}
                  controls
                  style={{ width: '100%', borderRadius: 8, marginTop: 12 }}
                />

                <Typography.Text className="volume-total-sentence" style={{ display: 'block', marginTop: 8 }}>
                  Bai co tong cong:{' '}
                  <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
                </Typography.Text>
              </div>
            </Col>

            {/* Cot phai: danh sach cau co the cuon */}
            <Col xs={24} md={14}>
              {contents.map((item) => (
                <div
                  key={item.id}
                  className="content-item"
                  style={
                    activeVideoItemId === item.id
                      ? { borderLeft: '3px solid #1677ff', paddingLeft: 8 }
                      : {}
                  }
                >
                  {renderItemContent(item)}
                </div>
              ))}

              {/* Tooltip tra nghia tu */}
              {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
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
              )}
            </Col>
          </Row>
        ) : (
          // Tap khong co video: layout 1 cot giu nguyen nhu cu
          <div>
            <Typography.Title level={3} className="volume-title">
              {volumeEngName}
            </Typography.Title>
            <Typography.Text className="volume-vi-name">{volumeViName}</Typography.Text>
            <Typography.Text className="volume-total-sentence">
              Bai co tong cong:{' '}
              <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
            </Typography.Text>

            {contents.map((item) => (
              <div key={item.id} className="content-item">
                {renderItemContent(item)}
              </div>
            ))}

            {/* Tooltip tra nghia tu */}
            {meaningEnKeywords.length > 0 && meaningViKeywords.length > 0 && (
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
            )}
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

          {/* Danh sach nghia tieng Viet (co the them nhieu nghia) */}
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
                      {/* Nut xoa chi hien khi co nhieu hon 1 nghia */}
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
