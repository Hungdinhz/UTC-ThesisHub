import React, { useState, useMemo } from 'react';
import type { SupervisorAssignment, LecturerCapacity } from '../types';
import { AssignmentOverrideModal } from './AssignmentOverrideModal';

interface Props {
  assignments: SupervisorAssignment[];
  capacities: LecturerCapacity[];
  onOverride: (assignmentId: number, newLecturerId: number, reason: string) => Promise<void>;
  isFinalized?: boolean;
  loading?: boolean;
}

export const AssignmentProposalTable: React.FC<Props> = ({
  assignments,
  capacities,
  onOverride,
  isFinalized,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 1 | 2 | 3 | 'FALLBACK' | 'OVERRIDE'>('ALL');
  const [selectedForOverride, setSelectedForOverride] = useState<SupervisorAssignment | null>(null);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch =
        a.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.lecturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.lecturerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.directionName && a.directionName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchPriority = true;
      if (priorityFilter === 1 || priorityFilter === 2 || priorityFilter === 3) {
        matchPriority = a.matchedPriority === priorityFilter;
      } else if (priorityFilter === 'FALLBACK') {
        matchPriority = a.matchedPriority === 0;
      } else if (priorityFilter === 'OVERRIDE') {
        matchPriority = a.isOverridden === true;
      }

      return matchSearch && matchPriority;
    });
  }, [assignments, searchTerm, priorityFilter]);

  if (loading) {
    return <div className="loading-state">Đang tải danh sách kết quả phân công...</div>;
  }

  return (
    <div className="proposal-table-card">
      <div className="card-header-bar">
        <div className="header-titles">
          <h3>Kết quả phân công Giảng viên hướng dẫn</h3>
          <span className="count-badge">{filtered.length} sinh viên</span>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Sinh viên, GVHD, Hướng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="priority-pill-group">
            <button
              className={`pill-btn ${priorityFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('ALL')}
            >
              Tất cả ({assignments.length})
            </button>
            <button
              className={`pill-btn nv1-pill ${priorityFilter === 1 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(1)}
            >
              NV1
            </button>
            <button
              className={`pill-btn nv2-pill ${priorityFilter === 2 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(2)}
            >
              NV2
            </button>
            <button
              className={`pill-btn nv3-pill ${priorityFilter === 3 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(3)}
            >
              NV3
            </button>
            <button
              className={`pill-btn fallback-pill ${priorityFilter === 'FALLBACK' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('FALLBACK')}
            >
              Fallback
            </button>
            <button
              className={`pill-btn override-pill ${priorityFilter === 'OVERRIDE' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('OVERRIDE')}
            >
              Đã Override
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="assignment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã SV</th>
              <th>Sinh viên</th>
              <th>Hệ ĐT</th>
              <th>Hướng đồ án</th>
              <th>Giảng viên hướng dẫn</th>
              <th>Học vị & Bộ môn</th>
              <th>Kết quả ghép</th>
              <th>Điểm Match</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-row">
                  Chưa có kết quả phân công nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id} className={item.isOverridden ? 'row-overridden' : ''}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-primary">{item.studentCode}</td>
                  <td>
                    <div className="student-name-block">
                      <strong>{item.studentName}</strong>
                      <span className="text-xs text-muted">{item.studentClass || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`program-badge ${
                        item.trainingProgramCode === 'KY_SU' ? 'badge-kysu' : 'badge-cunhan'
                      }`}
                    >
                      {item.trainingProgramCode === 'KY_SU' ? 'Kỹ sư' : 'Cử nhân'}
                    </span>
                  </td>
                  <td>
                    <div className="direction-info">
                      <span className="direction-code-tag">{item.directionCode}</span>
                      <span className="direction-name-text">{item.directionName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="lecturer-name-block">
                      <strong>{item.lecturerName}</strong>
                      <span className="text-xs text-muted">{item.lecturerCode}</span>
                      {item.isOverridden && item.previousLecturerName && (
                        <span className="text-xs text-amber override-prev-note">
                          Đổi từ: {item.previousLecturerName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="degree-tag">{item.academicDegree}</span>
                    <span className="text-xs text-muted block mt-1">{item.departmentName}</span>
                  </td>
                  <td>
                    {item.matchedPriority === 1 && (
                      <span className="priority-badge priority-badge-1">Đạt NV1</span>
                    )}
                    {item.matchedPriority === 2 && (
                      <span className="priority-badge priority-badge-2">Đạt NV2</span>
                    )}
                    {item.matchedPriority === 3 && (
                      <span className="priority-badge priority-badge-3">Đạt NV3</span>
                    )}
                    {item.matchedPriority === 0 && (
                      <span className="priority-badge badge-fallback">Fallback</span>
                    )}
                    {item.isOverridden && (
                      <span className="badge-overridden-flag">Manual Override</span>
                    )}
                  </td>
                  <td className="font-semibold text-indigo">
                    {item.matchScore ? item.matchScore.toFixed(1) : '—'}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.status === 'FINALIZED'
                          ? 'badge-finalized'
                          : item.status === 'OVERRIDDEN'
                          ? 'badge-amber'
                          : 'badge-proposed'
                      }`}
                    >
                      {item.status === 'FINALIZED'
                        ? 'Đã chốt'
                        : item.status === 'OVERRIDDEN'
                        ? 'Đã Override'
                        : 'Hệ thống đề xuất'}
                    </span>
                  </td>
                  <td>
                    {!isFinalized && item.status !== 'FINALIZED' ? (
                      <button
                        className="btn-action-override"
                        onClick={() => setSelectedForOverride(item)}
                        title="Điều chuyển sang giảng viên khác"
                      >
                        ✏️ Override
                      </button>
                    ) : (
                      <span className="text-muted text-xs">Đã khóa</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedForOverride && (
        <AssignmentOverrideModal
          assignment={selectedForOverride}
          capacities={capacities}
          onClose={() => setSelectedForOverride(null)}
          onConfirm={onOverride}
        />
      )}
    </div>
  );
};
