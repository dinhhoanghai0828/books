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
const { TextArea } = Input;
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

// So cau hoi mac dinh moi lan kiem tra
const DEFAULT_LIMIT = '20';

// ============================================================
// COMPONENT
// ============================================================

const TranslationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [sentences, setSentences] = useState<ContentType[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
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

  const fetchData = async (limitValue: string) => {
    setLoading(true);
    try {
      const response = await getTests(volumeSlug, limitValue);
      setSentences(response);
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

  const handleAnswerChange = (sentenceId: string, value: string) => {
    if (isChecked) return;
    setUserAnswers((prev) => ({
      ...prev,
      [sentenceId]: value,
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
        const userAnswer = (userAnswers[sentence.id] || '').trim().toLowerCase();
        const correctAnswer = sentence.eng.trim().toLowerCase();
        acc[sentence.id] = userAnswer === correctAnswer;
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
    setUserAnswers({});
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
        Dịch thuật (Tiếng Việt sang Tiếng Anh)
      </Typography.Title>

      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lại
        </Button>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : sentences.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <Text style={{ fontSize: 18, color: '#999' }}>Không có bài kiểm tra</Text>
        </div>
      ) : (
        sentences.map((sentence) => (
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
              <TextArea
                placeholder="Dịch câu tiếng Việt sang tiếng Anh..."
                value={userAnswers[sentence.id] || ''}
                onChange={(e) => handleAnswerChange(sentence.id, e.target.value)}
                disabled={isChecked}
                style={{ marginBottom: 10 }}
                rows={2}
              />
            </div>

            {isChecked && !checkedResults[sentence.id] && (
              <div style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 14, color: 'red' }}>Đáp án đúng: {sentence.eng}</Text>
              </div>
            )}

            <div className="testBookEngName" style={{ textAlign: 'right', marginTop: 5 }}>
              {sentence.bookEngName}
            </div>
          </div>
        ))
      )}

      {/* Nut kiem tra ket qua va lam lai - chi hien khi co du lieu */}
      {sentences.length > 0 && (
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
      )}

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

const TranslationPageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <TranslationPage />
  </Suspense>
);

export default TranslationPageWrapper;
