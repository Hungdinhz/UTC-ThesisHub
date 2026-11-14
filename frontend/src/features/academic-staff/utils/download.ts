export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Khi API trả lỗi với responseType 'blob', thân lỗi là Blob chứa JSON.
 * Hàm này đọc ra thông điệp lỗi để hiển thị cho người dùng.
 */
export const extractErrorMessage = async (err: any, fallback: string): Promise<string> => {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.message || err?.message || fallback;
};
