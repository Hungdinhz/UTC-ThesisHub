-- =============================================================================
-- Migration: V206__seed_assignment_sample_data.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Description: Seeds initial project directions, lecturer expertise mappings, and capacities.
-- =============================================================================

-- 1. SEED PROJECT DIRECTIONS (HUONGDOAN)
INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_AI', 'Trí tuệ nhân tạo & Học máy chuyên sâu', 'Nghiên cứu thị giác máy tính, xử lý ngôn ngữ tự nhiên, LLMs và AI Agents.', d.id
FROM departments d WHERE d.code = 'KHMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_SE', 'Kỹ thuật phần mềm & Kiến trúc Microservices', 'Phát triển hệ thống phần mềm lớn, Clean Architecture, CI/CD, DevOps.', d.id
FROM departments d WHERE d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_WEB_CLOUD', 'Ứng dụng Web hiện đại & Điện toán đám mây', 'Xây dựng web phân tán, Cloud-Native, High Availability, Kubernetes.', d.id
FROM departments d WHERE d.code = 'CNPM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_SECURITY', 'An toàn thông tin & Bảo mật mạng', 'Mật mã học, kiểm thử thâm nhập, bảo mật hệ thống mạng và ứng dụng.', d.id
FROM departments d WHERE d.code = 'MMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_IOT', 'Internet vạn vật (IoT) & Hệ thống nhúng thông minh', 'Thiết bị IoT, Smart Home/City, vi điều khiển và xử lý tín hiệu cảm biến.', d.id
FROM departments d WHERE d.code = 'MMT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO project_directions (code, name, description, department_id)
SELECT 'HD_DATA', 'Khoa học dữ liệu & Kỹ thuật dữ liệu lớn', 'Data Pipeline, Big Data analytics, Business Intelligence và Data Warehouse.', d.id
FROM departments d WHERE d.code = 'HTTT'
ON CONFLICT (code) DO NOTHING;

-- 2. SEED LECTURER DIRECTIONS (GIANGVIEN_HUONGDOAN)
-- Gán hướng cho GV001
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note)
SELECT l.id, d.id, TRUE, 'Hướng nghiên cứu chính của giảng viên'
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note)
SELECT l.id, d.id, FALSE, 'Hướng nghiên cứu phụ'
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_SE'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- Gán hướng cho HD001
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note)
SELECT l.id, d.id, TRUE, 'Chuyên gia bảo mật và an ninh mạng'
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note)
SELECT l.id, d.id, FALSE, 'Hệ thống nhúng và mạng cảm biến'
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_IOT'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- 3. SEED LECTURER CAPACITIES CHO ĐỢT DA_CNTT_K62_HK1 (CHITIEUGIANGVIEN)
INSERT INTO lecturer_capacities (lecturer_id, project_round_id, max_quota, capacity_factor, current_assigned, is_active, note)
SELECT l.id, r.id, 5, 1.0, 0, TRUE, 'Chỉ tiêu tiêu chuẩn đợt HK1'
FROM lecturers l, project_rounds r
WHERE r.round_code = 'DA_CNTT_K62_HK1'
ON CONFLICT (lecturer_id, project_round_id) DO NOTHING;
