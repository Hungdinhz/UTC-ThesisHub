import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import UTCAppLayout from './components/UTCAppLayout';
import LoginPage from './pages/LoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CommitteeMemberDashboard from './pages/CommitteeMemberDashboard';
import ExternalDashboard from './pages/ExternalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import ProjectRoundManagementPage from './pages/ProjectRoundManagementPage';
import { AssignmentManagementPage } from './features/assignment/pages/AssignmentManagementPage';
import { StudentAssignmentPage } from './features/assignment/pages/StudentAssignmentPage';
import { ProposalManagementPage } from './features/thesis/pages/ProposalManagementPage';
import { ThesisDetailPage } from './features/thesis/pages/ThesisDetailPage';
import { TaskBoardPage } from './features/progress/pages/TaskBoardPage';
import { ProgressReportPage } from './features/progress/pages/ProgressReportPage';
import { ThesisEligibilityPage } from './features/eligibility/pages/ThesisEligibilityPage';
import { ReservationManagementPage } from './features/eligibility/pages/ReservationManagementPage';
import { FinalDefenseEligibilityPage } from './features/eligibility/pages/FinalDefenseEligibilityPage';
import { CouncilManagementPage } from './features/defense/pages/CouncilManagementPage';
import { DefenseSchedulePage } from './features/defense/pages/DefenseSchedulePage';
import { DefenseScoringPage } from './features/defense/pages/DefenseScoringPage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedTypes: string[] }> = ({
  children,
  allowedTypes,
}) => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
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
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/admin/register" element={<AdminRegisterPage />} />
      <Route
        path="/login"
        element={userType ? <Navigate to={`/${userType}/dashboard`} replace /> : <LoginPage />}
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedTypes={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/dashboard"
        element={
          <ProtectedRoute allowedTypes={['supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/committee_member/dashboard"
        element={
          <ProtectedRoute allowedTypes={['committee_member']}>
            <CommitteeMemberDashboard />
          </ProtectedRoute>
        }
      />
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
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
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
          <ProtectedRoute allowedTypes={['admin', 'supervisor']}>
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

      {/* Phase 4: Thesis Eligibility & Force Approve */}
      <Route
        path="/admin/eligibility"
        element={
          <ProtectedRoute allowedTypes={['admin', 'supervisor']}>
            <LayoutPageWrapper activeTab="eligibility" pageTitle="Giai đoạn 4: Xét Điều kiện Làm Đồ án & Duyệt Đặc cách (Force Approve)">
              <ThesisEligibilityPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 5: Thesis Execution (Tasks, Deadlines, Submissions, Reviews) */}
      <Route
        path="/progress/tasks"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="tasks" pageTitle="Giai đoạn 5: Thực hiện Đồ án — Giao Task, Nộp bài & Đánh giá">
              <TaskBoardPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/reports"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="reports" pageTitle="Giai đoạn 5: Báo cáo Tiến độ Định kỳ">
              <ProgressReportPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Phase 6: Final Defense Eligibility, Reservation, Councils (1CT-2TK-2UV), Schedule, Scoring & PDF Minutes */}
      <Route
        path="/admin/final-eligibility"
        element={
          <ProtectedRoute allowedTypes={['admin', 'supervisor', 'committee_member']}>
            <LayoutPageWrapper activeTab="final-eligibility" pageTitle="Giai đoạn 6: Kiểm tra Điều kiện Học vụ & Bảo vệ Cuối kỳ">
              <FinalDefenseEligibilityPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor']}>
            <LayoutPageWrapper activeTab="reservations" pageTitle="Giai đoạn 6 (Nhánh Bảo lưu): Quản lý & Duyệt Đơn Bảo lưu Đồ án">
              <ReservationManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/reservation"
        element={
          <ProtectedRoute allowedTypes={['student', 'admin']}>
            <LayoutPageWrapper activeTab="reservations" pageTitle="Đơn Xin Bảo Lưu Đồ Án Tốt Nghiệp">
              <ReservationManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/councils"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member', 'supervisor']}>
            <LayoutPageWrapper activeTab="councils" pageTitle="Giai đoạn 6: Thành lập Hội đồng (1CT-2TK-2UV) & Phân công Phản biện">
              <CouncilManagementPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/defense-schedules"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member', 'supervisor', 'student']}>
            <LayoutPageWrapper activeTab="defense-schedules" pageTitle="Giai đoạn 6: Xếp lịch Bảo vệ Đồ án Tốt nghiệp">
              <DefenseSchedulePage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/defense-scoring"
        element={
          <ProtectedRoute allowedTypes={['admin', 'committee_member', 'supervisor']}>
            <LayoutPageWrapper activeTab="defense-scoring" pageTitle="Giai đoạn 6: Chấm điểm, Tổng hợp, Xuất Biên bản PDF & Dữ liệu Cuối kỳ">
              <DefenseScoringPage />
            </LayoutPageWrapper>
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />
      <Route path="/committee" element={<Navigate to="/committee_member/dashboard" replace />} />
      <Route path="/committee_member" element={<Navigate to="/committee_member/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
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
