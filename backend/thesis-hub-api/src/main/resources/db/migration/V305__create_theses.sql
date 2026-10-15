-- =============================================================================
-- Migration: V305__create_theses.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: theses (DETAI - Thesis)
-- Description: Main entity for thesis/projects, linking students and lecturers.
-- =============================================================================

CREATE TABLE IF NOT EXISTS theses (
    id                  BIGSERIAL PRIMARY KEY,
    project_round_id    BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    lecturer_id         BIGINT NOT NULL,
    title               VARCHAR(500) NOT NULL,
    english_title       VARCHAR(500),
    description         TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique student per project round (assuming a student has 1 thesis per round)
    CONSTRAINT uk_theses_round_student
        UNIQUE (project_round_id, student_id),

    -- Status constraint
    CONSTRAINT chk_theses_status
        CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_theses_project_round_id
    ON theses(project_round_id);

CREATE INDEX IF NOT EXISTS idx_theses_student_id
    ON theses(student_id);

CREATE INDEX IF NOT EXISTS idx_theses_lecturer_id
    ON theses(lecturer_id);

CREATE INDEX IF NOT EXISTS idx_theses_status
    ON theses(status);
