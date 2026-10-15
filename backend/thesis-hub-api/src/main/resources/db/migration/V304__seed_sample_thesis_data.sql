-- =============================================================================
-- Migration: V304__seed_sample_thesis_data.sql
-- Module: Module 3 (Thesis & Project Execution) - Owner: Ngo Minh Quyet
-- Description: Seeds realistic test/demo data for Proposals, Review Groups, Theses, Tasks, Submissions, Comments, and Progress Reports.
-- =============================================================================

-- 1. SEED REVIEW GROUP FOR ROUND DA_CNTT_K62_HK1
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

-- 2. SEED REVIEW GROUP MEMBERS
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

-- 3. SEED APPROVED PROPOSAL
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

-- 4. SEED PROPOSAL REVIEW ASSIGNMENT
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

-- 5. SEED OFFICIAL THESIS
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

-- 6. SEED DOCUMENTS
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
WHERE t.thesis_code = 'DT_2026_CNTT_001';

-- 7. SEED TASKS
-- Task 1: Thiết kế CSDL (Đã hoàn thành)
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
WHERE t.thesis_code = 'DT_2026_CNTT_001';

-- Task 2: Xây dựng Backend API Module Đề tài & Quá trình (Đang làm)
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
WHERE t.thesis_code = 'DT_2026_CNTT_001';

-- Task 3: Xây dựng Frontend Kanban Board (Chưa bắt đầu)
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
WHERE t.thesis_code = 'DT_2026_CNTT_001';

-- 8. SEED SUBMISSION FOR TASK 1
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
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%lược đồ CSDL%';

-- 9. SEED COMMENTS UNDER TASK 2
INSERT INTO comments (task_id, user_id, content, created_at)
SELECT 
    tsk.id, u_gv.id,
    'Em lưu ý phân quyền kỹ giữa Giảng viên hướng dẫn và Sinh viên nhé, chỉ GVHD mới có quyền duyệt hoàn thành task.',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM tasks tsk
JOIN theses t ON tsk.thesis_id = t.id
CROSS JOIN (SELECT id FROM users WHERE username = 'giangvien') u_gv
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%Phát triển tầng Service%';

INSERT INTO comments (task_id, user_id, content, created_at)
SELECT 
    tsk.id, u_sv.id,
    'Dạ vâng thầy, em đã thêm kiểm tra Security và trả về 403 Forbidden nếu không đúng quyền ạ.',
    CURRENT_TIMESTAMP - INTERVAL '1 days'
FROM tasks tsk
JOIN theses t ON tsk.thesis_id = t.id
CROSS JOIN (SELECT id FROM users WHERE username = 'sinhvien') u_sv
WHERE t.thesis_code = 'DT_2026_CNTT_001' AND tsk.title LIKE '%Phát triển tầng Service%';

-- 10. SEED PROGRESS REPORT & FEEDBACK
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
WHERE t.thesis_code = 'DT_2026_CNTT_001';

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
