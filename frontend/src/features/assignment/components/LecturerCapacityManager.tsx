import React, { useState } from 'react';
import type { LecturerCapacity, ProjectDirection } from '../types';

interface Props {
  capacities: LecturerCapacity[];
  directions?: ProjectDirection[];
  onUpdateCapacity: (id: number, data: Partial<LecturerCapacity>) => Promise<void>;
  loading?: boolean;
  roundName?: string;
  isRoundClosed?: boolean;
}

export const LecturerCapacityManager: React.FC<Props> = ({
  capacities,
  directions = [],
  onUpdateCapacity,
  loading,
  roundName,
  isRoundClosed,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCapacity, setEditingCapacity] = useState<LecturerCapacity | null>(null);
  const [quotaInput, setQuotaInput] = useState<number>(5);
  const [factorInput, setFactorInput] = useState<number>(1.0);
  const [noteInput, setNoteInput] = useState<string>('');
  const [selectedDirectionIds, setSelectedDirectionIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = capacities.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lecturerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.departmentName && c.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenEdit = (cap: LecturerCapacity) => {
    if (isRoundClosed) return;
    setEditingCapacity(cap);
    setQuotaInput(cap.maxQuota);
    setFactorInput(cap.capacityFactor);
    setNoteInput(cap.note || '');

    // Resolve initial direction IDs
    if (cap.directionIds && cap.directionIds.length > 0) {
      setSelectedDirectionIds([...cap.directionIds]);
    } else if (cap.directionNames && cap.directionNames.length > 0 && directions.length > 0) {
      const ids: number[] = [];
      cap.directionNames.forEach((dn) => {
        const found = directions.find(
          (d) =>
            d.code.toLowerCase() === dn.toLowerCase() ||
            d.name.toLowerCase() === dn.toLowerCase() ||
            dn.toLowerCase().includes(d.code.toLowerCase())
        );
        if (found && !ids.includes(found.id)) {
          ids.push(found.id);
        }
      });
      setSelectedDirectionIds(ids);
    } else {
      setSelectedDirectionIds([]);
    }
  };

  const handleSave = async () => {
    if (!editingCapacity) return;
    try {
      setSaving(true);
      await onUpdateCapacity(editingCapacity.id, {
        maxQuota: quotaInput,
        capacityFactor: factorInput,
        note: noteInput,
        directionIds: selectedDirectionIds,
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
          <h3>
            Quản lý năng lực hướng dẫn & Chỉ tiêu giảng viên
            {roundName && <span className="table-round-name"> — {roundName}</span>}
          </h3>
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
                          Array.from(new Set(cap.directionNames)).map((d, i) => (
                            <span key={i} className="direction-micro-tag" title={d}>
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
                      {!isRoundClosed ? (
                        <button
                          className="btn-action-edit"
                          onClick={() => handleOpenEdit(cap)}
                          title="Chỉnh sửa chỉ tiêu và hệ số"
                        >
                          ⚙️ Sửa
                        </button>
                      ) : (
                        <span className="text-muted text-xs">Đã khóa</span>
                      )}
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
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>🎯 Hướng đồ án đảm nhận trong đợt ({selectedDirectionIds.length} hướng):</span>
                  {directions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDirectionIds.length === directions.length) {
                          setSelectedDirectionIds([]);
                        } else {
                          setSelectedDirectionIds(directions.map((d) => d.id));
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                    >
                      {selectedDirectionIds.length === directions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả hướng'}
                    </button>
                  )}
                </label>
                {directions.length === 0 ? (
                  <p className="text-muted text-xs">Chưa có danh mục hướng đồ án</p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '8px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}
                  >
                    {directions.map((d) => {
                      const isChecked = selectedDirectionIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            background: isChecked ? '#eff6ff' : '#fff',
                            border: `1px solid ${isChecked ? '#93c5fd' : '#e2e8f0'}`,
                            padding: '6px 8px',
                            borderRadius: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            style={{ marginTop: '2px', cursor: 'pointer' }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDirectionIds((prev) => [...prev, d.id]);
                              } else {
                                setSelectedDirectionIds((prev) => prev.filter((id) => id !== d.id));
                              }
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: isChecked ? '#1d4ed8' : '#334155' }}>
                              {d.code}
                            </div>
                            <div style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.25 }}>
                              {d.name}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
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
