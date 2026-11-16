import React, { useState, useEffect, useMemo } from 'react';
import type { SupervisorAssignment, AssignmentNotifyRequest } from '../types';

interface AssignmentNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectRoundId: number;
  roundName?: string;
  roundCode?: string;
  proposals: SupervisorAssignment[];
  onSend: (payload: AssignmentNotifyRequest) => Promise<void>;
  loading?: boolean;
}

export const AssignmentNotifyModal: React.FC<AssignmentNotifyModalProps> = ({
  isOpen,
  onClose,
  projectRoundId,
  roundName = 'Đợt đồ án tốt nghiệp',
  roundCode = '',
  proposals = [],
  onSend,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifyLecturers, setNotifyLecturers] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [localError, setLocalError] = useState('');

  // Calculate distinct lecturers
  const distinctLecturers = useMemo(() => {
    const map = new Map<number, string>();
    proposals.forEach((p) => {
      if (p.lecturerId && p.lecturerName) {
        map.set(p.lecturerId, p.lecturerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [proposals]);

  const studentCount = proposals.length;
  const lecturerCount = distinctLecturers.length;
  const recipientCount = (notifyLecturers ? lecturerCount : 0) + (notifyStudents ? studentCount : 0);

  useEffect(() => {
    if (isOpen) {
      setTitle(`[UTC] Thông báo chính thức kết quả phân công GVHD - ${roundName}`);
      setMessage(
        `Kính gửi Quý Thầy/Cô và các Bạn Sinh viên,\n\n` +
        `Khoa Công nghệ thông tin - Trường Đại học Giao thông Vận tải trân trọng thông báo: Kết quả phân công Giảng viên hướng dẫn đồ án tốt nghiệp cho đợt "${roundName}" (${roundCode || `Mã #${projectRoundId}`}) đã chính thức hoàn tất và được phê duyệt.\n\n` +
        `• Đối với Sinh viên: Các bạn vui lòng chủ động liên hệ với Giảng viên hướng dẫn được phân công để trao đổi định hướng nghiên cứu và hoàn thiện đề cương chi tiết đúng thời hạn.\n` +
        `• Đối với Quý Thầy/Cô: Thầy/Cô vui lòng theo dõi danh sách sinh viên hướng dẫn trong trang cá nhân trên hệ thống Smart FYP UTC.\n\n` +
        `Chúc Quý Thầy/Cô và các bạn sinh viên một đợt đồ án tốt nghiệp thành công tốt đẹp!\n\n` +
        `Trân trọng thông báo!`
      );
      setLocalError('');
    }
  }, [isOpen, roundName, roundCode, projectRoundId]);

  if (!isOpen) return null;

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
        projectRoundId,
        title: title.trim(),
        message: message.trim(),
        notifyLecturers,
        notifyStudents,
        sendEmail,
      });
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || 'Có lỗi khi gửi thông báo kết quả phân công.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📢</span> Gửi thông báo kết quả phân công GVHD
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Thông báo chính thức tới toàn bộ Giảng viên hướng dẫn và Sinh viên trong đợt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Round Info & Status Banner */}
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
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ĐỢT ĐỒ ÁN:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {roundName} {roundCode ? <span style={{ color: '#0284c7', fontSize: '13px' }}>({roundCode})</span> : null}
              </div>
            </div>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid #86efac',
            }}>
              ✅ ĐÃ CHỐT PHÂN CÔNG
            </span>
          </div>

          {/* Recipients Summary Box */}
          <div style={{
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '14px',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              👥 Thống kê người nhận ({recipientCount} người):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>👨‍🏫 Giảng viên hướng dẫn:</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0a3273' }}>
                  {lecturerCount} <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>giảng viên</span>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>🎓 Sinh viên được phân công:</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>
                  {studentCount} <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>sinh viên</span>
                </div>
              </div>
            </div>
          </div>

          {/* Target checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Lựa chọn đối tượng & kênh thông báo:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyLecturers}
                  onChange={(e) => setNotifyLecturers(e.target.checked)}
                  disabled={loading}
                />
                <span>Gửi tới toàn bộ {lecturerCount} Giảng viên hướng dẫn</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyStudents}
                  onChange={(e) => setNotifyStudents(e.target.checked)}
                  disabled={loading}
                />
                <span>Gửi tới toàn bộ {studentCount} Sinh viên được phân công</span>
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
            <label htmlFor="assign-notify-title" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Tiêu đề thông báo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="assign-notify-title"
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
            <label htmlFor="assign-notify-message" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Nội dung thông báo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="assign-notify-message"
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
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || recipientCount === 0}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: loading || recipientCount === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || recipientCount === 0 ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading ? '⏳ Đang gửi...' : `🚀 Gửi Thông Báo (${recipientCount} người nhận)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
