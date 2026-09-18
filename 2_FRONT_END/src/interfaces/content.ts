// ============================================================
// CONTENT INTERFACE
// Interface cho doi tuong Noi dung (Content - cau tieng Anh/Viet)
// ============================================================

export interface ContentType {
  id: string;              // ID duy nhat cua cau
  eng: string;             // Cau tieng Anh
  vi: string;              // Cau tieng Viet
  startTime: string;       // Thoi gian bat dau cua cau trong audio/video
  endTime: string;         // Thoi gian ket thuc cua cau trong audio/video
  volumeEngName: string;   // Ten tieng Anh cua tap
  volumeViName: string;   // Ten tieng Viet cua tap
  bookEngName: string;    // Ten tieng Anh cua sach
  audio: string;           // Duong dan file audio cua cau
  video?: string;          // Duong dan file video tuong ung voi cau (co the khong co)
  isLanguageApproved: number;  // Trang thai da duyet ngon ngu (0: chua duyet, 1: da duyet)
  isReviewCompleted: number;   // Trang thai da hoan thanh review (0: chua review, 1: da review)
  missingWords: string[];  // Danh sach tu thieu trong cau (dung de highlight)
}
