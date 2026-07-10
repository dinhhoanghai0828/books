import { ContentType } from '@/interfaces/content';

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

// Tim item co startTime <= currentTime < endTime
export const findActiveItem = (
  contents: ContentType[],
  currentTime: number
): ContentType | undefined =>
  contents.find((item) => {
    const start = parseTimeToSeconds(item.startTime);
    const end = parseTimeToSeconds(item.endTime);
    return currentTime >= start && currentTime < end;
  });
