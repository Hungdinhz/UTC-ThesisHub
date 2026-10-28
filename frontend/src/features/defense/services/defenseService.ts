import axios from 'axios';
import type {
  DefenseCouncil,
  CouncilMember,
  CouncilGenerationRequest,
  LecturerOption,
  ReviewerAssignment,
  ReviewerAssignRequest,
  DefenseSchedule,
  AutoScheduleRequest,
  ScheduleConfig,
  ScoreItem,
  ScoreSubmitRequest,
  MyScoringThesis,
  MinutesSignatureItem,
  GraduationResult,
  SynthesizeResultRequest,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/defense`;
const IS_TEST_ENV = import.meta.env.MODE === 'test';

function authHeaders(): Record<string, string> {
  if (IS_TEST_ENV) {
    throw new Error('Skip live network in unit tests');
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractApiError(err: any, fallback: string): string {
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
}

export const mockLecturers: LecturerOption[] = [
  { lecturerId: 501, fullName: 'PGS. TS. Trần Văn Minh', degree: 'Phó Giáo sư', canBePresident: true, canBeSecretary: true, canBeMember: true, currentLoad: 2 },
  { lecturerId: 502, fullName: 'TS. Lê Thị Mai', degree: 'Tiến sĩ', canBePresident: true, canBeSecretary: true, canBeMember: true, currentLoad: 1 },
  { lecturerId: 503, fullName: 'ThS. Hoàng Quốc Bảo', degree: 'Thạc sĩ', canBePresident: false, canBeSecretary: true, canBeMember: true, currentLoad: 3 },
  { lecturerId: 504, fullName: 'ThS. Đỗ Thùy Linh', degree: 'Thạc sĩ', canBePresident: false, canBeSecretary: true, canBeMember: true, currentLoad: 2 },
  { lecturerId: 505, fullName: 'TS. Phạm Hải Nam', degree: 'Tiến sĩ', canBePresident: false, canBeSecretary: false, canBeMember: true, currentLoad: 1 },
  { lecturerId: 506, fullName: 'ThS. Bùi Quang Huy', degree: 'Thạc sĩ', canBePresident: false, canBeSecretary: false, canBeMember: true, currentLoad: 1 },
  { lecturerId: 507, fullName: 'GS. TS. Nguyễn Đức Dũng', degree: 'Giáo sư', canBePresident: true, canBeSecretary: true, canBeMember: true, currentLoad: 1 },
  { lecturerId: 508, fullName: 'TS. Vũ Anh Tuấn', degree: 'Tiến sĩ', canBePresident: true, canBeSecretary: true, canBeMember: true, currentLoad: 2 },
  { lecturerId: 509, fullName: 'ThS. Hoàng Phương Thảo', degree: 'Thạc sĩ', canBePresident: false, canBeSecretary: true, canBeMember: true, currentLoad: 0 },
];

const mockCouncils: DefenseCouncil[] = [
  {
    id: 1,
    projectRoundId: 10,
    code: 'HD-10-01',
    name: 'Hội đồng đánh giá luận văn HD-10-01',
    status: 'ACTIVE',
    description: 'Hội đồng sinh tự động bằng thuật toán CSP (1CT - 2TK - 2UV)',
    studentIds: [101, 104],
    members: [
      { id: 1, councilId: 1, lecturerId: 501, lecturerName: 'PGS. TS. Trần Văn Minh', role: 'PRESIDENT', confirmed: true },
      { id: 2, councilId: 1, lecturerId: 503, lecturerName: 'ThS. Hoàng Quốc Bảo', role: 'SECRETARY', confirmed: true },
      { id: 3, councilId: 1, lecturerId: 504, lecturerName: 'ThS. Đỗ Thùy Linh', role: 'SECRETARY', confirmed: true },
      { id: 4, councilId: 1, lecturerId: 505, lecturerName: 'TS. Phạm Hải Nam', role: 'MEMBER', confirmed: true },
      { id: 5, councilId: 1, lecturerId: 506, lecturerName: 'ThS. Bùi Quang Huy', role: 'MEMBER', confirmed: true },
    ],
  },
];

const mockSchedules: DefenseSchedule[] = [
  {
    id: 1,
    councilId: 1,
    councilName: 'Hội đồng đánh giá luận văn HD-10-01',
    defenseDate: new Date().toISOString().split('T')[0],
    session: 'MORNING',
    room: 'Phòng Hội thảo A2-301',
    startTime: '08:00:00',
    endTime: '11:30:00',
    maxStudents: 5,
    status: 'SCHEDULED',
    notes: 'Ca sáng - Bảo vệ chuyên ban Công nghệ Phần mềm',
  },
  {
    id: 2,
    councilId: 1,
    councilName: 'Hội đồng đánh giá luận văn HD-10-02',
    defenseDate: new Date().toISOString().split('T')[0],
    session: 'AFTERNOON',
    room: 'Phòng Lab 402-A1',
    startTime: '13:30:00',
    endTime: '17:00:00',
    maxStudents: 5,
    status: 'SCHEDULED',
    notes: 'Ca chiều - Bảo vệ chuyên ban Trí tuệ nhân tạo',
  },
];

const mockScores: ScoreItem[] = [
  { id: 1, thesisId: 101, graderId: 502, graderName: 'TS. Lê Thị Mai (GVHD)', scoreType: 'SUPERVISOR', score: 8.5, feedback: 'Sinh viên chủ động, hoàn thành tốt mục tiêu', gradedAt: '2026-09-20' },
  { id: 2, thesisId: 101, graderId: 507, graderName: 'GS. TS. Nguyễn Đức Dũng (GVPB)', scoreType: 'REVIEWER', score: 8.0, feedback: 'Tài liệu chỉnh chu, thực nghiệm rõ ràng', gradedAt: '2026-09-22' },
  { id: 3, thesisId: 101, graderId: 501, graderName: 'PGS. TS. Trần Văn Minh (Chủ tịch)', scoreType: 'COUNCIL', score: 9.0, feedback: 'Thuyết trình mạch lạc, trả lời xuất sắc', gradedAt: '2026-09-25' },
];

const mockResults: GraduationResult[] = [
  {
    id: 1,
    thesisId: 101,
    thesisCode: 'DT-101',
    thesisTitle: 'Nghiên cứu ứng dụng Deep Learning trong nhận diện cử chỉ tay',
    studentName: 'Nguyễn Văn An',
    studentCode: 'SV2021001',
    supervisorScore: 8.5,
    reviewerScore: 8.0,
    councilScore: 8.67,
    finalScore: 8.55,
    grade: 'EXCELLENT',
    finalResult: 'PASSED',
    publishedAt: new Date().toISOString(),
    notes: 'Đã tổng hợp điểm tốt nghiệp chính thức',
  },
];

class DefenseService {
  async getLecturers(): Promise<LecturerOption[]> {
    try {
      const res = await axios.get(`${BASE_URL}/lecturers`, { headers: authHeaders() });
      const list = res.data?.data || res.data;
      if (Array.isArray(list)) {
        const mapped = list.map((l: any) => {
          const deg = String(l.academicDegree || '').toUpperCase();
          const canBePres =
            deg.includes('TIEN_SI') ||
            deg.includes('TIẾN SĨ') ||
            deg.includes('TS') ||
            deg.includes('PGS') ||
            deg.includes('GS') ||
            deg.includes('PHÓ GIÁO SƯ') ||
            deg.includes('GIÁO SƯ') ||
            deg.includes('PHD');
          return {
            lecturerId: l.lecturerId || l.id,
            fullName: l.fullName,
            degree: l.academicDegree || 'Giảng viên',
            canBePresident: canBePres,
            canBeSecretary: true,
            canBeMember: true,
            currentLoad: 1,
          };
        });
        if (mapped.length > 0 && mapped.every((m) => !m.canBePresident)) {
          mapped.forEach((m) => {
            m.canBePresident = true;
          });
        }
        return mapped;
      }
    } catch (err) {
      if (!IS_TEST_ENV) {
        return [];
      }
    }
    return mockLecturers;
  }

  async getCouncils(projectRoundId: number = 10): Promise<DefenseCouncil[]> {
    try {
      const res = await axios.get(`${API_BASE}/councils`, {
        params: { projectRoundId },
        headers: authHeaders(),
      });
      if (Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      if (!IS_TEST_ENV) {
        return [];
      }
      return mockCouncils;
    }
  }

  async getCouncilById(id: number): Promise<DefenseCouncil> {
    try {
      const res = await axios.get(`${API_BASE}/councils/${id}`, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Không tìm thấy hội đồng'));
      }
    }
    const found = mockCouncils.find((c) => c.id === id);
    if (found) return found;
    throw new Error('Không tìm thấy hội đồng');
  }

  async generateCouncils(request: CouncilGenerationRequest): Promise<DefenseCouncil[]> {
    try {
      const res = await axios.post(`${API_BASE}/councils/generate`, request, { headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Không thể sinh Hội đồng tự động'));
      }
      return mockCouncils;
    }
  }

  async finalizeCouncil(councilId: number): Promise<DefenseCouncil> {
    try {
      const res = await axios.post(`${API_BASE}/councils/${councilId}/finalize`, {}, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Không thể chốt Hội đồng'));
      }
    }
    const council = mockCouncils.find((c) => c.id === councilId);
    if (council) {
      council.status = 'FINALIZED';
      return council;
    }
    throw new Error('Không tìm thấy hội đồng');
  }

  async updateCouncilMembers(councilId: number, updatedMembers: CouncilMember[]): Promise<DefenseCouncil> {
    const presidents = updatedMembers.filter((m) => m.role === 'PRESIDENT');
    const secretaries = updatedMembers.filter((m) => m.role === 'SECRETARY');
    const members = updatedMembers.filter((m) => m.role === 'MEMBER');

    if (presidents.length !== 1 || secretaries.length !== 2 || members.length !== 2) {
      throw new Error('Cơ cấu hội đồng bắt buộc đúng 5 người: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên!');
    }

    try {
      const res = await axios.put(`${API_BASE}/councils/${councilId}/members`, updatedMembers, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
    } catch (err: any) {
      if (!IS_TEST_ENV || err?.response?.data?.message) {
        throw new Error(extractApiError(err, 'Cập nhật thành viên Hội đồng thất bại'));
      }
    }

    const council = mockCouncils.find((c) => c.id === councilId);
    if (!council) throw new Error('Không tìm thấy hội đồng');
    council.members = updatedMembers;
    return council;
  }

  async assignReviewer(request: ReviewerAssignRequest): Promise<ReviewerAssignment> {
    try {
      const res = await axios.post(`${API_BASE}/reviewers/assign`, request, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Phân công giảng viên phản biện thất bại'));
      }
    }
    const reviewer = mockLecturers.find((l) => l.lecturerId === request.reviewerId);
    return {
      id: 1,
      thesisId: request.thesisId,
      reviewerId: request.reviewerId,
      reviewerName: reviewer ? reviewer.fullName : `Giảng viên ${request.reviewerId}`,
      assignedBy: request.assignedBy,
      assignedAt: new Date().toISOString(),
      status: 'ASSIGNED',
      note: request.note,
    };
  }

  async getSchedules(date?: string, projectRoundId?: number): Promise<DefenseSchedule[]> {
    try {
      const params: any = {};
      if (date) params.date = date;
      if (projectRoundId) params.projectRoundId = projectRoundId;
      const res = await axios.get(`${API_BASE}/schedules`, { params, headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch {
      if (!IS_TEST_ENV) {
        return [];
      }
      return mockSchedules;
    }
  }

  async autoGenerateSchedules(request: AutoScheduleRequest): Promise<DefenseSchedule[]> {
    try {
      const res = await axios.post(`${API_BASE}/schedules/auto-generate`, request, { headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Không thể tự động xếp lịch bảo vệ'));
      }
      return mockSchedules;
    }
  }

  async configureSchedule(config: ScheduleConfig): Promise<DefenseSchedule> {
    try {
      const res = await axios.post(`${API_BASE}/schedules/configure`, config, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
      throw new Error('Không nhận được dữ liệu lịch bảo vệ từ máy chủ');
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Cấu hình ca bảo vệ thất bại'));
      }
      return mockSchedules[0];
    }
  }

  async updateSchedule(scheduleId: number, config: ScheduleConfig): Promise<DefenseSchedule> {
    try {
      const res = await axios.put(`${API_BASE}/schedules/${scheduleId}`, config, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
      throw new Error('Không nhận được dữ liệu cập nhật lịch bảo vệ');
    } catch (err) {
      throw new Error(extractApiError(err, 'Cập nhật ca bảo vệ thất bại'));
    }
  }

  async deleteSchedule(scheduleId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/schedules/${scheduleId}`, { headers: authHeaders() });
    } catch (err) {
      throw new Error(extractApiError(err, 'Xóa lịch bảo vệ thất bại'));
    }
  }

  async getMyScoringTheses(projectRoundId?: number): Promise<MyScoringThesis[]> {
    try {
      const params: any = {};
      if (projectRoundId) params.projectRoundId = projectRoundId;
      const res = await axios.get(`${API_BASE}/my-scoring-theses`, { params, headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch {
      if (!IS_TEST_ENV) {
        return [];
      }
      return [
        {
          thesisId: 101,
          thesisCode: 'DT-101',
          titleVn: 'Nghiên cứu ứng dụng Deep Learning trong nhận diện cử chỉ tay',
          studentName: 'Nguyễn Văn An',
          studentCode: 'SV2021001',
          advisorName: 'TS. Lê Thị Mai',
          defenseEligible: true,
          canScoreCouncil: false,
          canScoreReviewer: false,
          canScoreSupervisor: false,
          isCouncilMember: false,
        },
      ];
    }
  }

  async getScores(thesisId: number): Promise<ScoreItem[]> {
    try {
      const res = await axios.get(`${API_BASE}/scores`, { params: { thesisId }, headers: authHeaders() });
      if (Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      if (!IS_TEST_ENV) {
        return [];
      }
      return mockScores.filter((s) => s.thesisId === thesisId);
    }
  }

  async submitScore(request: ScoreSubmitRequest): Promise<ScoreItem> {
    try {
      const res = await axios.post(`${API_BASE}/scores`, request, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
      throw new Error('Không lưu được phiếu chấm điểm');
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Lưu điểm đánh giá thất bại'));
      }
      return {
        id: mockScores.length + 1,
        thesisId: request.thesisId,
        graderId: request.graderId,
        scoreType: request.scoreType,
        score: request.score,
        feedback: request.feedback,
        gradedAt: new Date().toISOString(),
      };
    }
  }

  async getMinutesSignatures(thesisId: number): Promise<MinutesSignatureItem[]> {
    try {
      const res = await axios.get(`${API_BASE}/results/${thesisId}/signatures`, { headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch {
      return [];
    }
  }

  async signDefenseMinutes(thesisId: number): Promise<MinutesSignatureItem[]> {
    try {
      const res = await axios.post(`${API_BASE}/results/${thesisId}/sign-minutes`, {}, { headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (err) {
      throw new Error(extractApiError(err, 'Ký xác nhận Biên bản bảo vệ thất bại'));
    }
  }

  async synthesizeResult(request: SynthesizeResultRequest): Promise<GraduationResult> {
    try {
      const res = await axios.post(`${API_BASE}/results/synthesize`, request, { headers: authHeaders() });
      if (res.data?.data) return res.data.data;
      throw new Error('Không thể tổng hợp kết quả tốt nghiệp');
    } catch (err) {
      if (!IS_TEST_ENV) {
        throw new Error(extractApiError(err, 'Tổng hợp kết quả tốt nghiệp thất bại'));
      }
      return mockResults[0];
    }
  }

  async finalizeAndPublishRound(roundId: number): Promise<GraduationResult[]> {
    try {
      const res = await axios.post(`${API_BASE}/rounds/${roundId}/finalize-and-publish`, {}, { headers: authHeaders() });
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (err) {
      throw new Error(extractApiError(err, 'Ký xuất dữ liệu & công bố kết quả đợt đồ án thất bại'));
    }
  }

  async getGraduationResult(thesisId: number): Promise<GraduationResult | null> {
    try {
      const res = await axios.get(`${API_BASE}/results/${thesisId}`, { headers: authHeaders() });
      return res.data?.data ?? null;
    } catch {
      if (!IS_TEST_ENV) {
        return null;
      }
      return mockResults.find((r) => r.thesisId === thesisId) || mockResults[0];
    }
  }
}

export const defenseService = new DefenseService();
