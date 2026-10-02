import React from 'react';
import './EligibilityComponents.css';

interface SummaryCardProps {
  total: number;
  eligible: number;
  ineligible: number;
  forceApproved: number;
  disqualified: number;
}

export const EligibilitySummaryCard: React.FC<SummaryCardProps> = ({
  total,
  eligible,
  ineligible,
  forceApproved,
  disqualified,
}) => {
  return (
    <div className="eligibility-kpi-grid">
      <div className="kpi-card total">
        <div className="kpi-icon">📋</div>
        <div className="kpi-info">
          <span className="kpi-label">Tổng sinh viên xét duyệt</span>
          <span className="kpi-value">{total}</span>
        </div>
      </div>

      <div className="kpi-card success">
        <div className="kpi-icon">✅</div>
        <div className="kpi-info">
          <span className="kpi-label">Đủ điều kiện tiêu chuẩn</span>
          <span className="kpi-value">{eligible}</span>
        </div>
      </div>

      <div className="kpi-card warning">
        <div className="kpi-icon">⚠️</div>
        <div className="kpi-info">
          <span className="kpi-label">Chưa đạt điều kiện</span>
          <span className="kpi-value">{ineligible}</span>
        </div>
      </div>

      <div className="kpi-card info">
        <div className="kpi-icon">⭐</div>
        <div className="kpi-info">
          <span className="kpi-label">Duyệt đặc cách (Force)</span>
          <span className="kpi-value">{forceApproved}</span>
        </div>
      </div>

      <div className="kpi-card danger">
        <div className="kpi-icon">🚫</div>
        <div className="kpi-info">
          <span className="kpi-label">Bị loại khỏi đợt</span>
          <span className="kpi-value">{disqualified}</span>
        </div>
      </div>
    </div>
  );
};
