import React, { useState } from 'react';
import type { LecturerCapacity } from '../types';

interface Props {
  capacities: LecturerCapacity[];
  onUpdateCapacity: (id: number, data: Partial<LecturerCapacity>) => Promise<void>;
  loading?: boolean;
}

export const LecturerCapacityManager: React.FC<Props> = ({
  capacities,
  onUpdateCapacity,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCapacity, setEditingCapacity] = useState<LecturerCapacity | null>(null);
  const [quotaInput, setQuotaInput] = useState<number>(5);
  const [factorInput, setFactorInput] = useState<number>(1.0);
  const [noteInput, setNoteInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filtered = capacities.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lecturerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.departmentName && c.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenEdit = (cap: LecturerCapacity) => {
    setEditingCapacity(cap);
    setQuotaInput(cap.maxQuota);
    setFactorInput(cap.capacityFactor);
    setNoteInput(cap.note || '');
  };

  const handleSave = async () => {
    if (!editingCapacity) return;
    try {
      setSaving(true);
      await onUpdateCapacity(editingCapacity.id, {
        maxQuota: quotaInput,
        capacityFactor: factorInput,
        note: noteInput,
      });
      setEditingCapacity(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Đang tải danh sách chỉ tiêu giảng viên...</div>;
  }

  return (
    <div className="capacity-manager-card">
      <div className="card-header-bar">
        <div className="header-titles">
          <h3>Quản lý năng lực hướng dẫn & Chỉ tiêu giảng viên</h3>
          <span className="count-badge">{filtered.length} giảng viên</span>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo Tên giảng viên, Bộ môn, Mã GV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="assignment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã CB</th>
              <th>Họ và tên</th>
              <th>Học vị</th>
              <th>Bộ môn</th>
              <th>Hướng chuyên môn</th>
              <th>Chỉ tiêu gốc</th>
              <th>Hệ số tải</th>
              <th>Sức chứa</th>
              <th>Đã phân</th>
              <th>Còn lại</th>
              <th>Tỷ lệ tải</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="empty-row">
                  Không tìm thấy giảng viên nào
                </td>
              </tr>
            ) : (
              filtered.map((cap, index) => {
                const loadPercent = Math.min(100, Math.round(cap.loadRatio * 100));
                let barClass = 'bar-green';
                if (loadPercent >= 100) barClass = 'bar-red';
                else if (loadPercent >= 75) barClass = 'bar-yellow';

                return (
                  <tr key={cap.id}>
                    <td>{index + 1}</td>
                    <td className="font-semibold text-primary">{cap.lecturerCode}</td>
                    <td>
                      <div className="lecturer-name-block">
                        <strong>{cap.fullName}</strong>
                        {cap.email && <span className="text-xs text-muted">{cap.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="degree-tag">{cap.academicDegree}</span>
                    </td>
                    <td className="text-sm">{cap.departmentName || '—'}</td>
                    <td>
                      <div className="direction-tags">
                        {cap.directionNames && cap.directionNames.length > 0 ? (
                          cap.directionNames.map((d, i) => (
                            <span key={i} className="direction-micro-tag">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-xs">Chưa gán hướng</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center font-semibold">{cap.maxQuota}</td>
                    <td className="text-center">
                      <span className="factor-pill">x{cap.capacityFactor.toFixed(1)}</span>
                    </td>
                    <td className="text-center font-bold text-indigo">
                      {cap.effectiveCapacity} SV
                    </td>
                    <td className="text-center font-bold">{cap.currentAssigned}</td>
                    <td className="text-center">
                      <span
                        className={`slot-badge ${
                          cap.remainingCapacity > 0 ? 'slot-available' : 'slot-full'
                        }`}
                      >
                        {cap.remainingCapacity > 0 ? `${cap.remainingCapacity} chỗ` : 'Hết chỗ'}
                      </span>
                    </td>
                    <td style={{ minWidth: '120px' }}>
                      <div className="load-bar-wrapper">
                        <div className="load-bar-track">
                          <div
                            className={`load-bar-fill ${barClass}`}
                            style={{ width: `${loadPercent}%` }}
                          />
                        </div>
                        <span className="load-percent-text">{loadPercent}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-action-edit"
                        onClick={() => handleOpenEdit(cap)}
                        title="Chỉnh sửa chỉ tiêu và hệ số"
                      >
                        ⚙️ Sửa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Capacity Modal */}
      {editingCapacity && (
        <div className="modal-overlay" onClick={() => setEditingCapacity(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Điều chỉnh năng lực hướng dẫn: {editingCapacity.fullName}</h4>
              <button className="close-btn" onClick={() => setEditingCapacity(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-desc-box">
                <p>
                  <strong>Mã CB:</strong> {editingCapacity.lecturerCode} |{' '}
                  <strong>Học vị:</strong> {editingCapacity.academicDegree}
                </p>
                <p>
                  <strong>Bộ môn:</strong> {editingCapacity.departmentName}
                </p>
              </div>

              <div className="form-group">
                <label>Chỉ tiêu gốc (Max Quota - số SV tiêu chuẩn):</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="form-input"
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Hệ số Capacity (Capacity Factor):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3.0"
                  className="form-input"
                  value={factorInput}
                  onChange={(e) => setFactorInput(Number(e.target.value))}
                />
                <span className="form-help-text">
                  Ví dụ: 1.0 (chuẩn), 1.2 (+20% tải), 0.8 (giảm tải do quản lý/nghiên cứu).
                </span>
              </div>

              <div className="effective-calc-preview">
                <span>Sức chứa thực tế dự kiến:</span>
                <strong className="text-indigo">
                  {Math.round(quotaInput * factorInput)} sinh viên
                </strong>
              </div>

              <div className="form-group">
                <label>Ghi chú điều chỉnh:</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Lý do điều chỉnh chỉ tiêu..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditingCapacity(null)}
                disabled={saving}
              >
                Hủy
              </button>
              <button className="btn-confirm" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu điều chỉnh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
