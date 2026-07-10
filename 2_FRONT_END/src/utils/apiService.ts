import { Book } from '@/interfaces/book';
import { ContentType } from '@/interfaces/content';
import { PaginationResponse } from '@/interfaces/pagination';
import { Volume } from '@/interfaces/volume';
import { Word } from '@/interfaces/word';
import { Chart } from '@/interfaces/chart';
import { message } from 'antd';
import apiClient from './apiClient';

// ============================================================
// INTERCEPTORS
// ============================================================

// Gan token JWT vao header truoc moi request (tru login)
apiClient.interceptors.request.use(
  (config) => {
    if (config.url !== '/login') {
      const token = localStorage.getItem('jwt');
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xu ly loi 401/403: xoa token va chuyen ve trang login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 403) {
      localStorage.removeItem('jwt');
      window.location.href = '/login';
    } else if (status === 401) {
      message.error('Session expired. Please log in again.');
      localStorage.removeItem('jwt');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper: lay message loi tu response hoac fallback ve message mac dinh
const getErrorMessage = (error: any): string =>
  error.response?.data?.message || error.message || 'Loi khong xac dinh';

// ============================================================
// AUTH
// ============================================================

// Dang nhap, luu JWT vao localStorage va tra ve token
export const login = async (username: string, password: string): Promise<string> => {
  try {
    const response = await apiClient.post('/login', { username, password });
    const { jwt } = response.data;
    localStorage.setItem('jwt', jwt);
    return jwt;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// CATEGORIES
// ============================================================

// Lay danh sach tat ca danh muc
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/categories/list');
    return response.data.categories;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Lay danh sach sach theo danh muc lon (co phan trang)
export const getBooksByCategory = async (
  categorySlug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Book>> => {
  try {
    const response = await apiClient.get(
      `/categories/${categorySlug}?page=${page - 1}&size=${size}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Lay danh sach sach theo danh muc con (co phan trang)
export const getBooksBySubCategory = async (
  subCategorySlug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Book>> => {
  try {
    const response = await apiClient.get(
      `/sub-categories/${subCategorySlug}?page=${page - 1}&size=${size}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// VOLUMES
// ============================================================

// Lay danh sach tap theo slug sach (co phan trang)
export const getVolumes = async (
  slug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Volume>> => {
  try {
    const response = await apiClient.get(
      `/books/${slug}?page=${page - 1}&size=${size}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Lay chi tiet 1 tap theo slug
export const getVolumeDetail = async (slug: string): Promise<Volume> => {
  try {
    const response = await apiClient.get(`/volumes/${slug}`);
    return response.data.volume;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// CONTENTS
// ============================================================

// Lay danh sach noi dung theo ID tap
export const getContents = async (
  volumeId: string
): Promise<PaginationResponse<ContentType>> => {
  try {
    const response = await apiClient.get(`/content/${volumeId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Tim kiem noi dung theo tieng Anh hoac tieng Viet (co phan trang)
export const getContentSearch = async (
  eng: string | null,
  vi: string | null,
  page: number,
  size: number
): Promise<PaginationResponse<ContentType>> => {
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
      page: (page - 1).toString(),
      size: size.toString(),
    });
    const response = await apiClient.get(`/content/search?${params}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Cap nhat noi dung (tieng Anh va tieng Viet) theo ID
export const updateContent = async (
  id: string,
  eng: string,
  vi: string
): Promise<void> => {
  try {
    await apiClient.put('/content/update', { id, eng, vi });
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// WORDS
// ============================================================

// Lay tu can highlight tren trang noi dung
export const getHighLightWords = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
    });
    const response = await apiClient.get(`/word/highlight?${params}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Lay nghia cua tu khi nguoi dung boi den (tooltip)
export const getMeaningWords = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
    });
    const response = await apiClient.get(`/word/meaning?${params}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// Lay goi y tu khi nguoi dung dang nhap vao o tim kiem
export const getSuggestions = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const response = await apiClient.get(`/word/suggestion?eng=${eng}&vi=${vi}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

// Them tu moi vao tu dien (1 tu tieng Anh co the co nhieu nghia tieng Viet)
export const insertWord = async (eng: string, viList: string[]): Promise<void> => {
  try {
    await apiClient.post('/word/insert', { eng, viList });
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// CHART
// ============================================================

// Lay du lieu bieu do theo khoang ngay
export const getChart = async (
  startDate: string,
  endDate: string
): Promise<Chart[]> => {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await apiClient.get(`/chart/get-chart?${params}`);
    return response.data.charts || [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

// ============================================================
// TEST
// ============================================================

// Lay danh sach cau hoi kiem tra theo tap va so luong gioi han
export const getTests = async (
  volumeSlug: string,
  limit: string
): Promise<ContentType[]> => {
  try {
    const params = new URLSearchParams({ volumeSlug, limit });
    const response = await apiClient.get(`/test?${params}`);
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};
