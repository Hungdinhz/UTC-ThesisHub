-- =============================================================================
-- Migration: V410__fix_module3_schema_and_seed_data.sql
-- Module: Module 3 (Thesis & Project Execution) - Owner: Ngo Minh Quyet
-- Description: Align schema with JPA entities, adjust constraints, and seed data.
-- =============================================================================

-- 1. Proposals: drop old not-null constraints safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposals' AND column_name='thesis_id') THEN
        ALTER TABLE proposals ALTER COLUMN thesis_id DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposals' AND column_name='title') THEN
        ALTER TABLE proposals ALTER COLUMN title DROP NOT NULL;
    END IF;
END $$;

-- 2. Theses: drop old not-null title safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='theses' AND column_name='title') THEN
        ALTER TABLE theses ALTER COLUMN title DROP NOT NULL;
    END IF;
END $$;

-- 3. Review Groups: add missing columns safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_groups' AND column_name='code') THEN
        ALTER TABLE review_groups ADD COLUMN code VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_groups' AND column_name='department_id') THEN
        ALTER TABLE review_groups ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Review Group Members: add review_group_id and drop not null on group_id safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_group_members' AND column_name='review_group_id') THEN
        ALTER TABLE review_group_members ADD COLUMN review_group_id BIGINT REFERENCES review_groups(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_group_members' AND column_name='group_id') THEN
        ALTER TABLE review_group_members ALTER COLUMN group_id DROP NOT NULL;
    END IF;
END $$;

-- 5. Proposal Review Assignments: add review_group_id, evaluation_notes, decision_date safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposal_review_assignments' AND column_name='review_group_id') THEN
        ALTER TABLE proposal_review_assignments ADD COLUMN review_group_id BIGINT REFERENCES review_groups(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposal_review_assignments' AND column_name='evaluation_notes') THEN
        ALTER TABLE proposal_review_assignments ADD COLUMN evaluation_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposal_review_assignments' AND column_name='decision_date') THEN
        ALTER TABLE proposal_review_assignments ADD COLUMN decision_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proposal_review_assignments' AND column_name='group_id') THEN
        ALTER TABLE proposal_review_assignments ALTER COLUMN group_id DROP NOT NULL;
    END IF;
END $$;

-- 6. Documents: drop old not null columns safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='doc_type') THEN
        ALTER TABLE documents ALTER COLUMN doc_type DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='file_name') THEN
        ALTER TABLE documents ALTER COLUMN file_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='uploaded_by') THEN
        ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='status') THEN
        ALTER TABLE documents ALTER COLUMN status DROP NOT NULL;
    END IF;
END $$;

-- 7. Tasks: drop old not null columns safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee_id') THEN
        ALTER TABLE tasks ALTER COLUMN assignee_id DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigner_id') THEN
        ALTER TABLE tasks ALTER COLUMN assigner_id DROP NOT NULL;
    END IF;
END $$;

-- 8. Comments: drop old not null columns safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='author_id') THEN
        ALTER TABLE comments ALTER COLUMN author_id DROP NOT NULL;
    END IF;
END $$;

-- 9. Progress Reports: drop old not null columns safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_reports' AND column_name='title') THEN
        ALTER TABLE progress_reports ALTER COLUMN title DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_reports' AND column_name='report_date') THEN
        ALTER TABLE progress_reports ALTER COLUMN report_date DROP NOT NULL;
    END IF;
END $$;

-- 10. Progress Feedbacks: add missing columns & drop old not null safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='progress_report_id') THEN
        ALTER TABLE progress_feedbacks ADD COLUMN progress_report_id BIGINT REFERENCES progress_reports(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='feedback_content') THEN
        ALTER TABLE progress_feedbacks ADD COLUMN feedback_content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='assessment') THEN
        ALTER TABLE progress_feedbacks ADD COLUMN assessment VARCHAR(30) DEFAULT 'DAT';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='confirmed_completion_rate') THEN
        ALTER TABLE progress_feedbacks ADD COLUMN confirmed_completion_rate NUMERIC(5,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='feedback_at') THEN
        ALTER TABLE progress_feedbacks ADD COLUMN feedback_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='report_id') THEN
        ALTER TABLE progress_feedbacks ALTER COLUMN report_id DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='feedback') THEN
        ALTER TABLE progress_feedbacks ALTER COLUMN feedback DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='progress_feedbacks' AND column_name='is_satisfactory') THEN
        ALTER TABLE progress_feedbacks ALTER COLUMN is_satisfactory DROP NOT NULL;
    END IF;
