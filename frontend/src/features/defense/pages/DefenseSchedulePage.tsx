import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';
import { ScheduleCalendarView } from '../components/ScheduleCalendarView';
import { ScheduleConfigModal } from '../components/ScheduleConfigModal';
import { defenseService } from '../services/defenseService';
import type { DefenseSchedule, DefenseCouncil, ScheduleConfig } from '../types';
import './DefensePages.css';

export const DefenseSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<DefenseSchedule[]>([]);
  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ROOM' | 'SESSION'>('ROOM');
  const [loading, setLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [currentDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const [sList, cList] = await Promise.all([
        defenseService.getSchedules(currentDate),
        defenseService.getCouncils(10),
      ]);
      setSchedules(sList);
      setCouncils(cList);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải lịch bảo vệ' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setLoading(true);
      const res = await defenseService.autoGenerateSchedules({
        projectRoundId: 10,
        rooms: ['Phòng Hội thảo A2-301', 'Phòng Lab 402-A1', 'Phòng Chuyên đề A6-205'],
        sessions: ['MORNING', 'AFTERNOON'],
        startDate: currentDate,
      });
      setSchedules(res);
      setNotification({
        type: 'success',
        message: 'Tự động xếp lịch bảo vệ thành công! Đã tự động bố trí tránh trùng phòng và khung giờ.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi tự động xếp lịch' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (config: ScheduleConfig) => {
    try {
      await defenseService.configureSchedule(config);
      setNotification({ type: 'success', message: 'Lưu lịch bảo vệ thành công!' });
      await loadSchedules();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi lưu lịch' });
    }
  };

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Xếp lịch và Điều hành Bảo vệ Luận văn</h1>
          <p className="feature-page-subtitle">
            Hệ thống xếp lịch tự động theo Timeline, Phòng bảo vệ và Ca sáng/chiều tránh trùng lắp khung giờ.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleAutoGenerate} loading={loading}>
            ⚡ Tự động sinh lịch bảo vệ
          </Button>
          <Button variant="outline" onClick={() => setIsConfigModalOpen(true)}>
            + Thêm / Cấu hình lịch
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Control bar: Date Picker + View Mode Buttons */}
      <div className="schedule-control-bar">
        <div className="date-picker-group">
          <label htmlFor="defenseDateInput">Chọn ngày bảo vệ:</label>
          <input
            id="defenseDateInput"
            type="date"
            className="form-control date-input"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'ROOM' ? 'active' : ''}`}
            onClick={() => setViewMode('ROOM')}
          >
            🏛️ Theo Phòng
          </button>
          <button
            className={`toggle-btn ${viewMode === 'SESSION' ? 'active' : ''}`}
            onClick={() => setViewMode('SESSION')}
          >
            🌅 Theo Ca (Sáng/Chiều)
          </button>
          <button
            className={`toggle-btn ${viewMode === 'TIMELINE' ? 'active' : ''}`}
            onClick={() => setViewMode('TIMELINE')}
          >
            ⏱️ Dạng Timeline
          </button>
        </div>
      </div>

      {/* Schedules Content */}
      <div className="schedule-content-box">
        <ScheduleCalendarView schedules={schedules} viewMode={viewMode} />
      </div>

      {/* Config Modal */}
      <ScheduleConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        councils={councils}
        defaultDate={currentDate}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};
