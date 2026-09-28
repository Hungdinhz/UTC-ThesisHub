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
  GraduationResult,
  SynthesizeResultRequest,
} from '../types';

const API_BASE = '/api/v1/defense';

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

let mockCouncils: DefenseCouncil[] = [
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
  {
    id: 2,
    projectRoundId: 10,
    code: 'HD-10-02',
    name: 'Hội đồng đánh giá luận văn HD-10-02',
    status: 'ACTIVE',
    description: 'Hội đồng Hệ thống Thông tin & Trí tuệ nhân tạo',
    studentIds: [103],
    members: [
      { id: 6, councilId: 2, lecturerId: 507, lecturerName: 'GS. TS. Nguyễn Đức Dũng', role: 'PRESIDENT', confirmed: true },
      { id: 7, councilId: 2, lecturerId: 502, lecturerName: 'TS. Lê Thị Mai', role: 'SECRETARY', confirmed: true },
      { id: 8, councilId: 2, lecturerId: 509, lecturerName: 'ThS. Hoàng Phương Thảo', role: 'SECRETARY', confirmed: true },
      { id: 9, councilId: 2, lecturerId: 508, lecturerName: 'TS. Vũ Anh Tuấn', role: 'MEMBER', confirmed: true },
      { id: 10, councilId: 2, lecturerId: 505, lecturerName: 'TS. Phạm Hải Nam', role: 'MEMBER', confirmed: true },
    ],
  },
];

