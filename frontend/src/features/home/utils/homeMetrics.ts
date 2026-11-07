import { STAGES, calculateStageStatus } from '../../../utils/phaseTracking';
import type { MilestoneItem } from '../../../types';
import type { Task, ThesisProgressSummary } from '../../progress/types';

export type ExtendedStageStatus = 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' | 'FAILED';

export interface StageStepInfo {
  stageNumber: number;
  code: string;
  name: string;
  phaseType: string;
  description: string;
  status: ExtendedStageStatus;
  startDate?: string;
  endDate?: string;
  daysLeft?: number;
  route: string;
  lockedReason?: string;
}

export type RiskLevel = 'ON_TRACK' | 'BEHIND' | 'AT_RISK';

export interface TodoItem {
  id: string;
  title: string;
  subtitle?: string;
  dueDate?: string;
  daysLeft?: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  tag: string;
  tagColor: 'danger' | 'warning' | 'info' | 'primary' | 'success';
  actionLabel: string;
  actionRoute: string;
}

/**
 * Returns number of whole days from `now` until `targetDate`.
 * Negative if overdue, 0 if due today.
 */
export function daysUntil(targetDate?: string | Date | null, now: Date = new Date()): number | undefined {
  if (!targetDate) return undefined;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) return undefined;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
}

export function formatCountdown(days?: number): { text: string; tone: 'danger' | 'warning' | 'normal' | 'muted' } {
  if (days === undefined || days === null || isNaN(days)) {
    return { text: 'Chưa có hạn chót', tone: 'muted' };
  }
  if (days < 0) {
    return { text: `Quá hạn ${Math.abs(days)} ngày`, tone: 'danger' };
  }
  if (days === 0) {
    return { text: 'Hết hạn hôm nay', tone: 'danger' };
  }
  if (days <= 3) {
    return { text: `Còn ${days} ngày`, tone: 'danger' };
  }
  if (days <= 7) {
    return { text: `Còn ${days} ngày`, tone: 'warning' };
  }
  return { text: `Còn ${days} ngày`, tone: 'normal' };
}

export function getRouteForStage(stageNumber: number, role: string): string {
  const r = (role || 'student').toLowerCase();
  if (r === 'student') {
    switch (stageNumber) {
      case 1:
        return '/student/home';
      case 2:
        return '/student/assignment';
      case 3:
        return '/thesis/proposals';
      case 4:
        return '/progress/tasks';
      case 5:
        return '/admin/defense-schedules';
      default:
        return '/student/home';
    }
  }
  if (r === 'academic_staff') {
    switch (stageNumber) {
      case 1:
        return '/academic-staff/eligible-students';
      case 2:
      case 3:
      case 4:
        return '/academic-staff/eligible-students';
      case 5:
        return '/academic-staff/class-grades';
      default:
        return '/academic-staff/home';
    }
  }
  // supervisor / lecturer / committee_member
  switch (stageNumber) {
    case 1:
    case 2:
      return '/lecturer/home';
    case 3:
      return '/thesis/proposals';
    case 4:
      return '/progress/tasks';
    case 5:
      return '/admin/defense-scoring';
    default:
      return '/lecturer/home';
  }
}

