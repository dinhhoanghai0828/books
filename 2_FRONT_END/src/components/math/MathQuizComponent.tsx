import { MathQuestionType } from '@/interfaces/math';
import { Radio, Button, Space, Card, Typography, Tag } from 'antd';

const { Text } = Typography;

// Hàm chuyển đổi độ khó sang text
const getDifficultyText = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'Dễ';
    case 2: return 'Bình thường';
    case 3: return 'Khó';
    case 4: return 'Rất khó';
    default: return difficulty.toString();
  }
};

const getDifficultyColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'green';
    case 2: return 'blue';
    case 3: return 'orange';
    case 4: return 'red';
    default: return 'default';
  }
};

interface MathQuizComponentProps {
  questions: MathQuestionType[];
  userAnswers: Record<string, string>;
  onAnswerChange: (questionCode: string, answerCode: string) => void;
  isChecked: boolean;
}

const MathQuizComponent = ({ questions, userAnswers, onAnswerChange, isChecked }: MathQuizComponentProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {questions.map((question, index) => {
        const userAnswer = userAnswers[question.questionCode];
        const correctAnswer = question.answers.find(a => a.isCorrect === 'Y');
        const isCorrect = userAnswer === correctAnswer?.answerCode;
        const isUnanswered = !userAnswer;

        return (
          <Card
            key={question.questionCode}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: isChecked && isCorrect ? '2px solid #52c41a' : isChecked && !isUnanswered && !isCorrect ? '2px solid #ff4d4f' : undefined,
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Space size="middle">
                <Text strong style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Câu {index + 1}
                </Text>
                <Tag color={getDifficultyColor(question.difficulty)}>{getDifficultyText(question.difficulty)}</Tag>
              </Space>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
              {question.questionText}
            </div>

            <Radio.Group
              value={userAnswer}
              onChange={(e) => onAnswerChange(question.questionCode, e.target.value)}
              disabled={isChecked}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {question.answers.map((answer) => {
                  const isThisCorrect = answer.isCorrect === 'Y';
                  const isSelected = userAnswer === answer.answerCode;

                  return (
                    <Radio
                      key={answer.answerCode}
                      value={answer.answerCode}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        background: isChecked && isThisCorrect ? '#d9f7be' : isChecked && isSelected && !isThisCorrect ? '#ffccc7' : undefined,
                        borderColor: isChecked && isThisCorrect ? '#52c41a' : isChecked && isSelected && !isThisCorrect ? '#ff4d4f' : undefined,
                      }}
                    >
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{answer.answerCode}.</span>
                      <span>{answer.answerText}</span>
                    </Radio>
                  );
                })}
              </Space>
            </Radio.Group>

            {isChecked && !isUnanswered && !isCorrect && correctAnswer && (
              <div style={{ marginTop: '12px', color: '#ff4d4f' }}>
                Đáp án đúng: <strong>{correctAnswer.answerCode}. {correctAnswer.answerText}</strong>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default MathQuizComponent;
