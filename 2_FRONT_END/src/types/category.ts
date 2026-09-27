export interface Category {
  uuid: string;
  eng: string;
  vi: string;
  number: number;
  subcategories: Category[];
}
