import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import utcLogo from '../assets/images/utc_logo.webp';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationDropdown from './NotificationDropdown';
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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('academic');

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

  // Xử lý click chuyển tab hoặc điều hướng trang
  const handleNavClick = (tabOrRoute: string, isRoute: boolean = false) => {
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

  return (
    <div className={`utc-dashboard-wrapper ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* 1. Left Sidebar Navigation */}
      <aside className="utc-sidebar">
        <div className="utc-sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="utc-seal">
            <img src={utcLogo} alt="UTC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </span>
          <div className="utc-logo-text-group">
            <span className="utc-school-title">TRƯỜNG ĐẠI HỌC</span>
            <span className="utc-school-title-sub">GIAO THÔNG VẬN TẢI</span>
          </div>
        </div>

        <nav className="utc-sidebar-nav">
          {/* MENU DÀNH CHO ADMIN (ĐẦY ĐỦ 6 GIAI ĐOẠN) */}
          {currentRole === 'admin' && (
            <>
              <div
                className={`utc-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/dashboard', true)}
              >
                <span className="utc-nav-icon">🏠</span>
                <span className="utc-nav-label">Tổng quan 6 Giai đoạn</span>
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
                className={`utc-nav-item ${activeTab === 'eligibility' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/eligibility', true)}
              >
                <span className="utc-nav-icon">✅</span>
                <span className="utc-nav-label">GĐ4: Xét ĐK & Force Approve</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ5: Giao Task & Tiến độ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'final-eligibility' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/final-eligibility', true)}
              >
                <span className="utc-nav-icon">🔍</span>
                <span className="utc-nav-label">GĐ6: Xét ĐK Bảo vệ Cuối</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'councils' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/councils', true)}
              >
                <span className="utc-nav-icon">⚖️</span>
                <span className="utc-nav-label">GĐ6: Hội đồng (1CT-2TK-2UV)</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ6: Xếp lịch Bảo vệ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true)}
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ6: Chấm điểm & Biên bản PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/reservations', true)}
              >
                <span className="utc-nav-icon">⏸️</span>
                <span className="utc-nav-label">Nhánh Bảo lưu Đồ án</span>
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
                className={`utc-nav-item ${activeTab === 'student-assignment' ? 'active' : ''}`}
                onClick={() => handleNavClick('/student/assignment', true)}
              >
                <span className="utc-nav-icon">🎯</span>
                <span className="utc-nav-label">GĐ2: Chọn Hướng & NV1–NV3</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Đề cương & Ký nộp PDF</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ5: Nhận Task & Nộp kết quả</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">GĐ6: Xem Lịch Bảo vệ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/student/reservation', true)}
              >
                <span className="utc-nav-icon">⏸️</span>
                <span className="utc-nav-label">GĐ6: Đơn Xin Bảo Lưu</span>
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
                className={`utc-nav-item ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => handleNavClick('/thesis/proposals', true)}
              >
                <span className="utc-nav-icon">📑</span>
                <span className="utc-nav-label">GĐ3: Xác nhận Đề cương</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('/progress/tasks', true)}
              >
                <span className="utc-nav-icon">📋</span>
                <span className="utc-nav-label">GĐ5: Giao Task & Review</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'thesis-detail' ? 'active' : ''}`}
                onClick={() => handleNavClick('/thesis/detail', true)}
              >
                <span className="utc-nav-icon">✅</span>
                <span className="utc-nav-label">GĐ6: Đủ điều kiện Bảo vệ</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true)}
              >
                <span className="utc-nav-icon">🏆</span>
                <span className="utc-nav-label">GĐ6: Chấm điểm GVHD & GVPB</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">Lịch hội đồng bảo vệ</span>
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
                className={`utc-nav-item ${activeTab === 'councils' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/councils', true)}
              >
                <span className="utc-nav-icon">⚖️</span>
                <span className="utc-nav-label">Hội đồng chấm (1CT-2TK-2UV)</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-schedules' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-schedules', true)}
              >
                <span className="utc-nav-icon">📅</span>
                <span className="utc-nav-label">Lịch chấm hội đồng</span>
              </div>

              <div
                className={`utc-nav-item ${activeTab === 'defense-scoring' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin/defense-scoring', true)}
              >
                <span className="utc-nav-icon">📝</span>
                <span className="utc-nav-label">Chấm điểm & Biên bản PDF</span>
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
