import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignmentManagementPage } from '../../pages/AssignmentManagementPage';
import { assignmentService } from '../../services/assignmentService';

vi.mock('../../../../services/api', () => ({
  apiService: {
    getProjectRounds: vi.fn().mockResolvedValue([
      { roundId: 1, name: 'Đợt 1 2026-2027', roundCode: 'D1_2627', status: 'IN_PROGRESS' },
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

describe('Assignment Notification Feature (GĐ2)', () => {
  it('renders notification button when assignment is finalized and sends notifications', async () => {
    // Mock proposals as finalized
    vi.spyOn(assignmentService, 'getProposals').mockResolvedValue([
      {
        id: 1,
        studentId: 101,
        studentCode: 'SV2021001',
        studentName: 'Nguyễn Văn An',
        lecturerId: 501,
        lecturerCode: 'GV001',
        lecturerName: 'PGS. TS. Trần Văn Minh',
        academicDegree: 'PGS',
        status: 'FINALIZED',
        priorityMatched: 1,
        assignmentMethod: 'ALGORITHM_MATCH',
        isOverridden: false,
      },
    ]);

    vi.spyOn(assignmentService, 'getStats').mockResolvedValue({
      projectRoundId: 1,
      totalStudents: 1,
      totalAssigned: 1,
      matchedNv1: 1,
      nv1Rate: 100,
      matchedNv2: 0,
      nv2Rate: 0,
      matchedNv3: 0,
      nv3Rate: 0,
      matchedFallback: 0,
      unassignedCount: 0,
      overriddenCount: 0,
      finalizedCount: 1,
      totalLecturers: 1,
      totalCapacity: 5,
      averageLoadRatio: 0.2,
    });

    const notifySpy = vi.spyOn(assignmentService, 'notifyAssignmentResults').mockResolvedValue({
      projectRoundId: 1,
      roundName: 'Đợt 1 2026-2027',
      lecturerCount: 1,
      studentCount: 1,
      totalNotified: 2,
      sentAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <AssignmentManagementPage projectRoundId={1} />
      </BrowserRouter>
    );

    // Wait for finalized buttons to appear
    await waitFor(() => {
      expect(screen.getByText('📢 Gửi thông báo kết quả')).toBeInTheDocument();
      expect(screen.getByText('📢 Gửi thông báo kết quả cho GVHD & SV')).toBeInTheDocument();
    });

    // Click notify button to open modal
    const notifyBtn = screen.getByText('📢 Gửi thông báo kết quả');
    fireEvent.click(notifyBtn);

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText(/Gửi thông báo kết quả phân công GVHD/i)).toBeInTheDocument();
      expect(screen.getByText(/Thống kê người nhận/i)).toBeInTheDocument();
    });

    // Click Send
    const sendBtn = screen.getByText(/🚀 Gửi Thông Báo/i);
    fireEvent.click(sendBtn);

    // Verify submission
    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalled();
      expect(screen.getByText(/ĐÃ GỬI THÔNG BÁO THÀNH CÔNG/i)).toBeInTheDocument();
    });
  });
});
