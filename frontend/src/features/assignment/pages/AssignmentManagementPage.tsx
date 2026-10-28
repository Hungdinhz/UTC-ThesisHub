import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProjectRoundItem } from '../../../types';
import type {
  ProjectDirection,
  LecturerCapacity,
  DirectionRegistration,
  PreferenceResponse,
  SupervisorAssignment,
  AssignmentStats,
} from '../types';
import { assignmentService } from '../services/assignmentService';
import { AssignmentStatsOverview } from '../components/AssignmentStatsOverview';
import { AssignmentProposalTable } from '../components/AssignmentProposalTable';
import { LecturerCapacityManager } from '../components/LecturerCapacityManager';
import { DirectionRegistrationList } from '../components/DirectionRegistrationList';
import { PreferenceList } from '../components/PreferenceList';
import '../assignment.css';

interface Props {
  projectRoundId?: number;
}

export const AssignmentManagementPage: React.FC<Props> = ({ projectRoundId: propRoundId }) => {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin';
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(propRoundId || null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'capacities' | 'registrations' | 'preferences'>('proposals');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  // Data states
  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [capacities, setCapacities] = useState<LecturerCapacity[]>([]);
  const [registrations, setRegistrations] = useState<DirectionRegistration[]>([]);
  const [preferences, setPreferences] = useState<PreferenceResponse[]>([]);
  const [proposals, setProposals] = useState<SupervisorAssignment[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);

  // Finalize Confirmation Form Modal states
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeNote, setFinalizeNote] = useState('Chốt kết quả phân công giảng viên hướng dẫn chính thức');

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // 1. Fetch project rounds list
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const roundList = await apiService.getProjectRounds();
        setRounds(roundList || []);
        if (!propRoundId && roundList && roundList.length > 0) {
          const activeRound =
            roundList.find((r) => r.status === 'OPEN') ||
            roundList.find((r) => r.status === 'IN_PROGRESS') ||
            roundList.find((r) => r.currentMilestone?.phaseType === 'REGISTRATION') ||
            roundList[0];
          setSelectedRoundId(activeRound.roundId);
        }
      } catch (err) {
        console.error('Failed to load project rounds in AssignmentManagementPage:', err);
        if (!selectedRoundId) {
          setSelectedRoundId(propRoundId || 1);
        }
      }
    };
    fetchRounds();
  }, [propRoundId]);

  const effectiveRoundId = selectedRoundId || propRoundId || 1;
  const currentRound = rounds.find((r) => r.roundId === effectiveRoundId);
  const isRoundClosed = currentRound?.status === 'CLOSED' || currentRound?.status === 'ARCHIVED';
  const isSupplementaryOpen = Boolean(stats?.supplementaryOpen ?? currentRound?.supplementaryOpen);

  const isFinalized =
    (proposals.length > 0 && proposals.every((p) => p.status === 'FINALIZED')) ||
    Boolean(stats?.finalizedCount && proposals.length > 0 && stats.finalizedCount === proposals.length);

  const loadAllData = useCallback(async (roundIdToLoad?: number) => {
    const targetRoundId = roundIdToLoad || effectiveRoundId;
    if (!targetRoundId) return;

    try {
      setLoading(true);
      const [dirsData, capsData, regsData, prefsData, propsData, statsData] = await Promise.all([
        assignmentService.getDirections(),
        assignmentService.getCapacities(targetRoundId),
        assignmentService.getRegistrations(targetRoundId),
        assignmentService.getPreferences(targetRoundId),
        assignmentService.getProposals(targetRoundId),
        assignmentService.getStats(targetRoundId),
      ]);

      const sortedRegs = (regsData || []).slice().sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      const sortedPrefs = (prefsData || []).slice().sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      const sortedProps = (propsData || []).slice().sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );

      setDirections(dirsData || []);
      setCapacities(capsData || []);
      setRegistrations(sortedRegs);
      setPreferences(sortedPrefs);
      setProposals(sortedProps);
      setStats(statsData || null);
    } catch {
      setAlert({
        type: 'danger',
        message: 'Không thể tải toàn bộ dữ liệu phân công cho đợt này. Vui lòng kiểm tra kết nối máy chủ.',
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveRoundId]);

  useEffect(() => {
    if (effectiveRoundId) {
      loadAllData(effectiveRoundId);
    }
  }, [effectiveRoundId, loadAllData]);

  // Execute Algorithm: POST /assignments/generate
  const handleGenerate = async () => {
    if (isRoundClosed) {
      setAlert({
        type: 'warning',
        message: 'Đợt đồ án này đã đóng. Không thể chạy thuật toán phân công.',
      });
      return;
    }

    if (isFinalized) {
      if (!window.confirm('Đợt đồ án này đã được chốt phân công. Bạn có chắc muốn chạy lại thuật toán phân công đề xuất?')) {
        return;
      }
    }

    try {
      setActionLoading(true);
      setAlert(null);
      const generated = await assignmentService.generateAssignments(effectiveRoundId, true);
      setProposals(generated);
      const updatedStats = await assignmentService.getStats(effectiveRoundId);
      setStats(updatedStats);
      const updatedCapacities = await assignmentService.getCapacities(effectiveRoundId);
      setCapacities(updatedCapacities);

      setAlert({
        type: 'success',
        message: `Thuật toán phân công đã thực thi thành công! Đã sinh phương án cho ${generated.length} sinh viên trong đợt ${currentRound?.name || effectiveRoundId}.`,
      });
      setActiveTab('proposals');
    } catch {
      setAlert({
        type: 'danger',
        message: 'Có lỗi xảy ra khi thực thi thuật toán phân công.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Override: PUT /assignments/{id}/override
  const handleOverride = async (assignmentId: number, newLecturerId: number, reason: string) => {
    if (isRoundClosed) {
      setAlert({
        type: 'warning',
        message: 'Đợt đồ án này đã đóng. Không thể điều chuyển giảng viên.',
      });
      return;
    }
    try {
      setAlert(null);
      await assignmentService.overrideAssignment(assignmentId, newLecturerId, reason);
      // Reload proposals and capacities
      const [updatedProps, updatedCaps, updatedStats] = await Promise.all([
        assignmentService.getProposals(effectiveRoundId),
        assignmentService.getCapacities(effectiveRoundId),
        assignmentService.getStats(effectiveRoundId),
      ]);
      setProposals(updatedProps);
      setCapacities(updatedCaps);
      setStats(updatedStats);

      setAlert({
        type: 'success',
        message: 'Điều chuyển giảng viên hướng dẫn (Override) thành công!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi override giảng viên.';
      setAlert({ type: 'danger', message: msg });
      throw err;
    }
  };

  // Open Finalize Confirmation Modal Form
  const handleFinalize = () => {
    if (isRoundClosed) {
      setAlert({
        type: 'warning',
        message: 'Đợt đồ án này đã đóng. Không thể chốt kết quả phân công.',
      });
      return;
    }

    if (isFinalized) {
      setAlert({
        type: 'warning',
        message: 'Đợt đồ án này đã được chốt phân công chính thức rồi.',
      });
      return;
    }

    if (proposals.length === 0) {
      setAlert({
        type: 'warning',
        message: 'Chưa có phương án phân công để chốt. Vui lòng chạy thuật toán đề xuất trước.',
      });
      return;
    }

    setFinalizeNote(`Chốt kết quả phân công GVHD chính thức cho đợt ${currentRound?.roundCode || effectiveRoundId}`);
    setShowFinalizeModal(true);
  };

  // Submit Finalize Form: POST /assignments/finalize
  const handleConfirmFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setAlert(null);
      const finalStats = await assignmentService.finalizeAssignments(effectiveRoundId, finalizeNote);
      setStats(finalStats);
      const updatedProps = await assignmentService.getProposals(effectiveRoundId);
      setProposals(updatedProps);
      setShowFinalizeModal(false);

      const droppedText =
        finalStats?.droppedCount && finalStats.droppedCount > 0
          ? ` Đã loại ${finalStats.droppedCount} sinh viên chưa đăng ký khỏi đợt đồ án.`
          : '';

      setAlert({
        type: 'success',
        message: `Khoa đã CHỐT thành công kết quả phân công Giảng viên hướng dẫn cho đợt ${currentRound?.name || effectiveRoundId}!${droppedText}`,
      });
    } catch {
      setAlert({
        type: 'danger',
        message: 'Lỗi khi chốt kết quả phân công.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Mở đợt đăng ký bổ sung cho các sinh viên chưa đăng ký
  const handleOpenSupplementary = async () => {
    if (isRoundClosed || !isAdmin) return;
    if (!window.confirm('Bạn có chắc chắn muốn mở ĐỢT ĐĂNG KÝ BỔ SUNG cho các sinh viên chưa đăng ký nguyện vọng trong đợt đồ án này?')) {
      return;
    }
    try {
      setActionLoading(true);
      setAlert(null);
      const updatedStats = await assignmentService.openSupplementaryRegistration(effectiveRoundId);
      setStats({ ...updatedStats, supplementaryOpen: true });
      const refreshedRounds = await apiService.getProjectRounds();
      setRounds(refreshedRounds || []);
      const countInfo = updatedStats?.supplementaryCount !== undefined
        ? ` (Đã mở lại và gửi thông báo cho ${updatedStats.supplementaryCount} sinh viên chưa đăng ký)`
        : '';
      setAlert({
        type: 'success',
        message: `🔔 THÔNG BÁO: Đã mở Đợt đăng ký bổ sung thành công!${countInfo}. Lưu ý: Trong thời gian mở đăng ký bổ sung, không thể bấm chốt/kết thúc đợt cho tới khi bấm "Kết thúc ĐK bổ sung".`,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setAlert({
        type: 'danger',
        message: 'Có lỗi xảy ra khi mở đợt đăng ký bổ sung.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Chốt đợt đăng ký bổ sung & Xóa hẳn sinh viên không đăng ký khỏi đợt
  const handleFinalizeSupplementary = async () => {
    if (isRoundClosed || !isAdmin) return;
    if (!isSupplementaryOpen) {
      setAlert({
        type: 'warning',
        message: 'Hiện tại đợt đồ án chưa mở đăng ký bổ sung nên không thể bấm Kết thúc ĐK bổ sung.',
      });
      return;
    }
    if (
      !window.confirm(
        'XÁC NHẬN CHỐT ĐỢT ĐĂNG KÝ BỔ SUNG:\n\n- Các sinh viên đã đăng ký bổ sung sẽ được phân công GVHD.\n- Các sinh viên VẪN CHƯA ĐĂNG KÝ sẽ bị XÓA HOÀN TOÀN khỏi đợt đồ án (không còn trong danh sách đợt nữa).\n\nBạn có chắc chắn muốn thực hiện?'
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      setAlert(null);
      const updatedStats = await assignmentService.finalizeSupplementaryRegistration(effectiveRoundId);
      setStats({ ...updatedStats, supplementaryOpen: false });
      const [updatedProps, updatedCaps, updatedRegs, updatedPrefs, refreshedRounds] = await Promise.all([
        assignmentService.getProposals(effectiveRoundId),
        assignmentService.getCapacities(effectiveRoundId),
        assignmentService.getRegistrations(effectiveRoundId),
        assignmentService.getPreferences(effectiveRoundId),
        apiService.getProjectRounds(),
      ]);
      setProposals(updatedProps);
      setCapacities(updatedCaps);
      setRegistrations(updatedRegs);
      setPreferences(updatedPrefs);
      setRounds(refreshedRounds || []);
      setAlert({
        type: 'success',
        message: '✅ Đã kết thúc Đợt đăng ký bổ sung thành công! Các sinh viên đăng ký bổ sung đã được gán GVHD và các sinh viên không đăng ký đã bị xóa khỏi đợt đồ án.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setAlert({
        type: 'danger',
        message: 'Có lỗi xảy ra khi chốt đợt đăng ký bổ sung.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Lecturer Capacity
  const handleUpdateCapacity = async (id: number, data: Partial<LecturerCapacity>) => {
    if (isRoundClosed) {
      setAlert({
        type: 'warning',
        message: 'Đợt đồ án này đã đóng. Không thể cập nhật chỉ tiêu giảng viên.',
      });
      return;
    }
    await assignmentService.updateCapacity(id, data);
    const updatedCaps = await assignmentService.getCapacities(effectiveRoundId);
    setCapacities(updatedCaps);
    const updatedStats = await assignmentService.getStats(effectiveRoundId);
    setStats(updatedStats);
    setAlert({
      type: 'success',
      message: 'Cập nhật chỉ tiêu năng lực giảng viên thành công.',
    });
  };

  return (
    <div className="assignment-container">
      {/* Top Header */}
      <div className="assignment-header">
        <div className="assignment-header-title">
          <h2>
            <span>🎓</span> Phân công Giảng viên hướng dẫn (Module Assignment)
          </h2>
          <p>
            Quy trình ghép nối nguyện vọng, kiểm soát capacity, tối ưu thuật toán và can thiệp thủ công
            {currentRound && (
              <span style={{ display: 'block', marginTop: '6px', color: '#0369a1', fontWeight: 600 }}>
                📌 Đang phân công cho: <strong>{currentRound.name}</strong> ({currentRound.roundCode}) — Năm học {currentRound.academicYear} ({currentRound.semester})
              </span>
            )}
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="btn-secondary-action"
            onClick={() => loadAllData(effectiveRoundId)}
            disabled={loading || actionLoading}
            title="Làm mới dữ liệu từ máy chủ"
          >
            🔄 Tải lại
          </button>

          {isAdmin && (
            <>
              <button
                className="btn-generate-algo"
                onClick={handleGenerate}
                disabled={actionLoading || loading || isRoundClosed}
                title={isRoundClosed ? 'Đợt đồ án đã đóng - Không thể chạy phân công' : undefined}
              >
                ⚡ {actionLoading ? 'Đang tính toán...' : 'Chạy thuật toán phân công'}
              </button>

              <button
                className="btn-finalize-action"
                onClick={handleFinalize}
                disabled={actionLoading || loading || proposals.length === 0 || isRoundClosed || isFinalized || isSupplementaryOpen}
                style={isFinalized || isSupplementaryOpen ? { opacity: 0.7, cursor: 'not-allowed', background: isSupplementaryOpen ? '#94a3b8' : '#059669' } : undefined}
                title={
                  isSupplementaryOpen
                    ? 'Đang mở đăng ký bổ sung - Vui lòng kết thúc ĐK bổ sung trước khi chốt'
                    : isFinalized
                    ? 'Đã chốt phân công chính thức - Nút đã bị khóa'
                    : isRoundClosed
                    ? 'Đợt đồ án đã đóng - Không thể chốt kết quả'
                    : undefined
                }
              >
                {isSupplementaryOpen
                  ? '🔒 Đang mở ĐK bổ sung (Khóa chốt)'
                  : isFinalized
                  ? '✅ Đã chốt chính thức (Đã khóa)'
                  : '🔒 Chốt kết quả phân công'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Project Round Banner & Selector */}
      <div className="assignment-round-control-card">
        <div className="round-control-left">
          <div className="round-icon-badge">🎯</div>
          <div className="round-info-content">
            <div className="round-label-row">
              <span className="round-context-label">ĐANG PHÂN CÔNG CHO ĐỢT ĐỒ ÁN:</span>
              {currentRound?.status && (
                <span className={`round-status-pill status-${currentRound.status.toLowerCase()}`}>
                  ● {currentRound.status === 'OPEN' ? 'Đang mở (OPEN)' : currentRound.status === 'IN_PROGRESS' ? 'Đang diễn ra' : currentRound.status}
                </span>
              )}
              {currentRound?.trainingProgram && (
                <span className="round-meta-pill program-pill">
                  🎓 {currentRound.trainingProgram === 'KY_SU' ? 'Hệ Kỹ sư' : 'Hệ Cử nhân'}
                </span>
              )}
            </div>
            <div className="round-title-row">
              <h3 className="current-round-heading">
                {currentRound?.name || `Đợt đồ án #${effectiveRoundId}`}
              </h3>
              <span className="round-code-badge">{currentRound?.roundCode || `DA_${effectiveRoundId}`}</span>
            </div>
            <div className="round-meta-row">
              <span>📅 <strong>Năm học:</strong> {currentRound?.academicYear || '2026-2027'}</span>
              <span className="meta-divider">•</span>
              <span>⏰ <strong>Học kỳ:</strong> {currentRound?.semester || 'HK1'}</span>
              {currentRound?.currentMilestone && (
                <>
                  <span className="meta-divider">•</span>
                  <span className="milestone-text">
                    🚩 <strong>Mốc:</strong> {currentRound.currentMilestone.name || 'Giai đoạn 2: Phân công GVHD'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="round-control-right">
          <label htmlFor="admin-round-select" className="round-select-label">
            Chọn đợt đồ án cần phân công:
          </label>
          {rounds.length > 0 ? (
            <select
              id="admin-round-select"
              className="round-select-dropdown"
              value={effectiveRoundId}
              onChange={(e) => {
                const newRoundId = Number(e.target.value);
                setSelectedRoundId(newRoundId);
              }}
            >
              {rounds.map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  [{r.roundCode}] {r.name} ({r.academicYear || '2026-2027'} - {r.semester || 'HK1'})
                </option>
              ))}
            </select>
          ) : (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang tải danh sách đợt đồ án...</span>
          )}
        </div>
      </div>

      {/* Top Immediate Alert Banner */}
      {alert && (
        <div
          className={`alert-box alert-${alert.type}`}
          style={{
            marginBottom: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            borderWidth: '1.5px',
          }}
        >
          {alert.message}
          <button
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            onClick={() => setAlert(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Prominent Supplementary Registration Active Banner */}
      {isSupplementaryOpen && !isRoundClosed && (
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '2px solid #fb923c',
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#9a3412',
            boxShadow: '0 2px 10px rgba(234, 88, 12, 0.12)',
          }}
        >
          <span style={{ fontSize: '1.7rem' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
              ĐỢT ĐĂNG KÝ NGUYỆN VỌNG BỔ SUNG ĐANG MỞ
            </strong>
            <span style={{ fontSize: '0.9rem' }}>
              Hệ thống đã gửi thông báo cho các sinh viên chưa đăng ký vào hoàn tất nguyện vọng. Trong thời gian mở đăng ký bổ sung, chức năng <strong>Chốt đợt / Chuyển giai đoạn</strong> tạm khóa cho đến khi Khoa bấm <strong>"🔒 Kết thúc ĐK bổ sung & Xóa SV không ĐK khỏi đợt"</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Closed Round Alert Banner */}
      {isRoundClosed && (
        <div
          className="alert-box alert-warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🔒</span>
          <div>
            <strong>Đợt đồ án đã đóng hoặc đã lưu trữ (Chế độ chỉ xem):</strong> Mọi thao tác ghi danh, phân công thuật toán, chốt kết quả, override và chỉnh sửa chỉ tiêu capacity đã bị khóa đối với đợt này.
          </div>
        </div>
      )}

      {/* Persistent Finalized Success Banner (Hiển thị cố định trên màn hình, không phải toast) */}
      {isFinalized && (
        <div
          className="assignment-finalized-banner"
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>✅</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, color: '#166534', fontSize: '1.05rem', fontWeight: 700 }}>
                ĐÃ CHỐT PHÂN CÔNG GIẢNG VIÊN HƯỚNG DẪN THÀNH CÔNG (FINALIZED)
              </h4>
              <span
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                CHÍNH THỨC
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', color: '#15803d', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Kết quả phân công Giảng viên hướng dẫn cho đợt <strong>{currentRound?.name || effectiveRoundId}</strong> đã được chốt và lưu chính thức vào cơ sở dữ liệu. Toàn bộ {proposals.length} sinh viên đã được bàn giao cho các Giảng viên để chuẩn bị bước sang <strong>Giai đoạn 3 (Đề cương & Duyệt đề tài)</strong>. Nút chốt kết quả phân công đã được khóa, tuy nhiên Khoa vẫn có thể bấm nút <strong>"✏️ Sửa phân công"</strong> ở từng sinh viên bên dưới để điều chỉnh thủ công nếu cần.
              {stats?.droppedCount && stats.droppedCount > 0 ? (
                <span style={{ display: 'block', marginTop: '4px', color: '#b91c1c', fontWeight: 600 }}>
                  ⚠️ Đã loại {stats.droppedCount} sinh viên không đăng ký nguyện vọng khỏi đợt đồ án theo quy chế.
                </span>
              ) : null}
            </p>
            {isAdmin && !isRoundClosed && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleOpenSupplementary}
                  disabled={actionLoading || loading || isSupplementaryOpen}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b',
                    backgroundColor: isSupplementaryOpen ? '#fed7aa' : '#fffbeb',
                    color: '#b45309',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: actionLoading || isSupplementaryOpen ? 'not-allowed' : 'pointer',
                    opacity: isSupplementaryOpen ? 0.75 : 1,
                  }}
                >
                  {isSupplementaryOpen ? '🔔 Đang mở đợt đăng ký bổ sung...' : '🔓 Mở đợt đăng ký bổ sung (Cho SV chưa ĐK)'}
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeSupplementary}
                  disabled={actionLoading || loading || !isSupplementaryOpen}
                  title={!isSupplementaryOpen ? 'Chỉ bấm được khi đang mở đợt đăng ký bổ sung' : undefined}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #dc2626',
                    backgroundColor: !isSupplementaryOpen ? '#f1f5f9' : '#fef2f2',
                    color: !isSupplementaryOpen ? '#94a3b8' : '#b91c1c',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: actionLoading || !isSupplementaryOpen ? 'not-allowed' : 'pointer',
                  }}
                >
                  🔒 Kết thúc ĐK bổ sung & Xóa SV không ĐK khỏi đợt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Overview */}
      <AssignmentStatsOverview stats={stats} loading={loading} />

      {/* Tab Navigation */}
      <div className="assignment-nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          <span>📋 Kết quả phân công & Override</span>
          <span className="tab-badge">{proposals.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'capacities' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacities')}
        >
          <span>📊 Năng lực & Chỉ tiêu GV</span>
          <span className="tab-badge">{capacities.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          <span>👥 Sinh viên đăng ký hướng</span>
          <span className="tab-badge">{registrations.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <span>⭐ Danh sách nguyện vọng NV1-NV3</span>
          <span className="tab-badge">{preferences.length}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'proposals' && (
        <AssignmentProposalTable
          assignments={proposals}
          capacities={capacities}
          onOverride={handleOverride}
          isFinalized={isFinalized}
          loading={loading}
          roundName={currentRound?.name}
          isRoundClosed={isRoundClosed}
          readOnly={!isAdmin}
        />
      )}

      {activeTab === 'capacities' && (
        <LecturerCapacityManager
          capacities={capacities}
          directions={directions}
          onUpdateCapacity={handleUpdateCapacity}
          loading={loading}
          roundName={currentRound?.name}
          isRoundClosed={isRoundClosed || !isAdmin}
        />
      )}

      {activeTab === 'registrations' && (
        <DirectionRegistrationList
          registrations={registrations}
          directions={directions}
          loading={loading}
          roundName={currentRound?.name}
        />
      )}

      {activeTab === 'preferences' && (
        <PreferenceList
          preferences={preferences}
          loading={loading}
          roundName={currentRound?.name}
        />
      )}

      {/* Modal Form Xác nhận Chốt kết quả phân công */}
      {showFinalizeModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #0a3273 0%, #1e40af 100%)',
                color: '#fff',
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔒 Xác nhận Chốt Kết Quả Phân Công GVHD
              </h3>
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                disabled={actionLoading}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmFinalize} style={{ padding: '24px' }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                }}
              >
                <div style={{ marginBottom: '6px' }}>
                  📌 <strong>Đợt đồ án:</strong> {currentRound?.name || `Đợt #${effectiveRoundId}`} ({currentRound?.roundCode || `DA_${effectiveRoundId}`})
                </div>
                <div style={{ marginBottom: '6px' }}>
                  👥 <strong>Số sinh viên được phân công:</strong> <strong style={{ color: '#16a34a' }}>{proposals.length} sinh viên</strong>
                </div>
                <div>
                  👨‍🏫 <strong>Số giảng viên tham gia hướng dẫn:</strong> {capacities.length} giảng viên
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <strong>⚠️ LƯU Ý QUY ĐỊNH:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Những sinh viên chưa đăng ký nguyện vọng đồ án trong đợt này sẽ tự động bị <strong>LOẠI KHỎI ĐỢT (DROPPED)</strong> theo quy định.</li>
                  <li>Sau khi xác nhận chốt, nút <strong>"Chốt kết quả phân công"</strong> sẽ được khóa lại, nhưng Khoa vẫn có thể bấm <strong>"✏️ Sửa phân công"</strong> ở từng dòng để điều chỉnh giảng viên hướng dẫn khi cần.</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú quyết định chốt phân công
                </label>
                <textarea
                  rows={3}
                  value={finalizeNote}
                  onChange={(e) => setFinalizeNote(e.target.value)}
                  placeholder="Nhập ghi chú quyết định chốt kết quả phân công..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={actionLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? '⏳ Đang chốt kết quả...' : '✅ Xác nhận Chốt phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagementPage;
