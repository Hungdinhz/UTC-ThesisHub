import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UTCAppLayout from '../components/UTCAppLayout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <UTCAppLayout activeTab="overview" onLogout={logout} user={user}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #0a3273'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
            Chào mừng trở lại, {user?.fullName || user?.username || 'Quản trị viên'} 👋
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Hệ thống quản lý đồ án tốt nghiệp TheSisHub UTC. Bạn có toàn quyền thiết lập dữ liệu nền, khởi tạo đợt đồ án, import sinh viên và quản lý kết quả học vụ xét điều kiện.
          </p>
        </div>

        {/* 4 Cards Quick Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div
            onClick={() => navigate('/admin/project-rounds')}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: '4px solid #16a34a',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '12px' }}>🗓️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem' }}>Đợt Đồ Án & Timeline</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Khởi tạo đợt đồ án (Cử nhân/Kỹ sư), cấu hình các mốc thời gian đăng ký, bảo vệ (Contract 2).
            </p>
            <div style={{ marginTop: '16px', color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
              Quản lý đợt đồ án →
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/project-rounds')}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: '4px solid #0284c7',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '12px' }}>📤</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem' }}>Import Sinh Viên (Excel)</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Nạp danh sách SV theo mẫu 8 cột UTC, tự động tạo tài khoản User và ghi danh vào đợt (Contract 3).
            </p>
            <div style={{ marginTop: '16px', color: '#0284c7', fontWeight: 600, fontSize: '0.85rem' }}>
              Xem danh sách & Import →
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/project-rounds')}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: '4px solid #f59e0b',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '12px' }}>📊</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem' }}>Dữ Liệu Học Vụ (Phase 4)</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Import kết quả học vụ (Tín chỉ, GPA, Nợ HP, Kỷ luật) cung cấp cho Module xét duyệt (Contract 4).
            </p>
            <div style={{ marginTop: '16px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
              Tra cứu & Nạp điểm →
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/organization')}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: '4px solid #0a3273',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '12px' }}>🏛️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem' }}>Tổ Chức & Danh Mục</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Quản lý Khoa, Bộ môn, Ngành, Chương trình đào tạo, Giảng viên và Sinh viên (Contract 1).
            </p>
            <div style={{ marginTop: '16px', color: '#0a3273', fontWeight: 600, fontSize: '0.85rem' }}>
              Quản lý danh mục →
            </div>
          </div>
        </div>

        {/* System Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TÀI KHOẢN MẪU TEST</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0a3273', margin: '6px 0' }}>4 Vai Trò</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>ADMIN, Sinh viên, Giảng viên, Hội đồng</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>KHOA & BỘ MÔN</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0a3273', margin: '6px 0' }}>1 Khoa / 4 Bộ môn</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>CNTT, HTTT, KTPM, MMT</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>CHƯƠNG TRÌNH & NGÀNH</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0a3273', margin: '6px 0' }}>2 CT / 3 Ngành</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cử nhân & Kỹ sư (CNTT, KHMT, KTPM)</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>API BACKEND & CSDL</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a', margin: '6px 0' }}>Online</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Postgres Neon / 4 Contracts Ready</div>
          </div>
        </div>
      </div>
    </UTCAppLayout>
  );
};

export default AdminDashboard;
