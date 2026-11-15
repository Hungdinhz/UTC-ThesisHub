import React, { useEffect, useState } from 'react';
import { RoundStudentsTab } from '../../project-round/components/RoundStudentsTab';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem } from '../../../types';
import '../../eligibility/pages/EligibilityPages.css';
import './AcademicStaffPages.css';

export const EligibleStudentsPage: React.FC = () => {
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedRound = rounds.find((r) => r.roundId === roundId) || null;

  useEffect(() => {
    (async () => {
      try {
        const list = await apiService.getProjectRounds();
        setRounds(list || []);
        const active =
          list?.find((r) => r.status === 'OPEN') ||
          list?.find((r) => r.status === 'IN_PROGRESS') ||
          list?.[0];
        if (active) setRoundId(active.roundId);
      } catch {
        setNotification({ type: 'error', message: 'Không thể tải danh sách đợt đồ án' });
      }
    })();
  }, []);

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Danh sách sinh viên đủ điều kiện nhận đồ án</h1>
          <p className="feature-page-subtitle">
            Quản lý danh sách sinh viên và dữ liệu học vụ nhận đồ án.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      <div className="feature-filter-card" style={{ marginBottom: '20px' }}>
        <div className="filter-item" style={{ minWidth: '320px' }}>
          <label htmlFor="staffRound" style={{ fontWeight: 600 }}>Chọn đợt đồ án:</label>
          <select
            id="staffRound"
            className="form-control"
            value={roundId ?? ''}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
          >
            {rounds.length === 0 && <option value="">-- Chưa có đợt đồ án --</option>}
            {rounds.map((r) => (
              <option key={r.roundId} value={r.roundId}>
                {r.name} ({r.roundCode})
              </option>
            ))}
          </select>
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
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Vui lòng chọn một đợt đồ án để xem danh sách sinh viên.
        </div>
      )}
    </div>
  );
};
