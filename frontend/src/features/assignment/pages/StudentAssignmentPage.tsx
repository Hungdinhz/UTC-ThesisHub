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
import { toast } from '../../../components/Toast';
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
  const [studentRoundStatus, setStudentRoundStatus] = useState<{
    status?: string;
    note?: string;
    isDropped?: boolean;
  } | null>(null);
  const [showLockedForm, setShowLockedForm] = useState<boolean>(false);

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

        if (myStatus) {
          setStudentRoundStatus({
            status: myStatus.status,
            note: myStatus.note,
            isDropped: myStatus.isDropped || myStatus.status === 'DROPPED',
          });
        }

        if (propRoundId) {
          setRounds(allRounds);
          setSelectedRoundId(propRoundId);
          setIsStudentInRound(true);
          return;
        }

        // 1. Prioritize backend getMyRoundStatus() which resolves student's enrolled round
        if (myStatus) {
          if (myStatus.inRound && myStatus.roundId) {
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
          } else if (myStatus.inRound === false) {
            setRounds([]);
            setSelectedRoundId(null);
            setIsStudentInRound(false);
            return;
          }
        }

        // 2. Fallback (only if getMyRoundStatus API failed): verify student membership in parallel
        const userCode =
          (user as any)?.registration_no ||
          (user as any)?.studentCode ||
          (user as any)?.student_code ||
          user?.username;
        if (userCode && allRounds.length > 0) {
          const checks = await Promise.all(
            allRounds.map(async (r) => {
              try {
                const res = await apiService.getStudentsInRound(r.roundId, { search: userCode, size: 10 });
                const found = res?.content?.find(
                  (s) =>
                    s.studentCode?.toLowerCase() === String(userCode).toLowerCase() ||
                    (effectiveStudentId && s.studentId === effectiveStudentId)
                );
                return found ? { round: r, found } : null;
              } catch {
                return null;
              }
            })
          );
          const match = checks.find((c) => c !== null);
          if (match) {
            setRounds([match.round]);
            setSelectedRoundId(match.round.roundId);
            setIsStudentInRound(true);
            if (match.found.gpa !== undefined && match.found.gpa !== null) {
              setStudentRoundGpa(Number(match.found.gpa));
            }
            if (match.round.trainingProgram === 'KY_SU' || match.round.trainingProgram === 'CU_NHAN') {
              setActiveProgram(match.round.trainingProgram);
            }
            return;
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

      const latestMyStatus = await apiService.getMyRoundStatus().catch(() => null);
      if (latestMyStatus) {
        setStudentRoundStatus({
          status: latestMyStatus.status,
          note: latestMyStatus.note,
          isDropped: latestMyStatus.isDropped || latestMyStatus.status === 'DROPPED',
        });
      }

      const isSupplementaryOpenForMe =
        (latestMyStatus?.note || studentRoundStatus?.note || '').toLowerCase().includes('bổ sung') &&
        !(latestMyStatus?.isDropped || latestMyStatus?.status === 'DROPPED');

      const finalized =
        assigned?.status === 'FINALIZED' ||
        (!isSupplementaryOpenForMe && !!propsData?.some((p) => p.status === 'FINALIZED'));
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
  const isStudentDropped = !!studentRoundStatus?.isDropped || studentRoundStatus?.status === 'DROPPED';
  const isSupplementaryPeriod =
    !isStudentDropped &&
    (studentRoundStatus?.note || '').toLowerCase().includes('bổ sung');
  const hasSubmitted = !!currentRegistration || myPreferences.length > 0;
  const canEdit = !isRoundClosed && !isRoundFinalized && !isStudentDropped;

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
        toast.warning('Đợt đồ án này đã đóng. Không thể đăng ký hoặc thay đổi nguyện vọng.');
      } else if (isRoundFinalized) {
        toast.warning('Kết quả phân công Giảng viên hướng dẫn đã được Khoa chốt chính thức. Bạn không thể chỉnh sửa nguyện vọng nữa.');
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
            Tài khoản chưa có trong danh sách đợt đồ án nào. Vui lòng liên hệ Giáo vụ Khoa để được hỗ trợ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      {/* Banner thông báo khi sinh viên đã bị loại khỏi đợt đồ án (DROPPED) */}
      {isStudentDropped && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '18px 22px',
            marginBottom: '20px',
            color: '#991b1b',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚫 Bạn đã bị loại khỏi đợt đồ án ({currentRound?.roundCode || `Đợt #${effectiveRoundId}`})
          </h3>
          <p style={{ margin: '0 0 6px 0', fontSize: '0.96rem', lineHeight: 1.5 }}>
            <strong>Lý do:</strong>{' '}
            {studentRoundStatus?.note ||
              'Bạn không đăng ký nguyện vọng giảng viên hướng dẫn trước khi Khoa chốt kết quả phân công.'}
          </p>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#7f1d1d' }}>
            💡 Vui lòng liên hệ Giáo vụ Khoa nếu bạn thuộc diện đăng ký bổ sung.
          </p>
        </div>
      )}

      {/* Banner thông báo khi sinh viên đang trong Đợt đăng ký bổ sung */}
      {isSupplementaryPeriod && !myAssignment && (
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '2px solid #f97316',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#9a3412',
          }}
        >
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 700, color: '#c2410c' }}>
            📢 ĐỢT ĐĂNG KÝ BỔ SUNG NGUYỆN VỌNG ĐANG MỞ
          </h4>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
            Đang mở đợt đăng ký bổ sung. Vui lòng chọn hướng và 3 nguyện vọng GVHD bên dưới rồi bấm <strong>Gửi đăng ký</strong>.
          </p>
        </div>
      )}

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

        <div className="round-control-right">
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

      {(() => {
        const sortedPreferences = [...myPreferences].sort((a, b) => a.priority - b.priority);
        const matchedDirection = directions.find(
          (d) => d.id === (currentRegistration?.directionId ?? myAssignment?.directionId)
        );
        const dirCode = currentRegistration?.directionCode || matchedDirection?.code || myAssignment?.directionCode || '—';
        const dirName = currentRegistration?.directionName || matchedDirection?.name || myAssignment?.directionName || 'Chưa xác định';
        const dirDesc = matchedDirection?.description;
        const rawTime = currentRegistration?.registeredAt || sortedPreferences[0]?.createdAt;
        const submittedAtLabel = rawTime ? new Date(rawTime).toLocaleString('vi-VN') : null;
        const isLockedAndSubmitted = !canEdit && hasSubmitted;

        const renderSummaryCard = () => {
          if (!hasSubmitted) return null;
          return (
            <div className="student-registration-summary-card">
              <div className="reg-summary-header">
                <div className="reg-summary-title-group">
                  <h3>📋 Phiếu Tổng hợp Hồ sơ Đăng ký Hướng &amp; Nguyện vọng Đã nộp</h3>
                  <div className="reg-summary-subtitle">
                    Đợt đồ án: <strong>{currentRound?.name || `Đợt #${effectiveRoundId}`}</strong>
                    {submittedAtLabel && (
                      <>
                        {' '}• Thời gian ghi nhận: <strong>{submittedAtLabel}</strong>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`reg-summary-status-badge ${
                    isRoundFinalized ? 'status-finalized' : isRoundClosed ? 'status-closed' : 'status-pending'
                  }`}
                >
                  {isRoundFinalized
                    ? '🔒 Đã chốt kết quả phân công'
                    : isRoundClosed
                    ? '🔒 Đợt đã đóng'
                    : '⏳ Đã nộp — Đang chờ phân công'}
                </span>
              </div>

              {/* 1. Hướng đồ án đã đăng ký */}
              <div className="reg-summary-section">
                <div className="reg-summary-section-label">1. Hướng đồ án đã đăng ký</div>
                <div className="reg-direction-box">
                  <div className="reg-direction-top">
                    <span className="reg-direction-code">{dirCode}</span>
                    <span className="reg-direction-name">{dirName}</span>
                  </div>
                  {dirDesc && <div className="reg-direction-desc">{dirDesc}</div>}
                </div>
              </div>

              {/* 2. Danh sách Nguyện vọng GVHD */}
              <div className="reg-summary-section">
                <div className="reg-summary-section-label">
                  2. Nguyện vọng Giảng viên hướng dẫn ({sortedPreferences.length} nguyện vọng)
                </div>
                {sortedPreferences.length > 0 ? (
                  <div className="reg-pref-table-wrap">
                    <table className="reg-pref-table">
                      <thead>
                        <tr>
                          <th style={{ width: '150px' }}>Thứ tự ưu tiên</th>
                          <th>Giảng viên hướng dẫn</th>
                          <th>Học vị &amp; Bộ môn</th>
                          <th style={{ width: '160px' }}>Kết quả đối chiếu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPreferences.map((pref) => {
                          const capInfo = capacities.find((c) => c.lecturerId === pref.lecturerId);
                          const isMatched = Boolean(myAssignment && myAssignment.lecturerId === pref.lecturerId);
                          const nvLabel =
                            pref.priority === 1
                              ? 'NV1 (Ưu tiên 1)'
                              : pref.priority === 2
                              ? 'NV2 (Dự phòng 1)'
                              : `NV${pref.priority} (Dự phòng ${pref.priority - 1})`;
                          return (
                            <tr key={pref.id || `${pref.priority}-${pref.lecturerId}`} className={isMatched ? 'is-matched-row' : ''}>
                              <td>
                                <span className={`reg-nv-badge nv-${pref.priority}`}>{nvLabel}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {pref.lecturerName || capInfo?.fullName || `GV #${pref.lecturerId}`}
                                </div>
                                {(pref.lecturerCode || capInfo?.lecturerCode) && (
                                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    Mã CB: {pref.lecturerCode || capInfo?.lecturerCode}
                                  </div>
                                )}
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#0284c7' }}>
                                  {pref.academicDegree || capInfo?.academicDegree || '—'}
                                </span>
                                {capInfo?.departmentName && (
                                  <span style={{ color: '#475569' }}> • {capInfo.departmentName}</span>
                                )}
                              </td>
                              <td>
                                {myAssignment ? (
                                  isMatched ? (
                                    <span className="reg-match-pill matched">✅ Trúng tuyển</span>
                                  ) : (
                                    <span className="reg-match-pill unmatched">Không chọn</span>
                                  )
                                ) : (
                                  <span className="reg-match-pill waiting">⏳ Chờ phân công</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="reg-notes-box reg-notes-empty">
                    Chưa có nguyện vọng giảng viên nào được ghi nhận.
                  </div>
                )}
              </div>

              {/* 3. GPA & Tiêu chí phụ */}
              <div className="reg-summary-section">
                <div className="reg-summary-section-label">3. Hồ sơ năng lực &amp; Tiêu chí phụ đã khai báo</div>
                <div className="reg-criteria-grid">
                  <div className="reg-gpa-box">
                    <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                      Điểm GPA tích lũy (Hệ 4.0)
                    </span>
                    <span className="reg-gpa-value">
                      {initialFormValues.gpa != null ? Number(initialFormValues.gpa).toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="reg-notes-box">
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                      Định hướng nghiên cứu / Kỹ năng nổi bật:
                    </div>
                    {initialFormValues.prioritizationCriteria && initialFormValues.prioritizationCriteria.trim() ? (
                      <span>{initialFormValues.prioritizationCriteria}</span>
                    ) : (
                      <span className="reg-notes-empty">Không có khai báo bổ sung.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        };

        const renderPreferenceForm = () => (
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
        );

        if (isLockedAndSubmitted) {
          return (
            <>
              {renderSummaryCard()}
              <div className="reg-form-toggle-bar">
                <button
                  type="button"
                  className="btn-toggle-locked-form"
                  onClick={() => setShowLockedForm((prev) => !prev)}
                >
                  {showLockedForm ? '▲ Thu gọn biểu mẫu chi tiết' : '👁️ Xem lại biểu mẫu chọn chi tiết & danh sách GV'}
                </button>
              </div>
              {showLockedForm && renderPreferenceForm()}
            </>
          );
        }

        return (
          <>
            {renderPreferenceForm()}
            {renderSummaryCard()}
          </>
        );
      })()}
    </div>
  );
};

export default StudentAssignmentPage;
