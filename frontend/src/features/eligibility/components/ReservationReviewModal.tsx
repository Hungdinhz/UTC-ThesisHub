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

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'INSUFFICIENT_CREDITS':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chưa trả đủ tín chỉ / Nợ môn</span>;
      case 'SUPERVISOR_NOT_ELIGIBLE':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>GVHD xét chưa đạt tiến độ</span>;
      case 'RESEARCH_PROGRESS':
        return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Tiến độ nghiên cứu đề tài</span>;
      case 'HEALTH_REASONS':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Sức khỏe / Điều trị y tế</span>;
      default:
        return <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{cat || 'Lý do khác'}</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xét duyệt đơn xin bảo lưu đồ án"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-student-info" style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <strong>Mã sinh viên:</strong> <span style={{ color: '#2563eb', fontWeight: 600 }}>{reservation.studentCode || `SV${reservation.studentId}`}</span>
              <span style={{ marginLeft: '12px' }}><strong>Họ tên:</strong> {reservation.studentName || 'Sinh viên'}</span>
            </div>
            <div>{getCategoryBadge(reservation.reasonCategory)}</div>
          </div>

          {reservation.thesisTitle && (
            <div style={{ marginBottom: '6px' }}>
              <strong>Đề tài:</strong> <em>{reservation.thesisTitle}</em>
            </div>
          )}

          <div style={{ marginBottom: '6px' }}>
            <strong>Nội dung giải trình:</strong> {reservation.reason}
          </div>

          {reservation.supervisorComment && (
            <div style={{ marginTop: '6px', padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '13px' }}>
              <strong>Ý kiến GVHD:</strong> {reservation.supervisorApproved ? '✅ Đồng ý bảo lưu: ' : '⚠️ Ý kiến: '} {reservation.supervisorComment}
            </div>
          )}

          {reservation.evidenceFileUrl && (
            <div style={{ marginTop: '8px' }}>
              <strong>Tệp minh chứng:</strong>{' '}
              <a href={reservation.evidenceFileUrl} target="_blank" rel="noreferrer" className="ui-link" style={{ fontWeight: 600, color: '#0284c7' }}>
                Xem minh chứng đính kèm 📄
              </a>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Quyết định của Khoa:</label>
          <div className="radio-group-horizontal" style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="decisionStatus"
                value="APPROVED"
                checked={status === 'APPROVED'}
                onChange={() => setStatus('APPROVED')}
              />
              <span className="text-success font-semibold" style={{ color: '#16a34a' }}>Chấp thuận bảo lưu (Approve)</span>
            </label>
            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="decisionStatus"
                value="REJECTED"
                checked={status === 'REJECTED'}
                onChange={() => setStatus('REJECTED')}
              />
              <span className="text-danger font-semibold" style={{ color: '#dc2626' }}>Từ chối bảo lưu (Reject)</span>
            </label>
          </div>
          <small className="form-hint" style={{ marginTop: '6px', display: 'block', color: status === 'APPROVED' ? '#15803d' : '#b91c1c' }}>
            {status === 'APPROVED'
              ? '✅ Chấp thuận bảo lưu sẽ chuyển trạng thái đề tài và sinh viên sang RESERVED, đóng băng tiến độ sang đợt sau và tách khỏi danh sách xếp Hội đồng bảo vệ đợt này.'
              : '❌ Từ chối đơn sẽ giữ nguyên trạng thái sinh viên để Hội đồng xét duyệt tiếp tục xử lý theo quy định.'}
          </small>
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
            Hủy
          </Button>
          <Button type="submit" variant={status === 'APPROVED' ? 'primary' : 'danger'} loading={loading}>
            {status === 'APPROVED' ? 'Xác nhận Chấp thuận Bảo lưu' : 'Xác nhận Từ chối'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
