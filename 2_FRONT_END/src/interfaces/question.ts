// ============================================================
// QUESTION INTERFACE
// Interface cho doi tuong Cau hoi (Question)
// ============================================================

export interface QuestionType {
  id: string;                  // ID duoi database
  questionCode: string;        // Ma duy nhat cua cau hoi
  volumeSlug: string;          // Slug cua volume lien quan
  questionText: string;        // Noi dung cau hoi
  status: string;              // Trang thai (ACTIVE/INACTIVE)
  createdAt?: string;          // Ngay tao
  updatedAt?: string;          // Ngay cap nhat
  createdBy?: string;          // Nguoi tao
  updatedBy?: string;          // Nguoi cap nhat
  answers: AnswerType[];       // Danh sach cac cau tra loi
}

// ============================================================
// ANSWER INTERFACE
// Interface cho doi tuong Cau tra loi (Answer)
// ============================================================

export interface AnswerType {
  id: string;                  // ID duoi database
  questionCode: string;        // Ma cau hoi lien quan
  optionCode: string;          // Ma phuong an (A, B, C, D)
  optionText: string;          // Noi dung phuong an
  isCorrect: string;           // Dap an dung (Y/N)
  displayOrder: number;        // Thu tu hien thi
  createdAt?: string;          // Ngay tao
  updatedAt?: string;          // Ngay cap nhat
  createdBy?: string;          // Nguoi tao
  updatedBy?: string;          // Nguoi cap nhat
}

// ============================================================
// QUIZ RESULT INTERFACE
// Interface cho ket qua kiem tra
// ============================================================

export interface QuizResultType {
  totalQuestions: number;           // Tong so cau hoi
  correctAnswers: number;           // So cau tra loi dung
  incorrectAnswers: number;         // So cau tra loi sai
  unansweredQuestions: number;       // So cau chua tra loi
  questionResults: QuestionResultType[]; // Chi tiet ket qua moi cau
}

export interface QuestionResultType {
  questionNumber: number;           // So thu tu cau hoi
  questionText: string;            // Noi dung cau hoi
  userAnswer?: string;              // Dap an nguoi dung chon
  correctAnswer?: string;           // Dap an dung
  correctAnswerText?: string;       // Noi dung dap an dung
  isCorrect: boolean;               // Dung sai
  isUnanswered: boolean;            // Chua tra loi
}
