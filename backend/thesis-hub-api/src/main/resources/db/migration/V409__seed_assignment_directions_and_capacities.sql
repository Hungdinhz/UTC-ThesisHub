-- =============================================================================
-- Migration: V409__seed_assignment_directions_and_capacities.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Ensures project directions, lecturer capacities, and lecturer directions are populated.
-- =============================================================================

-- 1. Ensure columns in lecturer_capacities do not block inserts
ALTER TABLE lecturer_capacities ALTER COLUMN base_quota DROP NOT NULL;
ALTER TABLE lecturer_capacities ALTER COLUMN effective_capacity DROP NOT NULL;
ALTER TABLE lecturer_capacities ALTER COLUMN assigned_count DROP NOT NULL;
ALTER TABLE lecturer_capacities ALTER COLUMN base_quota SET DEFAULT 5;
ALTER TABLE lecturer_capacities ALTER COLUMN effective_capacity SET DEFAULT 5;
ALTER TABLE lecturer_capacities ALTER COLUMN assigned_count SET DEFAULT 0;

-- 2. Ensure unique index on lecturer_directions for (lecturer_id, direction_id)
CREATE UNIQUE INDEX IF NOT EXISTS uk_lecturer_directions_lect_dir ON lecturer_directions(lecturer_id, direction_id);

-- 3. Seed project directions
INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_AI', 'Trí tuệ nhân tạo & Học máy chuyên sâu', 'Nghiên cứu thị giác máy tính, xử lý ngôn ngữ tự nhiên, LLMs và AI Agents.', d.id, TRUE
FROM departments d WHERE d.code = 'KHMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_SE', 'Kỹ thuật phần mềm & Kiến trúc Microservices', 'Phát triển hệ thống phần mềm lớn, Clean Architecture, CI/CD, DevOps.', d.id, TRUE
FROM departments d WHERE d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_WEB_CLOUD', 'Ứng dụng Web hiện đại & Điện toán đám mây', 'Xây dựng web phân tán, Cloud-Native, High Availability, Kubernetes.', d.id, TRUE
FROM departments d WHERE d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_SECURITY', 'An toàn thông tin & Bảo mật mạng', 'Mật mã học, kiểm thử thâm nhập, bảo mật hệ thống mạng và ứng dụng.', d.id, TRUE
FROM departments d WHERE d.code = 'MMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_IOT', 'Internet vạn vật (IoT) & Hệ thống nhúng thông minh', 'Thiết bị IoT, Smart Home/City, vi điều khiển và xử lý tín hiệu cảm biến.', d.id, TRUE
FROM departments d WHERE d.code = 'MMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id, is_active)
SELECT 'HD_DATA', 'Khoa học dữ liệu & Kỹ thuật dữ liệu lớn', 'Data Pipeline, Big Data analytics, Business Intelligence và Data Warehouse.', d.id, TRUE
FROM departments d WHERE d.code = 'HTTT'
ON CONFLICT (code) DO NOTHING;

-- 4. Seed lecturer directions mappings
INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, TRUE, 'Hướng nghiên cứu chính của giảng viên', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Hướng nghiên cứu phụ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_SE'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Điện toán đám mây & Web', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_WEB_CLOUD'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Bảo mật phần mềm', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, TRUE, 'Chuyên gia bảo mật và an ninh mạng', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Hệ thống nhúng và mạng cảm biến', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_IOT'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'AI ứng dụng trong an toàn thông tin', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Phân tích dữ liệu lớn IoT', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_DATA'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, TRUE, 'Kỹ thuật phần mềm', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_SE'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Khoa học dữ liệu', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_DATA'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Điện toán đám mây & Web', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_WEB_CLOUD'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, project_direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, d.id, FALSE, 'Hệ thống nhúng IoT', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_IOT'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- 5. Seed lecturer capacities for all project rounds
INSERT INTO lecturer_capacities (lecturer_id, project_round_id, base_quota, effective_capacity, assigned_count, max_quota, capacity_factor, current_assigned, is_active, note, created_at, updated_at)
SELECT l.id, r.id, 5, 5, 0, 5, 1.0, 0, TRUE, 'Chỉ tiêu tiêu chuẩn đợt đồ án', NOW(), NOW()
FROM lecturers l, project_rounds r
ON CONFLICT (lecturer_id, project_round_id) DO NOTHING;
