import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem } from '../../../types';
import type {
  ProjectDirection,
  LecturerCapacity,
  SupervisorAssignment,
  DirectionRegistration,
} from '../types';
import { assignmentService } from '../services/assignmentService';
import { StudentPreferenceForm } from '../components/StudentPreferenceForm';
import '../assignment.css';

interface Props {
  projectRoundId?: number;
  studentId?: number;
  studentProgram?: 'CU_NHAN' | 'KY_SU';
}

export const StudentAssignmentPage: React.FC<Props> = ({
  projectRoundId: propRoundId,
  studentId = 201,
  studentProgram: initialProgram = 'CU_NHAN',
}) => {
  const { user } = useAuth();
  const effectiveStudentId = user?.id || user?.student_id || studentId;

  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(propRoundId || null);
  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [capacities, setCapacities] = useState<LecturerCapacity[]>([]);
  const [currentRegistration, setCurrentRegistration] = useState<DirectionRegistration | null>(null);
  const [myAssignment, setMyAssignment] = useState<SupervisorAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProgram, setActiveProgram] = useState<'CU_NHAN' | 'KY_SU'>(initialProgram);

  // 1. Load project rounds
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const roundList = await apiService.getProjectRounds();
        setRounds(roundList || []);

        if (!propRoundId && roundList && roundList.length > 0) {
          // Find active/in-progress round first
          const activeRound = roundList.find((r) => r.status === 'IN_PROGRESS') ||
            roundList.find((r) => r.currentMilestone?.phaseType === 'REGISTRATION') ||
            roundList[0];
          setSelectedRoundId(activeRound.roundId);
          if (activeRound.trainingProgram === 'KY_SU' || activeRound.trainingProgram === 'CU_NHAN') {
            setActiveProgram(activeRound.trainingProgram);
          }
        }
      } catch (err) {
        console.error('Failed to load project rounds:', err);
        // Fallback default round ID
        if (!selectedRoundId) setSelectedRoundId(1);
      }
    };
    fetchRounds();
  }, [propRoundId]);

  const effectiveRoundId = selectedRoundId || propRoundId || 1;
  const currentRound = rounds.find((r) => r.roundId === effectiveRoundId);

  // 2. Load directions, capacities, registrations, assignments for effective round
  const loadData = async (roundId: number) => {
    try {
      setLoading(true);
      const [dirsData, capsData, propsData, regsData] = await Promise.all([
        assignmentService.getDirections(true),
        assignmentService.getCapacities(roundId),
        assignmentService.getProposals(roundId),
        assignmentService.getRegistrations(roundId),
      ]);

      setDirections(dirsData || []);
      setCapacities(capsData || []);

      // Check current registration and assignment for this student
      const myReg = regsData?.find((r) => r.studentId === effectiveStudentId);
      setCurrentRegistration(myReg || null);

      const assigned = propsData?.find((p) => p.studentId === effectiveStudentId);
      setMyAssignment(assigned || null);
    } catch (err) {
      console.error('Failed to load assignment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveRoundId) {
      loadData(effectiveRoundId);
    }
  }, [effectiveRoundId, effectiveStudentId]);

  const handleSubmit = async (data: {
    directionId: number;
    nv1LecturerId: number;
    nv2LecturerId?: number;
    nv3LecturerId?: number;
    gpa?: number;
    prioritizationCriteria?: string;
  }) => {
    // 1. Register direction
    await assignmentService.registerDirection({
      projectRoundId: effectiveRoundId,
      directionId: data.directionId,
      studentId: effectiveStudentId,
    });

    // 2. Submit preferences
    const prefs = [
      { priority: 1, lecturerId: data.nv1LecturerId },
      ...(data.nv2LecturerId ? [{ priority: 2, lecturerId: data.nv2LecturerId }] : []),
      ...(data.nv3LecturerId ? [{ priority: 3, lecturerId: data.nv3LecturerId }] : []),
    ];

    await assignmentService.submitPreferences({
      projectRoundId: effectiveRoundId,
      studentId: effectiveStudentId,
      gpa: data.gpa,
      prioritizationCriteria: data.prioritizationCriteria,
      preferences: prefs,
    });

    // Reload data for this round
    await loadData(effectiveRoundId);
  };

  return (
    <div className="assignment-container">
      {/* Round Selector Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎓</span>
            <strong style={{ color: '#0a3273', fontSize: '1rem' }}>
              Đợt Đồ án Tốt nghiệp & Khóa sinh viên:
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {rounds.length > 0 ? (
              <select
                value={effectiveRoundId}
                onChange={(e) => {
                  const rId = Number(e.target.value);
                  setSelectedRoundId(rId);
                  const selected = rounds.find((r) => r.roundId === rId);
                  if (selected?.trainingProgram === 'KY_SU' || selected?.trainingProgram === 'CU_NHAN') {
                    setActiveProgram(selected.trainingProgram);
                  }
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #003366',
                  fontWeight: 600,
                  color: '#003366',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  minWidth: '280px',
                }}
              >
                {rounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    [{r.roundCode}] {r.name} ({r.academicYear || '2026-2027'})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: '#64748b' }}>Đang tải danh sách đợt đồ án...</span>
            )}

            {currentRound?.currentMilestone && (
              <span
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1px solid #bbf7d0',
                }}
              >
                🎯 {currentRound.currentMilestone.name || 'Giai đoạn đăng ký nguyện vọng'}
              </span>
            )}
          </div>
        </div>

        {/* Program Toggle (Cử nhân / Kỹ sư) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            Hệ đào tạo:
          </span>
          <button
            type="button"
            onClick={() => setActiveProgram('CU_NHAN')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeProgram === 'CU_NHAN' ? '2px solid #0a3273' : '1px solid #cbd5e1',
              backgroundColor: activeProgram === 'CU_NHAN' ? '#0a3273' : '#fff',
              color: activeProgram === 'CU_NHAN' ? '#fff' : '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Hệ Cử nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveProgram('KY_SU')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeProgram === 'KY_SU' ? '2px solid #b45309' : '1px solid #cbd5e1',
              backgroundColor: activeProgram === 'KY_SU' ? '#d97706' : '#fff',
              color: activeProgram === 'KY_SU' ? '#fff' : '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Hệ Kỹ sư (Yêu cầu TS+)
          </button>
        </div>
      </div>

      {/* If direction is already registered */}
      {currentRegistration && !myAssignment && (
        <div className="alert-box alert-info" style={{ marginBottom: '20px' }}>
          <strong>Hướng đồ án hiện tại đã đăng ký:</strong> {currentRegistration.directionName} ({currentRegistration.directionCode})
          <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: '#0369a1' }}>
            Thời gian nộp: {new Date(currentRegistration.registeredAt).toLocaleString('vi-VN')}
          </span>
        </div>
      )}

      {/* If assignment result already exists */}
      {myAssignment && (
        <div className="alert-box alert-success" style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
            🎉 Kết quả phân công Giảng viên hướng dẫn:
          </h4>
          <p style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>
            Giảng viên hướng dẫn:{' '}
            <strong>
              {myAssignment.lecturerName} ({myAssignment.academicDegree})
            </strong>{' '}
            — Bộ môn: {myAssignment.departmentName}
          </p>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534' }}>
            Hướng đồ án: <strong>{myAssignment.directionName}</strong> | Trạng thái:{' '}
            <span className="status-badge badge-active">
              {myAssignment.status === 'FINALIZED' ? 'Chính thức (Đã chốt)' : 'Hệ thống đề xuất'}
            </span>{' '}
            |{' '}
            {myAssignment.matchedPriority
              ? `Thỏa mãn NV${myAssignment.matchedPriority}`
              : 'Phân công trực tiếp'}
          </p>
        </div>
      )}

      {/* Preference Form */}
      <StudentPreferenceForm
        directions={directions}
        capacities={capacities}
        onSubmit={handleSubmit}
        studentProgram={activeProgram}
        loading={loading}
      />
    </div>
  );
};

export default StudentAssignmentPage;
