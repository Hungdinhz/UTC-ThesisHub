import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoundContext } from '../hooks/useRoundContext';
import { thesisService } from '../../thesis/services/thesisService';
import { progressService } from '../../progress/services/progressService';
import { assignmentService } from '../../assignment/services/assignmentService';
import { defenseService } from '../../defense/services/defenseService';
import {
  daysUntil,
  sortTodoByUrgency,
  type TodoItem,
  type StageStepInfo,
} from '../utils/homeMetrics';
import RoundProgressStepper from '../components/RoundProgressStepper';
import {
  HomeWelcomeBanner,
  StatCard,
  HomeSection,
  ProgressRing,
  TodoList,
  QuickActions,
  RecentNotificationsWidget,
  type QuickActionItem,
} from '../components/HomeWidgets';
import type { Proposal, Thesis } from '../../thesis/types';
import type { Task, ThesisProgressSummary } from '../../progress/types';
import type { PreferenceResponse } from '../../assignment/types';
import type { DefenseSchedule, GraduationResult } from '../../defense/types';
import '../components/home.css';

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp chờ duyệt',
  ASSIGNED: 'Đang thẩm định',
  UNDER_REVIEW: 'Đang phản biện',
  APPROVED: 'Đã phê duyệt',
  REVISE_REQUIRED: 'Yêu cầu chỉnh sửa',
  REJECTED: 'Không đạt',
};

