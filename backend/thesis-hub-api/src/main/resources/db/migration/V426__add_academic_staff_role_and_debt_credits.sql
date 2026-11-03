-- =============================================================================
-- Migration: V426__add_academic_staff_role_and_debt_credits.sql
-- Description:
--   1. Thêm vai trò Giáo vụ khoa (ROLE_ACADEMIC_STAFF) và tài khoản mẫu.
--   2. Thêm cột debt_credits (số tín chỉ nợ) vào academic_records để xét
--      điều kiện nhận đồ án (nợ < 10 tín) và điều kiện bảo vệ (nợ = 0 tín).
-- =============================================================================

-- 1. ROLE
INSERT INTO roles (name, display_name, description) VALUES
    ('ROLE_ACADEMIC_STAFF', 'Giáo vụ khoa', 'Giáo vụ: import dữ liệu học vụ, lập danh sách đủ điều kiện nhận đồ án, in danh sách điểm đồ án theo lớp')
ON CONFLICT (name) DO NOTHING;

-- 2. SAMPLE ACCOUNT (mật khẩu Password@123, cùng hash với V417)
INSERT INTO users (username, email, password, full_name, phone, role_id, is_active)
SELECT 'giaovu', 'giaovu@utc.edu.vn', '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.', 'Nguyễn Thị Giáo Vụ', '0945678901', r.id, TRUE
FROM roles r WHERE r.name = 'ROLE_ACADEMIC_STAFF'
ON CONFLICT (username) DO NOTHING;

-- 3. DEBT CREDITS
ALTER TABLE academic_records
    ADD COLUMN IF NOT EXISTS debt_credits INT NOT NULL DEFAULT 0;

ALTER TABLE academic_records
    DROP CONSTRAINT IF EXISTS chk_academic_records_debt_credits;
ALTER TABLE academic_records
    ADD CONSTRAINT chk_academic_records_debt_credits CHECK (debt_credits >= 0);
