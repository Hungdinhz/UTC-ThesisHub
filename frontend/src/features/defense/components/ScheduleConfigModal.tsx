import React, { useState } from 'react';
import { Modal, Button } from '../../../components/ui';
import type { ScheduleConfig, DefenseCouncil } from '../types';

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  councils: DefenseCouncil[];
  onSave: (config: ScheduleConfig) => Promise<void>;
  defaultDate?: string;
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  councils,
  onSave,
  defaultDate,
}) => {
  const [councilId, setCouncilId] = useState<number>(councils[0]?.id || 1);
  const [defenseDate, setDefenseDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [room, setRoom] = useState('Phòng Hội thảo A2-301');
  const [startTime, setStartTime] = useState('08:00:00');
  const [endTime, setEndTime] = useState('11:30:00');
  const [maxStudents, setMaxStudents] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onSave({
        councilId,
        defenseDate,
        session,
        room,
        startTime,
        endTime,
        maxStudents,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi lưu lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu hình lịch bảo vệ Hội đồng"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="councilSelect">Chọn Hội đồng bảo vệ:</label>
          <select
            id="councilSelect"
            className="form-control"
            value={councilId}
            onChange={(e) => setCouncilId(Number(e.target.value))}
            required
          >
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
              <option value="Phòng Hội thảo A2-301">Phòng Hội thảo A2-301</option>
              <option value="Phòng Lab 402-A1">Phòng Lab 402-A1</option>
              <option value="Phòng Chuyên đề A6-205">Phòng Chuyên đề A6-205</option>
              <option value="Hội trường lớn A2">Hội trường lớn A2</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxStudentsSched">Số SV tối đa:</label>
            <input
              id="maxStudentsSched"
              type="number"
              min={1}
              max={20}
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

        <div className="form-group">
          <label htmlFor="schedNotes">Ghi chú điều hành / Trang thiết bị:</label>
          <textarea
            id="schedNotes"
            rows={2}
            className="form-control"
            placeholder="Ví dụ: Cần chuẩn bị 2 máy chiếu, micro không dây và hệ thống demo IoT..."
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
            Lưu Lịch bảo vệ
          </Button>
        </div>
      </form>
    </Modal>
  );
};
