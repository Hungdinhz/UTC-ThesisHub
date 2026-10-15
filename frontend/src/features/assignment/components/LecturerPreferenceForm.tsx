import React, { useState, useEffect } from 'react';
import type { Lecturer, PreferenceItem } from '../types/assignment.types';

interface Props {
  lecturers: Lecturer[];
  initialPreferences?: PreferenceItem[];
  onSubmit: (preferences: PreferenceItem[], extraCriteria: string) => void;
  disabled?: boolean;
}

export const LecturerPreferenceForm: React.FC<Props> = ({
  lecturers,
  initialPreferences = [],
  onSubmit,
  disabled = false,
}) => {
  // Store the selected lecturer IDs for each of the 3 priorities (1-indexed mapping to array 0-2)
  const [prefs, setPrefs] = useState<(number | '')[]>(['', '', '']);
  const [extraCriteria, setExtraCriteria] = useState('');

  useEffect(() => {
    if (initialPreferences && initialPreferences.length === 3) {
      const newPrefs: (number | '')[] = ['', '', ''];
      initialPreferences.forEach(p => {
        if (p.priorityOrder >= 1 && p.priorityOrder <= 3) {
          newPrefs[p.priorityOrder - 1] = p.lecturerId;
        }
      });
      setPrefs(newPrefs);
    }
  }, [initialPreferences]);

  const handleSelect = (priorityIndex: number, value: string) => {
    const newPrefs = [...prefs];
    newPrefs[priorityIndex] = value ? Number(value) : '';
    setPrefs(newPrefs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prefs.some(p => p === '')) {
      alert('Vui lòng chọn đủ 3 nguyện vọng.');
      return;
    }

    const uniquePrefs = new Set(prefs);
    if (uniquePrefs.size !== 3) {
      alert('Các nguyện vọng không được trùng nhau.');
      return;
    }

    const formattedPrefs: PreferenceItem[] = prefs.map((lecturerId, index) => ({
      lecturerId: lecturerId as number,
      priorityOrder: index + 1,
    }));

    onSubmit(formattedPrefs, extraCriteria);
  };

  return (
    <form onSubmit={handleSubmit} className="preference-form mt-4">
      <h3>Chọn nguyện vọng giảng viên</h3>
      
      {[1, 2, 3].map((priority) => (
        <div key={priority} className="mb-3">
          <label className="form-label">Nguyện vọng {priority}</label>
          <select
            value={prefs[priority - 1]}
            onChange={(e) => handleSelect(priority - 1, e.target.value)}
            disabled={disabled}
            className="form-select"
            required
          >
            <option value="" disabled>-- Chọn giảng viên --</option>
            {lecturers.map(l => (
              <option key={l.id} value={l.id}>
                {l.fullName} ({l.degree})
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="mb-3">
        <label className="form-label">Tiêu chí phụ (Tùy chọn)</label>
        <textarea
          value={extraCriteria}
          onChange={(e) => setExtraCriteria(e.target.value)}
          disabled={disabled}
          className="form-control"
          placeholder="Ví dụ: Ưu tiên nghiên cứu AI, IoT..."
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={disabled || prefs.some(p => p === '')}
      >
        Gửi Đăng Ký
      </button>
    </form>
  );
};
