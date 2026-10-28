import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { ScheduleConfig, DefenseCouncil, DefenseSchedule } from '../types';
import type { Thesis } from '../../thesis/types';

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  councils: DefenseCouncil[];
  eligibleTheses?: Thesis[];
  allSchedules?: DefenseSchedule[];
  editingSchedule?: DefenseSchedule | null;
  onSave: (config: ScheduleConfig, scheduleId?: number) => Promise<void>;
  defaultDate?: string;
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  councils,
  eligibleTheses = [],
  allSchedules = [],
  editingSchedule = null,
  onSave,
  defaultDate,
}) => {
  const [councilId, setCouncilId] = useState<number>(councils[0]?.id || 0);
  const [defenseDate, setDefenseDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [room, setRoom] = useState('Phòng Hội thảo A2-301');
  const [customRoom, setCustomRoom] = useState('');
  const [startTime, setStartTime] = useState('08:00:00');
  const [endTime, setEndTime] = useState('11:30:00');
  const [maxStudents, setMaxStudents] = useState(12);
  const [notes, setNotes] = useState('');
  const [selectedThesisIds, setSelectedThesisIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const presetRooms = [
    'Phòng Hội thảo A2-301',
    'Phòng Lab 402-A1',
    'Phòng Chuyên đề A6-205',
    'Hội trường lớn A2',
  ];

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSearchTerm('');
    if (editingSchedule) {
      setCouncilId(editingSchedule.councilId || councils[0]?.id || 0);
      setDefenseDate(editingSchedule.defenseDate || defaultDate || new Date().toISOString().split('T')[0]);
      setSession((editingSchedule.session as 'MORNING' | 'AFTERNOON') || 'MORNING');
      if (presetRooms.includes(editingSchedule.room)) {
        setRoom(editingSchedule.room);
        setCustomRoom('');
      } else {
        setRoom('CUSTOM');
        setCustomRoom(editingSchedule.room || '');
      }
      setStartTime(editingSchedule.startTime || '08:00:00');
      setEndTime(editingSchedule.endTime || '11:30:00');
      setMaxStudents(editingSchedule.maxStudents || 12);
      setNotes(editingSchedule.notes || '');
      const existingIds =
        editingSchedule.thesisIds && editingSchedule.thesisIds.length > 0
          ? editingSchedule.thesisIds
          : (editingSchedule.assignedStudents || []).map((s) => s.thesisId).filter(Boolean);
      setSelectedThesisIds(existingIds);
    } else {
      setCouncilId(councils[0]?.id || 0);
      setDefenseDate(defaultDate || new Date().toISOString().split('T')[0]);
      setSession('MORNING');
      setRoom('Phòng Hội thảo A2-301');
      setCustomRoom('');
      setStartTime('08:00:00');
      setEndTime('11:30:00');
      setMaxStudents(12);
      setNotes('');
      setSelectedThesisIds([]);
    }
  }, [isOpen, editingSchedule, councils, defaultDate]);

  const selectedCouncil = useMemo(
    () => councils.find((c) => c.id === councilId) || null,
    [councils, councilId]
  );

  const councilMemberLecturerIds = useMemo(() => {
    const set = new Set<number>();
    (selectedCouncil?.members || []).forEach((m) => {
      if (m.lecturerId) set.add(Number(m.lecturerId));
    });
    return set;
  }, [selectedCouncil]);

  // Map thesisId -> schedule room/session for other schedules
  const scheduledElsewhereMap = useMemo(() => {
    const map = new Map<number, string>();
    allSchedules.forEach((sch) => {
      if (editingSchedule && sch.id === editingSchedule.id) return;
      const ids =
        sch.thesisIds && sch.thesisIds.length > 0
          ? sch.thesisIds
          : (sch.assignedStudents || []).map((s) => s.thesisId).filter(Boolean);
      ids.forEach((tid) => {
        map.set(tid, `${sch.room} (${sch.defenseDate} - ${sch.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'})`);
      });
    });
    return map;
  }, [allSchedules, editingSchedule]);

  const filteredTheses = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return eligibleTheses.filter((t) => {
      if (!kw) return true;
      return (
        (t.studentFullName || '').toLowerCase().includes(kw) ||
        (t.studentCode || '').toLowerCase().includes(kw) ||
        (t.titleVn || '').toLowerCase().includes(kw) ||
        (t.thesisCode || '').toLowerCase().includes(kw) ||
        (t.lecturerFullName || '').toLowerCase().includes(kw)
      );
    });
  }, [eligibleTheses, searchTerm]);

  const handleSessionChange = (newSession: 'MORNING' | 'AFTERNOON') => {
    setSession(newSession);
    if (newSession === 'MORNING') {
      setStartTime('08:00:00');
      setEndTime('11:30:00');
    } else {
      setStartTime('13:30:00');
      setEndTime('17:00:00');
    }
  };

  const toggleThesis = (thesis: Thesis) => {
    const advisorConflict = Boolean(thesis.lecturerId && councilMemberLecturerIds.has(Number(thesis.lecturerId)));
    if (advisorConflict) return;

    setSelectedThesisIds((prev) => {
      if (prev.includes(thesis.id)) {
        return prev.filter((id) => id !== thesis.id);
      }
      if (prev.length >= maxStudents) {
        setError(`Đã đạt số lượng tối đa ${maxStudents} sinh viên cho ca bảo vệ này.`);
        return prev;
      }
      setError('');
      return [...prev, thesis.id];
    });
  };

  const handleSelectAllCompatible = () => {
    const validIds: number[] = [];
    for (const t of eligibleTheses) {
      if (t.lecturerId && councilMemberLecturerIds.has(Number(t.lecturerId))) continue;
      if (scheduledElsewhereMap.has(t.id) && !selectedThesisIds.includes(t.id)) continue;
      validIds.push(t.id);
      if (validIds.length >= maxStudents) break;
    }
    setSelectedThesisIds(validIds);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilId) {
      setError('Vui lòng lập Hội đồng bảo vệ trước khi xếp ca lịch bảo vệ!');
      return;
    }
    const finalRoom = room === 'CUSTOM' ? customRoom.trim() : room;
    if (!finalRoom) {
      setError('Vui lòng nhập hoặc chọn phòng bảo vệ!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onSave(
        {
          councilId,
          defenseDate,
          session,
          room: finalRoom,
          startTime,
          endTime,
          maxStudents,
          notes,
          thesisIds: selectedThesisIds,
        },
        editingSchedule?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi lưu lịch bảo vệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSchedule ? '✏️ Chỉnh sửa Ca Bảo vệ & Xếp Sinh viên' : '➕ Thêm Thủ công Ca Bảo vệ & Xếp Sinh viên'}
      maxWidth="760px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="councilSelect">Chọn Hội đồng bảo vệ:</label>
          <select
            id="councilSelect"
            className="form-control"
            value={councilId}
            onChange={(e) => {
              const nextCouncilId = Number(e.target.value);
              setCouncilId(nextCouncilId);
              const nextCouncil = councils.find((c) => c.id === nextCouncilId);
              const nextLecSet = new Set((nextCouncil?.members || []).map((m) => Number(m.lecturerId)));
              setSelectedThesisIds((prev) =>
                prev.filter((tid) => {
                  const t = eligibleTheses.find((item) => item.id === tid);
                  return !t?.lecturerId || !nextLecSet.has(Number(t.lecturerId));
                })
              );
            }}
            required
          >
            {councils.length === 0 && <option value={0}>-- Chưa có Hội đồng nào trong đợt này --</option>}
            {councils.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="defenseDate">Ngày bảo vệ:</label>
            <input
              id="defenseDate"
              type="date"
              className="form-control"
              value={defenseDate}
              onChange={(e) => setDefenseDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sessionSelect">Ca bảo vệ:</label>
            <select
              id="sessionSelect"
              className="form-control"
              value={session}
              onChange={(e) => handleSessionChange(e.target.value as any)}
            >
              <option value="MORNING">Ca Sáng (08:00 - 11:30)</option>
              <option value="AFTERNOON">Ca Chiều (13:30 - 17:00)</option>
            </select>
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="roomSelect">Phòng bảo vệ:</label>
            <select
              id="roomSelect"
              className="form-control"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              {presetRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="CUSTOM">+ Nhập tên phòng khác...</option>
            </select>
            {room === 'CUSTOM' && (
              <input
                type="text"
                className="form-control"
                style={{ marginTop: '8px' }}
                placeholder="Nhập tên phòng (VD: Phòng B1-202)..."
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="maxStudentsSched">Số SV tối đa trong ca:</label>
            <input
              id="maxStudentsSched"
              type="number"
              min={1}
              max={50}
              className="form-control"
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="startTime">Giờ bắt đầu:</label>
            <input
              id="startTime"
              type="text"
              className="form-control"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">Giờ kết thúc:</label>
            <input
              id="endTime"
              type="text"
              className="form-control"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Manual Student / Thesis Selection Checklist (#16) */}
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 14px',
            background: '#f8fafc',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#0a3273' }}>
                🎓 Chọn Sinh viên / Đề tài đủ điều kiện vào ca bảo vệ này ({selectedThesisIds.length}/{maxStudents})
              </strong>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Chỉ hiển thị sinh viên đã được GVHD duyệt Đủ điều kiện bảo vệ. Tự động khóa SV có GVHD trùng thành viên Hội đồng.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSelectAllCompatible}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                }}
              >
                Chọn nhanh SV hợp lệ
              </button>
              <button
                type="button"
                onClick={() => setSelectedThesisIds([])}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Bỏ chọn hết
              </button>
            </div>
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="🔍 Tìm theo tên SV, MSSV, tên đề tài hoặc GVHD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '8px', fontSize: '13px' }}
          />

          <div
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
            }}
          >
            {filteredTheses.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                Chưa có sinh viên nào đủ điều kiện bảo vệ khớp tìm kiếm trong đợt này.
              </div>
            ) : (
              filteredTheses.map((t) => {
                const checked = selectedThesisIds.includes(t.id);
                const conflict = Boolean(t.lecturerId && councilMemberLecturerIds.has(Number(t.lecturerId)));
                const otherSched = scheduledElsewhereMap.get(t.id);
                return (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: conflict ? 'not-allowed' : 'pointer',
                      background: checked ? '#eff6ff' : conflict ? '#fef2f2' : '#fff',
                      opacity: conflict ? 0.72 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={conflict}
                      onChange={() => toggleThesis(t)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1, fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#0f172a' }}>
                          {t.studentFullName} ({t.studentCode})
                        </strong>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          GVHD: {t.lecturerFullName || '—'}
                        </span>
                      </div>
                      <div style={{ color: '#475569', marginTop: '2px' }}>
                        [{t.thesisCode}] {t.titleVn}
                      </div>
                      {conflict && (
                        <div style={{ color: '#dc2626', fontWeight: 600, fontSize: '11.5px', marginTop: '2px' }}>
                          ⚠️ Không thể chọn vào ca này vì GVHD đang nằm trong Hội đồng {selectedCouncil?.code}
                        </div>
                      )}
                      {!conflict && otherSched && (
                        <div style={{ color: '#d97706', fontSize: '11.5px', marginTop: '2px' }}>
                          ℹ️ Đang xếp ở: {otherSched} (tích chọn sẽ chuyển sang ca này)
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="schedNotes">Ghi chú điều hành / Trang thiết bị:</label>
          <textarea
            id="schedNotes"
            rows={2}
            className="form-control"
            placeholder="Ví dụ: Cần chuẩn bị máy chiếu, micro không dây và hệ thống demo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <div className="form-error-msg">{error}</div>}

        <div className="modal-actions-right">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editingSchedule ? '💾 Cập nhật Ca bảo vệ' : '💾 Lưu Ca bảo vệ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
