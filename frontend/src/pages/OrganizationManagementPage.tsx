import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Faculty, Department, Major, TrainingProgram, LecturerItem, StudentItem } from '../types';
import UTCAppLayout from '../components/UTCAppLayout';

type TabType = 'faculties' | 'majors' | 'lecturers' | 'students';

const OrganizationManagementPage: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('faculties');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Student states
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentMajorId, setStudentMajorId] = useState<number | undefined>(undefined);
  const [totalStudents, setTotalStudents] = useState(0);

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
        size: 50,
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
      loadLecturers();
    } else if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab, selectedFacultyId]);

  return (
    <UTCAppLayout activeTab="organization" hideHeroBanner pageTitle="Quản lý Dữ liệu Tổ chức & Đào tạo" onLogout={logout}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          backgroundColor: '#fff',
          padding: '8px 16px',
          borderRadius: '8px 8px 0 0'
        }}>
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
              cursor: 'pointer'
            }}
          >
            👨‍🎓 Danh sách Sinh viên
          </button>
        </div>

        {loading && (
          <div style={{ padding: '10px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
            ⏳ Đang tải dữ liệu hệ thống...
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
            ⚠️ {error}
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
                      backgroundColor: selectedFacultyId === f.id ? '#eff6ff' : '#fff'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mã: {f.code} • {f.departmentCount || 0} bộ môn</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Departments List */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
                Bộ môn trực thuộc ({departments.length})
              </h3>
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
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0a3273' }}>{tp.name} ({tp.code})</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Danh mục Giảng viên & Học vị (Contract 1 Pool)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Cung cấp API cho phân công hướng dẫn (Nguyễn Đình Công) & Hội đồng chấm bảo vệ (Khuất Đăng Khoa)
                </p>
              </div>
              <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                Tổng số: {lecturers.length} giảng viên
              </span>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Tìm kiếm theo tên hoặc mã CB..."
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
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
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
                  fontWeight: 600
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
                  <th style={{ padding: '10px' }}>Khoa</th>
                  <th style={{ padding: '10px' }}>Hướng nghiên cứu</th>
                  <th style={{ padding: '10px' }}>Chỉ tiêu</th>
                  <th style={{ padding: '10px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l) => (
                  <tr key={l.lecturerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0a3273' }}>{l.lecturerCode}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{l.fullName}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: l.academicDegree === 'TIEN_SI' || l.academicDegree === 'PGS' ? '#fef3c7' : '#e0e7ff',
                        color: l.academicDegree === 'TIEN_SI' || l.academicDegree === 'PGS' ? '#92400e' : '#3730a3'
                      }}>
                        {l.academicDegree || 'GIANG_VIEN'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{l.departmentName || '—'}</td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{l.facultyName || 'Khoa CNTT'}</td>
                    <td style={{ padding: '12px 10px', color: '#047857', fontSize: '0.85rem' }}>{l.researchInterests || '—'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{l.maxThesisQuota || 5} SV</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ color: l.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                        {l.isActive ? '● Đang hoạt động' : '○ Đã khóa'}
                      </span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Hồ sơ Sinh viên Master Data</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Quản lý danh sách sinh viên theo Ngành, Bậc đào tạo và Lớp sinh hoạt
                </p>
              </div>
              <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                Tổng số: {totalStudents} sinh viên
              </span>
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
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
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
                  fontWeight: 600
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
                  <th style={{ padding: '10px' }}>Trạng thái</th>
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
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1'
                      }}>
                        {s.trainingProgramName || 'Cử nhân'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: (s.debtCredits || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {s.debtCredits || 0} TC
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ color: s.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                        {s.isActive ? '● Đang hoạt động' : '○ Đã khóa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </UTCAppLayout>
  );
};

export default OrganizationManagementPage;
