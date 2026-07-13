// ============================================================
// VOLUME INTERFACE
// Interface cho doi tuong Tap (Volume)
// ============================================================

export interface Volume {
  id: string;              // ID cua tap
  uuid: string;            // UUID cua tap
  slug: string;            // Slug duong dan URL
  eng: string;             // Ten tieng Anh
  vi: string;              // Ten tieng Viet
  audio: string;           // Duong dan file audio cua ca tap
  video?: string;          // Duong dan file video cua ca tap (co the khong co)
  startTime: string;       // Thoi gian bat dau cua tap
  endTime: string;         // Thoi gian ket thuc cua tap
  bookId: string;          // ID sach
  checked: string;         // Trang thai da hoan thanh
  img: string;             // Ten file anh
  number: number;          // So thu tu
}
