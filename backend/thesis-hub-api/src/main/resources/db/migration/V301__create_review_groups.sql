-- =============================================================================
-- Migration: V301__create_review_groups.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: review_groups (NHOMXETDUYET - ReviewGroup)
-- Description: Groups of lecturers formed to review thesis proposals.
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_groups (
    id                  BIGSERIAL PRIMARY KEY,
    project_round_id    BIGINT NOT NULL,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Status constraint
    CONSTRAINT chk_review_groups_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED'))
);
-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_review_groups_project_round_id
    ON review_groups(project_round_id);
CREATE INDEX IF NOT EXISTS idx_review_groups_status
    ON review_groups(status);