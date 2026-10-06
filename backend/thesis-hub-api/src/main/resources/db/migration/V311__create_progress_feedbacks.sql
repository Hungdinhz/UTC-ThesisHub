-- =============================================================================
-- Migration: V311__create_progress_feedbacks.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: progress_feedbacks (NHANXETTIENDO - ProgressFeedback)
-- Description: Feedbacks on progress reports from lecturers.
-- =============================================================================

CREATE TABLE IF NOT EXISTS progress_feedbacks (
    id                  BIGSERIAL PRIMARY KEY,
    report_id           BIGINT NOT NULL,
    lecturer_id         BIGINT NOT NULL,
    feedback            TEXT NOT NULL,
    is_satisfactory     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_progress_feedbacks_report_id
    ON progress_feedbacks(report_id);

CREATE INDEX IF NOT EXISTS idx_progress_feedbacks_lecturer_id
    ON progress_feedbacks(lecturer_id);
