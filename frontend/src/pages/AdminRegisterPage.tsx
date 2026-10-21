import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import utcLogo from '../assets/images/utc_logo.webp';
import './AdminRegisterPage.css';

const AdminRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isShaking, setIsShaking] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập quản trị viên';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email công vụ';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Định dạng email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.adminSecretKey.trim()) {
      errors.adminSecretKey = 'Vui lòng nhập mã Admin API Key do nhà phát triển cung cấp';
    }

    return errors;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setLoading(true);

    try {
      await apiService.adminRegister({
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        adminSecretKey: formData.adminSecretKey.trim(),
      });

      setSuccess('Đăng ký tài khoản Quản trị viên thành công! Đang chuyển hướng sang trang đăng nhập...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredRole: 'admin',
            registeredUsername: formData.username.trim(),
          },
        });
      }, 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Đăng ký tài khoản Quản trị viên thất bại. Vui lòng kiểm tra lại thông tin và Admin API Key.';
      setError(msg);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reg-wrapper">
      <div className="admin-reg-bg-glow admin-glow-gold"></div>
      <div className="admin-reg-bg-glow admin-glow-blue"></div>

      <header className="admin-reg-header">
        <div className="admin-reg-brand">
          <div className="admin-reg-logo-badge">
            <img src={utcLogo} alt="UTC Logo" className="admin-reg-logo-img" />
            <div className="admin-reg-logo-text">
              <span className="school-name">TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</span>
              <span className="school-sub">UNIVERSITY OF TRANSPORT AND COMMUNICATIONS</span>
            </div>
          </div>
          <Link to="/login" className="admin-back-link">
            ← Trở về Đăng nhập
          </Link>
        </div>
      </header>

      <main className="admin-reg-container">
        <div className={`admin-reg-card ${isShaking ? 'shake' : ''}`}>
          <div className="admin-reg-title-badge">
            <span>👑</span> Cổng Khởi Tạo Quản Trị Viên
          </div>

          <h2>Đăng ký tài khoản Quản trị viên</h2>
          <p className="admin-reg-desc">
            Chức năng bảo mật đặc biệt dành cho Cán bộ Quản trị hệ thống ThesisHub UTC. Yêu cầu có <strong>Admin API Key</strong> do Nhà phát triển cấp.
          </p>

          {error && <div className="admin-alert-box admin-alert-error">⚠️ {error}</div>}
          {success && <div className="admin-alert-box admin-alert-success">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="admin-reg-form" noValidate>
            <div className="admin-form-row">
              <div className={`admin-input-group ${fieldErrors.username ? 'has-error' : ''}`}>
                <label className="admin-input-label">
                  Tên đăng nhập <span className="required">*</span>
                </label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">👤</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="Ví dụ: admin_cntt"
                    autoComplete="username"
                  />
                </div>
                {fieldErrors.username && <span className="admin-field-error">{fieldErrors.username}</span>}
              </div>

              <div className={`admin-input-group ${fieldErrors.fullName ? 'has-error' : ''}`}>
                <label className="admin-input-label">
                  Họ và tên <span className="required">*</span>
                </label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">🏷️</span>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Ví dụ: ThS. Nguyễn Quản Trị"
                  />
                </div>
                {fieldErrors.fullName && <span className="admin-field-error">{fieldErrors.fullName}</span>}
              </div>
            </div>

            <div className="admin-form-row">
              <div className={`admin-input-group ${fieldErrors.email ? 'has-error' : ''}`}>
                <label className="admin-input-label">
                  Email công tác UTC <span className="required">*</span>
                </label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">✉️</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="admin_fit@utc.edu.vn"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && <span className="admin-field-error">{fieldErrors.email}</span>}
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label">Số điện thoại</label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">📞</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="0901234567"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className={`admin-input-group ${fieldErrors.password ? 'has-error' : ''}`}>
                <label className="admin-input-label">
                  Mật khẩu <span className="required">*</span>
                </label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="admin-key-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {fieldErrors.password && <span className="admin-field-error">{fieldErrors.password}</span>}
              </div>

              <div className={`admin-input-group ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
                <label className="admin-input-label">
                  Xác nhận mật khẩu <span className="required">*</span>
                </label>
                <div className="admin-input-wrapper">
                  <span className="admin-input-icon">🔁</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="admin-field-error">{fieldErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Secret API Key Field */}
            <div className={`admin-input-group is-secret ${fieldErrors.adminSecretKey ? 'has-error' : ''}`}>
              <label className="admin-input-label">
                <span>🔑 Admin API Key (Mã xác thực Quản trị viên)</span>
                <span className="required">* Bắt buộc</span>
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon">🛡️</span>
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={formData.adminSecretKey}
                  onChange={(e) => handleChange('adminSecretKey', e.target.value)}
                  placeholder="Nhập mã bí mật do Developer chia sẻ..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="admin-key-toggle-btn"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  title={showSecretKey ? 'Ẩn mã bí mật' : 'Hiện mã bí mật'}
                >
                  {showSecretKey ? '👁️' : '🙈'}
                </button>
              </div>
              {fieldErrors.adminSecretKey && (
                <span className="admin-field-error">{fieldErrors.adminSecretKey}</span>
              )}
              <div className="admin-key-hint">
                <span>ℹ️</span> Mã bảo mật độc quyền của nhà phát triển, dùng để ngăn chặn người ngoài đăng ký quyền admin trái phép.
              </div>
            </div>

            <button type="submit" className="admin-btn-submit" disabled={loading}>
              {loading ? 'ĐANG XÁC THỰC VÀ KHỞI TẠO...' : '👑 XÁC NHẬN KHỞI TẠO TÀI KHOẢN ADMIN'}
            </button>

            <Link to="/login" className="admin-back-link">
              ← Đã có tài khoản? Đăng nhập ngay
            </Link>
          </form>
        </div>
      </main>

      <footer className="admin-reg-footer">
        Hệ thống quản lý Đồ án Tốt nghiệp Smart FYP — Khoa Công nghệ Thông tin, Đại học Giao thông Vận tải
      </footer>
    </div>
  );
};

export default AdminRegisterPage;