END $$;

-- 11. Update check constraints to match entity enums safely
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS chk_proposals_status;
UPDATE proposals SET status = 'DRAFT' WHERE status NOT IN ('DRAFT', 'SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'APPROVED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED');
ALTER TABLE proposals ADD CONSTRAINT chk_proposals_status CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'APPROVED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED')
);

ALTER TABLE proposal_review_assignments DROP CONSTRAINT IF EXISTS chk_proposal_review_assignments_status;
ALTER TABLE proposal_review_assignments DROP CONSTRAINT IF EXISTS chk_proposal_review_assignments_result;
ALTER TABLE proposal_review_assignments DROP CONSTRAINT IF EXISTS chk_proposal_review_status;
UPDATE proposal_review_assignments SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'IN_REVIEW', 'REVIEWING', 'REVIEWED', 'APPROVED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED');
ALTER TABLE proposal_review_assignments ADD CONSTRAINT chk_proposal_review_status CHECK (
    status IN ('PENDING', 'IN_REVIEW', 'REVIEWING', 'REVIEWED', 'APPROVED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED')
);

ALTER TABLE review_group_members DROP CONSTRAINT IF EXISTS chk_review_group_members_role;
UPDATE review_group_members SET role = 'MEMBER' WHERE role NOT IN ('LEADER', 'SECRETARY', 'MEMBER');
ALTER TABLE review_group_members ADD CONSTRAINT chk_review_group_members_role CHECK (
    role IN ('LEADER', 'SECRETARY', 'MEMBER')
);

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS chk_submissions_status;
UPDATE submissions SET status = 'SUBMITTED' WHERE status NOT IN ('SUBMITTED', 'PENDING', 'ACCEPTED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED');
ALTER TABLE submissions ADD CONSTRAINT chk_submissions_status CHECK (
    status IN ('SUBMITTED', 'PENDING', 'ACCEPTED', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'REJECTED')
);

ALTER TABLE theses DROP CONSTRAINT IF EXISTS chk_theses_status;
UPDATE theses SET status = 'IN_PROGRESS' WHERE status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DEFENSE_READY', 'COMPLETED', 'CANCELLED', 'CANCELED', 'REVISION_REQUIRED', 'REJECTED');
ALTER TABLE theses ADD CONSTRAINT chk_theses_status CHECK (
    status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DEFENSE_READY', 'COMPLETED', 'CANCELLED', 'CANCELED', 'REVISION_REQUIRED', 'REJECTED')
);

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_tasks_status;
UPDATE tasks SET status = 'TODO' WHERE status NOT IN ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'REVISE', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'COMPLETED', 'CANCELLED');
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_status CHECK (
    status IN ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'REVISE', 'REVISE_REQUIRED', 'REVISION_REQUIRED', 'COMPLETED', 'CANCELLED')
);

ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_type;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_status;

