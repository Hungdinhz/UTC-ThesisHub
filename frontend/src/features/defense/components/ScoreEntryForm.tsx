import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';
import type { ScoreType, LecturerOption } from '../types';
import './DefenseComponents.css';

interface ScoreEntryFormProps {
  thesisId: number;
  graders?: LecturerOption[];
  fixedGraderId?: number;
  fixedGraderName?: string;
  fixedGraderDegree?: string;
  allowedScoreTypes?: ScoreType[];
  onSubmit: (data: {
    thesisId: number;
    graderId: number;
    scoreType: ScoreType;
    score: number;
    feedback: string;
  }) => Promise<void>;
}

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  COUNCIL: 'Thành viên Hội đồng chấm bảo vệ (COUNCIL)',
  REVIEWER: 'Giảng viên Phản biện (REVIEWER)',
  SUPERVISOR: 'Giảng viên Hướng dẫn quá trình (SUPERVISOR)',
};

export const ScoreEntryForm: React.FC<ScoreEntryFormProps> = ({
  thesisId,
  graders = [],
  fixedGraderId,
  fixedGraderName,
  fixedGraderDegree,
  allowedScoreTypes,
  onSubmit,
}) => {
  const effectiveAllowedTypes: ScoreType[] =
    allowedScoreTypes && allowedScoreTypes.length > 0 ? allowedScoreTypes : ['COUNCIL'];

  const effectiveGraderId = fixedGraderId ?? graders[0]?.lecturerId ?? 0;
  const effectiveGraderLabel = fixedGraderName
    ? `${fixedGraderName}${fixedGraderDegree ? ` (${fixedGraderDegree})` : ''}`
    : graders[0]
    ? `${graders[0].fullName}${graders[0].degree ? ` (${graders[0].degree})` : ''}`
    : 'Giảng viên đang đăng nhập';

  const [scoreType, setScoreType] = useState<ScoreType>(effectiveAllowedTypes[0]);

  useEffect(() => {
    if (!effectiveAllowedTypes.includes(scoreType)) {
      setScoreType(effectiveAllowedTypes[0]);
    }
  }, [thesisId, effectiveAllowedTypes.join(',')]);

  // 4 Criteria breakdown
  const [contentScore, setContentScore] = useState<number>(3.5); // Max 4.0
  const [slideScore, setSlideScore] = useState<number>(1.8);     // Max 2.0
  const [qaScore, setQaScore] = useState<number>(2.5);          // Max 3.0
  const [demoScore, setDemoScore] = useState<number>(0.9);        // Max 1.0

  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalScore = Number((contentScore + slideScore + qaScore + demoScore).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Vui lòng nhập nhận xét / đánh giá của người chấm');
      return;
    }
    if (totalScore < 0 || totalScore > 10.0) {
      setError('Tổng điểm số phải nằm trong thang điểm từ 0.0 đến 10.0');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      await onSubmit({
        thesisId,
        graderId: effectiveGraderId,
        scoreType,
        score: totalScore,
        feedback: feedback.trim(),
      });
      setSuccess(true);
      setFeedback('');
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi lưu điểm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="score-entry-card">
      <div className="score-entry-header">
        <h3>📝 Nhập phiếu chấm điểm luận văn tốt nghiệp (Đề tài #{thesisId})</h3>
      </div>

      <form onSubmit={handleSubmit} className="score-form">
        <div className="form-row-2">
          <div className="form-group">
            <label>Người chấm (Tài khoản đang đăng nhập):</label>
            <div
              className="form-control"
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'not-allowed',
              }}
            >
              <span>🔒</span>
              <span>{effectiveGraderLabel}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="scoreTypeSelect">Tư cách chấm điểm được phân công:</label>
            {effectiveAllowedTypes.length === 1 ? (
              <div
                className="form-control"
                style={{
                  background: '#eff6ff',
                  color: '#1e40af',
                  fontWeight: 700,
                  border: '1px solid #93c5fd',
                }}
              >
                {SCORE_TYPE_LABELS[effectiveAllowedTypes[0]]}
              </div>
            ) : (
              <select
                id="scoreTypeSelect"
                className="form-control"
                value={scoreType}
                onChange={(e) => setScoreType(e.target.value as ScoreType)}
              >
                {effectiveAllowedTypes.map((st) => (
                  <option key={st} value={st}>
                    {SCORE_TYPE_LABELS[st]}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Criteria Breakdown Table */}
        <div className="criteria-scoring-table">
          <h4>Chi tiết các tiêu chí đánh giá:</h4>
          <div className="criterion-row">
            <div className="criterion-info">
              <span className="criterion-name">1. Nội dung khoa học & kỹ thuật</span>
              <span className="criterion-sub">Độ phức tạp, tính đúng đắn và hàm lượng học thuật (Tối đa: 4.0 điểm)</span>
            </div>
            <div className="criterion-input">
              <input
                type="number"
                step="0.1"
                min="0"
                max="4.0"
                className="form-control input-score"
                value={contentScore}
                onChange={(e) => setContentScore(Math.min(4.0, Math.max(0, Number(e.target.value))))}
              />
              <span className="score-max">/ 4.0</span>
            </div>
          </div>

          <div className="criterion-row">
            <div className="criterion-info">
              <span className="criterion-name">2. Báo cáo & Trình bày (Slide/Thuyết minh)</span>
              <span className="criterion-sub">Kỹ năng trình bày rõ ràng, mạch lạc, đúng format (Tối đa: 2.0 điểm)</span>
            </div>
            <div className="criterion-input">
              <input
                type="number"
                step="0.1"
                min="0"
                max="2.0"
                className="form-control input-score"
                value={slideScore}
                onChange={(e) => setSlideScore(Math.min(2.0, Math.max(0, Number(e.target.value))))}
              />
              <span className="score-max">/ 2.0</span>
            </div>
          </div>

          <div className="criterion-row">
            <div className="criterion-info">
              <span className="criterion-name">3. Phản biện & Trả lời câu hỏi</span>
              <span className="criterion-sub">Nắm vững kiến thức chuyên môn, đối đáp tự tin (Tối đa: 3.0 điểm)</span>
            </div>
            <div className="criterion-input">
              <input
                type="number"
                step="0.1"
                min="0"
                max="3.0"
                className="form-control input-score"
                value={qaScore}
                onChange={(e) => setQaScore(Math.min(3.0, Math.max(0, Number(e.target.value))))}
              />
              <span className="score-max">/ 3.0</span>
            </div>
          </div>

          <div className="criterion-row">
            <div className="criterion-info">
              <span className="criterion-name">4. Sản phẩm hoàn thiện / Demo thực nghiệm</span>
              <span className="criterion-sub">Chương trình chạy ổn định, giao diện hoàn thiện (Tối đa: 1.0 điểm)</span>
            </div>
            <div className="criterion-input">
              <input
                type="number"
                step="0.1"
                min="0"
                max="1.0"
                className="form-control input-score"
                value={demoScore}
                onChange={(e) => setDemoScore(Math.min(1.0, Math.max(0, Number(e.target.value))))}
              />
              <span className="score-max">/ 1.0</span>
            </div>
          </div>

          <div className="total-score-banner">
            <span className="total-label">TỔNG ĐIỂM ĐÁNH GIÁ (Thang điểm 10):</span>
            <span className="total-val">{totalScore.toFixed(2)} / 10.0</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="scoreFeedback">Nhận xét chi tiết của Giảng viên chấm:</label>
          <textarea
            id="scoreFeedback"
            rows={3}
            className="form-control"
            placeholder="Nêu rõ ưu điểm, hạn chế và các yêu cầu chỉnh sửa nếu có trước khi nộp lưu chiểu..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}
        {success && <div className="form-success-msg">✅ Lưu điểm đánh giá thành công!</div>}

        <div className="form-actions-right">
          <Button type="submit" variant="primary" loading={loading}>
            💾 Xác nhận Lưu kết quả chấm điểm
          </Button>
        </div>
      </form>
    </div>
  );
};
