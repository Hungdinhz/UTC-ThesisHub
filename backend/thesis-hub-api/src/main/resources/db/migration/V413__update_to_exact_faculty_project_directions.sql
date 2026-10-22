-- =============================================================================
-- Migration: V413__update_to_exact_faculty_project_directions.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Updates the active project directions to exactly match the 7 directions of the faculty:
--   1. Phát triển phần mềm và ứng dụng (webApp, MobileApp)
--   2. Dữ liệu và trí tuệ nhân tạo
--   3. Lập trình Game
--   4. Kiểm thử phần mềm
--   5. Hệ thống, mạng và hạ tầng CNTT
--   6. An toàn thông tin và an ninh mạng
--   7. Nghiên cứu và ứng dụng thuật toán
-- =============================================================================

-- 1. Remove old lecturer_directions mappings first
DELETE FROM lecturer_directions;

-- 2. Clear any direction registrations or references to obsolete directions if any
DELETE FROM direction_registrations 
WHERE direction_id NOT IN (
    SELECT id FROM project_directions 
    WHERE code IN ('HD_PM_APP', 'HD_DATA_AI', 'HD_GAME', 'HD_TESTING', 'HD_NET_INFRA', 'HD_SECURITY', 'HD_ALGO')
);

UPDATE supervisor_assignments 
SET direction_id = NULL 
WHERE direction_id NOT IN (
    SELECT id FROM project_directions 
    WHERE code IN ('HD_PM_APP', 'HD_DATA_AI', 'HD_GAME', 'HD_TESTING', 'HD_NET_INFRA', 'HD_SECURITY', 'HD_ALGO')
);

-- Delete obsolete project directions
DELETE FROM project_directions 
WHERE code NOT IN ('HD_PM_APP', 'HD_DATA_AI', 'HD_GAME', 'HD_TESTING', 'HD_NET_INFRA', 'HD_SECURITY', 'HD_ALGO');

-- 3. Upsert the exact 7 faculty directions
INSERT INTO project_directions (code, name, description, department_id, is_active, created_at, updated_at)
VALUES
(
    'HD_PM_APP',
    'Phát triển phần mềm và ứng dụng (webApp, MobileApp)',
    'Phát triển các hệ thống phần mềm quy mô lớn, ứng dụng Web và Mobile App, kiến trúc phần mềm, CI/CD và DevOps.',
    (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_DATA_AI',
    'Dữ liệu và trí tuệ nhân tạo',
    'Khai phá dữ liệu lớn (Big Data), học máy (Machine Learning), Deep Learning, thị giác máy tính, NLP và ứng dụng AI thông minh.',
    (SELECT id FROM departments WHERE code = 'KHMT' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_GAME',
    'Lập trình Game',
    'Thiết kế và phát triển trò chơi đa nền tảng (Unity, Unreal Engine), mô phỏng vật lý, đồ họa 3D và tương tác thời gian thực.',
    (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_TESTING',
    'Kiểm thử phần mềm',
    'Kiểm thử tự động (Automation Testing), quy trình bảo đảm chất lượng QA/QC, Performance Testing, Security Testing và Test Frameworks.',
    (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_NET_INFRA',
    'Hệ thống, mạng và hạ tầng CNTT',
    'Thiết kế hạ tầng mạng doanh nghiệp, quản trị hệ thống Linux/Windows, ảo hóa, điện toán đám mây và triển khai hạ tầng CNTT.',
    (SELECT id FROM departments WHERE code = 'MMT' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_SECURITY',
    'An toàn thông tin và an ninh mạng',
    'An toàn thông tin, bảo mật mạng, kiểm thử xâm nhập (Penetration Testing), điều tra số (Digital Forensics) và an toàn ứng dụng.',
    (SELECT id FROM departments WHERE code = 'MMT' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
),
(
    'HD_ALGO',
    'Nghiên cứu và ứng dụng thuật toán',
    'Cấu trúc dữ liệu và giải thuật nâng cao, tối ưu hóa tổ hợp, lý thuyết đồ thị và ứng dụng thuật toán giải quyết các bài toán thực tế.',
    (SELECT id FROM departments WHERE code = 'KHMT' LIMIT 1),
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    department_id = EXCLUDED.department_id,
    is_active = TRUE,
    updated_at = NOW();

-- 4. Seed lecturer directions mappings
-- GV001 (TS. Trần Văn Giảng Viên - CNPM)
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_PM_APP'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code IN ('HD_DATA_AI', 'HD_GAME', 'HD_TESTING')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- HD001 (PGS.TS. Lê Văn Hội Đồng - KHMT/MMT)
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code IN ('HD_NET_INFRA', 'HD_DATA_AI', 'HD_ALGO')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- GV002 (TS. Nguyễn Văn Cống - CNPM)
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_PM_APP'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code IN ('HD_GAME', 'HD_TESTING', 'HD_ALGO')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- Phủ đều các hướng còn lại cho các giảng viên để đảm bảo sinh viên chọn bất kỳ hướng nào cũng có giảng viên hướng dẫn
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng nghiên cứu mở rộng', NOW(), NOW()
FROM lecturers l
CROSS JOIN project_directions d
WHERE d.code IN ('HD_PM_APP', 'HD_DATA_AI', 'HD_GAME', 'HD_TESTING', 'HD_NET_INFRA', 'HD_SECURITY', 'HD_ALGO')
  AND NOT EXISTS (
      SELECT 1 FROM lecturer_directions ld WHERE ld.lecturer_id = l.id AND ld.direction_id = d.id
  )
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- Đồng bộ legacy column project_direction_id nếu bảng có cột này
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id') THEN
        UPDATE lecturer_directions SET project_direction_id = direction_id WHERE project_direction_id IS NULL;
    END IF;
END $$;
