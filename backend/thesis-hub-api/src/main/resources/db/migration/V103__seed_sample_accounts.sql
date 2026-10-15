-- =============================================================================
-- Migration: V103__seed_sample_accounts.sql
-- Module: Module 1 & 2 - Owner: Phung Dinh Hung
-- Description: Seeds 4 representative sample accounts: Admin, Student, Lecturer, Committee
-- =============================================================================

-- Ensure admin password is valid (Admin@123)
UPDATE users 
SET password = '$2a$10$eHsToa8aTLvg72Yfcb1FluhMWblRoWOMlA.iPoYNUi3u.sGeFlL1S',
    is_active = TRUE
WHERE username = 'admin';

-- 1. SEED STUDENT USER (Nguyễn Văn Sinh Viên - Password@123)
INSERT INTO users (username, email, password, full_name, phone, role_id, is_active)
SELECT 'sinhvien', 'sinhvien@utc.edu.vn', '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.', 'Nguyễn Văn Sinh Viên', '0912345678', r.id, TRUE
FROM roles r WHERE r.name = 'ROLE_STUDENT'
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password,
    is_active = TRUE;

-- Insert Student Profile record
INSERT INTO students (user_id, student_code, class_name, major_id, training_program_id, debt_credits)
SELECT u.id, '2021601234', 'CNTT1 - K62', m.id, tp.id, 0
FROM users u
CROSS JOIN (SELECT id FROM majors WHERE code = 'CNTT' LIMIT 1) m
CROSS JOIN (SELECT id FROM training_programs WHERE code = 'CU_NHAN' LIMIT 1) tp
WHERE u.username = 'sinhvien'
ON CONFLICT (user_id) DO NOTHING;

-- 2. SEED LECTURER USER (TS. Trần Văn Giảng Viên - Password@123)
INSERT INTO users (username, email, password, full_name, phone, role_id, is_active)
SELECT 'giangvien', 'giangvien@utc.edu.vn', '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.', 'TS. Trần Văn Giảng Viên', '0923456789', r.id, TRUE
FROM roles r WHERE r.name = 'ROLE_LECTURER'
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password,
    is_active = TRUE;

-- Insert Lecturer Profile record
INSERT INTO lecturers (user_id, lecturer_code, department_id, academic_degree, research_interests, max_thesis_quota)
SELECT u.id, 'GV001', d.id, 'TIEN_SI', 'Trí tuệ nhân tạo, Kỹ thuật phần mềm', 5
FROM users u
CROSS JOIN (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1) d
WHERE u.username = 'giangvien'
ON CONFLICT (user_id) DO NOTHING;

-- 3. SEED COMMITTEE MEMBER USER (PGS.TS. Lê Văn Hội Đồng - Password@123)
INSERT INTO users (username, email, password, full_name, phone, role_id, is_active)
SELECT 'hoidong', 'hoidong@utc.edu.vn', '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.', 'PGS.TS. Lê Văn Hội Đồng', '0934567890', r.id, TRUE
FROM roles r WHERE r.name = 'ROLE_COMMITTEE'
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password,
    is_active = TRUE;

-- Insert Committee Lecturer Profile record
INSERT INTO lecturers (user_id, lecturer_code, department_id, academic_degree, research_interests, max_thesis_quota)
SELECT u.id, 'HD001', d.id, 'PGS', 'Hệ thống phân tán, An toàn thông tin', 5
FROM users u
CROSS JOIN (SELECT id FROM departments WHERE code = 'KHMT' LIMIT 1) d
WHERE u.username = 'hoidong'
ON CONFLICT (user_id) DO NOTHING;