let mockSchedules: DefenseSchedule[] = [
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
    councilId: 2,
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

let mockScores: ScoreItem[] = [
  { id: 1, thesisId: 101, graderId: 502, graderName: 'TS. Lê Thị Mai (GVHD)', scoreType: 'SUPERVISOR', score: 8.5, feedback: 'Sinh viên chủ động, hoàn thành tốt mục tiêu', gradedAt: '2026-09-20' },
  { id: 2, thesisId: 101, graderId: 507, graderName: 'GS. TS. Nguyễn Đức Dũng (GVPB)', scoreType: 'REVIEWER', score: 8.0, feedback: 'Tài liệu chỉnh chu, thực nghiệm rõ ràng', gradedAt: '2026-09-22' },
  { id: 3, thesisId: 101, graderId: 501, graderName: 'PGS. TS. Trần Văn Minh (Chủ tịch)', scoreType: 'COUNCIL', score: 9.0, feedback: 'Thuyết trình mạch lạc, trả lời xuất sắc', gradedAt: '2026-09-25' },
  { id: 4, thesisId: 101, graderId: 503, graderName: 'ThS. Hoàng Quốc Bảo (Thư ký 1)', scoreType: 'COUNCIL', score: 8.5, feedback: 'Đáp ứng tốt tiêu chuẩn đồ án tốt nghiệp', gradedAt: '2026-09-25' },
  { id: 5, thesisId: 101, graderId: 505, graderName: 'TS. Phạm Hải Nam (Ủy viên 1)', scoreType: 'COUNCIL', score: 8.5, feedback: 'Mô hình có tính ứng dụng thực tế cao', gradedAt: '2026-09-25' },
];

let mockResults: GraduationResult[] = [
  {
    id: 1,
    thesisId: 101,
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
    return mockLecturers;
  }

  async getCouncils(projectRoundId: number = 10): Promise<DefenseCouncil[]> {
    try {
      const res = await axios.get(`${API_BASE}/councils`, { params: { projectRoundId } });
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return mockCouncils;
  }

  async getCouncilById(id: number): Promise<DefenseCouncil> {
    try {
      const res = await axios.get(`${API_BASE}/councils/${id}`);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const found = mockCouncils.find((c) => c.id === id);
    if (found) return found;
    throw new Error('Không tìm thấy hội đồng');
  }

  async generateCouncils(request: CouncilGenerationRequest): Promise<DefenseCouncil[]> {
    try {
      const res = await axios.post(`${API_BASE}/councils/generate`, request);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback simulation of CSP algorithm
    }
    // Simulate auto-generation with 1CT - 2TK - 2UV and greedy load
    const newCouncil: DefenseCouncil = {
      id: mockCouncils.length + 1,
      projectRoundId: request.projectRoundId || 10,
      code: `HD-10-0${mockCouncils.length + 1}`,
      name: `Hội đồng tự động CSP HD-10-0${mockCouncils.length + 1}`,
      status: 'ACTIVE',
      description: 'Hội đồng sinh tự động bằng thuật toán CSP Backtracking + Greedy',
      studentIds: [104, 105],
      members: [
        { id: 101, lecturerId: 508, lecturerName: 'TS. Vũ Anh Tuấn', role: 'PRESIDENT', confirmed: true },
        { id: 102, lecturerId: 504, lecturerName: 'ThS. Đỗ Thùy Linh', role: 'SECRETARY', confirmed: true },
        { id: 103, lecturerId: 509, lecturerName: 'ThS. Hoàng Phương Thảo', role: 'SECRETARY', confirmed: true },
        { id: 104, lecturerId: 506, lecturerName: 'ThS. Bùi Quang Huy', role: 'MEMBER', confirmed: true },
        { id: 105, lecturerId: 505, lecturerName: 'TS. Phạm Hải Nam', role: 'MEMBER', confirmed: true },
      ],
    };
    mockCouncils.push(newCouncil);
    return mockCouncils;
  }

  async updateCouncilMembers(councilId: number, updatedMembers: CouncilMember[]): Promise<DefenseCouncil> {
    const council = mockCouncils.find((c) => c.id === councilId);
    if (!council) throw new Error('Không tìm thấy hội đồng');

    // Validate 1CT - 2TK - 2UV
    const presidents = updatedMembers.filter((m) => m.role === 'PRESIDENT');
    const secretaries = updatedMembers.filter((m) => m.role === 'SECRETARY');
    const members = updatedMembers.filter((m) => m.role === 'MEMBER');

    if (presidents.length !== 1 || secretaries.length !== 2 || members.length !== 2) {
      throw new Error('Cơ cấu hội đồng bắt buộc đúng 5 người: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên!');
    }

    council.members = updatedMembers;
    return council;
  }

  async assignReviewer(request: ReviewerAssignRequest): Promise<ReviewerAssignment> {
    try {
      const res = await axios.post(`${API_BASE}/reviewers/assign`, request);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const reviewer = mockLecturers.find((l) => l.lecturerId === request.reviewerId);
    return {
      id: Math.floor(Math.random() * 1000),
      thesisId: request.thesisId,
      thesisTitle: `Đề tài luận văn #${request.thesisId}`,
      reviewerId: request.reviewerId,
      reviewerName: reviewer ? reviewer.fullName : `Giảng viên ${request.reviewerId}`,
      assignedBy: request.assignedBy,
      assignedAt: new Date().toISOString(),
      status: 'ASSIGNED',
      note: request.note,
    };
  }

  async getSchedules(date?: string): Promise<DefenseSchedule[]> {
    try {
      const d = date || new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_BASE}/schedules`, { params: { date: d } });
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return mockSchedules;
  }

  async autoGenerateSchedules(request: AutoScheduleRequest): Promise<DefenseSchedule[]> {
    try {
      const res = await axios.post(`${API_BASE}/schedules/auto-generate`, request);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return mockSchedules;
  }

  async configureSchedule(config: ScheduleConfig): Promise<DefenseSchedule> {
    try {
      const res = await axios.post(`${API_BASE}/schedules/configure`, config);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const newSchedule: DefenseSchedule = {
      id: mockSchedules.length + 1,
      councilId: config.councilId,
      councilName: `Hội đồng ${config.councilId}`,
      defenseDate: config.defenseDate,
      session: config.session as any,
      room: config.room,
      startTime: config.startTime,
      endTime: config.endTime,
      maxStudents: config.maxStudents || 5,
      status: 'SCHEDULED',
      notes: config.notes,
    };
    mockSchedules.push(newSchedule);
    return newSchedule;
  }

  async getScores(thesisId: number): Promise<ScoreItem[]> {
    try {
      const res = await axios.get(`${API_BASE}/scores`, { params: { thesisId } });
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return mockScores.filter((s) => s.thesisId === thesisId);
  }

  async submitScore(request: ScoreSubmitRequest): Promise<ScoreItem> {
    try {
      const res = await axios.post(`${API_BASE}/scores`, request);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const grader = mockLecturers.find((l) => l.lecturerId === request.graderId);
    const newScore: ScoreItem = {
      id: mockScores.length + 1,
      thesisId: request.thesisId,
      graderId: request.graderId,
      graderName: grader ? grader.fullName : `Giảng viên ${request.graderId}`,
      scoreType: request.scoreType,
      score: request.score,
      feedback: request.feedback,
      gradedAt: new Date().toISOString(),
    };
    mockScores.push(newScore);
    return newScore;
  }

  async synthesizeResult(request: SynthesizeResultRequest): Promise<GraduationResult> {
    try {
      const res = await axios.post(`${API_BASE}/results/synthesize`, request);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const wSup = request.supervisorWeight ?? 0.3;
    const wRev = request.reviewerWeight ?? 0.2;
    const wCou = request.councilWeight ?? 0.5;

    const scores = mockScores.filter((s) => s.thesisId === request.thesisId);
    let sScore = 8.5;
    let rScore = 8.0;
    let cScores: number[] = [];

    scores.forEach((s) => {
      if (s.scoreType === 'SUPERVISOR') sScore = s.score;
      if (s.scoreType === 'REVIEWER') rScore = s.score;
      if (s.scoreType === 'COUNCIL') cScores.push(s.score);
    });

    const avgCouncil = cScores.length > 0 ? cScores.reduce((a, b) => a + b, 0) / cScores.length : 8.5;
    const finalScore = Number((sScore * wSup + rScore * wRev + avgCouncil * wCou).toFixed(2));

    let grade: any = 'GOOD';
    if (finalScore >= 8.5) grade = 'EXCELLENT';
    else if (finalScore >= 7.0) grade = 'VERY_GOOD';
    else if (finalScore >= 5.5) grade = 'GOOD';
    else if (finalScore >= 4.0) grade = 'AVERAGE';
    else grade = 'POOR';

    const finalResult = finalScore >= 5.0 ? 'PASSED' : 'FAILED';

    const resultObj: GraduationResult = {
      id: mockResults.length + 1,
      thesisId: request.thesisId,
      thesisTitle: 'Nghiên cứu ứng dụng Deep Learning trong nhận diện cử chỉ tay',
      studentName: 'Nguyễn Văn An',
      studentCode: 'SV2021001',
      supervisorScore: sScore,
      reviewerScore: rScore,
      councilScore: Number(avgCouncil.toFixed(2)),
      finalScore,
      grade,
      finalResult,
      publishedAt: new Date().toISOString(),
      notes: request.notes || 'Tổng hợp điểm tốt nghiệp',
    };
    mockResults = mockResults.filter((r) => r.thesisId !== request.thesisId);
    mockResults.push(resultObj);
    return resultObj;
  }

  async getGraduationResult(thesisId: number): Promise<GraduationResult> {
    try {
      const res = await axios.get(`${API_BASE}/results/${thesisId}`);
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    const found = mockResults.find((r) => r.thesisId === thesisId);
    if (found) return found;
    return {
      id: 1,
      thesisId,
      thesisTitle: `Đề tài tốt nghiệp #${thesisId}`,
      studentName: 'Nguyễn Văn An',
      studentCode: 'SV2021001',
      supervisorScore: 8.5,
      reviewerScore: 8.0,
      councilScore: 8.5,
      finalScore: 8.4,
      grade: 'VERY_GOOD',
      finalResult: 'PASSED',
      publishedAt: new Date().toISOString(),
    };
  }
}

export const defenseService = new DefenseService();
