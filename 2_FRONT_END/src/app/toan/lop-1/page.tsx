'use client';
import { MathCategoryType, MathQuestionType } from '@/interfaces/math';
import { getMathCategories, getMathQuestionsByCategoryCode } from '@/utils/apiService';
import { Layout, Menu, Spin, message, Button, Modal, Typography } from 'antd';
import { FolderOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import MathQuizComponent from '@/components/math/MathQuizComponent';
import '../../../styles/global.css';

const { Sider, Content } = Layout;
const { Title } = Typography;

const MathPage = () => {
  const [categories, setCategories] = useState<MathCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [questions, setQuestions] = useState<MathQuestionType[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // Fetch math categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getMathCategories();
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách math categories:', error);
        message.error('Không thể tải danh sách danh mục');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch questions when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const fetchQuestions = async () => {
        setLoadingQuestions(true);
        setUserAnswers({});
        setIsChecked(false);
        try {
          const data = await getMathQuestionsByCategoryCode(selectedCategory);
          setQuestions(data);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách câu hỏi:', error);
          message.error('Không thể tải câu hỏi');
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestions();
    }
  }, [selectedCategory]);

  // Build menu items from categories
  const buildMenuItems = (categories: MathCategoryType[]): any[] => {
    return categories.map(category => {
      const hasChildren = category.children && category.children.length > 0;
      return {
        key: category.categoryCode,
        label: category.categoryName,
        icon: hasChildren ? <FolderOutlined /> : <FileTextOutlined />,
        children: hasChildren ? buildMenuItems(category.children) : undefined,
      };
    });
  };

  const handleMenuSelect = ({ key, item }: { key: string; item: any }) => {
    setSelectedCategory(key);
    setSelectedCategoryName(item.label);
  };

  const handleAnswerChange = (questionCode: string, answerCode: string) => {
    if (isChecked) return;
    setUserAnswers(prev => ({ ...prev, [questionCode]: answerCode }));
  };

  const handleSubmitQuiz = () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      message.warning('Bạn chưa trả lời câu hỏi nào');
      return;
    }
    setOpenConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setIsChecked(true);
    setOpenConfirmModal(false);
    message.success('Đã nộp bài!');
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      const userAnswer = userAnswers[question.questionCode];
      const correctAnswer = question.answers.find(a => a.isCorrect === 'Y');
      if (userAnswer === correctAnswer?.answerCode) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      score: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const score = calculateScore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '16px' }}>
          Toán Lớp 1
        </div>
        <Menu
          mode="inline"
          style={{ height: '100%', borderRight: 0 }}
          items={buildMenuItems(categories)}
          onSelect={handleMenuSelect}
        />
      </Sider>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        {selectedCategory ? (
          loadingQuestions ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {selectedCategoryName}
                </Title>
                {isChecked && (
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    Điểm: {score.score}/100 ({score.correct}/{score.total} câu đúng)
                  </div>
                )}
              </div>

              {questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Không có câu hỏi nào
                </div>
              ) : (
                <>
                  <MathQuizComponent
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    isChecked={isChecked}
                  />

                  {!isChecked && (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(userAnswers).length === 0}
                      >
                        Nộp bài ({Object.keys(userAnswers).length}/{questions.length})
                      </Button>
                    </div>
                  )}

                  {isChecked && (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <Button
                        size="large"
                        onClick={() => {
                          setIsChecked(false);
                          setUserAnswers({});
                        }}
                      >
                        Làm lại
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            Vui lòng chọn danh mục từ menu bên trái
          </div>
        )}
      </Content>

      <Modal
        title="Xác nhận nộp bài"
        open={openConfirmModal}
        onOk={handleConfirmSubmit}
        onCancel={() => setOpenConfirmModal(false)}
        okText="Nộp bài"
        cancelText="Hủy"
      >
        <p>Bạn đã trả lời {Object.keys(userAnswers).length}/{questions.length} câu hỏi.</p>
        <p>Bạn có chắc chắn muốn nộp bài không?</p>
      </Modal>
    </Layout>
  );
};

export default MathPage;
