import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import utcLogo from '../assets/images/utc_logo.webp';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Header */}
      <header style={{
        backgroundColor: '#0a3273',
        color: '#fff',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={utcLogo} alt="UTC Logo" style={{ height: '48px', backgroundColor: '#fff', borderRadius: '8px', padding: '4px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN — UTC THESISHUB</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Hệ thống Quản lý Đồ án Tốt nghiệp</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user?.fullName || user?.username || 'Quản trị viên'}</div>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#eab308', color: '#000', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              ROLE_ADMIN
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
        {/* Welcome Banner */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '24px',
          borderLeft: '5px solid #0a3273'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Xin chào, {user?.fullName || 'Quản trị viên'} 👋</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Bạn đang đăng nhập với tư cách Quản trị viên cấp cao. Tại đây bạn có thể quản trị người dùng, tổ chức đào tạo và giám sát các đợt đồ án tốt nghiệp.
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>TÀI KHOẢN HỆ THỐNG</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0a3273', margin: '8px 0' }}>4</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Đã khởi tạo (Admin, SV, GV, HĐ)</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>KHOA & BỘ MÔN</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0a3273', margin: '8px 0' }}>1 Khoa / 4 Bộ môn</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Khoa CNTT - ĐH GTVT</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>CHƯƠNG TRÌNH & NGÀNH</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0a3273', margin: '8px 0' }}>2 CT / 3 Ngành</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cử nhân, Kỹ sư (CNTT, KTPM, KHMT)</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>TRẠNG THÁI API BACKEND</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a', margin: '8px 0' }}>Online</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Cổng 8081 / CSDL Neon Postgres</div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Liên kết & Thao tác Quản trị</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/organization')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0a3273',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🏛️ Quản lý Tổ chức & Đào tạo (Task 3)
            </button>
            <a
              href="http://localhost:8081/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0ea5e9',
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              📖 Mở Swagger API Docs (Port 8081)
            </a>
            <button
              onClick={() => alert('Thông tin tài khoản Admin:\n- Username: ' + (user?.username || 'admin') + '\n- Email: ' + (user?.email || 'admin@utc.edu.vn') + '\n- Quyền: Quản trị viên toàn hệ thống')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              👤 Xem chi tiết hồ sơ Admin
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
