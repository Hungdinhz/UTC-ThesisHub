-- =============================================================================
-- Migration: V303__create_task_and_progress_tables.sql
-- Module: Module 3 (Thesis & Project Execution) - Owner: Ngo Minh Quyet
-- Tables: tasks, submissions, comments, progress_reports, progress_feedbacks
-- Description: Core tables for project execution tasks, submissions, discussions, and progress reports.
-- =============================================================================

-- 7. TASKS (CONGVIEC - Công việc / Nhiệm vụ thực hiện đồ án)
CREATE TABLE IF NOT EXISTS tasks (
    id           BIGSERIAL PRIMARY KEY,
    thesis_id    BIGINT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    created_by   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    priority     VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status       VARCHAR(30) NOT NULL DEFAULT 'TODO',
    due_date     TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'REVISE', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_thesis_id ON tasks(thesis_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 8. SUBMISSIONS (NOPBAI - Bài nộp kết quả thực hiện nhiệm vụ của sinh viên)
CREATE TABLE IF NOT EXISTS submissions (
    id                 BIGSERIAL PRIMARY KEY,
    task_id            BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    student_id         BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title              VARCHAR(255),
    submission_content TEXT,
    file_url           VARCHAR(500),
    status             VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    review_feedback    TEXT,
    reviewed_at        TIMESTAMP WITH TIME ZONE,
    submitted_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_submissions_status CHECK (
        status IN ('SUBMITTED', 'ACCEPTED', 'REVISE_REQUIRED', 'REJECTED')
    )
);

CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 9. COMMENTS (BINHLUAN - Trao đổi, thảo luận chi tiết dưới từng công việc)
CREATE TABLE IF NOT EXISTS comments (
    id             BIGSERIAL PRIMARY KEY,
    task_id        BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id      BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content        TEXT NOT NULL,
    attachment_url VARCHAR(500),
    is_edited      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 10. PROGRESS_REPORTS (BAOCAOTIENDO - Báo cáo tiến độ định kỳ của sinh viên)
CREATE TABLE IF NOT EXISTS progress_reports (
    id               BIGSERIAL PRIMARY KEY,
    thesis_id        BIGINT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    student_id       BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    milestone_id     BIGINT REFERENCES timeline_milestones(id) ON DELETE SET NULL,
    report_title     VARCHAR(255) NOT NULL,
    completed_work   TEXT NOT NULL,
    planned_work     TEXT NOT NULL,
    difficulties     TEXT,
    progress_percent INT NOT NULL DEFAULT 0,
    file_url         VARCHAR(500),
    status           VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_progress_reports_percent CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_progress_reports_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED'))
);

CREATE INDEX IF NOT EXISTS idx_progress_reports_thesis_id ON progress_reports(thesis_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_student_id ON progress_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_milestone_id ON progress_reports(milestone_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_status ON progress_reports(status);

-- 11. PROGRESS_FEEDBACKS (NHANXETTIENDO - Giảng viên hướng dẫn nhận xét báo cáo tiến độ)
CREATE TABLE IF NOT EXISTS progress_feedbacks (
    id                        BIGSERIAL PRIMARY KEY,
    progress_report_id        BIGINT NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
    lecturer_id               BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    feedback_content          TEXT NOT NULL,
    assessment                VARCHAR(30) NOT NULL DEFAULT 'DAT',
    confirmed_completion_rate NUMERIC(5, 2),
    feedback_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_progress_feedbacks_report UNIQUE (progress_report_id),
    CONSTRAINT chk_progress_feedbacks_assessment CHECK (
        assessment IN ('DAT', 'KHONG_DAT', 'XUAT_SAC', 'CAN_CO_GANG')
    )
);

CREATE INDEX IF NOT EXISTS idx_progress_feedbacks_report_id ON progress_feedbacks(progress_report_id);
CREATE INDEX IF NOT EXISTS idx_progress_feedbacks_lecturer_id ON progress_feedbacks(lecturer_id);
