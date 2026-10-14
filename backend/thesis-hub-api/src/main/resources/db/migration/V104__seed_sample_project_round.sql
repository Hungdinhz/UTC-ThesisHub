-- =============================================================================
-- Migration: V104__seed_sample_project_round.sql
-- Module: Module 1 (Project Round & Timeline Seed) - Owner: Phung Dinh Hung
-- Description: Seeds a realistic active graduation project round with complete milestones (Contract 2).
-- =============================================================================

-- 1. SEED ACTIVE GRADUATION PROJECT ROUND
INSERT INTO project_rounds (
    round_code,
    name,
    academic_year,
    semester,
    training_program_id,
    status,
    start_date,
    end_date,
    description,
    created_by
)
SELECT
    'DA_CNTT_K62_HK1',
    'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
    '2026-2027',
    'HK1',
    tp.id,
    'OPEN',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '90 days',
    'Đợt đồ án tốt nghiệp chính thức dành cho sinh viên Khóa 62 Khoa Công nghệ thông tin - Trường Đại học Giao thông Vận tải.',
    u.id
FROM training_programs tp
CROSS JOIN users u
WHERE tp.code = 'CU_NHAN' AND u.username = 'admin'
ON CONFLICT (round_code) DO NOTHING;

-- 2. SEED TIMELINE MILESTONES FOR ROUND DA_CNTT_K62_HK1
-- Milestone 1: Đăng ký nguyện vọng & Hướng đề tài (Đang diễn ra)
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Đăng ký nguyện vọng & Hướng đề tài',
    'REGISTRATION',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'Sinh viên đăng ký nguyện vọng người hướng dẫn và các hướng đề tài tốt nghiệp mong muốn.',
    1
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'REGISTRATION'
);

-- Milestone 2: Nộp đề cương đồ án
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Nộp đề cương đồ án tốt nghiệp',
    'PROPOSAL_SUBMISSION',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    CURRENT_TIMESTAMP + INTERVAL '18 days',
    'Sinh viên hoàn thiện đề cương chi tiết dưới sự hướng dẫn của GVHD và tải lên hệ thống.',
    2
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'PROPOSAL_SUBMISSION'
);

-- Milestone 3: Báo cáo tiến độ tuần
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Thực hiện đồ án & Báo cáo tiến độ tuần',
    'WEEKLY_REPORT',
    CURRENT_TIMESTAMP + INTERVAL '19 days',
    CURRENT_TIMESTAMP + INTERVAL '60 days',
    'Giai đoạn sinh viên làm việc định kỳ với GVHD và nộp các báo cáo tiến độ tuần.',
    3
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'WEEKLY_REPORT'
);

-- Milestone 4: Xét điều kiện bảo vệ
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Xét điều kiện bảo vệ đồ án tốt nghiệp',
    'ELIGIBILITY_REVIEW',
    CURRENT_TIMESTAMP + INTERVAL '61 days',
    CURRENT_TIMESTAMP + INTERVAL '70 days',
    'Kiểm tra tín chỉ tích lũy, GPA, học phí và điểm phản biện của GVHD.',
    4
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'ELIGIBILITY_REVIEW'
);

-- Milestone 5: Thành lập Hội đồng chấm
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Thành lập và phân công Hội đồng chấm bảo vệ',
    'COMMITTEE_ASSIGNMENT',
    CURRENT_TIMESTAMP + INTERVAL '71 days',
    CURRENT_TIMESTAMP + INTERVAL '75 days',
    'Khoa CNTT ra quyết định thành lập các hội đồng chấm đồ án và xếp lịch.',
    5
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'COMMITTEE_ASSIGNMENT'
);

-- Milestone 6: Bảo vệ đồ án tốt nghiệp
INSERT INTO timeline_milestones (project_round_id, name, phase_type, start_date, end_date, description, order_index)
SELECT
    r.id,
    'Bảo vệ đồ án tốt nghiệp trước Hội đồng',
    'DEFENSE',
    CURRENT_TIMESTAMP + INTERVAL '76 days',
    CURRENT_TIMESTAMP + INTERVAL '85 days',
    'Sinh viên thuyết trình và bảo vệ đồ án trước Hội đồng chấm thi UTC.',
    6
FROM project_rounds r WHERE r.round_code = 'DA_CNTT_K62_HK1'
AND NOT EXISTS (
    SELECT 1 FROM timeline_milestones m WHERE m.project_round_id = r.id AND m.phase_type = 'DEFENSE'
);
