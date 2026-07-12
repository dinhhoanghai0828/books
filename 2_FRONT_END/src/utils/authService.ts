// Kiem tra nguoi dung da dang nhap chua dua tren cookie token.
// Tra ve true neu co token, false neu khong co hoac co loi.
export async function getLoginRedirect(context: any): Promise<boolean> {
  const token = context.req?.cookies?.token;
  if (!token) return false;
  try {
    return true;
  } catch {
    return false;
  }
}
