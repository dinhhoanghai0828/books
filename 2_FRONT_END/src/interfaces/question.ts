// ============================================================
// QUESTION INTERFACE
// ============================================================

export interface QuestionType {
  id: string;
  questionCode: string;
  volumeSlug: string;
  questionText: string;           // Nội dung câu hỏi tiếng Anh
  questionTextVi?: string;        // Nội dung câu hỏi tiếng Việt
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  answers: AnswerType[];
}

// ============================================================
// ANSWER INTERFACE
// ============================================================

export interface AnswerType {
  id: string;
  questionCode: string;
  optionCode: string;             // Mã cũ (A, B, C, D) — giữ tương thích
  optionText: string;             // Nội dung cũ — giữ tương thích
  answerCode?: string;            // Mã mới (A, B, C, D)
  answerText?: string;            // Nội dung đáp án tiếng Anh mới
  answerTextVi?: string;          // Nội dung đáp án tiếng Việt
  isCorrect: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================
// QUIZ RESULT INTERFACES
// ============================================================

export interface QuizResultType {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  questionResults: QuestionResultType[];
}

export interface QuestionResultType {
  questionNumber: number;
  questionText: string;
  userAnswer?: string;
  correctAnswer?: string;
  correctAnswerText?: string;
  isCorrect: boolean;
  isUnanswered: boolean;
}
