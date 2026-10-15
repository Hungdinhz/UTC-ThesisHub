import React, { useState, useEffect } from 'react';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { EligibilitySummaryCard } from '../components/EligibilitySummaryCard';
import { ForceApproveModal } from '../components/ForceApproveModal';
import { DisqualifyModal } from '../components/DisqualifyModal';
import { eligibilityService } from '../services/eligibilityService';
import type { EligibilityCheckResponse } from '../types';
import './EligibilityPages.css';

export const ThesisEligibilityPage: React.FC = () => {
  const [students, setStudents] = useState<EligibilityCheckResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudentForForce, setSelectedStudentForForce] = useState<EligibilityCheckResponse | null>(null);
  const [selectedStudentForDisqualify, setSelectedStudentForDisqualify] = useState<EligibilityCheckResponse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await eligibilityService.getAllStudentsEligibility(10);
      setStudents(data);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Không thể tải danh sách sinh viên' });
    } finally {
      setLoading(false);
    }
  };

  const handleForceApprove = async (reason: string, approvedBy: string) => {
    if (!selectedStudentForForce) return;
    try {
      await eligibilityService.forceApprove({
        studentId: selectedStudentForForce.studentId,
        projectRoundId: selectedStudentForForce.projectRoundId || 10,
        reason,
        approvedBy,
      });
      setNotification({
        type: 'success',
        message: `Đã duyệt đặc cách thành công cho sinh viên ${selectedStudentForForce.studentName} (${selectedStudentForForce.studentCode})`,
      });
      await loadStudents();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi duyệt đặc cách' });
    }
  };

  const handleDisqualify = async (reason: string, disqualifiedBy: string) => {
    if (!selectedStudentForDisqualify) return;
    try {
      await eligibilityService.disqualify({
        studentId: selectedStudentForDisqualify.studentId,
        projectRoundId: selectedStudentForDisqualify.projectRoundId || 10,
        reason,
        disqualifiedBy,
      });
      setNotification({
        type: 'success',
        message: `Đã loại sinh viên ${selectedStudentForDisqualify.studentName} (${selectedStudentForDisqualify.studentCode}) khỏi đợt làm đồ án`,
      });
      await loadStudents();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi loại sinh viên' });
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      s.status === statusFilter ||
      (statusFilter === 'ELIGIBLE' && s.eligible);
    return matchesSearch && matchesStatus;
  });

  const kpis = {
    total: students.length,
    eligible: students.filter((s) => s.status === 'ELIGIBLE' || s.eligible).length,
    ineligible: students.filter((s) => s.status === 'INELIGIBLE').length,
    forceApproved: students.filter((s) => s.status === 'FORCE_APPROVED').length,
    disqualified: students.filter((s) => s.status === 'DISQUALIFIED').length,
  };

  const columns: Column<EligibilityCheckResponse>[] = [
    {
      key: 'studentCode',
      title: 'Mã SV',
      width: '120px',
      render: (val) => <span className="font-semibold text-primary">{val}</span>,
    },
    {
      key: 'studentName',
      title: 'Họ và tên',
      width: '180px',
    },
    {
      key: 'gpa',
      title: 'Điểm GPA',
      align: 'center',
      width: '100px',
      render: (val: number) => (
        <span className={val >= 2.5 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'accumulatedCredits',
      title: 'Tín chỉ',
      align: 'center',
      width: '100px',
      render: (val: number) => (
        <span className={val >= 110 ? 'text-success' : 'text-warning font-semibold'}>
          {val} / 110
        </span>
      ),
    },
    {
      key: 'unpassedPrerequisites',
      title: 'Môn nợ / Tiên quyết',
      render: (val: string[]) =>
        val && val.length > 0 ? (
          <span className="badge-debt">{val.join(', ')}</span>
        ) : (
          <span className="text-muted">Không có</span>
        ),
    },
    {
      key: 'status',
      title: 'Tình trạng',
      align: 'center',
      width: '150px',
      render: (val: string, record) => {
        let label = 'Chờ xét';
        if (record.status === 'FORCE_APPROVED') label = 'Đặc cách';
        else if (record.status === 'DISQUALIFIED') label = 'Bị loại';
        else if (record.eligible) label = 'Đủ điều kiện';
        else label = 'Không đủ ĐK';
        return <StatusBadge status={val} label={label} />;
      },
    },
    {
      key: 'reason',
      title: 'Ghi chú / Đánh giá',
      render: (val: string) => <span className="text-note">{val}</span>,
    },
    {
      key: 'actions',
      title: 'Hành động',
      align: 'center',
      width: '200px',
      render: (_, record) => (
        <div className="table-actions-cell">
          <Button
            size="sm"
            variant="success"
            onClick={() => setSelectedStudentForForce(record)}
            title="Duyệt đặc cách sinh viên này"
          >
            Force Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setSelectedStudentForDisqualify(record)}
            title="Loại sinh viên khỏi đợt"
          >
            Loại
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xét duyệt điều kiện làm đồ án tốt nghiệp</h1>
          <p className="feature-page-subtitle">
            Hệ thống xét duyệt điều kiện làm đồ án dựa trên kết quả tích lũy GPA, số tín chỉ và nợ môn tiên quyết.
          </p>
        </div>
        <Button variant="primary" onClick={loadStudents} loading={loading}>
          Làm mới dữ liệu
        </Button>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* KPI Cards */}
      <EligibilitySummaryCard {...kpis} />

      {/* Filter Bar */}
      <div className="feature-filter-card">
        <div className="filter-item search-box">
          <label htmlFor="searchStd">Tìm kiếm:</label>
          <input
            id="searchStd"
            type="text"
            className="form-control"
            placeholder="Tìm theo Mã sinh viên hoặc Họ tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label htmlFor="statusFilter">Trạng thái:</label>
          <select
            id="statusFilter"
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ELIGIBLE">Đủ điều kiện tiêu chuẩn</option>
            <option value="INELIGIBLE">Không đủ điều kiện</option>
            <option value="FORCE_APPROVED">Đã duyệt đặc cách</option>
            <option value="DISQUALIFIED">Đã loại khỏi đợt</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="feature-table-wrapper">
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="studentId"
          loading={loading}
          emptyText="Không tìm thấy sinh viên phù hợp điều kiện lọc"
        />
      </div>

      {/* Modals */}
      <ForceApproveModal
        isOpen={Boolean(selectedStudentForForce)}
        onClose={() => setSelectedStudentForForce(null)}
        student={selectedStudentForForce}
        onConfirm={handleForceApprove}
      />

      <DisqualifyModal
        isOpen={Boolean(selectedStudentForDisqualify)}
        onClose={() => setSelectedStudentForDisqualify(null)}
        student={selectedStudentForDisqualify}
        onConfirm={handleDisqualify}
      />
    </div>
  );
};
