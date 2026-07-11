// ============================================================
// WORD INTERFACES
// Interfaces cho doi tuong Tu (Word)
// ============================================================

// Word dung cho tra nghia tu (khong co ID)
export interface Word {
  eng: string;             // Tu tieng Anh
  vi: string;              // Nghia tieng Viet
}

// WordItem dung cho danh sach tu trong bang WORDS (co ID)
export interface WordItem {
  id: string;              // ID duy nhat cua tu
  eng: string;             // Tu tieng Anh
  vi: string;              // Nghia tieng Viet
}
