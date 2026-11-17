import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DefenseScoringPage } from '../../pages/DefenseScoringPage';
import { defenseService } from '../../services/defenseService';
import { apiService } from '../../../../services/api';
import type { MyScoringThesis, GraduationResult } from '../../types';

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', fullName: 'Quản trị viên Đào tạo' },
    userType: 'admin',
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

vi.mock('../../../../services/api', () => ({
  apiService: {
    getProjectRounds: vi.fn(),
  },
}));

vi.mock('../../services/defenseService', () => ({
  defenseService: {
    getMyScoringTheses: vi.fn(),
    getScores: vi.fn(),
    getGraduationResult: vi.fn(),
    getMinutesSignatures: vi.fn(),
    synthesizeResult: vi.fn(),
    synthesizeRoundResults: vi.fn(),
    getResultsByRound: vi.fn(),
    finalizeAndPublishRound: vi.fn(),
  },
}));

const mockTheses: MyScoringThesis[] = [
  {
    thesisId: 101,
    thesisCode: 'DT-101',
    titleVn: 'Nghiên cứu ứng dụng AI trong nhận diện phương tiện',
    studentId: 201,
    studentCode: '201200101',
    studentName: 'Nguyễn Văn Nam',
    studentClass: 'K61-CNTT1',
    advisorId: 501,
    advisorName: 'TS. Nguyễn Hoàng',
    defenseEligible: true,
  },
  {
    thesisId: 102,
    thesisCode: 'DT-102',
    titleVn: 'Xây dựng hệ thống IoT giám sát giao thông đô thị',
    studentId: 202,
    studentCode: '201200102',
    studentName: 'Trần Thị Thu',
    studentClass: 'K61-CNTT2',
    advisorId: 502,
    advisorName: 'PGS. TS. Lê Minh',
    defenseEligible: true,
  },
];

const mockGradResults: GraduationResult[] = [
  {
    id: 1,
    thesisId: 101,
    thesisCode: 'DT-101',
    thesisTitle: 'Nghiên cứu ứng dụng AI trong nhận diện phương tiện',
    studentCode: '201200101',
    studentName: 'Nguyễn Văn Nam',
    studentClass: 'K61-CNTT1',
    advisorName: 'TS. Nguyễn Hoàng',
    supervisorScore: 8.5,
    reviewerScore: 0.0,
    councilScore: 9.0,
    finalScore: 8.8,
    grade: 'EXCELLENT',
    finalResult: 'PASSED',
  },
  {
    id: 2,
    thesisId: 102,
    thesisCode: 'DT-102',
    thesisTitle: 'Xây dựng hệ thống IoT giám sát giao thông đô thị',
    studentCode: '201200102',
    studentName: 'Trần Thị Thu',
    studentClass: 'K61-CNTT2',
    advisorName: 'PGS. TS. Lê Minh',
    supervisorScore: 8.0,
    reviewerScore: 0.0,
    councilScore: 8.5,
    finalScore: 8.3,
    grade: 'VERY_GOOD',
    finalResult: 'PASSED',
  },
];

describe('Defense Scoring & Round Synthesis Feature (GĐ5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getProjectRounds).mockResolvedValue([
      {
        roundId: 10,
        name: 'Đợt 1 Năm học 2026-2027',
        roundCode: 'D1_2627',
        academicYear: '2026-2027',
        semester: 'HK1',
        status: 'IN_PROGRESS',
      },
    ]);
    vi.mocked(defenseService.getMyScoringTheses).mockResolvedValue(mockTheses);
    vi.mocked(defenseService.getScores).mockResolvedValue([]);
    vi.mocked(defenseService.getGraduationResult).mockResolvedValue(mockGradResults[0]);
    vi.mocked(defenseService.getMinutesSignatures).mockResolvedValue([]);
    vi.mocked(defenseService.getResultsByRound).mockResolvedValue(mockGradResults);
    vi.mocked(defenseService.synthesizeRoundResults).mockResolvedValue(mockGradResults);
    vi.mocked(defenseService.finalizeAndPublishRound).mockResolvedValue(mockGradResults);
  });

  it('renders admin buttons: round synthesis, separate export data, and separate finalize round', async () => {
    render(<DefenseScoringPage />);

    // Check header title
    expect(screen.getByText('Chấm điểm và Tổng hợp Kết quả Tốt nghiệp')).toBeInTheDocument();

    // Check round synthesis button
    const synthBtn = await screen.findByRole('button', { name: /Tổng hợp kết quả tốt nghiệp/i });
    expect(synthBtn).toBeInTheDocument();

    // Check the two separate buttons
    const exportBtn = screen.getByRole('button', { name: /Xuất dữ liệu cuối kỳ/i });
    expect(exportBtn).toBeInTheDocument();

    const finalizeBtn = screen.getByRole('button', { name: /Hoàn tất đợt/i });
    expect(finalizeBtn).toBeInTheDocument();
  });

  it('opens round synthesis modal and triggers round-level synthesis with UTC weights', async () => {
    render(<DefenseScoringPage />);

    const synthBtn = await screen.findByRole('button', { name: /Tổng hợp kết quả tốt nghiệp/i });
    fireEvent.click(synthBtn);

    // Modal title should indicate whole round synthesis
    expect(screen.getByText(/Tổng hợp Điểm Tốt nghiệp Toàn Đợt Đồ án/i)).toBeInTheDocument();
    expect(screen.getByText(/Quy mô tổng hợp:/i)).toBeInTheDocument();
    expect(screen.getByText(/2 sinh viên\/đề tài/i)).toBeInTheDocument();

    // Confirm synthesis
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Tổng hợp Điểm Toàn Đợt/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(defenseService.synthesizeRoundResults).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          projectRoundId: 10,
          supervisorWeight: 0.4,
          councilWeight: 0.6,
        })
      );
    });

    // Check success notification
    await waitFor(() => {
      expect(screen.getByText(/Đã tổng hợp điểm tốt nghiệp thành công cho toàn bộ đợt đồ án/i)).toBeInTheDocument();
    });
  });

  it('opens export data modal separately with table, Excel download and Print PDF options', async () => {
    render(<DefenseScoringPage />);

    const exportBtn = await screen.findByRole('button', { name: /Xuất dữ liệu cuối kỳ/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText('📥 Bảng Tổng hợp Dữ liệu Điểm Cuối kỳ')).toBeInTheDocument();
      expect(screen.getByText('201200101')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument();
      expect(screen.getByText('201200102')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Thu')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Xuất file Excel \(\.csv\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /In Bảng tổng hợp/i })).toBeInTheDocument();
    });
  });

  it('opens finalize round modal separately and allows closing the round when all scores are ready', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DefenseScoringPage />);

    const finalizeBtn = await screen.findByRole('button', { name: /Hoàn tất đợt/i });
    fireEvent.click(finalizeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Hoàn tất Đợt Đồ án & Công bố Kết quả/i)).toBeInTheDocument();
      expect(screen.getByText(/2\/2 sinh viên/i)).toBeInTheDocument();
      expect(screen.getByText(/đã có điểm tổng kết đầy đủ/i)).toBeInTheDocument();
    });

    const confirmFinalizeBtn = screen.getByRole('button', { name: /Xác nhận Hoàn tất & Công bố Đợt đồ án/i });
    fireEvent.click(confirmFinalizeBtn);

    await waitFor(() => {
      expect(defenseService.finalizeAndPublishRound).toHaveBeenCalledWith(10);
    });
  });
});
