'use client';
import { MathCategoryType, MathQuestionType } from '@/interfaces/math';
import { getMathCategories, getMathQuestionsByCategoryCode } from '@/utils/apiService';
import { Layout, Menu, Spin, message, Button, Modal, Typography, Select, Space } from 'antd';
import { FolderOutlined, FileTextOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MathQuizComponent from '@/components/math/MathQuizComponent';
import '../../../styles/global.css';

const { Sider, Content } = Layout;
const { Title } = Typography;

// Utility function to shuffle array
const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const MathGradePage = () => {
  const params = useParams();
  const grade = params.grade as string;

  const [categories, setCategories] = useState<MathCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [questions, setQuestions] = useState<MathQuestionType[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // Bộ lọc
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null); // null = tất cả
  const [questionLimit, setQuestionLimit] = useState<number>(10); // 0 = tất cả
  const [questionOrder, setQuestionOrder] = useState<'random' | 'default'>('default');

  // Get display name from grade
  const getGradeDisplayName = (grade: string) => {
    if (grade === 'lop-1') return 'Toán Lớp 1';
    if (grade === 'lop-2') return 'Toán Lớp 2';
    if (grade === 'lop-3') return 'Toán Lớp 3';
    if (grade === 'lop-4') return 'Toán Lớp 4';
    if (grade === 'lop-5') return 'Toán Lớp 5';
    return `Bài tập Toán - ${grade}`;
  };

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

          // Filter by difficulty
          let filteredQuestions = data;
          if (difficultyFilter !== null) {
            filteredQuestions = data.filter(q => q.difficulty === difficultyFilter);
          }

          // Apply order
          const orderedQuestions = questionOrder === 'random'
            ? shuffleArray(filteredQuestions)
            : [...filteredQuestions];

          // Apply limit
          const finalQuestions = questionLimit > 0
            ? orderedQuestions.slice(0, questionLimit)
            : orderedQuestions;

          setQuestions(finalQuestions);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách câu hỏi:', error);
          message.error('Không thể tải câu hỏi');
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestions();
    }
  }, [selectedCategory, difficultyFilter, questionLimit, questionOrder]);

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

  const handleReloadQuestions = async () => {
    if (!selectedCategory) return;
    
    setLoadingQuestions(true);
    setUserAnswers({});
    setIsChecked(false);
    
    try {
      const data = await getMathQuestionsByCategoryCode(selectedCategory);

      // Filter by difficulty
      let filteredQuestions = data;
      if (difficultyFilter !== null) {
        filteredQuestions = data.filter(q => q.difficulty === difficultyFilter);
      }

      // Apply order (reshuffle if random)
      const orderedQuestions = questionOrder === 'random'
        ? shuffleArray(filteredQuestions)
        : [...filteredQuestions];

      // Apply limit
      const finalQuestions = questionLimit > 0
        ? orderedQuestions.slice(0, questionLimit)
        : orderedQuestions;

      setQuestions(finalQuestions);
      message.success('Đã tải lại câu hỏi!');
    } catch (error) {
      console.error('Lỗi khi tải lại câu hỏi:', error);
      message.error('Không thể tải lại câu hỏi');
    } finally {
      setLoadingQuestions(false);
    }
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
    <Layout style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', height: 'calc(100vh - 64px)', position: 'fixed', left: 0, top: '64px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '16px' }}>
          {getGradeDisplayName(grade)}
        </div>
        <Menu
          mode="inline"
          style={{ height: 'calc(100% - 48px)', borderRight: 0 }}
          items={buildMenuItems(categories)}
          onSelect={handleMenuSelect}
        />
      </Sider>
      <Content style={{ padding: '24px', background: '#f5f5f5', marginLeft: '250px' }}>
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

              {!isChecked && (
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Space size="middle" wrap>
                    <div>
                      <span style={{ marginRight: '8px', fontWeight: 'bold' }}>Độ khó:</span>
                      <Select
                        value={difficultyFilter}
                        onChange={setDifficultyFilter}
                        style={{ width: 150 }}
                        placeholder="Tất cả"
                      >
                        <Select.Option value={null}>Tất cả</Select.Option>
                        <Select.Option value={1}>Dễ</Select.Option>
                        <Select.Option value={2}>Bình thường</Select.Option>
                        <Select.Option value={3}>Khó</Select.Option>
                        <Select.Option value={4}>Rất khó</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <span style={{ marginRight: '8px', fontWeight: 'bold' }}>Số câu:</span>
                      <Select
                        value={questionLimit}
                        onChange={setQuestionLimit}
                        style={{ width: 120 }}
                      >
                        <Select.Option value={0}>Tất cả</Select.Option>
                        <Select.Option value={5}>5 câu</Select.Option>
                        <Select.Option value={10}>10 câu</Select.Option>
                        <Select.Option value={20}>20 câu</Select.Option>
                        <Select.Option value={30}>30 câu</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <span style={{ marginRight: '8px', fontWeight: 'bold' }}>Thứ tự:</span>
                      <Select
                        value={questionOrder}
                        onChange={(value: 'random' | 'default') => setQuestionOrder(value)}
                        style={{ width: 150 }}
                      >
                        <Select.Option value="default">Mặc định</Select.Option>
                        <Select.Option value="random">Ngẫu nhiên</Select.Option>
                      </Select>
                    </div>
                    {questionOrder === 'random' && (
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReloadQuestions}
                        loading={loadingQuestions}
                      >
                        Tải lại
                      </Button>
                    )}
                  </Space>
                </div>
              )}

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

export default MathGradePage;
