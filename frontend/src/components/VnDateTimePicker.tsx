import React, { useState, useEffect, useRef } from 'react';

export interface VnDateTimePickerProps {
  value: string; // ISO string, YYYY-MM-DDTHH:mm, or DD/MM/YYYY HH:mm
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Parses Vietnamese date string (dd/mm/yyyy [hh:mm]) or ISO string into a Date object.
 */
export function parseVnDateTime(val?: string | null): Date | null {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;

  // Match dd/mm/yyyy hh:mm or dd/mm/yyyy
  const vnMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const hour = vnMatch[4] !== undefined ? parseInt(vnMatch[4], 10) : 0;
    const minute = vnMatch[5] !== undefined ? parseInt(vnMatch[5], 10) : 0;
    const d = new Date(year, month, day, hour, minute);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback to ISO string parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object to "dd/MM/yyyy HH:mm" (Vietnamese standard).
 */
export function formatVnDateTime(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * Formats a Date object to "YYYY-MM-DDTHH:mm" for standard ISO-compatible state.
 */
export function toLocalIsoString(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export const VnDateTimePicker: React.FC<VnDateTimePickerProps> = ({
  value,
  onChange,
  required,
  disabled,
  placeholder = 'dd/mm/yyyy hh:mm',
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse current date value
  const parsedDate = parseVnDateTime(value);
  const [displayText, setDisplayText] = useState<string>(() => formatVnDateTime(parsedDate));

  // Calendar navigation state
  const initialDate = parsedDate || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // Time state
  const [hour, setHour] = useState<number>(initialDate.getHours());
  const [minute, setMinute] = useState<number>(initialDate.getMinutes());

  // Synchronize display text when value changes from outside
  useEffect(() => {
    const d = parseVnDateTime(value);
    if (d) {
      setDisplayText(formatVnDateTime(d));
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setHour(d.getHours());
      setMinute(d.getMinutes());
    } else if (!value) {
      setDisplayText('');
    }
  }, [value]);

  // Close calendar popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection
  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, hour, minute);
    setDisplayText(formatVnDateTime(newDate));
    onChange(toLocalIsoString(newDate));
  };

  // Time change
  const handleTimeChange = (newHour: number, newMin: number) => {
    setHour(newHour);
    setMinute(newMin);
    const base = parseVnDateTime(value) || new Date(viewYear, viewMonth, 1);
    const newDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), newHour, newMin);
    setDisplayText(formatVnDateTime(newDate));
    onChange(toLocalIsoString(newDate));
  };

  // Quick: Today
  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setHour(today.getHours());
    setMinute(today.getMinutes());
    setDisplayText(formatVnDateTime(today));
    onChange(toLocalIsoString(today));
  };

  // Direct text input change
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setDisplayText(inputVal);
    const parsed = parseVnDateTime(inputVal);
    if (parsed) {
      onChange(toLocalIsoString(parsed));
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setHour(parsed.getHours());
      setMinute(parsed.getMinutes());
    }
  };

  const handleBlur = () => {
    // If text is not empty but parsed is valid, reformat nicely
    const parsed = parseVnDateTime(displayText);
    if (parsed) {
      setDisplayText(formatVnDateTime(parsed));
      onChange(toLocalIsoString(parsed));
    }
  };

  // Calendar calculation
  // Days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Day of week of the 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // Convert to Monday-first (0=Mon, 1=Tue, ..., 6=Sun)
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const isSelected = (day: number) => {
    if (!parsedDate) return false;
    return (
      parsedDate.getFullYear() === viewYear &&
      parsedDate.getMonth() === viewMonth &&
      parsedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <input
          id={id}
          type="text"
          required={required}
          disabled={disabled}
          value={displayText}
          onChange={handleTextInputChange}
          onBlur={handleBlur}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 36px 8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
            color: '#1e293b',
            backgroundColor: disabled ? '#f1f5f9' : '#fff',
            outline: 'none',
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          title="Chọn ngày trên lịch (Ngày/Tháng/Năm)"
          style={{
            position: 'absolute',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 0.8,
          }}
        >
          📅
        </button>
      </div>

      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
        Định dạng: <strong>ngày/tháng/năm</strong> (VD: 16/11/2026 09:30)
      </span>

      {/* CALENDAR DROPDOWN */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 1100,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            padding: '14px',
            width: '290px',
          }}
        >
          {/* Header: Month / Year + Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0a3273' }}>
              Tháng {viewMonth + 1} / {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>
          </div>

          {/* Weekday headers: T2, T3, T4, T5, T6, T7, CN */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              textAlign: 'center',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '6px',
            }}
          >
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div>T7</div>
            <div style={{ color: '#dc2626' }}>CN</div>
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '12px',
            }}
          >
            {/* Empty slots before first day */}
            {Array.from({ length: mondayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: '30px',
                    borderRadius: '6px',
                    border: today && !selected ? '1px solid #0a3273' : 'none',
                    backgroundColor: selected ? '#0a3273' : 'transparent',
                    color: selected ? '#ffffff' : today ? '#0a3273' : '#1e293b',
                    fontWeight: selected || today ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Row */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>⏰ Giờ:</span>
              <select
                value={hour}
                onChange={(e) => handleTimeChange(Number(e.target.value), minute)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  backgroundColor: '#fff',
                }}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={minute}
                onChange={(e) => handleTimeChange(hour, Number(e.target.value))}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  backgroundColor: '#fff',
                }}
              >
                {Array.from({ length: 12 }).map((_, m) => {
                  const minVal = m * 5;
                  return (
                    <option key={minVal} value={minVal}>
                      {String(minVal).padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSelectToday}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Hôm nay
            </button>
          </div>

          {/* Close button */}
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: '#0a3273',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VnDateTimePicker;
