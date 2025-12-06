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
import { Suspense, useEffect, useState } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

const shuffleArray = (array: string[]) => array.sort(() => Math.random() - 0.5);

const TestPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [sentences, setSentences] = useState<ContentType[]>();
  const [wordBank, setWordBank] = useState<Record<string, string[]>>({});
  const [selectedWords, setSelectedWords] = useState<Record<string, string[]>>(
    {}
  );
  const [checkedResults, setCheckedResults] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [playStates, setPlayStates] = useState<Record<string, boolean>>({});
  const [limit, setLimit] = useState('20');
  const [openResultModal, setOpenResultModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getTests(volumeSlug, '20');
        setSentences(response);
        const shuffledWords = response.reduce((acc, sentence) => {
          acc[sentence.id] = shuffleArray(sentence.eng.split(' '));
          return acc;
        }, {} as Record<string, string[]>);
        setWordBank(shuffledWords);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volumeSlug]);

  const handleWordClick = (sentenceId: string, word: string) => {
    if (isChecked) return;

    setSelectedWords((prev) => ({
      ...prev,
      [sentenceId]: [...(prev[sentenceId] || []), word],
    }));

    setWordBank((prev) => {
      const newWordBank = [...prev[sentenceId]];
      const indexToRemove = newWordBank.findIndex((w) => w === word);
      if (indexToRemove !== -1) newWordBank.splice(indexToRemove, 1);

      return {
        ...prev,
        [sentenceId]: newWordBank,
      };
    });
  };

  const handleSelectedWordClick = (sentenceId: string, word: string) => {
    if (isChecked) return;
    setSelectedWords((prev) => {
      const words = [...(prev[sentenceId] || [])];
      const index = words.findIndex((w) => w === word);
      if (index !== -1) words.splice(index, 1);

      return {
        ...prev,
        [sentenceId]: words,
      };
    });
    setWordBank((prev) => ({
      ...prev,
      [sentenceId]: [...prev[sentenceId], word],
    }));
  };

  const handleCheckResults = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false); // Đóng modal xác nhận trước khi hiển thị kết quả
      setConfirmLoading(false);

      const results = sentences.reduce((acc, sentence) => {
        const userSentence = (selectedWords[sentence.id] || [])
          .join(' ')
          .trim();
        acc[sentence.id] = userSentence === sentence.eng.trim();
        return acc;
      }, {} as Record<string, boolean>);

      setCheckedResults(results);
      setIsChecked(true);
      setScore(
        Math.round(
          (Object.values(results).filter(Boolean).length / sentences.length) *
            sentences.length
        )
      );

      setOpenResultModal(true); // Mở modal kết quả
    }, 100);
  };

  const reloadTest = async () => {
    setLoading(true);
    setSentences([]);
    setWordBank({});
    setSelectedWords({});
    setCheckedResults({});
    setIsChecked(false);
    setScore(0);

    try {
      const response = await getTests(volumeSlug, limit);
      setSentences(response);
      const shuffledWords = response.reduce((acc, sentence) => {
        acc[sentence.id] = shuffleArray(sentence.eng.split(' '));
        return acc;
      }, {} as Record<string, string[]>);
      setWordBank(shuffledWords);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = (
    itemId: string,
    audioPath: string,
    startTime: string,
    endTime: string
  ) => {
    if (!audioPath || !startTime || !endTime) {
      message.error('Không có tệp âm thanh hoặc thời gian không hợp lệ.');
      return;
    }

    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);

    if (start >= end) {
      message.error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
      return;
    }

    if (currentPlayingId === itemId) {
      // Nếu đang phát, tạm dừng
      stopAudio();
    } else {
      // Nếu không, phát âm thanh mới
      stopAudio();

      const audioURL = `/media/${audioPath}`;
      const audio = new Audio(audioURL);

      audio.currentTime = start;

      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime >= end) {
          audio.currentTime = start;
          audio.pause();
          stopAudio();
        }
      });

      audio.addEventListener('ended', () => stopAudio());

      setCurrentAudio(audio);
      setCurrentPlayingId(itemId);

      setPlayStates((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = key === itemId;
          return acc;
        }, {} as Record<string, boolean>)
      );

      audio.play().catch(() => {
        message.error('Không thể phát âm thanh.');
      });
    }
  };
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentPlayingId(null);
      setPlayStates((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  };
  const parseTimeToSeconds = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  return (
    <div
      className="test-container"
      style={{ marginTop: '50px', marginBottom: '70px' }}
    >
      <Typography.Title level={3} className="test-title">
        Bài kiểm tra - {volumeSlug}
      </Typography.Title>
      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lại
        </Button>
      </div>
      {loading ? (
        <Spin size="large" />
      ) : (
        sentences.map((sentence) => (
          <div key={sentence.id} className="sentence-container">
            <Text className="viClass">{sentence.vi}</Text>
            <Button
              type="link"
              icon={
                currentPlayingId === sentence.id ? (
                  <PauseOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              onClick={() =>
                toggleAudio(
                  sentence.id,
                  sentence.audio,
                  sentence.startTime,
                  sentence.endTime
                )
              }
            />
            {isChecked && (
              <Text className="correct-answer">
                Đáp án đúng: {sentence.eng}
              </Text>
            )}
            <div className="engClass">
              {wordBank[sentence.id]?.map((word, index) => (
                <Text
                  key={index}
                  className="word"
                  onClick={() => handleWordClick(sentence.id, word)}
                >
                  {word}
                </Text>
              ))}
            </div>
            <div className="selected-container">
              <div className="selectedWords">
                {selectedWords[sentence.id]?.map((word, index) => (
                  <Text
                    key={index}
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
            <div
              className="testBookEngName"
              style={{ textAlign: 'right', marginTop: '5px' }}
            >
              {sentence.bookEngName}
            </div>
          </div>
        ))
      )}
      <div className="button-container">
        <Button
          type="primary"
          onClick={() => setOpen(true)}
          className="check-btn"
          disabled={isChecked}
        >
          Kết quả
        </Button>
        <Button onClick={reloadTest} className="reload-btn">
          <ReloadOutlined /> Làm lại
        </Button>
      </div>
      <Modal
        title="Xác nhận"
        open={open}
        onOk={handleCheckResults}
        confirmLoading={confirmLoading}
        onCancel={() => setOpen(false)}
        centered // Căn giữa modal
      >
        <p>Bạn có chắc chắn muốn kiểm tra kết quả?</p>
      </Modal>
      {isChecked && (
        <Modal
          title={
            <div
              style={{
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
              }}
            >
              Kết quả
            </div>
          }
          open={openResultModal}
          onOk={() => setOpenResultModal(false)}
          onCancel={() => setOpenResultModal(false)}
          width={600} // Làm modal rộng hơn
          centered // Căn giữa modal
          footer={
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={() => setOpenResultModal(false)}>
                OK
              </Button>
              <Button
                onClick={() => setOpenResultModal(false)}
                style={{ marginLeft: '10px' }}
              >
                Hủy
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: 'center', fontSize: '24px' }}>
            {score === sentences.length ? (
              <CheckCircleOutlined
                style={{ color: 'green', fontSize: '64px' }}
              />
            ) : (
              <CloseCircleOutlined style={{ color: 'red', fontSize: '64px' }} />
            )}
          </div>
          <Text
            className="score"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '10px',
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            Điểm: {score} / {limit}
          </Text>
        </Modal>
      )}
    </div>
  );
};

const SuspenseBoundary = () => (
  <Suspense fallback={<Spin size="large" />}>
    <TestPage />
  </Suspense>
);

export default SuspenseBoundary;
