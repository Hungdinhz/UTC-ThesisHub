import React, { useEffect, useState } from 'react';
import { Button, StatusBadge, Table } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { securityService } from '../services/securityService';
import type {
  LockedAccountItem,
  RbacPermissionItem,
  SecurityOverview,
  SecurityPolicyItem,
  SecuritySessionItem,
} from '../types';
import { toast } from '../../../components/Toast';
import './SecurityPages.css';

export const SecurityCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'accounts' | 'policies' | 'rbac'>('sessions');
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [sessions, setSessions] = useState<SecuritySessionItem[]>([]);
  const [sessionStatusFilter, setSessionStatusFilter] = useState('ALL');
  const [sessionSearch, setSessionSearch] = useState('');
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccountItem[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicyItem[]>([]);
  const [editingPolicyValues, setEditingPolicyValues] = useState<Record<string, string>>({});
  const [rbacMatrix, setRbacMatrix] = useState<RbacPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ov, sess, accs, pols, rbac] = await Promise.all([
        securityService.getSecurityOverview(),
        securityService.getSessions(sessionStatusFilter, sessionSearch),
        securityService.getLockedAccounts(),
        securityService.getPolicies(),
        securityService.getRbacMatrix(),
      ]);
      setOverview(ov);
      setSessions(sess);
      setLockedAccounts(accs);
      setPolicies(pols);
      const valMap: Record<string, string> = {};
      pols.forEach((p) => {
        valMap[p.policyKey] = p.policyValue;
      });
      setEditingPolicyValues(valMap);
      setRbacMatrix(rbac);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải dữ liệu Trung tâm bảo mật' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [sessionStatusFilter]);

  const handleSearchSessions = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = await securityService.getSessions(sessionStatusFilter, sessionSearch);
    setSessions(list);
  };

  const handleRevokeSession = async (session: SecuritySessionItem) => {
    toast.confirm({
      title: 'Thu hồi phiên đăng nhập',
      message: `Xác nhận thu hồi phiên đăng nhập của tài khoản "${session.username}" (IP: ${session.ipAddress || '—'})? Người dùng sẽ bị đăng xuất ngay lập tức.`,
      type: 'warning',
      confirmText: 'Thu hồi phiên',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          await securityService.revokeSession(session.id, 'Quản trị viên thu hồi phiên từ Trung tâm bảo mật');
          const msg = `Đã thu hồi phiên đăng nhập #${session.id} của ${session.username}`;
          setNotification({ type: 'success', message: msg });
          toast.success(msg);
          await loadAllData();
        } catch (err: any) {
          const errMsg = err?.message || 'Không thể thu hồi phiên';
          setNotification({ type: 'error', message: errMsg });
          toast.error(errMsg);
        }
      },
    });
  };

  const handleUnlockAccount = async (account: LockedAccountItem) => {
    try {
      await securityService.unlockAccount(account.userId);
      setNotification({ type: 'success', message: `Đã mở khóa bảo mật thành công cho tài khoản ${account.username}` });
      await loadAllData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể mở khóa tài khoản' });
    }
  };

  const handleSavePolicy = async (policyKey: string) => {
    const val = editingPolicyValues[policyKey];
    if (val === undefined || val === '') return;
    try {
      setSavingKey(policyKey);
      await securityService.updatePolicy(policyKey, val);
      setNotification({ type: 'success', message: `Đã cập nhật chính sách bảo mật ${policyKey}` });
      await loadAllData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể lưu chính sách bảo mật' });
    } finally {
      setSavingKey(null);
    }
  };

  const sessionColumns: Column<SecuritySessionItem>[] = [
    {
      key: 'username',
      title: 'Tài khoản',
      render: (val, rec) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0a3273' }}>{val}</div>
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {rec.fullName || 'Người dùng UTC'} • {rec.roleName || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      title: 'Địa chỉ IP & Thiết bị',
      render: (val, rec) => (
        <div>
          <div>
            <code>{val || '127.0.0.1'}</code>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#475569' }}>{rec.deviceInfo || 'Browser'}</div>
        </div>
      ),
    },
    {
      key: 'issuedAt',
      title: 'Đăng nhập lúc',
      render: (val) => (val ? new Date(val).toLocaleString('vi-VN') : '—'),
    },
    {
      key: 'expiresAt',
      title: 'Hết hạn JWT',
      render: (val) => (val ? new Date(val).toLocaleString('vi-VN') : '—'),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (val) => {
        const variant = val === 'ACTIVE' ? 'success' : val === 'REVOKED' ? 'danger' : 'neutral';
        const label = val === 'ACTIVE' ? 'Đang hoạt động' : val === 'REVOKED' ? 'Đã thu hồi' : 'Hết hạn';
        return <StatusBadge status={val} variant={variant} label={label} />;
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      render: (_, rec) =>
        rec.status === 'ACTIVE' ? (
          <Button variant="danger" size="sm" onClick={() => handleRevokeSession(rec)}>
            Thu hồi phiên
          </Button>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rec.revokeReason || '—'}</span>
        ),
    },
  ];

  const accountColumns: Column<LockedAccountItem>[] = [
    {
      key: 'username',
      title: 'Tài khoản',
      render: (val, rec) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0a3273' }}>{val}</div>
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {rec.fullName} ({rec.roleName})
          </div>
        </div>
      ),
    },
    {
      key: 'failedLoginAttempts',
      title: 'Số lần sai mật khẩu',
      align: 'center',
      render: (val) => (
        <span style={{ fontWeight: 700, color: val >= 5 ? '#dc2626' : '#d97706' }}>{val}</span>
      ),
    },
    {
      key: 'lockState',
      title: 'Tình trạng khóa',
      render: (val, rec) => {
        if (val === 'TEMP_LOCKED') {
          return (
            <div>
              <StatusBadge status="LOCKED" variant="warning" label="Khóa tạm thời" />
              {rec.lockedUntil && (
                <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                  Đến: {new Date(rec.lockedUntil).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          );
        }
        if (val === 'PERMANENT_LOCKED') {
          return <StatusBadge status="DISABLED" variant="danger" label="Vô hiệu hóa (Khóa)" />;
        }
        if (val === 'UNLOCKED') {
          return <StatusBadge status="ACTIVE" variant="success" label="Đã mở khóa" />;
        }
        return <StatusBadge status="WARNING" variant="info" label="Cảnh báo đăng nhập sai" />;
      },
    },
    {
      key: 'lastLoginIp',
      title: 'IP gần nhất',
      render: (val) => <code>{val || '—'}</code>,
    },
    {
      key: 'actions',
      title: 'Xử lý',
      align: 'center',
      render: (_, rec) =>
        rec.lockState !== 'UNLOCKED' ? (
          <Button variant="primary" size="sm" onClick={() => handleUnlockAccount(rec)}>
            🔓 Mở khóa ngay
          </Button>
        ) : (
          <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>Bình thường</span>
        ),
    },
  ];

  return (
    <div className="sec-page">
      {notification && (
        <div className={`sec-alert ${notification.type === 'success' ? 'sec-alert-success' : 'sec-alert-error'}`}>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="sec-header">
        <div>
          <h1 className="sec-title">🛡️ Trung Tâm Bảo Mật Hệ Thống (Security Center)</h1>
          <p className="sec-subtitle">
            Giám sát phiên đăng nhập JWT thời gian thực, ngăn chặn tấn công dò mật khẩu (Brute-force), quản lý tài khoản bị khóa, cấu hình chính sách an ninh và kiểm tra ma trận phân quyền RBAC.
          </p>
        </div>
        <Button variant="outline" onClick={loadAllData} loading={loading}>
          🔄 Làm mới trạng thái
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="sec-kpi-grid">
        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <span className="sec-kpi-label">Điểm An Toàn Hệ Thống</span>
          <span className="sec-kpi-value" style={{ color: '#15803d' }}>
            {overview ? `${overview.securityScore}/100` : '—'}
          </span>
          <span className="sec-kpi-sub">{overview?.securityPostureLabel || 'Đang đánh giá...'}</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="sec-kpi-label">Phiên Đăng Nhập Hoạt Động</span>
          <span className="sec-kpi-value" style={{ color: '#0369a1' }}>
            {overview?.activeSessionsCount ?? 0}
          </span>
          <span className="sec-kpi-sub">Token JWT đang lưu hành hợp lệ</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="sec-kpi-label">Đăng Nhập Thất Bại (24h)</span>
          <span className="sec-kpi-value" style={{ color: '#b45309' }}>
            {overview?.failedLogins24h ?? 0}
          </span>
          <span className="sec-kpi-sub">Cảnh báo sai mật khẩu / thử truy cập</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="sec-kpi-label">Tài Khoản Đang Khóa</span>
          <span className="sec-kpi-value" style={{ color: '#b91c1c' }}>
            {overview?.lockedAccountsCount ?? 0}
          </span>
          <span className="sec-kpi-sub">Tạm khóa brute-force hoặc khóa quản trị</span>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="sec-tabs">
        <button
          className={`sec-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          🔑 Giám sát Phiên đăng nhập ({sessions.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          🔒 Tài khoản Khóa &amp; Cảnh báo ({lockedAccounts.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          ⚙️ Chính sách Bảo mật ({policies.length})
        </button>
        <button
          className={`sec-tab-btn ${activeTab === 'rbac' ? 'active' : ''}`}
          onClick={() => setActiveTab('rbac')}
        >
          🧩 Ma trận Phân quyền RBAC
        </button>
      </div>

      {/* Tab 1: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="sec-card sec-card-tabbed">
          <form onSubmit={handleSearchSessions} className="sec-toolbar">
            <div className="sec-filter-item" style={{ flex: 1, minWidth: '220px' }}>
              <label>Tìm kiếm phiên (Tài khoản / Họ tên / IP / Thiết bị)</label>
              <input
                type="text"
                className="sec-input"
                placeholder="Nhập username, họ tên hoặc địa chỉ IP..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
              />
            </div>
            <div className="sec-filter-item">
              <label>Trạng thái phiên</label>
              <select
                className="sec-select"
                value={sessionStatusFilter}
                onChange={(e) => setSessionStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="REVOKED">Đã thu hồi (REVOKED)</option>
                <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
              </select>
            </div>
            <Button type="submit" variant="primary" size="sm">
              🔍 Lọc phiên
            </Button>
          </form>

          <Table<SecuritySessionItem>
            columns={sessionColumns}
            dataSource={sessions}
            loading={loading}
            rowKey="id"
            emptyText="Không có phiên đăng nhập nào khớp bộ lọc"
          />
        </div>
      )}

      {/* Tab 2: Locked / Risky Accounts & Recent Alerts */}
      {activeTab === 'accounts' && (
        <div className="sec-card sec-card-tabbed" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '1.05rem' }}>
              Danh sách Tài khoản bị khóa hoặc có số lần đăng nhập sai cao
            </h3>
            <Table<LockedAccountItem>
              columns={accountColumns}
              dataSource={lockedAccounts}
              loading={loading}
              rowKey="userId"
              emptyText="Không có tài khoản nào đang bị khóa bảo mật"
            />
          </div>

          {overview?.recentAlerts && overview.recentAlerts.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '1.05rem' }}>
                Cảnh báo An ninh Mức cao Gần đây
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overview.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <span className={`sec-badge sec-sev-${alert.severity}`} style={{ marginRight: '8px' }}>
                        {alert.severity}
                      </span>
                      <strong style={{ color: '#0a3273', marginRight: '6px' }}>{alert.actorUsername || 'system'}</strong>
                      <span style={{ color: '#334155', fontSize: '0.88rem' }}>{alert.summary}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      IP: <code>{alert.ipAddress || '—'}</code> •{' '}
                      {new Date(alert.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security Policies */}
      {activeTab === 'policies' && (
        <div className="sec-card sec-card-tabbed">
          <div className="sec-policy-grid">
            {policies.map((policy) => {
              const currentVal = editingPolicyValues[policy.policyKey] ?? policy.policyValue;
              return (
                <div key={policy.policyKey} className="sec-policy-card">
                  <div>
                    <div className="sec-policy-key">{policy.policyKey}</div>
                    <div className="sec-policy-name">{policy.policyName}</div>
                    <div className="sec-policy-desc">{policy.description}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {policy.valueType === 'BOOLEAN' ? (
                      <select
                        className="sec-select"
                        style={{ flex: 1 }}
                        value={currentVal}
                        onChange={(e) =>
                          setEditingPolicyValues((prev) => ({
                            ...prev,
                            [policy.policyKey]: e.target.value,
                          }))
                        }
                      >
                        <option value="true">Bật (TRUE — Bắt buộc thực thi)</option>
                        <option value="false">Tắt (FALSE)</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        className="sec-input"
                        style={{ flex: 1 }}
                        value={currentVal}
                        onChange={(e) =>
                          setEditingPolicyValues((prev) => ({
                            ...prev,
                            [policy.policyKey]: e.target.value,
                          }))
                        }
                      />
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      loading={savingKey === policy.policyKey}
                      onClick={() => handleSavePolicy(policy.policyKey)}
                    >
                      Lưu cấu hình
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: RBAC Permission Matrix */}
      {activeTab === 'rbac' && (
        <div className="sec-card sec-card-tabbed">
          <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '0.88rem' }}>
            Ma trận kiểm soát quyền truy cập theo vai trò (Role-Based Access Control) đang được thực thi tại Backend Spring Security (`@PreAuthorize`) và Frontend Route Guard.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Phân hệ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Quyền hạn &amp; Mô tả</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>ADMIN</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>GIÁO VỤ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>GIẢNG VIÊN</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>HỘI ĐỒNG</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>SINH VIÊN</th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{row.module}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.permissionName}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{row.description}</div>
                    </td>
                    {['ROLE_ADMIN', 'ROLE_ACADEMIC_STAFF', 'ROLE_LECTURER', 'ROLE_COMMITTEE', 'ROLE_STUDENT'].map(
                      (roleKey) => (
                        <td key={roleKey} style={{ padding: '10px 12px', textAlign: 'center', fontSize: '1rem' }}>
                          {row.roleAccess?.[roleKey] ? '✅' : '—'}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
