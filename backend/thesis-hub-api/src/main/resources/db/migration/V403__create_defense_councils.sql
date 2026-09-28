-- =============================================================================
-- Migration: V403__create_defense_councils.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: defense_councils (HOIDONG - DefenseCouncil)
-- Description: Defense councils created to evaluate graduation theses/projects.
-- =============================================================================

CREATE TABLE IF NOT EXISTS defense_councils (
    id                  BIGSERIAL PRIMARY KEY,
    project_round_id    BIGINT NOT NULL,
    name                VARCHAR(150) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    description         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique council code per project round
    CONSTRAINT uk_defense_councils_round_code 
        UNIQUE (project_round_id, code),

    -- Status constraint
    CONSTRAINT chk_defense_councils_status 
        CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_defense_councils_project_round_id 
    ON defense_councils(project_round_id);

CREATE INDEX IF NOT EXISTS idx_defense_councils_code 
    ON defense_councils(code);

CREATE INDEX IF NOT EXISTS idx_defense_councils_status 
    ON defense_councils(status);
