import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { SynthesizeResultRequest } from '../types';

interface ResultSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  thesisId: number;
  onSynthesize: (data: SynthesizeResultRequest) => Promise<void>;
}

export const ResultSynthesisModal: React.FC<ResultSynthesisModalProps> = ({
  isOpen,
  onClose,
  thesisId,
  onSynthesize,
}) => {
  const [supervisorWeight, setSupervisorWeight] = useState(0.3);
  const [reviewerWeight, setReviewerWeight] = useState(0.2);
  const [councilWeight, setCouncilWeight] = useState(0.5);
  const [notes, setNotes] = useState('Tổng hợp kết quả tốt nghiệp chính thức');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalWeight = Number((supervisorWeight + reviewerWeight + councilWeight).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setError(`Tổng trọng số các thành phần phải bằng 1.0 (100%). Hiện tại đang là: ${(totalWeight * 100).toFixed(0)}%`);
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onSynthesize({
        thesisId,
        supervisorWeight,
        reviewerWeight,
        councilWeight,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi tổng hợp điểm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tổng hợp điểm và Xuất kết quả tốt nghiệp"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="synthesis-formula-info">
          <h4>Quy chế tính điểm đồ án tốt nghiệp:</h4>
          <p>
            <code>Điểm tổng kết = (GVHD × w1) + (GVPB × w2) + (Hội đồng trung bình × w3)</code>
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="wSup">Trọng số Giảng viên Hướng dẫn (GVHD):</label>
          <input
            id="wSup"
            type="number"
            step="0.05"
            min="0"
            max="1.0"
            className="form-control"
            value={supervisorWeight}
            onChange={(e) => setSupervisorWeight(Number(e.target.value))}
            required
          />
          <small className="form-hint">Mặc định: 0.3 (30%)</small>
        </div>

        <div className="form-group">
          <label htmlFor="wRev">Trọng số Giảng viên Phản biện (GVPB):</label>
          <input
            id="wRev"
            type="number"
            step="0.05"
            min="0"
            max="1.0"
            className="form-control"
            value={reviewerWeight}
            onChange={(e) => setReviewerWeight(Number(e.target.value))}
            required
          />
          <small className="form-hint">Mặc định: 0.2 (20%)</small>
        </div>

        <div className="form-group">
          <label htmlFor="wCou">Trọng số Hội đồng chấm bảo vệ:</label>
          <input
            id="wCou"
            type="number"
            step="0.05"
            min="0"
            max="1.0"
            className="form-control"
            value={councilWeight}
            onChange={(e) => setCouncilWeight(Number(e.target.value))}
            required
          />
          <small className="form-hint">Mặc định: 0.5 (50%)</small>
        </div>

        <div className="weight-check-box">
          <span>Tổng trọng số:</span>{' '}
          <strong className={Math.abs(totalWeight - 1.0) < 0.01 ? 'text-success' : 'text-danger'}>
            {(totalWeight * 100).toFixed(0)}%
          </strong>
        </div>

        <div className="form-group">
          <label htmlFor="synthNotes">Ghi chú quyết định tốt nghiệp:</label>
          <input
            id="synthNotes"
            type="text"
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="success" loading={loading}>
            🎯 Xác nhận Tổng hợp & Xét tốt nghiệp
          </Button>
        </div>
      </form>
    </Modal>
  );
};
