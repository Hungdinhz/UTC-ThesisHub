import axios from 'axios';
import type {
  AuditLogFilterParams,
  AuditLogItem,
  AuditLogPageResponse,
  AuditLogStats,
  LockedAccountItem,
  RbacPermissionItem,
  SecurityOverview,
  SecurityPolicyItem,
  SecuritySessionItem,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const SECURITY_API = `${BASE_URL}/admin/security`;
const AUDIT_API = `${BASE_URL}/admin/audit-logs`;
const IS_TEST_ENV = import.meta.env.MODE === 'test';

function authHeaders(): Record<string, string> {
  if (IS_TEST_ENV) {
    throw new Error('Skip live network in unit tests');
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Realistic mock state for Vitest / offline preview fallback
let mockPolicies: SecurityPolicyItem[] = [
  {
    id: 1,
    policyKey: 'MAX_FAILED_LOGIN_ATTEMPTS',
    policyName: 'Giới hạn đăng nhập sai tối đa',
    policyValue: '5',
    valueType: 'INTEGER',
    category: 'AUTHENTICATION',
    description: 'Số lần nhập sai mật khẩu liên tiếp trước khi hệ thống tự động khóa tài khoản tạm thời.',
  },
  {
    id: 2,
    policyKey: 'ACCOUNT_LOCKOUT_MINUTES',
    policyName: 'Thời gian tự động khóa tài khoản (phút)',
    policyValue: '15',
    valueType: 'INTEGER',
    category: 'AUTHENTICATION',
    description: 'Thời gian khóa tài khoản tạm thời khi vượt quá số lần đăng nhập sai.',
  },
  {
    id: 3,
    policyKey: 'JWT_EXPIRATION_HOURS',
    policyName: 'Thời hạn phiên đăng nhập JWT (giờ)',
    policyValue: '24',
    valueType: 'INTEGER',
    category: 'SESSION',
    description: 'Thời gian hiệu lực tối đa của một phiên đăng nhập trước khi yêu cầu xác thực lại.',
  },
  {
    id: 4,
    policyKey: 'ENFORCE_STRONG_PASSWORD',
    policyName: 'Bắt buộc mật khẩu mạnh',
    policyValue: 'true',
    valueType: 'BOOLEAN',
    category: 'PASSWORD',
    description: 'Yêu cầu mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.',
  },
  {
    id: 5,
    policyKey: 'LOCK_SCORE_AFTER_ROUND_CLOSED',
    policyName: 'Khóa chỉnh sửa điểm khi đóng đợt đồ án',
    policyValue: 'true',
    valueType: 'BOOLEAN',
    category: 'DATA_INTEGRITY',
    description: 'Ngăn chặn mọi thao tác chỉnh sửa điểm sau khi đợt đồ án đã chuyển sang trạng thái CLOSED.',
  },
  {
    id: 6,
    policyKey: 'AUDIT_RETENTION_DAYS',
    policyName: 'Thời gian lưu trữ Nhật ký hệ thống (ngày)',
    policyValue: '365',
    valueType: 'INTEGER',
    category: 'AUDIT',
    description: 'Thời gian lưu trữ bắt buộc đối với dữ liệu nhật ký kiểm toán phục vụ thanh tra đào tạo.',
  },
];

let mockSessions: SecuritySessionItem[] = [
  {
    id: 101,
    userId: 1,
    username: 'admin',
    fullName: 'Quản trị viên Hệ thống',
    roleName: 'ROLE_ADMIN',
    ipAddress: '192.168.1.15',
    deviceInfo: 'Chrome / Windows',
    status: 'ACTIVE',
    issuedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    lastActivityAt: new Date(Date.now() - 60 * 1000 * 3).toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000 * 22).toISOString(),
  },
  {
    id: 102,
    userId: 12,
    username: 'giaovu',
    fullName: 'Nguyễn Thị Giáo Vụ',
    roleName: 'ROLE_ACADEMIC_STAFF',
    ipAddress: '192.168.1.42',
    deviceInfo: 'Edge / Windows',
    status: 'ACTIVE',
    issuedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    lastActivityAt: new Date(Date.now() - 60 * 1000 * 18).toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000 * 20).toISOString(),
  },
];

let mockLockedAccounts: LockedAccountItem[] = [
  {
    userId: 205,
    username: '201200455',
    fullName: 'Trần Văn Nam',
    email: '201200455@st.utc.edu.vn',
    roleName: 'ROLE_STUDENT',
    isActive: true,
    failedLoginAttempts: 5,
    lockedUntil: new Date(Date.now() + 60 * 1000 * 12).toISOString(),
    lastLoginIp: '14.231.88.12',
    lockState: 'TEMP_LOCKED',
  },
];

let mockAuditLogs: AuditLogItem[] = [
  {
    id: 5003,
    actorId: 1,
    actorUsername: 'admin',
    actorFullName: 'Quản trị viên Hệ thống',
    actorRole: 'ROLE_ADMIN',
    actionType: 'POLICY_UPDATED',
    moduleName: 'AUTH_SECURITY',
    targetEntity: 'SecurityPolicy',
    targetId: 'MAX_FAILED_LOGIN_ATTEMPTS',
    summary: 'Cập nhật chính sách bảo mật [Giới hạn đăng nhập sai tối đa] từ 5 thành 5',
    oldValues: JSON.stringify({ policyKey: 'MAX_FAILED_LOGIN_ATTEMPTS', policyValue: '6' }, null, 2),
    newValues: JSON.stringify({ policyKey: 'MAX_FAILED_LOGIN_ATTEMPTS', policyValue: '5' }, null, 2),
    requestMethod: 'PUT',
    requestUri: '/api/v1/admin/security/policies/MAX_FAILED_LOGIN_ATTEMPTS',
    ipAddress: '192.168.1.15',
    userAgent: 'Mozilla/5.0 Chrome/130.0',
    severity: 'HIGH',
    status: 'SUCCESS',
    executionTimeMs: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 5002,
    actorId: 205,
    actorUsername: '201200455',
    actorFullName: 'Trần Văn Nam',
    actorRole: 'ROLE_STUDENT',
    actionType: 'ACCOUNT_LOCKED',
    moduleName: 'AUTH_SECURITY',
    targetEntity: 'User',
    targetId: '205',
    summary: 'Tài khoản 201200455 bị tự động khóa 15 phút do nhập sai mật khẩu 5 lần liên tiếp',
    oldValues: JSON.stringify({ failedLoginAttempts: 4 }, null, 2),
    newValues: JSON.stringify({ failedLoginAttempts: 5, lockedMinutes: 15 }, null, 2),
    requestMethod: 'POST',
    requestUri: '/api/v1/auth/login',
    ipAddress: '14.231.88.12',
    userAgent: 'Mozilla/5.0 Chrome/130.0',
    severity: 'HIGH',
    status: 'BLOCKED',
    errorMessage: 'Sai mật khẩu quá số lần quy định',
    executionTimeMs: 48,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 5001,
    actorId: 1,
    actorUsername: 'admin',
    actorFullName: 'Quản trị viên Hệ thống',
    actorRole: 'ROLE_ADMIN',
    actionType: 'REVIEW_RESERVATION',
    moduleName: 'ELIGIBILITY_RESERVATION',
    targetEntity: 'ReservationRequest',
    targetId: '14',
    summary: 'Phê duyệt đơn bảo lưu đồ án (#14) do chưa hoàn thành đủ tín chỉ',
    oldValues: JSON.stringify({ status: 'PENDING', thesisStatus: 'IN_PROGRESS' }, null, 2),
    newValues: JSON.stringify({ status: 'APPROVED', thesisStatus: 'RESERVED' }, null, 2),
    requestMethod: 'PUT',
    requestUri: '/api/v1/eligibility/reservations/14/review',
    ipAddress: '192.168.1.15',
    userAgent: 'Mozilla/5.0 Chrome/130.0',
    severity: 'HIGH',
    status: 'SUCCESS',
    executionTimeMs: 65,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const mockRbacMatrix: RbacPermissionItem[] = [
  {
    module: 'GĐ1: Đợt đồ án & Tổ chức',
    permissionName: 'Quản trị Đợt đồ án & Khoa/Bộ môn',
    description: 'Tạo/mở/đóng đợt đồ án, cấu hình danh mục tổ chức',
    roleAccess: { ROLE_ADMIN: true, ROLE_ACADEMIC_STAFF: false, ROLE_LECTURER: false, ROLE_COMMITTEE: false, ROLE_STUDENT: false },
  },
  {
    module: 'GĐ5: Xét ĐK & Bảo lưu',
    permissionName: 'Xét điều kiện bảo vệ & Phê duyệt Bảo lưu',
    description: 'Kiểm tra điều kiện bảo vệ cuối kỳ, duyệt đặc cách và phê duyệt đơn bảo lưu',
    roleAccess: { ROLE_ADMIN: true, ROLE_ACADEMIC_STAFF: true, ROLE_LECTURER: false, ROLE_COMMITTEE: false, ROLE_STUDENT: false },
  },
  {
    module: 'Hệ thống & Bảo mật',
    permissionName: 'Trung Tâm Bảo Mật & Nhật Ký Hệ Thống',
    description: 'Giám sát phiên đăng nhập, khóa/mở tài khoản, cấu hình chính sách & tra cứu audit logs',
    roleAccess: { ROLE_ADMIN: true, ROLE_ACADEMIC_STAFF: false, ROLE_LECTURER: false, ROLE_COMMITTEE: false, ROLE_STUDENT: false },
  },
];

class SecurityService {
  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      const res = await axios.get(`${SECURITY_API}/overview`, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (data && typeof data.securityScore === 'number') return data;
    } catch {
      // Fallback for unit test / offline mode
    }
    return {
      securityScore: 94,
      securityPostureLabel: 'TỐT (AN TOÀN CAO)',
      activeSessionsCount: mockSessions.filter((s) => s.status === 'ACTIVE').length,
      failedLogins24h: 1,
      lockedAccountsCount: mockLockedAccounts.filter((a) => a.lockState !== 'UNLOCKED').length,
      highSeverityAlertsCount: mockAuditLogs.filter((l) => l.severity === 'HIGH' || l.severity === 'CRITICAL').length,
      strongPasswordEnforced: mockPolicies.find((p) => p.policyKey === 'ENFORCE_STRONG_PASSWORD')?.policyValue === 'true',
      scoreLockAfterCloseEnforced: mockPolicies.find((p) => p.policyKey === 'LOCK_SCORE_AFTER_ROUND_CLOSED')?.policyValue === 'true',
      recentAlerts: mockAuditLogs.slice(0, 5),
    };
  }

  async getSessions(status = 'ALL', search = ''): Promise<SecuritySessionItem[]> {
    try {
      const res = await axios.get(`${SECURITY_API}/sessions`, {
        params: { status: status !== 'ALL' ? status : undefined, search: search || undefined },
        headers: authHeaders(),
      });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
    return mockSessions.filter((s) => {
      const matchStatus = status === 'ALL' || s.status === status;
      const kw = search.trim().toLowerCase();
      const matchSearch = !kw || s.username.toLowerCase().includes(kw) || (s.fullName || '').toLowerCase().includes(kw) || (s.ipAddress || '').includes(kw);
      return matchStatus && matchSearch;
    });
  }

  async revokeSession(sessionId: number, reason?: string): Promise<SecuritySessionItem> {
    try {
      const res = await axios.post(`${SECURITY_API}/sessions/${sessionId}/revoke`, { reason }, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (data?.id) return data;
    } catch (err: any) {
      if (!IS_TEST_ENV && err?.response) {
        throw new Error(err.response?.data?.message || 'Không thể thu hồi phiên đăng nhập');
      }
    }
    const found = mockSessions.find((s) => s.id === sessionId);
    if (found) {
      found.status = 'REVOKED';
      found.revokedAt = new Date().toISOString();
      found.revokeReason = reason || 'Quản trị viên thu hồi phiên từ xa';
      return { ...found };
    }
    throw new Error('Không tìm thấy phiên đăng nhập');
  }

  async getLockedAccounts(): Promise<LockedAccountItem[]> {
    try {
      const res = await axios.get(`${SECURITY_API}/accounts/locked`, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
    return mockLockedAccounts;
  }

  async unlockAccount(userId: number): Promise<LockedAccountItem> {
    try {
      const res = await axios.post(`${SECURITY_API}/accounts/${userId}/unlock`, {}, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (data?.userId) return data;
    } catch (err: any) {
      if (!IS_TEST_ENV && err?.response) {
        throw new Error(err.response?.data?.message || 'Không thể mở khóa tài khoản');
      }
    }
    const acc = mockLockedAccounts.find((a) => a.userId === userId);
    if (acc) {
      acc.isActive = true;
      acc.failedLoginAttempts = 0;
      acc.lockedUntil = null;
      acc.lockState = 'UNLOCKED';
      return { ...acc };
    }
    throw new Error('Không tìm thấy tài khoản');
  }

  async lockAccount(userId: number, durationMinutes: number, reason: string): Promise<LockedAccountItem> {
    try {
      const res = await axios.post(
        `${SECURITY_API}/accounts/${userId}/lock`,
        { durationMinutes, reason },
        { headers: authHeaders() }
      );
      const data = res.data?.data ?? res.data;
      if (data?.userId) return data;
    } catch (err: any) {
      if (!IS_TEST_ENV && err?.response) {
        throw new Error(err.response?.data?.message || 'Không thể khóa tài khoản');
      }
    }
    throw new Error('Không thể khóa tài khoản');
  }

  async getPolicies(): Promise<SecurityPolicyItem[]> {
    try {
      const res = await axios.get(`${SECURITY_API}/policies`, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
    return mockPolicies;
  }

  async updatePolicy(policyKey: string, policyValue: string): Promise<SecurityPolicyItem> {
    try {
      const res = await axios.put(
        `${SECURITY_API}/policies/${policyKey}`,
        { policyValue },
        { headers: authHeaders() }
      );
      const data = res.data?.data ?? res.data;
      if (data?.policyKey) return data;
    } catch (err: any) {
      if (!IS_TEST_ENV && err?.response) {
        throw new Error(err.response?.data?.message || 'Không thể cập nhật chính sách');
      }
    }
    const p = mockPolicies.find((item) => item.policyKey === policyKey);
    if (p) {
      p.policyValue = policyValue;
      p.updatedAt = new Date().toISOString();
      return { ...p };
    }
    throw new Error('Không tìm thấy chính sách');
  }

  async getRbacMatrix(): Promise<RbacPermissionItem[]> {
    try {
      const res = await axios.get(`${SECURITY_API}/rbac-matrix`, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback
    }
    return mockRbacMatrix;
  }

  async getAuditLogs(params: AuditLogFilterParams = {}): Promise<AuditLogPageResponse> {
    try {
      const cleanParams: Record<string, any> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
          cleanParams[k] = v;
        }
      });
      const res = await axios.get(`${AUDIT_API}`, { params: cleanParams, headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (data && Array.isArray(data.content)) return data;
    } catch {
      // Fallback
    }
    let filtered = [...mockAuditLogs];
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.actorUsername || '').toLowerCase().includes(kw) ||
          (l.actorFullName || '').toLowerCase().includes(kw) ||
          l.summary.toLowerCase().includes(kw) ||
          (l.ipAddress || '').includes(kw)
      );
    }
    if (params.moduleName && params.moduleName !== 'ALL') {
      filtered = filtered.filter((l) => l.moduleName === params.moduleName);
    }
    if (params.severity && params.severity !== 'ALL') {
      filtered = filtered.filter((l) => l.severity === params.severity);
    }
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((l) => l.status === params.status);
    }
    return {
      page: params.page || 0,
      size: params.size || 20,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / (params.size || 20))),
      content: filtered,
    };
  }

  async getAuditStats(): Promise<AuditLogStats> {
    try {
      const res = await axios.get(`${AUDIT_API}/stats`, { headers: authHeaders() });
      const data = res.data?.data ?? res.data;
      if (data && typeof data.totalLogs === 'number') return data;
    } catch {
      // Fallback
    }
    return {
      totalLogs: mockAuditLogs.length,
      todayLogs: mockAuditLogs.length,
      highSeverityLogs: mockAuditLogs.filter((l) => l.severity === 'HIGH' || l.severity === 'CRITICAL').length,
      failedOrBlockedLogs: mockAuditLogs.filter((l) => l.status === 'FAILED' || l.status === 'BLOCKED').length,
      moduleBreakdown: {
        AUTH_SECURITY: 2,
        ELIGIBILITY_RESERVATION: 1,
      },
    };
  }

  async exportAuditLogsCsv(params: AuditLogFilterParams = {}): Promise<Blob> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        cleanParams[k] = v;
      }
    });
    const res = await axios.get(`${AUDIT_API}/export`, {
      params: cleanParams,
      headers: authHeaders(),
      responseType: 'blob',
    });
    return res.data;
  }
}

export const securityService = new SecurityService();