export function buildStageSteps(params: {
  role: string;
  roundStage: number;
  userCompletedStage: number;
  isDropped?: boolean;
  milestones?: MilestoneItem[];
  now?: Date;
}): StageStepInfo[] {
  const { role, roundStage, userCompletedStage, isDropped = false, milestones = [], now = new Date() } = params;
  const r = (role || 'student').toLowerCase();

  return STAGES.map((stage) => {
    const num = stage.stageNumber;
    let status: ExtendedStageStatus = 'LOCKED';
    let lockedReason: string | undefined;

    if (r === 'student') {
      if (isDropped) {
        const failedStage = (userCompletedStage || 1) + 1;
        if (num < failedStage) {
          status = 'COMPLETED';
        } else if (num === failedStage) {
          status = 'FAILED';
          lockedReason = 'Không đạt giai đoạn này theo quy chế đồ án';
        } else {
          status = 'LOCKED';
          lockedReason = 'Đã dừng thực hiện trong đợt đồ án này';
        }
      } else {
        status = calculateStageStatus(num, roundStage, userCompletedStage);
        if (status === 'LOCKED') {
          lockedReason =
            roundStage < num
              ? 'Đợt đồ án chưa mở tới giai đoạn này'
              : 'Bạn cần hoàn thành giai đoạn trước đó';
        }
      }
    } else {
      // Lecturer, Committee, Academic Staff follow the round stage directly
      if (num < roundStage) {
        status = 'COMPLETED';
      } else if (num === roundStage) {
        status = 'IN_PROGRESS';
      } else {
        status = 'LOCKED';
        lockedReason = 'Đợt đồ án chưa chuyển sang giai đoạn này';
      }
    }

    const matchedMilestone = milestones.find((m) => {
      const pt = (m.phaseType || '').toUpperCase();
      if (num === 2) return pt === 'REGISTRATION';
      if (num === 3) return pt === 'PROPOSAL_SUBMISSION';
      if (num === 4) return pt === 'WEEKLY_REPORT' || pt === 'MIDTERM_REVIEW';
      if (num === 5) return pt === 'DEFENSE' || pt === 'ELIGIBILITY_REVIEW' || pt === 'COMMITTEE_ASSIGNMENT';
      return pt === stage.phaseType;
    });

    const daysLeft = matchedMilestone?.endDate ? daysUntil(matchedMilestone.endDate, now) : undefined;

    return {
      stageNumber: num,
      code: stage.code,
      name: stage.name,
      phaseType: stage.phaseType,
      description: stage.description,
      status,
      startDate: matchedMilestone?.startDate,
      endDate: matchedMilestone?.endDate,
      daysLeft,
      route: getRouteForStage(num, r),
      lockedReason,
    };
  });
}

export function calculateOverallStepPercent(steps: StageStepInfo[]): number {
  if (!steps.length) return 0;
  let score = 0;
  for (const s of steps) {
    if (s.status === 'COMPLETED') score += 1;
    else if (s.status === 'IN_PROGRESS') score += 0.5;
  }
  return Math.min(100, Math.round((score / steps.length) * 100));
}

export function classifyStudentRisk(
  summary: Partial<ThesisProgressSummary>,
  tasks: Task[] = [],
  milestone?: MilestoneItem | null,
  now: Date = new Date()
): RiskLevel {
  const completion = Number(summary.completionRate ?? summary.taskCompletionPercent ?? 0);

  let overdueCount = Number(summary.overdueTasksCount ?? 0);
  if (!summary.overdueTasksCount && tasks.length > 0) {
    overdueCount = tasks.filter((t) => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const d = daysUntil(t.dueDate, now);
      return d !== undefined && d < 0;
    }).length;
  }

  let expected = 40;
  if (milestone?.startDate && milestone?.endDate) {
    const start = new Date(milestone.startDate).getTime();
    const end = new Date(milestone.endDate).getTime();
    const cur = now.getTime();
    if (end > start) {
      const elapsed = Math.max(0, Math.min(1, (cur - start) / (end - start)));
      expected = Math.round(elapsed * 100);
    }
  }

  if (
    summary.latestAssessment === 'KHONG_DAT' ||
    overdueCount >= 2 ||
    completion < expected - 40
  ) {
    return 'AT_RISK';
  }

  if (
    summary.latestAssessment === 'CAN_CO_GANG' ||
    overdueCount >= 1 ||
    completion < expected - 20
  ) {
    return 'BEHIND';
  }

  return 'ON_TRACK';
}

const PRIORITY_WEIGHT: Record<TodoItem['priority'], number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function urgencyBucket(daysLeft?: number): number {
  if (daysLeft === undefined || daysLeft === null) return 2;
  if (daysLeft < 0) return 0; // overdue
  if (daysLeft <= 3) return 1; // due soon
  return 2;
}

export function sortTodoByUrgency(items: TodoItem[]): TodoItem[] {
  return [...items].sort((a, b) => {
    const bucketDiff = urgencyBucket(a.daysLeft) - urgencyBucket(b.daysLeft);
    if (bucketDiff !== 0) return bucketDiff;
    if (a.daysLeft !== undefined && b.daysLeft !== undefined && a.daysLeft !== b.daysLeft) {
      return a.daysLeft - b.daysLeft;
    }
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}
