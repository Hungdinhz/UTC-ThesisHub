import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type {
  Major,
  StudentProjectRoundItem,
  StudentImportPreviewResponse,
  StudentImportRow,
  CreateRoundStudentManualPayload,
} from '../../../types';

interface RoundStudentsTabProps {
  roundId: number;
  roundName: string;
  roundCode: string;
}

export const RoundStudentsTab: React.FC<RoundStudentsTabProps> = ({
  roundId,
  roundName,
  roundCode,
}) => {
  // Data states
  const [students, setStudents] = useState<StudentProjectRoundItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Pagination states
  const [selectedMajorId, setSelectedMajorId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Import Excel states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState<StudentImportPreviewResponse | null>(null);
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);

  // Modal Add Student Manually states
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualForm, setManualForm] = useState<CreateRoundStudentManualPayload>({
    studentCode: '',
    fullName: '',
    email: '',
    className: '',
    majorId: 0,
    phone: '',
    status: 'ELIGIBLE',
    note: '',
  });

  // Modal Update Status states
  const [editingStudent, setEditingStudent] = useState<StudentProjectRoundItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');

  // Load majors for filter
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const data = await apiService.getMajors();
        setMajors(data || []);
      } catch (e) {
        console.error('Không thể tải danh sách ngành', e);
      }
    };
    fetchMajors();
  }, []);

  // Load students in round (Contract 3)
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getStudentsInRound(roundId, {
        majorId: selectedMajorId,
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        size: 15,
      });

      setStudents(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách sinh viên trong đợt đồ án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [roundId, selectedMajorId, selectedStatus, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadStudents();
  };

  // Download template Excel
  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_import_sinh_vien_utc.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg('Đã tải xuống file Excel mẫu chuẩn UTC thành công.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: unknown) {
      setError('Lỗi khi tải file template: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  // Handle File change for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setPreviewData(null);
      setImportResultMsg(null);
    }
  };

  // Preview import
  const handlePreviewImport = async () => {
    if (!importFile) {
      setError('Vui lòng chọn một file Excel (.xlsx hoặc .xls)');
      return;
    }

    try {
      setImportLoading(true);
      setError(null);
      const preview = await apiService.previewImportStudents(roundId, importFile);
      setPreviewData(preview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi phân tích dữ liệu file Excel');
    } finally {
      setImportLoading(false);
    }
  };

  // Manual student submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.studentCode.trim() || !manualForm.fullName.trim() || !manualForm.majorId) {
      setError('Vui lòng điền đầy đủ Mã SV, Họ tên và chọn Ngành đào tạo');
      return;
    }

    try {
      setManualLoading(true);
      setError(null);
      const code = manualForm.studentCode.trim();
      const emailVal = manualForm.email?.trim() || `${code.toLowerCase()}@lms.utc.edu.vn`;
      await apiService.addStudentToRoundManually(roundId, {
        ...manualForm,
        studentCode: code,
        fullName: manualForm.fullName.trim(),
        email: emailVal,
      });

      setSuccessMsg(`Thêm sinh viên ${code} thành công. Tài khoản hệ thống đã được cấp: Tên đăng nhập = ${code}, Mật khẩu = ${code}.`);
      setShowManualModal(false);
      setManualForm({
        studentCode: '',
        fullName: '',
        email: '',
        className: '',
        majorId: majors[0]?.id || 0,
        phone: '',
        status: 'ELIGIBLE',
        note: '',
      });
      loadStudents();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm sinh viên thủ công vào đợt');
    } finally {
      setManualLoading(false);
    }
  };

  // Commit import
  const handleCommitImport = async () => {
    if (!previewData || !previewData.rows) return;

    try {
      setImportLoading(true);
      setError(null);
      const result = await apiService.commitImportStudents(roundId, {
        rows: previewData.rows,
      });

      setImportResultMsg(
        `Xử lý thành công ${result.totalProcessed} dòng. Tạo mới ${result.newUsersCreated} User, ${result.newStudentsCreated} Sinh viên, ghi danh ${result.enrolledInRound} vào đợt (bỏ qua ${result.skipped}).`
      );
      setPreviewData(null);
      setImportFile(null);
      loadStudents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu sinh viên vào hệ thống');
    } finally {
      setImportLoading(false);
    }
  };

  // Update status
  const handleOpenStatusModal = (st: StudentProjectRoundItem) => {
    setEditingStudent(st);
    setNewStatus(st.status);
    setNewNote(st.note || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setLoading(true);
      await apiService.updateStudentRoundStatus(roundId, editingStudent.studentId, newStatus, newNote);
      setSuccessMsg(`Cập nhật trạng thái sinh viên ${editingStudent.studentCode} thành công.`);
      setEditingStudent(null);
      loadStudents();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  // Remove student from round
  const handleRemoveStudent = async (studentId: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sinh viên ${code} khỏi đợt đồ án này?`)) return;

    try {
      setLoading(true);
      await apiService.removeStudentFromRound(roundId, studentId);
      setSuccessMsg(`Đã xóa sinh viên ${code} khỏi đợt đồ án.`);
      loadStudents();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa sinh viên khỏi đợt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return { label: 'Đủ điều kiện', bg: '#dcfce7', color: '#15803d' };
      case 'REGISTERED':
        return { label: 'Đã có đề tài', bg: '#e0e7ff', color: '#4338ca' };
      case 'ASSIGNED':
        return { label: 'Đã gán GVHD', bg: '#fef3c7', color: '#b45309' };
      case 'IN_PROGRESS':
        return { label: 'Đang làm ĐA', bg: '#e0f2fe', color: '#0369a1' };
      case 'DROPPED':
        return { label: 'Bị loại', bg: '#fee2e2', color: '#b91c1c' };
      case 'DEFENDED':
        return { label: 'Đã bảo vệ', bg: '#f3e8ff', color: '#7e22ce' };
      case 'RESERVED':
        return { label: 'Bảo lưu', bg: '#ffedd5', color: '#c2410c' };
      default:
        return { label: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div>
      {/* Alert Messages */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            Sinh viên trong đợt ({totalElements})
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Dữ liệu Contract 3 cung cấp cho Module Phân công GVHD & Hội đồng bảo vệ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadTemplate}
            style={{
              backgroundColor: '#f8fafc',
              color: '#0a3273',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📥 Tải Excel mẫu UTC
          </button>
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportResultMsg(null);
              setPreviewData(null);
              setImportFile(null);
            }}
            style={{
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📤 Import SV từ Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Tìm MSSV, họ tên, email, lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Tìm
          </button>
        </form>

        <select
          value={selectedMajorId || ''}
          onChange={(e) => {
            setSelectedMajorId(e.target.value ? Number(e.target.value) : undefined);
            setCurrentPage(0);
          }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả ngành</option>
          {majors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(0);
          }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ELIGIBLE">Đủ điều kiện (ELIGIBLE)</option>
          <option value="REGISTERED">Đã có đề tài (REGISTERED)</option>
          <option value="ASSIGNED">Đã gán GVHD (ASSIGNED)</option>
          <option value="IN_PROGRESS">Đang làm đồ án (IN_PROGRESS)</option>
          <option value="DROPPED">Bị loại (DROPPED)</option>
          <option value="DEFENDED">Đã bảo vệ (DEFENDED)</option>
          <option value="RESERVED">Bảo lưu (RESERVED)</option>
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách sinh viên...</div>
      ) : students.length > 0 ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>STT</th>
                <th style={{ padding: '10px 12px' }}>MSSV</th>
                <th style={{ padding: '10px 12px' }}>Họ và tên</th>
                <th style={{ padding: '10px 12px' }}>Ngành</th>
                <th style={{ padding: '10px 12px' }}>Lớp</th>
                <th style={{ padding: '10px 12px' }}>Email & SĐT</th>
                <th style={{ padding: '10px 12px' }}>Nợ TC</th>
                <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                const badge = getStatusBadge(st.status);
                return (
                  <tr key={st.studentRoundId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>{currentPage * 15 + idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{st.fullName}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', fontWeight: 600 }}>
                        {st.majorCode || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{st.className || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      <div>{st.email}</div>
                      {st.phone && <div style={{ fontSize: '0.75rem' }}>📞 {st.phone}</div>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: st.debtCredits > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {st.debtCredits}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenStatusModal(st)}
                          title="Đổi trạng thái"
                          style={{ backgroundColor: '#eff6ff', color: '#0a3273', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(st.studentId, st.studentCode)}
                          title="Xóa khỏi đợt"
                          style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div>
              Trang <strong>{currentPage + 1}</strong> / {totalPages || 1} (Tổng {totalElements} sinh viên)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 0 ? '#f1f5f9' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
              >
                Trước
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: currentPage >= totalPages - 1 ? '#f1f5f9' : '#fff', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
          Đợt đồ án này chưa có sinh viên nào. Hãy bấm nút <strong>"Import SV từ Excel"</strong> để nạp danh sách.
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0a3273' }}>Import Danh Sách Sinh Viên vào Đợt Đồ Án</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Đợt: <strong>{roundName}</strong> ({roundCode})
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {importResultMsg && (
              <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                🎉 {importResultMsg}
              </div>
            )}

            {/* Step 1: Select File & Preview */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Chọn file Excel danh sách sinh viên (.xlsx theo chuẩn 8 cột UTC) *
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                />
                <button
                  type="button"
                  disabled={!importFile || importLoading}
                  onClick={handlePreviewImport}
                  style={{
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: !importFile || importLoading ? 'not-allowed' : 'pointer',
                    opacity: !importFile || importLoading ? 0.6 : 1,
                  }}
                >
                  {importLoading ? 'Đang phân tích...' : '🔍 Xem trước (Preview)'}
                </button>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                💡 Nếu chưa có file đúng định dạng, hãy bấm <strong>"Tải Excel mẫu UTC"</strong> ở trang quản lý để lấy file mẫu chuẩn gồm 8 cột: STT, Mã sinh viên, Họ đệm, Tên, Ngành, Lớp, SĐT, Email.
              </div>
            </div>

            {/* Step 2: Show Preview Table if parsed */}
            {previewData && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>
                    Kết quả phân tích file ({previewData.totalRows} dòng)
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                      ✔ Hợp lệ: {previewData.validRows}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                      ✖ Có lỗi: {previewData.errorRows}
                    </span>
                  </div>
                </div>

                <div style={{ maxHeight: '350px', overflow: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                  <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px' }}>STT</th>
                        <th style={{ padding: '8px' }}>MSSV</th>
                        <th style={{ padding: '8px' }}>Họ tên</th>
                        <th style={{ padding: '8px' }}>Ngành</th>
                        <th style={{ padding: '8px' }}>Lớp</th>
                        <th style={{ padding: '8px' }}>Email</th>
                        <th style={{ padding: '8px' }}>Số ĐT</th>
                        <th style={{ padding: '8px' }}>Trạng thái / Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row: StudentImportRow) => (
                        <tr
                          key={row.rowIndex}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: row.isValid ? '#fff' : '#fff1f2',
                          }}
                        >
                          <td style={{ padding: '8px' }}>{row.stt || row.rowIndex}</td>
                          <td style={{ padding: '8px', fontWeight: 700 }}>{row.studentCode}</td>
                          <td style={{ padding: '8px' }}>{row.fullName}</td>
                          <td style={{ padding: '8px' }}>{row.majorCode}</td>
                          <td style={{ padding: '8px' }}>{row.className}</td>
                          <td style={{ padding: '8px' }}>{row.email}</td>
                          <td style={{ padding: '8px' }}>{row.phone || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            {row.isValid ? (
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>✔ Hợp lệ</span>
                            ) : (
                              <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>
                                {row.errors.map((err, eIdx) => (
                                  <div key={eIdx}>• {err}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Step 3: Action Commit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    Hủy xem trước
                  </button>
                  <button
                    type="button"
                    disabled={previewData.validRows === 0 || importLoading}
                    onClick={handleCommitImport}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: previewData.validRows === 0 || importLoading ? 'not-allowed' : 'pointer',
                      opacity: previewData.validRows === 0 || importLoading ? 0.6 : 1,
                    }}
                  >
                    {importLoading ? 'Đang nạp dữ liệu...' : `🚀 Xác nhận Import (${previewData.validRows} sinh viên hợp lệ)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit Student Status */}
      {editingStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0a3273' }}>
              Cập nhật Trạng thái Sinh viên
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Sinh viên: <strong>{editingStudent.fullName}</strong> ({editingStudent.studentCode})
            </p>

            <form onSubmit={handleSaveStatus}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Trạng thái trong đợt *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="ELIGIBLE">Đủ điều kiện tham gia (ELIGIBLE)</option>
                  <option value="REGISTERED">Đã có đề tài (REGISTERED)</option>
                  <option value="ASSIGNED">Đã gán giảng viên hướng dẫn (ASSIGNED)</option>
                  <option value="IN_PROGRESS">Đang làm đồ án (IN_PROGRESS)</option>
                  <option value="DROPPED">Bị loại khỏi đợt (DROPPED)</option>
                  <option value="DEFENDED">Đã bảo vệ xong (DEFENDED)</option>
                  <option value="RESERVED">Bảo lưu sang đợt sau (RESERVED)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Ghi chú / Lý do điều chỉnh</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do thay đổi trạng thái..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Add Student Manually */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0a3273' }}>
              ➕ Thêm Sinh viên thủ công vào đợt đồ án
            </h3>
            
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#1e40af' }}>
              🔐 <strong>Cấp tài khoản đăng nhập tự động:</strong> Khi lưu, hệ thống tự động tạo tài khoản Sinh viên với <strong>Tên đăng nhập = Mã SV</strong> và <strong>Mật khẩu khởi tạo = Mã SV</strong>.
            </div>

            <form onSubmit={handleManualSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Mã sinh viên (MSSV) *</label>
                  <input
                    type="text"
                    value={manualForm.studentCode}
                    onChange={(e) => setManualForm({ ...manualForm, studentCode: e.target.value })}
                    placeholder="VD: 201200101"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Họ và tên sinh viên *</label>
                  <input
                    type="text"
                    value={manualForm.fullName}
                    onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Lớp sinh hoạt</label>
                  <input
                    type="text"
                    value={manualForm.className || ''}
                    onChange={(e) => setManualForm({ ...manualForm, className: e.target.value })}
                    placeholder="VD: CNTT1 - K64"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Ngành đào tạo *</label>
                  <select
                    value={manualForm.majorId}
                    onChange={(e) => setManualForm({ ...manualForm, majorId: Number(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email sinh viên</label>
                  <input
                    type="email"
                    value={manualForm.email || ''}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="Tự động: mssv@lms.utc.edu.vn"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Số điện thoại</label>
                  <input
                    type="text"
                    value={manualForm.phone || ''}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Trạng thái ban đầu trong đợt</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="ELIGIBLE">Đủ điều kiện tham gia (ELIGIBLE)</option>
                  <option value="REGISTERED">Đã có đề tài (REGISTERED)</option>
                  <option value="ASSIGNED">Đã gán GVHD (ASSIGNED)</option>
                  <option value="IN_PROGRESS">Đang làm đồ án (IN_PROGRESS)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Ghi chú</label>
                <textarea
                  value={manualForm.note || ''}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  placeholder="Ghi chú thêm về sinh viên (nếu có)..."
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {manualLoading ? 'Đang lưu...' : '💾 Lưu thông tin Sinh viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
