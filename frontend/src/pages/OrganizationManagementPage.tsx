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
} from '../types';
import UTCAppLayout from '../components/UTCAppLayout';

type TabType = 'faculties' | 'majors' | 'lecturers' | 'students';

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

  // Lecturer states
  const [lecturers, setLecturers] = useState<LecturerItem[]>([]);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [lecturerDegree, setLecturerDegree] = useState('');
  const [lecturerDeptId, setLecturerDeptId] = useState<number | undefined>(undefined);

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

  // Student states
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentMajorId, setStudentMajorId] = useState<number | undefined>(undefined);
  const [totalStudents, setTotalStudents] = useState(0);

  // Student Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [studentForm, setStudentForm] = useState<CreateStudentPayload>({
    username: '',
    email: '',
    password: 'password123',
    fullName: '',
    phone: '',
    studentCode: '',
    className: '',
    majorId: undefined,
    trainingProgramId: undefined,
    gender: 'NAM',
    debtCredits: 0,
  });

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

  // Load lecturers (Contract 1)
  const loadLecturers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLecturers({
        departmentId: lecturerDeptId,
        degree: lecturerDegree || undefined,
        search: lecturerSearch || undefined,
      });
      setLecturers(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  // Load students
  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOrganizationStudents({
        majorId: studentMajorId,
        className: studentClass || undefined,
        search: studentSearch || undefined,
        page: 0,
        size: 100,
      });
      setStudents(res.content || []);
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

  const handleOpenCreateLecturer = () => {
    setEditingLecturer(null);
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
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      if (editingLecturer) {
        const updatePayload: UpdateLecturerPayload = {
          fullName: lecturerForm.fullName,
          phone: lecturerForm.phone,
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
          username: lecturerForm.username || lecturerForm.lecturerCode.toLowerCase(),
          email: lecturerForm.email || `${lecturerForm.lecturerCode.toLowerCase()}@utc.edu.vn`,
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

  const handleOpenCreateStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      username: '',
      email: '',
      password: 'password123',
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
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      if (editingStudent) {
        const updatePayload: UpdateStudentPayload = {
          fullName: studentForm.fullName,
          phone: studentForm.phone,
          className: studentForm.className,
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
          username: studentForm.username || codeTrimmed,
          email: studentForm.email || `${codeTrimmed}@st.utc.edu.vn`,
          password: studentForm.password || 'password123',
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

  return (
    <UTCAppLayout activeTab="organization" hideHeroBanner pageTitle="Quản lý Dữ liệu Tổ chức & Đào tạo" onLogout={logout}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '24px',
            backgroundColor: '#fff',
            padding: '8px 16px',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <button
            onClick={() => setActiveTab('faculties')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'faculties' ? '3px solid #0a3273' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'faculties' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'faculties' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            🏛️ Khoa & Bộ môn
          </button>
          <button
            onClick={() => setActiveTab('majors')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'majors' ? '3px solid #0a3273' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'majors' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'majors' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            🎓 Ngành & CTĐT
          </button>
          <button
            onClick={() => setActiveTab('lecturers')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'lecturers' ? '3px solid #0a3273' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'lecturers' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'lecturers' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            👨‍🏫 Danh sách Giảng viên (Contract 1)
          </button>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'students' ? '3px solid #0a3273' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'students' ? '#0a3273' : '#64748b',
              fontWeight: activeTab === 'students' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
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
                      <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>{d.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
              <button
                onClick={loadLecturers}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px' }}>Mã CB</th>
                  <th style={{ padding: '10px' }}>Họ và tên</th>
                  <th style={{ padding: '10px' }}>Học vị</th>
                  <th style={{ padding: '10px' }}>Bộ môn</th>
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
                    <td style={{ padding: '12px 10px', color: '#047857', fontSize: '0.85rem' }}>{l.researchInterests || '—'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{l.maxThesisQuota || 5} SV</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ color: l.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                        {l.isActive ? '● Đang hoạt động' : '○ Đã khóa'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <button
                onClick={loadStudents}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px' }}>Mã SV</th>
                  <th style={{ padding: '10px' }}>Họ và tên</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Lớp</th>
                  <th style={{ padding: '10px' }}>Ngành</th>
                  <th style={{ padding: '10px' }}>CT Đào tạo</th>
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
                    <td style={{ padding: '12px 10px', color: (s.debtCredits || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {s.debtCredits || 0} TC
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mã giảng viên (Mã CB) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: GV015"
                      value={lecturerForm.lecturerCode}
                      onChange={(e) =>
                        setLecturerForm({
                          ...lecturerForm,
                          lecturerCode: e.target.value,
                          username: e.target.value.toLowerCase(),
                        })
                      }
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: gv015"
                      value={lecturerForm.username}
                      onChange={(e) => setLecturerForm({ ...lecturerForm, username: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
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
                    onChange={(e) => setLecturerForm({ ...lecturerForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={lecturerForm.phone || ''}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
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
                      onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mật khẩu khởi tạo *</label>
                    <input
                      type="text"
                      required
                      value={lecturerForm.password}
                      onChange={(e) => setLecturerForm({ ...lecturerForm, password: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Bộ môn trực thuộc</label>
                  <select
                    value={lecturerForm.departmentId || ''}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, departmentId: e.target.value ? Number(e.target.value) : undefined })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Chọn bộ môn --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Học vị (Xét CT Kỹ sư) *</label>
                  <select
                    value={lecturerForm.academicDegree}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, academicDegree: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="THAC_SI">Thạc sĩ (THAC_SI)</option>
                    <option value="TIEN_SI">Tiến sĩ (TIEN_SI)</option>
                    <option value="PGS">Phó Giáo sư (PGS)</option>
                    <option value="GS">Giáo sư (GS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Chỉ tiêu SV</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={lecturerForm.maxThesisQuota || 5}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, maxThesisQuota: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Hướng nghiên cứu (Cách nhau bởi dấu phẩy, dùng để khớp với hướng chọn của SV)
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Trí tuệ nhân tạo (AI & Machine Learning), Phát triển ứng dụng Web & Cloud, An toàn thông tin"
                  value={lecturerForm.researchInterests || ''}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, researchInterests: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mã sinh viên (MSSV) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 211200888"
                      value={studentForm.studentCode}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          studentCode: e.target.value,
                          username: e.target.value,
                          email: e.target.value ? `${e.target.value}@st.utc.edu.vn` : '',
                        })
                      }
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mật khẩu khởi tạo *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
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
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Lớp hành chính *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CNTT1-K62"
                    value={studentForm.className || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
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
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="0987654321"
                      value={studentForm.phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Ngành đào tạo *</label>
                  <select
                    value={studentForm.majorId || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, majorId: e.target.value ? Number(e.target.value) : undefined })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Chương trình đào tạo *</label>
                  <select
                    value={studentForm.trainingProgramId || ''}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, trainingProgramId: e.target.value ? Number(e.target.value) : undefined })
                    }
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {trainingPrograms.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name} ({tp.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Nợ TC</label>
                  <input
                    type="number"
                    min={0}
                    value={studentForm.debtCredits || 0}
                    onChange={(e) => setStudentForm({ ...studentForm, debtCredits: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
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
    </UTCAppLayout>
  );
};

export default OrganizationManagementPage;
