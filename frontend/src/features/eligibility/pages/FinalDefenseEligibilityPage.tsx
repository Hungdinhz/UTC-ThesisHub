import React, { useState } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { eligibilityService } from '../services/eligibilityService';
import type { FinalDefenseEligibilityResponse } from '../types';
import './EligibilityPages.css';

export const FinalDefenseEligibilityPage: React.FC = () => {
  const [thesisIdInput, setThesisIdInput] = useState('101');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinalDefenseEligibilityResponse | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!thesisIdInput && !studentIdInput) {
      setError('Vui lòng nhập Mã đề tài hoặc Mã định danh sinh viên');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await eligibilityService.checkFinalDefenseEligibility({
        thesisId: thesisIdInput ? Number(thesisIdInput) : undefined,
        studentId: studentIdInput ? Number(studentIdInput) : undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi kiểm tra điều kiện bảo vệ cuối kỳ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xét điều kiện bảo vệ đồ án tốt nghiệp cuối kỳ</h1>
          <p className="feature-page-subtitle">
            Kiểm tra 4 tiêu chí cứng: GVHD đồng ý (≥ 5.0), GVPB đồng ý (≥ 5.0), Tỷ lệ đạo văn (≤ 20%), Hoàn thành tiến độ.
          </p>
        </div>
      </div>

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
  );
};
