import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { assignmentService } from '../../assignment/services/assignmentService';
import {
  isLecturerAssignedToDirection,
  type LecturerCapacity,
  type ProjectDirection,
} from '../../assignment/types';
import type { Department, LecturerItem } from '../../../types';

interface RoundLecturersTabProps {
  roundId: number;
  roundName: string;
  roundCode: string;
  isRoundClosed?: boolean;
}

export const RoundLecturersTab: React.FC<RoundLecturersTabProps> = ({
  roundId,
  roundName,
  roundCode,
  isRoundClosed,
}) => {
  const [capacities, setCapacities] = useState<LecturerCapacity[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyLecturers, setFacultyLecturers] = useState<LecturerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<number | undefined>(undefined);

  // Add Lecturers Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedLecturerIds, setSelectedLecturerIds] = useState<number[]>([]);
  const defaultQuota = 5;
  const [customQuotas, setCustomQuotas] = useState<Record<number, number>>({});
  const [addModalSearch, setAddModalSearch] = useState('');
  const [addModalDeptId, setAddModalDeptId] = useState<number | undefined>(undefined);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [caps, depts, allLecs, dirs] = await Promise.all([
        assignmentService.getCapacities(roundId),
        apiService.getDepartments(),
        apiService.getLecturers(),
        assignmentService.getDirections(true),
      ]);
      setCapacities(caps || []);
      setDepartments(depts || []);
      setFacultyLecturers(allLecs || []);
      setDirections(dirs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách giảng viên trong đợt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roundId]);

  // Filter capacities
  const filteredCapacities = capacities.filter((c) => {
    if (selectedDeptId && c.departmentId !== selectedDeptId) return false;
    if (selectedDegree && c.academicDegree !== selectedDegree) return false;
    if (selectedStatus === 'ACTIVE' && c.isActive === false) return false;
    if (selectedStatus === 'INACTIVE' && c.isActive !== false) return false;

    if (selectedDirectionId) {
      const dirObj = directions.find((d) => d.id === selectedDirectionId);
      if (dirObj && !isLecturerAssignedToDirection(c, dirObj)) {
        return false;
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const codeMatch = c.lecturerCode?.toLowerCase().includes(q);
      const nameMatch = c.fullName?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const deptMatch = c.departmentName?.toLowerCase().includes(q);
      const dirMatch = c.directionNames?.some((d) => d.toLowerCase().includes(q));
      if (!codeMatch && !nameMatch && !emailMatch && !deptMatch && !dirMatch) {
        return false;
      }
    }
    return true;
  });

  // Summary Metrics
  const totalLecturers = capacities.length;
  const totalCapacity = capacities.reduce((sum, c) => sum + (c.effectiveCapacity || c.maxQuota || 0), 0);
  const totalAssigned = capacities.reduce((sum, c) => sum + (c.currentAssigned || 0), 0);
  const totalRemaining = Math.max(0, totalCapacity - totalAssigned);
  const avgLoad = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

  // Direction coverage metrics (Rule: each direction must have >= 1 lecturer in round to transition DRAFT -> OPEN)
  const activeCapacities = capacities.filter((c) => c.isActive !== false);
  const coveredDirections = directions.filter((d) =>
    activeCapacities.some((c) => isLecturerAssignedToDirection(c, d))
  );
  const uncoveredDirections = directions.filter(
    (d) => !activeCapacities.some((c) => isLecturerAssignedToDirection(c, d))
  );
  const isFullDirectionCoverage = directions.length > 0 && uncoveredDirections.length === 0;

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (isRoundClosed) return;
    setSelectedLecturerIds([]);
    const initQuotas: Record<number, number> = {};
    facultyLecturers.forEach((l) => {
      initQuotas[l.lecturerId] = l.maxThesisQuota || defaultQuota || 5;
    });
    setCustomQuotas(initQuotas);
    setAddModalSearch('');
    setAddModalDeptId(undefined);
    setShowAddModal(true);
  };

  // Submit Add Lecturers
  const handleAddLecturersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLecturerIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 giảng viên để thêm vào đợt!');
      return;
    }
    try {
      setAddLoading(true);
      await assignmentService.addLecturersToRound(roundId, selectedLecturerIds, defaultQuota, customQuotas);
      setSuccessMsg(`Đã thêm thành công ${selectedLecturerIds.length} giảng viên vào đợt đồ án!`);
      setShowAddModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm giảng viên vào đợt');
    } finally {
      setAddLoading(false);
    }
  };

  // Init all lecturers
  const handleInitAll = async () => {
    if (isRoundClosed) return;
    if (!window.confirm(`Bạn có chắc chắn muốn khởi tạo danh sách giảng viên và phân bổ chỉ tiêu tự động theo số lượng sinh viên trong đợt [${roundCode}]?`)) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await assignmentService.initCapacities(roundId, 5);
      setSuccessMsg('Đã khởi tạo danh sách giảng viên và phân bổ chỉ tiêu thành công theo số lượng sinh viên trong đợt!');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi khởi tạo chỉ tiêu';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Delete / Remove capacity
  const handleRemoveCapacity = async (c: LecturerCapacity) => {
    if (isRoundClosed) {
      alert('Đợt đồ án đã đóng. Không thể xóa giảng viên khỏi đợt.');
      return;
    }
    if (c.currentAssigned != null && c.currentAssigned > 0) {
      alert(`Không thể xóa: Giảng viên ${c.fullName} (${c.lecturerCode}) đã được phân công hướng dẫn ${c.currentAssigned} sinh viên trong đợt này. Cần hủy phân công trước khi xóa khỏi đợt.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giảng viên ${c.fullName} (${c.lecturerCode}) khỏi đợt đồ án này?`)) {
      return;
    }
    try {
      setLoading(true);
      await assignmentService.deleteCapacity(c.id, roundId, c.lecturerId);
      setSuccessMsg(`Đã xóa giảng viên ${c.fullName} khỏi đợt đồ án thành công.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa giảng viên khỏi đợt';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const getDegreeBadge = (degree?: string) => {
    switch (degree) {
      case 'TIEN_SI':
        return { label: 'Tiến sĩ', bg: '#fef3c7', color: '#92400e' };
      case 'PGS':
        return { label: 'Phó Giáo sư', bg: '#fce7f3', color: '#9d174d' };
      case 'GS':
        return { label: 'Giáo sư', bg: '#fae8ff', color: '#86198f' };
      case 'THAC_SI':
      default:
        return { label: 'Thạc sĩ', bg: '#e0e7ff', color: '#3730a3' };
    }
  };

  return (
    <div>
      {/* Alert Messages */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
          }}
        >
          <span>✅ {successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header and Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            Giảng viên tham gia đợt đồ án ({filteredCapacities.length} / {totalLecturers})
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý danh sách giảng viên hướng dẫn, chỉ tiêu và hạn mức capacity cho đợt <strong>{roundName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            disabled={isRoundClosed}
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: isRoundClosed ? '#94a3b8' : '#0a3273',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRoundClosed ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ➕ Thêm Giảng viên vào đợt
          </button>

          <button
            disabled={isRoundClosed}
            onClick={handleInitAll}
            title="Tự động phân bổ số lượng giảng viên và chỉ tiêu theo số sinh viên trong đợt (Tiến sĩ x1.5, PGS x2.0, tối thiểu 4 SV/GV)"
            style={{
              backgroundColor: isRoundClosed ? '#94a3b8' : '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRoundClosed ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚡ Khởi tạo nhanh toàn bộ GV
          </button>

          <button
            onClick={loadData}
            style={{
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔄 Tải lại
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '14px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng số Giảng viên
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
            {totalLecturers}
          </div>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '14px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng chỉ tiêu hướng dẫn
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532d', marginTop: '4px' }}>
            {totalCapacity} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>SV</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', borderRadius: '8px', padding: '14px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>
            Đã phân công
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350f', marginTop: '4px' }}>
            {totalAssigned} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>SV</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#faf5ff', borderRadius: '8px', padding: '14px', border: '1px solid #e9d5ff' }}>
          <div style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: 600, textTransform: 'uppercase' }}>
            Chỉ tiêu còn lại
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87', marginTop: '4px' }}>
            {totalRemaining} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>SV ({100 - avgLoad}%)</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: isFullDirectionCoverage ? '#f0fdf4' : '#fffbeb',
            borderRadius: '8px',
            padding: '14px',
            border: `1px solid ${isFullDirectionCoverage ? '#bbf7d0' : '#fde68a'}`,
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: isFullDirectionCoverage ? '#15803d' : '#b45309',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Độ phủ hướng đồ án
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: isFullDirectionCoverage ? '#14532d' : '#92400e',
              marginTop: '4px',
            }}
          >
            {coveredDirections.length} / {directions.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>hướng</span>
          </div>
        </div>
      </div>

      {/* Direction Coverage Warning Banner if missing lecturers */}
      {uncoveredDirections.length > 0 && directions.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#9a3412',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚠️</span>
            <span>Chưa đủ điều kiện Mở đợt (OPEN): Còn {uncoveredDirections.length} hướng chưa có giảng viên phụ trách</span>
          </div>
          <div style={{ marginTop: '6px', color: '#7c2d12' }}>
            Các hướng chưa có GV trong đợt:{' '}
            <strong>{uncoveredDirections.map((d) => d.name).join(' • ')}</strong>
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#c2410c' }}>
            💡 Mỗi hướng đề tài phải có ít nhất 1 giảng viên phụ trách để khi sinh viên đăng ký nguyện vọng không bị thiệt thòi. Hệ thống tự động cập nhật độ phủ hướng chuyên môn theo các Giảng viên được thêm vào đợt. Vui lòng thêm Giảng viên phụ trách các hướng còn thiếu trước khi chuyển đợt sang trạng thái <strong>ĐANG MỞ (OPEN)</strong>.
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          backgroundColor: '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <input
          type="text"
          placeholder="🔍 Tìm Mã CB, Họ tên, Email, Chuyên môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.88rem',
          }}
        />

        <select
          value={selectedDeptId || ''}
          onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
        >
          <option value="">-- Tất cả bộ môn --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        <select
          value={selectedDegree}
          onChange={(e) => setSelectedDegree(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
        >
          <option value="">-- Tất cả học vị --</option>
          <option value="THAC_SI">Thạc sĩ</option>
          <option value="TIEN_SI">Tiến sĩ</option>
          <option value="PGS">Phó Giáo sư</option>
          <option value="GS">Giáo sư</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="ACTIVE">● Đang hoạt động</option>
          <option value="INACTIVE">○ Đã tạm dừng</option>
        </select>

        <select
          value={selectedDirectionId || ''}
          onChange={(e) => setSelectedDirectionId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
        >
          <option value="">-- Tất cả hướng chuyên môn ({directions.length}) --</option>
          {directions.map((d) => (
            <option key={d.id} value={d.id}>
              🎯 {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Table of Lecturers in Round */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '10px 12px', width: '50px' }}>STT</th>
              <th style={{ padding: '10px 12px' }}>Mã CB</th>
              <th style={{ padding: '10px 12px' }}>Họ và tên</th>
              <th style={{ padding: '10px 12px' }}>Học vị</th>
              <th style={{ padding: '10px 12px' }}>Bộ môn</th>
              <th style={{ padding: '10px 12px' }}>Hướng đảm nhận</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Chỉ tiêu gốc</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hệ số</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Chỉ tiêu thực</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Đã gán</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Còn trống</th>
              <th style={{ padding: '10px 12px' }}>Trạng thái</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  ⏳ Đang tải danh sách giảng viên trong đợt...
                </td>
              </tr>
            ) : filteredCapacities.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Chưa có giảng viên nào trong đợt đồ án phù hợp với bộ lọc. Bấm "Thêm Giảng viên vào đợt" để thêm.
                </td>
              </tr>
            ) : (
              filteredCapacities.map((c, idx) => {
                const degreeBadge = getDegreeBadge(c.academicDegree);
                const effCap = c.effectiveCapacity != null ? c.effectiveCapacity : c.maxQuota || 5;
                const assigned = c.currentAssigned || 0;
                const remaining = Math.max(0, effCap - assigned);
                const isFull = remaining === 0 && effCap > 0;

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#fbfcfd',
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{c.lecturerCode}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: degreeBadge.bg,
                          color: degreeBadge.color,
                        }}
                      >
                        {degreeBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{c.departmentName || '—'}</td>
                    <td style={{ padding: '10px 12px', maxWidth: '240px' }}>
                      {c.directionNames && c.directionNames.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {Array.from(new Set(c.directionNames)).map((dName, dIdx) => (
                            <span
                              key={dIdx}
                              style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                maxWidth: '220px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={dName}
                            >
                              🎯 {dName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                          Chưa gán hướng
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{c.maxQuota || 5}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                      {c.capacityFactor != null ? c.capacityFactor.toFixed(1) : '1.0'}x
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0a3273' }}>
                      {effCap}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          backgroundColor: assigned > 0 ? '#eff6ff' : '#f1f5f9',
                          color: assigned > 0 ? '#1d4ed8' : '#64748b',
                        }}
                      >
                        {assigned}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          backgroundColor: isFull ? '#fee2e2' : '#f0fdf4',
                          color: isFull ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {remaining}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: c.isActive !== false ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {c.isActive !== false ? '● Hoạt động' : '○ Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveCapacity(c)}
                          style={{
                            backgroundColor: (c.currentAssigned != null && c.currentAssigned > 0) ? '#f8fafc' : '#fef2f2',
                            color: (c.currentAssigned != null && c.currentAssigned > 0) ? '#94a3b8' : '#b91c1c',
                            border: `1px solid ${(c.currentAssigned != null && c.currentAssigned > 0) ? '#e2e8f0' : '#fecaca'}`,
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={
                            c.currentAssigned && c.currentAssigned > 0
                              ? `GV đã phân công (${c.currentAssigned} SV). Bấm để xem lý do không thể xóa`
                              : 'Xóa giảng viên khỏi đợt đồ án'
                          }
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Thêm Giảng viên vào đợt */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '750px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0a3273' }}>➕ Thêm Giảng viên vào đợt [{roundCode}]</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLecturersSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Lọc theo Bộ môn
                  </label>
                  <select
                    value={addModalDeptId || ''}
                    onChange={(e) => setAddModalDeptId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Tất cả bộ môn --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Tìm kiếm nhanh GV
                  </label>
                  <input
                    type="text"
                    placeholder="🔍 Tìm nhanh GV theo tên hoặc mã CB..."
                    value={addModalSearch}
                    onChange={(e) => setAddModalSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Table of Available Lecturers */}
              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={
                            facultyLecturers
                              .filter((l) => (!addModalDeptId || l.departmentId === addModalDeptId))
                              .filter((l) => !addModalSearch || l.fullName.toLowerCase().includes(addModalSearch.toLowerCase()) || l.lecturerCode.toLowerCase().includes(addModalSearch.toLowerCase()))
                              .filter((l) => !capacities.some((c) => c.lecturerId === l.lecturerId))
                              .length > 0 &&
                            facultyLecturers
                              .filter((l) => (!addModalDeptId || l.departmentId === addModalDeptId))
                              .filter((l) => !addModalSearch || l.fullName.toLowerCase().includes(addModalSearch.toLowerCase()) || l.lecturerCode.toLowerCase().includes(addModalSearch.toLowerCase()))
                              .filter((l) => !capacities.some((c) => c.lecturerId === l.lecturerId))
                              .every((l) => selectedLecturerIds.includes(l.lecturerId))
                          }
                          onChange={(e) => {
                            const selectableCandidates = facultyLecturers
                              .filter((l) => (!addModalDeptId || l.departmentId === addModalDeptId))
                              .filter((l) => !addModalSearch || l.fullName.toLowerCase().includes(addModalSearch.toLowerCase()) || l.lecturerCode.toLowerCase().includes(addModalSearch.toLowerCase()))
                              .filter((l) => !capacities.some((c) => c.lecturerId === l.lecturerId))
                              .map((l) => l.lecturerId);

                            if (e.target.checked) {
                              const set = new Set([...selectedLecturerIds, ...selectableCandidates]);
                              setSelectedLecturerIds(Array.from(set));
                            } else {
                              const candidateSet = new Set(selectableCandidates);
                              setSelectedLecturerIds(selectedLecturerIds.filter((id) => !candidateSet.has(id)));
                            }
                          }}
                        />
                      </th>
                      <th style={{ padding: '8px 10px' }}>Mã CB</th>
                      <th style={{ padding: '8px 10px' }}>Họ và tên</th>
                      <th style={{ padding: '8px 10px' }}>Bộ môn / Học vị</th>
                      <th style={{ padding: '8px 10px' }}>Hướng nghiên cứu</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Chỉ tiêu</th>
                      <th style={{ padding: '8px 10px' }}>Trạng thái trong đợt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyLecturers
                      .filter((l) => (!addModalDeptId || l.departmentId === addModalDeptId))
                      .filter((l) => !addModalSearch || l.fullName.toLowerCase().includes(addModalSearch.toLowerCase()) || l.lecturerCode.toLowerCase().includes(addModalSearch.toLowerCase()))
                      .map((l) => {
                        const existingCap = capacities.find((c) => c.lecturerId === l.lecturerId);
                        const inRound = !!existingCap;
                        const isChecked = selectedLecturerIds.includes(l.lecturerId);

                        return (
                          <tr
                            key={l.lecturerId}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: inRound ? '#f8fafc' : isChecked ? '#eff6ff' : '#fff',
                              opacity: inRound ? 0.75 : 1,
                            }}
                          >
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="checkbox"
                                disabled={inRound}
                                checked={inRound ? false : isChecked}
                                title={inRound ? 'Giảng viên đã tham gia đợt này (không thể chọn)' : 'Chọn giảng viên'}
                                onChange={(e) => {
                                  if (inRound) return;
                                  if (e.target.checked) {
                                    setSelectedLecturerIds([...selectedLecturerIds, l.lecturerId]);
                                  } else {
                                    setSelectedLecturerIds(selectedLecturerIds.filter((id) => id !== l.lecturerId));
                                  }
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: inRound ? '#64748b' : '#0a3273' }}>
                              {l.lecturerCode}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 600 }}>{l.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.email}</div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 500 }}>{l.departmentName || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#475569' }}>Học vị: {l.academicDegree || 'THAC_SI'}</div>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#047857', fontSize: '0.8rem' }}>
                              {l.researchInterests || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {inRound ? (
                                <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                                  {existingCap.maxQuota || 5} SV
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={customQuotas[l.lecturerId] ?? l.maxThesisQuota ?? defaultQuota}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setCustomQuotas((prev) => ({ ...prev, [l.lecturerId]: val }));
                                  }}
                                  style={{
                                    width: '65px',
                                    padding: '4px 6px',
                                    textAlign: 'center',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                  }}
                                />
                              )}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {inRound ? (
                                <span
                                  style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    display: 'inline-block',
                                  }}
                                >
                                  ● Đã tham gia đợt
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    display: 'inline-block',
                                  }}
                                >
                                  ○ Chưa tham gia
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Đã chọn: <strong>{selectedLecturerIds.length}</strong> giảng viên
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading || selectedLecturerIds.length === 0}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: addLoading || selectedLecturerIds.length === 0 ? '#94a3b8' : '#0a3273',
                      color: '#fff',
                      cursor: addLoading || selectedLecturerIds.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {addLoading ? 'Đang thêm...' : `Xác nhận thêm (${selectedLecturerIds.length} GV)`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
