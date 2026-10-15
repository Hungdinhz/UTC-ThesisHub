import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { CouncilGenerationRequest } from '../types';

interface CouncilGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (req: CouncilGenerationRequest) => Promise<void>;
}

export const CouncilGenerateModal: React.FC<CouncilGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [projectRoundId, setProjectRoundId] = useState(10);
  const [maxStudents, setMaxStudents] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onGenerate({
        projectRoundId,
        maxStudentsPerCouncil: maxStudents,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi chạy giải thuật phân công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tự động phân công Hội đồng (CSP Algorithm)"
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="csp-info-box">
          <h4>Quy tắc nghiệp vụ & Giải thuật:</h4>
          <ul>
            <li><strong>Cơ cấu chuẩn:</strong> Mỗi Hội đồng gồm 5 Giảng viên: 1 Chủ tịch, 2 Thư ký, 2 Ủy viên.</li>
            <li><strong>Ràng buộc cứng (Hard constraint):</strong> Giảng viên hướng dẫn (GVHD) tuyệt đối KHÔNG được ngồi trong Hội đồng chấm chính sinh viên đó: <code>GVHD ∉ Council</code>.</li>
            <li><strong>Ràng buộc mềm (Greedy):</strong> Thuật toán ưu tiên chọn GV có tải thấp nhất để cân bằng số lượng chấm.</li>
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="roundSelect">Đợt bảo vệ đồ án tốt nghiệp:</label>
          <select
            id="roundSelect"
            className="form-control"
            value={projectRoundId}
            onChange={(e) => setProjectRoundId(Number(e.target.value))}
          >
            <option value={10}>Đợt 1 - Học kỳ 2 Năm học 2025-2026 (ID: 10)</option>
            <option value={11}>Đợt 2 - Học kỳ Hè Năm học 2025-2026 (ID: 11)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maxStudents">Số lượng sinh viên tối đa / Hội đồng:</label>
          <input
            id="maxStudents"
            type="number"
            min={1}
            max={15}
            className="form-control"
            value={maxStudents}
            onChange={(e) => setMaxStudents(Number(e.target.value))}
            required
          />
          <small className="form-hint">Mặc định: 5 sinh viên mỗi phiên bảo vệ</small>
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            🚀 Chạy thuật toán CSP & Sinh Hội đồng
          </Button>
        </div>
      </form>
    </Modal>
  );
};
