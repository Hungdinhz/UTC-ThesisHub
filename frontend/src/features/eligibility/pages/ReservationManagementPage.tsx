import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Modal, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { ReservationReviewModal } from '../components/ReservationReviewModal';
import { ReservationSubmitModal } from '../components/ReservationSubmitModal';
import { AdminCreateReservationModal } from '../components/AdminCreateReservationModal';
import { eligibilityService } from '../services/eligibilityService';
import { thesisService } from '../../thesis/services/thesisService';
import type { Thesis } from '../../thesis/types';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem, StudentProjectRoundItem } from '../../../types';
import type { AdminCreateReservationRequest, ReservationRequestItem } from '../types';
import './EligibilityPages.css';

const readUrlQueryParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

export const ReservationManagementPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isStudent = userType === 'student';
  const canReview =
    userType === 'admin' ||
    userType === 'academic_staff' ||
    userType === 'supervisor' ||
    userType === 'committee_member';
  const canAdminCreate = userType === 'admin' || userType === 'academic_staff';

  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | 'ALL' | null>(null);
  const [roundsReady, setRoundsReady] = useState(false);

  const [allReservations, setAllReservations] = useState<ReservationRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [selectedForReview, setSelectedForReview] = useState<ReservationRequestItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Admin / Academic staff create reservation flow
  const [isPickStudentModalOpen, setIsPickStudentModalOpen] = useState(false);
  const [loadingRoundStudents, setLoadingRoundStudents] = useState(false);
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [roundTheses, setRoundTheses] = useState<Thesis[]>([]);
  const [pickSearch, setPickSearch] = useState('');
  const [selectedStudentForAdminReserve, setSelectedStudentForAdminReserve] = useState<{
    studentId: number;
    studentCode?: string;
    studentName?: string;
    thesisId?: number;
    thesisTitle?: string;
    defaultCategory?: any;
    defaultReason?: string;
  } | null>(null);

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
  const [studentContextReady, setStudentContextReady] = useState(!isStudent);

  // Load context for Student vs Rounds for Staff/Admin/Supervisor
  useEffect(() => {
    let active = true;
    const initContext = async () => {
      if (isStudent) {
        try {
          const myStatus = await apiService.getMyRoundStatus().catch(() => null);
          const rId = myStatus?.roundId;
          const sId = myStatus?.studentId || (user as any)?.student?.id || user?.student_id || user?.id;
          const sCode =
            myStatus?.studentCode || (user as any)?.student?.student_code || user?.studentCode || user?.username;
          const sName = user?.fullName || (user as any)?.full_name;
          let resolvedThesis: any = null;
          if (sId && rId) {
            resolvedThesis = await thesisService.getThesisByStudentAndRound(Number(sId), rId).catch(() => null);
          }
          if (!resolvedThesis && rId) {
            const list = await thesisService.searchTheses({ roundId: rId }).catch(() => []);
            resolvedThesis =
              list.find(
                (t) =>
                  (sId && Number(t.studentId) === Number(sId)) ||
                  (sCode && t.studentCode === String(sCode))
              ) || null;
          }
          if (active) {
            setStudentContext({
              roundId: rId,
              studentId: sId ? Number(sId) : undefined,
              studentCode: sCode ? String(sCode) : undefined,
              studentName: sName,
              thesisId: resolvedThesis?.id,
              thesisCode: resolvedThesis?.thesisCode,
              thesisTitle: resolvedThesis?.titleVn,
            });
          }
        } finally {
          if (active) {
            setStudentContextReady(true);
            setRoundsReady(true);
          }
        }
        return;
      }

      try {
        const list = await apiService.getProjectRounds().catch(() => [] as ProjectRoundItem[]);
        if (!active) return;
        setRounds(list || []);
        const urlRoundRaw = readUrlQueryParam('roundId');
        const urlRoundNum = urlRoundRaw ? Number(urlRoundRaw) : NaN;
        const matchedFromUrl =
          !isNaN(urlRoundNum) && list?.find((r) => r.roundId === urlRoundNum);
        const picked =
          matchedFromUrl ||
          list?.find((r) => r.status === 'IN_PROGRESS') ||
          list?.find((r) => r.status === 'OPEN') ||
          list?.[0] ||
          null;
        setSelectedRoundId(picked ? picked.roundId : 'ALL');
      } finally {
        if (active) setRoundsReady(true);
      }
    };

    initContext();
    return () => {
      active = false;
    };
  }, [isStudent, user?.id]);

  const loadReservations = async () => {
    if (!roundsReady || (isStudent && !studentContextReady)) return;
    try {
      setLoading(true);
      const studentId = studentContext.studentId || user?.id || user?.student_id;
      const effectiveRoundId = isStudent
        ? studentContext.roundId
        : selectedRoundId === 'ALL'
        ? undefined
        : selectedRoundId || undefined;

      const data = await eligibilityService.getReservations({
        projectRoundId: effectiveRoundId,
        studentId: isStudent && studentId ? studentId : undefined,
      });

      if (isStudent && Array.isArray(data)) {
        const studentCode = user?.student_id || user?.studentCode || user?.username;
        const myItems = data.filter(
          (r) =>
            (studentId && r.studentId === studentId) ||
            (studentCode && r.studentCode === String(studentCode))
        );
        setAllReservations(myItems.length > 0 ? myItems : data.length <= 1 ? data : []);
      } else {
        setAllReservations(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.message || 'Không thể tải danh sách đơn bảo lưu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [roundsReady, studentContextReady, selectedRoundId, studentContext.roundId, studentContext.studentId]);

  const openPickStudentModal = async () => {
    const targetRound =
      typeof selectedRoundId === 'number'
        ? selectedRoundId
        : rounds[0]?.roundId;
    if (!targetRound) {
      setNotification({ type: 'error', message: 'Vui lòng chọn một đợt đồ án cụ thể để lập quyết định bảo lưu.' });
      return;
    }
    setIsPickStudentModalOpen(true);
    setPickSearch('');
    try {
      setLoadingRoundStudents(true);
      const [studentsRes, thesesRes] = await Promise.all([
        apiService.getStudentsInRound(targetRound, { page: 0, size: 300 }).catch(() => null),
        thesisService.searchTheses({ roundId: targetRound }).catch(() => [] as Thesis[]),
      ]);
      const list = studentsRes?.content || [];
      setRoundStudents(
        [...list].sort((a, b) =>
          (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
        )
      );
      setRoundTheses(thesesRes || []);
    } finally {
      setLoadingRoundStudents(false);
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
      setNotification({ type: 'error', message: error?.message || 'Thất bại khi xử lý đơn bảo lưu' });
    }
  };

  const handleSubmitNew = async (data: any) => {
    try {
      await eligibilityService.submitReservation(data);
      setNotification({ type: 'success', message: 'Nộp đơn xin bảo lưu đồ án thành công' });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.message || 'Thất bại khi nộp đơn' });
    }
  };

  const handleAdminCreateReservation = async (data: AdminCreateReservationRequest) => {
    try {
      await eligibilityService.createReservationByAdmin(data);
      setNotification({ type: 'success', message: 'Đã lập quyết định bảo lưu cho sinh viên thành công' });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.message || 'Lỗi khi lập quyết định bảo lưu' });
    }
  };

  const stats = useMemo(() => {
    const total = allReservations.length;
    const pending = allReservations.filter((r) => r.status === 'PENDING').length;
    const approved = allReservations.filter((r) => r.status === 'APPROVED').length;
    const rejected = allReservations.filter((r) => r.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [allReservations]);

  const filteredReservations = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return allReservations.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && r.reasonCategory !== categoryFilter) return false;
      if (kw) {
        const hay = `${r.studentCode || ''} ${r.studentName || ''} ${r.thesisTitle || ''} ${r.reason || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [allReservations, statusFilter, categoryFilter, searchKeyword]);

  const selectedRoundObj =
    typeof selectedRoundId === 'number'
      ? rounds.find((r) => r.roundId === selectedRoundId) || null
      : null;

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'INSUFFICIENT_CREDITS':
        return <span className="utc-badge utc-badge-danger">Chưa đủ tín chỉ</span>;
      case 'SUPERVISOR_NOT_ELIGIBLE':
        return <span className="utc-badge utc-badge-warning">GVHD xét chưa đạt</span>;
      case 'RESEARCH_PROGRESS':
        return <span className="utc-badge utc-badge-indigo">Tiến độ đề tài</span>;
      case 'HEALTH_REASONS':
        return <span className="utc-badge utc-badge-success">Lý do sức khỏe</span>;
      case 'INTERNSHIP_WORK':
        return <span className="utc-badge utc-badge-info">Thực tập / Công tác</span>;
      case 'FAMILY_CIRCUMSTANCES':
        return <span className="utc-badge utc-badge-purple">Hoàn cảnh gia đình</span>;
      default:
        return <span className="utc-badge utc-badge-muted">{cat || 'Lý do khác'}</span>;
    }
  };

  const columns: Column<ReservationRequestItem>[] = [
    {
      key: 'id',
      title: 'Mã đơn',
      width: '80px',
      render: (val) => <span className="font-semibold text-primary">#{val}</span>,
    },
    {
      key: 'studentCode',
      title: 'Sinh viên & Đề tài',
      width: '240px',
      render: (val, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#0a3273' }}>{val || `SV${record.studentId}`}</span>
            {record.roundCode && (
              <span className="utc-round-pill-sm">{record.roundCode}</span>
            )}
          </div>
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
            {record.studentName || 'Sinh viên'}
          </div>
          {record.thesisTitle && (
            <div
              style={{
                fontSize: '0.76rem',
                color: '#64748b',
                marginTop: '3px',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={record.thesisTitle}
            >
              📘 {record.thesisTitle}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reasonCategory',
      title: 'Phân loại',
      width: '150px',
      render: (val) => getCategoryBadge(val),
    },
    {
      key: 'reason',
      title: 'Chi tiết lý do & Minh chứng',
      render: (val, record) => (
        <div>
          <div className="text-reason">{val}</div>
          {record.supervisorComment && (
            <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '4px' }}>
              Ý kiến GVHD: <em>{record.supervisorComment}</em>
            </div>
          )}
          {record.evidenceFileUrl && (
            <a
              href={record.evidenceFileUrl}
              target="_blank"
              rel="noreferrer"
              className="evidence-attachment-tag"
              style={{ marginTop: '5px' }}
            >
              📎 {record.evidenceFileName || 'Tệp minh chứng'}
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
      width: '190px',
      render: (val, record) =>
        val || record.rejectionReason ? (
          <div>
            <div className="text-note">{val || record.rejectionReason}</div>
            {(record.reviewerName || record.reviewedBy) && (
              <div className="text-muted text-sm">Duyệt bởi: {record.reviewerName || record.reviewedBy}</div>
            )}
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
                  <Button variant="primary" size="sm" onClick={() => setSelectedForReview(record)}>
                    Duyệt đơn
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setSelectedForReview(record)}>
                    Chi tiết
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const filteredPickerStudents = useMemo(() => {
    const kw = pickSearch.trim().toLowerCase();
    return roundStudents.filter((st) => {
      if (!kw) return true;
      return `${st.studentCode} ${st.fullName} ${st.className || ''}`.toLowerCase().includes(kw);
    });
  }, [roundStudents, pickSearch]);

  return (
    <div className="feature-page-container">
      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Unified Hero & Round Selector Bar */}
      <div className="utc-stage-hero">
        <div className="utc-stage-hero-main">
          <div>
            <div className="utc-stage-eyebrow">
              <span>⏸️</span> GIAI ĐOẠN 5 • QUẢN LÝ HỒ SƠ BẢO LƯU ĐỒ ÁN
            </div>
            <h1 className="utc-stage-title">Quản lý và Phê duyệt Đơn bảo lưu</h1>
            <p className="utc-stage-subtitle">
              Tiếp nhận, thẩm định minh chứng và phê duyệt đơn xin hoãn / bảo lưu đề tài đồ án tốt nghiệp trước khi chốt Hội đồng.
            </p>
          </div>

          <div className="utc-stage-hero-actions">
            {isStudent ? (
              <Button variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
                ➕ Nộp đơn xin bảo lưu mới
              </Button>
            ) : canAdminCreate ? (
              <Button
                variant="primary"
                onClick={openPickStudentModal}
                disabled={selectedRoundId === 'ALL' && rounds.length === 0}
              >
                ⚡ Lập quyết định bảo lưu
              </Button>
            ) : null}
          </div>
        </div>

        {!isStudent && (
          <div className="utc-round-control-bar">
            <div className="utc-round-select-group">
              <label htmlFor="reservationRoundSelect">🗓️ Đợt đồ án:</label>
              <select
                id="reservationRoundSelect"
                className="utc-round-select"
                value={selectedRoundId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoundId(val === 'ALL' ? 'ALL' : Number(val));
                }}
              >
                <option value="ALL">🌐 Tất cả các đợt đồ án</option>
                {rounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    {r.name} ({r.roundCode}) — {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="utc-round-meta-pills">
              {selectedRoundObj ? (
                <>
                  <span className={`utc-round-status-badge status-${(selectedRoundObj.status || '').toLowerCase()}`}>
                    {selectedRoundObj.status === 'OPEN'
                      ? '● Đang mở'
                      : selectedRoundObj.status === 'IN_PROGRESS'
                      ? '● Đang thực hiện'
                      : selectedRoundObj.status}
                  </span>
                  {selectedRoundObj.trainingProgramName && (
                    <span className="utc-round-program-pill">🎓 {selectedRoundObj.trainingProgramName}</span>
                  )}
                </>
              ) : (
                <span className="utc-round-program-pill">Đang hiển thị đơn từ tất cả các đợt</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="utc-kpi-strip">
        <div
          className={`utc-kpi-box accent-navy ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">📋</span>
            <span className="utc-kpi-label">Tổng số đơn</span>
          </div>
          <div className="utc-kpi-num">{stats.total}</div>
          <div className="utc-kpi-sub">{selectedRoundObj ? selectedRoundObj.roundCode : 'Toàn hệ thống'}</div>
        </div>

        <div
          className={`utc-kpi-box accent-amber ${statusFilter === 'PENDING' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('PENDING')}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">⏳</span>
            <span className="utc-kpi-label">Chờ phê duyệt</span>
          </div>
          <div className="utc-kpi-num warn">{stats.pending}</div>
          <div className="utc-kpi-sub">Cần Khoa xem xét minh chứng</div>
        </div>

        <div
          className={`utc-kpi-box accent-green ${statusFilter === 'APPROVED' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('APPROVED')}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">✅</span>
            <span className="utc-kpi-label">Đã phê duyệt</span>
          </div>
          <div className="utc-kpi-num ok">{stats.approved}</div>
          <div className="utc-kpi-sub">Đã đóng băng đề tài sang đợt sau</div>
        </div>

        <div
          className={`utc-kpi-box accent-red ${statusFilter === 'REJECTED' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('REJECTED')}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">❌</span>
            <span className="utc-kpi-label">Bị từ chối</span>
          </div>
          <div className="utc-kpi-num bad">{stats.rejected}</div>
          <div className="utc-kpi-sub">Tiếp tục thực hiện đợt hiện tại</div>
        </div>
      </div>

      {/* Collapsible / Clean Guidance Alert Banner */}
      <div className="utc-guidance-banner">
        <strong>📌 Quy chế bảo lưu đồ án tốt nghiệp UTC:</strong>
        <ul>
          <li>
            <strong>Trường hợp 1 (Nợ tín chỉ):</strong> Đề tài đã được GVHD duyệt đạt nhưng sinh viên chưa trả hết nợ tín chỉ tốt nghiệp (Cử nhân: 142 TC, Kỹ sư: 180 TC) → Được bảo lưu kết quả và điểm GVHD sang đợt sau.
          </li>
          <li>
            <strong>Trường hợp 2 (Tiến độ / Lý do cá nhân):</strong> Đã được phân công GVHD và giao đề tài nhưng chưa hoàn thành tiến độ hoặc có lý do sức khỏe/công tác có minh chứng → Chuyển hồ sơ bảo lưu để hoàn thiện vào đợt kế tiếp.
          </li>
        </ul>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>Trạng thái:</label>
          <div className="btn-group-toggle">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
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

        <div className="filter-group" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <input
            type="text"
            className="utc-toolbar-input"
            placeholder="Tìm MSSV, họ tên, đề tài..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ minWidth: '210px' }}
          />
          <select
            className="utc-toolbar-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Lọc theo lý do bảo lưu"
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
          dataSource={filteredReservations}
          loading={loading}
          rowKey="id"
          emptyText="Không có đơn xin bảo lưu nào phù hợp với đợt và bộ lọc đang chọn"
        />
      </div>

      {/* Modal Xét duyệt cho Admin / Giáo vụ */}
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
        projectRoundId={studentContext.roundId || undefined}
      />

      {/* Modal Chọn Sinh viên để Giáo vụ / Admin Lập quyết định bảo lưu */}
      <Modal
        isOpen={isPickStudentModalOpen}
        onClose={() => setIsPickStudentModalOpen(false)}
        title={`Chọn sinh viên lập quyết định bảo lưu (${selectedRoundObj?.name || rounds[0]?.name || 'Đợt đồ án'})`}
        maxWidth="760px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.84rem', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            💡 Chỉ những sinh viên <strong>đã có đề tài chính thức và đã được phân công GVHD</strong> trong đợt mới đủ điều kiện lập quyết định bảo lưu sang đợt sau.
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Tìm nhanh theo MSSV, họ tên hoặc lớp..."
            value={pickSearch}
            onChange={(e) => setPickSearch(e.target.value)}
          />

          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            {loadingRoundStudents ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                Đang tải danh sách sinh viên trong đợt...
              </div>
            ) : filteredPickerStudents.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                Không tìm thấy sinh viên phù hợp trong đợt này.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Sinh viên</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Đề tài &amp; GVHD</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Nợ TC</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPickerStudents.map((st) => {
                    const thesis = roundTheses.find(
                      (t) =>
                        t.studentId === st.studentId ||
                        (st.studentCode && t.studentCode?.toLowerCase() === st.studentCode.toLowerCase())
                    );
                    const hasThesisAndLecturer = Boolean(thesis && thesis.id && (thesis.lecturerId || thesis.lecturerFullName));
                    const isAlreadyReserved = st.status === 'RESERVED' || thesis?.status === 'RESERVED';

                    return (
                      <tr key={st.studentRoundId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{st.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.className || st.majorCode}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {hasThesisAndLecturer && thesis ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{thesis.titleVn}</div>
                              <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                                GVHD: {thesis.lecturerFullName || `#${thesis.lecturerId}`}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đề tài / GVHD</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: (st.debtCredits ?? 0) > 0 ? '#dc2626' : '#16a34a' }}>
                          {st.debtCredits ?? 0} TC
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {isAlreadyReserved ? (
                            <span className="utc-badge utc-badge-purple">Đã bảo lưu</span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!hasThesisAndLecturer}
                              onClick={() => {
                                setIsPickStudentModalOpen(false);
                                setSelectedStudentForAdminReserve({
                                  studentId: st.studentId,
                                  studentCode: st.studentCode,
                                  studentName: st.fullName,
                                  thesisId: thesis?.id,
                                  thesisTitle: thesis?.titleVn,
                                  defaultCategory:
                                    st.debtCredits && st.debtCredits > 0
                                      ? 'INSUFFICIENT_CREDITS'
                                      : 'SUPERVISOR_NOT_ELIGIBLE',
                                  defaultReason:
                                    st.debtCredits && st.debtCredits > 0
                                      ? `Bảo lưu kết quả đồ án do chưa hoàn thành nợ tín chỉ (Còn nợ: ${st.debtCredits} tín chỉ)`
                                      : 'Bảo lưu kết quả đồ án theo quyết định của Khoa / đề nghị GVHD',
                                });
                              }}
                            >
                              Lập đơn
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Giáo vụ / Admin lập quyết định bảo lưu */}
      <AdminCreateReservationModal
        isOpen={Boolean(selectedStudentForAdminReserve)}
        onClose={() => setSelectedStudentForAdminReserve(null)}
        student={selectedStudentForAdminReserve}
        projectRoundId={typeof selectedRoundId === 'number' ? selectedRoundId : rounds[0]?.roundId}
        onConfirm={handleAdminCreateReservation}
      />
    </div>
  );
};
