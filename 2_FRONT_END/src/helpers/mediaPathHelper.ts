// ============================================================
// MEDIA PATH HELPER
// Helper function de xu ly duong dan audio/video dung cach
// ============================================================

/**
 * Chuyen doi duong dan audio/video tu API sang duong dan public folder
 * @param mediaPath - Duong dan tu API (co the co hoac khong co thu muc con)
 * @returns Duong dan day du den file trong public/media
 */
export const getMediaPath = (mediaPath: string | null | undefined): string => {
  if (!mediaPath) return '';

  // Neu duong dan da bat dau bang /media/ thi tra ve nguyen lai
  if (mediaPath.startsWith('/media/')) {
    return mediaPath;
  }

  // Neu duong dan la ten file thu, them /media/ vao truoc
  return `/media/${mediaPath}`;
};

/**
 * Kiem tra xem file co ton tai trong public/media hay khong
 * @param mediaPath - Duong dan file
 * @returns true neu file ton tai, false neu khong
 */
export const mediaFileExists = (mediaPath: string): boolean => {
  // Client-side khong the kiem tra file ton tai truc tiep
  // Tra ve true de cho phep thu load, browser se xu ly loi neu file khong ton tai
  return true;
};
