import React from 'react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  size = 'md',
}) => {
  const getAutoVariant = (statusText: string): string => {
    const s = statusText.toUpperCase();
    if (['APPROVED', 'ELIGIBLE', 'PASSED', 'ACTIVE', 'CONFIRMED', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'COMPLETED'].includes(s)) {
      return 'success';
    }
    if (['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'REVIEWING', 'AVERAGE'].includes(s)) {
      return 'warning';
    }
    if (['REJECTED', 'DISQUALIFIED', 'FAILED', 'INELIGIBLE', 'CANCELLED', 'POOR'].includes(s)) {
      return 'danger';
    }
    if (['ASSIGNED', 'INFO', 'FORCE_APPROVED'].includes(s)) {
      return 'info';
    }
    return 'neutral';
  };

  const finalVariant = variant || getAutoVariant(status);
  const displayText = label || status;

  return (
    <span className={`ui-status-badge ui-status-${finalVariant} ui-status-size-${size}`}>
      <span className="ui-status-dot" />
      <span className="ui-status-label">{displayText}</span>
    </span>
  );
};
