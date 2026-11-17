import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui';
import { apiService } from '../../../services/api';
import type { ClassGradeReportResponse, ProjectRoundItem } from '../../../types';
import { downloadBlob, extractErrorMessage } from '../utils/download';
import '../../eligibility/pages/EligibilityPages.css';
import './AcademicStaffPages.css';

const readUrlQueryParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

const fmt = (v?: number | null) => (v === null || v === undefined ? '' : Number(v).toFixed(2));

export const ClassGradeReportPage: React.FC = () => {
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [className, setClassName] = useState('');
  const [report, setReport] = useState<ClassGradeReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedRound = rounds.find((r) => r.roundId === roundId) || null;

  useEffect(() => {
    (async () => {
      try {
        const list = await apiService.getProjectRounds();
        setRounds(list || []);
        const urlRoundRaw = readUrlQueryParam('roundId');
        const urlRoundNum = urlRoundRaw ? Number(urlRoundRaw) : NaN;
        const fromUrl = !isNaN(urlRoundNum) && list?.find((r) => r.roundId === urlRoundNum);
        const pick =
          fromUrl ||
          list?.find((r) => r.status === 'CLOSED') ||
          list?.find((r) => r.status === 'IN_PROGRESS') ||
          list?.[0];
        if (pick) setRoundId(pick.roundId);
      } catch {
        setNotification({ type: 'error', message: 'Không thể tải danh sách đợt đồ án' });
      }
    })();
  }, []);

  // Đổi đợt: tải toàn bộ báo cáo, lấy danh sách lớp từ đó
  useEffect(() => {
    if (roundId === null) return;
    (async () => {
      try {
        setLoading(true);
        const all = await apiService.getGradeReport(roundId);
        setClassNames(all.classes.map((c) => c.className));
        setClassName('');
        setReport(all);
      } catch (err: any) {
        setReport(null);
        setClassNames([]);
        setNotification({ type: 'error', message: await extractErrorMessage(err, 'Không thể tải danh sách điểm') });
      } finally {
        setLoading(false);
      }
    })();
  }, [roundId]);

  // Đổi lớp: tải lại báo cáo theo lớp
  const handleClassChange = async (value: string) => {
    setClassName(value);
    if (roundId === null) return;
    try {
      setLoading(true);
      setReport(await apiService.getGradeReport(roundId, value || undefined));
    } catch (err: any) {
      setNotification({ type: 'error', message: await extractErrorMessage(err, 'Không thể tải danh sách điểm') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleExport = async () => {
    if (roundId === null) return;
    try {
      setExporting(true);
      const blob = await apiService.exportGradeReport(roundId, className || undefined);
      const suffix = className ? `_${className.replace(/[^A-Za-z0-9_-]+/g, '_')}` : '';
      downloadBlob(blob, `diem_do_an_${selectedRound?.roundCode || roundId}${suffix}.xlsx`);
      setNotification({ type: 'success', message: 'Đã xuất file Excel danh sách điểm đồ án.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: await extractErrorMessage(err, 'Xuất Excel thất bại') });
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    const classes = report?.classes || [];
    const classCount = classes.length;
    const totalStudents = classes.reduce((acc, g) => acc + (g.totalStudents || 0), 0);
    const passedCount = classes.reduce((acc, g) => acc + (g.passedCount || 0), 0);
    const failedCount = classes.reduce((acc, g) => acc + (g.failedCount || 0), 0);
    return { classCount, totalStudents, passedCount, failedCount };
  }, [report]);

  const hasData = (report?.classes.length ?? 0) > 0;

  return (
    <div className="feature-page-container">
      {notification && (
        <div className={`page-alert ${notification.type} no-print`}>
          <span>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Unified UTC Hero Header & Filter Controls */}
      <div className="utc-stage-hero no-print">
        <div className="utc-stage-hero-main">
          <div>
            <div className="utc-stage-eyebrow">
              <span>🖨️</span> GIAI ĐOẠN 5 • TỔNG HỢP &amp; IN BẢNG ĐIỂM THEO LỚP
            </div>
            <h1 className="utc-stage-title">In danh sách điểm đồ án theo lớp</h1>
            <p className="utc-stage-subtitle">
              Tra cứu bảng điểm tốt nghiệp đã công bố theo từng lớp quản lý, xuất file Excel hoặc in biên bản khổ A4 ngang chuẩn UTC.
            </p>
          </div>

          <div className="utc-stage-hero-actions">
            <Button variant="success" onClick={handleExport} loading={exporting} disabled={!hasData}>
              📊 Xuất Excel
            </Button>
            <Button variant="primary" onClick={() => window.print()} disabled={!hasData}>
              🖨️ In danh sách
            </Button>
          </div>
        </div>

        <div className="utc-round-control-bar">
          <div className="utc-round-select-group" style={{ gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label htmlFor="gradeRound">🗓️ Đợt đồ án:</label>
              <select
                id="gradeRound"
                className="utc-round-select"
                value={roundId ?? ''}
                onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
              >
                {rounds.length === 0 && <option value="">-- Chưa có đợt đồ án --</option>}
                {rounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    {r.name} ({r.roundCode}) — {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label htmlFor="gradeClass">🏫 Lớp:</label>
              <select
                id="gradeClass"
                className="utc-toolbar-select"
                value={className}
                onChange={(e) => handleClassChange(e.target.value)}
                style={{ minWidth: '190px', fontWeight: 600 }}
              >
                <option value="">-- Tất cả các lớp --</option>
                {classNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRound && (
            <div className="utc-round-meta-pills">
              <span className={`utc-round-status-badge status-${(selectedRound.status || '').toLowerCase()}`}>
                {selectedRound.status === 'CLOSED' ? '✓ Đã đóng / Công bố' : selectedRound.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Strip when data is available */}
      {!loading && hasData && (
        <div className="utc-kpi-strip no-print">
          <div className="utc-kpi-box accent-navy">
            <div className="utc-kpi-top">
              <span className="utc-kpi-icon">🏫</span>
              <span className="utc-kpi-label">Số lớp có điểm</span>
            </div>
            <div className="utc-kpi-num">{summary.classCount}</div>
            <div className="utc-kpi-sub">{className ? `Đang lọc lớp ${className}` : 'Toàn đợt đồ án'}</div>
          </div>

          <div className="utc-kpi-box accent-navy">
            <div className="utc-kpi-top">
              <span className="utc-kpi-icon">👨‍🎓</span>
              <span className="utc-kpi-label">Tổng SV đã công bố</span>
            </div>
            <div className="utc-kpi-num">{summary.totalStudents}</div>
            <div className="utc-kpi-sub">Đã hoàn tất tổng hợp điểm Hội đồng</div>
          </div>

          <div className="utc-kpi-box accent-green">
            <div className="utc-kpi-top">
              <span className="utc-kpi-icon">✅</span>
              <span className="utc-kpi-label">Sinh viên Đạt</span>
            </div>
            <div className="utc-kpi-num ok">{summary.passedCount}</div>
            <div className="utc-kpi-sub">
              {summary.totalStudents > 0
                ? `Tỷ lệ ${Math.round((summary.passedCount / summary.totalStudents) * 100)}%`
                : 'Đạt chuẩn tốt nghiệp'}
            </div>
          </div>

          <div className="utc-kpi-box accent-red">
            <div className="utc-kpi-top">
              <span className="utc-kpi-icon">❌</span>
              <span className="utc-kpi-label">Sinh viên Không đạt</span>
            </div>
            <div className="utc-kpi-num bad">{summary.failedCount}</div>
            <div className="utc-kpi-sub">Cần làm lại đồ án đợt sau</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="utc-card-panel no-print" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
          ⏳ Đang tải dữ liệu bảng điểm...
        </div>
      )}

      {!loading && !hasData && (
        <div className="utc-card-panel no-print" style={{ textAlign: 'center', padding: '44px 24px', color: '#475569' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>
            Chưa có điểm đồ án nào được công bố trong đợt này
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '560px', margin: '0 auto' }}>
            Kết quả điểm theo lớp chỉ hiển thị sau khi Hội đồng hoàn tất chấm bảo vệ, tổng hợp điểm và đợt đồ án được công bố kết quả chính thức.
          </div>
        </div>
      )}

      <div className="print-area">
        {report?.classes.map((group) => (
          <div className="class-grade-block" key={group.className}>
            <div className="print-only">
              <strong>TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</strong>
              <div>DANH SÁCH ĐIỂM ĐỒ ÁN TỐT NGHIỆP</div>
            </div>
            <div className="class-grade-header">
              <div>
                <h3 className="class-grade-title">Lớp {group.className}</h3>
                <p className="class-grade-meta">
                  Đợt: {report.roundName} ({report.roundCode}) &nbsp;|&nbsp; Tổng: {group.totalStudents} SV
                </p>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="utc-badge utc-badge-success">✅ Đạt: {group.passedCount}</span>
                <span className="utc-badge utc-badge-danger">❌ Không đạt: {group.failedCount}</span>
                {group.averageScore != null && (
                  <span className="utc-badge utc-badge-info">📊 Điểm TB: {group.averageScore.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="grade-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã SV</th>
                    <th>Họ và tên</th>
                    <th>Tên đề tài</th>
                    <th>GVHD</th>
                    <th>Điểm GVHD</th>
                    <th>Điểm PB</th>
                    <th>Điểm HĐ</th>
                    <th>Tổng kết</th>
                    <th>Xếp loại</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, idx) => (
                    <tr key={row.thesisId ?? `${group.className}-${idx}`}>
                      <td className="center">{idx + 1}</td>
                      <td className="center" style={{ fontWeight: 700, color: '#0a3273' }}>{row.studentCode}</td>
                      <td style={{ fontWeight: 600 }}>{row.studentName}</td>
                      <td>{row.thesisTitle}</td>
                      <td>{row.advisorName}</td>
                      <td className="center">{fmt(row.supervisorScore)}</td>
                      <td className="center">{fmt(row.reviewerScore)}</td>
                      <td className="center">{fmt(row.councilScore)}</td>
                      <td className="center"><strong>{fmt(row.finalScore)}</strong></td>
                      <td className="center">{row.grade}</td>
                      <td className={`center ${row.finalResult === 'PASSED' ? 'pass' : row.finalResult === 'FAILED' ? 'fail' : ''}`}>
                        {row.finalResult === 'PASSED' ? 'Đạt' : row.finalResult === 'FAILED' ? 'Không đạt' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
