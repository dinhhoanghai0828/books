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
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Space,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { useRouter } from 'next/navigation';
import '../../styles/content.css';

// ============================================================
// TYPES
// ============================================================

interface ContentComponentProps {
  contents: ContentType[];
  volumeSlug: string | string[];
  loading: boolean;
  isPlaying: boolean; // Trang thai audio dang phat tu parent (de dong bo icon nut)
  isParentPlaying: boolean;
  handlePlayAudio: (startTime: string, endTime: string) => void;
  handlePauseAudio: (isStop: boolean) => void;
  handleToggleAudio: (
    itemId: string,
    startTime: string,
    endTime: string,
    isLoop: boolean
  ) => void;
}

// Style cho tooltip hien thi nghia tu
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

  // Dung ref thay vi state de tranh re-render khong can thiet khi doi trang thai play/loop
  const playStatesRef = useRef<Record<string, boolean>>({});
  const loopStatesRef = useRef<Record<string, boolean>>({});

  // renderCount chi dung de ep React re-render sau khi doi ref
  const [renderCount, setRenderCount] = useState(0);
  const forceRender = () => setRenderCount((c) => c + 1);

  // Trang thai tooltip tra nghia tu
  const [meaningEnKeywords, setMeaningEnKeywords] = useState<string[]>([]);
  const [meaningViKeywords, setMeaningViKeywords] = useState<string[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // An/hien phan tieng Anh va tieng Viet
  const [showEnglish, setShowEnglish] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);

  // Bat/tat highlight tu moi trong bai
  const [highlightMissingWords, setHighlightMissingWords] = useState(true);

  // Trang thai modal them tu moi
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
  // Khi audio ket thuc (isPlaying chuyen tu true -> false), reset tat ca icon ve trang thai dung
  const prevIsPlayingRef = useRef<boolean>(false);
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    const stoppedNow = wasPlaying === true && isPlaying === false;

    if (stoppedNow) {
      Object.keys(playStatesRef.current).forEach((key) => {
        playStatesRef.current[key] = false;
      });
      Object.keys(loopStatesRef.current).forEach((key) => {
        loopStatesRef.current[key] = false;
      });
      forceRender();
    }

    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Lang nghe su kien chon chu de hien tooltip tra nghia (ho tro ca mobile)
  // NOTE: useEffect nay phai nam SAU khai bao handleGetMeaning

  // ============================================================
  // AUDIO HANDLERS
  // ============================================================

  // Bat/dung audio cua 1 item
  // - Neu item dang phat: dung lai
  // - Neu item chua phat: dung item hien tai (neu co), phat item moi
  const onPlayPauseAudio = useCallback(
    (itemId: string, startTime: string, endTime: string) => {
      const isCurrentlyPlaying = playStatesRef.current[itemId];

      // Chi cap nhat playStates: item duoc click toggle, cac item khac tat
      // KHONG dong cham vao loopStates de tranh mat trang thai loop
      Object.keys(playStatesRef.current).forEach((key) => {
        playStatesRef.current[key] = key === itemId ? !isCurrentlyPlaying : false;
      });

      if (isCurrentlyPlaying) {
        // Dang phat -> dung lai, reset loop cua item nay
        loopStatesRef.current[itemId] = false;
        handlePauseAudio(true);
      } else {
        // Chua phat -> phat moi, dam bao loop bat dau o trang thai tat
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

  // Lay nghia cua tu nguoi dung boi den (debounce 300ms)
  // - Neu tu tieng Anh: tra tieng Viet
  // - Neu tu tieng Viet: tra tieng Anh
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

        // Tinh toa do de hien tooltip sat vi tri boi
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

  // Lang nghe su kien boi chu tren toan trang de hien tooltip
  // (phai khai bao SAU handleGetMeaning de tranh loi "cannot access before initialization")
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

      // Phai co it nhat 1 nghia tieng Viet
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
      // errorFields: loi validation cua antd, khong can hien them thong bao
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
  // RENDER
  // ============================================================

  return (
    <div className="content-container">
      {notifContextHolder}

      {/* Thanh cong cu: an/hien, highlight tu moi, kiem tra, them tu */}
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
        <div>
          {/* Tieu de tap */}
          <Typography.Title level={3} className="volume-title">
            {volumeEngName}
          </Typography.Title>
          <Typography.Text className="volume-vi-name">
            {volumeViName}
          </Typography.Text>
          <Typography.Text className="volume-total-sentence">
            Bai co tong cong:{' '}
            <strong style={{ color: 'red' }}>{contents.length}</strong> cau can hoc
          </Typography.Text>

          {/* Danh sach cau */}
          {contents.map((item) => (
            <div key={item.id} className="content-item">

              {/* Dong tieng Anh + nut play/loop */}
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
                  {/* Nut Play / Pause */}
                  <Button
                    type="link"
                    icon={
                      playStatesRef.current[item.id]
                        ? <PauseOutlined />
                        : <PlayCircleOutlined />
                    }
                    onClick={() => onPlayPauseAudio(item.id, item.startTime, item.endTime)}
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
                    onClick={() => onToggleLoop(item.id, item.startTime, item.endTime)}
                  />
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
        </div>
      ) : (
        <Empty description="Khong co du lieu" className="emptyClass" />
      )}

      {/* Modal them tu moi */}
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
          {/* Truong nhap tu tieng Anh */}
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
                        {...field}
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
                      {/* Chi hien nut xoa khi co nhieu hon 1 nghia */}
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                          style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
                        />
                      )}
                    </div>
                  </Form.Item>
                ))}
                {/* Nut them nghia moi */}
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
