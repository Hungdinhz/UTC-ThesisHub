import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { ReservationSubmitRequest, ReservationReasonCategory } from '../types';

interface ReservationSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReservationSubmitRequest) => Promise<void>;
  defaultStudentId?: number;
  defaultThesisId?: number;
  projectRoundId?: number;
  defaultCategory?: ReservationReasonCategory;
}

export const ReservationSubmitModal: React.FC<ReservationSubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStudentId = 101,
  defaultThesisId,
  projectRoundId = 10,
  defaultCategory = 'INSUFFICIENT_CREDITS',
}) => {
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [thesisId, setThesisId] = useState<number | undefined>(defaultThesisId);
  const [reasonCategory, setReasonCategory] = useState<ReservationReasonCategory>(defaultCategory);
  const [reason, setReason] = useState('');
  const [evidenceFileUrl, setEvidenceFileUrl] = useState('');
  const [targetRoundCode, setTargetRoundCode] = useState('Đợt kế tiếp (Kỳ sau)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập chi tiết lý do và kế hoạch bảo lưu');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onSubmit({
        studentId: Number(studentId),
        thesisId: thesisId ? Number(thesisId) : undefined,
        projectRoundId,
        reasonCategory,
        reason: reason.trim(),
        evidenceFileUrl: evidenceFileUrl.trim() || undefined,
        targetRoundCode: targetRoundCode.trim() || undefined,
      });
      setReason('');
      setEvidenceFileUrl('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gửi đơn bảo lưu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryHint = (cat: ReservationReasonCategory) => {
    switch (cat) {
      case 'INSUFFICIENT_CREDITS':
        return '💡 GVHD đã duyệt đề tài đạt yêu cầu nhưng sinh viên chưa hoàn thành trả hết nợ tín chỉ tốt nghiệp (Cử nhân: 142 TC, Kỹ sư: 180 TC). Kết quả đề tài và điểm GVHD sẽ được bảo lưu sang đợt sau.';
      case 'SUPERVISOR_NOT_ELIGIBLE':
        return '💡 GVHD đánh giá tiến độ chưa hoàn tất hoặc điểm đánh giá chưa đạt chuẩn. Sinh viên được bảo lưu khối lượng đã làm để tiếp tục hoàn thiện sang đợt sau.';
      case 'RESEARCH_PROGRESS':
        return '💡 Khối lượng nghiên cứu đồ án lớn, cần thêm thời gian thử nghiệm thực tế (đã thống nhất với GVHD).';
      case 'HEALTH_REASONS':
        return '💡 Sinh viên gặp vấn đề sức khỏe/nằm viện điều trị dài hạn. Bắt buộc đính kèm giấy chứng nhận ra viện hoặc xác nhận của cơ sở y tế.';
      case 'INTERNSHIP_WORK':
        return '💡 Đi thực tập doanh nghiệp hoặc công tác đặc biệt theo yêu cầu của đơn vị liên kết.';
      case 'FAMILY_CIRCUMSTANCES':
        return '💡 Hoàn cảnh gia đình đột xuất hoặc lý do nhân đạo chính đáng.';
      default:
        return '💡 Lý do chính đáng khác có xác nhận của Khoa/Bộ môn.';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nộp đơn xin bảo lưu đồ án tốt nghiệp"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <strong>📌 Quy định giai đoạn bảo lưu:</strong>
          <div style={{ marginTop: '4px' }}>
            Đơn xin bảo lưu chỉ được tiếp nhận và xử lý trong <strong>Giai đoạn Xét điều kiện bảo vệ đồ án (ELIGIBILITY_REVIEW)</strong>, trước khi Khoa chốt danh sách để thành lập Hội đồng và Xếp lịch bảo vệ. Đơn được duyệt sẽ bảo toàn đề tài và điểm quá trình của sinh viên sang đợt sau.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <label htmlFor="resThesisId">Mã Đề tài (nếu có):</label>
            <input
              id="resThesisId"
              type="number"
              className="form-control"
              placeholder="VD: 101"
              value={thesisId || ''}
              onChange={(e) => setThesisId(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reasonCategory">Phân loại lý do xin bảo lưu:</label>
          <select
            id="reasonCategory"
            className="form-control"
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value as ReservationReasonCategory)}
            required
            style={{ fontWeight: 500 }}
          >
            <option value="INSUFFICIENT_CREDITS">❌ Chưa trả đủ tín chỉ nợ (Đồ án GVHD đã đạt)</option>
            <option value="SUPERVISOR_NOT_ELIGIBLE">⏳ GVHD xét chưa đạt tiến độ / Chưa đủ điều kiện bảo vệ</option>
            <option value="RESEARCH_PROGRESS">⏱️ Cần thêm thời gian hoàn thiện khối lượng nghiên cứu</option>
            <option value="HEALTH_REASONS">🏥 Lý do sức khỏe / Điều trị y tế dài hạn</option>
            <option value="INTERNSHIP_WORK">💼 Thực tập doanh nghiệp / Công tác dài hạn</option>
            <option value="FAMILY_CIRCUMSTANCES">👨‍👩‍👧 Hoàn cảnh gia đình đột xuất</option>
            <option value="OTHER">📝 Lý do chính đáng khác</option>
          </select>
          <small className="form-hint" style={{ color: '#0369a1', marginTop: '6px', display: 'block' }}>
            {getCategoryHint(reasonCategory)}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="submitReason">Chi tiết giải trình &amp; Kế hoạch:</label>
          <textarea
            id="submitReason"
            rows={3}
            className="form-control"
            placeholder="Nêu rõ hoàn cảnh cụ thể, số tín chỉ còn nợ hoặc tiến độ đồ án, cam kết hoàn thành..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="evidenceFile">Đường dẫn tệp tài liệu / Giấy tờ minh chứng (URL hoặc Tên file):</label>
          <input
            id="evidenceFile"
            type="text"
            className="form-control"
            placeholder="https://storage.utc.edu.vn/giay-xac-nhan.pdf"
            value={evidenceFileUrl}
            onChange={(e) => setEvidenceFileUrl(e.target.value)}
          />
          <small className="form-hint">Đính kèm giấy chứng nhận y tế, xác nhận doanh nghiệp hoặc bảng điểm nợ môn</small>
        </div>

        <div className="form-group">
          <label htmlFor="targetRoundCode">Dự kiến bảo vệ lại vào đợt:</label>
          <input
            id="targetRoundCode"
            type="text"
            className="form-control"
            placeholder="Đợt 2 2026-2027"
            value={targetRoundCode}
            onChange={(e) => setTargetRoundCode(e.target.value)}
          />
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
