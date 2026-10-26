import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type {
  Faculty,
  Department,
  Major,
  TrainingProgram,
  LecturerItem,
  StudentItem,
  CreateLecturerPayload,
  UpdateLecturerPayload,
  CreateStudentPayload,
  UpdateStudentPayload,
  ProjectRoundItem,
} from '../types';
import UTCAppLayout from '../components/UTCAppLayout';
import './OrganizationManagementPage.css';

type TabType = 'faculties' | 'majors' | 'lecturers' | 'students';

const FACULTY_RESEARCH_DIRECTIONS = [
  { code: 'HD_PM_APP', name: 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' },
  { code: 'HD_DATA_AI', name: 'Dữ liệu và trí tuệ nhân tạo' },
  { code: 'HD_GAME', name: 'Lập trình Game' },
  { code: 'HD_TESTING', name: 'Kiểm thử phần mềm' },
  { code: 'HD_NET_INFRA', name: 'Hệ thống, mạng và hạ tầng CNTT' },
  { code: 'HD_SECURITY', name: 'An toàn thông tin và an ninh mạng' },
  { code: 'HD_ALGO', name: 'Nghiên cứu và ứng dụng thuật toán' },
];

const OrganizationManagementPage: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('faculties');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [majors, setMajors] = useState<Major[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [projectRounds, setProjectRounds] = useState<ProjectRoundItem[]>([]);

  // Lecturer states
  const [lecturers, setLecturers] = useState<LecturerItem[]>([]);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [lecturerDegree, setLecturerDegree] = useState('');
  const [lecturerDeptId, setLecturerDeptId] = useState<number | undefined>(undefined);
  const [lecturerRoundId, setLecturerRoundId] = useState<number | undefined>(undefined);

  // Lecturer Modal states
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<LecturerItem | null>(null);
  const [lecturerForm, setLecturerForm] = useState<CreateLecturerPayload>({
    username: '',
    email: '',
    password: 'password123',
    fullName: '',
    phone: '',
    lecturerCode: '',
    departmentId: undefined,
    academicDegree: 'THAC_SI',
    researchInterests: '',
    maxThesisQuota: 5,
  });
  const [lecturerErrors, setLecturerErrors] = useState<Record<string, string>>({});
  const [lecturerTouched, setLecturerTouched] = useState<Record<string, boolean>>({});
  const [deleteLecturerTarget, setDeleteLecturerTarget] = useState<LecturerItem | null>(null);

  // Student states
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentMajorId, setStudentMajorId] = useState<number | undefined>(undefined);
  const [studentRoundId, setStudentRoundId] = useState<number | undefined>(undefined);
  const [totalStudents, setTotalStudents] = useState(0);

  // Student Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [studentForm, setStudentForm] = useState<CreateStudentPayload>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    studentCode: '',
    className: '',
    majorId: undefined,
    trainingProgramId: undefined,
    gender: 'NAM',
    debtCredits: 0,
  });
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});
  const [studentTouched, setStudentTouched] = useState<Record<string, boolean>>({});
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<StudentItem | null>(null);

  // Load initial faculties
  const loadFaculties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getFaculties();
      setFaculties(data || []);
      if (data && data.length > 0 && selectedFacultyId === null) {
        setSelectedFacultyId(data[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khoa');
    } finally {
      setLoading(false);
    }
  };

  // Load departments for selected faculty
  const loadDepartments = async (facId?: number) => {
    try {
      const data = await apiService.getDepartments(facId);
      setDepartments(data || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Load majors & programs
  const loadMajorsAndPrograms = async () => {
    try {
      setLoading(true);
      const [majorsData, programsData] = await Promise.all([
        apiService.getMajors(),
        apiService.getTrainingPrograms(),
      ]);
      setMajors(majorsData || []);
      setTrainingPrograms(programsData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải ngành và chương trình');
    } finally {
      setLoading(false);
    }
  };

  // Load project rounds
  const loadProjectRounds = async () => {
    try {
      const rounds = await apiService.getProjectRounds();
      setProjectRounds(rounds || []);
    } catch (err: unknown) {
      console.error('Lỗi tải danh mục đợt đồ án:', err);
    }
  };

  // Load lecturers (Contract 1)
  const loadLecturers = async (roundId?: number) => {
    try {
      setLoading(true);
      const targetRoundId = roundId !== undefined ? roundId : lecturerRoundId;
      const data = await apiService.getLecturers({
        departmentId: lecturerDeptId,
        degree: lecturerDegree || undefined,
        search: lecturerSearch || undefined,
        projectRoundId: targetRoundId,
      });
      setLecturers(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  // Load students
  const loadStudents = async (roundId?: number) => {
    try {
      setLoading(true);
      const targetRoundId = roundId !== undefined ? roundId : studentRoundId;
      const res = await apiService.getOrganizationStudents({
        majorId: studentMajorId,
        className: studentClass || undefined,
        search: studentSearch || undefined,
        projectRoundId: targetRoundId,
        page: 0,
        size: 100,
      });
      const rawStudents = res.content || [];
      const sortedStudents = [...rawStudents].sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      setStudents(sortedStudents);
      setTotalStudents(res.totalElements || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculties();
    loadDepartments();
    loadMajorsAndPrograms();
    loadProjectRounds();
  }, []);

  useEffect(() => {
    if (activeTab === 'faculties') {
      loadDepartments(selectedFacultyId || undefined);
    } else if (activeTab === 'majors') {
      loadMajorsAndPrograms();
    } else if (activeTab === 'lecturers') {
      loadDepartments();
      loadLecturers();
    } else if (activeTab === 'students') {
      loadMajorsAndPrograms();
      loadStudents();
    }
  }, [activeTab, selectedFacultyId]);

  // Realtime Validation Logic for Lecturer
  const validateLecturerField = (field: string, value: any): string => {
    switch (field) {
      case 'lecturerCode': {
        const val = String(value || '').trim();
        if (!val) return 'Mã giảng viên không được để trống';
        if (val.length < 3) return 'Mã giảng viên phải có ít nhất 3 ký tự (VD: GV015)';
        return '';
      }
      case 'username': {
        const val = String(value || '').trim();
        if (!val) return 'Tên đăng nhập không được để trống';
        if (/\s/.test(val)) return 'Tên đăng nhập không được chứa khoảng trắng';
        if (val.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        return '';
      }
      case 'fullName': {
        const val = String(value || '').trim();
        if (!val) return 'Họ và tên giảng viên không được để trống';
        if (val.length < 2) return 'Họ và tên quá ngắn';
        return '';
      }
      case 'phone': {
        const val = String(value || '').trim();
        if (val && !/^0\d{9}$/.test(val)) {
          return 'Số điện thoại phải gồm đúng 10 chữ số bắt đầu bằng 0 (VD: 0912345678)';
        }
        return '';
      }
      case 'email': {
        const val = String(value || '').trim();
        if (!val) return 'Email công vụ không được để trống';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
          return 'Email không đúng định dạng chuẩn (VD: gv@utc.edu.vn)';
        }
        return '';
      }
      case 'password': {
        if (!editingLecturer) {
          const val = String(value || '');
          if (!val) return 'Mật khẩu khởi tạo không được để trống';
          if (val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        return '';
      }
      case 'departmentId': {
        const val = Number(value);
        if (!val || val <= 0) return 'Vui lòng chọn bộ môn trực thuộc';
        return '';
      }
      case 'academicDegree': {
        if (!value) return 'Vui lòng chọn học vị của giảng viên';
        return '';
      }
      case 'maxThesisQuota': {
        const val = Number(value);
        if (isNaN(val) || val < 1 || val > 30) return 'Chỉ tiêu hướng dẫn phải từ 1 đến 30 sinh viên';
        return '';
      }
      default:
        return '';
    }
  };

  const handleLecturerChange = (field: string, value: any) => {
    let updated = { ...lecturerForm, [field]: value };
    if (field === 'lecturerCode' && !editingLecturer) {
      const code = String(value).trim();
      updated.username = code.toLowerCase().replace(/\s+/g, '');
      if (!lecturerTouched.email) {
        updated.email = code ? `${code.toLowerCase()}@utc.edu.vn` : '';
      }
    }
    setLecturerForm(updated);
    const err = validateLecturerField(field, value);
    setLecturerErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleLecturerBlur = (field: string) => {
    setLecturerTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateLecturerField(field, (lecturerForm as any)[field]);
    setLecturerErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Realtime Validation Logic for Student
  const validateStudentField = (field: string, value: any): string => {
    switch (field) {
      case 'studentCode': {
        const val = String(value || '').trim();
        if (!val) return 'Mã sinh viên không được để trống';
        if (!/^\d{9}$/.test(val)) {
          return `Mã sinh viên phải gồm đúng 9 chữ số (hiện tại: ${val.length} số)`;
        }
        return '';
      }
      case 'password': {
        if (!editingStudent) {
          const val = String(value || '');
          if (!val) return 'Mật khẩu khởi tạo không được để trống';
          if (val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        return '';
      }
      case 'fullName': {
        const val = String(value || '').trim();
        if (!val) return 'Họ và tên sinh viên không được để trống';
        if (val.length < 2) return 'Họ và tên quá ngắn';
        return '';
      }
      case 'className': {
        const val = String(value || '').trim();
        if (!val) return 'Lớp hành chính không được để trống (VD: CNTT1-K62)';
        return '';
      }
      case 'email': {
        const val = String(value || '').trim();
        if (!val) return 'Email sinh viên không được để trống';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
          return 'Email không đúng định dạng (VD: 201200101@st.utc.edu.vn)';
        }
        return '';
      }
      case 'phone': {
        const val = String(value || '').trim();
        if (val && !/^0\d{9}$/.test(val)) {
          return 'Số điện thoại phải gồm đúng 10 chữ số bắt đầu bằng 0 (VD: 0987654321)';
        }
        return '';
      }
      case 'majorId': {
        const val = Number(value);
        if (!val || val <= 0) return 'Vui lòng chọn ngành đào tạo';
        return '';
      }
      case 'trainingProgramId': {
        const val = Number(value);
        if (!val || val <= 0) return 'Vui lòng chọn chương trình đào tạo';
        return '';
      }
      case 'debtCredits': {
        const val = Number(value);
        if (isNaN(val) || val < 0) return 'Số tín chỉ nợ phải >= 0';
        return '';
      }
      default:
        return '';
    }
  };

  const handleStudentChange = (field: string, value: any) => {
    let updated = { ...studentForm, [field]: value };
    if (field === 'studentCode' && !editingStudent) {
      const code = String(value).trim();
      updated.username = code;
      if (!studentTouched.email) {
        updated.email = code ? `${code}@st.utc.edu.vn` : '';
      }
      if (!studentTouched.password) {
        updated.password = code;
      }
    }
    setStudentForm(updated);
    const err = validateStudentField(field, value);
    setStudentErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleStudentBlur = (field: string) => {
    setStudentTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateStudentField(field, (studentForm as any)[field]);
    setStudentErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleOpenCreateLecturer = () => {
    setEditingLecturer(null);
    setLecturerErrors({});
    setLecturerTouched({});
    setLecturerForm({
      username: '',
      email: '',
      password: 'password123',
      fullName: '',
      phone: '',
      lecturerCode: '',
      departmentId: departments[0]?.id,
      academicDegree: 'THAC_SI',
      researchInterests: '',
      maxThesisQuota: 5,
    });
    setShowLecturerModal(true);
  };

  const handleOpenEditLecturer = (lec: LecturerItem) => {
    setEditingLecturer(lec);
    setLecturerErrors({});
    setLecturerTouched({});
    setLecturerForm({
      username: lec.lecturerCode.toLowerCase(),
      email: lec.email,
      password: '',
      fullName: lec.fullName,
      phone: lec.phone || '',
      lecturerCode: lec.lecturerCode,
      departmentId: lec.departmentId || departments[0]?.id,
      academicDegree: lec.academicDegree || 'THAC_SI',
      researchInterests: lec.researchInterests || '',
      maxThesisQuota: lec.maxThesisQuota || 5,
    });
    setShowLecturerModal(true);
  };

  const handleSubmitLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate = editingLecturer
      ? ['fullName', 'phone', 'departmentId', 'academicDegree', 'maxThesisQuota']
      : ['lecturerCode', 'username', 'fullName', 'phone', 'email', 'password', 'departmentId', 'academicDegree', 'maxThesisQuota'];

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let hasErr = false;

    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      const err = validateLecturerField(f, (lecturerForm as any)[f]);
      if (err) {
        newErrors[f] = err;
        hasErr = true;
      }
    });

    setLecturerTouched((prev) => ({ ...prev, ...newTouched }));
    setLecturerErrors(newErrors);

    if (hasErr) {
      setError('Vui lòng kiểm tra và sửa các thông tin chưa đúng định dạng.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      if (editingLecturer) {
        const updatePayload: UpdateLecturerPayload = {
          fullName: lecturerForm.fullName.trim(),
          phone: lecturerForm.phone?.trim() || '',
          departmentId: lecturerForm.departmentId,
          academicDegree: lecturerForm.academicDegree,
          researchInterests: lecturerForm.researchInterests,
          maxThesisQuota: lecturerForm.maxThesisQuota,
          isActive: editingLecturer.isActive,
        };
        await apiService.updateLecturer(editingLecturer.lecturerId, updatePayload);
        setSuccessMsg(`Đã cập nhật thông tin giảng viên ${lecturerForm.fullName} thành công!`);
      } else {
        const createPayload: CreateLecturerPayload = {
          ...lecturerForm,
          lecturerCode: lecturerForm.lecturerCode.trim(),
          fullName: lecturerForm.fullName.trim(),
          username: (lecturerForm.username || lecturerForm.lecturerCode).trim().toLowerCase(),
          email: (lecturerForm.email || `${lecturerForm.lecturerCode.toLowerCase()}@utc.edu.vn`).trim(),
          phone: lecturerForm.phone?.trim() || '',
          password: lecturerForm.password || 'password123',
        };
        await apiService.createLecturer(createPayload);
        setSuccessMsg(
          `Đã tạo tài khoản giảng viên ${createPayload.fullName} (Username: ${createPayload.username}, Mật khẩu: ${createPayload.password})`
        );
      }
      setShowLecturerModal(false);
      await loadLecturers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi lưu thông tin giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLecturer = async () => {
    if (!deleteLecturerTarget) return;
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteLecturer(deleteLecturerTarget.lecturerId);
      setSuccessMsg(`Đã xóa giảng viên ${deleteLecturerTarget.fullName} (${deleteLecturerTarget.lecturerCode}) thành công!`);
      setDeleteLecturerTarget(null);
      await loadLecturers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi xóa giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateStudent = () => {
    setEditingStudent(null);
    setStudentErrors({});
    setStudentTouched({});
    setStudentForm({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      studentCode: '',
      className: '',
      majorId: majors[0]?.id,
      trainingProgramId: trainingPrograms[0]?.id,
      gender: 'NAM',
      debtCredits: 0,
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (st: StudentItem) => {
    setEditingStudent(st);
    setStudentErrors({});
    setStudentTouched({});
    setStudentForm({
      username: st.studentCode,
      email: st.email,
      password: '',
      fullName: st.fullName,
      phone: st.phone || '',
      studentCode: st.studentCode,
      className: st.className || '',
      majorId: st.majorId || majors[0]?.id,
      trainingProgramId: st.trainingProgramId || trainingPrograms[0]?.id,
      gender: st.gender || 'NAM',
      debtCredits: st.debtCredits || 0,
    });
    setShowStudentModal(true);
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate = editingStudent
      ? ['fullName', 'className', 'phone', 'majorId', 'trainingProgramId', 'debtCredits']
      : ['studentCode', 'password', 'fullName', 'className', 'email', 'phone', 'majorId', 'trainingProgramId', 'debtCredits'];

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let hasErr = false;

    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      const err = validateStudentField(f, (studentForm as any)[f]);
      if (err) {
        newErrors[f] = err;
        hasErr = true;
      }
    });

    setStudentTouched((prev) => ({ ...prev, ...newTouched }));
    setStudentErrors(newErrors);

    if (hasErr) {
      setError('Vui lòng kiểm tra và sửa các thông tin sinh viên chưa đúng định dạng.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      if (editingStudent) {
        const updatePayload: UpdateStudentPayload = {
          fullName: studentForm.fullName.trim(),
          phone: studentForm.phone?.trim() || '',
          className: studentForm.className?.trim() || '',
          majorId: studentForm.majorId,
          trainingProgramId: studentForm.trainingProgramId,
          gender: studentForm.gender,
          debtCredits: studentForm.debtCredits,
          isActive: editingStudent.isActive,
        };
        await apiService.updateStudent(editingStudent.studentId, updatePayload);
        setSuccessMsg(`Đã cập nhật hồ sơ sinh viên ${studentForm.fullName} thành công!`);
      } else {
        const codeTrimmed = studentForm.studentCode.trim();
        const createPayload: CreateStudentPayload = {
          ...studentForm,
          studentCode: codeTrimmed,
          fullName: studentForm.fullName.trim(),
          className: studentForm.className?.trim() || '',
          phone: studentForm.phone?.trim() || '',
          username: (studentForm.username || codeTrimmed).trim(),
          email: (studentForm.email || `${codeTrimmed}@st.utc.edu.vn`).trim(),
          password: studentForm.password || codeTrimmed,
        };
        await apiService.createStudent(createPayload);
        setSuccessMsg(
          `Đã tạo tài khoản sinh viên ${createPayload.fullName} (Username/MSSV: ${createPayload.username}, Mật khẩu: ${createPayload.password})`
        );
      }
      setShowStudentModal(false);
      await loadStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi lưu thông tin sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteStudent(deleteStudentTarget.studentId);
      setSuccessMsg(`Đã xóa sinh viên ${deleteStudentTarget.fullName} (${deleteStudentTarget.studentCode}) thành công!`);
      setDeleteStudentTarget(null);
      await loadStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi xóa sinh viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UTCAppLayout activeTab="organization" hideHeroBanner pageTitle="Quản lý Dữ liệu Tổ chức & Đào tạo" onLogout={logout}>
      <div className="org-page-container">
        {/* Navigation Tabs */}
        <div className="org-tabs-container">
          <button
            onClick={() => setActiveTab('faculties')}
            className="org-tab-button"
            style={{
              borderBottom: activeTab === 'faculties' ? '3px solid #0a3273' : '3px solid transparent',
              color: activeTab === 'faculties' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'faculties' ? 700 : 500,
            }}
          >
            🏛️ Khoa & Bộ môn
          </button>
          <button
            onClick={() => setActiveTab('majors')}
            className="org-tab-button"
            style={{
              borderBottom: activeTab === 'majors' ? '3px solid #0a3273' : '3px solid transparent',
              color: activeTab === 'majors' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'majors' ? 700 : 500,
            }}
          >
            🎓 Ngành & CTĐT
          </button>
          <button
            onClick={() => setActiveTab('lecturers')}
            className="org-tab-button"
            style={{
              borderBottom: activeTab === 'lecturers' ? '3px solid #0a3273' : '3px solid transparent',
              color: activeTab === 'lecturers' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'lecturers' ? 700 : 500,
            }}
          >
            👨‍🏫 Danh sách Giảng viên (Contract 1)
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className="org-tab-button"
            style={{
              borderBottom: activeTab === 'students' ? '3px solid #0a3273' : '3px solid transparent',
              color: activeTab === 'students' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'students' ? 700 : 500,
            }}
          >
            👨‍🎓 Danh sách Sinh viên
          </button>
        </div>

        {loading && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            ⏳ Đang tải dữ liệu hệ thống...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {/* Tab 1: Khoa & Bộ môn */}
        {activeTab === 'faculties' && (
          <div className="org-two-col-layout">
            {/* Faculties List */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Danh mục Khoa ({faculties.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faculties.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFacultyId(f.id);
                      loadDepartments(f.id);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedFacultyId === f.id ? '2px solid #0a3273' : '1px solid #e2e8f0',
                      backgroundColor: selectedFacultyId === f.id ? '#eff6ff' : '#fff',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Mã: {f.code} • {f.departmentCount || 0} bộ môn
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Departments List */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Bộ môn trực thuộc ({departments.length})</h3>
              <div className="org-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                      <th style={{ padding: '10px' }}>Mã BM</th>
                      <th style={{ padding: '10px' }}>Tên bộ môn</th>
                      <th style={{ padding: '10px' }}>Khoa</th>
                      <th style={{ padding: '10px' }}>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0a3273' }}>{d.code}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 500 }}>{d.name}</td>
                        <td style={{ padding: '12px 10px', color: '#64748b' }}>{d.facultyName || 'Khoa CNTT'}</td>
                        <td style={{ padding: '12px 10px', color: '#475569', fontSize: '0.85rem' }}>{d.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ngành & Chương trình đào tạo */}
        {activeTab === 'majors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Training Programs */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Chương trình đào tạo UTC ({trainingPrograms.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {trainingPrograms.map((tp) => (
                  <div key={tp.id} style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0a3273' }}>
                      {tp.name} ({tp.code})
                    </div>
                    <div style={{ marginTop: '8px', color: '#334155', fontSize: '0.9rem' }}>
                      ⏱️ Thời gian đào tạo: <strong>{tp.durationYears} năm</strong>
                    </div>
                    <div style={{ marginTop: '4px', color: '#334155', fontSize: '0.9rem' }}>
                      📚 Tổng tín chỉ tích lũy: <strong>{tp.totalCredits} tín chỉ</strong>
                    </div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '0.85rem' }}>{tp.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Majors */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Danh mục Ngành đào tạo ({majors.length})</h3>
              <div className="org-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                      <th style={{ padding: '10px' }}>Mã ngành</th>
                      <th style={{ padding: '10px' }}>Tên ngành</th>
                      <th style={{ padding: '10px' }}>Khoa quản lý</th>
                      <th style={{ padding: '10px' }}>Bộ môn phụ trách</th>
                    </tr>
                  </thead>
                  <tbody>
                    {majors.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0a3273' }}>{m.code}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 500 }}>{m.name}</td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>{m.facultyName || 'Khoa CNTT'}</td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>{m.departmentName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Danh sách Giảng viên (Contract 1) */}
        {activeTab === 'lecturers' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Danh mục Giảng viên & Học vị (Contract 1 Pool)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Thiết lập quan hệ Khoa – Bộ môn – Giảng viên, cập nhật hướng nghiên cứu và học vị (Tiến sĩ/PGS/GS đủ chuẩn hướng dẫn CT Kỹ sư & Chủ tịch HĐ)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                  Tổng số: {lecturers.length} giảng viên
                </span>
                <button
                  onClick={handleOpenCreateLecturer}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ➕ Thêm Giảng viên mới
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="org-filter-bar">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm theo tên, hướng nghiên cứu hoặc mã CB..."
                value={lecturerSearch}
                onChange={(e) => setLecturerSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '220px' }}
              />
              <select
                value={lecturerDegree}
                onChange={(e) => setLecturerDegree(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Tất cả học vị --</option>
                <option value="THAC_SI">Thạc sĩ</option>
                <option value="TIEN_SI">Tiến sĩ</option>
                <option value="PGS">Phó Giáo sư</option>
                <option value="GS">Giáo sư</option>
              </select>
              <select
                value={lecturerDeptId || ''}
                onChange={(e) => setLecturerDeptId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Tất cả bộ môn --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <select
                value={lecturerRoundId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setLecturerRoundId(val);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Tất cả đợt đồ án --</option>
                {projectRounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    {r.name} ({r.roundCode})
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadLecturers()}
                style={{
                  backgroundColor: '#0a3273',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Lọc dữ liệu
              </button>
            </div>

            {/* Lecturer Table */}
            <div className="org-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px' }}>Mã CB</th>
                  <th style={{ padding: '10px' }}>Họ và tên</th>
                  <th style={{ padding: '10px' }}>Học vị</th>
                  <th style={{ padding: '10px' }}>Bộ môn</th>
                  <th style={{ padding: '10px' }}>Đợt đồ án tham gia</th>
                  <th style={{ padding: '10px' }}>Hướng nghiên cứu</th>
                  <th style={{ padding: '10px' }}>Chỉ tiêu</th>
                  <th style={{ padding: '10px' }}>Trạng thái</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l) => (
                  <tr key={l.lecturerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0a3273' }}>{l.lecturerCode}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{l.fullName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{l.email}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: l.academicDegree === 'TIEN_SI' || l.academicDegree === 'PGS' || l.academicDegree === 'GS' ? '#fef3c7' : '#e0e7ff',
                          color: l.academicDegree === 'TIEN_SI' || l.academicDegree === 'PGS' || l.academicDegree === 'GS' ? '#92400e' : '#3730a3',
                        }}
                      >
                        {l.academicDegree || 'THAC_SI'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{l.departmentName || '—'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      {l.projectRoundCodes && l.projectRoundCodes.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {l.projectRoundCodes.map((code, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                              title={l.projectRoundNames && l.projectRoundNames[idx] ? l.projectRoundNames[idx] : code}
                            >
                              📌 {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>Chưa tham gia đợt</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#047857', fontSize: '0.85rem' }}>{l.researchInterests || '—'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{l.maxThesisQuota || 5} SV</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ color: l.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                        {l.isActive ? '● Đang hoạt động' : '○ Đã khóa'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEditLecturer(l)}
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Cập nhật Học vị / Hướng NC
                        </button>
                        <button
                          onClick={() => setDeleteLecturerTarget(l)}
                          style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                          title="Xóa giảng viên khỏi hệ thống"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Tab 4: Danh sách Sinh viên */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Hồ sơ Sinh viên Master Data</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Quản lý danh sách sinh viên theo Ngành, Chương trình đào tạo (Cử nhân / Kỹ sư) và tạo tài khoản thủ công
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 12px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                  Tổng số: {totalStudents} sinh viên
                </span>
                <button
                  onClick={handleOpenCreateStudent}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ➕ Thêm Sinh viên thủ công
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Tìm kiếm theo tên hoặc mã SV..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '220px' }}
              />
              <input
                type="text"
                placeholder="Lớp (VD: CNTT1)..."
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px' }}
              />
              <select
                value={studentMajorId || ''}
                onChange={(e) => setStudentMajorId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Tất cả ngành --</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
              <select
                value={studentRoundId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setStudentRoundId(val);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Tất cả đợt đồ án --</option>
                {projectRounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    {r.name} ({r.roundCode})
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadStudents()}
                style={{
                  backgroundColor: '#0a3273',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Tìm kiếm
              </button>
            </div>

            {/* Student Table */}
            <div className="org-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>Mã SV</th>
                    <th style={{ padding: '10px' }}>Họ và tên</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Lớp</th>
                    <th style={{ padding: '10px' }}>Ngành</th>
                    <th style={{ padding: '10px' }}>CT Đào tạo</th>
                    <th style={{ padding: '10px' }}>Đợt đồ án</th>
                    <th style={{ padding: '10px' }}>Nợ tín chỉ</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0a3273' }}>{s.studentCode}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{s.fullName}</td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>{s.email}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 500 }}>{s.className || '—'}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{s.majorName || 'CNTT'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                          }}
                        >
                          {s.trainingProgramName || 'Cử nhân'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {s.projectRoundCodes && s.projectRoundCodes.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {s.projectRoundCodes.map((code, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: '#ede9fe',
                                  color: '#6d28d9',
                                  border: '1px solid #ddd6fe',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                }}
                                title={s.projectRoundNames && s.projectRoundNames[idx] ? s.projectRoundNames[idx] : code}
                              >
                                🎯 {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>Chưa vào đợt</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: (s.debtCredits || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                        {s.debtCredits || 0} TC
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                            }}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => setDeleteStudentTarget(s)}
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                            }}
                            title="Xóa sinh viên khỏi hệ thống"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Tạo / Cập nhật Giảng viên */}
      {showLecturerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '580px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#0a3273' }}>
              {editingLecturer ? `✏️ Cập nhật Giảng viên: ${editingLecturer.fullName}` : '➕ Tạo tài khoản Giảng viên mới'}
            </h3>
            <form onSubmit={handleSubmitLecturer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!editingLecturer && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mã giảng viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: GV015"
                      value={lecturerForm.lecturerCode}
                      onChange={(e) => handleLecturerChange('lecturerCode', e.target.value)}
                      onBlur={() => handleLecturerBlur('lecturerCode')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: lecturerTouched.lecturerCode && lecturerErrors.lecturerCode ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: lecturerTouched.lecturerCode && lecturerErrors.lecturerCode ? '#fff5f5' : '#fff',
                      }}
                    />
                    {lecturerTouched.lecturerCode && lecturerErrors.lecturerCode && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {lecturerErrors.lecturerCode}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: gv015"
                      value={lecturerForm.username}
                      onChange={(e) => handleLecturerChange('username', e.target.value)}
                      onBlur={() => handleLecturerBlur('username')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: lecturerTouched.username && lecturerErrors.username ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: lecturerTouched.username && lecturerErrors.username ? '#fff5f5' : '#fff',
                      }}
                    />
                    {lecturerTouched.username && lecturerErrors.username && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {lecturerErrors.username}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Họ và tên giảng viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TS. Nguyễn Văn An"
                    value={lecturerForm.fullName}
                    onChange={(e) => handleLecturerChange('fullName', e.target.value)}
                    onBlur={() => handleLecturerBlur('fullName')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: lecturerTouched.fullName && lecturerErrors.fullName ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: lecturerTouched.fullName && lecturerErrors.fullName ? '#fff5f5' : '#fff',
                    }}
                  />
                  {lecturerTouched.fullName && lecturerErrors.fullName && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {lecturerErrors.fullName}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={lecturerForm.phone || ''}
                    onChange={(e) => handleLecturerChange('phone', e.target.value)}
                    onBlur={() => handleLecturerBlur('phone')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: lecturerTouched.phone && lecturerErrors.phone ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: lecturerTouched.phone && lecturerErrors.phone ? '#fff5f5' : '#fff',
                    }}
                  />
                  {lecturerTouched.phone && lecturerErrors.phone && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {lecturerErrors.phone}
                    </div>
                  )}
                </div>
              </div>

              {!editingLecturer && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Email công vụ *</label>
                    <input
                      type="email"
                      required
                      placeholder="annv@utc.edu.vn"
                      value={lecturerForm.email}
                      onChange={(e) => handleLecturerChange('email', e.target.value)}
                      onBlur={() => handleLecturerBlur('email')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: lecturerTouched.email && lecturerErrors.email ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: lecturerTouched.email && lecturerErrors.email ? '#fff5f5' : '#fff',
                      }}
                    />
                    {lecturerTouched.email && lecturerErrors.email && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {lecturerErrors.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mật khẩu khởi tạo</label>
                    <input
                      type="text"
                      required
                      value={lecturerForm.password}
                      onChange={(e) => handleLecturerChange('password', e.target.value)}
                      onBlur={() => handleLecturerBlur('password')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: lecturerTouched.password && lecturerErrors.password ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: lecturerTouched.password && lecturerErrors.password ? '#fff5f5' : '#fff',
                      }}
                    />
                    {lecturerTouched.password && lecturerErrors.password && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {lecturerErrors.password}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Bộ môn trực thuộc</label>
                  <select
                    value={lecturerForm.departmentId || ''}
                    onChange={(e) => handleLecturerChange('departmentId', e.target.value ? Number(e.target.value) : undefined)}
                    onBlur={() => handleLecturerBlur('departmentId')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: lecturerTouched.departmentId && lecturerErrors.departmentId ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: lecturerTouched.departmentId && lecturerErrors.departmentId ? '#fff5f5' : '#fff',
                    }}
                  >
                    <option value="">-- Chọn bộ môn --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {lecturerTouched.departmentId && lecturerErrors.departmentId && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {lecturerErrors.departmentId}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Học vị (Xét CT Kỹ sư) *</label>
                  <select
                    value={lecturerForm.academicDegree}
                    onChange={(e) => handleLecturerChange('academicDegree', e.target.value)}
                    onBlur={() => handleLecturerBlur('academicDegree')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: lecturerTouched.academicDegree && lecturerErrors.academicDegree ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: lecturerTouched.academicDegree && lecturerErrors.academicDegree ? '#fff5f5' : '#fff',
                    }}
                  >
                    <option value="THAC_SI">Thạc sĩ (THAC_SI)</option>
                    <option value="TIEN_SI">Tiến sĩ (TIEN_SI)</option>
                    <option value="PGS">Phó Giáo sư (PGS)</option>
                    <option value="GS">Giáo sư (GS)</option>
                  </select>
                  {lecturerTouched.academicDegree && lecturerErrors.academicDegree && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {lecturerErrors.academicDegree}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Chỉ tiêu SV</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={lecturerForm.maxThesisQuota || 5}
                    onChange={(e) => handleLecturerChange('maxThesisQuota', Number(e.target.value))}
                    onBlur={() => handleLecturerBlur('maxThesisQuota')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: lecturerTouched.maxThesisQuota && lecturerErrors.maxThesisQuota ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: lecturerTouched.maxThesisQuota && lecturerErrors.maxThesisQuota ? '#fff5f5' : '#fff',
                    }}
                  />
                  {lecturerTouched.maxThesisQuota && lecturerErrors.maxThesisQuota && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {lecturerErrors.maxThesisQuota}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Hướng nghiên cứu / Chuyên môn hướng dẫn *
                </label>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                  Chọn các hướng nghiên cứu để hệ thống khớp chuyên môn với nguyện vọng đăng ký của sinh viên:
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  {FACULTY_RESEARCH_DIRECTIONS.map((dir) => {
                    const currentInterests = lecturerForm.researchInterests || '';
                    const isSelected =
                      currentInterests.includes(dir.code) ||
                      currentInterests.toLowerCase().includes(dir.name.toLowerCase().substring(0, 15));

                    const handleToggleDirection = (checked: boolean) => {
                      const tokens = currentInterests
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      let newTokens: string[];
                      if (checked) {
                        if (!tokens.includes(dir.code)) {
                          newTokens = [...tokens, dir.code];
                        } else {
                          newTokens = tokens;
                        }
                      } else {
                        newTokens = tokens.filter(
                          (t) =>
                            t !== dir.code &&
                            !t.toLowerCase().includes(dir.name.toLowerCase().substring(0, 15))
                        );
                      }
                      setLecturerForm({
                        ...lecturerForm,
                        researchInterests: newTokens.join(', '),
                      });
                    };

                    return (
                      <label
                        key={dir.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#eff6ff' : '#fff',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleDirection(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span
                          style={{
                            fontWeight: 700,
                            color: isSelected ? '#1d4ed8' : '#0369a1',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            minWidth: '100px',
                          }}
                        >
                          {dir.code}
                        </span>
                        <span style={{ color: '#1e293b', flex: 1 }}>{dir.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowLecturerModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  💾 Lưu thông tin Giảng viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tạo / Cập nhật Sinh viên */}
      {showStudentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '580px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#0a3273' }}>
              {editingStudent ? `✏️ Cập nhật Sinh viên: ${editingStudent.fullName}` : '➕ Tạo tài khoản Sinh viên thủ công'}
            </h3>
            <form onSubmit={handleSubmitStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!editingStudent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mã sinh viên (MSSV - đúng 9 số) *</label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      placeholder="VD: 201200101"
                      value={studentForm.studentCode}
                      onChange={(e) => handleStudentChange('studentCode', e.target.value)}
                      onBlur={() => handleStudentBlur('studentCode')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: studentTouched.studentCode && studentErrors.studentCode ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: studentTouched.studentCode && studentErrors.studentCode ? '#fff5f5' : '#fff',
                      }}
                    />
                    {studentTouched.studentCode && studentErrors.studentCode && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {studentErrors.studentCode}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mật khẩu khởi tạo (Mặc định: Mã SV)</label>
                    <input
                      type="text"
                      required
                      value={studentForm.password}
                      onChange={(e) => handleStudentChange('password', e.target.value)}
                      onBlur={() => handleStudentBlur('password')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: studentTouched.password && studentErrors.password ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: studentTouched.password && studentErrors.password ? '#fff5f5' : '#fff',
                      }}
                    />
                    {studentTouched.password && studentErrors.password && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {studentErrors.password}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Họ và tên sinh viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Minh"
                    value={studentForm.fullName}
                    onChange={(e) => handleStudentChange('fullName', e.target.value)}
                    onBlur={() => handleStudentBlur('fullName')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: studentTouched.fullName && studentErrors.fullName ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: studentTouched.fullName && studentErrors.fullName ? '#fff5f5' : '#fff',
                    }}
                  />
                  {studentTouched.fullName && studentErrors.fullName && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {studentErrors.fullName}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Lớp hành chính *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CNTT1-K62"
                    value={studentForm.className || ''}
                    onChange={(e) => handleStudentChange('className', e.target.value)}
                    onBlur={() => handleStudentBlur('className')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: studentTouched.className && studentErrors.className ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: studentTouched.className && studentErrors.className ? '#fff5f5' : '#fff',
                    }}
                  />
                  {studentTouched.className && studentErrors.className && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {studentErrors.className}
                    </div>
                  )}
                </div>
              </div>

              {!editingStudent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Email sinh viên *</label>
                    <input
                      type="email"
                      required
                      placeholder="211200888@st.utc.edu.vn"
                      value={studentForm.email}
                      onChange={(e) => handleStudentChange('email', e.target.value)}
                      onBlur={() => handleStudentBlur('email')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: studentTouched.email && studentErrors.email ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: studentTouched.email && studentErrors.email ? '#fff5f5' : '#fff',
                      }}
                    />
                    {studentTouched.email && studentErrors.email && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {studentErrors.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="0987654321"
                      value={studentForm.phone || ''}
                      onChange={(e) => handleStudentChange('phone', e.target.value)}
                      onBlur={() => handleStudentBlur('phone')}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: studentTouched.phone && studentErrors.phone ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        backgroundColor: studentTouched.phone && studentErrors.phone ? '#fff5f5' : '#fff',
                      }}
                    />
                    {studentTouched.phone && studentErrors.phone && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        ⚠️ {studentErrors.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngành đào tạo *</label>
                  <select
                    value={studentForm.majorId || ''}
                    onChange={(e) => handleStudentChange('majorId', e.target.value ? Number(e.target.value) : undefined)}
                    onBlur={() => handleStudentBlur('majorId')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: studentTouched.majorId && studentErrors.majorId ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: studentTouched.majorId && studentErrors.majorId ? '#fff5f5' : '#fff',
                    }}
                  >
                    <option value="">-- Chọn ngành --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                  {studentTouched.majorId && studentErrors.majorId && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {studentErrors.majorId}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Chương trình đào tạo *</label>
                  <select
                    value={studentForm.trainingProgramId || ''}
                    onChange={(e) => handleStudentChange('trainingProgramId', e.target.value ? Number(e.target.value) : undefined)}
                    onBlur={() => handleStudentBlur('trainingProgramId')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: studentTouched.trainingProgramId && studentErrors.trainingProgramId ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: studentTouched.trainingProgramId && studentErrors.trainingProgramId ? '#fff5f5' : '#fff',
                    }}
                  >
                    <option value="">-- Chọn CTĐT --</option>
                    {trainingPrograms.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name} ({tp.code})
                      </option>
                    ))}
                  </select>
                  {studentTouched.trainingProgramId && studentErrors.trainingProgramId && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {studentErrors.trainingProgramId}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Nợ TC</label>
                  <input
                    type="number"
                    min={0}
                    value={studentForm.debtCredits ?? 0}
                    onChange={(e) => handleStudentChange('debtCredits', Number(e.target.value))}
                    onBlur={() => handleStudentBlur('debtCredits')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: studentTouched.debtCredits && studentErrors.debtCredits ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: studentTouched.debtCredits && studentErrors.debtCredits ? '#fff5f5' : '#fff',
                    }}
                  />
                  {studentTouched.debtCredits && studentErrors.debtCredits && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {studentErrors.debtCredits}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  💾 Lưu hồ sơ Sinh viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa Giảng viên */}
      {deleteLecturerTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗑️ Xác nhận xóa Giảng viên
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa giảng viên <strong>{deleteLecturerTarget.fullName}</strong> (Mã GV: {deleteLecturerTarget.lecturerCode}) khỏi hệ thống? Thao tác này sẽ xóa hồ sơ và tài khoản tương ứng.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteLecturerTarget(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteLecturer}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa Sinh viên */}
      {deleteStudentTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗑️ Xác nhận xóa Sinh viên
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa sinh viên <strong>{deleteStudentTarget.fullName}</strong> (MSSV: {deleteStudentTarget.studentCode}) khỏi hệ thống? Thao tác này sẽ xóa hồ sơ sinh viên và tài khoản tương ứng.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteStudentTarget(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </UTCAppLayout>
  );
};

export default OrganizationManagementPage;
