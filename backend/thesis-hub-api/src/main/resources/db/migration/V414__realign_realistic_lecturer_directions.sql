-- V414: Re-align realistic lecturer directions (1-3 directions per lecturer instead of CROSS JOIN all 8 directions)
-- Phân bố chuyên môn thực tế: Mỗi giảng viên phụ trách 2-3 hướng nghiên cứu phù hợp với chuyên môn và học vị.
-- Tránh trường hợp hướng nào cũng hiển thị full 6 giảng viên gây mất ý nghĩa phân loại chuyên môn.

-- 1. Đảm bảo ràng buộc UNIQUE (lecturer_id, direction_id) luôn tồn tại để ON CONFLICT an toàn tuyệt đối
CREATE UNIQUE INDEX IF NOT EXISTS uk_lecturer_directions_lect_dir ON lecturer_directions(lecturer_id, direction_id);

-- 2. Xóa các mapping cũ bị phủ kín do CROSS JOIN
DELETE FROM lecturer_directions;

-- 3. Gán các hướng chuyên môn chuẩn hóa (chỉ insert vào các cột chuẩn của entity JPA):
-- GV001: TS. Trần Văn Giảng Viên (TIEN_SI, CNPM) -> PM_APP (chính), DATA_AI, TESTING
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code = 'HD_PM_APP'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV001' AND d.code IN ('HD_DATA_AI', 'HD_TESTING')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- HD001: PGS.TS. Lê Văn Hội Đồng (PGS, KHMT/MMT) -> SECURITY (chính), NET_INFRA, ALGO
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code = 'HD_SECURITY'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'HD001' AND d.code IN ('HD_NET_INFRA', 'HD_ALGO')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- GV002: TS. Nguyen Van Cong (TIEN_SI, CNPM/ATTT) -> GAME (chính), SECURITY, ALGO
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code = 'HD_GAME'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV002' AND d.code IN ('HD_SECURITY', 'HD_ALGO')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- GV003: Phùng Đình Hùng (THAC_SI, CNPM/AI) -> DATA_AI (chính), PM_APP, GAME
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV003' AND d.code = 'HD_DATA_AI'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV003' AND d.code IN ('HD_PM_APP', 'HD_GAME')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- GV_HUONGNV: TS. Nguyễn Văn Hướng (TIEN_SI, CNPM & Web) -> CNPM_WEB (chính), PM_APP, DATA_AI
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV_HUONGNV' AND d.code = 'HD_CNPM_WEB'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV_HUONGNV' AND d.code IN ('HD_PM_APP', 'HD_DATA_AI')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- GV_DONGPV: ThS. Phạm Văn Đồng (THAC_SI, Hạ tầng/Web/QA) -> NET_INFRA (chính), CNPM_WEB, TESTING
INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, TRUE, 'Hướng chuyên môn chính', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV_DONGPV' AND d.code = 'HD_NET_INFRA'
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

INSERT INTO lecturer_directions (lecturer_id, direction_id, is_primary, note, created_at, updated_at)
SELECT l.id, d.id, FALSE, 'Hướng chuyên môn bổ trợ', NOW(), NOW()
FROM lecturers l, project_directions d
WHERE l.lecturer_code = 'GV_DONGPV' AND d.code IN ('HD_CNPM_WEB', 'HD_TESTING')
ON CONFLICT (lecturer_id, direction_id) DO NOTHING;

-- 4. Đồng bộ legacy column project_direction_id nếu môi trường DB có tồn tại cột này (tương thích ngược hoàn toàn)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lecturer_directions' AND column_name = 'project_direction_id'
    ) THEN
        UPDATE lecturer_directions SET project_direction_id = direction_id WHERE project_direction_id IS NULL;
    END IF;
END $$;
