-- =============================================================================
-- Migration: V431__create_security_center_and_audit_logs_tables.sql
-- Description: Creates tables for Enterprise Audit Logs, Active Security Sessions,
--              Security Policies, and adds security tracking columns to users.
-- =============================================================================

-- 1. Add security tracking columns to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(64),
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create audit_logs table (Immutable / Append-only design)
CREATE TABLE IF NOT EXISTS audit_logs (
    id                  BIGSERIAL PRIMARY KEY,
    actor_id            BIGINT,
    actor_username      VARCHAR(100),
    actor_full_name     VARCHAR(255),
    actor_role          VARCHAR(50),
    action_type         VARCHAR(60) NOT NULL,
    module_name         VARCHAR(60) NOT NULL,
    target_entity       VARCHAR(100),
    target_id           VARCHAR(100),
    summary             TEXT NOT NULL,
    old_values          TEXT,
    new_values          TEXT,
    request_method      VARCHAR(16),
    request_uri         VARCHAR(500),
    ip_address          VARCHAR(64),
    user_agent          TEXT,
    severity            VARCHAR(20) NOT NULL DEFAULT 'INFO',
    status              VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    error_message       TEXT,
    execution_time_ms   BIGINT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_audit_logs_severity CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_audit_logs_status CHECK (status IN ('SUCCESS', 'FAILED', 'BLOCKED'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_username, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON audit_logs(module_name, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_status ON audit_logs(severity, status);

-- 3. Create security_sessions table (Active JWT Session & Device Tracking)
CREATE TABLE IF NOT EXISTS security_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    session_token_id    VARCHAR(128) NOT NULL UNIQUE,
    user_id             BIGINT NOT NULL,
    username            VARCHAR(100) NOT NULL,
    full_name           VARCHAR(255),
    role_name           VARCHAR(50),
    ip_address          VARCHAR(64),
    user_agent          TEXT,
    device_info         VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    issued_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at          TIMESTAMP WITH TIME ZONE,
    revoked_by          BIGINT,
    revoke_reason       VARCHAR(255),

    CONSTRAINT chk_security_sessions_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_security_sessions_user ON security_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_security_sessions_token ON security_sessions(session_token_id);

-- 4. Create security_policies table
CREATE TABLE IF NOT EXISTS security_policies (
    id                  BIGSERIAL PRIMARY KEY,
    policy_key          VARCHAR(100) NOT NULL UNIQUE,
    policy_name         VARCHAR(255) NOT NULL,
    policy_value        VARCHAR(255) NOT NULL,
    value_type          VARCHAR(30) NOT NULL DEFAULT 'STRING',
    category            VARCHAR(50) NOT NULL DEFAULT 'AUTHENTICATION',
    description         TEXT,
    updated_by          BIGINT,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default realistic security policies
INSERT INTO security_policies (policy_key, policy_name, policy_value, value_type, category, description)
VALUES
    ('MAX_FAILED_LOGIN_ATTEMPTS', 'Giới hạn đăng nhập sai tối đa', '5', 'INTEGER', 'AUTHENTICATION', 'Số lần nhập sai mật khẩu liên tiếp trước khi hệ thống tự động khóa tài khoản tạm thời.'),
    ('ACCOUNT_LOCKOUT_MINUTES', 'Thời gian tự động khóa tài khoản (phút)', '15', 'INTEGER', 'AUTHENTICATION', 'Thời gian khóa tài khoản tạm thời khi vượt quá số lần đăng nhập sai.'),
    ('JWT_EXPIRATION_HOURS', 'Thời hạn phiên đăng nhập JWT (giờ)', '24', 'INTEGER', 'SESSION', 'Thời gian hiệu lực tối đa của một phiên đăng nhập trước khi yêu cầu xác thực lại.'),
    ('ENFORCE_STRONG_PASSWORD', 'Bắt buộc mật khẩu mạnh', 'true', 'BOOLEAN', 'PASSWORD', 'Yêu cầu mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.'),
    ('LOCK_SCORE_AFTER_ROUND_CLOSED', 'Khóa chỉnh sửa điểm khi đóng đợt đồ án', 'true', 'BOOLEAN', 'DATA_INTEGRITY', 'Ngăn chặn mọi thao tác chỉnh sửa điểm hướng dẫn, phản biện và hội đồng sau khi đợt đồ án đã chuyển sang trạng thái CLOSED.'),
    ('AUDIT_RETENTION_DAYS', 'Thời gian lưu trữ Nhật ký hệ thống (ngày)', '365', 'INTEGER', 'AUDIT', 'Thời gian lưu trữ bắt buộc đối với dữ liệu nhật ký kiểm toán phục vụ thanh tra đào tạo.')
ON CONFLICT (policy_key) DO NOTHING;
