import React, { useState, useMemo } from 'react';
import type { PreferenceResponse } from '../types';

interface Props {
  preferences: PreferenceResponse[];
  loading?: boolean;
}

export const PreferenceList: React.FC<Props> = ({ preferences, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');

  const filtered = useMemo(() => {
    return preferences.filter((p) => {
      const matchSearch =
        p.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lecturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lecturerCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;

      return matchSearch && matchPriority;
    });
  }, [preferences, searchTerm, priorityFilter]);

  if (loading) {
    return <div className="loading-state">Đang tải danh sách nguyện vọng giảng viên...</div>;
  }

  return (
    <div className="preference-list-card">
      <div className="card-header-bar">
        <div className="header-titles">
          <h3>Danh sách nguyện vọng của sinh viên (NV1, NV2, NV3)</h3>
          <span className="count-badge">{filtered.length} nguyện vọng</span>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Tên SV, GVHD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="priority-pill-group">
            <button
              className={`pill-btn ${priorityFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('ALL')}
            >
              Tất cả
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
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="assignment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã SV</th>
              <th>Họ và tên</th>
              <th>Hệ ĐT</th>
              <th>Nguyện vọng</th>
              <th>Giảng viên được chọn</th>
              <th>Học vị GV</th>
              <th>Điểm GPA</th>
              <th>Tiêu chí phụ / Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  Không tìm thấy nguyện vọng nào phù hợp
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-primary">{item.studentCode}</td>
                  <td>{item.studentName}</td>
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
                    <span className={`priority-badge priority-badge-${item.priority}`}>
                      NV{item.priority}
                    </span>
                  </td>
                  <td>
                    <div className="lecturer-col">
                      <span className="lecturer-name">{item.lecturerName}</span>
                      <span className="text-xs text-muted">{item.lecturerCode}</span>
                    </div>
                  </td>
                  <td>
                    <span className="degree-tag">{item.academicDegree}</span>
                  </td>
                  <td className="font-medium text-amber">
                    {item.gpa ? item.gpa.toFixed(2) : '—'}
                  </td>
                  <td className="criteria-cell">
                    {item.prioritizationCriteria ? (
                      <span className="criteria-text" title={item.prioritizationCriteria}>
                        {item.prioritizationCriteria}
                      </span>
                    ) : (
                      <span className="text-muted">Không có</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
