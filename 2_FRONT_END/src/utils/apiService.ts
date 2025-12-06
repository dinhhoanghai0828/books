import { Book } from '@/interfaces/book';
import { ContentType } from '@/interfaces/content';
import { PaginationResponse } from '@/interfaces/pagination';
import { Volume } from '@/interfaces/volume';
import { message } from 'antd';
import apiClient from './apiClient';
import { Word } from '@/interfaces/word';
import { Chart } from '@/interfaces/chart';

apiClient.interceptors.request.use(
  (config) => {
    // Chỉ thêm Authorization nếu không phải gọi API login
    if (config.url !== '/login') {
      const token = localStorage.getItem('jwt'); // Lấy token từ localStorage
      config.headers.Authorization = `Bearer ${token}`; // Đính kèm token vào header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      localStorage.removeItem('jwt');
      window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
    } else if (error.response?.status === 401) {
      message.error('Session expired. Please log in again.');
      localStorage.removeItem('jwt');
      window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
    }
    return Promise.reject(error);
  }
);

// API Login
export const login = async (
  username: string,
  password: string
): Promise<string> => {
  try {
    const response = await apiClient.post('/login', { username, password });
    const { jwt } = response.data;
    // Lưu JWT và mật khẩu vào localStorage để sử dụng cho các API khác
    localStorage.setItem('jwt', jwt);
    return jwt;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy danh mục
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/categories/list');
    return response.data.categories;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy sách theo thể loại con
export const getBooksBySubCategory = async (
  subCategorySlug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Book>> => {
  try {
    const url = `/sub-categories/${subCategorySlug}?page=${
      page - 1
    }&size=${size}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy sách theo thể loại to
export const getBooksByCategory = async (
  categorySlug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Book>> => {
  try {
    const url = `/categories/${categorySlug}?page=${page - 1}&size=${size}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy tập
export const getVolumes = async (
  slug: string,
  page: number,
  size: number
): Promise<PaginationResponse<Volume>> => {
  try {
    const url = `/books/${slug}?page=${page - 1}&size=${size}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy nội dung theo tập
export const getContents = async (
  volumeId: string
): Promise<PaginationResponse<ContentType>> => {
  try {
    const url = `/content/${volumeId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API tìm kiếm nội dung
export const getContentSearch = async (
  eng: string | null,
  vi: string | null,
  page: number,
  size: number
): Promise<PaginationResponse<ContentType>> => {
  page = page - 1;
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
      page: page.toString(),
      size: size.toString(),
    });

    const url = `/content/search?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API tìm kiếm nội dung
export const getHighLightWords = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
    });

    const url = `/word/highlight?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API tìm kiếm nghĩa, tooltip
export const getMeaningWords = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const params = new URLSearchParams({
      ...(eng ? { eng } : {}),
      ...(vi ? { vi } : {}),
    });

    const url = `/word/meaning?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy chi tiết tập
export const getVolumeDetail = async (slug: string): Promise<Volume> => {
  try {
    const url = `/volumes/${slug}`;
    const response = await apiClient.get(url);
    return response.data.volume;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

// API lấy gợi ý nội dung
export const getSuggestions = async (
  eng: string | null,
  vi: string | null
): Promise<Word[]> => {
  try {
    const apiUrl = `/word/suggestion?eng=${eng}&vi=${vi}`;
    const response = await apiClient.get(apiUrl);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

// API lấy dữ liệu biểu đồ
export const getChart = async (
  startDate: string,
  endDate: string
): Promise<Chart[]> => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const url = `/chart/get-chart?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data.charts || []; // Trả về mảng dữ liệu biểu đồ
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};

export const getTests = async (
  volumeSlug: string,
  limit: string
): Promise<ContentType[]> => {
  try {
    const params = new URLSearchParams({
      volumeSlug,
      limit,
    });

    const url = `/test?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Lỗi không xác định'
    );
  }
};
