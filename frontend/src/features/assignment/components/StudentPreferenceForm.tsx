import React, { useState, useEffect } from 'react';
import { isLecturerAssignedToDirection, type ProjectDirection, type LecturerCapacity } from '../types';

interface Props {
  directions: ProjectDirection[];
  capacities: LecturerCapacity[];
  onSubmit: (data: {
    directionId: number;
    nv1LecturerId: number;
    nv2LecturerId?: number;
    nv3LecturerId?: number;
    gpa?: number;
    prioritizationCriteria?: string;
  }) => Promise<void>;
  studentProgram?: 'CU_NHAN' | 'KY_SU';
  loading?: boolean;
  projectRoundName?: string;
  projectRoundCode?: string;
  academicYear?: string;
  semester?: string;
  isRoundClosed?: boolean;
  hasSubmitted?: boolean;
  canEdit?: boolean;
  isAssignmentFinalized?: boolean;
  initialValues?: {
    directionId?: number;
    nv1LecturerId?: number;
    nv2LecturerId?: number;
    nv3LecturerId?: number;
    gpa?: number;
    prioritizationCriteria?: string;
  };
}

export const StudentPreferenceForm: React.FC<Props> = ({
  directions,
  capacities,
  onSubmit,
  studentProgram = 'CU_NHAN',
  loading,
  projectRoundName,
  projectRoundCode,
  academicYear,
  semester,
  isRoundClosed = false,
  hasSubmitted = false,
  canEdit = true,
  isAssignmentFinalized = false,
  initialValues,
}) => {
  const [selectedDirectionId, setSelectedDirectionId] = useState<number | ''>(initialValues?.directionId || '');
  const [nv1, setNv1] = useState<number | ''>(initialValues?.nv1LecturerId || '');
  const [nv2, setNv2] = useState<number | ''>(initialValues?.nv2LecturerId || '');
  const [nv3, setNv3] = useState<number | ''>(initialValues?.nv3LecturerId || '');
  const [gpa, setGpa] = useState<string>(initialValues?.gpa !== undefined ? String(initialValues.gpa) : '3.2');
  const [criteria, setCriteria] = useState<string>(initialValues?.prioritizationCriteria || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isFormDisabled = isRoundClosed || isAssignmentFinalized || !canEdit || submitting;

  // Sync initialValues when loaded asynchronously
  useEffect(() => {
    if (initialValues) {
      if (initialValues.directionId) setSelectedDirectionId(initialValues.directionId);
      if (initialValues.nv1LecturerId) setNv1(initialValues.nv1LecturerId);
      if (initialValues.nv2LecturerId) setNv2(initialValues.nv2LecturerId);
      if (initialValues.nv3LecturerId) setNv3(initialValues.nv3LecturerId);
      if (initialValues.gpa !== undefined && initialValues.gpa !== null) setGpa(String(initialValues.gpa));
      if (initialValues.prioritizationCriteria !== undefined && initialValues.prioritizationCriteria !== null) {
        setCriteria(initialValues.prioritizationCriteria);
      }
    }
  }, [initialValues]);

  // Auto-select first direction if available and no initial direction
  useEffect(() => {
    if (directions.length > 0 && selectedDirectionId === '' && !initialValues?.directionId) {
      setSelectedDirectionId(directions[0].id);
    }
  }, [directions, selectedDirectionId, initialValues]);

  // Selected direction object
  const currentDirection = directions.find((d) => d.id === selectedDirectionId);

  // Filter eligible lecturers based strictly on direction assigned to lecturer in this round
  const matchingLecturers = currentDirection
    ? capacities.filter((c) => isLecturerAssignedToDirection(c, currentDirection))
    : [];

  // If matching lecturers found for this direction, show them. Otherwise fallback to all capacities in round
  const eligibleLecturers = matchingLecturers.length > 0 ? matchingLecturers : capacities;
  const isFallback = matchingLecturers.length === 0 && capacities.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isRoundClosed) {
      setErrorMessage('Đợt đồ án này đã đóng. Cổng đăng ký không còn tiếp nhận thao tác!');
      return;
    }
    if (isAssignmentFinalized || !canEdit) {
      setErrorMessage('Kết quả phân công GVHD đã được Khoa chốt chính thức. Bạn không thể chỉnh sửa nguyện vọng nữa!');
      return;
    }

    if (!selectedDirectionId) {
      setErrorMessage('Vui lòng chọn Hướng đồ án tốt nghiệp.');
      return;
    }
    if (!nv1) {
      setErrorMessage('Vui lòng chọn Nguyện vọng 1 (NV1).');
      return;
    }

    // Check duplicate preferences
    const selectedList = [nv1, nv2, nv3].filter(Boolean) as number[];
    const uniqueList = new Set(selectedList);
    if (selectedList.length !== uniqueList.size) {
      setErrorMessage('Các nguyện vọng (NV1, NV2, NV3) không được chọn cùng một giảng viên!');
      return;
    }

    // Check Engineering (KY_SU) degree constraint
    if (studentProgram === 'KY_SU') {
      for (const id of selectedList) {
        const lect = capacities.find((c) => c.lecturerId === id);
        if (lect && (lect.academicDegree === 'THAC_SI' || lect.academicDegree === 'MASTER')) {
          setErrorMessage(
            `Quy định đối với sinh viên chương trình Kỹ sư: Giảng viên hướng dẫn phải có học vị Tiến sĩ trở lên. Giảng viên ${lect.fullName} có học vị Thạc sĩ, vui lòng chọn giảng viên khác!`
          );
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      await onSubmit({
        directionId: Number(selectedDirectionId),
        nv1LecturerId: Number(nv1),
        nv2LecturerId: nv2 ? Number(nv2) : undefined,
        nv3LecturerId: nv3 ? Number(nv3) : undefined,
        gpa: gpa ? Number(gpa) : undefined,
        prioritizationCriteria: criteria.trim() || undefined,
      });
      setSuccessMessage(
        hasSubmitted
          ? 'Chỉnh sửa và lưu thay đổi nguyện vọng thành công!'
          : 'Đăng ký hướng đồ án và nộp nguyện vọng thành công!'
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Đã xảy ra lỗi khi đăng ký nguyện vọng.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-reg-card">
      <div className="form-intro-banner">
        <div className="banner-icon">{hasSubmitted ? '✏️' : '📝'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ margin: 0 }}>
              {hasSubmitted
                ? 'Chỉnh sửa Hướng đồ án & Nguyện vọng Giảng viên hướng dẫn'
                : 'Đăng ký Hướng đồ án & Nguyện vọng Giảng viên hướng dẫn'}
            </h3>
            {projectRoundName && (
              <span className="round-tag-indicator">
                🎓 Đang phân công cho: <strong>{projectRoundName}</strong> {projectRoundCode ? `(${projectRoundCode})` : ''}
              </span>
            )}
          </div>
          <p style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 500, margin: '4px 0 0 0' }}>
            Sinh viên lựa chọn hướng chuyên môn và đăng ký tối đa 3 nguyện vọng giảng viên cho đợt đồ án{' '}
            <strong>{projectRoundName || 'tốt nghiệp'}</strong>
            {academicYear ? ` (${academicYear}${semester ? ` - ${semester}` : ''})` : ''}.
            {studentProgram === 'KY_SU' && (
              <span className="badge-kysu-note">
                Chương trình Kỹ sư: Yêu cầu GVHD có học vị Tiến sĩ (TS/PGS/GS) trở lên.
              </span>
            )}
          </p>
        </div>
      </div>

      {isRoundClosed && (
        <div className="alert-box alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <div>
            <strong>ĐỢT ĐỒ ÁN ĐÃ ĐÓNG (KẾT THÚC):</strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem' }}>
              Cổng đăng ký hướng chuyên môn và nộp nguyện vọng GVHD cho đợt <strong>{projectRoundName || 'này'}</strong> đã kết thúc. Không thể thực hiện thao tác gửi mới hoặc sửa đổi.
            </p>
          </div>
        </div>
      )}

      {!isRoundClosed && isAssignmentFinalized && (
        <div className="alert-box alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb', color: '#92400e' }}>
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <div>
            <strong>KẾT QUẢ PHÂN CÔNG ĐÃ ĐƯỢC CHỐT CHÍNH THỨC:</strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem' }}>
              Khoa / Quản trị viên đã chốt danh sách phân công Giảng viên hướng dẫn. Nguyện vọng của bạn hiện đã được khóa và không thể chỉnh sửa.
            </p>
          </div>
        </div>
      )}

      {!isRoundClosed && !isAssignmentFinalized && hasSubmitted && (
        <div className="alert-box alert-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '1.3rem' }}>✏️</span>
          <div>
            <strong>BẠN ĐÃ NỘP NGUYỆN VỌNG TRƯỚC ĐÓ:</strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem' }}>
              Khoa chưa chốt kết quả phân công, bạn có thể thoải mái điều chỉnh lại hướng đồ án và các nguyện vọng GVHD bên dưới, sau đó bấm <strong>"Chỉnh sửa & Lưu thay đổi nguyện vọng"</strong> để cập nhật.
            </p>
          </div>
        </div>
      )}

      {errorMessage && <div className="alert-box alert-danger">{errorMessage}</div>}
      {successMessage && <div className="alert-box alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Choose Direction */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="step-num">1</span> Chọn Hướng đồ án tốt nghiệp
          </h4>

          <div className="direction-cards-grid">
            {directions.map((d) => (
              <label
                key={d.id}
                className={`direction-option-card ${
                  selectedDirectionId === d.id ? 'selected' : ''
                } ${isFormDisabled ? 'disabled' : ''}`}
                style={isFormDisabled ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
              >
                <input
                  type="radio"
                  name="direction"
                  value={d.id}
                  disabled={isFormDisabled}
                  checked={selectedDirectionId === d.id}
                  onChange={() => {
                    if (isFormDisabled) return;
                    setSelectedDirectionId(d.id);
                    // Reset preferences if changing direction
                    setNv1('');
                    setNv2('');
                    setNv3('');
                  }}
                />
                <div className="card-content">
                  <div className="card-top">
                    <span className="direction-tag">{d.code}</span>
                    <span className="lecturer-tag">
                      {(() => {
                        if (capacities && capacities.length > 0) {
                          const count = capacities.filter((c) => isLecturerAssignedToDirection(c, d)).length;
                          return `${count} GV`;
                        }
                        return `${d.lecturerCount !== undefined ? d.lecturerCount : 0} GV`;
                      })()}
                    </span>
                  </div>
                  <h5 className="direction-title">{d.name}</h5>
                  <p className="direction-desc">{d.description || 'Chuyên đề đào tạo chuyên sâu'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2: Choose 3 Preferences */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h4 className="section-title" style={{ margin: 0 }}>
              <span className="step-num">2</span> Chọn Nguyện vọng Giảng viên hướng dẫn (NV1 → NV3)
            </h4>
            {eligibleLecturers.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#166534', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
                {matchingLecturers.length > 0
                  ? `✓ Có ${matchingLecturers.length} GV chuyên trách hướng đã chọn`
                  : `ℹ️ Hiển thị ${eligibleLecturers.length} GV trong đợt`}
              </span>
            )}
          </div>

          {capacities.length === 0 && (
            <div className="alert-box alert-warning" style={{ marginBottom: '16px' }}>
              ⚠️ Hiện tại chưa có dữ liệu chỉ tiêu giảng viên nào trong đợt đồ án này. Vui lòng liên hệ quản trị viên khoa hoặc chọn đợt đồ án khác!
            </div>
          )}

          {isFallback && capacities.length > 0 && (
            <div className="alert-box alert-info" style={{ marginBottom: '14px', fontSize: '0.88rem' }}>
              ℹ️ Hướng <strong>{currentDirection?.name}</strong> hiện chưa có giảng viên đăng ký chuyên trách riêng. Hệ thống hiển thị tất cả {capacities.length} giảng viên trong đợt để bạn tự do lựa chọn.
            </div>
          )}

          {eligibleLecturers.length > 0 && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '8px' }}>
                👨‍🏫 Danh sách Giảng viên khả dụng theo hướng đồ án:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eligibleLecturers.map((l) => (
                  <div
                    key={l.lecturerId}
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <strong>{l.fullName}</strong>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>({l.academicDegree})</span>
                    <span style={{ color: '#64748b' }}>• {l.departmentName}</span>
                    <span
                      style={{
                        backgroundColor: l.remainingCapacity > 0 ? '#ecfdf5' : '#fef2f2',
                        color: l.remainingCapacity > 0 ? '#059669' : '#dc2626',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      Còn {l.remainingCapacity}/{l.effectiveCapacity != null ? l.effectiveCapacity : (l.maxQuota || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="preferences-form-grid">
            <div className="pref-input-block">
              <label className="pref-label nv1-text">
                Nguyện vọng 1 (Ưu tiên cao nhất) <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={nv1}
                disabled={isFormDisabled}
                onChange={(e) => setNv1(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">-- Chọn Giảng viên NV1 --</option>
                {eligibleLecturers.map((l) => {
                  const totalQuota = l.effectiveCapacity != null ? l.effectiveCapacity : (l.maxQuota || 0);
                  return (
                    <option key={l.lecturerId} value={l.lecturerId}>
                      {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity}/{totalQuota} chỗ]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pref-input-block">
              <label className="pref-label nv2-text">Nguyện vọng 2 (Dự phòng 1)</label>
              <select
                className="form-select"
                value={nv2}
                disabled={isFormDisabled}
                onChange={(e) => setNv2(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn Giảng viên NV2 (Tùy chọn) --</option>
                {eligibleLecturers
                  .filter((l) => l.lecturerId !== nv1)
                  .map((l) => {
                    const totalQuota = l.effectiveCapacity != null ? l.effectiveCapacity : (l.maxQuota || 0);
                    return (
                      <option key={l.lecturerId} value={l.lecturerId}>
                        {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity}/{totalQuota} chỗ]
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="pref-input-block">
              <label className="pref-label nv3-text">Nguyện vọng 3 (Dự phòng 2)</label>
              <select
                className="form-select"
                value={nv3}
                disabled={isFormDisabled}
                onChange={(e) => setNv3(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn Giảng viên NV3 (Tùy chọn) --</option>
                {eligibleLecturers
                  .filter((l) => l.lecturerId !== nv1 && l.lecturerId !== nv2)
                  .map((l) => {
                    const totalQuota = l.effectiveCapacity != null ? l.effectiveCapacity : (l.maxQuota || 0);
                    return (
                      <option key={l.lecturerId} value={l.lecturerId}>
                        {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity}/{totalQuota} chỗ]
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Secondary Criteria */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="step-num">3</span> Khai báo Tiêu chí phụ & Thông tin năng lực
          </h4>

          <div className="criteria-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Điểm GPA tích lũy (Hệ 4.0):</span>
                <span style={{ fontSize: '0.78rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  🔒 Đã khóa cứng theo hồ sơ đợt đồ án
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                className="form-input"
                style={{ backgroundColor: '#f8fafc', color: '#0a3273', fontWeight: 700, cursor: 'not-allowed' }}
                placeholder="VD: 3.45"
                disabled={true}
                readOnly={true}
                value={gpa}
              />
              <span className="form-help-text">
                Điểm GPA được lấy trực tiếp từ danh sách sinh viên đợt đồ án và khóa cứng để đảm bảo tính minh bạch, công bằng cho thuật toán phân công.
              </span>
            </div>

            <div className="form-group">
              <label>Tiêu chí phụ / Định hướng nghiên cứu / Kỹ năng nổi bật:</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ví dụ: Đã có chứng chỉ IELTS 6.5 / AWS Certified / Có kinh nghiệm làm dự án React, Spring Boot / Mong muốn làm về đề tài AI Agents..."
                disabled={isFormDisabled}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit-preference"
            disabled={isFormDisabled || loading}
            style={
              !canEdit
                ? { backgroundColor: '#94a3b8', cursor: 'not-allowed' }
                : hasSubmitted
                ? { backgroundColor: '#d97706', borderColor: '#b45309', color: '#fff' }
                : undefined
            }
          >
            {isRoundClosed
              ? '🔒 Đợt đồ án đã đóng (Không thể thao tác)'
              : isAssignmentFinalized
              ? '🔒 Đã chốt kết quả phân công (Không thể chỉnh sửa)'
              : submitting
              ? 'Đang lưu nguyện vọng...'
              : hasSubmitted
              ? '✏️ Chỉnh sửa & Lưu thay đổi nguyện vọng'
              : '🚀 Xác nhận & Nộp đăng ký nguyện vọng'}
          </button>
        </div>
      </form>
    </div>
  );
};
