import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import utcLogo from '../assets/images/utc_logo.webp';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationDropdown from './NotificationDropdown';
import { apiService } from '../services/api';
import type { ProjectRoundItem } from '../types';
import {
  STAGES,
  getRoundStageNumber,
  calculateStageStatus,
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
  activeTab = 'overview',
  onTabChange,
  hideHeroBanner = false,
  pageTitle,
}) => {
  const { t, i18n } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { user: authUser, userType: authUserType, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const user = propUser || authUser;
  const onLogout = propLogout || authLogout;

  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('academic');

  // Demo Phase & Individual Progression State
  const [activeRound, setActiveRound] = useState<ProjectRoundItem | null>(null);
  const [roundCurrentStage, setRoundCurrentStage] = useState<number>(2);
  const [userCompletedStageState, setUserCompletedStageState] = useState<number>(1);
  const [advancingPhase, setAdvancingPhase] = useState<boolean>(false);
  const [lockAlertMessage, setLockAlertMessage] = useState<string | null>(null);
  const [studentStatusInfo, setStudentStatusInfo] = useState<{
    isDropped?: boolean;
    note?: string;
    completedStage?: number;
    status?: string;
  } | null>(null);

  // Xác định role thực tế
  const currentRole = (
    authUserType ||
    (user?.role?.name ? user.role.name.replace('ROLE_', '').toLowerCase() : '') ||
    user?.user?.user_type ||
    'student'
  ).toLowerCase();

  // Dynamic greeting theo giờ
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (i18n.language.startsWith('en')) {
      if (hour < 12) return 'Good morning,';
      if (hour < 18) return 'Good afternoon,';
      return 'Good evening,';
    }
    if (hour < 12) return 'Chào buổi sáng,';
    if (hour < 18) return 'Chào buổi trưa,';
    return 'Chào buổi tối,';
  };

  // Ngày hiện tại
  const getCurrentDateString = () => {
    const now = new Date();
    if (i18n.language.startsWith('en')) {
      return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${dayName}, ngày ${date}/${month}/${year}`;
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(nextLng);
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
                  finalRoundStage = Math.max(myStatus.roundCurrentStage || 1, st);
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
            if (myStatus.isDropped) {
              setUserCompletedStageState(myStatus.completedStage || 1);
            } else {
              setUserCompletedStageState(Math.max(myStatus.completedStage || 1, finalRoundStage - 1));
            }
            return;
          }
        } catch {
          // fallback to getActiveProjectRound below
        }
      }

      const round = await apiService.getActiveProjectRound().catch(() => null);
      if (round) {
        setActiveRound(round);
        const st = getRoundStageNumber(round.currentMilestone?.phaseType, round.status);
        setRoundCurrentStage(st);
        if (
          currentRole === 'student' ||
          currentRole === 'supervisor' ||
          currentRole === 'lecturer' ||
          currentRole === 'committee_member' ||
          currentRole === 'committee'
        ) {
          setUserCompletedStageState(Math.max(st - 1, 1));
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

  const handleAdminAdvancePhase = async (targetPhase?: string) => {
    try {
      setAdvancingPhase(true);
      const updated = await apiService.advanceActivePhase(targetPhase);
      setActiveRound(updated);
      const st = getRoundStageNumber(updated.currentMilestone?.phaseType, updated.status);
      setRoundCurrentStage(st);
      window.dispatchEvent(new CustomEvent('utc-phase-change'));
    } catch (err: unknown) {
      console.error('Error advancing phase:', err);
      alert(err instanceof Error ? err.message : 'Lỗi khi chuyển giai đoạn');
    } finally {
      setAdvancingPhase(false);
    }
  };

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

  // Xử lý click chuyển tab hoặc điều hướng trang (chặn click nếu giai đoạn bị khóa)
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
    } else {
      if (onTabChange) {
        onTabChange(tabOrRoute);
      } else {
        navigate(`/${currentRole === 'lecturer' ? 'supervisor' : currentRole}/dashboard`);
      }
    }
  };

  const currentStageDef = STAGES.find((s) => s.stageNumber === roundCurrentStage) || STAGES[1];

  return (
    <div className={`utc-dashboard-wrapper ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Mobile Backdrop Overlay */}
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
          <div className="utc-sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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
          {/* MENU DÀNH CHO ADMIN (ĐẦY ĐỦ 5 GIAI ĐOẠN) */}
          {currentRole === 'admin' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Tổng quan 5 Giai đoạn</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'project-rounds' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/project-rounds', true)}
              >
                <span className="utc-nav-icon">🗓️</span>
                <span className="utc-nav-label">GĐ1: Đợt đồ án & Import SV</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'organization' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/organization', true)}
              >
                <span className="utc-nav-icon">🏛️</span>
                <span className="utc-nav-label">GĐ1: Khoa, Bộ môn, GV & SV</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/assignments', true)}
              >
                <span className="utc-nav-icon">🎯</span>
                <span className="utc-nav-label">GĐ2: Phân công GVHD & NV</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Đề cương & Xuất PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task & Tiến độ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'final-eligibility' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/final-eligibility', true)}
              >
                <span className="utc-nav-icon">🔍</span>
                <span className="utc-nav-label">GĐ5: Xét ĐK Bảo vệ Cuối</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'councils' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/councils', true)}
              >
                <span className="utc-nav-icon">⚖️</span>
                <span className="utc-nav-label">GĐ5: Hội đồng (1CT-2TK-2UV)</span>
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
                <span className="utc-nav-label">GĐ5: Chấm điểm & Biên bản PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/reservations', true)}
              >
                <span className="utc-nav-icon">⏸️</span>
                <span className="utc-nav-label">GĐ5: Nhánh Bảo lưu Đồ án</span>
              </div>
            </>
          )}

          {/* MENU DÀNH CHO SINH VIÊN */}
          {currentRole === 'student' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/student/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">{t('nav.overview', 'Trang chủ')}</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'student-assignment' ? 'active' : ''} ${isStageLocked(2) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/student/assignment', true, 2)}
              >
                <span className="utc-nav-icon">🎯</span>
                <span className="utc-nav-label">GĐ2: Chọn Hướng & NV1–NV3</span>
                {renderStageBadge(2)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Đề cương & Ký nộp PDF</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Nhận Task & Nộp kết quả</span>
                {renderStageBadge(4)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true, 5)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ5: Xem Lịch Bảo vệ</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'reservations' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/student/reservation', true, 5)}
              >
                <span className="utc-nav-icon">⏸️</span>
                <span className="utc-nav-label">GĐ5: Đơn Xin Bảo Lưu</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${expandedMenu === 'academic' ? 'expanded' : ''}`}
                onClick={() => setExpandedMenu(expandedMenu === 'academic' ? null : 'academic')}
              >
                <span className="utc-nav-icon">📚</span>
                <span className="utc-nav-label">Góc học tập & Tiện ích</span>
                <span className="utc-arrow">{expandedMenu === 'academic' ? '▾' : '▸'}</span>
              </div>

              {expandedMenu === 'academic' && (
                <div className="utc-sub-nav">
                  <div
                    className={`utc-sub-item ${activeTab === 'thesis-detail' ? 'active' : ''}`}
                    onClick={() => handleNavClick('/thesis/detail', true)}
                  >
                    Chi tiết Đề tài của tôi
                  </div>
                  <div
                    className={`utc-sub-item ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => handleNavClick('/progress/reports', true)}
                  >
                    Báo cáo Tiến độ Định kỳ
                  </div>
                </div>
              )}
            </>
          )}

          {/* MENU DÀNH CHO GIẢNG VIÊN (SUPERVISOR) */}
          {(currentRole === 'supervisor' || currentRole === 'lecturer') && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/supervisor/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Tổng quan hướng dẫn</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'assignments' ? 'active' : ''} ${isStageLocked(2) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/assignments', true, 2)}
              >
                <span className="utc-nav-icon">👥</span>
                <span className="utc-nav-label">GĐ2: Phân công & Duyệt NV</span>
                {renderStageBadge(2)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Xác nhận Đề cương</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task & Review</span>
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
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true, 5)}
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ5: Chấm điểm GVHD & GVPB</span>
                {renderStageBadge(5)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''} ${isStageLocked(5) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true, 5)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">Lịch hội đồng bảo vệ</span>
                {renderStageBadge(5)}
              </div>
            </>
          )}

          {/* MENU DÀNH CHO HỘI ĐỒNG (COMMITTEE MEMBER) */}
          {(currentRole === 'committee_member' || currentRole === 'committee') && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/committee_member/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Tổng quan hội đồng</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'assignments' ? 'active' : ''} ${isStageLocked(2) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/admin/assignments', true, 2)}
              >
                <span className="utc-nav-icon">👥</span>
                <span className="utc-nav-label">GĐ2: Phân công & Duyệt NV</span>
                {renderStageBadge(2)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''} ${isStageLocked(3) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true, 3)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Xác nhận Đề cương</span>
                {renderStageBadge(3)}
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''} ${isStageLocked(4) ? 'utc-nav-locked' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true, 4)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ4: Giao Task & Review</span>
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
                <span className="utc-nav-label">GĐ5: Hội đồng chấm (1CT-2TK-2UV)</span>
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
                <span className="utc-nav-label">GĐ5: Chấm điểm & Biên bản PDF</span>
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
        {/* 2. Top Header Bar */}
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
            <button className="utc-top-btn" onClick={toggleLanguage} title="Language">
              {i18n.language.startsWith('vi') ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>

            <button className="utc-top-btn" onClick={toggleTheme} title="Theme">
              {isDark ? '☀️' : '🌙'}
            </button>

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

        {/* DEMO CONTROL BARS */}
        {currentRole === 'admin' && (
          <div className="utc-demo-control-bar admin-bar">
            <div className="utc-demo-info">
              <span className="utc-demo-tag">⚡ DEMO ADMIN</span>
              <span className="utc-demo-round">
                Đợt: <strong>{activeRound?.roundCode || activeRound?.name || 'DA_CNTT_K62_HK1'}</strong>
              </span>
              <span className="utc-demo-phase">
                Giai đoạn hiện tại: <strong className="phase-badge">{currentStageDef?.name || `Giai đoạn ${roundCurrentStage}`}</strong>
              </span>
            </div>
            <div className="utc-demo-actions">
              <button
                className="utc-demo-btn primary"
                onClick={() => handleAdminAdvancePhase()}
                disabled={advancingPhase}
                title="Admin kết thúc giai đoạn hiện tại và chuyển sang giai đoạn tiếp theo"
              >
                {advancingPhase ? '⏳ Đang chuyển...' : '⚡ Kết thúc GĐ & Chuyển tiếp theo'}
              </button>
              <div className="utc-demo-quick-jumps">
                <span className="jump-label">Chuyển nhanh:</span>
                <button className={`jump-btn ${roundCurrentStage === 1 ? 'active' : ''}`} onClick={() => handleAdminAdvancePhase('DRAFT')}>GĐ1</button>
                <button className={`jump-btn ${roundCurrentStage === 2 ? 'active' : ''}`} onClick={() => handleAdminAdvancePhase('REGISTRATION')}>GĐ2</button>
                <button className={`jump-btn ${roundCurrentStage === 3 ? 'active' : ''}`} onClick={() => handleAdminAdvancePhase('PROPOSAL_SUBMISSION')}>GĐ3</button>
                <button className={`jump-btn ${roundCurrentStage === 4 ? 'active' : ''}`} onClick={() => handleAdminAdvancePhase('WEEKLY_REPORT')}>GĐ4</button>
                <button className={`jump-btn ${roundCurrentStage === 5 ? 'active' : ''}`} onClick={() => handleAdminAdvancePhase('DEFENSE')}>GĐ5</button>
              </div>
            </div>
          </div>
        )}



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

        {/* Lock alert toast if user tries to click locked stage */}
        {lockAlertMessage && (
          <div className="utc-demo-lock-toast">
            <div className="lock-toast-content">
              <span className="lock-toast-icon">🔒</span>
              <span className="lock-toast-text">{lockAlertMessage}</span>
              <button className="lock-toast-close" onClick={() => setLockAlertMessage(null)}>✕</button>
            </div>
          </div>
        )}

        {/* 3. Hero Greeting Banner (Chỉ hiện khi không ẩn) */}
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

        {/* Page Title bar nếu có */}
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

        {/* 4. Children Inner Content */}
        <main className="utc-dashboard-body-content" style={{ padding: hideHeroBanner ? '20px 28px' : undefined }}>
          {children}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export { UTCAppLayout };
export default UTCAppLayout;
