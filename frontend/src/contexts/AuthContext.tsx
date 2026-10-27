import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import type { UserType, Student, Supervisor, CommitteeMember, ExternalExaminer } from '../types';

interface AuthContextType {
  user: Student | Supervisor | CommitteeMember | ExternalExaminer | any | null;
  userType: UserType | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userType: UserType) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | Supervisor | CommitteeMember | ExternalExaminer | any | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (token: string, refreshTokenOrType: string | UserType, type?: UserType) => {
    const actualUserType = (type ? type : refreshTokenOrType) as UserType;
    localStorage.setItem('access_token', token);
    localStorage.removeItem('refresh_token');
    localStorage.setItem('user_type', actualUserType);
    setUserType(actualUserType);
    refreshUser();
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setUserType(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      let type = localStorage.getItem('user_type') as UserType;

      // 1. Fetch current user from /api/v1/users/me to reliably verify real role & user_type
      let currentUser: any = null;
      try {
        currentUser = await apiService.getCurrentUser();
        const apiUserType = currentUser?.userType || (currentUser as any)?.user_type;
        const apiRole = currentUser?.role;

        let detectedType: UserType | null = null;
        if (apiUserType) {
          detectedType = apiUserType as UserType;
        } else if (apiRole === 'ROLE_ADMIN') {
          detectedType = 'admin';
        } else if (apiRole === 'ROLE_LECTURER') {
          detectedType = 'supervisor';
        } else if (apiRole === 'ROLE_COMMITTEE') {
          detectedType = 'committee_member';
        } else if (apiRole === 'ROLE_STUDENT') {
          detectedType = 'student';
        } else if (apiRole === 'ROLE_EXTERNAL') {
          detectedType = 'external_examiner';
        }

        if (detectedType) {
          type = detectedType;
          localStorage.setItem('user_type', detectedType);
        }
      } catch (err) {
        console.warn('Could not verify profile via /users/me, using stored user_type:', err);
      }

      if (!type) {
        setLoading(false);
        return;
      }

      setUserType(type);
      let userData: any;

      switch (type) {
        case 'student':
          userData = await apiService.getStudentProfile();
          break;
        case 'supervisor':
          userData = await apiService.getSupervisorProfile();
          break;
        case 'committee_member':
          userData = await apiService.getCommitteeMemberProfile();
          break;
        case 'external_examiner':
          userData = await apiService.getExternalProfile();
          break;
        case 'admin':
          userData = currentUser || await apiService.getCurrentUser();
          break;
        default:
          throw new Error('Invalid user type');
      }

      if (userData && typeof userData === 'object') {
        userData.fullName = userData.fullName || userData.full_name || userData.user?.fullName || userData.user?.full_name || currentUser?.fullName || currentUser?.full_name;
        if (currentUser) {
          if (!userData.lecturer && currentUser.lecturer) {
            userData.lecturer = currentUser.lecturer;
          }
          if (!userData.student && currentUser.student) {
            userData.student = currentUser.student;
          }
          if (!userData.role) {
            userData.role = currentUser.role;
          }
        }
        if (userData.student) {
          userData.studentId = userData.student.id;
          userData.student_id = userData.student.id;
          userData.studentCode = userData.student.student_code || userData.student.registration_no;
          userData.registration_no = userData.student.registration_no || userData.student.student_code;
        }
        if (userData.lecturer) {
          userData.lecturerId = userData.lecturer.id;
          userData.lecturer_id = userData.lecturer.id;
          userData.lecturerCode = userData.lecturer.lecturer_code || userData.lecturer.supervisor_id;
          userData.supervisor_id = userData.lecturer.supervisor_id || userData.lecturer.lecturer_code;
        }
      }

      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userType, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
