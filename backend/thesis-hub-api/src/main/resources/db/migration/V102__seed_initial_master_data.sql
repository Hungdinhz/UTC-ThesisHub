-- =============================================================================
-- Migration: V102__seed_initial_master_data.sql
-- Module: Module 1 (Master Data & Initial Seed) - Owner: Phung Dinh Hung
-- Description: Seeds initial roles, faculty, departments, majors, training programs, and default admin.
-- =============================================================================

-- 1. SEED ROLES
INSERT INTO roles (name, display_name, description) VALUES
    ('ROLE_ADMIN', 'Quản trị viên', 'Quản trị toàn bộ hệ thống TheSisHub'),
    ('ROLE_LECTURER', 'Giảng viên', 'Giảng viên hướng dẫn và chấm phản biện/hội đồng'),
    ('ROLE_STUDENT', 'Sinh viên', 'Sinh viên thực hiện đồ án tốt nghiệp'),
    ('ROLE_COMMITTEE', 'Thành viên Hội đồng', 'Cán bộ chấm thi và tổng hợp kết quả')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED FACULTY (Khoa Công nghệ thông tin - UTC)
INSERT INTO faculties (code, name, description) VALUES
    ('FIT_UTC', 'Khoa Công nghệ thông tin', 'Khoa Công nghệ thông tin - Trường Đại học Giao thông Vận tải')
ON CONFLICT (code) DO NOTHING;

-- 3. SEED DEPARTMENTS (Bộ môn trực thuộc)
INSERT INTO departments (faculty_id, code, name, description)
SELECT f.id, 'CNPM', 'Bộ môn Công nghệ phần mềm', 'Phụ trách chuyên ngành Kỹ thuật phần mềm'
FROM faculties f WHERE f.code = 'FIT_UTC'
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (faculty_id, code, name, description)
SELECT f.id, 'HTTT', 'Bộ môn Hệ thống thông tin', 'Phụ trách chuyên ngành Hệ thống thông tin'
FROM faculties f WHERE f.code = 'FIT_UTC'
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (faculty_id, code, name, description)
SELECT f.id, 'KHMT', 'Bộ môn Khoa học máy tính', 'Phụ trách chuyên ngành Khoa học máy tính & Trí tuệ nhân tạo'
FROM faculties f WHERE f.code = 'FIT_UTC'
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (faculty_id, code, name, description)
SELECT f.id, 'MMT', 'Bộ môn Mạng máy tính & An toàn thông tin', 'Phụ trách chuyên ngành Mạng & ATTT'
FROM faculties f WHERE f.code = 'FIT_UTC'
ON CONFLICT (code) DO NOTHING;

-- 4. SEED TRAINING PROGRAMS (Cử nhân & Kỹ sư)
INSERT INTO training_programs (code, name, duration_years, total_credits, description) VALUES
    ('CU_NHAN', 'Chương trình Cử nhân', 4.0, 130, 'Chương trình đào tạo Cử nhân chuẩn 4 năm'),
    ('KY_SU', 'Chương trình Kỹ sư', 4.5, 150, 'Chương trình đào tạo Kỹ sư chuyên sâu 4.5 - 5 năm')
ON CONFLICT (code) DO NOTHING;

-- 5. SEED MAJORS (Ngành đào tạo)
INSERT INTO majors (faculty_id, department_id, code, name, description)
SELECT f.id, d.id, 'CNTT', 'Công nghệ thông tin', 'Ngành Công nghệ thông tin tổng quát'
FROM faculties f, departments d WHERE f.code = 'FIT_UTC' AND d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO majors (faculty_id, department_id, code, name, description)
SELECT f.id, d.id, 'KTPM', 'Kỹ thuật phần mềm', 'Ngành Kỹ thuật phần mềm'
FROM faculties f, departments d WHERE f.code = 'FIT_UTC' AND d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO majors (faculty_id, department_id, code, name, description)
SELECT f.id, d.id, 'KHMT', 'Khoa học máy tính', 'Ngành Khoa học máy tính'
FROM faculties f, departments d WHERE f.code = 'FIT_UTC' AND d.code = 'KHMT'
ON CONFLICT (code) DO NOTHING;

-- 6. SEED DEFAULT ADMIN USER
-- Password hash for 'Admin@123' (BCrypt): $2a$10$GGLV1aGvV4jY1Oq1yWjA..3L19w4Q9vE3u16J4H9zW4C.2K8r32Ce
INSERT INTO users (username, email, password, full_name, phone, role_id, is_active)
SELECT 'admin', 'admin@utc.edu.vn', '$2a$10$wT0X8rW6yFj1vW7n1bA7he9a.VwJ9r97CqW5iJzYp6d9mG5k1eQz.', 'Quản trị viên Hệ thống', '0901234567', r.id, TRUE
FROM roles r WHERE r.name = 'ROLE_ADMIN'
ON CONFLICT (username) DO NOTHING;
