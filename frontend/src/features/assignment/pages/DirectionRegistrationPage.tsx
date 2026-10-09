import React, { useState, useEffect } from 'react';
import { assignmentApi } from '../services/assignmentApi';
import type { ProjectDirection, Lecturer, RegistrationResponse, PreferenceItem } from '../types/assignment.types';
import { DirectionSelector } from '../components/DirectionSelector';
import { LecturerPreferenceForm } from '../components/LecturerPreferenceForm';

// Giả định projectRoundId đang mở là 1 (trong thực tế lấy từ state/context)
const CURRENT_PROJECT_ROUND_ID = 1;

export const DirectionRegistrationPage: React.FC = () => {
  const [directions, setDirections] = useState<ProjectDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<number | null>(null);
  
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  
  const [existingRegistration, setExistingRegistration] = useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Lấy danh sách hướng đồ án
      const dirs = await assignmentApi.getAvailableDirections(CURRENT_PROJECT_ROUND_ID);
      setDirections(dirs);

      // 2. Kiểm tra xem sinh viên đã đăng ký chưa
      try {
        const reg = await assignmentApi.getMyPreferences(CURRENT_PROJECT_ROUND_ID);
        if (reg) {
          setExistingRegistration(reg);
          setSelectedDirectionId(reg.projectDirectionId);
          fetchLecturers(reg.projectDirectionId);
        }
      } catch (err: any) {
        // Nếu chưa đăng ký thì không sao
        console.log('Chưa có đăng ký:', err.message);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async (directionId: number) => {
    try {
      const lecs = await assignmentApi.getLecturersForDirection(directionId);
      setLecturers(lecs);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách giảng viên');
    }
  };

  const handleSelectDirection = (directionId: number) => {
    setSelectedDirectionId(directionId);
    fetchLecturers(directionId);
  };

  const handleSubmitPreferences = async (preferences: PreferenceItem[], extraCriteria: string) => {
    if (!selectedDirectionId) return;

    try {
      setError(null);
      let updatedReg;
      if (existingRegistration) {
        updatedReg = await assignmentApi.updatePreferences(existingRegistration.id, {
          projectDirectionId: selectedDirectionId,
          preferences,
          extraCriteria,
        });
        alert('Cập nhật thành công!');
      } else {
        updatedReg = await assignmentApi.submitPreferences({
          projectDirectionId: selectedDirectionId,
          preferences,
          extraCriteria,
        });
        alert('Đăng ký thành công!');
      }
      setExistingRegistration(updatedReg);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi nguyện vọng');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  const isLocked = existingRegistration?.status === 'LOCKED';

  return (
    <div className="container mt-4">
      <h2>Đăng ký Hướng đồ án và Nguyện vọng giảng viên</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {isLocked && (
        <div className="alert alert-warning">
          Đăng ký của bạn đã bị khóa. Không thể sửa đổi.
        </div>
      )}

      <DirectionSelector
        directions={directions}
        selectedDirectionId={selectedDirectionId}
        onSelect={handleSelectDirection}
        disabled={isLocked}
      />

      {selectedDirectionId && (
        <LecturerPreferenceForm
          lecturers={lecturers}
          initialPreferences={existingRegistration?.preferences}
          onSubmit={handleSubmitPreferences}
          disabled={isLocked}
        />
      )}
    </div>
  );
};

export default DirectionRegistrationPage;
