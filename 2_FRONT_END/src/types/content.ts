export interface ContentType {
  id: string;
  eng: string;
  vi: string;
  startTime: string;
  endTime: string;
  volumeEngName: string;
  volumeViName: string;
  bookEngName: string;
  audio: string;
  video?: string;  // Duong dan file video tuong ung voi cau (co the khong co)
  checked: string;
  missingWords: string[];
}
