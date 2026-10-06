-- =============================================================================
-- Migration: V308__create_submissions.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: submissions (NOPBAI - Submission)
-- Description: Task submissions by students.
-- =============================================================================

CREATE TABLE IF NOT EXISTS submissions (
    id                  BIGSERIAL PRIMARY KEY,
    task_id             BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    content             TEXT,
    file_url            VARCHAR(500),
    submitted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    feedback            TEXT,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status constraint
    CONSTRAINT chk_submissions_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_submissions_task_id
    ON submissions(task_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student_id
    ON submissions(student_id);
