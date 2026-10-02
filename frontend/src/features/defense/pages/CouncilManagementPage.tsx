import React, { useState, useEffect } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { CouncilMemberCard } from '../components/CouncilMemberCard';
import { CouncilGenerateModal } from '../components/CouncilGenerateModal';
import { defenseService } from '../services/defenseService';
import type { DefenseCouncil, LecturerOption, CouncilGenerationRequest } from '../types';
import './DefensePages.css';

export const CouncilManagementPage: React.FC = () => {
  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Demo: Let's assume student 101 has advisorId 502, student 104 has advisorId 501
  const studentAdvisorMap: Record<number, number> = {
    101: 502,
    103: 507,
    104: 501,
    105: 508,
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cList, lList] = await Promise.all([
        defenseService.getCouncils(10),
        defenseService.getLecturers(),
      ]);
      setCouncils(cList);
      setLecturers(lList);
      if (cList.length > 0 && selectedCouncilId === null) {
        setSelectedCouncilId(cList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải danh sách Hội đồng' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (req: CouncilGenerationRequest) => {
    try {
      const result = await defenseService.generateCouncils(req);
      setCouncils(result);
      setNotification({
        type: 'success',
        message: 'Chạy thuật toán CSP thành công! Đã tự động tạo và gán Hội đồng tối ưu không trùng GVHD.',
      });
      if (result.length > 0) {
        setSelectedCouncilId(result[result.length - 1].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi sinh Hội đồng' });
    }
  };

  const handleMemberChange = async (memberId: number, newLecturerId: number) => {
    if (!selectedCouncil) return;

    const newLecturer = lecturers.find((l) => l.lecturerId === newLecturerId);
    if (!newLecturer) return;

    // Check if new lecturer is GVHD of any student in this council (Hard constraint)
    const assignedStudents = selectedCouncil.studentIds || [];
    const conflictStudent = assignedStudents.find((sId) => studentAdvisorMap[sId] === newLecturerId);

    if (conflictStudent) {
      setNotification({
        type: 'error',
        message: `Ràng buộc cứng vi phạm: ${newLecturer.fullName} là GVHD của sinh viên #${conflictStudent} trong Hội đồng này! Không thể phân công.`,
      });
      return;
    }

    // Check if already in this council
    const alreadyInCouncil = selectedCouncil.members.some(
      (m) => m.id !== memberId && m.lecturerId === newLecturerId
    );
    if (alreadyInCouncil) {
      setNotification({
        type: 'error',
        message: `Giảng viên ${newLecturer.fullName} đã có trong Hội đồng này rồi!`,
      });
      return;
    }

    const updatedMembers = selectedCouncil.members.map((m) =>
      m.id === memberId
        ? { ...m, lecturerId: newLecturerId, lecturerName: newLecturer.fullName }
        : m
    );

    try {
      const updatedCouncil = await defenseService.updateCouncilMembers(selectedCouncil.id, updatedMembers);
      setCouncils(councils.map((c) => (c.id === updatedCouncil.id ? updatedCouncil : c)));
      setNotification({
        type: 'success',
        message: `Đã thay đổi thành viên Hội đồng thành công sang ${newLecturer.fullName}`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi cập nhật thành viên' });
    }
  };

  const selectedCouncil = councils.find((c) => c.id === selectedCouncilId);
  const excludedAdvisors = selectedCouncil?.studentIds?.map((sId) => studentAdvisorMap[sId]).filter(Boolean) as number[] || [];

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Quản lý Hội đồng bảo vệ đồ án tốt nghiệp</h1>
          <p className="feature-page-subtitle">
            Cơ cấu chuẩn: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên. Tự động chia bằng thuật toán CSP (Backtracking + Greedy).
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsGenerateModalOpen(true)}>
            ⚡ Chạy phân công tự động (CSP)
          </Button>
          <Button variant="outline" onClick={loadData} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Councils Grid / Tabs */}
      <div className="councils-layout-grid">
        {/* Left Side: Councils List */}
        <div className="councils-sidebar">
          <h3>Danh sách Hội đồng ({councils.length})</h3>
          <div className="council-nav-list">
            {councils.map((c) => {
              const isSelected = c.id === selectedCouncilId;
              return (
                <div
                  key={c.id}
                  className={`council-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCouncilId(c.id)}
                >
                  <div className="council-item-header">
                    <span className="code-badge">{c.code}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="council-item-name">{c.name}</div>
                  <div className="council-item-meta">
                    👥 5 Thành viên | 🎓 {c.studentIds?.length || 0} Sinh viên
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detail & 5 Members (1CT - 2TK - 2UV) */}
        <div className="council-detail-panel">
          {selectedCouncil ? (
            <>
              <div className="council-detail-header">
                <div>
                  <h2>{selectedCouncil.name} ({selectedCouncil.code})</h2>
                  <p className="council-desc">{selectedCouncil.description}</p>
                </div>
                <div className="council-header-badge">
                  <span className="structure-pill">Cơ cấu chuẩn: 1CT - 2TK - 2UV</span>
                </div>
              </div>

              {/* Hard Constraint Alert */}
              <div className="hard-constraint-banner">
                <span className="constraint-icon">🛡️</span>
                <div className="constraint-text">
                  <strong>Ràng buộc cứng bắt buộc:</strong> Giảng viên hướng dẫn (GVHD) tuyệt đối không ngồi trong Hội đồng chấm chính sinh viên của mình.
                  {excludedAdvisors.length > 0 && (
                    <span className="excluded-list">
                      (Đã khóa GVHD: {excludedAdvisors.map((id) => lecturers.find((l) => l.lecturerId === id)?.fullName || id).join(', ')})
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Members Grid */}
              <h3 className="section-title">Thành viên Hội đồng (5 Giảng viên):</h3>
              <div className="members-grid-5">
                {selectedCouncil.members.map((member) => (
                  <CouncilMemberCard
                    key={member.id}
                    member={member}
                    allLecturers={lecturers}
                    onLecturerChange={handleMemberChange}
                    excludedAdvisorIds={excludedAdvisors}
                  />
                ))}
              </div>

              {/* Assigned Students */}
              <div className="assigned-students-box">
                <h3 className="section-title">Danh sách sinh viên bảo vệ trong Hội đồng này:</h3>
                <div className="students-chips-list">
                  {selectedCouncil.studentIds && selectedCouncil.studentIds.length > 0 ? (
                    selectedCouncil.studentIds.map((sId) => (
                      <div key={sId} className="student-chip">
                        <span className="student-icon">🎓</span>
                        <div className="student-chip-info">
                          <strong>Sinh viên #{sId}</strong>
                          <span className="advisor-name">
                            GVHD: {lecturers.find((l) => l.lecturerId === studentAdvisorMap[sId])?.fullName || `GV #${studentAdvisorMap[sId]}`}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">Chưa có sinh viên nào được gán vào hội đồng này.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-council-selected">Vui lòng chọn một Hội đồng từ danh sách bên trái</div>
          )}
        </div>
      </div>

      {/* Auto-generate Modal */}
      <CouncilGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerate}
      />
    </div>
  );
};
