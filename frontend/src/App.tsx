import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CommitteeMemberDashboard from './pages/CommitteeMemberDashboard';
import ExternalDashboard from './pages/ExternalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import ProjectRoundManagementPage from './pages/ProjectRoundManagementPage';
import { ProposalManagementPage } from './features/thesis/pages/ProposalManagementPage';
import { ThesisDetailPage } from './features/thesis/pages/ThesisDetailPage';
import { TaskBoardPage } from './features/progress/pages/TaskBoardPage';
import { ProgressReportPage } from './features/progress/pages/ProgressReportPage';
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

const AppRoutes: React.FC = () => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
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
      {/* External Examiner Route */}
      <Route
        path="/external_examiner/dashboard"
        element={
          <ProtectedRoute allowedTypes={['external_examiner']}>
            <ExternalDashboard />
          </ProtectedRoute>
        }
      />
      {/* Admin Route */}
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
      {/* Module 3: Thesis & Execution Routes (Owner: Ngo Minh Quyet) */}
      <Route
        path="/thesis/proposals"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <ProposalManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/thesis/detail"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <ThesisDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/tasks"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <TaskBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/reports"
        element={
          <ProtectedRoute allowedTypes={['admin', 'student', 'supervisor', 'committee_member']}>
            <ProgressReportPage />
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
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
