import React, { useEffect, useState } from 'react';
import { Button, Table } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import { securityService } from '../services/securityService';
import type { AuditLogFilterParams, AuditLogItem, AuditLogStats } from '../types';
import './SecurityPages.css';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState<AuditLogFilterParams>({
    keyword: '',
    moduleName: 'ALL',
    severity: 'ALL',
    status: 'ALL',
    actorRole: 'ALL',
    fromDate: '',
    toDate: '',
    size: 15,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAuditData = async (targetPage = page, overrideFilters = filters) => {
    try {
      setLoading(true);
      const [pageRes, statsRes] = await Promise.all([
        securityService.getAuditLogs({ ...overrideFilters, page: targetPage }),
        securityService.getAuditStats(),
      ]);
      setLogs(pageRes.content || []);
      setTotalPages(pageRes.totalPages || 1);
      setTotalElements(pageRes.totalElements || 0);
      setStats(statsRes);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải nhật ký hệ thống' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData(0, filters);
  }, []);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);
    loadAuditData(0, filters);
  };

  const handleResetFilters = () => {
    const reset: AuditLogFilterParams = {
      keyword: '',
      moduleName: 'ALL',
      severity: 'ALL',
      status: 'ALL',
      actorRole: 'ALL',
      fromDate: '',
      toDate: '',
      size: 15,
    };
    setFilters(reset);
    setPage(0);
    loadAuditData(0, reset);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await securityService.exportAuditLogsCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thesishub_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'Xuất tệp báo cáo Nhật ký hệ thống (CSV) thành công' });
    } catch {
      setNotification({ type: 'error', message: 'Không thể xuất file CSV nhật ký lúc này' });
    } finally {
      setExporting(false);
    }
  };

  const getModuleLabel = (moduleName: string) => {
    switch (moduleName) {
      case 'AUTH_SECURITY':
        return '🔐 Bảo mật & Đăng nhập';
      case 'USER_ORG':
        return '🏛️ Người dùng & Tổ chức';
      case 'PROJECT_ROUND':
        return '🗓️ GĐ1: Đợt đồ án & Học vụ';
      case 'ASSIGNMENT':
        return '🎯 GĐ2: Phân công GVHD';
      case 'THESIS_PROPOSAL':
        return '📑 GĐ3: Đề cương & Đề tài';
      case 'PROGRESS_TASK':
        return '📋 GĐ4: Tiến độ & Task';
      case 'ELIGIBILITY_RESERVATION':
        return '⏸️ GĐ5: Điều kiện & Bảo lưu';
      case 'DEFENSE_SCORING':
        return '🏆 GĐ5: Hội đồng & Điểm số';
      default:
        return moduleName;
    }
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'createdAt',
      title: 'Thời gian',
      width: '155px',
      render: (val) => (
        <span style={{ fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
          {val ? new Date(val).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      key: 'actorUsername',
      title: 'Người thực hiện',
      width: '165px',
      render: (val, rec) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0a3273' }}>{val || 'anonymous'}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {rec.actorFullName || ''} {rec.actorRole ? `• ${rec.actorRole.replace('ROLE_', '')}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'moduleName',
      title: 'Phân hệ & Hành động',
      width: '210px',
      render: (val, rec) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>{getModuleLabel(val)}</div>
          <code style={{ fontSize: '0.73rem', color: '#0284c7' }}>{rec.actionType}</code>
        </div>
      ),
    },
    {
      key: 'summary',
      title: 'Nội dung thao tác',
      render: (val, rec) => (
        <div>
          <div style={{ color: '#1e293b', fontSize: '0.84rem' }}>{val}</div>
          {rec.ipAddress && (
            <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
              IP: <code>{rec.ipAddress}</code>
              {rec.requestUri ? ` • ${rec.requestMethod || ''} ${rec.requestUri}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'severity',
      title: 'Mức độ',
      align: 'center',
      width: '100px',
      render: (val) => <span className={`sec-badge sec-sev-${val}`}>{val}</span>,
    },
    {
      key: 'status',
      title: 'Kết quả',
      align: 'center',
      width: '100px',
      render: (val) => <span className={`sec-badge sec-status-${val}`}>{val}</span>,
    },
    {
      key: 'actions',
      title: 'Chi tiết',
      align: 'center',
      width: '115px',
      render: (_, rec) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedLog(rec)}>
          🔍 Chi tiết
        </Button>
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
          <h1 className="sec-title">📜 Nhật Ký Hệ Thống (System Audit Logs)</h1>
          <p className="sec-subtitle">
            Kho lưu trữ bất biến (Append-only) ghi nhận toàn bộ lịch sử đăng nhập, thay đổi phân quyền, điều chỉnh điểm bảo vệ, duyệt đặc cách và phê duyệt đơn bảo lưu đồ án kèm dữ liệu Trước/Sau (JSON Diff).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => loadAuditData(page, filters)} loading={loading}>
            🔄 Làm mới
          </Button>
          <Button variant="primary" onClick={handleExportCsv} loading={exporting}>
            📥 Xuất Báo cáo CSV/Excel
          </Button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="sec-kpi-grid">
        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #0a3273' }}>
          <span className="sec-kpi-label">Tổng Sự Kiện Đã Ghi</span>
          <span className="sec-kpi-value" style={{ color: '#0a3273' }}>
            {stats?.totalLogs ?? totalElements}
          </span>
          <span className="sec-kpi-sub">Lưu trữ toàn vẹn phục vụ thanh tra</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="sec-kpi-label">Sự Kiện Hôm Nay</span>
          <span className="sec-kpi-value" style={{ color: '#0369a1' }}>
            {stats?.todayLogs ?? 0}
          </span>
          <span className="sec-kpi-sub">Phát sinh trong ngày hiện tại</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #ea580c' }}>
          <span className="sec-kpi-label">Sự Kiện Mức Cao (HIGH/CRITICAL)</span>
          <span className="sec-kpi-value" style={{ color: '#c2410c' }}>
            {stats?.highSeverityLogs ?? 0}
          </span>
          <span className="sec-kpi-sub">Điểm số, bảo mật, bảo lưu, phân quyền</span>
        </div>

        <div className="sec-kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="sec-kpi-label">Thao Tác Lỗi / Bị Chặn</span>
          <span className="sec-kpi-value" style={{ color: '#b91c1c' }}>
            {stats?.failedOrBlockedLogs ?? 0}
          </span>
          <span className="sec-kpi-sub">Trạng thái FAILED hoặc BLOCKED</span>
        </div>
      </div>

      {/* Multi-dimensional Filter Card */}
      <div className="sec-card" style={{ marginBottom: '16px' }}>
        <form onSubmit={handleApplyFilters} className="sec-toolbar" style={{ marginBottom: 0 }}>
          <div className="sec-filter-item" style={{ flex: 2, minWidth: '210px' }}>
            <label>Từ khóa tìm kiếm</label>
            <input
              type="text"
              className="sec-input"
              placeholder="Username, họ tên, mô tả, IP, URI..."
              value={filters.keyword || ''}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </div>

          <div className="sec-filter-item">
            <label>Phân hệ</label>
            <select
              className="sec-select"
              value={filters.moduleName || 'ALL'}
              onChange={(e) => setFilters((f) => ({ ...f, moduleName: e.target.value }))}
            >
              <option value="ALL">Tất cả phân hệ</option>
              <option value="AUTH_SECURITY">Bảo mật &amp; Đăng nhập</option>
              <option value="USER_ORG">Người dùng &amp; Tổ chức</option>
              <option value="PROJECT_ROUND">GĐ1: Đợt đồ án &amp; Học vụ</option>
              <option value="ASSIGNMENT">GĐ2: Phân công GVHD</option>
              <option value="THESIS_PROPOSAL">GĐ3: Đề cương &amp; Đề tài</option>
              <option value="PROGRESS_TASK">GĐ4: Tiến độ &amp; Task</option>
              <option value="ELIGIBILITY_RESERVATION">GĐ5: Điều kiện &amp; Bảo lưu</option>
              <option value="DEFENSE_SCORING">GĐ5: Hội đồng &amp; Điểm số</option>
            </select>
          </div>

          <div className="sec-filter-item">
            <label>Mức độ</label>
            <select
              className="sec-select"
              value={filters.severity || 'ALL'}
              onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="INFO">INFO (Thông thường)</option>
              <option value="WARNING">WARNING (Cảnh báo)</option>
              <option value="HIGH">HIGH (Quan trọng)</option>
              <option value="CRITICAL">CRITICAL (Nghiêm trọng)</option>
            </select>
          </div>

          <div className="sec-filter-item">
            <label>Kết quả</label>
            <select
              className="sec-select"
              value={filters.status || 'ALL'}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="SUCCESS">SUCCESS (Thành công)</option>
              <option value="FAILED">FAILED (Thất bại)</option>
              <option value="BLOCKED">BLOCKED (Bị chặn)</option>
            </select>
          </div>

          <div className="sec-filter-item">
            <label>Từ ngày</label>
            <input
              type="date"
              className="sec-input"
              value={filters.fromDate || ''}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
            />
          </div>

          <div className="sec-filter-item">
            <label>Đến ngày</label>
            <input
              type="date"
              className="sec-input"
              value={filters.toDate || ''}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary" size="sm">
              🔍 Áp dụng lọc
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="sec-card">
        <Table<AuditLogItem>
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          emptyText="Không tìm thấy bản ghi nhật ký hệ thống nào phù hợp"
        />

        <div className="sec-pagination">
          <span>
            Hiển thị trang <strong>{page + 1}</strong> / <strong>{Math.max(1, totalPages)}</strong> (Tổng{' '}
            <strong>{totalElements}</strong> bản ghi)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || loading}
              onClick={() => {
                const next = Math.max(0, page - 1);
                setPage(next);
                loadAuditData(next, filters);
              }}
            >
              ◀ Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                loadAuditData(next, filters);
              }}
            >
              Trang sau ▶
            </Button>
          </div>
        </div>
      </div>

      <AuditLogDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        logItem={selectedLog}
      />
    </div>
  );
};
