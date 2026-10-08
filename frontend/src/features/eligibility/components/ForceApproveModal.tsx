import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { EligibilityCheckResponse } from '../types';

interface ForceApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: EligibilityCheckResponse | null;
  onConfirm: (reason: string, approvedBy: string) => Promise<void>;
}

export const ForceApproveModal: React.FC<ForceApproveModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('Khoa CNTT - Trưởng Bộ môn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do phê duyệt đặc cách');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onConfirm(reason.trim(), approvedBy.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phê duyệt đặc cách làm đồ án tốt nghiệp"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-student-info">
          <div><strong>Mã sinh viên:</strong> {student.studentCode}</div>
          <div><strong>Họ và tên:</strong> {student.studentName}</div>
          <div><strong>Điểm GPA:</strong> {student.gpa.toFixed(2)} | <strong>Tín chỉ:</strong> {student.accumulatedCredits}</div>
          {student.unpassedPrerequisites.length > 0 && (
            <div className="warning-text">
              <strong>Nợ môn tiên quyết:</strong> {student.unpassedPrerequisites.join(', ')}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="approvedBy">Người duyệt thẩm quyền:</label>
          <input
            id="approvedBy"
            type="text"
            className="form-control"
            value={approvedBy}
            onChange={(e) => setApprovedBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="forceReason">Lý do đặc cách (Quyết định của Khoa/Bộ môn):</label>
          <textarea
            id="forceReason"
            rows={4}
            className="form-control"
            placeholder="Nhập căn cứ, quyết định hoặc ngoại lệ cho phép sinh viên bảo vệ/làm đồ án..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="success" loading={loading}>
            Xác nhận Duyệt đặc cách
          </Button>
        </div>
      </form>
    </Modal>
  );
};
