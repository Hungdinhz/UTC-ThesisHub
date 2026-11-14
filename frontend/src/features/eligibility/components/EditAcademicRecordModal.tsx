import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { StudentProjectRoundItem, UpdateRoundStudentPayload } from '../../../types';
import { apiService } from '../../../services/api';

interface EditAcademicRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProjectRoundItem | null;
  projectRoundId: number;
  onSuccess: () => Promise<void>;
}

export const EditAcademicRecordModal: React.FC<EditAcademicRecordModalProps> = ({
  isOpen,
  onClose,
  student,
  projectRoundId,
  onSuccess,
}) => {
  const [completedCredits, setCompletedCredits] = useState<number>(142);
  const [debtCredits, setDebtCredits] = useState<number>(0);
  const [gpa, setGpa] = useState<number>(3.0);
  const [tuitionDebt, setTuitionDebt] = useState<boolean>(false);
  const [underDisciplinaryAction, setUnderDisciplinaryAction] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setCompletedCredits(student.completedCredits ?? 142);
      setDebtCredits(student.debtCredits ?? 0);
      setGpa(student.gpa ?? 3.0);
      setTuitionDebt(Boolean(student.tuitionDebt));
      setUnderDisciplinaryAction(Boolean(student.underDisciplinaryAction));
      setNote(student.note || '');
      setError('');
    }
  }, [student]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debtCredits < 0 || completedCredits < 0) {
      setError('Số tín chỉ không được nhỏ hơn 0');
      return;
    }
    if (gpa < 0 || gpa > 4.0) {
      setError('Điểm GPA phải nằm trong khoảng từ 0.0 đến 4.0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload: UpdateRoundStudentPayload = {
        fullName: student.fullName,
        className: student.className,
        majorId: student.majorId,
        email: student.email,
        phone: student.phone,
        gpa,
        completedCredits: Math.max(0, completedCredits),
        debtCredits: Math.max(0, debtCredits),
        missingPrerequisiteCount: 0,
        tuitionDebt,
        underDisciplinaryAction,
        note: note.trim() || undefined,
      };

      await apiService.updateStudentInRound(projectRoundId, student.studentId, payload);
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật thông tin học vụ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập nhật dữ liệu học vụ sinh viên (GĐ5)"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div
          style={{
            background: '#f8fafc',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>
            <strong>Sinh viên:</strong>{' '}
            <span style={{ color: '#0a3273', fontWeight: 700 }}>{student.fullName}</span> (
            <span style={{ fontWeight: 600 }}>{student.studentCode}</span>)
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
            Lớp: <strong>{student.className || 'Chưa cập nhật'}</strong> • Chuyên ngành: <strong>{student.majorName || student.majorCode}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="completedCredits" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Tín chỉ tích lũy:
            </label>
            <input
              id="completedCredits"
              type="number"
              min={0}
              max={200}
              className="form-control"
              value={completedCredits}
              onChange={(e) => setCompletedCredits(Number(e.target.value))}
              required
              style={{ fontWeight: 600 }}
            />
            <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Chương trình Cử nhân: 142 TC, Kỹ sư: 180 TC</small>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="debtCredits" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Tín chỉ nợ (=0 để đủ ĐK bảo vệ):
            </label>
            <input
              id="debtCredits"
              type="number"
              min={0}
              max={50}
              className="form-control"
              value={debtCredits}
              onChange={(e) => setDebtCredits(Number(e.target.value))}
              required
              style={{
                fontWeight: 700,
                color: debtCredits > 0 ? '#dc2626' : '#16a34a',
                borderColor: debtCredits > 0 ? '#fca5a5' : '#86efac',
              }}
            />
            <small style={{ color: debtCredits > 0 ? '#dc2626' : '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
              {debtCredits > 0 ? `⚠️ Còn nợ ${debtCredits} tín chỉ` : '✅ Đã hoàn thành trả nợ (0 TC)'}
            </small>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label htmlFor="gpaInput" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
            Điểm GPA tích lũy:
          </label>
          <input
            id="gpaInput"
            type="number"
            step="0.01"
            min={0}
            max={4.0}
            className="form-control"
            value={gpa}
            onChange={(e) => setGpa(Number(e.target.value))}
            required
            style={{ fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="tuitionDebtSelect" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Nghĩa vụ học phí:
            </label>
            <select
              id="tuitionDebtSelect"
              className="form-control"
              value={tuitionDebt ? 'true' : 'false'}
              onChange={(e) => setTuitionDebt(e.target.value === 'true')}
              style={{ fontWeight: 600, color: tuitionDebt ? '#dc2626' : '#16a34a' }}
            >
              <option value="false">✅ Đã hoàn thành học phí</option>
              <option value="true">❌ Còn nợ học phí</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="disciplineSelect" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Tình trạng kỷ luật:
            </label>
            <select
              id="disciplineSelect"
              className="form-control"
              value={underDisciplinaryAction ? 'true' : 'false'}
              onChange={(e) => setUnderDisciplinaryAction(e.target.value === 'true')}
              style={{ fontWeight: 600, color: underDisciplinaryAction ? '#dc2626' : '#475569' }}
            >
              <option value="false">Bình thường (Không bị kỷ luật)</option>
              <option value="true">❌ Đang trong thời gian thi hành kỷ luật</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="academicNote" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
            Ghi chú học vụ xét bảo vệ:
          </label>
          <input
            id="academicNote"
            type="text"
            className="form-control"
            placeholder="Ghi chú xác nhận học vụ (VD: Đã nộp giấy xác nhận điểm, còn nợ 8 tín chỉ)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-actions-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            💾 Lưu thay đổi học vụ
          </Button>
        </div>
      </form>
    </Modal>
  );
};

