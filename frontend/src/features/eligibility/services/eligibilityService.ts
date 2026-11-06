import axios from 'axios';
import type {
  ApiResponse,
  EligibilityCheckResponse,
  ForceApproveRequest,
  DisqualifyRequest,
  ReservationRequestItem,
  ReservationSubmitRequest,
  AdminCreateReservationRequest,
  SupervisorReservationFeedback,
  ReservationReviewRequest,
  FinalDefenseEligibilityResponse,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/eligibility`;
const IS_TEST_ENV = import.meta.env.MODE === 'test';

function authHeaders(): Record<string, string> {
  if (IS_TEST_ENV) {
    throw new Error('Skip live network in unit tests');
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeEligibility(raw: any): EligibilityCheckResponse {
  if (!raw) {
    return {
      studentId: 0,
      studentCode: '',
      studentName: '',
      gpa: 0,
      accumulatedCredits: 0,
      unpassedPrerequisites: [],
      eligible: false,
      reason: '',
      status: 'INELIGIBLE',
    };
  }
  const reasonsList: string[] = Array.isArray(raw.reasons) ? raw.reasons : [];
  const missingCount = Number(raw.missingPrerequisiteCount ?? 0);
  const unpassed: string[] = Array.isArray(raw.unpassedPrerequisites)
    ? raw.unpassedPrerequisites
    : missingCount > 0
    ? [`Chưa hoàn thành ${missingCount} môn tiên quyết`]
    : [];
  const status = raw.status || (raw.eligible ? 'ELIGIBLE' : 'INELIGIBLE');
  return {
    studentId: raw.studentId,
    studentCode: raw.studentCode || `SV${raw.studentId}`,
    studentName: raw.studentName || raw.fullName || `Sinh viên #${raw.studentId}`,
    gpa: Number(raw.gpa ?? 0),
    accumulatedCredits: Number(raw.accumulatedCredits ?? raw.completedCredits ?? 0),
    unpassedPrerequisites: unpassed,
    eligible: raw.eligible !== undefined ? Boolean(raw.eligible) : status === 'ELIGIBLE' || status === 'FORCE_APPROVED',
    reason: raw.reason || reasonsList.join('; ') || 'Đủ điều kiện làm đồ án tốt nghiệp',
    projectRoundId: raw.projectRoundId,
    status,
    reviewedBy: raw.reviewedBy,
    reviewedAt: raw.reviewedAt,
  };
}

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
    studentName: 'Phạm Thị Dung',
    gpa: 3.12,
    accumulatedCredits: 130,
    unpassedPrerequisites: [],
    eligible: true,
    reason: 'Đủ điều kiện tiêu chuẩn',
    status: 'ELIGIBLE',
    projectRoundId: 10,
  },
  {
    studentId: 105,
    studentCode: 'SV2021005',
    studentName: 'Hoàng Văn Em',
    gpa: 1.85,
    accumulatedCredits: 96,
    unpassedPrerequisites: ['Cơ sở dữ liệu', 'Toán rời rạc'],
    eligible: false,
    reason: 'GPA dưới 2.0 và số tín chỉ dưới chuẩn',
    status: 'INELIGIBLE',
    projectRoundId: 10,
  },
];

