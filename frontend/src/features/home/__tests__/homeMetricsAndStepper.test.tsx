import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  daysUntil,
  formatCountdown,
  buildStageSteps,
  calculateOverallStepPercent,
  classifyStudentRisk,
  sortTodoByUrgency,
  type TodoItem,
} from '../utils/homeMetrics';
import RoundProgressStepper from '../components/RoundProgressStepper';

describe('homeMetrics utilities', () => {
  it('calculates daysUntil and formatCountdown accurately', () => {
    const now = new Date('2026-11-07T10:00:00Z');
    expect(daysUntil('2026-11-10T10:00:00Z', now)).toBe(3);
    expect(daysUntil('2026-11-05T10:00:00Z', now)).toBe(-2);
    expect(formatCountdown(-2).tone).toBe('danger');
    expect(formatCountdown(2).tone).toBe('danger');
    expect(formatCountdown(5).tone).toBe('warning');
    expect(formatCountdown(12).tone).toBe('normal');
  });

  it('builds stage steps for student (normal and dropped)', () => {
    const normalSteps = buildStageSteps({
      role: 'student',
      roundStage: 4,
      userCompletedStage: 3,
      isDropped: false,
    });
    expect(normalSteps[0].status).toBe('COMPLETED');
    expect(normalSteps[2].status).toBe('COMPLETED');
    expect(normalSteps[3].status).toBe('IN_PROGRESS');
    expect(normalSteps[4].status).toBe('LOCKED');
    expect(calculateOverallStepPercent(normalSteps)).toBe(70);

    const droppedSteps = buildStageSteps({
      role: 'student',
      roundStage: 4,
      userCompletedStage: 2,
      isDropped: true,
    });
    expect(droppedSteps[1].status).toBe('COMPLETED');
    expect(droppedSteps[2].status).toBe('FAILED');
    expect(droppedSteps[3].status).toBe('LOCKED');
  });

  it('classifies student risk levels (ON_TRACK, BEHIND, AT_RISK)', () => {
    expect(
      classifyStudentRisk({
        completionRate: 75,
        overdueTasksCount: 0,
        latestAssessment: 'DAT',
      })
    ).toBe('ON_TRACK');

    expect(
      classifyStudentRisk({
        completionRate: 60,
        overdueTasksCount: 1,
      })
    ).toBe('BEHIND');

    expect(
      classifyStudentRisk({
        completionRate: 40,
        overdueTasksCount: 2,
      })
    ).toBe('AT_RISK');

    expect(
      classifyStudentRisk({
        completionRate: 80,
        overdueTasksCount: 0,
        latestAssessment: 'KHONG_DAT',
      })
    ).toBe('AT_RISK');
  });

  it('sorts todo items by overdue -> due soon -> priority', () => {
    const items: TodoItem[] = [
      {
        id: 'normal',
        title: 'Normal task',
        daysLeft: 10,
        priority: 'HIGH',
        tag: 'T',
        tagColor: 'info',
        actionLabel: 'Go',
        actionRoute: '/a',
      },
      {
        id: 'overdue',
        title: 'Overdue task',
        daysLeft: -1,
        priority: 'LOW',
        tag: 'T',
        tagColor: 'danger',
        actionLabel: 'Go',
        actionRoute: '/b',
      },
      {
        id: 'soon',
        title: 'Due soon task',
        daysLeft: 2,
        priority: 'MEDIUM',
        tag: 'T',
        tagColor: 'warning',
        actionLabel: 'Go',
        actionRoute: '/c',
      },
    ];

    const sorted = sortTodoByUrgency(items);
    expect(sorted.map((x) => x.id)).toEqual(['overdue', 'soon', 'normal']);
  });
});

describe('RoundProgressStepper component', () => {
  it('renders 5 stages and prevents clicking locked stages', () => {
    const onStepClick = vi.fn();
    render(
      <RoundProgressStepper
        role="student"
        roundStage={3}
        userCompletedStage={2}
        onStepClick={onStepClick}
      />
    );

    const step3 = screen.getByTestId('stepper-step-3');
    const step5 = screen.getByTestId('stepper-step-5');

    expect(step3).not.toBeDisabled();
    expect(step5).toBeDisabled();

    fireEvent.click(step5);
    expect(onStepClick).not.toHaveBeenCalled();

    fireEvent.click(step3);
    expect(onStepClick).toHaveBeenCalledTimes(1);
    expect(onStepClick.mock.calls[0][0].stageNumber).toBe(3);
  });
});
