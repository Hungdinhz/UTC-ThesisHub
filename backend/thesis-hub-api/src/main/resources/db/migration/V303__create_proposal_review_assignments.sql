-- =============================================================================
-- Migration: V303__create_proposal_review_assignments.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: proposal_review_assignments (PHANCONGXETDUYET - ProposalReviewAssignment)
-- Description: Assignments linking proposals to review groups for evaluation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposal_review_assignments (
    id                  BIGSERIAL PRIMARY KEY,
    group_id            BIGINT NOT NULL,
    proposal_id         BIGINT NOT NULL,
    assigned_by         BIGINT,
    assigned_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    result              VARCHAR(30),
    feedback            TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Status constraint
    CONSTRAINT chk_proposal_review_assignments_status
        CHECK (status IN ('PENDING', 'REVIEWING', 'REVIEWED')),
    -- Result constraint
    CONSTRAINT chk_proposal_review_assignments_result
        CHECK (result IS NULL OR result IN ('APPROVED', 'REVISION_REQUIRED', 'REJECTED'))
);
-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_proposal_review_assignments_group_id
    ON proposal_review_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_proposal_review_assignments_proposal_id
    ON proposal_review_assignments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_review_assignments_status
    ON proposal_review_assignments(status);