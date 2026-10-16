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
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==========================================
// Mock Data (for offline / testing preview)
// ==========================================
export const mockDirections: ProjectDirection[] = [
  {
    id: 1,
    code: 'HD_AI',
    name: 'Trí tuệ nhân tạo & Học máy chuyên sâu',
    description: 'Nghiên cứu thị giác máy tính, NLP, Generative AI, LLMs và AI Agents.',
    departmentId: 3,
    departmentName: 'Khoa học máy tính',
    isActive: true,
    lecturerCount: 3,
  },
  {
    id: 2,
    code: 'HD_SE',
    name: 'Kỹ thuật phần mềm & Kiến trúc Microservices',
    description: 'Thiết kế hệ thống phần mềm lớn, Clean Architecture, CI/CD, DevOps.',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    isActive: true,
    lecturerCount: 4,
  },
  {
    id: 3,
    code: 'HD_WEB_CLOUD',
    name: 'Ứng dụng Web hiện đại & Điện toán đám mây',
    description: 'Xây dựng web phân tán, Cloud-Native, Kubernetes, AWS/GCP.',
    departmentId: 1,
    departmentName: 'Công nghệ phần mềm',
    isActive: true,
    lecturerCount: 3,
  },
  {
    id: 4,
    code: 'HD_SECURITY',
    name: 'An toàn thông tin & Bảo mật mạng',
    description: 'Mật mã học, kiểm thử thâm nhập, bảo vệ hạ tầng thông tin.',
    departmentId: 4,
    departmentName: 'Mạng máy tính & ATTT',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 5,
    code: 'HD_IOT',
    name: 'Internet vạn vật (IoT) & Hệ thống nhúng',
    description: 'Thiết bị thông minh, Smart City, vi điều khiển và xử lý cảm biến.',
    departmentId: 4,
    departmentName: 'Mạng máy tính & ATTT',
    isActive: true,
    lecturerCount: 2,
  },
  {
    id: 6,
    code: 'HD_DATA',
    name: 'Khoa học dữ liệu & Big Data Analytics',
    description: 'Data Pipeline, Business Intelligence, Data Warehouse và khai phá dữ liệu.',
    departmentId: 2,
    departmentName: 'Hệ thống thông tin',
    isActive: true,
    lecturerCount: 3,
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
    projectRoundId: 10,
    maxQuota: 5,
    capacityFactor: 1.0,
    effectiveCapacity: 5,
    currentAssigned: 3,
    remainingCapacity: 2,
    loadRatio: 0.6,
    isActive: true,
    directionNames: ['HD_AI', 'HD_SE'],
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
    projectRoundId: 10,
    maxQuota: 6,
    capacityFactor: 1.2,
    effectiveCapacity: 7,
    currentAssigned: 6,
    remainingCapacity: 1,
    loadRatio: 0.86,
    isActive: true,
    directionNames: ['HD_AI', 'HD_DATA'],
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
    projectRoundId: 10,
    maxQuota: 4,
    capacityFactor: 1.0,
    effectiveCapacity: 4,
    currentAssigned: 1,
    remainingCapacity: 3,
    loadRatio: 0.25,
    isActive: true,
    directionNames: ['HD_WEB_CLOUD', 'HD_SE'],
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
    projectRoundId: 10,
    maxQuota: 5,
    capacityFactor: 0.8,
    effectiveCapacity: 4,
    currentAssigned: 2,
    remainingCapacity: 2,
    loadRatio: 0.5,
    isActive: true,
    directionNames: ['HD_SECURITY', 'HD_IOT'],
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
    } catch {
      // Mock fallback
      const dir = mockDirections.find((d) => d.id === data.directionId) || mockDirections[0];
      return {
        id: Date.now(),
        studentId: data.studentId || 201,
        studentCode: '2021600101',
        studentName: 'Trần Minh Quang',
        projectRoundId: data.projectRoundId,
        directionId: data.directionId,
        directionCode: dir.code,
        directionName: dir.name,
        status: 'REGISTERED',
        registeredAt: new Date().toISOString(),
        note: data.note,
      };
    }
  },

  async getRegistrations(projectRoundId: number, directionId?: number): Promise<DirectionRegistration[]> {
    try {
      const res = await axios.get(`${API_BASE}/registrations`, {
        params: { projectRoundId, directionId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 1,
          studentId: 201,
          studentCode: '2021600101',
          studentName: 'Trần Minh Quang',
          studentClass: 'CNTT1 - K62',
          trainingProgramCode: 'CU_NHAN',
          projectRoundId,
          directionId: 1,
          directionCode: 'HD_AI',
          directionName: 'Trí tuệ nhân tạo & Học máy chuyên sâu',
          status: 'REGISTERED',
          registeredAt: new Date().toISOString(),
        },
        {
          id: 2,
          studentId: 202,
          studentCode: '2021600102',
          studentName: 'Lê Thùy Dung',
          studentClass: 'KTPM - K62',
          trainingProgramCode: 'KY_SU',
          projectRoundId,
          directionId: 1,
          directionCode: 'HD_AI',
          directionName: 'Trí tuệ nhân tạo & Học máy chuyên sâu',
          status: 'REGISTERED',
          registeredAt: new Date().toISOString(),
        },
      ];
    }
  },

  // 4. Preferences (Step A & E)
  async getPreferences(projectRoundId: number, studentId?: number): Promise<PreferenceResponse[]> {
    try {
      const res = await axios.get(`${API_BASE}/preferences`, {
        params: { projectRoundId, studentId },
        headers: getAuthHeaders(),
      });
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 1,
          studentId: studentId || 201,
          studentCode: '2021600101',
          studentName: 'Trần Minh Quang',
          trainingProgramCode: 'CU_NHAN',
          projectRoundId,
          lecturerId: 101,
          lecturerCode: 'GV001',
          lecturerName: 'TS. Nguyễn Văn Hướng',
          academicDegree: 'TIEN_SI',
          priority: 1,
          gpa: 3.65,
          prioritizationCriteria: 'Có chứng chỉ AWS, IELTS 7.0, định hướng làm AI Agent',
          status: 'PENDING',
        },
      ];
    }
  },

  async submitPreferences(data: PreferenceSubmitRequest): Promise<PreferenceResponse[]> {
    try {
      const res = await axios.post(`${API_BASE}/preferences`, data, { headers: getAuthHeaders() });
      return res.data?.data || res.data;
    } catch {
      // Return simulated preferences
      return data.preferences.map((p, idx) => ({
        id: idx + 1,
        studentId: data.studentId || 201,
        studentCode: '2021600101',
        studentName: 'Sinh viên',
        trainingProgramCode: 'CU_NHAN',
        projectRoundId: data.projectRoundId,
        lecturerId: p.lecturerId,
        lecturerCode: `GV00${p.lecturerId}`,
        lecturerName: `Giảng viên ${p.lecturerId}`,
        academicDegree: 'TIEN_SI',
        priority: p.priority,
        gpa: data.gpa,
        prioritizationCriteria: data.prioritizationCriteria,
        status: 'PENDING',
      }));
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
};
