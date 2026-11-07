import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentHomePage } from '../pages/StudentHomePage';
import { LecturerHomePage } from '../pages/LecturerHomePage';
import { AcademicStaffHomePage } from '../pages/AcademicStaffHomePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'test_user',
      fullName: 'Người Dùng Kiểm Thử UTC',
      student: { id: 10, studentCode: '201200101' },
      lecturer: { id: 20, lecturer_code: 'GV001' },
    },
    userType: 'student',
    logout: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  apiService: {
    getMyRoundStatus: vi.fn().mockResolvedValue({
      hasActiveRound: true,
      inRound: true,
      roundId: 1,
      roundCode: 'DA_K62',
      roundName: 'Đợt ĐATN K62',
      roundCurrentStage: 4,
      studentId: 10,
      studentCode: '201200101',
      fullName: 'Nguyễn Văn An',
      completedStage: 3,
      isDropped: false,
    }),
    getProjectRoundById: vi.fn().mockResolvedValue({
      roundId: 1,
      roundCode: 'DA_K62',
      name: 'Đợt ĐATN K62',
      academicYear: '2026-2027',
      semester: 'HK1',
      status: 'IN_PROGRESS',
      currentMilestone: {
        milestoneId: 4,
        name: 'Thực hiện & Báo cáo tuần',
        phaseType: 'WEEKLY_REPORT',
        startDate: '2026-10-01',
        endDate: '2026-11-20',
        orderIndex: 4,
        isActive: true,
      },
      milestones: [],
    }),
    getActiveProjectRound: vi.fn().mockResolvedValue({
      roundId: 1,
      roundCode: 'DA_K62',
      name: 'Đợt ĐATN K62',
      academicYear: '2026-2027',
      semester: 'HK1',
      status: 'IN_PROGRESS',
    }),
    getProjectRounds: vi.fn().mockResolvedValue([
      {
        roundId: 1,
        roundCode: 'DA_K62',
        name: 'Đợt ĐATN K62',
        academicYear: '2026-2027',
        semester: 'HK1',
        status: 'IN_PROGRESS',
      },
    ]),
    getRoundMilestones: vi.fn().mockResolvedValue([]),
    getEligibleStudents: vi.fn().mockResolvedValue({
      roundId: 1,
      roundCode: 'DA_K62',
      roundName: 'Đợt ĐATN K62',
      maxDebtCredits: 10,
      totalStudents: 50,
      eligibleCount: 42,
      ineligibleCount: 5,
      noDataCount: 3,
      students: [],
    }),
    getGradeReport: vi.fn().mockResolvedValue({
      roundId: 1,
      roundCode: 'DA_K62',
      roundName: 'Đợt ĐATN K62',
      totalStudents: 40,
      classes: [],
    }),
    getNotifications: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    markNotificationsAsRead: vi.fn().mockResolvedValue({ updated_count: 0 }),
  },
}));

