import axios from 'axios';
import type {
  ApiResponse,
  EligibilityCheckResponse,
  ForceApproveRequest,
  DisqualifyRequest,
  ReservationRequestItem,
  ReservationSubmitRequest,
  ReservationReviewRequest,
  FinalDefenseEligibilityResponse,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/eligibility`;

// Mock initial data for UI preview / offline testing
let mockStudents: EligibilityCheckResponse[] = [
  {
    studentId: 101,
    studentCode: 'SV2021001',
    studentName: 'Nguyễn Văn An',
    gpa: 3.45,
    accumulatedCredits: 128,
    unpassedPrerequisites: [],
    eligible: true,
    reason: 'Đạt đầy đủ điều kiện làm đồ án tốt nghiệp',
    status: 'ELIGIBLE',
    projectRoundId: 10,
  },
  {
    studentId: 102,
    studentCode: 'SV2021002',
    studentName: 'Trần Thị Bích',
    gpa: 2.15,
    accumulatedCredits: 102,
    unpassedPrerequisites: ['Học máy nâng cao', 'Công nghệ Web'],
    eligible: false,
    reason: 'Chưa đủ tín chỉ tối thiểu (yêu cầu >= 110) và còn nợ môn tiên quyết',
    status: 'INELIGIBLE',
    projectRoundId: 10,
  },
  {
    studentId: 103,
    studentCode: 'SV2021003',
    studentName: 'Lê Hoàng Cường',
    gpa: 2.92,
    accumulatedCredits: 115,
    unpassedPrerequisites: ['Khai phá dữ liệu'],
    eligible: false,
    reason: 'Còn nợ môn tiên quyết nhưng đã đạt số tín chỉ',
    status: 'PENDING',
    projectRoundId: 10,
  },
  {
    studentId: 104,
    studentCode: 'SV2021004',
    studentName: 'Phạm Minh Đức',
    gpa: 3.68,
    accumulatedCredits: 134,
    unpassedPrerequisites: [],
    eligible: true,
    reason: 'Đạt điều kiện xuất sắc',
    status: 'ELIGIBLE',
    projectRoundId: 10,
  },
  {
    studentId: 105,
    studentCode: 'SV2021005',
    studentName: 'Vũ Hải Yến',
    gpa: 1.85,
    accumulatedCredits: 95,
    unpassedPrerequisites: ['Toán rời rạc', 'Cơ sở dữ liệu'],
    eligible: false,
    reason: 'GPA dưới 2.0 và thiếu tín chỉ',
    status: 'DISQUALIFIED',
    reviewedBy: 'Khoa CNTT',
    reviewedAt: new Date().toISOString(),
    projectRoundId: 10,
  },
];

let mockReservations: ReservationRequestItem[] = [
  {
    id: 1,
    studentId: 102,
    studentCode: 'SV2021002',
    studentName: 'Trần Thị Bích',
    projectRoundId: 10,
    reason: 'Bảo lưu do lý do sức khỏe cần điều trị 1 học kỳ theo chỉ định bác sĩ',
    evidenceFileUrl: 'https://storage.utc.edu.vn/medical_certificate_102.pdf',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    studentId: 103,
    studentCode: 'SV2021003',
    studentName: 'Lê Hoàng Cường',
    projectRoundId: 10,
    reason: 'Tham gia chương trình thực tập kỹ sư tại tập đoàn công nghệ nước ngoài',
    evidenceFileUrl: 'https://storage.utc.edu.vn/internship_offer_103.pdf',
    status: 'APPROVED',
    reviewedBy: 'Trưởng Khoa CNTT',
    reviewNotes: 'Đồng ý cho sinh viên bảo lưu 01 học kỳ để thực tập nâng cao kỹ năng',
    submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class EligibilityService {
  async getAllStudentsEligibility(projectRoundId: number = 10): Promise<EligibilityCheckResponse[]> {
    try {
      const res = await axios.get<ApiResponse<EligibilityCheckResponse[]>>(`${API_BASE}/students`, {
        params: { projectRoundId },
      });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback mock
    }
    return mockStudents.filter((s) => !projectRoundId || s.projectRoundId === projectRoundId);
  }

  async checkThesisEligibility(studentId: number, projectRoundId?: number): Promise<EligibilityCheckResponse> {
    try {
      const res = await axios.get<ApiResponse<EligibilityCheckResponse>>(`${API_BASE}/check`, {
        params: { studentId, projectRoundId },
      });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const found = mockStudents.find((s) => s.studentId === studentId);
    if (found) return found;
    return {
      studentId,
      studentCode: `SV${studentId}`,
      studentName: `Sinh viên ${studentId}`,
      gpa: 2.8,
      accumulatedCredits: 112,
      unpassedPrerequisites: [],
      eligible: true,
      reason: 'Đủ điều kiện làm đồ án',
      status: 'ELIGIBLE',
    };
  }

  async forceApprove(request: ForceApproveRequest): Promise<EligibilityCheckResponse> {
    try {
      const res = await axios.post<ApiResponse<EligibilityCheckResponse>>(`${API_BASE}/force-approve`, request);
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const idx = mockStudents.findIndex((s) => s.studentId === request.studentId);
    if (idx !== -1) {
      mockStudents[idx] = {
        ...mockStudents[idx],
        eligible: true,
        status: 'FORCE_APPROVED',
        reason: `Duyệt đặc cách: ${request.reason}`,
        reviewedBy: request.approvedBy,
        reviewedAt: new Date().toISOString(),
      };
      return mockStudents[idx];
    }
    throw new Error('Không tìm thấy sinh viên');
  }

  async disqualify(request: DisqualifyRequest): Promise<EligibilityCheckResponse> {
    try {
      const res = await axios.post<ApiResponse<EligibilityCheckResponse>>(`${API_BASE}/disqualify`, request);
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const idx = mockStudents.findIndex((s) => s.studentId === request.studentId);
    if (idx !== -1) {
      mockStudents[idx] = {
        ...mockStudents[idx],
        eligible: false,
        status: 'DISQUALIFIED',
        reason: `Loại khỏi đợt: ${request.reason}`,
        reviewedBy: request.disqualifiedBy,
        reviewedAt: new Date().toISOString(),
      };
      return mockStudents[idx];
    }
    throw new Error('Không tìm thấy sinh viên');
  }

  async getReservations(params?: {
    studentId?: number;
    projectRoundId?: number;
    status?: string;
  }): Promise<ReservationRequestItem[]> {
    try {
      const res = await axios.get<ApiResponse<ReservationRequestItem[]>>(`${API_BASE}/reservations`, { params });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    let filtered = [...mockReservations];
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params?.studentId) {
      filtered = filtered.filter((r) => r.studentId === params.studentId);
    }
    return filtered;
  }

  async submitReservation(request: ReservationSubmitRequest): Promise<ReservationRequestItem> {
    try {
      const res = await axios.post<ApiResponse<ReservationRequestItem>>(`${API_BASE}/reservations`, request);
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const newReq: ReservationRequestItem = {
      id: mockReservations.length + 1,
      studentId: request.studentId,
      studentCode: `SV202100${request.studentId}`,
      studentName: `Sinh viên ${request.studentId}`,
      projectRoundId: request.projectRoundId,
      reason: request.reason,
      evidenceFileUrl: request.evidenceFileUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    mockReservations.unshift(newReq);
    return newReq;
  }

  async reviewReservation(id: number, request: ReservationReviewRequest): Promise<ReservationRequestItem> {
    try {
      const res = await axios.put<ApiResponse<ReservationRequestItem>>(`${API_BASE}/reservations/${id}/review`, request);
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const item = mockReservations.find((r) => r.id === id);
    if (item) {
      item.status = request.status;
      item.reviewNotes = request.reviewNotes;
      item.reviewedBy = request.reviewedBy;
      item.reviewedAt = new Date().toISOString();
      return item;
    }
    throw new Error('Không tìm thấy đơn bảo lưu');
  }

  async checkFinalDefenseEligibility(params: {
    thesisId?: number;
    studentId?: number;
  }): Promise<FinalDefenseEligibilityResponse> {
    try {
      const res = await axios.get<ApiResponse<FinalDefenseEligibilityResponse>>(`${API_BASE}/final-defense`, {
        params,
      });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    // Realistic mock
    const tId = params.thesisId || 101;
    const sId = params.studentId || 101;
    const isOk = tId % 2 !== 0;

    return {
      thesisId: tId,
      thesisTitle: 'Nghiên cứu ứng dụng Deep Learning trong nhận diện cử chỉ tay',
      studentId: sId,
      studentCode: `SV202100${sId}`,
      studentName: 'Nguyễn Văn An',
      supervisorScore: isOk ? 8.5 : 4.5,
      reviewerScore: isOk ? 8.0 : 6.0,
      plagiarismRate: isOk ? 11.5 : 26.2,
      allProgressStagesCompleted: isOk,
      eligibleForDefense: isOk,
      reasons: isOk
        ? ['Đã hoàn thành toàn bộ các yêu cầu bảo vệ cuối kỳ']
        : [
            'Điểm GVHD dưới 5.0 (yêu cầu >= 5.0)',
            'Tỷ lệ tương đồng đạo văn vượt ngưỡng cho phép 26.2% (> 20.0%)',
          ],
    };
  }
}

export const eligibilityService = new EligibilityService();
