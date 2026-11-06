import { describe, it, expect } from 'vitest';
import { extractApiErrorMessage } from '../apiError';

describe('extractApiErrorMessage', () => {
  it('lấy message tiếng Việt từ ApiResponse của backend', () => {
    const err = {
      response: {
        data: {
          code: 1025,
          message: 'Sinh viên 201200102 chưa được ghi danh trong đợt đồ án này.',
          data: null,
          success: false,
        },
      },
    };

    expect(extractApiErrorMessage(err)).toBe(
      'Sinh viên 201200102 chưa được ghi danh trong đợt đồ án này.'
    );
  });

  it('nối thêm chi tiết lỗi validation theo từng field', () => {
    const err = {
      response: {
        data: {
          code: 1010,
          message: 'Dữ liệu đầu vào không hợp lệ',
          data: { gpa: 'GPA phải từ 0.0 đến 4.0' },
        },
      },
    };

    expect(extractApiErrorMessage(err)).toBe(
      'Dữ liệu đầu vào không hợp lệ: GPA phải từ 0.0 đến 4.0'
    );
  });

  it('trả thông báo thân thiện khi lỗi mạng', () => {
    const err = { message: 'Network Error' };

    expect(extractApiErrorMessage(err)).toContain('Không thể kết nối tới máy chủ');
  });

  it('trả thông báo thân thiện khi timeout', () => {
    const err = { message: 'timeout of 30000ms exceeded' };

    expect(extractApiErrorMessage(err)).toContain('quá thời gian chờ');
  });

  it('fallback khi không có thông tin nào', () => {
    expect(extractApiErrorMessage(null, 'Lỗi custom')).toBe('Lỗi custom');
    expect(extractApiErrorMessage({}, 'Lỗi custom')).toBe('Lỗi custom');
  });

  it('bỏ qua message rỗng và dùng fallback', () => {
    const err = { response: { data: { message: '   ' } } };

    expect(extractApiErrorMessage(err, 'Lỗi custom')).toBe('Lỗi custom');
  });
});