-- 12. Add Unique Constraints safely (cleanup duplicates if any exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_review_groups_round_code') THEN
        DELETE FROM review_groups a USING review_groups b WHERE a.id < b.id AND a.project_round_id = b.project_round_id AND a.code = b.code;
        ALTER TABLE review_groups ADD CONSTRAINT uk_review_groups_round_code UNIQUE (project_round_id, code);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_review_group_members') THEN
        DELETE FROM review_group_members a USING review_group_members b WHERE a.id < b.id AND a.review_group_id = b.review_group_id AND a.lecturer_id = b.lecturer_id;
        ALTER TABLE review_group_members ADD CONSTRAINT uk_review_group_members UNIQUE (review_group_id, lecturer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_proposals_student_round') THEN
        DELETE FROM proposals a USING proposals b WHERE a.id < b.id AND a.student_id = b.student_id AND a.project_round_id = b.project_round_id;
        ALTER TABLE proposals ADD CONSTRAINT uk_proposals_student_round UNIQUE (student_id, project_round_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_proposal_review_assignments') THEN
        DELETE FROM proposal_review_assignments a USING proposal_review_assignments b WHERE a.id < b.id AND a.proposal_id = b.proposal_id AND a.review_group_id = b.review_group_id;
        ALTER TABLE proposal_review_assignments ADD CONSTRAINT uk_proposal_review_assignments UNIQUE (proposal_id, review_group_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_theses_student_round') THEN
        DELETE FROM theses a USING theses b WHERE a.id < b.id AND a.student_id = b.student_id AND a.project_round_id = b.project_round_id;
        ALTER TABLE theses ADD CONSTRAINT uk_theses_student_round UNIQUE (student_id, project_round_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_progress_feedbacks_report') THEN
        DELETE FROM progress_feedbacks a USING progress_feedbacks b WHERE a.id < b.id AND a.progress_report_id = b.progress_report_id;
        ALTER TABLE progress_feedbacks ADD CONSTRAINT uk_progress_feedbacks_report UNIQUE (progress_report_id);
    END IF;
END $$;

-- 13. Seed sample data for Module 3 safely
INSERT INTO review_groups (project_round_id, department_id, code, name, description, status)
SELECT 
    r.id, 
    d.id, 
    'RG_CNPM_01', 
    'Tiểu ban Xét duyệt Đề cương Công nghệ phần mềm 01', 
    'Tiểu ban phụ trách đánh giá và phê duyệt đề cương tốt nghiệp chuyên ngành Kỹ thuật phần mềm',
    'ACTIVE'
FROM project_rounds r
CROSS JOIN (SELECT id FROM departments WHERE code = 'CNPM' LIMIT 1) d
WHERE r.round_code = 'DA_CNTT_K62_HK1'
ON CONFLICT (project_round_id, code) DO NOTHING;

INSERT INTO review_group_members (review_group_id, lecturer_id, role)
SELECT rg.id, l.id, 'LEADER'
FROM review_groups rg
CROSS JOIN lecturers l
JOIN users u ON l.user_id = u.id
WHERE rg.code = 'RG_CNPM_01' AND u.username = 'giangvien'
ON CONFLICT (review_group_id, lecturer_id) DO NOTHING;

INSERT INTO review_group_members (review_group_id, lecturer_id, role)
SELECT rg.id, l.id, 'MEMBER'
FROM review_groups rg
CROSS JOIN lecturers l
JOIN users u ON l.user_id = u.id
WHERE rg.code = 'RG_CNPM_01' AND u.username = 'hoidong'
ON CONFLICT (review_group_id, lecturer_id) DO NOTHING;

INSERT INTO proposals (
    project_round_id, student_id, lecturer_id, 
    title_vn, title_en, description, objectives, expected_results, research_content, 
    file_url, status, supervisor_approved, supervisor_comment, version, submitted_at
)
SELECT 
    r.id, s.id, l.id,
    'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
    'Research and development of UTC-ThesisHub graduation thesis management system',
    'Đề tài tập trung giải quyết bài toán số hóa toàn diện quy trình quản lý đồ án tốt nghiệp tại Khoa CNTT - ĐHGTVT.',
    'Xây dựng thành công nền tảng web hiện đại hỗ trợ đăng ký nguyện vọng, xét duyệt đề cương, theo dõi tiến độ và chấm điểm đồ án.',
    'Hệ thống backend Spring Boot và giao diện React hoàn chỉnh, quy trình nghiệp vụ thông suốt.',
    'Phân tích kiến trúc Modular Monolith, thiết kế CSDL quan hệ chuẩn hóa 37 bảng, triển khai thuật toán phân công bán tự động.',
    '/uploads/proposals/de_cuong_thesishub_k62.pdf',
    'APPROVED',
    TRUE,
    'Đề cương rõ ràng, mục tiêu thực tiễn, nhất trí thông qua đề cương.',
    1,
    CURRENT_TIMESTAMP - INTERVAL '15 days'
FROM project_rounds r
CROSS JOIN (SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.username = 'sinhvien' LIMIT 1) s
CROSS JOIN (SELECT l.id FROM lecturers l JOIN users u ON l.user_id = u.id WHERE u.username = 'giangvien' LIMIT 1) l
WHERE r.round_code = 'DA_CNTT_K62_HK1'
ON CONFLICT (student_id, project_round_id) DO NOTHING;

INSERT INTO proposal_review_assignments (
    proposal_id, review_group_id, assigned_by, status, evaluation_notes, decision_date
)
SELECT 
    p.id, rg.id, u.id, 'APPROVED',
    'Đề cương đạt chất lượng tốt, tính ứng dụng cao, đáp ứng khối lượng chuẩn của đồ án tốt nghiệp bậc cử nhân.',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM proposals p
JOIN project_rounds r ON p.project_round_id = r.id
CROSS JOIN review_groups rg
CROSS JOIN users u
WHERE r.round_code = 'DA_CNTT_K62_HK1' 
  AND rg.code = 'RG_CNPM_01'
  AND u.username = 'admin'
ON CONFLICT (proposal_id, review_group_id) DO NOTHING;

INSERT INTO theses (
    proposal_id, project_round_id, student_id, lecturer_id, 
    thesis_code, title_vn, title_en, description, objectives, scope, technologies, 
    status, completion_rate, defense_eligible
)
SELECT 
    p.id, r.id, s.id, l.id,
    'DT_2026_CNTT_001',
    'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
    'Research and development of UTC-ThesisHub graduation thesis management system',
    'Hệ thống quản lý đồ án tốt nghiệp trực tuyến hỗ trợ toàn bộ vòng đời đồ án từ đăng ký tới bảo vệ.',
    'Số hóa 100% hồ sơ quy trình đồ án tốt nghiệp khoa CNTT.',
    'Phạm vi áp dụng cho sinh viên K62 và toàn thể giảng viên Khoa CNTT.',
    'Spring Boot 3, Java 21, PostgreSQL, React, TypeScript, Docker',
    'IN_PROGRESS',
    50.00,
    FALSE
FROM proposals p
JOIN project_rounds r ON p.project_round_id = r.id
JOIN students s ON p.student_id = s.id
JOIN lecturers l ON p.lecturer_id = l.id
WHERE r.round_code = 'DA_CNTT_K62_HK1'
ON CONFLICT (student_id, project_round_id) DO NOTHING;

INSERT INTO documents (
    thesis_id, uploader_id, name, document_type, file_url, file_size, mime_type, version, is_latest, description
)
SELECT 
    t.id, u.id, 
    'Đề cương chi tiết đồ án tốt nghiệp ThesisHub.pdf',
    'PROPOSAL',
    '/files/theses/DT_2026_CNTT_001/de_cuong_v1.pdf',
    2048576,
    'application/pdf',
    1,
    TRUE,
    'Bản đề cương hoàn chỉnh đã được tiểu ban duyệt thông qua.'
FROM theses t
JOIN users u ON u.username = 'sinhvien'
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (
    thesis_id, created_by, assigned_to, title, description, priority, status, due_date, completed_at
)
SELECT 
    t.id, u_gv.id, u_sv.id,
    'Thiết kế và chuẩn hóa lược đồ CSDL quan hệ 37 bảng',
    'Thiết kế bảng, khóa chính, khóa ngoại, chỉ mục index và migration scripts Flyway cho toàn bộ các module.',
    'HIGH',
    'COMPLETED',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '6 days'
FROM theses t
CROSS JOIN (SELECT id FROM users WHERE username = 'giangvien') u_gv
CROSS JOIN (SELECT id FROM users WHERE username = 'sinhvien') u_sv
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (
    thesis_id, created_by, assigned_to, title, description, priority, status, due_date
)
SELECT 
    t.id, u_gv.id, u_sv.id,
    'Phát triển tầng Service và Rest Controller cho module Thesis & Progress',
    'Triển khai các API quản lý đề tài, quản lý đề cương, nộp bài task và báo cáo tiến độ.',
    'URGENT',
    'IN_PROGRESS',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM theses t
CROSS JOIN (SELECT id FROM users WHERE username = 'giangvien') u_gv
CROSS JOIN (SELECT id FROM users WHERE username = 'sinhvien') u_sv
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (
    thesis_id, created_by, assigned_to, title, description, priority, status, due_date
)
SELECT 
    t.id, u_gv.id, u_sv.id,
    'Thiết kế giao diện bảng Kanban và khung thảo luận Task',
    'Xây dựng các cột Todo, In Progress, Submitted, Completed và hộp thoại bình luận trực tiếp.',
    'MEDIUM',
    'TODO',
    CURRENT_TIMESTAMP + INTERVAL '14 days'
FROM theses t
CROSS JOIN (SELECT id FROM users WHERE username = 'giangvien') u_gv
CROSS JOIN (SELECT id FROM users WHERE username = 'sinhvien') u_sv
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT DO NOTHING;

INSERT INTO submissions (
    task_id, student_id, title, submission_content, file_url, status, review_feedback, reviewed_at, submitted_at
)
SELECT 
    tsk.id, s.id,
    'Báo cáo thiết kế ERD và kịch bản Migration V301 - V303',
    'Em đã hoàn thiện thiết kế 11 bảng thuộc module Thesis & Execution, đã test chạy migration trên PostgreSQL thành công.',
    '/files/submissions/erd_and_migration_v1.zip',
    'ACCEPTED',
    'Thiết kế chuẩn chỉnh, đúng ràng buộc nghiệp vụ của khoa. Tiếp tục triển khai backend.',
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
FROM tasks tsk
JOIN theses t ON tsk.thesis_id = t.id
CROSS JOIN (SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.username = 'sinhvien' LIMIT 1) s
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%lược đồ CSDL%'
ON CONFLICT DO NOTHING;

INSERT INTO comments (task_id, user_id, content, created_at)
SELECT 
    tsk.id, u_gv.id,
    'Em lưu ý phân quyền kỹ giữa Giảng viên hướng dẫn và Sinh viên nhé, chỉ GVHD mới có quyền duyệt hoàn thành task.',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM tasks tsk
JOIN theses t ON tsk.thesis_id = t.id
CROSS JOIN (SELECT id FROM users WHERE username = 'giangvien') u_gv
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%Phát triển tầng Service%'
ON CONFLICT DO NOTHING;

INSERT INTO comments (task_id, user_id, content, created_at)
SELECT 
    tsk.id, u_sv.id,
    'Dạ vâng thầy, em đã thêm kiểm tra Security và trả về 403 Forbidden nếu không đúng quyền ạ.',
    CURRENT_TIMESTAMP - INTERVAL '1 days'
FROM tasks tsk
JOIN theses t ON tsk.thesis_id = t.id
CROSS JOIN (SELECT id FROM users WHERE username = 'sinhvien') u_sv
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%Phát triển tầng Service%'
ON CONFLICT DO NOTHING;

INSERT INTO progress_reports (
    thesis_id, student_id, milestone_id, report_title, 
    completed_work, planned_work, difficulties, progress_percent, file_url, status, submitted_at
)
SELECT 
    t.id, s.id, m.id,
    'Báo cáo tiến độ đồ án - Đợt 1 (Giai đoạn Phân tích & Thiết kế)',
    '1. Hoàn thành đề cương chi tiết.\n2. Thiết kế kiến trúc Modular Monolith và lược đồ DB 37 bảng.\n3. Hoàn thành kịch bản Flyway migration.',
    '1. Xây dựng Rest API cho Đề tài và Task.\n2. Thiết kế giao diện React Kanban Board.',
    'Cần thống nhất định dạng dữ liệu DTO trao đổi với module Phân công của bạn Công.',
    50,
    '/files/reports/bao_cao_tien_do_dot_1.pdf',
    'REVIEWED',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM theses t
JOIN students s ON t.student_id = s.id
LEFT JOIN timeline_milestones m ON m.project_round_id = t.project_round_id AND m.phase_type = 'REGISTRATION'
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT DO NOTHING;

INSERT INTO progress_feedbacks (
    progress_report_id, lecturer_id, feedback_content, assessment, confirmed_completion_rate, feedback_at
)
SELECT 
    pr.id, l.id,
    'Tiến độ thực hiện tốt, sinh viên chủ động và bám sát kế hoạch. Đồng ý mức tiến độ 50%.',
    'DAT',
    50.00,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM progress_reports pr
JOIN theses t ON pr.thesis_id = t.id
JOIN lecturers l ON t.lecturer_id = l.id
WHERE t.thesis_code = 'DT_2026_CNTT_001'
ON CONFLICT (progress_report_id) DO NOTHING;
