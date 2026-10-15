-- =============================================================================
-- Migration: V402__create_reviewer_assignments.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: reviewer_assignments (PHANCONGPHANBIEN - ReviewerAssignment)
-- Description: Assigns reviewer lecturers to evaluate theses.
-- Business rule: GVPB ≠ GVHD (verified in application service layer).
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviewer_assignments (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    reviewer_id         BIGINT NOT NULL,
    assigned_by         BIGINT,
    assigned_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    review_file_url     VARCHAR(500),
    review_notes        TEXT,
    note                TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 1 thesis has 1 active reviewer assignment
    CONSTRAINT uk_reviewer_assignments_thesis 
        UNIQUE (thesis_id),

    -- Status constraint
    CONSTRAINT chk_reviewer_assignments_status 
        CHECK (status IN ('ASSIGNED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'COMPLETED'))
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_thesis_id 
    ON reviewer_assignments(thesis_id);

CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer_id 
    ON reviewer_assignments(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_status 
    ON reviewer_assignments(status);

CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_assigned_at 
    ON reviewer_assignments(assigned_at);
