import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { ProjectRoundItem, TrainingProgram, CreateProjectRoundPayload, CreateMilestonePayload } from '../types';
import { RoundStudentsTab } from '../features/project-round/components/RoundStudentsTab';
import { RoundLecturersTab } from '../features/project-round/components/RoundLecturersTab';
import { UTCAppLayout } from '../components/UTCAppLayout';
import { getRoundStageNumber, STAGES } from '../utils/phaseTracking';
import { VnDateTimePicker, parseVnDateTime } from '../components/VnDateTimePicker';
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

  // View Mode: 'active' (Đợt đang hoạt động) | 'archived' (Kho lưu trữ đợt đã đóng)
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [selectedArchivedRound, setSelectedArchivedRound] = useState<ProjectRoundItem | null>(null);

  // Search & Filter for Archived Page
  const [archivedSearchQuery, setArchivedSearchQuery] = useState<string>('');
  const [archivedFilterYear, setArchivedFilterYear] = useState<string>('');

  // Reopen Round Modal
  const [reopeningRound, setReopeningRound] = useState<ProjectRoundItem | null>(null);
  const [reopenLoading, setReopenLoading] = useState(false);

  // Filter
  const [filterStatus] = useState<string>('');
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

  const isClosedStatus = (status?: string) => status === 'CLOSED' || status === 'ARCHIVED';

  // Load rounds
  const loadRounds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProjectRounds({
        status: filterStatus || undefined,
        academicYear: filterYear || undefined,
      });
      const roundList = data || [];
      setRounds(roundList);

      const actives = roundList.filter(r => !isClosedStatus(r.status));
      const closed = roundList.filter(r => isClosedStatus(r.status));

      if (viewMode === 'active') {
        if (actives.length > 0) {
          if (!selectedRound || !actives.some(r => r.roundId === selectedRound.roundId)) {
            loadRoundDetail(actives[0].roundId);
          } else {
            loadRoundDetail(selectedRound.roundId);
          }
        } else {
          setSelectedRound(null);
        }
      } else {
        if (selectedArchivedRound) {
          const stillThere = closed.find(r => r.roundId === selectedArchivedRound.roundId);
          if (stillThere) {
            loadRoundDetail(stillThere.roundId);
            setSelectedArchivedRound(stillThere);
          } else {
            setSelectedArchivedRound(null);
          }
        }
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

  const selectedRoundRef = useRef<ProjectRoundItem | null>(null);
  selectedRoundRef.current = selectedRound;

  useEffect(() => {
    const handlePhaseChange = async () => {
      await loadRounds();
      if (selectedRoundRef.current?.roundId) {
        try {
          const fresh = await apiService.getProjectRoundById(selectedRoundRef.current.roundId);
          setSelectedRound(fresh);
        } catch {}
      }
    };
    window.addEventListener('utc-phase-change', handlePhaseChange);
    return () => {
      window.removeEventListener('utc-phase-change', handlePhaseChange);
    };
  }, []);

  useEffect(() => {
    if (!error) return;
    setSuccessMsg(null);
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!successMsg) return;
    setError(null);
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const created = await apiService.createProjectRound(newRound);
      setSuccessMsg(`Tạo đợt đồ án "${created.name}" thành công!`);
      setShowCreateModal(false);
      setViewMode('active');
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
      if (transitionTargetStatus === 'CLOSED') {
        setSuccessMsg(`Đã đóng đợt đồ án "${updated.name}" (${updated.roundCode}) và chuyển lưu trữ vào Trang Các đợt đã đóng thành công!`);
      } else {
        setSuccessMsg(`Đã cập nhật trạng thái đợt sang: ${updated.status}`);
      }
      setTransitionTargetStatus(null);
      await loadRounds();
      setSelectedRound(updated);
      window.dispatchEvent(new CustomEvent('utc-phase-change'));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái';
      setTransitionError(msg);
      setSuccessMsg(null);
    } finally {
      setTransitionLoading(false);
    }
  };

  // Reopen round logic
  const handleConfirmReopen = async () => {
    if (!reopeningRound) return;
    try {
      setReopenLoading(true);
      setError(null);
      const updated = await apiService.updateProjectRoundStatus(reopeningRound.roundId, 'OPEN');
      setSuccessMsg(`Đã mở lại đợt đồ án "${updated.name}" (${updated.roundCode}) thành công! Đợt đã được đưa trở lại danh sách hoạt động.`);
      setReopeningRound(null);
      setSelectedArchivedRound(null);
      setViewMode('active');
      await loadRounds();
      loadRoundDetail(updated.roundId);
      window.dispatchEvent(new CustomEvent('utc-phase-change'));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi mở lại đợt đồ án';
      setError(msg);
    } finally {
      setReopenLoading(false);
    }
  };

  const handleOpenAddMilestoneModal = () => {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59);

    setNewMilestone({
      name: 'Đăng ký nguyện vọng & Hướng đề tài',
      phaseType: 'REGISTRATION',
      startDate: defaultStart.toISOString(),
      endDate: defaultEnd.toISOString(),
      description: '',
      orderIndex: (selectedRound?.milestones?.length || 0) + 1,
    });
    setShowAddMilestoneModal(true);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;
    try {
      setLoading(true);
      setError(null);

      const parsedStart = parseVnDateTime(newMilestone.startDate) || new Date(newMilestone.startDate);
      const parsedEnd = parseVnDateTime(newMilestone.endDate) || new Date(newMilestone.endDate);

      if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
        setError('Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng ngày/tháng/năm (VD: 16/11/2026 08:00)');
        setLoading(false);
        return;
      }

      if (parsedStart > parsedEnd) {
        setError('Ngày kết thúc phải diễn ra sau ngày bắt đầu!');
        setLoading(false);
        return;
      }

      // Convert local date-time strings to ISO Instant format
      const startIso = parsedStart.toISOString();
      const endIso = parsedEnd.toISOString();

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

  // Modal Delete Round (Double Click on Finished Round)
  const [advancingRoundPhase, setAdvancingRoundPhase] = useState(false);

  const handleAdvanceRoundPhase = async (targetPhase?: string) => {
    if (!selectedRound) return;
    if (selectedRound.supplementaryOpen) {
      setError('Đợt đồ án đang mở đăng ký bổ sung. Vui lòng kết thúc đợt đăng ký bổ sung trước khi chuyển giai đoạn!');
      return;
    }
    try {
      setAdvancingRoundPhase(true);
      setError(null);
      const updated = await apiService.advanceRoundPhase(selectedRound.roundId, targetPhase);
      setSelectedRound(updated);
      await loadRounds();
      setSuccessMsg(`⚡ Demo: Đã chuyển giai đoạn thành công cho đợt "${updated.name}" (${updated.roundCode})!`);
      window.dispatchEvent(new CustomEvent('utc-phase-change', { detail: { roundId: updated.roundId } }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi chuyển giai đoạn đợt đồ án');
    } finally {
      setAdvancingRoundPhase(false);
    }
  };

  const selectedRoundCurrentStage = selectedRound
    ? getRoundStageNumber(selectedRound.currentMilestone?.phaseType, selectedRound.status)
    : 1;
  const selectedRoundCurrentStageDef = STAGES.find((s) => s.stageNumber === selectedRoundCurrentStage);

  const [roundToDelete, setRoundToDelete] = useState<ProjectRoundItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDeleteRound = (status?: string) =>
    status === 'DRAFT' || status === 'CLOSED' || status === 'ARCHIVED';

  const handleDoubleClickRound = (r: ProjectRoundItem) => {
    if (!canDeleteRound(r.status)) return;
    setRoundToDelete(r);
    setDeleteError(null);
  };

  const handleConfirmDeleteRound = async () => {
    if (!roundToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await apiService.deleteProjectRound(roundToDelete.roundId);
      setSuccessMsg(`Đã xóa vĩnh viễn đợt đồ án "${roundToDelete.name}" (${roundToDelete.roundCode}) thành công!`);
      const deletedId = roundToDelete.roundId;
      setRoundToDelete(null);
      if (selectedArchivedRound?.roundId === deletedId) {
        setSelectedArchivedRound(null);
      }
      const remaining = rounds.filter(r => r.roundId !== deletedId);
      setRounds(remaining);
      if (selectedRound?.roundId === deletedId) {
        const remainingActives = remaining.filter(r => !isClosedStatus(r.status));
        if (remainingActives.length > 0) {
          loadRoundDetail(remainingActives[0].roundId);
        } else {
          setSelectedRound(null);
        }
      }
      await loadRounds();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa đợt đồ án';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
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

  const activeRounds = rounds.filter((r) => !isClosedStatus(r.status));
  const closedRounds = rounds.filter((r) => isClosedStatus(r.status));
  const archivedAcademicYears = Array.from(new Set(closedRounds.map((r) => r.academicYear).filter(Boolean)));
  const filteredClosedRounds = closedRounds.filter((r) => {
    const matchSearch =
      !archivedSearchQuery.trim() ||
      r.name.toLowerCase().includes(archivedSearchQuery.toLowerCase()) ||
      r.roundCode.toLowerCase().includes(archivedSearchQuery.toLowerCase());
    const matchYear = !archivedFilterYear || r.academicYear === archivedFilterYear;
    return matchSearch && matchYear;
  });

  return (
    <UTCAppLayout
      activeTab="project-rounds"
      hideHeroBanner={true}
      pageTitle="GĐ1: Quản trị Đợt đồ án & Mốc thời gian"
      onLogout={logout}
    >
      <div className="round-page-container">
        {/* Banner Alert Messages */}
        {loading && (
          <div style={{ padding: '10px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
            ⏳ Đang tải dữ liệu hệ thống...
          </div>
        )}
        {error ? (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
              title="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        ) : successMsg ? (
          <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span>✅ {successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              style={{ background: 'none', border: 'none', color: '#166534', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
              title="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Tab Switcher: Đợt đang hoạt động vs Kho lưu trữ các đợt đã đóng */}
        <div className="round-view-switcher">
          <button
            type="button"
            className={`round-view-switcher-btn ${viewMode === 'active' ? 'active-tab' : ''}`}
            onClick={() => {
              setViewMode('active');
              if (selectedRound && isClosedStatus(selectedRound.status)) {
                if (activeRounds.length > 0) {
                  loadRoundDetail(activeRounds[0].roundId);
                } else {
                  setSelectedRound(null);
                }
              }
            }}
          >
            <span>🟢 Đợt đồ án đang hoạt động</span>
            <span className="badge-count">{activeRounds.length}</span>
          </button>

          <button
            type="button"
            className={`round-view-switcher-btn ${viewMode === 'archived' ? 'active-tab' : ''}`}
            onClick={() => {
              setViewMode('archived');
              setSelectedArchivedRound(null);
            }}
          >
            <span>📁 Kho lưu trữ các đợt đã đóng</span>
            <span className="badge-count">{closedRounds.length}</span>
          </button>
        </div>

        {viewMode === 'active' ? (
          <>
            {/* Top Action Bar */}
        <div className="round-action-bar">
          <div className="round-filter-group">
            <input
              type="text"
              placeholder="Năm học (VD: 2026-2027)..."
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '220px' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Đợt đồ án đang hoạt động ({activeRounds.length})
              </h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#64748b' }}>
              💡 <em>Chọn đợt để theo dõi, thiết lập mốc và điều hành các giai đoạn đồ án</em>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '700px', overflowY: 'auto' }}>
              {activeRounds.length > 0 ? (
                activeRounds.map((r) => {
                  const badge = getStatusBadge(r.status);
                  const isSelected = selectedRound?.roundId === r.roundId;
                  const isDeletable = canDeleteRound(r.status);
                  return (
                    <div
                      key={r.roundId}
                      onClick={() => loadRoundDetail(r.roundId)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleDoubleClickRound(r);
                      }}
                      title={isDeletable ? 'Click 1 lần để xem chi tiết • Bấm nút Xóa để xóa đợt đồ án' : 'Click để xem chi tiết đợt đồ án'}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #0a3273' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eff6ff' : '#fff',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#0a3273', fontSize: '0.95rem' }}>{r.roundCode}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: '#0284c7',
                            color: '#ffffff'
                          }} title={`Đợt này đang ở Giai đoạn ${getRoundStageNumber(r.currentMilestone?.phaseType, r.status)}`}>
                            GĐ{getRoundStageNumber(r.currentMilestone?.phaseType, r.status)}
                          </span>
                          {isDeletable && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoundToDelete(r);
                                setDeleteError(null);
                              }}
                              title={`Xóa đợt đồ án ${r.roundCode}`}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{r.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {r.academicYear} • {r.semester} • CT: <strong>{r.trainingProgram || 'CU_NHAN'}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                  Hiện không có đợt đồ án nào đang hoạt động. Bấm "➕ Tạo Đợt Đồ Án Mới" để bắt đầu.
                </div>
              )}
            </div>

            {closedRounds.length > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '6px' }}>
                  📁 Có <strong>{closedRounds.length}</strong> đợt đồ án đã đóng
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('archived');
                    setSelectedArchivedRound(null);
                  }}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    color: '#0a3273',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Mở Kho lưu trữ đợt đã đóng →
                </button>
              </div>
            )}
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
                      {selectedRound.status === 'DRAFT' && (
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          🔑 Tài khoản SV sẽ được cấp khi Mở đợt (OPEN)
                        </span>
                      )}
                      {selectedRound.supplementaryOpen && (
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74' }}>
                          🔔 Đang mở ĐK bổ sung (Khóa chốt/chuyển đợt)
                        </span>
                      )}
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
                        disabled={Boolean(selectedRound.supplementaryOpen)}
                        onClick={() => {
                          if (selectedRound.supplementaryOpen) {
                            setError('Đợt đồ án đang mở đăng ký bổ sung. Vui lòng kết thúc đợt đăng ký bổ sung tại mục Phân công GVHD trước khi chuyển sang thực hiện!');
                            return;
                          }
                          openTransitionModal('IN_PROGRESS');
                        }}
                        title={selectedRound.supplementaryOpen ? 'Đang mở đăng ký bổ sung - Không thể chốt/chuyển đợt' : undefined}
                        style={{
                          backgroundColor: selectedRound.supplementaryOpen ? '#94a3b8' : '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: selectedRound.supplementaryOpen ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ⚡ Chuyển sang thực hiện
                      </button>
                    )}
                    {(selectedRound.status === 'OPEN' || selectedRound.status === 'IN_PROGRESS') && (
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen)}
                        onClick={() => {
                          if (selectedRound.supplementaryOpen) {
                            setError('Đợt đồ án đang mở đăng ký bổ sung. Vui lòng kết thúc đợt đăng ký bổ sung trước khi đóng đợt!');
                            return;
                          }
                          openTransitionModal('CLOSED');
                        }}
                        title={selectedRound.supplementaryOpen ? 'Đang mở đăng ký bổ sung - Không thể đóng đợt' : undefined}
                        style={{
                          backgroundColor: selectedRound.supplementaryOpen ? '#94a3b8' : '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: selectedRound.supplementaryOpen ? 'not-allowed' : 'pointer'
                        }}
                      >
                        🔒 Đóng đợt
                      </button>
                    )}

                    {canDeleteRound(selectedRound.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRoundToDelete(selectedRound);
                          setDeleteError(null);
                        }}
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Xóa đợt đồ án này"
                      >
                        🗑️ Xóa đợt
                      </button>
                    )}
                  </div>
                </div>

                {/* THANH ĐIỀU HÀNH GIAI ĐOẠN DEMO CỦA RIÊNG ĐỢT NÀY */}
                <div
                  className="utc-demo-control-bar admin-bar"
                  style={{
                    borderRadius: '8px',
                    margin: '16px 0 20px 0',
                    boxShadow: '0 2px 8px rgba(7, 25, 51, 0.15)',
                  }}
                >
                  <div className="utc-demo-info">
                    <span className="utc-demo-tag">⚡ ĐIỀU HÀNH ĐỢT NÀY</span>
                    <span className="utc-demo-round">
                      Mã đợt: <strong>{selectedRound.roundCode}</strong>
                    </span>
                    <span className="utc-demo-phase">
                      Giai đoạn hiện tại:{' '}
                      <strong className="phase-badge">
                        {selectedRoundCurrentStageDef?.name || `Giai đoạn ${selectedRoundCurrentStage}`}
                      </strong>
                    </span>
                    {selectedRound.supplementaryOpen && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #f59e0b',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⚠️ Đang mở ĐK bổ sung (Khóa chuyển GĐ)
                      </span>
                    )}
                  </div>
                  <div className="utc-demo-actions">
                    <button
                      className="utc-demo-btn primary"
                      onClick={() => handleAdvanceRoundPhase()}
                      disabled={advancingRoundPhase || Boolean(selectedRound.supplementaryOpen)}
                      title={
                        selectedRound.supplementaryOpen
                          ? 'Vui lòng kết thúc đợt đăng ký bổ sung trước khi chuyển giai đoạn'
                          : 'Demo: Kết thúc giai đoạn hiện tại của đợt này và chuyển sang giai đoạn tiếp theo'
                      }
                    >
                      {advancingRoundPhase ? '⏳ Đang chuyển...' : '⚡ Kết thúc GĐ & Chuyển tiếp theo'}
                    </button>
                    <div className="utc-demo-quick-jumps">
                      <span className="jump-label">Chuyển nhanh:</span>
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen) || advancingRoundPhase}
                        className={`jump-btn ${selectedRoundCurrentStage === 1 ? 'active' : ''}`}
                        onClick={() => handleAdvanceRoundPhase('DRAFT')}
                        title="Chuyển đợt này về GĐ1 (DRAFT)"
                      >
                        GĐ1
                      </button>
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen) || advancingRoundPhase}
                        className={`jump-btn ${selectedRoundCurrentStage === 2 ? 'active' : ''}`}
                        onClick={() => handleAdvanceRoundPhase('REGISTRATION')}
                        title="Chuyển đợt này về GĐ2 (REGISTRATION)"
                      >
                        GĐ2
                      </button>
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen) || advancingRoundPhase}
                        className={`jump-btn ${selectedRoundCurrentStage === 3 ? 'active' : ''}`}
                        onClick={() => handleAdvanceRoundPhase('PROPOSAL_SUBMISSION')}
                        title="Chuyển đợt này về GĐ3 (PROPOSAL_SUBMISSION)"
                      >
                        GĐ3
                      </button>
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen) || advancingRoundPhase}
                        className={`jump-btn ${selectedRoundCurrentStage === 4 ? 'active' : ''}`}
                        onClick={() => handleAdvanceRoundPhase('WEEKLY_REPORT')}
                        title="Chuyển đợt này về GĐ4 (WEEKLY_REPORT)"
                      >
                        GĐ4
                      </button>
                      <button
                        disabled={Boolean(selectedRound.supplementaryOpen) || advancingRoundPhase}
                        className={`jump-btn ${selectedRoundCurrentStage === 5 ? 'active' : ''}`}
                        onClick={() => handleAdvanceRoundPhase('DEFENSE')}
                        title="Chuyển đợt này về GĐ5 (DEFENSE)"
                      >
                        GĐ5
                      </button>
                    </div>
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
                    👥 Danh sách sinh viên & Import Excel
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
                    trainingProgram={selectedRound.trainingProgram}
                    trainingProgramName={selectedRound.trainingProgramName}
                    isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
                  />
                ) : roundActiveTab === 'lecturers' ? (
                  <RoundLecturersTab
                    roundId={selectedRound.roundId}
                    roundName={selectedRound.name}
                    roundCode={selectedRound.roundCode}
                    isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
                    onRefresh={loadRounds}
                  />
                ) : (
                  <div>
                    {/* Timeline Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>Các mốc thời gian (Timeline)</h3>
                      </div>
                      {selectedRound.status !== 'CLOSED' && selectedRound.status !== 'ARCHIVED' ? (
                        <button
                          onClick={handleOpenAddMilestoneModal}
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
      </>
    ) : (
      /* VIEW MODE: ARCHIVED (KHO LƯU TRỮ CÁC ĐỢT ĐÃ ĐÓNG) */
      <div>
        {!selectedArchivedRound ? (
          /* Danh sách tổng quan các đợt đã đóng */
          <div className="archived-hub-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0a3273', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📁</span>
                  <span>Kho Lưu Trữ Các Đợt Đồ Án Đã Kết Thúc (Archived Hub)</span>
                </h2>
                <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Lưu trữ các đợt đồ án đã hoàn thành bảo vệ hoặc đã đóng. Toàn bộ hồ sơ học vụ, điểm số và kết quả phân công được bảo lưu an toàn ở chế độ chỉ đọc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode('active');
                  if (activeRounds.length > 0) loadRoundDetail(activeRounds[0].roundId);
                  else setSelectedRound(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0a3273',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ← Quay lại Đợt đang hoạt động ({activeRounds.length})
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="archived-kpi-grid">
              <div className="archived-kpi-card">
                <div className="kpi-label">Tổng số đợt lưu trữ</div>
                <div className="kpi-val">{closedRounds.length} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>đợt đồ án</span></div>
              </div>
              <div className="archived-kpi-card">
                <div className="kpi-label">Các năm học lưu trữ</div>
                <div className="kpi-val" style={{ fontSize: '1.1rem', color: '#334155' }}>
                  {archivedAcademicYears.length > 0 ? archivedAcademicYears.join(', ') : 'Chưa có'}
                </div>
              </div>
              <div className="archived-kpi-card">
                <div className="kpi-label">Chế độ bảo mật học vụ</div>
                <div className="kpi-val" style={{ fontSize: '1.1rem', color: '#166534' }}>
                  🔒 100% Khóa bảo lưu an toàn
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input
                type="text"
                placeholder="🔍 Tìm kiếm theo mã hoặc tên đợt đã đóng..."
                value={archivedSearchQuery}
                onChange={(e) => setArchivedSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
              <select
                value={archivedFilterYear}
                onChange={(e) => setArchivedFilterYear(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
              >
                <option value="">-- Tất cả năm học --</option>
                {archivedAcademicYears.map(yr => (
                  <option key={yr} value={yr}>Năm học {yr}</option>
                ))}
              </select>
              {(archivedSearchQuery || archivedFilterYear) && (
                <button
                  type="button"
                  onClick={() => {
                    setArchivedSearchQuery('');
                    setArchivedFilterYear('');
                  }}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  ✕ Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Table: Danh sách các đợt đã đóng */}
            {filteredClosedRounds.length > 0 ? (
              <div className="round-table-wrapper">
                <table className="archived-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '130px' }}>Mã đợt</th>
                      <th>Tên đợt đồ án</th>
                      <th style={{ width: '140px' }}>Năm học &amp; HK</th>
                      <th style={{ width: '130px' }}>Chương trình</th>
                      <th style={{ width: '110px' }}>Giai đoạn</th>
                      <th style={{ width: '110px' }}>Trạng thái</th>
                      <th style={{ width: '240px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClosedRounds.map((r, idx) => {
                      const badge = getStatusBadge(r.status);
                      return (
                        <tr key={r.roundId}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0a3273', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
                              {r.roundCode}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.name}</div>
                            {r.description && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{r.description}</div>}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{r.academicYear}</span>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.semester}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                              {r.trainingProgram || 'CU_NHAN'}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#0284c7',
                              color: '#ffffff'
                            }}>
                              GĐ{getRoundStageNumber(r.currentMilestone?.phaseType, r.status)}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.color
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArchivedRound(r);
                                  loadRoundDetail(r.roundId);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Xem hồ sơ lưu trữ chi tiết của đợt này"
                              >
                                👁️ Xem hồ sơ
                              </button>
                              <button
                                type="button"
                                onClick={() => setReopeningRound(r)}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Mở lại đợt đồ án này và chuyển về danh sách hoạt động"
                              >
                                🔓 Mở lại
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRoundToDelete(r);
                                  setDeleteError(null);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Xóa vĩnh viễn đợt đồ án này"
                              >
                                🗑️ Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                {closedRounds.length === 0 ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#334155', marginBottom: '6px' }}>
                      Chưa có đợt đồ án nào được đóng hoặc lưu trữ
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      Khi đợt đồ án hoàn tất bảo vệ và bạn chọn "🔒 Đóng đợt", đợt đồ án sẽ tự động được lưu trữ an toàn tại trang này.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontWeight: 600, color: '#334155' }}>
                      Không tìm thấy đợt đồ án nào phù hợp với điều kiện tìm kiếm.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Chi tiết hồ sơ đợt đã đóng được chọn */
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Back to Archived list button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedArchivedRound(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#0a3273',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ← Quay lại Kho lưu trữ ({closedRounds.length} đợt)
              </button>
              <span style={{ color: '#94a3b8' }}>/</span>
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                Hồ sơ lưu trữ: {selectedArchivedRound.name} ({selectedArchivedRound.roundCode})
              </span>
            </div>

            {/* Banner Thông Báo Đợt Đã Đóng & Chế Độ Lưu Trữ */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.6rem' }}>📁🔒</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.98rem' }}>
                    HỒ SƠ LƯU TRỮ ĐỢT ĐỒ ÁN ĐÃ KẾT THÚC
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '3px' }}>
                    Đợt đồ án này đã đóng. Toàn bộ hồ sơ học vụ sinh viên, phân công giảng viên và mốc thời gian được bảo lưu ở chế độ chỉ đọc (Read-only).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReopeningRound(selectedArchivedRound)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Mở lại đợt đồ án này và chuyển về danh sách hoạt động"
                >
                  🔓 Mở lại đợt này
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoundToDelete(selectedArchivedRound);
                    setDeleteError(null);
                  }}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🗑️ Xóa vĩnh viễn
                </button>
              </div>
            </div>

            {/* Round Details Header */}
            <div className="round-detail-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, color: '#0a3273', fontSize: '1.35rem' }}>{selectedArchivedRound.name}</h2>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    backgroundColor: getStatusBadge(selectedArchivedRound.status).bg,
                    color: getStatusBadge(selectedArchivedRound.status).color
                  }}>
                    {getStatusBadge(selectedArchivedRound.status).label}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: '#0284c7',
                    color: '#ffffff'
                  }}>
                    GĐ5: Hoàn tất đồ án
                  </span>
                </div>
                <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Mã đợt: <strong>{selectedArchivedRound.roundCode}</strong> • Năm học: {selectedArchivedRound.academicYear} • {selectedArchivedRound.semester} • Chương trình: <strong>{selectedArchivedRound.trainingProgramName || selectedArchivedRound.trainingProgram}</strong>
                </p>
              </div>
            </div>

            {/* Tab Switcher for Archived Round */}
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
                👥 Danh sách sinh viên & Học vụ
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
                🗓️ Mốc thời gian (Timeline) ({selectedArchivedRound.milestones?.length || 0})
              </button>
            </div>

            {roundActiveTab === 'students' ? (
              <RoundStudentsTab
                roundId={selectedArchivedRound.roundId}
                roundName={selectedArchivedRound.name}
                roundCode={selectedArchivedRound.roundCode}
                trainingProgram={selectedArchivedRound.trainingProgram}
                trainingProgramName={selectedArchivedRound.trainingProgramName}
                isRoundClosed={true}
              />
            ) : roundActiveTab === 'lecturers' ? (
              <RoundLecturersTab
                roundId={selectedArchivedRound.roundId}
                roundName={selectedArchivedRound.name}
                roundCode={selectedArchivedRound.roundCode}
                isRoundClosed={true}
                onRefresh={loadRounds}
              />
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Các mốc thời gian đã diễn ra (Timeline)</h3>
                  <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                    🔒 Đợt đã đóng (Chỉ đọc)
                  </span>
                </div>

                {selectedArchivedRound.milestones && selectedArchivedRound.milestones.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedArchivedRound.milestones.map((m, idx) => (
                      <div
                        key={m.milestoneId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#64748b',
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
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                              🗓️ {new Date(m.startDate).toLocaleDateString('vi-VN')} → {new Date(m.endDate).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#475569', fontWeight: 500, border: '1px dashed #94a3b8', borderRadius: '8px' }}>
                    Không có mốc thời gian nào được ghi nhận cho đợt đồ án này.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )}

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngày bắt đầu *</label>
                    <VnDateTimePicker
                      required
                      value={newMilestone.startDate}
                      onChange={(val) => setNewMilestone((prev) => ({ ...prev, startDate: val }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngày kết thúc *</label>
                    <VnDateTimePicker
                      required
                      value={newMilestone.endDate}
                      onChange={(val) => setNewMilestone((prev) => ({ ...prev, endDate: val }))}
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

        {/* Modal Confirm Delete Project Round */}
        {roundToDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px',
              width: '540px',
              maxWidth: '92vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🗑️
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.25rem' }}>
                    Xác nhận xóa đợt đồ án
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Thao tác này áp dụng cho đợt đồ án ở trạng thái Bản nháp hoặc Đã kết thúc
                  </span>
                </div>
              </div>

              {deleteError && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  marginBottom: '16px'
                }}>
                  {deleteError}
                </div>
              )}

              <p style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.5 }}>
                Bạn có muốn xóa đợt đồ án <strong>({roundToDelete.status === 'DRAFT' ? 'đang ở trạng thái Bản nháp' : 'đợt đã kết thúc'})</strong> này không?
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '18px',
                fontSize: '0.88rem'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Tên đợt: </span>
                  <strong style={{ color: '#0f172a' }}>{roundToDelete.name}</strong>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Mã đợt: </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0a3273' }}>{roundToDelete.roundCode}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Năm học - Học kỳ: </span>
                  <strong>{roundToDelete.academicYear} • {roundToDelete.semester}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Trạng thái: </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: getStatusBadge(roundToDelete.status).bg,
                    color: getStatusBadge(roundToDelete.status).color
                  }}>
                    {getStatusBadge(roundToDelete.status).label}
                  </span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '0.82rem',
                color: '#92400e',
                lineHeight: 1.4
              }}>
                ⚠️ <strong>Lưu ý:</strong> Toàn bộ dữ liệu liên quan đến đợt đồ án này sẽ bị xóa khỏi hệ thống và <strong>không thể phục hồi</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRoundToDelete(null)}
                  disabled={deleteLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteRound}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 22px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    opacity: deleteLoading ? 0.7 : 1,
                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  {deleteLoading ? 'Đang xóa...' : '🗑️ Xác nhận xóa đợt'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal Confirm Reopen Project Round */}
        {reopeningRound && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px',
              width: '520px',
              maxWidth: '92vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🔓
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#166534', fontSize: '1.25rem' }}>
                    Xác nhận mở lại đợt đồ án
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Đưa đợt đồ án từ kho lưu trữ trở lại danh sách hoạt động
                  </span>
                </div>
              </div>

              <p style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn mở lại đợt đồ án <strong>"{reopeningRound.name}"</strong>?
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '18px',
                fontSize: '0.88rem'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Mã đợt: </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0a3273' }}>{reopeningRound.roundCode}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Năm học - Học kỳ: </span>
                  <strong>{reopeningRound.academicYear} • {reopeningRound.semester}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Chương trình: </span>
                  <strong>{reopeningRound.trainingProgram || 'CU_NHAN'}</strong>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '0.82rem',
                color: '#15803d',
                lineHeight: 1.4
              }}>
                ℹ️ <strong>Lưu ý:</strong> Sau khi mở lại, đợt đồ án sẽ được chuyển sang trạng thái <strong>ĐANG MỞ (OPEN)</strong> và tự động chuyển về trang <strong>Đợt đồ án đang hoạt động</strong> để tiếp tục quản trị và điều hành.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReopeningRound(null)}
                  disabled={reopenLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    cursor: reopenLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={reopenLoading}
                  onClick={handleConfirmReopen}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 22px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: reopenLoading ? 'not-allowed' : 'pointer',
                    opacity: reopenLoading ? 0.7 : 1,
                    boxShadow: '0 1px 2px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  {reopenLoading ? 'Đang mở lại...' : '🔓 Xác nhận mở lại'}
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
