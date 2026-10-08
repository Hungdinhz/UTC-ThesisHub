import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouncilManagementPage } from '../../pages/CouncilManagementPage';
import { DefenseSchedulePage } from '../../pages/DefenseSchedulePage';
import { DefenseScoringPage } from '../../pages/DefenseScoringPage';
import { CouncilMemberCard } from '../CouncilMemberCard';
import { ScoreEntryForm } from '../ScoreEntryForm';

describe('Defense Feature Component & Page Tests', () => {
  it('renders CouncilMemberCard with 1CT - 2TK - 2UV role badges', () => {
    const mockMember = {
      id: 1,
      lecturerId: 501,
      lecturerName: 'PGS. TS. Trần Văn Minh',
      role: 'PRESIDENT' as const,
    };
    const mockLecturers = [
      {
        lecturerId: 501,
        fullName: 'PGS. TS. Trần Văn Minh',
        degree: 'PGS',
        canBePresident: true,
        canBeSecretary: true,
        canBeMember: true,
        currentLoad: 2,
      },
    ];

    render(
      <CouncilMemberCard
        member={mockMember}
        allLecturers={mockLecturers}
        onLecturerChange={() => {}}
      />
    );

    expect(screen.getByText(/Chủ tịch Hội đồng/i)).toBeInTheDocument();
    expect(screen.getByText(/PGS\. TS\. Trần Văn Minh/i)).toBeInTheDocument();
  });

  it('detects GVHD conflict warning in CouncilMemberCard', () => {
    const mockMember = {
      id: 2,
      lecturerId: 502,
      lecturerName: 'TS. Lê Thị Mai',
      role: 'SECRETARY' as const,
    };
    const mockLecturers = [
      {
        lecturerId: 502,
        fullName: 'TS. Lê Thị Mai',
        degree: 'TS',
        canBePresident: true,
        canBeSecretary: true,
        canBeMember: true,
        currentLoad: 1,
      },
    ];

    render(
      <CouncilMemberCard
        member={mockMember}
        allLecturers={mockLecturers}
        onLecturerChange={() => {}}
        excludedAdvisorIds={[502]} // 502 is GVHD
      />
    );

    expect(screen.getByText('⚠️ Trùng GVHD')).toBeInTheDocument();
  });

  it('renders CouncilManagementPage and shows 1CT - 2TK - 2UV structure', async () => {
    render(<CouncilManagementPage />);

    expect(screen.getByText('Quản lý Hội đồng bảo vệ đồ án tốt nghiệp')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Cơ cấu chuẩn: 1CT - 2TK - 2UV/i)).toBeInTheDocument();
      expect(screen.getAllByText(/HD-10-01/i).length).toBeGreaterThan(0);
    });

    // Check button to run CSP algorithm
    expect(screen.getByText(/Chạy phân công tự động \(CSP\)/i)).toBeInTheDocument();
  });

  it('renders DefenseSchedulePage and toggles view modes', async () => {
    render(<DefenseSchedulePage />);

    expect(screen.getByText('Xếp lịch và Điều hành Bảo vệ Luận văn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Phòng Hội thảo A2-301/i).length).toBeGreaterThan(0);
    });

    // Switch to Ca (Session) view
    const sessionBtn = screen.getByText(/Theo Ca/i);
    fireEvent.click(sessionBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Ca Sáng/i })).toBeInTheDocument();
    });

    // Switch to Timeline view
    const timelineBtn = screen.getByText(/Dạng Timeline/i);
    fireEvent.click(timelineBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/08:00:00/i).length).toBeGreaterThan(0);
    });
  });

  it('enters criteria scores and auto calculates total score in ScoreEntryForm', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    const mockGraders = [
      {
        lecturerId: 501,
        fullName: 'PGS. TS. Trần Văn Minh',
        degree: 'PGS',
        canBePresident: true,
        canBeSecretary: true,
        canBeMember: true,
        currentLoad: 2,
      },
    ];

    render(
      <ScoreEntryForm
        thesisId={101}
        graders={mockGraders}
        onSubmit={onSubmitMock}
      />
    );

    expect(screen.getByText(/Nhập phiếu chấm điểm luận văn tốt nghiệp/i)).toBeInTheDocument();
    expect(screen.getByText('1. Nội dung khoa học & kỹ thuật')).toBeInTheDocument();
    expect(screen.getByText('2. Báo cáo & Trình bày (Slide/Thuyết minh)')).toBeInTheDocument();
    expect(screen.getByText('3. Phản biện & Trả lời câu hỏi')).toBeInTheDocument();
    expect(screen.getByText('4. Sản phẩm hoàn thiện / Demo thực nghiệm')).toBeInTheDocument();

    // Default: 3.5 + 1.8 + 2.5 + 0.9 = 8.70
    expect(screen.getByText(/8\.70 \/ 10\.0/)).toBeInTheDocument();

    const feedbackInput = screen.getByPlaceholderText(/Nêu rõ ưu điểm, hạn chế/i);
    fireEvent.change(feedbackInput, { target: { value: 'Bài làm rất tốt, demo chạy ổn định.' } });

    const submitBtn = screen.getByText(/Xác nhận Lưu kết quả chấm điểm/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        thesisId: 101,
        graderId: 501,
        scoreType: 'COUNCIL',
        score: 8.7,
        feedback: 'Bài làm rất tốt, demo chạy ổn định.',
      });
    });
  });

  it('renders DefenseScoringPage and displays synthesized result', async () => {
    render(<DefenseScoringPage />);

    expect(screen.getByText('Chấm điểm và Tổng hợp Kết quả Tốt nghiệp')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('KẾT QUẢ TỐT NGHIỆP TỔNG HỢP')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An (SV2021001)')).toBeInTheDocument();
      expect(screen.getByText('8.55')).toBeInTheDocument();
      expect(screen.getByText(/Xếp loại: EXCELLENT/i)).toBeInTheDocument();
    });
  });
});
