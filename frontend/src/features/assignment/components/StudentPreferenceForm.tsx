import React, { useState, useEffect } from 'react';
import type { ProjectDirection, LecturerCapacity } from '../types';

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
}

export const StudentPreferenceForm: React.FC<Props> = ({
  directions,
  capacities,
  onSubmit,
  studentProgram = 'CU_NHAN',
  loading,
}) => {
  const [selectedDirectionId, setSelectedDirectionId] = useState<number | ''>('');
  const [nv1, setNv1] = useState<number | ''>('');
  const [nv2, setNv2] = useState<number | ''>('');
  const [nv3, setNv3] = useState<number | ''>('');
  const [gpa, setGpa] = useState<string>('3.2');
  const [criteria, setCriteria] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-select first direction if available
  useEffect(() => {
    if (directions.length > 0 && selectedDirectionId === '') {
      setSelectedDirectionId(directions[0].id);
    }
  }, [directions, selectedDirectionId]);

  // Selected direction object
  const currentDirection = directions.find((d) => d.id === selectedDirectionId);

  // Filter eligible lecturers based on direction and training program degree constraint
  const eligibleLecturers = capacities.filter((c) => {
    // If direction has directionNames, check if direction matches
    if (currentDirection && c.directionNames && c.directionNames.length > 0) {
      return (
        c.directionNames.includes(currentDirection.code) ||
        c.directionNames.includes(currentDirection.name)
      );
    }
    return true; // Fallback to all if not specifically mapped
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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
      setSuccessMessage('Đăng ký hướng đồ án và nộp nguyện vọng thành công!');
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
        <div className="banner-icon">📝</div>
        <div>
          <h3>Đăng ký Hướng đồ án & Nguyện vọng Giảng viên hướng dẫn</h3>
          <p className="text-muted text-sm">
            Sinh viên lựa chọn hướng chuyên môn và đăng ký tối đa 3 nguyện vọng giảng viên.
            {studentProgram === 'KY_SU' && (
              <span className="badge-kysu-note">
                Chương trình Kỹ sư: Yêu cầu GVHD có học vị Tiến sĩ (TS/PGS/GS) trở lên.
              </span>
            )}
          </p>
        </div>
      </div>

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
                }`}
              >
                <input
                  type="radio"
                  name="direction"
                  value={d.id}
                  checked={selectedDirectionId === d.id}
                  onChange={() => {
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
                    <span className="lecturer-tag">{d.lecturerCount || 0} GV</span>
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
          <h4 className="section-title">
            <span className="step-num">2</span> Chọn Nguyện vọng Giảng viên hướng dẫn (NV1 → NV3)
          </h4>

          <div className="preferences-form-grid">
            <div className="pref-input-block">
              <label className="pref-label nv1-text">
                Nguyện vọng 1 (Ưu tiên cao nhất) <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={nv1}
                onChange={(e) => setNv1(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">-- Chọn Giảng viên NV1 --</option>
                {eligibleLecturers.map((l) => (
                  <option key={l.lecturerId} value={l.lecturerId}>
                    {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity} chỗ]
                  </option>
                ))}
              </select>
            </div>

            <div className="pref-input-block">
              <label className="pref-label nv2-text">Nguyện vọng 2 (Dự phòng 1)</label>
              <select
                className="form-select"
                value={nv2}
                onChange={(e) => setNv2(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn Giảng viên NV2 (Tùy chọn) --</option>
                {eligibleLecturers
                  .filter((l) => l.lecturerId !== nv1)
                  .map((l) => (
                    <option key={l.lecturerId} value={l.lecturerId}>
                      {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity} chỗ]
                    </option>
                  ))}
              </select>
            </div>

            <div className="pref-input-block">
              <label className="pref-label nv3-text">Nguyện vọng 3 (Dự phòng 2)</label>
              <select
                className="form-select"
                value={nv3}
                onChange={(e) => setNv3(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn Giảng viên NV3 (Tùy chọn) --</option>
                {eligibleLecturers
                  .filter((l) => l.lecturerId !== nv1 && l.lecturerId !== nv2)
                  .map((l) => (
                    <option key={l.lecturerId} value={l.lecturerId}>
                      {l.fullName} ({l.academicDegree} - {l.departmentName}) [Còn {l.remainingCapacity} chỗ]
                    </option>
                  ))}
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
              <label>Điểm GPA tích lũy (Hệ 4.0):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                className="form-input"
                placeholder="VD: 3.45"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
              />
              <span className="form-help-text">
                Thuật toán sử dụng điểm GPA để xếp hạng ưu tiên khi có nhiều sinh viên cùng chọn 1 GV.
              </span>
            </div>

            <div className="form-group">
              <label>Tiêu chí phụ / Định hướng nghiên cứu / Kỹ năng nổi bật:</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ví dụ: Đã có chứng chỉ IELTS 6.5 / AWS Certified / Có kinh nghiệm làm dự án React, Spring Boot / Mong muốn làm về đề tài AI Agents..."
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit-preference" disabled={submitting || loading}>
            {submitting ? 'Đang gửi đăng ký...' : '🚀 Xác nhận & Nộp đăng ký nguyện vọng'}
          </button>
        </div>
      </form>
    </div>
  );
};
