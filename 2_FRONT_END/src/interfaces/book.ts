// ============================================================
// BOOK INTERFACE
// Interface cho doi tuong Sach
// ============================================================

export interface Book {
  id: string;              // ID duy nhat cua sach
  uuid: string;            // UUID cua sach
  slug: string;            // Slug duong dan URL
  eng: string;             // Ten tieng Anh
  vi: string;              // Ten tieng Viet
  author: string;          // Tac gia
  description: string;     // Mo ta
  img: string;             // Ten file anh bia sach
  number: string;          // So thu tu
  subCategoryId: string;   // ID danh muc con
}
