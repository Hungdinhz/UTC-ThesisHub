import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UTCAppLayout from '../components/UTCAppLayout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const lifecycleStages = [
    {
      stage: 'Giai đoạn 1',
      title: 'Khởi tạo Đợt Đồ án & Thiết lập Dữ liệu',
      icon: '🗓️',
      color: '#16a34a',
      description:
        'Khoa tạo đợt đồ án, chọn CTĐT (Cử nhân / Kỹ sư), Import danh sách SV từ Excel, tạo tài khoản GV/SV thủ công, cập nhật hướng nghiên cứu và học vị GV.',
      actions: [
        { label: 'Tạo đợt & Import SV', route: '/admin/project-rounds' },
        { label: 'Tạo GV / SV & Học vị', route: '/admin/organization' },
      ],
    },
    {
      stage: 'Giai đoạn 2',
      title: 'Chọn Hướng, Nguyện vọng NV1–NV3 & Phân công',
      icon: '🎯',
      color: '#0284c7',
      description:
        'SV chọn hướng đồ án, chọn NV1–NV3 (kiểm tra học vị tối thiểu cho CT Kỹ sư), hệ thống tính Capacity theo hệ số, tối ưu hóa ràng buộc cứng/mềm, Khoa review/override và chốt phân công.',
      actions: [
        { label: 'Khoa Phân công & Chốt', route: '/admin/assignments' },
        { label: 'Form SV Chọn NV1–NV3', route: '/student/assignment' },
      ],
    },
    {
      stage: 'Giai đoạn 3',
      title: 'Công bố, Xây dựng Đề tài & Sinh Đề cương PDF',
      icon: '📑',
      color: '#7c3aed',
      description:
        'Công bố kết quả phân công, GV & SV xác định đề tài (Draft), GV xác nhận, Khoa/Ban duyệt đề tài (Approved/Revise), sinh đề cương PDF, SV ký nộp & Khoa lưu hồ sơ.',
      actions: [
        { label: 'Duyệt Đề cương & PDF', route: '/thesis/proposals' },
        { label: 'Chi tiết Đề tài', route: '/thesis/detail' },
      ],
    },
    {
      stage: 'Giai đoạn 4',
      title: 'Thực hiện Đồ án (Task, Submit, Review)',
      icon: '📋',
      color: '#0891b2',
      description:
        'Tạo task, deadline, comment. SV nhận task và submit kết quả. GV review kết quả: Không đạt -> Yêu cầu sửa task làm lại; Đạt -> Hoàn thành project và chuyển sang Giai đoạn 5.',
      actions: [
        { label: 'Bảng Task & Review', route: '/progress/tasks' },
        { label: 'Báo cáo Tiến độ', route: '/progress/reports' },
      ],
    },
    {
      stage: 'Giai đoạn 5',
      title: 'Xét Bảo vệ, Hội đồng (1CT-2TK-2UV), Bảo lưu & Kết thúc',
      icon: '🏆',
      color: '#dc2626',
      description:
        'GV xác nhận đủ khả năng BV -> Kiểm tra ĐK học vụ cuối -> Lập hội đồng 1CT-2TK-2UV & gán phản biện -> Xếp lịch -> Chấm điểm -> Tổng hợp -> Xuất Biên bản PDF & Dữ liệu cuối kỳ (ký). Nhánh phụ: Đơn Bảo lưu.',
      actions: [
        { label: 'Xét ĐK Bảo vệ Cuối', route: '/admin/final-eligibility' },
        { label: 'Lập HĐ (1CT-2TK-2UV)', route: '/admin/councils' },
        { label: 'Xếp lịch Bảo vệ', route: '/admin/defense-schedules' },
        { label: 'Chấm điểm & Biên bản PDF', route: '/admin/defense-scoring' },
        { label: 'Duyệt Đơn Bảo lưu', route: '/admin/reservations' },
      ],
    },
  ];

  return (
    <UTCAppLayout activeTab="overview" onLogout={logout} user={user}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Card */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #0a3273',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
            Chào mừng trở lại, {user?.fullName || user?.username || 'Quản trị viên Khoa CNTT'} 👋
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Trung tâm điều hành toàn trình <strong>5 Giai đoạn Đồ án Tốt nghiệp UTC</strong>. Bạn có thể chuyển nhanh tới bất kỳ giai đoạn nào bên dưới để kiểm thử và vận hành.
          </p>
        </div>

        {/* 5-Stage Lifecycle Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {lifecycleStages.map((item) => (
            <div
              key={item.stage}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderTop: `4px solid ${item.color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: item.color,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    {item.stage}
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.05rem' }}>{item.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {item.actions.map((act) => (
                  <button
                    key={act.route + act.label}
                    onClick={() => navigate(act.route)}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#0a3273',
                      border: '1px solid #bfdbfe',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
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
    </UTCAppLayout>
  );
};

export default AdminDashboard;
