import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Modal } from '../../../components/ui';
import { ScheduleCalendarView } from '../components/ScheduleCalendarView';
import { ScheduleConfigModal } from '../components/ScheduleConfigModal';
import { defenseService } from '../services/defenseService';
import { apiService } from '../../../services/api';
import type { DefenseSchedule, DefenseCouncil, ScheduleConfig } from '../types';
import './DefensePages.css';

export const DefenseSchedulePage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams] = useSearchParams();

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor' || (userType as any) === 'lecturer';
  const isCommittee = userType === 'committee_member' || (userType as any) === 'committee';
  const canManageSchedule = userType === 'admin' || isCommittee;

  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number>(16);

  const [schedules, setSchedules] = useState<DefenseSchedule[]>([]);
  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ROOM' | 'SESSION'>('ROOM');
  const [loading, setLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<DefenseSchedule | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoading(true);
      const rList = await apiService.getProjectRounds();
      setRounds(rList || []);

      const queryRoundId = searchParams.get('roundId');
      let targetRoundId = 16;
      if (queryRoundId && !isNaN(Number(queryRoundId))) {
        targetRoundId = Number(queryRoundId);
      } else if (rList && rList.length > 0) {
        const active: any = rList.find((r: any) => r.status === 'IN_PROGRESS');
        const last: any = rList[rList.length - 1];
        targetRoundId = active ? (active.roundId || active.id) : (last?.roundId || last?.id);
      }
      setSelectedRoundId(targetRoundId);
      await loadSchedulesForRound(targetRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi khởi tạo lịch bảo vệ' });
    } finally {
      setLoading(false);
    }
  };

  const loadSchedulesForRound = async (roundId: number) => {
    try {
      setLoading(true);
      const [sList, cList] = await Promise.all([
        defenseService.getSchedules(undefined, roundId),
        defenseService.getCouncils(roundId),
      ]);
      setSchedules(sList);
      setCouncils(cList);

      // Auto pick date if schedules exist
      if (sList.length > 0) {
        const hasCurrentDate = sList.some((s) => s.defenseDate === currentDate);
        if (!hasCurrentDate && sList[0].defenseDate) {
          setCurrentDate(sList[0].defenseDate);
        }
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải lịch bảo vệ' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoundChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoundId = Number(e.target.value);
    setSelectedRoundId(newRoundId);
    await loadSchedulesForRound(newRoundId);
  };

  // Determine if student is scheduled in any council/schedule
  const currentStudentDefense = useMemo(() => {
    if (!user) return null;
    const uId = user.id ? Number(user.id) : null;
    const uStudentId = user.student_id ? Number(user.student_id) : null;
    const code = (user.studentCode || user.registration_no || user.student_id || user.username || '').toString().toLowerCase();
    const fullName = (user.fullName || '').toString().toLowerCase();

    for (const schedule of schedules) {
      // Check in assignedStudents if available
      if (schedule.assignedStudents && schedule.assignedStudents.length > 0) {
        const match = schedule.assignedStudents.find((s) => {
          if (uId && s.studentId === uId) return true;
          if (uStudentId && s.studentId === uStudentId) return true;
          if (s.studentCode && code.includes(s.studentCode.toLowerCase())) return true;
          if (s.studentName && fullName.includes(s.studentName.toLowerCase())) return true;
          return false;
        });
        if (match) {
          return { schedule, studentDetail: match };
        }
      }

      // Check council studentIds
      const council = councils.find((c) => c.id === schedule.councilId);
      const studentIds = schedule.studentIds || council?.studentIds || [];
      const matchId = studentIds.some((sId) => {
        if (uId && sId === uId) return true;
        if (uStudentId && sId === uStudentId) return true;
        if (String(sId) === code || code.endsWith(String(sId))) return true;
        return false;
      });
      if (matchId) {
        return {
          schedule,
          studentDetail: {
            studentId: uId || 0,
            studentName: user.fullName || 'Bạn',
            studentCode: user.studentCode || user.username || '',
            thesisId: 0,
            thesisTitle: 'Đề tài tốt nghiệp chính thức',
            advisorId: 0,
            advisorName: 'Giảng viên hướng dẫn',
          },
        };
      }
    }
    return null;
  }, [schedules, councils, user]);

  // Lecturer role in schedules
  const lecturerDefenseInfo = useMemo(() => {
    if (!user || (!isSupervisor && !isCommittee)) return null;
    const uId = user.id ? Number(user.id) : null;
    const lecturerId = user.lecturerId ? Number(user.lecturerId) : uId;
    const fullName = (user.fullName || '').toLowerCase();

    const supervisingSchedules: Array<{ schedule: DefenseSchedule; students: any[] }> = [];
    const committeeSchedules: Array<{ schedule: DefenseSchedule; role: string }> = [];

    for (const schedule of schedules) {
      // 1. Is this lecturer GVHD of any student in this schedule?
      if (schedule.assignedStudents && schedule.assignedStudents.length > 0) {
        const mySupervised = schedule.assignedStudents.filter(
          (s) => s.advisorId === lecturerId || (s.advisorName && fullName.includes(s.advisorName.toLowerCase()))
        );
        if (mySupervised.length > 0) {
          supervisingSchedules.push({ schedule, students: mySupervised });
        }
      }

      // 2. Is this lecturer a Council Member in this schedule?
      const council = councils.find((c) => c.id === schedule.councilId);
      const members = schedule.members || council?.members || [];
      const myMember = members.find(
        (m) => m.lecturerId === lecturerId || (m.lecturerName && fullName.includes(m.lecturerName.toLowerCase()))
      );
      if (myMember) {
        let roleName = 'Ủy viên';
        if (myMember.role === 'PRESIDENT') roleName = 'Chủ tịch Hội đồng';
        else if (myMember.role === 'SECRETARY') roleName = 'Thư ký Hội đồng';
        committeeSchedules.push({ schedule, role: roleName });
      }
    }

    return { supervisingSchedules, committeeSchedules };
  }, [schedules, councils, user, isSupervisor, isCommittee]);

  // Schedules filtered by currentDate
  const visibleSchedules = useMemo(() => {
    if (!currentDate) return schedules;
    const list = schedules.filter((s) => s.defenseDate === currentDate);
    return list.length > 0 ? list : schedules;
  }, [schedules, currentDate]);

  const handleAutoGenerate = async () => {
    try {
      setLoading(true);
      const res = await defenseService.autoGenerateSchedules({
        projectRoundId: selectedRoundId,
        rooms: ['Phòng Hội thảo A2-301', 'Phòng Lab 402-A1', 'Phòng Chuyên đề A6-205'],
        sessions: ['MORNING', 'AFTERNOON'],
        startDate: currentDate,
      });
      setSchedules(res);
      setNotification({
        type: 'success',
        message: 'Tự động xếp lịch bảo vệ thành công! Cả Giảng viên và Sinh viên đều đã có thể xem lịch chính thức.',
      });
      await loadSchedulesForRound(selectedRoundId);
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
      await loadSchedulesForRound(selectedRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi lưu lịch' });
    }
  };

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">
            {isStudent ? 'Lịch Bảo Vệ Đồ Án Tốt Nghiệp' : 'GĐ5: Xếp Lịch & Theo Dõi Bảo Vệ Luận Văn'}
          </h1>
          <p className="feature-page-subtitle">
            {isStudent
              ? 'Xem thông tin phòng bảo vệ, hội đồng chấm (1CT-2TK-2UV) và khung thời gian bảo vệ của bạn.'
              : 'Sau khi chốt Hội đồng, hệ thống tự động bố trí phòng bảo vệ, ca sáng/chiều tránh trùng lắp khung giờ.'}
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Round Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
            <label htmlFor="roundSelectSchedule" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              📁 Đợt đồ án:
            </label>
            <select
              id="roundSelectSchedule"
              value={selectedRoundId}
              onChange={handleRoundChange}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0a3273',
                background: '#fff',
              }}
            >
              {rounds.map((r: any) => {
                const rid = r.roundId || r.id;
                return (
                  <option key={rid} value={rid}>
                    {r.name} ({r.roundCode || `ID: ${rid}`})
                  </option>
                );
              })}
            </select>
          </div>

          {canManageSchedule && (
            <>
              <Button variant="primary" onClick={handleAutoGenerate} loading={loading}>
                ⚡ Tự động chạy xếp lịch
              </Button>
              <Button variant="outline" onClick={() => setIsConfigModalOpen(true)}>
                + Cấu hình ca bảo vệ
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => loadSchedulesForRound(selectedRoundId)} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* 1. STUDENT PERSONAL DEFENSE HERO CARD */}
      {isStudent && (
        <div style={{
          background: currentStudentDefense ? '#f0fdf4' : '#fffbeb',
          border: `2px solid ${currentStudentDefense ? '#86efac' : '#fde68a'}`,
          borderRadius: '10px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          {currentStudentDefense ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{
                  background: '#16a34a',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}>
                  🎉 ĐÃ XẾP LỊCH BẢO VỆ CHÍNH THỨC
                </span>
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                  Trạng thái: SẴN SÀNG BẢO VỆ TRƯỚC HỘI ĐỒNG
                </span>
              </div>

              <h2 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: '#065f46' }}>
                Sinh viên: <strong>{currentStudentDefense.studentDetail.studentName}</strong> (MSSV: {currentStudentDefense.studentDetail.studentCode})
              </h2>

              <div style={{ fontSize: '0.95rem', color: '#047857', marginBottom: '16px', fontWeight: 600 }}>
                📖 Đề tài: {currentStudentDefense.studentDetail.thesisTitle}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                background: '#fff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                marginBottom: '14px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>📅 Ngày bảo vệ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273' }}>
                    {currentStudentDefense.schedule.defenseDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>⏰ Ca & Khung giờ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273' }}>
                    {currentStudentDefense.schedule.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'} ({currentStudentDefense.schedule.startTime} - {currentStudentDefense.schedule.endTime})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>🏛️ Địa điểm / Phòng</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273' }}>
                    {currentStudentDefense.schedule.room}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>⚖️ Hội đồng chấm thi</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273' }}>
                    {currentStudentDefense.schedule.councilName}
                  </div>
                </div>
              </div>

              {/* Council 5 Members */}
              {currentStudentDefense.schedule.members && currentStudentDefense.schedule.members.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', marginBottom: '8px' }}>
                    👥 Thành viên Hội đồng chấm thi (1CT - 2TK - 2UV):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {currentStudentDefense.schedule.members.map((m) => (
                      <span
                        key={m.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155'
                        }}
                      >
                        {m.role === 'PRESIDENT' ? '⭐ Chủ tịch: ' : m.role === 'SECRETARY' ? '📝 Thư ký: ' : '👤 Ủy viên: '}
                        <strong>{m.lecturerName}</strong>
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontStyle: 'italic' }}>
                    🛡️ GVHD: {currentStudentDefense.studentDetail.advisorName} (Đã chấm điểm hướng dẫn quá trình — Không tham gia chấm Hội đồng theo quy chế)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '1rem', marginBottom: '4px' }}>
                ℹ️ Chưa có lịch bảo vệ được xếp cho sinh viên: {user?.fullName || user?.username || 'Bạn'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#b45309' }}>
                Admin Khoa đang hoàn tất chốt danh sách Hội đồng và xếp lịch bảo vệ. Vui lòng quay lại sau hoặc liên hệ Bộ môn.
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LECTURER SPECIFIC NOTICE BANNER */}
      {(isSupervisor || isCommittee) && lecturerDefenseInfo && (
        <div style={{ marginBottom: '20px' }}>
          {/* Supervising Notice */}
          {lecturerDefenseInfo.supervisingSchedules.length > 0 && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎓</span>
              <div>
                <strong style={{ color: '#166534', fontSize: '14px' }}>
                  Bạn có sinh viên hướng dẫn bảo vệ tại đợt này:
                </strong>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#15803d' }}>
                  {lecturerDefenseInfo.supervisingSchedules.map((item, idx) => (
                    <div key={idx}>
                      • Phòng <strong>{item.schedule.room}</strong> ({item.schedule.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'} {item.schedule.startTime} - {item.schedule.endTime}, ngày {item.schedule.defenseDate}):{' '}
                      {item.students.map((s) => `${s.studentName} (${s.studentCode}) - Đề tài: "${s.thesisTitle}"`).join(', ')}
                    </div>
                  ))}
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ Nhắc nhở quy chế: GVHD không ngồi trong Hội đồng chấm thi sinh viên của mình. Điểm hướng dẫn của bạn đã được ghi nhận lúc xác nhận đủ điều kiện bảo vệ.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Committee Member Notice */}
          {lecturerDefenseInfo.committeeSchedules.length > 0 && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚖️</span>
              <div>
                <strong style={{ color: '#1e40af', fontSize: '14px' }}>
                  Nhiệm vụ Hội đồng chấm thi của bạn:
                </strong>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#1d4ed8' }}>
                  {lecturerDefenseInfo.committeeSchedules.map((item, idx) => (
                    <div key={idx}>
                      • Bạn tham gia với tư cách <strong>{item.role}</strong> tại {item.schedule.councilName} — Phòng <strong>{item.schedule.room}</strong> ({item.schedule.defenseDate}, {item.schedule.startTime} - {item.schedule.endTime}).
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
        <ScheduleCalendarView
          schedules={visibleSchedules}
          viewMode={viewMode}
          onSelectSchedule={(sched) => setSelectedScheduleDetail(sched)}
        />
      </div>

      {/* Defense Schedule Detail Modal */}
      {selectedScheduleDetail && (() => {
        const detailCouncil = councils.find((c) => c.id === selectedScheduleDetail.councilId);
        const detailMembers =
          (selectedScheduleDetail.members && selectedScheduleDetail.members.length > 0
            ? selectedScheduleDetail.members
            : detailCouncil?.members) || [];
        const detailStudents =
          (selectedScheduleDetail.assignedStudents && selectedScheduleDetail.assignedStudents.length > 0
            ? selectedScheduleDetail.assignedStudents
            : detailCouncil?.assignedStudents) || [];

        return (
          <Modal
            isOpen={true}
            onClose={() => setSelectedScheduleDetail(null)}
            title={`📋 Chi Tiết Ca Bảo Vệ — ${selectedScheduleDetail.councilName}`}
            maxWidth="820px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Thông tin phòng, ngày, ca */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🏛️ Phòng bảo vệ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273', marginTop: '2px' }}>
                    {selectedScheduleDetail.room}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>📅 Ngày bảo vệ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273', marginTop: '2px' }}>
                    {selectedScheduleDetail.defenseDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>⏰ Ca &amp; Khung giờ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273', marginTop: '2px' }}>
                    {selectedScheduleDetail.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'} ({selectedScheduleDetail.startTime} - {selectedScheduleDetail.endTime})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>⚖️ Hội đồng</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', marginTop: '2px' }}>
                    {selectedScheduleDetail.councilCode || detailCouncil?.code || selectedScheduleDetail.councilName}
                  </div>
                </div>
              </div>

              {/* 2. Danh sách 5 thành viên Hội đồng */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '10px' }}>
                  👥 Thành viên Hội đồng chấm thi ({detailMembers.length} Giảng viên — Cơ cấu 1CT - 2TK - 2UV):
                </div>
                {detailMembers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {detailMembers.map((m) => {
                      const roleLabel =
                        m.role === 'PRESIDENT'
                          ? '⭐ Chủ tịch Hội đồng'
                          : m.role === 'SECRETARY'
                          ? '📝 Ủy viên Thư ký'
                          : '👤 Ủy viên Hội đồng';
                      const roleColor =
                        m.role === 'PRESIDENT' ? '#b45309' : m.role === 'SECRETARY' ? '#0369a1' : '#334155';
                      const roleBg =
                        m.role === 'PRESIDENT' ? '#fef3c7' : m.role === 'SECRETARY' ? '#e0f2fe' : '#f1f5f9';
                      return (
                        <div
                          key={m.id || `${m.lecturerId}-${m.role}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: roleBg,
                              color: roleColor,
                              marginBottom: '4px',
                            }}
                          >
                            {roleLabel}
                          </span>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>{m.lecturerName}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                    Chưa có danh sách thành viên Hội đồng.
                  </div>
                )}
              </div>

              {/* 3. Danh sách Sinh viên bảo vệ trong ca đó */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '10px' }}>
                  🎓 Danh sách sinh viên bảo vệ trong ca này ({detailStudents.length} sinh viên):
                </div>
                {detailStudents.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 10px' }}>STT</th>
                          <th style={{ padding: '8px 10px' }}>MSSV</th>
                          <th style={{ padding: '8px 10px' }}>Họ và tên SV</th>
                          <th style={{ padding: '8px 10px' }}>Đề tài bảo vệ</th>
                          <th style={{ padding: '8px 10px' }}>GVHD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailStudents.map((st, idx) => (
                          <tr key={st.studentId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{st.studentName}</td>
                            <td style={{ padding: '8px 10px', color: '#334155' }}>{st.thesisTitle}</td>
                            <td style={{ padding: '8px 10px', color: '#15803d', fontWeight: 600 }}>
                              {st.advisorName || (st.advisorId ? `GV #${st.advisorId}` : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                    Chưa có sinh viên nào được xếp trong ca bảo vệ này.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setSelectedScheduleDetail(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

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
