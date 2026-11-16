import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouncilManagementPage } from '../../pages/CouncilManagementPage';
import { defenseService } from '../../services/defenseService';

vi.mock('../../../../services/api', () => ({
  apiService: {
    getProjectRounds: vi.fn().mockResolvedValue([
      { roundId: 10, name: 'Đợt 1 2026-2027', roundCode: 'D1_2627', status: 'IN_PROGRESS' },
    ]),
  },
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', fullName: 'Admin' },
    userType: 'admin',
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

describe('Council Notification Feature (GĐ5)', () => {
  it('allows admin to finalize council and displays notification button to notify members', async () => {
    const notifySpy = vi.spyOn(defenseService, 'notifyCouncilMembers').mockResolvedValue({
      councilId: 1,
      councilCode: 'HD-10-01',
      lecturerCount: 5,
      studentCount: 2,
      totalNotified: 7,
      sentAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <CouncilManagementPage />
      </BrowserRouter>
    );

    // Wait for council data to load
    await waitFor(() => {
      expect(screen.getByText('🔒 Chốt Hội Đồng Này')).toBeInTheDocument();
    });

    // Click Finalize
    const finalizeBtn = screen.getByText('🔒 Chốt Hội Đồng Này');
    fireEvent.click(finalizeBtn);

    // After finalization, verify notification buttons appear
    await waitFor(() => {
      expect(screen.getByText('📢 Gửi Thông Báo Thành Viên')).toBeInTheDocument();
      expect(screen.getByText('📢 Gửi thông báo')).toBeInTheDocument();
    });

    // Open notification modal
    const openNotifyBtn = screen.getByText('📢 Gửi Thông Báo Thành Viên');
    fireEvent.click(openNotifyBtn);

    // Verify modal elements
    expect(screen.getByText(/Gửi thông báo đến thành viên Hội đồng/i)).toBeInTheDocument();
    expect(screen.getByText(/Thành viên Hội đồng \(5 Giảng viên\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Gửi đến 5 Giảng viên Hội đồng/i)).toBeInTheDocument();

    // Submit notification
    const sendBtn = screen.getByText(/🚀 Gửi Thông Báo/i);
    fireEvent.click(sendBtn);

    // Verify notification was sent and success feedback is shown
    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalled();
      expect(screen.getByText(/ĐÃ GỬI THÔNG BÁO THÀNH CÔNG/i)).toBeInTheDocument();
    });
  });
});
