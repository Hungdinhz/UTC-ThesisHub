-- =============================================================================
-- Migration: V407__create_graduation_results.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: graduation_results (KETQUATOTNGHIEP - GraduationResult)
-- Description: Final synthesized graduation project results, grades, and completion status.
-- =============================================================================

CREATE TABLE IF NOT EXISTS graduation_results (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL UNIQUE,
    supervisor_score    NUMERIC(4, 2),
    reviewer_score      NUMERIC(4, 2),
    council_score       NUMERIC(4, 2),
    final_score         NUMERIC(4, 2),
    grade               VARCHAR(30),
    final_result        VARCHAR(20),
    published_at        TIMESTAMP WITH TIME ZONE,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Result constraint: PASSED (Dat) / FAILED (Khong dat)
    CONSTRAINT chk_graduation_results_result 
        CHECK (final_result IS NULL OR final_result IN ('PASSED', 'FAILED')),

    -- Score validation constraints (0.00 to 10.00)
    CONSTRAINT chk_graduation_results_supervisor_score 
        CHECK (supervisor_score IS NULL OR (supervisor_score >= 0.00 AND supervisor_score <= 10.00)),
    CONSTRAINT chk_graduation_results_reviewer_score 
        CHECK (reviewer_score IS NULL OR (reviewer_score >= 0.00 AND reviewer_score <= 10.00)),
    CONSTRAINT chk_graduation_results_council_score 
        CHECK (council_score IS NULL OR (council_score >= 0.00 AND council_score <= 10.00)),
    CONSTRAINT chk_graduation_results_final_score 
        CHECK (final_score IS NULL OR (final_score >= 0.00 AND final_score <= 10.00))
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_graduation_results_thesis_id 
    ON graduation_results(thesis_id);

CREATE INDEX IF NOT EXISTS idx_graduation_results_final_result 
    ON graduation_results(final_result);

CREATE INDEX IF NOT EXISTS idx_graduation_results_grade 
    ON graduation_results(grade);

CREATE INDEX IF NOT EXISTS idx_graduation_results_published_at 
    ON graduation_results(published_at);
