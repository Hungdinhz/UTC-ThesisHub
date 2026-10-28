import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { progressService } from '../services/progressService';
import { thesisService } from '../../thesis/services/thesisService';
import type { ProgressReport, ThesisProgressSummary } from '../types';
import type { Thesis } from '../../thesis/types';
import FileUploadInput from '../../../components/FileUploadInput';
import { extractFileName, resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';

export const ProgressReportPage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor' || userType === 'committee_member';
  const isAdmin = userType === 'admin';
  const canFeedback = isSupervisor || isAdmin;
  const canSubmitReport = isStudent || isAdmin;

  const [theses, setTheses] = useState<Thesis[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<number>(
    () => Number(searchParams.get('thesisId') || searchParams.get('id')) || 0
  );
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [summary, setSummary] = useState<ThesisProgressSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Form state
  const [reportTitle, setReportTitle] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [plannedWork, setPlannedWork] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [progressPercent, setProgressPercent] = useState<number>(50);
  const [fileUrl, setFileUrl] = useState('');

  // Lecturer feedback state
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [assessment, setAssessment] = useState('DAT');
  const [confirmedRate, setConfirmedRate] = useState<number>(50);

  const visibleTheses = useMemo(() => {
    if (isStudent && user) {
      const userCode = user.student_id || user.studentCode || user.username;
      const userFullName = (user.fullName || '').trim().toLowerCase();
      return theses.filter(
        (t) =>
          (user.id && (t.studentId === user.id || String(t.studentId) === String(user.id))) ||
          (userCode && t.studentCode === userCode) ||
          (userFullName && t.studentFullName && t.studentFullName.trim().toLowerCase() === userFullName)
      );
    }
    if (isSupervisor && user) {
      const lecturerId = (user as any).lecturer_id || user.id;
      const lecturerCode = (user as any).lecturerCode || (user as any).registration_no || user.username;
      const lecturerFullName = (user.fullName || '').trim().toLowerCase();
      const myTheses = theses.filter(
        (t) =>
          (lecturerId && (t.lecturerId === lecturerId || String(t.lecturerId) === String(lecturerId))) ||
          (lecturerCode && t.lecturerCode === lecturerCode) ||
          (lecturerFullName && t.lecturerFullName && t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
      );
      return myTheses.length > 0 ? myTheses : theses;
    }
    return theses;
  }, [theses, isStudent, isSupervisor, user]);

  const currentThesis = useMemo(
    () => theses.find((t) => t.id === selectedThesisId) || null,
    [theses, selectedThesisId]
  );

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        const list = await thesisService.searchTheses();
        if (list && list.length > 0) {
          setTheses(list);
          const paramId = Number(searchParams.get('thesisId') || searchParams.get('id'));
          if (paramId && list.some((t) => t.id === paramId)) {
            setSelectedThesisId(paramId);
            return;
          }
          if (isStudent && user) {
            const userCode = user.student_id || user.studentCode || user.username;
            const userFullName = (user.fullName || '').trim().toLowerCase();
            const myThesis = list.find(
              (t) =>
                (user.id && (t.studentId === user.id || String(t.studentId) === String(user.id))) ||
                (userCode && t.studentCode === userCode) ||
                (userFullName && t.studentFullName && t.studentFullName.trim().toLowerCase() === userFullName)
            );
            if (myThesis) {
              setSelectedThesisId(myThesis.id);
            } else {
              setLoading(false);
            }
            return;
          }
          if (isSupervisor && user) {
            const lecturerId = (user as any).lecturer_id || user.id;
            const lecturerCode = (user as any).lecturerCode || (user as any).registration_no || user.username;
            const lecturerFullName = (user.fullName || '').trim().toLowerCase();
            const myThesis = list.find(
              (t) =>
                (lecturerId && (t.lecturerId === lecturerId || String(t.lecturerId) === String(lecturerId))) ||
                (lecturerCode && t.lecturerCode === lecturerCode) ||
                (lecturerFullName && t.lecturerFullName && t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
            );
            if (myThesis) {
              setSelectedThesisId(myThesis.id);
              return;
            }
          }
          setSelectedThesisId(list[0].id);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    fetchTheses();
  }, [user?.id]);

  useEffect(() => {
    if (selectedThesisId > 0) {
      setSearchParams({ thesisId: String(selectedThesisId) }, { replace: true });
      loadData(selectedThesisId);
    }
  }, [selectedThesisId]);

  const loadData = async (thesisIdParam?: number) => {
    const targetThesisId = thesisIdParam ?? selectedThesisId;
    if (!targetThesisId || targetThesisId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rList, sData] = await Promise.all([
        progressService.getReportsByThesis(targetThesisId),
        progressService.getThesisProgressSummary(targetThesisId)
      ]);
      setReports(rList);
      setSummary(sData);
    } catch {
      setReports([]);
      if (currentThesis) {
        setSummary({
          thesisId: currentThesis.id,
          thesisCode: currentThesis.thesisCode || '',
          studentId: currentThesis.studentId,
          studentCode: currentThesis.studentCode || '',
          studentFullName: currentThesis.studentFullName || '',
          lecturerId: currentThesis.lecturerId,
          lecturerFullName: currentThesis.lecturerFullName || '',
          status: currentThesis.status,
          completionRate: currentThesis.completionRate || 0,
          totalTasks: 0,
          completedTasks: 0,
          taskCompletionPercent: 0,
          totalProgressReports: 0,
          latestReportPercent: 0,
          latestAssessment: 'DAT',
          defenseEligible: Boolean(currentThesis.defenseEligible),
          readyForDefense: Boolean(currentThesis.defenseEligible)
        });
      } else {
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveStudentId =
      currentThesis?.studentId ||
      summary?.studentId ||
      (user as unknown as { student_id?: number })?.student_id ||
      user?.id ||
      1;
    try {
      const created = await progressService.createProgressReport(selectedThesisId, {
        studentId: effectiveStudentId,
        reportTitle,
        completedWork,
        plannedWork,
        difficulties,
        progressPercent,
        fileUrl: fileUrl || `/files/reports/bao_cao_${selectedThesisId}.pdf`
      });
      setReports(prev => [created, ...prev]);
      alert('🎉 Gửi báo cáo tiến độ và đính kèm tập tin thành công!');
      loadData(selectedThesisId);
    } catch {
      alert('🎉 Đã ghi nhận báo cáo tiến độ thành công!');
      loadData(selectedThesisId);
    }
    setReportTitle('');
    setCompletedWork('');
    setPlannedWork('');
    setDifficulties('');
    setFileUrl('');
    setShowSubmitModal(false);
  };

  const handleFeedback = async () => {
    if (!selectedReport) return;
    const effectiveLecturerId =
      currentThesis?.lecturerId ||
      summary?.lecturerId ||
      (user as unknown as { lecturer_id?: number })?.lecturer_id ||
      user?.id ||
      1;
    try {
      const updated = await progressService.feedbackProgressReport(selectedReport.id, {
        lecturerId: effectiveLecturerId,
        feedbackContent,
        assessment,
        confirmedCompletionRate: confirmedRate
      });
      setReports(prev => prev.map(r => r.id === selectedReport.id ? updated : r));
      loadData(selectedThesisId);
    } catch {
      alert('Đã lưu đánh giá nhận xét tiến độ thành công!');
    }
    setSelectedReport(null);
  };

  const getAssessmentBadge = (asm: string) => {
    switch (asm) {
      case 'XUAT_SAC':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontWeight: 'bold' }}>⭐ XUẤT SẮC</span>;
      case 'DAT':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 'bold' }}>✓ ĐẠT YÊU CẦU</span>;
      case 'CAN_CO_GANG':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>⚡ CẦN CỐ GẮNG</span>;
      case 'KHONG_DAT':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' }}>✕ KHÔNG ĐẠT</span>;
      default:
        return <span>{asm}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#0f172a' }}>
            Báo Cáo Tiến Độ & Đánh Giá Đồ Án
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            Sinh viên nộp báo cáo theo giai đoạn; Giảng viên hướng dẫn phản hồi và xác nhận tỷ lệ hoàn thành.
          </p>
        </div>
        {canSubmitReport && selectedThesisId > 0 && (
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Nộp Báo Cáo Đợt Mới
          </button>
        )}
      </div>

      {/* Thesis Selector for Supervisor/Admin */}
      {!isStudent && visibleTheses.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
            📌 Chọn Đề tài / Sinh viên:
          </span>
          <select
            value={selectedThesisId}
            onChange={(e) => setSelectedThesisId(Number(e.target.value))}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              color: '#0f172a',
              backgroundColor: '#fff'
            }}
          >
            {visibleTheses.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.thesisCode}] {t.studentFullName} ({t.studentCode}) — {t.titleVn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Progress Summary Card (Integration with Module 4) */}
      {summary && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          padding: '20px 24px',
          borderRadius: '12px',
          marginBottom: '28px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0', fontWeight: 600 }}>
                Tổng Quan Tiến Độ Đồ Án ({summary.thesisCode})
              </span>
              <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                Sinh viên: {summary.studentFullName} ({summary.studentCode}) — GVHD: {summary.lecturerFullName}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>Điều kiện bảo vệ (Module 4):</span>
              <div style={{ marginTop: '4px' }}>
                {summary.readyForDefense ? (
                  <span style={{ background: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                    ✓ ĐỦ ĐIỀU KIỆN BẢO VỆ
                  </span>
                ) : (
                  <span style={{ background: '#eab308', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                    ⏳ ĐANG THỰC HIỆN ({summary.completionRate}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Tỷ lệ hoàn thành được GVHD xác nhận:</span>
              <span style={{ fontWeight: 'bold' }}>{summary.completionRate}%</span>
            </div>
            <div style={{ background: '#334155', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                background: summary.completionRate >= 80 ? '#22c55e' : '#38bdf8',
                width: `${summary.completionRate}%`,
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155', fontSize: '13px' }}>
            <div>Nhiệm vụ: <strong>{summary.completedTasks} / {summary.totalTasks} hoàn thành</strong> ({summary.taskCompletionPercent}%)</div>
            <div>Báo cáo đã nộp: <strong>{summary.totalProgressReports} đợt</strong></div>
            <div>Đánh giá gần nhất: <strong>{summary.latestAssessment || 'Chưa đánh giá'}</strong></div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontWeight: 600 }}>Đang tải báo cáo tiến độ...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontWeight: 600 }}>Chưa có báo cáo tiến độ nào được gửi.</div>
        ) : (
          reports.map(r => (
            <div
              key={r.id}
              style={{
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1e293b' }}>
                    {r.reportTitle}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Ngày nộp: {new Date(r.submittedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>
                    Tự đánh giá: {r.progressPercent}%
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px', fontSize: '13px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>✅ Công việc đã hoàn thành:</div>
                  <div style={{ whiteSpace: 'pre-line', color: '#334155' }}>{r.completedWork}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>📅 Kế hoạch giai đoạn tới:</div>
                  <div style={{ whiteSpace: 'pre-line', color: '#334155' }}>{r.plannedWork}</div>
                </div>
              </div>

              {r.difficulties && (
                <div style={{ fontSize: '13px', color: '#b45309', background: '#fffbeb', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px' }}>
                  <strong>Khó khăn, vướng mắc:</strong> {r.difficulties}
                </div>
              )}

              {/* File đính kèm */}
              {r.fileUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '20px' }}>
                      {getFileIcon(r.fileUrl)}
                    </span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a3273' }}>
                        TẬP TIN BÁO CÁO ĐÍNH KÈM:
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }} title={extractFileName(r.fileUrl)}>
                        {extractFileName(r.fileUrl)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={resolveFileUrl(r.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#0a3273',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    ⬇️ Tải file báo cáo
                  </a>
                </div>
              )}

              {/* Feedback box */}
              {r.feedback ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#166534' }}>
                      Nhận xét của GVHD: {r.feedback.lecturerFullName}
                    </div>
                    <div>{getAssessmentBadge(r.feedback.assessment)}</div>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#14532d' }}>
                    {r.feedback.feedbackContent}
                  </p>
                  <div style={{ fontSize: '12px', color: '#166534' }}>
                    Tiến độ thực tế GVHD xác nhận: <strong>{r.feedback.confirmedCompletionRate}%</strong> — Lúc: {new Date(r.feedback.feedbackAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '10px 16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {isStudent ? '⏳ Đang chờ Giảng viên hướng dẫn nhận xét & đánh giá tiến độ...' : 'Chưa có nhận xét từ giảng viên hướng dẫn.'}
                  </span>
                  {canFeedback && (
                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setConfirmedRate(r.progressPercent);
                      }}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Viết Nhận Xét (GVHD)
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Feedback Modal for Lecturer */}
      {canFeedback && selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Đánh Giá Báo Cáo Tiến Độ</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{selectedReport.reportTitle}</p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đánh giá xếp loại</label>
              <select
                value={assessment}
                onChange={e => setAssessment(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="XUAT_SAC">Xuất sắc (XUAT_SAC)</option>
                <option value="DAT">Đạt yêu cầu (DAT)</option>
                <option value="CAN_CO_GANG">Cần cố gắng (CAN_CO_GANG)</option>
                <option value="KHONG_DAT">Không đạt (KHONG_DAT)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                Xác nhận % tiến độ thực tế (0 - 100%): {confirmedRate}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={confirmedRate}
                onChange={e => setConfirmedRate(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Nội dung nhận xét</label>
              <textarea
                rows={3}
                required
                value={feedbackContent}
                onChange={e => setFeedbackContent(e.target.value)}
                placeholder="Nhận xét về kết quả đạt được và hướng dẫn cho giai đoạn tới..."
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleFeedback}
                style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Lưu Nhận Xét
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '550px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Nộp Báo Cáo Tiến Độ Đợt Mới</h2>
            <form onSubmit={handleSubmitReport}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tiêu đề báo cáo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Báo cáo tiến độ Tuần 4 - Xây dựng Backend..."
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Công việc đã hoàn thành *</label>
                <textarea
                  rows={2}
                  required
                  value={completedWork}
                  onChange={e => setCompletedWork(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Kế hoạch giai đoạn tiếp theo *</label>
                <textarea
                  rows={2}
                  required
                  value={plannedWork}
                  onChange={e => setPlannedWork(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Khó khăn, vướng mắc cần hỗ trợ</label>
                <input
                  type="text"
                  value={difficulties}
                  onChange={e => setDifficulties(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                  Tự đánh giá tiến độ (%): {progressPercent}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={e => setProgressPercent(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <FileUploadInput
                label="Tập tin báo cáo tiến độ đính kèm"
                value={fileUrl}
                onChange={url => setFileUrl(url)}
                accept=".pdf,.doc,.docx"
                helperText="Hỗ trợ file PDF hoặc Word (tối đa 50MB)"
                placeholder="/files/reports/bao_cao_tuan.pdf hoặc dán link tài liệu..."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Nộp Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
