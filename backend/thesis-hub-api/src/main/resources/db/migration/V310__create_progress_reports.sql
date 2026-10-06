-- =============================================================================
-- Migration: V310__create_progress_reports.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: progress_reports (BAOCAOTIENDO - ProgressReport)
-- Description: Periodic progress reports submitted by students.
-- =============================================================================

CREATE TABLE IF NOT EXISTS progress_reports (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    content             TEXT,
    file_url            VARCHAR(500),
    report_date         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status constraint
    CONSTRAINT chk_progress_reports_status
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_progress_reports_thesis_id
    ON progress_reports(thesis_id);

CREATE INDEX IF NOT EXISTS idx_progress_reports_student_id
    ON progress_reports(student_id);
