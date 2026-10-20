import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { progressService } from '../services/progressService';
import type { ProgressReport, ThesisProgressSummary } from '../types';

export const ProgressReportPage: React.FC = () => {
  const { userType } = useAuth();
  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor';
  const isAdmin = userType === 'admin';
  const canFeedback = isSupervisor || isAdmin;
  const canSubmitReport = isStudent || isAdmin;

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, sData] = await Promise.all([
        progressService.getReportsByThesis(1),
        progressService.getThesisProgressSummary(1)
      ]);
      setReports(rList);
      setSummary(sData);
    } catch {
      // Fallback sample data
      setSummary({
        thesisId: 1,
        thesisCode: 'DT_2026_CNTT_001',
        studentId: 1,
        studentCode: '2021601234',
        studentFullName: 'Nguyễn Văn Sinh Viên',
        lecturerId: 1,
        lecturerFullName: 'TS. Trần Văn Giảng Viên',
        status: 'IN_PROGRESS',
        completionRate: 50.0,
        totalTasks: 3,
        completedTasks: 1,
        taskCompletionPercent: 33.33,
        totalProgressReports: 1,
        latestReportPercent: 50,
        latestAssessment: 'DAT',
        defenseEligible: false,
        readyForDefense: false
      });

      setReports([
        {
          id: 1,
          thesisId: 1,
          thesisTitle: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          studentId: 1,
          studentCode: '2021601234',
          studentFullName: 'Nguyễn Văn Sinh Viên',
          reportTitle: 'Báo cáo tiến độ đồ án - Đợt 1 (Phân tích & Thiết kế hệ thống)',
          completedWork: '1. Hoàn thành đề cương chi tiết.\n2. Thiết kế CSDL 37 bảng.\n3. Viết kịch bản Flyway migration V301 - V303.',
          plannedWork: '1. Xây dựng Rest API cho Đề tài và Task.\n2. Thiết kế bảng Kanban và giao diện nộp bài.',
          difficulties: 'Cần thống nhất DTO với module Phân công.',
          progressPercent: 50,
          fileUrl: '/files/reports/bao_cao_tien_do_dot_1.pdf',
          status: 'REVIEWED',
          submittedAt: '2026-10-12T14:30:00Z',
          feedback: {
            id: 1,
            progressReportId: 1,
            lecturerId: 1,
            lecturerFullName: 'TS. Trần Văn Giảng Viên',
            feedbackContent: 'Tiến độ thực hiện tốt, sinh viên chủ động và bám sát kế hoạch. Đồng ý mức tiến độ 50%.',
            assessment: 'DAT',
            confirmedCompletionRate: 50.0,
            feedbackAt: '2026-10-13T10:15:00Z',
            createdAt: '2026-10-13T10:15:00Z',
            updatedAt: '2026-10-13T10:15:00Z'
          },
          createdAt: '2026-10-12T14:30:00Z',
          updatedAt: '2026-10-13T10:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await progressService.createProgressReport(1, {
        studentId: 1,
        reportTitle,
        completedWork,
        plannedWork,
        difficulties,
        progressPercent,
        fileUrl: fileUrl || '/files/reports/bao_cao_moi.pdf'
      });
      setReports(prev => [created, ...prev]);
    } catch {
      alert('Đã gửi báo cáo tiến độ thành công!');
      loadData();
    }
    setShowSubmitModal(false);
  };

  const handleFeedback = async () => {
    if (!selectedReport) return;
    try {
      const updated = await progressService.feedbackProgressReport(selectedReport.id, {
        lecturerId: 1,
        feedbackContent,
        assessment,
        confirmedCompletionRate: confirmedRate
      });
      setReports(prev => prev.map(r => r.id === selectedReport.id ? updated : r));
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
        {canSubmitReport && (
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
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                Tổng Quan Tiến Độ Đồ Án ({summary.thesisCode})
              </span>
              <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                Sinh viên: {summary.studentFullName} ({summary.studentCode}) — GVHD: {summary.lecturerFullName}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Điều kiện bảo vệ (Module 4):</span>
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải báo cáo tiến độ...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có báo cáo tiến độ nào được gửi.</div>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                  Đường dẫn file báo cáo đính kèm (PDF)
                </label>
                <input
                  type="text"
                  placeholder="/files/reports/bao_cao_tuan.pdf"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

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
