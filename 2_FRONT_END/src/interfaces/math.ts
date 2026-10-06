// ============================================================
// MATH CATEGORY INTERFACE
// ============================================================

export interface MathCategoryType {
  id: number;
  categoryCode: string;
  categoryName: string;
  parentId: number | null;
  status: string;
  children?: MathCategoryType[];
}

// ============================================================
// MATH QUESTION INTERFACE
// ============================================================

export interface MathQuestionType {
  id: number;
  categoryCode: string;
  questionCode: string;
  questionText: string;
  difficulty: number;
  status: string;
  answers: MathAnswerType[];
}

// ============================================================
// MATH ANSWER INTERFACE
// ============================================================

export interface MathAnswerType {
  id: number;
  questionCode: string;
  answerCode: string;
  answerText: string;
  isCorrect: string;
}
