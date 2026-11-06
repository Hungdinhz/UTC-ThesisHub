import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type {
  Major,
  StudentProjectRoundItem,
  StudentImportPreviewResponse,
  StudentImportRow,
  CreateRoundStudentManualPayload,
  UpdateRoundStudentPayload,
} from '../../../types';
import { downloadBlob, extractErrorMessage } from '../../academic-staff/utils/download';

interface RoundStudentsTabProps {
  roundId: number;
  roundName: string;
  roundCode: string;
  trainingProgram?: string;
  trainingProgramName?: string;
  isRoundClosed?: boolean;
  isAdminView?: boolean;
  onlyEligible?: boolean;
  hideImportActions?: boolean;
}

export const RoundStudentsTab: React.FC<RoundStudentsTabProps> = ({
  roundId,
  roundName,
  roundCode,
  trainingProgram,
  trainingProgramName,
  isRoundClosed,
  isAdminView: _isAdminView = false,
  onlyEligible,
  hideImportActions,
}) => {
  const effectiveOnlyEligible = onlyEligible ?? false;
  const effectiveHideImportActions = hideImportActions ?? false;
  // Data states
  const [students, setStudents] = useState<StudentProjectRoundItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // KPI summary states
  const [kpi, setKpi] = useState<{
    total: number;
    eligible: number;
    ineligible: number;
    hasDebt: number;
  }>({ total: 0, eligible: 0, ineligible: 0, hasDebt: 0 });

  // Xác định hệ đào tạo và giới hạn tín chỉ theo hệ của đợt (Cử nhân 130 tín, Kỹ sư 150 tín)
  const [resolvedProgram, setResolvedProgram] = useState<{
    code: string;
    name: string;
    maxCredits: number;
  }>(() => {
    const isKs =
      trainingProgram === 'KY_SU' ||
      trainingProgramName?.toLowerCase().includes('kỹ sư') ||
      trainingProgramName?.toLowerCase().includes('ky su') ||
      roundName.toLowerCase().includes('kỹ sư') ||
      roundName.toLowerCase().includes('ky su');
    return {
      code: trainingProgram || (isKs ? 'KY_SU' : 'CU_NHAN'),
      name: trainingProgramName || (isKs ? 'Chương trình Kỹ sư' : 'Chương trình Cử nhân'),
      maxCredits: isKs ? 180 : 142,
    };
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const rounds = await apiService.getProjectRounds();
        const cur = rounds.find((r) => r.roundId === roundId);
        if (cur && isMounted) {
          const isKs =
            cur.trainingProgram === 'KY_SU' ||
            cur.trainingProgramName?.toLowerCase().includes('kỹ sư') ||
            cur.name?.toLowerCase().includes('kỹ sư');
          setResolvedProgram({
            code: cur.trainingProgram || (isKs ? 'KY_SU' : 'CU_NHAN'),
            name: cur.trainingProgramName || (isKs ? 'Chương trình Kỹ sư' : 'Chương trình Cử nhân'),
            maxCredits: isKs ? 180 : 142,
          });
        }
      } catch {
        // keep initial state
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [roundId, trainingProgram, trainingProgramName, roundName]);

  // Filter & Pagination states
  const [selectedMajorId, setSelectedMajorId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filterTuition, setFilterTuition] = useState<string>('');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Export & Action states
  const [exporting, setExporting] = useState(false);

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
    gpa: '' as any,
    completedCredits: 142,
    debtCredits: 0,
    tuitionDebt: false,
    underDisciplinaryAction: false,
    missingPrerequisiteCount: 0,
    status: 'ELIGIBLE',
    note: '',
  });

  // Modal Edit Student & Academic Record states
  const [editingStudent, setEditingStudent] = useState<StudentProjectRoundItem | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    className: string;
    majorId: number;
    email: string;
    phone: string;
    gpa: number | string;
    completedCredits: number | string;
    debtCredits: number | string;
    tuitionDebt: boolean;
    underDisciplinaryAction: boolean;
    missingPrerequisiteCount: number | string;
    note: string;
  }>({
    fullName: '',
    className: '',
    majorId: 1,
    email: '',
    phone: '',
    gpa: 3.0,
    completedCredits: 142,
    debtCredits: 0,
    tuitionDebt: false,
    underDisciplinaryAction: false,
    missingPrerequisiteCount: 0,
    note: '',
  });
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Helper tính trạng thái tự động theo quy chế xét duyệt đồ án UTC
  const computeStudentEligibility = (
    debtCredits: number,
    tuitionDebt: boolean,
    underDiscipline: boolean,
    _missingPrereq: number,
    gpa?: number
  ) => {
    const reasons: string[] = [];
    if (debtCredits > 10) {
      reasons.push(`Nợ ${debtCredits} tín chỉ (quy chế UTC: tối đa 10 tín chỉ)`);
    }
    if (tuitionDebt) {
      reasons.push('Đang nợ học phí');
    }
    if (underDiscipline) {
      reasons.push('Đang bị kỷ luật');
    }
    if (gpa !== undefined && gpa !== null && !isNaN(gpa) && gpa < 2.0) {
      reasons.push(`GPA < 2.0 (${Number(gpa).toFixed(2)})`);
    }

    const isEligible = reasons.length === 0;
    const autoNote = isEligible
      ? (debtCredits > 0 ? `Nợ ${debtCredits} tín chỉ (cần trả nợ trước GĐ5)` : '')
      : `Không đủ ĐK: ${reasons.join(', ')}`;

    return {
      isEligible,
      status: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
      reasons,
      autoNote,
    };
  };

  const editGpaNum = typeof editForm.gpa === 'string' ? parseFloat(editForm.gpa) : editForm.gpa;
  const editDebtCreditsNum = typeof editForm.debtCredits === 'string' ? parseInt(editForm.debtCredits, 10) : editForm.debtCredits;
  const editMissingPrereqNum = typeof editForm.missingPrerequisiteCount === 'string' ? parseInt(editForm.missingPrerequisiteCount, 10) : editForm.missingPrerequisiteCount;

  const currentEditEligibility = computeStudentEligibility(
    isNaN(editDebtCreditsNum) ? 0 : editDebtCreditsNum,
    editForm.tuitionDebt,
    editForm.underDisciplinaryAction,
    isNaN(editMissingPrereqNum) ? 0 : editMissingPrereqNum,
    isNaN(editGpaNum) ? undefined : editGpaNum
  );

  // Real-time validation for Add Student Manually
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});
  const [manualTouched, setManualTouched] = useState<Record<string, boolean>>({});
  const [manualModalError, setManualModalError] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    studentCode?: string;
    eligible: boolean;
    message: string;
    existsInSystem: boolean;
    fullName?: string;
  } | null>(null);

  const checkStudentEligibilityNow = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setEligibilityResult(null);
      return;
    }

    if (!/^\d{9}$/.test(code)) {
      setManualTouched((prev) => ({ ...prev, studentCode: true }));
      setManualErrors((prev) => ({
        ...prev,
        studentCode: 'Mã sinh viên chỉ gồm đúng 9 chữ số (VD: 202160001)',
      }));
      setEligibilityResult(null);
      return;
    }

    // 1. Kiểm tra danh sách cục bộ trong đợt hiện tại
    if (students.some((s) => s.studentCode?.trim().toLowerCase() === code.toLowerCase())) {
      const errMsg = `Kiểm tra trùng lặp: Sinh viên (MSSV: ${code}) đã có trong đợt đồ án này`;
      setManualTouched((prev) => ({ ...prev, studentCode: true }));
      setManualErrors((prev) => ({ ...prev, studentCode: errMsg }));
      setManualModalError(errMsg);
      setEligibilityResult({
        studentCode: code,
        eligible: false,
        message: errMsg,
        existsInSystem: true,
      });
      return;
    }

    // 2. Gọi API backend kiểm tra trùng lặp đợt khác và tính hợp lệ theo thời gian thực
    try {
      setCheckingEligibility(true);
      const res = await apiService.checkStudentEligibility(roundId, code);
      if (!res.eligible) {
        setManualTouched((prev) => ({ ...prev, studentCode: true }));
        setManualErrors((prev) => ({ ...prev, studentCode: res.message }));
        setManualModalError(res.message);
        setEligibilityResult({
          studentCode: code,
          eligible: false,
          message: res.message,
          existsInSystem: res.existsInSystem,
          fullName: res.fullName,
        });
      } else {
        setManualErrors((prev) => ({ ...prev, studentCode: '' }));
        setManualModalError(null);
        setEligibilityResult({
          studentCode: code,
          eligible: true,
          message: res.message,
          existsInSystem: res.existsInSystem,
          fullName: res.fullName,
        });

        if (res.existsInSystem) {
          setManualForm((prev) => ({
            ...prev,
            fullName: res.fullName || prev.fullName,
            className: res.className || prev.className,
            majorId: res.majorId || prev.majorId,
            email: res.email || prev.email,
            phone: res.phone || prev.phone,
          }));
          setManualTouched((prev) => ({
            ...prev,
            studentCode: true,
            fullName: Boolean(res.fullName) || prev.fullName,
            className: Boolean(res.className) || prev.className,
            majorId: Boolean(res.majorId) || prev.majorId,
            email: Boolean(res.email) || prev.email,
            phone: Boolean(res.phone) || prev.phone,
          }));
          setManualErrors((prev) => ({
            ...prev,
            studentCode: '',
            fullName: res.fullName ? '' : prev.fullName,
            className: res.className ? '' : prev.className,
            majorId: res.majorId ? '' : prev.majorId,
          }));
        }
      }
    } catch (err: unknown) {
      console.error('Failed to check student eligibility:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const validateManualField = (field: string, value: any): string => {
    switch (field) {
      case 'studentCode': {
        const val = String(value || '').trim();
        if (!val) return 'Mã sinh viên không được để trống';
        if (!/^\d{9}$/.test(val)) return 'Mã sinh viên chỉ gồm đúng 9 chữ số (VD: 202160001)';
        if (students.some((s) => s.studentCode?.trim().toLowerCase() === val.toLowerCase())) {
          return 'Sinh viên này đã có trong danh sách đợt đồ án hiện tại';
        }
        if (eligibilityResult && !eligibilityResult.eligible && eligibilityResult.studentCode === val) {
          return eligibilityResult.message;
        }
        return '';
      }
      case 'fullName': {
        const val = String(value || '').trim();
        if (!val) return 'Họ và tên sinh viên không được để trống';
        if (!/^[a-zA-ZÀ-ỹ\s]{3,50}$/.test(val) || val.split(/\s+/).length < 2) {
          return 'Họ và tên phải có ít nhất 2 từ và chỉ chứa chữ cái (VD: Nguyễn Văn An)';
        }
        return '';
      }
      case 'className': {
        const val = String(value || '').trim();
        if (!val) return 'Lớp sinh hoạt không được để trống (VD: CNTT1 - K64)';
        if (val.length < 3) return 'Tên lớp quá ngắn (VD: CNTT1 - K64)';
        return '';
      }
      case 'majorId': {
        const id = Number(value);
        if (!id || id <= 0) return 'Vui lòng chọn ngành đào tạo';
        return '';
      }
      case 'email': {
        const val = String(value || '').trim();
        if (val && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
          return 'Email không đúng định dạng chuẩn (VD: mssv@lms.utc.edu.vn)';
        }
        return '';
      }
      case 'phone': {
        const val = String(value || '').trim();
        if (val && !/^0\d{9}$/.test(val)) {
          return 'Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (VD: 0912345678)';
        }
        return '';
      }
      case 'gpa': {
        if (value === undefined || value === null || value === '') {
          return 'Điểm GPA không được để trống';
        }
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 4.0) {
          return 'Điểm GPA phải nằm trong khoảng từ 0.0 đến 4.0 (VD: 3.25)';
        }
        return '';
      }
      case 'completedCredits': {
        if (value === undefined || value === null || value === '') return '';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Tín chỉ tích lũy phải >= 0';
        if (num > resolvedProgram.maxCredits) {
          return `Tín chỉ tích lũy không được vượt quá ${resolvedProgram.maxCredits} tín (hệ ${resolvedProgram.name})`;
        }
        return '';
      }
      case 'debtCredits': {
        if (value === undefined || value === null || value === '') return '';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Số tín chỉ nợ phải >= 0';
        if (num > 10) {
          return 'Sinh viên nợ trên 10 tín chỉ không đủ điều kiện nhận đồ án (bị loại)';
        }
        if (num > resolvedProgram.maxCredits) {
          return `Số tín chỉ nợ không thể vượt quá ${resolvedProgram.maxCredits} tín`;
        }
        return '';
      }
      case 'missingPrerequisiteCount': {
        if (value === undefined || value === null || value === '') return '';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Số môn tiên quyết còn nợ phải >= 0';
        return '';
      }
      default:
        return '';
    }
  };

  const handleManualFieldChange = (field: keyof CreateRoundStudentManualPayload, value: any) => {
    if (manualModalError) setManualModalError(null);
    const updated = { ...manualForm, [field]: value };
    if (field === 'studentCode') {
      const code = String(value || '').trim();
      setEligibilityResult(null);
      if (/^\d{9}$/.test(code)) {
        if (!manualForm.email || manualForm.email.includes('@lms.utc.edu.vn')) {
          updated.email = `${code}@lms.utc.edu.vn`;
        }
        checkStudentEligibilityNow(code);
      }
    }
    setManualForm(updated);
    if (manualTouched[field]) {
      const err = validateManualField(field, value);
      setManualErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleManualFieldBlur = (field: keyof CreateRoundStudentManualPayload) => {
    setManualTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateManualField(field, manualForm[field]);
    setManualErrors((prev) => ({ ...prev, [field]: err }));
    if (field === 'studentCode') {
      checkStudentEligibilityNow(manualForm.studentCode);
    }
  };

  // Load majors
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

  // Fetch KPI Summary
  const fetchKpis = async () => {
    try {
      const res = await apiService.getEligibleStudents(roundId);
      if (res) {
        const debtCount = (res.students || []).filter((s) => s.debtCredits && s.debtCredits > 0).length;
        setKpi({
          total: res.totalStudents,
          eligible: res.eligibleCount,
          ineligible: res.ineligibleCount,
          hasDebt: debtCount,
        });
      }
    } catch {
      // ignore
    }
  };

  // Load students in round
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getStudentsInRound(roundId, {
        majorId: selectedMajorId,
        status: selectedStatus || undefined,
        onlyEligible: effectiveOnlyEligible ? true : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        size: 15,
      });

      const rawList = res?.content || [];
      const sortedList = [...rawList].sort((a, b) =>
        (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true })
      );
      setStudents(sortedList);
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
    fetchKpis();
  }, [roundId, selectedMajorId, selectedStatus, effectiveOnlyEligible, currentPage]);

  useEffect(() => {
    if (!error) return;
    setSuccessMsg(null);
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!successMsg) return;
    setError(null);
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadStudents();
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mau_import_sinh_vien_utc_${roundCode || roundId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg('Đã tải xuống file Excel mẫu chuẩn UTC thành công.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi khi tải file mẫu Excel');
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await apiService.exportEligibleStudents(roundId);
      downloadBlob(blob, `danh_sach_sinh_vien_hoc_vu_${roundCode || roundId}.xlsx`);
      setSuccessMsg('Đã xuất file Excel danh sách sinh viên và học vụ thành công.');
    } catch (err: any) {
      setError(await extractErrorMessage(err, 'Xuất file Excel thất bại'));
    } finally {
      setExporting(false);
    }
  };

  // Preview import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setPreviewData(null);
      setImportResultMsg(null);
    }
  };

  const handlePreviewImport = async () => {
    if (!importFile) return;
    try {
      setImportLoading(true);
      setError(null);
      const data = await apiService.previewImportStudents(roundId, importFile);
      setPreviewData(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi đọc file Excel';
      setError(msg);
    } finally {
      setImportLoading(false);
    }
  };

  // Commit import
  const handleCommitImport = async () => {
    if (isRoundClosed) {
      setError('Đợt đồ án đã đóng. Không thể import dữ liệu.');
      return;
    }
    if (!previewData || !previewData.rows) return;

    const validRows = previewData.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError('Không có sinh viên hợp lệ nào để nạp vào hệ thống.');
      return;
    }

    try {
      setImportLoading(true);
      setError(null);
      const result = await apiService.commitImportStudents(roundId, {
        rows: validRows,
      });

      setImportResultMsg(
        `Xử lý thành công ${result.totalProcessed} dòng. Tự động cấp ${result.newUsersCreated} tài khoản cho sinh viên đủ điều kiện (sinh viên không đủ điều kiện không được cấp tài khoản), ${result.newStudentsCreated} Sinh viên, ghi danh ${result.enrolledInRound} vào đợt (bỏ qua ${result.skipped}).`
      );
      setPreviewData(null);
      setImportFile(null);
      loadStudents();
      fetchKpis();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi lưu dữ liệu sinh viên vào hệ thống';
      setError(msg);
    } finally {
      setImportLoading(false);
    }
  };

  // Manual student submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate: (keyof CreateRoundStudentManualPayload)[] = [
      'studentCode',
      'fullName',
      'className',
      'majorId',
      'email',
      'phone',
      'gpa',
      'completedCredits',
      'debtCredits',
      'missingPrerequisiteCount',
    ];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let hasError = false;

    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      const err = validateManualField(f, manualForm[f]);
      if (err) {
        newErrors[f] = err;
        hasError = true;
      }
    });

    setManualTouched(newTouched);
    setManualErrors(newErrors);

    if (hasError) {
      setError('Vui lòng kiểm tra và hoàn thiện các trường dữ liệu chưa đúng định dạng chuẩn.');
      return;
    }

    const code = manualForm.studentCode.trim();
    if (students.some((s) => s.studentCode?.trim().toLowerCase() === code.toLowerCase())) {
      setManualModalError(`Kiểm tra trùng lặp: Sinh viên (MSSV: ${code}) đã có trong danh sách đợt đồ án này.`);
      return;
    }
    if (eligibilityResult && !eligibilityResult.eligible) {
      setManualModalError(eligibilityResult.message);
      return;
    }

    try {
      setManualLoading(true);
      setError(null);
      setManualModalError(null);
      const emailVal = manualForm.email?.trim() || `${code.toLowerCase()}@lms.utc.edu.vn`;
      await apiService.addStudentToRoundManually(roundId, {
        ...manualForm,
        studentCode: code,
        fullName: manualForm.fullName.trim(),
        email: emailVal,
        completedCredits: Number(manualForm.completedCredits ?? resolvedProgram.maxCredits),
        debtCredits: Number(manualForm.debtCredits ?? 0),
        missingPrerequisiteCount: 0,
        tuitionDebt: Boolean(manualForm.tuitionDebt),
        underDisciplinaryAction: Boolean(manualForm.underDisciplinaryAction),
      });

      setSuccessMsg(`Thêm sinh viên ${code} thành công. Tài khoản hệ thống đã được cấp: Tên đăng nhập = ${code}, Mật khẩu mặc định = Password@123.`);
      setShowManualModal(false);
      setManualForm({
        studentCode: '',
        fullName: '',
        email: '',
        className: '',
        majorId: majors[0]?.id || 0,
        phone: '',
        gpa: '' as any,
        completedCredits: resolvedProgram.maxCredits,
        debtCredits: 0,
        tuitionDebt: false,
        underDisciplinaryAction: false,
        missingPrerequisiteCount: 0,
        status: 'ELIGIBLE',
        note: '',
      });
      setManualErrors({});
      setManualTouched({});
      setManualModalError(null);
      loadStudents();
      fetchKpis();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi thêm sinh viên thủ công vào đợt';
      setError(msg);
      setManualModalError(msg);
    } finally {
      setManualLoading(false);
    }
  };

  // Chỉnh sửa toàn bộ thông tin sinh viên & học vụ
  const handleOpenEditModal = (st: StudentProjectRoundItem) => {
    if (isRoundClosed) return;
    setEditingStudent(st);
    setEditModalError(null);
    setEditForm({
      fullName: st.fullName || '',
      className: st.className || '',
      majorId: st.majorId || (majors.length > 0 ? majors[0].id : 1),
      email: st.email || '',
      phone: st.phone || '',
      gpa: st.gpa !== undefined && st.gpa !== null ? st.gpa : 3.0,
      completedCredits: st.completedCredits !== undefined && st.completedCredits !== null ? st.completedCredits : resolvedProgram.maxCredits,
      debtCredits: st.debtCredits !== undefined && st.debtCredits !== null ? st.debtCredits : 0,
      tuitionDebt: Boolean(st.tuitionDebt),
      underDisciplinaryAction: Boolean(st.underDisciplinaryAction),
      missingPrerequisiteCount: 0,
      note: st.note || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoundClosed) {
      setError('Đợt đồ án đã đóng. Không thể cập nhật thông tin.');
      return;
    }
    if (!editingStudent) return;

    if (!editForm.fullName.trim()) {
      setEditModalError('Họ và tên không được để trống');
      return;
    }

    const editCompletedNum = typeof editForm.completedCredits === 'string' ? parseInt(editForm.completedCredits, 10) : editForm.completedCredits;
    const editDebtNum = typeof editForm.debtCredits === 'string' ? parseInt(editForm.debtCredits, 10) : editForm.debtCredits;

    if (!isNaN(editCompletedNum) && editCompletedNum > resolvedProgram.maxCredits) {
      setEditModalError(`Tín chỉ tích lũy (${editCompletedNum}) vượt quá số tín chỉ tối đa của hệ ${resolvedProgram.name} (${resolvedProgram.maxCredits} tín chỉ). Vui lòng nhập trong khoảng 0 - ${resolvedProgram.maxCredits}.`);
      return;
    }
    if (!isNaN(editCompletedNum) && editCompletedNum < 0) {
      setEditModalError('Tín chỉ tích lũy không được nhỏ hơn 0.');
      return;
    }
    if (!isNaN(editDebtNum) && editDebtNum > resolvedProgram.maxCredits) {
      setEditModalError(`Tín chỉ nợ (${editDebtNum}) không thể vượt quá tổng tín chỉ của hệ ${resolvedProgram.name} (${resolvedProgram.maxCredits} tín chỉ).`);
      return;
    }

    try {
      setLoading(true);
      setEditModalError(null);

      const gpaNum = typeof editForm.gpa === 'string' ? parseFloat(editForm.gpa) : editForm.gpa;
      const debtCreditsNum = typeof editForm.debtCredits === 'string' ? parseInt(editForm.debtCredits, 10) : editForm.debtCredits;
      const completedCreditsNum = typeof editForm.completedCredits === 'string' ? parseInt(editForm.completedCredits, 10) : editForm.completedCredits;
      const missingPrereqNum = typeof editForm.missingPrerequisiteCount === 'string' ? parseInt(editForm.missingPrerequisiteCount, 10) : editForm.missingPrerequisiteCount;

      const evalResult = computeStudentEligibility(
        isNaN(debtCreditsNum) ? 0 : debtCreditsNum,
        editForm.tuitionDebt,
        editForm.underDisciplinaryAction,
        isNaN(missingPrereqNum) ? 0 : missingPrereqNum,
        isNaN(gpaNum) ? undefined : gpaNum
      );

      const payload: UpdateRoundStudentPayload = {
        fullName: editForm.fullName.trim(),
        className: editForm.className.trim(),
        majorId: Number(editForm.majorId),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        gpa: isNaN(gpaNum) ? undefined : gpaNum,
        debtCredits: isNaN(debtCreditsNum) ? 0 : Math.max(0, debtCreditsNum),
        completedCredits: isNaN(completedCreditsNum) ? resolvedProgram.maxCredits : Math.max(0, completedCreditsNum),
        tuitionDebt: editForm.tuitionDebt,
        underDisciplinaryAction: editForm.underDisciplinaryAction,
        missingPrerequisiteCount: 0,
        note: editForm.note.trim() || evalResult.autoNote,
      };

      await apiService.updateStudentInRound(roundId, editingStudent.studentId, payload);
      setSuccessMsg(`Cập nhật thông tin sinh viên ${editingStudent.studentCode} thành công.`);
      setEditingStudent(null);
      loadStudents();
      fetchKpis();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi cập nhật thông tin sinh viên';
      if (errMsg.includes('405')) {
        setEditModalError('⚠️ Máy chủ trả về mã 405 (Method Not Allowed). Backend vừa được biên dịch xong, vui lòng khởi động lại Backend service để nạp API cập nhật sinh viên.');
      } else {
        setEditModalError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove student from round
  const handleRemoveStudent = async (studentId: number, code: string) => {
    if (isRoundClosed) {
      setError('Đợt đồ án đã đóng. Không thể xóa sinh viên khỏi đợt.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sinh viên ${code} khỏi đợt đồ án này?`)) return;

    try {
      setLoading(true);
      await apiService.removeStudentFromRound(roundId, studentId);
      setSuccessMsg(`Đã xóa sinh viên ${code} khỏi đợt đồ án.`);
      loadStudents();
      fetchKpis();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa sinh viên khỏi đợt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, note?: string) => {
    if (note && (note.toLowerCase().includes('chưa đăng ký hướng') || note.toLowerCase().includes('chưa đăng ký'))) {
      return { label: 'Chưa đăng ký hướng', bg: '#fee2e2', color: '#b91c1c' };
    }
    if (status === 'DROPPED') {
      return { label: 'Bị loại', bg: '#fee2e2', color: '#b91c1c' };
    }
    switch (status) {
      case 'ELIGIBLE':
        return { label: 'Đủ điều kiện', bg: '#dcfce7', color: '#15803d' };
      case 'FORCE_APPROVED':
        return { label: 'Duyệt đặc cách', bg: '#e0f2fe', color: '#0369a1' };
      case 'REGISTERED':
        return { label: 'Đã có đề tài', bg: '#e0e7ff', color: '#4338ca' };
      case 'ASSIGNED':
        return { label: 'Đã gán GVHD', bg: '#fef3c7', color: '#b45309' };
      case 'IN_PROGRESS':
      case 'TOPIC_APPROVED':
        return { label: 'Đã duyệt đề tài', bg: '#e0f2fe', color: '#0369a1' };
      case 'DISQUALIFIED':
      case 'INELIGIBLE':
        return { label: 'Không đủ ĐK', bg: '#fee2e2', color: '#b91c1c' };
      case 'DEFENDED':
        return { label: 'Đã bảo vệ', bg: '#f3e8ff', color: '#7e22ce' };
      case 'RESERVED':
        return { label: 'Bảo lưu', bg: '#ffedd5', color: '#c2410c' };
      case 'NO_DATA':
        return { label: 'Chưa có HV', bg: '#f1f5f9', color: '#64748b' };
      default:
        return { label: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  // Client-side filtering for tuition, disciplinary and onlyEligible
  const filteredStudents = students.filter((s) => {
    if (effectiveOnlyEligible) {
      const isEligible = s.status === 'ELIGIBLE' || s.status === 'FORCE_APPROVED';
      if (!isEligible) return false;
    }
    if (filterTuition === 'debt' && !s.tuitionDebt) return false;
    if (filterTuition === 'clean' && s.tuitionDebt) return false;
    if (filterDiscipline === 'disciplined' && !s.underDisciplinaryAction) return false;
    if (filterDiscipline === 'normal' && s.underDisciplinaryAction) return false;
    return true;
  });

  return (
    <div>
      {/* Closed Round Notice Banner */}
      {isRoundClosed && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <span><strong>Đợt đồ án đã đóng:</strong> Danh sách sinh viên đang ở chế độ chỉ xem. Không thể nạp file Excel, cập nhật trạng thái hay xóa sinh viên khỏi đợt này.</span>
        </div>
      )}

      {/* Alert Messages */}
      {error ? (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>✕</button>
        </div>
      ) : successMsg ? (
        <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>✅ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>✕</button>
        </div>
      ) : null}

      {/* KPI Summary Cards */}
      {effectiveOnlyEligible ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{kpi.eligible || totalElements}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Sinh viên đủ điều kiện nhận đồ án</div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{kpi.hasDebt}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Có nợ tín chỉ (cần trả nợ GĐ5)</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#003366' }}>{kpi.total || totalElements}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Tổng sinh viên trong đợt</div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{kpi.eligible}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Đủ điều kiện nhận đồ án</div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{kpi.ineligible}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Không đủ điều kiện</div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 18px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{kpi.hasDebt}</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Có nợ tín chỉ (cần trả nợ GĐ5)</div>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            {effectiveOnlyEligible ? `Sinh viên đủ điều kiện nhận đồ án (${totalElements})` : `Sinh viên trong đợt (${totalElements})`}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            {effectiveOnlyEligible
              ? 'Danh sách sinh viên đủ điều kiện nhận đề tài tốt nghiệp, phục vụ phân công GVHD & Hội đồng bảo vệ'
              : 'Dữ liệu tích hợp thông tin sinh viên và kết quả học vụ xét điều kiện nhận đồ án (GĐ1 & GĐ5)'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!effectiveHideImportActions && (
            <>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#0a3273',
                  border: '1px solid #cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📥 Tải file mẫu Excel UTC
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
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isRoundClosed ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={isRoundClosed ? 'Đợt đồ án đã đóng - Không thể import sinh viên' : undefined}
              >
                📤 Import SV từ Excel
              </button>
              <button
                disabled={isRoundClosed}
                onClick={() => {
                  if (isRoundClosed) return;
                  setManualModalError(null);
                  setEligibilityResult(null);
                  setCheckingEligibility(false);
                  setShowManualModal(true);
                }}
                style={{
                  backgroundColor: isRoundClosed ? '#94a3b8' : '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isRoundClosed ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={isRoundClosed ? 'Đợt đồ án đã đóng' : 'Thêm từng sinh viên thủ công vào đợt'}
              >
                ➕ Thêm thủ công SV
              </button>
            </>
          )}
          <button
            type="button"
            disabled={exporting || totalElements === 0}
            onClick={handleExport}
            style={{
              backgroundColor: '#fff',
              color: '#15803d',
              border: '1px solid #16a34a',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: exporting || totalElements === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {exporting ? 'Đang xuất...' : '📊 Xuất Excel'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 220px' }}>
          <input
            type="text"
            placeholder="Tìm MSSV, họ tên, email, lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '150px', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
          style={{ flex: '1 1 150px', minWidth: '130px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả ngành</option>
          {majors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.name}
            </option>
          ))}
        </select>

        {effectiveOnlyEligible ? (
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            style={{ flex: '1 1 160px', minWidth: '140px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
          >
            <option value="">Tất cả SV đủ điều kiện</option>
            <option value="ELIGIBLE">Đủ điều kiện tiêu chuẩn</option>
            <option value="FORCE_APPROVED">Duyệt đặc cách</option>
          </select>
        ) : (
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            style={{ flex: '1 1 160px', minWidth: '140px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ELIGIBLE">Đủ điều kiện</option>
            <option value="FORCE_APPROVED">Duyệt đặc cách</option>
            <option value="ASSIGNED">Đã gán GVHD</option>
            <option value="IN_PROGRESS">Đã duyệt đề tài</option>
            <option value="INELIGIBLE">Không đủ điều kiện</option>
            <option value="RESERVED">Đã bảo lưu</option>
            <option value="DROPPED">Chưa ĐK hướng / Bị loại</option>
          </select>
        )}

        <select
          value={filterTuition}
          onChange={(e) => setFilterTuition(e.target.value)}
          style={{ flex: '1 1 140px', minWidth: '130px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả học phí</option>
          <option value="clean">Đã đóng học phí</option>
          <option value="debt">Nợ học phí</option>
        </select>

        <select
          value={filterDiscipline}
          onChange={(e) => setFilterDiscipline(e.target.value)}
          style={{ flex: '1 1 140px', minWidth: '130px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
        >
          <option value="">Tất cả kỷ luật</option>
          <option value="normal">Bình thường</option>
          <option value="disciplined">Bị kỷ luật</option>
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Đang tải danh sách sinh viên...</div>
      ) : filteredStudents.length > 0 ? (
        <div style={{ width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>💡 Vuốt hoặc cuộn ngang để xem đầy đủ cột thông tin học vụ</span>
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '10px 10px', width: '45px' }}>STT</th>
                  <th style={{ padding: '10px 10px', width: '100px' }}>MSSV</th>
                  <th style={{ padding: '10px 10px', minWidth: '150px' }}>Họ và tên</th>
                  <th style={{ padding: '10px 10px', width: '120px' }}>Lớp &amp; Ngành</th>
                  <th style={{ padding: '10px 10px', minWidth: '160px' }}>Email &amp; SĐT</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: '80px' }}>TC tích lũy</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: '65px' }}>GPA</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: '85px' }}>Học phí</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: '85px' }}>Kỷ luật</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: '75px' }}>Nợ tín</th>
                  <th style={{ padding: '10px 10px', width: '140px' }}>Trạng thái</th>
                  <th style={{ padding: '10px 10px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, idx) => {
                  const badge = getStatusBadge(st.status, st.note);
                  const isUnregistered = Boolean(st.note && (st.note.toLowerCase().includes('chưa đăng ký hướng') || st.note.toLowerCase().includes('chưa đăng ký')));
                  const isCleanNote = Boolean(st.note && !st.note.toLowerCase().includes('đủ đk nhận đồ án') && !st.note.toLowerCase().includes('chưa đăng ký hướng'));
                  return (
                    <tr key={st.studentRoundId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px' }}>{currentPage * 15 + idx + 1}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0a3273' }}>{st.studentCode}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1e293b' }}>{st.fullName}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <div>{st.className || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: '#e2e8f0', fontWeight: 600 }}>
                            {st.majorCode || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>
                        <div style={{ fontSize: '0.8rem' }}>{st.email}</div>
                        {st.phone && <div style={{ fontSize: '0.75rem' }}>📞 {st.phone}</div>}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600 }}>
                        {st.completedCredits ?? resolvedProgram.maxCredits}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span style={{ color: (st.gpa !== undefined && st.gpa !== null && st.gpa < 2.0) ? '#dc2626' : '#0a3273', fontWeight: 700 }}>
                          {st.gpa !== undefined && st.gpa !== null ? Number(st.gpa).toFixed(2) : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {st.tuitionDebt ? (
                          <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            Nợ HP
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>
                            Đã đóng
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {st.underDisciplinaryAction ? (
                          <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            Kỷ luật
                          </span>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '0.78rem' }}>Bình thường</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span style={{ color: (st.debtCredits !== undefined && st.debtCredits > 10) ? '#dc2626' : '#15803d', fontWeight: 700 }}>
                          {st.debtCredits ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                        {isUnregistered ? (
                          <div style={{ marginTop: '3px', fontSize: '0.7rem', fontWeight: 600, color: '#b45309' }}>
                            🔑 Đã cấp TK
                          </div>
                        ) : (st.status === 'INELIGIBLE' || st.status === 'DROPPED' || st.status === 'DISQUALIFIED') ? (
                          <div style={{ marginTop: '3px', fontSize: '0.7rem', fontWeight: 600, color: '#dc2626' }}>
                            🚫 Không cấp TK
                          </div>
                        ) : (
                          <div style={{ marginTop: '3px', fontSize: '0.7rem', fontWeight: 600, color: st.accountActive === false ? '#b45309' : '#15803d' }}>
                            {st.accountActive === false ? '⏳ Chờ mở đợt cấp TK' : '🔑 Đã cấp TK'}
                          </div>
                        )}
                        {isCleanNote && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={st.note}>
                            {st.note}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {!isRoundClosed ? (
                          <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEditModal(st)}
                              title="Chỉnh sửa thông tin sinh viên & dữ liệu học vụ"
                              style={{ backgroundColor: '#eff6ff', color: '#0a3273', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleRemoveStudent(st.studentId, st.studentCode)}
                              title="Xóa khỏi đợt"
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Đã khóa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
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
        <div style={{ padding: '36px', textAlign: 'center', color: '#475569', fontWeight: 500, border: '1px dashed #94a3b8', borderRadius: '8px' }}>
          {effectiveOnlyEligible ? (
            'Đợt đồ án này chưa có sinh viên nào đủ điều kiện nhận đồ án (hoặc Giáo vụ Khoa chưa nạp và xét duyệt dữ liệu học vụ).'
          ) : (
            <>
              Đợt đồ án này chưa có sinh viên nào. Hãy bấm nút <strong style={{ color: '#0f172a' }}>"Import SV từ Excel"</strong> để nạp danh sách kèm thông tin học vụ.
            </>
          )}
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0a3273' }}>Import Danh Sách Sinh Viên &amp; Học Vụ vào Đợt Đồ Án</h3>
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
                ✅ {importResultMsg}
              </div>
            )}

            {/* Step 1: Select File */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Chọn file Excel danh sách sinh viên (.xlsx, .xls) *
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
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <span>
                    💡 Nếu chưa có file đúng định dạng, hãy bấm <strong>"📥 Tải file mẫu Excel UTC"</strong> để lấy file mẫu chuẩn gồm thông tin sinh viên và các cột học vụ (GPA, Tín chỉ tích lũy, Tín chỉ nợ, Nợ học phí, Kỷ luật).
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#0a3273',
                      border: '1px solid #93c5fd',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📥 Tải file mẫu Excel UTC
                  </button>
                </div>
                <strong style={{ color: '#0a3273' }}>📌 Quy định dữ liệu:</strong> Mã sinh viên (MSSV) <strong>chỉ có đúng 9 số</strong>. Số tín chỉ nợ tối đa 10 tín (&lt;= 10) và không kỷ luật thì được tính là đủ điều kiện nhận đồ án.
                <br />
                <strong style={{ color: '#16a34a' }}>🔐 Cấp tài khoản sinh viên:</strong> Hệ thống tự động cấp tài khoản đăng nhập (Tên đăng nhập = Mã SV, Mật khẩu mặc định = Password@123) <strong>chỉ cho sinh viên ĐỦ ĐIỀU KIỆN</strong> nhận đồ án. Sinh viên không đủ điều kiện sẽ <strong>không được cấp tài khoản</strong>.
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
                  <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px' }}>STT</th>
                        <th style={{ padding: '8px' }}>MSSV</th>
                        <th style={{ padding: '8px' }}>Họ tên</th>
                        <th style={{ padding: '8px' }}>Ngành</th>
                        <th style={{ padding: '8px' }}>Lớp</th>
                        <th style={{ padding: '8px' }}>GPA</th>
                        <th style={{ padding: '8px' }}>TC tích lũy</th>
                        <th style={{ padding: '8px' }}>Nợ tín</th>
                        <th style={{ padding: '8px' }}>Học phí</th>
                        <th style={{ padding: '8px' }}>Kỷ luật</th>
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
                          <td style={{ padding: '8px', fontWeight: 700, color: '#0a3273' }}>
                            {row.gpa !== undefined && row.gpa !== null ? Number(row.gpa).toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{row.completedCredits ?? resolvedProgram.maxCredits}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: (row.debtCredits ?? 0) > 10 ? '#dc2626' : '#15803d' }}>
                            {row.debtCredits ?? 0}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            {row.tuitionDebt ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Nợ HP</span> : <span style={{ color: '#15803d' }}>Đã đóng</span>}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            {row.underDisciplinaryAction ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Kỷ luật</span> : <span style={{ color: '#64748b' }}>BT</span>}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {row.isValid ? (
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                ✔ Hợp lệ ({row.academicStatus === 'INELIGIBLE' ? 'K.Đủ ĐK' : 'Đủ ĐK'})
                              </span>
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
                      padding: '8px 24px',
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

      {/* Modal Edit Student & Academic Record */}
      {editingStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0a3273', fontSize: '1.2rem' }}>
                  ✏️ Chỉnh sửa thông tin sinh viên &amp; Học vụ
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Sinh viên: <strong>{editingStudent.fullName}</strong> — MSSV: <strong style={{ color: '#0a3273' }}>{editingStudent.studentCode}</strong>
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}>
                    🎓 Hệ: {resolvedProgram.name} (Tối đa {resolvedProgram.maxCredits} tín)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Real-time Automatic Status Banner */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: currentEditEligibility.isEligible ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${currentEditEligibility.isEligible ? '#10b981' : '#ef4444'}`,
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{currentEditEligibility.isEligible ? '✅' : '🚫'}</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: currentEditEligibility.isEligible ? '#065f46' : '#991b1b' }}>
                      Trạng thái xét duyệt: {currentEditEligibility.isEligible ? 'ĐỦ ĐIỀU KIỆN NHẬN ĐỒ ÁN' : 'KHÔNG ĐỦ ĐIỀU KIỆN'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ⚡ Hệ thống tự động xét duyệt theo quy chế UTC (Không chọn thủ công)
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: currentEditEligibility.isEligible ? '#059669' : '#dc2626',
                    color: '#fff',
                  }}
                >
                  {currentEditEligibility.status}
                </span>
              </div>
              {!currentEditEligibility.isEligible && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #fecaca', fontSize: '0.8rem', color: '#991b1b' }}>
                  <strong>Lý do không đủ điều kiện:</strong>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                    {currentEditEligibility.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {editModalError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  marginBottom: '14px',
                }}
              >
                ⚠️ {editModalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              {/* Phần 1: Thông tin định danh & liên hệ */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0a3273', marginBottom: '8px' }}>
                  👤 Thông tin cơ bản sinh viên
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>
                      Mã sinh viên (MSSV)
                    </label>
                    <input
                      type="text"
                      value={editingStudent.studentCode}
                      disabled
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                      placeholder="Họ và tên sinh viên"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Lớp sinh hoạt *
                    </label>
                    <input
                      type="text"
                      value={editForm.className}
                      onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                      required
                      placeholder="VD: CNTT 1 - K62"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Ngành đào tạo *
                    </label>
                    <select
                      value={editForm.majorId}
                      onChange={(e) => setEditForm({ ...editForm, majorId: Number(e.target.value) })}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      {majors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Email sinh viên
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="mssv@lms.utc.edu.vn"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="0912345678"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Phần 2: Dữ liệu học vụ xét điều kiện nhận đồ án (GĐ1) */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0a3273', marginBottom: '10px' }}>
                  📊 Dữ liệu học vụ xét điều kiện nhận đồ án (GĐ1)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Điểm GPA (&gt;= 2.0) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      value={editForm.gpa}
                      onChange={(e) => setEditForm({ ...editForm, gpa: e.target.value })}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: (Number(editForm.completedCredits) > resolvedProgram.maxCredits) ? '#dc2626' : '#1e293b' }}>
                      Tín chỉ tích lũy (tối đa {resolvedProgram.maxCredits} tín) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={resolvedProgram.maxCredits}
                      value={editForm.completedCredits}
                      onChange={(e) => setEditForm({ ...editForm, completedCredits: e.target.value })}
                      placeholder={`VD: ${resolvedProgram.maxCredits - 15} (tối đa ${resolvedProgram.maxCredits})`}
                      required
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: (Number(editForm.completedCredits) > resolvedProgram.maxCredits) ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        backgroundColor: (Number(editForm.completedCredits) > resolvedProgram.maxCredits) ? '#fef2f2' : '#fff',
                      }}
                    />
                    {Number(editForm.completedCredits) > resolvedProgram.maxCredits && (
                      <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ Vượt quá tối đa {resolvedProgram.maxCredits} tín của hệ {resolvedProgram.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Tín chỉ nợ (tối đa 10 tín)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={resolvedProgram.maxCredits}
                      value={editForm.debtCredits}
                      onChange={(e) => setEditForm({ ...editForm, debtCredits: e.target.value })}
                      placeholder="VD: 0"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: (Number(editForm.debtCredits) > resolvedProgram.maxCredits) ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        backgroundColor: (Number(editForm.debtCredits) > resolvedProgram.maxCredits) ? '#fef2f2' : '#fff',
                      }}
                    />
                    {Number(editForm.debtCredits) > resolvedProgram.maxCredits && (
                      <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ Không thể vượt quá {resolvedProgram.maxCredits} tín
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{ paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: editForm.tuitionDebt ? '#dc2626' : '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editForm.tuitionDebt)}
                        onChange={(e) => setEditForm({ ...editForm, tuitionDebt: e.target.checked })}
                      />
                      Đang nợ học phí
                    </label>
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: editForm.underDisciplinaryAction ? '#dc2626' : '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editForm.underDisciplinaryAction)}
                        onChange={(e) => setEditForm({ ...editForm, underDisciplinaryAction: e.target.checked })}
                      />
                      Đang bị kỷ luật
                    </label>
                  </div>
                </div>
              </div>

              {/* Phần 3: Ghi chú */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Ghi chú học vụ
                </label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  placeholder={`Ghi chú (để trống hệ thống sẽ tự sinh: "${currentEditEligibility.autoNote}")`}
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
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
                  disabled={loading}
                  style={{ backgroundColor: '#0a3273', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Đang lưu...' : '💾 Lưu thông tin sinh viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Student Manually */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0a3273' }}>
              ➕ Thêm Sinh viên &amp; Dữ liệu Học vụ thủ công
            </h3>
            
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#1e40af' }}>
              🔐 <strong>Cấp tài khoản đăng nhập tự động:</strong> Khi lưu, hệ thống tự động tạo tài khoản Sinh viên với <strong>Tên đăng nhập = Mã SV</strong> và <strong>Mật khẩu mặc định = Password@123</strong>.
            </div>

            {manualModalError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <strong>Không thể thêm sinh viên:</strong>
                  <div style={{ marginTop: '2px', lineHeight: 1.4 }}>{manualModalError}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setManualModalError(null)}
                  style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleManualSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Mã sinh viên (MSSV) *
                  </label>
                  <input
                    type="text"
                    value={manualForm.studentCode}
                    onChange={(e) => handleManualFieldChange('studentCode', e.target.value)}
                    onBlur={() => handleManualFieldBlur('studentCode')}
                    placeholder="VD: 201200101 (đúng 9 số)"
                    maxLength={9}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.studentCode
                        ? manualErrors.studentCode
                          ? '1.5px solid #ef4444'
                          : '1.5px solid #22c55e'
                        : '1px solid #cbd5e1',
                      backgroundColor: manualTouched.studentCode && manualErrors.studentCode ? '#fef2f2' : '#fff',
                      outline: 'none',
                    }}
                  />
                  {checkingEligibility && (
                    <div style={{ color: '#2563eb', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⏳ Đang kiểm tra trùng lặp & đợt đồ án...
                    </div>
                  )}
                  {!checkingEligibility && manualTouched.studentCode && manualErrors.studentCode && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600, lineHeight: 1.4 }}>
                      ⚠️ {manualErrors.studentCode}
                    </div>
                  )}
                  {!checkingEligibility && manualTouched.studentCode && !manualErrors.studentCode && manualForm.studentCode && (
                    <div style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      {eligibilityResult?.existsInSystem
                        ? `✓ Hợp lệ: ${eligibilityResult.fullName || 'Đã có hồ sơ'} (Đủ điều kiện tham gia đợt)`
                        : '✓ Hợp lệ (chuẩn 9 chữ số)'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Họ và tên sinh viên *
                  </label>
                  <input
                    type="text"
                    value={manualForm.fullName}
                    onChange={(e) => handleManualFieldChange('fullName', e.target.value)}
                    onBlur={() => handleManualFieldBlur('fullName')}
                    placeholder="VD: Nguyễn Văn An"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.fullName
                        ? manualErrors.fullName
                          ? '1.5px solid #ef4444'
                          : '1.5px solid #22c55e'
                        : '1px solid #cbd5e1',
                      backgroundColor: manualTouched.fullName && manualErrors.fullName ? '#fef2f2' : '#fff',
                      outline: 'none',
                    }}
                  />
                  {manualTouched.fullName && manualErrors.fullName && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {manualErrors.fullName}
                    </div>
                  )}
                  {manualTouched.fullName && !manualErrors.fullName && manualForm.fullName && (
                    <div style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ✓ Hợp lệ
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Lớp sinh hoạt *
                  </label>
                  <input
                    type="text"
                    value={manualForm.className || ''}
                    onChange={(e) => handleManualFieldChange('className', e.target.value)}
                    onBlur={() => handleManualFieldBlur('className')}
                    placeholder="VD: CNTT1 - K64"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.className
                        ? manualErrors.className
                          ? '1.5px solid #ef4444'
                          : '1.5px solid #22c55e'
                        : '1px solid #cbd5e1',
                      backgroundColor: manualTouched.className && manualErrors.className ? '#fef2f2' : '#fff',
                      outline: 'none',
                    }}
                  />
                  {manualTouched.className && manualErrors.className && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {manualErrors.className}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Ngành đào tạo *
                  </label>
                  <select
                    value={manualForm.majorId}
                    onChange={(e) => handleManualFieldChange('majorId', Number(e.target.value))}
                    onBlur={() => handleManualFieldBlur('majorId')}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: manualTouched.majorId
                        ? manualErrors.majorId
                          ? '1.5px solid #ef4444'
                          : '1.5px solid #22c55e'
                        : '1px solid #cbd5e1',
                      backgroundColor: manualTouched.majorId && manualErrors.majorId ? '#fef2f2' : '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value={0}>-- Chọn ngành đào tạo --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                    ))}
                  </select>
                  {manualTouched.majorId && manualErrors.majorId && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ {manualErrors.majorId}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email sinh viên
                  </label>
                  <input
                    type="email"
                    value={manualForm.email || ''}
                    onChange={(e) => handleManualFieldChange('email', e.target.value)}
                    onBlur={() => handleManualFieldBlur('email')}
                    placeholder="Tự động: mssv@lms.utc.edu.vn"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={manualForm.phone || ''}
                    onChange={(e) => handleManualFieldChange('phone', e.target.value)}
                    onBlur={() => handleManualFieldBlur('phone')}
                    placeholder="VD: 0912345678 (10 số)"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Academic Fields Section */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0a3273', marginBottom: '10px' }}>
                  📊 Thông tin Học vụ &amp; Xét điều kiện
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Điểm GPA *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      value={manualForm.gpa !== undefined && manualForm.gpa !== null ? manualForm.gpa : ''}
                      onChange={(e) => handleManualFieldChange('gpa', e.target.value !== '' ? Number(e.target.value) : undefined)}
                      onBlur={() => handleManualFieldBlur('gpa')}
                      placeholder="VD: 3.20"
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Tín chỉ tích lũy (tối đa {resolvedProgram.maxCredits} tín)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={resolvedProgram.maxCredits}
                      value={manualForm.completedCredits ?? resolvedProgram.maxCredits}
                      onChange={(e) => handleManualFieldChange('completedCredits', Number(e.target.value))}
                      placeholder={`VD: ${resolvedProgram.maxCredits}`}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: ((manualForm.completedCredits ?? 0) > resolvedProgram.maxCredits) ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      }}
                    />
                    {(manualForm.completedCredits ?? 0) > resolvedProgram.maxCredits && (
                      <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ Tối đa {resolvedProgram.maxCredits} tín của hệ {resolvedProgram.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Tín chỉ nợ (tối đa 10 tín)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={resolvedProgram.maxCredits}
                      value={manualForm.debtCredits ?? 0}
                      onChange={(e) => handleManualFieldChange('debtCredits', Number(e.target.value))}
                      placeholder="VD: 0"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: ((manualForm.debtCredits ?? 0) > resolvedProgram.maxCredits) ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{ paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: manualForm.tuitionDebt ? '#dc2626' : '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(manualForm.tuitionDebt)}
                        onChange={(e) => setManualForm({ ...manualForm, tuitionDebt: e.target.checked })}
                      />
                      Đang nợ học phí
                    </label>
                  </div>

                  <div style={{ paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: manualForm.underDisciplinaryAction ? '#dc2626' : '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(manualForm.underDisciplinaryAction)}
                        onChange={(e) => setManualForm({ ...manualForm, underDisciplinaryAction: e.target.checked })}
                      />
                      Đang bị kỷ luật
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Ghi chú học vụ</label>
                <textarea
                  value={manualForm.note || ''}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  placeholder="Ghi chú thêm về học vụ hoặc hồ sơ sinh viên..."
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
