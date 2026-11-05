import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { AdminCreateReservationRequest, ReservationReasonCategory } from '../types';

interface AdminCreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    studentId: number;
    studentCode?: string;
    studentName?: string;
    thesisId?: number;
    thesisTitle?: string;
    defaultCategory?: ReservationReasonCategory;
    defaultReason?: string;
  } | null;
  projectRoundId?: number;
  onConfirm: (data: AdminCreateReservationRequest) => Promise<void>;
}

export const AdminCreateReservationModal: React.FC<AdminCreateReservationModalProps> = ({
  isOpen,
  onClose,
  student,
  projectRoundId = 10,
  onConfirm,
}) => {
  const [reasonCategory, setReasonCategory] = useState<ReservationReasonCategory>('INSUFFICIENT_CREDITS');
  const [reason, setReason] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [note, setNote] = useState('Khoa lập quyết định bảo lưu căn cứ theo quy chế đào tạo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      if (student.defaultCategory) {
        setReasonCategory(student.defaultCategory);
      }
      if (student.defaultReason) {
        setReason(student.defaultReason);
      } else {
        setReason('Bảo lưu kết quả đồ án do chưa hoàn thành đủ số tín chỉ quy định / còn nợ môn tốt nghiệp');
      }
      setError('');
    }
  }, [student]);

  if (!student) return null;

  const hasThesis = Boolean(student.thesisId && student.thesisId > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasThesis) {
      setError('Sinh viên chưa có đề tài và chưa được phân công GVHD. Theo quy định, chỉ sinh viên có đề tài và GVHD mới được bảo lưu!');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do / căn cứ bảo lưu');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onConfirm({
        studentId: student.studentId,
        thesisId: student.thesisId,
        projectRoundId,
        reasonCategory,
        reason: reason.trim(),
        autoApprove,
        note: note.trim() || undefined,
        reviewedBy: 1,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lập quyết định bảo lưu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lập quyết định bảo lưu đồ án cho sinh viên"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
          <div><strong>Sinh viên:</strong> <span style={{ color: '#2563eb', fontWeight: 600 }}>{student.studentName}</span> ({student.studentCode || `SV${student.studentId}`})</div>
          {student.thesisTitle && hasThesis ? (
            <div style={{ marginTop: '4px', fontSize: '13px' }}>
              <strong>Đề tài:</strong> <em>{student.thesisTitle}</em> (Mã đề tài: #{student.thesisId})
            </div>
          ) : (
            <div style={{ marginTop: '6px', fontSize: '13px', color: '#dc2626', fontWeight: 600, backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '4px' }}>
              ⚠️ Sinh viên chưa có đề tài / chưa phân công GVHD. Theo quy định, chỉ sinh viên có đề tài và GVHD mới được bảo lưu!
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="adminReasonCategory">Phân loại lý do bảo lưu:</label>
          <select
            id="adminReasonCategory"
            className="form-control"
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value as ReservationReasonCategory)}
            required
            disabled={!hasThesis}
            style={{ fontWeight: 500 }}
          >
            <option value="INSUFFICIENT_CREDITS">❌ Chưa trả đủ tín chỉ / Nợ môn học (Đồ án GVHD đạt)</option>
            <option value="SUPERVISOR_NOT_ELIGIBLE">⏳ GVHD xét chưa đạt tiến độ / Chưa đủ điều kiện bảo vệ</option>
            <option value="RESEARCH_PROGRESS">⏱️ Cần thêm thời gian hoàn thiện khối lượng nghiên cứu</option>
            <option value="HEALTH_REASONS">🏥 Lý do sức khỏe / Bệnh án điều trị</option>
            <option value="INTERNSHIP_WORK">💼 Thực tập doanh nghiệp / Công tác dài hạn</option>
            <option value="FAMILY_CIRCUMSTANCES">👨‍👩‍👧 Hoàn cảnh gia đình đột xuất</option>
            <option value="OTHER">📝 Lý do khác theo văn bản đào tạo</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="adminReason">Căn cứ &amp; Lý do lập bảo lưu:</label>
          <textarea
            id="adminReason"
            rows={3}
            className="form-control"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            disabled={!hasThesis}
            placeholder={!hasThesis ? 'Không thể lập đơn bảo lưu khi chưa có đề tài và GVHD' : 'Nhập lý do / căn cứ bảo lưu...'}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: hasThesis ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              disabled={!hasThesis}
            />
            <span>Phê duyệt có hiệu lực ngay lập tức (Chuyển sang RESERVED và đóng băng đề tài)</span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="adminNote">Ghi chú của Khoa:</label>
          <input
            id="adminNote"
            type="text"
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!hasThesis}
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={!hasThesis}>
            Xác nhận lập bảo lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
};
