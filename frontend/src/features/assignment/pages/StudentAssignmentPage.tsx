import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
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
  studentProgram: initialProgram = 'CU_NHAN',
}) => {
  const { user } = useAuth();
  const effectiveStudentId = user?.id || user?.student_id || studentId;

  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [capacities, setCapacities] = useState<LecturerCapacity[]>([]);
  const [currentRegistration, setCurrentRegistration] = useState<DirectionRegistration | null>(null);
  const [myAssignment, setMyAssignment] = useState<SupervisorAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProgram, setActiveProgram] = useState<'CU_NHAN' | 'KY_SU'>(initialProgram);

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
      const myReg = regsData.find((r) => r.studentId === effectiveStudentId);
      if (myReg) setCurrentRegistration(myReg);

      const assigned = propsData.find((p) => p.studentId === effectiveStudentId);
      if (assigned) setMyAssignment(assigned);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectRoundId, effectiveStudentId]);

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
      studentId: effectiveStudentId,
    });

    // 2. Submit preferences
    const prefs = [
      { priority: 1, lecturerId: data.nv1LecturerId },
      ...(data.nv2LecturerId ? [{ priority: 2, lecturerId: data.nv2LecturerId }] : []),
      ...(data.nv3LecturerId ? [{ priority: 3, lecturerId: data.nv3LecturerId }] : []),
    ];

    await assignmentService.submitPreferences({
      projectRoundId,
      studentId: effectiveStudentId,
      gpa: data.gpa,
      prioritizationCriteria: data.prioritizationCriteria,
      preferences: prefs,
    });

    // Reload
    await loadData();
  };

  return (
    <div className="assignment-container">
      {/* Program Selector Bar for Phase 2 Decision Node Testing */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <strong style={{ color: '#0a3273' }}>🎓 Chương trình đào tạo của Sinh viên (Bước 12 - Nút quyết định):</strong>
          <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '2px' }}>
            Nếu thuộc <strong>CT Kỹ sư (KY_SU)</strong>, hệ thống kiểm tra học vị tối thiểu của GVHD (yêu cầu từ Tiến sĩ/PGS/GS trở lên; nếu chọn Thạc sĩ sẽ yêu cầu chọn lại NV1–NV3).
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveProgram('CU_NHAN')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: activeProgram === 'CU_NHAN' ? '2px solid #0a3273' : '1px solid #cbd5e1',
              backgroundColor: activeProgram === 'CU_NHAN' ? '#0a3273' : '#fff',
              color: activeProgram === 'CU_NHAN' ? '#fff' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hệ Cử nhân (CU_NHAN)
          </button>
          <button
            type="button"
            onClick={() => setActiveProgram('KY_SU')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: activeProgram === 'KY_SU' ? '2px solid #b45309' : '1px solid #cbd5e1',
              backgroundColor: activeProgram === 'KY_SU' ? '#d97706' : '#fff',
              color: activeProgram === 'KY_SU' ? '#fff' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hệ Kỹ sư chuyên sâu (KY_SU)
          </button>
        </div>
      </div>

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
        studentProgram={activeProgram}
        loading={loading}
      />
    </div>
  );
};

export default StudentAssignmentPage;