vi.mock('../../thesis/services/thesisService', () => ({
  thesisService: {
    getProposalByStudentAndRound: vi.fn().mockResolvedValue({
      id: 100,
      projectRoundId: 1,
      studentId: 10,
      lecturerId: 20,
      titleVn: 'Hệ thống quản lý đồ án thông minh UTC',
      status: 'APPROVED',
      supervisorApproved: true,
      studentSigned: true,
      version: 1,
    }),
    getThesisByStudentAndRound: vi.fn().mockResolvedValue({
      id: 200,
      projectRoundId: 1,
      studentId: 10,
      lecturerId: 20,
      lecturerFullName: 'TS. Trần Văn Giảng Viên',
      thesisCode: 'DT_K62_01',
      titleVn: 'Hệ thống quản lý đồ án thông minh UTC',
      status: 'IN_PROGRESS',
      completionRate: 75,
      defenseEligible: false,
    }),
    searchTheses: vi.fn().mockResolvedValue([]),
    searchProposals: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../progress/services/progressService', () => ({
  progressService: {
    getThesisProgressSummary: vi.fn().mockResolvedValue({
      thesisId: 200,
      thesisCode: 'DT_K62_01',
      studentId: 10,
      studentCode: '201200101',
      studentFullName: 'Nguyễn Văn An',
      lecturerId: 20,
      lecturerFullName: 'TS. Trần Văn Giảng Viên',
      status: 'IN_PROGRESS',
      completionRate: 75,
      totalTasks: 4,
      completedTasks: 3,
      taskCompletionPercent: 75,
      totalProgressReports: 2,
      latestAssessment: 'DAT',
      defenseEligible: false,
      readyForDefense: false,
    }),
    getTasksByThesis: vi.fn().mockResolvedValue([
      {
        id: 301,
        thesisId: 200,
        title: 'Hoàn thiện module báo cáo tiến độ',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2026-11-12T00:00:00Z',
        submissionCount: 0,
        commentCount: 0,
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      },
    ]),
    getProgressSummaries: vi.fn().mockResolvedValue([
      {
        thesisId: 200,
        thesisCode: 'DT_K62_01',
        thesisTitle: 'Hệ thống quản lý đồ án thông minh UTC',
        studentId: 10,
        studentCode: '201200101',
        studentFullName: 'Nguyễn Văn An',
        lecturerId: 20,
        lecturerFullName: 'TS. Trần Văn Giảng Viên',
        status: 'IN_PROGRESS',
        completionRate: 30,
        totalTasks: 4,
        completedTasks: 1,
        taskCompletionPercent: 25,
        totalProgressReports: 1,
        submittedTasksCount: 2,
        overdueTasksCount: 2,
        unreviewedReportsCount: 1,
        defenseEligible: false,
        readyForDefense: false,
      },
    ]),
  },
}));

vi.mock('../../assignment/services/assignmentService', () => ({
  assignmentService: {
    getPreferences: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({
      projectRoundId: 1,
      totalStudents: 50,
      totalAssigned: 40,
      finalizedCount: 40,
    }),
  },
}));

vi.mock('../../defense/services/defenseService', () => ({
  defenseService: {
    getSchedules: vi.fn().mockResolvedValue([]),
    getGraduationResult: vi.fn().mockResolvedValue(null),
    getMyScoringTheses: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../eligibility/services/eligibilityService', () => ({
  eligibilityService: {
    getReservations: vi.fn().mockResolvedValue([]),
  },
}));

describe('Role Homepages rendering and progress visibility', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders StudentHomePage with 5-stage stepper, thesis progress and actionable todos', async () => {
    render(
      <MemoryRouter>
        <StudentHomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('round-progress-stepper')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getAllByText(/Hệ thống quản lý đồ án thông minh UTC/i)[0]
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByText(/Hoàn thiện module báo cáo tiến độ/i)[0]
    ).toBeInTheDocument();
  });

  it('renders LecturerHomePage with batch student progress table and risk badges', async () => {
    render(
      <MemoryRouter>
        <LecturerHomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('round-progress-stepper')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Nguyễn Văn An/i)[0]).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Nguy cơ/i)[0]).toBeInTheDocument();
  });

  it('renders AcademicStaffHomePage with eligibility KPIs, funnel and missing data todo', async () => {
    render(
      <MemoryRouter>
        <AcademicStaffHomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('round-progress-stepper')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/3 sinh viên chưa có dữ liệu học vụ/i)
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText('42')[0]).toBeInTheDocument();
  });

  it('disables stage 5 council actions and shortcuts on LecturerHomePage when roundStage < 5', async () => {
    // Stage 4 in mock is < 5
    render(
      <MemoryRouter>
        <LecturerHomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Council scoring button in section header should be disabled
      const councilScoreBtn = screen.getByRole('button', { name: /Chấm điểm Hội đồng →/i });
      expect(councilScoreBtn).toBeDisabled();

      // Council banner warning
      expect(
        screen.getByText(/Giai đoạn 5 \(Hội đồng & Bảo vệ\) hiện chưa mở trong đợt đồ án này/i)
      ).toBeInTheDocument();

      // GD5 shortcuts should be disabled
      const gd5SchedBtn = screen.getByRole('button', { name: /GĐ5: Lịch Hội đồng Bảo vệ/i });
      expect(gd5SchedBtn).toBeDisabled();

      const gd5ScoringBtn = screen.getByRole('button', { name: /GĐ5: Chấm điểm & Biên bản PDF/i });
      expect(gd5ScoringBtn).toBeDisabled();
    });
  });
});
