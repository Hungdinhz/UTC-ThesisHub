import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui';
import { ScheduleCalendarView } from '../components/ScheduleCalendarView';
import { ScheduleConfigModal } from '../components/ScheduleConfigModal';
import { defenseService } from '../services/defenseService';
import type { DefenseSchedule, DefenseCouncil, ScheduleConfig } from '../types';
import './DefensePages.css';

export const DefenseSchedulePage: React.FC = () => {
  const { userType, user } = useAuth();
  const isStudent = userType === 'student';
  const canManageSchedule = userType === 'admin' || userType === 'committee_member';

  const [schedules, setSchedules] = useState<DefenseSchedule[]>([]);
  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ROOM' | 'SESSION'>('ROOM');
  const [loading, setLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Determine if a council has the current student
  const isStudentInCouncil = (council: DefenseCouncil): boolean => {
    if (!user) return false;
    const studentIds = council.studentIds || [];
    const uId = user.id ? Number(user.id) : null;
    const uStudentId = user.student_id ? Number(user.student_id) : null;
    const code = (user.studentCode || user.registration_no || user.student_id || user.username || '').toString().toLowerCase();
    const fullName = (user.fullName || '').toString().toLowerCase();

    // Direct ID check
    if (uId && studentIds.includes(uId)) return true;
    if (uStudentId && studentIds.includes(uStudentId)) return true;

    // Suffix check (e.g. '201200101' ends with '101')
    for (const sId of studentIds) {
      if (String(sId) === code || code.endsWith(String(sId))) {
        return true;
      }
    }

    // Standard student demo mappings
    if ((uId === 2 || code.includes('201200101') || fullName.includes('nguyễn văn an')) && studentIds.includes(101)) return true;
    if ((uId === 3 || code.includes('201200102') || fullName.includes('trần thị bình')) && studentIds.includes(102)) return true;
    if ((uId === 4 || code.includes('201200103') || fullName.includes('lê hoàng cường')) && studentIds.includes(103)) return true;
    if ((uId === 5 || code.includes('201200104') || fullName.includes('phạm minh đức')) && studentIds.includes(104)) return true;
    if ((uId === 1 || code.includes('2021601234') || fullName.includes('nguyễn văn sinh viên')) && (studentIds.includes(1) || studentIds.includes(101))) return true;

    return false;
  };

  // Student only sees their own defense council schedules
  const visibleSchedules = useMemo(() => {
    if (!isStudent) return schedules;
    const myCouncils = councils.filter(isStudentInCouncil);
    const myCouncilIds = myCouncils.map(c => c.id);
    return schedules.filter(s => myCouncilIds.includes(s.councilId));
  }, [schedules, councils, isStudent, user]);

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
          <h1 className="feature-page-title">
            {isStudent ? 'Tra Cứu Lịch Bảo Vệ Đồ Án Tốt Nghiệp' : 'Xếp lịch và Điều hành Bảo vệ Luận văn'}
          </h1>
          <p className="feature-page-subtitle">
            {isStudent
              ? 'Xem thông tin phòng bảo vệ, hội đồng và khung thời gian bảo vệ đồ án tốt nghiệp.'
              : 'Hệ thống xếp lịch tự động theo Timeline, Phòng bảo vệ và Ca sáng/chiều tránh trùng lắp khung giờ.'}
          </p>
        </div>
        {canManageSchedule && (
          <div className="header-actions">
            <Button variant="primary" onClick={handleAutoGenerate} loading={loading}>
              ⚡ Tự động sinh lịch bảo vệ
            </Button>
            <Button variant="outline" onClick={() => setIsConfigModalOpen(true)}>
              + Thêm / Cấu hình lịch
            </Button>
          </div>
        )}
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

      {/* Student Personal Defense Info Notice */}
      {isStudent && (
        <div style={{
          background: visibleSchedules.length > 0 ? '#ecfdf5' : '#fffbeb',
          border: `1px solid ${visibleSchedules.length > 0 ? '#a7f3d0' : '#fde68a'}`,
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>{visibleSchedules.length > 0 ? '🎓' : 'ℹ️'}</span>
          <div>
            <div style={{ fontWeight: 700, color: visibleSchedules.length > 0 ? '#065f46' : '#92400e', fontSize: '0.95rem' }}>
              {visibleSchedules.length > 0
                ? `Lịch bảo vệ đồ án của sinh viên: ${user?.fullName || user?.username || 'Bạn'}`
                : `Lịch bảo vệ sinh viên: ${user?.fullName || user?.username || 'Bạn'}`}
            </div>
            <div style={{ fontSize: '0.85rem', color: visibleSchedules.length > 0 ? '#047857' : '#b45309', marginTop: '2px' }}>
              {visibleSchedules.length > 0
                ? `Hội đồng: ${visibleSchedules[0].councilName} • Địa điểm: ${visibleSchedules[0].room} • Khung giờ: ${visibleSchedules[0].startTime} - ${visibleSchedules[0].endTime} (${currentDate})`
                : `Hệ thống chỉ hiển thị lịch bảo vệ của chính bạn. Chưa tìm thấy lịch bảo vệ của bạn vào ngày ${currentDate}. Vui lòng chọn ngày khác hoặc liên hệ Khoa.`}
            </div>
          </div>
        </div>
      )}

      {/* Schedules Content */}
      <div className="schedule-content-box">
        <ScheduleCalendarView schedules={visibleSchedules} viewMode={viewMode} />
      </div>

      {/* Config Modal */}
      {canManageSchedule && (
        <ScheduleConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          councils={councils}
          defaultDate={currentDate}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
};
