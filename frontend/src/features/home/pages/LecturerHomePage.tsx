import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoundContext } from '../hooks/useRoundContext';
import {
  getStoredLecturerRoundId,
  setStoredLecturerRoundId,
} from '../../../utils/phaseTracking';
import { thesisService } from '../../thesis/services/thesisService';
import { progressService } from '../../progress/services/progressService';
import { defenseService } from '../../defense/services/defenseService';
import {
  classifyStudentRisk,
  sortTodoByUrgency,
  type RiskLevel,
  type TodoItem,
  type StageStepInfo,
} from '../utils/homeMetrics';
import RoundProgressStepper from '../components/RoundProgressStepper';
import {
  HomeWelcomeBanner,
  StatCard,
  HomeSection,
  TodoList,
  QuickActions,
  RecentNotificationsWidget,
  type QuickActionItem,
} from '../components/HomeWidgets';
import { getCouncilRoleLabel } from '../../defense/types';
import type { Proposal, Thesis } from '../../thesis/types';
import type { ThesisProgressSummary } from '../../progress/types';
import type { DefenseSchedule, MyScoringThesis } from '../../defense/types';
import '../components/home.css';

interface StudentRowItem {
  thesisId: number;
  thesisCode: string;
  thesisTitle: string;
  studentId: number;
  studentCode: string;
  studentFullName: string;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  submittedTasksCount: number;
  overdueTasksCount: number;
  unreviewedReportsCount: number;
  totalReports: number;
  latestAssessment?: string;
  latestReportAt?: string;
  defenseEligible: boolean;
  risk: RiskLevel;
}

const RISK_ORDER: Record<RiskLevel, number> = {
  AT_RISK: 0,
  BEHIND: 1,
  ON_TRACK: 2,
};

