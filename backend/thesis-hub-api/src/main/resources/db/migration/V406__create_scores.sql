-- =============================================================================
-- Migration: V406__create_scores.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: scores (DIEMSO - Score)
-- Description: Detailed scores given by supervisor, reviewer, or council members for each thesis.
-- =============================================================================

CREATE TABLE IF NOT EXISTS scores (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    grader_id           BIGINT NOT NULL,
    score_type          VARCHAR(30) NOT NULL,
    score               NUMERIC(4, 2) NOT NULL,
    feedback            TEXT,
    graded_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Score type constraint: SUPERVISOR (GVHD), REVIEWER (GVPB), COUNCIL (Hoi dong)
    CONSTRAINT chk_scores_score_type 
        CHECK (score_type IN ('SUPERVISOR', 'REVIEWER', 'COUNCIL')),

    -- Score range constraint: standard 0.00 to 10.00
    CONSTRAINT chk_scores_range 
        CHECK (score >= 0.00 AND score <= 10.00),

    -- Each grader can submit only 1 score of a given type for a thesis
    CONSTRAINT uk_scores_thesis_grader_type 
        UNIQUE (thesis_id, grader_id, score_type)
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_scores_thesis_id 
    ON scores(thesis_id);

CREATE INDEX IF NOT EXISTS idx_scores_grader_id 
    ON scores(grader_id);

CREATE INDEX IF NOT EXISTS idx_scores_score_type 
    ON scores(score_type);
