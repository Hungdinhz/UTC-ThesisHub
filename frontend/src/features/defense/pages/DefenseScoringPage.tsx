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
            Nhập điểm tiêu chí Hội đồng/GVHD/GVPB, nhập nhận xét và tự động tổng hợp kết quả tốt nghiệp cuối kỳ.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="success" onClick={() => setIsSynthModalOpen(true)}>
            🎯 Tổng hợp kết quả tốt nghiệp (Synthesize)
          </Button>
          <Button variant="outline" onClick={loadThesisData} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
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
            <h2>{graduationResult.studentName} ({graduationResult.studentCode})</h2>
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
          <ScoreEntryForm
            thesisId={selectedThesisId}
            graders={graders}
            onSubmit={handleScoreSubmit}
          />
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
    </div>
  );
};