export const LecturerHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const isCommitteeRole =
    userType === 'committee_member' ||
    (user as any)?.role?.name?.toLowerCase()?.includes('committee');

  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>(() =>
    getStoredLecturerRoundId(user?.id || (user as any)?.user_id || user?.username)
  );

  const {
    round,
    allRounds,
    milestones,
    roundStage,
    userCompletedStage,
    currentMilestone,
    daysLeftInMilestone,
    loading: roundLoading,
  } = useRoundContext(isCommitteeRole ? 'committee_member' : 'supervisor', selectedRoundId);

  const [studentRows, setStudentRows] = useState<StudentRowItem[]>([]);
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [mySchedules, setMySchedules] = useState<DefenseSchedule[]>([]);
  const [scoringTheses, setScoringTheses] = useState<MyScoringThesis[]>([]);
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const lecturerId =
    (user as any)?.lecturer?.id ||
    (user as any)?.lecturer_id ||
    user?.id;
  const lecturerCode =
    (user as any)?.lecturer?.lecturer_code ||
    (user as any)?.lecturerCode ||
    user?.username;
  const lecturerFullName = (user?.fullName || '').trim().toLowerCase();

  const isStageLocked = (stageNum: number) => !round || roundStage < stageNum;

  useEffect(() => {
    let mounted = true;
    const loadLecturerData = async () => {
      if (roundLoading) return;
      if (!round) {
        setStudentRows([]);
        setPendingProposals([]);
        setMySchedules([]);
        setScoringTheses([]);
        setDataLoading(false);
        return;
      }
      setDataLoading(true);
      try {
        const roundId = round.roundId;

        const [batchSummariesRes, allThesesRes, proposalsRes, schedulesRes, scoringRes] =
          await Promise.allSettled([
            progressService.getProgressSummaries({
              roundId,
              lecturerId: lecturerId ? Number(lecturerId) : undefined,
            }),
            thesisService.searchTheses({ roundId }),
            thesisService.searchProposals({ roundId }),
            defenseService.getSchedules(undefined, roundId),
            defenseService.getMyScoringTheses(roundId),
          ]);

        if (!mounted) return;

        // Filter proposals belonging to this lecturer that are waiting for confirmation
        if (proposalsRes.status === 'fulfilled' && Array.isArray(proposalsRes.value)) {
          const mine = proposalsRes.value.filter((p) => {
            const matchesLecturer =
              (lecturerId && String(p.lecturerId) === String(lecturerId)) ||
              (lecturerCode && p.lecturerCode === lecturerCode) ||
              (lecturerFullName &&
                p.lecturerFullName &&
                p.lecturerFullName.trim().toLowerCase() === lecturerFullName);
            return matchesLecturer && p.status === 'SUBMITTED' && !p.supervisorApproved;
          });
          setPendingProposals(mine);
        }

        // Build student progress rows: prefer batch summaries endpoint, fallback to per-thesis
        let summaries: ThesisProgressSummary[] =
          batchSummariesRes.status === 'fulfilled' && Array.isArray(batchSummariesRes.value)
            ? batchSummariesRes.value
            : [];

        const allTheses: Thesis[] =
          allThesesRes.status === 'fulfilled' && Array.isArray(allThesesRes.value)
            ? allThesesRes.value
            : [];

        const myTheses = allTheses.filter(
          (t) =>
            (lecturerId && String(t.lecturerId) === String(lecturerId)) ||
            (lecturerCode && t.lecturerCode === lecturerCode) ||
            (lecturerFullName &&
              t.lecturerFullName &&
              t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
        );

        const activeMil =
          milestones.find((m) => m.phaseType === 'WEEKLY_REPORT') || currentMilestone;

        if (summaries.length === 0 && myTheses.length > 0) {
          // Fallback if batch endpoint is unavailable
          const fallbackRows = await Promise.all(
            myTheses.slice(0, 15).map(async (t) => {
              const [sum, tks, rpts] = await Promise.all([
                progressService.getThesisProgressSummary(t.id).catch(() => null),
                progressService.getTasksByThesis(t.id).catch(() => []),
                progressService.getReportsByThesis(t.id).catch(() => []),
              ]);
              const submittedTasksCount = (tks || []).filter(
                (x) => x.status === 'SUBMITTED'
              ).length;
              const overdueTasksCount = (tks || []).filter(
                (x) =>
                  x.status !== 'COMPLETED' &&
                  x.status !== 'CANCELLED' &&
                  x.dueDate &&
                  new Date(x.dueDate).getTime() < Date.now()
              ).length;
              const unreviewedReportsCount = (rpts || []).filter(
                (r) => r.status === 'SUBMITTED' && !r.feedback
              ).length;

              const completionRate = Number(
                sum?.completionRate ?? t.completionRate ?? sum?.taskCompletionPercent ?? 0
              );

              const risk = classifyStudentRisk(
                {
                  completionRate,
                  overdueTasksCount,
                  latestAssessment: sum?.latestAssessment,
                },
                tks || [],
                activeMil
              );

              return {
                thesisId: t.id,
                thesisCode: t.thesisCode || `#${t.id}`,
                thesisTitle: t.titleVn,
                studentId: t.studentId,
                studentCode: t.studentCode || '',
                studentFullName: t.studentFullName || 'Sinh viên',
                completionRate: Math.round(completionRate),
                completedTasks:
                  sum?.completedTasks ??
                  (tks || []).filter((x) => x.status === 'COMPLETED').length,
                totalTasks: sum?.totalTasks ?? (tks || []).length,
                submittedTasksCount,
                overdueTasksCount,
                unreviewedReportsCount,
                totalReports: sum?.totalProgressReports ?? (rpts || []).length,
                latestAssessment: sum?.latestAssessment,
                latestReportAt: (rpts || [])[0]?.submittedAt,
                defenseEligible: Boolean(sum?.defenseEligible ?? t.defenseEligible),
                risk,
              } as StudentRowItem;
            })
          );
          if (!mounted) return;
          setStudentRows(
            fallbackRows.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])
          );
        } else if (summaries.length > 0) {
          const thesisTitleMap = new Map<number, string>();
          myTheses.forEach((t) => thesisTitleMap.set(t.id, t.titleVn));

          const rows: StudentRowItem[] = summaries.map((s) => {
            const completionRate = Math.round(
              Number(s.completionRate ?? s.taskCompletionPercent ?? 0)
            );
            const risk = classifyStudentRisk(s, [], activeMil);
            return {
              thesisId: s.thesisId,
              thesisCode: s.thesisCode || `#${s.thesisId}`,
              thesisTitle:
                s.thesisTitle || thesisTitleMap.get(s.thesisId) || 'Đề tài tốt nghiệp',
              studentId: s.studentId,
              studentCode: s.studentCode || '',
              studentFullName: s.studentFullName || 'Sinh viên',
              completionRate,
              completedTasks: s.completedTasks ?? 0,
              totalTasks: s.totalTasks ?? 0,
              submittedTasksCount: s.submittedTasksCount ?? 0,
              overdueTasksCount: s.overdueTasksCount ?? 0,
              unreviewedReportsCount: s.unreviewedReportsCount ?? 0,
              totalReports: s.totalProgressReports ?? 0,
              latestAssessment: s.latestAssessment,
              latestReportAt: s.latestReportAt,
              defenseEligible: Boolean(s.defenseEligible),
              risk,
            };
          });
          setStudentRows(rows.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]));
        } else {
          setStudentRows([]);
        }

        if (schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value)) {
          const myScheds = schedulesRes.value.filter((sc) =>
            sc.members?.some(
              (m) =>
                (lecturerId && String(m.lecturerId) === String(lecturerId)) ||
                (lecturerFullName &&
                  m.lecturerName?.trim().toLowerCase() === lecturerFullName)
            )
          );
          setMySchedules(myScheds.length > 0 ? myScheds : schedulesRes.value.slice(0, 3));
        }

        if (scoringRes.status === 'fulfilled' && Array.isArray(scoringRes.value)) {
          setScoringTheses(scoringRes.value);
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadLecturerData();
    return () => {
      mounted = false;
    };
  }, [
    roundLoading,
    round,
    lecturerId,
    lecturerCode,
    lecturerFullName,
    milestones,
    currentMilestone,
  ]);

  const totalPendingSubmissions = studentRows.reduce(
    (acc, r) => acc + r.submittedTasksCount,
    0
  );
  const totalUnreviewedReports = studentRows.reduce(
    (acc, r) => acc + r.unreviewedReportsCount,
    0
  );
  const defenseEligibleCount = studentRows.filter((r) => r.defenseEligible).length;
  const atRiskCount = studentRows.filter((r) => r.risk === 'AT_RISK').length;

  // Build Urgent Action Queue
  const actionQueue: TodoItem[] = [];

  for (const p of pendingProposals) {
    actionQueue.push({
      id: `prop-${p.id}`,
      title: `Duyệt đề cương: "${p.titleVn}"`,
      subtitle: `SV: ${p.studentFullName || p.studentCode || `#${p.studentId}`} • Phiên bản v${p.version}`,
      daysLeft: daysLeftInMilestone,
      priority: 'HIGH',
      tag: 'Đề cương chờ duyệt',
      tagColor: 'warning',
      actionLabel: 'Mở duyệt',
      actionRoute: `/thesis/proposals?proposalId=${p.id}`,
    });
  }

  for (const row of studentRows) {
    if (row.submittedTasksCount > 0) {
      actionQueue.push({
        id: `sub-${row.thesisId}`,
        title: `${row.submittedTasksCount} bài nộp task chờ chấm — SV ${row.studentFullName}`,
        subtitle: row.thesisTitle,
        priority: 'HIGH',
        tag: 'Task chờ chấm',
        tagColor: 'primary',
        actionLabel: 'Chấm bài',
        actionRoute: `/progress/tasks?thesisId=${row.thesisId}`,
      });
    }
    if (row.unreviewedReportsCount > 0) {
      actionQueue.push({
        id: `rep-${row.thesisId}`,
        title: `${row.unreviewedReportsCount} báo cáo tiến độ chờ nhận xét — SV ${row.studentFullName}`,
        subtitle: row.thesisTitle,
        priority: 'MEDIUM',
        tag: 'BC chờ phản hồi',
        tagColor: 'info',
        actionLabel: 'Nhận xét',
        actionRoute: `/progress/reports?thesisId=${row.thesisId}`,
      });
    }
    if (row.risk === 'AT_RISK') {
      actionQueue.push({
        id: `risk-${row.thesisId}`,
        title: `Cảnh báo tiến độ chậm (${row.completionRate}%) — SV ${row.studentFullName}`,
        subtitle: `${row.overdueTasksCount} task quá hạn • ${row.thesisTitle}`,
        daysLeft: -1,
        priority: 'URGENT',
        tag: 'Nguy cơ trễ hạn',
        tagColor: 'danger',
        actionLabel: 'Kiểm tra',
        actionRoute: `/progress/tasks?thesisId=${row.thesisId}`,
      });
    }
  }

  const sortedQueue = sortTodoByUrgency(actionQueue).slice(0, 8);

  const filteredStudentRows = studentRows.filter((r) => {
    if (riskFilter !== 'ALL' && r.risk !== riskFilter) return false;
    if (searchTerm.trim()) {
      const kw = searchTerm.trim().toLowerCase();
      return (
        r.studentFullName.toLowerCase().includes(kw) ||
        r.studentCode.toLowerCase().includes(kw) ||
        r.thesisTitle.toLowerCase().includes(kw) ||
        r.thesisCode.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const renderRiskBadge = (risk: RiskLevel) => {
    if (risk === 'AT_RISK') {
      return <span className="utc-tag utc-tag-danger">🔴 Nguy cơ</span>;
    }
    if (risk === 'BEHIND') {
      return <span className="utc-tag utc-tag-warning">🟡 Chậm tiến độ</span>;
    }
    return <span className="utc-tag utc-tag-success">🟢 Đúng hạn</span>;
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'l-proposals',
      icon: '📑',
      label: 'GĐ3: Xác nhận Đề cương',
      subtitle: `${pendingProposals.length} đề cương chờ duyệt`,
      route: '/thesis/proposals',
      disabled: isStageLocked(3),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 3 (Đề cương)',
    },
    {
      id: 'l-tasks',
      icon: '📋',
      label: 'GĐ4: Giao Task & Review',
      subtitle: `${totalPendingSubmissions} bài nộp chờ chấm`,
      route: '/progress/tasks',
      disabled: isStageLocked(4),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 4 (Giao task)',
    },
    {
      id: 'l-reports',
      icon: '📈',
      label: 'GĐ4: Báo cáo Tiến độ',
      subtitle: `${totalUnreviewedReports} báo cáo chờ phản hồi`,
      route: '/progress/reports',
      disabled: isStageLocked(4),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 4 (Báo cáo)',
    },
    {
      id: 'l-defense-eligible',
      icon: '✅',
      label: 'GĐ5: Xác nhận Đủ ĐK Bảo vệ',
      subtitle: `${defenseEligibleCount}/${studentRows.length} SV đạt điều kiện`,
      route: '/thesis/detail',
      disabled: isStageLocked(5),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 5 (Xét ĐK bảo vệ)',
    },
    {
      id: 'l-schedules',
      icon: '📅',
      label: 'GĐ5: Lịch Hội đồng Bảo vệ',
      subtitle: 'Xem lịch và phòng bảo vệ',
      route: '/admin/defense-schedules',
      disabled: isStageLocked(5),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 5 (Lịch bảo vệ)',
    },
    {
      id: 'l-scoring',
      icon: '🏆',
      label: 'GĐ5: Chấm điểm & Biên bản PDF',
      subtitle: `${scoringTheses.length} đề tài phân công chấm`,
      route: '/admin/defense-scoring',
      disabled: isStageLocked(5),
      disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 5 (Chấm điểm)',
    },
    ...(isCommitteeRole
      ? [
          {
            id: 'l-councils',
            icon: '⚖️',
            label: 'Hội đồng chấm (1CT-1TK-2PB-1UV)',
            subtitle: 'Danh sách thành viên hội đồng',
            route: '/admin/councils',
            disabled: isStageLocked(5),
            disabledReason: !round ? 'Chưa có đợt đồ án nào đang mở' : 'Đợt đồ án chưa mở Giai đoạn 5 (Hội đồng)',
          },
        ]
      : []),
    {
      id: 'l-chat',
      icon: '💬',
      label: 'Nhóm Chat Hướng dẫn',
      subtitle: 'Trao đổi với sinh viên hướng dẫn',
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
        icon="👨‍🏫"
        title={`Kính chào, ${user?.fullName || user?.username || 'Giảng viên UTC'}`}
        roleBadge={isCommitteeRole ? 'SUPERVISOR & COMMITTEE' : 'SUPERVISOR PORTAL'}
        roundBadge={round ? `${round.name} (${round.roundCode})` : 'Chưa có đợt đang mở'}
        subtitle={
          <>
            Quản lý tiến độ sinh viên hướng dẫn, phê duyệt đề cương, đánh giá task và chấm điểm hội đồng bảo vệ.
          </>
        }
        actions={
          <>
            {allRounds.length > 0 && (
              <select
                aria-label="Chọn đợt đồ án"
                value={round?.roundId || selectedRoundId || ''}
                onChange={(e) => {
                  const nextId = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedRoundId(nextId);
                  if (nextId) {
                    setStoredLecturerRoundId(
                      nextId,
                      user?.id || (user as any)?.user_id || user?.username
                    );
                  }
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                }}
              >
                {allRounds.map((r) => (
                  <option key={r.roundId} value={r.roundId}>
                    {r.name} ({r.roundCode}) — {r.status}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="utc-home-btn utc-home-btn-secondary"
              disabled={!round}
              title={!round ? 'Chưa có đợt đồ án nào đang mở' : 'Nhóm Chat SV'}
              onClick={() => {
                if (round) navigate('/chat');
              }}
            >
              💬 Nhóm Chat SV
            </button>
            <button
              type="button"
              className="utc-home-btn utc-home-btn-primary"
              disabled={!round || isStageLocked(3)}
              title={
                !round
                  ? 'Chưa có đợt đồ án nào đang mở'
                  : isStageLocked(3)
                  ? 'Giai đoạn giao đề tài / công việc chưa mở'
                  : 'Giao Task & Chấm bài'
              }
              onClick={() => {
                if (!round || isStageLocked(3)) return;
                navigate(!isStageLocked(4) ? '/progress/tasks' : '/thesis/proposals');
              }}
            >
              📋 Giao Task & Chấm bài
            </button>
          </>
        }
      />

      <RoundProgressStepper
        role={isCommitteeRole ? 'committee_member' : 'supervisor'}
        round={round}
        roundStage={roundStage}
        userCompletedStage={userCompletedStage}
        milestones={milestones}
        currentMilestone={currentMilestone}
        daysLeftInMilestone={daysLeftInMilestone}
        title="Tiến độ Đợt Đồ án Tốt nghiệp Hiện hành (5 Giai đoạn)"
        onStepClick={handleStepClick}
      />

      {/* 5 KPI Cards */}
      <div className="utc-kpi-grid">
        <StatCard
          label="SV Hướng dẫn"
          value={studentRows.length}
          subtitle={
            !round
              ? 'Chưa có đợt đồ án mở'
              : atRiskCount > 0
              ? `⚠️ ${atRiskCount} SV có nguy cơ trễ hạn`
              : 'Tất cả SV đang theo kịp lộ trình'
          }
          icon="👥"
          accentColor="#0a3273"
          active={riskFilter === 'ALL'}
          onClick={() => setRiskFilter('ALL')}
        />
        <StatCard
          label="Đề cương chờ duyệt"
          value={pendingProposals.length}
          subtitle={
            isStageLocked(3)
              ? '🔒 GĐ3 chưa mở'
              : 'Bấm để mở trang phê duyệt GĐ3'
          }
          icon="📑"
          accentColor="#7c3aed"
          onClick={!isStageLocked(3) ? () => navigate('/thesis/proposals') : undefined}
        />
        <StatCard
          label="Bài nộp Task chờ chấm"
          value={totalPendingSubmissions}
          subtitle={
            isStageLocked(4)
              ? '🔒 GĐ4 chưa mở'
              : 'Bấm để mở bảng công việc GĐ4'
          }
          icon="📥"
          accentColor="#0284c7"
          onClick={!isStageLocked(4) ? () => navigate('/progress/tasks') : undefined}
        />
        <StatCard
          label="Báo cáo chờ phản hồi"
          value={totalUnreviewedReports}
          subtitle={
            isStageLocked(4)
              ? '🔒 GĐ4 chưa mở'
              : 'Bấm để nhận xét báo cáo tiến độ'
          }
          icon="📝"
          accentColor="#d97706"
          onClick={!isStageLocked(4) ? () => navigate('/progress/reports') : undefined}
        />
        <StatCard
          label="Đủ điều kiện Bảo vệ"
          value={`${defenseEligibleCount}/${studentRows.length}`}
          subtitle={
            isStageLocked(5)
              ? '🔒 GĐ5 chưa mở'
              : 'Xác nhận điều kiện bảo vệ GĐ5'
          }
          icon="✅"
          accentColor="#16a34a"
          onClick={!isStageLocked(5) ? () => navigate('/thesis/detail') : undefined}
        />
      </div>

      {/* Urgent Action Queue */}
      <HomeSection
        title="Hàng đợi công việc cần xử lý ngay"
        icon="🔥"
        badgeCount={sortedQueue.length}
        loading={dataLoading}
      >
        <TodoList
          items={sortedQueue}
          emptyMessage={
            !round
              ? 'Hiện chưa có đợt đồ án nào được kích hoạt.'
              : '🎉 Không có đề cương, bài nộp hay báo cáo nào đang tồn đọng!'
          }
          onAction={(route) => navigate(route)}
        />
      </HomeSection>

      {/* Student Progress Table */}
      <HomeSection
        title="Bảng theo dõi tiến độ Sinh viên hướng dẫn"
        icon="📊"
        badgeCount={filteredStudentRows.length}
        loading={dataLoading}
        headerRight={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {(['ALL', 'AT_RISK', 'BEHIND', 'ON_TRACK'] as const).map((f) => {
              const labels: Record<string, string> = {
                ALL: 'Tất cả',
                AT_RISK: `Nguy cơ (${studentRows.filter((r) => r.risk === 'AT_RISK').length})`,
                BEHIND: `Chậm (${studentRows.filter((r) => r.risk === 'BEHIND').length})`,
                ON_TRACK: 'Đúng hạn',
              };
              const isActive = riskFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRiskFilter(f)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isActive ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                    backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                    color: isActive ? '#1d4ed8' : '#475569',
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
            <input
              type="search"
              placeholder="Tìm tên SV, mã SV, đề tài..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                minWidth: '200px',
              }}
            />
          </div>
        }
      >
        {!round ? (
          <div className="utc-home-empty">
            Chưa có đợt đồ án nào đang mở trong hệ thống.
          </div>
        ) : filteredStudentRows.length === 0 ? (
          <div className="utc-home-empty">
            Không có sinh viên nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="utc-home-table-wrap">
            <table className="utc-home-table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Đề tài</th>
                  <th>Tiến độ tổng thể</th>
                  <th>Task</th>
                  <th>Báo cáo</th>
                  <th>Đánh giá</th>
                  <th>Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentRows.map((row) => (
                  <tr key={row.thesisId}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.studentFullName}
                      </div>
                      <div style={{ fontSize: '0.77rem', color: '#64748b' }}>
                        {row.studentCode}
                      </div>
                    </td>
                    <td style={{ maxWidth: '290px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.thesisTitle}
                      >
                        {row.thesisTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Mã: {row.thesisCode}
                      </div>
                    </td>
                    <td>
                      <div className="utc-inline-progress">
                        <div className="utc-inline-progress-track">
                          <div
                            className="utc-inline-progress-fill"
                            style={{
                              width: `${row.completionRate}%`,
                              backgroundColor:
                                row.risk === 'AT_RISK'
                                  ? '#dc2626'
                                  : row.risk === 'BEHIND'
                                  ? '#d97706'
                                  : '#16a34a',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                          {row.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {row.completedTasks}/{row.totalTasks} xong
                      </div>
                      {row.submittedTasksCount > 0 && (
                        <span className="utc-tag utc-tag-primary">
                          {row.submittedTasksCount} chờ chấm
                        </span>
                      )}
                    </td>
                    <td>
                      <div>{row.totalReports} BC</div>
                      {row.unreviewedReportsCount > 0 && (
                        <span className="utc-tag utc-tag-warning">
                          {row.unreviewedReportsCount} chưa phản hồi
                        </span>
                      )}
                    </td>
                    <td>{renderRiskBadge(row.risk)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="utc-home-btn utc-home-btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.77rem' }}
                          disabled={isStageLocked(4)}
                          title={isStageLocked(4) ? 'Giai đoạn 4 chưa mở' : 'Bảng Task'}
                          onClick={() => {
                            if (!isStageLocked(4)) {
                              navigate(`/progress/tasks?thesisId=${row.thesisId}`);
                            }
                          }}
                        >
                          Task
                        </button>
                        <button
                          type="button"
                          className="utc-home-btn utc-home-btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.77rem' }}
                          disabled={isStageLocked(4)}
                          title={isStageLocked(4) ? 'Giai đoạn 4 chưa mở' : 'Báo cáo tiến độ'}
                          onClick={() => {
                            if (!isStageLocked(4)) {
                              navigate(`/progress/reports?thesisId=${row.thesisId}`);
                            }
                          }}
                        >
                          Báo cáo
                        </button>
                        <button
                          type="button"
                          className="utc-home-btn utc-home-btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.77rem' }}
                          disabled={isStageLocked(3)}
                          title={isStageLocked(3) ? 'Giai đoạn 3 chưa mở' : 'Chi tiết đề tài'}
                          onClick={() => {
                            if (!isStageLocked(3)) {
                              navigate(`/thesis/detail?id=${row.thesisId}`);
                            }
                          }}
                        >
                          Đề tài
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HomeSection>

      {/* Council & Notifications */}
      <div className="utc-home-two-col">
        <HomeSection
          title="Hội đồng của tôi & Lịch chấm Bảo vệ"
          icon="⚖️"
          badgeCount={isStageLocked(5) ? 0 : scoringTheses.length || mySchedules.length}
          loading={dataLoading}
          headerRight={
            <button
              type="button"
              className="utc-home-btn utc-home-btn-secondary"
              disabled={isStageLocked(5)}
              title={isStageLocked(5) ? 'Giai đoạn 5 (Hội đồng & Bảo vệ) chưa mở' : 'Chấm điểm Hội đồng'}
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              onClick={() => {
                if (!isStageLocked(5)) navigate('/admin/defense-scoring');
              }}
            >
              Chấm điểm Hội đồng →
            </button>
          }
        >
          {isStageLocked(5) ? (
            <div className="utc-home-empty">
              🔒 Giai đoạn 5 (Hội đồng & Bảo vệ) hiện chưa mở trong đợt đồ án này.
            </div>
          ) : mySchedules.length === 0 && scoringTheses.length === 0 ? (
            <div className="utc-home-empty">
              Chưa có lịch hội đồng bảo vệ hoặc danh sách đề tài phân công chấm trong đợt này.
            </div>
          ) : (
            <div className="utc-todo-list">
              {mySchedules.slice(0, 3).map((sc) => (
                <div key={sc.id} className="utc-todo-item">
                  <div className="utc-todo-info">
                    <div className="utc-todo-title-row">
                      <span className="utc-tag utc-tag-primary">
                        📅 {sc.defenseDate}
                      </span>
                      <span className="utc-todo-title">{sc.councilName}</span>
                    </div>
                    <div className="utc-todo-sub">
                      Phòng <strong>{sc.room}</strong> •{' '}
                      {sc.session === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'} (
                      {sc.startTime} – {sc.endTime})
                    </div>
                  </div>
                  <button
                    type="button"
                    className="utc-home-btn utc-home-btn-secondary"
                    disabled={isStageLocked(5)}
                    style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                    onClick={() => {
                      if (!isStageLocked(5)) navigate('/admin/defense-schedules');
                    }}
                  >
                    Xem lịch →
                  </button>
                </div>
              ))}

              {scoringTheses.slice(0, 4).map((st) => (
                <div key={st.thesisId} className="utc-todo-item">
                  <div className="utc-todo-info">
                    <div className="utc-todo-title-row">
                      <span className="utc-tag utc-tag-info">
                        {st.myCouncilRole
                          ? getCouncilRoleLabel(st.myCouncilRole)
                          : st.canScoreReviewer
                          ? 'Phản biện'
                          : 'GVHD'}
                      </span>
                      <span className="utc-todo-title">{st.titleVn}</span>
                    </div>
                    <div className="utc-todo-sub">
                      SV: {st.studentName || st.studentCode} • {st.councilName || 'Chờ xếp HĐ'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="utc-home-btn utc-home-btn-secondary"
                    disabled={isStageLocked(5)}
                    style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                    onClick={() => {
                      if (!isStageLocked(5)) navigate('/admin/defense-scoring');
                    }}
                  >
                    Nhập điểm →
                  </button>
                </div>
              ))}
            </div>
          )}
        </HomeSection>

        <RecentNotificationsWidget onNavigate={(route) => navigate(route)} />
      </div>

      <HomeSection title="Lối tắt nghiệp vụ Giảng viên & Hội đồng" icon="⚡">
        <QuickActions actions={quickActions} onNavigate={(route) => navigate(route)} />
      </HomeSection>
    </div>
  );
};

export default LecturerHomePage;
