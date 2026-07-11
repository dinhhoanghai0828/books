import { ContentType } from '@/types/content';
import { parseTimeToSeconds } from '@/lib/helpers';

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
