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
import { Button, Modal, Spin, Typography, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

// So cau hoi mac dinh moi lan kiem tra
const DEFAULT_LIMIT = '20';

// Xao tron mang tu (tao ngan hang tu cho moi cau)
const shuffleArray = (arr: string[]): string[] => [...arr].sort(() => Math.random() - 0.5);

// ============================================================
// COMPONENT
// ============================================================

const TestPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [sentences, setSentences] = useState<ContentType[]>([]);
  const [wordBank, setWordBank] = useState<Record<string, string[]>>({});
  const [selectedWords, setSelectedWords] = useState<Record<string, string[]>>({});
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

  // Lay danh sach cau hoi va khoi tao ngan hang tu xao tron cho moi cau
  const fetchData = async (limitValue: string) => {
    setLoading(true);
    try {
      const response = await getTests(volumeSlug, limitValue);
      setSentences(response);
      const shuffled = response.reduce((acc, sentence) => {
        acc[sentence.id] = shuffleArray(sentence.eng.split(' '));
        return acc;
      }, {} as Record<string, string[]>);
      setWordBank(shuffled);
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
  // WORD SELECTION
  // ============================================================

  // Nguoi dung click tu trong ngan hang -> chuyen tu vao vung da chon
  const handleWordClick = (sentenceId: string, word: string) => {
    if (isChecked) return;

    setSelectedWords((prev) => ({
      ...prev,
      [sentenceId]: [...(prev[sentenceId] || []), word],
    }));

    setWordBank((prev) => {
      const updated = [...prev[sentenceId]];
      const idx = updated.findIndex((w) => w === word);
      if (idx !== -1) updated.splice(idx, 1);
      return { ...prev, [sentenceId]: updated };
    });
  };

  // Nguoi dung click tu da chon -> tra lai tu ve ngan hang
  const handleSelectedWordClick = (sentenceId: string, word: string) => {
    if (isChecked) return;

    setSelectedWords((prev) => {
      const updated = [...(prev[sentenceId] || [])];
      const idx = updated.findIndex((w) => w === word);
      if (idx !== -1) updated.splice(idx, 1);
      return { ...prev, [sentenceId]: updated };
    });

    setWordBank((prev) => ({
      ...prev,
      [sentenceId]: [...prev[sentenceId], word],
    }));
  };

  // ============================================================
  // CHECK RESULTS
  // ============================================================

  // So sanh cau nguoi dung sap xep voi cau goc, tinh diem va hien modal ket qua
  const handleCheckResults = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpenConfirmModal(false);
      setConfirmLoading(false);

      const results = sentences.reduce((acc, sentence) => {
        const userAnswer = (selectedWords[sentence.id] || []).join(' ').trim();
        acc[sentence.id] = userAnswer === sentence.eng.trim();
        return acc;
      }, {} as Record<string, boolean>);

      setCheckedResults(results);
      setIsChecked(true);
      setScore(Object.values(results).filter(Boolean).length);
      setOpenResultModal(true);
    }, 100);
  };

  // Reset toan bo trang thai va lay bo cau hoi moi
  const reloadTest = async () => {
    stopAudio();
    setLoading(true);
    setSentences([]);
    setWordBank({});
    setSelectedWords({});
    setCheckedResults({});
    setIsChecked(false);
    setScore(0);
    await fetchData(limit);
  };

  // ============================================================
  // AUDIO
  // ============================================================

  // Chuyen chuoi "hh:mm:ss" thanh so giay
  const parseTimeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Dung audio dang phat va reset trang thai
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  // Bat/dung audio cua 1 cau: neu dang phat thi dung, neu chua thi phat moi
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

    // Tu dong dung khi den endTime
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
        Bai kiem tra - {volumeSlug}
      </Typography.Title>

      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lai
        </Button>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        sentences.map((sentence) => (
          <div key={sentence.id} className="sentence-container">
            <Text className="viClass">{sentence.vi}</Text>

            {/* Nut phat audio cho cau hien tai */}
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

            {/* Hien dap an dung sau khi da kiem tra */}
            {isChecked && (
              <Text className="correct-answer">Dap an dung: {sentence.eng}</Text>
            )}

            {/* Ngan hang tu (chua chon) */}
            <div className="engClass">
              {wordBank[sentence.id]?.map((word, idx) => (
                <Text
                  key={idx}
                  className="word"
                  onClick={() => handleWordClick(sentence.id, word)}
                >
                  {word}
                </Text>
              ))}
            </div>

            {/* Vung tu da chon + icon ket qua */}
            <div className="selected-container">
              <div className="selectedWords">
                {selectedWords[sentence.id]?.map((word, idx) => (
                  <Text
                    key={idx}
                    className="word selected-word"
                    onClick={() => handleSelectedWordClick(sentence.id, word)}
                  >
                    {word}
                  </Text>
                ))}
              </div>
              {isChecked && checkedResults[sentence.id] !== undefined && (
                <Text className="result-icon">
                  {checkedResults[sentence.id] ? '✅' : '❌'}
                </Text>
              )}
            </div>

            <div className="testBookEngName" style={{ textAlign: 'right', marginTop: 5 }}>
              {sentence.bookEngName}
            </div>
          </div>
        ))
      )}

      {/* Nut kiem tra ket qua va lam lai */}
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

      {/* Modal xac nhan truoc khi kiem tra */}
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

      {/* Modal hien thi diem sau khi kiem tra */}
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

// Boc trong Suspense de dung useSearchParams an toan voi Next.js App Router
const TestPageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <TestPage />
  </Suspense>
);

export default TestPageWrapper;
