import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type {
  AcademicRecordItem,
  AcademicRecordImportPreviewResponse,
  AcademicRecordImportRow,
  CreateAcademicRecordManualPayload,
  StudentProjectRoundItem,
} from '../../../types';

interface RoundAcademicRecordsTabProps {
  roundId: number;
  roundName: string;
  roundCode: string;
  isRoundClosed?: boolean;
}

export const RoundAcademicRecordsTab: React.FC<RoundAcademicRecordsTabProps> = ({
  roundId,
  roundName,
  roundCode,
  isRoundClosed,
}) => {
  // Data states
  const [records, setRecords] = useState<AcademicRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Pagination states
  const [filterTuitionDebt, setFilterTuitionDebt] = useState<string>('');
  const [filterDisciplinary, setFilterDisciplinary] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AcademicRecordImportPreviewResponse | null>(null);
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);

  // Modal Add Academic Record Manually states
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [roundStudents, setRoundStudents] = useState<StudentProjectRoundItem[]>([]);
  const [manualForm, setManualForm] = useState<CreateAcademicRecordManualPayload>({
    studentCode: '',
    completedCredits: 120,
    gpa: 3.0,
    tuitionDebt: false,
    underDisciplinaryAction: false,
    missingPrerequisiteCount: 0,
    note: '',
  });
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});
  const [manualTouched, setManualTouched] = useState<Record<string, boolean>>({});

  const validateManualField = (field: string, value: any): string => {
    switch (field) {
      case 'studentCode': {
        const val = String(value || '').trim();
        if (!val) return 'Mã sinh viên không được để trống';
        if (!/^\d{9}$/.test(val)) return 'Mã sinh viên chỉ gồm đúng 9 chữ số (VD: 201200102)';
        return '';
      }
      case 'completedCredits': {
        if (value === '' || value === undefined || value === null) return 'Số tín chỉ không được để trống';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Số tín chỉ phải là số nguyên >= 0';
        return '';
      }
      case 'gpa': {
        if (value === '' || value === undefined || value === null) return 'Điểm GPA không được để trống';
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 4.0) return 'GPA phải nằm trong khoảng từ 0.00 đến 4.00';
        return '';
      }
      case 'missingPrerequisiteCount': {
        if (value === '' || value === undefined || value === null) return 'Số môn nợ không được để trống';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Số môn tiên quyết còn nợ phải >= 0';
        return '';
      }
      default:
        return '';
    }
  };

  const handleManualChange = (field: keyof CreateAcademicRecordManualPayload, value: any) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
    const err = validateManualField(field, value);
    setManualErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleManualBlur = (field: keyof CreateAcademicRecordManualPayload) => {
    setManualTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateManualField(field, manualForm[field]);
    setManualErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleOpenManualModal = async () => {
    setManualForm({
      studentCode: '',
      completedCredits: 120,
      gpa: 3.0,
      tuitionDebt: false,
      underDisciplinaryAction: false,
      missingPrerequisiteCount: 0,
      note: '',
    });
    setManualErrors({});
    setManualTouched({});
    setManualError(null);
    setShowManualModal(true);
    try {
      const res = await apiService.getStudentsInRound(roundId, { size: 100 });
      setRoundStudents(res?.content || []);
    } catch {
      // ignore
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate: (keyof CreateAcademicRecordManualPayload)[] = [
      'studentCode',
      'completedCredits',
      'gpa',
      'missingPrerequisiteCount',
    ];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
      const err = validateManualField(field, manualForm[field]);
      if (err) newErrors[field] = err;
    });

    setManualTouched((prev) => ({ ...prev, ...newTouched }));
    setManualErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setManualError('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ');
      return;
    }

    try {
      setManualLoading(true);
      setManualError(null);
      await apiService.saveManualAcademicRecord(roundId, {
        ...manualForm,
        completedCredits: Number(manualForm.completedCredits),
        gpa: Number(manualForm.gpa),
        missingPrerequisiteCount: Number(manualForm.missingPrerequisiteCount),
      });
      setShowManualModal(false);
      setSuccessMsg(`Lưu dữ liệu học vụ cho sinh viên ${manualForm.studentCode} thành công!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadRecords();
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu học vụ');
    } finally {
      setManualLoading(false);
    }
  };

  // Load records (Contract 4)
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getAcademicRecords(roundId, {
        tuitionDebt: filterTuitionDebt === '' ? undefined : filterTuitionDebt === 'true',
        underDisciplinaryAction: filterDisciplinary === '' ? undefined : filterDisciplinary === 'true',
        search: searchTerm || undefined,
        page: currentPage,
        size: 15,
      });

      setRecords(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách kết quả học vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [roundId, filterTuitionDebt, filterDisciplinary, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadRecords();
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadAcademicTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_import_hoc_vu_utc.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg('Đã tải xuống file Excel mẫu học vụ UTC thành công.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: unknown) {
      setError('Lỗi khi tải file template: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  // Handle file select
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
      const preview = await apiService.previewImportAcademicRecords(roundId, importFile);
      setPreviewData(preview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi phân tích dữ liệu file Excel');
    } finally {
      setImportLoading(false);
    }
  };

  // Commit import
  const handleCommitImport = async () => {
    if (isRoundClosed) {
      setError('Đợt đồ án đã đóng. Không thể import dữ liệu học vụ.');
      return;
    }
    if (!previewData || !previewData.rows) return;

    try {
      setImportLoading(true);
      setError(null);
      const result = await apiService.commitImportAcademicRecords(roundId, {
        rows: previewData.rows,
      });

      setImportResultMsg(
        `Lưu trữ thành công ${result.totalProcessed} dòng học vụ (Thêm mới: ${result.recordsCreated}, Cập nhật: ${result.recordsUpdated}, Bỏ qua: ${result.skipped}).`
      );
      setPreviewData(null);
      setImportFile(null);
      loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu học vụ vào hệ thống');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div>
      {/* Closed Round Notice Banner */}
      {isRoundClosed && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <span><strong>Đợt đồ án đã đóng:</strong> Dữ liệu học vụ đang ở chế độ chỉ xem. Không thể nạp thêm hồ sơ học vụ cho đợt này.</span>
        </div>
      )}

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
            Kết quả học vụ xét điều kiện ({totalElements})
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Dữ liệu Contract 4 cung cấp cho Module Eligibility xét duyệt sinh viên làm đồ án
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
            📥 Tải Excel mẫu học vụ
          </button>
          <button
            disabled={isRoundClosed}
            onClick={() => {
              if (isRoundClosed) return;
              handleOpenManualModal();
            }}
            style={{
              backgroundColor: isRoundClosed ? '#94a3b8' : '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRoundClosed ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title={isRoundClosed ? 'Đợt đồ án đã đóng - Không thể thêm học vụ' : undefined}
          >
            ➕ Thêm học vụ thủ công
          </button>
          <button
            disabled={isRoundClosed}
            onClick={() => {
              if (isRoundClosed) return;
              setShowImportModal(true);
              setImportResultMsg(null);
              setPreviewData(null);
              setImportFile(null);
            }}
            style={{
              backgroundColor: isRoundClosed ? '#94a3b8' : '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRoundClosed ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title={isRoundClosed ? 'Đợt đồ án đã đóng - Không thể import học vụ' : undefined}
          >
            📤 Import học vụ (Excel)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Tìm theo MSSV, họ tên, lớp..."
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
          value={filterTuitionDebt}
          onChange={(e) => {
            setFilterTuitionDebt(e.target.value);
            setCurrentPage(0);
          }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả tình trạng học phí</option>
          <option value="false">Không nợ học phí (Đã hoàn thành)</option>
          <option value="true">Còn nợ học phí</option>
        </select>

        <select
          value={filterDisciplinary}
          onChange={(e) => {
            setFilterDisciplinary(e.target.value);
            setCurrentPage(0);
          }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả kỷ luật</option>
          <option value="false">Không bị kỷ luật</option>
          <option value="true">Đang bị kỷ luật</option>
        </select>
      </div>

      {/* Academic Records Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải kết quả học vụ...</div>
      ) : records.length > 0 ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>STT</th>
                <th style={{ padding: '10px 12px' }}>MSSV</th>
                <th style={{ padding: '10px 12px' }}>Họ và tên</th>
                <th style={{ padding: '10px 12px' }}>Lớp & Ngành</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Tín chỉ tích lũy</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Điểm GPA</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Học phí</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Kỷ luật</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Nợ tiên quyết</th>
                <th style={{ padding: '10px 12px' }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px' }}>{currentPage * 15 + idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0a3273' }}>{r.studentCode}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{r.fullName}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{r.className || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.majorName}</div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.completedCredits >= 110 ? '#15803d' : '#dc2626' }}>
                      {r.completedCredits}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.gpa >= 2.0 ? '#15803d' : '#dc2626' }}>
                      {r.gpa.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {r.tuitionDebt ? (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        Còn nợ HP
                      </span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>
                        Đã đóng
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {r.underDisciplinaryAction ? (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        Bị kỷ luật
                      </span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }}>
                        Bình thường
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.missingPrerequisiteCount > 0 ? '#dc2626' : '#15803d' }}>
                      {r.missingPrerequisiteCount}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.8rem' }}>
                    {r.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div>
              Trang <strong>{currentPage + 1}</strong> / {totalPages || 1} (Tổng {totalElements} kết quả học vụ)
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
        <div style={{ padding: '36px', textAlign: 'center', color: '#475569', fontWeight: 500, border: '1px dashed #94a3b8', borderRadius: '8px' }}>
          Chưa có dữ liệu học vụ nào được import cho đợt đồ án này. Hãy bấm <strong style={{ color: '#0f172a' }}>"Import học vụ (Excel)"</strong> ở trên để nạp dữ liệu.
        </div>
      )}

      {/* Modal Import Excel Học Vụ */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0a3273' }}>Import Dữ Liệu Học Vụ Xét Điều Kiện (Phase 4)</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Đợt đồ án: <strong>{roundName}</strong> ({roundCode})
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

            {/* Step 1: Chọn file */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Chọn file Excel kết quả học vụ (.xlsx gồm 9 cột chuẩn UTC) *
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
                💡 Các cột dữ liệu: STT, Mã SV, Họ tên, Tín chỉ tích lũy, GPA, Nợ học phí (CÓ/KHÔNG), Kỷ luật (CÓ/KHÔNG), Môn tiên quyết còn nợ, Ghi chú.
              </div>
            </div>

            {/* Step 2: Bảng Preview */}
            {previewData && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>
                    Kết quả phân tích file học vụ ({previewData.totalRows} dòng)
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
                        <th style={{ padding: '8px' }}>Tín chỉ</th>
                        <th style={{ padding: '8px' }}>GPA</th>
                        <th style={{ padding: '8px' }}>Học phí</th>
                        <th style={{ padding: '8px' }}>Kỷ luật</th>
                        <th style={{ padding: '8px' }}>Nợ môn</th>
                        <th style={{ padding: '8px' }}>Trạng thái / Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row: AcademicRecordImportRow) => (
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
                          <td style={{ padding: '8px', fontWeight: 600 }}>{row.completedCredits}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{row.gpa?.toFixed(2)}</td>
                          <td style={{ padding: '8px' }}>{row.tuitionDebt ? 'Nợ HP' : 'Đã đóng'}</td>
                          <td style={{ padding: '8px' }}>{row.underDisciplinaryAction ? 'Bị kỷ luật' : 'Không'}</td>
                          <td style={{ padding: '8px' }}>{row.missingPrerequisiteCount}</td>
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
                    {importLoading ? 'Đang lưu trữ...' : `🚀 Lưu ${previewData.validRows} kết quả học vụ vào CSDL`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Thêm Học Vụ Thủ Công */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0a3273' }}>Thêm / Cập Nhật Học Vụ Thủ Công</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Đợt đồ án: <strong>{roundName}</strong> ({roundCode})
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {manualError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                ⚠️ {manualError}
              </div>
            )}

            <form onSubmit={handleManualSubmit}>
              {/* Sinh viên chọn hoặc gõ MSSV */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mã sinh viên (MSSV gồm đúng 9 chữ số) *
                </label>
                {roundStudents.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <select
                      value={manualForm.studentCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleManualChange('studentCode', val);
                        setManualTouched((prev) => ({ ...prev, studentCode: true }));
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#f8fafc', marginBottom: '6px' }}
                    >
                      <option value="">-- Chọn nhanh từ danh sách sinh viên trong đợt --</option>
                      {roundStudents.map((s) => (
                        <option key={s.studentRoundId || s.studentCode} value={s.studentCode}>
                          {s.studentCode} - {s.fullName} ({s.className || 'Chưa rõ lớp'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Nhập MSSV (9 chữ số, VD: 201200102)..."
                  value={manualForm.studentCode || ''}
                  onChange={(e) => handleManualChange('studentCode', e.target.value)}
                  onBlur={() => handleManualBlur('studentCode')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: manualTouched.studentCode && manualErrors.studentCode ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
                {manualTouched.studentCode && manualErrors.studentCode && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {manualErrors.studentCode}
                  </div>
                )}
              </div>

              {/* Tín chỉ và GPA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tín chỉ tích lũy *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 120"
                    value={manualForm.completedCredits ?? ''}
                    onChange={(e) => handleManualChange('completedCredits', e.target.value)}
                    onBlur={() => handleManualBlur('completedCredits')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.completedCredits && manualErrors.completedCredits ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {manualTouched.completedCredits && manualErrors.completedCredits && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                      {manualErrors.completedCredits}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Điểm GPA (thang 4.0) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    placeholder="VD: 3.15"
                    value={manualForm.gpa ?? ''}
                    onChange={(e) => handleManualChange('gpa', e.target.value)}
                    onBlur={() => handleManualBlur('gpa')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.gpa && manualErrors.gpa ? '1px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {manualTouched.gpa && manualErrors.gpa && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                      {manualErrors.gpa}
                    </div>
                  )}
                </div>
              </div>

              {/* Tình trạng học phí & Kỷ luật */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tình trạng học phí
                  </label>
                  <select
                    value={manualForm.tuitionDebt ? 'true' : 'false'}
                    onChange={(e) => handleManualChange('tuitionDebt', e.target.value === 'true')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="false">Đã hoàn thành (Không nợ)</option>
                    <option value="true">Còn nợ học phí</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tình trạng kỷ luật
                  </label>
                  <select
                    value={manualForm.underDisciplinaryAction ? 'true' : 'false'}
                    onChange={(e) => handleManualChange('underDisciplinaryAction', e.target.value === 'true')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="false">Bình thường (Không kỷ luật)</option>
                    <option value="true">Đang bị kỷ luật</option>
                  </select>
                </div>
              </div>

              {/* Số môn tiên quyết còn nợ */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Số môn tiên quyết còn thiếu
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="VD: 0"
                  value={manualForm.missingPrerequisiteCount ?? ''}
                  onChange={(e) => handleManualChange('missingPrerequisiteCount', e.target.value)}
                  onBlur={() => handleManualBlur('missingPrerequisiteCount')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: manualTouched.missingPrerequisiteCount && manualErrors.missingPrerequisiteCount ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
                {manualTouched.missingPrerequisiteCount && manualErrors.missingPrerequisiteCount && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {manualErrors.missingPrerequisiteCount}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về hồ sơ học vụ (không bắt buộc)..."
                  value={manualForm.note || ''}
                  onChange={(e) => handleManualChange('note', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
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
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: manualLoading ? 'not-allowed' : 'pointer',
                    opacity: manualLoading ? 0.6 : 1,
                  }}
                >
                  {manualLoading ? 'Đang lưu...' : '💾 Lưu học vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
