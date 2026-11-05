import React, { useState, useEffect } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { eligibilityService } from '../services/eligibilityService';
import { thesisService } from '../../thesis/services/thesisService';
import type { Thesis } from '../../thesis/types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinalDefenseEligibilityResponse, ReservationRequestItem, AdminCreateReservationRequest } from '../types';
import type { ProjectRoundItem, StudentProjectRoundItem } from '../../../types';
import { ReservationReviewModal } from '../components/ReservationReviewModal';
import { AdminCreateReservationModal } from '../components/AdminCreateReservationModal';
import { EditAcademicRecordModal } from '../components/EditAcademicRecordModal';
import './EligibilityPages.css';

export const FinalDefenseEligibilityPage: React.FC = () => {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin' || userType === 'academic_staff';
  // Navigation sub-tabs: 'check' | 'students' | 'reservations'
  const [activeTab, setActiveTab] = useState<'check' | 'students' | 'reservations'>('check');

  // Project Rounds state
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Students & Theses in selected round state
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [roundTheses, setRoundTheses] = useState<Thesis[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Reservations in round state
  const [reservationsInRound, setReservationsInRound] = useState<ReservationRequestItem[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [selectedReservationForReview, setSelectedReservationForReview] = useState<ReservationRequestItem | null>(null);
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
  const [clearingDebtStudentId, setClearingDebtStudentId] = useState<number | null>(null);

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
          const active =
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
          size: 100,
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

  // Handle Quick Clear Debt (Debt -> 0)
  const handleQuickClearDebt = async (student: StudentProjectRoundItem) => {
    if (!selectedRoundId) return;
    const confirmed = window.confirm(
      `Xác nhận sinh viên ${student.fullName || student.studentCode} (${student.studentCode}) đã hoàn thành trả nợ ${student.debtCredits} tín chỉ (Số tín chỉ nợ chuyển về 0 để đủ điều kiện xét bảo vệ)?`
    );
    if (!confirmed) return;

    try {
      setClearingDebtStudentId(student.studentId);
      const msg = await apiService.clearStudentDebt(selectedRoundId, student.studentId);
      setNotification({
        type: 'success',
        message: msg || `Đã hoàn tất trả nợ tín chỉ cho sinh viên ${student.studentCode} thành công!`,
      });
      await loadRoundData(selectedRoundId);
      if (result && result.studentId === student.studentId) {
        await handleCheck(undefined, result.studentId, result.thesisId, result.studentCode);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi xóa nợ tín chỉ' });
    } finally {
      setClearingDebtStudentId(null);
    }
  };

  // Handle Review reservation (Approve/Reject)
  const handleReviewReservation = async (status: 'APPROVED' | 'REJECTED', reviewNotes: string, reviewedBy: string) => {
    if (!selectedReservationForReview) return;
    try {
      await eligibilityService.reviewReservation(selectedReservationForReview.id, {
        status,
        reviewNotes,
        reviewedBy,
      });
      setNotification({
        type: 'success',
        message: `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} đơn bảo lưu của sinh viên thành công`,
      });
      if (selectedRoundId) {
        await loadRoundData(selectedRoundId);
      }
      if (result && result.studentId === selectedReservationForReview.studentId) {
        await handleCheck(undefined, result.studentId, result.thesisId, result.studentCode);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi xử lý đơn bảo lưu' });
    }
  };

  // Handle Admin direct reservation creation
  const handleAdminCreateReservation = async (data: AdminCreateReservationRequest) => {
    try {
      await eligibilityService.createReservationByAdmin(data);
      setNotification({
        type: 'success',
        message: 'Đã lập quyết định bảo lưu cho sinh viên thành công',
      });
      if (selectedRoundId) {
        await loadRoundData(selectedRoundId);
      }
      if (result && result.studentId === data.studentId) {
        await handleCheck(undefined, data.studentId, data.thesisId, result.studentCode);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi lập bảo lưu' });
    }
  };

  return (
    <div className="feature-page-container">
      {/* Notifications */}
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
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xét điều kiện bảo vệ đồ án &amp; Quản lý Bảo lưu</h1>
          <p className="feature-page-subtitle">
            Giai đoạn 5 (ELIGIBILITY_REVIEW): Kiểm tra tiêu chí xét duyệt bảo vệ đồ án cuối kỳ, tiếp nhận và phê duyệt đơn bảo lưu đề tài (chưa trả đủ tín chỉ, GVHD xét không đủ điều kiện, hoặc lý do chính đáng khác).
          </p>
        </div>
      </div>

      {/* Project Round Context & Selector Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 700, color: '#0a3273', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🗓️</span> Chọn Đợt đồ án:
          </label>
          <select
            value={selectedRoundId || ''}
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            disabled={loadingRounds}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1.5px solid #0a3273',
              fontWeight: 600,
              color: '#0a3273',
              backgroundColor: '#f8fafc',
              fontSize: '0.9rem',
              minWidth: '280px',
            }}
          >
            {(isAdmin ? rounds : rounds.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS')).map((r) => (
              <option key={r.roundId} value={r.roundId}>
                {r.name} ({r.roundCode}) — {r.semester} {r.academicYear}
              </option>
            ))}
          </select>

          {selectedRound && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: selectedRound.status === 'OPEN' ? '#dcfce7' : '#f1f5f9',
                  color: selectedRound.status === 'OPEN' ? '#16a34a' : '#475569',
                }}
              >
                {selectedRound.status === 'OPEN' ? 'Đang mở (OPEN)' : selectedRound.status}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                }}
              >
                🎓 {selectedRound.trainingProgramName || selectedRound.trainingProgram || 'Chương trình đào tạo'}
              </span>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Đang xem: <strong>{selectedRound?.name || 'Chưa chọn đợt'}</strong>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
          gap: '8px',
          backgroundColor: '#fff',
          borderRadius: '8px 8px 0 0',
          padding: '6px 12px 0 12px',
        }}
      >
        <button
          onClick={() => setActiveTab('check')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'check' ? '3px solid #0a3273' : '3px solid transparent',
            color: activeTab === 'check' ? '#0a3273' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔍 Xét điều kiện bảo vệ cuối kỳ
        </button>

        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'students' ? '3px solid #0a3273' : '3px solid transparent',
            color: activeTab === 'students' ? '#0a3273' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          👨‍🎓 Sinh viên trong đợt ({roundStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'reservations' ? '3px solid #0a3273' : '3px solid transparent',
            color: activeTab === 'reservations' ? '#0a3273' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📋 Đơn bảo lưu đồ án ({reservationsInRound.length})
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
                <input
                  id="stdCode"
                  type="text"
                  className="form-control"
                  placeholder="Nhập mã sinh viên (VD: 201200101)..."
                  value={studentCodeInput}
                  onChange={(e) => setStudentCodeInput(e.target.value)}
                />
              </div>

              <div className="query-btn-group">
                <Button type="submit" variant="primary" loading={loading}>
                  🔍 Kiểm tra điều kiện theo MSSV
                </Button>
              </div>
            </form>

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
                      : result.studentRoundStatus === 'DROPPED' || result.studentRoundStatus === 'DISQUALIFIED' || result.studentRoundStatus === 'INELIGIBLE'
                      ? (result.studentRoundStatus === 'INELIGIBLE' ? '🚫 KHÔNG ĐỦ ĐIỀU KIỆN THAM GIA ĐỢT ĐỒ ÁN' : '🚫 ĐÃ BỊ LOẠI KHỎI ĐỢT ĐỒ ÁN')
                      : result.eligibleForDefense
                      ? 'ĐỦ ĐIỀU KIỆN BẢO VỆ CUỐI KỲ'
                      : 'CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ'}
                  </h2>
                </div>
                <div>
                  <span className="result-badge">
                    {result.reservationStatus === 'APPROVED'
                      ? 'BẢO LƯU'
                      : result.studentRoundStatus === 'DROPPED' || result.studentRoundStatus === 'DISQUALIFIED' || result.studentRoundStatus === 'INELIGIBLE'
                      ? (result.studentRoundStatus === 'INELIGIBLE' ? 'KHÔNG ĐỦ ĐK' : 'BỊ LOẠI')
                      : result.eligibleForDefense
                      ? 'ĐỦ ĐIỀU KIỆN'
                      : 'KHÔNG ĐỦ ĐIỀU KIỆN'}
                  </span>
                </div>
              </div>

              {/* Reservation Action Banner if Pending or Recommended */}
              {result.hasPendingReservation && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '14px', borderRadius: '8px', margin: '16px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {!result.eligibleForDefense && result.reservationStatus !== 'APPROVED' && result.studentRoundStatus !== 'DROPPED' && result.studentRoundStatus !== 'DISQUALIFIED' && !result.hasPendingReservation && isAdmin && (
                result.thesisId && result.thesisId > 0 && result.thesisTitle && !result.thesisTitle.includes('Chưa có đề tài') ? (
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '14px', borderRadius: '8px', margin: '16px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          defaultCategory: (result.debtCredits && result.debtCredits > 0) ? 'INSUFFICIENT_CREDITS' : 'SUPERVISOR_NOT_ELIGIBLE',
                          defaultReason: (result.debtCredits && result.debtCredits > 0)
                            ? `Bảo lưu kết quả đồ án do chưa hoàn thành đủ số tín chỉ quy định (Còn nợ: ${result.debtCredits} tín chỉ)`
                            : 'Bảo lưu kết quả đồ án theo đề nghị của Khoa / GVHD',
                        });
                      }}
                    >
                      ⚡ Lập quyết định bảo lưu
                    </Button>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '14px', borderRadius: '8px', margin: '16px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <strong>Lưu ý bảo lưu:</strong> Sinh viên chưa có đề tài chính thức hoặc chưa được phân công GVHD trong đợt này. Theo quy định, sinh viên chỉ được lập bảo lưu khi đã có đề tài và đã được phân công GVHD.
                    </div>
                  </div>
                )
              )}

              {/* Student and Thesis Meta Box */}
              <div className="result-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Mã sinh viên:</span>
                  <span className="meta-val font-bold">{result.studentCode}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Họ và tên:</span>
                  <span className="meta-val font-bold">{result.studentName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Mã đề tài:</span>
                  <span className="meta-val">#{result.thesisId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tên đề tài:</span>
                  <span className="meta-val text-primary font-semibold">{result.thesisTitle}</span>
                </div>
              </div>

              {/* Detailed Evaluation Criteria Cards */}
              <div className="criteria-container">
                <h3 className="criteria-title">Các tiêu chí kiểm tra điều kiện bảo vệ:</h3>

                <div className="criteria-grid">
                  {/* Criteria 1: Tiến độ thực hiện */}
                  <div className={`criteria-card ${result.allProgressStagesCompleted ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{result.allProgressStagesCompleted ? '✅' : '❌'}</span>
                      <span className="card-heading">1. Tiến độ thực hiện đồ án</span>
                    </div>
                    <div className="card-desc">
                      Yêu cầu hoàn thành 100% tiến độ và báo cáo tuần.
                    </div>
                    <div className="card-metric">
                      Tiến độ: <strong>{result.thesisProgressPercentage ?? (result.allProgressStagesCompleted ? 100 : 0)}%</strong>
                    </div>
                  </div>

                  {/* Criteria 2: Đánh giá GVHD */}
                  <div className={`criteria-card ${result.supervisorApproved ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{result.supervisorApproved ? '✅' : '❌'}</span>
                      <span className="card-heading">2. Giảng viên Hướng dẫn (GVHD)</span>
                    </div>
                    <div className="card-desc">
                      GVHD xác nhận đồng ý cho bảo vệ &amp; điểm GVHD ≥ 5.0.
                    </div>
                    <div className="card-metric">
                      Trạng thái: <strong>{result.supervisorApproved ? 'Đã duyệt cho bảo vệ' : 'Chưa duyệt / Điểm < 5.0'}</strong>
                      {result.supervisorScore !== undefined && result.supervisorScore !== null && (
                        <span> (Điểm: {Number(result.supervisorScore).toFixed(1)})</span>
                      )}
                    </div>
                  </div>

                  {/* Criteria 3: Điều kiện Học vụ / Tín chỉ */}
                  <div className={`criteria-card ${result.completedCredits !== undefined && result.completedCredits !== null && result.completedCredits >= 110 && !result.missingPrerequisiteCount && (!result.debtCredits || result.debtCredits === 0) ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{result.completedCredits !== undefined && result.completedCredits !== null && result.completedCredits >= 110 && !result.missingPrerequisiteCount && (!result.debtCredits || result.debtCredits === 0) ? '✅' : '❌'}</span>
                      <span className="card-heading">3. Tín chỉ &amp; Môn tiên quyết</span>
                    </div>
                    <div className="card-desc">
                      Tích lũy tối thiểu 110 tín chỉ, hoàn thành nợ tín chỉ (= 0) và không nợ môn tiên quyết.
                    </div>
                    <div className="card-metric">
                      Tín chỉ tích lũy: <strong>{result.completedCredits !== undefined && result.completedCredits !== null ? `${result.completedCredits}/110` : 'Chưa có dữ liệu'}</strong>
                      {result.debtCredits !== undefined && result.debtCredits !== null && result.debtCredits > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}> (Còn nợ: {result.debtCredits} tín chỉ)</span>
                      ) : null}
                      {result.missingPrerequisiteCount ? ` (Nợ ${result.missingPrerequisiteCount} môn)` : ''}
                    </div>
                  </div>

                  {/* Criteria 4: Học phí & Kỷ luật */}
                  <div className={`criteria-card ${!result.tuitionDebt && !result.underDisciplinaryAction ? 'card-ok' : 'card-fail'}`}>
                    <div className="card-top">
                      <span className="card-icon">{!result.tuitionDebt && !result.underDisciplinaryAction ? '✅' : '❌'}</span>
                      <span className="card-heading">4. Nghĩa vụ học phí &amp; Kỷ luật</span>
                    </div>
                    <div className="card-desc">
                      Đã hoàn thành toàn bộ học phí và không bị kỷ luật.
                    </div>
                    <div className="card-metric">
                      Trạng thái: <strong>{!result.tuitionDebt && !result.underDisciplinaryAction ? 'Đã hoàn thành' : result.tuitionDebt && result.underDisciplinaryAction ? 'Nợ học phí & Bị kỷ luật' : result.tuitionDebt ? 'Còn nợ học phí' : 'Đang bị kỷ luật'}</strong>
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

      {/* TAB 2: Danh sách Sinh viên trong Đợt & Trạng thái */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Danh sách Sinh viên trong đợt — {selectedRound?.name} ({roundStudents.length} SV)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Theo dõi dữ liệu học vụ, điều kiện bảo vệ và thực hiện lập quyết định bảo lưu trực tiếp cho sinh viên đã có đề tài / GVHD nhưng chưa đủ điều kiện bảo vệ.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Tìm theo MSSV, họ tên..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedRoundId) {
                    loadRoundData(selectedRoundId);
                  }
                }}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '220px' }}
              />
              <button
                onClick={() => selectedRoundId && loadRoundData(selectedRoundId)}
                style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Tìm
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách sinh viên...</div>
          ) : roundStudents.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>STT</th>
                    <th style={{ padding: '10px 12px' }}>MSSV</th>
                    <th style={{ padding: '10px 12px' }}>Họ và tên</th>
                    <th style={{ padding: '10px 12px' }}>Đề tài &amp; Tiến độ</th>
                    <th style={{ padding: '10px 12px' }}>Thông tin học vụ</th>
                    <th style={{ padding: '10px 12px' }}>Điểm GPA</th>
                    <th style={{ padding: '10px 12px' }}>Điều kiện Bảo vệ &amp; Bảo lưu</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {roundStudents.map((st, idx) => {
                    const thesis = findStudentThesis(st);
                    const reservation = findStudentReservation(st.studentId, st.studentCode);
                    const isReserved = st.status === 'RESERVED' || thesis?.status === 'RESERVED' || reservation?.status === 'APPROVED';
                    const hasPendingRes = reservation?.status === 'PENDING';
                    const isDropped = st.status === 'DROPPED' || st.status === 'DISQUALIFIED' || st.status === 'INELIGIBLE';

                    // Academic condition check: Completed credits >= 110, debtCredits == 0, no prerequisites missing, no tuition debt, no discipline
                    const isAcademicEligible =
                      (!st.debtCredits || st.debtCredits === 0) &&
                      (!st.missingPrerequisiteCount || st.missingPrerequisiteCount === 0) &&
                      !st.tuitionDebt &&
                      !st.underDisciplinaryAction &&
                      (st.completedCredits === undefined || st.completedCredits === null || st.completedCredits >= 110);

                    const hasSupervisorApproved = Boolean(
                      thesis && (
                        thesis.defenseEligible ||
                        thesis.status === 'COMPLETED' ||
                        thesis.status === 'DEFENSE_READY'
                      )
                    );

                    const isThesisProgressComplete = Boolean(
                      thesis && (thesis.completionRate === 100 || hasSupervisorApproved)
                    );

                    // Requirement 3: Student must have a thesis and supervisor assigned
                    const hasAssignedThesisAndSupervisor = Boolean(
                      thesis && thesis.id && (thesis.lecturerId || thesis.lecturerFullName)
                    );

                    // Requirement 2: Student is eligible for defense ONLY IF thesis approved AND academic conditions satisfied
                    const isEligibleForDefense = Boolean(
                      !isReserved &&
                      !isDropped &&
                      hasAssignedThesisAndSupervisor &&
                      hasSupervisorApproved &&
                      isThesisProgressComplete &&
                      isAcademicEligible
                    );
                    const progressRate = thesis?.completionRate ?? (hasSupervisorApproved ? 100 : 0);

                    return (
                      <tr key={st.studentRoundId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                          <div>{st.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                            {st.className || st.majorCode || ''}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: '280px' }}>
                          {thesis ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                                {thesis.titleVn}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                                Tiến độ: {progressRate}% {thesis.lecturerFullName ? `• GVHD: ${thesis.lecturerFullName}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đề tài chính thức</span>
                          )}
                        </td>
                        {/* Cột Học vụ (Yêu cầu 1) */}
                        <td style={{ padding: '10px 12px', minWidth: '190px' }}>
                          <div style={{ fontSize: '0.82rem' }}>
                            <div style={{ marginBottom: '3px' }}>
                              <strong>Tích lũy:</strong> {st.completedCredits ?? 0} TC
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Nợ tín:</strong>{' '}
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: (st.debtCredits !== undefined && st.debtCredits > 0) ? '#dc2626' : '#16a34a',
                                }}
                              >
                                {st.debtCredits !== undefined && st.debtCredits > 0 ? `${st.debtCredits} TC (Nợ)` : '0 TC'}
                              </span>
                              {st.missingPrerequisiteCount && st.missingPrerequisiteCount > 0 ? (
                                <span style={{ color: '#ea580c', fontSize: '0.75rem', marginLeft: '4px' }}>
                                  • Nợ {st.missingPrerequisiteCount} môn TQ
                                </span>
                              ) : null}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  backgroundColor: st.tuitionDebt ? '#fee2e2' : '#dcfce7',
                                  color: st.tuitionDebt ? '#991b1b' : '#166534',
                                }}
                              >
                                {st.tuitionDebt ? 'Nợ HP' : 'Đã đóng HP'}
                              </span>
                              {st.underDisciplinaryAction ? (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                  }}
                                >
                                  Kỷ luật
                                </span>
                              ) : (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                  }}
                                >
                                  Không KL
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: (st.gpa !== undefined && st.gpa !== null && st.gpa < 2.0) ? '#dc2626' : '#0a3273', fontWeight: 700 }}>
                            {st.gpa !== undefined && st.gpa !== null ? Number(st.gpa).toFixed(2) : '—'}
                          </span>
                        </td>
                        {/* Cột Điều kiện Bảo vệ & Bảo lưu (Yêu cầu 2) */}
                        <td style={{ padding: '10px 12px' }}>
                          {isReserved ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: '#f3e8ff',
                                color: '#7e22ce',
                                border: '1px solid #d8b4fe',
                                display: 'inline-block',
                              }}
                            >
                              🟣 Đã bảo lưu (RESERVED)
                            </span>
                          ) : hasPendingRes ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                display: 'inline-block',
                              }}
                            >
                              🟠 Chờ duyệt bảo lưu (#{reservation.id})
                            </span>
                          ) : isDropped ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                display: 'inline-block',
                              }}
                            >
                              🚫 Đã bị loại khỏi đợt
                            </span>
                          ) : isEligibleForDefense ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                display: 'inline-block',
                              }}
                            >
                              ✅ Đủ điều kiện bảo vệ
                            </span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: '#fff1f2',
                                  color: '#be123c',
                                  border: '1px solid #fecdd3',
                                  display: 'inline-block',
                                }}
                              >
                                ❌ Chưa đủ điều kiện bảo vệ
                              </span>
                              <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '3px', fontWeight: 600 }}>
                                {!thesis
                                  ? 'Chưa có đề tài'
                                  : !hasAssignedThesisAndSupervisor
                                  ? 'Chưa phân công GVHD'
                                  : (st.debtCredits !== undefined && st.debtCredits > 0)
                                  ? `Nợ ${st.debtCredits} tín chỉ`
                                  : (st.missingPrerequisiteCount && st.missingPrerequisiteCount > 0)
                                  ? `Nợ ${st.missingPrerequisiteCount} môn TQ`
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
                        {/* Cột Thao tác (Yêu cầu 1 & 3) */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleQuickCheckStudent(st)}
                              style={{
                                backgroundColor: '#0a3273',
                                color: '#fff',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              🔍 Kiểm tra
                            </button>

                            {/* Thao tác thay đổi học vụ (Yêu cầu 1) */}
                            {isAdmin && (
                              <button
                                onClick={() => setEditingAcademicStudent(st)}
                                title="Chỉnh sửa thông tin học vụ (tín chỉ tích lũy, nợ tín, học phí, kỷ luật)"
                                style={{
                                  backgroundColor: '#eff6ff',
                                  color: '#0a3273',
                                  border: '1px solid #bfdbfe',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                ✏️ Sửa học vụ
                              </button>
                            )}

                            {/* Trả nợ tín chỉ nhanh về 0 nếu còn nợ */}
                            {isAdmin && st.debtCredits !== undefined && st.debtCredits > 0 && (
                              <button
                                onClick={() => handleQuickClearDebt(st)}
                                disabled={clearingDebtStudentId === st.studentId}
                                title="Xác nhận sinh viên đã trả nợ xong để đủ điều kiện xét bảo vệ (chuyển nợ tín về 0)"
                                style={{
                                  backgroundColor: '#f0fdf4',
                                  color: '#16a34a',
                                  border: '1px solid #86efac',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: clearingDebtStudentId === st.studentId ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {clearingDebtStudentId === st.studentId ? '⏳ Đang xóa...' : '⚡ Trả nợ (=0)'}
                              </button>
                            )}

                            {hasPendingRes && reservation && (
                              <button
                                onClick={() => setSelectedReservationForReview(reservation)}
                                style={{
                                  backgroundColor: '#f59e0b',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                ✍️ Duyệt bảo lưu
                              </button>
                            )}

                            {/* Yêu cầu 3: Có đề tài và đã được phân GVHD rồi thì mới được bảo lưu */}
                            {!isReserved && !isEligibleForDefense && !hasPendingRes && isAdmin && hasAssignedThesisAndSupervisor && (
                              <button
                                onClick={() => {
                                  setSelectedStudentForAdminReserve({
                                    studentId: st.studentId,
                                    studentCode: st.studentCode,
                                    studentName: st.fullName,
                                    thesisId: thesis?.id,
                                    thesisTitle: thesis?.titleVn,
                                    defaultCategory: (st.debtCredits && st.debtCredits > 0) ? 'INSUFFICIENT_CREDITS' : 'SUPERVISOR_NOT_ELIGIBLE',
                                    defaultReason: (st.debtCredits && st.debtCredits > 0)
                                      ? `Bảo lưu kết quả đồ án do chưa hoàn thành nợ tín chỉ (Còn nợ: ${st.debtCredits} tín chỉ)`
                                      : 'Bảo lưu kết quả đồ án theo đề nghị của Khoa / GVHD',
                                  });
                                }}
                                style={{
                                  backgroundColor: '#7c3aed',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
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
              Chưa có sinh viên nào trong đợt đồ án này hoặc không tìm thấy kết quả.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Danh sách Đơn bảo lưu trong đợt */}
      {activeTab === 'reservations' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Danh sách Đơn xin bảo lưu đồ án — {selectedRound?.name} ({reservationsInRound.length} đơn)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Khoa phê duyệt hoặc từ chối các đơn xin bảo lưu của sinh viên trước khi thành lập Hội đồng và xếp lịch bảo vệ.
              </p>
            </div>
          </div>

          {loadingReservations ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách đơn bảo lưu...</div>
          ) : reservationsInRound.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>Mã đơn</th>
                    <th style={{ padding: '10px 12px' }}>Sinh viên</th>
                    <th style={{ padding: '10px 12px' }}>Phân loại lý do</th>
                    <th style={{ padding: '10px 12px' }}>Nội dung &amp; Minh chứng</th>
                    <th style={{ padding: '10px 12px' }}>Ý kiến GVHD</th>
                    <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reservationsInRound.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{res.id}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0a3273' }}>{res.studentCode || `SV${res.studentId}`}</div>
                        <div style={{ color: '#1e293b', fontSize: '0.8rem' }}>{res.studentName || 'Sinh viên'}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {res.reasonCategory === 'INSUFFICIENT_CREDITS' && (
                          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Chưa trả đủ tín chỉ</span>
                        )}
                        {res.reasonCategory === 'SUPERVISOR_NOT_ELIGIBLE' && (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>GVHD xét chưa đạt</span>
                        )}
                        {res.reasonCategory === 'HEALTH_REASONS' && (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Lý do sức khỏe</span>
                        )}
                        {!['INSUFFICIENT_CREDITS', 'SUPERVISOR_NOT_ELIGIBLE', 'HEALTH_REASONS'].includes(res.reasonCategory || '') && (
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{res.reasonCategory || 'Khác'}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: '300px' }}>
                        <div>{res.reason}</div>
                        {res.evidenceFileUrl && (
                          <a href={res.evidenceFileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                            📎 Minh chứng đính kèm
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {res.supervisorComment ? (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span>{res.supervisorApproved ? '✅ Đồng ý' : '⚠️ Ý kiến'}: </span>
                            <em>{res.supervisorComment}</em>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Chưa có ý kiến</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge
                          status={res.status}
                          label={res.status === 'APPROVED' ? 'Đã duyệt' : res.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {res.status === 'PENDING' && isAdmin ? (
                          <button
                            onClick={() => setSelectedReservationForReview(res)}
                            style={{
                              backgroundColor: '#0a3273',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✍️ Phê duyệt
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedReservationForReview(res)}
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
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
              Chưa có đơn xin bảo lưu nào trong đợt đồ án này.
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

      {/* Modal: Admin lập quyết định bảo lưu */}
      <AdminCreateReservationModal
        isOpen={Boolean(selectedStudentForAdminReserve)}
        onClose={() => setSelectedStudentForAdminReserve(null)}
        student={selectedStudentForAdminReserve}
        projectRoundId={selectedRoundId || 10}
        onConfirm={handleAdminCreateReservation}
      />

      {/* Modal: Chỉnh sửa thông tin học vụ (Yêu cầu 1) */}
      <EditAcademicRecordModal
        isOpen={Boolean(editingAcademicStudent)}
        onClose={() => setEditingAcademicStudent(null)}
        student={editingAcademicStudent}
        projectRoundId={selectedRoundId || 10}
        onSuccess={async () => {
          setNotification({
            type: 'success',
            message: `Cập nhật thông tin học vụ cho sinh viên ${editingAcademicStudent?.studentCode} thành công`,
          });
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
