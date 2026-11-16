import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import utcLogo from '../assets/images/utc_logo.webp';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationDropdown from './NotificationDropdown';
import { apiService } from '../services/api';
import type { ProjectRoundItem } from '../types';
import {
  STAGES,
  getRoundStageNumber,
  calculateStageStatus,
  getStoredLecturerRoundId,
  pickBestLecturerRound,
} from '../utils/phaseTracking';
import './UTCAppLayout.css';

interface UTCAppLayoutProps {
  user?: any;
  onLogout?: () => void;
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  hideHeroBanner?: boolean;
  pageTitle?: string;
}

const UTCAppLayout: React.FC<UTCAppLayoutProps> = ({
  user: propUser,
  onLogout: propLogout,
  children,
  activeTab = 'project-rounds',
  onTabChange,
  hideHeroBanner = false,
  pageTitle,
}) => {
  const { t } = useTranslation();
  const { user: authUser, userType: authUserType, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const user = propUser || authUser;
  const onLogout = propLogout || authLogout;

  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );

  useEffect(() => {
    let prevWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth > 1024 && currentWidth <= 1024) {
        setSidebarOpen(false);
      } else if (prevWidth <= 1024 && currentWidth > 1024) {
        setSidebarOpen(true);
      }
      prevWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [_activeRound, setActiveRound] = useState<ProjectRoundItem | null>(null);
  const [roundCurrentStage, setRoundCurrentStage] = useState<number>(2);
  const [userCompletedStageState, setUserCompletedStageState] = useState<number>(1);
  const [lockAlertMessage, setLockAlertMessage] = useState<string | null>(null);
  const [studentStatusInfo, setStudentStatusInfo] = useState<{
    isDropped?: boolean;
    note?: string;
    completedStage?: number;
    status?: string;
  } | null>(null);

  const currentRole = (
    authUserType ||
    (user?.role?.name ? user.role.name.replace('ROLE_', '').toLowerCase() : '') ||
    user?.user?.user_type ||
    'student'
  ).toLowerCase();

  const getRoleHomeRoute = () => {
    switch (currentRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'academic_staff':
        return '/academic-staff/home';
      case 'student':
        return '/student/home';
      case 'supervisor':
      case 'lecturer':
        return '/lecturer/home';
      case 'committee_member':
      case 'committee':
        return '/lecturer/home';
      default:
        return '/';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng,';
    if (hour < 18) return 'Chào buổi trưa,';
    return 'Chào buổi tối,';
  };

  const getCurrentDateString = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${dayName}, ngày ${date}/${month}/${year}`;
  };

  const getUserDisplayName = () => {
    if (!user) return 'Người dùng UTC';
    if (user.fullName) return user.fullName;
    if ('user' in user && user.user) {
      const { first_name, last_name, username, fullName } = user.user;
      if (fullName) return fullName;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return username;
    }
    if (user.username) return user.username;
    return 'Người dùng UTC';
  };

  const getUserRoleLabel = () => {
    switch (currentRole) {
      case 'admin':
        return 'Quản trị viên Khoa (ADMIN)';
      case 'academic_staff':
        return 'Giáo vụ khoa (ACADEMIC STAFF)';
      case 'student':
        return 'Sinh viên (STUDENT)';
      case 'supervisor':
      case 'lecturer':
        return 'Giảng viên hướng dẫn (SUPERVISOR)';
      case 'committee_member':
      case 'committee':
        return 'Hội đồng chấm thi (COMMITTEE)';
      case 'external_examiner':
        return 'Cán bộ chấm ngoài (EXTERNAL)';
      default:
        return 'Thành viên UTC';
    }
  };

  const handleNotificationNavigate = (url: string) => {
    const [path, queryString] = url.split('?');
    if (queryString) {
      navigate(`${path}?${queryString}`);
    } else {
      navigate(path);
    }
  };

  const currentUserId = user?.id || user?.user_id || user?.username || 'me';

  const loadActiveRound = async () => {
    try {
      if (currentRole === 'student') {
        try {
          const myStatus = await apiService.getMyRoundStatus();
          if (myStatus && myStatus.inRound) {
            let finalRoundStage = myStatus.roundCurrentStage || 1;
            if (myStatus.roundId) {
              try {
                const studentRound = await apiService.getProjectRoundById(myStatus.roundId);
                if (studentRound) {
                  setActiveRound(studentRound);
                  const st = getRoundStageNumber(studentRound.currentMilestone?.phaseType, studentRound.status);
                  finalRoundStage = myStatus.roundCurrentStage || st;
                  setRoundCurrentStage(finalRoundStage);
                }
              } catch {
                if (myStatus.roundCurrentStage) {
                  setRoundCurrentStage(myStatus.roundCurrentStage);
                }
              }
            }
            setStudentStatusInfo({
              isDropped: myStatus.isDropped,
              note: myStatus.note,
              completedStage: myStatus.completedStage,
              status: myStatus.status,
            });
            setUserCompletedStageState(myStatus.completedStage || 1);
            return;
          }
        } catch {
          // fallback below
        }
      }

      let round: ProjectRoundItem | null = null;
      if (
        currentRole === 'supervisor' ||
        currentRole === 'lecturer' ||
        currentRole === 'committee_member' ||
        currentRole === 'committee'
      ) {
        const lecturerRounds = await apiService.getProjectRounds().catch(() => []);
        if (Array.isArray(lecturerRounds) && lecturerRounds.length > 0) {
          round = pickBestLecturerRound(lecturerRounds, getStoredLecturerRoundId(currentUserId));
        }
      }
      if (!round) {
        round = await apiService.getActiveProjectRound().catch(() => null);
      }
      if (round) {
        setActiveRound(round);
        const st = getRoundStageNumber(round.currentMilestone?.phaseType, round.status);
        setRoundCurrentStage(st);
        if (
          currentRole === 'supervisor' ||
          currentRole === 'lecturer' ||
          currentRole === 'committee_member' ||
          currentRole === 'committee'
        ) {
          setUserCompletedStageState(Math.max(st - 1, 1));
        } else if (currentRole === 'student') {
          setUserCompletedStageState(1);
        }
      }
    } catch {
      // Ignored if round not active
    }
  };

  useEffect(() => {
    loadActiveRound();

    const handlePhaseEvent = () => {
      loadActiveRound();
    };

    window.addEventListener('utc-phase-change', handlePhaseEvent);
    return () => {
      window.removeEventListener('utc-phase-change', handlePhaseEvent);
    };
  }, [currentUserId, currentRole]);

  const isStageLocked = (stageNumber: number) => {
    if (currentRole === 'student') {
      if (studentStatusInfo?.isDropped) {
        const failedStage = (studentStatusInfo.completedStage || 1) + 1;
        if (stageNumber >= failedStage) {
          return true;
        }
      }
      return calculateStageStatus(stageNumber, roundCurrentStage, userCompletedStageState) === 'LOCKED';
    }
    if (currentRole === 'supervisor' || currentRole === 'lecturer') {
      return roundCurrentStage < stageNumber;
    }
    return false;
  };

  const renderStageBadge = (stageNumber: number) => {
    if (currentRole === 'student' && studentStatusInfo?.isDropped) {
      const failedStage = (studentStatusInfo.completedStage || 1) + 1;
      if (stageNumber < failedStage) {
        return <span className="utc-stage-badge completed" title="Đã hoàn thành giai đoạn này">✓ Đã xong</span>;
      }
      if (stageNumber === failedStage) {
        return (
          <span
            className="utc-stage-badge failed"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600 }}
            title="Không đạt giai đoạn này do chưa hoàn thành nhiệm vụ theo quy chế"
          >
            ❌ Không đạt
          </span>
        );
      }
      return (
        <span
          className="utc-stage-badge locked"
          style={{ background: '#f1f5f9', color: '#94a3b8' }}
          title="Đã bị loại khỏi đợt đồ án"
        >
          🔒 Bị loại
        </span>
      );
    }

    if (currentRole === 'supervisor' || currentRole === 'lecturer') {
      if (roundCurrentStage > stageNumber) {
        return <span className="utc-stage-badge completed" title="Đợt đã hoàn thành giai đoạn này">✓ Đã xong</span>;
      }
      if (roundCurrentStage === stageNumber) {
        return <span className="utc-stage-badge in-progress" title="Đợt đang thực hiện giai đoạn này">● Đang làm</span>;
      }
      return <span className="utc-stage-badge locked" title="Giai đoạn chưa mở trong đợt này">🔒 Chưa mở</span>;
    }

    const status = calculateStageStatus(stageNumber, roundCurrentStage, userCompletedStageState);
    if (status === 'COMPLETED') {
      return <span className="utc-stage-badge completed" title="Đã hoàn thành giai đoạn này">✓ Đã xong</span>;
    }
    if (status === 'IN_PROGRESS') {
      return <span className="utc-stage-badge in-progress" title="Đang thực hiện giai đoạn này">● Đang làm</span>;
    }
    return <span className="utc-stage-badge locked" title="Giai đoạn chưa mở hoặc chưa hoàn thành giai đoạn trước">🔒 Chưa mở</span>;
  };

  const handleNavClick = (tabOrRoute: string, isRoute: boolean = false, stageNumber?: number) => {
    if (stageNumber && (currentRole === 'student' || currentRole === 'supervisor' || currentRole === 'lecturer')) {
      if (isStageLocked(stageNumber)) {
        const stageDef = STAGES.find((s) => s.stageNumber === stageNumber);
        const stageName = stageDef ? stageDef.name : `Giai đoạn ${stageNumber}`;
        setLockAlertMessage(`🔒 ${stageName} hiện chưa mở hoặc bạn chưa hoàn thành giai đoạn trước đó!`);
        setTimeout(() => setLockAlertMessage(null), 4500);
        return;
      }
    }
    setLockAlertMessage(null);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    if (isRoute) {
      navigate(tabOrRoute);
    } else if (onTabChange) {
      onTabChange(tabOrRoute);
    } else {
      navigate(getRoleHomeRoute());
    }
  };

  return (
    <div className={`utc-dashboard-wrapper ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {sidebarOpen && (
        <div
          className="utc-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Sidebar Navigation */}
      <aside className="utc-sidebar">
        <div className="utc-sidebar-header-row">
          <div className="utc-sidebar-logo" onClick={() => navigate(getRoleHomeRoute())} style={{ cursor: 'pointer' }}>
            <span className="utc-seal">
              <img src={utcLogo} alt="UTC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </span>
            <div className="utc-logo-text-group">
              <span className="utc-school-title">TRƯỜNG ĐẠI HỌC</span>
              <span className="utc-school-title-sub">GIAO THÔNG VẬN TẢI</span>
            </div>
          </div>
          <button
            className="utc-sidebar-close-mobile-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        <nav className="utc-sidebar-nav">
          {/* MENU DÀNH CHO ADMIN */}
          {currentRole === 'admin' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Trang chủ</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'project-rounds' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/project-rounds', true)}
              >
                <span className="utc-nav-icon">🗓️</span>
                <span className="utc-nav-label">GĐ1: Quản trị Đợt đồ án &amp; Mốc thời gian</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'organization' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/organization', true)}
              >
                <span className="utc-nav-icon">🏛️</span>
                <span className="utc-nav-label">GĐ1: Khoa, Bộ môn, GV &amp; SV</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/assignments', true)}
              >
                <span className="utc-nav-icon">🎯</span>
                <span className="utc-nav-label">GĐ2: Phân công GVHD &amp; NV</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Đề cương &amp; Xuất PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task &amp; Tiến độ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'final-eligibility' || activeTab === 'reservations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/final-eligibility', true)}
              >
                <span className="utc-nav-icon">🔍</span>
                <span className="utc-nav-label">GĐ5: Xét ĐK Bảo vệ &amp; Bảo lưu</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'councils' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/councils', true)}
              >
                <span className="utc-nav-icon">⚖️</span>
                <span className="utc-nav-label">GĐ5: Hội đồng (1CT-1TK-2PB-1UV)</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ5: Xếp lịch Bảo vệ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true)}
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ5: Chấm điểm &amp; Tổng hợp</span>
              </div>
            </>
          )}

          {/* MENU DÀNH CHO GIÁO VỤ KHOA */}
          {currentRole === 'academic_staff' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('/academic-staff/home', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Trang chủ</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'staff-eligible' ? 'active' : ''}`}
                onClick={() => handleNavClick('/academic-staff/eligible-students', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ1: Quản lý &amp; Lập DS SV nhận đồ án</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'final-eligibility' || activeTab === 'reservations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/final-eligibility', true)}
              >
                <span className="utc-nav-icon">🔍</span>
                <span className="utc-nav-label">GĐ5: Rà soát ĐK bảo vệ cuối &amp; Bảo lưu</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'staff-grades' ? 'active' : ''}`}
                onClick={() => handleNavClick('/academic-staff/class-grades', true)}
              >
                <span className="utc-nav-icon">🖨️</span>
                <span className="utc-nav-label">GĐ5: In điểm đồ án theo lớp</span>
              </div>
            </>
          )}

          {/* MENU DÀNH CHO SINH VIÊN */}
          {currentRole === 'student' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('/student/home', true)}
                title="Trang chủ"
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Trang chủ</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'student-assignment' ? 'active' : ''} ${isStageLocked(2) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/student/assignment', true, 2)}
                title="GĐ2: Chọn Hướng & NV1–NV3"
              >
                <span className="utc-nav-icon">🎯</span>
                <span className="utc-nav-label">GĐ2: Chọn Hướng &amp; NV1–NV3</span>
                {renderStageBadge(2)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
                title="GĐ3: Đề cương & Ký nộp PDF"
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Đề cương &amp; Ký nộp PDF</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
                title="GĐ4: Nhận Task & Nộp kết quả"
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Nhận Task &amp; Nộp kết quả</span>
                {renderStageBadge(4)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'student-reservation' || activeTab === 'final-eligibility' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/student/reservation', true, 5)}
                title="GĐ5: ĐK Bảo vệ & Đơn bảo lưu"
              >
                <span className="utc-nav-icon">⏸️</span>
                <span className="utc-nav-label">GĐ5: ĐK Bảo vệ &amp; Đơn bảo lưu</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true, 5)}
                title="GĐ5: Lịch Bảo vệ & Kết quả"
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ5: Lịch Bảo vệ &amp; Kết quả</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => handleNavClick('/chat', true)}
                title="Nhóm Chat Hướng Dẫn"
              >
                <span className="utc-nav-icon">💬</span>
                <span className="utc-nav-label">Nhóm Chat Hướng Dẫn</span>
              </div>
            </>
          )}

          {/* MENU DÀNH CHO GIẢNG VIÊN (SUPERVISOR) */}
          {(currentRole === 'supervisor' || currentRole === 'lecturer') && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('/lecturer/home', true)}
                title="Trang chủ"
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Trang chủ</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
                title="GĐ3: Xác nhận Đề cương"
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Xác nhận Đề cương</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
                title="GĐ4: Giao Task & Review"
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task &amp; Review</span>
                {renderStageBadge(4)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'thesis-detail' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/detail', true, 5)}
                title="GĐ5: Đủ điều kiện Bảo vệ"
              >
                <span className="utc-nav-icon">✅</span>
                <span className="utc-nav-label">GĐ5: Đủ điều kiện Bảo vệ</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true, 5)}
                title="Lịch hội đồng bảo vệ"
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">Lịch hội đồng bảo vệ</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true, 5)}
                title="GĐ5: Chấm điểm & Biên bản PDF"
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ5: Chấm điểm &amp; Biên bản PDF</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => handleNavClick('/chat', true)}
                title="Nhóm Chat Hướng Dẫn"
              >
                <span className="utc-nav-icon">💬</span>
                <span className="utc-nav-label">Nhóm Chat Hướng Dẫn</span>
              </div>
            </>
          )}

          {/* MENU DÀNH CHO HỘI ĐỒNG (COMMITTEE MEMBER) */}
          {(currentRole === 'committee_member' || currentRole === 'committee') && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('/lecturer/home', true)}
                title="Trang chủ"
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Trang chủ</span>
              </div>
              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
                title="GĐ3: Xác nhận Đề cương"
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Xác nhận Đề cương</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
                title="GĐ4: Giao Task & Review"
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task &amp; Review</span>
                {renderStageBadge(4)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'thesis-detail' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/detail', true, 5)}
              >
                <span className="utc-nav-icon">✅</span>
                <span className="utc-nav-label">GĐ5: Đủ điều kiện Bảo vệ</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'councils' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/councils', true)}
              >
                <span className="utc-nav-icon">⚖️</span>
                <span className="utc-nav-label">GĐ5: Hội đồng chấm (1CT-1TK-2PB-1UV)</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ5: Lịch chấm hội đồng</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true)}
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ5: Chấm điểm &amp; Biên bản PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => handleNavClick('/chat', true)}
              >
                <span className="utc-nav-icon">💬</span>
                <span className="utc-nav-label">Nhóm Chat Hướng Dẫn</span>
              </div>
            </>
          )}
        </nav>

        <div className="utc-sidebar-footer">
          <div className="utc-system-version">TheSisHub UTC v2.5</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="utc-main-container">
        <header className="utc-topbar">
          <div className="utc-topbar-left">
            <button
              className="utc-toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Sidebar"
            >
              ☰
            </button>
            <div className="utc-search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={t('common.search', 'Tìm kiếm thông tin đồ án, sinh viên, giảng viên...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="utc-topbar-right">
            <NotificationDropdown onNavigate={handleNotificationNavigate} />

            <div className="utc-user-profile-menu">
              <div
                className="utc-user-pill"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="utc-user-avatar">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
                <div className="utc-user-name-group">
                  <span className="utc-display-name">{getUserDisplayName()}</span>
                  <span className="utc-role-tag">{getUserRoleLabel()}</span>
                </div>
                <span className="dropdown-arrow">▾</span>
              </div>

              {userDropdownOpen && (
                <div className="utc-user-dropdown">
                  <div className="dropdown-header">
                    <strong>{getUserDisplayName()}</strong>
                    <div className="role-sub">{getUserRoleLabel()}</div>
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setShowChangePassword(true);
                      setUserDropdownOpen(false);
                    }}
                  >
                    🔐 {t('nav.changePassword', 'Đổi mật khẩu')}
                  </div>
                  <div
                    className="dropdown-item logout"
                    onClick={() => {
                      onLogout();
                      setUserDropdownOpen(false);
                    }}
                  >
                    🚪 {t('nav.logout', 'Đăng xuất')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Cảnh báo khi sinh viên bị loại / không đạt */}
        {currentRole === 'student' && studentStatusInfo?.isDropped && (
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '12px 18px',
            margin: '12px 24px 0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#991b1b',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🚫</span>
              <div>
                <strong>BẠN KHÔNG ĐẠT / BỊ LOẠI KHỎI ĐỢT ĐỒ ÁN:</strong>{' '}
                <span>{studentStatusInfo.note || 'Chưa hoàn thành yêu cầu của giai đoạn khi kết thúc theo quy chế.'}</span>
              </div>
            </div>
            <span style={{ fontSize: '12px', background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              KẾT THÚC ĐỢT
            </span>
          </div>
        )}

        {lockAlertMessage && (
          <div className="utc-demo-lock-toast">
            <div className="lock-toast-content">
              <span className="lock-toast-icon">🔒</span>
              <span className="lock-toast-text">{lockAlertMessage}</span>
              <button className="lock-toast-close" onClick={() => setLockAlertMessage(null)}>✕</button>
            </div>
          </div>
        )}

        {!hideHeroBanner && (
          <section className="utc-hero-banner">
            <div className="utc-hero-text-block">
              <span className="utc-greeting-time">{getGreeting()}</span>
              <h1 className="utc-hero-user-name">{getUserDisplayName()}</h1>
              <div className="utc-hero-date">
                📅 {getCurrentDateString()} • {getUserRoleLabel()}
              </div>
            </div>
            <div className="utc-hero-badge">
              <img src={utcLogo} alt="UTC Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
            </div>
          </section>
        )}

        {pageTitle && (
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ margin: 0, color: '#0a3273', fontSize: '1.25rem' }}>{pageTitle}</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Hệ thống Quản lý Đồ án Tốt nghiệp UTC</span>
          </div>
        )}

        <main className="utc-dashboard-body-content" style={{ padding: hideHeroBanner ? '20px 28px' : undefined }}>
          {children}
        </main>
      </div>

      {showChangePassword && (
        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export { UTCAppLayout };
export default UTCAppLayout;
