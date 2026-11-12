import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoundContext } from '../hooks/useRoundContext';
import { apiService } from '../../../services/api';
import { assignmentService } from '../../assignment/services/assignmentService';
import { thesisService } from '../../thesis/services/thesisService';
import { eligibilityService } from '../../eligibility/services/eligibilityService';
import { downloadBlob, extractErrorMessage } from '../../academic-staff/utils/download';
import { toast } from '../../../components/Toast';
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
  TodoList,
  QuickActions,
  RecentNotificationsWidget,
  type QuickActionItem,
} from '../components/HomeWidgets';
import type {
  EligibleStudentListResponse,
  ClassGradeReportResponse,
} from '../../../types';
import '../components/home.css';

export const AcademicStaffHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>(
    undefined
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
  } = useRoundContext('academic_staff', selectedRoundId);

  const [eligibleStats, setEligibleStats] =
    useState<EligibleStudentListResponse | null>(null);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [approvedProposalsCount, setApprovedProposalsCount] =
    useState<number>(0);
  const [defenseEligibleCount, setDefenseEligibleCount] = useState<number>(0);
  const [gradedCount, setGradedCount] = useState<number>(0);
  const [pendingReservationsCount, setPendingReservationsCount] =
    useState<number>(0);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [exportingEligible, setExportingEligible] = useState<boolean>(false);
  const [exportingGrades, setExportingGrades] = useState<boolean>(false);

  const activeRoundId = selectedRoundId || round?.roundId;

  useEffect(() => {
    let mounted = true;
    const loadStaffData = async () => {
      if (roundLoading) return;
      if (!activeRoundId) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        const [
          eligRes,
          assignStatsRes,
          proposalsRes,
          thesesRes,
          gradeRes,
          reservRes,
        ] = await Promise.allSettled([
          apiService.getEligibleStudents(activeRoundId, false),
          assignmentService.getStats(activeRoundId),
          thesisService.searchProposals({ roundId: activeRoundId }),
          thesisService.searchTheses({ roundId: activeRoundId }),
          apiService.getGradeReport(activeRoundId),
          eligibilityService.getReservations({
            projectRoundId: activeRoundId,
            status: 'PENDING',
          }),
        ]);

        if (!mounted) return;

        if (eligRes.status === 'fulfilled' && eligRes.value) {
          setEligibleStats(eligRes.value);
        } else {
          setEligibleStats(null);
        }

        if (assignStatsRes.status === 'fulfilled' && assignStatsRes.value) {
          setAssignedCount(
            assignStatsRes.value.totalAssigned ??
            assignStatsRes.value.finalizedCount ??
            0
          );
        }

        if (
          proposalsRes.status === 'fulfilled' &&
          Array.isArray(proposalsRes.value)
        ) {
          setApprovedProposalsCount(
            proposalsRes.value.filter((p) => p.status === 'APPROVED').length
          );
        }

        if (thesesRes.status === 'fulfilled' && Array.isArray(thesesRes.value)) {
          setDefenseEligibleCount(
            thesesRes.value.filter((t) => t.defenseEligible).length
          );
        }

        if (gradeRes.status === 'fulfilled' && gradeRes.value) {
          const gr = gradeRes.value as ClassGradeReportResponse;
          const totalGraded = (gr.classes || []).reduce(
            (acc: number, g) =>
              acc +
              (g.rows || []).filter(
                (s) => s.finalScore !== null && s.finalScore !== undefined
              ).length,
            0
          );
          setGradedCount(totalGraded || gr.totalStudents || 0);
        }

        if (
          reservRes.status === 'fulfilled' &&
          Array.isArray(reservRes.value)
        ) {
          setPendingReservationsCount(
            reservRes.value.filter((r) => r.status === 'PENDING').length
          );
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadStaffData();
    return () => {
      mounted = false;
    };
  }, [roundLoading, activeRoundId]);

  const handleExportEligibleExcel = async () => {
    if (!activeRoundId) return;
    try {
      setExportingEligible(true);
      const blob = await apiService.exportEligibleStudents(activeRoundId);
      const code = round?.roundCode || activeRoundId;
      downloadBlob(blob, `DS_Du_Dieu_Kien_Nhan_Do_An_${code}.xlsx`);
    } catch (err) {
      const msg = await extractErrorMessage(
        err,
        'Không thể xuất file Excel danh sách đủ điều kiện'
      );
      toast.error(msg);
    } finally {
      setExportingEligible(false);
    }
  };

  const handleExportGradesExcel = async () => {
    if (!activeRoundId) return;
    try {
      setExportingGrades(true);
      const blob = await apiService.exportGradeReport(activeRoundId);
      const code = round?.roundCode || activeRoundId;
      downloadBlob(blob, `Bang_Diem_Do_An_Theo_Lop_${code}.xlsx`);
      toast.success('Xuất file Excel bảng điểm theo lớp thành công!');
    } catch (err) {
      const msg = await extractErrorMessage(
        err,
        'Không thể xuất file Excel bảng điểm theo lớp'
      );
      toast.error(msg);
    } finally {
      setExportingGrades(false);
    }
  };

  const totalStudents = eligibleStats?.totalStudents ?? 0;
  const eligibleCount = eligibleStats?.eligibleCount ?? 0;
  const ineligibleCount = eligibleStats?.ineligibleCount ?? 0;
  const noDataCount = eligibleStats?.noDataCount ?? 0;

  // Build Staff Todo Items
  const todoItems: TodoItem[] = [];
  if (noDataCount > 0) {
    todoItems.push({
      id: 'staff-no-data',
      title: `${noDataCount} sinh viên chưa có dữ liệu học vụ (GPA / nợ tín chỉ)`,
      subtitle: 'Cần bổ sung dữ liệu học vụ để xét điều kiện nhận đồ án chính xác',
      daysLeft: daysLeftInMilestone,
      priority: 'URGENT',
      tag: 'Thiếu dữ liệu',
      tagColor: 'danger',
      actionLabel: 'Rà soát DS',
      actionRoute: '/academic-staff/eligible-students',
    });
  }

  if (ineligibleCount > 0) {
    todoItems.push({
      id: 'staff-ineligible',
      title: `${ineligibleCount} sinh viên vượt ngưỡng nợ tín chỉ cho phép`,
      subtitle: `Ngưỡng nợ tối đa: ${eligibleStats?.maxDebtCredits ?? 10} tín chỉ`,
      priority: 'HIGH',
      tag: 'Nợ tín chỉ',
      tagColor: 'warning',
      actionLabel: 'Xem danh sách',
      actionRoute: '/academic-staff/eligible-students',
    });
  }

  if (pendingReservationsCount > 0) {
    todoItems.push({
      id: 'staff-reservations',
      title: `${pendingReservationsCount} đơn xin bảo lưu đồ án đang chờ phê duyệt`,
      subtitle: 'Giai đoạn 5 • Rà soát hồ sơ và minh chứng bảo lưu',
      priority: 'HIGH',
      tag: 'Đơn bảo lưu',
      tagColor: 'primary',
      actionLabel: 'Phê duyệt',
      actionRoute: '/admin/reservations',
    });
  }

  if (roundStage >= 5 || round?.status === 'CLOSED') {
    todoItems.push({
      id: 'staff-print-grades',
      title: 'Tổng hợp và in danh sách điểm đồ án tốt nghiệp theo lớp',
      subtitle: `Đã có ${gradedCount} sinh viên có điểm tổng kết trong đợt`,
      priority: 'MEDIUM',
      tag: 'GĐ5 • In điểm',
      tagColor: 'success',
      actionLabel: 'In bảng điểm',
      actionRoute: '/academic-staff/class-grades',
    });
  }

  const sortedTodos = sortTodoByUrgency(todoItems);

  // Upcoming Milestones
  const milestoneTodos: TodoItem[] = milestones.map((m) => {
    const d = daysUntil(m.endDate);
    return {
      id: `ms-${m.milestoneId}`,
      title: m.name,
      subtitle: `${m.startDate || ''} → ${m.endDate || ''}`,
      daysLeft: d,
      priority: m.isActive ? 'HIGH' : 'LOW',
      tag: m.isActive ? 'Đang diễn ra' : m.phaseType,
      tagColor: m.isActive ? 'primary' : 'info',
      actionLabel: 'Kiểm tra',
      actionRoute:
        m.phaseType === 'DEFENSE'
          ? '/academic-staff/class-grades'
          : '/academic-staff/eligible-students',
    };
  });

  const funnelSteps = [
    { label: '1. Tổng SV trong đợt', count: totalStudents, color: '#0a3273' },
    { label: '2. Đủ ĐK nhận đồ án', count: eligibleCount, color: '#0284c7' },
    { label: '3. Đã phân công GVHD', count: assignedCount, color: '#4f46e5' },
    {
      label: '4. Đề cương đã duyệt',
      count: approvedProposalsCount,
      color: '#7c3aed',
    },
    {
      label: '5. Đủ ĐK Bảo vệ cuối',
      count: defenseEligibleCount,
      color: '#0891b2',
    },
    { label: '6. Đã công bố điểm', count: gradedCount, color: '#16a34a' },
  ];

  const quickActions: QuickActionItem[] = [
    {
      id: 'as-eligible',
      icon: '📋',
      label: 'GĐ1: Lập DS SV đủ ĐK nhận đồ án',
      subtitle: 'Kiểm tra nợ tín chỉ & xuất danh sách',
      route: '/academic-staff/eligible-students',
    },
    {
      id: 'as-export-eligible',
      icon: '📥',
      label: exportingEligible ? 'Đang xuất Excel...' : 'Tải nhanh Excel DS đủ ĐK',
      subtitle: 'Xuất ngay file Excel trên trang chủ',
      onClick: handleExportEligibleExcel,
      disabled: !activeRoundId || exportingEligible,
    },
    {
      id: 'as-final-elig',
      icon: '🔍',
      label: 'GĐ5: Rà soát ĐK Bảo vệ cuối',
      subtitle: 'Kiểm tra trả nợ tín chỉ & điều kiện bảo vệ',
      route: '/admin/final-eligibility',
      disabled: !activeRoundId || roundStage < 5,
      disabledReason: !activeRoundId ? 'Chưa chọn đợt đồ án' : 'Đợt đồ án chưa mở Giai đoạn 5 (Bảo vệ)',
    },
    {
      id: 'as-reservations',
      icon: '⏸️',
      label: 'GĐ5: Quản lý Đơn bảo lưu',
      subtitle: `${pendingReservationsCount} đơn chờ xử lý`,
      route: '/admin/reservations',
      disabled: !activeRoundId || roundStage < 5,
      disabledReason: !activeRoundId ? 'Chưa chọn đợt đồ án' : 'Đợt đồ án chưa mở Giai đoạn 5',
    },
    {
      id: 'as-class-grades',
      icon: '🖨️',
      label: 'GĐ5: In điểm đồ án theo lớp',
      subtitle: 'Xem & in bảng điểm tổng hợp theo lớp',
      route: '/academic-staff/class-grades',
      disabled: !activeRoundId || (roundStage < 5 && round?.status !== 'CLOSED'),
      disabledReason: !activeRoundId ? 'Chưa chọn đợt đồ án' : 'Giai đoạn 5 chưa mở hoặc chưa công bố điểm',
    },
    {
      id: 'as-export-grades',
      icon: '📊',
      label: exportingGrades ? 'Đang xuất bảng điểm...' : 'Tải nhanh Excel Điểm theo lớp',
      subtitle: 'Xuất file Excel điểm tất cả các lớp',
      onClick: handleExportGradesExcel,
      disabled: !activeRoundId || exportingGrades || (roundStage < 5 && round?.status !== 'CLOSED'),
      disabledReason: !activeRoundId ? 'Chưa chọn đợt đồ án' : 'Chưa có điểm đồ án để xuất file',
    },
  ];

  const handleStepClick = (step: StageStepInfo) => {
    navigate(step.route);
  };

  return (
    <div className="utc-home-container">
      <HomeWelcomeBanner
        icon="🏛️"
        title={`Trang chủ Giáo vụ Khoa — ${user?.fullName || user?.username || 'Giáo vụ'
          }`}
        roleBadge="ACADEMIC STAFF PORTAL"
        roundBadge={
          round ? `${round.name} (${round.roundCode})` : 'Chưa chọn đợt đồ án'
        }
        subtitle={
          <>
            Quản lý điều kiện học vụ sinh viên nhận đồ án, rà soát nợ tín chỉ, duyệt đơn bảo lưu và xuất bảng điểm tốt nghiệp theo lớp.
          </>
        }
        actions={
          <>
            {allRounds.length > 0 && (
              <select
                aria-label="Chọn đợt đồ án"
                value={activeRoundId || ''}
                onChange={(e) =>
                  setSelectedRoundId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
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
              disabled={!activeRoundId || exportingEligible}
              onClick={handleExportEligibleExcel}
            >
              📥 {exportingEligible ? 'Đang xuất...' : 'Xuất Excel DS đủ ĐK'}
            </button>
            <button
              type="button"
              className="utc-home-btn utc-home-btn-primary"
              onClick={() => navigate('/academic-staff/eligible-students')}
            >
              📋 Quản lý DS Sinh viên
            </button>
          </>
        }
      />

      <RoundProgressStepper
        role="academic_staff"
        round={round}
        roundStage={roundStage}
        userCompletedStage={userCompletedStage}
        milestones={milestones}
        currentMilestone={currentMilestone}
        daysLeftInMilestone={daysLeftInMilestone}
        title="Tiến trình Đợt Đồ án & Mốc Học vụ Khoa"
        onStepClick={handleStepClick}
      />

      {/* 5 KPI Cards */}
      <div className="utc-kpi-grid">
        <StatCard
          label="Tổng SV trong đợt"
          value={totalStudents}
          subtitle={`Đợt ${round?.roundCode || 'hiện hành'}`}
          icon="👥"
          accentColor="#0a3273"
          onClick={() => navigate('/academic-staff/eligible-students')}
        />
        <StatCard
          label="Đủ điều kiện nhận ĐA"
          value={eligibleCount}
          subtitle={
            totalStudents > 0
              ? `Chiếm ${Math.round((eligibleCount / totalStudents) * 100)}% tổng số SV`
              : 'Đã đạt chuẩn tín chỉ'
          }
          icon="✅"
          accentColor="#16a34a"
          onClick={() => navigate('/academic-staff/eligible-students')}
        />
        <StatCard
          label="Không đủ ĐK (Nợ TC)"
          value={ineligibleCount}
          subtitle={`Nợ vượt ngưỡng ${eligibleStats?.maxDebtCredits ?? 10} TC`}
          icon="❌"
          accentColor="#dc2626"
          onClick={() => navigate('/academic-staff/eligible-students')}
        />
        <StatCard
          label="Thiếu dữ liệu học vụ"
          value={noDataCount}
          subtitle="Cần bổ sung bảng điểm học vụ"
          icon="⚠️"
          accentColor="#d97706"
          onClick={() => navigate('/academic-staff/eligible-students')}
        />
        <StatCard
          label="Đơn bảo lưu chờ duyệt"
          value={pendingReservationsCount}
          subtitle={roundStage < 5 ? '🔒 GĐ5 chưa mở' : 'Giai đoạn 5 • Rà soát bảo lưu'}
          icon="⏸️"
          accentColor="#7c3aed"
          onClick={activeRoundId && roundStage >= 5 ? () => navigate('/admin/reservations') : undefined}
        />
      </div>

      {/* Round Funnel */}
      <HomeSection
        title="Phễu thống kê toàn trình Đợt Đồ án"
        icon="📉"
        loading={dataLoading}
      >
        <div className="utc-funnel-grid">
          {funnelSteps.map((step) => {
            const pct =
              totalStudents > 0
                ? Math.min(100, Math.round((step.count / totalStudents) * 100))
                : 0;
            return (
              <div key={step.label} className="utc-funnel-step">
                <div
                  className="utc-funnel-step-count"
                  style={{ color: step.color }}
                >
                  {step.count}
                </div>
                <div className="utc-funnel-step-label">{step.label}</div>
                <div className="utc-inline-progress-track">
                  <div
                    className="utc-inline-progress-fill"
                    style={{ width: `${pct}%`, backgroundColor: step.color }}
                  />
                </div>
                <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                  {pct}% so với đầu đợt
                </span>
              </div>
            );
          })}
        </div>
      </HomeSection>

      <div className="utc-home-two-col">
        <HomeSection
          title="Việc cần xử lý của Giáo vụ khoa"
          icon="✅"
          badgeCount={sortedTodos.length}
          loading={dataLoading}
        >
          <TodoList
            items={sortedTodos}
            emptyMessage="🎉 Tất cả hồ sơ học vụ trong đợt đã đầy đủ và được xử lý!"
            onAction={(route) => navigate(route)}
          />
        </HomeSection>

        <HomeSection
          title="Mốc thời gian của Đợt đồ án"
          icon="🗓️"
          badgeCount={milestoneTodos.length}
          loading={roundLoading}
        >
          <TodoList
            items={milestoneTodos}
            emptyMessage="Đợt đồ án hiện chưa thiết lập mốc thời gian chi tiết."
            onAction={(route) => navigate(route)}
          />
        </HomeSection>
      </div>

      <div className="utc-home-two-col">
        <HomeSection title="Thao tác nghiệp vụ & Tải nhanh biểu mẫu" icon="⚡">
          <QuickActions
            actions={quickActions}
            onNavigate={(route) => navigate(route)}
          />
        </HomeSection>

        <RecentNotificationsWidget onNavigate={(route) => navigate(route)} />
      </div>
    </div>
  );
};

export default AcademicStaffHomePage;
