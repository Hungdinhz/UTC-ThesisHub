import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { ReservationRequestItem } from '../types';

interface ReservationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationRequestItem | null;
  onConfirm: (status: 'APPROVED' | 'REJECTED', reviewNotes: string, reviewedBy: string) => Promise<void>;
}

export const ReservationReviewModal: React.FC<ReservationReviewModalProps> = ({
  isOpen,
  onClose,
  reservation,
  onConfirm,
}) => {
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('Khoa Công nghệ thông tin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setError('Vui lòng nhập ý kiến / kết luận phê duyệt');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onConfirm(status, reviewNotes.trim(), reviewedBy.trim());
      setReviewNotes('');
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
      title="Xét duyệt đơn xin bảo lưu đồ án"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-student-info">
          <div><strong>Mã sinh viên:</strong> {reservation.studentCode || `SV${reservation.studentId}`}</div>
          <div><strong>Họ và tên:</strong> {reservation.studentName || 'Sinh viên'}</div>
          <div><strong>Lý do xin bảo lưu:</strong> {reservation.reason}</div>
          {reservation.evidenceFileUrl && (
            <div style={{ marginTop: '6px' }}>
              <strong>Tệp minh chứng:</strong>{' '}
              <a href={reservation.evidenceFileUrl} target="_blank" rel="noreferrer" className="ui-link">
                Xem minh chứng đính kèm 📄
              </a>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Quyết định của Khoa:</label>
          <div className="radio-group-horizontal">
            <label className="radio-label">
              <input
                type="radio"
                name="decisionStatus"
                value="APPROVED"
                checked={status === 'APPROVED'}
                onChange={() => setStatus('APPROVED')}
              />
              <span className="text-success font-semibold">Chấp thuận bảo lưu (Approve)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="decisionStatus"
                value="REJECTED"
                checked={status === 'REJECTED'}
                onChange={() => setStatus('REJECTED')}
              />
              <span className="text-danger font-semibold">Từ chối bảo lưu (Reject)</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reviewer">Người duyệt / Đơn vị thẩm quyền:</label>
          <input
            id="reviewer"
            type="text"
            className="form-control"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reviewNotes">Ý kiến phê duyệt / Ghi chú phản hồi:</label>
          <textarea
            id="reviewNotes"
            rows={3}
            className="form-control"
            placeholder="Ghi rõ ý kiến chỉ đạo, thời hạn bảo lưu tối đa hoặc lý do từ chối..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            required
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant={status === 'APPROVED' ? 'success' : 'danger'}
            loading={loading}
          >
            {status === 'APPROVED' ? 'Xác nhận Phê duyệt' : 'Xác nhận Từ chối'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
