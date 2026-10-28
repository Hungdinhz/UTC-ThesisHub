import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { CouncilGenerationRequest } from '../types';

interface CouncilGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (req: CouncilGenerationRequest) => Promise<void>;
  rounds?: Array<{ id: number; name: string; roundCode?: string }>;
  currentRoundId?: number;
}

export const CouncilGenerateModal: React.FC<CouncilGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  rounds = [],
  currentRoundId = 16,
}) => {
  const [projectRoundId, setProjectRoundId] = useState(currentRoundId || 16);
  const [maxStudents, setMaxStudents] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (currentRoundId) {
      setProjectRoundId(currentRoundId);
    }
  }, [currentRoundId]);

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
            {rounds && rounds.length > 0 ? (
              rounds.map((r: any) => {
                const rid = r.roundId || r.id;
                return (
                  <option key={rid} value={rid}>
                    {r.name} ({r.roundCode || `ID: ${rid}`})
                  </option>
                );
              })
            ) : (
              <>
                <option value={16}>Đợt đồ án hiện tại (ID: 16)</option>
                <option value={7}>Đợt Hùng (ID: 7)</option>
                <option value={10}>Đợt 1 - Học kỳ 2 Năm học 2025-2026 (ID: 10)</option>
              </>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maxStudents">Quy mô phân công:</label>
          <select
            id="maxStudents"
            className="form-control"
            value={maxStudents}
            onChange={(e) => setMaxStudents(Number(e.target.value))}
          >
            <option value={50}>Chỉ 1 Hội đồng duy nhất cho toàn đợt (Khuyên dùng)</option>
            <option value={5}>Chia nhiều hội đồng (Tối đa 5 SV / Hội đồng)</option>
            <option value={10}>Chia nhiều hội đồng (Tối đa 10 SV / Hội đồng)</option>
          </select>
          <small className="form-hint">Theo quy chế, mỗi đợt phân công 1 Hội đồng chuẩn (1CT - 2TK - 2UV) để chấm tất cả SV đủ điều kiện</small>
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
