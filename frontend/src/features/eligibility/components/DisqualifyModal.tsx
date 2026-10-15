import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { EligibilityCheckResponse } from '../types';

interface DisqualifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: EligibilityCheckResponse | null;
  onConfirm: (reason: string, disqualifiedBy: string) => Promise<void>;
}

export const DisqualifyModal: React.FC<DisqualifyModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [disqualifiedBy, setDisqualifiedBy] = useState('Khoa CNTT - Hội đồng xét duyệt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do loại sinh viên');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onConfirm(reason.trim(), disqualifiedBy.trim());
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
      title="Loại sinh viên khỏi đợt làm đồ án"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-alert-warning">
          ⚠️ Bạn đang thực hiện thao tác loại sinh viên khỏi đợt làm đồ án tốt nghiệp hiện tại. Hành động này sẽ cập nhật trạng thái không đủ điều kiện.
        </div>

        <div className="modal-student-info">
          <div><strong>Mã sinh viên:</strong> {student.studentCode}</div>
          <div><strong>Họ và tên:</strong> {student.studentName}</div>
          <div><strong>GPA hiện tại:</strong> {student.gpa.toFixed(2)} | <strong>Tín chỉ:</strong> {student.accumulatedCredits}</div>
        </div>

        <div className="form-group">
          <label htmlFor="disqualifiedBy">Đơn vị / Cán bộ ban hành:</label>
          <input
            id="disqualifiedBy"
            type="text"
            className="form-control"
            value={disqualifiedBy}
            onChange={(e) => setDisqualifiedBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="disqualifyReason">Lý do loại:</label>
          <textarea
            id="disqualifyReason"
            rows={4}
            className="form-control"
            placeholder="Ghi rõ lý do không đạt điều kiện (thiếu tín chỉ, vi phạm kỷ luật, nợ học phí, chưa hoàn thành môn học...)"
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
          <Button type="submit" variant="danger" loading={loading}>
            Xác nhận Loại khỏi đợt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
