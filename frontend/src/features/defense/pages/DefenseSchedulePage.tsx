import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Modal } from '../../../components/ui';
import { ScheduleCalendarView } from '../components/ScheduleCalendarView';
import { ScheduleConfigModal } from '../components/ScheduleConfigModal';
import { ScheduleNotifyModal } from '../components/ScheduleNotifyModal';
import { defenseService } from '../services/defenseService';
import { thesisService } from '../../thesis/services/thesisService';
import { apiService } from '../../../services/api';
import { getCouncilRoleLabel } from '../types';
import type { DefenseSchedule, DefenseCouncil, ScheduleConfig, GraduationResult, ScheduleNotifyRequest } from '../types';
import type { Thesis } from '../../thesis/types';
import './DefensePages.css';

export const DefenseSchedulePage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams] = useSearchParams();

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor' || (userType as any) === 'lecturer';
  const isCommittee = userType === 'committee_member' || (userType as any) === 'committee';
  const canManageSchedule = userType === 'admin';

  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number>(10);
  const visibleRounds = canManageSchedule ? rounds : rounds.filter((r: any) => r.status === 'OPEN' || r.status === 'IN_PROGRESS');

  const [schedules, setSchedules] = useState<DefenseSchedule[]>([]);
  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [eligibleTheses, setEligibleTheses] = useState<Thesis[]>([]);
  const [myStudentThesis, setMyStudentThesis] = useState<Thesis | null>(null);
  const [myGraduationResult, setMyGraduationResult] = useState<GraduationResult | null>(null);

  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ROOM' | 'SESSION'>('ROOM');
  const [loading, setLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DefenseSchedule | null>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<DefenseSchedule | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [finalizingLoading, setFinalizingLoading] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [lastNotifiedAt, setLastNotifiedAt] = useState<string>('');

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoading(true);
      const rList = await apiService.getProjectRounds().catch(() => []);
      setRounds(rList || []);

      const queryRoundId = searchParams.get('roundId');
      let targetRoundId = 10;
      if (queryRoundId && !isNaN(Number(queryRoundId))) {
        targetRoundId = Number(queryRoundId);
      } else if (rList && rList.length > 0) {
        const active: any = rList.find((r: any) => r.status === 'IN_PROGRESS' || r.status === 'OPEN');
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
      const [sList, cList, tList] = await Promise.all([
        defenseService.getSchedules(undefined, roundId),
        defenseService.getCouncils(roundId),
        thesisService.searchTheses({ roundId }).catch(() => [] as Thesis[]),
      ]);
      setSchedules(sList);
      setCouncils(cList);

      const eligibleOnly = (tList || []).filter(
        (t) => Boolean(t.defenseEligible) || t.status === 'COMPLETED'
      );
      setEligibleTheses(eligibleOnly);

      if (isStudent && user) {
        const studentId = (user as any).student?.id || (user as any).student_id || user.id;
        const userCode = String(
          (user as any).student?.student_code || (user as any).studentCode || user.username || ''
        ).toLowerCase();
        const foundThesis = (tList || []).find(
          (t) =>
            (studentId && String(t.studentId) === String(studentId)) ||
            (userCode && (t.studentCode || '').toLowerCase() === userCode)
        ) || null;
        setMyStudentThesis(foundThesis);
        if (foundThesis?.id) {
          const gRes = await defenseService.getGraduationResult(foundThesis.id).catch(() => null);
          setMyGraduationResult(gRes);
        } else {
          setMyGraduationResult(null);
        }
      }

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

  const selectedRoundObj = useMemo(
    () => rounds.find((r: any) => (r.roundId || r.id) === selectedRoundId) || null,
    [rounds, selectedRoundId]
  );

  // Determine if student is scheduled in any council/schedule
  const currentStudentDefense = useMemo(() => {
    if (!user) return null;
    const uId = user.id ? Number(user.id) : null;
    const uStudentId = (user as any).student_id ? Number((user as any).student_id) : null;
    const code = ((user as any).studentCode || (user as any).registration_no || user.username || '').toString().toLowerCase();
    const fullName = (user.fullName || '').toString().toLowerCase();

    for (const schedule of schedules) {
      if (schedule.assignedStudents && schedule.assignedStudents.length > 0) {
        const match = schedule.assignedStudents.find((s) => {
          if (myStudentThesis && s.thesisId === myStudentThesis.id) return true;
          if (uStudentId && s.studentId === uStudentId) return true;
          if (uId && s.studentId === uId) return true;
          if (s.studentCode && code && s.studentCode.toLowerCase() === code) return true;
          if (s.studentName && fullName && s.studentName.toLowerCase() === fullName) return true;
          return false;
        });
        if (match) {
          return { schedule, studentDetail: match };
        }
      }
    }
    return null;
  }, [schedules, user, myStudentThesis]);

  // Lecturer role in schedules
  const lecturerDefenseInfo = useMemo(() => {
    if (!user || (!isSupervisor && !isCommittee)) return null;
    const uId = user.id ? Number(user.id) : null;
    const lecturerId = (user as any).lecturerId ? Number((user as any).lecturerId) : uId;
    const fullName = (user.fullName || '').toLowerCase();

    const supervisingSchedules: Array<{ schedule: DefenseSchedule; students: any[] }> = [];
    const committeeSchedules: Array<{ schedule: DefenseSchedule; role: string }> = [];

    for (const schedule of schedules) {
      if (schedule.assignedStudents && schedule.assignedStudents.length > 0) {
        const mySupervised = schedule.assignedStudents.filter(
          (s) => s.advisorId === lecturerId || (s.advisorName && fullName && s.advisorName.toLowerCase() === fullName)
        );
        if (mySupervised.length > 0) {
          supervisingSchedules.push({ schedule, students: mySupervised });
        }
      }

      const council = councils.find((c) => c.id === schedule.councilId);
      const members = schedule.members || council?.members || [];
      const myMember = members.find(
        (m) => m.lecturerId === lecturerId || (m.lecturerName && fullName && m.lecturerName.toLowerCase() === fullName)
      );
      if (myMember) {
        committeeSchedules.push({ schedule, role: getCouncilRoleLabel(myMember.role) });
      }
    }

    return { supervisingSchedules, committeeSchedules };
  }, [schedules, councils, user, isSupervisor, isCommittee]);

  const visibleSchedules = useMemo(() => {
    if (!currentDate) return schedules;
    const list = schedules.filter((s) => s.defenseDate === currentDate);
    return list.length > 0 ? list : schedules;
  }, [schedules, currentDate]);

  const isScheduleFinalized = useMemo(() => {
    return schedules.length > 0 && schedules.every((s) => s.status === 'FINALIZED');
  }, [schedules]);

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
        message: 'Tự động xếp lịch bảo vệ thành công cho các sinh viên đủ điều kiện! Bạn hãy rà soát kỹ và bấm "Chốt lịch này".',
      });
      await loadSchedulesForRound(selectedRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi tự động xếp lịch' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSchedules = async () => {
    if (schedules.length === 0 || loading || finalizingLoading) return;
    try {
      setFinalizingLoading(true);
      const res = await defenseService.finalizeSchedules(selectedRoundId);
      setSchedules(res);
      setNotification({
        type: 'success',
        message: '🔒 ĐÃ CHỐT TOÀN BỘ LỊCH BẢO VỆ THÀNH CÔNG! Lịch thi đã được khóa chính thức. Bạn hãy bấm nút "Gửi thông báo đến mọi người" để thông báo lịch.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi chốt lịch bảo vệ' });
    } finally {
      setFinalizingLoading(false);
    }
  };

  const handleReopenSchedules = async () => {
    if (schedules.length === 0 || loading || finalizingLoading) return;
    try {
      setFinalizingLoading(true);
      const res = await defenseService.reopenSchedules(selectedRoundId);
      setSchedules(res);
      setNotification({
        type: 'success',
        message: '🔓 ĐÃ MỞ KHÓA LỊCH BẢO VỆ! Bây giờ bạn có thể chỉnh sửa ca thi hoặc xếp lại sinh viên trước khi chốt lại.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi mở khóa lịch bảo vệ' });
    } finally {
      setFinalizingLoading(false);
    }
  };

  const handleSendScheduleNotification = async (payload: ScheduleNotifyRequest) => {
    try {
      setNotifyLoading(true);
      const res = await defenseService.notifyDefenseSchedules(payload);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLastNotifiedAt(timeStr);
      setNotification({
        type: 'success',
        message: `📢 ĐÃ GỬI THÔNG BÁO LỊCH THI THÀNH CÔNG! Đã chuyển phát lịch bảo vệ chính thức tới ${res.totalNotified || 45} người nhận lúc ${timeStr}.`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi gửi thông báo lịch bảo vệ' });
      throw err;
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleSaveSchedule = async (config: ScheduleConfig, scheduleId?: number) => {
    if (scheduleId) {
      await defenseService.updateSchedule(scheduleId, config);
      setNotification({ type: 'success', message: 'Đã cập nhật ca bảo vệ và danh sách sinh viên thành công!' });
    } else {
      await defenseService.configureSchedule(config);
      setNotification({ type: 'success', message: 'Đã tạo mới ca bảo vệ và xếp sinh viên thành công!' });
    }
    setEditingSchedule(null);
    setSelectedScheduleDetail(null);
    await loadSchedulesForRound(selectedRoundId);
  };

  const handleDeleteSchedule = async (schedule: DefenseSchedule) => {
    if (!window.confirm(`Xác nhận xóa ca bảo vệ tại ${schedule.room} (${schedule.defenseDate})?`)) {
      return;
    }
    try {
      setLoading(true);
      await defenseService.deleteSchedule(schedule.id);
      setSelectedScheduleDetail(null);
      setNotification({ type: 'success', message: 'Đã xóa ca lịch bảo vệ thành công!' });
      await loadSchedulesForRound(selectedRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể xóa ca lịch bảo vệ' });
    } finally {
      setLoading(false);
    }
  };

  const formatGradeLabel = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return 'Xuất sắc (A)';
      case 'VERY_GOOD':
        return 'Giỏi (B+)';
      case 'GOOD':
        return 'Khá (B)';
      case 'AVERAGE':
        return 'Trung bình (C)';
      default:
        return 'Không đạt (F)';
    }
  };

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">
            {isStudent ? 'Lịch Bảo Vệ & Kết Quả Đồ Án Tốt Nghiệp' : 'Xếp lịch và Điều hành Bảo vệ Luận văn'}
          </h1>
          <p className="feature-page-subtitle">
            {isStudent
              ? 'Lịch bảo vệ chính thức và kết quả tốt nghiệp.'
              : 'Xếp lịch bảo vệ theo phòng thi và hội đồng.'}
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {visibleRounds.length > 0 && (
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
                {visibleRounds.map((r: any) => {
                  const rid = r.roundId || r.id;
                  return (
                    <option key={rid} value={rid}>
                      {r.name} ({r.roundCode || `ID: ${rid}`})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {canManageSchedule && (
            <>
              {!isScheduleFinalized ? (
                <>
                  <Button variant="primary" onClick={handleAutoGenerate} loading={loading} disabled={finalizingLoading}>
                    ⚡ Tự động chạy xếp lịch
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSchedule(null);
                      setIsConfigModalOpen(true);
                    }}
                    disabled={loading || finalizingLoading}
                  >
                    + Thêm ca &amp; Xếp sinh viên
                  </Button>
                  {schedules.length > 0 && (
                    <Button
                      variant="success"
                      onClick={handleFinalizeSchedules}
                      loading={finalizingLoading}
                      disabled={loading}
                      style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: 700 }}
                    >
                      🔒 Chốt Lịch Bảo Vệ
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsNotifyModalOpen(true)}
                    disabled={loading || finalizingLoading}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      borderColor: '#6d28d9',
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    📢 Gửi Thông Báo Đến Mọi Người
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReopenSchedules}
                    loading={finalizingLoading}
                    disabled={loading}
                    style={{ borderColor: '#d97706', color: '#d97706', fontWeight: 600 }}
                  >
                    🔓 Mở Khóa Chỉnh Sửa Lịch
                  </Button>
                </>
              )}
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

      {/* Schedule Finalized / Status Banner for Admin */}
      {schedules.length > 0 && (
        <div
          style={{
            background: isScheduleFinalized ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${isScheduleFinalized ? '#86efac' : '#cbd5e1'}`,
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: isScheduleFinalized ? '0 2px 8px rgba(22, 163, 74, 0.08)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>{isScheduleFinalized ? '🔒' : '📋'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: isScheduleFinalized ? '#166534' : '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{isScheduleFinalized ? 'Lịch bảo vệ chính thức đã được chốt' : 'Lịch bảo vệ đang ở trạng thái Dự thảo (Chưa chốt)'}</span>
                <span
                  style={{
                    background: isScheduleFinalized ? '#22c55e' : '#e2e8f0',
                    color: isScheduleFinalized ? '#fff' : '#475569',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {isScheduleFinalized ? 'CHÍNH THỨC' : 'DỰ THẢO'}
                </span>
                {lastNotifiedAt && (
                  <span
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid #ddd6fe',
                    }}
                  >
                    🔔 Đã gửi TB ({lastNotifiedAt})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                {isScheduleFinalized
                  ? `Đã khóa an toàn ${schedules.length} ca bảo vệ. Vui lòng bấm "Gửi thông báo đến mọi người" để chuyển phát lịch thi tới Hội đồng, GVHD và Sinh viên.`
                  : `Đang có ${schedules.length} ca bảo vệ. Sau khi rà soát kỹ các phòng thi và danh sách sinh viên, vui lòng bấm "Chốt Lịch Này" để khóa và thông báo.`}
              </div>
            </div>
          </div>

          {canManageSchedule && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isScheduleFinalized ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsNotifyModalOpen(true)}
                    disabled={loading || finalizingLoading}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    📢 Gửi thông báo đến mọi người
                  </button>
                  <button
                    type="button"
                    onClick={handleReopenSchedules}
                    disabled={loading || finalizingLoading}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d97706',
                      background: '#fff',
                      color: '#d97706',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    🔓 Mở khóa lịch
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalizeSchedules}
                  disabled={loading || finalizingLoading}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🔒 Chốt lịch này ngay
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL PUBLISHED RESULT BANNER FOR STUDENT (#25) */}
      {isStudent && myGraduationResult && (selectedRoundObj?.status === 'CLOSED' || myGraduationResult.publishedAt) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #22c55e',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <span
                style={{
                  background: '#0a3273',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                🎓 KẾT QUẢ BẢO VỆ ĐỒ ÁN TỐT NGHIỆP CHÍNH THỨC
              </span>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '18px', color: '#0f172a' }}>
                {myGraduationResult.thesisTitle || myStudentThesis?.titleVn}
              </h2>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                Sinh viên: <strong>{myGraduationResult.studentName || user?.fullName}</strong> ({myGraduationResult.studentCode || myStudentThesis?.studentCode})
              </div>
            </div>
            <div
              style={{
                background: myGraduationResult.finalResult === 'PASSED' ? '#16a34a' : '#dc2626',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {myGraduationResult.finalResult === 'PASSED' ? '✅ ĐẠT TỐT NGHIỆP' : '❌ KHÔNG ĐẠT'} — {formatGradeLabel(myGraduationResult.grade)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Điểm GVHD (40%)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{Number(myGraduationResult.supervisorScore || 0).toFixed(2)}</div>
            </div>

            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>TB Hội đồng (60%)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{Number(myGraduationResult.councilScore || 0).toFixed(2)}</div>
            </div>
            <div style={{ background: '#0a3273', padding: '12px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>ĐIỂM TỔNG KẾT HỆ 10</div>
              <div style={{ fontSize: '21px', fontWeight: 800 }}>{Number(myGraduationResult.finalScore || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. STUDENT PERSONAL DEFENSE HERO CARD */}
      {isStudent && (
        <div
          style={{
            background: currentStudentDefense ? '#f0fdf4' : '#fffbeb',
            border: `2px solid ${currentStudentDefense ? '#86efac' : '#fde68a'}`,
            borderRadius: '10px',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {currentStudentDefense ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  background: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>📅 Ngày bảo vệ</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a3273' }}>
                    {currentStudentDefense.schedule.defenseDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>⏰ Ca &amp; Khung giờ</div>
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

              {currentStudentDefense.schedule.members && currentStudentDefense.schedule.members.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', marginBottom: '8px' }}>
                    👥 Thành viên Hội đồng chấm thi (1CT - 1TK - 1PB1 - 1PB2 - 1UV):
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
                          color: '#334155',
                        }}
                      >
                        {getCouncilRoleLabel(m.role)}:{' '}
                        <strong>{m.lecturerName}</strong>
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    👨‍🏫 GVHD: {currentStudentDefense.studentDetail.advisorName}
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
                {myStudentThesis && !myStudentThesis.defenseEligible
                  ? 'Đề tài của bạn hiện chưa ở trạng thái Đủ điều kiện bảo vệ. Vui lòng hoàn thành tiến độ và liên hệ GVHD.'
                  : 'Admin Khoa đang hoàn tất chốt danh sách Hội đồng và xếp lịch bảo vệ. Vui lòng quay lại sau.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LECTURER SPECIFIC NOTICE BANNER */}
      {(isSupervisor || isCommittee) && lecturerDefenseInfo && (
        <div style={{ marginBottom: '20px' }}>
          {lecturerDefenseInfo.supervisingSchedules.length > 0 && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🎓</span>
              <div>
                <strong style={{ color: '#166534', fontSize: '14px' }}>
                  Bạn có sinh viên hướng dẫn bảo vệ tại đợt này:
                </strong>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#15803d' }}>
                  {lecturerDefenseInfo.supervisingSchedules.map((item, idx) => (
                    <div key={idx}>
                      • Phòng <strong>{item.schedule.room}</strong> ({item.schedule.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'} {item.schedule.startTime} - {item.schedule.endTime}, ngày {item.schedule.defenseDate}):{' '}
                      {item.students.map((s) => `${s.studentName} (${s.studentCode}) - "${s.thesisTitle}"`).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {lecturerDefenseInfo.committeeSchedules.length > 0 && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
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
        const detailStudents = selectedScheduleDetail.assignedStudents || [];

        return (
          <Modal
            isOpen={true}
            onClose={() => setSelectedScheduleDetail(null)}
            title={`📋 Chi Tiết Ca Bảo Vệ — ${selectedScheduleDetail.councilName}`}
            maxWidth="820px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '10px' }}>
                  👥 Thành viên Hội đồng chấm thi ({detailMembers.length} Giảng viên — Cơ cấu 1CT - 1TK - 1PB1 - 1PB2 - 1UV):
                </div>
                {detailMembers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {detailMembers.map((m) => {
                      const roleLabel = getCouncilRoleLabel(m.role);
                      const roleColor =
                        m.role === 'PRESIDENT' ? '#b45309' : m.role === 'SECRETARY' ? '#0369a1' : (m.role === 'REVIEWER_1' || m.role === 'REVIEWER_2') ? '#6d28d9' : '#334155';
                      const roleBg =
                        m.role === 'PRESIDENT' ? '#fef3c7' : m.role === 'SECRETARY' ? '#e0f2fe' : (m.role === 'REVIEWER_1' || m.role === 'REVIEWER_2') ? '#ede9fe' : '#f1f5f9';
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

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px' }}>
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
                          <tr key={st.thesisId || st.studentId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                {canManageSchedule ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingSchedule(selectedScheduleDetail);
                        setSelectedScheduleDetail(null);
                        setIsConfigModalOpen(true);
                      }}
                    >
                      ✏️ Sửa ca &amp; Xếp sinh viên
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteSchedule(selectedScheduleDetail)}>
                      🗑️ Xóa lịch ca này
                    </Button>
                  </div>
                ) : (
                  <div />
                )}
                <Button variant="primary" onClick={() => setSelectedScheduleDetail(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {canManageSchedule && (
        <>
          <ScheduleConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => {
              setIsConfigModalOpen(false);
              setEditingSchedule(null);
            }}
            councils={councils}
            eligibleTheses={eligibleTheses}
            allSchedules={schedules}
            editingSchedule={editingSchedule}
            defaultDate={currentDate}
            onSave={handleSaveSchedule}
          />

          <ScheduleNotifyModal
            isOpen={isNotifyModalOpen}
            onClose={() => setIsNotifyModalOpen(false)}
            projectRoundId={selectedRoundId}
            roundName={selectedRoundObj?.name}
            roundCode={selectedRoundObj?.roundCode}
            schedules={schedules}
            councils={councils}
            onSend={handleSendScheduleNotification}
            loading={notifyLoading}
          />
        </>
      )}
    </div>
  );
};
