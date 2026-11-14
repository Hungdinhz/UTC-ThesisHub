import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';
import {
  getRoundStageNumber,
  getStoredLecturerRoundId,
  pickBestLecturerRound,
} from '../../../utils/phaseTracking';
import { daysUntil } from '../utils/homeMetrics';
import type {
  ProjectRoundItem,
  MilestoneItem,
  StudentRoundStatusResponse,
} from '../../../types';

export interface RoundContextState {
  round: ProjectRoundItem | null;
  allRounds: ProjectRoundItem[];
  milestones: MilestoneItem[];
  roundStage: number;
  userCompletedStage: number;
  studentStatus: StudentRoundStatusResponse | null;
  currentMilestone?: MilestoneItem;
  daysLeftInMilestone?: number;
  loading: boolean;
  error?: string;
  reload: () => Promise<void>;
}

export function useRoundContext(role: string, roundIdOverride?: number): RoundContextState {
  const [round, setRound] = useState<ProjectRoundItem | null>(null);
  const [allRounds, setAllRounds] = useState<ProjectRoundItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [roundStage, setRoundStage] = useState<number>(0);
  const [userCompletedStage, setUserCompletedStage] = useState<number>(0);
  const [studentStatus, setStudentStatus] = useState<StudentRoundStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const normalizedRole = (role || 'student').toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      let resolvedRound: ProjectRoundItem | null = null;
      let resolvedStage = 0;
      let resolvedCompletedStage = 0;

      const isStaffOrAdmin = normalizedRole === 'academic_staff' || normalizedRole === 'admin';
      const isLecturerRole =
        normalizedRole === 'supervisor' ||
        normalizedRole === 'lecturer' ||
        normalizedRole === 'committee_member' ||
        normalizedRole === 'committee';

      let loadedRounds: ProjectRoundItem[] = [];
      if (isStaffOrAdmin || isLecturerRole) {
        const roundsRes = await apiService.getProjectRounds().catch(() => []);
        if (Array.isArray(roundsRes)) {
          loadedRounds = roundsRes;
          setAllRounds(roundsRes);
        }
      }

      if (roundIdOverride) {
        resolvedRound =
          loadedRounds.find((r) => r.roundId === roundIdOverride) ||
          (await apiService.getProjectRoundById(roundIdOverride).catch(() => null));
      }

      if (!resolvedRound && isLecturerRole && loadedRounds.length > 0) {
        resolvedRound = pickBestLecturerRound(loadedRounds, getStoredLecturerRoundId());
      }

      if (normalizedRole === 'student' && !roundIdOverride) {
        try {
          const myStatus = await apiService.getMyRoundStatus();
          setStudentStatus(myStatus);
          if (myStatus?.inRound && myStatus.roundId) {
            resolvedRound = await apiService.getProjectRoundById(myStatus.roundId).catch(() => null);
            resolvedStage =
              myStatus.roundCurrentStage ||
              (resolvedRound
                ? getRoundStageNumber(resolvedRound.currentMilestone?.phaseType, resolvedRound.status)
                : 2);
            resolvedCompletedStage = myStatus.completedStage ?? 1;
          } else if (myStatus && !myStatus.inRound) {
            resolvedRound = await apiService.getActiveProjectRound().catch(() => null);
            resolvedStage = resolvedRound
              ? getRoundStageNumber(resolvedRound.currentMilestone?.phaseType, resolvedRound.status)
              : 0;
            resolvedCompletedStage = 0;
          }
        } catch {
          // fallback below
        }
      }

      if (!resolvedRound) {
        resolvedRound = await apiService.getActiveProjectRound().catch(() => null);
      }

      if (resolvedRound) {
        setRound(resolvedRound);
        resolvedStage = getRoundStageNumber(
          resolvedRound.currentMilestone?.phaseType,
          resolvedRound.status
        );
        if (normalizedRole !== 'student') {
          resolvedCompletedStage = Math.max(resolvedStage - 1, 1);
        }
        setRoundStage(resolvedStage);
        setUserCompletedStage(resolvedCompletedStage);

        const ms =
          resolvedRound.milestones && resolvedRound.milestones.length > 0
            ? resolvedRound.milestones
            : await apiService.getRoundMilestones(resolvedRound.roundId).catch(() => []);

        const sortedMs = [...(ms || [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        setMilestones(sortedMs);
      } else {
        setRound(null);
        setMilestones([]);
        setRoundStage(0);
        setUserCompletedStage(0);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin đợt đồ án');
      setRound(null);
      setMilestones([]);
      setRoundStage(0);
      setUserCompletedStage(0);
    } finally {
      setLoading(false);
    }
  }, [normalizedRole, roundIdOverride]);

  useEffect(() => {
    load();
    const handler = () => {
      load();
    };
    window.addEventListener('utc-phase-change', handler);
    return () => window.removeEventListener('utc-phase-change', handler);
  }, [load]);

  const currentMilestone =
    round?.currentMilestone || milestones.find((m) => m.isActive) || undefined;
  const daysLeftInMilestone = currentMilestone?.endDate
    ? daysUntil(currentMilestone.endDate)
    : undefined;

  return {
    round,
    allRounds,
    milestones,
    roundStage,
    userCompletedStage,
    studentStatus,
    currentMilestone,
    daysLeftInMilestone,
    loading,
    error,
    reload: load,
  };
}
