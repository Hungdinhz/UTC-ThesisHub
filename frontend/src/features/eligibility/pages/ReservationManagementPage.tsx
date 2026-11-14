import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { ReservationReviewModal } from '../components/ReservationReviewModal';
import { ReservationSubmitModal } from '../components/ReservationSubmitModal';
import { eligibilityService } from '../services/eligibilityService';
import { thesisService } from '../../thesis/services/thesisService';
import { apiService } from '../../../services/api';
import type { ReservationRequestItem } from '../types';
import './EligibilityPages.css';

export const ReservationManagementPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isStudent = userType === 'student';
  const canReview = userType === 'admin' || userType === 'supervisor' || userType === 'committee_member';

  const [reservations, setReservations] = useState<ReservationRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedForReview, setSelectedForReview] = useState<ReservationRequestItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [studentContext, setStudentContext] = useState<{
    roundId?: number;
    studentId?: number;
    studentCode?: string;
    studentName?: string;
    thesisId?: number;
    thesisCode?: string;
    thesisTitle?: string;
  }>({});

  useEffect(() => {
    const loadStudentContext = async () => {
      if (!isStudent) return;
      try {
        const myStatus = await apiService.getMyRoundStatus().catch(() => null);
        const rId = myStatus?.roundId;
        const sId = myStatus?.studentId || (user as any)?.student?.id || user?.student_id || user?.id;
        const sCode = myStatus?.studentCode || (user as any)?.student?.student_code || user?.studentCode || user?.username;
        const sName = user?.fullName || (user as any)?.full_name;
        let resolvedThesis: any = null;
        if (sId && rId) {
          resolvedThesis = await thesisService.getThesisByStudentAndRound(Number(sId), rId).catch(() => null);
        }
        if (!resolvedThesis && rId) {
          const list = await thesisService.searchTheses({ roundId: rId }).catch(() => []);
          resolvedThesis = list.find(
            (t) => (sId && Number(t.studentId) === Number(sId)) || (sCode && t.studentCode === String(sCode))
          ) || null;
        }
        setStudentContext({
          roundId: rId,
          studentId: sId ? Number(sId) : undefined,
          studentCode: sCode ? String(sCode) : undefined,
          studentName: sName,
          thesisId: resolvedThesis?.id,
          thesisCode: resolvedThesis?.thesisCode,
          thesisTitle: resolvedThesis?.titleVn,
        });
      } catch {
        // ignore
      }
    };
    loadStudentContext();
  }, [isStudent, user?.id]);

  useEffect(() => {
    loadReservations();
  }, [statusFilter, categoryFilter, studentContext.roundId, studentContext.studentId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const studentId = studentContext.studentId || user?.id || user?.student_id;
      const data = await eligibilityService.getReservations({
        projectRoundId: studentContext.roundId || (isStudent ? undefined : 10),
        studentId: isStudent && studentId ? studentId : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      });
      if (isStudent && Array.isArray(data)) {
        const studentCode = user?.student_id || user?.studentCode || user?.username;
        const myItems = data.filter(r => (studentId && r.studentId === studentId) || (studentCode && r.studentCode === studentCode));
        setReservations(myItems.length > 0 ? myItems : (data.length <= 1 ? data : []));
      } else {
        setReservations(data);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Không thể tải danh sách đơn bảo lưu' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED', reviewNotes: string, reviewedBy: string) => {
    if (!selectedForReview) return;
    try {
      await eligibilityService.reviewReservation(selectedForReview.id, {
        status,
        reviewNotes,
        reviewedBy,
      });
      setNotification({
        type: 'success',
        message: `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} đơn bảo lưu của sinh viên thành công`,
      });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi xử lý đơn bảo lưu' });
    }
  };

  const handleSubmitNew = async (data: any) => {
    try {
      await eligibilityService.submitReservation(data);
      setNotification({ type: 'success', message: 'Nộp đơn xin bảo lưu đồ án thành công' });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi nộp đơn' });
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'INSUFFICIENT_CREDITS':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Chưa đủ tín chỉ</span>;
      case 'SUPERVISOR_NOT_ELIGIBLE':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>GVHD xét chưa đạt</span>;
      case 'RESEARCH_PROGRESS':
        return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Tiến độ đề tài</span>;
      case 'HEALTH_REASONS':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Lý do sức khỏe</span>;
      case 'INTERNSHIP_WORK':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Thực tập / Công tác</span>;
      default:
        return <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{cat || 'Lý do khác'}</span>;
    }
  };

  const columns: Column<ReservationRequestItem>[] = [
    {
      key: 'id',
      title: 'Mã đơn',
      width: '80px',
      render: (val) => <span className="font-semibold">#{val}</span>,
    },
    {
      key: 'studentCode',
      title: 'Sinh viên',
      width: '180px',
      render: (val, record) => (
        <div>
          <div className="font-semibold text-primary">{val || `SV${record.studentId}`}</div>
          <div className="text-muted text-sm">{record.studentName || 'Sinh viên'}</div>
          {record.thesisTitle && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.thesisTitle}>
              📘 {record.thesisTitle}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reasonCategory',
      title: 'Phân loại',
      width: '140px',
      render: (val) => getCategoryBadge(val),
    },
    {
      key: 'reason',
      title: 'Chi tiết lý do & Minh chứng',
      render: (val, record) => (
        <div>
          <div className="text-reason">{val}</div>
          {record.supervisorComment && (
            <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>
              Ý kiến GVHD: <em>{record.supervisorComment}</em>
            </div>
          )}
          {record.evidenceFileUrl && (
            <a
              href={record.evidenceFileUrl}
              target="_blank"
              rel="noreferrer"
              className="evidence-attachment-tag"
              style={{ display: 'inline-block', marginTop: '4px' }}
            >
              📎 Tệp minh chứng
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'submittedAt',
      title: 'Ngày nộp',
      width: '110px',
      render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      width: '130px',
      render: (val) => {
        let label = 'Chờ duyệt';
        if (val === 'APPROVED') label = 'Đã duyệt';
        if (val === 'REJECTED') label = 'Từ chối';
        return <StatusBadge status={val} label={label} />;
      },
    },
    {
      key: 'reviewNotes',
      title: 'Ý kiến phê duyệt',
      width: '180px',
      render: (val, record) =>
        val ? (
          <div>
            <div className="text-note">{val}</div>
            <div className="text-muted text-sm">Duyệt bởi: {record.reviewerName || record.reviewedBy}</div>
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    ...(canReview
      ? [
          {
            key: 'actions',
            title: 'Thao tác',
            align: 'center' as const,
            width: '120px',
            render: (_: any, record: ReservationRequestItem) => (
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {record.status === 'PENDING' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedForReview(record)}
                  >
                    Duyệt đơn
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForReview(record)}
                  >
                    Xem lại
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="feature-page-container">
      {notification && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Quản lý và Phê duyệt Đơn bảo lưu</h1>
          <p className="feature-page-subtitle">
            Tiếp nhận và xử lý đơn xin hoãn / bảo lưu đề tài đồ án tốt nghiệp trong giai đoạn Xét điều kiện bảo vệ cuối kỳ (chưa trả đủ tín chỉ, GVHD xét chưa đạt tiến độ, hoặc lý do y tế/công tác).
          </p>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
            ➕ Nộp đơn xin bảo lưu mới
          </Button>
        </div>
      </div>

      {/* Guidance Alert Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
        <strong>📌 Hướng dẫn quy chế bảo lưu đồ án tốt nghiệp:</strong>
        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
          <li><strong>Trường hợp 1 (Học vụ):</strong> Đồ án đã được GVHD đồng ý cho bảo vệ nhưng sinh viên chưa hoàn thành trả hết nợ tín chỉ tốt nghiệp (Cử nhân: 142 TC, Kỹ sư: 180 TC) → Được bảo lưu kết quả đồ án và điểm GVHD sang đợt sau.</li>
          <li><strong>Trường hợp 2 (Tiến độ):</strong> Được phân GVHD nhưng đến cuối quá trình GVHD xét chưa đủ điều kiện bảo vệ → Được bảo lưu khối lượng công việc đã làm để tiếp tục hoàn thiện sang đợt sau.</li>
          <li><strong>Hạn chót:</strong> Đơn phải được gửi và duyệt trước khi Khoa tiến hành chốt danh sách và thành lập Hội đồng bảo vệ.</li>
        </ul>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-group">
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginRight: '8px' }}>Trạng thái:</label>
          <div className="btn-group-toggle">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                className={`toggle-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' && 'Tất cả đơn'}
                {st === 'PENDING' && 'Chờ duyệt'}
                {st === 'APPROVED' && 'Đã chấp thuận'}
                {st === 'REJECTED' && 'Bị từ chối'}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group" style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginRight: '8px' }}>Lý do:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">-- Tất cả lý do --</option>
            <option value="INSUFFICIENT_CREDITS">Chưa trả đủ tín chỉ nợ</option>
            <option value="SUPERVISOR_NOT_ELIGIBLE">GVHD xét chưa đạt tiến độ</option>
            <option value="RESEARCH_PROGRESS">Tiến độ nghiên cứu đề tài</option>
            <option value="HEALTH_REASONS">Lý do sức khỏe / Y tế</option>
            <option value="INTERNSHIP_WORK">Thực tập / Công tác</option>
            <option value="FAMILY_CIRCUMSTANCES">Hoàn cảnh gia đình</option>
            <option value="OTHER">Lý do khác</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="content-card">
        <Table<ReservationRequestItem>
          columns={columns}
          dataSource={reservations}
          loading={loading}
          rowKey="id"
          emptyText="Không tìm thấy đơn xin bảo lưu nào phù hợp với bộ lọc"
        />
      </div>

      {/* Modal Xét duyệt cho Admin */}
      <ReservationReviewModal
        isOpen={Boolean(selectedForReview)}
        onClose={() => setSelectedForReview(null)}
        reservation={selectedForReview}
        onConfirm={handleReview}
      />

      {/* Modal Nộp đơn cho Sinh viên */}
      <ReservationSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitNew}
        defaultStudentId={studentContext.studentId || user?.id || user?.student_id || 101}
        studentCode={studentContext.studentCode || user?.studentCode || user?.username}
        studentName={studentContext.studentName || user?.fullName}
        defaultThesisId={studentContext.thesisId}
        thesisCode={studentContext.thesisCode}
        thesisTitle={studentContext.thesisTitle}
        projectRoundId={studentContext.roundId || 10}
      />
    </div>
  );
};