export const StudentHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    round,
    milestones,
    roundStage,
    userCompletedStage,
    studentStatus,
    currentMilestone,
    daysLeftInMilestone,
    loading: roundLoading,
  } = useRoundContext('student');

  const [preferences, setPreferences] = useState<PreferenceResponse[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [summary, setSummary] = useState<ThesisProgressSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mySchedule, setMySchedule] = useState<DefenseSchedule | null>(null);
  const [gradResult, setGradResult] = useState<GraduationResult | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const studentId =
    studentStatus?.studentId ||
    (user as any)?.student?.id ||
    (user as any)?.student_id ||
    user?.id;

  const isDropped = Boolean(studentStatus?.isDropped);

  const isStageLocked = (stageNumber: number): boolean => {
    if (!round) return true;
    if (isDropped) {
      const failedStage = (studentStatus?.completedStage || 1) + 1;
      if (stageNumber >= failedStage) return true;
    }
    if (stageNumber <= userCompletedStage) return false;
    if (stageNumber === userCompletedStage + 1 && roundStage >= stageNumber) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    let mounted = true;
    const loadStudentData = async () => {
      if (roundLoading) return;
      if (!round?.roundId || !studentId) {
        setPreferences([]);
        setProposal(null);
        setThesis(null);
        setSummary(null);
        setTasks([]);
        setMySchedule(null);
        setGradResult(null);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        const roundId = round.roundId;

        const [prefRes, propRes, thesisRes, allThesesRes, schedRes] =
          await Promise.allSettled([
            assignmentService.getPreferences(roundId, Number(studentId)),
            thesisService.getProposalByStudentAndRound(Number(studentId), roundId),
            thesisService.getThesisByStudentAndRound(Number(studentId), roundId),
            thesisService.searchTheses({ roundId }),
            defenseService.getSchedules(undefined, roundId),
          ]);

        if (!mounted) return;

        if (prefRes.status === 'fulfilled' && Array.isArray(prefRes.value)) {
          setPreferences(prefRes.value);
        }

        if (propRes.status === 'fulfilled' && propRes.value) {
          setProposal(propRes.value);
        }

        let resolvedThesis: Thesis | null =
          thesisRes.status === 'fulfilled' ? thesisRes.value : null;

        if (
          !resolvedThesis &&
          allThesesRes.status === 'fulfilled' &&
          Array.isArray(allThesesRes.value)
        ) {
          resolvedThesis =
            allThesesRes.value.find(
              (t) =>
                String(t.studentId) === String(studentId) ||
                (studentStatus?.studentCode &&
                  t.studentCode === studentStatus.studentCode)
            ) || null;
        }

        setThesis(resolvedThesis);

        if (resolvedThesis?.id) {
          const [sumRes, taskRes, gradRes] = await Promise.allSettled([
            progressService.getThesisProgressSummary(resolvedThesis.id),
            progressService.getTasksByThesis(resolvedThesis.id),
            defenseService.getGraduationResult(resolvedThesis.id),
          ]);

          if (!mounted) return;

          if (sumRes.status === 'fulfilled' && sumRes.value) {
            setSummary(sumRes.value);
          }
          if (taskRes.status === 'fulfilled' && Array.isArray(taskRes.value)) {
            setTasks(taskRes.value);
          }
          if (gradRes.status === 'fulfilled' && gradRes.value) {
            setGradResult(gradRes.value);
          }
        }

        if (schedRes.status === 'fulfilled' && Array.isArray(schedRes.value)) {
          const foundSchedule = schedRes.value.find(
            (s) =>
              (resolvedThesis?.id && s.thesisIds?.includes(resolvedThesis.id)) ||
              s.studentIds?.includes(Number(studentId)) ||
              s.assignedStudents?.some(
                (as) =>
                  String(as.studentId) === String(studentId) ||
                  (resolvedThesis?.id && as.thesisId === resolvedThesis.id)
              )
          );
          setMySchedule(foundSchedule || null);
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadStudentData();
    return () => {
      mounted = false;
    };
  }, [roundLoading, round?.roundId, studentId, studentStatus?.studentCode]);

  // Build Student Todo List
  const todoItems: TodoItem[] = [];
  if (!isDropped && round) {
    if (!isStageLocked(2) && preferences.length === 0 && !thesis) {
      todoItems.push({
        id: 'register-nv',
        title: 'Đăng ký hướng nghiên cứu & nguyện vọng GVHD (NV1–NV3)',
        subtitle: 'Giai đoạn 2 đang mở đăng ký',
        daysLeft: daysLeftInMilestone,
        priority: 'HIGH',
        tag: 'GĐ2 • Nguyện vọng',
        tagColor: 'primary',
        actionLabel: 'Đăng ký ngay',
        actionRoute: '/student/assignment',
      });
    }

    if (!isStageLocked(3)) {
      if (!proposal) {
        todoItems.push({
          id: 'create-proposal',
          title: 'Khởi tạo và nộp đề cương chi tiết đề tài',
          subtitle: 'Giai đoạn 3 • Xây dựng đề cương cùng GVHD',
          daysLeft: daysLeftInMilestone,
          priority: 'HIGH',
          tag: 'GĐ3 • Đề cương',
          tagColor: 'info',
          actionLabel: 'Soạn đề cương',
          actionRoute: '/thesis/proposals',
        });
      } else if (proposal.status === 'REVISE_REQUIRED' || proposal.status === 'DRAFT') {
        todoItems.push({
          id: 'revise-proposal',
          title:
            proposal.status === 'REVISE_REQUIRED'
              ? 'Chỉnh sửa đề cương theo góp ý của GVHD / Hội đồng'
              : 'Hoàn tất bản nháp và nộp đề cương',
          subtitle: proposal.supervisorComment || proposal.titleVn,
          daysLeft: daysUntil(proposal.revisionDeadline) ?? daysLeftInMilestone,
          priority: 'URGENT',
          tag: proposal.status === 'REVISE_REQUIRED' ? 'Cần sửa' : 'Bản nháp',
          tagColor: proposal.status === 'REVISE_REQUIRED' ? 'danger' : 'warning',
          actionLabel: 'Cập nhật đề cương',
          actionRoute: '/thesis/proposals',
        });
      } else if (proposal.status === 'APPROVED' && !proposal.studentSigned) {
        todoItems.push({
          id: 'sign-proposal',
          title: 'Ký số xác nhận bản đề cương PDF đã được phê duyệt',
          subtitle: proposal.titleVn,
          daysLeft: daysLeftInMilestone,
          priority: 'HIGH',
          tag: 'Chờ ký PDF',
          tagColor: 'warning',
          actionLabel: 'Ký nộp PDF',
          actionRoute: '/thesis/proposals',
        });
      }
    }

    for (const t of tasks) {
      if (t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'REVISE') {
        const dLeft = daysUntil(t.dueDate);
        const thesisQuery = thesis?.id ? `?thesisId=${thesis.id}` : '';
        todoItems.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle:
            t.status === 'REVISE'
              ? 'GVHD yêu cầu chỉnh sửa lại bài nộp'
              : `Công việc đồ án • Ưu tiên: ${t.priority}`,
          dueDate: t.dueDate,
          daysLeft: dLeft,
          priority: t.status === 'REVISE' ? 'URGENT' : t.priority,
          tag: t.status === 'REVISE' ? 'Yêu cầu sửa' : 'Task cần nộp',
          tagColor:
            t.status === 'REVISE' || (dLeft !== undefined && dLeft < 0)
              ? 'danger'
              : dLeft !== undefined && dLeft <= 3
              ? 'warning'
              : 'primary',
          actionLabel: t.status === 'REVISE' ? 'Nộp lại' : 'Thực hiện',
          actionRoute: `/progress/tasks${thesisQuery}`,
        });
      }
    }

    if (
      !isStageLocked(4) &&
      thesis?.id &&
      (summary?.totalProgressReports ?? 0) === 0
    ) {
      todoItems.push({
        id: 'submit-progress-report',
        title: 'Nộp báo cáo tiến độ định kỳ cho GVHD',
        subtitle: 'Cập nhật khối lượng công việc đã hoàn thành và kế hoạch tiếp theo',
        daysLeft: daysLeftInMilestone,
        priority: 'MEDIUM',
        tag: 'GĐ4 • Báo cáo',
        tagColor: 'info',
        actionLabel: 'Viết báo cáo',
        actionRoute: `/progress/reports?thesisId=${thesis.id}`,
      });
    }
  }

  const sortedTodos = sortTodoByUrgency(todoItems);

  // Upcoming deadlines (milestones + tasks due within 14 days)
  const deadlineItems: TodoItem[] = [];
  if (round) {
    for (const m of milestones) {
      const d = daysUntil(m.endDate);
      if (d !== undefined && d >= -2 && d <= 21) {
        deadlineItems.push({
          id: `ms-${m.milestoneId}`,
          title: m.name,
          subtitle: m.description || `Mốc đợt đồ án (${m.phaseType})`,
          dueDate: m.endDate,
          daysLeft: d,
          priority: d <= 3 ? 'HIGH' : 'MEDIUM',
          tag: m.isActive ? 'Mốc đang mở' : 'Mốc đợt',
          tagColor: d <= 3 ? 'danger' : m.isActive ? 'primary' : 'info',
          actionLabel: 'Xem chi tiết',
          actionRoute: '/student/home',
        });
      }
    }
    for (const t of tasks) {
      if (t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate) {
        const d = daysUntil(t.dueDate);
        if (d !== undefined && d <= 14) {
          deadlineItems.push({
            id: `dl-task-${t.id}`,
            title: `Hạn nộp task: ${t.title}`,
            subtitle: thesis?.titleVn,
            dueDate: t.dueDate,
            daysLeft: d,
            priority: t.priority,
            tag: 'Hạn Task',
            tagColor: d < 0 ? 'danger' : d <= 3 ? 'warning' : 'primary',
            actionLabel: 'Mở Task',
            actionRoute: `/progress/tasks${thesis?.id ? `?thesisId=${thesis.id}` : ''}`,
          });
        }
      }
    }
  }

  const sortedDeadlines = sortTodoByUrgency(deadlineItems).slice(0, 6);

  const completionPercent = Math.round(
    Number(summary?.completionRate ?? thesis?.completionRate ?? summary?.taskCompletionPercent ?? 0)
  );
  const completedTasksCount =
    summary?.completedTasks ??
    tasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTasksCount = summary?.totalTasks ?? tasks.length;

  const quickActions: QuickActionItem[] = [
    {
      id: 'qa-assignment',
      icon: '🎯',
      label: 'GĐ2: Chọn Hướng & NV1–NV3',
      subtitle: 'Đăng ký hướng & GVHD',
      route: '/student/assignment',
      disabled: isStageLocked(2),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Giai đoạn 2 hiện đang khóa',
    },
    {
      id: 'qa-proposal',
      icon: '📑',
      label: 'GĐ3: Đề cương & Ký PDF',
      subtitle: 'Soạn thảo & ký số đề cương',
      route: '/thesis/proposals',
      disabled: isStageLocked(3),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Cần hoàn thành GĐ2 trước khi mở Đề cương',
    },
    {
      id: 'qa-tasks',
      icon: '📋',
      label: 'GĐ4: Bảng Task & Nộp bài',
      subtitle: 'Nhận việc & nộp sản phẩm',
      route: `/progress/tasks${thesis?.id ? `?thesisId=${thesis.id}` : ''}`,
      disabled: isStageLocked(4),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Cần hoàn thành GĐ3 trước khi mở Bảng Task',
    },
    {
      id: 'qa-reports',
      icon: '📈',
      label: 'Báo cáo Tiến độ Định kỳ',
      subtitle: 'Báo cáo tuần/mốc cho GVHD',
      route: `/progress/reports${thesis?.id ? `?thesisId=${thesis.id}` : ''}`,
      disabled: isStageLocked(4),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Chưa mở giai đoạn thực hiện đồ án',
    },
    {
      id: 'qa-thesis-detail',
      icon: '📘',
      label: 'Chi tiết Đề tài của tôi',
      subtitle: 'Thông tin đề tài & tài liệu',
      route: `/thesis/detail${thesis?.id ? `?id=${thesis.id}` : ''}`,
      disabled: isStageLocked(3) || !thesis,
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : !thesis ? 'Bạn chưa có đề tài chính thức' : 'Chưa đến giai đoạn đề tài',
    },
    {
      id: 'qa-schedule',
      icon: '📅',
      label: 'GĐ5: Lịch Bảo vệ & Kết quả',
      subtitle: 'Xem phòng, hội đồng & điểm',
      route: '/admin/defense-schedules',
      disabled: isStageLocked(5),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Giai đoạn 5 (Bảo vệ) chưa mở',
    },
    {
      id: 'qa-reservation',
      icon: '⏸️',
      label: 'GĐ5: Đơn xin Bảo lưu',
      subtitle: 'Nộp & theo dõi đơn bảo lưu',
      route: '/student/reservation',
      disabled: isStageLocked(5),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Giai đoạn 5 chưa mở',
    },
    {
      id: 'qa-chat',
      icon: '💬',
      label: 'Nhóm Chat Hướng dẫn',
      subtitle: 'Trao đổi trực tiếp với GVHD',
      route: '/chat',
      disabled: !round,
      disabledReason: 'Chưa có đợt đồ án nào đang mở',
    },
  ];

  const handleStepClick = (step: StageStepInfo) => {
    navigate(step.route);
  };

  return (
    <div className="utc-home-container">
      <HomeWelcomeBanner
        icon="🎓"
        title={`Xin chào, ${
          studentStatus?.fullName || user?.fullName || user?.username || 'Sinh viên UTC'
        }`}
        roleBadge="STUDENT PORTAL"
        roundBadge={round ? `${round.name} (${round.roundCode})` : 'Chưa có đợt đồ án'}
        subtitle={
          <>
            Mã SV:{' '}
            <strong>
              {studentStatus?.studentCode || (user as any)?.student?.studentCode || '—'}
            </strong>{' '}
            • Theo dõi lộ trình 5 giai đoạn, tiến độ hoàn thành đề tài và các công việc cần nộp trong đợt.
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="utc-home-btn utc-home-btn-secondary"
              disabled={!round}
              title={!round ? 'Chưa có đợt đồ án nào đang mở' : 'Chat với GVHD'}
              onClick={() => {
                if (round) navigate('/chat');
              }}
            >
              💬 Chat với GVHD
            </button>
            <button
              type="button"
              className="utc-home-btn utc-home-btn-primary"
              disabled={!round || isDropped || isStageLocked(2)}
              title={
                !round
                  ? 'Chưa có đợt đồ án nào đang mở'
                  : isDropped
                  ? 'Bạn đã dừng thực hiện đợt đồ án'
                  : 'Vào giai đoạn hiện tại'
              }
              onClick={() => {
                if (!round || isDropped) return;
                navigate(
                  !isStageLocked(4)
                    ? `/progress/tasks${thesis?.id ? `?thesisId=${thesis.id}` : ''}`
                    : !isStageLocked(3)
                    ? '/thesis/proposals'
                    : '/student/assignment'
                );
              }}
            >
              🚀 Vào giai đoạn hiện tại
            </button>
          </>
        }
      />

      {gradResult && (
        <div
          style={{
            marginTop: '14px',
            marginBottom: '16px',
            padding: '18px 22px',
            borderRadius: '14px',
            background:
              gradResult.finalResult === 'PASSED'
                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border:
              gradResult.finalResult === 'PASSED'
                ? '2px solid #10b981'
                : '2px solid #ef4444',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: gradResult.finalResult === 'PASSED' ? '#047857' : '#b91c1c',
                marginBottom: '4px',
              }}
            >
              {gradResult.finalResult === 'PASSED'
                ? '🎓 ĐÃ TỐT NGHIỆP ĐỒ ÁN TỐT NGHIỆP'
                : '📋 KẾT QUẢ BẢO VỆ ĐỒ ÁN CHÍNH THỨC'}
            </div>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {gradResult.finalResult === 'PASSED'
                ? 'Chúc mừng bạn đã hoàn thành và đạt Đồ án Tốt nghiệp!'
                : 'Kết quả bảo vệ chưa đạt yêu cầu tốt nghiệp.'}
            </h3>
            <div style={{ fontSize: '0.88rem', color: '#334155' }}>
              Đề tài: <strong>{gradResult.thesisTitle || thesis?.titleVn || 'Đồ án tốt nghiệp'}</strong> •
              {' '}Các giai đoạn trước đó được lưu ở chế độ chỉ xem.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>ĐIỂM TỔNG KẾT</div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: gradResult.finalResult === 'PASSED' ? '#059669' : '#dc2626',
                  lineHeight: 1.1,
                }}
              >
                {Number(gradResult.finalScore).toFixed(2)}
              </div>
            </div>
            <div style={{ width: '1px', height: '36px', background: '#cbd5e1' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                Xếp loại: <strong style={{ color: '#0a3273' }}>{gradResult.grade}</strong>
              </div>
              <div
                style={{
                  marginTop: '3px',
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: gradResult.finalResult === 'PASSED' ? '#10b981' : '#ef4444',
                  color: '#fff',
                }}
              >
                {gradResult.finalResult === 'PASSED' ? 'ĐẠT TỐT NGHIỆP' : 'KHÔNG ĐẠT'}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDropped && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '5px solid #dc2626',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#991b1b',
          }}
        >
          <strong>❌ Thông báo học vụ:</strong> Bạn đã dừng thực hiện đồ án trong đợt này.
          {studentStatus?.note && <span> Lý do: {studentStatus.note}</span>}
        </div>
      )}

      <RoundProgressStepper
        role="student"
        round={round}
        roundStage={roundStage}
        userCompletedStage={userCompletedStage}
        isDropped={isDropped}
        milestones={milestones}
        currentMilestone={currentMilestone}
        daysLeftInMilestone={daysLeftInMilestone}
        title="Tiến độ Lộ trình Đồ án Cá nhân (5 Giai đoạn)"
        onStepClick={handleStepClick}
      />

      <div className="utc-kpi-grid">
        <StatCard
          label="Tiến độ Đề tài"
          value={`${completionPercent}%`}
          subtitle={
            !round
              ? 'Chưa có đợt đồ án'
              : isStageLocked(3)
              ? '🔒 Chưa tới giai đoạn đề tài'
              : thesis?.defenseEligible
              ? '✅ Đã đủ điều kiện bảo vệ'
              : 'Cần đạt tối thiểu 80% để bảo vệ'
          }
          icon="📊"
          accentColor="#0a3273"
          onClick={
            !isStageLocked(3) && thesis?.id
              ? () => navigate(`/thesis/detail?id=${thesis.id}`)
              : undefined
          }
        />
        <StatCard
          label="Task hoàn thành"
          value={`${completedTasksCount}/${totalTasksCount}`}
          subtitle={
            isStageLocked(4)
              ? '🔒 GĐ4 chưa mở'
              : `${sortedTodos.length} việc đang cần xử lý`
          }
          icon="📋"
          accentColor="#0284c7"
          onClick={
            !isStageLocked(4) && thesis?.id
              ? () => navigate(`/progress/tasks?thesisId=${thesis.id}`)
              : undefined
          }
        />
        <StatCard
          label="Trạng thái Đề cương"
          value={
            !round
              ? 'Chưa mở'
              : isStageLocked(3)
              ? '🔒 Chưa mở'
              : proposal
              ? PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status
              : 'Chưa nộp'
          }
          subtitle={
            isStageLocked(3)
              ? 'Giai đoạn 3 chưa mở'
              : proposal?.studentSigned
              ? '✓ Đã ký số PDF'
              : proposal
              ? `Phiên bản v${proposal.version}`
              : 'Giai đoạn 3'
          }
          icon="📑"
          accentColor="#7c3aed"
          onClick={!isStageLocked(3) ? () => navigate('/thesis/proposals') : undefined}
        />
        <StatCard
          label="Báo cáo Tiến độ"
          value={summary?.totalProgressReports ?? 0}
          subtitle={
            isStageLocked(4)
              ? '🔒 GĐ4 chưa mở'
              : summary?.latestAssessment
              ? `Đánh giá gần nhất: ${summary.latestAssessment}`
              : 'Báo cáo định kỳ với GVHD'
          }
          icon="📈"
          accentColor="#059669"
          onClick={
            !isStageLocked(4) && thesis?.id
              ? () => navigate(`/progress/reports?thesisId=${thesis.id}`)
              : undefined
          }
        />
      </div>

      <div className="utc-home-two-col">
        {/* My Thesis / Current Stage Summary */}
        <HomeSection
          title="Đề tài & Tiến độ của tôi"
          icon="📘"
          loading={dataLoading}
          headerRight={
            thesis && !isStageLocked(3) ? (
              <button
                type="button"
                className="utc-home-btn utc-home-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => navigate(`/thesis/detail?id=${thesis.id}`)}
              >
                Chi tiết đề tài →
              </button>
            ) : undefined
          }
        >
          {!round || (studentStatus && !studentStatus.inRound) ? (
            <div className="utc-home-empty">
              Bạn hiện chưa có tên trong danh sách đợt đồ án đang mở. Vui lòng liên hệ Giáo vụ khoa nếu có thắc mắc.
            </div>
          ) : thesis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                <ProgressRing
                  percent={completionPercent}
                  color={completionPercent >= 80 ? '#16a34a' : '#0a3273'}
                  label="Hoàn thành"
                />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
                    MÃ ĐỀ TÀI: {thesis.thesisCode || `#${thesis.id}`}
                  </div>
                  <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', color: '#0f172a' }}>
                    {thesis.titleVn}
                  </h4>
                  <div style={{ fontSize: '0.86rem', color: '#475569' }}>
                    👨‍🏫 GVHD:{' '}
                    <strong>
                      {thesis.lecturerDegree ? `${thesis.lecturerDegree}. ` : ''}
                      {thesis.lecturerFullName || summary?.lecturerFullName || 'Đã phân công'}
                    </strong>
                  </div>
                </div>
              </div>

              {mySchedule && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.86rem',
                    color: '#1e3a8a',
                  }}
                >
                  <strong>📅 Lịch bảo vệ của bạn:</strong> Ngày {mySchedule.defenseDate} (
                  {mySchedule.session === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}) • Phòng{' '}
                  <strong>{mySchedule.room}</strong> • {mySchedule.councilName}
                </div>
              )}

              {gradResult && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.86rem',
                    color: '#14532d',
                  }}
                >
                  <strong>🏆 Kết quả bảo vệ:</strong> Điểm tổng kết{' '}
                  <strong>{gradResult.finalScore}</strong> ({gradResult.grade}) —{' '}
                  {gradResult.finalResult === 'PASSED' ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!isStageLocked(4) && (
                  <>
                    <button
                      type="button"
                      className="utc-home-btn utc-home-btn-primary"
                      onClick={() => navigate(`/progress/tasks?thesisId=${thesis.id}`)}
                    >
                      📋 Mở Bảng Task ({completedTasksCount}/{totalTasksCount})
                    </button>
                    <button
                      type="button"
                      className="utc-home-btn utc-home-btn-secondary"
                      onClick={() => navigate(`/progress/reports?thesisId=${thesis.id}`)}
                    >
                      📈 Báo cáo tiến độ
                    </button>
                  </>
                )}
                {!isStageLocked(3) && (
                  <button
                    type="button"
                    className="utc-home-btn utc-home-btn-secondary"
                    onClick={() => navigate('/thesis/proposals')}
                  >
                    📑 Xem Đề cương PDF
                  </button>
                )}
              </div>
            </div>
          ) : proposal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed' }}>
                ĐỀ CƯƠNG ĐỀ TÀI ({PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status})
              </div>
              <h4 style={{ margin: 0, fontSize: '1.03rem', color: '#0f172a' }}>
                {proposal.titleVn}
              </h4>
              <div style={{ fontSize: '0.86rem', color: '#475569' }}>
                GVHD: <strong>{proposal.lecturerFullName || '—'}</strong>
              </div>
              <button
                type="button"
                className="utc-home-btn utc-home-btn-primary"
                style={{ alignSelf: 'flex-start' }}
                disabled={isStageLocked(3)}
                onClick={() => {
                  if (!isStageLocked(3)) navigate('/thesis/proposals');
                }}
              >
                📑 Mở trang Đề cương →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                {preferences.length > 0 ? (
                  <>
                    Bạn đã đăng ký <strong>{preferences.length}</strong> nguyện vọng GVHD trong Giai đoạn 2. Vui lòng chờ Khoa công bố kết quả phân công chính thức.
                  </>
                ) : (
                  <>
                    Bạn chưa có đề tài chính thức. Hãy bắt đầu bằng việc chọn hướng nghiên cứu và đăng ký nguyện vọng GVHD (NV1–NV3).
                  </>
                )}
              </div>
              <button
                type="button"
                className="utc-home-btn utc-home-btn-primary"
                style={{ alignSelf: 'flex-start' }}
                disabled={isStageLocked(2)}
                onClick={() => {
                  if (!isStageLocked(2)) navigate('/student/assignment');
                }}
              >
                🎯 Đi tới Đăng ký Nguyện vọng →
              </button>
            </div>
          )}
        </HomeSection>

        {/* Actionable Todo List */}
        <HomeSection
          title="Việc cần làm ngay"
          icon="✅"
          badgeCount={sortedTodos.length}
          loading={dataLoading}
        >
          <TodoList
            items={sortedTodos}
            emptyMessage={
              !round
                ? 'Hiện chưa có đợt đồ án nào được kích hoạt.'
                : '🎉 Tuyệt vời! Hiện không có công việc tồn đọng nào.'
            }
            onAction={(route) => navigate(route)}
          />
        </HomeSection>
      </div>

      <div className="utc-home-two-col">
        <HomeSection
          title="Mốc thời gian & Hạn chót sắp tới"
          icon="⏰"
          badgeCount={sortedDeadlines.length}
          loading={roundLoading || dataLoading}
        >
          <TodoList
            items={sortedDeadlines}
            emptyMessage={
              !round
                ? 'Chưa có mốc thời gian nào.'
                : 'Không có hạn chót nào trong 14 ngày tới.'
            }
            onAction={(route) => navigate(route)}
          />
        </HomeSection>

        <RecentNotificationsWidget onNavigate={(route) => navigate(route)} />
      </div>

      <HomeSection title="Lối tắt thao tác theo giai đoạn" icon="⚡">
        <QuickActions actions={quickActions} onNavigate={(route) => navigate(route)} />
      </HomeSection>
    </div>
  );
};

export default StudentHomePage;
