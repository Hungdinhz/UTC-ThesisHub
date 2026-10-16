import React, { useState, useMemo } from 'react';
import type { DirectionRegistration, ProjectDirection } from '../types';

interface Props {
  registrations: DirectionRegistration[];
  directions: ProjectDirection[];
  loading?: boolean;
}

export const DirectionRegistrationList: React.FC<Props> = ({
  registrations,
  directions,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<number | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return registrations.filter((item) => {
      const matchSearch =
        item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.studentClass && item.studentClass.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDirection =
        selectedDirection === 'ALL' || item.directionId === selectedDirection;

      return matchSearch && matchDirection;
    });
  }, [registrations, searchTerm, selectedDirection]);

  if (loading) {
    return <div className="loading-state">Đang tải danh sách đăng ký hướng đồ án...</div>;
  }

  return (
    <div className="registration-list-card">
      <div className="card-header-bar">
        <div className="header-titles">
          <h3>Danh sách sinh viên đăng ký hướng đồ án</h3>
          <span className="count-badge">{filtered.length} sinh viên</span>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, Lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedDirection}
            onChange={(e) =>
              setSelectedDirection(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
          >
            <option value="ALL">Tất cả hướng đồ án</option>
            {directions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="assignment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã SV</th>
              <th>Họ và tên</th>
              <th>Lớp</th>
              <th>Chương trình</th>
              <th>Hướng đồ án đã đăng ký</th>
              <th>Thời gian nộp</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Không tìm thấy sinh viên nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold text-primary">{item.studentCode}</td>
                  <td>{item.studentName}</td>
                  <td>{item.studentClass || '—'}</td>
                  <td>
                    <span
                      className={`program-badge ${
                        item.trainingProgramCode === 'KY_SU' ? 'badge-kysu' : 'badge-cunhan'
                      }`}
                    >
                      {item.trainingProgramCode === 'KY_SU' ? 'Kỹ sư (4.5 năm)' : 'Cử nhân (4 năm)'}
                    </span>
                  </td>
                  <td>
                    <div className="direction-info">
                      <span className="direction-code-tag">{item.directionCode}</span>
                      <span className="direction-name-text">{item.directionName}</span>
                    </div>
                  </td>
                  <td className="text-muted">
                    {item.registeredAt
                      ? new Date(item.registeredAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td>
                    <span className="status-badge badge-active">{item.status}</span>
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
