import React, { useEffect, useState } from 'react';
import { RoundStudentsTab } from '../../project-round/components/RoundStudentsTab';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem } from '../../../types';
import '../../eligibility/pages/EligibilityPages.css';
import './AcademicStaffPages.css';

const readUrlQueryParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

export const EligibleStudentsPage: React.FC = () => {
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [initialStatusFilter] = useState<string>(() => readUrlQueryParam('status') || '');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedRound = rounds.find((r) => r.roundId === roundId) || null;

  useEffect(() => {
    (async () => {
      try {
        const list = await apiService.getProjectRounds();
        setRounds(list || []);
        const urlRoundRaw = readUrlQueryParam('roundId');
        const urlRoundNum = urlRoundRaw ? Number(urlRoundRaw) : NaN;
        const fromUrl = !isNaN(urlRoundNum) && list?.find((r) => r.roundId === urlRoundNum);
        const active =
          fromUrl ||
          list?.find((r) => r.status === 'IN_PROGRESS') ||
          list?.find((r) => r.status === 'OPEN') ||
          list?.[0];
        if (active) setRoundId(active.roundId);
      } catch {
        setNotification({ type: 'error', message: 'Không thể tải danh sách đợt đồ án' });
      }
    })();
  }, []);

  const isEngineer =
    selectedRound?.trainingProgram === 'KY_SU' ||
    selectedRound?.trainingProgramName?.toLowerCase().includes('kỹ sư') ||
    selectedRound?.name?.toLowerCase().includes('kỹ sư');

  return (
    <div className="feature-page-container">
      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Unified UTC Hero Header & Round Selector */}
      <div className="utc-stage-hero">
        <div className="utc-stage-hero-main">
          <div>
            <div className="utc-stage-eyebrow">
              <span>📋</span> GIAI ĐOẠN 1 • LẬP DANH SÁCH ĐỦ ĐIỀU KIỆN NHẬN ĐỒ ÁN
            </div>
            <h1 className="utc-stage-title">Danh sách sinh viên đủ điều kiện nhận đồ án</h1>
            <p className="utc-stage-subtitle">
              Quản lý hồ sơ sinh viên, nhập dữ liệu học vụ từ Excel và xét điều kiện nhận đồ án theo quy chế UTC (Nợ ≤ 10 TC, GPA ≥ 2.0, không nợ học phí &amp; không kỷ luật).
            </p>
          </div>
        </div>

        <div className="utc-round-control-bar">
          <div className="utc-round-select-group">
            <label htmlFor="staffRound">🗓️ Chọn đợt đồ án:</label>
            <select
              id="staffRound"
              className="utc-round-select"
              value={roundId ?? ''}
              onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
            >
              {rounds.length === 0 && <option value="">-- Chưa có đợt đồ án --</option>}
              {rounds.map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  {r.name} ({r.roundCode}) — {r.semester || ''} {r.academicYear || ''}
                </option>
              ))}
            </select>
          </div>

          {selectedRound && (
            <div className="utc-round-meta-pills">
              <span className={`utc-round-status-badge status-${(selectedRound.status || '').toLowerCase()}`}>
                {selectedRound.status === 'OPEN'
                  ? '● Đang mở'
                  : selectedRound.status === 'IN_PROGRESS'
                  ? '● Đang thực hiện'
                  : selectedRound.status === 'CLOSED'
                  ? '🔒 Đã đóng'
                  : selectedRound.status}
              </span>
              <span className="utc-round-program-pill">
                🎓 {selectedRound.trainingProgramName || (isEngineer ? 'Kỹ sư (tối đa 170 TC)' : 'Cử nhân (tối đa 132 TC)')}
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedRound ? (
        <RoundStudentsTab
          roundId={selectedRound.roundId}
          roundName={selectedRound.name}
          roundCode={selectedRound.roundCode}
          trainingProgram={selectedRound.trainingProgram}
          trainingProgramName={selectedRound.trainingProgramName}
          isRoundClosed={selectedRound.status === 'CLOSED' || selectedRound.status === 'ARCHIVED'}
          initialStatusFilter={initialStatusFilter}
        />
      ) : (
        <div className="utc-card-panel" style={{ textAlign: 'center', padding: '44px', color: '#64748b' }}>
          Vui lòng chọn một đợt đồ án để xem danh sách sinh viên.
        </div>
      )}
    </div>
  );
};
