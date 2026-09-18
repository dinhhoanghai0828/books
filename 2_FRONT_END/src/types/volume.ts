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
  isLanguageApproved: number;
  isReviewCompleted: number;
  img: string;
  number: number;
}
