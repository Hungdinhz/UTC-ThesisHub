import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThesisEligibilityPage } from '../../pages/ThesisEligibilityPage';
import { ReservationManagementPage } from '../../pages/ReservationManagementPage';
import { FinalDefenseEligibilityPage } from '../../pages/FinalDefenseEligibilityPage';
import { EligibilitySummaryCard } from '../EligibilitySummaryCard';
import { ForceApproveModal } from '../ForceApproveModal';

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

  it('renders ReservationManagementPage and displays reservations', async () => {
    render(<ReservationManagementPage />);

    expect(screen.getByText('Quản lý và Phê duyệt Đơn bảo lưu')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Bảo lưu do lý do sức khỏe/i)).toBeInTheDocument();
    });

    // Check filter tab buttons
    expect(screen.getByText('Tất cả đơn')).toBeInTheDocument();
    expect(screen.getByText(/Đang chờ duyệt/i)).toBeInTheDocument();
  });

  it('renders FinalDefenseEligibilityPage and checks criteria', async () => {
    render(<FinalDefenseEligibilityPage />);

    expect(screen.getByText('Xét điều kiện bảo vệ đồ án tốt nghiệp cuối kỳ')).toBeInTheDocument();

    const checkBtn = screen.getByText(/Kiểm tra điều kiện/i);
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('ĐỦ ĐIỀU KIỆN BẢO VỆ CUỐI KỲ')).toBeInTheDocument();
      expect(screen.getByText('1. Điểm Giảng viên Hướng dẫn (GVHD)')).toBeInTheDocument();
      expect(screen.getByText('2. Điểm Giảng viên Phản biện (GVPB)')).toBeInTheDocument();
      expect(screen.getByText('3. Tỷ lệ tương đồng Đạo văn')).toBeInTheDocument();
      expect(screen.getByText('4. Tiến độ thực hiện các giai đoạn')).toBeInTheDocument();
    });
  });
});
