import { SubCategory } from './subcategory';

// ============================================================
// CATEGORY INTERFACE
// Interface cho doi tuong Danh muc lon
// ============================================================

export interface Category {
  uuid: string;            // UUID cua danh muc
  eng: string;             // Ten tieng Anh
  vi: string;              // Ten tieng Viet
  number: number;          // So thu tu
  subcategories: SubCategory[]; // Danh sach danh muc con
}
