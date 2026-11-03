import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DefenseSchedulePage } from '../../pages/DefenseSchedulePage';
import { DefenseScoringPage } from '../../pages/DefenseScoringPage';
import { defenseService } from '../../services/defenseService';
import { COUNCIL_ROLES, COUNCIL_ROLE_LABELS } from '../../types';
import type { CouncilMember, DefenseSchedule } from '../../types';

vi.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({
  userType: 'committee_member', user: { id: 503, lecturerId: 503, fullName: 'Giảng viên 503' },
}) }));
vi.mock('../../../../services/api', () => ({ apiService: {
  getProjectRounds: vi.fn().mockResolvedValue([{ roundId: 10, name: 'Đợt 1', status: 'IN_PROGRESS' }]),
} }));
vi.mock('../../../thesis/services/thesisService', () => ({ thesisService: { searchTheses: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../services/defenseService', () => ({ defenseService: {
  getSchedules: vi.fn(), getCouncils: vi.fn(), getMyScoringTheses: vi.fn(),
  getScores: vi.fn(), getGraduationResult: vi.fn(), getMinutesSignatures: vi.fn(),
} }));

const members: CouncilMember[] = COUNCIL_ROLES.map((role, i) => ({
  id: i + 1, councilId: 1, lecturerId: i + 501, lecturerName: `Giảng viên ${i + 501}`, role,
}));
const schedule: DefenseSchedule = {
  id: 1, councilId: 1, councilName: 'Hội đồng kiểm tra vai trò', defenseDate: new Date().toISOString().split('T')[0],
  session: 'MORNING', room: 'A101', startTime: '08:00:00', endTime: '11:00:00', maxStudents: 5, status: 'SCHEDULED', members,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(defenseService.getSchedules).mockResolvedValue([schedule]);
  vi.mocked(defenseService.getCouncils).mockResolvedValue([]);
  vi.mocked(defenseService.getMyScoringTheses).mockResolvedValue([{
    thesisId: 101, titleVn: 'Đề tài kiểm tra vai trò', studentName: 'Sinh viên A', studentCode: 'SV01',
    isCouncilMember: true, canScoreCouncil: true, myCouncilRole: 'REVIEWER_1', myLecturerId: 503,
    myLecturerName: 'Giảng viên 503',
  }]);
  vi.mocked(defenseService.getScores).mockResolvedValue([]);
  vi.mocked(defenseService.getGraduationResult).mockResolvedValue(null);
  vi.mocked(defenseService.getMinutesSignatures).mockResolvedValue(members.map((m) => ({
    memberId: m.id, councilId: 1, lecturerId: m.lecturerId, lecturerName: m.lecturerName,
    role: m.role, slotLabel: 'Nhãn cũ không dùng', signed: false,
  })));
});

describe('Council role labels in schedule, scoring and minutes', () => {
  it('renders all five distinct roles in the schedule detail', async () => {
    render(<MemoryRouter><DefenseSchedulePage /></MemoryRouter>);
    fireEvent.click(await screen.findByText(schedule.councilName, { selector: '.schedule-council-name' }));
    await screen.findByText(/Chi Tiết Ca Bảo Vệ/);
    COUNCIL_ROLES.forEach((role) => expect(screen.getAllByText(COUNCIL_ROLE_LABELS[role]).length).toBeGreaterThan(0));
  });

  it('shows the reviewer role in scoring and canonical labels in all five minutes signature boxes', async () => {
    render(<DefenseScoringPage />);
    expect(await screen.findByRole('option', { name: /Vai trò: Ủy viên Phản biện 1/ })).toBeInTheDocument();
    const minutes = await screen.findByRole('button', { name: /Xuất Biên bản PDF & Ký/ });
    fireEvent.click(minutes);
    await screen.findByRole('heading', { name: 'BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC' });
    COUNCIL_ROLES.forEach((role) => expect(screen.getByText(COUNCIL_ROLE_LABELS[role], { exact: true })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Ký xác nhận biên bản \(Ủy viên Phản biện 1\)/ })).toBeInTheDocument();
    expect(screen.queryByText('Nhãn cũ không dùng')).not.toBeInTheDocument();
  });
});
