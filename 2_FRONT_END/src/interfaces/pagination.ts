export interface PaginationResponse<T> {
    data: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    page: number;
  }
  