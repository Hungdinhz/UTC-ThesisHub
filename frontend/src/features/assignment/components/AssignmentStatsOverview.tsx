import React from 'react';
import type { AssignmentStats } from '../types';

interface Props {
  stats: AssignmentStats | null;
  loading?: boolean;
}

export const AssignmentStatsOverview: React.FC<Props> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="assignment-stats-loading">
        <div className="spinner"></div>
        <span>Đang tải thống kê phân công...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="assignment-stats-grid">
      <div className="stat-card stat-primary">
        <div className="stat-icon">👥</div>
        <div className="stat-info">
          <span className="stat-label">Tổng sinh viên đăng ký</span>
          <span className="stat-value">{stats.totalStudents}</span>
          <span className="stat-sub">Đã phân công: {stats.totalAssigned} / {stats.totalStudents}</span>
        </div>
      </div>

      <div className="stat-card stat-success">
        <div className="stat-icon">🎯</div>
        <div className="stat-info">
          <span className="stat-label">Đạt Nguyện vọng 1 (NV1)</span>
          <div className="stat-value-group">
            <span className="stat-value">{stats.matchedNv1}</span>
            <span className="stat-badge badge-success">{stats.nv1Rate}%</span>
          </div>
          <span className="stat-sub">Ưu tiên tối đa theo mong muốn</span>
        </div>
      </div>

      <div className="stat-card stat-info">
        <div className="stat-icon">🥈</div>
        <div className="stat-info">
          <span className="stat-label">Đạt Nguyện vọng 2 (NV2)</span>
          <div className="stat-value-group">
            <span className="stat-value">{stats.matchedNv2}</span>
            <span className="stat-badge badge-info">{stats.nv2Rate}%</span>
          </div>
          <span className="stat-sub">Thỏa mãn nguyện vọng dự phòng</span>
        </div>
      </div>

      <div className="stat-card stat-warning">
        <div className="stat-icon">🥉</div>
        <div className="stat-info">
          <span className="stat-label">NV3 / Fallback</span>
          <div className="stat-value-group">
            <span className="stat-value">{stats.matchedNv3 + stats.matchedFallback}</span>
            <span className="stat-badge badge-warning">
              {Math.round(((stats.matchedNv3 + stats.matchedFallback) / (stats.totalStudents || 1)) * 100)}%
            </span>
          </div>
          <span className="stat-sub">NV3: {stats.matchedNv3} | Fallback: {stats.matchedFallback}</span>
        </div>
      </div>

      <div className="stat-card stat-purple">
        <div className="stat-icon">⚖️</div>
        <div className="stat-info">
          <span className="stat-label">Cân bằng tải giảng viên</span>
          <div className="stat-value-group">
            <span className="stat-value">{Math.round(stats.averageLoadRatio * 100)}%</span>
            <span className="stat-badge badge-purple">{stats.totalLecturers} GV</span>
          </div>
          <span className="stat-sub">Tổng năng lực hướng dẫn: {stats.totalCapacity} SV</span>
        </div>
      </div>

      <div className="stat-card stat-danger">
        <div className="stat-icon">⚠️</div>
        <div className="stat-info">
          <span className="stat-label">Chưa phân công / Bị loại</span>
          <div className="stat-value-group">
            <span className="stat-value text-danger">{stats.unassignedCount}</span>
            {stats.droppedCount !== undefined && stats.droppedCount > 0 && (
              <span className="stat-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }} title="Sinh viên chưa đăng ký bị loại khỏi đợt">
                🚫 Loại {stats.droppedCount} SV
              </span>
            )}
            {stats.overriddenCount > 0 && (
              <span className="stat-badge badge-amber">{stats.overriddenCount} Override</span>
            )}
          </div>
          <span className="stat-sub">
            {stats.finalizedCount > 0 ? (
              stats.droppedCount && stats.droppedCount > 0
                ? `Đã chốt (loại ${stats.droppedCount} SV chưa ĐK)`
                : 'Đã chốt danh sách'
            ) : 'Phương án đề xuất'}
          </span>
        </div>
      </div>
    </div>
  );
};
