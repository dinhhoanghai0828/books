export interface Volume {
  uuid: string;
  slug: string;
  eng: string;
  vi: string;
  audio: string;
  video?: string;  // Duong dan file video cua ca tap (co the khong co)
  startTime: string;
  endTime: string;
  bookId: string;
  checked: string;
  img: string;
  number: number;
}
