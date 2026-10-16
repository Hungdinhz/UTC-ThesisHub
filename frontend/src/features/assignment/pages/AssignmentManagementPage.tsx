import React, { useState, useEffect, useCallback } from 'react';
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

export const AssignmentManagementPage: React.FC<Props> = ({ projectRoundId = 10 }) => {
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

  const isFinalized = proposals.length > 0 && proposals.every((p) => p.status === 'FINALIZED');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [dirsData, capsData, regsData, prefsData, propsData, statsData] = await Promise.all([
        assignmentService.getDirections(),
        assignmentService.getCapacities(projectRoundId),
        assignmentService.getRegistrations(projectRoundId),
        assignmentService.getPreferences(projectRoundId),
        assignmentService.getProposals(projectRoundId),
        assignmentService.getStats(projectRoundId),
      ]);

      setDirections(dirsData);
      setCapacities(capsData);
      setRegistrations(regsData);
      setPreferences(prefsData);
      setProposals(propsData);
      setStats(statsData);
    } catch {
      setAlert({
        type: 'danger',
        message: 'Không thể tải toàn bộ dữ liệu phân công. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }, [projectRoundId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Execute Algorithm: POST /assignments/generate
  const handleGenerate = async () => {
    if (isFinalized) {
      if (!window.confirm('Đợt đồ án này đã được chốt phân công. Bạn có chắc muốn chạy lại thuật toán phân công đề xuất?')) {
        return;
      }
    }

    try {
      setActionLoading(true);
      setAlert(null);
      const generated = await assignmentService.generateAssignments(projectRoundId, true);
      setProposals(generated);
      const updatedStats = await assignmentService.getStats(projectRoundId);
      setStats(updatedStats);
      const updatedCapacities = await assignmentService.getCapacities(projectRoundId);
      setCapacities(updatedCapacities);

      setAlert({
        type: 'success',
        message: `Thuật toán phân công đã thực thi thành công! Đã sinh phương án cho ${generated.length} sinh viên.`,
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
    try {
      setAlert(null);
      await assignmentService.overrideAssignment(assignmentId, newLecturerId, reason);
      // Reload proposals and capacities
      const [updatedProps, updatedCaps, updatedStats] = await Promise.all([
        assignmentService.getProposals(projectRoundId),
        assignmentService.getCapacities(projectRoundId),
        assignmentService.getStats(projectRoundId),
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

  // Finalize Assignments: POST /assignments/finalize
  const handleFinalize = async () => {
    if (proposals.length === 0) {
      setAlert({
        type: 'warning',
        message: 'Chưa có phương án phân công để chốt. Vui lòng chạy thuật toán đề xuất trước.',
      });
      return;
    }

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn CHỐT KẾT QUẢ PHÂN CÔNG cuối cùng cho đợt đồ án này? Sau khi chốt, danh sách sẽ được khóa và gửi thông báo chính thức đến Giảng viên và Sinh viên.'
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setAlert(null);
      const finalStats = await assignmentService.finalizeAssignments(projectRoundId);
      setStats(finalStats);
      const updatedProps = await assignmentService.getProposals(projectRoundId);
      setProposals(updatedProps);

      setAlert({
        type: 'success',
        message: 'Khoa đã CHỐT thành công kết quả phân công Giảng viên hướng dẫn!',
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

  // Update Lecturer Capacity
  const handleUpdateCapacity = async (id: number, data: Partial<LecturerCapacity>) => {
    await assignmentService.updateCapacity(id, data);
    const updatedCaps = await assignmentService.getCapacities(projectRoundId);
    setCapacities(updatedCaps);
    const updatedStats = await assignmentService.getStats(projectRoundId);
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
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="btn-secondary-action"
            onClick={loadAllData}
            disabled={loading || actionLoading}
            title="Làm mới dữ liệu từ máy chủ"
          >
            🔄 Tải lại
          </button>

          <button
            className="btn-generate-algo"
            onClick={handleGenerate}
            disabled={actionLoading || loading}
          >
            ⚡ {actionLoading ? 'Đang tính toán...' : 'Chạy thuật toán phân công'}
          </button>

          <button
            className="btn-finalize-action"
            onClick={handleFinalize}
            disabled={actionLoading || loading || proposals.length === 0}
          >
            🔒 {isFinalized ? 'Đã chốt danh sách' : 'Chốt kết quả phân công'}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`alert-box alert-${alert.type}`}>
          {alert.message}
          <button
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setAlert(null)}
          >
            ✕
          </button>
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
        />
      )}

      {activeTab === 'capacities' && (
        <LecturerCapacityManager
          capacities={capacities}
          onUpdateCapacity={handleUpdateCapacity}
          loading={loading}
        />
      )}

      {activeTab === 'registrations' && (
        <DirectionRegistrationList
          registrations={registrations}
          directions={directions}
          loading={loading}
        />
      )}

      {activeTab === 'preferences' && (
        <PreferenceList preferences={preferences} loading={loading} />
      )}
    </div>
  );
};

export default AssignmentManagementPage;
