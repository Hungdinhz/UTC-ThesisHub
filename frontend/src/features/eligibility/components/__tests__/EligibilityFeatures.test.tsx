import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThesisEligibilityPage } from '../../pages/ThesisEligibilityPage';
import { ReservationManagementPage } from '../../pages/ReservationManagementPage';
import { FinalDefenseEligibilityPage } from '../../pages/FinalDefenseEligibilityPage';
import { EligibilitySummaryCard } from '../EligibilitySummaryCard';
import { ForceApproveModal } from '../ForceApproveModal';
import { ReservationSubmitModal } from '../ReservationSubmitModal';
import { AdminCreateReservationModal } from '../AdminCreateReservationModal';

vi.mock('../../../../services/api', () => ({
  apiService: {
    getProjectRounds: vi.fn().mockResolvedValue([
      { roundId: 10, name: 'Đợt 1 2026-2027', roundCode: 'D1_2627', status: 'IN_PROGRESS' },
    ]),
    getStudentsInRound: vi.fn().mockResolvedValue({
      content: [
        { studentId: 101, studentCode: 'SV2021001', fullName: 'Nguyễn Văn An', gpa: 3.45, status: 'ELIGIBLE' },
        { studentId: 102, studentCode: 'SV2021002', fullName: 'Trần Thị Bích', gpa: 2.15, status: 'INELIGIBLE' },
      ],
      totalElements: 2,
    }),
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

describe('Eligibility Feature Component & Page Tests', () => {
  it('renders EligibilitySummaryCard with correct values', () => {
    render(
      <EligibilitySummaryCard
        total={100}
        eligible={75}
        ineligible={15}
        forceApproved={6}
        disqualified={4}
      />
    );

    expect(screen.getByText('Tổng sinh viên xét duyệt')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Đủ điều kiện tiêu chuẩn')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Chưa đạt điều kiện')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Duyệt đặc cách (Force)')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Bị loại khỏi đợt')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders ThesisEligibilityPage and shows student list', async () => {
    render(<ThesisEligibilityPage />);

    expect(screen.getByText('Xét duyệt điều kiện làm đồ án tốt nghiệp')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('SV2021001')).toBeInTheDocument();
    });

    // Test filter search
    const searchInput = screen.getByPlaceholderText('Tìm theo Mã sinh viên hoặc Họ tên...');
    fireEvent.change(searchInput, { target: { value: 'Bích' } });

    await waitFor(() => {
      expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    });
  });

  it('opens and confirms ForceApproveModal', async () => {
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);
    const mockStudent = {
      studentId: 102,
      studentCode: 'SV2021002',
      studentName: 'Trần Thị Bích',
      gpa: 2.15,
      accumulatedCredits: 102,
      unpassedPrerequisites: ['Học máy'],
      eligible: false,
      reason: 'Thiếu tín chỉ',
      status: 'INELIGIBLE' as const,
    };

    render(
      <ForceApproveModal
        isOpen={true}
        onClose={() => {}}
        student={mockStudent}
        onConfirm={onConfirmMock}
      />
    );

    expect(screen.getByText('Phê duyệt đặc cách làm đồ án tốt nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(
      'Nhập căn cứ, quyết định hoặc ngoại lệ cho phép sinh viên bảo vệ/làm đồ án...'
    );
    fireEvent.change(reasonInput, { target: { value: 'Có giải thưởng NCKH cấp Trường' } });

    const submitBtn = screen.getByText('Xác nhận Duyệt đặc cách');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith(
        'Có giải thưởng NCKH cấp Trường',
        expect.any(String)
      );
    });
  });

  it('renders ReservationSubmitModal with category selector and submits', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);

    render(
      <ReservationSubmitModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmitMock}
        defaultStudentId={102}
        defaultThesisId={5}
        projectRoundId={10}
        defaultCategory="INSUFFICIENT_CREDITS"
      />
    );

    expect(screen.getByText('Nộp đơn xin bảo lưu đồ án tốt nghiệp')).toBeInTheDocument();
    expect(screen.getByText(/Quy định giai đoạn bảo lưu/i)).toBeInTheDocument();

    // Check category selector
    const categorySelect = screen.getByLabelText(/Phân loại lý do/i);
    expect(categorySelect).toBeInTheDocument();

    // Enter reason
    const reasonInput = screen.getByLabelText(/Chi tiết giải trình/i);
    fireEvent.change(reasonInput, { target: { value: 'Đề tài đã xong nhưng còn nợ môn Khai phá dữ liệu' } });

    const submitBtn = screen.getByText('Gửi đơn bảo lưu');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 102,
          reasonCategory: 'INSUFFICIENT_CREDITS',
          reason: 'Đề tài đã xong nhưng còn nợ môn Khai phá dữ liệu',
        })
      );
    });
  });

  it('renders AdminCreateReservationModal and confirms', async () => {
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminCreateReservationModal
        isOpen={true}
        onClose={() => {}}
        student={{
          studentId: 105,
          studentCode: 'SV2021005',
          studentName: 'Hoàng Văn Em',
          thesisId: 105,
          thesisTitle: 'Phân tích dữ liệu học tập',
          defaultCategory: 'INSUFFICIENT_CREDITS',
          defaultReason: 'Khoa lập bảo lưu do sinh viên thiếu 4 tín chỉ tốt nghiệp',
        }}
        projectRoundId={10}
        onConfirm={onConfirmMock}
      />
    );

    expect(screen.getByText('Lập quyết định bảo lưu đồ án cho sinh viên')).toBeInTheDocument();
    expect(screen.getByText('Hoàng Văn Em')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Xác nhận lập bảo lưu');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 105,
          reasonCategory: 'INSUFFICIENT_CREDITS',
          autoApprove: true,
        })
      );
    });
  });

  it('renders ReservationManagementPage and displays reservations', async () => {
    render(<ReservationManagementPage />);

    expect(screen.getByText('Quản lý và Phê duyệt Đơn bảo lưu')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Bảo lưu do lý do sức khỏe/i)).toBeInTheDocument();
    });

    // Check filter tab buttons
    expect(screen.getByText('Tất cả đơn')).toBeInTheDocument();
    expect(screen.getAllByText(/Chờ duyệt/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Đã chấp thuận/i)).toBeInTheDocument();
  });

  it('renders FinalDefenseEligibilityPage and checks criteria', async () => {
    render(<FinalDefenseEligibilityPage />);

    expect(screen.getByText(/Xét điều kiện bảo vệ đồ án/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Nhập mã sinh viên/i);
    fireEvent.change(input, { target: { value: '201200101' } });

    const checkBtn = screen.getByText(/Kiểm tra điều kiện theo MSSV/i);
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('ĐỦ ĐIỀU KIỆN BẢO VỆ CUỐI KỲ')).toBeInTheDocument();
      expect(screen.getByText(/1\. Tiến độ thực hiện/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Giảng viên Hướng dẫn/i)).toBeInTheDocument();
    });
  });
});
