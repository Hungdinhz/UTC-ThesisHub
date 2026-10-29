import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { ProjectRoundItem } from '../types';
import UTCAppLayout from '../components/UTCAppLayout';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeRound, setActiveRound] = useState<ProjectRoundItem | null>(null);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [active, list] = await Promise.allSettled([
          apiService.getActiveProjectRound(),
          apiService.getProjectRounds(),
        ]);

        if (!isMounted) return;

        if (active.status === 'fulfilled' && active.value) {
          setActiveRound(active.value);
        }
        if (list.status === 'fulfilled' && Array.isArray(list.value)) {
          setTotalRounds(list.value.length);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang chủ Admin:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStageDisplay = (round?: ProjectRoundItem | null) => {
    if (!round) return { label: 'Chưa kích hoạt', stageNum: 0, color: '#64748b' };
    const phase = round.currentMilestone?.phaseType;
    if (round.status === 'DRAFT') {
      return { label: 'GĐ1: Khởi tạo đợt (DRAFT)', stageNum: 1, color: '#16a34a' };
    }
    switch (phase) {
      case 'REGISTRATION':
        return { label: 'GĐ2: Đăng ký & Phân công GVHD', stageNum: 2, color: '#0284c7' };
      case 'PROPOSAL_SUBMISSION':
        return { label: 'GĐ3: Nộp & Phê duyệt Đề cương', stageNum: 3, color: '#7c3aed' };
      case 'WEEKLY_REPORT':
      case 'MIDTERM_REVIEW':
        return { label: 'GĐ4: Thực hiện Đồ án & Task', stageNum: 4, color: '#0891b2' };
      case 'DEFENSE':
        return { label: 'GĐ5: Hội đồng & Bảo vệ Cuối kỳ', stageNum: 5, color: '#dc2626' };
      default:
        return { label: 'GĐ1: Thiết lập đợt đồ án', stageNum: 1, color: '#16a34a' };
    }
  };

  const currentStageInfo = getStageDisplay(activeRound);

  const lifecycleStages = [
    {
      stage: 'Giai đoạn 1',
      title: 'Khởi tạo Đợt Đồ án & Dữ liệu Tổ chức',
      icon: '🗓️',
      color: '#16a34a',
      description:
        'Tạo đợt đồ án mới, chọn CTĐT (Cử nhân / Kỹ sư), Import danh sách sinh viên đủ điều kiện từ Excel, cập nhật thông tin giảng viên, học vị và phân bổ khoa/bộ môn.',
      actions: [
        { label: 'Đợt đồ án & Import SV', route: '/admin/project-rounds' },
        { label: 'Khoa, Bộ môn, GV & SV', route: '/admin/organization' },
      ],
    },
    {
      stage: 'Giai đoạn 2',
      title: 'Chọn Hướng, Nguyện vọng NV1–NV3 & Phân công',
      icon: '🎯',
      color: '#0284c7',
      description:
        'Sinh viên chọn hướng đồ án & 3 nguyện vọng GVHD (kiểm tra chuẩn học vị Kỹ sư). Thuật toán phân bổ theo quota, xử lý nguyện vọng bổ sung và chốt danh sách.',
      actions: [
        { label: 'Phân công GVHD & Chốt', route: '/admin/assignments' },
        { label: 'Form SV Đăng ký NV', route: '/student/assignment' },
      ],
    },
    {
      stage: 'Giai đoạn 3',
      title: 'Công bố, Xây dựng Đề tài & Xuất Đề cương PDF',
      icon: '📑',
      color: '#7c3aed',
      description:
        'GVHD & SV phối hợp xây dựng tên đề tài, mục tiêu, phạm vi. Ban chủ nhiệm Khoa xét duyệt đề cương, xuất file PDF chuẩn mẫu UTC và sinh viên ký số lưu trữ.',
      actions: [
        { label: 'Duyệt Đề cương & Ký PDF', route: '/thesis/proposals' },
        { label: 'Chi tiết Đề tài', route: '/thesis/detail' },
      ],
    },
    {
      stage: 'Giai đoạn 4',
      title: 'Thực hiện Đồ án, Giao Task & Báo cáo Tiến độ',
      icon: '📋',
      color: '#0891b2',
      description:
        'Quản lý bảng công việc (Taskboard), sinh viên nộp bài theo deadline, GVHD phản hồi/yêu cầu chỉnh sửa, theo dõi báo cáo tiến độ tuần và chấm hoàn thành.',
      actions: [
        { label: 'Bảng Task & Review', route: '/progress/tasks' },
        { label: 'Báo cáo Tiến độ', route: '/progress/reports' },
      ],
    },
    {
      stage: 'Giai đoạn 5',
      title: 'Xét Bảo vệ, Hội đồng (1CT-2TK-2UV) & Tổng kết Điểm',
      icon: '🏆',
      color: '#dc2626',
      description:
        'GVHD xác nhận đủ ĐK bảo vệ, kiểm tra chuẩn học vụ cuối. Lập Hội đồng 5 thành viên (1CT-2TK-2UV), xếp lịch bảo vệ, chấm điểm và ký biên bản điện tử.',
      actions: [
        { label: 'Xét ĐK Bảo vệ Cuối', route: '/admin/final-eligibility' },
        { label: 'Lập HĐ (1CT-2TK-2UV)', route: '/admin/councils' },
        { label: 'Xếp lịch Bảo vệ', route: '/admin/defense-schedules' },
        { label: 'Chấm điểm & Biên bản PDF', route: '/admin/defense-scoring' },
      ],
    },
  ];

  return (
    <UTCAppLayout activeTab="overview" onLogout={logout} user={user}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '24px 32px',
            boxShadow: '0 2px 8px rgba(10, 50, 115, 0.08)',
            borderLeft: '6px solid #0a3273',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h2 style={{ margin: 0, color: '#0a3273', fontSize: '1.45rem', fontWeight: 700 }}>
                Trang chủ Quản trị viên Khoa
              </h2>
              <span
                style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                ADMIN PORTAL
              </span>
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.96rem', lineHeight: 1.5 }}>
              Chào mừng trở lại, <strong>{user?.fullName || user?.username || 'Quản trị viên'}</strong>. Trung tâm chỉ huy và điều hành toàn trình <strong>5 Giai đoạn Đồ án Tốt nghiệp UTC</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/project-rounds')}
              style={{
                backgroundColor: '#0a3273',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(10, 50, 115, 0.2)',
              }}
            >
              <span>🗓️</span> Quản lý Đợt đồ án
            </button>
            <button
              onClick={() => navigate('/chat')}
              style={{
                backgroundColor: '#f8fafc',
                color: '#0a3273',
                border: '1px solid #cbd5e1',
                padding: '9px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💬</span> Nhóm Chat GV–SV
            </button>
          </div>
        </div>

        {/* Active Project Round Summary Banner */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '20px 28px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Item 1: Active Round Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Đợt Đồ Án Hiện Hành
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {loading ? 'Đang tải...' : activeRound?.name || 'Chưa có đợt đang mở'}
              </span>
            </div>
            {activeRound && (
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                Mã đợt: <strong>{activeRound.roundCode}</strong> ({activeRound.academicYear} - {activeRound.semester})
              </span>
            )}
          </div>

          {/* Item 2: Current Stage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Giai Đoạn Đang Thực Hiện
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: `${currentStageInfo.color}15`,
                  color: currentStageInfo.color,
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${currentStageInfo.color}40`,
                }}
              >
                {currentStageInfo.label}
              </span>
            </div>
            {activeRound?.supplementaryOpen && (
              <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                ⚠️ Đang mở đăng ký nguyện vọng bổ sung
              </span>
            )}
          </div>

          {/* Item 3: Training Program */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chương Trình Đào Tạo
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
              {activeRound?.trainingProgramName || (activeRound?.trainingProgram === 'KY_SU' ? 'Kỹ sư (4.5 - 5 năm)' : 'Cử nhân / Đại trà')}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Tổng số đợt trong hệ thống: <strong>{totalRounds}</strong> đợt
            </span>
          </div>

          {/* Item 4: Quick Jump Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {activeRound ? (
              <button
                onClick={() => navigate('/admin/project-rounds')}
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                Chi tiết tiến độ đợt →
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin/project-rounds')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                + Tạo đợt đồ án mới
              </button>
            )}
          </div>
        </div>

        {/* 5-Stage Lifecycle Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>
              Tiến Trình 5 Giai Đoạn Đồ Án Tốt Nghiệp UTC
            </h3>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Nhấp vào giai đoạn để trực tiếp điều hành &amp; giám sát
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: '20px',
            }}
          >
            {lifecycleStages.map((item) => (
              <div
                key={item.stage}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  borderTop: `4px solid ${item.color}`,
                  borderRight: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  borderLeft: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '4px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {item.stage}
                    </span>
                    <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                  {item.actions.map((act) => (
                    <button
                      key={act.route + act.label}
                      onClick={() => navigate(act.route)}
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0a3273',
                        border: '1px solid #cbd5e1',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.83rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.color = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#0a3273';
                      }}
                    >
                      {act.label} →
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UTCAppLayout>
  );
};

export default AdminDashboard;
