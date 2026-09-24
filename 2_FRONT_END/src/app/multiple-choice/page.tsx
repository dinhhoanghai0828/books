'use client';
import { QuestionType, QuizResultType } from '@/interfaces/question';
import { getQuestionsWithAnswersByVolumeSlug, submitQuiz } from '@/utils/apiService';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Radio, Spin, Typography, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import '../../styles/global.css';

const { Text } = Typography;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Xao tron mang (de random cau hoi va cau tra loi)
const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ============================================================
// COMPONENT
// ============================================================

const MultipleChoicePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volumeSlug = searchParams?.get('volumeSlug') || '';

  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultType | null>(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);

  // Quan ly audio bang ref de tranh stale closure
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getQuestionsWithAnswersByVolumeSlug(volumeSlug);
      // Randomize cau hoi
      const shuffledQuestions = shuffleArray(response);
      // Randomize cau tra loi cho moi cau hoi
      const questionsWithShuffledAnswers = shuffledQuestions.map(question => ({
        ...question,
        answers: shuffleArray(question.answers)
      }));
      setQuestions(questionsWithShuffledAnswers);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu câu hỏi:', error);
      message.error('Không thể tải dữ liệu câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [volumeSlug]);

  // ============================================================
  // ANSWER SELECTION
  // ============================================================

  const handleAnswerChange = (questionCode: string, optionCode: string) => {
    if (isChecked) return;

    setUserAnswers((prev) => ({
      ...prev,
      [questionCode]: optionCode,
    }));
  };

  // ============================================================
  // TEXT-TO-SPEECH
  // ============================================================

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentPlayingId(null);
  };

  const speakText = (text: string, itemId: string) => {
    if (!window.speechSynthesis) {
      message.error('Trình duyệt không hỗ trợ text-to-speech');
      return;
    }

    if (currentPlayingId === itemId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => {
      setCurrentPlayingId(null);
    };

    utterance.onerror = () => {
      setCurrentPlayingId(null);
    };

    currentAudioRef.current = null;
    setCurrentPlayingId(itemId);
    window.speechSynthesis.speak(utterance);
  };

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================

  const handleSubmitQuiz = async () => {
    setConfirmLoading(true);
    try {
      const unansweredQuestions = questions.filter(
        q => !userAnswers[q.questionCode]
      );

      if (unansweredQuestions.length > 0) {
        const unansweredNumbers = unansweredQuestions.map((q) => 
          questions.indexOf(q) + 1
        ).join(', ');
        
        // Cap nhat content cua modal hien tai
        setOpenConfirmModal(false);
        setConfirmLoading(false);
        
        Modal.confirm({
          title: 'Cảnh báo',
          content: `Bạn chưa chọn đáp án cho câu hỏi số: ${unansweredNumbers}. Bạn có chắc chắn muốn nộp bài không?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          onOk: async () => {
            await performSubmit();
          },
          onCancel: () => {
            // Mở lại modal xác nhận ban đầu
            setOpenConfirmModal(true);
          },
        });
        return;
      }

      // Neu khong co cau chua lam, nop bai truc tiep
      await performSubmit();
    } catch (error) {
      setConfirmLoading(false);
      message.error('Có lỗi xảy ra khi nộp bài');
    }
  };

  const performSubmit = async () => {
    try {
      console.log('Đang nộp bài với userAnswers:', userAnswers);
      console.log('Questions:', questions);
      
      const result = await submitQuiz(userAnswers, questions);
      console.log('Kết quả từ server:', result);
      
      setQuizResult(result);
      setIsChecked(true);
      setOpenConfirmModal(false);
      setConfirmLoading(false);
      
      // Mở modal kết quả ngay lập tức
      console.log('Đang mở modal kết quả...');
      setOpenResultModal(true);
    } catch (error) {
      console.error('Lỗi khi nộp bài:', error);
      setConfirmLoading(false);
      message.error('Có lỗi xảy ra khi tính điểm');
    }
  };

  // Reset toan bo trang thai va lay bo cau hoi moi
  const reloadQuiz = async () => {
    stopSpeaking();
    setLoading(true);
    setQuestions([]);
    setUserAnswers({});
    setIsChecked(false);
    setQuizResult(null);
    await fetchData();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="test-container" style={{ marginTop: 50, marginBottom: 70 }}>
      <Typography.Title level={3} className="test-title">
        Lựa chọn đáp án đúng
      </Typography.Title>

      <div className="back-button-container">
        <Button onClick={() => router.back()} className="back-btn">
          ⬅ Quay lại
        </Button>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        questions.map((question, index) => (
          <div key={question.questionCode} className="sentence-container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <Text strong style={{ marginRight: 10 }}>
                Câu {index + 1}:
              </Text>
              <Text className="viClass">{question.questionText}</Text>

              {/* Nut phat audio cho cau hoi */}
              <Button
                type="link"
                icon={
                  currentPlayingId === `question-${question.questionCode}`
                    ? <PauseOutlined />
                    : <PlayCircleOutlined />
                }
                onClick={() => speakText(question.questionText, `question-${question.questionCode}`)}
                style={{ marginLeft: 10 }}
              />
            </div>

            {/* Danh sach cau tra loi */}
            <div className="engClass" style={{ marginLeft: 20 }}>
              <Radio.Group
                value={userAnswers[question.questionCode]}
                onChange={(e) => handleAnswerChange(question.questionCode, e.target.value)}
                disabled={isChecked}
              >
                {question.answers.map((answer) => (
                  <div key={answer.optionCode} style={{ marginBottom: 8 }}>
                    <Radio value={answer.optionCode}>
                      <span style={{ marginRight: 8 }}>{answer.optionCode}.</span>
                      <span>{answer.optionText}</span>
                      
                      {/* Nut phat audio cho cau tra loi */}
                      <Button
                        type="link"
                        icon={
                          currentPlayingId === `answer-${question.questionCode}-${answer.optionCode}`
                            ? <PauseOutlined />
                            : <PlayCircleOutlined />
                        }
                        onClick={() => speakText(answer.optionText, `answer-${question.questionCode}-${answer.optionCode}`)}
                        style={{ marginLeft: 10 }}
                        size="small"
                      />
                    </Radio>
                  </div>
                ))}
              </Radio.Group>
            </div>

            {/* Hien ket qua sau khi da kiem tra */}
            {isChecked && quizResult && (
              <div style={{ marginLeft: 20, marginTop: 10 }}>
                {quizResult.questionResults[index]?.isUnanswered ? (
                  <Text type="warning">Bạn chưa chọn đáp án</Text>
                ) : quizResult.questionResults[index]?.isCorrect ? (
                  <Text type="success" style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlined style={{ marginRight: 5 }} /> Đúng!
                  </Text>
                ) : (
                  <Text type="danger" style={{ display: 'flex', alignItems: 'center' }}>
                    <CloseCircleOutlined style={{ marginRight: 5 }} /> Sai! 
                    Đáp án đúng: {quizResult.questionResults[index]?.correctAnswer} - {quizResult.questionResults[index]?.correctAnswerText}
                  </Text>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Nut nop bai va lam lai */}
      <div className="button-container">
        <Button
          type="primary"
          onClick={() => setOpenConfirmModal(true)}
          className="check-btn"
          disabled={isChecked}
        >
          Nộp bài
        </Button>
        <Button onClick={reloadQuiz} className="reload-btn">
          <ReloadOutlined /> Làm lại
        </Button>
      </div>

      {/* Modal xac nhan truoc khi nop bai */}
      <Modal
        title="Xác nhận"
        open={openConfirmModal}
        onOk={handleSubmitQuiz}
        confirmLoading={confirmLoading}
        onCancel={() => setOpenConfirmModal(false)}
        centered
        okText="Đồng ý"
        cancelText="Hủy"
      >
        {(() => {
          const unansweredQuestions = questions.filter(
            q => !userAnswers[q.questionCode]
          );
          
          if (unansweredQuestions.length > 0) {
            const unansweredNumbers = unansweredQuestions.map((q) => 
              questions.indexOf(q) + 1
            ).join(', ');
            return (
              <div>
                <p>Bạn chưa chọn đáp án cho câu hỏi số: <strong>{unansweredNumbers}</strong></p>
                <p>Bạn có chắc chắn muốn nộp bài không?</p>
              </div>
            );
          }
          
          return <p>Bạn có chắc chắn muốn nộp bài không?</p>;
        })()}
      </Modal>

      {/* Modal hien thi ket qua sau khi nop bai */}
      <Modal
        title={
          <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>
            Kết quả
          </div>
        }
        open={openResultModal && isChecked && quizResult !== null}
        onOk={() => setOpenResultModal(false)}
        onCancel={() => setOpenResultModal(false)}
        width={700}
        centered
        footer={
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={() => setOpenResultModal(false)}>
              OK
            </Button>
            <Button onClick={() => setOpenResultModal(false)} style={{ marginLeft: 10 }}>
              Đóng
            </Button>
          </div>
        }
      >
        {quizResult ? (
          <>
            <div style={{ textAlign: 'center', fontSize: 24 }}>
              {quizResult.correctAnswers === quizResult.totalQuestions ? (
                <CheckCircleOutlined style={{ color: 'green', fontSize: 64 }} />
              ) : (
                <CloseCircleOutlined style={{ color: 'red', fontSize: 64 }} />
              )}
            </div>
            
            <div style={{ marginTop: 20, fontSize: 18 }}>
              <Text style={{ display: 'block', marginBottom: 10 }}>
                <strong>Tổng số câu:</strong> {quizResult.totalQuestions}
              </Text>
              <Text style={{ display: 'block', marginBottom: 10, color: 'green' }}>
                <strong>Đúng:</strong> {quizResult.correctAnswers}
              </Text>
              <Text style={{ display: 'block', marginBottom: 10, color: 'red' }}>
                <strong>Sai:</strong> {quizResult.incorrectAnswers}
              </Text>
              <Text style={{ display: 'block', marginBottom: 10, color: 'orange' }}>
                <strong>Chưa làm:</strong> {quizResult.unansweredQuestions}
              </Text>
              <Text
                style={{
                  display: 'block',
                  marginTop: 10,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                Điểm: {quizResult.correctAnswers} / {quizResult.totalQuestions}
              </Text>
            </div>

            {/* Chi tiet ket qua moi cau */}
            <div style={{ marginTop: 20, maxHeight: 300, overflowY: 'auto' }}>
              <Typography.Title level={5}>Chi tiết kết quả:</Typography.Title>
              {quizResult.questionResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: result.isCorrect ? '#f6ffed' : result.isUnanswered ? '#fffbe6' : '#fff1f0'
                  }}
                >
                  <Text strong>Câu {result.questionNumber}:</Text>
                  <div style={{ marginLeft: 10 }}>
                    <Text>{result.questionText}</Text>
                    {result.isUnanswered ? (
                      <div style={{ color: 'orange', marginTop: 5 }}>
                        Chưa chọn đáp án
                      </div>
                    ) : (
                      <div style={{ marginTop: 5 }}>
                        <Text>Bạn chọn: {result.userAnswer}</Text>
                        {!result.isCorrect && (
                          <div style={{ color: 'red' }}>
                            Đáp án đúng: {result.correctAnswer} - {result.correctAnswerText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
            <p>Đang tính kết quả...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Boc trong Suspense de dung useSearchParams an toan voi Next.js App Router
const MultipleChoicePageWrapper = () => (
  <Suspense fallback={<Spin size="large" />}>
    <MultipleChoicePage />
  </Suspense>
);

export default MultipleChoicePageWrapper;
