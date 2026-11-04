import React, { useEffect, useState } from 'react';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { RoundAcademicRecordsTab } from '../../project-round/components/RoundAcademicRecordsTab';
import { RoundStudentsTab } from '../../project-round/components/RoundStudentsTab';
import { apiService } from '../../../services/api';
import type { EligibleStudentListResponse, EligibleStudentRow, ProjectRoundItem } from '../../../types';
import { downloadBlob, extractErrorMessage } from '../utils/download';
import '../../eligibility/pages/EligibilityPages.css';
import './AcademicStaffPages.css';

type TabKey = 'list' | 'import-students' | 'academic-records';

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: 'Đủ điều kiện',
  FORCE_APPROVED: 'Duyệt đặc cách',
  INELIGIBLE: 'Không đủ điều kiện',
  RESERVED: 'Đã bảo lưu',
  DISQUALIFIED: 'Bị loại khỏi đợt',
  NO_DATA: 'Chưa có dữ liệu học vụ',
};

export const EligibleStudentsPage: React.FC = () => {
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>('list');
  const [data, setData] = useState<EligibleStudentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [clearingStudentId, setClearingStudentId] = useState<number | null>(null);

  const handleClearDebt = async (student: EligibleStudentRow) => {
    if (roundId === null) return;
    const confirmed = window.confirm(
      `Xác nhận sinh viên ${student.fullName || student.studentCode} (${student.studentCode}) đã hoàn thành trả nợ tín chỉ (Số tín chỉ nợ chuyển về 0)?`
    );
    if (!confirmed) return;

    try {
      setClearingStudentId(student.studentId);
      const msg = await apiService.clearStudentDebt(roundId, student.studentId);
      setNotification({ type: 'success', message: msg || `Đã xóa nợ tín chỉ cho sinh viên ${student.studentCode} thành công!` });
      await loadList(roundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: await extractErrorMessage(err, 'Lỗi khi cập nhật trả nợ tín chỉ') });
    } finally {
      setClearingStudentId(null);
    }
  };

  const selectedRound = rounds.find((r) => r.roundId === roundId) || null;

  useEffect(() => {
    (async () => {
      try {
        const list = await apiService.getProjectRounds();
        setRounds(list || []);
        const active =
          list?.find((r) => r.status === 'OPEN') ||
          list?.find((r) => r.status === 'IN_PROGRESS') ||
          list?.[0];
        if (active) setRoundId(active.roundId);
      } catch {
        setNotification({ type: 'error', message: 'Không thể tải danh sách đợt đồ án' });
      }
    })();
  }, []);

  const loadList = async (id: number) => {
    try {
      setLoading(true);
      setData(await apiService.getEligibleStudents(id));
    } catch (err: any) {
      setData(null);
      setNotification({ type: 'error', message: await extractErrorMessage(err, 'Không thể tải danh sách sinh viên') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roundId !== null && tab === 'list') loadList(roundId);
  }, [roundId, tab]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleExport = async () => {
    if (roundId === null) return;
    try {
      setExporting(true);
      const blob = await apiService.exportEligibleStudents(roundId);
      downloadBlob(blob, `danh_sach_du_dieu_kien_nhan_do_an_${selectedRound?.roundCode || roundId}.xlsx`);
      setNotification({ type: 'success', message: 'Đã xuất file Excel danh sách đủ điều kiện nhận đồ án.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: await extractErrorMessage(err, 'Xuất Excel thất bại') });
    } finally {
      setExporting(false);
    }
  };

  const students = (data?.students || []).filter((s) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.studentCode?.toLowerCase().includes(q) ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.className || '').toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ELIGIBLE' ? s.eligible : s.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const columns: Column<EligibleStudentRow>[] = [
    { key: 'studentCode', title: 'Mã SV', width: '120px', render: (v) => <strong>{v}</strong> },
    { key: 'fullName', title: 'Họ và tên', width: '190px' },
    { key: 'className', title: 'Lớp', width: '130px' },
    { key: 'majorName', title: 'Ngành', width: '170px' },
    {
      key: 'debtCredits',
      title: 'Tín chỉ nợ',
      align: 'center',
      width: '100px',
      render: (v: number | null | undefined) =>
        v === null || v === undefined ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={data && v >= data.maxDebtCredits ? 'text-danger font-semibold' : 'text-success font-semibold'}>
            {v}
          </span>
        ),
    },
    {
      key: 'gpa',
      title: 'GPA',
      align: 'center',
      width: '80px',
      render: (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toFixed(2)),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      width: '170px',
      render: (v: string, record) => (
        <StatusBadge
          status={v}
          label={STATUS_LABEL[v] || v}
          variant={record.eligible ? (v === 'FORCE_APPROVED' ? 'info' : 'success') : v === 'NO_DATA' ? 'neutral' : 'danger'}
        />
      ),
    },
    {
      key: 'reasons',
      title: 'Ghi chú',
      render: (v: string[]) => <span className="text-note">{(v || []).join('; ')}</span>,
    },
    {
      key: 'actions',
      title: 'Rà soát nợ (GĐ5)',
      align: 'center',
      width: '180px',
      render: (_, record) => {
        const hasDebt = record.debtCredits !== null && record.debtCredits !== undefined && record.debtCredits > 0;
        if (!hasDebt) {
          return <span style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 600 }}>✓ Không nợ tín</span>;
        }
        return (
          <Button
            size="sm"
            variant="outline"
            loading={clearingStudentId === record.studentId}
            onClick={() => handleClearDebt(record)}
            style={{ fontSize: '0.78rem', padding: '4px 8px', borderColor: '#16a34a', color: '#16a34a' }}
            title="Xác nhận sinh viên đã trả hết nợ tín chỉ trước khi xét bảo vệ"
          >
            ⚡ Xác nhận trả nợ (=0)
          </Button>
        );
      },
    },
  ];

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Danh sách sinh viên đủ điều kiện nhận đồ án</h1>
          <p className="feature-page-subtitle">
            Giáo vụ import dữ liệu học vụ (Excel), hệ thống xét điều kiện nhận đồ án và lập danh sách theo đợt.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      <div className="feature-filter-card">
        <div className="filter-item" style={{ minWidth: '280px' }}>
          <label htmlFor="staffRound">Đợt đồ án:</label>
          <select
            id="staffRound"
            className="form-control"
            value={roundId ?? ''}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
          >
            {rounds.length === 0 && <option value="">-- Chưa có đợt đồ án --</option>}
            {rounds.map((r) => (
              <option key={r.roundId} value={r.roundId}>
                {r.name} ({r.roundCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="staff-tabs">
        <button className={`staff-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          📋 DS xét điều kiện &amp; Rà soát nợ tín chỉ
        </button>
        <button className={`staff-tab ${tab === 'import-students' ? 'active' : ''}`} onClick={() => setTab('import-students')}>
          📥 Import All-in-One: Lập DS SV &amp; Học vụ (GĐ1)
        </button>
        <button className={`staff-tab ${tab === 'academic-records' ? 'active' : ''}`} onClick={() => setTab('academic-records')}>
          📊 Chi tiết Dữ liệu học vụ
        </button>
      </div>

      {tab === 'import-students' && selectedRound && (
        <RoundStudentsTab
          roundId={selectedRound.roundId}
          roundName={selectedRound.name}
          roundCode={selectedRound.roundCode}
          isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
        />
      )}

      {tab === 'academic-records' && selectedRound && (
        <RoundAcademicRecordsTab
          roundId={selectedRound.roundId}
          roundName={selectedRound.name}
          roundCode={selectedRound.roundCode}
          isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
        />
      )}

      {tab === 'list' && (
        <>
          <p className="staff-hint">
            Điều kiện nhận đồ án: số tín chỉ nợ <strong>&lt; {data?.maxDebtCredits ?? 10}</strong> tín chỉ, không bị kỷ luật
            và đã có dữ liệu học vụ của đợt. Sinh viên chưa có dữ liệu học vụ sẽ <strong>không</strong> được tính là đủ điều kiện.
          </p>

          <div className="staff-kpis">
            <div className="staff-kpi">
              <div className="staff-kpi-value">{data?.totalStudents ?? 0}</div>
              <div className="staff-kpi-label">Tổng sinh viên trong đợt</div>
            </div>
            <div className="staff-kpi">
              <div className="staff-kpi-value ok">{data?.eligibleCount ?? 0}</div>
              <div className="staff-kpi-label">Đủ điều kiện nhận đồ án</div>
            </div>
            <div className="staff-kpi">
              <div className="staff-kpi-value bad">{data?.ineligibleCount ?? 0}</div>
              <div className="staff-kpi-label">Không đủ điều kiện</div>
            </div>
            <div className="staff-kpi">
              <div className="staff-kpi-value warn">{data?.noDataCount ?? 0}</div>
              <div className="staff-kpi-label">Chưa có dữ liệu học vụ</div>
            </div>
          </div>

          <div className="feature-filter-card">
            <div className="filter-item search-box">
              <label htmlFor="staffSearch">Tìm kiếm:</label>
              <input
                id="staffSearch"
                type="text"
                className="form-control"
                placeholder="Mã sinh viên, họ tên hoặc lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label htmlFor="staffStatus">Trạng thái:</label>
              <select
                id="staffStatus"
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="ELIGIBLE">Đủ điều kiện</option>
                <option value="INELIGIBLE">Không đủ điều kiện</option>
                <option value="NO_DATA">Chưa có dữ liệu học vụ</option>
                <option value="RESERVED">Đã bảo lưu</option>
                <option value="DISQUALIFIED">Bị loại khỏi đợt</option>
              </select>
            </div>
            <div className="staff-actions">
              <Button variant="outline" onClick={() => roundId !== null && loadList(roundId)} loading={loading}>
                Làm mới
              </Button>
              <Button
                variant="success"
                onClick={handleExport}
                loading={exporting}
                disabled={roundId === null || !data || data.totalStudents === 0}
              >
                Xuất Excel
              </Button>
            </div>
          </div>

          <div className="feature-table-wrapper">
            <Table
              columns={columns}
              dataSource={students}
              rowKey="studentId"
              loading={loading}
              emptyText="Chưa có sinh viên nào trong đợt hoặc không khớp bộ lọc"
            />
          </div>
        </>
      )}
    </div>
  );
};
