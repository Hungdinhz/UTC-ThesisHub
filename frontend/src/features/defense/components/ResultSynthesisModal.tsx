import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { SynthesizeResultRequest } from '../types';

interface ResultSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  thesisId?: number;
  roundId?: number;
  roundName?: string;
  totalThesesCount?: number;
  onSynthesize: (data: SynthesizeResultRequest) => Promise<void>;
}

export const ResultSynthesisModal: React.FC<ResultSynthesisModalProps> = ({
  isOpen,
  onClose,
  thesisId,
  roundId,
  roundName,
  totalThesesCount,
  onSynthesize,
}) => {
  const isRoundMode = !thesisId || Boolean(roundId);
  const [supervisorWeight, setSupervisorWeight] = useState(0.4);
  const reviewerWeight = 0.0;
  const [councilWeight, setCouncilWeight] = useState(0.6);
  const [notes, setNotes] = useState(
    isRoundMode
      ? 'Tổng hợp kết quả tốt nghiệp toàn đợt đồ án'
      : 'Tổng hợp kết quả tốt nghiệp chính thức'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalWeight = Number((supervisorWeight + councilWeight).toFixed(2));

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
        projectRoundId: roundId,
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
      title={isRoundMode ? '🎯 Tổng hợp Điểm Tốt nghiệp Toàn Đợt Đồ án' : 'Tổng hợp điểm và Xuất kết quả tốt nghiệp'}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="synthesis-formula-info" style={{ marginBottom: '16px' }}>
          {isRoundMode && (
            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a3273' }}>
                📁 Đợt đồ án: {roundName || `Đợt #${roundId || '—'}`}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '3px' }}>
                👥 Quy mô tổng hợp: <strong>{totalThesesCount ?? 0} sinh viên/đề tài</strong> đủ điều kiện bảo vệ
              </div>
            </div>
          )}
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: '#0f172a' }}>
            Quy chế tính điểm đồ án tốt nghiệp UTC:
          </h4>
          <p style={{ margin: 0, fontSize: '13px' }}>
            <code>Điểm tổng kết = (GVHD × 40%) + (Hội đồng trung bình × 60%)</code>
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
          <small className="form-hint">Mặc định: 0.4 (40%)</small>
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
          <small className="form-hint">Mặc định: 0.6 (60%)</small>
        </div>

        <div className="weight-check-box" style={{ margin: '12px 0', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
          <span>Tổng trọng số: </span>
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
            {isRoundMode ? '🎯 Xác nhận Tổng hợp Điểm Toàn Đợt' : '🎯 Xác nhận Tổng hợp & Xét tốt nghiệp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
