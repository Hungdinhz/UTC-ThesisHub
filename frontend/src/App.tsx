import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import UTCAppLayout from './components/UTCAppLayout';
import LoginPage from './pages/LoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import ExternalDashboard from './pages/ExternalDashboard';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import ProjectRoundManagementPage from './pages/ProjectRoundManagementPage';
import { AssignmentManagementPage } from './features/assignment/pages/AssignmentManagementPage';
import { StudentAssignmentPage } from './features/assignment/pages/StudentAssignmentPage';
import { ProposalManagementPage } from './features/thesis/pages/ProposalManagementPage';
import { ThesisDetailPage } from './features/thesis/pages/ThesisDetailPage';
import { TaskBoardPage } from './features/progress/pages/TaskBoardPage';
import { ProgressReportPage } from './features/progress/pages/ProgressReportPage';
import { ThesisEligibilityPage } from './features/eligibility/pages/ThesisEligibilityPage';
import { FinalDefenseEligibilityPage } from './features/eligibility/pages/FinalDefenseEligibilityPage';
import { ReservationManagementPage } from './features/eligibility/pages/ReservationManagementPage';
import { CouncilManagementPage } from './features/defense/pages/CouncilManagementPage';
import { DefenseSchedulePage } from './features/defense/pages/DefenseSchedulePage';
import { DefenseScoringPage } from './features/defense/pages/DefenseScoringPage';
import { ChatGroupPage } from './features/chat/pages/ChatGroupPage';
import { EligibleStudentsPage } from './features/academic-staff/pages/EligibleStudentsPage';
import { ClassGradeReportPage } from './features/academic-staff/pages/ClassGradeReportPage';
import { StudentHomePage } from './features/home/pages/StudentHomePage';
import { LecturerHomePage } from './features/home/pages/LecturerHomePage';
import { AcademicStaffHomePage } from './features/home/pages/AcademicStaffHomePage';
import './App.css';

const getDefaultRouteForRole = (role?: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'student':
      return '/student/home';
    case 'supervisor':
    case 'committee_member':
      return '/lecturer/home';
    case 'external_examiner':
      return '/external_examiner/dashboard';
    case 'academic_staff':
      return '/academic-staff/home';
    default:
      return '/login';
  }
};

