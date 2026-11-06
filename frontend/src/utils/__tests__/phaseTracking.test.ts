import { describe, it, expect } from 'vitest';
import {
  getRoundStageNumber,
  calculateStageStatus,
  getStageNumberByTab,
  STAGES,
} from '../phaseTracking';

describe('getRoundStageNumber', () => {
  it('trả về GĐ1 khi đợt DRAFT và chưa có mốc timeline nào', () => {
    expect(getRoundStageNumber(undefined, 'DRAFT')).toBe(1);
    expect(getRoundStageNumber(null as unknown as string, 'DRAFT')).toBe(1);
    expect(getRoundStageNumber('', 'DRAFT')).toBe(1);
  });

  it('trả về GĐ1 khi đợt OPEN nhưng chưa thiết lập mốc timeline (chưa chọn gì)', () => {
    expect(getRoundStageNumber(undefined, 'OPEN')).toBe(1);
    expect(getRoundStageNumber('', 'OPEN')).toBe(1);
    expect(getRoundStageNumber('   ', 'OPEN')).toBe(1);
  });

  it('trả về GĐ1 khi đợt IN_PROGRESS nhưng chưa có mốc timeline đang chạy', () => {
    expect(getRoundStageNumber(undefined, 'IN_PROGRESS')).toBe(1);
  });

  it('trả về GĐ1 khi không có thông tin gì cả', () => {
    expect(getRoundStageNumber(undefined, undefined)).toBe(1);
    expect(getRoundStageNumber(undefined, '')).toBe(1);
  });

  it('trả về GĐ1 khi phaseType không xác định được', () => {
    expect(getRoundStageNumber('SOME_UNKNOWN_PHASE', 'OPEN')).toBe(1);
  });

  it('trả về đúng giai đoạn theo phaseType của mốc timeline đang chạy', () => {
    expect(getRoundStageNumber('REGISTRATION', 'OPEN')).toBe(2);
    expect(getRoundStageNumber('PROPOSAL_SUBMISSION', 'IN_PROGRESS')).toBe(3);
    expect(getRoundStageNumber('WEEKLY_REPORT', 'IN_PROGRESS')).toBe(4);
    expect(getRoundStageNumber('ELIGIBILITY_REVIEW', 'IN_PROGRESS')).toBe(5);
    expect(getRoundStageNumber('COMMITTEE_ASSIGNMENT', 'IN_PROGRESS')).toBe(5);
    expect(getRoundStageNumber('DEFENSE', 'IN_PROGRESS')).toBe(5);
  });
});

describe('calculateStageStatus', () => {
  it('GĐ1 là IN_PROGRESS khi người dùng chưa hoàn thành giai đoạn nào và đợt đã mở', () => {
    expect(calculateStageStatus(1, 1, 0)).toBe('IN_PROGRESS');
  });

  it('GĐ2 trở đi bị khóa khi người dùng chưa hoàn thành giai đoạn nào', () => {
    expect(calculateStageStatus(2, 1, 0)).toBe('LOCKED');
    expect(calculateStageStatus(3, 1, 0)).toBe('LOCKED');
  });

  it('GĐ1 là COMPLETED khi người dùng đã hoàn thành GĐ1', () => {
    expect(calculateStageStatus(1, 2, 1)).toBe('COMPLETED');
  });

  it('GĐ2 là IN_PROGRESS khi người dùng đã xong GĐ1 và đợt đang ở GĐ2', () => {
    expect(calculateStageStatus(2, 2, 1)).toBe('IN_PROGRESS');
  });

  it('GĐ2 bị khóa khi đợt chưa tới GĐ2', () => {
    expect(calculateStageStatus(2, 1, 1)).toBe('LOCKED');
  });
});

describe('getStageNumberByTab', () => {
  it(' ánh xạ tab của sinh viên sang đúng giai đoạn', () => {
    expect(getStageNumberByTab('student-assignment', 'student')).toBe(2);
    expect(getStageNumberByTab('proposals', 'student')).toBe(3);
    expect(getStageNumberByTab('tasks', 'student')).toBe(4);
    expect(getStageNumberByTab('defense-schedules', 'student')).toBe(5);
  });

  it('trả về null cho tab không thuộc giai đoạn nào', () => {
    expect(getStageNumberByTab('chat', 'student')).toBeNull();
  });
});

describe('STAGES', () => {
  it('có đủ 5 giai đoạn, GĐ1 là giai đoạn đầu tiên', () => {
    expect(STAGES).toHaveLength(5);
    expect(STAGES[0].stageNumber).toBe(1);
    expect(STAGES[0].code).toBe('GD1');
  });
});
