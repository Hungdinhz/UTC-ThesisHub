import React, { useState } from 'react';
import type { SupervisorAssignment, LecturerCapacity } from '../types';

interface Props {
  assignment: SupervisorAssignment;
  capacities: LecturerCapacity[];
  onClose: () => void;
  onConfirm: (assignmentId: number, newLecturerId: number, reason: string) => Promise<void>;
}

export const AssignmentOverrideModal: React.FC<Props> = ({
  assignment,
  capacities,
  onClose,
  onConfirm,
}) => {
  const [selectedLecturerId, setSelectedLecturerId] = useState<number>(assignment.lecturerId);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedLecturer = capacities.find((c) => c.lecturerId === selectedLecturerId);

  // Warnings
  const isEngineeringStudent = assignment.trainingProgramCode === 'KY_SU';
  const isSelectedMaster =
    selectedLecturer?.academicDegree === 'THAC_SI' ||
    selectedLecturer?.academicDegree === 'MASTER';
  const isDegreeWarning = isEngineeringStudent && isSelectedMaster;
  const isFullCapacity = selectedLecturer && selectedLecturer.remainingCapacity <= 0 && selectedLecturer.lecturerId !== assignment.lecturerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do can thiệp điều chuyển giảng viên.');
      return;
    }
    if (selectedLecturerId === assignment.lecturerId) {
      setErrorMsg('Vui lòng chọn giảng viên mới khác với giảng viên hiện tại.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onConfirm(assignment.id, selectedLecturerId, reason.trim());
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể thực hiện điều chuyển.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-override" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">✏️</span>
            <div>
              <h4>Điều chuyển thủ công Giảng viên hướng dẫn (Override)</h4>
              <p className="modal-subtitle">
                Sinh viên: <strong>{assignment.studentName}</strong> ({assignment.studentCode})
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && <div className="alert-box alert-danger">{errorMsg}</div>}

            <div className="assignment-current-summary">
              <div className="summary-row">
                <span className="summary-label">Hướng đồ án:</span>
                <span className="summary-val">{assignment.directionName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Chương trình đào tạo:</span>
                <span className="summary-val">
                  {assignment.trainingProgramCode === 'KY_SU' ? 'Kỹ sư (4.5 năm)' : 'Cử nhân'}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">GVHD hiện tại:</span>
                <span className="summary-val font-semibold text-primary">
                  {assignment.lecturerName} ({assignment.academicDegree})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Phương thức phân công:</span>
                <span className="summary-val">
                  {assignment.matchedPriority
                    ? `Thuật toán (Đạt NV${assignment.matchedPriority})`
                    : 'Phân công trực tiếp'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Chọn Giảng viên hướng dẫn thay thế:</label>
              <select
                className="form-select"
                value={selectedLecturerId}
                onChange={(e) => {
                  setSelectedLecturerId(Number(e.target.value));
                  setErrorMsg('');
                }}
              >
                {capacities.map((c) => (
                  <option key={c.lecturerId} value={c.lecturerId}>
                    {c.fullName} ({c.academicDegree} - {c.departmentName}) — Còn trống:{' '}
                    {c.remainingCapacity} SV
                  </option>
                ))}
              </select>
            </div>

            {/* Warnings */}
            {isDegreeWarning && (
              <div className="alert-box alert-warning">
                ⚠️ <strong>Cảnh báo học vị:</strong> Sinh viên thuộc chương trình Kỹ sư quy định
                GVHD phải có học vị Tiến sĩ trở lên. Giảng viên đã chọn có học vị Thạc sĩ.
              </div>
            )}

            {isFullCapacity && (
              <div className="alert-box alert-warning">
                ⚠️ <strong>Cảnh báo chỉ tiêu:</strong> Giảng viên này đã đủ hoặc vượt chỉ tiêu hướng
                dẫn ({selectedLecturer.currentAssigned}/{selectedLecturer.effectiveCapacity}). Can
                thiệp override sẽ cấp quyền vượt chỉ tiêu.
              </div>
            )}

            <div className="form-group">
              <label>
                Lý do điều chuyển / can thiệp (Bắt buộc lưu lịch sử audit):{' '}
                <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Nhập lý do Khoa điều chuyển (ví dụ: Đổi GV theo nguyện vọng thực tế của doanh nghiệp / GV xin chuyển giao / điều chỉnh tải trọng chuyên môn)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-confirm btn-warning-action" disabled={submitting}>
              {submitting ? 'Đang thực hiện...' : 'Xác nhận Override GVHD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
