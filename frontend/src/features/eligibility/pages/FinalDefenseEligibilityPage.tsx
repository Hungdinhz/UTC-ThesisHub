import React, { useState, useEffect } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { eligibilityService } from '../services/eligibilityService';
import { apiService } from '../../../services/api';
import type { FinalDefenseEligibilityResponse } from '../types';
import type { ProjectRoundItem, StudentProjectRoundItem } from '../../../types';
import { RoundAcademicRecordsTab } from '../../project-round/components/RoundAcademicRecordsTab';
import './EligibilityPages.css';

export const FinalDefenseEligibilityPage: React.FC = () => {
  // Navigation sub-tabs: 'check' | 'students' | 'academic'
  const [activeTab, setActiveTab] = useState<'check' | 'students' | 'academic'>('check');

  // Project Rounds state
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Students in selected round state
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Single thesis/student check state
  const [thesisIdInput, setThesisIdInput] = useState('101');
  const [studentIdInput, setStudentIdInput] = useState('');
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
            data.find((r) => r.status === 'OPEN') ||
            data.find((r) => r.status === 'IN_PROGRESS') ||
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

  // 2. Fetch students in the selected round
  const loadStudentsInRound = async (roundId: number) => {
    try {
      setLoadingStudents(true);
      const res = await apiService.getStudentsInRound(roundId, {
        size: 100,
        search: studentSearch || undefined,
      });
      setRoundStudents(res?.content || []);
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

  // 3. Handle check single thesis / student criteria
  const handleCheck = async (e?: React.FormEvent, customStudentId?: number, customThesisId?: number) => {
    if (e) e.preventDefault();
    const effectiveThesisId = customThesisId !== undefined ? customThesisId : (thesisIdInput ? Number(thesisIdInput) : undefined);
    const effectiveStudentId = customStudentId !== undefined ? customStudentId : (studentIdInput ? Number(studentIdInput) : undefined);

    if (!effectiveThesisId && !effectiveStudentId) {
      setError('Vui lòng nhập Mã đề tài hoặc Mã định danh sinh viên');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await eligibilityService.checkFinalDefenseEligibility({
        thesisId: effectiveThesisId,
        studentId: effectiveStudentId,
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
    setStudentIdInput(String(student.studentId));
    setThesisIdInput('');
    handleCheck(undefined, student.studentId, undefined);
  };

  return (
    <div className="feature-page-container">
      {/* Page Header */}
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xét điều kiện bảo vệ đồ án tốt nghiệp cuối kỳ</h1>
          <p className="feature-page-subtitle">
            Giai đoạn 5: Kiểm tra 4 tiêu chí cứng (GVHD đồng ý ≥ 5.0, GVPB đồng ý ≥ 5.0, Tỷ lệ đạo văn ≤ 20%, Hoàn thành tiến độ) và Dữ liệu kết quả học vụ.
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
            {rounds.map((r) => (
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

        <button
          onClick={() => setActiveTab('academic')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'academic' ? '3px solid #0a3273' : '3px solid transparent',
            color: activeTab === 'academic' ? '#0a3273' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📊 Quản lý kết quả học vụ (Import Excel & Thủ công)
        </button>
      </div>

      {/* TAB 1: Kiểm tra Điều kiện Bảo vệ Cuối kỳ (4 tiêu chí cứng) */}
      {activeTab === 'check' && (
        <div>
          {/* Search Input Box */}
          <div className="final-defense-query-card">
            <form onSubmit={handleCheck} className="query-form-row">
              <div className="query-input-group">
                <label htmlFor="thesisId">Mã đề tài (Thesis ID):</label>
                <input
                  id="thesisId"
                  type="number"
                  className="form-control"
                  placeholder="VD: 101, 102..."
                  value={thesisIdInput}
                  onChange={(e) => setThesisIdInput(e.target.value)}
                />
              </div>

              <div className="query-input-group">
                <label htmlFor="stdId">Hoặc Mã sinh viên (Student ID):</label>
                <input
                  id="stdId"
                  type="number"
                  className="form-control"
                  placeholder="VD: 101, 102..."
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                />
              </div>

              <div className="query-btn-group">
                <Button type="submit" variant="primary" loading={loading}>
                  🔍 Kiểm tra điều kiện
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
                    <strong>#{result.thesisId} - {result.thesisTitle}</strong>
                  </p>
                </div>
                <StatusBadge
                  status={result.eligibleForDefense ? 'PASSED' : 'FAILED'}
                  label={result.eligibleForDefense ? 'Đủ điều kiện' : 'Không đạt'}
                  size="md"
                />
              </div>

              {/* Criteria Checklist Grid */}
              <div className="criteria-grid">
                {/* Criteria 1: Supervisor */}
                <div className={`criteria-item-card ${result.supervisorScore >= 5.0 ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">1. Điểm Giảng viên Hướng dẫn (GVHD)</span>
                    <span className="criteria-status-icon">{result.supervisorScore >= 5.0 ? '✅ Đạt' : '❌ Không đạt'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className="score-value">{result.supervisorScore.toFixed(1)}</span>
                    <span className="score-scale">/ 10.0</span>
                  </div>
                  <p className="criteria-desc">Yêu cầu tối thiểu: ≥ 5.0 và đồng ý cho phép bảo vệ</p>
                </div>

                {/* Criteria 2: Reviewer */}
                <div className={`criteria-item-card ${result.reviewerScore >= 5.0 ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">2. Điểm Giảng viên Phản biện (GVPB)</span>
                    <span className="criteria-status-icon">{result.reviewerScore >= 5.0 ? '✅ Đạt' : '❌ Không đạt'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className="score-value">{result.reviewerScore.toFixed(1)}</span>
                    <span className="score-scale">/ 10.0</span>
                  </div>
                  <p className="criteria-desc">Yêu cầu tối thiểu: ≥ 5.0 và xác nhận đề tài đạt chất lượng</p>
                </div>

                {/* Criteria 3: Plagiarism */}
                <div className={`criteria-item-card ${result.plagiarismRate <= 20.0 ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">3. Tỷ lệ tương đồng Đạo văn</span>
                    <span className="criteria-status-icon">{result.plagiarismRate <= 20.0 ? '✅ Hợp lệ' : '❌ Vi phạm'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className={`score-value ${result.plagiarismRate > 20.0 ? 'text-danger' : 'text-success'}`}>
                      {result.plagiarismRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="criteria-desc">Yêu cầu kiểm định Turnitin/Kiểm duyệt: ≤ 20.0%</p>
                </div>

                {/* Criteria 4: Stages */}
                <div className={`criteria-item-card ${result.allProgressStagesCompleted ? 'pass' : 'fail'}`}>
                  <div className="criteria-header">
                    <span className="criteria-title">4. Tiến độ thực hiện các giai đoạn</span>
                    <span className="criteria-status-icon">{result.allProgressStagesCompleted ? '✅ Hoàn tất' : '❌ Thiếu nợ'}</span>
                  </div>
                  <div className="criteria-score-box">
                    <span className="score-status-text">{result.allProgressStagesCompleted ? '100% Hoàn thành' : 'Chưa hoàn tất'}</span>
                  </div>
                  <p className="criteria-desc">Bắt buộc nộp đủ Scope, SRS, SDD và Báo cáo tổng kết đồ án</p>
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

      {/* TAB 2: Danh sách Sinh viên trong Đợt & Xét điều kiện nhanh */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Danh sách Sinh viên trong đợt — {selectedRound?.name} ({roundStudents.length} SV)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Bấm vào nút "Xét ĐK bảo vệ" để kiểm tra tức thì 4 tiêu chí cứng của sinh viên.
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
                    <th style={{ padding: '10px 12px' }}>Ngành</th>
                    <th style={{ padding: '10px 12px' }}>Lớp</th>
                    <th style={{ padding: '10px 12px' }}>Điểm GPA</th>
                    <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roundStudents.map((st, idx) => (
                    <tr key={st.studentRoundId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{st.fullName}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', fontWeight: 600 }}>
                          {st.majorCode || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{st.className || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: (st.gpa !== undefined && st.gpa !== null && st.gpa < 2.0) ? '#dc2626' : '#0a3273', fontWeight: 700 }}>
                          {st.gpa !== undefined && st.gpa !== null ? Number(st.gpa).toFixed(2) : '3.20'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {st.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleQuickCheckStudent(st)}
                          style={{
                            backgroundColor: '#0a3273',
                            color: '#fff',
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: '5px',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 Xét ĐK bảo vệ
                        </button>
                      </td>
                    </tr>
                  ))}
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

      {/* TAB 3: Quản lý Kết quả học vụ (Import Excel, Thêm thủ công, Bảng học vụ) */}
      {activeTab === 'academic' && selectedRound && (
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <RoundAcademicRecordsTab
            roundId={selectedRound.roundId}
            roundName={selectedRound.name}
            roundCode={selectedRound.roundCode}
            isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
          />
        </div>
      )}
    </div>
  );
};
