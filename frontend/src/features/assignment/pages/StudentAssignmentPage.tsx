import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem } from '../../../types';
import {
  isLecturerAssignedToDirection,
  type ProjectDirection,
  type LecturerCapacity,
  type SupervisorAssignment,
  type DirectionRegistration,
  type PreferenceResponse,
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
  const [myPreferences, setMyPreferences] = useState<PreferenceResponse[]>([]);
  const [myAssignment, setMyAssignment] = useState<SupervisorAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProgram, setActiveProgram] = useState<'CU_NHAN' | 'KY_SU'>(initialProgram);
  const [isRoundFinalized, setIsRoundFinalized] = useState(false);
  const [studentRoundGpa, setStudentRoundGpa] = useState<number | undefined>(undefined);
  const [isStudentInRound, setIsStudentInRound] = useState<boolean>(true);
  const [checkingEnrollment, setCheckingEnrollment] = useState<boolean>(true);

  // 1. Load project rounds & synchronize strictly with the student's enrolled round
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        setCheckingEnrollment(true);
        const [roundList, myStatus] = await Promise.all([
          apiService.getProjectRounds().catch(() => [] as ProjectRoundItem[]),
          apiService.getMyRoundStatus().catch(() => null),
        ]);
        const allRounds = roundList || [];

        if (propRoundId) {
          setRounds(allRounds);
          setSelectedRoundId(propRoundId);
          setIsStudentInRound(true);
          return;
        }

        // 1. Prioritize backend getMyRoundStatus() which resolves student's enrolled round
        if (myStatus && myStatus.inRound && myStatus.roundId) {
          const matchedRound = allRounds.find((r) => r.roundId === myStatus.roundId);
          if (matchedRound) {
            setRounds([matchedRound]);
            setSelectedRoundId(matchedRound.roundId);
            setIsStudentInRound(true);
            if (matchedRound.trainingProgram === 'KY_SU' || matchedRound.trainingProgram === 'CU_NHAN') {
              setActiveProgram(matchedRound.trainingProgram);
            }
            return;
          }
        }

        // 2. Fallback: verify student membership across rounds via getStudentsInRound
        const userCode =
          (user as any)?.registration_no ||
          (user as any)?.studentCode ||
          (user as any)?.student_code ||
          user?.username;
        if (userCode && allRounds.length > 0) {
          for (const r of allRounds) {
            try {
              const res = await apiService.getStudentsInRound(r.roundId, { search: userCode, size: 10 });
              const found = res?.content?.find(
                (s) =>
                  s.studentCode?.toLowerCase() === String(userCode).toLowerCase() ||
                  (effectiveStudentId && s.studentId === effectiveStudentId)
              );
              if (found) {
                setRounds([r]);
                setSelectedRoundId(r.roundId);
                setIsStudentInRound(true);
                if (found.gpa !== undefined && found.gpa !== null) {
                  setStudentRoundGpa(Number(found.gpa));
                }
                if (r.trainingProgram === 'KY_SU' || r.trainingProgram === 'CU_NHAN') {
                  setActiveProgram(r.trainingProgram);
                }
                return;
              }
            } catch {
              // ignore individual round check error
            }
          }
        }

        // If student is not enrolled in any project round
        setRounds([]);
        setSelectedRoundId(null);
        setIsStudentInRound(false);
      } catch (err) {
        console.error('Failed to load project rounds:', err);
        setIsStudentInRound(false);
      } finally {
        setCheckingEnrollment(false);
      }
    };
    fetchRounds();
  }, [propRoundId, user, effectiveStudentId]);

  const effectiveRoundId = selectedRoundId || propRoundId || 0;
  const currentRound = rounds.find((r) => r.roundId === effectiveRoundId);

  // 2. Load directions, capacities, registrations, preferences, assignments for effective round
  const loadData = async (roundId: number) => {
    try {
      setLoading(true);
      const [dirsData, capsData, propsData, regsData, prefsData] = await Promise.all([
        assignmentService.getDirections(true),
        assignmentService.getCapacities(roundId),
        assignmentService.getProposals(roundId),
        assignmentService.getRegistrations(roundId),
        assignmentService.getPreferences(roundId),
      ]);

      // Synchronize each direction's lecturer count dynamically with active capacities
      const syncedDirections = (dirsData || []).map((dir) => {
        const matchingCount = (capsData || []).filter((c) => isLecturerAssignedToDirection(c, dir)).length;
        return {
          ...dir,
          lecturerCount: matchingCount > 0 ? matchingCount : (capsData && capsData.length > 0 ? 0 : dir.lecturerCount || 0),
        };
      });

      setDirections(syncedDirections);
      setCapacities(capsData || []);

      // Check current registration, preferences, and assignment for this student
      const userCode = (user as any)?.registration_no || (user as any)?.studentCode || (user as any)?.student_code || user?.username;
      const myReg = regsData?.find((r) =>
        (effectiveStudentId && r.studentId === effectiveStudentId) ||
        (userCode && r.studentCode === userCode)
      );
      setCurrentRegistration(myReg || null);

      const studentPrefs = prefsData?.filter((p) =>
        (effectiveStudentId && p.studentId === effectiveStudentId) ||
        (userCode && (p as any).studentCode === userCode)
      ) || [];
      setMyPreferences(studentPrefs);

      const assigned = propsData?.find((p) =>
        (effectiveStudentId && p.studentId === effectiveStudentId) ||
        (userCode && (p as any).studentCode === userCode)
      );
      setMyAssignment(assigned || null);

      const finalized = propsData?.some((p) => p.status === 'FINALIZED') || assigned?.status === 'FINALIZED';
      setIsRoundFinalized(!!finalized);

      // Fetch student's round registration to obtain exact official GPA
      if (userCode) {
        try {
          const roundStudentsRes = await apiService.getStudentsInRound(roundId, {
            search: userCode,
            size: 5,
          });
          const matchedStudent = roundStudentsRes?.content?.find(
            (s) => s.studentCode === userCode || (effectiveStudentId && s.studentId === effectiveStudentId)
          );
          if (matchedStudent && matchedStudent.gpa !== undefined && matchedStudent.gpa !== null) {
            setStudentRoundGpa(Number(matchedStudent.gpa));
          }
        } catch (e) {
          console.warn('Could not fetch student round GPA', e);
        }
      }
    } catch (err) {
      console.error('Failed to load assignment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveRoundId && effectiveRoundId > 0 && isStudentInRound) {
      loadData(effectiveRoundId);
    }
  }, [effectiveRoundId, effectiveStudentId, isStudentInRound]);

  // Synchronize student program automatically from profile or round (student cannot manually change)
  useEffect(() => {
    const progId = (user as any)?.training_program_id || (user as any)?.trainingProgramId || (user as any)?.student?.training_program_id;
    const userProg = (user as any)?.trainingProgram || (user as any)?.training_program || (user as any)?.program || (progId === 2 ? 'KY_SU' : (progId === 1 ? 'CU_NHAN' : undefined));
    if (userProg === 'KY_SU' || userProg === 'CU_NHAN') {
      setActiveProgram(userProg);
    } else if (currentRound?.trainingProgram === 'KY_SU' || currentRound?.trainingProgram === 'CU_NHAN') {
      setActiveProgram(currentRound.trainingProgram);
    }
  }, [user, currentRound]);

  const isRoundClosed = currentRound?.status === 'CLOSED' || currentRound?.status === 'ARCHIVED';
  const hasSubmitted = !!currentRegistration || myPreferences.length > 0;
  const canEdit = !isRoundClosed && !isRoundFinalized;

  const initialFormValues = {
    directionId: currentRegistration?.directionId,
    nv1LecturerId: myPreferences.find((p) => p.priority === 1)?.lecturerId,
    nv2LecturerId: myPreferences.find((p) => p.priority === 2)?.lecturerId,
    nv3LecturerId: myPreferences.find((p) => p.priority === 3)?.lecturerId,
    gpa: studentRoundGpa ?? myPreferences[0]?.gpa ?? (user as any)?.gpa ?? (user as any)?.student?.gpa ?? 3.45,
    prioritizationCriteria: myPreferences[0]?.prioritizationCriteria,
  };

  const handleSubmit = async (data: {
    directionId: number;
    nv1LecturerId: number;
    nv2LecturerId?: number;
    nv3LecturerId?: number;
    gpa?: number;
    prioritizationCriteria?: string;
  }) => {
    if (!canEdit) {
      if (isRoundClosed) {
        alert('Đợt đồ án này đã đóng. Không thể đăng ký hoặc thay đổi nguyện vọng.');
      } else if (isRoundFinalized) {
        alert('Kết quả phân công Giảng viên hướng dẫn đã được Khoa chốt chính thức. Bạn không thể chỉnh sửa nguyện vọng nữa.');
      }
      return;
    }

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

  if (checkingEnrollment) {
    return (
      <div className="assignment-container">
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
          ⏳ Đang đồng bộ thông tin đợt đồ án của sinh viên...
        </div>
      </div>
    );
  }

  if (!isStudentInRound || !effectiveRoundId) {
    return (
      <div className="assignment-container">
        <div style={{ padding: '28px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#92400e' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Sinh viên chưa thuộc đợt đồ án nào
          </h3>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Tài khoản của bạn hiện chưa có trong danh sách sinh viên tham gia đợt đồ án nào. Theo quy định đồng bộ dữ liệu, sinh viên thuộc đợt đồ án nào thì chỉ được phép đăng ký nguyện vọng và thực hiện đồ án tại đợt đó. Vui lòng liên hệ Giáo vụ Khoa để được thêm vào đợt đồ án của bạn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      {/* Project Round Context & Selector Bar */}
      <div className="assignment-round-control-card">
        <div className="round-control-left">
          <div className="round-icon-badge">🎓</div>
          <div className="round-info-content">
            <div className="round-label-row">
              <span className="round-context-label">ĐANG ĐĂNG KÝ CHO ĐỢT ĐỒ ÁN:</span>
              {currentRound?.status && (
                <span className={`round-status-pill status-${currentRound.status.toLowerCase()}`}>
                  ● {currentRound.status === 'OPEN' ? 'Đang mở đăng ký' : currentRound.status === 'IN_PROGRESS' ? 'Đang diễn ra' : currentRound.status}
                </span>
              )}
              <span className="round-meta-pill program-pill">
                {activeProgram === 'KY_SU' ? 'Hệ Kỹ sư (Yêu cầu TS+)' : 'Hệ Cử nhân'}
              </span>
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
                    🎯 <strong>Mốc:</strong> {currentRound.currentMilestone.name || 'Giai đoạn đăng ký nguyện vọng'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* Read-only Round Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Đợt đồ án:</span>
            <span style={{
              background: '#f8fafc',
              color: '#0f172a',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 600,
              border: '1px solid #cbd5e1'
            }}>
              🔒 {currentRound ? `[${currentRound.roundCode}] ${currentRound.name}` : `Đợt #${effectiveRoundId}`}
            </span>
          </div>

          {/* Read-only Program Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Hệ đào tạo:</span>
            <span style={{
              background: activeProgram === 'KY_SU' ? '#fef3c7' : '#eff6ff',
              color: activeProgram === 'KY_SU' ? '#92400e' : '#1e40af',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 600,
              border: `1px solid ${activeProgram === 'KY_SU' ? '#fde68a' : '#bfdbfe'}`
            }}>
              🔒 {activeProgram === 'KY_SU' ? 'Hệ Kỹ sư (Yêu cầu GVHD TS+)' : 'Hệ Cử nhân'}
            </span>
          </div>

          {/* Registration / Finalization State Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Trạng thái:</span>
            {isRoundFinalized ? (
              <span style={{
                background: '#f0fdf4',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid #bbf7d0'
              }}>
                🔒 Đã chốt phân công
              </span>
            ) : hasSubmitted ? (
              <span style={{
                background: '#fffbeb',
                color: '#b45309',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid #fde68a'
              }}>
                ✏️ Đã nộp (Có thể sửa)
              </span>
            ) : (
              <span style={{
                background: '#f8fafc',
                color: '#64748b',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 600,
                border: '1px solid #e2e8f0'
              }}>
                📝 Chưa nộp nguyện vọng
              </span>
            )}
          </div>
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
        projectRoundName={currentRound?.name}
        projectRoundCode={currentRound?.roundCode}
        academicYear={currentRound?.academicYear}
        semester={currentRound?.semester}
        isRoundClosed={isRoundClosed}
        hasSubmitted={hasSubmitted}
        canEdit={canEdit}
        isAssignmentFinalized={isRoundFinalized}
        initialValues={initialFormValues}
      />
    </div>
  );
};

export default StudentAssignmentPage;
