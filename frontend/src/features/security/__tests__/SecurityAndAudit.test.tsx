import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecurityCenterPage } from '../pages/SecurityCenterPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', fullName: 'Quản trị viên' },
    userType: 'admin',
    logout: vi.fn(),
  }),
}));

describe('Security Center & System Audit Logs Tests', () => {
  it('renders SecurityCenterPage with KPI cards, sessions, policies and RBAC tabs', async () => {
    render(<SecurityCenterPage />);

    expect(screen.getByText(/Trung Tâm Bảo Mật Hệ Thống/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Điểm An Toàn Hệ Thống')).toBeInTheDocument();
      expect(screen.getByText('94/100')).toBeInTheDocument();
      expect(screen.getByText('Phiên Đăng Nhập Hoạt Động')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    // Switch to Locked Accounts tab
    fireEvent.click(screen.getByRole('button', { name: /Tài khoản Khóa & Cảnh báo/i }));
    await waitFor(() => {
      expect(screen.getAllByText('201200455').length).toBeGreaterThan(0);
      expect(screen.getByText('🔓 Mở khóa ngay')).toBeInTheDocument();
    });

    // Switch to Security Policies tab
    fireEvent.click(screen.getByRole('button', { name: /Chính sách Bảo mật/i }));
    await waitFor(() => {
      expect(screen.getByText('MAX_FAILED_LOGIN_ATTEMPTS')).toBeInTheDocument();
      expect(screen.getByText('Giới hạn đăng nhập sai tối đa')).toBeInTheDocument();
    });

    // Switch to RBAC Matrix tab
    fireEvent.click(screen.getByRole('button', { name: /Ma trận Phân quyền RBAC/i }));
    await waitFor(() => {
      expect(screen.getByText('Trung Tâm Bảo Mật & Nhật Ký Hệ Thống')).toBeInTheDocument();
    });
  });

  it('renders AuditLogsPage, filters events, and opens JSON Diff modal', async () => {
    render(<AuditLogsPage />);

    expect(screen.getByText(/Nhật Ký Hệ Thống \(System Audit Logs\)/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tổng Sự Kiện Đã Ghi')).toBeInTheDocument();
      expect(screen.getByText(/Phê duyệt đơn bảo lưu đồ án/i)).toBeInTheDocument();
    });

    // Open AuditLogDetailModal on the first row
    const detailBtns = screen.getAllByText('🔍 Chi tiết');
    expect(detailBtns.length).toBeGreaterThan(0);
    fireEvent.click(detailBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Chi tiết Nhật ký Kiểm toán/i)).toBeInTheDocument();
      expect(screen.getByText(/Dữ liệu Trước thay đổi \(Old Values\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Dữ liệu Sau thay đổi \(New Values\)/i)).toBeInTheDocument();
    });
  });
});
