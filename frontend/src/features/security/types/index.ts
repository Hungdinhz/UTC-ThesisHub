export type AuditSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED';

export interface AuditLogItem {
  id: number;
  actorId?: number | null;
  actorUsername?: string | null;
  actorFullName?: string | null;
  actorRole?: string | null;
  actionType: string;
  moduleName: string;
  targetEntity?: string | null;
  targetId?: string | null;
  summary: string;
  oldValues?: string | null;
  newValues?: string | null;
  requestMethod?: string | null;
  requestUri?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity: AuditSeverity | string;
  status: AuditStatus | string;
  errorMessage?: string | null;
  executionTimeMs?: number | null;
  createdAt: string;
}

export interface AuditLogPageResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: AuditLogItem[];
}

export interface AuditLogFilterParams {
  keyword?: string;
  moduleName?: string;
  actionType?: string;
  severity?: string;
  status?: string;
  actorRole?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  highSeverityLogs: number;
  failedOrBlockedLogs: number;
  moduleBreakdown: Record<string, number>;
}

export interface SecurityOverview {
  securityScore: number;
  securityPostureLabel: string;
  activeSessionsCount: number;
  failedLogins24h: number;
  lockedAccountsCount: number;
  highSeverityAlertsCount: number;
  strongPasswordEnforced: boolean;
  scoreLockAfterCloseEnforced: boolean;
  recentAlerts: AuditLogItem[];
}

export interface SecuritySessionItem {
  id: number;
  userId: number;
  username: string;
  fullName?: string | null;
  roleName?: string | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  userAgent?: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | string;
  issuedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

export interface LockedAccountItem {
  userId: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  roleName?: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  lockState: 'TEMP_LOCKED' | 'PERMANENT_LOCKED' | 'WARNING_ATTEMPTS' | 'UNLOCKED' | string;
}

export interface SecurityPolicyItem {
  id?: number;
  policyKey: string;
  policyName: string;
  policyValue: string;
  valueType: 'INTEGER' | 'BOOLEAN' | 'STRING' | string;
  category: string;
  description?: string | null;
  updatedBy?: number | null;
  updatedAt?: string | null;
}

export interface RbacPermissionItem {
  module: string;
  permissionName: string;
  description: string;
  roleAccess: Record<string, boolean>;
}
