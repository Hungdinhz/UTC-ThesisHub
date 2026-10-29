import React, { useState, useEffect } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { eligibilityService } from '../services/eligibilityService';
import { thesisService } from '../../thesis/services/thesisService';
import type { Thesis } from '../../thesis/types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { FinalDefenseEligibilityResponse } from '../types';
import type { ProjectRoundItem, StudentProjectRoundItem } from '../../../types';
import './EligibilityPages.css';

export const FinalDefenseEligibilityPage: React.FC = () => {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin';
  // Navigation sub-tabs: 'check' | 'students'
  const [activeTab, setActiveTab] = useState<'check' | 'students'>('check');

  // Project Rounds state
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Students & Theses in selected round state
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [roundTheses, setRoundTheses] = useState<Thesis[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [updatingThesisId, setUpdatingThesisId] = useState<number | null>(null);

  // Single student check state (search by Student Code / MSSV only)
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinalDefenseEligibilityResponse | null>(null);
  const [error, setError] = useState('');

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

  // 2. Fetch students and theses in the selected round
  const loadStudentsInRound = async (roundId: number) => {
    try {
      setLoadingStudents(true);
      const [res, thesesList] = await Promise.all([
        apiService.getStudentsInRound(roundId, {
          size: 100,
          search: studentSearch || undefined,
        }),
        thesisService.searchTheses({ roundId }).catch(() => [] as Thesis[]),
      ]);
      const rawList = res?.content || [];
      const sortedList = [...rawList].sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      setRoundStudents(sortedList);
      setRoundTheses(thesesList || []);
    } catch (err) {
      console.error('Lỗi khi tải sinh viên trong đợt:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedRoundId) {
      loadStudentsInRound(selectedRoundId);
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

    // Try matching from loaded roundStudents / roundTheses first
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

  const handleToggleDefenseEligibility = async (
    thesisId: number | undefined,
    studentName: string,
    studentCode: string,
    currentEligible: boolean
  ) => {
    if (!thesisId || thesisId <= 0) {
      alert(`Sinh viên ${studentName} (${studentCode}) hiện chưa có đề tài chính thức trong đợt này!`);
      return;
    }
    const targetEligible = !currentEligible;
    const actionText = targetEligible ? 'ĐỦ ĐIỀU KIỆN BẢO VỆ' : 'CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ';
    const confirmed = window.confirm(
      `Xác nhận chỉnh sửa trạng thái của sinh viên ${studentName} (${studentCode}) sang "${actionText}"?`
    );
    if (!confirmed) return;

    try {
      setUpdatingThesisId(thesisId);
      await thesisService.setDefenseEligible(thesisId, targetEligible);
      if (selectedRoundId) {
        await loadStudentsInRound(selectedRoundId);
      }
      if (result && (result.thesisId === thesisId || result.studentCode === studentCode)) {
        const refreshed = await eligibilityService.checkFinalDefenseEligibility({
          thesisId,
          studentCode,
          projectRoundId: selectedRoundId || undefined,
        });
        setResult(refreshed);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật trạng thái điều kiện bảo vệ');
    } finally {
      setUpdatingThesisId(null);
    }
  };

  return (
    <div className="feature-page-container">
      {/* Page Header */}
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xét điều kiện bảo vệ đồ án tốt nghiệp cuối kỳ</h1>
          <p className="feature-page-subtitle">
            Giai đoạn 5: Kiểm tra tiêu chí xét duyệt bảo vệ đồ án tốt nghiệp cuối kỳ (Hoàn thành 100% tiến độ thực hiện đồ án, GVHD đánh giá đạt ≥ 5.0 và đồng ý cho phép bảo vệ).
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
      </div>

      {/* TAB 1: Kiểm tra Điều kiện Bảo vệ Cuối kỳ (4 tiêu chí cứng) */}
      {activeTab === 'check' && (
        <div>
          {/* Search Input Box — Tìm duy nhất theo Mã sinh viên (MSSV) */}
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

            {error && <div className="form-error-msg mt-3">{error}</div>}
          </div>

          {/* Result Display */}
          {result && (
            <div className="defense-result-container">
              {/* Header Status Card */}
              <div className={`defense-status-banner ${result.eligibleForDefense ? 'eligible' : 'ineligible'}`}>
                <div className="banner-icon">{result.eligibleForDefense ? '🎉' : '⚠️'}</div>
                <div className="banner-content">
                  <h2>{result.eligibleForDefense ? 'ĐỦ ĐIỀU KIỆN BẢO VỆ CUỐI KỲ' : 'CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ'}</h2>
                  <p>
                    Sinh viên: <strong>{result.studentName}</strong> ({result.studentCode}) — Đề tài:{' '}
                    <strong>{result.thesisTitle}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <StatusBadge
                    status={result.eligibleForDefense ? 'PASSED' : 'FAILED'}
                    label={result.eligibleForDefense ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
                    size="md"
                  />
                  {result.thesisId > 0 && (
                    <button
                      type="button"
                      disabled={updatingThesisId === result.thesisId}
                      onClick={() =>
                        handleToggleDefenseEligibility(
                          result.thesisId,
                          result.studentName,
                          result.studentCode,
                          result.eligibleForDefense
                        )
                      }
                      style={{
                        backgroundColor: result.eligibleForDefense ? '#dc2626' : '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {result.eligibleForDefense
                        ? '✏️ Chỉnh sửa: Chưa đủ ĐK bảo vệ'
                        : '✏️ Chỉnh sửa: Xác nhận Đủ ĐK bảo vệ'}
                    </button>
                  )}
                </div>
              </div>

              {/* Criteria Checklist Grid - 2 real criteria according to UTC yeucau.md */}
              <div className="criteria-grid">
                {/* Criteria 1: Stages Progress */}
                <div className={`criteria-item-card ${result.allProgressStagesCompleted ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">1. Tiến độ thực hiện các giai đoạn</span>
                    <span className="criteria-status-icon">{result.allProgressStagesCompleted ? '✅ Hoàn tất' : '❌ Thiếu nợ'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className="score-status-text">{result.allProgressStagesCompleted ? '100% Hoàn thành' : 'Chưa hoàn tất'}</span>
                  </div>
                  <p className="criteria-desc">Bắt buộc nộp đủ Scope, SRS, SDD và Báo cáo tổng kết đồ án</p>
                </div>

                {/* Criteria 2: Supervisor Evaluation */}
                <div className={`criteria-item-card ${result.supervisorScore >= 5.0 ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">2. Đánh giá của Giảng viên Hướng dẫn (GVHD)</span>
                    <span className="criteria-status-icon">{result.supervisorScore >= 5.0 ? '✅ Đạt' : '❌ Không đạt'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className="score-value">{result.supervisorScore.toFixed(1)}</span>
                    <span className="score-scale">/ 10.0</span>
                  </div>
                  <p className="criteria-desc">Yêu cầu tối thiểu: Điểm thành phần ≥ 5.0 và đồng ý cho phép bảo vệ</p>
                </div>
              </div>

              {/* Reasons / Conclusions */}
              <div className="defense-reasons-card">
                <h3>Kết luận & Đánh giá của Hội đồng xét duyệt:</h3>
                <ul>
                  {result.reasons.map((r, i) => (
                    <li key={i} className={result.eligibleForDefense ? 'text-success' : 'text-danger'}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Danh sách Sinh viên trong Đợt & Trạng thái Đủ điều kiện bảo vệ */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Danh sách Sinh viên trong đợt — {selectedRound?.name} ({roundStudents.length} SV)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Hiển thị trực tiếp trạng thái đủ điều kiện bảo vệ của từng sinh viên. Bấm &quot;Kiểm tra lại / Chỉnh sửa&quot; để sang mục Xét ĐK bảo vệ.
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
                    loadStudentsInRound(selectedRoundId);
                  }
                }}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '220px' }}
              />
              <button
                onClick={() => selectedRoundId && loadStudentsInRound(selectedRoundId)}
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
                    <th style={{ padding: '10px 12px' }}>Đề tài & Tiến độ</th>
                    <th style={{ padding: '10px 12px' }}>Điểm GPA</th>
                    <th style={{ padding: '10px 12px' }}>Điều kiện Bảo vệ Cuối kỳ</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roundStudents.map((st, idx) => {
                    const thesis = findStudentThesis(st);
                    const isEligibleForDefense = Boolean(
                      thesis &&
                        (thesis.defenseEligible ||
                          thesis.status === 'COMPLETED')
                    );
                    const progressRate = thesis?.completionRate ?? (isEligibleForDefense ? 100 : 0);

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
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: (st.gpa !== undefined && st.gpa !== null && st.gpa < 2.0) ? '#dc2626' : '#0a3273', fontWeight: 700 }}>
                            {st.gpa !== undefined && st.gpa !== null ? Number(st.gpa).toFixed(2) : '3.20'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {st.status === 'DROPPED' ? (
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
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleQuickCheckStudent(st)}
                            style={{
                              backgroundColor: '#0a3273',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '5px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            🔍 Kiểm tra lại / Chỉnh sửa
                          </button>
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
    </div>
  );
};
