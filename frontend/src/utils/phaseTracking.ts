export type StageStatus = 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';

export interface StageDefinition {
  stageNumber: number;
  code: string;
  name: string;
  phaseType: string;
  description: string;
  studentTabs: string[];
  lecturerTabs: string[];
}

export const STAGES: StageDefinition[] = [
  {
    stageNumber: 1,
    code: 'GD1',
    name: 'GĐ1: Đợt đồ án & Import SV',
    phaseType: 'DRAFT',
    description: 'Admin tạo đợt, import SV, khởi tạo GV',
    studentTabs: [],
    lecturerTabs: [],
  },
  {
    stageNumber: 2,
    code: 'GD2',
    name: 'GĐ2: Chọn Hướng & NV1–NV3',
    phaseType: 'REGISTRATION',
    description: 'Sinh viên chọn hướng và đăng ký GVHD; Admin phân công & chốt',
    studentTabs: ['student-assignment'],
    lecturerTabs: [],
  },
  {
    stageNumber: 3,
    code: 'GD3',
    name: 'GĐ3: Đề cương & Ký nộp PDF',
    phaseType: 'PROPOSAL_SUBMISSION',
    description: 'Sinh viên nộp đề cương; GVHD & Khoa duyệt',
    studentTabs: ['proposals'],
    lecturerTabs: ['proposals'],
  },
  {
    stageNumber: 4,
    code: 'GD4',
    name: 'GĐ4: Giao Task & Báo cáo tiến độ',
    phaseType: 'WEEKLY_REPORT',
    description: 'GVHD giao task & deadline; Sinh viên nộp bài làm; GVHD đánh giá',
    studentTabs: ['tasks'],
    lecturerTabs: ['tasks'],
  },
  {
    stageNumber: 5,
    code: 'GD5',
    name: 'GĐ5: Hội đồng & Lịch Bảo vệ',
    phaseType: 'DEFENSE',
    description: 'Xét điều kiện, xếp lịch hội đồng, chấm điểm & xuất biên bản PDF',
    studentTabs: ['defense-schedules', 'reservations'],
    lecturerTabs: ['thesis-detail', 'defense-scoring', 'defense-schedules'],
  },
];

/**
 * Maps a milestone phaseType or round status to a stage number (1 to 5).
 */
export function getRoundStageNumber(milestonePhaseType?: string, roundStatus?: string): number {
  if (!milestonePhaseType) {
    if (roundStatus === 'DRAFT') return 1;
    if (roundStatus === 'OPEN') return 2;
    if (roundStatus === 'IN_PROGRESS') return 3;
    return 2;
  }
  const pt = milestonePhaseType.toUpperCase();
  if (pt === 'REGISTRATION') return 2;
  if (pt === 'PROPOSAL_SUBMISSION') return 3;
  if (pt === 'WEEKLY_REPORT') return 4;
  if (pt === 'ELIGIBILITY_REVIEW' || pt === 'COMMITTEE_ASSIGNMENT' || pt === 'DEFENSE') return 5;
  return 2;
}

const STORAGE_PREFIX = 'utc_thesis_demo_user_stage_';

/**
 * Returns the highest stage number the user has marked completed.
 * Default:
 * - Student starts at 1 (has completed GĐ1, working on GĐ2).
 * - Lecturer starts at 2 (working on GĐ3).
 */
export function getUserCompletedStage(userId: string | number, role: string): number {
  const key = `${STORAGE_PREFIX}${userId}_${role}`;
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    const val = parseInt(stored, 10);
    if (!isNaN(val)) return val;
  }
  return role === 'student' ? 1 : 2;
}

/**
 * Updates the user's completed stage and triggers a phase change event if changed.
 */
export function setUserCompletedStage(userId: string | number, role: string, completedStage: number, silent = false): void {
  const key = `${STORAGE_PREFIX}${userId}_${role}`;
  const prev = localStorage.getItem(key);
  const nextStr = completedStage.toString();
  localStorage.setItem(key, nextStr);
  if (!silent && prev !== nextStr) {
    window.dispatchEvent(
      new CustomEvent('utc-phase-change', {
        detail: { userId, role, completedStage },
      })
    );
  }
}

/**
 * Resets user stage progress back to initial.
 */
export function resetUserStage(userId: string | number, role: string): void {
  const key = `${STORAGE_PREFIX}${userId}_${role}`;
  localStorage.removeItem(key);
  window.dispatchEvent(
    new CustomEvent('utc-phase-change', {
      detail: { userId, role, completedStage: role === 'student' ? 1 : 2 },
    })
  );
}

/**
 * Determines stage status ('COMPLETED' | 'IN_PROGRESS' | 'LOCKED') for an individual user:
 * - If stageNumber <= userCompletedStage: 'COMPLETED'
 * - If stageNumber === userCompletedStage + 1:
 *     - If roundCurrentStage >= stageNumber: 'IN_PROGRESS'
 *     - Otherwise: 'LOCKED' (round not reached yet)
 * - If stageNumber > userCompletedStage + 1: 'LOCKED' (prerequisite not completed)
 */
export function calculateStageStatus(
  stageNumber: number,
  roundCurrentStage: number,
  userCompletedStage: number
): StageStatus {
  if (stageNumber <= userCompletedStage) {
    return 'COMPLETED';
  }
  if (stageNumber === userCompletedStage + 1) {
    if (roundCurrentStage >= stageNumber) {
      return 'IN_PROGRESS';
    }
    return 'LOCKED';
  }
  return 'LOCKED';
}

/**
 * Helper to get stage number from a tab name.
 */
export function getStageNumberByTab(tab: string, role: string): number | null {
  if (role === 'student') {
    if (tab === 'student-assignment') return 2;
    if (tab === 'proposals') return 3;
    if (tab === 'tasks') return 4;
    if (tab === 'defense-schedules' || tab === 'reservations') return 5;
  } else if (role === 'supervisor' || role === 'lecturer') {
    if (tab === 'proposals') return 3;
    if (tab === 'tasks') return 4;
    if (tab === 'thesis-detail' || tab === 'defense-scoring' || tab === 'defense-schedules') return 5;
  }
  return null;
}
