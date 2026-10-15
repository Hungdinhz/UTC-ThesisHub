-- =============================================================================
-- Migration: V304__create_proposals.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: proposals (DECUONG - Proposal)
-- Description: Thesis proposals submitted for review and approval.
-- =============================================================================

CREATE TABLE IF NOT EXISTS proposals (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    title               VARCHAR(500) NOT NULL,
    content             TEXT,
    file_url            VARCHAR(500),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    version             INT NOT NULL DEFAULT 1,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status constraint
    CONSTRAINT chk_proposals_status
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_proposals_thesis_id
    ON proposals(thesis_id);

CREATE INDEX IF NOT EXISTS idx_proposals_status
    ON proposals(status);
