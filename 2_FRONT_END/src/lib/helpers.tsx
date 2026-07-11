import React from 'react';

// ============================================================
// HELPER FUNCTIONS - Cac ham ho tro dung chung cho toan bo ung dung
// ============================================================

// Chuyen chuoi "hh:mm:ss" hoac "mm:ss" thanh so giay
export const parseTimeToSeconds = (time: string): number => {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  const [m, s] = parts;
  return m * 60 + s;
};

// Highlight cac tu khop voi keywords trong doan van ban
export const highlightText = (
  text: string,
  keywords: string[] | string
): React.ReactNode => {
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  if (!keywordList.length || (keywordList.length === 1 && !keywordList[0])) {
    return text;
  }
  const regex = new RegExp(`(${keywordList.join('|')})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part)
      ? <mark key={index} style={{ backgroundColor: 'yellow' }}>{part}</mark>
      : part
  );
};

// Kiem tra chuoi co chua ky tu tieng Anh hay khong
export const isEnglishText = (text: string): boolean => {
  return /^[a-zA-Z ]+$/.test(text);
};
