/**
 * Trích xuất thông báo lỗi thân thiện từ response của backend.
 *
 * Backend trả về cấu trúc ApiResponse:
 *   { code: 1008, message: "Sinh viên ... chưa được ghi danh...", data: null, success: false }
 *
 * Axios reject bằng `err.response.data` khi server trả 4xx/5xx,
 * còn lỗi mạng / timeout không có `err.response`.
 */
export const extractApiErrorMessage = (
  err: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'
): string => {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const anyErr = err as {
    response?: { data?: { message?: string; data?: Record<string, string> } };
    message?: string;
  };

  // 1. Message trực tiếp từ ApiResponse của backend (ưu tiên cao nhất)
  const apiMessage = anyErr.response?.data?.message;
  if (apiMessage && typeof apiMessage === 'string' && apiMessage.trim()) {
    // Ưu tiên chi tiết lỗi validation theo từng field nếu có
    const fieldErrors = anyErr.response?.data?.data;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const details = Object.values(fieldErrors).filter(Boolean);
      if (details.length > 0) {
        return `${apiMessage}: ${details.join('; ')}`;
      }
    }
    return apiMessage;
  }

  // 2. Lỗi mạng / timeout
  if (anyErr.message) {
    if (anyErr.message.includes('Network Error')) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và backend đã được khởi động chưa.';
    }
    if (anyErr.message.includes('timeout')) {
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
    }
    return anyErr.message;
  }

  return fallback;
};
