import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CouncilManagementPage } from '../../pages/CouncilManagementPage';
import { defenseService } from '../../services/defenseService';
import { COUNCIL_ROLES } from '../../types';
import type { DefenseCouncil, LecturerOption } from '../../types';

vi.mock('../../../../services/api', () => ({ apiService: {
  getProjectRounds: vi.fn().mockResolvedValue([{ roundId: 10, name: 'Đợt 1', status: 'IN_PROGRESS' }]),
} }));
vi.mock('../../services/defenseService', () => ({ defenseService: {
  getCouncils: vi.fn(), getLecturers: vi.fn(), generateCouncils: vi.fn(),
  updateCouncilMembers: vi.fn(), finalizeCouncil: vi.fn(),
} }));

const lecturers: LecturerOption[] = Array.from({ length: 8 }, (_, i) => ({
  lecturerId: 501 + i, fullName: `Giảng viên ${501 + i}`, degree: 'Tiến sĩ',
  canBePresident: true, canBeSecretary: true, canBeMember: true, currentLoad: 0,
}));
const council: DefenseCouncil = {
  id: 1, projectRoundId: 10, code: 'HD-10-01', name: 'Hội đồng sinh tự động', status: 'ACTIVE',
  studentIds: [101],
  assignedStudents: [{ studentId: 101, studentName: 'Sinh viên A', studentCode: 'SV01', thesisId: 101,
    thesisTitle: 'Đề tài A', advisorId: 506, advisorName: 'Giảng viên 506' }],
  members: COUNCIL_ROLES.map((role, i) => ({ id: i + 1, councilId: 1, role,
    lecturerId: 501 + i, lecturerName: `Giảng viên ${501 + i}` })),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(defenseService.getCouncils).mockResolvedValue([]);
  vi.mocked(defenseService.getLecturers).mockResolvedValue(lecturers);
  vi.mocked(defenseService.generateCouncils).mockResolvedValue([council]);
  vi.mocked(defenseService.updateCouncilMembers).mockImplementation(async (_id, members) => ({ ...council, members }));
  vi.mocked(defenseService.finalizeCouncil).mockResolvedValue({ ...council, status: 'FINALIZED' });
});

const renderPage = () => render(<MemoryRouter><CouncilManagementPage /></MemoryRouter>);
const reviewerSelect = () => screen.getByRole('combobox', { name: 'Chọn Giảng viên đảm nhiệm: Ủy viên Phản biện 1' });

async function generateCouncil() {
  renderPage();
  const generate = screen.getByRole('button', { name: /⚡ Phân công 1 Hội đồng/ });
  await waitFor(() => expect(generate).toBeEnabled());
  fireEvent.click(generate);
  fireEvent.click(screen.getByRole('button', { name: /Chạy thuật toán CSP & Sinh Hội đồng/ }));
  await waitFor(() => expect(reviewerSelect()).toBeEnabled());
}