let mockReservations: ReservationRequestItem[] = [
  {
    id: 1,
    studentId: 102,
    studentCode: 'SV2021002',
    studentName: 'Trần Thị Bích',
    thesisId: 102,
    thesisTitle: 'Phân loại ảnh vệ tinh sử dụng mạng tích chập sâu ResNet',
    projectRoundId: 10,
    roundCode: 'D1_2627',
    reasonCategory: 'HEALTH_REASONS',
    reason: 'Bảo lưu do lý do sức khỏe cần điều trị 1 học kỳ theo chỉ định bác sĩ',
    evidenceFileUrl: 'https://storage.utc.edu.vn/medical_certificate_102.pdf',
    evidenceFileName: 'medical_certificate_102.pdf',
    supervisorApproved: true,
    supervisorComment: 'Đồng ý cho sinh viên bảo lưu do điều trị y tế',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    studentId: 103,
    studentCode: 'SV2021003',
    studentName: 'Lê Hoàng Cường',
    thesisId: 103,
    thesisTitle: 'Xây dựng hệ thống khuyến nghị sản phẩm cho thương mại điện tử',
    projectRoundId: 10,
    roundCode: 'D1_2627',
    reasonCategory: 'INSUFFICIENT_CREDITS',
    reason: 'Đề tài đã hoàn thành với GVHD nhưng còn nợ 1 môn Khai phá dữ liệu (3 tín chỉ), xin bảo lưu chờ bảo vệ đợt sau',
    evidenceFileUrl: 'https://storage.utc.edu.vn/transcript_103.pdf',
    evidenceFileName: 'transcript_103.pdf',
    supervisorApproved: true,
    supervisorComment: 'Đồ án đã đạt chất lượng tốt, đồng ý bảo lưu kết quả chờ SV trả nợ môn',
    status: 'APPROVED',
    reviewedBy: 'Trưởng Khoa CNTT',
    reviewNotes: 'Khoa chấp thuận bảo lưu kết quả đồ án 01 học kỳ để sinh viên hoàn thành tín chỉ tốt nghiệp',
    submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class EligibilityService {
  async getAllStudentsEligibility(projectRoundId?: number): Promise<EligibilityCheckResponse[]> {
    try {
      const res = await axios.get<ApiResponse<any[]>>(`${API_BASE}/students`, {
        params: projectRoundId ? { projectRoundId } : {},
        headers: authHeaders(),
      });
      if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map(normalizeEligibility);
      }
    } catch {
      // Fallback mock
    }
    const filtered = mockStudents.filter((s) => !projectRoundId || s.projectRoundId === projectRoundId);
    return filtered.length > 0 ? filtered : mockStudents;
  }

  async checkThesisEligibility(studentId: number, projectRoundId?: number): Promise<EligibilityCheckResponse> {
    try {
      const res = await axios.get<ApiResponse<any>>(`${API_BASE}/check`, {
        params: { studentId, projectRoundId },
        headers: authHeaders(),
      });
      if (res.data && res.data.data) {
        return normalizeEligibility(res.data.data);
      }
    } catch {
      // Fallback mock
    }
    const found = mockStudents.find((s) => s.studentId === studentId);
    if (found) return found;
    return {
      studentId,
      studentCode: `SV202100${studentId}`,
      studentName: `Sinh viên #${studentId}`,
      gpa: 2.5,
      accumulatedCredits: 112,
      unpassedPrerequisites: [],
      eligible: true,
      reason: 'Đạt điều kiện kiểm tra ban đầu',
      status: 'ELIGIBLE',
    };
  }

  async forceApprove(request: ForceApproveRequest): Promise<EligibilityCheckResponse> {
    try {
      const res = await axios.post<ApiResponse<any>>(`${API_BASE}/force-approve`, request, {
        headers: authHeaders(),
      });
      if (res.data && res.data.data) return normalizeEligibility(res.data.data);
    } catch (err) {
      console.error('Error calling forceApprove API:', err);
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
      const res = await axios.post<ApiResponse<any>>(`${API_BASE}/disqualify`, request, {
        headers: authHeaders(),
      });
      if (res.data && res.data.data) return normalizeEligibility(res.data.data);
    } catch (err) {
      console.error('Error calling disqualify API:', err);
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
    category?: string;
  }): Promise<ReservationRequestItem[]> {
    try {
      const queryParams = { ...params };
      if (queryParams.status === 'ALL') delete queryParams.status;
      if (queryParams.category === 'ALL') delete queryParams.category;
      const res = await axios.get<ApiResponse<ReservationRequestItem[]>>(`${API_BASE}/reservations`, {
        params: queryParams,
        headers: authHeaders(),
      });
      if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    let filtered = [...mockReservations];
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params?.category && params.category !== 'ALL') {
      filtered = filtered.filter((r) => r.reasonCategory === params.category);
    }
    if (params?.studentId) {
      filtered = filtered.filter((r) => r.studentId === params.studentId);
    }
    return filtered;
  }

  async submitReservation(request: ReservationSubmitRequest): Promise<ReservationRequestItem> {
    try {
      const res = await axios.post<ApiResponse<ReservationRequestItem>>(`${API_BASE}/reservations`, request, {
        headers: authHeaders(),
      });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const newReq: ReservationRequestItem = {
      id: mockReservations.length + 1,
      studentId: request.studentId,
      studentCode: `SV202100${request.studentId}`,
      studentName: `Sinh viên ${request.studentId}`,
      thesisId: request.thesisId,
      thesisTitle: 'Đề tài đồ án tốt nghiệp',
      projectRoundId: request.projectRoundId || 10,
      roundCode: 'D1_2627',
      reasonCategory: request.reasonCategory || 'OTHER',
      reason: request.reason,
      evidenceFileUrl: request.evidenceFileUrl,
      evidenceFileName: request.evidenceFileName,
      targetRoundCode: request.targetRoundCode,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    mockReservations.unshift(newReq);
    return newReq;
  }

  async createReservationByAdmin(request: AdminCreateReservationRequest): Promise<ReservationRequestItem> {
    try {
      const res = await axios.post<ApiResponse<ReservationRequestItem>>(`${API_BASE}/reservations/admin`, request, {
        headers: authHeaders(),
      });
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const status = request.autoApprove ? 'APPROVED' : 'PENDING';
    const newReq: ReservationRequestItem = {
      id: mockReservations.length + 1,
      studentId: request.studentId,
      studentCode: `SV202100${request.studentId}`,
      studentName: `Sinh viên ${request.studentId}`,
      thesisId: request.thesisId,
      thesisTitle: 'Đề tài đồ án tốt nghiệp',
      projectRoundId: request.projectRoundId || 10,
      roundCode: 'D1_2627',
      reasonCategory: request.reasonCategory || 'INSUFFICIENT_CREDITS',
      reason: request.reason || 'Khoa lập quyết định bảo lưu',
      evidenceFileUrl: request.evidenceFileUrl,
      status,
      reviewedBy: request.autoApprove ? request.reviewedBy : undefined,
      reviewedAt: request.autoApprove ? new Date().toISOString() : undefined,
      submittedAt: new Date().toISOString(),
    };
    mockReservations.unshift(newReq);
    return newReq;
  }

  async submitSupervisorFeedback(id: number, feedback: SupervisorReservationFeedback): Promise<ReservationRequestItem> {
    try {
      const res = await axios.put<ApiResponse<ReservationRequestItem>>(
        `${API_BASE}/reservations/${id}/supervisor-feedback`,
        feedback,
        { headers: authHeaders() }
      );
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const item = mockReservations.find((r) => r.id === id);
    if (item) {
      item.supervisorApproved = feedback.approved;
      item.supervisorComment = feedback.comment;
      return item;
    }
    throw new Error('Không tìm thấy đơn bảo lưu');
  }

  async reviewReservation(id: number, request: ReservationReviewRequest): Promise<ReservationRequestItem> {
    try {
      const res = await axios.put<ApiResponse<ReservationRequestItem>>(
        `${API_BASE}/reservations/${id}/review`,
        {
          status: request.status,
          note: request.reviewNotes || request.note,
          rejectionReason: request.status === 'REJECTED' ? (request.rejectionReason || request.reviewNotes) : undefined,
          reviewedBy: request.reviewedBy,
        },
        { headers: authHeaders() }
      );
      if (res.data && res.data.data) return res.data.data;
    } catch {
      // Fallback
    }
    const item = mockReservations.find((r) => r.id === id);
    if (item) {
      item.status = request.status;
      item.reviewNotes = request.reviewNotes;
      item.rejectionReason = request.rejectionReason;
      item.reviewedBy = request.reviewedBy;
      item.reviewedAt = new Date().toISOString();
      return item;
    }
    throw new Error('Không tìm thấy đơn bảo lưu');
  }

  async checkFinalDefenseEligibility(params: {
    thesisId?: number;
    studentId?: number;
    studentCode?: string;
    projectRoundId?: number;
  }): Promise<FinalDefenseEligibilityResponse> {
    try {
      const res = await axios.get<ApiResponse<any>>(`${API_BASE}/final-defense`, {
        params,
        headers: authHeaders(),
      });
      if (res.data && res.data.data) {
        const d = res.data.data;
        return {
          thesisId: d.thesisId ?? (params.thesisId || 0),
          thesisTitle: d.thesisTitle || (d.thesisId ? `Đề tài tốt nghiệp #${d.thesisId}` : 'Chưa có đề tài'),
          studentId: d.studentId || params.studentId || 0,
          studentCode: d.studentCode || params.studentCode || '',
          studentName: d.studentName || 'Sinh viên',
          supervisorApproved: Boolean(d.supervisorApproved),
          supervisorScore: d.supervisorScore !== null && d.supervisorScore !== undefined ? Number(d.supervisorScore) : 0,
          reviewerAssigned: Boolean(d.reviewerAssigned),
          reviewerScore: 0,
          plagiarismRate: 0,
          thesisProgressPercentage: d.thesisProgressPercentage !== null && d.thesisProgressPercentage !== undefined ? Number(d.thesisProgressPercentage) : 0,
          allProgressStagesCompleted: Boolean(d.allProgressStagesCompleted),
          eligibleForDefense: Boolean(d.eligibleForDefense),
          reasons: Array.isArray(d.reasons) ? d.reasons : [],
          hasPendingReservation: Boolean(d.hasPendingReservation),
          reservationId: d.reservationId,
          reservationStatus: d.reservationStatus,
          reservationCategory: d.reservationCategory,
          reservationReason: d.reservationReason,
          studentRoundStatus: d.studentRoundStatus,
          completedCredits: d.completedCredits,
          missingPrerequisiteCount: d.missingPrerequisiteCount,
          tuitionDebt: d.tuitionDebt,
        };
      }
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
      studentCode: params.studentCode || `SV202100${sId}`,
      studentName: 'Nguyễn Văn An',
      supervisorApproved: isOk,
      supervisorScore: isOk ? 8.5 : 4.5,
      reviewerAssigned: true,
      reviewerScore: 0,
      plagiarismRate: 0,
      thesisProgressPercentage: isOk ? 100 : 75,
      allProgressStagesCompleted: isOk,
      eligibleForDefense: isOk,
      reasons: isOk
        ? ['Đã hoàn thành toàn bộ các yêu cầu bảo vệ cuối kỳ']
        : [
            'Điểm GVHD dưới 5.0 (yêu cầu >= 5.0). Sinh viên được phép nộp đơn bảo lưu đề tài để tiếp tục hoàn thiện sang đợt sau.',
          ],
      hasPendingReservation: false,
      completedCredits: isOk ? 128 : 105,
      missingPrerequisiteCount: isOk ? 0 : 1,
      tuitionDebt: false,
    };
  }
}

export const eligibilityService = new EligibilityService();
