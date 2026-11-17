import React, { useState, useEffect, useMemo } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { eligibilityService } from '../services/eligibilityService';
import { thesisService } from '../../thesis/services/thesisService';
import type { Thesis } from '../../thesis/types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  FinalDefenseEligibilityResponse,
  ReservationRequestItem,
  AdminCreateReservationRequest,
} from '../types';
import type { ProjectRoundItem, StudentProjectRoundItem } from '../../../types';
import { ReservationReviewModal } from '../components/ReservationReviewModal';
import { AdminCreateReservationModal } from '../components/AdminCreateReservationModal';
import { EditAcademicRecordModal } from '../components/EditAcademicRecordModal';
import { toast } from '../../../components/Toast';
import './EligibilityPages.css';

const readUrlQueryParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

type StudentStage5Filter = 'ALL' | 'HAS_DEBT' | 'ELIGIBLE_DEFENSE' | 'NOT_ELIGIBLE' | 'RESERVED';

export const FinalDefenseEligibilityPage: React.FC = () => {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin' || userType === 'academic_staff';

  // Navigation sub-tabs: 'check' | 'students' | 'reservations'
  const [activeTab, setActiveTab] = useState<'check' | 'students' | 'reservations'>(() => {
    const t = readUrlQueryParam('tab');
    return t === 'students' || t === 'reservations' ? t : 'check';
  });

  // Project Rounds state
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Students & Theses in selected round state
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [roundTheses, setRoundTheses] = useState<Thesis[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<StudentStage5Filter>('ALL');
  const [clearingStudentId, setClearingStudentId] = useState<number | null>(null);

  // Reservations in round state
  const [reservationsInRound, setReservationsInRound] = useState<ReservationRequestItem[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('ALL');
  const [selectedReservationForReview, setSelectedReservationForReview] =
    useState<ReservationRequestItem | null>(null);
  const [selectedStudentForAdminReserve, setSelectedStudentForAdminReserve] = useState<{
    studentId: number;
    studentCode?: string;
    studentName?: string;
    thesisId?: number;
    thesisTitle?: string;
    defaultCategory?: any;
    defaultReason?: string;
  } | null>(null);

  // Academic record edit modal state
  const [editingAcademicStudent, setEditingAcademicStudent] = useState<StudentProjectRoundItem | null>(null);

  // Single student check state (search by Student Code / MSSV only)
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinalDefenseEligibilityResponse | null>(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch all project rounds on mount
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        setLoadingRounds(true);
        const data = await apiService.getProjectRounds();
        setRounds(data || []);
        if (data && data.length > 0) {
          const urlRoundRaw = readUrlQueryParam('roundId');
          const urlRoundNum = urlRoundRaw ? Number(urlRoundRaw) : NaN;
          const fromUrl = !isNaN(urlRoundNum) && data.find((r) => r.roundId === urlRoundNum);
          const active =
            fromUrl ||
            data.find((r) => r.status === 'IN_PROGRESS') ||
            data.find((r) => r.status === 'OPEN') ||
            data[0];
          setSelectedRoundId(active.roundId);
        }
      } catch (err) {
        console.error('Không thể tải danh sách đợt đồ án:', err);
      } finally {
        setLoadingRounds(false);
      }
    };
    fetchRounds();
  }, []);

  const selectedRound = rounds.find((r) => r.roundId === selectedRoundId) || rounds[0] || null;

  // 2. Fetch students, theses and reservations in the selected round
  const loadRoundData = async (roundId: number) => {
    try {
      setLoadingStudents(true);
      setLoadingReservations(true);
      const [res, thesesList, resList] = await Promise.all([
        apiService.getStudentsInRound(roundId, {
          size: 200,
          search: studentSearch || undefined,
        }),
        thesisService.searchTheses({ roundId }).catch(() => [] as Thesis[]),
        eligibilityService.getReservations({ projectRoundId: roundId }).catch(() => [] as ReservationRequestItem[]),
      ]);
      const rawList = res?.content || [];
      const sortedList = [...rawList].sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      setRoundStudents(sortedList);
      setRoundTheses(thesesList || []);
      setReservationsInRound(resList || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu trong đợt:', err);
    } finally {
      setLoadingStudents(false);
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (selectedRoundId) {
      loadRoundData(selectedRoundId);
    }
  }, [selectedRoundId]);

  const findStudentThesis = (student: StudentProjectRoundItem): Thesis | undefined => {
    return roundTheses.find(
      (t) =>
        (student.studentId && t.studentId === student.studentId) ||
        (student.studentCode &&
          t.studentCode &&
          t.studentCode.toLowerCase() === student.studentCode.toLowerCase())
    );
  };

  const findStudentReservation = (studentId: number, studentCode?: string): ReservationRequestItem | undefined => {
    return reservationsInRound.find(
      (r) =>
        r.studentId === studentId ||
        (studentCode && r.studentCode && r.studentCode.toLowerCase() === studentCode.toLowerCase())
    );
  };

  // Evaluate Stage 5 readiness for each student row
  const evaluatedRows = useMemo(() => {
    return roundStudents.map((st) => {
      const thesis = findStudentThesis(st);
      const reservation = findStudentReservation(st.studentId, st.studentCode);
      const isReserved =
        st.status === 'RESERVED' ||
        thesis?.status === 'RESERVED' ||
        reservation?.status === 'APPROVED';
      const hasPendingRes = reservation?.status === 'PENDING';
      const isDropped =
        st.status === 'DROPPED' || st.status === 'DISQUALIFIED' || st.status === 'INELIGIBLE';

      const isAcademicEligible =
        (!st.debtCredits || st.debtCredits === 0) &&
        !st.tuitionDebt &&
        !st.underDisciplinaryAction;

      const hasSupervisorApproved = Boolean(
        thesis &&
          (thesis.defenseEligible ||
            thesis.status === 'COMPLETED' ||
            thesis.status === 'DEFENSE_READY')
      );

      const isThesisProgressComplete = Boolean(
        thesis && (thesis.completionRate === 100 || hasSupervisorApproved)
      );

      const hasAssignedThesisAndSupervisor = Boolean(
        thesis && thesis.id && (thesis.lecturerId || thesis.lecturerFullName)
      );

      const isEligibleForDefense = Boolean(
        !isReserved &&
          !isDropped &&
          hasAssignedThesisAndSupervisor &&
          hasSupervisorApproved &&
          isThesisProgressComplete &&
          isAcademicEligible
      );

      const progressRate = thesis?.completionRate ?? (hasSupervisorApproved ? 100 : 0);

      return {
        st,
        thesis,
        reservation,
        isReserved,
        hasPendingRes,
        isDropped,
        isAcademicEligible,
        hasSupervisorApproved,
        isThesisProgressComplete,
        hasAssignedThesisAndSupervisor,
        isEligibleForDefense,
        progressRate,
      };
    });
  }, [roundStudents, roundTheses, reservationsInRound]);

  const kpiStats = useMemo(() => {
    const total = evaluatedRows.length;
    const eligibleDefense = evaluatedRows.filter((r) => r.isEligibleForDefense).length;
    const hasDebt = evaluatedRows.filter((r) => (r.st.debtCredits ?? 0) > 0).length;
    const pendingRes = reservationsInRound.filter((r) => r.status === 'PENDING').length;
    const reserved = evaluatedRows.filter((r) => r.isReserved).length;
    return { total, eligibleDefense, hasDebt, pendingRes, reserved };
  }, [evaluatedRows, reservationsInRound]);

  const filteredStudentRows = useMemo(() => {
    const kw = studentSearch.trim().toLowerCase();
    return evaluatedRows.filter((row) => {
      if (kw) {
        const hay = `${row.st.studentCode} ${row.st.fullName} ${row.st.className || ''} ${row.thesis?.titleVn || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (studentFilter === 'HAS_DEBT') return (row.st.debtCredits ?? 0) > 0;
      if (studentFilter === 'ELIGIBLE_DEFENSE') return row.isEligibleForDefense;
      if (studentFilter === 'RESERVED') return row.isReserved;
      if (studentFilter === 'NOT_ELIGIBLE') return !row.isEligibleForDefense && !row.isReserved;
      return true;
    });
  }, [evaluatedRows, studentSearch, studentFilter]);

  const filteredReservations = useMemo(() => {
    if (reservationStatusFilter === 'ALL') return reservationsInRound;
    return reservationsInRound.filter((r) => r.status === reservationStatusFilter);
  }, [reservationsInRound, reservationStatusFilter]);

  // 3. Handle check single student criteria by Student Code (MSSV)
  const handleCheck = async (
    e?: React.FormEvent,
    customStudentId?: number,
    customThesisId?: number,
    customStudentCode?: string
  ) => {
    if (e) e.preventDefault();
    const effectiveCode = (customStudentCode !== undefined ? customStudentCode : studentCodeInput).trim();

    if (!effectiveCode && !customStudentId && !customThesisId) {
      setError('Vui lòng nhập Mã sinh viên (MSSV) để tra cứu');
      return;
    }

    let matchedStudentId = customStudentId;
    let matchedThesisId = customThesisId;
    if (effectiveCode && (!matchedStudentId || !matchedThesisId)) {
      const matchedStudent = roundStudents.find(
        (s) => s.studentCode && s.studentCode.toLowerCase() === effectiveCode.toLowerCase()
      );
      if (matchedStudent && !matchedStudentId) {
        matchedStudentId = matchedStudent.studentId;
      }
      const matchedThesis = roundTheses.find(
        (t) =>
          (t.studentCode && t.studentCode.toLowerCase() === effectiveCode.toLowerCase()) ||
          (matchedStudentId && t.studentId === matchedStudentId)
      );
      if (matchedThesis && !matchedThesisId) {
        matchedThesisId = matchedThesis.id;
      }
    }

    try {
      setLoading(true);
      setError('');
      const data = await eligibilityService.checkFinalDefenseEligibility({
        thesisId: matchedThesisId,
        studentId: matchedStudentId,
        studentCode: effectiveCode || undefined,
        projectRoundId: selectedRoundId || undefined,
      });
      setResult(data);
      setActiveTab('check');
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi kiểm tra điều kiện bảo vệ cuối kỳ');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckStudent = (student: StudentProjectRoundItem) => {
    const thesis = findStudentThesis(student);
    setStudentCodeInput(student.studentCode || String(student.studentId));
    handleCheck(undefined, student.studentId, thesis?.id, student.studentCode);
  };

  // 4. Quick 1-click clear debt for Stage 5 Academic Staff workflow
  const handleClearDebt = async (studentId: number, studentCode?: string, studentName?: string) => {
    if (!selectedRoundId) return;
    const ok = window.confirm(
      `Xác nhận sinh viên ${studentCode || studentId}${studentName ? ` (${studentName})` : ''} đã hoàn thành trả hết nợ tín chỉ (về 0 TC) trước khi bảo vệ đồ án?`
    );
    if (!ok) return;

    try {
      setClearingStudentId(studentId);
      await apiService.clearStudentDebt(selectedRoundId, studentId);
      const msg = `Đã xác nhận sinh viên ${studentCode || studentId} hoàn thành trả hết nợ tín chỉ (0 TC).`;
      setNotification({ type: 'success', message: msg });
      toast.success(msg);
      await loadRoundData(selectedRoundId);
      if (result && result.studentId === studentId) {
        await handleCheck(undefined, result.studentId, result.thesisId, result.studentCode);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể xác nhận trả nợ tín chỉ';
      setNotification({ type: 'error', message: errMsg });
      toast.error(errMsg);
    } finally {
      setClearingStudentId(null);
    }
  };

  // Handle Review reservation (Approve/Reject)
  const handleReviewReservation = async (
    status: 'APPROVED' | 'REJECTED',
    reviewNotes: string,
    reviewedBy: string
  ) => {
    if (!selectedReservationForReview) return;
    try {
      await eligibilityService.reviewReservation(selectedReservationForReview.id, {
        status,
        reviewNotes,
        reviewedBy,
      });
      const msg = `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} đơn bảo lưu của sinh viên thành công`;
      setNotification({ type: 'success', message: msg });
      toast.success(msg);
      if (selectedRoundId) {
        await loadRoundData(selectedRoundId);
      }
      if (result && result.studentId === selectedReservationForReview.studentId) {
        await handleCheck(undefined, result.studentId, result.thesisId, result.studentCode);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Lỗi khi xử lý đơn bảo lưu';
      setNotification({ type: 'error', message: errMsg });
      toast.error(errMsg);
    }
  };

  // Handle Admin direct reservation creation
  const handleAdminCreateReservation = async (data: AdminCreateReservationRequest) => {
    try {
      await eligibilityService.createReservationByAdmin(data);
      const msg = 'Đã lập quyết định bảo lưu cho sinh viên thành công';
      setNotification({ type: 'success', message: msg });
      toast.success(msg);
      if (selectedRoundId) {
        await loadRoundData(selectedRoundId);
      }
      if (result && result.studentId === data.studentId) {
        await handleCheck(undefined, data.studentId, data.thesisId, result.studentCode);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Lỗi khi lập bảo lưu';
      setNotification({ type: 'error', message: errMsg });
      toast.error(errMsg);
    }
  };

  const renderCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'INSUFFICIENT_CREDITS':
        return <span className="utc-badge utc-badge-danger">Chưa trả đủ tín chỉ</span>;
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
        return <span className="utc-badge utc-badge-muted">{cat || 'Khác'}</span>;
    }
  };

  return (
    <div className="feature-page-container">
      {/* Notifications */}
      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </span>
          <button
            className="page-alert-close"
            onClick={() => setNotification(null)}
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified UTC Hero Header & Round Selector */}
      <div className="utc-stage-hero">
        <div className="utc-stage-hero-main">
          <div>
            <div className="utc-stage-eyebrow">
              <span>🎓</span> GIAI ĐOẠN 5 • RÀ SOÁT ĐIỀU KIỆN BẢO VỆ &amp; HỒ SƠ BẢO LƯU
            </div>
            <h1 className="utc-stage-title">Xét điều kiện bảo vệ đồ án &amp; Quản lý Bảo lưu</h1>
            <p className="utc-stage-subtitle">
              Kiểm tra điều kiện bảo vệ cuối kỳ (nợ tín chỉ = 0 TC, hoàn thành học phí, tiến độ GVHD 100%) và phê duyệt đơn bảo lưu trước khi chốt Hội đồng.
            </p>
          </div>
        </div>

        <div className="utc-round-control-bar">
          <div className="utc-round-select-group">
            <label htmlFor="finalEligRound">🗓️ Chọn Đợt đồ án:</label>
            <select
              id="finalEligRound"
              className="utc-round-select"
              value={selectedRoundId || ''}
              onChange={(e) => setSelectedRoundId(Number(e.target.value))}
              disabled={loadingRounds}
            >
              {(isAdmin ? rounds : rounds.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS')).map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  {r.name} ({r.roundCode}) — {r.semester} {r.academicYear}
                </option>
              ))}
            </select>
          </div>

          {selectedRound && (
            <div className="utc-round-meta-pills">
              <span className={`utc-round-status-badge status-${(selectedRound.status || '').toLowerCase()}`}>
                {selectedRound.status === 'OPEN'
                  ? '● Đang mở'
                  : selectedRound.status === 'IN_PROGRESS'
                  ? '● Đang thực hiện'
                  : selectedRound.status}
              </span>
              <span className="utc-round-program-pill">
                🎓 {selectedRound.trainingProgramName || selectedRound.trainingProgram || 'Chương trình đào tạo'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5 KPI Cards Overview */}
      <div className="utc-kpi-strip">
        <div
          className={`utc-kpi-box accent-navy ${activeTab === 'students' && studentFilter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setStudentFilter('ALL');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">👥</span>
            <span className="utc-kpi-label">Tổng SV trong đợt</span>
          </div>
          <div className="utc-kpi-num">{kpiStats.total}</div>
          <div className="utc-kpi-sub">Bấm để rà soát danh sách</div>
        </div>

        <div
          className={`utc-kpi-box accent-green ${activeTab === 'students' && studentFilter === 'ELIGIBLE_DEFENSE' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setStudentFilter('ELIGIBLE_DEFENSE');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">✅</span>
            <span className="utc-kpi-label">Đủ ĐK bảo vệ cuối</span>
          </div>
          <div className="utc-kpi-num ok">{kpiStats.eligibleDefense}</div>
          <div className="utc-kpi-sub">0 nợ TC • GVHD xác nhận 100%</div>
        </div>

        <div
          className={`utc-kpi-box accent-amber ${activeTab === 'students' && studentFilter === 'HAS_DEBT' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setStudentFilter('HAS_DEBT');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">📌</span>
            <span className="utc-kpi-label">Còn nợ tín chỉ (GĐ5)</span>
          </div>
          <div className="utc-kpi-num warn">{kpiStats.hasDebt}</div>
          <div className="utc-kpi-sub">Cần xác nhận trả hết nợ về 0</div>
        </div>

        <div
          className={`utc-kpi-box accent-red ${activeTab === 'reservations' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('reservations');
            setReservationStatusFilter('PENDING');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">⏳</span>
            <span className="utc-kpi-label">Đơn bảo lưu chờ duyệt</span>
          </div>
          <div className="utc-kpi-num bad">{kpiStats.pendingRes}</div>
          <div className="utc-kpi-sub">Tổng {reservationsInRound.length} đơn trong đợt</div>
        </div>

        <div
          className={`utc-kpi-box accent-purple ${activeTab === 'students' && studentFilter === 'RESERVED' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setStudentFilter('RESERVED');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="utc-kpi-top">
            <span className="utc-kpi-icon">🟣</span>
            <span className="utc-kpi-label">Đã bảo lưu (RESERVED)</span>
          </div>
          <div className="utc-kpi-num purple">{kpiStats.reserved}</div>
          <div className="utc-kpi-sub">Đóng băng kết quả sang đợt sau</div>
        </div>
      </div>

      {/* Sub-Navigation Pill Tabs */}
      <div className="utc-stage-tabs">
        <button
          type="button"
          className={`utc-stage-tab ${activeTab === 'check' ? 'active' : ''}`}
          onClick={() => setActiveTab('check')}
        >
          🔍 Xét điều kiện bảo vệ cuối kỳ
        </button>

        <button
          type="button"
          className={`utc-stage-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👨‍🎓 Sinh viên trong đợt
          <span className="utc-stage-tab-count">{roundStudents.length}</span>
        </button>

        <button
          type="button"
          className={`utc-stage-tab ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📋 Đơn bảo lưu đồ án
          <span className="utc-stage-tab-count">{reservationsInRound.length}</span>
        </button>
      </div>

      {/* TAB 1: Kiểm tra Điều kiện Bảo vệ Cuối kỳ */}
      {activeTab === 'check' && (
        <div>
          {/* Search Input Box */}
          <div className="final-defense-query-card">
            <form onSubmit={handleCheck} className="query-form-row">
              <div className="query-input-group" style={{ flex: 1 }}>
                <label htmlFor="stdCode">Mã sinh viên (MSSV):</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="stdCode"
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã sinh viên (VD: 201200101)..."
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value)}
                    list="student-code-datalist"
                    autoComplete="off"
                    style={{ paddingRight: studentCodeInput ? '36px' : '14px' }}
                  />
                  {studentCodeInput && (
                    <button
                      type="button"
                      onClick={() => setStudentCodeInput('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Xóa mã sinh viên"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <datalist id="student-code-datalist">
                  {roundStudents.map((s) => (
                    <option key={s.studentId} value={s.studentCode}>
                      {s.fullName} — {s.className || 'Sinh viên'}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="query-btn-group">
                <Button type="submit" variant="primary" loading={loading}>
                  🔍 Kiểm tra điều kiện theo MSSV
                </Button>
              </div>
            </form>

            {/* Quick Select from Round Students */}
            {roundStudents.length > 0 && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px dashed #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  ⚡ Chọn nhanh sinh viên trong đợt ({roundStudents.length}):
                </span>
                <select
                  className="utc-toolbar-select"
                  style={{ minWidth: '280px', maxWidth: '460px', fontWeight: 600 }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const st = roundStudents.find((s) => s.studentCode === e.target.value);
                      if (st) {
                        handleQuickCheckStudent(st);
                      }
                    }
                  }}
                >
                  <option value="">-- Click để chọn sinh viên cần kiểm tra --</option>
                  {roundStudents.map((s) => (
                    <option key={s.studentId} value={s.studentCode}>
                      {s.studentCode} — {s.fullName} ({s.className || 'Sinh viên'})
                      {s.debtCredits && s.debtCredits > 0 ? ` [Nợ ${s.debtCredits} TC]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className="query-error-msg">{error}</div>}
          </div>

          {/* Result Section */}
          {result && (
            <div className="final-defense-result-card" style={{ marginTop: '20px' }}>
              {/* Status Header */}
              <div
                className={`result-header-box ${
                  result.reservationStatus === 'APPROVED'
                    ? 'result-header-reserved'
                    : result.eligibleForDefense
                    ? 'result-header-eligible'
                    : 'result-header-ineligible'
                }`}
              >
                <div>
                  <div className="result-sub-title">Kết quả xét duyệt điều kiện bảo vệ cuối kỳ:</div>
                  <h2 className="result-main-title">
                    {result.reservationStatus === 'APPROVED'
                      ? '🟣 ĐÃ BẢO LƯU ĐỒ ÁN SANG ĐỢT SAU (RESERVED)'
                      : result.studentRoundStatus === 'DROPPED' ||
                        result.studentRoundStatus === 'DISQUALIFIED' ||
                        result.studentRoundStatus === 'INELIGIBLE'
                      ? result.studentRoundStatus === 'INELIGIBLE'
                        ? '🚫 KHÔNG ĐỦ ĐIỀU KIỆN THAM GIA ĐỢT ĐỒ ÁN'
                        : '🚫 ĐÃ BỊ LOẠI KHỎI ĐỢT ĐỒ ÁN'
                      : result.eligibleForDefense
                      ? 'ĐỦ ĐIỀU KIỆN BẢO VỆ CUỐI KỲ'
                      : 'CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ'}
                  </h2>
                </div>
                <div>
                  <span className="result-badge">
                    {result.reservationStatus === 'APPROVED'
                      ? 'BẢO LƯU'
                      : result.studentRoundStatus === 'DROPPED' ||
                        result.studentRoundStatus === 'DISQUALIFIED' ||
                        result.studentRoundStatus === 'INELIGIBLE'
                      ? result.studentRoundStatus === 'INELIGIBLE'
                        ? 'KHÔNG ĐỦ ĐK'
                        : 'BỊ LOẠI'
                      : result.eligibleForDefense
                      ? 'ĐỦ ĐIỀU KIỆN'
                      : 'KHÔNG ĐỦ ĐIỀU KIỆN'}
                  </span>
                </div>
              </div>

              {/* Quick 1-click Clear Debt Banner for Academic Staff */}
              {isAdmin && result.debtCredits !== undefined && result.debtCredits !== null && result.debtCredits > 0 && result.reservationStatus !== 'APPROVED' && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    margin: '16px 20px 0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: '#92400e' }}>
                      📌 Sinh viên hiện còn nợ {result.debtCredits} tín chỉ trước bảo vệ:
                    </strong>
                    <div style={{ fontSize: '0.84rem', color: '#b45309', marginTop: '3px' }}>
                      Nếu sinh viên đã hoàn tất trả nợ môn theo dữ liệu Phòng Đào tạo, Giáo vụ có thể xác nhận ngay để mở điều kiện bảo vệ.
                    </div>
                  </div>
                  <Button
                    variant="success"
                    loading={clearingStudentId === result.studentId}
                    onClick={() => handleClearDebt(result.studentId, result.studentCode, result.studentName)}
                  >
                    ✅ Xác nhận đã trả hết nợ TC
                  </Button>
                </div>
              )}

              {/* Reservation Action Banner if Pending */}
              {result.hasPendingReservation && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    margin: '16px 20px 0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: '#92400e' }}>⚠️ Sinh viên đang có đơn xin bảo lưu chờ phê duyệt:</strong>
                    <div style={{ fontSize: '13px', color: '#b45309', marginTop: '4px' }}>
                      Đơn #{result.reservationId} — Lý do: {result.reservationReason}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        const r = reservationsInRound.find((item) => item.id === result.reservationId);
                        if (r) setSelectedReservationForReview(r);
                      }}
                    >
                      Xem &amp; Phê duyệt đơn
                    </Button>
                  )}
                </div>
              )}

              {/* Recommendation for Reservation if not eligible */}
              {!result.eligibleForDefense &&
                result.reservationStatus !== 'APPROVED' &&
                result.studentRoundStatus !== 'DROPPED' &&
                result.studentRoundStatus !== 'DISQUALIFIED' &&
                !result.hasPendingReservation &&
                isAdmin &&
                (result.thesisId && result.thesisId > 0 && result.thesisTitle && !result.thesisTitle.includes('Chưa có đề tài') ? (
                  <div
                    style={{
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      margin: '16px 20px 0 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#5b21b6' }}>💡 Hỗ trợ bảo lưu đồ án tốt nghiệp:</strong>
                      <div style={{ fontSize: '13px', color: '#6d28d9', marginTop: '4px' }}>
                        Sinh viên chưa đủ điều kiện bảo vệ đợt này (do chưa trả đủ tín chỉ hoặc tiến độ). Sinh viên đã có đề tài và GVHD, Khoa có thể lập quyết định bảo lưu để đóng băng đề tài sang đợt sau.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedStudentForAdminReserve({
                          studentId: result.studentId,
                          studentCode: result.studentCode,
                          studentName: result.studentName,
                          thesisId: result.thesisId,
                          thesisTitle: result.thesisTitle,
                          defaultCategory:
                            result.debtCredits && result.debtCredits > 0
                              ? 'INSUFFICIENT_CREDITS'
                              : 'SUPERVISOR_NOT_ELIGIBLE',
                          defaultReason:
                            result.debtCredits && result.debtCredits > 0
                              ? `Bảo lưu kết quả đồ án do chưa hoàn thành đủ số tín chỉ quy định (Còn nợ: ${result.debtCredits} tín chỉ)`
                              : 'Bảo lưu kết quả đồ án theo đề nghị của Khoa / GVHD',
                        });
                      }}
                    >
                      ⚡ Lập quyết định bảo lưu
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      padding: '14px',
                      borderRadius: '10px',
                      margin: '16px 20px 0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <strong>Lưu ý bảo lưu:</strong> Sinh viên chưa có đề tài chính thức hoặc chưa được phân công GVHD trong đợt này. Theo quy định, sinh viên chỉ được lập bảo lưu khi đã có đề tài và đã được phân công GVHD.
                    </div>
                  </div>
                ))}

              {/* Student and Thesis Meta Box */}
              <div className="result-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Mã sinh viên</span>
                  <span className="meta-val font-bold">{result.studentCode}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Họ và tên</span>
                  <span className="meta-val font-bold">{result.studentName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Mã đề tài</span>
                  <span className="meta-val">{result.thesisId ? `#${result.thesisId}` : '—'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tên đề tài</span>
                  <span className="meta-val text-primary font-semibold">{result.thesisTitle}</span>
                </div>
              </div>

              {/* Detailed Evaluation Criteria Cards */}
              <div className="criteria-container">
                <h3 className="criteria-title">Các tiêu chí kiểm tra điều kiện bảo vệ:</h3>

                <div className="criteria-grid">
                  {/* Criteria 1 */}
                  <div className={`criteria-card ${result.allProgressStagesCompleted ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{result.allProgressStagesCompleted ? '✅' : '❌'}</span>
                      <span className="card-heading">1. Tiến độ thực hiện đồ án</span>
                    </div>
                    <div className="card-desc">Yêu cầu hoàn thành 100% tiến độ và báo cáo tuần.</div>
                    <div className="card-metric">
                      Tiến độ: <strong>{result.thesisProgressPercentage ?? (result.allProgressStagesCompleted ? 100 : 0)}%</strong>
                    </div>
                  </div>

                  {/* Criteria 2 */}
                  <div className={`criteria-card ${result.supervisorApproved ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{result.supervisorApproved ? '✅' : '❌'}</span>
                      <span className="card-heading">2. Giảng viên Hướng dẫn (GVHD)</span>
                    </div>
                    <div className="card-desc">GVHD xác nhận đồng ý cho bảo vệ &amp; điểm GVHD ≥ 5.0.</div>
                    <div className="card-metric">
                      Trạng thái: <strong>{result.supervisorApproved ? 'Đã duyệt cho bảo vệ' : 'Chưa duyệt / Điểm < 5.0'}</strong>
                      {result.supervisorScore !== undefined && result.supervisorScore !== null && (
                        <span> (Điểm: {Number(result.supervisorScore).toFixed(1)})</span>
                      )}
                    </div>
                  </div>

                  {/* Criteria 3 */}
                  <div
                    className={`criteria-card ${
                      result.completedCredits !== undefined &&
                      result.completedCredits !== null &&
                      (!result.debtCredits || result.debtCredits === 0)
                        ? 'card-ok'
                        : 'card-fail'
                    }`}
                  >
                    <div className="card-top">
                      <span className="card-icon">
                        {result.completedCredits !== undefined &&
                        result.completedCredits !== null &&
                        (!result.debtCredits || result.debtCredits === 0)
                          ? '✅'
                          : '❌'}
                      </span>
                      <span className="card-heading">3. Tín chỉ tích lũy &amp; Nợ tín chỉ</span>
                    </div>
                    <div className="card-desc">
                      Hoàn thành toàn bộ nợ tín chỉ (= 0) theo chương trình đào tạo (Cử nhân: 142 TC, Kỹ sư: 180 TC).
                    </div>
                    <div className="card-metric">
                      Tín chỉ tích lũy:{' '}
                      <strong>
                        {result.completedCredits !== undefined && result.completedCredits !== null
                          ? `${result.completedCredits} TC`
                          : 'Chưa có dữ liệu'}
                      </strong>
                      {result.debtCredits !== undefined && result.debtCredits !== null && result.debtCredits > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}> (Còn nợ: {result.debtCredits} tín chỉ)</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Criteria 4 */}
                  <div
                    className={`criteria-card ${!result.tuitionDebt && !result.underDisciplinaryAction ? 'card-ok' : 'card-fail'}`}
                  >
                    <div className="card-top">
                      <span className="card-icon">{!result.tuitionDebt && !result.underDisciplinaryAction ? '✅' : '❌'}</span>
                      <span className="card-heading">4. Nghĩa vụ học phí &amp; Kỷ luật</span>
                    </div>
                    <div className="card-desc">Đã hoàn thành toàn bộ học phí và không bị kỷ luật.</div>
                    <div className="card-metric">
                      Trạng thái:{' '}
                      <strong>
                        {!result.tuitionDebt && !result.underDisciplinaryAction
                          ? 'Đã hoàn thành'
                          : result.tuitionDebt && result.underDisciplinaryAction
                          ? 'Nợ học phí & Bị kỷ luật'
                          : result.tuitionDebt
                          ? 'Còn nợ học phí'
                          : 'Đang bị kỷ luật'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasons List */}
              <div className="result-reasons-box">
                <div className="reasons-heading">Chi tiết kết luận xét duyệt:</div>
                <ul className="reasons-list">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="reason-item">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Danh sách Sinh viên trong Đợt & Học vụ GĐ5 */}
      {activeTab === 'students' && (
        <div className="utc-card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.08rem', fontWeight: 800 }}>
                Danh sách Sinh viên &amp; Điều kiện Bảo vệ GĐ5 — {selectedRound?.name} ({filteredStudentRows.length} / {roundStudents.length} SV)
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                Xác nhận sinh viên hoàn thành trả nợ tín chỉ về 0 TC, chỉnh sửa dữ liệu học vụ hoặc lập quyết định bảo lưu sang đợt sau.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="utc-toolbar-input"
                placeholder="Tìm theo MSSV, họ tên, đề tài..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedRoundId) {
                    loadRoundData(selectedRoundId);
                  }
                }}
                style={{ minWidth: '220px' }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => selectedRoundId && loadRoundData(selectedRoundId)}
              >
                Tìm
              </Button>
            </div>
          </div>

          {/* Quick filter bar */}
          <div className="filter-toolbar" style={{ marginBottom: '14px', padding: '10px 14px' }}>
            <div className="btn-group-toggle">
              {(
                [
                  { id: 'ALL', label: `Tất cả (${evaluatedRows.length})` },
                  { id: 'HAS_DEBT', label: `Còn nợ TC (${kpiStats.hasDebt})` },
                  { id: 'ELIGIBLE_DEFENSE', label: `Đủ ĐK bảo vệ (${kpiStats.eligibleDefense})` },
                  { id: 'NOT_ELIGIBLE', label: 'Chưa đủ ĐK khác' },
                  { id: 'RESERVED', label: `Đã bảo lưu (${kpiStats.reserved})` },
                ] as { id: StudentStage5Filter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`toggle-btn ${studentFilter === f.id ? 'active' : ''}`}
                  onClick={() => setStudentFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loadingStudents ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>⏳ Đang tải danh sách sinh viên...</div>
          ) : filteredStudentRows.length > 0 ? (
            <div className="utc-table-container">
              <table className="utc-clean-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', textAlign: 'center' }}>STT</th>
                    <th style={{ width: '110px' }}>MSSV</th>
                    <th style={{ minWidth: '160px' }}>Họ và tên</th>
                    <th style={{ minWidth: '240px' }}>Đề tài &amp; Tiến độ</th>
                    <th style={{ minWidth: '190px' }}>Hồ sơ học vụ GĐ5</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>GPA</th>
                    <th style={{ minWidth: '185px' }}>Kết luận Bảo vệ &amp; Bảo lưu</th>
                    <th style={{ minWidth: '220px', textAlign: 'center' }}>Thao tác Giáo vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentRows.map((row, idx) => {
                    const {
                      st,
                      thesis,
                      reservation,
                      isReserved,
                      hasPendingRes,
                      isDropped,
                      hasSupervisorApproved,
                      isThesisProgressComplete,
                      hasAssignedThesisAndSupervisor,
                      isEligibleForDefense,
                      progressRate,
                    } = row;

                    return (
                      <tr key={st.studentRoundId}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: '#0a3273' }}>{st.studentCode}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {st.className || st.majorCode || ''}
                          </div>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          {thesis ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{thesis.titleVn}</div>
                              <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                                Tiến độ: {progressRate}% {thesis.lecturerFullName ? `• GVHD: ${thesis.lecturerFullName}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đề tài chính thức</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>
                            <div style={{ marginBottom: '3px' }}>
                              <strong>Tích lũy:</strong> {st.completedCredits ?? 0} TC &nbsp;•&nbsp;{' '}
                              <strong>Nợ:</strong>{' '}
                              <span style={{ fontWeight: 800, color: st.debtCredits && st.debtCredits > 0 ? '#dc2626' : '#15803d' }}>
                                {st.debtCredits && st.debtCredits > 0 ? `${st.debtCredits} TC` : '0 TC'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span className={`utc-badge ${st.tuitionDebt ? 'utc-badge-danger' : 'utc-badge-success'}`}>
                                {st.tuitionDebt ? 'Nợ HP' : 'Đã đóng HP'}
                              </span>
                              {st.underDisciplinaryAction ? (
                                <span className="utc-badge utc-badge-danger">Kỷ luật</span>
                              ) : (
                                <span className="utc-badge utc-badge-muted">Không KL</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: st.gpa !== undefined && st.gpa !== null && st.gpa < 2.0 ? '#dc2626' : '#0a3273', fontWeight: 800 }}>
                            {st.gpa !== undefined && st.gpa !== null ? Number(st.gpa).toFixed(2) : '—'}
                          </span>
                        </td>
                        <td>
                          {isReserved ? (
                            <span className="utc-badge utc-badge-purple">🟣 Đã bảo lưu (RESERVED)</span>
                          ) : hasPendingRes && reservation ? (
                            <span className="utc-badge utc-badge-warning">🟠 Chờ duyệt bảo lưu (#{reservation.id})</span>
                          ) : isDropped ? (
                            <span className="utc-badge utc-badge-danger">🚫 Đã bị loại khỏi đợt</span>
                          ) : isEligibleForDefense ? (
                            <span className="utc-badge utc-badge-success">✅ Đủ điều kiện bảo vệ</span>
                          ) : (
                            <div>
                              <span className="utc-badge utc-badge-danger">❌ Chưa đủ ĐK bảo vệ</span>
                              <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '3px', fontWeight: 600 }}>
                                {!thesis
                                  ? 'Chưa có đề tài'
                                  : !hasAssignedThesisAndSupervisor
                                  ? 'Chưa phân công GVHD'
                                  : st.debtCredits !== undefined && st.debtCredits > 0
                                  ? `Còn nợ ${st.debtCredits} tín chỉ`
                                  : st.tuitionDebt
                                  ? 'Còn nợ học phí'
                                  : st.underDisciplinaryAction
                                  ? 'Đang bị kỷ luật'
                                  : !hasSupervisorApproved
                                  ? 'GVHD chưa duyệt'
                                  : !isThesisProgressComplete
                                  ? `Tiến độ ${progressRate}%`
                                  : 'Chưa đủ tiêu chí'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="utc-btn-xs primary"
                              onClick={() => handleQuickCheckStudent(st)}
                            >
                              🔍 Kiểm tra
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="utc-btn-xs info"
                                onClick={() => setEditingAcademicStudent(st)}
                                title="Chỉnh sửa thông tin học vụ (tín chỉ tích lũy, nợ tín, học phí, kỷ luật)"
                              >
                                ✏️ Sửa học vụ
                              </button>
                            )}

                            {isAdmin && !isReserved && st.debtCredits !== undefined && st.debtCredits !== null && st.debtCredits > 0 && (
                              <button
                                type="button"
                                className="utc-btn-xs success"
                                disabled={clearingStudentId === st.studentId}
                                onClick={() => handleClearDebt(st.studentId, st.studentCode, st.fullName)}
                                title="Xác nhận sinh viên đã trả hết nợ tín chỉ về 0 TC"
                              >
                                {clearingStudentId === st.studentId ? 'Đang lưu...' : '✅ Trả hết nợ TC'}
                              </button>
                            )}

                            {hasPendingRes && reservation && isAdmin && (
                              <button
                                type="button"
                                className="utc-btn-xs warning"
                                onClick={() => setSelectedReservationForReview(reservation)}
                              >
                                ✍️ Duyệt bảo lưu
                              </button>
                            )}

                            {!isReserved && !isEligibleForDefense && !hasPendingRes && isAdmin && hasAssignedThesisAndSupervisor && (
                              <button
                                type="button"
                                className="utc-btn-xs purple"
                                onClick={() => {
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
                                        : 'Bảo lưu kết quả đồ án theo đề nghị của Khoa / GVHD',
                                  });
                                }}
                              >
                                ⚡ Lập bảo lưu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chưa có sinh viên nào phù hợp với bộ lọc trong đợt đồ án này.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Danh sách Đơn bảo lưu trong đợt */}
      {activeTab === 'reservations' && (
        <div className="utc-card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.08rem', fontWeight: 800 }}>
                Danh sách Đơn xin bảo lưu đồ án — {selectedRound?.name} ({filteredReservations.length} / {reservationsInRound.length} đơn)
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                Khoa phê duyệt hoặc từ chối các đơn xin bảo lưu của sinh viên trước khi thành lập Hội đồng và xếp lịch bảo vệ.
              </p>
            </div>

            <div className="btn-group-toggle">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`toggle-btn ${reservationStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setReservationStatusFilter(st)}
                >
                  {st === 'ALL' && 'Tất cả'}
                  {st === 'PENDING' && `Chờ duyệt (${kpiStats.pendingRes})`}
                  {st === 'APPROVED' && 'Đã duyệt'}
                  {st === 'REJECTED' && 'Từ chối'}
                </button>
              ))}
            </div>
          </div>

          {loadingReservations ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>⏳ Đang tải danh sách đơn bảo lưu...</div>
          ) : filteredReservations.length > 0 ? (
            <div className="utc-table-container">
              <table className="utc-clean-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Mã đơn</th>
                    <th style={{ minWidth: '180px' }}>Sinh viên</th>
                    <th style={{ width: '150px' }}>Phân loại lý do</th>
                    <th style={{ minWidth: '240px' }}>Nội dung &amp; Minh chứng</th>
                    <th style={{ minWidth: '170px' }}>Ý kiến GVHD</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 800, color: '#0a3273' }}>#{res.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0a3273' }}>{res.studentCode || `SV${res.studentId}`}</div>
                        <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.82rem' }}>{res.studentName || 'Sinh viên'}</div>
                      </td>
                      <td>{renderCategoryBadge(res.reasonCategory)}</td>
                      <td style={{ maxWidth: '320px' }}>
                        <div className="text-reason">{res.reason}</div>
                        {res.evidenceFileUrl && (
                          <a href={res.evidenceFileUrl} target="_blank" rel="noreferrer" className="evidence-attachment-tag">
                            📎 {res.evidenceFileName || 'Minh chứng đính kèm'}
                          </a>
                        )}
                      </td>
                      <td>
                        {res.supervisorComment ? (
                          <div style={{ fontSize: '0.78rem' }}>
                            <span>{res.supervisorApproved ? '✅ Đồng ý: ' : '⚠️ Ý kiến: '}</span>
                            <em>{res.supervisorComment}</em>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Chưa có ý kiến</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <StatusBadge
                          status={res.status}
                          label={res.status === 'APPROVED' ? 'Đã duyệt' : res.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {res.status === 'PENDING' && isAdmin ? (
                          <button
                            type="button"
                            className="utc-btn-xs primary"
                            onClick={() => setSelectedReservationForReview(res)}
                          >
                            ✍️ Phê duyệt
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="utc-btn-xs muted"
                            onClick={() => setSelectedReservationForReview(res)}
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chưa có đơn xin bảo lưu nào phù hợp trong đợt đồ án này.
            </div>
          )}
        </div>
      )}

      {/* Modal: Xét duyệt đơn bảo lưu */}
      <ReservationReviewModal
        isOpen={Boolean(selectedReservationForReview)}
        onClose={() => setSelectedReservationForReview(null)}
        reservation={selectedReservationForReview}
        onConfirm={handleReviewReservation}
      />

      {/* Modal: Admin / Giáo vụ lập quyết định bảo lưu */}
      <AdminCreateReservationModal
        isOpen={Boolean(selectedStudentForAdminReserve)}
        onClose={() => setSelectedStudentForAdminReserve(null)}
        student={selectedStudentForAdminReserve}
        projectRoundId={selectedRoundId || undefined}
        onConfirm={handleAdminCreateReservation}
      />

      {/* Modal: Chỉnh sửa thông tin học vụ */}
      <EditAcademicRecordModal
        isOpen={Boolean(editingAcademicStudent)}
        onClose={() => setEditingAcademicStudent(null)}
        student={editingAcademicStudent}
        projectRoundId={selectedRoundId ?? selectedRound?.roundId ?? 0}
        onSuccess={async () => {
          const msg = `Cập nhật thông tin học vụ cho sinh viên ${editingAcademicStudent?.studentCode} thành công`;
          setNotification({
            type: 'success',
            message: msg,
          });
          toast.success(msg);
          if (selectedRoundId) {
            await loadRoundData(selectedRoundId);
          }
          if (result && editingAcademicStudent && result.studentId === editingAcademicStudent.studentId) {
            await handleCheck(undefined, result.studentId, result.thesisId, result.studentCode);
          }
        }}
      />
    </div>
  );
};
