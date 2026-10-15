import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { ReservationSubmitRequest } from '../types';

interface ReservationSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReservationSubmitRequest) => Promise<void>;
  defaultStudentId?: number;
  projectRoundId?: number;
}

export const ReservationSubmitModal: React.FC<ReservationSubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStudentId = 101,
  projectRoundId = 10,
}) => {
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [reason, setReason] = useState('');
  const [evidenceFileUrl, setEvidenceFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do xin bảo lưu');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onSubmit({
        studentId: Number(studentId),
        projectRoundId,
        reason: reason.trim(),
        evidenceFileUrl: evidenceFileUrl.trim() || undefined,
      });
      setReason('');
      setEvidenceFileUrl('');
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
      title="Nộp đơn xin bảo lưu đồ án tốt nghiệp"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="resStudentId">Mã định danh Sinh viên (ID):</label>
          <input
            id="resStudentId"
            type="number"
            className="form-control"
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="submitReason">Lý do xin bảo lưu:</label>
          <textarea
            id="submitReason"
            rows={4}
            className="form-control"
            placeholder="Nêu rõ lý do (sức khỏe, công tác, thực tập doanh nghiệp, hoàn cảnh gia đình...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="evidenceFile">Đường dẫn tệp tài liệu / Giấy tờ minh chứng (URL):</label>
          <input
            id="evidenceFile"
            type="url"
            className="form-control"
            placeholder="https://storage.utc.edu.vn/giay-xac-nhan.pdf"
            value={evidenceFileUrl}
            onChange={(e) => setEvidenceFileUrl(e.target.value)}
          />
          <small className="form-hint">Đính kèm giấy xác nhận của bệnh viện hoặc cơ quan/doanh nghiệp tiếp nhận</small>
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Gửi đơn bảo lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
};
