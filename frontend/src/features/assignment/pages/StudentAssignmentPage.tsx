import React, { useState, useEffect } from 'react';
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
  projectRoundId = 10,
  studentId = 201,
  studentProgram = 'CU_NHAN',
}) => {
  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [capacities, setCapacities] = useState<LecturerCapacity[]>([]);
  const [currentRegistration, setCurrentRegistration] = useState<DirectionRegistration | null>(null);
  const [myAssignment, setMyAssignment] = useState<SupervisorAssignment | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dirsData, capsData, propsData, regsData] = await Promise.all([
        assignmentService.getDirections(true),
        assignmentService.getCapacities(projectRoundId),
        assignmentService.getProposals(projectRoundId),
        assignmentService.getRegistrations(projectRoundId),
      ]);

      setDirections(dirsData);
      setCapacities(capsData);

      // Check current registration and assignment for this student
      const myReg = regsData.find((r) => r.studentId === studentId);
      if (myReg) setCurrentRegistration(myReg);

      const assigned = propsData.find((p) => p.studentId === studentId);
      if (assigned) setMyAssignment(assigned);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectRoundId, studentId]);

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
      projectRoundId,
      directionId: data.directionId,
      studentId,
    });

    // 2. Submit preferences
    const prefs = [
      { priority: 1, lecturerId: data.nv1LecturerId },
      ...(data.nv2LecturerId ? [{ priority: 2, lecturerId: data.nv2LecturerId }] : []),
      ...(data.nv3LecturerId ? [{ priority: 3, lecturerId: data.nv3LecturerId }] : []),
    ];

    await assignmentService.submitPreferences({
      projectRoundId,
      studentId,
      gpa: data.gpa,
      prioritizationCriteria: data.prioritizationCriteria,
      preferences: prefs,
    });

    // Reload
    await loadData();
  };

  return (
    <div className="assignment-container">
      {/* If direction is already registered */}
      {currentRegistration && !myAssignment && (
        <div className="alert-box alert-info" style={{ marginBottom: '20px' }}>
          <strong>Hướng đồ án hiện tại đã đăng ký:</strong> {currentRegistration.directionName} ({currentRegistration.directionCode})
          <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: '#0369a1' }}>
            Thời gian: {new Date(currentRegistration.registeredAt).toLocaleString('vi-VN')}
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
        studentProgram={studentProgram}
        loading={loading}
      />
    </div>
  );
};

export default StudentAssignmentPage;
