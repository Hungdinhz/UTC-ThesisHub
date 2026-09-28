import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import type { ScoreType, LecturerOption } from '../types';
import './DefenseComponents.css';

interface ScoreEntryFormProps {
  thesisId: number;
  graders: LecturerOption[];
  onSubmit: (data: {
    thesisId: number;
    graderId: number;
    scoreType: ScoreType;
    score: number;
    feedback: string;
  }) => Promise<void>;
}

export const ScoreEntryForm: React.FC<ScoreEntryFormProps> = ({
  thesisId,
  graders,
  onSubmit,
}) => {
  const [graderId, setGraderId] = useState<number>(graders[0]?.lecturerId || 501);
  const [scoreType, setScoreType] = useState<ScoreType>('COUNCIL');

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
        graderId,
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
            <label htmlFor="graderSelect">Người chấm (Cán bộ / Giảng viên):</label>
            <select
              id="graderSelect"
              className="form-control"
              value={graderId}
              onChange={(e) => setGraderId(Number(e.target.value))}
              required
            >
              {graders.map((g) => (
                <option key={g.lecturerId} value={g.lecturerId}>
                  {g.fullName} ({g.degree})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scoreTypeSelect">Tư cách chấm điểm:</label>
            <select
              id="scoreTypeSelect"
              className="form-control"
              value={scoreType}
              onChange={(e) => setScoreType(e.target.value as ScoreType)}
            >
              <option value="COUNCIL">Thành viên Hội đồng chấm (COUNCIL)</option>
              <option value="SUPERVISOR">Giảng viên Hướng dẫn (SUPERVISOR)</option>
              <option value="REVIEWER">Giảng viên Phản biện (REVIEWER)</option>
            </select>
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

          {/* Total score box */}
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
