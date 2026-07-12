import axios from 'axios';

// Tao instance axios dung chung cho toan bo ung dung
// baseURL lay tu bien moi truong NEXT_PUBLIC_BACKEND_URL
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
