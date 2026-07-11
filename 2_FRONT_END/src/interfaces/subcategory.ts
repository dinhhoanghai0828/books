// ============================================================
// SUBCATEGORY INTERFACE
// Interface cho doi tuong Danh muc con (SubCategory)
// ============================================================

export interface SubCategory {
  id: string;              // ID duy nhat cua danh muc con
  uuid: string | null;     // UUID cua danh muc con
  eng: string;             // Ten tieng Anh
  vi: string;              // Ten tieng Viet
  categoryId: string | null; // ID danh muc cha
  number: number | null;   // So thu tu
}
