import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui';
import { apiService } from '../../../services/api';
import type { ClassGradeReportResponse, ProjectRoundItem } from '../../../types';
import { downloadBlob, extractErrorMessage } from '../utils/download';
import '../../eligibility/pages/EligibilityPages.css';
import './AcademicStaffPages.css';

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
        const pick =
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

  const hasData = (report?.classes.length ?? 0) > 0;

  return (
    <div className="feature-page-container">
      <div className="feature-page-header no-print">
        <div>
          <h1 className="feature-page-title">In danh sách điểm đồ án theo lớp</h1>
          <p className="feature-page-subtitle">
            Chỉ hiển thị kết quả đã được hội đồng tổng hợp và công bố. Có thể xuất Excel (mỗi lớp một sheet) hoặc in trực tiếp.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type} no-print`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      <div className="feature-filter-card no-print">
        <div className="filter-item" style={{ minWidth: '280px' }}>
          <label htmlFor="gradeRound">Đợt đồ án:</label>
          <select
            id="gradeRound"
            className="form-control"
            value={roundId ?? ''}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
          >
            {rounds.length === 0 && <option value="">-- Chưa có đợt đồ án --</option>}
            {rounds.map((r) => (
              <option key={r.roundId} value={r.roundId}>
                {r.name} ({r.roundCode})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item" style={{ minWidth: '200px' }}>
          <label htmlFor="gradeClass">Lớp:</label>
          <select
            id="gradeClass"
            className="form-control"
            value={className}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">-- Tất cả các lớp --</option>
            {classNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="staff-actions">
          <Button variant="success" onClick={handleExport} loading={exporting} disabled={!hasData}>
            Xuất Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={!hasData}>
            In danh sách
          </Button>
        </div>
      </div>

      {loading && <p className="staff-hint no-print">Đang tải dữ liệu...</p>}

      {!loading && !hasData && (
        <p className="staff-hint no-print">
          Chưa có điểm đồ án nào được công bố trong đợt này. Kết quả chỉ hiển thị sau khi hội đồng tổng hợp điểm và
          đợt đồ án được công bố kết quả.
        </p>
      )}

      <div className="print-area">
        {report?.classes.map((group) => (
          <div className="class-grade-block" key={group.className}>
            <div className="print-only">
              <strong>TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</strong>
              <div>DANH SÁCH ĐIỂM ĐỒ ÁN TỐT NGHIỆP</div>
            </div>
            <h3 className="class-grade-title">Lớp {group.className}</h3>
            <p className="class-grade-meta">
              Đợt: {report.roundName} ({report.roundCode}) &nbsp;|&nbsp; Tổng: {group.totalStudents} &nbsp;|&nbsp; Đạt:{' '}
              {group.passedCount} &nbsp;|&nbsp; Không đạt: {group.failedCount}
              {group.averageScore != null && <> &nbsp;|&nbsp; Điểm TB: {group.averageScore.toFixed(2)}</>}
            </p>
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
                    <td className="center">{row.studentCode}</td>
                    <td>{row.studentName}</td>
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
        ))}
      </div>
    </div>
  );
};
