import React from 'react';
import { StatusBadge } from '../../../components/ui';
import type { DefenseSchedule } from '../types';
import './DefenseComponents.css';

interface ScheduleCalendarViewProps {
  schedules: DefenseSchedule[];
  viewMode: 'TIMELINE' | 'ROOM' | 'SESSION';
  onSelectSchedule?: (schedule: DefenseSchedule) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedules,
  viewMode,
  onSelectSchedule,
}) => {
  if (schedules.length === 0) {
    return <div className="schedule-empty-view">Chưa có lịch bảo vệ nào được xếp cho ngày đã chọn</div>;
  }

  if (viewMode === 'ROOM') {
    // Group by room
    const rooms = Array.from(new Set(schedules.map((s) => s.room)));
    return (
      <div className="schedule-room-grid">
        {rooms.map((room) => {
          const roomSchedules = schedules.filter((s) => s.room === room);
          return (
            <div key={room} className="schedule-room-column">
              <div className="room-column-header">
                <h3>🏛️ {room}</h3>
                <span className="room-count">{roomSchedules.length} ca</span>
              </div>
              <div className="room-schedules-list">
                {roomSchedules.map((item) => (
                  <div
                    key={item.id}
                    className={`schedule-item-card session-${item.session.toLowerCase()}`}
                    onClick={() => onSelectSchedule && onSelectSchedule(item)}
                    style={{ cursor: onSelectSchedule ? 'pointer' : 'default' }}
                    title="Bấm vào để xem chi tiết ca bảo vệ, thành viên hội đồng và danh sách sinh viên"
                  >
                    <div className="schedule-time-badge">
                      ⏰ {item.startTime} - {item.endTime} ({item.session === 'MORNING' ? 'Sáng' : 'Chiều'})
                    </div>
                    <div className="schedule-council-name">{item.councilName}</div>
                    <div className="schedule-capacity">
                      👥 {item.assignedStudents?.length || item.studentIds?.length || 0} / {item.maxStudents} sinh viên bảo vệ
                    </div>
                    {item.notes && <div className="schedule-notes">{item.notes}</div>}
                    <div className="schedule-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={item.status} label={item.status === 'SCHEDULED' ? 'Đã lên lịch' : item.status} size="sm" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a3273' }}>
                        🔍 Xem chi tiết &raquo;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'SESSION') {
    // Group by session: MORNING / AFTERNOON
    const sessions = ['MORNING', 'AFTERNOON'];
    return (
      <div className="schedule-session-grid">
        {sessions.map((sess) => {
          const sessSchedules = schedules.filter((s) => s.session === sess);
          return (
            <div key={sess} className="schedule-session-column">
              <div className="session-column-header">
                <h3>{sess === 'MORNING' ? '🌅 Ca Sáng (08:00 - 11:30)' : '🌇 Ca Chiều (13:30 - 17:00)'}</h3>
                <span className="session-count">{sessSchedules.length} Hội đồng</span>
              </div>
              <div className="session-schedules-list">
                {sessSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="schedule-item-card"
                    onClick={() => onSelectSchedule && onSelectSchedule(item)}
                    style={{ cursor: onSelectSchedule ? 'pointer' : 'default' }}
                    title="Bấm vào để xem chi tiết ca bảo vệ, thành viên hội đồng và danh sách sinh viên"
                  >
                    <div className="schedule-room-badge">📍 {item.room}</div>
                    <div className="schedule-council-name">{item.councilName}</div>
                    <div className="schedule-time-row">
                      ⏰ {item.startTime} - {item.endTime} | 👥 {item.assignedStudents?.length || item.studentIds?.length || 0} / {item.maxStudents} SV
                    </div>
                    {item.notes && <div className="schedule-notes">{item.notes}</div>}
                    <div className="schedule-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={item.status} size="sm" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a3273' }}>
                        🔍 Xem chi tiết &raquo;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default: Timeline View
  return (
    <div className="schedule-timeline-view">
      {schedules.map((item) => (
        <div
          key={item.id}
          className="timeline-row"
          onClick={() => onSelectSchedule && onSelectSchedule(item)}
          style={{ cursor: onSelectSchedule ? 'pointer' : 'default' }}
          title="Bấm vào để xem chi tiết ca bảo vệ, thành viên hội đồng và danh sách sinh viên"
        >
          <div className="timeline-time-col">
            <span className="time-start">{item.startTime}</span>
            <span className="time-divider">↓</span>
            <span className="time-end">{item.endTime}</span>
          </div>
          <div className="timeline-content-card">
            <div className="timeline-card-header">
              <span className="council-title">{item.councilName}</span>
              <div className="header-tags">
                <span className="room-tag">🏛️ {item.room}</span>
                <span className="session-tag">{item.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'}</span>
                <StatusBadge status={item.status} size="sm" />
              </div>
            </div>
            <div className="timeline-card-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span>👥 Sinh viên bảo vệ: {item.assignedStudents?.length || item.studentIds?.length || 0} / {item.maxStudents} SV</span>
                {item.notes && <span className="notes-text" style={{ marginLeft: '12px' }}>📝 {item.notes}</span>}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a3273' }}>
                🔍 Bấm để xem chi tiết ca bảo vệ &raquo;
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
