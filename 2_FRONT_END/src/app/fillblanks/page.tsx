'use client';
import { ContentType } from '@/interfaces/content';
import { getTests } from '@/utils/apiService';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, Typography, message, Input } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

// So cau hoi mac dinh moi lan kiem tra
const DEFAULT_LIMIT = '20';

// ============================================================
// COMPONENT
// ============================================================

const FillBlanksPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [sentences, setSentences] = useState<ContentType[]>([]);
  const [blanksData, setBlanksData] = useState<Record<string, { sentence: string[], blanks: string[] }>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<string, Record<number, string>>>({});
  const [checkedResults, setCheckedResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [limit] = useState(DEFAULT_LIMIT);

  // Quan ly audio bang ref de tranh stale closure
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Lay danh sach cau hoi va khoi tao blanks
  const fetchData = async (limitValue: string) => {
    setLoading(true);
    try {
      const response = await getTests(volumeSlug, limitValue);
      setSentences(response);
      
      // Tạo blanks từ missingWords
      const blanks = response.reduce((acc, sentence) => {
        const missingWords = sentence.missingWords || [];
        if (missingWords.length === 0) {
          // Nếu không có missingWords, chọn ngẫu nhiên 1-2 từ để làm blanks
          const words = sentence.eng.split(' ');
          const numBlanks = Math.min(Math.floor(Math.random() * 2) + 1, words.length);
          const shuffledIndices = [...Array(words.length).keys()].sort(() => Math.random() - 0.5);
          const selectedIndices = shuffledIndices.slice(0, numBlanks);
          
          const sentenceParts: string[] = [];
          const blankWords: string[] = [];
          
          words.forEach((word, idx) => {
            if (selectedIndices.includes(idx)) {
              sentenceParts.push('___');
              blankWords.push(word);
            } else {
              sentenceParts.push(word);
            }
          });
          
          acc[sentence.id] = { sentence: sentenceParts, blanks: blankWords };
        } else {
          // Sử dụng missingWords từ data
          const words = sentence.eng.split(' ');
          const sentenceParts: string[] = [];
          
          words.forEach((word) => {
            if (missingWords.includes(word)) {
              sentenceParts.push('___');
            } else {
              sentenceParts.push(word);
            }
          });
          
          acc[sentence.id] = { sentence: sentenceParts, blanks: missingWords };
        }
        return acc;
      }, {} as Record<string, { sentence: string[], blanks: string[] }>);
      
      setBlanksData(blanks);
    } catch (error) {
      console.error('Loi khi lay du lieu kiem tra:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(DEFAULT_LIMIT);
  }, [volumeSlug]);

  // ============================================================
  // ANSWER INPUT
  // ============================================================

  const handleBlankChange = (sentenceId: string, blankIndex: number, value: string) => {
    if (isChecked) return;
    setBlankAnswers((prev) => ({
      ...prev,
      [sentenceId]: {
        ...(prev[sentenceId] || {}),
        [blankIndex]: value,
      },
    }));
  };

  // ============================================================
  // CHECK RESULTS
  // ============================================================

  const handleCheckResults = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpenConfirmModal(false);
      setConfirmLoading(false);

      const results = sentences.reduce((acc, sentence) => {
        const blanks = blanksData[sentence.id]?.blanks || [];
        const answers = blankAnswers[sentence.id] || {};
        
        // Kiểm tra từng blank
        let allCorrect = true;
        blanks.forEach((word, idx) => {
          const userAnswer = (answers[idx] || '').trim().toLowerCase();
          const correctWord = word.toLowerCase();
          if (userAnswer !== correctWord) {
            allCorrect = false;
          }
        });
        
        acc[sentence.id] = allCorrect;
        return acc;
      }, {} as Record<string, boolean>);

      setCheckedResults(results);
      setIsChecked(true);
      setScore(Object.values(results).filter(Boolean).length);
      setOpenResultModal(true);
    }, 100);
  };

  const reloadTest = async () => {
    stopAudio();
    setLoading(true);
    setSentences([]);
    setBlanksData({});
    setBlankAnswers({});
    setCheckedResults({});
    setIsChecked(false);
    setScore(0);
    await fetchData(limit);
  };

  // ============================================================
  // AUDIO
  // ============================================================

  const parseTimeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  const toggleAudio = (
    itemId: string,
    audioPath: string,
    startTime: string,
    endTime: string
  ) => {
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

    if (currentPlayingId === itemId) {
      stopAudio();
      return;
    }

    stopAudio();

    const audio = new Audio(`/media/${audioPath}`);
    audio.currentTime = start;

    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= end) {
        audio.pause();
        currentAudioRef.current = null;
        setCurrentPlayingId(null);
      }
    });

    audio.addEventListener('ended', () => {
      currentAudioRef.current = null;
      setCurrentPlayingId(null);
    });

    currentAudioRef.current = audio;
    setCurrentPlayingId(itemId);

    audio.play().catch(() => message.error('Khong the phat am thanh.'));
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="test-container" style={{ marginTop: 50, marginBottom: 70 }}>
      <Typography.Title level={3} className="test-title">
        Điền từ còn thiếu - {volumeSlug}
      </Typography.Title>

      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lại
        </Button>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        sentences.map((sentence) => {
          const blanks = blanksData[sentence.id];
          if (!blanks) return null;

          return (
            <div key={sentence.id} className="sentence-container">
              <Text className="viClass">{sentence.vi}</Text>

              <Button
                type="link"
                icon={
                  currentPlayingId === sentence.id
                    ? <PauseOutlined />
                    : <PlayCircleOutlined />
                }
                onClick={() =>
                  toggleAudio(sentence.id, sentence.audio, sentence.startTime, sentence.endTime)
                }
              />

              {isChecked && checkedResults[sentence.id] !== undefined && (
                <Text className="result-icon">
                  {checkedResults[sentence.id] ? '✅' : '❌'}
                </Text>
              )}

              <div className="engClass" style={{ marginTop: 10 }}>
                {blanks.sentence.map((part, idx) => {
                  const blankIndex = blanks.sentence.slice(0, idx).filter(p => p === '___').length;
                  return (
                    <Text key={idx} style={{ marginRight: 4 }}>
                      {part === '___' ? (
                        isChecked ? (
                          <span style={{ 
                            borderBottom: '2px solid #1890ff', 
                            minWidth: 60, 
                            display: 'inline-block',
                            padding: '0 8px',
                            color: checkedResults[sentence.id] ? 'green' : 'red'
                          }}>
                            {blanks.blanks[blankIndex] || '?'}
                          </span>
                        ) : (
                          <Input
                            placeholder=""
                            value={blankAnswers[sentence.id]?.[blankIndex] || ''}
                            onChange={(e) => handleBlankChange(sentence.id, blankIndex, e.target.value)}
                            style={{ 
                              width: 80, 
                              display: 'inline-block',
                              margin: '0 4px',
                              border: 'none',
                              borderBottom: '2px solid #52c41a',
                              borderRadius: 0,
                              background: 'transparent',
                              textAlign: 'center',
                              outline: 'none',
                              boxShadow: 'none'
                            }}
                            size="small"
                          />
                        )
                      ) : (
                        part
                      )}
                    </Text>
                  );
                })}
              </div>

              {isChecked && !checkedResults[sentence.id] && (
                <div style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 14, color: 'red' }}>Đáp án đúng: {blanks.blanks.join(', ')}</Text>
                </div>
              )}

              <div className="testBookEngName" style={{ textAlign: 'right', marginTop: 5 }}>
                {sentence.bookEngName}
              </div>
            </div>
          );
        })
      )}

      <div className="button-container">
        <Button
          type="primary"
          onClick={() => setOpenConfirmModal(true)}
          className="check-btn"
          disabled={isChecked}
        >
          Ket qua
        </Button>
        <Button onClick={reloadTest} className="reload-btn">
          <ReloadOutlined /> Lam lai
        </Button>
      </div>

      <Modal
        title="Xac nhan"
        open={openConfirmModal}
        onOk={handleCheckResults}
        confirmLoading={confirmLoading}
        onCancel={() => setOpenConfirmModal(false)}
        centered
      >
        <p>Ban co chac chan muon kiem tra ket qua?</p>
      </Modal>

      {isChecked && (
        <Modal
          title={
            <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>
              Ket qua
            </div>
          }
          open={openResultModal}
          onOk={() => setOpenResultModal(false)}
          onCancel={() => setOpenResultModal(false)}
          width={600}
          centered
          footer={
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={() => setOpenResultModal(false)}>
                OK
              </Button>
              <Button onClick={() => setOpenResultModal(false)} style={{ marginLeft: 10 }}>
                Huy
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: 'center', fontSize: 24 }}>
            {score === sentences.length ? (
              <CheckCircleOutlined style={{ color: 'green', fontSize: 64 }} />
            ) : (
              <CloseCircleOutlined style={{ color: 'red', fontSize: 64 }} />
            )}
          </div>
          <Text
            className="score"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: 10,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            Diem: {score} / {limit}
          </Text>
        </Modal>
      )}
    </div>
  );
};

const FillBlanksPageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <FillBlanksPage />
  </Suspense>
);

export default FillBlanksPageWrapper;
