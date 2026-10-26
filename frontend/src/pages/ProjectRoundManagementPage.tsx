import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { ProjectRoundItem, TrainingProgram, CreateProjectRoundPayload, CreateMilestonePayload } from '../types';
import { RoundStudentsTab } from '../features/project-round/components/RoundStudentsTab';
import { RoundLecturersTab } from '../features/project-round/components/RoundLecturersTab';
import { UTCAppLayout } from '../components/UTCAppLayout';
import './ProjectRoundManagementPage.css';

const ProjectRoundManagementPage: React.FC = () => {
  const { logout } = useAuth();

  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRound, setSelectedRound] = useState<ProjectRoundItem | null>(null);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab: 'timeline' | 'students' | 'lecturers'
  const [roundActiveTab, setRoundActiveTab] = useState<'timeline' | 'students' | 'lecturers'>('students');

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Modal Create Round
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRound, setNewRound] = useState<CreateProjectRoundPayload>({
    roundCode: '',
    name: '',
    academicYear: '2026-2027',
    semester: 'HK1',
    trainingProgramId: 1,
    startDate: '',
    endDate: '',
    description: '',
  });

  // Modal Add Milestone
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState<CreateMilestonePayload>({
    name: '',
    phaseType: 'REGISTRATION',
    startDate: '',
    endDate: '',
    description: '',
    orderIndex: 1,
  });

  // Load rounds
  const loadRounds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProjectRounds({
        status: filterStatus || undefined,
        academicYear: filterYear || undefined,
      });
      setRounds(data || []);
      if (data && data.length > 0) {
        if (!selectedRound || !data.some(r => r.roundId === selectedRound.roundId)) {
          loadRoundDetail(data[0].roundId);
        } else {
          loadRoundDetail(selectedRound.roundId);
        }
      } else {
        setSelectedRound(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách đợt đồ án');
    } finally {
      setLoading(false);
    }
  };

  const loadRoundDetail = async (roundId: number) => {
    try {
      const data = await apiService.getProjectRoundById(roundId);
      setSelectedRound(data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const loadTrainingPrograms = async () => {
    try {
      const progs = await apiService.getTrainingPrograms();
      setTrainingPrograms(progs || []);
      if (progs && progs.length > 0 && newRound.trainingProgramId === 1) {
        setNewRound(prev => ({ ...prev, trainingProgramId: progs[0].id }));
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTrainingPrograms();
    loadRounds();
  }, []);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const created = await apiService.createProjectRound(newRound);
      setSuccessMsg(`Tạo đợt đồ án "${created.name}" thành công!`);
      setShowCreateModal(false);
      await loadRounds();
      loadRoundDetail(created.roundId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo đợt đồ án');
    } finally {
      setLoading(false);
    }
  };

  // Status transition modal states (Page 4 & 5 requirements)
  const [transitionTargetStatus, setTransitionTargetStatus] = useState<string | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const openTransitionModal = (targetStatus: string) => {
    setTransitionTargetStatus(targetStatus);
    setTransitionError(null);
  };

  const handleConfirmTransition = async () => {
    if (!selectedRound || !transitionTargetStatus) return;
    try {
      setTransitionLoading(true);
      setTransitionError(null);
      const updated = await apiService.updateProjectRoundStatus(selectedRound.roundId, transitionTargetStatus);
      setSuccessMsg(`Đã cập nhật trạng thái đợt sang: ${updated.status}`);
      setTransitionTargetStatus(null);
      await loadRounds();
      setSelectedRound(updated);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái';
      setTransitionError(msg);
      setError(msg);
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;
    try {
      setLoading(true);
      setError(null);

      // Convert local date-time strings to ISO Instant format
      const startIso = new Date(newMilestone.startDate).toISOString();
      const endIso = new Date(newMilestone.endDate).toISOString();

      await apiService.addRoundMilestone(selectedRound.roundId, {
        ...newMilestone,
        startDate: startIso,
        endDate: endIso,
      });

      setSuccessMsg('Thêm mốc thời gian thành công!');
      setShowAddMilestoneModal(false);
      loadRoundDetail(selectedRound.roundId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm mốc thời gian');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mốc thời gian này?')) return;
    try {
      setLoading(true);
      await apiService.deleteMilestone(milestoneId);
      setSuccessMsg('Đã xóa mốc thời gian');
      if (selectedRound) {
        loadRoundDetail(selectedRound.roundId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa mốc');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { label: 'ĐANG MỞ', bg: '#dcfce7', color: '#15803d' };
      case 'IN_PROGRESS':
        return { label: 'ĐANG THỰC HIỆN', bg: '#e0f2fe', color: '#0369a1' };
      case 'CLOSED':
        return { label: 'ĐÃ ĐÓNG', bg: '#fee2e2', color: '#b91c1c' };
      case 'ARCHIVED':
        return { label: 'LƯU TRỮ', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: 'BẢN NHÁP (DRAFT)', bg: '#fef3c7', color: '#b45309' };
    }
  };

  return (
    <UTCAppLayout
      activeTab="project-rounds"
      hideHeroBanner={true}
      pageTitle="Quản lý Đợt đồ án & Mốc thời gian (Contract 2)"
      onLogout={logout}
    >
      <div className="round-page-container">
        {/* Banner Alert Messages */}
        {loading && (
          <div style={{ padding: '10px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
            ⏳ Đang tải dữ liệu hệ thống...
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Top Action Bar */}
        <div className="round-action-bar">
          <div className="round-filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="OPEN">Đang mở (OPEN)</option>
              <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
              <option value="CLOSED">Đã đóng (CLOSED)</option>
            </select>
            <input
              type="text"
              placeholder="Năm học (VD: 2026-2027)..."
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '200px' }}
            />
            <button
              onClick={loadRounds}
              style={{
                backgroundColor: '#0a3273',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Lọc
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Tạo Đợt Đồ Án Mới
          </button>
        </div>

        {/* Content Layout: Left = Rounds List, Right = Round Details & Timeline */}
        <div className="round-two-col-layout">
          {/* Left Column: Rounds List */}
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
              Danh sách Đợt đồ án ({rounds.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '700px', overflowY: 'auto' }}>
              {rounds.map((r) => {
                const badge = getStatusBadge(r.status);
                const isSelected = selectedRound?.roundId === r.roundId;
                return (
                  <div
                    key={r.roundId}
                    onClick={() => loadRoundDetail(r.roundId)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0a3273' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#0a3273', fontSize: '0.95rem' }}>{r.roundCode}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{r.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {r.academicYear} • {r.semester} • CT: <strong>{r.trainingProgram || 'CU_NHAN'}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Round Details & Timeline Milestones */}
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {selectedRound ? (
              <div>
                {/* Round Header & Status Controls */}
                <div className="round-detail-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, color: '#0a3273', fontSize: '1.35rem' }}>{selectedRound.name}</h2>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: getStatusBadge(selectedRound.status).bg,
                        color: getStatusBadge(selectedRound.status).color
                      }}>
                        {getStatusBadge(selectedRound.status).label}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                      Mã đợt: <strong>{selectedRound.roundCode}</strong> • Năm học: {selectedRound.academicYear} • {selectedRound.semester} • Chương trình: <strong>{selectedRound.trainingProgramName || selectedRound.trainingProgram}</strong>
                    </p>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedRound.status === 'DRAFT' && (
                      <button
                        onClick={() => openTransitionModal('OPEN')}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        🚀 Mở đợt (OPEN)
                      </button>
                    )}
                    {selectedRound.status === 'OPEN' && (
                      <button
                        onClick={() => openTransitionModal('IN_PROGRESS')}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Chuyển sang thực hiện
                      </button>
                    )}
                    {(selectedRound.status === 'OPEN' || selectedRound.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => openTransitionModal('CLOSED')}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        🔒 Đóng đợt
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const updated = await apiService.advanceRoundPhase(selectedRound.roundId);
                          setSelectedRound(updated);
                          setSuccessMsg('⚡ Demo: Đã kết thúc giai đoạn và chuyển sang giai đoạn tiếp theo thành công!');
                          window.dispatchEvent(new CustomEvent('utc-phase-change'));
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Lỗi khi chuyển giai đoạn');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        backgroundColor: '#f59e0b',
                        color: '#0f172a',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Demo: Kết thúc giai đoạn hiện tại và chuyển sang giai đoạn tiếp theo"
                    >
                      ⚡ Demo: Kết thúc GĐ & Chuyển tiếp
                    </button>
                  </div>
                </div>

                {/* Tab Switcher: Students (Contract 3) vs Timeline */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
                  <button
                    onClick={() => setRoundActiveTab('students')}
                    style={{
                      padding: '10px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: roundActiveTab === 'students' ? '3px solid #0a3273' : '3px solid transparent',
                      color: roundActiveTab === 'students' ? '#0a3273' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    👥 Danh sách sinh viên & Import Excel (Contract 3)
                  </button>
                  <button
                    onClick={() => setRoundActiveTab('lecturers')}
                    style={{
                      padding: '10px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: roundActiveTab === 'lecturers' ? '3px solid #0a3273' : '3px solid transparent',
                      color: roundActiveTab === 'lecturers' ? '#0a3273' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    👨‍🏫 Giảng viên trong đợt
                  </button>
                  <button
                    onClick={() => setRoundActiveTab('timeline')}
                    style={{
                      padding: '10px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: roundActiveTab === 'timeline' ? '3px solid #0a3273' : '3px solid transparent',
                      color: roundActiveTab === 'timeline' ? '#0a3273' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🗓️ Mốc thời gian (Timeline) ({selectedRound.milestones?.length || 0})
                  </button>
                </div>

                {roundActiveTab === 'students' ? (
                  <RoundStudentsTab
                    roundId={selectedRound.roundId}
                    roundName={selectedRound.name}
                    roundCode={selectedRound.roundCode}
                    isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
                  />
                ) : roundActiveTab === 'lecturers' ? (
                  <RoundLecturersTab
                    roundId={selectedRound.roundId}
                    roundName={selectedRound.name}
                    roundCode={selectedRound.roundCode}
                    isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
                  />
                ) : (
                  <div>
                    {/* Timeline Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>Các mốc thời gian / Timeline nghiệp vụ</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                          Cung cấp API cho hệ thống tự động kiểm tra thời hạn đăng ký, nộp đề cương và bảo vệ
                        </p>
                      </div>
                      {selectedRound.status !== 'CLOSED' && selectedRound.status !== 'ARCHIVED' ? (
                        <button
                          onClick={() => setShowAddMilestoneModal(true)}
                          style={{
                            backgroundColor: '#0a3273',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          ➕ Thêm mốc Timeline
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                          🔒 Đợt đã đóng (Không thể thêm mốc)
                        </span>
                      )}
                    </div>

                    {/* Milestones Stepper / Table */}
                    {selectedRound.milestones && selectedRound.milestones.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedRound.milestones.map((m, idx) => (
                          <div
                            key={m.milestoneId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              borderRadius: '8px',
                              border: m.isActive ? '2px solid #16a34a' : '1px solid #e2e8f0',
                              backgroundColor: m.isActive ? '#f0fdf4' : '#fff'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <span style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: m.isActive ? '#16a34a' : '#0a3273',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}>
                                {idx + 1}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{m.name}</span>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569'
                                  }}>
                                    {m.phaseType}
                                  </span>
                                  {m.isActive && (
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      backgroundColor: '#dcfce7',
                                      color: '#15803d'
                                    }}>
                                      ● Đang diễn ra
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                  🗓️ {new Date(m.startDate).toLocaleDateString('vi-VN')} → {new Date(m.endDate).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                            </div>

                            {selectedRound.status !== 'CLOSED' && selectedRound.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleDeleteMilestone(m.milestoneId)}
                                style={{
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.8rem'
                                }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#475569', fontWeight: 500, border: '1px dashed #94a3b8', borderRadius: '8px' }}>
                        Chưa có mốc thời gian nào được thiết lập. Hãy bấm nút "Thêm mốc Timeline" ở trên.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Chọn một đợt đồ án ở danh sách bên trái để xem và quản lý mốc thời gian.
              </div>
            )}
          </div>
        </div>

        {/* Modal Create Round */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '540px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0a3273' }}>Khởi tạo Đợt Đồ Án Mới</h3>
              <form onSubmit={handleCreateRound}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mã đợt đồ án *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: DA_CNTT_K62_HK1"
                    value={newRound.roundCode}
                    onChange={(e) => setNewRound({ ...newRound, roundCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tên đợt đồ án *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027"
                    value={newRound.name}
                    onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Năm học *</label>
                    <input
                      type="text"
                      required
                      value={newRound.academicYear}
                      onChange={(e) => setNewRound({ ...newRound, academicYear: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Học kỳ *</label>
                    <select
                      value={newRound.semester}
                      onChange={(e) => setNewRound({ ...newRound, semester: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="HK1">Học kỳ 1</option>
                      <option value="HK2">Học kỳ 2</option>
                      <option value="HK_PHU">Học kỳ phụ (Hè)</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Chương trình đào tạo *</label>
                  <select
                    value={newRound.trainingProgramId}
                    onChange={(e) => setNewRound({ ...newRound, trainingProgramId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {trainingPrograms.map((tp) => (
                      <option key={tp.id} value={tp.id}>{tp.name} ({tp.code})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mô tả bổ sung</label>
                  <textarea
                    rows={2}
                    value={newRound.description}
                    onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0a3273', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Tạo đợt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Add Milestone */}
        {showAddMilestoneModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0a3273' }}>Thêm Mốc Thời Gian (Timeline)</h3>
              <form onSubmit={handleAddMilestone}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tên mốc giai đoạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đăng ký nguyện vọng & Hướng đề tài"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Loại giai đoạn (Phase Type) *</label>
                  <select
                    value={newMilestone.phaseType}
                    onChange={(e) => {
                      const selectedPhase = e.target.value;
                      const phaseTitles: Record<string, string> = {
                        REGISTRATION: 'Đăng ký nguyện vọng & Hướng đề tài',
                        PROPOSAL_SUBMISSION: 'Nộp đề cương đồ án tốt nghiệp',
                        WEEKLY_REPORT: 'Thực hiện đồ án & Báo cáo tiến độ tuần',
                        ELIGIBILITY_REVIEW: 'Xét điều kiện bảo vệ đồ án tốt nghiệp',
                        COMMITTEE_ASSIGNMENT: 'Thành lập và phân công Hội đồng chấm bảo vệ',
                        DEFENSE: 'Bảo vệ đồ án tốt nghiệp trước Hội đồng',
                      };
                      setNewMilestone((prev) => ({
                        ...prev,
                        phaseType: selectedPhase,
                        name: phaseTitles[selectedPhase] || prev.name,
                      }));
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="REGISTRATION">Đăng ký nguyện vọng & Hướng đề tài (REGISTRATION)</option>
                    <option value="PROPOSAL_SUBMISSION">Nộp đề cương đồ án tốt nghiệp (PROPOSAL_SUBMISSION)</option>
                    <option value="WEEKLY_REPORT">Thực hiện đồ án & Báo cáo tiến độ tuần (WEEKLY_REPORT)</option>
                    <option value="ELIGIBILITY_REVIEW">Xét điều kiện bảo vệ đồ án tốt nghiệp (ELIGIBILITY_REVIEW)</option>
                    <option value="COMMITTEE_ASSIGNMENT">Thành lập và phân công Hội đồng chấm bảo vệ (COMMITTEE_ASSIGNMENT)</option>
                    <option value="DEFENSE">Bảo vệ đồ án tốt nghiệp trước Hội đồng (DEFENSE)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngày bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newMilestone.startDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, startDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngày kết thúc *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newMilestone.endDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, endDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddMilestoneModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0a3273', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Thêm mốc
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xác nhận Chuyển Trạng Thái Đợt Đồ Án (Pages 4 & 5) */}
        {transitionTargetStatus && selectedRound && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0a3273' }}>
                    {transitionTargetStatus === 'OPEN' && '🚀 Mở Đợt Đồ Án (Chuyển sang OPEN)'}
                    {transitionTargetStatus === 'IN_PROGRESS' && '⚡ Chuyển Sang Thực Hiện (IN_PROGRESS)'}
                    {transitionTargetStatus === 'CLOSED' && '🔒 Xác Nhận Đóng Đợt Đồ Án (CLOSED)'}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                    Đợt: <strong>{selectedRound.name}</strong> ({selectedRound.roundCode})
                  </div>
                </div>
                <button
                  onClick={() => setTransitionTargetStatus(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {transitionError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  ⚠️ <strong>Chưa đủ điều kiện chuyển trạng thái:</strong>
                  <div style={{ marginTop: '4px', fontWeight: 600 }}>{transitionError}</div>
                </div>
              )}

              {transitionTargetStatus === 'OPEN' && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Theo quy định nghiệp vụ, chỉ có thể chuyển từ <strong>Bản nháp (DRAFT)</strong> sang <strong>Đang mở (OPEN)</strong> khi thỏa mãn các điều kiện sau:
                  </p>
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥</span>
                      <span>Trong đợt có <strong>ít nhất 1 sinh viên</strong> tham gia</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👨‍🏫</span>
                      <span>Trong đợt có <strong>ít nhất 1 giảng viên</strong> hướng dẫn</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎯</span>
                      <span>Mỗi hướng đề tài/đồ án phải có <strong>ít nhất 1 giảng viên phụ trách</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎓</span>
                      <span>Có sinh viên <strong>đủ điều kiện nhận đồ án (ELIGIBLE)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📊</span>
                      <span>Số sinh viên tham gia <strong>nhỏ hơn hoặc bằng tổng chỉ tiêu hướng dẫn</strong> (Số SV ≤ Chỉ tiêu GV)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🗓️</span>
                      <span>Đã thiết lập mốc timeline: <strong>Đăng ký nguyện vọng & Hướng đề tài (REGISTRATION)</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {transitionTargetStatus === 'IN_PROGRESS' && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                    Theo quy định nghiệp vụ, chỉ có thể chuyển từ <strong>Đang mở (OPEN)</strong> sang <strong>Đang làm (IN_PROGRESS)</strong> khi thỏa mãn các điều kiện sau:
                  </p>
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📌</span>
                      <span>Đã <strong>chốt phân công giảng viên hướng dẫn (FINALIZED)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📝</span>
                      <span>Mốc timeline 1: <strong>Nộp đề cương đồ án tốt nghiệp (PROPOSAL_SUBMISSION)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📊</span>
                      <span>Mốc timeline 2: <strong>Thực hiện đồ án & Báo cáo tiến độ tuần (WEEKLY_REPORT)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔍</span>
                      <span>Mốc timeline 3: <strong>Xét điều kiện bảo vệ đồ án tốt nghiệp (ELIGIBILITY_REVIEW)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥</span>
                      <span>Mốc timeline 4: <strong>Thành lập và phân công Hội đồng chấm bảo vệ (COMMITTEE_ASSIGNMENT)</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎓</span>
                      <span>Mốc timeline 5: <strong>Bảo vệ đồ án tốt nghiệp trước Hội đồng (DEFENSE)</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {transitionTargetStatus === 'CLOSED' && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>
                    Khi đợt đồ án chuyển sang <strong>Đã đóng (CLOSED)</strong>, tất cả dữ liệu sinh viên, học vụ và mốc thời gian sẽ ở chế độ chỉ đọc. Bạn có chắc chắn muốn đóng đợt này?
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTransitionTargetStatus(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={transitionLoading}
                  onClick={handleConfirmTransition}
                  style={{
                    backgroundColor: transitionTargetStatus === 'CLOSED' ? '#dc2626' : '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: transitionLoading ? 'not-allowed' : 'pointer',
                    opacity: transitionLoading ? 0.6 : 1,
                  }}
                >
                  {transitionLoading ? 'Đang kiểm tra...' : 'Xác nhận chuyển trạng thái'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UTCAppLayout>
  );
};

export default ProjectRoundManagementPage;