const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Đang tải hệ thống UTC-ThesisHub...' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#003366',
    }}
  >
    <div
      style={{
        width: '42px',
        height: '42px',
        border: '3.5px solid #e2e8f0',
        borderTop: '3.5px solid #003366',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '16px',
      }}
    />
    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{message}</span>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(0deg); } }`}</style>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedTypes: string[] }> = ({
  children,
  allowedTypes,
}) => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Đang xác thực phiên làm việc UTC..." />;
  }

  if (!userType || !allowedTypes.includes(userType)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const LayoutPageWrapper: React.FC<{
  activeTab: string;
  pageTitle: string;
  children: React.ReactNode;
}> = ({ activeTab, pageTitle, children }) => {
  const { user, logout } = useAuth();
  return (
    <UTCAppLayout activeTab={activeTab} hideHeroBanner pageTitle={pageTitle} user={user} onLogout={logout}>
      {children}
    </UTCAppLayout>
  );
};

const AppRoutes: React.FC = () => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Đang khởi tạo hệ thống UTC-ThesisHub..." />;
  }

  return (
    <Routes>
      <Route path="/admin/register" element={<AdminRegisterPage />} />
      <Route
        path="/login"
        element={userType ? <Navigate to={getDefaultRouteForRole(userType)} replace /> : <LoginPage />}
      />

      {/* Role Homepages */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/home"
        element={
          <ProtectedRoute allowedTypes={['student', 'admin']}>
            <LayoutPageWrapper activeTab="home" pageTitle="Trang chủ Sinh viên — Theo dõi Lộ trình & Tiến độ Đồ án">
              <StudentHomePage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/home"
        element={
          <ProtectedRoute allowedTypes={['supervisor', 'committee_member', 'admin']}>
            <LayoutPageWrapper activeTab="home" pageTitle="Trang chủ Giảng viên & Hội đồng — Điều hành Hướng dẫn & Bảo vệ">
              <LecturerHomePage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-staff/home"
        element={
          <ProtectedRoute allowedTypes={['academic_staff', 'admin']}>
            <LayoutPageWrapper activeTab="home" pageTitle="Trang chủ Giáo vụ Khoa — Quản lý Học vụ & Đợt Đồ án">
              <AcademicStaffHomePage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Legacy dashboard routes redirect to the new role homepages */}
      <Route path="/student/dashboard" element={<Navigate to="/student/home" replace />} />
      <Route path="/supervisor/dashboard" element={<Navigate to="/lecturer/home" replace />} />
      <Route path="/committee_member/dashboard" element={<Navigate to="/lecturer/home" replace />} />

      <Route
        path="/external_examiner/dashboard"
        element={
          <ProtectedRoute allowedTypes={['external_examiner']}>
            <ExternalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Phase 1: Admin Master Data & Project Rounds */}
      <Route
        path="/admin/organization"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <OrganizationManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/project-rounds"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <ProjectRoundManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Phase 2: Direction Selection, NV1-NV3 & Assignment Optimization */}
      <Route
        path="/admin/assignments"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <LayoutPageWrapper activeTab="assignments" pageTitle="Giai đoạn 2: Phân công Giảng viên Hướng dẫn & Duyệt Nguyện vọng">
              <AssignmentManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignment"
        element={
          <ProtectedRoute allowedTypes={['student', 'admin']}>
            <LayoutPageWrapper activeTab="student-assignment" pageTitle="Giai đoạn 2: Chọn Hướng Đồ án & Đăng ký Nguyện vọng NV1–NV3">
              <StudentAssignmentPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 3: Topic Proposal, Approval & PDF Outline */}
      <Route
        path="/thesis/proposals"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="proposals" pageTitle="Giai đoạn 3: Đề cương Đề tài, Duyệt & Xuất PDF">
              <ProposalManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/thesis/detail"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="thesis-detail" pageTitle="Chi tiết Đề tài & Xác nhận Đủ khả năng Bảo vệ">
              <ThesisDetailPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 4: Thesis Eligibility & Execution */}
      <Route
        path="/admin/eligibility"
        element={
          <ProtectedRoute allowedTypes={['admin', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="eligibility" pageTitle="Giai đoạn 4: Xét Điều kiện Làm Đồ án & Duyệt Đặc cách (Force Approve)">
              <ThesisEligibilityPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/tasks"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="tasks" pageTitle="Giai đoạn 4: Thực hiện Đồ án — Giao Task, Nộp bài & Đánh giá">
              <TaskBoardPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/reports"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="reports" pageTitle="Giai đoạn 4: Báo cáo Tiến độ Định kỳ">
              <ProgressReportPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Supervisor - Student Group Chat (#28) */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedTypes={['student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="chat" pageTitle="Nhóm Chat Hướng Dẫn Đồ Án Tốt Nghiệp">
              <ChatGroupPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 5: Final Defense Eligibility, Councils, Schedule, Scoring & PDF Minutes */}
      <Route
        path="/admin/final-eligibility"
        element={
          <ProtectedRoute allowedTypes={['admin', 'academic_staff', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="final-eligibility" pageTitle="Giai đoạn 5: Kiểm tra Điều kiện Bảo vệ Cuối kỳ">
              <FinalDefenseEligibilityPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 5: Reservation Management */}
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute allowedTypes={['admin', 'academic_staff', 'supervisor']}>
            <LayoutPageWrapper activeTab="reservations" pageTitle="Giai đoạn 5: Quản lý & Phê duyệt Đơn bảo lưu">
              <ReservationManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/reservation"
        element={
          <ProtectedRoute allowedTypes={['student']}>
            <LayoutPageWrapper activeTab="student-reservation" pageTitle="Giai đoạn 5: Đơn xin bảo lưu đồ án tốt nghiệp">
              <ReservationManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/councils"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member']}>
            <LayoutPageWrapper activeTab="councils" pageTitle="Giai đoạn 5: Thành lập Hội đồng (1CT-1TK-2PB-1UV)">
              <CouncilManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/defense-schedules"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member', 'supervisor', 'student']}>
            <LayoutPageWrapper activeTab="defense-schedules" pageTitle="Giai đoạn 5: Xếp lịch Bảo vệ Đồ án Tốt nghiệp">
              <DefenseSchedulePage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/defense-scoring"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member', 'supervisor']}>
            <LayoutPageWrapper activeTab="defense-scoring" pageTitle="Giai đoạn 5: Chấm điểm, Tổng hợp, Xuất Biên bản PDF & Dữ liệu Cuối kỳ">
              <DefenseScoringPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Giáo vụ khoa: DS đủ điều kiện nhận đồ án & in điểm đồ án theo lớp */}
      <Route
        path="/academic-staff/eligible-students"
        element={
          <ProtectedRoute allowedTypes={['academic_staff', 'admin']}>
            <LayoutPageWrapper activeTab="staff-eligible" pageTitle="Giáo vụ: Danh sách sinh viên đủ điều kiện nhận đồ án">
              <EligibleStudentsPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-staff/class-grades"
        element={
          <ProtectedRoute allowedTypes={['academic_staff', 'admin']}>
            <LayoutPageWrapper activeTab="staff-grades" pageTitle="Giáo vụ: In danh sách điểm đồ án theo lớp">
              <ClassGradeReportPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/student" element={<Navigate to="/student/home" replace />} />
      <Route path="/supervisor" element={<Navigate to="/lecturer/home" replace />} />
      <Route path="/committee" element={<Navigate to="/lecturer/home" replace />} />
      <Route path="/committee_member" element={<Navigate to="/lecturer/home" replace />} />
      <Route path="/academic-staff" element={<Navigate to="/academic-staff/home" replace />} />
      <Route path="/" element={<Navigate to={userType ? getDefaultRouteForRole(userType) : '/login'} replace />} />
      <Route path="*" element={<Navigate to={userType ? getDefaultRouteForRole(userType) : '/login'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
