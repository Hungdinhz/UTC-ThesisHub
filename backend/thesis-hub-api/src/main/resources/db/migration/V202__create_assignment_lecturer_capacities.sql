-- =============================================================================
-- Migration: V202__create_assignment_lecturer_capacities.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Table: lecturer_capacities (CHITIEUGIANGVIEN)
-- Description: Lecturer supervision quotas and capacity factor per project round.
-- =============================================================================

CREATE TABLE IF NOT EXISTS lecturer_capacities (
    id               BIGSERIAL PRIMARY KEY,
    lecturer_id      BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    max_quota        INT NOT NULL DEFAULT 5,
    capacity_factor  DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    current_assigned INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    note             TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_lecturer_round_capacity UNIQUE (lecturer_id, project_round_id),
    CONSTRAINT chk_lecturer_capacity_quota CHECK (max_quota >= 0),
    CONSTRAINT chk_lecturer_capacity_assigned CHECK (current_assigned >= 0),
    CONSTRAINT chk_lecturer_capacity_factor CHECK (capacity_factor >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_lecturer_capacities_lecturer_id ON lecturer_capacities(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_capacities_round_id ON lecturer_capacities(project_round_id);
