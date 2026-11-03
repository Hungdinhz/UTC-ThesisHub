import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COUNCIL_ROLES } from '../../types';
import type { CouncilMember, DefenseCouncil } from '../../types';

vi.mock('axios', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));

let service: typeof import('../../services/defenseService')['defenseService'];
const members: CouncilMember[] = COUNCIL_ROLES.map((role, i) => ({
  id: i + 1, councilId: 1, lecturerId: i + 501, lecturerName: `Giảng viên ${i + 1}`, role,
}));
const council: DefenseCouncil = {
  id: 1, projectRoundId: 10, code: 'HD-01', name: 'Hội đồng 1', status: 'ACTIVE', members, studentIds: [],
};

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('MODE', 'production');
  service = (await import('../../services/defenseService')).defenseService;
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('DefenseService member structure', () => {
  it('sends exactly one of all five roles to the members API', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: { data: council } });
    await expect(service.updateCouncilMembers(1, members)).resolves.toEqual(council);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/defense/councils/1/members'), members, expect.any(Object));
  });

  it('rejects the old two-secretary/two-member structure before making a request', async () => {
    const oldMembers = members.map((m) => ({ ...m, role: m.role === 'REVIEWER_1' ? 'SECRETARY' as const : m.role === 'REVIEWER_2' ? 'MEMBER' as const : m.role }));
    await expect(service.updateCouncilMembers(1, oldMembers)).rejects.toThrow('Ủy viên Phản biện 1');
    expect(axios.put).not.toHaveBeenCalled();
  });

  it.each(COUNCIL_ROLES)('rejects a missing %s role', async (role) => {
    await expect(service.updateCouncilMembers(1, members.filter((m) => m.role !== role))).rejects.toThrow('đúng 5 người');
    expect(axios.put).not.toHaveBeenCalled();
  });

  it('rejects additional slots and duplicate lecturers', async () => {
    await expect(service.updateCouncilMembers(1, [...members, { ...members[4], id: 6, lecturerId: 999 }])).rejects.toThrow('đúng 5 người');
    await expect(service.updateCouncilMembers(1, members.map((m, i) => i === 4 ? { ...m, lecturerId: members[0].lecturerId } : m))).rejects.toThrow('một vai trò');
    expect(axios.put).not.toHaveBeenCalled();
  });

  it('preserves backend save errors rather than returning a successful mock', async () => {
    vi.mocked(axios.put).mockRejectedValue({ response: { data: { message: 'Hội đồng đã chốt (FINALIZED)' } } });
    await expect(service.updateCouncilMembers(1, members)).rejects.toThrow('Hội đồng đã chốt (FINALIZED)');
  });

  it('generates mock councils with five distinct roles and no advisor conflicts', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'test');
    const mockService = (await import('../../services/defenseService')).defenseService;
    const generated = await mockService.generateCouncils({ projectRoundId: 10 });
    expect(generated[0].members.map((m) => m.role)).toEqual([...COUNCIL_ROLES]);
    expect(new Set(generated[0].members.map((m) => m.lecturerId)).size).toBe(5);
    expect(generated[0].members.some((m) => generated[0].assignedStudents?.some((s) => s.advisorId === m.lecturerId))).toBe(false);
    await expect(mockService.updateCouncilMembers(1, generated[0].members)).resolves.toMatchObject({ status: 'ACTIVE' });
    await mockService.finalizeCouncil(1);
    await expect(mockService.updateCouncilMembers(1, generated[0].members)).rejects.toThrow('FINALIZED');
  });
});

describe('DefenseService lecturer options', () => {
  const lecturer = { lecturerId: 42, fullName: 'Nguyễn Văn A', email: 'a@example.test', academicDegree: 'TIEN_SI' };

  it.each([
    { data: [lecturer] },
    [lecturer],
  ])('maps the actual wrapped array contract and the raw array contract', async (body) => {
    vi.mocked(axios.get).mockResolvedValue({ data: body });
    await expect(service.getLecturers()).resolves.toEqual([expect.objectContaining({
      lecturerId: 42, fullName: 'Nguyễn Văn A', email: 'a@example.test', degree: 'TIEN_SI',
      canBePresident: true, canBeSecretary: true, canBeMember: true,
    })]);
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/lecturers$/), expect.any(Object));
  });

  it('returns an empty real list without substituting demo lecturers', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } });
    await expect(service.getLecturers()).resolves.toEqual([]);
  });

  it('reports unexpected response shapes without leaking demo lecturer IDs into the UI', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { unexpected: [] } } });
    await expect(service.getLecturers()).rejects.toThrow('Dữ liệu danh sách giảng viên không hợp lệ');
  });

  it('reports lecturer load failures so the page can show a retry message', async () => {
    vi.mocked(axios.get).mockRejectedValue({ response: { data: { message: 'Không có quyền tải giảng viên' } } });
    await expect(service.getLecturers()).rejects.toThrow('Không có quyền tải giảng viên');
  });
});
