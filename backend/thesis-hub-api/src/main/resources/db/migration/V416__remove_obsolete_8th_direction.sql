-- =============================================================================
-- Migration: V416__remove_obsolete_8th_direction.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Completely removes obsolete 8th direction (HD_CNPM_WEB - Công nghệ phần mềm & Web nâng cao).
-- Exactly 7 official directions are retained:
--   1. HD_PM_APP: Phát triển phần mềm và ứng dụng (webApp, MobileApp)
--   2. HD_DATA_AI: Dữ liệu và trí tuệ nhân tạo
--   3. HD_GAME: Lập trình Game
--   4. HD_TESTING: Kiểm thử phần mềm
--   5. HD_NET_INFRA: Hệ thống, mạng và hạ tầng CNTT
--   6. HD_SECURITY: An toàn thông tin và an ninh mạng
--   7. HD_ALGO: Nghiên cứu và ứng dụng thuật toán
-- =============================================================================

-- 1. Remove references in lecturer_directions for HD_CNPM_WEB
DELETE FROM lecturer_directions
WHERE direction_id IN (
    SELECT id FROM project_directions WHERE code = 'HD_CNPM_WEB'
);

-- Also handle project_direction_id column if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id'
    ) THEN
        DELETE FROM lecturer_directions
        WHERE project_direction_id IN (
            SELECT id FROM project_directions WHERE code = 'HD_CNPM_WEB'
        );
    END IF;
END $$;

-- 2. Clear direction registrations pointing to HD_CNPM_WEB
DELETE FROM direction_registrations
WHERE direction_id IN (
    SELECT id FROM project_directions WHERE code = 'HD_CNPM_WEB'
);

-- 3. Reset supervisor assignments pointing to HD_CNPM_WEB
UPDATE supervisor_assignments
SET direction_id = NULL
WHERE direction_id IN (
    SELECT id FROM project_directions WHERE code = 'HD_CNPM_WEB'
);

-- 4. Delete the obsolete 8th direction
DELETE FROM project_directions
WHERE code = 'HD_CNPM_WEB';

-- 5. Clean any other non-7 directions just in case
DELETE FROM project_directions
WHERE code NOT IN (
    'HD_PM_APP', 'HD_DATA_AI', 'HD_GAME', 'HD_TESTING', 'HD_NET_INFRA', 'HD_SECURITY', 'HD_ALGO'
);

-- 6. Add GPA columns to students and student_project_rounds
ALTER TABLE students ADD COLUMN IF NOT EXISTS gpa NUMERIC(4,2) DEFAULT 3.20;
ALTER TABLE student_project_rounds ADD COLUMN IF NOT EXISTS gpa NUMERIC(4,2) DEFAULT 3.20;

