import React, { useState, useEffect, useMemo } from 'react';
import type { DefenseSchedule, DefenseCouncil, ScheduleNotifyRequest } from '../types';

interface ScheduleNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectRoundId: number;
  roundName?: string;
  roundCode?: string;
  schedules: DefenseSchedule[];
  councils: DefenseCouncil[];
  onSend: (payload: ScheduleNotifyRequest) => Promise<void>;
  loading?: boolean;
}

export const ScheduleNotifyModal: React.FC<ScheduleNotifyModalProps> = ({
  isOpen,
  onClose,
  projectRoundId,
  roundName = 'Đợt đồ án tốt nghiệp',
  roundCode = '',
  schedules = [],
  councils = [],
  onSend,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifyLecturers, setNotifyLecturers] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [localError, setLocalError] = useState('');

  // Extract distinct rooms
  const distinctRooms = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      if (s.room) set.add(s.room);
    });
    return Array.from(set);
  }, [schedules]);

  // Extract date range
  const dateRange = useMemo(() => {
    const dates = Array.from(new Set(schedules.map((s) => s.defenseDate).filter(Boolean))).sort();
    if (dates.length === 0) return 'Chưa xếp ngày';
    if (dates.length === 1) return dates[0];
    return `${dates[0]} đến ${dates[dates.length - 1]}`;
  }, [schedules]);

  // Extract distinct lecturers (council members + advisors)
  const distinctLecturers = useMemo(() => {
    const map = new Map<number, string>();
    // From councils
    councils.forEach((c) => {
      (c.members || []).forEach((m) => {
        if (m.lecturerId && m.lecturerName) {
          map.set(m.lecturerId, m.lecturerName);
        }
      });
    });
    // From schedules directly
    schedules.forEach((s) => {
      (s.members || []).forEach((m) => {
        if (m.lecturerId && m.lecturerName) {
          map.set(m.lecturerId, m.lecturerName);
        }
      });
      (s.assignedStudents || []).forEach((st) => {
        if (st.advisorId && st.advisorName) {
          map.set(st.advisorId, st.advisorName);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [councils, schedules]);

  // Extract distinct students
  const distinctStudents = useMemo(() => {
    const map = new Map<number | string, { name: string; code: string }>();
    schedules.forEach((s) => {
      (s.assignedStudents || []).forEach((st) => {
        const key = st.studentId || st.studentCode || st.thesisId;
        if (key && !map.has(key)) {
          map.set(key, { name: st.studentName || `Sinh viên #${key}`, code: st.studentCode || '' });
        }
      });
      (s.studentIds || []).forEach((sId) => {
        if (!map.has(sId)) {
          map.set(sId, { name: `Sinh viên #${sId}`, code: '' });
        }
      });
    });
    return Array.from(map.values());
  }, [schedules]);

  const lecturerCount = distinctLecturers.length;
  const studentCount = distinctStudents.length;
  const recipientCount = (notifyLecturers ? lecturerCount : 0) + (notifyStudents ? studentCount : 0);

  useEffect(() => {
    if (isOpen) {
      setTitle(`[UTC] Thông báo lịch bảo vệ đồ án tốt nghiệp chính thức - ${roundName}`);
      setMessage(
        `Kính gửi Quý Thầy/Cô và các Bạn Sinh viên,\n\n` +
        `Khoa Công nghệ thông tin - Trường Đại học Giao thông Vận tải trân trọng thông báo Lịch bảo vệ đồ án tốt nghiệp chính thức cho đợt "${roundName}" (${roundCode || `Mã #${projectRoundId}`}) đã được phê duyệt và chốt danh sách.\n\n` +
        `• Tổng số ca bảo vệ: ${schedules.length} ca (${studentCount} sinh viên tham gia).\n` +
        `• Khung thời gian: ${dateRange}.\n` +
        `• Địa điểm / Phòng thi: ${distinctRooms.length > 0 ? distinctRooms.join(', ') : 'Theo phân công từng ca'}.\n\n` +
        `LƯU Ý QUAN TRỌNG ĐỐI VỚI SINH VIÊN:\n` +
        `- Sinh viên cần kiểm tra kỹ ca thi, phòng thi và thứ tự thuyết minh trên hệ thống Smart FYP UTC.\n` +
        `- Có mặt tại phòng thi trước giờ bắt đầu ít nhất 15 phút, trang phục lịch sự, chuẩn bị sẵn Slide và nộp hồ sơ/bản in đồ án cho Thư ký Hội đồng.\n\n` +
        `Kính chúc Quý Thầy/Cô và các bạn sinh viên một kỳ bảo vệ thành công tốt đẹp!\n\n` +
        `Trân trọng thông báo!`
      );
      setLocalError('');
    }
  }, [isOpen, roundName, roundCode, projectRoundId, schedules, distinctRooms, dateRange, studentCount]);

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
      setLocalError(err?.message || 'Có lỗi khi gửi thông báo lịch bảo vệ.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '700px',
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
              <span>📢</span> Gửi thông báo Lịch bảo vệ chính thức
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Chuyển phát lịch thi đến toàn bộ Hội đồng, Giảng viên hướng dẫn và Sinh viên bảo vệ
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
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>LỊCH BẢO VỆ CHO ĐỢT:</div>
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
              🔒 ĐÃ CHỐT LỊCH THI
            </span>
          </div>

          {/* Schedule Metrics Grid */}
          <div style={{
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '14px',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
              📊 Tổng quan thông số lịch bảo vệ ({recipientCount} người nhận):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Số ca thi</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0a3273' }}>{schedules.length}</div>
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Phòng thi</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7' }}>{distinctRooms.length || 1}</div>
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Giảng viên</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>{lecturerCount}</div>
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Sinh viên bảo vệ</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>{studentCount}</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
              📍 <strong>Phòng thi:</strong> {distinctRooms.length > 0 ? distinctRooms.join(', ') : 'Chưa cập nhật'} • 📅 <strong>Ngày thi:</strong> {dateRange}
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
                <span>Gửi tới toàn bộ {lecturerCount} Giảng viên (Hội đồng & GVHD)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyStudents}
                  onChange={(e) => setNotifyStudents(e.target.checked)}
                  disabled={loading}
                />
                <span>Gửi tới toàn bộ {studentCount} Sinh viên bảo vệ</span>
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
            <label htmlFor="schedule-notify-title" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Tiêu đề thông báo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="schedule-notify-title"
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
              placeholder="Nhập tiêu đề thông báo lịch..."
            />
          </div>

          {/* Message textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="schedule-notify-message" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Nội dung thông báo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="schedule-notify-message"
              rows={7}
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
              placeholder="Nhập nội dung thông báo lịch..."
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
