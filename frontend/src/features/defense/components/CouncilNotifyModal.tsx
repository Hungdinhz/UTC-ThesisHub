import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { DefenseCouncil, CouncilNotifyRequest } from '../types';

interface CouncilNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  council: DefenseCouncil | null;
  onSend: (payload: CouncilNotifyRequest) => Promise<void>;
  loading?: boolean;
}

export const CouncilNotifyModal: React.FC<CouncilNotifyModalProps> = ({
  isOpen,
  onClose,
  council,
  onSend,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifyLecturers, setNotifyLecturers] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (council) {
      setTitle(`[UTC] Thông báo thành lập Hội đồng bảo vệ đồ án - ${council.name}`);
      setMessage(
        `Kính gửi Quý Thầy/Cô và các Bạn Sinh viên,\n\n` +
        `Hội đồng bảo vệ đồ án tốt nghiệp "${council.name}" (Mã: ${council.code}) đã chính thức được thành lập và chốt danh sách thành viên theo quy chế của Nhà trường.\n\n` +
        `• Cơ cấu Hội đồng gồm 5 thành viên (1 Chủ tịch, 1 Thư ký, 2 Phản biện, 1 Ủy viên).\n` +
        `• Kính đề nghị Quý Thầy/Cô thành viên Hội đồng và các bạn sinh viên theo dõi lịch bảo vệ chi tiết trên hệ thống Smart FYP UTC và chuẩn bị đầy đủ hồ sơ theo quy định.\n\n` +
        `Trân trọng thông báo!`
      );
      setLocalError('');
    }
  }, [council]);

  if (!council) return null;

  const members = council.members || [];
  const assignedStudents = council.assignedStudents || [];
  const studentCount = assignedStudents.length || council.studentIds?.length || 0;

  const roleLabelMap: Record<string, string> = {
    PRESIDENT: 'Chủ tịch',
    SECRETARY: 'Thư ký',
    REVIEWER_1: 'Phản biện 1',
    REVIEWER_2: 'Phản biện 2',
    MEMBER: 'Ủy viên',
  };

  const recipientCount = (notifyLecturers ? members.length : 0) + (notifyStudents ? studentCount : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyLecturers && !notifyStudents) {
      setLocalError('Vui lòng chọn ít nhất một đối tượng nhận thông báo (Giảng viên hoặc Sinh viên).');
      return;
    }
    if (!title.trim() || !message.trim()) {
      setLocalError('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.');
      return;
    }

    try {
      setLocalError('');
      await onSend({
        title: title.trim(),
        message: message.trim(),
        notifyLecturers,
        notifyStudents,
        sendEmail,
      });
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || 'Có lỗi khi gửi thông báo đến các thành viên.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📢 Gửi thông báo đến thành viên Hội đồng"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Council Info Banner */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>HỘI ĐỒNG BẢO VỆ (ĐÃ CHỐT):</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              {council.name} <span style={{ color: '#0284c7', fontSize: '13px' }}>({council.code})</span>
            </div>
          </div>
          <span style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            border: '1px solid #86efac',
          }}>
            🔒 ĐÃ CHỐT HỘI ĐỒNG
          </span>
        </div>

        {/* Recipients Preview */}
        <div style={{
          background: '#f1f5f9',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #cbd5e1',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            👥 Danh sách người nhận ({recipientCount} người):
          </div>

          {/* Members list */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              👨‍🏫 Thành viên Hội đồng (5 Giảng viên):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {members.map((m) => (
                <span
                  key={m.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    color: '#1e293b',
                  }}
                >
                  <strong style={{ color: '#0a3273' }}>[{roleLabelMap[m.role] || m.role}]:</strong> {m.lecturerName}
                </span>
              ))}
            </div>
          </div>

          {/* Students list */}
          {studentCount > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                🎓 Sinh viên bảo vệ ({studentCount} sinh viên):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {assignedStudents.map((s) => (
                  <span
                    key={s.studentId}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '12px',
                      color: '#1e293b',
                    }}
                  >
                    <strong>{s.studentName}</strong> ({s.studentCode})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Target checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Lựa chọn người nhận & kênh gửi:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyLecturers}
                onChange={(e) => setNotifyLecturers(e.target.checked)}
                disabled={loading}
              />
              <span>Gửi đến 5 Giảng viên Hội đồng</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyStudents}
                onChange={(e) => setNotifyStudents(e.target.checked)}
                disabled={loading}
              />
              <span>Gửi đến {studentCount} Sinh viên bảo vệ</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={loading}
              />
              <span>Gửi qua Email UTC</span>
            </label>
          </div>
        </div>

        {/* Title input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="notify-title" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Tiêu đề thông báo <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="notify-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              width: '100%',
              boxSizing: 'border-box',
            }}
            placeholder="Nhập tiêu đề thông báo..."
          />
        </div>

        {/* Message textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="notify-message" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Nội dung thông báo <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="notify-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              lineHeight: 1.5,
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            placeholder="Nhập nội dung thông báo..."
          />
        </div>

        {/* Error message */}
        {localError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
          }}>
            {localError}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || recipientCount === 0}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderColor: '#6d28d9',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
            }}
          >
            🚀 Gửi Thông Báo ({recipientCount} người nhận)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
