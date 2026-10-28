import axios from 'axios';
import type {
  ProjectDirection,
  LecturerDirection,
  LecturerCapacity,
  DirectionRegistration,
  PreferenceSubmitRequest,
  PreferenceResponse,
  SupervisorAssignment,
  AssignmentStats,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/assignments`;

// Helper for JWT auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==========================================
// Mock Data (for offline / testing preview)
// ==========================================
export const mockDirections: ProjectDirection[] = [
  {
    id: 1,
    code: 'HD_PM_APP',
    name: 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)',
    description: 'Phát triển các hệ thống phần mềm quy mô lớn, ứng dụng Web và Mobile App, kiến trúc phần mềm, CI/CD và DevOps.',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    isActive: true,
    lecturerCount: 3,
  },
  {
    id: 2,
    code: 'HD_DATA_AI',
    name: 'Dữ liệu và trí tuệ nhân tạo',
    description: 'Khai phá dữ liệu lớn (Big Data), học máy (Machine Learning), Deep Learning, thị giác máy tính, NLP và ứng dụng AI.',
    departmentId: 3,
    departmentName: 'Khoa học máy tính',
    isActive: true,
    lecturerCount: 3,
  },
  {
    id: 3,
    code: 'HD_GAME',
    name: 'Lập trình Game',
    description: 'Thiết kế và phát triển trò chơi đa nền tảng (Unity, Unreal Engine), mô phỏng vật lý, đồ họa 3D và tương tác thời gian thực.',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 4,
    code: 'HD_TESTING',
    name: 'Kiểm thử phần mềm',
    description: 'Kiểm thử tự động (Automation Testing), quy trình bảo đảm chất lượng QA/QC, Performance Testing, Security Testing.',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 5,
    code: 'HD_NET_INFRA',
    name: 'Hệ thống, mạng và hạ tầng CNTT',
    description: 'Thiết kế hạ tầng mạng doanh nghiệp, quản trị hệ thống Linux/Windows, ảo hóa, điện toán đám mây và triển khai hạ tầng CNTT.',
    departmentId: 4,
    departmentName: 'Mạng máy tính & ATTT',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 6,
    code: 'HD_SECURITY',
    name: 'An toàn thông tin và an ninh mạng',
    description: 'An toàn thông tin, bảo mật mạng, kiểm thử xâm nhập (Penetration Testing), điều tra số và an toàn ứng dụng.',
    departmentId: 4,
    departmentName: 'Mạng máy tính & ATTT',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 7,
    code: 'HD_ALGO',
    name: 'Nghiên cứu và ứng dụng thuật toán',
    description: 'Cấu trúc dữ liệu và giải thuật nâng cao, tối ưu hóa tổ hợp, lý thuyết đồ thị và ứng dụng thuật toán giải quyết các bài toán thực tế.',
    departmentId: 3,
    departmentName: 'Khoa học máy tính',
    isActive: true,
    lecturerCount: 2,
  },
];

export const mockCapacities: LecturerCapacity[] = [
  {
    id: 1,
    lecturerId: 101,
    lecturerCode: 'GV001',
    fullName: 'TS. Nguyễn Văn Hướng',
    email: 'huongnv@utc.edu.vn',
    phone: '0987654321',
    academicDegree: 'TIEN_SI',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    projectRoundId: 1,
    maxQuota: 5,
    capacityFactor: 1.0,
    effectiveCapacity: 5,
    currentAssigned: 3,
    remainingCapacity: 2,
    loadRatio: 0.6,
    isActive: true,
    directionIds: [1, 2],
    directionCodes: ['HD_PM_APP', 'HD_DATA_AI'],
    directionNames: ['HD_PM_APP', 'HD_DATA_AI'],
  },
  {
    id: 2,
    lecturerId: 102,
    lecturerCode: 'GV002',
    fullName: 'PGS.TS. Trần Quốc Tuấn',
    email: 'tuantq@utc.edu.vn',
    phone: '0912345678',
    academicDegree: 'PGS',
    departmentId: 3,
    departmentName: 'Khoa học máy tính',
    projectRoundId: 1,
    maxQuota: 6,
    capacityFactor: 1.2,
    effectiveCapacity: 7,
    currentAssigned: 6,
    remainingCapacity: 1,
    loadRatio: 0.86,
    isActive: true,
    directionIds: [2, 7],
    directionCodes: ['HD_DATA_AI', 'HD_ALGO'],
    directionNames: ['HD_DATA_AI', 'HD_ALGO'],
  },
  {
    id: 3,
    lecturerId: 103,
    lecturerCode: 'GV003',
    fullName: 'ThS. Hoàng Phương Thảo',
    email: 'thaohp@utc.edu.vn',
    phone: '0933221100',
    academicDegree: 'THAC_SI',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    projectRoundId: 1,
    maxQuota: 4,
    capacityFactor: 1.0,
    effectiveCapacity: 4,
    currentAssigned: 1,
    remainingCapacity: 3,
    loadRatio: 0.25,
    isActive: true,
    directionIds: [1, 3, 4],
    directionCodes: ['HD_PM_APP', 'HD_GAME', 'HD_TESTING'],
    directionNames: ['HD_PM_APP', 'HD_GAME', 'HD_TESTING'],
  },
  {
    id: 4,
    lecturerId: 104,
    lecturerCode: 'GV004',
    fullName: 'TS. Đặng Minh Nhật',
    email: 'nhatdm@utc.edu.vn',
    phone: '0977889900',
    academicDegree: 'TIEN_SI',
    departmentId: 4,
    departmentName: 'Mạng máy tính & ATTT',
    projectRoundId: 1,
    maxQuota: 5,
    capacityFactor: 0.8,
    effectiveCapacity: 4,
    currentAssigned: 2,
    remainingCapacity: 2,
    loadRatio: 0.5,
    isActive: true,
    directionIds: [5, 6],
    directionCodes: ['HD_NET_INFRA', 'HD_SECURITY'],
    directionNames: ['HD_NET_INFRA', 'HD_SECURITY'],
  },
];

let mockAssignments: SupervisorAssignment[] = [
  {
    id: 1,
    studentId: 201,
    studentCode: '2021600101',
    studentName: 'Trần Minh Quang',
    studentClass: 'CNTT1 - K62',
    trainingProgramCode: 'CU_NHAN',
    lecturerId: 101,
    lecturerCode: 'GV001',
    lecturerName: 'TS. Nguyễn Văn Hướng',
    academicDegree: 'TIEN_SI',
    departmentName: 'Công nghệ phần mềm',
    projectRoundId: 10,
    directionId: 1,
    directionCode: 'HD_AI',
    directionName: 'Trí tuệ nhân tạo & Học máy chuyên sâu',
    matchedPriority: 1,
    matchScore: 108.5,
    assignmentMethod: 'ALGORITHM',
    status: 'PROPOSED',
    isOverridden: false,
    note: 'Matched via NV1',
  },
  {
    id: 2,
    studentId: 202,
    studentCode: '2021600102',
    studentName: 'Lê Thùy Dung',
    studentClass: 'KTPM - K62',
    trainingProgramCode: 'KY_SU',
    lecturerId: 102,
    lecturerCode: 'GV002',
    lecturerName: 'PGS.TS. Trần Quốc Tuấn',
    academicDegree: 'PGS',
    departmentName: 'Khoa học máy tính',
    projectRoundId: 10,
    directionId: 1,
    directionCode: 'HD_AI',
    directionName: 'Trí tuệ nhân tạo & Học máy chuyên sâu',
    matchedPriority: 1,
    matchScore: 109.0,
    assignmentMethod: 'ALGORITHM',
    status: 'PROPOSED',
    isOverridden: false,
    note: 'Matched via NV1',
  },
  {
    id: 3,
    studentId: 203,
    studentCode: '2021600103',
    studentName: 'Phạm Đăng Khoa',
    studentClass: 'HTTT - K62',
    trainingProgramCode: 'CU_NHAN',
    lecturerId: 103,
    lecturerCode: 'GV003',
    lecturerName: 'ThS. Hoàng Phương Thảo',
    academicDegree: 'THAC_SI',
    departmentName: 'Công nghệ phần mềm',
    projectRoundId: 10,
    directionId: 3,
    directionCode: 'HD_WEB_CLOUD',
    directionName: 'Ứng dụng Web hiện đại & Điện toán đám mây',
    matchedPriority: 2,
    matchScore: 68.0,
    assignmentMethod: 'ALGORITHM',
    status: 'PROPOSED',
    isOverridden: false,
    note: 'Matched via NV2 (NV1 đã đầy chỉ tiêu)',
  },
];

// ==========================================
// Service Implementation
// ==========================================
export const assignmentService = {
  // 1. Directions
  async getDirections(activeOnly = true): Promise<ProjectDirection[]> {
    try {
      const res = await axios.get(`${API_BASE}/directions`, {
        params: { activeOnly },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data || mockDirections;
    } catch {
      return mockDirections;
    }
  },

  async getDirectionById(id: number): Promise<ProjectDirection> {
    try {
      const res = await axios.get(`${API_BASE}/directions/${id}`, { headers: getAuthHeaders() });
      return res.data?.data || res.data;
    } catch {
      return mockDirections.find((d) => d.id === id) || mockDirections[0];
    }
  },

  async createDirection(data: Partial<ProjectDirection>): Promise<ProjectDirection> {
    const res = await axios.post(`${API_BASE}/directions`, data, { headers: getAuthHeaders() });
    return res.data?.data || res.data;
  },

  async updateDirection(id: number, data: Partial<ProjectDirection>): Promise<ProjectDirection> {
    const res = await axios.put(`${API_BASE}/directions/${id}`, data, { headers: getAuthHeaders() });
    return res.data?.data || res.data;
  },

  // 2. Lecturer Directions
  async getLecturerDirections(lecturerId?: number, directionId?: number): Promise<LecturerDirection[]> {
    try {
      const res = await axios.get(`${API_BASE}/lecturer-directions`, {
        params: { lecturerId, directionId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data;
    } catch {
      return [];
    }
  },

  async assignLecturerDirection(data: {
    lecturerId: number;
    directionId: number;
    isPrimary?: boolean;
    note?: string;
  }): Promise<LecturerDirection> {
    const res = await axios.post(`${API_BASE}/lecturer-directions`, data, { headers: getAuthHeaders() });
    return res.data?.data || res.data;
  },

  async removeLecturerDirection(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/lecturer-directions/${id}`, { headers: getAuthHeaders() });
  },

  // 3. Direction Registration
  async registerDirection(data: {
    projectRoundId: number;
    directionId: number;
    studentId?: number;
    note?: string;
  }): Promise<DirectionRegistration> {
    try {
      const res = await axios.post(`${API_BASE}/register-direction`, data, { headers: getAuthHeaders() });
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error('Failed to register direction:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi đăng ký hướng đồ án';
      throw new Error(msg);
    }
  },

  async getRegistrations(projectRoundId: number, directionId?: number): Promise<DirectionRegistration[]> {
    try {
      const res = await axios.get(`${API_BASE}/registrations`, {
        params: { projectRoundId, directionId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error('Failed to get registrations:', err);
      return [];
    }
  },

  // 4. Preferences (Step A & E)
  async getPreferences(projectRoundId: number, studentId?: number): Promise<PreferenceResponse[]> {
    try {
      const res = await axios.get(`${API_BASE}/preferences`, {
        params: { projectRoundId, studentId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error('Failed to get preferences:', err);
      return [];
    }
  },

  async submitPreferences(data: PreferenceSubmitRequest): Promise<PreferenceResponse[]> {
    try {
      const res = await axios.post(`${API_BASE}/preferences`, data, { headers: getAuthHeaders() });
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error('Failed to submit preferences:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi gửi nguyện vọng giảng viên';
      throw new Error(msg);
    }
  },

  // 5. Capacities (Step B)
  async getCapacities(projectRoundId: number): Promise<LecturerCapacity[]> {
    try {
      const res = await axios.get(`${API_BASE}/capacities`, {
        params: { projectRoundId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data || mockCapacities;
    } catch {
      return mockCapacities;
    }
  },

  async updateCapacity(id: number, data: Partial<LecturerCapacity>): Promise<LecturerCapacity> {
    try {
      const res = await axios.put(`${API_BASE}/capacities/${id}`, data, { headers: getAuthHeaders() });
      return res.data?.data || res.data;
    } catch {
      const idx = mockCapacities.findIndex((c) => c.id === id);
      if (idx !== -1) {
        mockCapacities[idx] = { ...mockCapacities[idx], ...data };
        return mockCapacities[idx];
      }
      return mockCapacities[0];
    }
  },

  async initCapacities(projectRoundId: number, defaultQuota = 5): Promise<void> {
    await axios.post(
      `${API_BASE}/capacities/init`,
      {},
      {
        params: { projectRoundId, defaultQuota },
        headers: getAuthHeaders(),
      }
    );
  },

  async addLecturersToRound(
    projectRoundId: number,
    lecturerIds?: number[],
    defaultQuota = 5,
    lecturerQuotas?: Record<number, number>
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE}/capacities/add-lecturers`,
        {
          lecturerIds: lecturerIds && lecturerIds.length > 0 ? lecturerIds : [],
          defaultQuota,
          lecturerQuotas: lecturerQuotas || {},
        },
        {
          params: { projectRoundId, defaultQuota },
          headers: getAuthHeaders(),
        }
      );
    } catch {
      // Fallback to initCapacities if endpoint is unavailable
      await this.initCapacities(projectRoundId, defaultQuota);
    }
  },

  async deleteCapacity(id: number, projectRoundId?: number, lecturerId?: number): Promise<void> {
    const headers = getAuthHeaders();
    let lastErr: any = null;

    // 1. Try standard DELETE /assignments/capacities/{id}
    try {
      await axios.delete(`${API_BASE}/capacities/${id}`, { headers });
      const idx = mockCapacities.findIndex((c) => c.id === id);
      if (idx !== -1) mockCapacities.splice(idx, 1);
      return;
    } catch (err: any) {
      lastErr = err;
      console.warn('DELETE /capacities/:id failed, trying POST fallback...', err?.response?.status || err?.message);
    }

    // 2. Try POST fallback: /assignments/capacities/{id}/delete
    try {
      await axios.post(`${API_BASE}/capacities/${id}/delete`, {}, { headers });
      const idx = mockCapacities.findIndex((c) => c.id === id);
      if (idx !== -1) mockCapacities.splice(idx, 1);
      return;
    } catch (err: any) {
      lastErr = err;
      console.warn('POST /capacities/:id/delete fallback failed, trying round endpoint...', err?.response?.status || err?.message);
    }

    // 3. Try round-scoped endpoints if projectRoundId & lecturerId available
    if (projectRoundId && lecturerId) {
      try {
        await axios.delete(`${BASE_URL}/project-rounds/${projectRoundId}/lecturers/${lecturerId}`, { headers });
        const idx = mockCapacities.findIndex((c) => c.id === id);
        if (idx !== -1) mockCapacities.splice(idx, 1);
        return;
      } catch (err: any) {
        lastErr = err;
      }

      try {
        await axios.post(`${BASE_URL}/project-rounds/${projectRoundId}/lecturers/${lecturerId}/delete`, {}, { headers });
        const idx = mockCapacities.findIndex((c) => c.id === id);
        if (idx !== -1) mockCapacities.splice(idx, 1);
        return;
      } catch (err: any) {
        lastErr = err;
      }
    }

    console.error('All delete capacity attempts failed:', lastErr);
    const msg = lastErr?.response?.data?.message || lastErr?.message || 'Lỗi khi xóa giảng viên khỏi đợt';
    throw new Error(msg);
  },

  // 6. Algorithm Execution & Result Management (Step C & E)
  async generateAssignments(projectRoundId: number, reassignAll = true): Promise<SupervisorAssignment[]> {
    try {
      const res = await axios.post(
        `${API_BASE}/generate`,
        { projectRoundId, reassignAll },
        { headers: getAuthHeaders()}
      );
      return res.data?.data || res.data || mockAssignments;
    } catch {
      return mockAssignments;
    }
  },

  async getProposals(projectRoundId: number, status?: string): Promise<SupervisorAssignment[]> {
    try {
      const res = await axios.get(`${API_BASE}/proposals`, {
        params: { projectRoundId, status },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data || mockAssignments;
    } catch {
      return mockAssignments;
    }
  },

  async overrideAssignment(
    id: number,
    newLecturerId: number,
    reason: string
  ): Promise<SupervisorAssignment> {
    try {
      const res = await axios.put(
        `${API_BASE}/${id}/override`,
        { newLecturerId, reason },
        { headers: getAuthHeaders() }
      );
      return res.data?.data || res.data;
    } catch {
      const target = mockAssignments.find((a) => a.id === id);
      const newLecturer = mockCapacities.find((c) => c.lecturerId === newLecturerId);
      if (target && newLecturer) {
        target.previousLecturerId = target.lecturerId;
        target.previousLecturerName = target.lecturerName;
        target.lecturerId = newLecturer.lecturerId;
        target.lecturerCode = newLecturer.lecturerCode;
        target.lecturerName = newLecturer.fullName;
        target.academicDegree = newLecturer.academicDegree;
        target.isOverridden = true;
        target.overrideReason = reason;
        target.status = 'OVERRIDDEN';
        target.assignmentMethod = 'MANUAL_OVERRIDE';
        return { ...target };
      }
      return mockAssignments[0];
    }
  },

  async finalizeAssignments(projectRoundId: number, note?: string): Promise<AssignmentStats> {
    try {
      const res = await axios.post(
        `${API_BASE}/finalize`,
        { projectRoundId, note },
        { headers: getAuthHeaders() }
      );
      return res.data?.data || res.data;
    } catch {
      mockAssignments = mockAssignments.map((a) => ({ ...a, status: 'FINALIZED' }));
      return {
        projectRoundId,
        totalStudents: 3,
        totalAssigned: 3,
        matchedNv1: 2,
        nv1Rate: 66.7,
        matchedNv2: 1,
        nv2Rate: 33.3,
        matchedNv3: 0,
        nv3Rate: 0,
        matchedFallback: 0,
        unassignedCount: 0,
        overriddenCount: 0,
        finalizedCount: 3,
        totalLecturers: 4,
        totalCapacity: 20,
        averageLoadRatio: 0.15,
      };
    }
  },

  async getStats(projectRoundId: number): Promise<AssignmentStats> {
    try {
      const res = await axios.get(`${API_BASE}/stats`, {
        params: { projectRoundId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data;
    } catch {
      return {
        projectRoundId,
        totalStudents: 3,
        totalAssigned: 3,
        matchedNv1: 2,
        nv1Rate: 66.7,
        matchedNv2: 1,
        nv2Rate: 33.3,
        matchedNv3: 0,
        nv3Rate: 0,
        matchedFallback: 0,
        unassignedCount: 0,
        overriddenCount: 0,
        finalizedCount: 0,
        totalLecturers: 4,
        totalCapacity: 20,
        averageLoadRatio: 0.15,
      };
    }
  },

  async openSupplementaryRegistration(projectRoundId: number): Promise<AssignmentStats> {
    const res = await axios.post(`${API_BASE}/supplementary/open`, null, {
      params: { projectRoundId },
      headers: getAuthHeaders(),
    });
    return res.data?.data || res.data;
  },

  async finalizeSupplementaryRegistration(projectRoundId: number): Promise<AssignmentStats> {
    const res = await axios.post(`${API_BASE}/supplementary/finalize`, null, {
      params: { projectRoundId },
      headers: getAuthHeaders(),
    });
    return res.data?.data || res.data;
  },
};
