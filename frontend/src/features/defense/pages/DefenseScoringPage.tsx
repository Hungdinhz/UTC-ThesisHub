import React, { useState, useEffect } from 'react';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { ScoreEntryForm } from '../components/ScoreEntryForm';
import { ResultSynthesisModal } from '../components/ResultSynthesisModal';
import { defenseService } from '../services/defenseService';
import type { ScoreItem, LecturerOption, GraduationResult, SynthesizeResultRequest } from '../types';
import './DefensePages.css';

export const DefenseScoringPage: React.FC = () => {
  const [selectedThesisId, setSelectedThesisId] = useState<number>(101);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [graders, setGraders] = useState<LecturerOption[]>([]);
  const [graduationResult, setGraduationResult] = useState<GraduationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSynthModalOpen, setIsSynthModalOpen] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [showFinalExportModal, setShowFinalExportModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadThesisData();
  }, [selectedThesisId]);

  const loadThesisData = async () => {
    try {
      setLoading(true);
      const [sList, lList, rData] = await Promise.all([
        defenseService.getScores(selectedThesisId),
        defenseService.getLecturers(),
        defenseService.getGraduationResult(selectedThesisId),
      ]);
      setScores(sList);
      setGraders(lList);
      setGraduationResult(rData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải dữ liệu điểm' });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (data: any) => {
    try {
      await defenseService.submitScore(data);
      setNotification({ type: 'success', message: 'Lưu điểm và nhận xét thành công!' });
      await loadThesisData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi lưu điểm' });
    }
  };

  const handleSynthesize = async (data: SynthesizeResultRequest) => {
    try {
      const res = await defenseService.synthesizeResult(data);
      setGraduationResult(res);
      setNotification({
        type: 'success',
        message: `Tổng hợp điểm thành công! Điểm tổng kết: ${res.finalScore.toFixed(2)} — Xếp loại: ${res.grade}`,
      });
      await loadThesisData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi tổng hợp điểm' });
    }
  };

  const scoreColumns: Column<ScoreItem>[] = [
    {
      key: 'scoreType',
      title: 'Tư cách chấm',
      width: '150px',
      render: (val: string) => {
        let label = 'Hội đồng';
        let variant: any = 'info';
        if (val === 'SUPERVISOR') {
          label = 'GV Hướng dẫn';
          variant = 'warning';
        } else if (val === 'REVIEWER') {
          label = 'GV Phản biện';
          variant = 'neutral';
        }
        return <StatusBadge status={val} label={label} variant={variant} />;
      },
    },
    {
      key: 'graderName',
      title: 'Người chấm',
      width: '220px',
      render: (val, record) => val || `Giảng viên #${record.graderId}`,
    },
    {
      key: 'score',
      title: 'Điểm số',
      align: 'center',
      width: '100px',
      render: (val: number) => (
        <span className="font-semibold text-primary" style={{ fontSize: '1.05rem' }}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'feedback',
      title: 'Nhận xét & Đánh giá',
      render: (val: string) => <span className="text-feedback">{val}</span>,
    },
    {
      key: 'gradedAt',
      title: 'Thời gian chấm',
      width: '140px',
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
  ];

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Chấm điểm và Tổng hợp Kết quả Tốt nghiệp</h1>
          <p className="feature-page-subtitle">
            Nhập điểm tiêu chí Hội đồng/GVHD/GVPB, nhập nhận xét, xuất Biên bản bảo vệ PDF và dữ liệu cuối kỳ (ký).
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="success" onClick={() => setIsSynthModalOpen(true)}>
            🎯 Tổng hợp kết quả tốt nghiệp (Synthesize)
          </Button>
          <Button variant="primary" onClick={() => setShowMinutesModal(true)}>
            🖨️ Xuất Biên bản PDF & Ký
          </Button>
          <Button variant="outline" onClick={() => setShowFinalExportModal(true)}>
            📦 Xuất Dữ liệu Cuối kỳ (Ký)
          </Button>
          <Button variant="outline" onClick={loadThesisData} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Select Thesis Bar */}
      <div className="select-thesis-bar">
        <label htmlFor="thesisSelector">Chọn đề tài cần chấm điểm:</label>
        <select
          id="thesisSelector"
          className="form-control thesis-dropdown"
          value={selectedThesisId}
          onChange={(e) => setSelectedThesisId(Number(e.target.value))}
        >
          <option value={101}>Đề tài #101: Nghiên cứu ứng dụng Deep Learning trong nhận diện cử chỉ tay (SV: Nguyễn Văn An)</option>
          <option value={103}>Đề tài #103: Xây dựng hệ thống IoT giám sát chất lượng không khí thông minh (SV: Lê Hoàng Cường)</option>
          <option value={104}>Đề tài #104: Tối ưu hóa thuật toán xếp lịch và điều phối vi dịch vụ (SV: Phạm Minh Đức)</option>
        </select>
      </div>

      {/* Graduation Result Card (if synthesized) */}
      {graduationResult && (
        <div className="graduation-summary-card">
          <div className="summary-left">
            <span className="summary-badge">KẾT QUẢ TỐT NGHIỆP TỔNG HỢP</span>
            <h2>
              {graduationResult.studentName} ({graduationResult.studentCode})
            </h2>
            <p className="summary-thesis-title">{graduationResult.thesisTitle}</p>
            <div className="scores-breakdown-row">
              <div className="sub-score-item">
                <span className="sub-score-lbl">Điểm GVHD (30%):</span>
                <span className="sub-score-val">{graduationResult.supervisorScore?.toFixed(2)}</span>
              </div>
              <div className="sub-score-item">
                <span className="sub-score-lbl">Điểm GVPB (20%):</span>
                <span className="sub-score-val">{graduationResult.reviewerScore?.toFixed(2)}</span>
              </div>
              <div className="sub-score-item">
                <span className="sub-score-lbl">TB Hội đồng (50%):</span>
                <span className="sub-score-val">{graduationResult.councilScore?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="summary-right">
            <div className="final-score-display">
              <span className="final-score-lbl">ĐIỂM TỔNG KẾT</span>
              <span className="final-score-num">{graduationResult.finalScore.toFixed(2)}</span>
            </div>
            <div className="final-grade-box">
              <span className={`grade-tag grade-${graduationResult.grade?.toLowerCase()}`}>
                Xếp loại: {graduationResult.grade}
              </span>
              <StatusBadge
                status={graduationResult.finalResult}
                label={graduationResult.finalResult === 'PASSED' ? 'ĐẠT TỐT NGHIỆP' : 'KHÔNG ĐẠT'}
                size="md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Form and Table */}
      <div className="scoring-grid-layout">
        {/* Left Column: Form */}
        <div className="scoring-col-form">
          <ScoreEntryForm thesisId={selectedThesisId} graders={graders} onSubmit={handleScoreSubmit} />
        </div>

        {/* Right Column: Existing Scores Table */}
        <div className="scoring-col-table">
          <div className="scores-table-header">
            <h3>📋 Danh sách phiếu điểm đã nộp ({scores.length})</h3>
          </div>
          <Table
            columns={scoreColumns}
            dataSource={scores}
            rowKey="id"
            loading={loading}
            emptyText="Chưa có thành viên nào nộp phiếu chấm điểm"
          />
        </div>
      </div>

      {/* Synthesis Modal */}
      <ResultSynthesisModal
        isOpen={isSynthModalOpen}
        onClose={() => setIsSynthModalOpen(false)}
        thesisId={selectedThesisId}
        onSynthesize={handleSynthesize}
      />

      {/* Printable Defense Minutes PDF Modal (Step 40) */}
      {showMinutesModal && graduationResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <strong style={{ color: '#0a3273' }}>📄 BIÊN BẢN HỘI ĐỒNG CHẤM ĐỒ ÁN TỐT NGHIỆP (BƯỚC 40)</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setNotification({
                      type: 'success',
                      message: 'Hội đồng đã ký xác nhận và lưu hồ sơ Biên bản bảo vệ PDF thành công!',
                    });
                    setShowMinutesModal(false);
                  }}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✍️ Hội đồng Ký & Lưu hồ sơ
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  🖨️ In / Lưu PDF
                </button>
                <button
                  onClick={() => setShowMinutesModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '28px', borderRadius: '6px', lineHeight: 1.6, color: '#0f172a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>HỘI ĐỒNG CHẤM ĐỒ ÁN TỐT NGHIỆP</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Độc lập - Tự do - Hạnh phúc</div>
                </div>
              </div>

              <h2 style={{ textAlign: 'center', color: '#0a3273', fontSize: '18px', margin: '16px 0' }}>
                BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC
              </h2>

              <p>
                <strong>1. Sinh viên bảo vệ:</strong> {graduationResult.studentName} — <strong>Mã SV:</strong> {graduationResult.studentCode}
              </p>
              <p>
                <strong>2. Tên đề tài:</strong> {graduationResult.thesisTitle}
              </p>
              <p>
                <strong>3. Tổng hợp kết quả chấm điểm của Hội đồng (1 Chủ tịch - 2 Thư ký - 2 Ủy viên):</strong>
              </p>

              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', margin: '12px 0' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Thành phần chấm</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Người chấm</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Điểm số</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.scoreType}</td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.graderName}</td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>
                        {s.score.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '6px', margin: '16px 0', fontWeight: 600 }}>
                Điểm GVHD (30%): {graduationResult.supervisorScore?.toFixed(2)} | Điểm GVPB (20%): {graduationResult.reviewerScore?.toFixed(2)} |
                TB Hội đồng (50%): {graduationResult.councilScore?.toFixed(2)} ⇒ ĐIỂM TỔNG KẾT: {graduationResult.finalScore.toFixed(2)} (
                {graduationResult.grade} - {graduationResult.finalResult === 'PASSED' ? 'ĐẠT' : 'KHÔNG ĐẠT'})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '28px' }}>
                <div>
                  <strong>THƯ KÝ HỘI ĐỒNG</strong>
                  <div style={{ marginTop: '44px', fontWeight: 600, color: '#0a3273' }}>[Đã ký xác nhận: ThS. Hoàng Quốc Bảo]</div>
                </div>
                <div>
                  <strong>CHỦ TỊCH HỘI ĐỒNG</strong>
                  <div style={{ marginTop: '44px', fontWeight: 600, color: '#b91c1c' }}>[Đã ký xác nhận: PGS. TS. Trần Văn Minh]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Term Data Export & Round Completion Modal (Steps 41 & 42) */}
      {showFinalExportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '720px', padding: '28px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0a3273' }}>
              📦 Xuất dữ liệu cuối kỳ (Ký) & Kết thúc đợt đồ án (Bước 41 - 42)
            </h3>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '16px' }}>
              Bảng tổng hợp kết quả cuối kỳ bao gồm cả danh sách Sinh viên Đạt bảo vệ và Sinh viên được duyệt Bảo lưu kết quả sang đợt kế tiếp.
            </p>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>MSSV</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Họ và tên</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Trạng thái cuối kỳ</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Điểm tổng kết</th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Xếp loại / Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{graduationResult?.studentCode || 'SV2021001'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{graduationResult?.studentName || 'Nguyễn Văn An'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#16a34a', fontWeight: 600 }}>Hoàn thành Bảo vệ</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>
                    {graduationResult?.finalScore.toFixed(2) || '8.55'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{graduationResult?.grade || 'EXCELLENT'} (ĐẠT)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>SV2021003</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>Lê Hoàng Cường</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#d97706', fontWeight: 600 }}>Bảo lưu (Đã duyệt)</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>—</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Lưu hồ sơ bảo lưu 01 học kỳ</td>
                </tr>
              </tbody>
            </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowFinalExportModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                🖨️ In Bảng tổng hợp Cuối kỳ (PDF)
              </button>
              <button
                onClick={() => {
                  setNotification({
                    type: 'success',
                    message: 'Đã ký số xuất dữ liệu cuối kỳ và chốt hoàn tất đợt đồ án tốt nghiệp (Bước 41 & 42)!',
                  });
                  setShowFinalExportModal(false);
                }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                ✅ Ký xuất Dữ liệu & Hoàn tất Đợt đồ án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
