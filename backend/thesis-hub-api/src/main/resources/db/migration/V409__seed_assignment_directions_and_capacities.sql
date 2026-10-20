-- =============================================================================
-- Migration: V409__seed_assignment_directions_and_capacities.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Ensures project directions, lecturer capacities, and lecturer directions are populated safely.
-- =============================================================================

-- 1. Safely ensure lecturer_capacities columns exist and are nullable/defaulted
DO $$
BEGIN
    -- Ensure standard columns exist (from V202)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'max_quota') THEN
        ALTER TABLE lecturer_capacities ADD COLUMN max_quota INT NOT NULL DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'capacity_factor') THEN
        ALTER TABLE lecturer_capacities ADD COLUMN capacity_factor DOUBLE PRECISION NOT NULL DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'current_assigned') THEN
        ALTER TABLE lecturer_capacities ADD COLUMN current_assigned INT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'is_active') THEN
        ALTER TABLE lecturer_capacities ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- If legacy columns exist, ensure they do not block INSERTs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'base_quota') THEN
        ALTER TABLE lecturer_capacities ALTER COLUMN base_quota DROP NOT NULL;
        ALTER TABLE lecturer_capacities ALTER COLUMN base_quota SET DEFAULT 5;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'effective_capacity') THEN
        ALTER TABLE lecturer_capacities ALTER COLUMN effective_capacity DROP NOT NULL;
        ALTER TABLE lecturer_capacities ALTER COLUMN effective_capacity SET DEFAULT 5;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'assigned_count') THEN
        ALTER TABLE lecturer_capacities ALTER COLUMN assigned_count DROP NOT NULL;
        ALTER TABLE lecturer_capacities ALTER COLUMN assigned_count SET DEFAULT 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'capacity_coefficient') THEN
        ALTER TABLE lecturer_capacities ALTER COLUMN capacity_coefficient DROP NOT NULL;
        ALTER TABLE lecturer_capacities ALTER COLUMN capacity_coefficient SET DEFAULT 1.0;
    END IF;

    -- Handle lecturer_directions legacy columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_directions' AND column_name = 'direction_id') THEN
        ALTER TABLE lecturer_directions ADD COLUMN direction_id BIGINT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id') THEN
            UPDATE lecturer_directions SET direction_id = project_direction_id WHERE direction_id IS NULL;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id') THEN
        ALTER TABLE lecturer_directions ALTER COLUMN project_direction_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Ensure unique index on lecturer_directions for (lecturer_id, direction_id)
-- First clean up any accidental duplicate rows
DELETE FROM lecturer_directions a USING lecturer_directions b
WHERE a.id < b.id 
  AND a.lecturer_id = b.lecturer_id 
  AND a.direction_id = b.direction_id;

CREATE UNIQUE INDEX IF NOT EXISTS uk_lecturer_directions_lect_dir ON lecturer_directions(lecturer_id, direction_id);

-- 3. Seed project directions
INSERT INTO project_directions (code, name, description, department_id, is_active)
VALUES 
('HD_AI', 'Trí tuệ nhân tạo & Học máy chuyên sâu', 'Nghiên cứu thị giác máy tính, xử lý ngôn ngữ tự nhiên, LLMs và AI Agents.', (SELECT id FROM departments WHERE code = 'KHMT' LIMIT 1), TRUE),
('HD_SE', 'Kỹ thuật phần mềm & Kiến trúc Microservices', 'Phát triển hệ thống phần mềm lớn, Clean Architecture, CI/CD, DevOps.', (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1), TRUE),
('HD_WEB_CLOUD', 'Ứng dụng Web hiện đại & Điện toán đám mây', 'Xây dựng web phân tán, Cloud-Native, High Availability, Kubernetes.', (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1), TRUE),
('HD_SECURITY', 'An toàn thông tin & Bảo mật mạng', 'Mật mã học, kiểm thử thâm nhập, bảo mật hệ thống mạng và ứng dụng.', (SELECT id FROM departments WHERE code = 'MMT' LIMIT 1), TRUE),
('HD_IOT', 'Internet vạn vật (IoT) & Hệ thống nhúng thông minh', 'Thiết bị IoT, Smart Home/City, vi điều khiển và xử lý tín hiệu cảm biến.', (SELECT id FROM departments WHERE code = 'MMT' LIMIT 1), TRUE),
('HD_DATA', 'Khoa học dữ liệu & Kỹ thuật dữ liệu lớn', 'Data Pipeline, Big Data analytics, Business Intelligence và Data Warehouse.', (SELECT id FROM departments WHERE code = 'HTTT' LIMIT 1), TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed lecturer directions mappings (only standard columns)
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng nghiên cứu chính của giảng viên', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng nghiên cứu phụ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_SE'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Điện toán đám mây & Web', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_WEB_CLOUD'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Bảo mật phần mềm', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Chuyên gia bảo mật và an ninh mạng', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hệ thống nhúng và mạng cảm biến', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_IOT'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'AI ứng dụng trong an toàn thông tin', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Phân tích dữ liệu lớn IoT', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_DATA'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Kỹ thuật phần mềm', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_SE'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Khoa học dữ liệu', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_DATA'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Điện toán đám mây & Web', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_WEB_CLOUD'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hệ thống nhúng IoT', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_IOT'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- If project_direction_id exists in lecturer_directions, sync it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id') THEN
        UPDATE lecturer_directions SET project_direction_id = direction_id WHERE project_direction_id IS NULL;
    END IF;
END $$;

-- 5. Seed lecturer capacities for all project rounds (standard columns)
INSERT INTO lecturer_capacities (lecturer_id, project_round_id, max_quota, capacity_factor, current_assigned, is_active, note, created_at, updated_at)
SELECT l.id, r.id, 5, 1.0, 0, TRUE, 'Chỉ tiêu tiêu chuẩn đợt đồ án', NOW(), NOW()
FROM lecturers l, project_rounds r
ON CONFLICT (lecturer_id, project_round_id) DO NOTHING;

-- If legacy columns exist in lecturer_capacities, sync them
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'base_quota') THEN
        UPDATE lecturer_capacities SET base_quota = max_quota WHERE base_quota IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'effective_capacity') THEN
        UPDATE lecturer_capacities SET effective_capacity = max_quota WHERE effective_capacity IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'assigned_count') THEN
        UPDATE lecturer_capacities SET assigned_count = current_assigned WHERE assigned_count IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_capacities' AND column_name = 'capacity_coefficient') THEN
        UPDATE lecturer_capacities SET capacity_coefficient = capacity_factor WHERE capacity_coefficient IS NULL;
    END IF;
END $$;