describe('Manual council editing after generation', () => {
  it('allows replacing a reviewer in a generated ACTIVE council and preserves all five roles', async () => {
    await generateCouncil();
    expect(defenseService.generateCouncils).toHaveBeenCalledWith({ projectRoundId: 10, maxStudentsPerCouncil: 50 });
    expect(screen.getByText(/Hội đồng sinh tự động ở trạng thái ACTIVE có thể đổi giảng viên thủ công/)).toBeInTheDocument();
    fireEvent.change(reviewerSelect(), { target: { value: '507' } });

    await waitFor(() => expect(reviewerSelect()).toHaveValue('507'));
    expect(defenseService.updateCouncilMembers).toHaveBeenCalledTimes(1);
    const [id, updated] = vi.mocked(defenseService.updateCouncilMembers).mock.calls[0];
    expect(id).toBe(1);
    expect(updated.map((m) => m.role)).toEqual([...COUNCIL_ROLES]);
    expect(updated[2]).toMatchObject({ lecturerId: 507, lecturerName: 'Giảng viên 507', role: 'REVIEWER_1' });
    expect(updated.filter((m) => m.id !== 3)).toEqual(council.members.filter((m) => m.id !== 3));
  });

  it('blocks duplicate and advisor choices both in options and in the save handler', async () => {
    await generateCouncil();
    const select = reviewerSelect();
    expect(within(select).getByRole('option', { name: /Giảng viên 501.*ĐÃ CÓ TRONG HỘI ĐỒNG/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: /Giảng viên 506.*TRÙNG GVHD/ })).toBeDisabled();
    fireEvent.change(select, { target: { value: '501' } });
    await screen.findByText(/đã có trong Hội đồng này rồi/);
    fireEvent.change(select, { target: { value: '506' } });
    await screen.findByText(/là GVHD của sinh viên Sinh viên A/);
    expect(defenseService.updateCouncilMembers).not.toHaveBeenCalled();
  });

  it('serializes saves and prevents finalize, reload, round changes, or another edit while saving', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    vi.mocked(defenseService.updateCouncilMembers).mockImplementationOnce(async (_id, members) => {
      await pending;
      return { ...council, members };
    });
    await generateCouncil();
    fireEvent.change(reviewerSelect(), { target: { value: '507' } });
    expect(screen.getByRole('status')).toHaveTextContent('Đang lưu thay đổi thành viên');
    const memberSelects = screen.getAllByRole('combobox', { name: /Chọn Giảng viên đảm nhiệm/ });
    memberSelects.forEach((select) => expect(select).toBeDisabled());
    screen.getAllByRole('button', { name: /Chốt Hội Đồng/ }).forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Làm mới' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /Đợt đồ án/ })).toBeDisabled();
    fireEvent.change(memberSelects[1], { target: { value: '508' } });
    expect(defenseService.updateCouncilMembers).toHaveBeenCalledTimes(1);
    expect(defenseService.finalizeCouncil).not.toHaveBeenCalled();

    await act(async () => { release(); });
    await waitFor(() => expect(reviewerSelect()).toHaveValue('507'));
    expect(reviewerSelect()).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('retains saved selections and re-enables editing when the server rejects a change', async () => {
    vi.mocked(defenseService.updateCouncilMembers).mockRejectedValueOnce(new Error('Không thể lưu thành viên'));
    await generateCouncil();
    fireEvent.change(reviewerSelect(), { target: { value: '507' } });
    await screen.findByText('Không thể lưu thành viên');
    expect(reviewerSelect()).toHaveValue('503');
    expect(reviewerSelect()).toBeEnabled();
    fireEvent.change(reviewerSelect(), { target: { value: '508' } });
    await waitFor(() => expect(reviewerSelect()).toHaveValue('508'));
  });

  it('locks all member selections after finalizing the generated council', async () => {
    await generateCouncil();
    fireEvent.click(screen.getByRole('button', { name: '🔒 Chốt Hội Đồng' }));
    await screen.findByText('🔒 ĐÃ CHỐT HỘI ĐỒNG (KHÓA THÀNH VIÊN)');
    screen.getAllByRole('combobox', { name: /Chọn Giảng viên đảm nhiệm/ }).forEach((select) => expect(select).toBeDisabled());
    fireEvent.change(reviewerSelect(), { target: { value: '507' } });
    expect(defenseService.updateCouncilMembers).not.toHaveBeenCalled();
  });

  it('keeps already FINALIZED councils locked when loaded', async () => {
    vi.mocked(defenseService.getCouncils).mockResolvedValue([{ ...council, status: 'FINALIZED' }]);
    renderPage();
    await screen.findByText('🔒 ĐÃ CHỐT HỘI ĐỒNG (KHÓA THÀNH VIÊN)');
    expect(reviewerSelect()).toBeDisabled();
    expect(screen.queryByRole('button', { name: '🔒 Chốt Hội Đồng' })).not.toBeInTheDocument();
  });

  it('does not invent advisor exclusions from demo student IDs when details are absent', async () => {
    vi.mocked(defenseService.getCouncils).mockResolvedValue([{ ...council, studentIds: [104], assignedStudents: undefined }]);
    renderPage();
    const president = await screen.findByRole('combobox', { name: 'Chọn Giảng viên đảm nhiệm: Chủ tịch hội đồng' });
    await waitFor(() => expect(president).toBeEnabled());
    expect(within(president).getByRole('option', { name: /Giảng viên 501/ })).toBeEnabled();
    expect(screen.queryByText('⚠️ Trùng GVHD')).not.toBeInTheDocument();
  });

  it('shows real assigned names and a retry message when lecturer loading fails', async () => {
    vi.mocked(defenseService.getCouncils).mockResolvedValue([council]);
    vi.mocked(defenseService.getLecturers).mockRejectedValue(new Error('Không thể tải danh sách giảng viên'));
    renderPage();
    await screen.findByRole('alert');
    expect(reviewerSelect()).toBeDisabled();
    expect(reviewerSelect()).toHaveValue('503');
    expect(within(reviewerSelect()).getByRole('option')).toHaveTextContent('Giảng viên 503 (Hiện tại)');
    expect(screen.getByRole('alert')).toHaveTextContent('Làm mới');

    vi.mocked(defenseService.getLecturers).mockResolvedValue(lecturers);
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    await waitFor(() => expect(reviewerSelect()).toBeEnabled());
  });
});
