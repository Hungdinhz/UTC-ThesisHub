import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DefenseSchedulePage } from '../../pages/DefenseSchedulePage';
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

describe('Defense Schedule Finalization & Notification (GĐ5)', () => {
  it('allows admin to finalize defense schedule and notify everyone', async () => {
    const finalizeSpy = vi.spyOn(defenseService, 'finalizeSchedules').mockResolvedValue([
      {
        id: 1,
        councilId: 1,
        councilName: 'Hội đồng HD-10-01',
        defenseDate: '2026-11-20',
        session: 'MORNING',
        room: 'Phòng Hội thảo A2-301',
        startTime: '08:00:00',
        endTime: '11:30:00',
        maxStudents: 12,
        status: 'FINALIZED',
        assignedStudents: [
          {
            studentId: 101,
            studentName: 'Nguyễn Văn An',
            studentCode: 'SV2021001',
            thesisId: 101,
            thesisTitle: 'Nghiên cứu ứng dụng Deep Learning',
            advisorId: 502,
            advisorName: 'TS. Lê Thị Mai',
          },
        ],
      },
    ]);

    const notifySpy = vi.spyOn(defenseService, 'notifyDefenseSchedules').mockResolvedValue({
      projectRoundId: 10,
      roundName: 'Đợt 1 2026-2027',
      scheduleCount: 1,
      lecturerCount: 5,
      studentCount: 1,
      totalNotified: 6,
      sentAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <DefenseSchedulePage />
      </BrowserRouter>
    );

    // Verify initial button to finalize exists
    await waitFor(() => {
      expect(screen.getByText('🔒 Chốt Lịch Bảo Vệ')).toBeInTheDocument();
    });

    // Click Finalize
    const finalizeBtn = screen.getByText('🔒 Chốt Lịch Bảo Vệ');
    fireEvent.click(finalizeBtn);

    // Verify finalize API called
    await waitFor(() => {
      expect(finalizeSpy).toHaveBeenCalledWith(10);
      expect(screen.getByText('📢 Gửi Thông Báo Đến Mọi Người')).toBeInTheDocument();
    });

    // Open notification modal
    const openNotifyBtn = screen.getByText('📢 Gửi Thông Báo Đến Mọi Người');
    fireEvent.click(openNotifyBtn);

    // Verify modal is open and shows metrics
    await waitFor(() => {
      expect(screen.getByText(/Gửi thông báo Lịch bảo vệ chính thức/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng quan thông số lịch bảo vệ/i)).toBeInTheDocument();
    });

    // Submit send notification
    const sendBtn = screen.getByText(/🚀 Gửi Thông Báo/i);
    fireEvent.click(sendBtn);

    // Verify notification was dispatched
    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalled();
      expect(screen.getByText(/ĐÃ GỬI THÔNG BÁO LỊCH THI THÀNH CÔNG/i)).toBeInTheDocument();
    });
  });
});
