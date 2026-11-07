import React from 'react';
import {
  buildStageSteps,
  calculateOverallStepPercent,
  formatCountdown,
  type StageStepInfo,
} from '../utils/homeMetrics';
import type { MilestoneItem, ProjectRoundItem } from '../../../types';

export interface RoundProgressStepperProps {
  role: string;
  round?: ProjectRoundItem | null;
  roundStage: number;
  userCompletedStage: number;
  isDropped?: boolean;
  milestones?: MilestoneItem[];
  currentMilestone?: MilestoneItem;
  daysLeftInMilestone?: number;
  title?: string;
  onStepClick?: (step: StageStepInfo) => void;
}

const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export const RoundProgressStepper: React.FC<RoundProgressStepperProps> = ({
  role,
  round,
  roundStage,
  userCompletedStage,
  isDropped = false,
  milestones = [],
  currentMilestone,
  daysLeftInMilestone,
  title = 'Tiến trình 5 Giai đoạn Đồ án Tốt nghiệp UTC',
  onStepClick,
}) => {
  const hasRound = Boolean(round) && roundStage > 0;

  const steps = buildStageSteps({
    role,
    roundStage: hasRound ? roundStage : 0,
    userCompletedStage: hasRound ? userCompletedStage : 0,
    isDropped,
    milestones: hasRound ? milestones : [],
    hasRound,
  });

  const overallPercent = hasRound ? calculateOverallStepPercent(steps) : 0;
  const countdown = formatCountdown(daysLeftInMilestone);
  const activeStep = hasRound
    ? steps.find((s) => s.status === 'IN_PROGRESS') ||
      steps[Math.min(roundStage - 1, steps.length - 1)]
    : undefined;

  const getStateLabel = (status: StageStepInfo['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '✓ Đã xong';
      case 'IN_PROGRESS':
        return '● Đang thực hiện';
      case 'FAILED':
        return '❌ Không đạt';
      default:
        return '🔒 Chưa mở';
    }
  };

  return (
    <div className="utc-stepper-card" data-testid="round-progress-stepper">
      <div className="utc-stepper-header">
        <div className="utc-stepper-title-group">
          <h3 className="utc-stepper-title">📊 {title}</h3>
          {!hasRound ? (
            <span className="utc-stepper-countdown muted">
              ⚠️ Hiện tại chưa có đợt đồ án nào được kích hoạt
            </span>
          ) : currentMilestone ? (
            <span className={`utc-stepper-countdown ${countdown.tone}`}>
              ⏰ Mốc hiện tại: {currentMilestone.name} • {countdown.text}
            </span>
          ) : null}
        </div>

        {hasRound && activeStep && activeStep.status !== 'LOCKED' && onStepClick && (
          <button
            type="button"
            className="utc-home-btn utc-home-btn-secondary"
            onClick={() => onStepClick(activeStep)}
          >
            Đi tới {activeStep.code} hiện tại →
          </button>
        )}
      </div>

      <div className="utc-stepper-overall-bar-wrap">
        <div className="utc-stepper-overall-track" aria-label="Tiến độ tổng thể">
          <div
            className="utc-stepper-overall-fill"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <span className="utc-stepper-overall-pct">{overallPercent}%</span>
      </div>

      <div className="utc-stepper-grid">
        {steps.map((step) => {
          const isClickable = hasRound && step.status !== 'LOCKED' && Boolean(onStepClick);
          const dateRange =
            step.startDate || step.endDate
              ? `${formatShortDate(step.startDate)}${step.endDate ? ` – ${formatShortDate(step.endDate)}` : ''}`
              : undefined;

          return (
            <button
              key={step.stageNumber}
              type="button"
              data-testid={`stepper-step-${step.stageNumber}`}
              className={`utc-step-box status-${step.status.toLowerCase()} ${
                isClickable ? 'clickable' : ''
              }`}
              title={
                !hasRound
                  ? 'Chưa có đợt đồ án nào đang mở'
                  : step.status === 'LOCKED'
                  ? step.lockedReason
                  : `Mở ${step.name}`
              }
              disabled={!isClickable}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(step);
                }
              }}
            >
              <div className="utc-step-top">
                <span className="utc-step-code">{step.code}</span>
                <span className="utc-step-state-badge">{getStateLabel(step.status)}</span>
              </div>
              <div className="utc-step-name">{step.name.replace(/^GĐ\d:\s*/, '')}</div>
              <div className="utc-step-desc">{step.description}</div>
              {hasRound && dateRange && <div className="utc-step-dates">📅 {dateRange}</div>}
              {hasRound && step.status === 'IN_PROGRESS' && step.daysLeft !== undefined && (
                <div
                  className="utc-step-dates"
                  style={{
                    color: step.daysLeft <= 3 ? '#dc2626' : '#1d4ed8',
                  }}
                >
                  ⏳ {formatCountdown(step.daysLeft).text}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoundProgressStepper;
